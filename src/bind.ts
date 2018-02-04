// import { token } from './token'
import { SrcFileSet, Pos } from './pos'
import { ErrorCode, ErrorHandler, ErrorReporter } from './error'
import * as utf8 from './utf8'
import { TypeResolver } from './resolve'
// import { debuglog } from './util'
import {
  File,
  Package,
  Ent,

  FunSig,
  ImportDecl,
  Expr,
  UnresolvedType,
  FunType,
} from './ast'


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
export type Importer =
  (imports :Map<string,Ent>, path :string) => Promise<Ent>


// pkgBinder resolves a ast.Package and its ast.File s
//
class pkgBinder extends ErrorReporter {
  errorCount = 0
  // package-global mapping of imported package ids to package entities
  imports = new Map<string,Ent>()

  constructor(
    public pkg      :Package,
    public fset     :SrcFileSet,
    public importer :Importer|null,
    public types    :TypeResolver,
    errh            :ErrorHandler|null,
  ) {
    super('E_RESOLVE', errh)
  }

  bind() :Promise<void> {
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
      b.pkg.files.map(f => this._resolveImports(f))
    ).then(() => {
      if (b.errorCount > 0) {
        return  // stop when imports failed
      }

      // step 2: resolve identifiers
      for (let f of b.pkg.files) {
        b._resolveIdents(f)
      }

      // step 3: resolve types
      b._resolveTypes()
    })
  }

  _resolveImports(f :File) :Promise<void> {
    // step 1: complete file scopes with imports
    const b = this

    if (!f.imports || f.imports.length == 0) {
      return Promise.resolve()
    }

    const pv :Promise<void>[] = []

    for (let decl of f.imports) {
      if (!b.importer) {
        b.error(`unresolvable import ${decl.path}`, decl.path.pos)
        break
      }
      const path = utf8.decodeToString(decl.path.value)
      pv.push(b.importer(b.imports, path)
        .then((pkg :Ent) => { b.integrateImport(f, decl, pkg) })
        .catch(err => {
          b.error(
            `could not import ${path} (${err.message || err})`,
            decl.path.pos
          )
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
      f.scope.declareEnt(new Ent(name, imp, null, pkg.data))
    }
  }

  _resolveIdents(f :File) {
    // step 2: resolve identifiers
    const b = this

    if (f.unresolved) for (let id of f.unresolved) {
      // see if the name was declared after it was referenced in the file, or
      // declared in another file in the same package
      let ent = f.scope.lookup(id.value)

      if (!ent) { // truly undefined
        b.error(`${id} undefined`, id.pos)
        continue
      }

      // debuglog(
      //   `${id} (${ent.value && ent.value.constructor.name})`+
      //   ` at ${b.fset.position(id.pos)}`
      // )

      id.refEnt(ent) // reference ent

      let t = id.type
      if (t instanceof UnresolvedType) {
        assert(ent.value != null)
        id.type = b.types.resolve(ent.value as Expr)
        assert(!(id.type instanceof UnresolvedType), 'still unresolved')
        
        // delegate type to any expressions that reference this type
        if (t.refs) for (let ref of t.refs) {
          if (ref instanceof FunSig || ref instanceof FunType) {
            ref.result = id.type
          } else {
            ref.type = id.type
          }
        }
      }
    }
  }

  _resolveTypes() {
    // step 3: resolve types
    const b = this

    for (let ut of b.types.unresolved) {
      // console.log('types.unresolved.size = ', b.types.unresolved.size)
      const t = ut.expr.type

      if (!(t instanceof UnresolvedType)) {
        // was probably resolved during step 2
        continue
      }
  
      // attempt to resolve the type now that we can see the entire package
      ut.expr.type = null // clear so resolve can progress
      const restyp = b.types.maybeResolve(ut.expr)

      if (!restyp) {
        ut.expr.type = t // restore original which might have refs
        b.error(`cannot resolve type of ${ut.expr}`, ut.expr.pos)
        continue
      }

      // succeeded in resolving the type.
      // delegate type to any expressions that reference this type.
      if (t.refs) for (let ref of t.refs) {
        if (ref instanceof FunSig || ref instanceof FunType) {
          ref.result = restyp
        } else {
          ref.type = restyp
        }
      }
    }
  }

  error(msg :string, pos :Pos, c? :ErrorCode) {
    const b = this
    b.errorAt(msg, b.fset.position(pos), c)
  }
}


// bindpkg resolves any undefined names (usually across source files) and,
// unless there are errors, all identifiers in the package will have Ident.ent
// set, pointing to whatever entity a name references.
//
// Returns false if there were errors
//
export function bindpkg(
  pkg      :Package,
  fset     :SrcFileSet,
  importer :Importer|null,
  typeres  :TypeResolver,
  errh     :ErrorHandler,
) :Promise<bool> {
  const b = new pkgBinder(pkg, fset, importer, typeres, errh)
  return b.bind().then(() => b.errorCount != 0)
}
