import { Pos } from './pos'
import { Parser } from './parser'
import { ByteStr } from './bytestr'
import { token } from './token'

let nextgid = 0; export class Group { id = nextgid++ } // DEBUG
// export class Group {}

export class Comment {
  constructor(
    public pos   :Pos,
    public value :Uint8Array,
  ) {}
}

export class Node {
  constructor(
    public pos :Pos,
    public comments? :Comment[],
  ) {}
}

// ——————————————————————————————————————————————————————————————————
// Declarations

export class Decl extends Node {}

export class ImportDecl extends Decl {
  constructor(p :Parser,
  public path      :StringLit,
  public localName :Name|null,
  ) {
    super(p.pos)
  }
}

export class ConstDecl extends Decl {
  constructor(p :Parser,
  public names   :Name[],
  public group   :Group|null,        // nil means not part of a group
  public type    :Expr|null = null,  // nil means no type
  public values  :Expr|null = null,  // nil means no values
  ) {
    super(p.pos)
  }
}

export class VarDecl extends Decl {
  constructor(p :Parser,
  public names   :Name[],
  public group   :Group|null,        // nil means not part of a group
  public type    :Expr|null = null,  // nil means no type
  public values  :Expr|null = null,  // nil means no values
  ) {
    super(p.pos)
  }
}

export class TypeDecl extends Decl {
  // Name Type
  constructor(pos :Pos,
  public name   :Name,
  public alias  :bool,
  public type   :Expr,
  public group  :Group|null, // nil = not part of a group
  ) {
    super(pos)
  }
}

type FuncType = null // TODO
type BlockStmt = null // TODO

export class FuncDecl extends Decl {
  // func          Name Type { Body }
  // func          Name Type
  // func Receiver Name Type { Body }
  // func Receiver Name Type
  constructor(p :Parser,
    // public attr :map[string]bool, // go:attr map
    public recv :Name|null = null,     // nil = regular function
    public name :Name|null = null,
    public type :FuncType|null = null,
    public body :BlockStmt|null = null, // nil = forward declaration
  ) {
    super(p.pos)
  }
}

// ——————————————————————————————————————————————————————————————————
// Expressions

export class Expr extends Node {}

// Placeholder for an expression that failed to parse
// correctly and where we can't provide a better node.
export class BadExpr extends Expr {}

export class ListExpr extends Expr {
  // ListExpr = Expr ("," Expr)+
  constructor(pos :Pos,
    public exprs :Expr[]
  ) {
    super(pos)
  }
}


export class Name extends Expr {
  constructor(p :Parser,
    public value :ByteStr
  ) {
    super(p.pos)
  }
}

export class QualName extends Expr {
  // QualName = Name ("." (Name | QualName))+
  constructor(p :Parser,
    public value :ByteStr,
    public next  :Name|QualName,
  ) {
    super(p.pos)
  }
}

export class BasicLit extends Expr {
  constructor(p :Parser,
    public tok   :token,
    public value :Uint8Array,
  ) {
    super(p.pos)
  }
}

export class StringLit extends Expr {
  constructor(p :Parser,
    public value :Uint8Array
  ) {
    super(p.pos)
  }
}

export class SelectorExpr extends Expr {
  // SelectorExpr = Expr "." (Name | QualName)
  constructor(p :Parser,
  public expr :Expr,
  public sel  :Name|QualName,
  ) {
    super(p.pos)
  }
}

export class Operation extends Expr {
  constructor(
  pos :Pos,
  public op :token,
  public x  :Expr,
  public y  :Expr|null = null, // nil means unary expression
  ) {
    super(pos)
  }
}

export class ParenExpr extends Expr {
  // (X)
  constructor(p :Parser,
  public x :Expr,
  ) {
    super(p.pos)
  }
}
