import { readFileSync, writeFileSync, existsSync } from 'fs'
import * as utillib from 'util'
import * as ts from '../../node_modules/typescript/lib/typescript'
import * as Path from 'path'
import { UInt64 } from "../int64"
import { OpInfo } from "../ir/op"
import {
  RegSet,
  RegInfo,
  RegInfoEntry,
  emptyRegSet,
  nilRegInfo,
  fmtRegSet,
} from "../ir/reg"
import { ArchInfo } from "../ir/arch_info"
import { PrimType, StrType, t_str } from '../ast'
import { Op, AuxType } from '../ir/op'
import { ArchDescr, OpDescription, parseOpDescr, t as dtypes } from './describe'
import * as sexpr from "../sexpr"
import arch_generic from "./arch_generic_ops"
import arch_covm from "./arch_covm_ops"
import nummath from "../nummath"

const archs :ArchDescr[] = [
  arch_generic,
  arch_covm,
]

const outDir = Path.dirname(__dirname) + "/ir"
const opsOutFile      = outDir + "/ops.ts"
const opsTemplateFile = __dirname + "/ops_template.ts"

const genericOpnames = new Set<string>(
  arch_generic.ops.map(op => op[0] as string))

let consts = new Map<string,string>() // value => js
let opcodes :string[] = []
let nextOpcode = 0
let ops     :string[] = []
let opnamesPerArch = new Map<ArchDescr,Set<string>>() // names of ops constants
let opinfoMap = new Map<string,OpInfo>() // canonical opname => info
let opcodeMap = new Map<string,int>() // canonical opname => opcode number
let types = new Set<string>() // types we need to import
let outbuf = "" // used by opsGen
let archsWithValueRewriteRules = new Set<ArchDescr>()


function main() {
  opsGen()

  for (let a of archs) {
    ruleGen(a)
  }

  archsGen()
}


function archsGen() {
  let outFile = outDir + "/arch.ts"
  let lines = [] as string[]
  const ln = (s :any) => lines.push(String(s))

  consts.clear()

  for (let a of archs) {
    // note: a is of type ArchDescr which extends ArchInfo
    ln(`[ ${JSON.stringify(a.arch)}, {`)

    for (let k in a) {
      if (k == "ops") {
        continue // not part of ArchInfo
      }
      let v = (a as any)[k]
      if (v instanceof UInt64) {
        ln(`  ${k}: ${fmtRegSetJs(v, "  ")},`)
      } else {
        ln(`  ${k}: ${utillib.inspect(v, false, 4).replace(/\n/g, "\n    ")},`)
      }
    }

    if (archsWithValueRewriteRules.has(a)) {
      ln(`  lowerValue: ${a.arch}_rewriteValue,`)
    }

    ln(`}],`)
  }

  let tscode = (
    `// Generated from arch/arch_* -- do not edit.\n` +
    `// Describes all available architectures.\n` +
    `//\n` +
    `import { UInt64 } from "../int64"\n` +
    `import { ArchInfo } from "./arch_info"\n` +
    Array.from(archsWithValueRewriteRules).map(a =>
      `import { rewriteValue as ${a.arch}_rewriteValue } ` +
      `from "./rewrite_${a.arch}"\n`
    ).join("") +
    `\n` +
    getConstantsCode() +
    `export const archs = new Map<string,ArchInfo>([\n` +
    "  " + lines.join("\n  ") + "\n" +
    `]);\n`
  )

  // print("------------------------------------\n" + tscode)
  print(`write ${rpath(outFile)}`)
  writeFileSync(outFile, tscode, "utf8")
}


function ruleGen(a :ArchDescr) {
  let rulesFile = __dirname + "/arch_" + a.arch + ".rewrite"
  let outFile = outDir + "/rewrite_" + a.arch + ".ts"

  let srcrules = loadRewriteRules(a, rulesFile, outFile)
  if (!srcrules) {
    return
  }

  let rules :RewriteRule[]
  try {
    rules = parseRewriteRules(a, srcrules, rulesFile)
  } catch (err) {
    print(`rules read from ${rpath(rulesFile)}:`, srcrules)
    throw err
  }

  // print("rules:", repr(rules))

  const syntaxError = (msg :string, v? :sexpr.Value) => {
    let line = v instanceof sexpr.List ? v.line : 0
    let col = v instanceof sexpr.List ? v.col : 0
    throw newSyntaxErr(rulesFile, line, col, msg)
  }

  // map opname => list of rules with op as primary match condition
  let matchmap = mapRewriteRules(rules, syntaxError)
  // print("matchmap:", repr(matchmap))

  // ruleFuns is used to ensure we only generate one function for each
  // ruleset. This is needed for unions.
  interface RuleFunInfo {
    code    :string  // TypeScript function code
    opnames :string[]
  }
  let ruleFuns = new Map<RewriteRule,RuleFunInfo>()

  // helper libs
  let helperlibs = {} as {[k:string]:string}

  // generate code for each ruleset
  let maxOpcode = 0
  for (let [opname, rules] of matchmap) {
    let e = ruleFuns.get(rules[0])
    if (e) {
      e.opnames.push(opname)
    } else {
      let code = genRewriteCode(opname, rules, syntaxError, helperlibs)
      ruleFuns.set(rules[0], { code, opnames: [ opname ] })
    }
    let opcode = opcodeMap.get(opname)!
    assert(opcode !== undefined && opcode !== null, `opcodeMap.get ${opname}`)
    maxOpcode = Math.max(maxOpcode, opcode)
  }

  // generate rule function code
  // generate opcode => fun dispatch code
  let mapCode = [] as string[]
  let funCode = [] as string[]
  for (let e of ruleFuns.values()) {
    let funname = "rw_" + e.opnames[0]
    funCode.push(`function ${funname}${e.code}\n`)
    for (let opname of e.opnames) {
      mapCode.push(`rw[ops.${opname}] = ${funname}`)
    }
  }

  let tscode = (
    `// generated from arch/${Path.basename(rulesFile)} -- do not edit.\n` +
    `import { Value } from "./ssa"\n` +
    `import { ValueRewriter } from "./arch_info"\n` +
    `import { ops } from "./ops"\n` +
    `import { types, PrimType } from "../ast"\n` +
    Object.keys(helperlibs).sort().map(
      name => `import ${name} from "${helperlibs[name]}"\n`
    ).join("") +
    `\n` +
    funCode.join("\n") +
    `\n` +
    // `const rw = new Array<ValueRewriter>(${maxOpcode + 1})\n` +
    `const rw = new Array<ValueRewriter>(${mapCode.length})\n` +
    mapCode.join("\n") + "\n" +
    `\n` +
    `export function rewriteValue(v :Value) :bool {\n` +
    `  let f = rw[v.op]\n` +
    `  return f ? f(v) : false\n` +
    `}\n`
  )

  // print("---------------------\n" + tscode)

  print(`write ${rpath(outFile)}`)
  writeFileSync(outFile, tscode, "utf8")

  archsWithValueRewriteRules.add(a)
}


function genRewriteCode(
  opname :string,
  rules :RewriteRule[],
  syntaxError: (msg:string,v?:sexpr.Value)=>void,
  helperlibs: {[k:string]:string},
) :string {
  let lines = [] as string[]
  const ln = (s :any) => lines.push(String(s))

  let lastIsBranch = true
  let lasti = rules.length -1
  for (let i = 0; i <= lasti; i++) {
    let [ruleLines, branches] = genRuleRewriteCode(
      opname,
      rules[i],
      syntaxError,
      helperlibs,
      i == lasti
    )
    lines = lines.concat(ruleLines)
    lastIsBranch = branches
  }

  if (lastIsBranch) {
    // add default return value. false = no rewrite
    ln("return false")
  }

  return `(v :Value) :bool {\n  ${lines.join("\n  ")}\n}`
}


function genRuleRewriteCode(
  opname :string,
  r :RewriteRule,
  syntaxError: (msg:string,v?:sexpr.Value)=>void,
  helperlibs: {[k:string]:string},
  isLastRule :bool,
) :[string[]/*lines*/, bool/*isBranch*/] {
  let lines = [] as string[]
  const ln = (s :any) => lines.push(String(s))

  // write comments representing the input
  ln(`// match: ${r.match}`)
  if (r.cond) { ln(`// cond:  ${r.cond}`) }
  ln(`// sub:   ${r.sub}`)

  let hasAddedBlockVar = false
  const addBlockVar = () => {
    if (!hasAddedBlockVar) {
      lines.unshift('let b = v.b')
      hasAddedBlockVar = true
    }
  }

  // reusable substitution generator
  const genSub = (__ :string) => {
    if (r.sub instanceof sexpr.Sym) {
      if (r.vars.length > 0) {
        // special case: Copy
        assert(r.vars.length == 1) // checked by rule parser
        ln(`${__}v.reset(ops.Copy)`)
        ln(`${__}v.addArg(${r.vars[0]})`)
      } else {
        // simplest case: just swap out operator; don't touch args
        ln(`${__}v.op = ops.${r.sub.value}`)
        // ln(`${__}v.reset(ops.${r.sub.value})`)
      }
      ln(`${__}return true`)
      return
    }
    // complex substitution
    assert(r.sub instanceof sexpr.List)
    let sub = r.sub as sexpr.List

    let vcount = 0
    function visitsub(l :sexpr.List, __ :string, fallbackType :string) :string { // returns own arg code
      let vname = "v" + (vcount++)
      let opname = l[0].toString()
      let opcode = opcodeMap.get(opname) as int
      assert(opcode !== undefined)
      let opinfo = opinfoMap.get(opname) as OpInfo
      assert(opinfo !== undefined)
      let aux = ""
      let auxInt = ""
      let typ = opinfo.type ? `types.${opinfo.type.name}` : fallbackType
      let args = [] as string[]
      for (let i = 1; i < l.length; i++) {
        let v = l[i]
        if (v instanceof sexpr.List) {
          args.push(visitsub(v, __ + "  ", typ))
        } else if (v instanceof sexpr.Pre) {
          if (v.type == "[") { // aux value e.g. [x]
            auxInt = transpileCode(v.value, helperlibs)
          } else if (v.type == "{") { // aux value e.g. [x]
            aux = v.value
          } else if (v.type == "<") { // type value e.g. <x>
            typ = v.value
          } else {
            panic(`unexpected ${v}`)
          }
        } else {
          args.push(v.toString())
        }
      }
      if (args.length > 2) {
        syntaxError(`too many arguments`, l)
      }
      addBlockVar()
      return (
        `\n${__}b.newValue${args.length}(ops.${opname}, ${typ}` +
        (args.length > 0 ? ", " + args.join(", ") : "") +
        `, ${auxInt}, ${aux})`
      )
    }

    ln(`${__}v.reset(ops.${r.sub[0]})`)
    for (let i = 1; i < sub.length; i++) {
      let v = sub[i]
      if (v instanceof sexpr.List) {
        let argVarname = visitsub(v, __ + "    ", "null")
        ln(`${__}v.addArg(${argVarname})`)
      } else if (v instanceof sexpr.Pre) {
        if (v.type == "[") { // auxInt value e.g. [x]
          ln(`${__}v.auxInt = ${transpileCode(v.value, helperlibs)}`)
        } else if (v.type == "{") { // aux value e.g. {x}
          ln(`${__}v.aux = ${v.value}`)
        } else if (v.type == "<") { // type value e.g. <x>
          ln(`${__}v.type = ${v.value}`)
        }
      } else {
        ln(`${__}v.addArg(${v})`)
      }
    }

    ln(`${__}return true`)
  }

  // simple match on just the op -- return early
  if (r.match instanceof sexpr.Sym) {
    if (r.cond) {
      ln(`if (${transpileCode(r.cond, helperlibs)}) {`)
      genSub("  ")
      ln(`}`)
      return [lines, true]
    } else {
      // unconditional without args -- i.e. simple substitution
      genSub("")
      return [lines, false]
    }
  }

  // complex match
  assert(r.match instanceof sexpr.List)
  let match = r.match as sexpr.List

  let hasComplexCond = false
  for (let i = 1; i < match.length; i++) {
    if (match[i] instanceof sexpr.List) {
      // match rule has at least one arg condition
      hasComplexCond = true
      break
    }
  }

  let __ = ""
  let hasSimpleCond = false
  let isBlockScoped = false
  let isWhileLoop = false
  if (hasComplexCond || r.cond || !isLastRule) {
    if (r.cond && !r.condRefVars && !hasComplexCond) {
      // simplified test up front, avoiding loading of vars
      ln(`if (${transpileCode(r.cond, helperlibs)}) {`)
    } else {
      ln(`while (true) {`)
      isWhileLoop = true
    }
    __ = "  "
    isBlockScoped = true
  }

  let vcount = 0

  // submatch
  function visitm(l :sexpr.List, vname :string) { // returns own arg code
    let argidx = 0
    ln(`${__}if (${vname}.op != ops.${l[0]}) { break }`)
    for (let i = 1; i < l.length; i++) {
      let v = l[i]
      if (v instanceof sexpr.List) {
        let vname2 = `v_${vcount++}`
        ln(`${__}let ${vname2} = ${vname}.args[${argidx++}]!;`)
        visitm(v, vname2)
      } else if (v instanceof sexpr.Pre) {
        if (v.type == "[") { // auxInt value e.g. [x]
          ln(`${__}let ${v.value} = ${vname}.auxInt`)
        } else if (v.type == "{") { // aux value e.g. {x}
          ln(`${__}let ${v.value} = ${vname}.aux`)
        } else if (v.type == "<") { // type value e.g. <x>
          ln(`${__}let ${v.value} = ${vname}.type`)
        }
      } else {
        assert(v instanceof sexpr.Sym)
        let s = v as sexpr.Sym
        if (s.value != "_") {
          ln(`${__}let ${s.value} = ${vname}.args[${argidx}]!;`)
        }
        argidx++
      }
    }
  }

  let argidx = 0
  for (let i = 1; i < match.length; i++) {
    let v = match[i]
    if (v instanceof sexpr.List) {
      let vname = `v_${vcount++}`
      ln(`${__}let ${vname} = v.args[${argidx++}]!;`)
      visitm(v, vname)
    } else if (v instanceof sexpr.Pre) {
      if (v.type == "[") { // auxInt value e.g. [x]
        ln(`${__}let ${v.value} = v.auxInt`)
      } else if (v.type == "{") { // aux value e.g. {x}
        ln(`${__}let ${v.value} = v.aux`)
      } else if (v.type == "<") { // type value e.g. <x>
        ln(`${__}let ${v.value} = v.type`)
      }
    } else {
      assert(v instanceof sexpr.Sym)
      let s = v as sexpr.Sym
      if (s.value != "_") {
        ln(`${__}let ${s.value} = v.args[${argidx}]!;`)
      }
      argidx++
    }
  }


  // condition
  if (isWhileLoop && r.cond) {
    ln(`${__}if (!(${transpileCode(r.cond, helperlibs)})) { break }`)
  }
  genSub(__)

  if (isBlockScoped) {
    ln(`}`)
  }

  return [ lines, isBlockScoped ]
}


interface RewriteRule {
  // source syntax:
  //   rules     = rule*
  //   rule      = match [cond] "->" sub
  //   match     = opcode | (opcode sexpr*) | opcode_or | (opcode_or sexpr*)
  //   sub       = opcode | (opcode sexpr*)
  //   cond      = quoted
  //   sexpr     = (opcode sexpr*)
  //             | symbol
  //             | quoted
  //             | "<" type ">"
  //             | "[" auxInt "]"
  //             | "{" aux "}"
  //   type      = symbol
  //   quoted    = "'" <quoted-string> "'"
  //   symbol    = <any non-whitespace character except "()[]{}<>">+
  //   opcode    = symbol
  //   opcode_or = symbol "(" symbol [ "|" symbol ]* ")"
  //
  // `opcode` must be one of the opcodes in the arch's arch_*_ops.ts file
  // or a generic opcode as defined by arch_generic_ops.ts.
  //
  // `opcode_or` is an expansion that represents a logical OR expression
  // of many opcodes. For example, "Add(32|16)" means "Add32 || Add16".
  //
  // `cond` can be "extra conditions" (typescript code) that evaluates
  // to boolean. It may use variables declared in `match`.
  // The variable "v" is predefined to be the value matched by the entire rule.
  //

  matchops    :string[]  // canonical opnames this rule primarily matches on
  match       :sexpr.List|sexpr.Sym
  cond        :string  // TypeScript code
  condRefVars :bool  // true if cond _probably_ refers to vars
  sub         :sexpr.List|sexpr.Sym
  vars        :string[]  // ordered list of uniquely-named variables (also "_")
  // auxIntvar?  :string  // [x]
  // auxvar?     :string  // {x}
  // typevar?    :string  // <x>
}


const nmathFunctions = new Set<string>(
  Object.keys(nummath).filter(k => typeof nummath[k] == "function")
)


// returns [transpiled code, helpers]
function transpileCode(code :string, helpers :{[k:string]:string}) :string {
  let f :ts.SourceFile = ts.createSourceFile(
    "input.ts",
    code,
    ts.ScriptTarget.ESNext,
    /*setParentNodes*/ false, // add "parent" property to nodes
    ts.ScriptKind.TS
  )
  if (f.statements.length > 1) {
    panic(`multiple statements in code ${repr(code)}`)
  }

  let needsNumMath = false

  let transformers :ts.TransformerFactory<ts.Node>[] = [
    (context: ts.TransformationContext) :ts.Transformer<ts.Node> => {
      const visit: ts.Visitor = n => {
        // print(`visit ${ts.SyntaxKind[n.kind]}`)
        if (ts.isBinaryExpression(n)) {
          let fname = ""
          switch (n.operatorToken.kind) {
            case ts.SyntaxKind.PlusToken:      fname = "nmath.add";  break // +
            case ts.SyntaxKind.MinusToken:     fname = "nmath.sub";  break // -
            case ts.SyntaxKind.AsteriskToken:  fname = "nmath.mul";  break // *
            case ts.SyntaxKind.SlashToken:     fname = "nmath.div";  break // /
            case ts.SyntaxKind.PercentToken:   fname = "nmath.mod";  break // %
            case ts.SyntaxKind.AmpersandToken: fname = "nmath.band"; break // &
            case ts.SyntaxKind.BarToken:       fname = "nmath.bor";  break // |
            case ts.SyntaxKind.CaretToken:     fname = "nmath.xor";  break // ^
            case ts.SyntaxKind.AsteriskAsteriskToken:
              // fname = "nmath.exp";  break // **
              panic(`unsupported arithmetic operator ** in ${repr(code)}`)
              break
            case ts.SyntaxKind.LessThanToken:
              fname = "nmath.lt";   break // <
            case ts.SyntaxKind.GreaterThanToken:
              fname = "nmath.gt";   break // >
            case ts.SyntaxKind.LessThanEqualsToken:
              fname = "nmath.lte";  break // <=
            case ts.SyntaxKind.GreaterThanEqualsToken:
              fname = "nmath.gte";  break // >=
            case ts.SyntaxKind.ExclamationEqualsToken:
            case ts.SyntaxKind.ExclamationEqualsEqualsToken:
              fname = "nmath.neq";  break // !=, !==
            case ts.SyntaxKind.EqualsEqualsToken:
            case ts.SyntaxKind.EqualsEqualsEqualsToken:
              fname = "nmath.eq";  break // ==, ===
            case ts.SyntaxKind.LessThanLessThanToken:
              fname = "nmath.lshift";  break // <<
            case ts.SyntaxKind.GreaterThanGreaterThanToken:
              fname = "nmath.rshift";  break // >>
            case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken:
              fname = "nmath.rshiftz";  break // >>>
            // default: print("BinaryExpression", n.operatorToken)
          }
          if (fname != "") {
            needsNumMath = true
            let left = ts.visitNode(n.left, visit)
            let right = ts.visitNode(n.right, visit)
            return ts.createCall(ts.createIdentifier(fname), undefined, [left, right])
          }
        } else if (ts.isPrefixUnaryExpression(n)) {
          let fname = ""
          switch (n.operator) {
            case ts.SyntaxKind.PlusPlusToken:    fname = "nmath.incr"; break // ++
            case ts.SyntaxKind.MinusMinusToken:  fname = "nmath.decr"; break // --
            case ts.SyntaxKind.MinusToken:       fname = "nmath.neg";  break // -
            case ts.SyntaxKind.TildeToken:       fname = "nmath.bnot"; break // ~
            case ts.SyntaxKind.ExclamationToken: fname = "nmath.not";  break // !
          }
          if (fname != "") {
            needsNumMath = true
            let operand = ts.visitNode(n.operand, visit)
            return ts.createCall(ts.createIdentifier(fname), undefined, [operand])
          }
        } else if (ts.isCallExpression(n) && ts.isIdentifier(n.expression)) {
          // remap functions
          let fname = n.expression.escapedText.toString()
          if (nmathFunctions.has(fname)) {
            n.expression = ts.createIdentifier("nmath." + fname)
          }
        }
        return ts.visitEachChild(n, visit, context)
      }
      return node => ts.visitNode(node, visit);
    }
  ]

  let compilerOptions :ts.CompilerOptions = {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ESNext,
  }

  let r = ts.transform(f.statements[0]!, transformers, compilerOptions)

  let printer = ts.createPrinter({
    removeComments: false,
    newLine: ts.NewLineKind.LineFeed,
    omitTrailingSemicolon: true,
    noEmitHelpers: true,
  })
  let outcode = [] as string[]
  for (let n of r.transformed) {
    outcode.push(printer.printNode(ts.EmitHint.Unspecified, n, f))
  }

  if (needsNumMath) {
    helpers["nmath"] = "../nummath"
  }

  return outcode.length > 1 ? "(" + outcode.join(", ") + ")" : outcode[0]
}


function mapRewriteRules(
  rules :RewriteRule[],
  syntaxError: (msg:string,v?:sexpr.Value)=>void,
) :Map<string,RewriteRule[]> {
  let m = new Map<string,RewriteRule[]>() // op => rules with op as 1st
  let matchesWithoutCond = new Set<string>()

  for (let r of rules) {
    let hasComplexCond = false
    if (r.match instanceof sexpr.List) for (let n of r.match) {
      for (let i = 1; i < r.match.length; i++) {
        if (r.match[i] instanceof sexpr.List) {
          // match rule has at least one arg condition
          hasComplexCond = true
          break
        }
      }
    }

    for (let opname of r.matchops) {
      let rules2 = m.get(opname)
      if (!rules2) {
        rules2 = [ r ]
        m.set(opname, rules2)
        if (!r.cond && !hasComplexCond) {
          matchesWithoutCond.add(opname)
        }
      } else {
        if (!r.cond && !hasComplexCond) {
          if (matchesWithoutCond.has(opname)) {
            // case: there are multiple unconditional rules for the same op.
            // e.g.
            //   (Add32 x) -> (ADDW x)
            //   (Add32 x) -> (ADDQ x)
            syntaxError(
              `Duplicate rule matching on ${opname} without condition.`,
              r.match
            )
          }
          matchesWithoutCond.add(opname)
        } else if (matchesWithoutCond.has(opname)) {
          // case: a conditional rule follows an unconditional rule for the
          // same op. e.g.
          //   (Add32 x) -> (ADDW x)
          //   (Add32 x) '&& v.commutative' -> (ADDQ x)
          // Since rules are evaluated in order, conditional rules must
          // preceed unconditional "catch all" rules for an operator.
          syntaxError(
            `Rule is unreachable. An unconditional rule for ${opname} ` +
            `preceeds this rule.`,
            r.match
          )
        }
        rules2.push(r)
      }
    }
  }
  return m
}


// visit lists recursively
function visitListR(list :sexpr.List, visitor :(v:sexpr.Sym|sexpr.Pre|sexpr.Union, parent:sexpr.List)=>void) {
  let visitlists = [ list ] as sexpr.List[]
  let l :sexpr.List|undefined
  while (l = visitlists.pop()) {
    for (let i = 1; i < l.length; i++) {
      let v = l[i]
      if (v instanceof sexpr.List) {
        visitlists.push(v)
      } else {
        visitor(v, l)
      }
    }
  }
}


function parseRewriteRules(a :ArchDescr, srcrules :sexpr.List, rulesFile :string) :RewriteRule[] {
  let rules = [] as RewriteRule[]
  let list = srcrules  // current list, used for src location in error messages

  let archOpnames = opnamesPerArch.get(a)!
  let genericOpnames = opnamesPerArch.get(arch_generic)!
  assert(archOpnames, "no arch opnames")
  assert(genericOpnames, "no generic opnames")

  let opnamePrefix = opcodeNamePrefix(a)

  const syntaxErr = (msg :string, loc? :sexpr.Value) => {
    throw newSyntaxErr(
      rulesFile,
      loc ? loc.line : 0,
      loc ? loc.col : 0,
      msg
    )
  }

  const canonicalizeOp = (opname :sexpr.Sym, list? :sexpr.List) => {
    if (archOpnames.has(opname.value)) {
      opname.value = opnamePrefix + opname.value
    } else if (!genericOpnames.has(opname.value)) {
      syntaxErr(
        `unknown operator ${opname} ` +
        `(not defined by arch_${a.arch}_ops.ts nor a generic op)`,
        opname
      )
    }
  }

  function canonicalizeOpnames<T extends sexpr.List|sexpr.Sym>(v :T, parent? :sexpr.List) {
    if (v instanceof sexpr.List) {
      // first name is expected to be an opname
      let op = v[0]
      if (op instanceof sexpr.Sym) {
        canonicalizeOp(op, v)
      } else if (op instanceof sexpr.Union) {
        for (let i = 0; i < op.length; i++) {
          let val = op[i]
          if (val instanceof sexpr.Sym) {
            canonicalizeOp(val, v)
          } else {
            syntaxErr(`invalid entry ${repr(val)} in op union`, val)
          }
        }
      } else {
        syntaxErr(`expected ${repr(v)} to begin with op`, op)
      }
      // visit other list members of v, e.g. (op1 x (op2 y (op3 z)))
      for (let i = 1; i < v.length; i++) {
        let v2 = v[i]
        if (v2 instanceof sexpr.List) {
          canonicalizeOpnames(v2, v)
        }
      }
    } else if (v instanceof sexpr.Sym) {
      canonicalizeOp(v, parent)
    } else {
      syntaxErr(`expected ${repr(v)} to begin with op`, v)
    }
  }

  let i = 0
  while (i < srcrules.length) {
    // expect match list
    let match = srcrules[i++] as sexpr.List|sexpr.Sym
    let matchops = [] as string[]
    if (!(match instanceof sexpr.List) && !(match instanceof sexpr.Sym)) {
      syntaxErr(`expected a list or symbol but got ${repr(match)}`, match)
    }
    canonicalizeOpnames(match, list)
    let varset = new Set<string>()
    let vars = [] as string[]
    let auxIntvar  :string|undefined = undefined // [x]
    let auxvar     :string|undefined = undefined // {x}
    let typevar    :string|undefined = undefined // <x>

    if (match instanceof sexpr.List) {
      list = match
      let op = match[0]
      while (match.length == 1 && op instanceof sexpr.List) {
        // (Op) => Op
        match = op
      }
      if (op instanceof sexpr.Union) {
        matchops = op.map(s => s.value)
      } else {
        assert(op instanceof sexpr.Sym)
        matchops = [ (op as sexpr.Sym).value ]
      }
      // vars
      visitListR(match as sexpr.List, (v, parent) => {
        if (!(v instanceof sexpr.Sym)) {
          return
        }
        let varname = v.value
        if (varname == "_") {
          varname = ""
        } else {
          if (!varset.has(varname)) {
            varset.add(varname)
          } else {
            syntaxErr(`duplicate variable ${repr(varname)}`, v)
          }
        }
        if (v instanceof sexpr.Pre) {
          if (parent === match) {
            if (v.type == "[") {
              if (auxIntvar) {
                syntaxErr(`secondary auxInt var ${v}`, v)
              }
              auxIntvar = v.value
            } else if (v.type == "{") {
              if (auxvar) {
                syntaxErr(`secondary aux var ${v}`, v)
              }
              auxvar = v.value
            } else if (v.type == "<") {
              if (typevar) {
                syntaxErr(`secondary type var ${v}`, v)
              }
              typevar = v.value
            } else {
              panic(`sexpr.Pre type ${v.type}`)
            }
          }
        } else {
          vars.push(varname)
        }
      })
    } else {
      matchops = [ (match as sexpr.Sym).value ]
    }

    // expect "->" or conditions followed by "->"
    let arrow = srcrules[i++]
    let condval = arrow
    let cond = ""
    if (condval instanceof sexpr.Pre) {
      cond = condval.value
      arrow = srcrules[i++]
    }
    if (!(arrow instanceof sexpr.Sym) || arrow.value != "->") {
      if (cond == "") {
        syntaxErr(`expected -> or quoted condition`)
      } else {
        syntaxErr(`expected ->`)
      }
    }

    // does cond refer to vars?
    let condRefVars = false
    if (cond != "" && varset.size > 0) {
      let scannerErrors = [] as string[]
      // let varset2 = new Set<string>(Array.from(varset).map(s => {
      //   // simplify "special" variables like aux and type
      //   if (s[0] == "[" || s[0] == "{" || s[0] == "<") {
      //     return s.substring(1, s.length-1)
      //   }
      //   return s
      // }))
      condRefVars = tsCodeRefersToIdentifiers(
        cond,
        varset,
        (m: ts.DiagnosticMessage, length: number) => {
          scannerErrors.push(
            ts.flattenDiagnosticMessageText(m.message, "\n") +
            ` (TS${m.code})`
          )
        },
      )
      if (scannerErrors.length > 0) {
        throw newSyntaxErr(
          rulesFile,
          condval.line,
          condval.col,
          scannerErrors.join("\n")
        )
      }
    }

    // expect substitution
    let sub = srcrules[i++] as sexpr.List|sexpr.Sym
    if (!(sub instanceof sexpr.List) && !(sub instanceof sexpr.Sym)) {
      syntaxErr(`expected a list or symbol but got ${repr(sub)}`)
    }
    let nvarsAccountedFor = 0
    if (sub instanceof sexpr.Sym &&
        (sub.value == "_" || varset.has(sub.value)))
    {
      // variable sub. e.g. (TruncI16to8 x) -> x
      nvarsAccountedFor++
    } else {
      canonicalizeOpnames(sub)
      if (sub instanceof sexpr.List) {
        // verify vars
        visitListR(sub, v => {
          if (!(v instanceof sexpr.Sym)) {
            return
          }
          if (v.value == "_") {
            syntaxErr(
              `invalid placeholder variable ${repr(v.value)} in substitution`,
              v
            )
          } else if (varset.has(v.value)) {
            nvarsAccountedFor++
          }
          // else: something else, like types.uint8 or 42
          // else {
          //   syntaxErr(`undefined variable ${repr(v.toString())}`, v)
          // }
        })
      }
    }

    // This check is intentionally disabled since we have no way of telling
    // if variables are used in arbitrary code (sexpr.Pre).
    // if (nvarsAccountedFor < varset.size) {
    //   syntaxErr(
    //     `not all variables are used in substitution. ` +
    //     `Use "_" to skip/discard a variable.`,
    //     sub
    //   )
    // }

    // produce rule
    rules.push({
      matchops,
      match,
      cond,
      condRefVars,
      sub,
      vars,
      // auxIntvar,
      // auxvar,
      // typevar,
    })
  }

  return rules
}


// tsCodeRefersToIdentifiers scans tscode as TypeScript source tokens
// and returns true if any of idents are found as referencing identifiers.
//
function tsCodeRefersToIdentifiers(tscode :string, idents :Set<string>, onerror :ts.ErrorCallback) :bool {
  let s :ts.Scanner = ts.createScanner(
    ts.ScriptTarget.ESNext,
    /*skipTrivia*/ true,
    ts.LanguageVariant.Standard,
    /*textInitial*/ tscode,
    onerror,
    // start?: number,
    // length?: number
  )
  scan_loop: while (true) {
    let t = s.scan()
    switch (t) {
      case ts.SyntaxKind.EndOfFileToken:
      case ts.SyntaxKind.Unknown:
        break scan_loop

      case ts.SyntaxKind.DotToken:
        // skip next
        s.scan()
        break

      case ts.SyntaxKind.Identifier:
        if (idents.has(s.getTokenValue())) {
          return true
        }
        break
    }
  }
  return false
}


function loadRewriteRules(a :ArchDescr, rulesFile :string, outFile :string) :sexpr.List|null {
  try {
    let src = readFileSync(rulesFile, "utf8")
    return sexpr.parse(src, {
      filename: rpath(rulesFile),
      brackAsPre: true, // parse [...] as Pre
      braceAsPre: true, // parse {...} as Pre
      ltgtAsPre: true,  // parse <...> as Pre
    })
  } catch (err) {
    if (err.code == "ENOENT") {
      // print(`${rpath(rulesFile)} not found; skipping arch "${a.arch}"`)
      if (existsSync(outFile)) {
        // there's an existing generated rewrite file.
        // Let the user decide what to do here (i.e. rather than removing it.)
        console.error(
          `old generated file ${repr(outFile)} is lingering. ` +
          `You should remove it or add ${rpath(rulesFile)}`
        )
        process.exit(1)
      }
      return null
    }
    throw err
  }
}


function newSyntaxErr(file :string, line :int, col :int, msg :string) {
  let e = new sexpr.SyntaxError(`${rpath(file)}:${line}:${col}: ${msg}`)
  e.name = "SyntaxError"
  e.file = file
  e.line = line
  e.col = col
  return e
}


function opsGen() {
  buildOpTables()

  let body = outbuf
  let tpl = readFileSync(opsTemplateFile, "utf8")

  // imports
  let imports = (
    'import {\n  ' +
    Array.from(types).sort().join(",\n  ") +
    '\n} from "../ast"\n'
  )

  // glue it all together
  let importsAt = tpl.match(/\/\/\$IMPORTS\n/) as any as {0:string,index:number}
  let bodyStartAt = tpl.match(/\/\/\$BODY_START/) as any as {0:string,index:number}
  let bodyEndAt = tpl.match(/\/\/\$BODY_END/) as any as {0:string,index:number}
  assert(importsAt, "missing //$IMPORTS")
  assert(bodyStartAt, "missing //$BODY_START")
  assert(bodyEndAt, "missing //$BODY_END")
  let importsStart = importsAt.index
  let importsEnd = importsAt.index + importsAt[0].length
  let bodyStart = bodyStartAt.index
  let bodyEnd = bodyEndAt.index + bodyEndAt[0].length
  let tscode = (
    tpl.substr(0, importsStart) +
    imports +
    tpl.substring(importsEnd, bodyStart) +
    getConstantsCode() +
    body +
    tpl.substr(bodyEnd)
  )

  // write file
  print(`write ${rpath(opsOutFile)}`)
  writeFileSync(opsOutFile, tscode, "utf8")
}


function buildOpTables() {
  for (let a of archs) {
    let opnames = buildOpTable(a)
    opnamesPerArch.set(a, opnames)
  }

  opcodes.push("// END")
  opcodes.push("OpcodeMax")

  write(
    "export const ops = {\n  " +
    opcodes.map(name => {
      if (name.startsWith("//")) {
        return "\n  " + name
      }
      return `${name}: ${opcodeMap.get(name)},`
    }).join("\n  ").replace(/\n\s+\n/gm, "\n\n") +
    "\n};\n"
  )
  write("\n")
  write(
    "export const opinfo :OpInfo[] = [\n" +
    ops.join("\n") + "\n]; // ops\n"
  )
  write("\n")
}


function opcodeNamePrefix(a :ArchDescr) :string {
  if (a === arch_generic) {
    return ""
  }
  return a.arch[0].toUpperCase() + a.arch.substr(1)
}


function buildOpTable(a :ArchDescr) :Set<string> {
  let opnames = new Set<string>()
  let opnamePrefix = opcodeNamePrefix(a)

  opcodes.push("// " + a.arch)
  ops.push("\n  // " + a.arch)

  for (let d of a.ops) {
    let op = parseOpDescr(d)

    if (op.type) {
      types.add(typename(op.type))
    }

    let opcode = nextOpcode++

    if (a !== arch_generic && genericOpnames.has(op.name)) {
      // rewrite rules are namespaced by context and thus require that
      // opnames of an arch are not shared with the non-namespaced generic
      // ops.
      throw new Error(
        `opname ${repr(op.name)} of arch ${repr(a.arch)} ` +
        `has the same names as a generic op`
      )
    }

    // add to arch-specific list of local names
    assert(!opnames.has(op.name), `duplicate op ${op.name}`)
    opnames.add(op.name)

    // canonical opname
    const opname = opnamePrefix + op.name

    // add mapping of canonical opname => opinfo
    assert(!opinfoMap.has(opname))
    opinfoMap.set(opname, op)
    opcodeMap.set(opname, opcode)

    // add name to global set of opcodes (used to generate TypeScript code)
    opcodes.push(opname)

    // add name to global set of opinfo (used to generate TypeScript code)
    ops.push(fmtop(op, opcode) + ",")
  }

  return opnames
}


// returns TS code for constant name+values in consts
//
function getConstantsCode() {
  let constants = ""
  let index = 0
  for (let [name, js] of consts) {
    if (constants == "") {
      constants = "const "
    } else {
      constants += ",\n      "
    }
    constants += `${name} = ${js}`
  }
  if (constants) {
    constants += ";\n\n"
  }
  return constants
}


function typename(t :PrimType|StrType) :string {
  if (t.isPrimType()) {
    return "t_" + t.name
  }
  if (t === t_str) {
    return "t_str"
  }
  throw new Error(`invalid type ${t}`)
}


function fmtop(op :OpInfo, opcode :int) :string {
  let s = "  { name: " + js(op.name) + ",\n"
  for (let k of Object.keys(op).sort()) {
    if (k != "name") {
      let v = (op as any)[k]
      if (k == "reg") {
        assert(typeof v == "object")
        v = fmtRegInfo(v as RegInfo)
      } else if (k == "aux") {
        if (typeof v == "string") {
          assert(AuxType[v as string] !== undefined, `no AuxType.${v}`)
          v = "AuxType." + v
        } else {
          let name = AuxType[v as int] as string
          assert(name !== undefined, `no AuxType[${v}]`)
          v = "AuxType." + name
        }
      } else if (v instanceof PrimType || v instanceof StrType) {
        v = typename(v)
      } else {
        v = js(v)
      }
      s += `    ${k}: ${v},\n`
    }
  }
  s += "  }"
  return s
}


function fmtRegInfo(ri :RegInfo) :string {
  if (ri === nilRegInfo) {
    return "nilRegInfo"
  }
  let props :string[][] = [
    [ "inputs",
      ri.inputs.length > 0 ?
      "[\n        " + ri.inputs.map(fmtRegInfoEntry).join(",\n        ") + "\n      ]" :
      "[]"
    ],
    [ "outputs",
      ri.outputs.length > 0 ?
      "[\n        " + ri.outputs.map(fmtRegInfoEntry).join(",\n      ") + "\n      ]" :
      "[]"
    ],
    [ "clobbers", fmtRegSetJs(ri.clobbers, "    ")],
  ]
  return "{\n      " + props.map(([k,v]) => `${k}: ${v}`).join(",\n      ") + "\n    }"
}


function fmtRegInfoEntry(e :RegInfoEntry) :string {
  return `{idx:${e.idx},regs:${fmtRegSetJs(e.regs, "      ")}}`
}


function fmtRegSetJs(u :RegSet, indent :string) :string {
  // Note: RegSet is an alias for UInt64
  if (u === emptyRegSet) {
    assert(emptyRegSet === UInt64.ZERO)
    return "UInt64.ZERO"
  }
  assert(!u.isSigned, "not a UInt64")
  return `${getU64Const(u)} /*RegSet ${fmtRegSet(u)}*/`
}


function getU64Const(u :UInt64) :string {
  let name = "u64_" + u.toString(16)
  let cached = consts.get(name)
  if (!cached) {
    consts.set(name, `new UInt64(${u._low},${u._high})`)
  }
  return name
}


function js(value :any) :string {
  return JSON.stringify(value)
}


function write(s :string) {
  outbuf += s
}


function rpath(path :string) :string {
  return Path.relative(".", path)
}

main()
