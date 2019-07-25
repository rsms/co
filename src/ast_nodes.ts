// generated from astgen/ast.ts by astgen/run.sh -- do not edit.
import { Pos, NoPos, SrcFile } from "./pos";
import { token } from "./token";
import { ByteStr } from "./bytestr";
import { Int64 } from "./int64";
import { Num } from "./num";
import { numconv } from "./numconv";
import { Scope, Ent, nilScope } from "./ast_scope";
import { Visitable, Visitor } from "./ast_visit";
import { ReprVisitor } from "./ast_repr";
import { StrWriter } from "./util";
// --------------------------------------------------------------------------------
export interface TypedNode {
    type: Type;
}
export class Node implements Visitable {
    constructor(public pos: Pos) { }
    toString(): string { return this.constructor.name; }
    // repr returns a human-readable and machine-parsable string representation
    // of the tree represented by this node.
    repr(sep?: string): string;
    repr(sep: string, w: StrWriter): void;
    repr(sep: string = "\n", w?: StrWriter): string | void {
        let v = new ReprVisitor(sep, w);
        v.visitNode(this);
        if (!w) {
            return v.toString();
        }
    }
    foofoo() {
        Storage[Storage.Int];
    }
    isUnresolved(): this is UnresolvedType | TypedNode {
        // isUnresolved returns true for any node that references something which is
        // not yet resolved. TODO: consider adding node UnresolvedIdent
        return (this.isUnresolvedType() ||
            (!this.isType() && (this as any).type instanceof UnresolvedType));
    }
    visit(v: Visitor) { }
    isPackage(): this is Package { return this instanceof Package; }
    isFile(): this is File { return this instanceof File; }
    isComment(): this is Comment { return this instanceof Comment; }
    isBad(): this is Bad { return this instanceof Bad; }
    isFunSig(): this is FunSig { return this instanceof FunSig; }
    isStmt(): this is Stmt { return this instanceof Stmt; }
    isExpr(): this is Expr { return this instanceof Expr; }
    isType(): this is Type { return this instanceof Type; }
    isVoidType(): this is VoidType { return this instanceof VoidType; }
    isUnresolvedType(): this is UnresolvedType { return this instanceof UnresolvedType; }
    isOptionalType(): this is OptionalType { return this instanceof OptionalType; }
    isPrimType(): this is PrimType { return this instanceof PrimType; }
    isNilType(): this is NilType { return this instanceof NilType; }
    isBoolType(): this is BoolType { return this instanceof BoolType; }
    isNumType(): this is NumType { return this instanceof NumType; }
    isFloatType(): this is FloatType { return this instanceof FloatType; }
    isIntType(): this is IntType { return this instanceof IntType; }
    isSIntType(): this is SIntType { return this instanceof SIntType; }
    isUIntType(): this is UIntType { return this instanceof UIntType; }
    isMemType(): this is MemType { return this instanceof MemType; }
    isStrType(): this is StrType { return this instanceof StrType; }
    isUnionType(): this is UnionType { return this instanceof UnionType; }
    isTypeVar(): this is TypeVar { return this instanceof TypeVar; }
    isTemplateType(): this is TemplateType { return this instanceof TemplateType; }
    isAliasType(): this is AliasType { return this instanceof AliasType; }
    isTupleType(): this is TupleType { return this instanceof TupleType; }
    isListType(): this is ListType { return this instanceof ListType; }
    isRestType(): this is RestType { return this instanceof RestType; }
    isStructType(): this is StructType { return this instanceof StructType; }
    isFunType(): this is FunType { return this instanceof FunType; }
    isReturnStmt(): this is ReturnStmt { return this instanceof ReturnStmt; }
    isForStmt(): this is ForStmt { return this instanceof ForStmt; }
    isWhileStmt(): this is WhileStmt { return this instanceof WhileStmt; }
    isBranchStmt(): this is BranchStmt { return this instanceof BranchStmt; }
    isDecl(): this is Decl { return this instanceof Decl; }
    isImportDecl(): this is ImportDecl { return this instanceof ImportDecl; }
    isMultiDecl(): this is MultiDecl { return this instanceof MultiDecl; }
    isVarDecl(): this is VarDecl { return this instanceof VarDecl; }
    isTypeDecl(): this is TypeDecl { return this instanceof TypeDecl; }
    isFieldDecl(): this is FieldDecl { return this instanceof FieldDecl; }
    isIdent(): this is Ident { return this instanceof Ident; }
    isBlock(): this is Block { return this instanceof Block; }
    isIfExpr(): this is IfExpr { return this instanceof IfExpr; }
    isCollectionExpr(): this is CollectionExpr { return this instanceof CollectionExpr; }
    isTupleExpr(): this is TupleExpr { return this instanceof TupleExpr; }
    isListExpr(): this is ListExpr { return this instanceof ListExpr; }
    isSelectorExpr(): this is SelectorExpr { return this instanceof SelectorExpr; }
    isIndexExpr(): this is IndexExpr { return this instanceof IndexExpr; }
    isSliceExpr(): this is SliceExpr { return this instanceof SliceExpr; }
    isLiteralExpr(): this is LiteralExpr { return this instanceof LiteralExpr; }
    isNumLit(): this is NumLit { return this instanceof NumLit; }
    isIntLit(): this is IntLit { return this instanceof IntLit; }
    isRuneLit(): this is RuneLit { return this instanceof RuneLit; }
    isFloatLit(): this is FloatLit { return this instanceof FloatLit; }
    isStringLit(): this is StringLit { return this instanceof StringLit; }
    isAssignment(): this is Assignment { return this instanceof Assignment; }
    isOperation(): this is Operation { return this instanceof Operation; }
    isCallExpr(): this is CallExpr { return this instanceof CallExpr; }
    isFunExpr(): this is FunExpr { return this instanceof FunExpr; }
    isTypeConvExpr(): this is TypeConvExpr { return this instanceof TypeConvExpr; }
    isAtom(): this is Atom { return this instanceof Atom; }
}
export class Package extends Node {
    constructor(public name: string, public _scope: Scope) { super(NoPos); }
    files: File[] = [];
    toString(): string { return `(Package ${JSON.stringify(this.name)})`; }
    visit(v: Visitor) {
        v.visitField("name", this.name);
        v.visitFieldNA("files", this.files);
    }
}
export class File extends Node {
    constructor(public sfile: SrcFile, public _scope: Scope, public imports: null | ImportDecl[] // imports in this file
    , public decls: (Decl | FunExpr)[] // top-level declarations
    , public unresolved: null | Set<Ident> // unresolved references
    ) { super(NoPos); }
    toString(): string { return `(File ${JSON.stringify(this.sfile.name)})`; }
    visit(v: Visitor) {
        v.visitField("sfile", this.sfile);
        if (this.imports)
            v.visitFieldNA("imports", this.imports);
        v.visitFieldNA("decls", this.decls);
        if (this.unresolved !== null)
            v.visitField("unresolved", this.unresolved);
    }
}
export class Comment extends Node {
    constructor(pos: Pos, public value: Uint8Array) { super(pos); }
    visit(v: Visitor) { v.visitField("value", this.value); }
}
export class Bad extends Node {
    constructor(pos: Pos, public message: string) { super(pos); }
    visit(v: Visitor) { v.visitField("message", this.message); }
}
export class FunSig extends Node {
    constructor(pos: Pos, public params: FieldDecl[], public result: null | Type // null = auto
    ) { super(pos); }
    visit(v: Visitor) {
        v.visitFieldNA("params", this.params);
        if (this.result)
            v.visitFieldN("result", this.result);
    }
}
export class Stmt extends Node {
    constructor(pos: Pos, public _scope: Scope) { super(pos); }
    visit(v: Visitor) { }
}
export class Expr extends Stmt {
    type: null | Type = null; // effective type of expression. null until resolved.
    visit(v: Visitor) { if (this.type)
        v.visitFieldN("type", this.type); }
}
// -----------------------------------------------------------------------------
// Types
export class Type extends Expr {
    constructor(pos: Pos) { super(pos, nilScope
    // Note: "type" property on a type has a different meaning than for other
    // node classes. "type" is used to describe a subtype in some classes,
    // like for instance OptionalType.
    // accepts returns true if the other type is compatible with this type.
    // essentially: "this >= other"
    // For instance, if the receiver is the same as `other`
    // or a superset of `other`, true is returned.
    ); }
    // Note: "type" property on a type has a different meaning than for other
    // node classes. "type" is used to describe a subtype in some classes,
    // like for instance OptionalType.
    // accepts returns true if the other type is compatible with this type.
    // essentially: "this >= other"
    // For instance, if the receiver is the same as `other`
    // or a superset of `other`, true is returned.
    accepts(other: Type): bool { return this.equals(other); }
    // equals returns true if the receiver is equivalent to `other`
    equals(other: Type): bool { return this === other; }
    // canonicalType returns the underlying canonical type for
    // classes that wraps a type, like AliasType.
    canonicalType(): Type { return this; }
    visit(v: Visitor) { if (this.type)
        v.visitFieldN("type", this.type); }
}
export class VoidType extends Type {
    visit(v: Visitor) { if (this.type)
        v.visitFieldN("type", this.type); }
}
export const t_void = new VoidType(NoPos);
export class UnresolvedType extends Type {
    constructor(pos: Pos, public def: Expr) { super(pos); }
    // UnresolvedType represents a type that is not yet known, but may be
    // known later (i.e. during bind/resolve.)
    //
    // Whenever something refers to this type, you must call addRef(x) where
    // x is the thing that uses/refers to this type. This makes it possible
    // for the TypeResolver to--when resolving this type--go in an edit all
    // the uses of this type, updating them with the concrete, resolved type.
    refs: null | Set<Node> = null; // things that references this type
    addRef(x: Node) {
        assert(x !== this.def, "addRef called with own definition");
        if (!this.refs) {
            this.refs = new Set<Node>([x]);
        }
        else {
            this.refs.add(x);
        }
    }
    repr(sep: string = "\n  ") {
        return "~" + this.def.repr(sep);
    }
    visit(v: Visitor) {
        if (this.type)
            v.visitFieldN("type", this.type);
        if (this.refs !== null)
            v.visitField("refs", this.refs);
        v.visitFieldN("def", this.def);
    }
}
export class OptionalType extends Type {
    constructor(pos: Pos, public type: Type) { super(pos); }
    equals(t: Type): bool {
        return this === t || (t.isOptionalType() && this.type.equals(t.type));
    }
    accepts(t: Type): bool {
        return (this.equals(t) || // e.g. "x T?; y T?; x = y"
            this.type.accepts(t) || // e.g. "x T?; y T; x = y"
            t === t_nil // e.g. "x T?; x = nil"
        );
    }
    visit(v: Visitor) { v.visitFieldN("type", this.type); }
}
// Storage denotes the storage type needed for a primitive type
export enum Storage {
    None = 0,
    Ptr,
    Int,
    Bool,
    i8,
    i16,
    i32,
    i64,
    f32,
    f64
}
const StorageSize = {
    [Storage.None]: 0,
    [Storage.Ptr]: 4,
    [Storage.Int]: 4,
    [Storage.Bool]: 4,
    [Storage.i8]: 1,
    [Storage.i16]: 2,
    [Storage.i32]: 4,
    [Storage.i64]: 8,
    [Storage.f32]: 4,
    [Storage.f64]: 8,
};
// class NativeType extends Type {
//   // NativeType represents all built-in types, like i32, str, bool, etc.
// }
export class PrimType extends Type {
    constructor(public name: string, public storage: Storage // type of underlying storage
    ) { super(NoPos); }
    _storageSize = StorageSize[this.storage]; // size in bytes
    // storageSize returns the underlying storage size in bytes
    storageSize(): int { return this._storageSize; }
    // convenience function used by arch rewrite rules
    isI8(): bool { return this.storage == Storage.i8; }
    isI16(): bool { return this.storage == Storage.i16; }
    isI32(): bool { return this.storage == Storage.i32; }
    isI64(): bool { return this.storage == Storage.i64; }
    isF32(): bool { return this.storage == Storage.f32; }
    isF64(): bool { return this.storage == Storage.f64; }
    isBool(): bool { return this.storage == Storage.Bool; }
    isPtr(): bool { return this.storage == Storage.Ptr; }
    isNil(): bool { return this.storage == Storage.None; }
    toString(): string { return this.name; }
    repr(sep: string = ""): string { return this.name; }
    visit(v: Visitor) {
        if (this.type)
            v.visitFieldN("type", this.type);
        v.visitField("name", this.name);
        v.visitFieldS("storage", Storage[this.storage]);
    }
}
export class NilType extends PrimType {
    visit(v: Visitor) {
        if (this.type)
            v.visitFieldN("type", this.type);
        v.visitField("name", this.name);
        v.visitFieldS("storage", Storage[this.storage]);
    }
}
export class BoolType extends PrimType {
    visit(v: Visitor) {
        if (this.type)
            v.visitFieldN("type", this.type);
        v.visitField("name", this.name);
        v.visitFieldS("storage", Storage[this.storage]);
    }
}
export class NumType extends PrimType {
    visit(v: Visitor) {
        if (this.type)
            v.visitFieldN("type", this.type);
        v.visitField("name", this.name);
        v.visitFieldS("storage", Storage[this.storage]);
    }
} // all number types
export class FloatType extends NumType {
    visit(v: Visitor) {
        if (this.type)
            v.visitFieldN("type", this.type);
        v.visitField("name", this.name);
        v.visitFieldS("storage", Storage[this.storage]);
    }
}
export class IntType extends NumType {
    visit(v: Visitor) {
        if (this.type)
            v.visitFieldN("type", this.type);
        v.visitField("name", this.name);
        v.visitFieldS("storage", Storage[this.storage]);
    }
}
export class SIntType extends IntType {
    visit(v: Visitor) {
        if (this.type)
            v.visitFieldN("type", this.type);
        v.visitField("name", this.name);
        v.visitFieldS("storage", Storage[this.storage]);
    }
}
export class UIntType extends IntType {
    visit(v: Visitor) {
        if (this.type)
            v.visitFieldN("type", this.type);
        v.visitField("name", this.name);
        v.visitFieldS("storage", Storage[this.storage]);
    }
}
export class MemType extends UIntType {
    visit(v: Visitor) {
        if (this.type)
            v.visitFieldN("type", this.type);
        v.visitField("name", this.name);
        v.visitFieldS("storage", Storage[this.storage]);
    }
} // used by SSA IR to represent memory state
// predefined constant of all primitive types.
// string names should match exported constant name sans "t_".
export const t_nil = new NilType("nil", Storage.None);
export const t_bool = new BoolType("bool", Storage.Bool);
export const t_rune = new UIntType("rune", Storage.i32);
export const t_byte = new UIntType("byte", Storage.i8);
export const t_u8 = new UIntType("u8", Storage.i8);
export const t_i8 = new SIntType("i8", Storage.i8);
export const t_u16 = new UIntType("u16", Storage.i16);
export const t_i16 = new SIntType("i16", Storage.i16);
export const t_u32 = new UIntType("u32", Storage.i32);
export const t_i32 = new SIntType("i32", Storage.i32);
export const t_u64 = new UIntType("u64", Storage.i64);
export const t_i64 = new SIntType("i64", Storage.i64);
export const t_uint = new UIntType("uint", Storage.Int);
export const t_int = new SIntType("int", Storage.Int);
export const t_uintptr = new UIntType("uintptr", Storage.Ptr);
export const t_mem = new MemType("mem", Storage.Ptr);
export const t_f32 = new FloatType("f32", Storage.f32);
export const t_f64 = new FloatType("f64", Storage.f64);
export class StrType extends Type {
    constructor(pos: Pos, public len: int // -1 means length only known at runtime
    ) { super(pos); }
    equals(t: Type): bool { return this === t || t.isStrType(); }
    repr(sep: string = ""): string { return this.len == -1 ? "str" : `str<${this.len}>`; }
    visit(v: Visitor) {
        if (this.type)
            v.visitFieldN("type", this.type);
        v.visitField("len", this.len);
    }
}
export class UnionType extends Type {
    constructor(pos: Pos, public types: Set<Type>) { super(pos); }
    add(t: Type) {
        assert(!(t instanceof UnionType), "adding union type to union type");
        this.types.add(t);
    }
    toString(): string {
        let s = "(", first = true;
        for (let t of this.types) {
            if (first) {
                first = false;
            }
            else {
                s += "|";
            }
            s += t.toString();
        }
        return s + ")";
    }
    equals(other: Type): bool {
        if (this === other) {
            return true;
        }
        if (!(other instanceof UnionType) || other.types.size != this.types.size) {
            return false;
        }
        // Note: This relies on type instances being singletons (being interned)
        for (let t of this.types) {
            if (!other.types.has(t)) {
                return false;
            }
        }
        return true;
    }
    accepts(other: Type): bool {
        if (this === other) {
            return true;
        }
        if (!(other instanceof UnionType)) {
            return false;
        }
        // Note: This relies on type instances being singletons (being interned)
        // make sure that we have at least the types of `other`.
        // e.g.
        //   (int|f32|bool) accepts (int|f32) => true
        //   (int|f32) accepts (int|f32|bool) => false
        for (let t of other.types) {
            if (!this.types.has(t)) {
                return false;
            }
        }
        return true;
    }
    visit(v: Visitor) {
        if (this.type)
            v.visitFieldN("type", this.type);
        v.visitField("types", this.types);
    }
}
export class TypeVar {
    constructor(public name: ByteStr, public def: null | Type // e.g. "T = int"  TODO: remove and instead use TemplateType._scope
    , public constraint: null | Type // e.g. "T is ConstraintType"
    ) { }
    equals(t: TypeVar): bool {
        return (
        // this.name.equals(t.name) &&
        !this.def == !t.def &&
            (!this.def || this.def.equals(t.def!)) &&
            !this.constraint == !t.constraint &&
            (!this.constraint || this.constraint.equals(t.constraint!)));
    }
    visit(v: Visitor) {
        v.visitField("name", this.name);
        if (this.def)
            v.visitFieldN("def", this.def);
        if (this.constraint)
            v.visitFieldN("constraint", this.constraint);
    }
}
export class TemplateType extends Type {
    constructor(pos: Pos, public _scope: Scope // holds bindings for `type`
    , public type: Type // type this template is based on
    , public vars: Map<ByteStr, TypeVar> // never empty.  position and name are both important
    ) { super(pos); }
    visit(v: Visitor) {
        v.visitFieldN("type", this.type);
        v.visitField("vars", this.vars);
    }
}
// class GenericType extends Type {
//   // GenericType describes a type with potential type variables.
//   // At definition site "<T>" defines a new TypeVar, and "T" references it.
//   // Note: A GenericType object without any vars denotes a concrete type.
//   vars     :TypeVar[]  // named placeholders
//   restvar? :TypeVar    // non-null when rest/spread is accepted as last var
//   // init() { assert(this.rest || this.vars.length > 0, `generic type without any typevars`) }
//   // isTemplate returns true if there are any type vars
//   isTemplate() :bool {
//     return !!(this.vars.length > 0 || this.restvar)
//   }
//   equals(t :Type) :bool {
//     if (this === t) {
//       return true
//     }
//     if (
//       t.constructor !== this.constructor ||
//       this.vars.length != (t as GenericType).vars.length ||
//       !this.restvar != !(t as GenericType).restvar ||
//       (this.restvar && !this.restvar.equals((t as GenericType).restvar!))
//     ) {
//       return false
//     }
//     for (let i = 0; i < this.vars.length; i++) {
//       if (!this.vars[i].equals((t as GenericType).vars[i])) {
//         return false
//       }
//     }
//     return true
//   }
// }
export class AliasType extends Type {
    constructor(pos: Pos, public name: ByteStr // alias name
    , public type: Type // type this is an alias of
    ) { super(pos); }
    equals(other: Type): bool {
        return this === other || (other.isAliasType() && this.type.equals(other.type));
    }
    canonicalType(): Type { return this.type; }
    visit(v: Visitor) {
        v.visitFieldN("type", this.type);
        v.visitField("name", this.name);
    }
}
export class TupleType extends Type {
    constructor(public types: Type[]) { super(NoPos); }
    visit(v: Visitor) {
        if (this.type)
            v.visitFieldN("type", this.type);
        v.visitFieldNA("types", this.types);
    }
}
export class ListType extends Type {
    constructor(public type: Type // element type
    ) { super(NoPos); }
    equals(t: Type): bool {
        return this === t || (t instanceof ListType && this.type.equals(t.type));
    }
    accepts(t: Type): bool {
        // Note: This way, ListType <= RestType, e.g.
        // fun foo(x ...int) { y int[] = x }
        return t instanceof ListType && this.type.equals(t.type);
    }
    visit(v: Visitor) { v.visitFieldN("type", this.type); }
}
export class RestType extends ListType {
    // RestType = "..." Type
    // Specialized generic type instance.
    // Rest is really a list, but represented as a subclass
    toString(): string { return `...${super.toString()}`; }
    equals(t: Type): bool {
        return this === t || (t instanceof RestType && this.type.equals(t.type));
    }
    visit(v: Visitor) { v.visitFieldN("type", this.type); }
}
export class StructType extends Type {
    constructor(pos: Pos, public name: Ident | null, public decls: Decl[]) { super(pos); }
    toString(): string {
        return this.name ? this.name.toString() : "{anon}";
    }
    visit(v: Visitor) {
        if (this.type)
            v.visitFieldN("type", this.type);
        if (this.name)
            v.visitFieldN("name", this.name);
        v.visitFieldNA("decls", this.decls);
    }
}
export class FunType extends Type {
    constructor(pos: Pos, public args: Type[], public result: Type) { super(pos); }
    equals(t: Type): bool {
        return (this === t ||
            (t.isFunType() &&
                this.args.length == t.args.length &&
                this.result.equals(t.result) &&
                this.args.every((at, i) => at.equals(t.args[i]))));
    }
    visit(v: Visitor) {
        if (this.type)
            v.visitFieldN("type", this.type);
        v.visitFieldNA("args", this.args);
        v.visitFieldN("result", this.result);
    }
}
// end of types
// -----------------------------------------------------------------------------
// Flow control
export class ReturnStmt extends Stmt {
    constructor(pos: Pos, _scope: Scope, public result: Expr // t_nil means no explicit return values
    , public type: Type | null // effective type. null until resolved.
    ) { super(pos, _scope); }
    visit(v: Visitor) {
        v.visitFieldN("result", this.result);
        if (this.type)
            v.visitFieldN("type", this.type);
    }
}
export class ForStmt extends Stmt {
    constructor(pos: Pos, _scope: Scope, public init: Stmt | null // initializer
    , public cond: Expr | null // condition for executing the body. null=unconditional
    , public incr: Stmt | null // incrementor
    , public body: Expr) { super(pos, _scope); }
    visit(v: Visitor) {
        if (this.init)
            v.visitFieldN("init", this.init);
        if (this.cond)
            v.visitFieldN("cond", this.cond);
        if (this.incr)
            v.visitFieldN("incr", this.incr);
        v.visitFieldN("body", this.body);
    }
}
export class WhileStmt extends ForStmt {
    constructor(pos: Pos, _scope: Scope, cond: Expr | null // condition for executing the body. null=unconditional
    , body: Expr) { super(pos, _scope, null, cond, null, body); }
    visit(v: Visitor) {
        if (this.cond)
            v.visitFieldN("cond", this.cond);
        v.visitFieldN("body", this.body);
    }
}
export class BranchStmt extends Stmt {
    constructor(pos: Pos, _scope: Scope, public tok: token // BREAK | CONTINUE
    ) { super(pos, _scope); }
    label: Ident | null = null;
    visit(v: Visitor) {
        v.visitFieldS("tok", token[this.tok]);
        if (this.label)
            v.visitFieldN("label", this.label);
    }
}
// end of flow control
// -----------------------------------------------------------------------------
// Declarations
export class Decl extends Stmt {
    visit(v: Visitor) { }
}
export class ImportDecl extends Decl {
    constructor(pos: Pos, _scope: Scope, public path: StringLit, public localIdent: Ident | null) { super(pos, _scope); }
    visit(v: Visitor) {
        v.visitFieldN("path", this.path);
        if (this.localIdent)
            v.visitFieldN("localIdent", this.localIdent);
    }
}
export class MultiDecl extends Decl {
    constructor(pos: Pos, _scope: Scope, public decls: Decl[]) { super(pos, _scope); }
    visit(v: Visitor) { v.visitFieldNA("decls", this.decls); }
}
export class VarDecl extends Decl {
    constructor(pos: Pos, _scope: Scope, public idents: Ident[], public group: Object | null // null means not part of a group
    , public type: Type | null // null means no type
    , public values: Expr[] | null // null means no values
    ) { super(pos, _scope); }
    visit(v: Visitor) {
        v.visitFieldNA("idents", this.idents);
        if (this.group !== null)
            v.visitField("group", this.group);
        if (this.type)
            v.visitFieldN("type", this.type);
        if (this.values)
            v.visitFieldNA("values", this.values);
    }
}
export class TypeDecl extends Decl {
    constructor(pos: Pos, _scope: Scope, public ident: Ident, public type: Type, public group: Object | null // nil = not part of a group
    ) { super(pos, _scope); }
    visit(v: Visitor) {
        v.visitFieldN("ident", this.ident);
        v.visitFieldN("type", this.type);
        if (this.group !== null)
            v.visitField("group", this.group);
    }
}
export class FieldDecl extends Decl {
    constructor(pos: Pos, _scope: Scope, public type: Type, public name: null | Ident // null means anonymous field/parameter
    ) { super(pos, _scope); }
    visit(v: Visitor) {
        v.visitFieldN("type", this.type);
        if (this.name)
            v.visitFieldN("name", this.name);
    }
}
// -----------------------------------------------------------------------------
// Expressions
export class Ident extends Expr {
    constructor(pos: Pos, _scope: Scope, public value: ByteStr // interned value
    ) { super(pos, _scope); }
    ent: null | Ent = null; // what this name references
    incrWrite() {
        assert(this.ent != null);
        this.ent!.writes++;
    }
    // ref registers a reference to this ent from an identifier
    refEnt(ent: Ent) {
        assert(this !== ent.decl, "ref declaration");
        ent.nreads++;
        this.ent = ent;
    }
    // ref unregisters a reference to this ent from an identifier
    unrefEnt() {
        assert(this.ent, "null ent");
        this.ent!.nreads--;
        this.ent = null;
    }
    toString(): string { return this.value.toString(); }
    repr(sep: string = ""): string { return this.toString(); }
    visit(v: Visitor) {
        if (this.type)
            v.visitFieldN("type", this.type);
        if (this.ent !== null)
            v.visitField("ent", this.ent);
        v.visitField("value", this.value);
    }
}
export class Block extends Expr {
    constructor(pos: Pos, _scope: Scope, public list: Stmt[]) { super(pos, _scope); }
    visit(v: Visitor) {
        if (this.type)
            v.visitFieldN("type", this.type);
        v.visitFieldNA("list", this.list);
    }
}
export class IfExpr extends Expr {
    constructor(pos: Pos, _scope: Scope, public cond: Expr, public then: Expr, public els_: Expr | null) { super(pos, _scope); }
    visit(v: Visitor) {
        if (this.type)
            v.visitFieldN("type", this.type);
        v.visitFieldN("cond", this.cond);
        v.visitFieldN("then", this.then);
        if (this.els_)
            v.visitFieldN("els_", this.els_);
    }
}
export class CollectionExpr extends Expr {
    constructor(pos: Pos, _scope: Scope, public entries: Expr[]) { super(pos, _scope); }
    visit(v: Visitor) {
        if (this.type)
            v.visitFieldN("type", this.type);
        v.visitFieldNA("entries", this.entries);
    }
}
export class TupleExpr extends CollectionExpr {
    // TupleExpr = "(" Expr ("," Expr)+ ")"
    // e.g. (1, true, "three")
    type: null | TupleType = null;
    visit(v: Visitor) {
        if (this.type)
            v.visitFieldN("type", this.type);
        v.visitFieldNA("entries", this.entries);
    }
}
export class ListExpr extends CollectionExpr {
    constructor(pos: Pos, _scope: Scope, entries: Expr[], public type: null | ListType) { super(pos, _scope, entries); }
    visit(v: Visitor) {
        if (this.type)
            v.visitFieldN("type", this.type);
        v.visitFieldNA("entries", this.entries);
    }
}
export class SelectorExpr extends Expr {
    constructor(pos: Pos, _scope: Scope, public lhs: Expr, public rhs: Expr // Ident or SelectorExpr
    ) { super(pos, _scope); }
    visit(v: Visitor) {
        if (this.type)
            v.visitFieldN("type", this.type);
        v.visitFieldN("lhs", this.lhs);
        v.visitFieldN("rhs", this.rhs);
    }
}
export class IndexExpr extends Expr {
    constructor(pos: Pos, _scope: Scope, public operand: Expr, public index: Expr) { super(pos, _scope); }
    indexnum: Num = -1; // used by resolver. >=0 : resolved, -1 : invalid or unresolved
    visit(v: Visitor) {
        if (this.type)
            v.visitFieldN("type", this.type);
        v.visitFieldN("operand", this.operand);
        v.visitFieldN("index", this.index);
        v.visitField("indexnum", this.indexnum);
    }
}
export class SliceExpr extends Expr {
    constructor(pos: Pos, _scope: Scope, public operand: Expr, public start: Expr | null, public end: Expr | null) { super(pos, _scope); }
    // SliceExpr = Expr "[" Expr? ":" Expr? "]"
    // e.g. foo[1:4]
    type: null | (ListType | TupleType) = null;
    startnum: Num = -1; // used by resolver. >=0 : resolved, -1 : invalid or unresolved
    endnum: Num = -1; // used by resolver. >=0 : resolved, -1 : invalid or unresolved
    visit(v: Visitor) {
        if (this.type !== null)
            v.visitField("type", this.type);
        v.visitFieldN("operand", this.operand);
        if (this.start)
            v.visitFieldN("start", this.start);
        if (this.end)
            v.visitFieldN("end", this.end);
        v.visitField("startnum", this.startnum);
        v.visitField("endnum", this.endnum);
    }
}
export class LiteralExpr extends Expr {
    constructor(pos: Pos, public value: Int64 | number | Uint8Array) { super(pos, nilScope); }
    visit(v: Visitor) {
        if (this.type)
            v.visitFieldN("type", this.type);
        v.visitField("value", this.value);
    }
}
export class NumLit extends LiteralExpr {
    constructor(pos: Pos, public value: Int64 | number, public type: NumType) { super(pos, value); }
    // convertToType coverts the value of the literal to the provided basic type.
    // Returns true if the conversion was lossless.
    //
    convertToType(t: NumType): bool {
        let [v, lossless] = numconv(this.value, t);
        this.type = t;
        this.value = v;
        return lossless;
    }
    visit(v: Visitor) {
        v.visitFieldN("type", this.type);
        v.visitField("value", this.value);
    }
}
export class IntLit extends NumLit {
    constructor(pos: Pos, value: Int64 | number, public type: IntType // type is always known
    , public format: token.INT | token.INT_BIN | token.INT_OCT | token.INT_HEX) { super(pos, value, type); }
    base(): int {
        switch (this.format) {
            case token.INT_HEX: return 16;
            case token.INT_OCT: return 8;
            case token.INT_BIN: return 2;
            default: return 10;
        }
    }
    toString(): string {
        switch (this.format) {
            case token.INT_HEX: return "0x" + this.value.toString(16);
            case token.INT_OCT: return "0o" + this.value.toString(8);
            case token.INT_BIN: return "0b" + this.value.toString(2);
            default: return this.value.toString(10);
        }
    }
    visit(v: Visitor) {
        v.visitFieldN("type", this.type);
        v.visitField("value", this.value);
        v.visitFieldS("format", token[this.format]);
    }
}
export class RuneLit extends NumLit {
    constructor(pos: Pos, public value: int) { super(pos, value, t_rune); }
    visit(v: Visitor) { v.visitField("value", this.value); }
}
export class FloatLit extends NumLit {
    constructor(pos: Pos, public value: number, public type: FloatType) { super(pos, value, type); }
    visit(v: Visitor) {
        v.visitFieldN("type", this.type);
        v.visitField("value", this.value);
    }
}
export class StringLit extends LiteralExpr {
    constructor(pos: Pos, public value: Uint8Array, public type: StrType) { super(pos, value); }
    visit(v: Visitor) {
        v.visitFieldN("type", this.type);
        v.visitField("value", this.value);
    }
}
export class Assignment extends Expr {
    constructor(pos: Pos, _scope: Scope, public op: token // ILLEGAL means no operation
    , public lhs: Expr[], public rhs: Expr[] // empty == lhs++ or lhs--
    , public decls: bool[] // index => bool: new declaration?
    ) { super(pos, _scope); }
    visit(v: Visitor) {
        if (this.type)
            v.visitFieldN("type", this.type);
        v.visitFieldS("op", token[this.op]);
        v.visitFieldNA("lhs", this.lhs);
        v.visitFieldNA("rhs", this.rhs);
        v.visitFieldA("decls", this.decls);
    }
}
export class Operation extends Expr {
    constructor(pos: Pos, _scope: Scope, public op: token // [token.operator_beg .. token.operator_end]
    , public x: Expr // left-hand side
    , public y: Expr | null // right-hand size. nil means unary expression
    ) { super(pos, _scope); }
    visit(v: Visitor) {
        if (this.type)
            v.visitFieldN("type", this.type);
        v.visitFieldS("op", token[this.op]);
        v.visitFieldN("x", this.x);
        if (this.y)
            v.visitFieldN("y", this.y);
    }
}
export class CallExpr extends Expr {
    constructor(pos: Pos, _scope: Scope, public receiver: Expr, public args: Expr[], public hasRest: bool // last argument is followed by ...
    ) { super(pos, _scope); }
    visit(v: Visitor) {
        if (this.type)
            v.visitFieldN("type", this.type);
        v.visitFieldN("receiver", this.receiver);
        v.visitFieldNA("args", this.args);
        v.visitField("hasRest", this.hasRest);
    }
}
export class FunExpr extends Expr {
    constructor(pos: Pos, _scope: Scope, public sig: FunSig, public name: null | Ident // null = anonymous func expression
    , public isInit: bool // true for special "init" funs at file level
    ) { super(pos, _scope); }
    type: null | FunType = null;
    body: null | Expr = null; // null = forward declaration
    visit(v: Visitor) {
        if (this.type)
            v.visitFieldN("type", this.type);
        v.visitFieldN("sig", this.sig);
        if (this.name)
            v.visitFieldN("name", this.name);
        v.visitField("isInit", this.isInit);
        if (this.body)
            v.visitFieldN("body", this.body);
    }
}
export class TypeConvExpr extends Expr {
    constructor(pos: Pos, _scope: Scope, public expr: Expr, public type: Type) { super(pos, _scope); }
    visit(v: Visitor) {
        v.visitFieldN("type", this.type);
        v.visitFieldN("expr", this.expr);
    }
}
export class Atom extends Expr {
    constructor(public name: string, public type: BoolType | NilType) { super(NoPos, nilScope); }
    visit(v: Visitor) {
        v.visitField("type", this.type);
        v.visitField("name", this.name);
    }
}
