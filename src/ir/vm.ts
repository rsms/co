import { ByteStr } from '../bytestr'
import { DiagHandler } from '../diag'
import { debuglog as dlog } from '../util'
import { Pkg, Fun, Block, BlockKind, Value } from './ssa'
import { Op } from './op'
import { fmtir } from './repr'


function nnil<T>(v :T|null) :T {
  assert(v !== null, 'null value')
  return v as T
}

// operands returns the register numbers for the expected operand count in v
//
function operands(v :Value, n :int) :number[] {
  assert(v.args.length == n, `expected ${n} args but has ${v.args.length}`)
  return v.args.map(v => v.id)
}

function operand(v :Value) :number {
  assert(v.args.length == 1,
    `len(args) is ${v.args ? v.args.length : 0} but expected 1`)
  return v.args[0].id
}


interface Debugger {
  attach(vm :IRVirtualMachine) :void
  detach() :void
  onBreak() :void
}


class IntervalStepper implements Debugger {
  vm :IRVirtualMachine | null = null
  pauseTime :number
  timer :any = null

  constructor(pauseTime :number) {
    this.pauseTime = pauseTime
  }

  attach(vm :IRVirtualMachine) :void {
    this.vm = vm
    this.vm.break()
  }
  
  detach() :void {
    this.vm = null
    clearTimeout(this.timer)
  }

  onBreak() :void {
    clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      let vm = nnil(this.vm)
      vm.step()
      vm.dumpCallStack()
    }, this.pauseTime)
  }
}


class CallFrame {
  fn :Fun
  b  :Block       // current block
  v  :Value|null  // current value

  // registry -- maps ir.Value ID to register value
  reg = new Map<int,int>()
  // TODO: replace with a stack built on Uint32Array
  // This requires us to implement register allocation
  // (stack allocation, really) for IR.

  constructor(fn :Fun) {
    this.fn = fn
    this.b = fn.entryb
    this.v = fn.entryb.vhead
  }

  regset(n :int, v :int) {
    this.reg.set(n, v as int)
    // this.dumpregs()
  }

  regget(n :int) :int {
    let v = this.reg.get(n)
    assert(v !== undefined, `register value missing for ${n}`)
    return v as int
  }

  dumpregs() {
    for (let r of this.reg) {
      console.log('  ' + r[0] + '\t= ' + r[1] + '\t0x' + r[1].toString(16))
    }
  }
}


export class IRVirtualMachine {
  pkg       :Pkg
  diagh     :DiagHandler|null
  debugger  :Debugger|null = null
  callstack :CallFrame[] = []
  memstack  :number[] = []

  breakOn   :bool = false

  prevblock :Block|null = null // previous block
  block     :Block|null = null // current block
  value     :Value|null = null // next value to be evaluated

  // final return value from top-level call
  retval :number = 0

  constructor(pkg :Pkg, diagh :DiagHandler|null = null) {
    const m = this
    m.pkg = pkg
    m.diagh = diagh
    m.debugger = new IntervalStepper(100)
  }

  break() {
    dlog(``)
    const m = this
    m.breakOn = true
  }

  cont() {
    dlog(``)
    const m = this
    m.breakOn = false
    m.step()
  }

  dumpCallStack() {
    const m = this
    for (let i = m.callstack.length; --i >= 0; ) {
      let f = m.callstack[i]
      console.log(f.fn.name.toString())
      f.dumpregs()
    }
  }

  execFun(fn :Fun) {
    const m = this
    if (m.debugger) {
      m.debugger.attach(m)
    }
    m.call(fn)
  }

  call(fn :Fun) {
    dlog(`${fn}`)
    const m = this
    if (m.callstack.length) {
      // save call frame state
      let f = m.callstack[m.callstack.length - 1]
      f.b = nnil(m.block)
      f.v = m.value
    }
    m.callstack.push(new CallFrame(fn))
    m.jump(fn.entryb)
  }

  ret() {
    const m = this
    let b = nnil(m.block)
    dlog(`${b}`)

    assert(b.kind == BlockKind.Ret, `ret with non-ret block ${b}`)

    let retval :number = 0
    if (b.control) {
      let f = m.callstack[m.callstack.length - 1]
      retval = f.regget(b.control.id)
    }

    m.callstack.pop()

    if (m.callstack.length > 0) {
      // restore call frame state
      let f = m.callstack[m.callstack.length - 1]
      m.block = f.b
      if (f.v) {
        if (b.control) {
          f.regset(f.v.id, retval)
        }
        m.value = f.v.nextv
      } else {
        m.value = null
      }
      m.next()
    } else {
      // top-level call returned -- done
      m.block = null
      if (m.debugger) {
        m.debugger.detach()
      }
      m.breakOn = false
      m.retval = retval
      if (b.control) {
        dlog(`END return value: ${retval} (0x${retval.toString(16)})`)
      } else {
        dlog(`END return value: nil`)
      }
    }
  }

  jump(b :Block) {
    const m = this
    assert(b, `jump to null block`)

    if (m.block) {
      dlog(`${m.block} -> ${b}`)
    } else {
      dlog(`-> ${b}`)
    }

    m.prevblock = m.block
    m.block = b
    m.value = b.vhead
    dlog(`m.value = ${m.value ? fmtir(m.value) : 'null'}`)
    m.next()
  }

  next() {
    const m = this
    if (m.breakOn) {
      // break is on -- move control to debugger
      nnil(m.debugger).onBreak()
    } else {
      // break is off -- continue walking forward
      m.step()
    }
  }

  branch() {
    // at end of m.block -- branch to another block or return
    const m = this
    let b = nnil(m.block)
    let f = this.callstack[this.callstack.length - 1]

    switch (b.kind) {

    case BlockKind.Plain:
      m.jump(b.succs[0])
      break

    case BlockKind.If: {
      let control = nnil(b.control)
      let ctrl = f.regget(control.id)
      if (ctrl != 0) {
        m.jump(b.succs[0])
      } else {
        m.jump(b.succs[1])
      }
      break
    }

    case BlockKind.Ret:
      m.ret()
      break

    }
  }

  step() {
    const m = this
    dlog(`m.value = ${m.value ? fmtir(m.value) : 'null'}`)

    if (!m.value) {
      // end of block
      return m.branch()
    }

    let v = m.value
    let f = this.callstack[this.callstack.length - 1]
    dlog(`${fmtir(v)}`)

    switch (v.op) {

    case Op.i32Const:
      f.regset(v.id, v.aux as int)
      break

    case Op.i32Add: {
      let o = operands(v, 2)
      let a = f.regget(o[0])
      let b = f.regget(o[1])
      let r = a + b
      f.regset(v.id, r)
      break
    }

    case Op.i32Gt_s:
    case Op.i32Gt_u: {
      let o = operands(v, 2)
      let a = f.regget(o[0])
      let b = f.regget(o[1])
      let r = a > b ? 1 : 0
      f.regset(v.id, r)
      break
    }

    case Op.i32Mul: {
      dlog(' ----- i32Mul ----- ')
      let o = operands(v, 2)
      let a = f.regget(o[0])
      let b = f.regget(o[1])
      let r = a * b
      f.regset(v.id, r)
      break
    }

    case Op.CallArg: {
      let a = f.regget(operand(v))
      m.memstack.push(a)
      break
    }

    case Op.Arg: {
      let a = m.memstack.pop()
      assert(a !== undefined, 'no param on memstack')
      f.regset(v.id, a as number)
      break
    }

    case Op.Call:
    case Op.TailCall: {
      // Note: for TailCall, we can reclaim all regs used by the current fun
      assert(v.aux instanceof ByteStr)
      let fn = nnil(m.pkg.funs.get(v.aux as ByteStr) || null)
      m.call(fn)
      // TODO: Figure out how we can know, after a call, to read return value
      // (or not, if the function didn't return anything)
      return
    }

    case Op.Phi: {
      //
      // select value based on how we entered the current block
      //
      // TODO: when we do register allocation (or stack allocation), we no
      // longer need this and Phi nodes should be ignored.
      //
      assert(m.prevblock, 'phi in entry block')
      assert(v.args.length > 0, 'Phi without operands')
      let prevblock = nnil(m.prevblock)
      let b = nnil(m.block)
      let preds = b.preds

      assert(v.args.length >= preds.length,
        'phi with fewer operands than block predecessors')

      let ok = false
      for (let i = 0; i < preds.length; i++) {
        let pred = preds[i]
        if (pred === prevblock) {
          let op = v.args[i].id
          let r = f.regget(op)
          f.regset(v.id, r)
          ok = true
          break
        }
      }
      assert(ok, 'failed to select predecessor value via phi')
      break
    }

    default:
      dlog(`TODO handle Op.${Op[v.op]}`)
      break

    } // switch (v.op)

    m.value = v.nextv
    m.next()
  }
}
