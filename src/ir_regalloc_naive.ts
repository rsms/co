import { RegAlloc, Fun, Block, Value, Op } from './ir'
import { u_t_int, u_t_uint, u_t_i32, u_t_u32, u_t_u64 } from './ast'
import { debuglog as dlog } from './util'

// NaiveRegAlloc performs naïve register allocation, meaning that for
// every operation, its operands are loaded into registers and--
// following the operation--the result is stored into memory.
//
// E.g. with input source:
//
//   fun foo(x, y int) int {
//     d = x + y
//     e = x - d
//     d * e
//   }
//
// IR before regalloc:
//
//   v1 = Param [0]
//   v2 = Param [1]
//   v3 = i32Add v1 v2
//   v4 = i32Sub v1 v3
//   v5 = i32Mul v3 v4
//   ret v5
//
// IR after applying NaiveRegAlloc:
//
//   v1 = i32Load [fp -12]
//   v2 = i32Load [fp -16]
//   v3 = i32Add v1 v2
//   v6 = i32Store v3 [fp -8]
//
//   v1 = i32Load [fp -12]
//   v2 = i32Load [fp -16]

//   v4 = i32Sub <i32> v1 v3
//   v5 = i32Mul <i32> v3 v4
//   ret v5
// 
//
export class NaiveRegAlloc implements RegAlloc {
  // int types for 32-bit targets
  readonly sint_type = u_t_i32
  readonly uint_type = u_t_u32
  readonly addr_type = u_t_u64

  // normtype lowers target-dependent v.type to specific type.
  //
  normtype(v :Value) {
    const a = this
    if (v.type === u_t_int) {
      v.type = a.sint_type
    } else if (v.type === u_t_uint) {
      v.type = a.uint_type
    }
  }

  visitFun(f :Fun) {
    const a = this

    // Add SP (stack pointer) value to the top of the entry block.
    // TODO: track the need for this when generating the initial IR.
    // Some functions do not need SP.
    // Also consider always adding this during IR construction.
    const SP = f.newValue(Op.SP, a.addr_type, f.entryb, null)
    f.entryb.pushValueFront(SP)

    // argoffs tracks bytes relative to a frame's SP
    // where we are operating. It starts with the return address.
    //
    // Note: args are at the very beginning of the entry block, thus
    // the while condition op==Arg.
    //
    let argoffs = a.addr_type.size
    let v = SP.nextv; // SP is at top of entry block
    while (v && v.op === Op.Arg) {
      a.normtype(v)
      v.aux = argoffs
      // v.args = [SP] ; SP.uses++ ; SP.users.push(v)
      assert(v.type.size > 0)
      argoffs += v.type.size
      v = v.nextv
    }
    
    // visit function's entry block
    a.block(f.entryb, SP)
  }

  block(b :Block, _SP :Value) {
    const a = this

    let localoffs = 0

    let limit = 50
    let v = b.vhead
    while (v && limit--) {

      // normalize target-dependent types
      a.normtype(v)
      dlog(`v ${v}`)

      // switch on operation
      switch (v.op) {

      case Op.Arg: // ignore arg (handled early on)
        break

      case Op.i32Add:
        assert(v.args)

        let operands = v.args as Value[]
        
        let op0 = operands[0]
        let loadreg = a.loadreg(b, op0, 1)
        op0.uses--  // TODO: should we also remove from op0.users?
        operands[0] = b.insertValueBefore(v, loadreg)

        let op1 = operands[1]
        loadreg = a.loadreg(b, op1, 2)
        op0.uses--
        operands[1] = b.insertValueBefore(v, loadreg)

        // RegStore
        let storeaddr = b.f.constVal(a.addr_type, localoffs)
        let storereg = b.f.newValue(Op.RegStore, v.type, b, 1)
        storereg.args = [storeaddr] ; storeaddr.uses++ ; storeaddr.users.push(storereg)

        // let operands = v.args as Value[]
        // let loadv0 = operands[0]
        // let loadv1 = operands[1]
        // loadv0.replaceBy(a.loadreg(b, loadv0, 1, -12))
        // if (loadv0 !== loadv1) {
        //   loadv1.replaceBy(a.loadreg(b, loadv1, 2, -16))
        // }

        break

      }

      v = v.nextv
    }
  }

  loadreg(b :Block, v :Value, reg :int) :Value {
    let regload = b.f.newValue(Op.RegLoad, v.type, b, reg)
    regload.args = [v] ; v.uses++ ; v.users.push(regload)
    return regload
  }

  // loadreg(b :Block, v :Value, reg :int, fpoffs :int) :Value {
  //   let loadv = b.f.newValue(Op.RegLoad, v.type, b, fpoffs)
  //   return b.insertValueBefore(v, loadv)
  // }

}



// operands returns the register numbers for the expected operand count in v
//
// function operands(v :Value, n :int) :number[] {
//   assert(v.args, 'missing args')
//   let args = v.args as Value[]
//   assert(args.length == n, `expected ${n} args but has ${args.length}`)
//   return args.map(v => v.id)
// }
