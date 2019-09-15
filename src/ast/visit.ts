import { Node } from "./nodes"

export interface NodeVisitor {
  visitNode(n :Node) :void
  visitFieldN(name: string, value :Node) :void
  visitFieldNA(name: string, value :Node[]) :void
  visitField(name: string, value :any) :void
  visitFieldA(name: string, value :any[]) :void
  visitFieldE(name: string, v :number, enum_ :{[k:number]:string}) :void
}
