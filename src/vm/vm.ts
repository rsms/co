import { debuglog as dlog } from "../util"
import { Pkg, Fun, Block, BlockKind, Value } from "../ir/ssa"
import { Op } from "../ir/op"


export class VirtualMachine {
  pkg :Pkg|null = null  // current package


  async runPkg(pkg :Pkg) :Promise<int> {
    this.pkg = pkg
    try {
      let mainfun = pkg.mainFun()
      if (!mainfun) {
        throw new Error("no main function declared by package")
      }
      return this.runMain(mainfun)
    } finally {
      this.pkg = null
    }
  }


  async runMain(f :Fun) :Promise<int> {
    dlog(`ENTER fun ${f.name}`)
    //
    dlog(`EXIT fun ${f.name}`)
    return 0
  }


}
