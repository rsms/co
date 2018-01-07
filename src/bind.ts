// import { token } from './token'
import { SrcFileSet, Pos } from './pos'
import { ErrorCode, ErrorHandler, ErrorReporter } from './error'
import * as utf8 from './utf8'
import { debuglog } from './util'
import { File, Package, Ent, ImportDecl, UnresolvedType } from './ast'


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
    errh            :ErrorHandler|null,
  ) {
    super('E_RESOLVE', errh)
  }

  bind() :Promise<void> {
    const b = this

    // complete file scopes with imports and resolve identifiers
    return Promise.all(
      b.pkg.files.map(f => this.resolveImports(f))
    ).then(() => {
      // stop if any imports failed
      if (b.errorCount > 0) {
        return
      }

      // resolve identifiers in files
      for (let f of b.pkg.files) {
        b.resolve(f)
      }
    })
  }

  resolveImports(f :File) :Promise<void> {
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

  resolve(f :File) {
    const b = this

    if (f.unresolved) for (let id of f.unresolved) {
      // see if the name was declared after it was referenced in the file, or
      // declared in another file in the same package
      let ent = f.scope.lookup(id.value)

      if (!ent) { // truly undefined
        b.error(`${id} undefined`, id.pos)
        continue
      }

      debuglog(`${id}`, ent.value && ent.value.constructor.name)

      id.ent = ent
      ent.reads.add(id) // register "read reference"

      if (id.type instanceof UnresolvedType && ent.value) {
        id.type = ent.value.type
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
  pkg :Package,
  fset :SrcFileSet,
  importer :Importer|null,
  errh :ErrorHandler,
) :Promise<bool> {
  const b = new pkgBinder(pkg, fset, importer, errh)
  return b.bind().then(() => b.errorCount != 0)
}
