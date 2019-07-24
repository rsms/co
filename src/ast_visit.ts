export interface Visitable {
  visit(v :Visitor) :void
}

export interface Visitor {
  visitNode(n :Visitable) :void
  visitFieldN(name: string, value :Visitable) :void
  visitFieldNA(name: string, value :Visitable[]) :void
  visitField(name: string, value :any) :void
  visitFieldA(name: string, value :any[]) :void
  visitFieldS(name: string, s :any) :void
}
