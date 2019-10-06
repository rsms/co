// import { token } from './token'
import { SrcFileSet, Pos } from './pos'
import { ErrorCode, ErrorHandler, ErrorReporter } from './error'
import * as utf8 from './utf8'
import { TypeResolver } from './resolve'
import { debuglog as dlog } from './util'
import { ByteStr } from "./bytestr"
import * as template from "./template"
import {
  Node,
  Scope,
  Type,
  FunType,
  StructType,
  UnresolvedType,
  File,
  Package,
  Ent,
  Ident,
  FunSig,
  ImportDecl,
  Expr,
  StringLit,
  TemplateInvocation,
} from "./ast"


// An Importer resolves import paths to package entities.
// The imports map records the packages already imported,
// indexed by package id (canonical import path).
// An Importer must determine the canonical import path and
// check the map to see if it is already present in the imports map.
// If so, the Importer can return the map entry. Otherwise, the
// Importer should load the package data for the given path into
// a new Ent (pkg), record pkg in the imports map, and then
// return pkg.
//
export type Importer = (imports :Map<string,Ent>, path :StringLit) => Promise<Ent>


// pkgBinder resolves a ast.Package and its ast.File s
//
export class PkgBinder extends ErrorReporter {
  errorCount = 0

  // package-global mapping of imported package ids to package entities
  imports = new Map<string,Ent>()
  undef :Set<Ident>|null = null // track undefined so we don't report twice

  // pkg      :Package
  // importer :Importer|null
  fset     :SrcFileSet
  types    :TypeResolver

  constructor(
    // pkg      :Package,
    // importer :Importer|null,
    fset     :SrcFileSet,
    types    :TypeResolver,
    errh     :ErrorHandler|null,
  ) {
    super('E_RESOLVE', errh)
    // this.pkg = pkg
    // this.importer = importer
    this.fset = fset
    this.types = types
  }

  importAndBind(importer :Importer, files :File[]) :Promise<int> {  // returns errorCount
    const b = this
    //
    // binding happens in three steps:
    //
    // 1. imports are resolved
    // 2. identifiers are resolved in all files (and across the package)
    // 3. types are resolved across the package
    //
    // step 1: complete file scopes with imports
    return Promise.all(
      files.map(f => this._resolveImports(f, importer))
    ).then(() => {
      return b.bind(files)
    })
  }

  bind(files :File[]) :int {  // returns errorCount
    const b = this
    if (b.errorCount == 0) {
      // step 2: resolve identifiers
      for (let f of files) {
        b._resolveIdents(f)
      }
      // step 3: resolve types
      b._resolveTypes()
    }
    return b.errorCount
  }

  _resolveImports(f :File, importer :Importer) :Promise<void> {
    // step 1: complete file scopes with imports
    const b = this

    if (!f.imports || f.imports.length == 0) {
      return Promise.resolve()
    }

    const pv :Promise<void>[] = []

    for (let decl of f.imports) {
      // if (!b.importer) {
      //   b.error(`unresolvable import ${decl.path}`, decl.path.pos)
      //   break
      // }
      pv.push(importer(b.imports, decl.path)
        .then((pkg :Ent) => { b.integrateImport(f, decl, pkg) })
        .catch(err => {
          b.error(`could not import ${decl.path} (${err.message || err})`, decl.path.pos)
        })
      )
    }
    return Promise.all(pv).then(() => {})
  }

  integrateImport(f :File, imp :ImportDecl, pkg :Ent) {
    // local name overrides imported package name
    let name = imp.localIdent ? imp.localIdent.value : pkg.name

    if (name.toString() == ".") { // TODO: fix efficiency
      // TODO: merge imported scope with file scope
      // for _, obj := range pkg.Data.(*Scope).Objects {
      //   p.declare(fileScope, pkgScope, obj)
      // }
    } else if (name.toString() != "_") { // TODO: fix efficiency
      // declare imported package entities in file scope
      // (do not re-use pkg in the file scope but create
      // a new ent instead; the Decl field is different
      // for different files)
      f._scope.declareEnt(new Ent(name, imp, null))
    }
  }


  expandTemplate<T extends Node>(ntype :Constructor<T>, ti :TemplateInvocation<T>) :T|null {
    const b = this
    let n = template.expand(ntype, ti, null, (message :string, pos :Pos) => {
      b.error(message, pos)
    })
    if (n instanceof ntype) {
      return n as T
    }
    b.error(`partially expanded template`, ti.pos)
    return null
  }


  _resolveIdents(f :File) {
    // step 2: resolve identifiers
    const b = this

    if (f.unresolved) for (let id of f.unresolved) {
      // see if the name was declared after it was referenced in the file, or
      // declared in another file in the same package
      // let scope = f._scope
      let scope = id._scope
      let ent = scope.lookup(id.value)

      if (!ent) { // truly undefined
        b.error(`${id} undefined`, id.pos)
        if (!b.undef) {
          b.undef = new Set<Ident>()
        }
        b.undef.add(id)
        continue
      }

      dlog(`${id} (${ent.value.constructor.name}) at ${b.fset.position(id.pos)}`)

      id.refEnt(ent) // reference ent

      assert(id.type)
      let t = id.type!
      if (!t.isUnresolvedType()) {
        // was resolved
        continue
      }

      assert(ent.value, `UnresolvedType with ent.value=null`)
      if (ent.value.isType()) {
        id.type = ent.value
      } else if (ent.value.isExpr()) {
        id.type = b.types.resolve(ent.value as Expr)
        assert(!(id.type instanceof UnresolvedType), 'still unresolved')
      } else {
        let t = (ent.value as any).type as Type|null
        assert(t && t.isType(), `${ent.value} does not have type (.type=${t})`)
        id.type = (ent.value as any).type as Type
      }

      // delegate type to any expressions that reference this type
      dlog(`resolved to ${id.type}; len(t.refs)=${t.refs ? t.refs.size : 0}`)
      if (t.refs) for (let ref of t.refs) {
        dlog(`- ref ${ref} ${b.fset.position(ref.pos)}`)
        if (ref.isFunSig() || ref.isFunType()) {
          ref.result = id.type
        } else if (ref.isTemplateInvocation()) {
          if (id.type.isTemplate()) {
            ref.template = id.type
            let n = b.expandTemplate(Type, ref as TemplateInvocation<Type>)
            if (n) {
              ref.convertToNodeInPlace(n)
            }
          } else {
            b.error(`not a template`, ref.name ? ref.name.pos : ref.pos)
          }
        } else {
          assert((ref as any).type !== undefined)
          ;(ref as any).type = id.type
        }
      }

      this.checkCyclicTypeRef(scope, id)
    }
  }


  _resolveTypes() {
    // step 3: resolve types
    const b = this

    for (let ut of b.types.unresolved) {
      // console.log('types.unresolved.size = ', b.types.unresolved.size)
      const n = ut.def
      const t = n.type

      if (!(t instanceof UnresolvedType)) {
        // was probably resolved during step 2
        continue
      }

      if (b.undef && n instanceof Ident && b.undef.has(n)) {
        continue
      }

      // attempt to resolve the type now that we can see the entire package
      n.type = null // clear so resolve can progress
      const restyp = b.types.maybeResolve(n)

      if (!restyp) {
        n.type = t // restore original which might have refs
        // Note: This normally happens when the expression contains something
        // that itself failed to resolve, like an undefined variable.
        dlog(`cannot resolve type of ${n} ${b.fset.position(n.pos)}`)
        continue
      }

      // succeeded in resolving the type.
      // delegate type to any expressions that reference this type.
      if (t.refs) for (let ref of t.refs) {
        if (ref.isFunSig() || ref.isFunType()) {
          ref.result = restyp
        } else if (ref.isTemplateInvocation()) {
          dlog(`TODO TemplateInvocation`)
        } else {
          assert(ref instanceof Expr)
          ;(ref as Expr).type = restyp
        }
      }
    }
  }

  checkCyclicTypeRef(scope :Scope, id :Ident) {
    // check for cyclic type definitions
    const b = this
    if (id.type instanceof StructType) {
      // check for deep cycles in structs
      // TODO: find a better, more efficient way of doing this.
      let seen = new Set<Type>([ id.type ])
      const visit = (n :StructType) => {
        for (let f of n.decls) {
          // TODO: handle other declarations like TypeDecl
          // TODO: handle other types like union
          if (f.isVarDecl()) {
            for (let id of f.idents) {
              if (id.type && id.type.isStructType()) {
                if (seen.has(id.type)) {
                  throw 1
                }
                seen.add(id.type)
                visit(id.type)
              }
            }
          }
        }
      }
      try {
        visit(id.type)
      } catch (_) {
        // sort chain on source position. We usually trigger resolution on a later
        // definition, for instance with
        //    type A { x B }; type B { x A }
        // we will trigger resolution of B when B is defined and thus the head/end
        // of the cycle is B, not A. Sorting makes the error message more intuitive.
        let types = Array.from(seen).sort((a, b) =>
          a.pos < b.pos ? -1 :
          b.pos < a.pos ? 1 :
          0
        )
        b.error(`cyclic type reference ${types.join(" -> ")} -> ${types[0]}`, types[0].pos)
      }
    }
  }

  error(msg :string, pos :Pos, c? :ErrorCode) {
    const b = this
    b.errorAt(msg, b.fset.position(pos), c)
  }
}


// // bindpkg resolves any undefined names (usually across source files) and,
// // unless there are errors, all identifiers in the package will have Ident.ent
// // set, pointing to whatever entity a name references.
// //
// // Returns false if there were errors
// //
// export function bindpkg(
//   pkg      :Package,
//   fset     :SrcFileSet,
//   importer :Importer|null,
//   typeres  :TypeResolver,
//   errh     :ErrorHandler,
// ) :Promise<bool> {
//   const b = new PkgBinder(pkg, fset, importer, typeres, errh)
//   return b.bind().then(() => b.errorCount != 0)
// }
