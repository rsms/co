/* xlang 1.0.0-debug+193d3b7dfc */
(function(global){

'use strict';

var VERSION = "1.0.0-debug+193d3b7dfc", DEBUG = true;
var global=
void 0!==global?global:
"undefined"!=typeof window?window:
this;


try{
"undefined"!=typeof require&&require("source-map-support").install()}
catch(_){}

function _stackTrace(cons){
const x={stack:""};
if(Error.captureStackTrace){
Error.captureStackTrace(x,cons);
const p=x.stack.indexOf("\n");
if(-1!=p)
return x.stack.substr(p+1)}


return x.stack}










function _parseStackFrame(sf){
let m=/^\s*at\s+([^\s]+)\s+\((?:.+\/(src\/[^\:]+)|([^\:]+))\:(\d+)\:(\d+)\)$/.exec(sf);
return m?
{
func:m[1],
file:m[2]||m[3],
line:parseInt(m[4]),
col:parseInt(m[5])}:


null}


function exit(status){



throw"undefined"!=typeof process&&process.exit(status),"EXIT#"+status}


function panic(msg){
console.error.apply(console,
["panic:",msg].concat(Array.prototype.slice.call(arguments,1))),

console.error(_stackTrace(panic)),
exit(2)}


function assert(){

var cond=arguments[0],
msg=arguments[1],
cons=arguments[2]||assert;
if(!cond){
if(assert.throws||"undefined"==typeof process)























{
var e=new Error("assertion failure: "+(msg||cond));


throw e.name="AssertionError",e.stack=_stackTrace(cons),e}var stack=_stackTrace(cons);console.error("assertion failure:",msg||cond);var sf=_parseStackFrame(stack.substr(0,stack.indexOf("\n")>>>0));if(sf)try{const lines=require("fs").readFileSync(sf.file,"utf8").split(/\n/),line_before=lines[sf.line-2],line=lines[sf.line-1],line_after=lines[sf.line];let context=[" > "+line];"string"==typeof line_before&&context.unshift("   "+line_before),"string"==typeof line_after&&context.push("   "+line_after),console.error(sf.file+":"+sf.line+":"+sf.col),console.error(context.join("\n")+"\n\nStack trace:")}catch(_){}console.error(stack),exit(3)}}





function repr(obj){

try{
return JSON.stringify(obj)}
catch(_){
return String(obj)}}



function TEST(){}

if(
"undefined"!=typeof process&&
(-1!=process.argv.indexOf("-test")||
-1!=process.argv.indexOf("-test-only")))

{
var allTests=global.allTests=global.allTests||[];
TEST=((name,f)=>{
void 0===f&&

(name=(f=name).name||"?");

let e=new Error,srcloc="?";
if(e.stack){
let sf=e.stack.split(/\n/,3)[2],
m=/\s+(?:\(.+\/(src\/.+)\)|at\s+.+\/(src\/.+))$/.exec(sf);
if(m){

var p=(srcloc=m[1]||m[2]).lastIndexOf("/"),
srcfile=-1!=p?srcloc.substr(p+1):srcloc;


-1!=(p=(srcfile=-1!=(p=srcfile.indexOf(":"))?srcfile.substr(0,p):srcfile).indexOf("_test.ts"))?
srcfile=-1!=p?srcfile.substr(0,p):srcfile:
-1!=(p=srcfile.indexOf(".ts"))&&
(srcfile=-1!=p?srcfile.substr(0,p):srcfile),

name=srcfile+"/"+name}}


allTests.push({f,name,srcloc})});

var hasRunAllTests=!1,
runAllTests=function(){
if(hasRunAllTests)
return;

hasRunAllTests=!0;
let throws=assert.throws;
assert.throws=!0;
try{
for(let i=0;i<allTests.length;++i){
let t=allTests[i];
console.log(`[TEST] ${t.name}${t.srcloc?"\t"+t.srcloc:""}`),
t.f()}

assert.throws=throws}
catch(err){

if(assert.throws=throws,throws||"undefined"==typeof process)









throw err;console.error(err.message),err.stack&&(0==err.stack.indexOf("AssertionError:")&&(err.stack=err.stack.split(/\n/).slice(1).join("\n")),console.error(err.stack)),exit(3)}};



global.runAllTests=runAllTests,
"undefined"!=typeof process&&process.nextTick?
process.nextTick(runAllTests):

setTimeout(runAllTests,0)}

class BTree {
    constructor(root) {
        this.root = root;
    }
    get(key) {
        return lookup(key, this.root);
    }
}
function lookup(key, n) {
    while (n) {
        const c = bufcmp(key, n.k);
        if (c == -1) {
            n = n.L;
        }
        else if (c == 1) {
            n = n.R;
        }
        else if (key.length == n.k.length) {
            return n.v;
        }
        else {
            break;
        }
    }
    return null;
}
function bufcmp(a, b) {
    const aL = a.length, bL = b.length, L = (aL < bL ? aL : bL);
    for (let i = 0; i != L; ++i) {
        if (a[i] < b[i]) {
            return -1;
        }
        if (b[i] < a[i]) {
            return 1;
        }
    }
    return (aL < bL ? -1 :
        bL < aL ? 1 :
            0);
}
//# sourceMappingURL=btree.js.map

var prec;
(function (prec) {
    prec[prec["LOWEST"] = 0] = "LOWEST";
    prec[prec["OROR"] = 1] = "OROR";
    prec[prec["ANDAND"] = 2] = "ANDAND";
    prec[prec["CMP"] = 3] = "CMP";
    prec[prec["ADD"] = 4] = "ADD";
    prec[prec["MUL"] = 5] = "MUL";
})(prec || (prec = {}));
var token;
(function (token) {
    token[token["ILLEGAL"] = 0] = "ILLEGAL";
    token[token["EOF"] = 1] = "EOF";
    token[token["COMMENT"] = 2] = "COMMENT";
    token[token["literal_beg"] = 3] = "literal_beg";
    token[token["NAME"] = 4] = "NAME";
    token[token["NAMEAT"] = 5] = "NAMEAT";
    token[token["literal_num_beg"] = 6] = "literal_num_beg";
    token[token["literal_int_beg"] = 7] = "literal_int_beg";
    token[token["CHAR"] = 8] = "CHAR";
    token[token["INT"] = 9] = "INT";
    token[token["INT_BIN"] = 10] = "INT_BIN";
    token[token["INT_OCT"] = 11] = "INT_OCT";
    token[token["INT_HEX"] = 12] = "INT_HEX";
    token[token["literal_int_end"] = 13] = "literal_int_end";
    token[token["FLOAT"] = 14] = "FLOAT";
    token[token["literal_num_end"] = 15] = "literal_num_end";
    token[token["STRING"] = 16] = "STRING";
    token[token["STRING_MULTI"] = 17] = "STRING_MULTI";
    token[token["STRING_PIECE"] = 18] = "STRING_PIECE";
    token[token["literal_end"] = 19] = "literal_end";
    token[token["delim_beg"] = 20] = "delim_beg";
    token[token["LPAREN"] = 21] = "LPAREN";
    token[token["LBRACKET"] = 22] = "LBRACKET";
    token[token["LBRACE"] = 23] = "LBRACE";
    token[token["COMMA"] = 24] = "COMMA";
    token[token["DOT"] = 25] = "DOT";
    token[token["PERIODS"] = 26] = "PERIODS";
    token[token["ELLIPSIS"] = 27] = "ELLIPSIS";
    token[token["RPAREN"] = 28] = "RPAREN";
    token[token["RBRACKET"] = 29] = "RBRACKET";
    token[token["RBRACE"] = 30] = "RBRACE";
    token[token["SEMICOLON"] = 31] = "SEMICOLON";
    token[token["COLON"] = 32] = "COLON";
    token[token["delim_end"] = 33] = "delim_end";
    token[token["operator_beg"] = 34] = "operator_beg";
    token[token["ASSIGN"] = 35] = "ASSIGN";
    token[token["assignop_beg"] = 36] = "assignop_beg";
    token[token["ADD_ASSIGN"] = 37] = "ADD_ASSIGN";
    token[token["SUB_ASSIGN"] = 38] = "SUB_ASSIGN";
    token[token["MUL_ASSIGN"] = 39] = "MUL_ASSIGN";
    token[token["QUO_ASSIGN"] = 40] = "QUO_ASSIGN";
    token[token["REM_ASSIGN"] = 41] = "REM_ASSIGN";
    token[token["AND_ASSIGN"] = 42] = "AND_ASSIGN";
    token[token["OR_ASSIGN"] = 43] = "OR_ASSIGN";
    token[token["XOR_ASSIGN"] = 44] = "XOR_ASSIGN";
    token[token["SHL_ASSIGN"] = 45] = "SHL_ASSIGN";
    token[token["SHR_ASSIGN"] = 46] = "SHR_ASSIGN";
    token[token["AND_NOT_ASSIGN"] = 47] = "AND_NOT_ASSIGN";
    token[token["assignop_end"] = 48] = "assignop_end";
    token[token["INC"] = 49] = "INC";
    token[token["DEC"] = 50] = "DEC";
    token[token["SET_ASSIGN"] = 51] = "SET_ASSIGN";
    token[token["NOT"] = 52] = "NOT";
    token[token["ARROWL"] = 53] = "ARROWL";
    token[token["ARROWR"] = 54] = "ARROWR";
    token[token["cmpop_beg"] = 55] = "cmpop_beg";
    token[token["OROR"] = 56] = "OROR";
    token[token["ANDAND"] = 57] = "ANDAND";
    token[token["EQL"] = 58] = "EQL";
    token[token["NEQ"] = 59] = "NEQ";
    token[token["LSS"] = 60] = "LSS";
    token[token["LEQ"] = 61] = "LEQ";
    token[token["GTR"] = 62] = "GTR";
    token[token["GEQ"] = 63] = "GEQ";
    token[token["cmpop_end"] = 64] = "cmpop_end";
    token[token["ADD"] = 65] = "ADD";
    token[token["SUB"] = 66] = "SUB";
    token[token["OR"] = 67] = "OR";
    token[token["XOR"] = 68] = "XOR";
    token[token["MUL"] = 69] = "MUL";
    token[token["QUO"] = 70] = "QUO";
    token[token["REM"] = 71] = "REM";
    token[token["AND"] = 72] = "AND";
    token[token["AND_NOT"] = 73] = "AND_NOT";
    token[token["SHL"] = 74] = "SHL";
    token[token["SHR"] = 75] = "SHR";
    token[token["operator_end"] = 76] = "operator_end";
    token[token["keyword_beg"] = 77] = "keyword_beg";
    token[token["BREAK"] = 78] = "BREAK";
    token[token["CONTINUE"] = 79] = "CONTINUE";
    token[token["DEFAULT"] = 80] = "DEFAULT";
    token[token["DEFER"] = 81] = "DEFER";
    token[token["ELSE"] = 82] = "ELSE";
    token[token["ENUM"] = 83] = "ENUM";
    token[token["FALLTHROUGH"] = 84] = "FALLTHROUGH";
    token[token["FOR"] = 85] = "FOR";
    token[token["FUN"] = 86] = "FUN";
    token[token["GO"] = 87] = "GO";
    token[token["IF"] = 88] = "IF";
    token[token["IMPORT"] = 89] = "IMPORT";
    token[token["INTERFACE"] = 90] = "INTERFACE";
    token[token["IN"] = 91] = "IN";
    token[token["RETURN"] = 92] = "RETURN";
    token[token["SELECT"] = 93] = "SELECT";
    token[token["SWITCH"] = 94] = "SWITCH";
    token[token["SYMBOL"] = 95] = "SYMBOL";
    token[token["TYPE"] = 96] = "TYPE";
    token[token["WHILE"] = 97] = "WHILE";
    token[token["keyword_end"] = 98] = "keyword_end";
})(token || (token = {}));
const tokenStrings = new Map([
    [token.NAMEAT, "@"],
    [token.ADD, "+"],
    [token.SUB, "-"],
    [token.MUL, "*"],
    [token.QUO, "/"],
    [token.REM, "%"],
    [token.AND, "&"],
    [token.OR, "|"],
    [token.XOR, "^"],
    [token.SHL, "<<"],
    [token.SHR, ">>"],
    [token.AND_NOT, "&^"],
    [token.ADD_ASSIGN, "+="],
    [token.SUB_ASSIGN, "-="],
    [token.MUL_ASSIGN, "*="],
    [token.QUO_ASSIGN, "/="],
    [token.REM_ASSIGN, "%="],
    [token.AND_ASSIGN, "&="],
    [token.OR_ASSIGN, "|="],
    [token.XOR_ASSIGN, "^="],
    [token.SHL_ASSIGN, "<<="],
    [token.SHR_ASSIGN, ">>="],
    [token.AND_NOT_ASSIGN, "&^="],
    [token.ANDAND, "&&"],
    [token.OROR, "||"],
    [token.ARROWL, "<-"],
    [token.ARROWR, "->"],
    [token.INC, "++"],
    [token.DEC, "--"],
    [token.EQL, "=="],
    [token.LSS, "<"],
    [token.GTR, ">"],
    [token.ASSIGN, "="],
    [token.NOT, "!"],
    [token.NEQ, "!="],
    [token.LEQ, "<="],
    [token.GEQ, ">="],
    [token.SET_ASSIGN, ":="],
    [token.ELLIPSIS, "..."],
    [token.PERIODS, ".."],
    [token.LPAREN, "("],
    [token.LBRACKET, "["],
    [token.LBRACE, "{"],
    [token.COMMA, ","],
    [token.DOT, "."],
    [token.RPAREN, ")"],
    [token.RBRACKET, "]"],
    [token.RBRACE, "}"],
    [token.SEMICOLON, ";"],
    [token.COLON, ":"],
]);
for (let i = token.keyword_beg + 1; i < token.keyword_end; ++i) {
    const t = token[i];
    tokenStrings.set(token[t], t.toLowerCase());
}
function tokstr(t) {
    return tokenStrings.get(t) || token[t].toLowerCase();
}
const cdat = new Uint8Array([
    103, 111, 100, 101, 102, 101, 114, 98, 114, 101, 97, 107, 99, 111, 110, 116, 105, 110, 117, 101,
    100, 101, 102, 97, 117, 108, 116, 101, 110, 117, 109, 101, 108, 115, 101, 102, 97, 108, 108,
    116, 104, 114, 111, 117, 103, 104, 102, 111, 114, 102, 117, 110, 114, 101, 116, 117, 114, 110,
    105, 109, 112, 111, 114, 116, 105, 102, 105, 110, 105, 110, 116, 101, 114, 102, 97, 99, 101,
    115, 119, 105, 116, 99, 104, 115, 101, 108, 101, 99, 116, 115, 121, 109, 98, 111, 108, 116,
    121, 112, 101, 119, 104, 105, 108, 101
]);
const keywords = new BTree({ k: cdat.subarray(0, 2), v: token.GO,
    L: { k: cdat.subarray(2, 7), v: token.DEFER,
        L: { k: cdat.subarray(7, 12), v: token.BREAK,
            R: { k: cdat.subarray(12, 20), v: token.CONTINUE,
                R: { k: cdat.subarray(20, 27), v: token.DEFAULT } } },
        R: { k: cdat.subarray(27, 31), v: token.ENUM,
            L: { k: cdat.subarray(31, 35), v: token.ELSE },
            R: { k: cdat.subarray(35, 46), v: token.FALLTHROUGH,
                R: { k: cdat.subarray(46, 49), v: token.FOR,
                    R: { k: cdat.subarray(49, 52), v: token.FUN } } } } },
    R: { k: cdat.subarray(52, 58), v: token.RETURN,
        L: { k: cdat.subarray(58, 64), v: token.IMPORT,
            L: { k: cdat.subarray(64, 66), v: token.IF },
            R: { k: cdat.subarray(66, 68), v: token.IN,
                R: { k: cdat.subarray(68, 77), v: token.INTERFACE } } },
        R: { k: cdat.subarray(77, 83), v: token.SWITCH,
            L: { k: cdat.subarray(83, 89), v: token.SELECT },
            R: { k: cdat.subarray(89, 95), v: token.SYMBOL,
                R: { k: cdat.subarray(95, 99), v: token.TYPE,
                    R: { k: cdat.subarray(99, 104), v: token.WHILE } } } } } });
function lookupKeyword(ident) {
    return keywords.get(ident) || token.NAME;
}
//# sourceMappingURL=token.js.map

const UniError = 0xFFFD;
const UniSelf = 0x80;
const UTFMax = 4;
const maxCp = 0x10FFFF;
const surrogateMin = 0xD800;
const surrogateMax = 0xDFFF;
const rune2Max = 1 << 11 - 1;
function decode(src, offset, r) {
    const b = src[offset];
    if (b < UniSelf) {
        r.c = isNaN(b) ? UniError : b;
        r.w = 1;
    }
    else {
        const end = src.length;
        if ((b >> 5) == 0x6) {
            r.c = offset + 2 > end ? UniError :
                ((b << 6) & 0x7ff) +
                    ((src[++offset]) & 0x3f), r.w = 2;
        }
        else if ((b >> 4) == 0xe) {
            r.c = offset + 3 > end ? UniError :
                ((b << 12) & 0xffff) +
                    ((src[++offset] << 6) & 0xfff) +
                    ((src[++offset]) & 0x3f), r.w = 3;
        }
        else if ((b >> 3) == 0x1e) {
            r.c = offset + 4 > end ? UniError :
                ((b << 18) & 0x1fffff) +
                    ((src[++offset] << 12) & 0x3ffff) +
                    ((src[++offset] << 6) & 0xfff) +
                    (src[++offset] & 0x3f), r.w = 4;
        }
        else {
            return false;
        }
    }
    return true;
}
let decodeToString;
if (typeof TextDecoder != 'undefined') {
    const dec = new TextDecoder('utf-8');
    decodeToString = (src) => dec.decode(src.buffer != undefined ? src :
        new Uint8Array(src));
}
else if (typeof Buffer != 'undefined') {
    decodeToString = (src) => {
        let buf;
        if (src instanceof Buffer) {
            buf = src;
        }
        else if (src.buffer &&
            src.byteOffset !== undefined &&
            src.byteLength !== undefined) {
            buf = Buffer.from(src.buffer, src.byteOffset, src.byteLength);
        }
        else {
            buf = Buffer.allocUnsafe(src.length);
            for (let i = 0; i < src.length; ++i) {
                buf[i] = src[i];
            }
        }
        return buf.toString('utf8');
    };
}
else {
    panic('missing TextDecoder');
}

if (typeof TextEncoder != 'undefined') {
    const enc = new TextEncoder('utf-8');
    
}
else if (typeof Buffer != 'undefined') {
    
}
else {
    panic('missing TextEncoder');
}
function encode(b, offs, cp) {
    if (cp < UniSelf) {
        b[offs] = cp;
        return 1;
    }
    if (cp < 0x800) {
        b[offs] = (cp >> 6) | 0xc0;
        b[++offs] = (cp & 0x3f) | 0x80;
        return 2;
    }
    if (cp > maxCp || (surrogateMin <= cp && cp <= surrogateMax)) {
        cp = UniError;
    }
    if (cp < 0x10000) {
        b[offs] = (cp >> 12) | 0xe0;
        b[++offs] = ((cp >> 6) & 0x3f) | 0x80;
        b[++offs] = (cp & 0x3f) | 0x80;
        return 3;
    }
    b[offs] = (cp >> 18) | 0xf0;
    b[++offs] = ((cp >> 12) & 0x3f) | 0x80;
    b[++offs] = ((cp >> 6) & 0x3f) | 0x80;
    b[++offs] = (cp & 0x3f) | 0x80;
    return 4;
}

function encodeAsString(cp) {
    if (cp < 0 || cp > maxCp) {
        panic(`invalid unicode code point ${cp}`);
    }
    if (cp < 0x10000) {
        return String.fromCharCode(cp);
    }
    cp -= 0x10000;
    return String.fromCharCode((cp >> 10) + surrogateMin, (cp % rune2Max) + 0xDC00);
}
//# sourceMappingURL=utf8.js.map

const MaxRune = 0x10FFFF;
const fmt4 = '0000';
function repr$1(cp) {
    let s = cp.toString(16);
    if (cp <= 0xFFFF) {
        s = fmt4.substr(0, fmt4.length - s.length) + s;
    }
    let str = JSON.stringify(encodeAsString(cp));
    str = str.substr(1, str.length - 2);
    return `U+${s} '${str}'`;
}
function isValid(c) {
    return c >= 0 && c <= MaxRune;
}

function isLetter$1(c) {
    return (0x41 <= c && c <= 0x1E943 && ((0x41 <= c && c <= 0x5A) ||
        (0x61 <= c && c <= 0x7A) ||
        c == 0xB5 ||
        (0xC0 <= c && c <= 0xD6) ||
        (0xD8 <= c && c <= 0xF6) ||
        (0xF8 <= c && c <= 0x1BA) ||
        (0x1BC <= c && c <= 0x1BF) ||
        c == 0x1C4 ||
        (0x1C6 <= c && c <= 0x1C7) ||
        (0x1C9 <= c && c <= 0x1CA) ||
        (0x1CC <= c && c <= 0x1F1) ||
        (0x1F3 <= c && c <= 0x293) ||
        (0x295 <= c && c <= 0x2AF) ||
        (0x370 <= c && c <= 0x373) ||
        (0x376 <= c && c <= 0x377) ||
        (0x37B <= c && c <= 0x37D) ||
        c == 0x37F ||
        c == 0x386 ||
        (0x388 <= c && c <= 0x38A) ||
        c == 0x38C ||
        (0x38E <= c && c <= 0x3A1) ||
        (0x3A3 <= c && c <= 0x3F5) ||
        (0x3F7 <= c && c <= 0x481) ||
        (0x48A <= c && c <= 0x52F) ||
        (0x531 <= c && c <= 0x556) ||
        (0x561 <= c && c <= 0x587) ||
        (0x10A0 <= c && c <= 0x10C5) ||
        c == 0x10C7 ||
        c == 0x10CD ||
        (0x13A0 <= c && c <= 0x13F5) ||
        (0x13F8 <= c && c <= 0x13FD) ||
        (0x1C80 <= c && c <= 0x1C88) ||
        (0x1D00 <= c && c <= 0x1D2B) ||
        (0x1D6B <= c && c <= 0x1D77) ||
        (0x1D79 <= c && c <= 0x1D9A) ||
        (0x1E00 <= c && c <= 0x1F15) ||
        (0x1F18 <= c && c <= 0x1F1D) ||
        (0x1F20 <= c && c <= 0x1F45) ||
        (0x1F48 <= c && c <= 0x1F4D) ||
        (0x1F50 <= c && c <= 0x1F57) ||
        c == 0x1F59 ||
        c == 0x1F5B ||
        c == 0x1F5D ||
        (0x1F5F <= c && c <= 0x1F7D) ||
        (0x1F80 <= c && c <= 0x1F87) ||
        (0x1F90 <= c && c <= 0x1F97) ||
        (0x1FA0 <= c && c <= 0x1FA7) ||
        (0x1FB0 <= c && c <= 0x1FB4) ||
        (0x1FB6 <= c && c <= 0x1FBB) ||
        c == 0x1FBE ||
        (0x1FC2 <= c && c <= 0x1FC4) ||
        (0x1FC6 <= c && c <= 0x1FCB) ||
        (0x1FD0 <= c && c <= 0x1FD3) ||
        (0x1FD6 <= c && c <= 0x1FDB) ||
        (0x1FE0 <= c && c <= 0x1FEC) ||
        (0x1FF2 <= c && c <= 0x1FF4) ||
        (0x1FF6 <= c && c <= 0x1FFB) ||
        c == 0x2102 ||
        c == 0x2107 ||
        (0x210A <= c && c <= 0x2113) ||
        c == 0x2115 ||
        (0x2119 <= c && c <= 0x211D) ||
        c == 0x2124 ||
        c == 0x2126 ||
        c == 0x2128 ||
        (0x212A <= c && c <= 0x212D) ||
        (0x212F <= c && c <= 0x2134) ||
        c == 0x2139 ||
        (0x213C <= c && c <= 0x213F) ||
        (0x2145 <= c && c <= 0x2149) ||
        c == 0x214E ||
        (0x2183 <= c && c <= 0x2184) ||
        (0x2C00 <= c && c <= 0x2C2E) ||
        (0x2C30 <= c && c <= 0x2C5E) ||
        (0x2C60 <= c && c <= 0x2C7B) ||
        (0x2C7E <= c && c <= 0x2CE4) ||
        (0x2CEB <= c && c <= 0x2CEE) ||
        (0x2CF2 <= c && c <= 0x2CF3) ||
        (0x2D00 <= c && c <= 0x2D25) ||
        c == 0x2D27 ||
        c == 0x2D2D ||
        (0xA640 <= c && c <= 0xA66D) ||
        (0xA680 <= c && c <= 0xA69B) ||
        (0xA722 <= c && c <= 0xA76F) ||
        (0xA771 <= c && c <= 0xA787) ||
        (0xA78B <= c && c <= 0xA78E) ||
        (0xA790 <= c && c <= 0xA7AE) ||
        (0xA7B0 <= c && c <= 0xA7B7) ||
        c == 0xA7FA ||
        (0xAB30 <= c && c <= 0xAB5A) ||
        (0xAB60 <= c && c <= 0xAB65) ||
        (0xAB70 <= c && c <= 0xABBF) ||
        (0xFB00 <= c && c <= 0xFB06) ||
        (0xFB13 <= c && c <= 0xFB17) ||
        (0xFF21 <= c && c <= 0xFF3A) ||
        (0xFF41 <= c && c <= 0xFF5A) ||
        (0x10400 <= c && c <= 0x1044F) ||
        (0x104B0 <= c && c <= 0x104D3) ||
        (0x104D8 <= c && c <= 0x104FB) ||
        (0x10C80 <= c && c <= 0x10CB2) ||
        (0x10CC0 <= c && c <= 0x10CF2) ||
        (0x118A0 <= c && c <= 0x118DF) ||
        (0x1D400 <= c && c <= 0x1D454) ||
        (0x1D456 <= c && c <= 0x1D49C) ||
        (0x1D49E <= c && c <= 0x1D49F) ||
        c == 0x1D4A2 ||
        (0x1D4A5 <= c && c <= 0x1D4A6) ||
        (0x1D4A9 <= c && c <= 0x1D4AC) ||
        (0x1D4AE <= c && c <= 0x1D4B9) ||
        c == 0x1D4BB ||
        (0x1D4BD <= c && c <= 0x1D4C3) ||
        (0x1D4C5 <= c && c <= 0x1D505) ||
        (0x1D507 <= c && c <= 0x1D50A) ||
        (0x1D50D <= c && c <= 0x1D514) ||
        (0x1D516 <= c && c <= 0x1D51C) ||
        (0x1D51E <= c && c <= 0x1D539) ||
        (0x1D53B <= c && c <= 0x1D53E) ||
        (0x1D540 <= c && c <= 0x1D544) ||
        c == 0x1D546 ||
        (0x1D54A <= c && c <= 0x1D550) ||
        (0x1D552 <= c && c <= 0x1D6A5) ||
        (0x1D6A8 <= c && c <= 0x1D6C0) ||
        (0x1D6C2 <= c && c <= 0x1D6DA) ||
        (0x1D6DC <= c && c <= 0x1D6FA) ||
        (0x1D6FC <= c && c <= 0x1D714) ||
        (0x1D716 <= c && c <= 0x1D734) ||
        (0x1D736 <= c && c <= 0x1D74E) ||
        (0x1D750 <= c && c <= 0x1D76E) ||
        (0x1D770 <= c && c <= 0x1D788) ||
        (0x1D78A <= c && c <= 0x1D7A8) ||
        (0x1D7AA <= c && c <= 0x1D7C2) ||
        (0x1D7C4 <= c && c <= 0x1D7CB) ||
        (0x1E900 <= c && c <= 0x1E943)));
}
function isDigit$1(c) {
    return (0x30 <= c && c <= 0x1E959 && ((0x30 <= c && c <= 0x39) ||
        (0x660 <= c && c <= 0x669) ||
        (0x6F0 <= c && c <= 0x6F9) ||
        (0x7C0 <= c && c <= 0x7C9) ||
        (0x966 <= c && c <= 0x96F) ||
        (0x9E6 <= c && c <= 0x9EF) ||
        (0xA66 <= c && c <= 0xA6F) ||
        (0xAE6 <= c && c <= 0xAEF) ||
        (0xB66 <= c && c <= 0xB6F) ||
        (0xBE6 <= c && c <= 0xBEF) ||
        (0xC66 <= c && c <= 0xC6F) ||
        (0xCE6 <= c && c <= 0xCEF) ||
        (0xD66 <= c && c <= 0xD6F) ||
        (0xDE6 <= c && c <= 0xDEF) ||
        (0xE50 <= c && c <= 0xE59) ||
        (0xED0 <= c && c <= 0xED9) ||
        (0xF20 <= c && c <= 0xF29) ||
        (0x1040 <= c && c <= 0x1049) ||
        (0x1090 <= c && c <= 0x1099) ||
        (0x17E0 <= c && c <= 0x17E9) ||
        (0x1810 <= c && c <= 0x1819) ||
        (0x1946 <= c && c <= 0x194F) ||
        (0x19D0 <= c && c <= 0x19D9) ||
        (0x1A80 <= c && c <= 0x1A89) ||
        (0x1A90 <= c && c <= 0x1A99) ||
        (0x1B50 <= c && c <= 0x1B59) ||
        (0x1BB0 <= c && c <= 0x1BB9) ||
        (0x1C40 <= c && c <= 0x1C49) ||
        (0x1C50 <= c && c <= 0x1C59) ||
        (0xA620 <= c && c <= 0xA629) ||
        (0xA8D0 <= c && c <= 0xA8D9) ||
        (0xA900 <= c && c <= 0xA909) ||
        (0xA9D0 <= c && c <= 0xA9D9) ||
        (0xA9F0 <= c && c <= 0xA9F9) ||
        (0xAA50 <= c && c <= 0xAA59) ||
        (0xABF0 <= c && c <= 0xABF9) ||
        (0xFF10 <= c && c <= 0xFF19) ||
        (0x104A0 <= c && c <= 0x104A9) ||
        (0x11066 <= c && c <= 0x1106F) ||
        (0x110F0 <= c && c <= 0x110F9) ||
        (0x11136 <= c && c <= 0x1113F) ||
        (0x111D0 <= c && c <= 0x111D9) ||
        (0x112F0 <= c && c <= 0x112F9) ||
        (0x11450 <= c && c <= 0x11459) ||
        (0x114D0 <= c && c <= 0x114D9) ||
        (0x11650 <= c && c <= 0x11659) ||
        (0x116C0 <= c && c <= 0x116C9) ||
        (0x11730 <= c && c <= 0x11739) ||
        (0x118E0 <= c && c <= 0x118E9) ||
        (0x11C50 <= c && c <= 0x11C59) ||
        (0x11D50 <= c && c <= 0x11D59) ||
        (0x16A60 <= c && c <= 0x16A69) ||
        (0x16B50 <= c && c <= 0x16B59) ||
        (0x1D7CE <= c && c <= 0x1D7FF) ||
        (0x1E950 <= c && c <= 0x1E959)));
}

function isEmojiPresentation(c) {
    return (0x231A <= c && c <= 0x1F9E6 && ((0x231A <= c && c <= 0x231B) ||
        (0x23E9 <= c && c <= 0x23EC) ||
        c == 0x23F0 ||
        c == 0x23F3 ||
        (0x25FD <= c && c <= 0x25FE) ||
        (0x2614 <= c && c <= 0x2615) ||
        (0x2648 <= c && c <= 0x2653) ||
        c == 0x267F ||
        c == 0x2693 ||
        c == 0x26A1 ||
        (0x26AA <= c && c <= 0x26AB) ||
        (0x26BD <= c && c <= 0x26BE) ||
        (0x26C4 <= c && c <= 0x26C5) ||
        c == 0x26CE ||
        c == 0x26D4 ||
        c == 0x26EA ||
        (0x26F2 <= c && c <= 0x26F3) ||
        c == 0x26F5 ||
        c == 0x26FA ||
        c == 0x26FD ||
        c == 0x2705 ||
        (0x270A <= c && c <= 0x270B) ||
        c == 0x2728 ||
        c == 0x274C ||
        c == 0x274E ||
        (0x2753 <= c && c <= 0x2755) ||
        c == 0x2757 ||
        (0x2795 <= c && c <= 0x2797) ||
        c == 0x27B0 ||
        c == 0x27BF ||
        (0x2B1B <= c && c <= 0x2B1C) ||
        c == 0x2B50 ||
        c == 0x2B55 ||
        c == 0x1F004 ||
        c == 0x1F0CF ||
        c == 0x1F18E ||
        (0x1F191 <= c && c <= 0x1F19A) ||
        (0x1F1E6 <= c && c <= 0x1F1FF) ||
        c == 0x1F201 ||
        c == 0x1F21A ||
        c == 0x1F22F ||
        (0x1F232 <= c && c <= 0x1F236) ||
        (0x1F238 <= c && c <= 0x1F23A) ||
        (0x1F250 <= c && c <= 0x1F251) ||
        (0x1F300 <= c && c <= 0x1F320) ||
        (0x1F32D <= c && c <= 0x1F335) ||
        (0x1F337 <= c && c <= 0x1F37C) ||
        (0x1F37E <= c && c <= 0x1F393) ||
        (0x1F3A0 <= c && c <= 0x1F3C4) ||
        c == 0x1F3C5 ||
        (0x1F3C6 <= c && c <= 0x1F3CA) ||
        (0x1F3CF <= c && c <= 0x1F3D3) ||
        (0x1F3E0 <= c && c <= 0x1F3F0) ||
        c == 0x1F3F4 ||
        (0x1F3F8 <= c && c <= 0x1F43E) ||
        c == 0x1F440 ||
        (0x1F442 <= c && c <= 0x1F4F7) ||
        c == 0x1F4F8 ||
        (0x1F4F9 <= c && c <= 0x1F4FC) ||
        c == 0x1F4FF ||
        (0x1F500 <= c && c <= 0x1F53D) ||
        (0x1F54B <= c && c <= 0x1F54E) ||
        (0x1F550 <= c && c <= 0x1F567) ||
        c == 0x1F57A ||
        (0x1F595 <= c && c <= 0x1F596) ||
        c == 0x1F5A4 ||
        (0x1F5FB <= c && c <= 0x1F5FF) ||
        c == 0x1F600 ||
        (0x1F601 <= c && c <= 0x1F610) ||
        c == 0x1F611 ||
        (0x1F612 <= c && c <= 0x1F614) ||
        c == 0x1F615 ||
        c == 0x1F616 ||
        c == 0x1F617 ||
        c == 0x1F618 ||
        c == 0x1F619 ||
        c == 0x1F61A ||
        c == 0x1F61B ||
        (0x1F61C <= c && c <= 0x1F61E) ||
        c == 0x1F61F ||
        (0x1F620 <= c && c <= 0x1F62B) ||
        c == 0x1F62C ||
        c == 0x1F62D ||
        (0x1F62E <= c && c <= 0x1F633) ||
        c == 0x1F634 ||
        (0x1F635 <= c && c <= 0x1F64F) ||
        (0x1F680 <= c && c <= 0x1F6C5) ||
        c == 0x1F6CC ||
        c == 0x1F6D0 ||
        (0x1F6D1 <= c && c <= 0x1F6D2) ||
        (0x1F6EB <= c && c <= 0x1F6EC) ||
        (0x1F6F4 <= c && c <= 0x1F6F8) ||
        (0x1F910 <= c && c <= 0x1F91E) ||
        c == 0x1F91F ||
        (0x1F920 <= c && c <= 0x1F92F) ||
        c == 0x1F930 ||
        (0x1F931 <= c && c <= 0x1F93A) ||
        (0x1F93C <= c && c <= 0x1F93E) ||
        (0x1F940 <= c && c <= 0x1F945) ||
        (0x1F947 <= c && c <= 0x1F94B) ||
        c == 0x1F94C ||
        (0x1F950 <= c && c <= 0x1F96B) ||
        (0x1F980 <= c && c <= 0x1F997) ||
        c == 0x1F9C0 ||
        (0x1F9D0 <= c && c <= 0x1F9E6)));
}
function isEmojiModifierBase(c) {
    return (0x261D <= c && c <= 0x1F9DD && (c == 0x261D ||
        c == 0x26F9 ||
        (0x270A <= c && c <= 0x270D) ||
        c == 0x1F385 ||
        (0x1F3C2 <= c && c <= 0x1F3C4) ||
        c == 0x1F3C7 ||
        c == 0x1F3CA ||
        (0x1F3CB <= c && c <= 0x1F3CC) ||
        (0x1F442 <= c && c <= 0x1F443) ||
        (0x1F446 <= c && c <= 0x1F450) ||
        (0x1F466 <= c && c <= 0x1F469) ||
        c == 0x1F46E ||
        (0x1F470 <= c && c <= 0x1F478) ||
        c == 0x1F47C ||
        (0x1F481 <= c && c <= 0x1F483) ||
        (0x1F485 <= c && c <= 0x1F487) ||
        c == 0x1F4AA ||
        (0x1F574 <= c && c <= 0x1F575) ||
        c == 0x1F57A ||
        c == 0x1F590 ||
        (0x1F595 <= c && c <= 0x1F596) ||
        (0x1F645 <= c && c <= 0x1F647) ||
        (0x1F64B <= c && c <= 0x1F64F) ||
        c == 0x1F6A3 ||
        (0x1F6B4 <= c && c <= 0x1F6B6) ||
        c == 0x1F6C0 ||
        c == 0x1F6CC ||
        c == 0x1F918 ||
        (0x1F919 <= c && c <= 0x1F91C) ||
        c == 0x1F91E ||
        c == 0x1F91F ||
        c == 0x1F926 ||
        c == 0x1F930 ||
        (0x1F931 <= c && c <= 0x1F939) ||
        (0x1F93D <= c && c <= 0x1F93E) ||
        (0x1F9D1 <= c && c <= 0x1F9DD)));
}
function isEmojiModifier(c) {
    return ((0x1F3FB <= c && c <= 0x1F3FF));
}
//# sourceMappingURL=unicode.js.map

const TERM = typeof process != 'undefined' && process.env.TERM || '';
function sfn(open, close) {
    open = '\x1b[' + open + 'm';
    close = '\x1b[' + close + 'm';
    return (s) => open + s + close;
}
const termColorSupport = (TERM && ['xterm', 'screen', 'vt100'].some(s => TERM.indexOf(s) != -1) ? (TERM.indexOf('256color') != -1 ? 256 :
    16) : 0);
const passThrough = ((s) => s);
const noStyle = {
    'clear': "",
    'bold': passThrough,
    'italic': passThrough,
    'underline': passThrough,
    'inverse': passThrough,
    'white': passThrough,
    'grey': passThrough,
    'black': passThrough,
    'blue': passThrough,
    'cyan': passThrough,
    'green': passThrough,
    'magenta': passThrough,
    'purple': passThrough,
    'pink': passThrough,
    'red': passThrough,
    'yellow': passThrough,
    'lightyellow': passThrough,
    'orange': passThrough,
};
const style = (termColorSupport == 0 ? noStyle :
    termColorSupport < 256 ? {
        'clear': "\e[0m",
        'bold': sfn('1', '22'),
        'italic': sfn('3', '23'),
        'underline': sfn('4', '24'),
        'inverse': sfn('7', '27'),
        'white': sfn('37', '39'),
        'grey': sfn('90', '39'),
        'black': sfn('30', '39'),
        'blue': sfn('34', '39'),
        'cyan': sfn('36', '39'),
        'green': sfn('32', '39'),
        'magenta': sfn('35', '39'),
        'purple': sfn('35', '39'),
        'pink': sfn('35', '39'),
        'red': sfn('31', '39'),
        'yellow': sfn('33', '39'),
        'lightyellow': sfn('93', '39'),
        'orange': sfn('33', '39'),
    } : {
        'clear': "\e[0m",
        'bold': sfn('1', '22'),
        'italic': sfn('3', '23'),
        'underline': sfn('4', '24'),
        'inverse': sfn('7', '27'),
        'white': sfn('38;2;255;255;255', '39'),
        'grey': sfn('38;5;244', '39'),
        'black': sfn('38;5;16', '39'),
        'blue': sfn('38;5;75', '39'),
        'cyan': sfn('38;5;87', '39'),
        'green': sfn('38;5;84', '39'),
        'magenta': sfn('38;5;213', '39'),
        'purple': sfn('38;5;141', '39'),
        'pink': sfn('38;5;211', '39'),
        'red': sfn('38;2;255;110;80', '39'),
        'yellow': sfn('38;5;227', '39'),
        'lightyellow': sfn('38;5;229', '39'),
        'orange': sfn('38;5;215', '39'),
    });
function streamStyle(w) {
    return termColorSupport && w.isTTY ? style : noStyle;
}
const stdoutStyle = (typeof process != 'undefined' && streamStyle(process.stdout) || noStyle);
const stderrStyle = (typeof process != 'undefined' && streamStyle(process.stderr) || noStyle);
const stdoutSupportsStyle = stdoutStyle !== noStyle;

//# sourceMappingURL=termstyle.js.map

class ErrorReporter {
    constructor(defaultErrCode, errh = null) {
        this.defaultErrCode = defaultErrCode;
        this.errh = errh;
        this.errorCount = 0;
    }
    errorAt(msg, position, code) {
        if (this.errh) {
            this.errh(position, msg, code || this.defaultErrCode);
        }
        this.errorCount++;
        if (DEBUG) {
            if (this.errh) {
                let e = new Error();
                let maxlen = 0, SP = '                              ';
                const S = termColorSupport ? style : noStyle;
                let v = (e.stack || '').split('\n').slice(2).map(s => {
                    let m = /\s+at\s+([^\s]+)\s+\((.+)\)/.exec(s);
                    if (!m) {
                        return [s, null];
                    }
                    let p = m[2].lastIndexOf('/src/');
                    if (p != -1) {
                        m[2] = m[2].substr(p + 1);
                    }
                    maxlen = Math.max(m[1].length, maxlen);
                    return [m[1], m[2]];
                });
                console.error(v.map(s => {
                    if (!s[1]) {
                        return S.italic(String(s[0]));
                    }
                    let f = s[0];
                    return S.grey('  ' + f + SP.substr(0, maxlen - f.length) + '  ' + s[1]);
                }).join('\n'));
            }
        }
    }
}
//# sourceMappingURL=error.js.map

const SL = 0x2F;
const DOT = 0x2E;
function dir(path) {
    if (path.indexOf('/') == -1) {
        return '.';
    }
    path = clean(path);
    let p = path.lastIndexOf('/');
    return (p == -1 ? '.' :
        p == path.length - 1 ? path :
            path.substr(0, p));
}
TEST("dir", () => {
    assert(dir("/a/b/c") == "/a/b");
    assert(dir("a/b/c") == "a/b");
    assert(dir("a/b") == "a");
    assert(dir("/") == "/");
    assert(dir("a") == ".");
    assert(dir("") == ".");
});
class lazybuf {
    constructor(s) {
        this.s = s;
        this.buf = null;
        this.w = 0;
    }
    index(i) {
        return this.buf !== null ? this.buf.charCodeAt(i) : this.s.charCodeAt(i);
    }
    append(c) {
        if (this.buf === null) {
            if (this.w < this.s.length && this.s.charCodeAt(this.w) == c) {
                this.w++;
                return;
            }
            this.buf = this.s.substr(0, this.w);
        }
        if (this.w < this.buf.length - 1) {
            this.buf = this.buf.substr(0, this.w);
        }
        this.buf += String.fromCharCode(c);
        this.w++;
    }
    toString() {
        return (this.buf === null ? this.s.substr(0, this.w) :
            this.buf.substr(0, this.w));
    }
}
function clean(path) {
    if (path == "") {
        return ".";
    }
    const rooted = path.charCodeAt(0) == SL;
    const n = path.length;
    let out = new lazybuf(path);
    let r = 0, dotdot = 0;
    if (rooted) {
        out.append(SL);
        r = 1;
        dotdot = 1;
    }
    while (r < n) {
        const c0 = path.charCodeAt(r);
        if (c0 == SL) {
            r++;
        }
        else if (c0 == DOT && (r + 1 == n || path.charCodeAt(r + 1) == SL)) {
            r++;
        }
        else if (c0 == DOT &&
            path.charCodeAt(r + 1) == DOT &&
            (r + 2 == n || path.charCodeAt(r + 2) == SL)) {
            r += 2;
            if (out.w > dotdot) {
                out.w--;
                while (out.w > dotdot && out.index(out.w) != SL) {
                    out.w--;
                }
            }
            else if (!rooted) {
                if (out.w > 0) {
                    out.append(SL);
                }
                out.append(DOT);
                out.append(DOT);
                dotdot = out.w;
            }
        }
        else {
            if (rooted && out.w != 1 || !rooted && out.w != 0) {
                out.append(SL);
            }
            let c;
            for (; r < n; r++) {
                c = path.charCodeAt(r);
                if (c == SL) {
                    break;
                }
                out.append(c);
            }
        }
    }
    if (out.w == 0) {
        return ".";
    }
    return out.toString();
}
TEST("clean", () => {
    function t(input, expect) {
        const result = clean(input);
        assert(result == expect, `expected ${JSON.stringify(input)} => ${JSON.stringify(expect)}` +
            ` but instead got ${JSON.stringify(result)}`);
    }
    t("a/c", "a/c");
    t("a/c/", "a/c");
    t("/a/c", "/a/c");
    t("a//c", "a/c");
    t("a/c/.", "a/c");
    t("a/c/b/..", "a/c");
    t("/../a/c", "/a/c");
    t("/../a/b/../././/c", "/a/c");
    t("", ".");
    t("/", "/");
});
function isAbs(path) {
    return path.charCodeAt(0) == SL;
}
TEST("isAbs", () => {
    assert(isAbs("/foo/bar") === true);
    assert(isAbs("foo/bar") === false);
});
function join(...paths) {
    let s = '';
    for (let i = 0; i < paths.length; i++) {
        if (paths[i] != '') {
            return clean((i == 0 ? paths : paths.slice(i)).join('/'));
        }
    }
    return s;
}
TEST("join", () => {
    function t(inputs, expect) {
        const result = join.apply(null, inputs);
        assert(result == expect, `expected ${JSON.stringify(inputs)} => ${JSON.stringify(expect)}` +
            ` but instead got ${JSON.stringify(result)}`);
    }
    t(["a", "b", "c"], "a/b/c");
    t(["a", "b/c"], "a/b/c");
    t(["a/b/", "c"], "a/b/c");
    t(["a/b//", "//c"], "a/b/c");
    t(["/a/b//", "//c"], "/a/b/c");
    t(["/a/b//", "//c/"], "/a/b/c");
    t(["", ""], "");
    t(["a", ""], "a");
    t(["", "a"], "a");
});
//# sourceMappingURL=path.js.map

function strtou(b, base, start, end) {
    assert(base >= 2);
    assert(base <= 36);
    var cutoff = Math.floor(Number.MAX_SAFE_INTEGER / base);
    var cutlim = Number.MAX_SAFE_INTEGER % base;
    var acc = 0;
    var i = start, c = 0;
    while (i < end) {
        c = b[i];
        if (c >= 0x30 && c <= 0x39) {
            c -= 0x30;
        }
        else if (c >= 0x41 && c <= 0x5A) {
            c -= 0x41 - 10;
        }
        else if (c >= 0x61 && c <= 0x7A) {
            c -= 0x61 - 10;
        }
        else {
            return -1;
        }
        if (c >= base) {
            return -1;
        }
        if (acc > cutoff || (acc == cutoff && c > cutlim)) {
            return -1;
        }
        else {
            acc = (acc * base) + c;
        }
        i++;
    }
    return acc;
}
TEST("strtou", () => {
    function t(input, base, expect) {
        let buf = Uint8Array.from(input, (_, k) => input.charCodeAt(k));
        let output = strtou(buf, base, 0, buf.length);
        assert(output === expect, `strtou32("${input}", ${base}) => ${output}; expected ${expect}`);
    }
    t("", 10, 0);
    t("0", 10, 0);
    t("000000000000", 10, 0);
    t("1", 10, 1);
    t("00000000000000000000000000000000000000000000000001", 10, 1);
    t("123", 10, 123);
    t("4294967295", 10, 4294967295);
    t(Number.MAX_SAFE_INTEGER.toString(10), 10, Number.MAX_SAFE_INTEGER);
    t((Number.MAX_SAFE_INTEGER + 1).toString(10), 10, -1);
    t("0", 16, 0x0);
    t("FF", 16, 0xFF);
    t("DEADBEEF", 16, 0xDEADBEEF);
    t("deadbeef", 16, 0xdeadbeef);
    t("dEaDbEef", 16, 0xdeadbeef);
    t("0000DEADBEEF", 16, 0xDEADBEEF);
    t("x123", 10, -1);
    t("-123", 10, -1);
});
//# sourceMappingURL=strtou.js.map

var wasm;
try {
    wasm = new WebAssembly.Instance(new WebAssembly.Module(new Uint8Array([
        0, 97, 115, 109, 1, 0, 0, 0, 1, 19, 3, 96, 0, 1, 127, 96, 2, 127, 127, 1, 127, 96, 4, 127, 127,
        127, 127, 1, 127, 3, 8, 7, 0, 1, 2, 2, 2, 2, 2, 6, 6, 1, 127, 1, 65, 0, 11, 7, 59, 7, 8, 103, 101,
        116, 95, 104, 105, 103, 104, 0, 0, 3, 109, 117, 108, 0, 2, 5, 100, 105, 118, 95, 115, 0, 3, 5,
        100, 105, 118, 95, 117, 0, 4, 5, 114, 101, 109, 95, 115, 0, 5, 5, 114, 101, 109, 95, 117, 0, 6,
        6, 112, 111, 112, 99, 110, 116, 0, 1, 10, 218, 1, 7, 4, 0, 35, 0, 11, 16, 1, 1, 126, 32, 0, 173,
        32, 1, 173, 66, 32, 134, 132, 123, 167, 11, 38, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134,
        132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 126, 33, 4, 32, 4, 66, 32, 135, 167, 36, 0, 32, 4,
        167, 11, 38, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32,
        134, 132, 127, 33, 4, 32, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 38, 1, 1, 126, 32, 0, 173,
        32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 128, 33, 4, 32, 4, 66,
        32, 135, 167, 36, 0, 32, 4, 167, 11, 38, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32,
        2, 173, 32, 3, 173, 66, 32, 134, 132, 129, 33, 4, 32, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11,
        38, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134,
        132, 130, 33, 4, 32, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11
    ])), {}).exports;
}
catch (_) {
    wasm = null;
}
const _TWO_PWR_16_DBL = 1 << 16;
const _TWO_PWR_32_DBL = _TWO_PWR_16_DBL * _TWO_PWR_16_DBL;
const _TWO_PWR_64_DBL = _TWO_PWR_32_DBL * _TWO_PWR_32_DBL;
const _TWO_PWR_63_DBL = _TWO_PWR_64_DBL / 2;
class Int64Base {
    constructor(low, high) {
        this._low = low | 0;
        this._high = high | 0;
    }
    eq(x) {
        if (this.constructor !== x.constructor &&
            this._high >>> 31 == 1 &&
            x._high >>> 31 == 1) {
            return false;
        }
        return (this._high == x._high) && (this._low == x._low);
    }
    neq(x) {
        return (this._high != x._high) || (this._low != x._low);
    }
    eqz() {
        return this._high == 0 && this._low == 0;
    }
    lt(x) {
        return this.cmp(x) < 0;
    }
    lte(x) {
        return this.cmp(x) <= 0;
    }
    gt(x) {
        return this.cmp(x) > 0;
    }
    gte(x) {
        return this.cmp(x) >= 0;
    }
    not() {
        return new this.constructor(~this._low, ~this._high);
    }
    mod(x) {
        return this.sub(this.div(x).mul(x));
    }
    and(x) {
        return new this.constructor(this._low & x._low, this._high & x._high);
    }
    or(x) {
        return new this.constructor(this._low | x._low, this._high | x._high);
    }
    xor(x) {
        return new this.constructor(this._low ^ x._low, this._high ^ x._high);
    }
    shl(nbits) {
        nbits &= 63;
        if (nbits == 0) {
            return this;
        }
        let low = this._low;
        if (nbits < 32) {
            return new this.constructor(low << nbits, (this._high << nbits) | (low >>> (32 - nbits)));
        }
        return new this.constructor(0, low << (nbits - 32));
    }
    shr_s(nbits) {
        nbits &= 63;
        if (nbits == 0) {
            return this;
        }
        let high = this._high;
        if (nbits < 32) {
            return new this.constructor((this._low >>> nbits) | (high << (32 - nbits)), high >> nbits);
        }
        return new this.constructor(high >> (nbits - 32), high >= 0 ? 0 : -1);
    }
    shr_u(nbits) {
        nbits &= 63;
        if (nbits === 0) {
            return this;
        }
        let high = this._high;
        if (nbits < 32) {
            return new this.constructor((this._low >>> nbits) | (high << (32 - nbits)), high >>> nbits);
        }
        if (nbits === 32) {
            return new this.constructor(high, 0);
        }
        return new this.constructor(high >>> (nbits - 32), 0);
    }
    add(x) {
        let a48 = this._high >>> 16, a32 = this._high & 0xFFFF, a16 = this._low >>> 16, a00 = this._low & 0xFFFF, b48 = x._high >>> 16, b32 = x._high & 0xFFFF, b16 = x._low >>> 16, b00 = x._low & 0xFFFF, c48 = 0, c32 = 0, c16 = 0, c00 = 0;
        c00 += a00 + b00;
        c16 += c00 >>> 16;
        c00 &= 0xFFFF;
        c16 += a16 + b16;
        c32 += c16 >>> 16;
        c16 &= 0xFFFF;
        c32 += a32 + b32;
        c48 += c32 >>> 16;
        c32 &= 0xFFFF;
        c48 += a48 + b48;
        c48 &= 0xFFFF;
        return new this.constructor((c16 << 16) | c00, (c48 << 16) | c32);
    }
    sub(x) {
        return this.add(x.neg());
    }
    mul(x) {
        let n = this, I = n.constructor;
        if (n.eqz() || x.eqz()) {
            return I.ZERO;
        }
        if (n.eq(I.MIN)) {
            return x.isOdd() ? I.MIN : I.ZERO;
        }
        if (x.eq(I.MIN)) {
            return n.isOdd() ? I.MIN : I.ZERO;
        }
        if (n.isNeg()) {
            if (x.isNeg()) {
                return n.neg().mul(x.neg());
            }
            return n.neg().mul(x).neg();
        }
        if (x.isNeg()) {
            return n.mul(x.neg()).neg();
        }
        if (n.lt(S64_TWO_PWR_24) && x.lt(S64_TWO_PWR_24)) {
            return SInt64.fromFloat64(n.toFloat64() * x.toFloat64());
        }
        let a48 = n._high >>> 16, a32 = n._high & 0xFFFF, a16 = n._low >>> 16, a00 = n._low & 0xFFFF, b48 = x._high >>> 16, b32 = x._high & 0xFFFF, b16 = x._low >>> 16, b00 = x._low & 0xFFFF, c48 = 0, c32 = 0, c16 = 0, c00 = 0;
        c00 += a00 * b00;
        c16 += c00 >>> 16;
        c00 &= 0xFFFF;
        c16 += a16 * b00;
        c32 += c16 >>> 16;
        c16 &= 0xFFFF;
        c16 += a00 * b16;
        c32 += c16 >>> 16;
        c16 &= 0xFFFF;
        c32 += a32 * b00;
        c48 += c32 >>> 16;
        c32 &= 0xFFFF;
        c32 += a16 * b16;
        c48 += c32 >>> 16;
        c32 &= 0xFFFF;
        c32 += a00 * b32;
        c48 += c32 >>> 16;
        c32 &= 0xFFFF;
        c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
        c48 &= 0xFFFF;
        return new I((c16 << 16) | c00, (c48 << 16) | c32);
    }
    popcnt() {
        return popcnt32(this._low) + popcnt32(this._high);
    }
    isOdd() {
        return (this._low & 1) == 1;
    }
    isZero() {
        return this._low == 0 && this._high == 0;
    }
    toUInt32() {
        return (this._low >= 0) ? this._low : _TWO_PWR_32_DBL + this._low;
    }
    toBytesLE() {
        let b = new Uint8Array(8), i = 0;
        b[i] = this._low & 0xff;
        b[++i] = this._low >>> 8 & 0xff;
        b[++i] = this._low >>> 16 & 0xff;
        b[++i] = this._low >>> 24;
        b[++i] = this._high & 0xff;
        b[++i] = this._high >>> 8 & 0xff;
        b[++i] = this._high >>> 16 & 0xff;
        b[++i] = this._high >>> 24;
        return b;
    }
    toBytesBE() {
        let b = new Uint8Array(8), i = 0;
        b[i] = this._high >>> 24;
        b[++i] = this._high >>> 16 & 0xff;
        b[++i] = this._high >>> 8 & 0xff;
        b[++i] = this._high & 0xff;
        b[++i] = this._low >>> 24;
        b[++i] = this._low >>> 16 & 0xff;
        b[++i] = this._low >>> 8 & 0xff;
        b[++i] = this._low & 0xff;
        return b;
    }
}
function popcnt32(n) {
    n = n - ((n >> 1) & 0x55555555);
    n = (n & 0x33333333) + ((n >> 2) & 0x33333333);
    return ((n + (n >> 4) & 0xF0F0F0F) * 0x1010101) >> 24;
}
function fromStr(I, zero, str, radix) {
    if (str.length == 0) {
        throw new Error('empty string');
    }
    if (!radix) {
        radix = 10;
    }
    else if (radix < 2 || 36 < radix) {
        throw new Error('radix out of range');
    }
    if (str.charCodeAt(0) == 0x2D) {
        return fromStr(I, zero, str.substr(1), radix).neg();
    }
    let radixToPower = UInt64.fromFloat64(Math.pow(radix, 8));
    let result = zero;
    for (let i = 0; i < str.length; i += 8) {
        let size = Math.min(8, str.length - i);
        let value = parseInt(str.substring(i, i + size), radix);
        if (size < 8) {
            let power = I.fromFloat64(Math.pow(radix, size));
            result = result.mul(power).add(I.fromFloat64(value));
        }
        else {
            result = result.mul(radixToPower);
            result = result.add(I.fromFloat64(value));
        }
    }
    return result;
}
function fromByteStr0(I, zero, buf, radix, start, end) {
    let radixToPower = I.fromFloat64(Math.pow(radix, 8));
    let result = zero;
    for (let i = start; i < end; i += 8) {
        let size = Math.min(8, end - i);
        let value = strtou(buf, radix, i, i + size);
        if (size < 8) {
            let power = I.fromFloat64(Math.pow(radix, size));
            result = result.mul(power).add(I.fromFloat64(value));
        }
        else {
            result = result.mul(radixToPower);
            result = result.add(I.fromFloat64(value));
        }
    }
    return result;
}
function fromByteStr(I, zero, buf, radix) {
    if (buf.length == 0) {
        throw new Error('empty byte array');
    }
    if (!radix) {
        radix = 10;
    }
    else if (radix < 2 || 36 < radix) {
        throw new Error('radix out of range');
    }
    if (buf[0] == 0x2D) {
        return fromByteStr0(I, zero, buf, radix, 1, buf.length).neg();
    }
    return fromByteStr0(I, zero, buf, radix, 0, buf.length);
}
function toString(n, radix) {
    if (!radix) {
        radix = 10;
    }
    else if (radix < 2 || 36 < radix) {
        throw new Error('radix out of range');
    }
    if (n.eqz()) {
        return '0';
    }
    let radixToPower = UInt64.fromFloat64(Math.pow(radix, 6));
    let rem = n;
    let result = '';
    while (true) {
        let remDiv = rem.div(radixToPower), intval = rem.sub(remDiv.mul(radixToPower)).toInt32() >>> 0, digits = intval.toString(radix);
        rem = remDiv;
        if (rem.eqz()) {
            return digits + result;
        }
        while (digits.length < 6) {
            digits = '0' + digits;
        }
        result = '' + digits + result;
    }
}
class SInt64 extends Int64Base {
    constructor() {
        super(...arguments);
        this.isSigned = true;
    }
    static fromInt32(v) {
        let iv = v | 0;
        assert(Math.round(v) === v, 'value should be a 32-bit integer');
        if (-128 <= iv && iv < 128) {
            let s = _SInt64_cache.get(iv);
            if (!s) {
                s = new SInt64(iv, iv < 0 ? -1 : 0);
                _SInt64_cache.set(iv, s);
            }
            return s;
        }
        return new SInt64(iv, iv < 0 ? -1 : 0);
    }
    static fromFloat64(v) {
        if (isNaN(v)) {
            return S64_ZERO;
        }
        if (v <= -_TWO_PWR_63_DBL) {
            return S64_MIN;
        }
        if (v + 1 >= _TWO_PWR_63_DBL) {
            return S64_MAX;
        }
        if (v < 0) {
            return this.fromFloat64(-v).neg();
        }
        return new SInt64((v % _TWO_PWR_32_DBL) | 0, (v / _TWO_PWR_32_DBL) | 0);
    }
    static maybeFromFloat64(v) {
        if (isNaN(v) || v < -_TWO_PWR_63_DBL || v + 1 > _TWO_PWR_63_DBL) {
            return null;
        }
        if (v == -_TWO_PWR_63_DBL) {
            return S64_MIN;
        }
        if (v + 1 == _TWO_PWR_63_DBL) {
            return S64_MAX;
        }
        if (v < 0) {
            v = -v;
            if (v + 1 >= _TWO_PWR_63_DBL) {
                return null;
            }
            return (new SInt64((v % _TWO_PWR_32_DBL) | 0, (v / _TWO_PWR_32_DBL) | 0)).neg();
        }
        return new SInt64((v % _TWO_PWR_32_DBL) | 0, (v / _TWO_PWR_32_DBL) | 0);
    }
    static fromStr(str, radix) {
        return fromStr(this, S64_ZERO, str, radix);
    }
    static fromByteStr0(buf, radix, start, end) {
        return fromByteStr0(this, S64_ZERO, buf, radix, start, end);
    }
    static fromByteStr(buf, radix) {
        return fromByteStr(this, S64_ZERO, buf, radix);
    }
    static fromBytesLE(b) {
        return new this(b[0] |
            b[1] << 8 |
            b[2] << 16 |
            b[3] << 24, b[4] |
            b[5] << 8 |
            b[6] << 16 |
            b[7] << 24);
    }
    static fromBytesBE(b) {
        return new this(b[4] << 24 |
            b[5] << 16 |
            b[6] << 8 |
            b[7], b[0] << 24 |
            b[1] << 16 |
            b[2] << 8 |
            b[3]);
    }
    isNeg() {
        return this._high < 0;
    }
    isPos() {
        return this._high >= 0;
    }
    cmp(x) {
        if (this.eq(x)) {
            return 0;
        }
        let thisNeg = this.isNeg();
        let xNeg = x.isNeg();
        if (thisNeg && !xNeg) {
            return -1;
        }
        if (!thisNeg && xNeg) {
            return 1;
        }
        return this.sub(x).isNeg() ? -1 : 1;
    }
    neg() {
        return this.eq(S64_MIN) ? S64_MIN : this.not().add(S64_ONE);
    }
    div(x) {
        if (x.eqz()) {
            throw new Error('division by zero');
        }
        if (this.eqz()) {
            return S64_ZERO;
        }
        if (this.eq(S64_MIN)) {
            if (x.eq(S64_ONE) || x.eq(S64_NEGONE)) {
                return S64_MIN;
            }
            if (x.eq(S64_MIN)) {
                return S64_ONE;
            }
            let halfThis = this.shr_s(1);
            let approx = halfThis.div(x).shl(1);
            if (approx.eq(S64_ZERO)) {
                return x.isNeg() ? S64_ONE : S64_NEGONE;
            }
            let rem = this.sub(x.mul(approx));
            let result = approx.add(rem.div(x));
            return result;
        }
        if (x.eq(S64_MIN)) {
            return S64_ZERO;
        }
        if (this.isNeg()) {
            return x.isNeg() ?
                this.neg().div(x.neg()) :
                this.neg().div(x).neg();
        }
        if (x.isNeg()) {
            return this.div(x.neg()).neg();
        }
        let res = S64_ZERO;
        let rem = this;
        while (rem.gte(x)) {
            let approx = Math.max(1, Math.floor(rem.toFloat64() / x.toFloat64()));
            let log2 = Math.ceil(Math.log(approx) / Math.LN2);
            let delta = log2 <= 48 ? 1 : Math.pow(2, log2 - 48);
            let approxRes = SInt64.fromFloat64(approx);
            let approxRem = approxRes.mul(x);
            while (approxRem.isNeg() || approxRem.gt(rem)) {
                approx -= delta;
                approxRes = SInt64.fromFloat64(approx);
                approxRem = approxRes.mul(x);
            }
            if (approxRes.eqz()) {
                approxRes = S64_ONE;
            }
            res = res.add(approxRes);
            rem = rem.sub(approxRem);
        }
        return res;
    }
    shr(nbits) {
        return this.shr_s(nbits);
    }
    toSigned() {
        return this;
    }
    toUnsigned() {
        return new UInt64(this._low, this._high);
    }
    toInt32() {
        return this._low;
    }
    toFloat64() {
        return this._high * _TWO_PWR_32_DBL + (this._low >>> 0);
    }
    toString(radix) {
        if (this.isNeg()) {
            if (!radix) {
                radix = 10;
            }
            if (this.eq(S64_MIN)) {
                let radixLong = SInt64.fromFloat64(radix);
                let div = this.div(radixLong);
                let rem = div.mul(radixLong).sub(this);
                return div.toString(radix) + rem.toInt32().toString(radix);
            }
            return '-' + toString(this.neg(), radix);
        }
        return toString(this, radix);
    }
}
class UInt64 extends Int64Base {
    constructor() {
        super(...arguments);
        this.isSigned = false;
    }
    static fromInt32(v) {
        let u = v >>> 0;
        assert(Math.round(v) === v, 'value should be a 32-bit integer');
        if (0 <= v && v < 256) {
            let s = _UInt64_cache.get(u);
            if (!s) {
                _UInt64_cache.set(u, s = new UInt64(u, 0));
            }
            return s;
        }
        return new UInt64(u | 0, v < 0 ? -1 : 0);
    }
    static fromFloat64(v) {
        if (v <= 0 || isNaN(v)) {
            return U64_ZERO;
        }
        if (v >= _TWO_PWR_64_DBL) {
            return U64_MAX;
        }
        return new UInt64(v % _TWO_PWR_32_DBL, v / _TWO_PWR_32_DBL);
    }
    static maybeFromFloat64(v) {
        if (v < 0 || v > _TWO_PWR_64_DBL || isNaN(v)) {
            return null;
        }
        if (v == 0) {
            return U64_ZERO;
        }
        if (v == _TWO_PWR_64_DBL) {
            return U64_MAX;
        }
        return new UInt64(v % _TWO_PWR_32_DBL, v / _TWO_PWR_32_DBL);
    }
    static fromStr(str, radix) {
        return fromStr(this, U64_ZERO, str, radix);
    }
    static fromByteStr0(buf, radix, start, end) {
        return fromByteStr0(this, U64_ZERO, buf, radix, start, end);
    }
    static fromByteStr(buf, radix) {
        return fromByteStr(this, U64_ZERO, buf, radix);
    }
    static fromBytesLE(_) { return U64_ZERO; }
    static fromBytesBE(_) { return U64_ZERO; }
    isNeg() { return false; }
    isPos() { return true; }
    cmp(x) {
        if (this.eq(x)) {
            return 0;
        }
        if (x.isNeg()) {
            return 1;
        }
        return ((x._high >>> 0) > (this._high >>> 0) ||
            (x._high === this._high && (x._low >>> 0) > (this._low >>> 0))
            ? -1 : 1);
    }
    neg() {
        return this.not().add(S64_ONE);
    }
    div(x) {
        if (x.eqz()) {
            throw new Error('division by zero');
        }
        if (this.eqz()) {
            return U64_ZERO;
        }
        if (x.constructor !== UInt64) {
            x = x.toUnsigned();
        }
        if (x.gt(this)) {
            return U64_ZERO;
        }
        if (x.gt(this.shr_u(1))) {
            return U64_ONE;
        }
        let res = U64_ZERO;
        let rem = this;
        while (rem.gte(x)) {
            let approx = Math.max(1, Math.floor(rem.toFloat64() / x.toFloat64()));
            let log2 = Math.ceil(Math.log(approx) / Math.LN2);
            let delta = log2 <= 48 ? 1 : Math.pow(2, log2 - 48);
            let approxRes = SInt64.fromFloat64(approx);
            let approxRem = approxRes.mul(x);
            while (approxRem.isNeg() || approxRem.gt(rem)) {
                approx -= delta;
                approxRes = UInt64.fromFloat64(approx);
                approxRem = approxRes.mul(x);
            }
            if (approxRes.eqz()) {
                approxRes = S64_ONE;
            }
            res = res.add(approxRes);
            rem = rem.sub(approxRem);
        }
        return res;
    }
    shr(nbits) {
        return this.shr_u(nbits);
    }
    toSigned() {
        return new SInt64(this._low, this._high);
    }
    toUnsigned() {
        return this;
    }
    toInt32() {
        return this._low >>> 0;
    }
    toFloat64() {
        return ((this._high >>> 0) * _TWO_PWR_32_DBL) + (this._low >>> 0);
    }
    toString(radix) {
        return toString(this, radix);
    }
}
UInt64.fromBytesLE = SInt64.fromBytesLE;
UInt64.fromBytesBE = SInt64.fromBytesBE;
if (wasm != null) {
    if (DEBUG) {
        let SInt64x = SInt64.prototype;
        let UInt64x = UInt64.prototype;
        SInt64x._js_mul = SInt64.prototype.mul;
        SInt64x._js_div = SInt64.prototype.div;
        UInt64x._js_div = UInt64.prototype.div;
        SInt64x._js_mod = SInt64.prototype.mod;
        UInt64x._js_mod = UInt64.prototype.mod;
        SInt64x._js_popcnt = Int64Base.prototype.popcnt;
    }
    SInt64.prototype.mul = function mul(m) {
        let low = wasm.mul(this._low, this._high, m._low, m._high);
        return new SInt64(low, wasm.get_high());
    };
    UInt64.prototype.mul = function mul(m) {
        let low = wasm.mul(this._low, this._high, m._low, m._high);
        return new UInt64(low, wasm.get_high());
    };
    SInt64.prototype.div = function div(d) {
        if (this._high === -0x80000000 && d._low === -1 && d._high === -1) {
            return this;
        }
        let low = wasm.div_s(this._low, this._high, d._low, d._high);
        return new SInt64(low, wasm.get_high());
    };
    UInt64.prototype.div = function div(d) {
        let low = wasm.div_u(this._low, this._high, d._low, d._high);
        return new UInt64(low, wasm.get_high());
    };
    SInt64.prototype.mod = function mod(d) {
        let low = wasm.rem_s(this._low, this._high, d._low, d._high);
        return new SInt64(low, wasm.get_high());
    };
    UInt64.prototype.mod = function mod(d) {
        let low = wasm.rem_u(this._low, this._high, d._low, d._high);
        return new UInt64(low, wasm.get_high());
    };
    Int64Base.prototype.popcnt = function popcnt() {
        return wasm.popcnt(this._low, this._high);
    };
}
SInt64.prototype.shr = Int64Base.prototype.shr_s;
UInt64.prototype.shr = Int64Base.prototype.shr_u;
const S64_TWO_PWR_24 = new SInt64((1 << 24) | 0, 0);
const S64_MAX = new SInt64(0xFFFFFFFF | 0, 0x7FFFFFFF | 0);
const S64_MIN = new SInt64(0, 0x80000000 | 0);
const S64_ZERO = new SInt64(0 | 0, 0);
const S64_ONE = new SInt64(1 | 0, 0);
const S64_NEGONE = new SInt64(-1 | 0, -1);
const U64_MAX = new UInt64(0xFFFFFFFF | 0, 0xFFFFFFFF | 0);
const U64_ZERO = new UInt64(0 | 0, 0);
const U64_ONE = new UInt64(1 | 0, 0);
SInt64.MIN = S64_MIN;
SInt64.MAX = S64_MAX;
SInt64.ZERO = S64_ZERO;
SInt64.ONE = S64_ONE;
SInt64.ONENEG = S64_NEGONE;
UInt64.MIN = U64_ZERO;
UInt64.MAX = U64_MAX;
UInt64.ZERO = U64_ZERO;
UInt64.ONE = U64_ONE;
let _SInt64_cache = new Map([
    [-1, S64_NEGONE],
    [0, S64_ZERO],
    [1, S64_ONE],
]);
let _UInt64_cache = new Map([
    [0, U64_ZERO],
    [1, U64_ONE],
]);
function f64ToS32pair(v) {
    if (v <= -_TWO_PWR_63_DBL) {
        return [S64_MIN._low, S64_MIN._high];
    }
    if (v + 1 >= _TWO_PWR_63_DBL) {
        return [S64_MAX._low, S64_MAX._high];
    }
    if (v < 0) {
        v = -v;
        let low = (v % _TWO_PWR_32_DBL) | 0;
        let high = (v / _TWO_PWR_32_DBL) | 0;
        if (high == S64_MIN._high && low == S64_MIN._low) {
            return [S64_MIN._low, S64_MIN._high];
        }
        let n = (new SInt64(~low, ~high)).add(S64_ONE);
        return [n._low, n._high];
    }
    return [
        (v % _TWO_PWR_32_DBL) | 0,
        (v / _TWO_PWR_32_DBL) | 0
    ];
}
//# sourceMappingURL=int64.js.map

const u64MaxByRadix = [
    '', '',
    '1111111111111111111111111111111111111111111111111111111111111111',
    '11112220022122120101211020120210210211220',
    '33333333333333333333333333333333',
    '2214220303114400424121122430',
    '3520522010102100444244423',
    '45012021522523134134601',
    '1777777777777777777777',
    '145808576354216723756',
    '18446744073709551615',
    '335500516a429071284',
    '839365134a2a240713',
    '219505a9511a867b72',
    '8681049adb03db171',
    '2c1d56b648c6cd110',
    'ffffffffffffffff',
    '67979g60f5428010',
    '2d3fgb0b9cg4bd2f',
    '141c8786h1ccaagg',
    'b53bjh07be4dj0f',
    '5e8g4ggg7g56dif',
    '2l4lf104353j8kf',
    '1ddh88h2782i515',
    'l12ee5fn0ji1if',
    'c9c336o0mlb7ef',
    '7b7n2pcniokcgf',
    '4eo8hfam6fllmo',
    '2nc6j26l66rhof',
    '1n3rsh11f098rn',
    '14l9lkmo30o40f',
    'nd075ib45k86f',
    'fvvvvvvvvvvvv',
    'b1w8p7j5q9r6f',
    '7orp63sh4dphh',
    '5g24a25twkwff',
    '3w5e11264sgsf',
];
const _U32_CUTOFF = 0xFFFFFFFF >>> 0;
class IntParser {
    constructor() {
        this.int32val = 0;
        this.int64val = null;
        this._ndigits = 0;
        this._ndigitsChunk = 0;
        this._radix = 10;
        this._signed = false;
        this._neg = false;
        this._s32cutoff = 0 | 0;
    }
    init(radix, signed, negative) {
        assert(signed || (!signed && !negative), 'invalid unsigned and negative');
        this.int32val = 0;
        this.int64val = null;
        this._ndigits = 0;
        this._ndigitsChunk = 0;
        this._radix = radix;
        this._signed = signed;
        this._neg = negative;
        if (signed) {
            this._s32cutoff = negative ? 0x80000000 : 0x7FFFFFFF;
            this.parseval = this.parseval_s32;
        }
        else {
            this.parseval = this.parseval_u32;
        }
    }
    parsedigit(c) {
        let n = 37;
        if (c >= 0x30 && c <= 0x39) {
            n = c - 0x30;
        }
        else if (c >= 0x41 && c <= 0x5A) {
            n = c - (0x41 - 10);
        }
        else if (c >= 0x61 && c <= 0x7A) {
            n = c - (0x61 - 10);
        }
        if (n <= this._radix) {
            return this.parseval(n);
        }
    }
    parseval_s32(n) {
        let p = this;
        let nextval = (p.int32val * p._radix) + n;
        if (nextval > this._s32cutoff) {
            p.int64val = SInt64.fromInt32(p.int32val);
            p.int32val = n;
            p._ndigits = p._ndigitsChunk;
            p._ndigitsChunk = 1;
            p.parseval = p.parseval_s64;
        }
        else {
            p.int32val = nextval;
            p._ndigitsChunk++;
        }
    }
    parseval_s64(n) {
        let p = this;
        let nextval = (p.int32val * p._radix) + n;
        if (nextval > this._s32cutoff) {
            let radixToPower = UInt64.fromFloat64(Math.pow(p._radix, p._ndigitsChunk));
            p.int64val = p.int64val.mul(radixToPower).add(SInt64.fromFloat64(p.int32val));
            p.int32val = n;
            p._ndigits += p._ndigitsChunk;
            p._ndigitsChunk = 1;
            p.parseval = p.parseval_sbig;
        }
        else {
            p.int32val = nextval;
            p._ndigitsChunk++;
        }
    }
    parseval_u32(n) {
        let p = this;
        let nextval = (p.int32val * p._radix) + n;
        if (nextval > _U32_CUTOFF) {
            p.int64val = UInt64.fromInt32(p.int32val);
            p.int32val = n;
            p._ndigits = p._ndigitsChunk;
            p._ndigitsChunk = 1;
            p.parseval = p.parseval_u64;
        }
        else {
            p.int32val = nextval;
            p._ndigitsChunk++;
        }
    }
    parseval_u64(n) {
        let p = this;
        let nextval = (p.int32val * p._radix) + n;
        if (nextval > _U32_CUTOFF) {
            let radixToPower = UInt64.fromFloat64(Math.pow(p._radix, p._ndigitsChunk));
            p.int64val = p.int64val.mul(radixToPower).add(UInt64.fromFloat64(p.int32val));
            p.int32val = n;
            p._ndigits += p._ndigitsChunk;
            p._ndigitsChunk = 1;
            p.parseval = p.parseval_ubig;
        }
        else {
            p.int32val = nextval;
            p._ndigitsChunk++;
        }
    }
    parseval_ubig(_n) {
        this._ndigitsChunk++;
    }
    parseval_sbig(_n) {
        this._ndigitsChunk++;
    }
    overflow() {
        let p = this;
        p.int32val = NaN;
        p.int64val = null;
        return false;
    }
    finalize() {
        let p = this;
        if (!p.int64val) {
            if (p._neg) {
                p.int32val = -p.int32val;
            }
            return true;
        }
        assert(p._ndigitsChunk > 0, 'started int64val but did not read digit');
        let power = UInt64.fromFloat64(Math.pow(p._radix, p._ndigitsChunk));
        if (power._high >= p._radix) {
            return p.overflow();
        }
        if (p._signed) {
            if (p.parseval === p.parseval_sbig) {
                if (p._ndigitsChunk > 1) {
                    return p.overflow();
                }
            }
            else if (p.int64val._high != 0 && p.int32val != 0) {
                return p.overflow();
            }
            let n = p.int64val.mul(power).add(SInt64.fromInt32(p.int32val));
            if (n._high < 0 && (!p._neg || n._low != 0 || n._high != -2147483648)) {
                assert(n.lt(SInt64.ZERO));
                return p.overflow();
            }
            p.int64val = n;
        }
        else {
            let ndigits = p._ndigits + p._ndigitsChunk;
            let maxstr = u64MaxByRadix[p._radix];
            if ((p.parseval === p.parseval_ubig && p._ndigitsChunk > 1) ||
                ndigits > maxstr.length) {
                return p.overflow();
            }
            if (ndigits == maxstr.length && p.int64val._high == 0) {
                let maxstr_low = maxstr.substr(0, p._ndigits);
                let low = p.int64val._low >>> 0;
                if (maxstr_low < low.toString(p._radix)) {
                    return p.overflow();
                }
            }
            p.int64val = p.int64val.mul(power).add(UInt64.fromInt32(p.int32val));
            if (p.int64val._high == 0) {
                return p.overflow();
            }
        }
        p.int32val = NaN;
        if (p._neg) {
            assert(p._signed);
            p.int64val = p.int64val.neg();
        }
        return true;
    }
}
//# sourceMappingURL=intparse.js.map

function search(n, f) {
    let i = 0, j = n;
    while (i < j) {
        const mid = i + (((j - i) / 2) >> 0);
        if (!f(mid)) {
            i = mid + 1;
        }
        else {
            j = mid;
        }
    }
    return i;
}
function bufcopy(bytes, addlSize) {
    const size = bytes.length + addlSize;
    const b2 = new Uint8Array(size);
    b2.set(bytes, 0);
    return b2;
}
function asciibuf(s) {
    return Uint8Array.from(s, (_, k) => s.charCodeAt(k));
}
function asciistr(b) {
    return String.fromCharCode.apply(null, b);
}
var asciistrn = (typeof Buffer == 'function' ?
    function asciistrn(b, start, end) {
        return (new Buffer(b.buffer, b.byteOffset + start, end - start)).toString('ascii');
    } :
    function asciistrn(b, start, end) {
        b = start > 0 && end < b.length ? b.subarray(start, end) : b;
        return String.fromCharCode.apply(null, b);
    });
function bufcmp$1(a, b, aStart = 0, aEnd = a.length, bStart = 0, bEnd = b.length) {
    if (a === b) {
        return 0;
    }
    var ai = aStart, bi = bStart;
    for (; ai != aEnd && bi != bEnd; ++ai, ++bi) {
        if (a[ai] < b[bi]) {
            return -1;
        }
        if (b[bi] < a[ai]) {
            return 1;
        }
    }
    var aL = aEnd - aStart, bL = bEnd - bStart;
    return (aL < bL ? -1 :
        bL < aL ? 1 :
            0);
}

class AppendBuffer {
    constructor(size) {
        this.length = 0;
        this.buffer = new Uint8Array(size);
    }
    reset() {
        this.length = 0;
    }
    reserve(addlSize) {
        if (this.length + addlSize >= this.buffer.length) {
            this._grow(addlSize);
        }
    }
    subarray() {
        return this.buffer.subarray(0, this.length);
    }
    append(b) {
        if (this.length >= this.buffer.length) {
            this._grow();
        }
        this.buffer[this.length++] = b;
    }
    appendRange(src, srcStart, srcEnd) {
        const end = (srcEnd === undefined) ? src.length : srcEnd;
        const size = end - srcStart;
        if (this.length + size >= this.buffer.length) {
            this._grow(size);
        }
        this.buffer.set(src.subarray(srcStart, srcEnd), this.length);
        this.length += size;
    }
    _grow(minAddlSize = 8) {
        this.buffer = bufcopy(this.buffer, Math.min(minAddlSize, this.buffer.length));
    }
}
const debuglog = DEBUG ? function (...v) {
    let e = new Error();
    let prefix = '';
    if (e.stack) {
        let m = /\s*at\s+(?:[^\s]+\.|)([^\s\.]+)\s+\(.+\/src\/(.+)\)/.exec(e.stack.split(/\n/, 3)[2]);
        if (m) {
            const fun = m[1];
            const origin = m[2];
            if (origin) {
                const filename = origin.split('.ts:', 1)[0];
                const trmsg = String(v[0]);
                if (trmsg.indexOf('TODO:') == 0 || trmsg.indexOf('TODO ') == 0) {
                    prefix = 'TODO src/' + origin + ' ' + fun + '>';
                    v[0] = trmsg.substr(5).replace(/^\s*/, '');
                }
                else {
                    prefix = filename + '/' + fun + '>';
                }
            }
            else {
                prefix = fun + '>';
            }
        }
        else {
            prefix = 'DEBUG>';
        }
    }
    v.splice(0, 0, prefix);
    console.log.apply(console, v);
} : function (..._) { };

//# sourceMappingURL=util.js.map

var Mode;
(function (Mode) {
    Mode[Mode["None"] = 0] = "None";
    Mode[Mode["ScanComments"] = 1] = "ScanComments";
    Mode[Mode["CopySource"] = 2] = "CopySource";
})(Mode || (Mode = {}));
const linePrefix = asciibuf('//!line ');
var istrOne;
(function (istrOne) {
    istrOne[istrOne["OFF"] = 0] = "OFF";
    istrOne[istrOne["WAIT"] = 1] = "WAIT";
    istrOne[istrOne["CONT"] = 2] = "CONT";
})(istrOne || (istrOne = {}));
class Scanner extends ErrorReporter {
    constructor() {
        super('E_SYNTAX');
        this.sfile = undefined;
        this.sdata = undefined;
        this.dir = '';
        this.mode = 0;
        this.ch = -1;
        this.offset = 0;
        this.rdOffset = 0;
        this.lineOffset = 0;
        this.insertSemi = false;
        this.parenL = 0;
        this.interpStrL = 0;
        this.istrOne = istrOne.OFF;
        this.byteval = null;
        this.intParser = new IntParser();
        this.pos = 0;
        this.startoffs = 0;
        this.endoffs = 0;
        this.tok = token.EOF;
        this.prec = prec.LOWEST;
        this.hash = 0;
        this.int32val = 0;
        this.int64val = null;
        this.floatval = +0.0;
        this.appendbuf = null;
        this.errorCount = 0;
        this._r = { c: 0, w: 0 };
    }
    init(sfile, sdata, errh, mode = Mode.None) {
        const s = this;
        if (sfile.size != sdata.length) {
            panic(`file size (${sfile.size}) ` +
                `does not match source size (${sdata.length})`);
        }
        s.sfile = sfile;
        s.dir = dir(sfile.name);
        s.sdata = sdata;
        s.errh = errh || null;
        s.mode = mode;
        s.ch = 0x20;
        s.tok = token.EOF;
        s.offset = 0;
        s.rdOffset = 0;
        s.lineOffset = 0;
        s.insertSemi = false;
        s.errorCount = 0;
        s.parenL = 0;
        s.interpStrL = 0;
        s.byteval = null;
        s.readchar();
    }
    setOffset(offs) {
        const s = this;
        s.offset = s.rdOffset = offs;
    }
    readchar() {
        const s = this;
        if (s.rdOffset < s.sdata.length) {
            s.offset = s.rdOffset;
            if (s.ch == 0xA) {
                s.lineOffset = s.offset;
                s.sfile.addLine(s.offset);
            }
            s._r.w = 1;
            s._r.c = s.sdata[s.rdOffset];
            if (s._r.c >= 0x80) {
                if (!decode(s.sdata, s.rdOffset, s._r)) {
                    s.errorAtOffs('invalid UTF-8 encoding', s.offset);
                }
                else if (s._r.c == 0) {
                    s.errorAtOffs('illegal NUL byte in input', s.offset);
                }
            }
            s.rdOffset += s._r.w;
            s.ch = s._r.c;
        }
        else {
            s.offset = s.sdata.length;
            if (s.ch == 0xA) {
                s.lineOffset = s.offset;
                s.sfile.addLine(s.offset);
            }
            s.ch = -1;
        }
    }
    undobyte() {
        const s = this;
        assert(s.ch < 0x80);
        s.rdOffset -= 1;
        s.offset -= 1;
        s.endoffs = s.offset;
    }
    gotchar(ch) {
        const s = this;
        if (s.ch == ch) {
            s.readchar();
            return true;
        }
        return false;
    }
    currentPosition() {
        const s = this;
        return s.sfile.position(s.sfile.pos(s.offset));
    }
    byteValue() {
        const s = this;
        const end = s.endoffs == -1 ? s.offset : s.endoffs;
        return s.byteval || s.sdata.subarray(s.startoffs, end);
    }
    takeByteValue() {
        const s = this;
        const b = s.byteValue();
        s.byteval = null;
        return (this.mode & Mode.CopySource) ? b.slice() : b;
    }
    error(msg, pos = this.pos, code) {
        const s = this;
        s.errorAt(msg, s.sfile.position(pos), code);
    }
    errorAtOffs(msg, offs, code) {
        const s = this;
        s.errorAt(msg, s.sfile.position(s.sfile.pos(offs)), code);
    }
    next() {
        while (true) {
            const s = this;
            if (s.istrOne == istrOne.OFF) {
                while (s.ch == 0x20 ||
                    s.ch == 0x9 ||
                    (s.ch == 0xA && !s.insertSemi) ||
                    s.ch == 0xD) {
                    s.readchar();
                }
            }
            s.pos = s.sfile.pos(s.offset);
            s.startoffs = s.offset;
            s.endoffs = -1;
            s.byteval = null;
            if (s.istrOne == istrOne.CONT) {
                s.istrOne = istrOne.OFF;
                s.startoffs--;
                s.tok = s.scanString();
                s.insertSemi = s.tok != token.STRING_PIECE;
                return;
            }
            else if (s.istrOne == istrOne.WAIT) {
                s.istrOne = istrOne.CONT;
            }
            let ch = s.ch;
            s.readchar();
            let insertSemi = false;
            switch (ch) {
                case -1: {
                    s.tok = s.insertSemi ? token.SEMICOLON : token.EOF;
                    break;
                }
                case 0x30:
                case 0x31:
                case 0x32:
                case 0x33:
                case 0x34:
                case 0x35:
                case 0x36:
                case 0x37:
                case 0x38:
                case 0x39:
                    s.scanNumber(ch, 0);
                    insertSemi = true;
                    break;
                case 0xA: {
                    s.tok = token.SEMICOLON;
                    break;
                }
                case 0x22:
                    s.tok = s.scanString();
                    insertSemi = s.tok != token.STRING_PIECE;
                    break;
                case 0x27:
                    s.scanChar();
                    insertSemi = true;
                    break;
                case 0x3a:
                    if (s.gotchar(0x3D)) {
                        s.tok = token.SET_ASSIGN;
                        s.prec = prec.LOWEST;
                    }
                    else {
                        s.tok = token.COLON;
                    }
                    break;
                case 0x2e: {
                    if (isDigit(s.ch) &&
                        s.tok != token.NAME &&
                        s.tok != token.RPAREN &&
                        s.tok != token.RBRACKET) {
                        s.scanFloatNumber(true, 0);
                        insertSemi = true;
                    }
                    else {
                        if (s.gotchar(0x2e)) {
                            if (s.gotchar(0x2e)) {
                                s.tok = token.ELLIPSIS;
                            }
                            else {
                                s.tok = token.PERIODS;
                            }
                        }
                        else {
                            s.tok = token.DOT;
                        }
                    }
                    break;
                }
                case 0x40: {
                    s.startoffs++;
                    let c = s.ch;
                    if (c < UniSelf && (asciiFeats[c] & langIdentStart)) {
                        s.readchar();
                        s.scanIdentifier(c);
                    }
                    else if (c >= UniSelf && isUniIdentStart(c)) {
                        s.readchar();
                        s.scanIdentifierU(c, this.startoffs);
                    }
                    s.tok = token.NAMEAT;
                    insertSemi = true;
                    break;
                }
                case 0x2c:
                    s.tok = token.COMMA;
                    break;
                case 0x3b:
                    s.tok = token.SEMICOLON;
                    break;
                case 0x28:
                    if (s.interpStrL) {
                        s.parenL++;
                    }
                    s.tok = token.LPAREN;
                    break;
                case 0x29:
                    s.tok = token.RPAREN;
                    insertSemi = true;
                    if (s.interpStrL) {
                        if (s.parenL == 0) {
                            s.interpStrL--;
                            s.tok = s.scanString();
                            insertSemi = s.tok != token.STRING_PIECE;
                        }
                        else {
                            s.parenL--;
                        }
                    }
                    break;
                case 0x5b:
                    s.tok = token.LBRACKET;
                    break;
                case 0x5d:
                    s.tok = token.RBRACKET;
                    insertSemi = true;
                    break;
                case 0x7b:
                    s.tok = token.LBRACE;
                    break;
                case 0x7d:
                    s.tok = token.RBRACE;
                    insertSemi = true;
                    break;
                case 0x2B: {
                    s.prec = prec.LOWEST;
                    if (s.gotchar(0x3D)) {
                        s.tok = token.ADD_ASSIGN;
                    }
                    else if (s.gotchar(ch)) {
                        s.tok = token.INC;
                        insertSemi = true;
                    }
                    else if (s.ch >= 0x30 && s.ch <= 0x39) {
                        ch = s.ch;
                        s.readchar();
                        s.scanNumber(ch, 0x2B);
                        insertSemi = true;
                    }
                    else if (s.gotchar(0x2e)) {
                        s.scanFloatNumber(true, 0x2B);
                        insertSemi = true;
                    }
                    else {
                        s.tok = token.ADD;
                        s.prec = prec.ADD;
                    }
                    break;
                }
                case 0x2D: {
                    s.prec = prec.LOWEST;
                    if (s.gotchar(0x3e)) {
                        s.tok = token.ARROWR;
                    }
                    else if (s.gotchar(0x3D)) {
                        s.tok = token.SUB_ASSIGN;
                    }
                    else if (s.gotchar(ch)) {
                        s.tok = token.DEC;
                        insertSemi = true;
                    }
                    else if (s.ch >= 0x30 && s.ch <= 0x39) {
                        ch = s.ch;
                        s.readchar();
                        s.scanNumber(ch, 0x2D);
                        insertSemi = true;
                    }
                    else if (s.gotchar(0x2e)) {
                        s.scanFloatNumber(true, 0x2D);
                        insertSemi = true;
                    }
                    else {
                        s.tok = token.SUB;
                        s.prec = prec.ADD;
                    }
                    break;
                }
                case 0x2a:
                    if (s.gotchar(0x3D)) {
                        s.tok = token.MUL_ASSIGN;
                        s.prec = prec.LOWEST;
                    }
                    else {
                        s.tok = token.MUL;
                        s.prec = prec.MUL;
                    }
                    break;
                case 0x2f: {
                    if (s.ch == 0x2f) {
                        s.scanLineComment();
                        if (!(s.mode & Mode.ScanComments)) {
                            continue;
                        }
                        insertSemi = s.insertSemi;
                    }
                    else if (s.ch == 0x2a) {
                        const CRcount = s.scanGeneralComment();
                        if (s.mode & Mode.ScanComments) {
                            s.tok = token.COMMENT;
                            if (CRcount) {
                                const v = s.sdata.subarray(s.startoffs, s.endoffs == -1 ? s.offset : s.endoffs);
                                s.byteval = stripByte(v, 0xD, CRcount);
                            }
                        }
                        else {
                            continue;
                        }
                        insertSemi = s.insertSemi;
                    }
                    else {
                        if (s.gotchar(0x3D)) {
                            s.tok = token.QUO_ASSIGN;
                            s.prec = prec.LOWEST;
                        }
                        else {
                            s.tok = token.QUO;
                            s.prec = prec.MUL;
                        }
                    }
                    break;
                }
                case 0x25:
                    if (s.gotchar(0x3D)) {
                        s.tok = token.REM_ASSIGN;
                        s.prec = prec.LOWEST;
                    }
                    else {
                        s.tok = token.REM;
                        s.prec = prec.MUL;
                    }
                    break;
                case 0x5e:
                    if (s.gotchar(0x3D)) {
                        s.tok = token.XOR_ASSIGN;
                        s.prec = prec.LOWEST;
                    }
                    else {
                        s.tok = token.XOR;
                        s.prec = prec.ADD;
                    }
                    break;
                case 0x3c: {
                    if (s.gotchar(0x2D)) {
                        s.tok = token.ARROWL;
                        s.prec = prec.LOWEST;
                    }
                    else if (s.gotchar(0x3D)) {
                        s.tok = token.LEQ;
                        s.prec = prec.CMP;
                    }
                    else if (s.gotchar(ch)) {
                        if (s.gotchar(0x3D)) {
                            s.tok = token.SHL_ASSIGN;
                            s.prec = prec.LOWEST;
                        }
                        else {
                            s.tok = token.SHL;
                            s.prec = prec.MUL;
                        }
                    }
                    else {
                        s.tok = token.LSS;
                        s.prec = prec.CMP;
                    }
                    break;
                }
                case 0x3E:
                    if (s.gotchar(0x3D)) {
                        s.tok = token.GEQ;
                        s.prec = prec.CMP;
                    }
                    else if (s.gotchar(ch)) {
                        if (s.gotchar(0x3D)) {
                            s.tok = token.SHR_ASSIGN;
                            s.prec = prec.LOWEST;
                        }
                        else {
                            s.tok = token.SHR;
                            s.prec = prec.MUL;
                        }
                    }
                    else {
                        s.tok = token.GTR;
                        s.prec = prec.CMP;
                    }
                    break;
                case 0x3D:
                    if (s.gotchar(0x3D)) {
                        s.tok = token.EQL;
                        s.prec = prec.CMP;
                    }
                    else {
                        s.tok = token.ASSIGN;
                        s.prec = prec.LOWEST;
                    }
                    break;
                case 0x21:
                    if (s.gotchar(0x3D)) {
                        s.tok = token.NEQ;
                        s.prec = prec.CMP;
                    }
                    else {
                        s.tok = token.NOT;
                        s.prec = prec.LOWEST;
                    }
                    break;
                case 0x26: {
                    if (s.gotchar(0x5E)) {
                        if (s.gotchar(0x3D)) {
                            s.tok = token.AND_NOT_ASSIGN;
                            s.prec = prec.LOWEST;
                        }
                        else {
                            s.tok = token.AND_NOT;
                            s.prec = prec.MUL;
                        }
                    }
                    else if (s.gotchar(0x3D)) {
                        s.tok = token.AND_ASSIGN;
                        s.prec = prec.LOWEST;
                    }
                    else if (s.gotchar(ch)) {
                        s.tok = token.ANDAND;
                        s.prec = prec.ANDAND;
                    }
                    else {
                        s.tok = token.AND;
                        s.prec = prec.MUL;
                    }
                    break;
                }
                case 0x7c:
                    if (s.gotchar(0x3D)) {
                        s.tok = token.OR_ASSIGN;
                        s.prec = prec.LOWEST;
                    }
                    else if (s.gotchar(ch)) {
                        s.tok = token.OROR;
                        s.prec = prec.OROR;
                    }
                    else {
                        s.tok = token.OR;
                        s.prec = prec.ADD;
                    }
                    break;
                default: {
                    if ((ch < UniSelf && (asciiFeats[ch] & langIdentStart)) ||
                        (ch >= UniSelf && isUniIdentStart(ch))) {
                        if (ch < UniSelf) {
                            s.scanIdentifier(ch);
                        }
                        else {
                            s.scanIdentifierU(ch, this.startoffs);
                        }
                        if (s.offset - s.startoffs > 1) {
                            switch (s.tok = lookupKeyword(s.byteValue())) {
                                case token.NAME:
                                case token.BREAK:
                                case token.CONTINUE:
                                case token.FALLTHROUGH:
                                case token.RETURN:
                                    insertSemi = true;
                                    break;
                            }
                        }
                        else {
                            s.tok = token.NAME;
                            insertSemi = true;
                        }
                    }
                    else {
                        s.error(`unexpected character ${repr$1(ch)} in input`);
                        s.tok = token.ILLEGAL;
                    }
                    break;
                }
            }
            if (s.endoffs == -1) {
                s.endoffs = s.offset;
            }
            s.insertSemi = insertSemi;
            return;
        }
    }
    scanIdentifierU(c, hashOffs, hash = 0x811c9dc5) {
        const s = this;
        const ZeroWidthJoiner = 0x200D;
        let lastCp = c;
        c = s.ch;
        while (isUniIdentCont(c) ||
            isEmojiModifier(c) ||
            isEmojiModifierBase(c) ||
            c == ZeroWidthJoiner) {
            if (lastCp == 0x2D && c == 0x2D) {
                s.undobyte();
                break;
            }
            lastCp = c;
            s.readchar();
            c = s.ch;
        }
        if (lastCp == ZeroWidthJoiner) {
            s.error(`illegal zero width-joiner character at end of identifer`);
            s.tok = token.ILLEGAL;
            return;
        }
        for (let i = hashOffs; i < s.offset; ++i) {
            hash = (hash ^ s.sdata[i]) * 0x1000193;
        }
        s.hash = hash >>> 0;
    }
    scanIdentifier(c) {
        const s = this;
        let hash = (0x811c9dc5 ^ c) * 0x1000193;
        c = s.ch;
        while (isLetter(c) ||
            isDigit(c) ||
            c == 0x2D ||
            c == 0x5F ||
            c == 0x24) {
            s.readchar();
            if (c == 0x2D && s.ch == 0x2D) {
                s.undobyte();
                break;
            }
            hash = (hash ^ c) * 0x1000193;
            c = s.ch;
        }
        if (c >= UniSelf && isUniIdentCont(c)) {
            return s.scanIdentifierU(c, s.offset, hash);
        }
        s.hash = hash >>> 0;
    }
    scanChar() {
        const s = this;
        let cp = -1;
        s.tok = token.CHAR;
        s.int32val = NaN;
        switch (s.ch) {
            case -1:
                s.error("unterminated character literal");
                s.tok = token.ILLEGAL;
                return;
            case 0x27:
                s.error("empty character literal or unescaped ' in character literal");
                s.readchar();
                s.tok = token.ILLEGAL;
                return;
            case 0x5c:
                s.readchar();
                cp = s.scanEscape(0x27);
                break;
            default:
                cp = s.ch;
                if (cp < 0x20) {
                    s.error("invalid character literal");
                    s.tok = token.ILLEGAL;
                    cp = -1;
                }
                s.readchar();
                break;
        }
        if (s.ch == 0x27) {
            s.readchar();
            if (cp == -1) {
                s.tok = token.ILLEGAL;
            }
            else {
                s.int32val = cp;
            }
        }
        else {
            s.tok = token.ILLEGAL;
            while (true) {
                if (s.ch == -1) {
                    break;
                }
                if (s.ch == 0x27) {
                    s.readchar();
                    break;
                }
                s.readchar();
            }
            s.error("invalid character literal");
        }
    }
    resetAppendBuf() {
        const s = this;
        if (s.appendbuf) {
            s.appendbuf.reset();
        }
        else {
            s.appendbuf = new AppendBuffer(64);
        }
        return s.appendbuf;
    }
    scanString() {
        const s = this;
        let buf = null;
        s.startoffs++;
        let chunkStart = s.startoffs;
        let tok = token.STRING;
        loop1: while (true) {
            switch (s.ch) {
                case -1:
                    s.error("string literal not terminated");
                    if (buf) {
                        buf = null;
                    }
                    break loop1;
                case 0x22:
                    if (buf) {
                        buf.appendRange(s.sdata, chunkStart, s.offset);
                    }
                    s.readchar();
                    break loop1;
                case 0x5c: {
                    if (!buf) {
                        buf = s.resetAppendBuf();
                    }
                    if (chunkStart != s.offset) {
                        buf.appendRange(s.sdata, chunkStart, s.offset);
                    }
                    s.readchar();
                    const ch = s.ch;
                    const n = s.scanEscape(0x22);
                    if (n >= 0) {
                        if (n >= UniSelf && (ch == 0x75 || ch == 0x55)) {
                            if (0xD800 <= n && n <= 0xE000) {
                                s.error("illegal: surrogate half in string literal");
                            }
                            else if (n > MaxRune) {
                                s.error("escape sequence is invalid Unicode code point");
                            }
                            buf.reserve(UTFMax);
                            buf.length += encode(buf.buffer, buf.length, n);
                        }
                        else {
                            buf.append(n);
                        }
                    }
                    chunkStart = s.offset;
                    break;
                }
                case 0x24: {
                    s.readchar();
                    if (buf) {
                        s.byteval = buf.subarray();
                    }
                    if (s.gotchar(0x28)) {
                        s.interpStrL++;
                        s.endoffs = s.offset - 2;
                    }
                    else if (s.ch == 0x22) {
                        s.error("invalid \" in string template — string literals inside string " +
                            "templates need to be enclosed in parenthesis");
                        break;
                    }
                    else {
                        s.endoffs = s.offset - 1;
                        s.istrOne = istrOne.WAIT;
                    }
                    return token.STRING_PIECE;
                }
                case 0xA:
                    tok = token.STRING_MULTI;
                    s.readchar();
                    break;
                default:
                    s.readchar();
            }
        }
        if (buf) {
            s.byteval = buf.subarray();
        }
        else {
            s.endoffs = s.offset - 1;
        }
        return tok;
    }
    scanEscape(quote) {
        const s = this;
        let n = 0;
        let base = 0;
        let isuc = false;
        switch (s.ch) {
            case quote:
                s.readchar();
                return quote;
            case 0x30:
                s.readchar();
                return 0;
            case 0x61:
                s.readchar();
                return 0x7;
            case 0x62:
                s.readchar();
                return 0x8;
            case 0x66:
                s.readchar();
                return 0xC;
            case 0x6e:
                s.readchar();
                return 0xA;
            case 0x72:
                s.readchar();
                return 0xD;
            case 0x74:
                s.readchar();
                return 0x9;
            case 0x76:
                s.readchar();
                return 0xb;
            case 0x5c:
                s.readchar();
                return 0x5c;
            case 0x24:
                s.readchar();
                return 0x24;
            case 0x78:
                s.readchar();
                n = 2;
                base = 16;
                break;
            case 0x75:
                s.readchar();
                n = 4;
                base = 16;
                isuc = true;
                break;
            case 0x55:
                s.readchar();
                n = 8;
                base = 16;
                isuc = true;
                break;
            default: {
                let msg = "unknown escape sequence";
                if (s.ch < 0) {
                    msg = "escape sequence not terminated";
                }
                s.error(msg);
                return -1;
            }
        }
        let cp = 0;
        while (n > 0) {
            let d = digitVal(s.ch);
            if (d >= base) {
                let msg = ((s.ch == quote) ? "escape sequence incomplete" :
                    (s.ch < 0) ? "escape sequence not terminated" :
                        `illegal character ${repr$1(s.ch)} in escape sequence`);
                s.errorAtOffs(msg, s.offset);
                return -1;
            }
            cp = cp * base + d;
            s.readchar();
            n--;
        }
        if (isuc && !isValid(cp)) {
            s.errorAtOffs("escape sequence is invalid Unicode code point", s.offset);
            return -1;
        }
        return cp;
    }
    scanNumber(c, modc) {
        let s = this;
        if (c == 0x30) {
            switch (s.ch) {
                case 0x78:
                case 0x58:
                    return s.scanHexInt(modc);
                case 0x6F:
                case 0x4F:
                    s.tok = token.INT_OCT;
                    return s.scanRadixInt8(8, modc);
                case 0x62:
                case 0x42:
                    s.tok = token.INT_BIN;
                    return s.scanRadixInt8(2, modc);
                case 0x2e:
                case 0x65:
                case 0x45:
                    return s.scanFloatNumber(false, modc);
            }
        }
        s.intParser.init(10, modc > 0, modc == 0x2D);
        s.intParser.parseval(c - 0x30);
        while (s.ch >= 0x30 && s.ch <= 0x39) {
            s.intParser.parseval(s.ch - 0x30);
            s.readchar();
        }
        s.tok = token.INT;
        switch (s.ch) {
            case 0x2e:
            case 0x65:
            case 0x45:
                return s.scanFloatNumber(false, modc);
        }
        let valid = s.intParser.finalize();
        s.int32val = s.intParser.int32val;
        s.int64val = s.intParser.int64val;
        if (!valid) {
            s.error("integer constant too large");
        }
    }
    scanHexInt(modc) {
        const s = this;
        s.tok = token.INT_HEX;
        s.readchar();
        s.intParser.init(16, modc > 0, modc == 0x2D);
        let n = 0;
        while ((n = hexDigit(s.ch)) != -1) {
            s.intParser.parseval(n);
            s.readchar();
        }
        if (s.offset - s.startoffs <= 2 || isLetter$1(s.ch)) {
            while (isLetter$1(s.ch) || isDigit$1(s.ch)) {
                s.readchar();
            }
            s.error("invalid hex number");
        }
        let valid = s.intParser.finalize();
        s.int32val = s.intParser.int32val;
        s.int64val = s.intParser.int64val;
        if (!valid) {
            s.error("integer constant too large");
        }
    }
    scanRadixInt8(radix, modc) {
        const s = this;
        s.readchar();
        let isInvalid = false;
        s.intParser.init(radix, modc > 0, modc == 0x2D);
        while (isDigit$1(s.ch)) {
            if (s.ch - 0x30 >= radix) {
                isInvalid = true;
            }
            else {
                s.intParser.parseval(s.ch - 0x30);
            }
            s.readchar();
        }
        if (isInvalid || s.offset - s.startoffs <= 2 || !s.intParser.finalize()) {
            s.error(`invalid ${radix == 8 ? "octal" : "binary"} number`);
            s.int32val = NaN;
            s.int64val = null;
        }
        else {
            s.int32val = s.intParser.int32val;
            s.int64val = s.intParser.int64val;
        }
    }
    scanFloatNumber(seenDecimal, _modc) {
        const s = this;
        s.tok = token.FLOAT;
        if (seenDecimal || s.ch == 0x2e) {
            s.readchar();
            while (isDigit$1(s.ch)) {
                s.readchar();
            }
        }
        if (s.ch == 0x65 || s.ch == 0x45) {
            s.readchar();
            if (s.ch == 0x2D || s.ch == 0x2B) {
                s.readchar();
            }
            let valid = false;
            if (isDigit$1(s.ch)) {
                valid = true;
                s.readchar();
                while (isDigit$1(s.ch)) {
                    s.readchar();
                }
            }
            if (!valid) {
                s.error("invalid floating-point exponent");
                s.floatval = NaN;
                return;
            }
        }
        let str;
        if (s.byteval) {
            str = asciistr(s.byteval);
        }
        else {
            str = asciistrn(s.sdata, s.startoffs, s.offset);
        }
        s.floatval = parseFloat(str);
        assert(!isNaN(s.floatval), 'we failed to catch invalid float lit');
    }
    scanLineComment() {
        const s = this;
        do {
            s.readchar();
        } while (s.ch != 0xA && s.ch >= 0);
        if (s.sdata[s.offset - 1] == 0xD) {
            s.endoffs = s.offset - 1;
        }
        if (s.startoffs == s.lineOffset && s.sdata[s.startoffs + 2] == 0x21) {
            s.interpretCommentPragma();
        }
        s.startoffs += 2;
        s.tok = token.COMMENT;
    }
    scanGeneralComment() {
        const s = this;
        let CR_count = 0;
        while (true) {
            s.readchar();
            switch (s.ch) {
                case -1:
                    s.error("comment not terminated");
                    return CR_count;
                case 0x2f:
                    if (s.sdata[s.offset - 1] == 0x2a) {
                        s.readchar();
                        s.startoffs += 2;
                        s.endoffs = s.offset - 2;
                        return CR_count;
                    }
                    break;
                case 0xD:
                    ++CR_count;
                    break;
                default:
                    break;
            }
        }
    }
    findCommentLineEnd() {
        const s = this;
        const enterOffset = s.offset;
        while (true) {
            const ch = s.ch;
            s.readchar();
            switch (ch) {
                case -1:
                case 0xA:
                    return true;
                case 0x2a:
                    if (s.ch == 0x2f) {
                        s.ch = 0x2a;
                        s.offset = enterOffset;
                        s.rdOffset = s.offset + 1;
                        return false;
                    }
                    break;
                default:
                    break;
            }
        }
    }
    interpretCommentPragma() {
        const s = this;
        const offs = s.startoffs;
        if (s.offset - offs > linePrefix.length &&
            bufcmp$1(s.sdata, linePrefix, offs, offs + linePrefix.length) == 0) {
            let text = decodeToString(s.sdata.subarray(offs + linePrefix.length, s.offset));
            let i = text.lastIndexOf(':');
            if (i > 0) {
                let line = parseInt(text.substr(i + 1));
                if (!isNaN(line) && line > 0) {
                    let filename = text.substr(0, i).trim();
                    if (filename) {
                        filename = clean(filename);
                        if (!isAbs(filename)) {
                            filename = join(s.dir, filename);
                        }
                    }
                    s.sfile.addLineInfo(s.offset + 1, filename, line);
                }
            }
        }
    }
    findLineEnd() {
        const s = this;
        while (s.ch == 0x2f || s.ch == 0x2a) {
            if (s.ch == 0x2f) {
                return true;
            }
            s.readchar();
            while (s.ch >= 0) {
                const ch = s.ch;
                if (ch == 0xA) {
                    return true;
                }
                s.readchar();
                if (ch == 0x2a && s.ch == 0x2f) {
                    s.readchar();
                    break;
                }
            }
            while (s.ch == 0x20 ||
                s.ch == 0x9 ||
                (s.ch == 0xA && !s.insertSemi) ||
                s.ch == 0xD) {
                s.readchar();
            }
            if (s.ch < 0 || s.ch == 0xA) {
                return true;
            }
            if (s.ch != 0x2f) {
                return false;
            }
            s.readchar();
        }
        return false;
    }
}
function digitVal(ch) {
    return (0x30 <= ch && ch <= 0x39 ? ch - 0x30 :
        0x61 <= ch && ch <= 0x66 ? ch - 0x61 + 10 :
            0x41 <= ch && ch <= 0x46 ? ch - 0x41 + 10 :
                16);
}
function stripByte(v, b, countHint = 0) {
    const c = new Uint8Array(v.length - countHint);
    let i = 0;
    for (let x = 0, L = v.length; x < L; ++x) {
        const _b = v[x];
        if (_b != b) {
            c[i++] = _b;
        }
    }
    return i < c.length ? c.subarray(0, i) : c;
}
function isLetter(c) {
    return ((0x41 <= c && c <= 0x5A) ||
        (0x61 <= c && c <= 0x7A));
}
function isDigit(c) {
    return 0x30 <= c && c <= 0x39;
}
function hexDigit(c) {
    if (c >= 0x30 && c <= 0x39) {
        return c - 0x30;
    }
    else if (c >= 0x41 && c <= 0x46) {
        return c - (0x41 - 10);
    }
    else if (c >= 0x61 && c <= 0x66) {
        return c - (0x61 - 10);
    }
    return -1;
}
function isUniIdentStart(c) {
    return (isLetter$1(c) ||
        c == 0x5F ||
        c == 0x24 ||
        isEmojiPresentation(c) ||
        isEmojiModifierBase(c));
}
function isUniIdentCont(c) {
    return (isLetter$1(c) ||
        isDigit$1(c) ||
        c == 0x2D ||
        c == 0x5F ||
        c == 0x24 ||
        isEmojiPresentation(c) ||
        isEmojiModifierBase(c));
}
const langIdent = 1 << 1 - 1;
const langIdentStart = 1 << 2 - 1;
const asciiFeats = new Uint8Array([
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    langIdent | langIdentStart,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    langIdent,
    langIdent,
    langIdent,
    langIdent,
    langIdent,
    langIdent,
    langIdent,
    langIdent,
    langIdent,
    langIdent,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    0,
    0,
    0,
    0,
    langIdent | langIdentStart,
    0,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    langIdent | langIdentStart,
    0,
    0,
    0,
    0,
    0,
]);
//# sourceMappingURL=scanner.js.map

var Mem;
(function (Mem) {
    Mem[Mem["None"] = -1] = "None";
    Mem[Mem["Ptr"] = 0] = "Ptr";
    Mem[Mem["i8"] = 1] = "i8";
    Mem[Mem["i16"] = 2] = "i16";
    Mem[Mem["i32"] = 4] = "i32";
    Mem[Mem["i64"] = 8] = "i64";
    Mem[Mem["f32"] = 5] = "f32";
    Mem[Mem["f64"] = 9] = "f64";
})(Mem || (Mem = {}));
class Type {
    constructor(mem = Mem.None) {
        this.isFloat = false;
        this.isInt = false;
        this.isSignedInt = false;
        this.isUnsignedInt = false;
        this.mem = mem;
        this.size = this.mem;
    }
    accepts(other) {
        return this.equals(other);
    }
    equals(other) {
        return this === other;
    }
    isTuple() {
        return this instanceof TupleType;
    }
}
class UnresolvedType extends Type {
    constructor(def) {
        super();
        this.isUnresolved = true;
        this.refs = null;
        this.def = def;
    }
    addRef(x) {
        assert(x !== this.def, 'register ref to definition');
        if (!this.refs) {
            this.refs = new Set([x]);
        }
        else {
            this.refs.add(x);
        }
    }
    toString() {
        return '~' + String(this.def || "T");
    }
}
class NativeType extends Type {
}
class BasicType extends NativeType {
    constructor(mem, name) {
        super(mem);
        this.name = name;
    }
    toString() {
        return this.name;
    }
}
class NumType extends BasicType {
}
class FloatType extends NumType {
    constructor() {
        super(...arguments);
        this.isFloat = true;
        this.size = this.mem - 1;
    }
}
class IntType extends NumType {
    constructor() {
        super(...arguments);
        this.isInt = true;
    }
}
class SIntType extends IntType {
    constructor() {
        super(...arguments);
        this.isSignedInt = true;
    }
}
class UIntType extends IntType {
    constructor() {
        super(...arguments);
        this.isUnsignedInt = true;
    }
}
const t_nil = new BasicType(Mem.Ptr, 'nil');
const t_bool = new UIntType(Mem.i8, 'bool');
const t_u8 = new UIntType(Mem.i8, 'u8');
const t_i8 = new SIntType(Mem.i8, 'i8');
const t_u16 = new UIntType(Mem.i16, 'u16');
const t_i16 = new SIntType(Mem.i16, 'i16');
const t_u32 = new UIntType(Mem.i32, 'u32');
const t_i32 = new SIntType(Mem.i32, 'i32');
const t_u64 = new UIntType(Mem.i64, 'u64');
const t_i64 = new SIntType(Mem.i64, 'i64');
const t_uint = new UIntType(Mem.Ptr, 'uint');
const t_int = new SIntType(Mem.Ptr, 'int');
const t_usize = new UIntType(Mem.Ptr, 'usize');
const t_isize = new SIntType(Mem.Ptr, 'isize');
const t_f32 = new FloatType(Mem.f32, 'f32');
const t_f64 = new FloatType(Mem.f64, 'f64');
const t_byte = t_u8;
const t_char = t_u32;
function intTypes(bytesize) {
    switch (bytesize) {
        case 1: return [t_i8, t_u8];
        case 2: return [t_i16, t_u16];
        case 4: return [t_i32, t_u32];
        case 8: return [t_i64, t_u64];
    }
    panic(`invalid integer size ${bytesize}`);
    return [t_i32, t_u32];
}
class StrType extends NativeType {
    constructor(length) {
        super();
        this.length = length;
    }
    toString() {
        return this.length > -1 ? `str<${this.length}>` : 'str';
    }
    equals(other) {
        return (this === other ||
            (other instanceof StrType &&
                this.length == other.length));
    }
}
class RestType extends Type {
    constructor(type) {
        super();
        this.type = type;
    }
    toString() {
        return `...${this.type}`;
    }
    equals(other) {
        return (this === other ||
            (other instanceof RestType &&
                this.type.equals(other.type)));
    }
}
class TupleType extends Type {
    constructor(types) {
        super();
        this.types = types;
    }
    toString() {
        return '(' + this.types.map(t => t.toString()).join(', ') + ')';
    }
    equals(other) {
        return (this === other ||
            (other instanceof TupleType &&
                this.types.length == other.types.length &&
                this.types.every((t, i) => t.equals(other.types[i]))));
    }
    isTuple() {
        return true;
    }
}
class FunType extends Type {
    constructor(args, result) {
        super();
        this.args = args;
        this.result = result;
    }
    toString() {
        return `(${this.args.join(', ')}) -> ${this.result}`;
    }
    equals(other) {
        return (this === other ||
            (other instanceof FunType &&
                this.args.length == other.args.length &&
                this.result.equals(other.result) &&
                this.args.every((t, i) => t.equals(other.args[i]))));
    }
}
class UnionType extends Type {
    constructor(types) {
        super();
        this.types = types;
    }
    add(t) {
        assert(!(t instanceof UnionType), 'adding union type to union type');
        this.types.add(t);
    }
    toString() {
        let s = '(', first = true;
        for (let t of this.types) {
            if (first) {
                first = false;
            }
            else {
                s += '|';
            }
            s += t.toString();
        }
        return s + ')';
    }
    equals(other) {
        if (this === other) {
            return true;
        }
        if (!(other instanceof UnionType) || other.types.size != this.types.size) {
            return false;
        }
        for (let t of this.types) {
            if (!other.types.has(t)) {
                return false;
            }
        }
        return true;
    }
    accepts(other) {
        if (this === other) {
            return true;
        }
        if (!(other instanceof UnionType)) {
            return false;
        }
        for (let t of other.types) {
            if (!this.types.has(t)) {
                return false;
            }
        }
        return true;
    }
}
class OptionalType extends Type {
    constructor(type) {
        super();
        assert(!(type instanceof OptionalType), "optional already optional");
        assert(!(type instanceof UnionType), "union type can't be nil");
        assert(!(type instanceof BasicType), "basic types can't be nil");
    }
    toString() {
        return `${this.type}?`;
    }
    equals(other) {
        return (this === other ||
            (other instanceof OptionalType &&
                this.type.equals(other.type)));
    }
    accepts(other) {
        return (this.equals(other) ||
            this.type.equals(other) ||
            other === t_nil);
    }
}
const t_str0 = new StrType(0);
const t_str = new StrType(-1);
const t_stropt = new OptionalType(t_str);
//# sourceMappingURL=types.js.map

const _Int64_UINT32_MAX = UInt64.fromInt32(0xffffffff);
const _Int64_SINT32_MAX = SInt64.fromInt32(0x7fffffff);
const _Int64_SINT32_MIN = SInt64.fromInt32(-0x80000000);
const _Int32_UINT16_MAX = 0xffff >>> 0;
const _Int32_SINT16_MAX = 0x7fff | 0;
const _Int32_SINT16_MIN = -0x8000 | 0;
const _Int64_UINT16_MAX = UInt64.fromInt32(_Int32_UINT16_MAX);
const _Int64_SINT16_MAX = SInt64.fromInt32(_Int32_SINT16_MAX);
const _Int64_SINT16_MIN = SInt64.fromInt32(_Int32_SINT16_MIN);
const _Int32_UINT8_MAX = 0xff >>> 0;
const _Int32_SINT8_MAX = 0x7f | 0;
const _Int32_SINT8_MIN = -0x80 | 0;
const _Int64_UINT8_MAX = UInt64.fromInt32(_Int32_UINT8_MAX);
const _Int64_SINT8_MAX = SInt64.fromInt32(_Int32_SINT8_MAX);
const _Int64_SINT8_MIN = SInt64.fromInt32(_Int32_SINT8_MIN);
function numIsZero(v) {
    return (typeof v == 'number') ? v == 0 : v.isZero();
}
function isNum(v) {
    return (typeof v == 'number' ||
        v instanceof SInt64 ||
        v instanceof UInt64);
}
function numconv(v, t) {
    let lossless = false;
    if (t === t_int) {
        t = t_i32;
    }
    else if (t === t_uint) {
        t = t_u32;
    }
    if (t === t_i64) {
        if (typeof v == 'number') {
            if (v === (v | 0) || v === v >>> 0) {
                lossless = true;
                v = SInt64.fromFloat64(v);
            }
            else {
                let n;
                if (Math.ceil(v) == v && (n = SInt64.maybeFromFloat64(v))) {
                    lossless = true;
                    v = n;
                }
                else {
                    v = SInt64.fromFloat64(v);
                }
            }
        }
        else {
            lossless = v.lte(SInt64.MAX);
            v = v.toSigned();
        }
    }
    else if (t === t_u64) {
        if (typeof v == 'number') {
            if (v === v >>> 0) {
                lossless = true;
                v = SInt64.fromInt32(v);
            }
            else {
                let n;
                if (Math.ceil(v) == v && (n = UInt64.maybeFromFloat64(v))) {
                    lossless = true;
                    v = n;
                }
                else {
                    v = UInt64.fromFloat64(v);
                }
            }
        }
        else {
            lossless = v.isPos();
            v = v.toUnsigned();
        }
    }
    else if (t === t_i32) {
        if (typeof v == 'number') {
            let v2 = v | 0;
            lossless = v === v2;
            v = v2;
        }
        else {
            lossless = v.gte(_Int64_SINT32_MIN) && v.lte(_Int64_SINT32_MAX);
            v = v.toInt32();
        }
    }
    else if (t === t_u32) {
        if (typeof v == 'number') {
            let v2 = v >>> 0;
            lossless = v === v2;
            v = v2;
        }
        else {
            lossless = v.gte(UInt64.ZERO) && v.lte(_Int64_UINT32_MAX);
            v = v.toUInt32();
        }
    }
    else if (t === t_i16) {
        if (typeof v == 'number') {
            let v2 = v | 0;
            lossless = v === v2 && v >= _Int32_SINT16_MIN && v <= _Int32_SINT16_MAX;
            v = v2;
        }
        else {
            lossless = v.gte(_Int64_SINT16_MIN) && v.lte(_Int64_SINT16_MAX);
            v = v.toInt32();
            assert(v >= _Int32_SINT16_MIN && v <= _Int32_SINT16_MAX);
        }
    }
    else if (t === t_u16) {
        if (typeof v == 'number') {
            let v2 = v >>> 0;
            lossless = v === v2 && v >= 0 && v <= _Int32_UINT16_MAX;
            v = v2;
        }
        else {
            lossless = v.gte(UInt64.ZERO) && v.lte(_Int64_UINT16_MAX);
            v = v.toInt32();
            assert(v >= 0 && v <= _Int32_UINT16_MAX);
        }
    }
    else if (t === t_i8) {
        if (typeof v == 'number') {
            let v2 = v | 0;
            lossless = v === v2 && v >= _Int32_SINT8_MIN && v <= _Int32_SINT8_MAX;
            v = v2;
        }
        else {
            lossless = v.gte(_Int64_SINT8_MIN) && v.lte(_Int64_SINT8_MAX);
            v = v.toInt32();
            assert(v >= _Int32_SINT8_MIN && v <= _Int32_SINT8_MAX);
        }
    }
    else if (t === t_u8) {
        if (typeof v == 'number') {
            let v2 = v >>> 0;
            lossless = v === v2 && v >= 0 && v <= _Int32_UINT8_MAX;
            v = v2;
        }
        else {
            lossless = v.gte(UInt64.ZERO) && v.lte(_Int64_UINT8_MAX);
            v = v.toInt32();
            assert(v >= 0 && v <= _Int32_UINT8_MAX);
        }
    }
    else if (t === t_f64) {
        lossless = true;
        if (typeof v != 'number') {
            v = v.toFloat64();
        }
    }
    else if (t === t_f32) {
        lossless = true;
        if (typeof v != 'number') {
            v = v.toFloat64();
        }
    }
    else {
        assert(false, `unexpected destination type ${t}`);
    }
    return [v, lossless];
}
function numEvalU32(x) {
    let n = numEval(x);
    if (n === null) {
        return -2;
    }
    let [i, lossless] = numconv(n, t_u32);
    assert(typeof i == 'number');
    assert(i >= 0, 'negative value of u32');
    return lossless ? i : -1;
}
function numEval(x) {
    if (x instanceof NumLit) {
        return x.value;
    }
    if (x instanceof Ident) {
        let ent = x.ent;
        assert(ent, 'unresolved identifier');
        assert(ent.value, 'unresolved identifier value');
        if (ent.value && (ent.isConstant() || ent.nreads == 1)) {
            return numEval(ent.value);
        }
    }
    else if (x instanceof Operation) {
        return numEvalOp(x);
    }
    else {
        debuglog(`TODO handle ${x.constructor.name} ${x}`);
    }
    return null;
}
function numEvalOp(x) {
    let t = x.type;
    assert(t, 'unresolved type');
    if (!(t instanceof NumType)) {
        return null;
    }
    let xn = numEval(x.x);
    if (xn === null) {
        return null;
    }
    if (!x.y) {
        assert(x.x.type === t, 'unexpected operand type');
        return numEvalOpUnary(t, xn, x.op);
    }
    let yn = numEval(x.y);
    if (yn === null) {
        return null;
    }
    let lossless = false;
    if (x.x.type !== t) {
        
        [xn, lossless] = numconv(xn, t);
        if (!lossless) {
            return null;
        }
    }
    if (x.op == token.SHL || x.op == token.SHR) {
        let yt = x.y.type;
        if (!(yt instanceof IntType) || !(t instanceof IntType)) {
            return null;
        }
        return numEvalOpBitSh(t, xn, yn, x.op);
    }
    else if (x.y.type !== t) {
        
        [yn, lossless] = numconv(yn, t);
        if (!lossless) {
            return null;
        }
    }
    return numEvalOpBin(t, xn, yn, x.op);
}
function numEvalOpBitSh(t, a, b, op) {
    let nbits = 0;
    if (typeof b == 'number' && b >= 0) {
        nbits = b >>> 0;
    }
    else {
        let lossless = false;
        [nbits, lossless] = numconv(b, t_u32);
        if (!lossless) {
            return null;
        }
    }
    if (typeof a == 'number') {
        assert(t.mem == Mem.i32 || t.mem == Mem.i16 || t.mem == Mem.i8);
        if (op == token.SHL) {
            return a << nbits;
        }
        assert(op == token.SHR);
        return (t.isSignedInt ? a >> nbits :
            a >>> nbits);
    }
    assert(t.mem == Mem.i64);
    assert(a instanceof SInt64 || a instanceof UInt64);
    if (op == token.SHL) {
        return a.shl(nbits);
    }
    assert(op == token.SHR);
    return a.shr(nbits);
}
function numEvalOpBin(t, a, b, op) {
    if (t.mem == Mem.i32) {
        assert(t instanceof IntType);
        assert(typeof a == 'number');
        assert(typeof b == 'number');
        if (t.isSignedInt) {
            return numEvalOpBinS32(a, b, op);
        }
        assert(a >= 0);
        assert(b >= 0);
        return numEvalOpBinU32(a, b, op);
    }
    if (t.mem == Mem.i64) {
        assert(t instanceof IntType);
        if (t.isSignedInt) {
            assert(a instanceof SInt64);
            assert(b instanceof SInt64);
        }
        else {
            assert(a instanceof UInt64);
            assert(b instanceof UInt64);
        }
        return numEvalOpBinI64(a, b, op);
    }
    assert(typeof a == 'number');
    assert(typeof b == 'number');
    return numEvalOpBinFloat(a, b, op);
}
function numEvalOpBinS32(a, b, op) {
    switch (op) {
        case token.ADD: return a + b | 0;
        case token.SUB: return a - b | 0;
        case token.MUL: return Math.imul(a, b);
        case token.QUO: return a / b | 0;
        case token.REM: return a % b | 0;
        case token.OR: return a | b;
        case token.XOR: return a ^ b;
        case token.AND: return a & b;
        case token.AND_NOT: return a & ~b;
        case token.SHL: return a << b;
        case token.SHR: return a >> b;
        default:
            assert(false, `unexpected ${token[op]}`);
            return null;
    }
}
function numEvalOpBinU32(a, b, op) {
    switch (op) {
        case token.ADD: return a + b >>> 0;
        case token.SUB: return a - b >>> 0;
        case token.MUL: return Math.imul(a, b) >>> 0;
        case token.QUO: return a / b >>> 0;
        case token.REM: return a % b >>> 0;
        case token.OR: return a | b;
        case token.XOR: return a ^ b;
        case token.AND: return a & b;
        case token.AND_NOT: return a & ~b;
        case token.SHL: return a << b;
        case token.SHR: return a >>> b;
        default:
            assert(false, `unexpected ${token[op]}`);
            return null;
    }
}
function numEvalOpBinI64(a, b, op) {
    switch (op) {
        case token.ADD: return a.add(b);
        case token.SUB: return a.sub(b);
        case token.MUL: return a.mul(b);
        case token.QUO: return a.div(b);
        case token.REM: return a.mod(b);
        case token.OR: return a.or(b);
        case token.XOR: return a.xor(b);
        case token.AND: return a.and(b);
        case token.AND_NOT: return a.and(b.not());
        case token.SHL: return a.shl(b.toUInt32());
        case token.SHR: return a.shr(b.toUInt32());
        default:
            assert(false, `unexpected ${token[op]}`);
            return null;
    }
}
function numEvalOpBinFloat(a, b, op) {
    switch (op) {
        case token.ADD: return a + b;
        case token.SUB: return a - b;
        case token.MUL: return a * b;
        case token.QUO: return a / b;
        default:
            assert(false, `unexpected ${token[op]}`);
            return null;
    }
}
function numEvalOpUnary(t, n, op) {
    if (t.mem == Mem.i32) {
        assert(typeof n == 'number');
        assert(t instanceof IntType);
        if (t.isSignedInt) {
            return numEvalOpUnaryS32(n, op);
        }
        return numEvalOpUnaryU32(n, op);
    }
    if (t.mem == Mem.i64) {
        assert(typeof n == 'object');
        assert(n instanceof UInt64 || n instanceof SInt64);
        assert(t instanceof IntType);
        return numEvalOpUnaryI64(n, op);
    }
    assert(typeof n == 'number');
    return numEvalOpUnaryFloat(n, op);
}
function numEvalOpUnaryS32(n, op) {
    switch (op) {
        case token.ADD: return n;
        case token.SUB: return 0 - n | 0;
        case token.XOR: return ~n;
        case token.NOT: return null;
        default:
            assert(false, `unexpected ${token[op]}`);
            return null;
    }
}
function numEvalOpUnaryU32(n, op) {
    switch (op) {
        case token.ADD: return n;
        case token.SUB: return 0 - n >>> 0;
        case token.XOR: return ~n;
        case token.NOT: return null;
        default:
            assert(false, `unexpected ${token[op]}`);
            return null;
    }
}
function numEvalOpUnaryI64(n, op) {
    switch (op) {
        case token.ADD: return n;
        case token.SUB: return n.neg();
        case token.XOR: return n.not();
        case token.NOT: return null;
        default:
            assert(false, `unexpected ${token[op]}`);
            return null;
    }
}
function numEvalOpUnaryFloat(n, op) {
    switch (op) {
        case token.ADD: return n;
        case token.SUB: return 0 - n;
        default:
            assert(false, `unexpected ${token[op]}`);
            return null;
    }
}
//# sourceMappingURL=num.js.map

let nextgid = 0;
class Group {
    constructor() {
        this.id = nextgid++;
    }
}
class Comment {
    constructor(pos, value) {
        this.pos = pos;
        this.value = value;
    }
}
class Node {
    constructor(pos, scope) {
        this.pos = pos;
        this.scope = scope;
    }
    toString() {
        return this.constructor.name;
    }
}
class Field extends Node {
    constructor(pos, scope, type, name) {
        super(pos, scope);
        this.type = type;
        this.name = name;
    }
}
class Ent {
    constructor(name, decl, value, type = null, data = null) {
        this.writes = 0;
        this.nreads = 0;
        if (!type) {
            type = ((decl &&
                (decl instanceof Field || decl instanceof VarDecl) &&
                decl.type &&
                decl.type.type) ||
                (value &&
                    value.type &&
                    value.type) ||
                null);
        }
        this.name = name;
        this.decl = decl;
        this.value = value;
        this.data = data;
        this.type = type;
    }
    getTypeExpr() {
        return ((this.decl && (this.decl instanceof Field ||
            this.decl instanceof VarDecl) && this.decl.type) ||
            this.value);
    }
    isConstant() {
        return this.writes == 0;
    }
    get scope() {
        return this.decl.scope;
    }
}
class Scope {
    constructor(outer, decls = null, isFunScope = false) {
        this.outer = outer;
        this.decls = decls;
        this.isFunScope = isFunScope;
        this.fun = null;
    }
    lookup(s) {
        const d = this.decls && this.decls.get(s);
        return d ? d : this.outer ? this.outer.lookup(s) : null;
    }
    lookupImm(s) {
        const d = this.decls && this.decls.get(s);
        return d || null;
    }
    declare(name, decl, x) {
        const ent = new Ent(name, decl, x);
        return this.declareEnt(ent) ? ent : null;
    }
    declareEnt(ent) {
        if (!this.decls) {
            this.decls = new Map([[ent.name, ent]]);
            return true;
        }
        if (this.decls.has(ent.name)) {
            return false;
        }
        this.decls.set(ent.name, ent);
        return true;
    }
    redeclareEnt(ent) {
        if (!this.decls) {
            this.decls = new Map([[ent.name, ent]]);
            return null;
        }
        const prevent = this.decls.get(ent.name);
        if (prevent === ent) {
            return null;
        }
        this.decls.set(ent.name, ent);
        return prevent || null;
    }
    funScope() {
        let s = this;
        while (s) {
            if (s.fun) {
                return s;
            }
            s = s.outer;
        }
        return null;
    }
    level() {
        let level = 0, s = this;
        while ((s = s.outer)) {
            level++;
        }
        return level;
    }
    toString() {
        const names = this.decls ? Array.from(this.decls.keys()) : [];
        return `Scope(level: ${this.level()}, names: (${names.join(', ')}))`;
    }
}
const nilScope = new Scope(null);
class File {
    constructor(sfile, scope, imports, decls, unresolved) {
        this.sfile = sfile;
        this.scope = scope;
        this.imports = imports;
        this.decls = decls;
        this.unresolved = unresolved;
    }
    toString() {
        return (`File("${this.sfile.name}"; ${this.decls.length} decls` +
            (this.imports ? `; ${this.imports.length} imports)` : ''));
    }
}
class Package {
    constructor(name, scope) {
        this.name = name;
        this.scope = scope;
        this.files = [];
    }
    toString() {
        return `Package(${this.name})`;
    }
}
class Stmt extends Node {
}
class NoOpStmt extends Stmt {
}
class ReturnStmt extends Stmt {
    constructor(pos, scope, result, type) {
        super(pos, scope);
        this.result = result;
        this.type = type;
    }
}
class WhileStmt extends Stmt {
    constructor(pos, scope, cond, body) {
        super(pos, scope);
        this.cond = cond;
        this.body = body;
    }
}
class Decl extends Stmt {
}
class MultiDecl extends Decl {
    constructor(pos, scope, decls) {
        super(pos, scope);
        this.decls = decls;
    }
}
class ImportDecl extends Decl {
    constructor(pos, scope, path, localIdent) {
        super(pos, scope);
        this.path = path;
        this.localIdent = localIdent;
    }
}
class VarDecl extends Decl {
    constructor(pos, scope, idents, group, type = null, values = null) {
        super(pos, scope);
        this.idents = idents;
        this.group = group;
        this.type = type;
        this.values = values;
    }
}
class TypeDecl extends Decl {
    constructor(pos, scope, ident, alias, type, group) {
        super(pos, scope);
        this.ident = ident;
        this.alias = alias;
        this.type = type;
        this.group = group;
    }
}
class Expr extends Stmt {
    constructor() {
        super(...arguments);
        this.type = null;
    }
    isIdent() {
        return this instanceof Ident;
    }
}
class BadExpr extends Expr {
}
class TypeExpr extends Expr {
    constructor(pos, scope, type) {
        super(pos, scope);
        this.type = type;
    }
}
class BadTypeExpr extends TypeExpr {
    constructor(pos, scope) {
        super(pos, scope, t_nil);
    }
}
class RestTypeExpr extends TypeExpr {
    constructor(pos, scope, expr, type) {
        super(pos, scope, type);
        this.expr = expr;
    }
}
class Ident extends Expr {
    constructor(pos, scope, value, ver = 0) {
        super(pos, scope);
        this.value = value;
        this.ver = ver;
        this.ent = null;
    }
    toString() { return String(this.value); }
    incrWrite() {
        assert(this.ent != null);
        let ent = this.ent;
        ent.writes++;
        this.ver = ent.writes;
    }
    refEnt(ent) {
        assert(this !== ent.decl, "ref declaration");
        ent.nreads++;
        this.ent = ent;
        this.ver = ent.writes;
    }
    unrefEnt() {
        assert(this.ent, "null ent");
        const ent = this.ent;
        ent.nreads--;
        this.ent = null;
        this.ver = 0;
    }
}
class Block extends Expr {
    constructor(pos, scope, list) {
        super(pos, scope);
        this.list = list;
    }
}
class IfExpr extends Expr {
    constructor(pos, scope, cond, then, els_) {
        super(pos, scope);
        this.cond = cond;
        this.then = then;
        this.els_ = els_;
    }
}
class TupleExpr extends Expr {
    constructor(pos, scope, exprs) {
        super(pos, scope);
        this.exprs = exprs;
    }
    toString() {
        return `(${this.exprs.map(x => x.toString()).join(', ')})`;
    }
}
class SelectorExpr extends Expr {
    constructor(pos, scope, lhs, rhs) {
        super(pos, scope);
        this.lhs = lhs;
        this.rhs = rhs;
    }
    toString() {
        return `${this.lhs}.${this.rhs}`;
    }
}
class IndexExpr extends Expr {
    constructor(pos, scope, operand, index) {
        super(pos, scope);
        this.operand = operand;
        this.indexv = -1;
        this.indexnum = -1;
        this._index = index;
    }
    get index() { return this._index; }
    set index(x) {
        let e = new Error();
        console.log('>>>> set index\n' +
            e.stack.split('\n').slice(2).join('\n'));
        this._index = x;
    }
    toString() {
        return `${this.operand}[${this.index}]`;
    }
}
class SliceExpr extends Expr {
    constructor(pos, scope, operand, start, end) {
        super(pos, scope);
        this.operand = operand;
        this.start = start;
        this.end = end;
        this.startnum = -1;
        this.endnum = -1;
    }
    toString() {
        return `${this.operand}[${this.start || ''}:${this.end || ''}]`;
    }
}
class LiteralExpr extends Expr {
}
class NumLit extends LiteralExpr {
    constructor(pos, scope, value, type) {
        super(pos, scope);
        this.value = value;
        this.type = type;
    }
    convertToType(t) {
        let [v, lossless] = numconv(this.value, t);
        this.type = t;
        this.value = v;
        return lossless;
    }
}
class IntLit extends NumLit {
    constructor(pos, scope, value, type, kind) {
        super(pos, scope, value, type);
        this.kind = kind;
    }
    toString() {
        switch (this.kind) {
            case token.INT_HEX: return '0x' + this.value.toString(16);
            case token.INT_OCT: return '0o' + this.value.toString(8);
            case token.INT_BIN: return '0b' + this.value.toString(2);
            default: return this.value.toString(10);
        }
    }
}
class CharLit extends NumLit {
    constructor(pos, scope, value) {
        super(pos, scope, value, t_char);
    }
    toString() {
        return '0x' + this.value.toString(16);
    }
}
class FloatLit extends NumLit {
    constructor(pos, scope, value, type) {
        super(pos, scope, value, type);
    }
    toString() {
        return this.value.toString();
    }
}
class StringLit extends LiteralExpr {
    constructor(pos, scope, value, type) {
        super(pos, scope);
        this.type = type;
    }
    toString() {
        return JSON.stringify(decodeToString(this.value));
    }
}
class Assignment extends Expr {
    constructor(pos, scope, op, lhs, rhs) {
        super(pos, scope);
        this.op = op;
        this.lhs = lhs;
        this.rhs = rhs;
    }
    toString() {
        return `${this.lhs.join(', ')} ${tokstr(this.op)} ${this.rhs.join(', ')}`;
    }
}
class Operation extends Expr {
    constructor(pos, scope, op, x, y = null) {
        super(pos, scope);
        this.op = op;
        this.x = x;
        this.y = y;
    }
    toString() {
        return `(${token[this.op]} ${this.x}${this.y ? ' ' + this.y : ''})`;
    }
}
class CallExpr extends Expr {
    constructor(pos, scope, fun, args, hasDots) {
        super(pos, scope);
        this.fun = fun;
        this.args = args;
        this.hasDots = hasDots;
    }
}
class FunExpr extends Expr {
    constructor(pos, scope, name, sig, isInit = false) {
        super(pos, scope);
        this.name = name;
        this.sig = sig;
        this.isInit = isInit;
        this.body = null;
        scope.fun = this;
    }
}
class FunSig extends Node {
    constructor(pos, scope, params, result) {
        super(pos, scope);
        this.params = params;
        this.result = result;
    }
}
class TypeConvExpr extends Expr {
    constructor(pos, scope, expr, type) {
        super(pos, scope);
        this.expr = expr;
        this.type = type;
    }
}
class NativeTypeExpr extends TypeExpr {
    constructor(type) {
        super(0, nilScope, type);
    }
}
class Atom extends Expr {
    constructor(name, type) {
        super(0, nilScope);
        this.name = name;
        this.type = type;
    }
    toString() {
        return this.name;
    }
}
const builtInTypes = {
    "nil": new NativeTypeExpr(t_nil),
    "bool": new NativeTypeExpr(t_bool),
    "u8": new NativeTypeExpr(t_u8),
    "i8": new NativeTypeExpr(t_i8),
    "u16": new NativeTypeExpr(t_u16),
    "i16": new NativeTypeExpr(t_i16),
    "u32": new NativeTypeExpr(t_u32),
    "i32": new NativeTypeExpr(t_i32),
    "u64": new NativeTypeExpr(t_u64),
    "i64": new NativeTypeExpr(t_i64),
    "uint": new NativeTypeExpr(t_uint),
    "int": new NativeTypeExpr(t_int),
    "usize": new NativeTypeExpr(t_usize),
    "isize": new NativeTypeExpr(t_isize),
    "f32": new NativeTypeExpr(t_f32),
    "f64": new NativeTypeExpr(t_f64),
    "byte": new NativeTypeExpr(t_byte),
    "char": new NativeTypeExpr(t_char),
    "str": new NativeTypeExpr(t_str),
};
const typeToBuiltInTypes = new Map();
for (let k in builtInTypes) {
    let x = (builtInTypes)[k];
    typeToBuiltInTypes.set(x.type, x);
}
function GetTypeExpr(t) {
    let x = typeToBuiltInTypes.get(t);
    return x || new TypeExpr(0, nilScope, t);
}
const builtInValues = {
    "true": new Atom("true", t_bool),
    "false": new Atom("false", t_bool),
    "nil": new Atom("nil", t_nil),
};
//# sourceMappingURL=ast.js.map

const kEmptyByteArray = new Uint8Array(0);
const kBytes__ = new Uint8Array([0x5f]);
const kBytes_dot = new Uint8Array([0x2e]);
const kBytes_init = new Uint8Array([0x69, 0x6e, 0x69, 0x74]);
const emptyExprList = [];
class funInfo {
    constructor(f) {
        this.f = f;
        this.inferredReturnType = null;
    }
    addInferredReturnType(t) {
        if (this.inferredReturnType == null) {
            this.inferredReturnType = new UnionType(new Set([t]));
        }
        else {
            this.inferredReturnType.add(t);
        }
    }
}
class Parser extends Scanner {
    constructor() {
        super(...arguments);
        this.fnest = 0;
        this.diagh = null;
        this.initfnest = 0;
        this.importDecl = (_) => {
            const p = this;
            let localIdent = null;
            let hasLocalIdent = false;
            switch (p.tok) {
                case token.NAME:
                    localIdent = p.ident();
                    hasLocalIdent = true;
                    break;
                case token.DOT:
                    const s = p._id_dot;
                    localIdent = new Ident(p.pos, p.scope, s);
                    p.next();
                    break;
            }
            let path;
            if (p.tok == token.STRING) {
                path = p.strlit();
            }
            else {
                p.syntaxError("missing import path; expecting quoted string");
                path = new StringLit(p.pos, p.scope, kEmptyByteArray, t_str0);
                p.advanceUntil(token.SEMICOLON, token.RPAREN);
            }
            const d = new ImportDecl(p.pos, p.scope, path, localIdent);
            if (hasLocalIdent && localIdent) {
                p.declare(p.filescope, localIdent, d, null);
            }
            return d;
        };
        this.typeDecl = (group, _) => {
            const p = this;
            const pos = p.pos;
            const ident = p.ident();
            const alias = p.got(token.ASSIGN);
            let t = p.maybeType();
            if (!t) {
                t = p.badTypeExpr();
                p.syntaxError("in type declaration");
                p.advanceUntil(token.SEMICOLON, token.RPAREN);
            }
            const d = new TypeDecl(pos, p.scope, ident, alias, t, group);
            return d;
        };
        this.numLitErrH = (msg, pos) => {
            this.syntaxError(msg, pos);
        };
    }
    initParser(sfile, sdata, universe, pkgscope, typeres, errh = null, diagh = null, smode = Mode.None) {
        const p = this;
        super.init(sfile, sdata, errh, smode);
        p.scope = new Scope(pkgscope);
        p.filescope = p.scope;
        p.pkgscope = pkgscope || p.filescope;
        p.fnest = 0;
        p.universe = universe;
        p.strSet = universe.strSet;
        p.comments = null;
        p.diagh = diagh;
        p.initfnest = 0;
        p.unresolved = null;
        p.funstack = [];
        p.types = typeres;
        p._id__ = p.strSet.emplace(kBytes__);
        p._id_dot = p.strSet.emplace(kBytes_dot);
        p._id_init = p.strSet.emplace(kBytes_init);
        if (smode & Mode.ScanComments) {
            p.next = p.next_comments;
        }
        p.next();
    }
    next_comments() {
        const p = this;
        super.next();
        while (p.tok == token.COMMENT) {
            if (!p.comments) {
                p.comments = [];
            }
            p.comments.push(new Comment(p.pos, p.takeByteValue()));
            super.next();
        }
    }
    got(tok) {
        const p = this;
        if (p.tok == tok) {
            p.next();
            return true;
        }
        return false;
    }
    want(tok) {
        const p = this;
        if (!p.got(tok)) {
            p.syntaxError(`expecting ${tokstr(tok)}`);
            p.next();
        }
    }
    currFun() {
        assert(this.funstack.length > 0, 'access current function at file level');
        return this.funstack[0];
    }
    pushFun(f) {
        this.funstack.push(new funInfo(f));
    }
    popFun() {
        assert(this.funstack.length > 0, 'popFun with empty funstack');
        this.funstack.pop();
    }
    pushScope(scope = null) {
        const p = this;
        if (scope) {
            assert(scope.outer != null, 'pushing scope without outer scope');
        }
        p.scope = scope || new Scope(p.scope);
    }
    popScope() {
        const p = this;
        const s = p.scope;
        assert(s !== p.filescope, "pop file scope");
        assert(s !== p.pkgscope, "pop file scope");
        assert(p.scope.outer != null, 'pop scope at base scope');
        p.scope = p.scope.outer;
        if (s.decls)
            for (let [name, ent] of s.decls) {
                if (ent.nreads == 0) {
                    if (ent.decl instanceof Field) {
                        p.diag("warn", `${name} not used`, ent.decl.pos, (ent.decl.scope.isFunScope ? 'E_UNUSED_PARAM' :
                            'E_UNUSED_FIELD'));
                    }
                    else {
                        p.diag("warn", `${name} declared and not used`, ent.decl.pos, 'E_UNUSED_VAR');
                    }
                }
            }
        return s;
    }
    declare(scope, ident, decl, x) {
        const p = this;
        if (ident.value === p._id__) {
            return;
        }
        assert(ident.ent == null, `redeclaration of ${ident}`);
        const ent = new Ent(ident.value, decl, x);
        if (!scope.declareEnt(ent)) {
            p.syntaxError(`${ident} redeclared`, ident.pos);
        }
        ident.ent = ent;
    }
    declarev(scope, idents, decl, xs) {
        const p = this;
        for (let i = 0; i < idents.length; ++i) {
            p.declare(scope, idents[i], decl, xs && xs[i] || null);
        }
    }
    resolve(x, collectUnresolved = true) {
        const p = this;
        if (!(x instanceof Ident) || x.value === p._id__) {
            return x;
        }
        assert(x.ent == null, "already resolved");
        let s = x.scope;
        while (s) {
            const ent = s.lookupImm(x.value);
            if (ent) {
                x.refEnt(ent);
                if (!x.type) {
                    x.type = ent.type || p.types.markUnresolved(x);
                    if (x.type instanceof UnresolvedType) {
                        x.type.addRef(x);
                    }
                }
                return x;
            }
            s = s.outer;
        }
        if (collectUnresolved) {
            if (!p.unresolved) {
                p.unresolved = new Set([x]);
            }
            else {
                p.unresolved.add(x);
            }
        }
        return x;
    }
    ctxType(ctx) {
        const p = this;
        if (ctx) {
            if (ctx instanceof VarDecl) {
                return ctx.type && p.types.maybeResolve(ctx.type) || null;
            }
            if (ctx instanceof Assignment) {
                return (ctx.lhs && ctx.lhs.length == 1 ? p.types.maybeResolve(ctx.lhs[0]) :
                    null);
            }
        }
        return null;
    }
    parseFile() {
        const p = this;
        const imports = p.parseImports();
        const decls = p.parseFileBody();
        return new File(p.sfile, p.scope, imports, decls, p.unresolved);
    }
    parseImports() {
        const p = this;
        let imports = [];
        while (p.got(token.IMPORT)) {
            p.appendGroup(imports, p.importDecl);
            p.want(token.SEMICOLON);
        }
        return imports;
    }
    parseFileBody() {
        const p = this;
        const decls = [];
        while (p.tok != token.EOF) {
            switch (p.tok) {
                case token.TYPE:
                    p.next();
                    p.appendGroup(decls, p.typeDecl);
                    break;
                case token.NAME:
                    const pos = p.pos;
                    const idents = p.identList(p.ident());
                    decls.push(p.varDecl(pos, idents));
                    break;
                case token.FUN:
                    decls.push(p.funExpr(null));
                    break;
                default: {
                    if (p.tok == token.LBRACE &&
                        decls.length > 0 &&
                        isEmptyFunExpr(decls[decls.length - 1])) {
                        p.syntaxError("unexpected semicolon or newline before {");
                    }
                    else {
                        p.syntaxError("non-declaration statement outside function body");
                    }
                    p.error(`TODO file-level token \`${tokstr(p.tok)}\``);
                    p.next();
                    p.advanceUntil(token.TYPE, token.FUN);
                    continue;
                }
            }
            if (p.tok != token.EOF && !p.got(token.SEMICOLON)) {
                p.syntaxError("after top level declaration");
                p.advanceUntil(token.TYPE, token.FUN);
            }
        }
        return decls;
    }
    checkDeclLen(idents, nvalues, kind) {
        const p = this;
        if (nvalues != idents.length) {
            p.syntaxError(`cannot assign ${nvalues} values to ${idents.length} ${kind}`, idents[0].pos);
            return false;
        }
        return true;
    }
    varDecl(pos, idents) {
        const p = this;
        const typ = p.maybeType();
        let isError = false;
        const scope = p.scope === p.filescope ? p.pkgscope : p.scope;
        const d = new VarDecl(pos, scope, idents, null, typ, null);
        if (p.got(token.ASSIGN)) {
            d.values = p.exprList(d);
            isError = !p.checkDeclLen(idents, d.values.length, 'constants');
        }
        else if (!typ) {
            p.syntaxError("unexpected identifier", pos);
            isError = true;
            d.values = [p.bad()];
            p.advanceUntil(token.SEMICOLON);
        }
        if (isError) {
            return d;
        }
        const reqt = d.type ? p.types.resolve(d.type) : null;
        p.processAssign(d.idents, d.values, d, reqt, true);
        return d;
    }
    funExpr(ctx) {
        const p = this;
        const pos = p.pos;
        p.want(token.FUN);
        const isTopLevel = p.scope === p.filescope;
        let name;
        let isInitFun = false;
        if (isTopLevel && !ctx) {
            name = p.ident();
            isInitFun = p.scope === p.filescope && name.value.equals(p._id_init);
        }
        else {
            name = p.maybeIdent();
        }
        const scope = isTopLevel ? p.pkgscope : p.scope;
        p.pushScope(new Scope(p.scope, null, true));
        const sig = p.funSig(isInitFun ? builtInTypes.nil : null);
        const f = new FunExpr(pos, p.scope, name, sig, isInitFun);
        if (isInitFun) {
            if (sig.params.length > 0) {
                p.syntaxError(`init function with parameters`, sig.pos);
            }
            if (sig.result !== builtInTypes.nil) {
                p.syntaxError(`init function with result ${sig.result}`, sig.pos);
            }
        }
        else {
            if (sig.result) {
                p.types.resolve(sig.result);
            }
            if (name && !ctx) {
                p.declare(scope, name, f, f);
            }
        }
        if (!isTopLevel || isInitFun || ctx || p.tok != token.SEMICOLON) {
            if (isInitFun) {
                p.initfnest++;
            }
            p.pushFun(f);
            f.body = p.funBody(name);
            const fi = p.currFun();
            p.popFun();
            if (isInitFun) {
                p.initfnest--;
            }
            p.popScope();
            if (f.body instanceof Block) {
                if (!sig.result) {
                    sig.result = builtInTypes.nil;
                }
                else if (!isInitFun && sig.result !== builtInTypes.nil) {
                    let lastindex = f.body.list.length - 1;
                    let result = f.body.list[lastindex];
                    if (result instanceof Expr) {
                        let rettype = p.types.resolve(result);
                        let ret = new ReturnStmt(result.pos, result.scope, result, rettype);
                        f.body.list[lastindex] = ret;
                    }
                }
            }
            else if (!sig.result) {
                if (!fi.inferredReturnType) {
                    sig.result = GetTypeExpr(p.types.resolve(f.body));
                }
                else if (fi.inferredReturnType.types.size == 1) {
                    sig.result = GetTypeExpr(fi.inferredReturnType.types.values().next().value);
                }
                else {
                    sig.result = GetTypeExpr(fi.inferredReturnType);
                }
            }
        }
        else {
            if (sig.result === null) {
                sig.result = builtInTypes.nil;
            }
            p.popScope();
        }
        if (sig.result instanceof UnresolvedType) {
            sig.result.addRef(sig);
        }
        const funtype = p.types.resolve(f);
        assert(funtype.constructor === FunType);
        if (name && name.value !== p._id__ && !isInitFun) {
            name.type = funtype;
        }
        return f;
    }
    funSig(defaultType) {
        const p = this;
        const pos = p.pos;
        const params = p.tok == token.LPAREN ? p.parameters() : [];
        const result = p.maybeType() || defaultType;
        return new FunSig(pos, p.scope, params, result);
    }
    parameters() {
        const p = this;
        p.want(token.LPAREN);
        let named = 0;
        let seenRestTypeExpr = false;
        const paramsPos = p.pos;
        const fields = [];
        const scope = p.scope;
        while (p.tok != token.RPAREN) {
            let pos = p.pos;
            let typ = null;
            let name = null;
            if (p.tok == token.NAME) {
                typ = p.dotident(null, p.ident());
            }
            else {
                const x = p.maybeType();
                if (x) {
                    typ = x;
                }
                else {
                    typ = p.badTypeExpr();
                    p.syntaxError("expecting name or type");
                }
            }
            if (p.tok != token.COMMA &&
                p.tok != token.SEMICOLON &&
                p.tok != token.RPAREN) {
                if (typ) {
                    if (typ instanceof Ident) {
                        name = typ;
                        named++;
                    }
                    else {
                        p.syntaxError("illegal parameter name", pos);
                    }
                }
                if (p.got(token.ELLIPSIS)) {
                    const x = p.maybeType();
                    if (x) {
                        let t = new RestType(p.types.resolve(x));
                        typ = new RestTypeExpr(pos, scope, x, t);
                    }
                    else {
                        typ = p.badTypeExpr();
                        p.syntaxError("expecting type after ...");
                    }
                    if (seenRestTypeExpr) {
                        p.syntaxError("can only use ... with final parameter");
                        continue;
                    }
                    else {
                        seenRestTypeExpr = true;
                    }
                }
                else {
                    typ = p.type();
                }
            }
            if (!p.ocomma(token.RPAREN)) {
                break;
            }
            fields.push(new Field(pos, scope, typ, name));
        }
        p.want(token.RPAREN);
        if (named == 0) {
            for (let f of fields) {
                p.resolve(f.type);
            }
        }
        else {
            if (named < fields.length) {
                let ok = true;
                let typ = null;
                let t = t_nil;
                for (let i = fields.length - 1; i >= 0; --i) {
                    const f = fields[i];
                    if (!f.name) {
                        if (f.type instanceof Ident) {
                            f.name = f.type;
                            if (typ) {
                                f.type = typ;
                                f.name.type = t;
                            }
                            else {
                                ok = false;
                                f.type = p.badTypeExpr(f.type.pos);
                            }
                        }
                        else {
                            p.syntaxError("illegal parameter name", f.type.pos);
                        }
                    }
                    else if (f.type) {
                        p.resolve(f.type);
                        t = p.types.resolve(f.type);
                        typ = f.type;
                        if (typ instanceof RestTypeExpr) {
                            const tx = typ.expr;
                            assert(tx.type, 'unresolved type');
                            typ = new TypeExpr(tx.pos, tx.scope, tx.type);
                        }
                        if (f.name) {
                            f.name.type = t;
                        }
                        else {
                            ok = false;
                            f.name = p.fallbackIdent(typ.pos);
                        }
                    }
                    if (!ok) {
                        p.syntaxError("mixed named and unnamed function parameters", paramsPos);
                        break;
                    }
                    assert(f.name != null);
                    p.declare(scope, f.name, f, null);
                }
            }
            else {
                for (let f of fields) {
                    assert(f.name != null);
                    p.resolve(f.type);
                    f.name.type = p.types.resolve(f.type);
                    p.declare(scope, f.name, f, null);
                }
            }
        }
        return fields;
    }
    funBody(funcname) {
        const p = this;
        if (p.tok == token.LBRACE) {
            return p.block();
        }
        if (p.got(token.ARROWR)) {
            return p.expr(null);
        }
        const pos = p.pos;
        if (funcname) {
            p.syntaxError(`${funcname} is missing function body`, pos);
        }
        else {
            p.syntaxError("missing function body", pos);
        }
        return p.bad(pos);
    }
    block() {
        const p = this;
        const pos = p.pos;
        p.want(token.LBRACE);
        const list = p.stmtList();
        p.want(token.RBRACE);
        return new Block(pos, p.scope, list);
    }
    multiDecl(f) {
        const p = this;
        const pos = p.pos;
        p.next();
        const decls = [];
        p.appendGroup(decls, f);
        return new MultiDecl(pos, p.scope, decls);
    }
    stmtList() {
        const p = this;
        const list = [];
        while (p.tok != token.EOF &&
            p.tok != token.RBRACE &&
            p.tok != token.DEFAULT) {
            const s = p.maybeStmt();
            if (!s) {
                break;
            }
            list.push(s);
            if (p.tok == token.RPAREN || p.tok == token.RBRACE) {
                continue;
            }
            if (!p.got(token.SEMICOLON)) {
                p.syntaxError("at end of statement");
                p.advanceUntil(token.SEMICOLON, token.RBRACE);
            }
        }
        return list;
    }
    shouldStoreToEnt(ent, atScope) {
        const p = this;
        return (ent.scope === atScope
            ||
                (ent.scope !== p.filescope &&
                    ((ent.scope === p.pkgscope &&
                        atScope.fun && atScope.fun.isInit)
                        ||
                            ent.scope.funScope() === atScope.funScope())));
    }
    processAssign(lhs, rhs, decl, reqt, onlyDef) {
        const p = this;
        function maybeConvRVal(typ, rval, index) {
            if (!(rval.type instanceof UnresolvedType) &&
                !(typ instanceof UnresolvedType)) {
                const convx = p.types.convert(typ, rval);
                if (!convx) {
                    if (rval.type instanceof UnresolvedType) {
                        return;
                    }
                    p.error((rval.type instanceof UnresolvedType ?
                        `cannot convert "${rval}" to type ${typ}` :
                        `cannot convert "${rval}" (type ${rval.type}) to type ${typ}`), rval.pos);
                }
                else if (convx !== rval) {
                    assert(rhs != null);
                    rhs[index] = convx;
                }
            }
        }
        for (let i = 0; i < lhs.length; ++i) {
            const id = lhs[i];
            if (!(id instanceof Ident)) {
                debuglog(`TODO LHS is not an id (type is ${id.constructor.name})`);
                continue;
            }
            if (!onlyDef && rhs && id.ent && p.shouldStoreToEnt(id.ent, id.scope)) {
                const rval = rhs[i];
                id.incrWrite();
                let typ = id.ent.type;
                if (!typ) {
                    const typexpr = id.ent.getTypeExpr();
                    assert(typexpr != null, 'null ent (internal parser error)');
                    typ = p.types.resolve(typexpr);
                }
                id.type = typ;
                maybeConvRVal(typ, rval, i);
                continue;
            }
            id.ent = null;
            const rval = rhs ? rhs[i] : null;
            if (reqt) {
                id.type = reqt;
                if (rval) {
                    maybeConvRVal(reqt, rval, i);
                }
            }
            else {
                assert(rval, "processAssign called with no reqt and no rvals");
                id.type = p.types.resolve(rval);
            }
            if (p.unresolved) {
                p.unresolved.delete(id);
            }
            p.declare(id.scope, id, decl, rval);
            if (id.type instanceof UnresolvedType) {
                id.type.addRef(id);
            }
        }
    }
    assignment(lhs, reqt = null) {
        const p = this;
        p.want(token.ASSIGN);
        const s = new Assignment(lhs[0].pos, p.scope, token.ASSIGN, lhs, []);
        s.rhs = p.exprList(s);
        p.processAssign(s.lhs, s.rhs, s, reqt, false);
        p.types.resolve(s);
        return s;
    }
    simpleStmt(lhs) {
        const p = this;
        if (p.tok == token.ASSIGN) {
            return p.assignment(lhs);
        }
        if (p.tok == token.NAME && lhs.every(x => x instanceof Ident)) {
            for (let i = 0; i < lhs.length; i++) {
                let x = lhs[i];
                if (x.ent) {
                    x.unrefEnt();
                }
                else {
                    assert(p.unresolved != null);
                    p.unresolved.delete(x);
                }
            }
            return p.varDecl(lhs[0].pos, lhs);
        }
        const pos = lhs[0].pos;
        if (lhs.length != 1) {
            p.syntaxError('expecting "=" or ","');
            p.advanceUntil(token.SEMICOLON, token.RBRACE);
            return lhs[0];
        }
        let t = p.types.resolve(lhs[0]);
        if (token.assignop_beg < p.tok && p.tok < token.assignop_end) {
            let op = p.tok;
            p.next();
            switch (op) {
                case token.ADD_ASSIGN:
                    op = token.ADD;
                    break;
                case token.SUB_ASSIGN:
                    op = token.SUB;
                    break;
                case token.MUL_ASSIGN:
                    op = token.MUL;
                    break;
                case token.QUO_ASSIGN:
                    op = token.QUO;
                    break;
                case token.REM_ASSIGN:
                    op = token.REM;
                    break;
                case token.AND_ASSIGN:
                    op = token.AND;
                    break;
                case token.OR_ASSIGN:
                    op = token.OR;
                    break;
                case token.XOR_ASSIGN:
                    op = token.XOR;
                    break;
                case token.SHL_ASSIGN:
                    op = token.SHL;
                    break;
                case token.SHR_ASSIGN:
                    op = token.SHR;
                    break;
                case token.AND_NOT_ASSIGN:
                    op = token.AND_NOT;
                    break;
                default:
                    assert(false, `unexpected operator token ${token[op]}`);
            }
            const s = new Assignment(pos, p.scope, op, lhs, []);
            s.rhs = p.exprList(s);
            p.types.resolve(s);
            return s;
        }
        if (p.tok == token.INC || p.tok == token.DEC) {
            const op = p.tok;
            p.next();
            if (!(t instanceof IntType) && !(t instanceof UnresolvedType)) {
                this.syntaxError(`cannot mutate ${lhs[0]}`, lhs[0].pos);
            }
            let s = new Assignment(pos, p.scope, op, lhs, emptyExprList);
            p.types.resolve(s);
            return s;
        }
        if (p.tok == token.ARROWL) {
            p.syntaxError("TODO simpleStmt ARROWL");
        }
        if (p.tok == token.ARROWR) {
            p.syntaxError("TODO simpleStmt ARROWR");
        }
        return lhs[0];
    }
    maybeStmt() {
        const p = this;
        switch (p.tok) {
            case token.NAME:
            case token.NAMEAT:
                return p.simpleStmt(p.exprList(null));
            case token.LBRACE:
                p.pushScope();
                const s = p.block();
                p.popScope();
                return s;
            case token.TYPE:
                return p.multiDecl(p.typeDecl);
            case token.ADD:
            case token.SUB:
            case token.MUL:
            case token.AND:
            case token.NOT:
            case token.XOR:
            case token.FUN:
            case token.LPAREN:
            case token.LBRACKET:
            case token.INTERFACE:
                return p.simpleStmt(p.exprList(null));
            case token.WHILE:
                return p.whileStmt();
            case token.IF:
                return p.ifExpr(null);
            case token.RETURN:
                return p.returnStmt();
            default:
                if (token.literal_beg < p.tok && p.tok < token.literal_end) {
                    return p.simpleStmt(p.exprList(null));
                }
        }
        return null;
    }
    whileStmt() {
        const p = this;
        const pos = p.pos;
        const scope = p.scope;
        p.want(token.WHILE);
        const cond = p.expr(null);
        p.types.resolve(cond);
        const body = p.expr(null);
        return new WhileStmt(pos, scope, cond, body);
    }
    ifExpr(ctx) {
        const p = this;
        p.pushScope();
        const s = p.ifExpr2(ctx);
        p.popScope();
        return s;
    }
    ifExpr2(ctx) {
        const p = this;
        const pos = p.pos;
        const scope = p.scope;
        p.want(token.IF);
        const cond = p.expr(ctx);
        p.types.resolve(cond);
        const then = p.expr(ctx);
        const s = new IfExpr(pos, scope, cond, then, null);
        if (p.got(token.ELSE)) {
            if (p.tok == token.IF) {
                s.els_ = p.ifExpr2(ctx);
            }
            else {
                p.pushScope();
                s.els_ = p.expr(ctx);
                p.popScope();
            }
        }
        return s;
    }
    returnStmt() {
        const p = this;
        const pos = p.pos;
        p.want(token.RETURN);
        const fi = p.currFun();
        const frtype = fi.f.sig.result;
        assert(!frtype || frtype.type instanceof Type, "currFun sig.result type not resolved");
        const n = new ReturnStmt(pos, p.scope, builtInTypes.nil, t_nil);
        if (p.tok == token.SEMICOLON || p.tok == token.RBRACE) {
            if (frtype !== builtInTypes.nil) {
                if (frtype === null && fi.inferredReturnType == null) {
                    fi.f.sig.result = builtInTypes.nil;
                }
                else {
                    p.syntaxError(`missing return value; expecting ${fi.inferredReturnType || frtype}`);
                }
            }
            return n;
        }
        const xs = p.exprList(null);
        let rval = (xs.length == 1 ? xs[0] :
            new TupleExpr(xs[0].pos, xs[0].scope, xs));
        if (frtype === builtInTypes.nil) {
            p.syntaxError("function does not return a value", rval.pos);
            return n;
        }
        const rtype = p.types.resolve(rval);
        n.result = rval;
        n.type = rtype;
        if (frtype === null) {
            fi.addInferredReturnType(rtype);
        }
        else {
            assert(frtype.type);
            const funResType = frtype.type;
            if (!(rtype instanceof UnresolvedType) &&
                !rtype.equals(funResType)) {
                const convexpr = p.types.convert(funResType, rval);
                if (convexpr) {
                    n.result = convexpr;
                    n.type = funResType;
                }
                else {
                    p.syntaxError((rval.type instanceof UnresolvedType ?
                        `cannot use "${rval}" as return type ${frtype}` :
                        `cannot use "${rval}" (type ${rval.type}) as return type ${frtype}`), rval.pos);
                }
            }
        }
        return n;
    }
    exprList(ctx) {
        const p = this;
        const list = [p.expr(ctx)];
        while (p.got(token.COMMA)) {
            list.push(p.expr(ctx));
        }
        return list;
    }
    expr(ctx) {
        const p = this;
        return p.binaryExpr(prec.LOWEST, ctx);
    }
    binaryExpr(pr, ctx) {
        const p = this;
        let x = p.unaryExpr(ctx);
        while ((token.operator_beg < p.tok && p.tok < token.operator_end) &&
            p.prec > pr) {
            const pos = p.pos;
            const tprec = p.prec;
            const op = p.tok;
            p.next();
            x = new Operation(pos, p.scope, op, x, p.binaryExpr(tprec, ctx));
            p.types.resolve(x);
        }
        return x;
    }
    unaryExpr(ctx) {
        const p = this;
        const t = p.tok;
        const pos = p.pos;
        switch (t) {
            case token.ADD:
            case token.SUB:
            case token.NOT:
            case token.XOR: {
                p.next();
                let x = new Operation(pos, p.scope, t, p.unaryExpr(ctx));
                p.types.resolve(x);
                let isint = x.type instanceof IntType;
                if (!isint && t != token.ADD && t != token.SUB) {
                    p.syntaxError(`invalid operation ${tokstr(t)} ${p.types.resolve(x.x)}`);
                }
                return x;
            }
        }
        return p.primExpr(ctx);
    }
    primExpr(ctx) {
        const p = this;
        let x = p.operand(ctx);
        loop: while (true)
            switch (p.tok) {
                case token.LPAREN:
                    x = p.call(x, ctx);
                    break;
                case token.LBRACKET:
                    x = p.bracketExpr(x, ctx);
                    break;
                case token.DOT:
                    x = p.selectorExpr(x, ctx);
                    break;
                default:
                    break loop;
            }
        return x;
    }
    call(fun, ctx) {
        const p = this;
        const pos = p.pos;
        const args = [];
        let hasDots = false;
        p.want(token.LPAREN);
        while (p.tok != token.EOF && p.tok != token.RPAREN) {
            args.push(p.expr(ctx));
            hasDots = p.got(token.ELLIPSIS);
            if (!p.ocomma(token.RPAREN) || hasDots) {
                break;
            }
        }
        p.want(token.RPAREN);
        return new CallExpr(pos, p.scope, fun, args, hasDots);
    }
    operand(ctx) {
        const p = this;
        switch (p.tok) {
            case token.NAME:
            case token.NAMEAT:
                return p.dotident(ctx, p.resolve(p.ident()));
            case token.LPAREN:
                return p.parenExpr(ctx);
            case token.FUN:
                return p.funExpr(ctx);
            case token.LBRACE:
                p.pushScope();
                const b = p.block();
                p.popScope();
                return b;
            case token.IF:
                return p.ifExpr(ctx);
            case token.STRING:
                return p.strlit();
            case token.INT:
            case token.INT_BIN:
            case token.INT_OCT:
            case token.INT_HEX:
                return p.intLit(ctx, p.tok);
            case token.CHAR:
                return p.charLit(ctx);
            case token.FLOAT:
                return p.floatLit(ctx);
            default: {
                const x = p.bad();
                p.syntaxError("expecting expression");
                return x;
            }
        }
    }
    charLit(ctx) {
        const p = this;
        assert(p.int32val >= 0, 'negative character value');
        const x = new CharLit(p.pos, p.scope, p.int32val);
        p.next();
        return p.numLitConv(x, p.ctxType(ctx));
    }
    floatLit(ctx) {
        const p = this;
        assert(!isNaN(p.floatval), 'scanner produced invalid number');
        const x = new FloatLit(p.pos, p.scope, p.floatval, t_f64);
        p.next();
        return p.numLitConv(x, p.ctxType(ctx));
    }
    intLit(ctx, tok) {
        const p = this;
        let x;
        if (p.int64val) {
            if (p.int64val.isSigned || p.int64val.lte(SInt64.MAX)) {
                x = new IntLit(p.pos, p.scope, p.int64val.toSigned(), t_i64, tok);
            }
            else {
                assert(p.int64val instanceof UInt64);
                x = new IntLit(p.pos, p.scope, p.int64val, t_u64, tok);
            }
        }
        else {
            const t = p.int32val <= 0x7fffffff ? t_i32 : t_u32;
            x = new IntLit(p.pos, p.scope, p.int32val, t, tok);
        }
        p.next();
        return p.numLitConv(x, p.ctxType(ctx));
    }
    numLitConv(x, reqt) {
        if (reqt) {
            const p = this;
            if (reqt instanceof NumType) {
                if (!x.convertToType(reqt)) {
                    let xt = x.type;
                    let xv = x.value;
                    if ((xt instanceof IntType) == (reqt instanceof IntType)) {
                        p.syntaxError(`constant ${xv} overflows ${reqt.name}`, x.pos);
                    }
                    else {
                        p.syntaxError(`constant ${xv} truncated to ${reqt.name}`, x.pos);
                    }
                }
            }
            else {
                p.syntaxError(`invalid value ${x.value} for type ${reqt}`, x.pos);
            }
        }
        return x;
    }
    strlit() {
        const p = this;
        assert(p.tok == token.STRING);
        const bytes = p.takeByteValue();
        const t = p.types.getStrType(bytes.length);
        const n = new StringLit(p.pos, p.scope, bytes, t);
        p.next();
        return n;
    }
    selectorExpr(operand, ctx) {
        const p = this;
        p.want(token.DOT);
        const pos = p.pos;
        let rhs;
        switch (p.tok) {
            case token.NAME:
                rhs = p.dotident(ctx, p.ident());
                break;
            case token.INT:
            case token.INT_BIN:
            case token.INT_OCT:
            case token.INT_HEX:
                let x = new IndexExpr(pos, p.scope, operand, p.intLit(ctx, p.tok));
                if (operand.type instanceof TupleType) {
                    if (!p.types.maybeResolveTupleAccess(x)) {
                        x.type = p.types.markUnresolved(x);
                    }
                }
                else {
                    x.type = p.types.markUnresolved(x);
                    p.syntaxError(`numeric field access on non-tuple type ${operand.type}`, pos);
                }
                return x;
            default:
                p.syntaxError('expecting name or integer after "."');
                rhs = p.bad(pos);
                break;
        }
        return new SelectorExpr(pos, p.scope, operand, rhs);
    }
    dotident(ctx, ident) {
        const p = this;
        return p.tok == token.DOT ? p.selectorExpr(ident, ctx) : ident;
    }
    bracketExpr(operand, ctx) {
        const p = this;
        const pos = p.pos;
        p.want(token.LBRACKET);
        let x1 = null;
        if (p.tok != token.COLON) {
            x1 = p.expr(ctx);
        }
        if (p.got(token.COLON)) {
            let endx = null;
            if (!p.got(token.RBRACKET)) {
                endx = p.expr(ctx);
                p.want(token.RBRACKET);
            }
            let x = new SliceExpr(pos, p.scope, operand, x1, endx);
            if (operand.type instanceof TupleType) {
                if (!p.types.tupleSlice(x)) {
                    x.type = p.types.markUnresolved(x);
                }
            }
            else
                debuglog(`TODO handle uniform slice operand ${operand.type}`);
            return x;
        }
        p.want(token.RBRACKET);
        assert(x1 != null);
        assert(x1 instanceof Expr);
        let x = new IndexExpr(pos, p.scope, operand, x1);
        if (operand.type instanceof TupleType) {
            if (!p.types.maybeResolveTupleAccess(x)) {
                x.type = p.types.markUnresolved(x);
            }
            return x;
        }
        debuglog(`TODO resolve item type for uniform operand of type ${operand.type}`);
        x.type = p.types.markUnresolved(x);
        return x;
    }
    parenExpr(ctx) {
        const p = this;
        const pos = p.pos;
        p.want(token.LPAREN);
        const l = [];
        while (true) {
            l.push(p.expr(ctx));
            if (p.tok == token.ASSIGN) {
                const x = p.assignment(l);
                p.want(token.RPAREN);
                return x;
            }
            if (!p.ocomma(token.RPAREN)) {
                break;
            }
            if (p.tok == token.RPAREN) {
                break;
            }
        }
        p.want(token.RPAREN);
        return (l.length == 1 ? l[0] :
            new TupleExpr(pos, p.scope, l));
    }
    bad(pos) {
        const p = this;
        return new BadExpr(pos === undefined ? p.pos : pos, p.scope);
    }
    badTypeExpr(pos) {
        const p = this;
        return new BadTypeExpr(pos === undefined ? p.pos : pos, p.scope);
    }
    maybeType() {
        const p = this;
        switch (p.tok) {
            case token.NAME:
                const x = p.dotident(null, p.resolve(p.ident()));
                return new TypeExpr(x.pos, x.scope, p.types.resolve(x));
            case token.LPAREN:
                return p.tupleType();
            case token.LBRACE:
                debuglog(`TODO: parse struct type def`);
                return null;
            default:
                return null;
        }
    }
    type() {
        const p = this;
        let t = p.maybeType();
        if (t) {
            return t;
        }
        t = p.badTypeExpr();
        p.syntaxError("expecting type");
        p.next();
        return t;
    }
    tupleType() {
        const p = this;
        p.want(token.LPAREN);
        const pos = p.pos;
        let tx = null;
        const types = [];
        while (p.tok != token.RPAREN) {
            tx = p.type();
            assert(tx.type, 'unresolved type');
            types.push(tx.type);
            if (!p.ocomma(token.RPAREN)) {
                break;
            }
        }
        p.want(token.RPAREN);
        if (!tx) {
            return null;
        }
        if (types.length == 1) {
            return tx;
        }
        const tupleType = p.types.getTupleType(types);
        return new TypeExpr(pos, p.scope, tupleType);
    }
    identList(first) {
        const p = this;
        const l = [first];
        while (p.got(token.COMMA)) {
            l.push(p.ident());
        }
        return l;
    }
    ident() {
        const p = this;
        const pos = p.pos;
        if (p.tok == token.NAME) {
            const s = p.strSet.emplace(p.takeByteValue(), p.hash);
            p.next();
            return new Ident(pos, p.scope, s);
        }
        p.syntaxError("expecting identifier", pos);
        p.advanceUntil();
        return new Ident(pos, p.scope, p._id__);
    }
    maybeIdent() {
        const p = this;
        return (p.tok == token.NAME) ? p.ident() : null;
    }
    fallbackIdent(pos) {
        const p = this;
        return new Ident(pos === undefined ? p.pos : pos, p.scope, p._id__);
    }
    osemi(follow) {
        const p = this;
        switch (p.tok) {
            case token.SEMICOLON:
                p.next();
                return true;
            case token.RPAREN:
            case token.RBRACE:
                return true;
        }
        p.syntaxError("expecting semicolon, newline, or " + tokstr(follow));
        p.advanceUntil(follow);
        return false;
    }
    ocomma(follow) {
        const p = this;
        switch (p.tok) {
            case token.COMMA:
                p.next();
                return true;
            case token.RPAREN:
            case token.RBRACE:
                return true;
        }
        p.syntaxError("expecting comma, or " + tokstr(follow));
        p.advanceUntil(follow);
        return false;
    }
    appendGroup(list, f) {
        const p = this;
        let i = 0;
        if (p.got(token.LPAREN)) {
            const g = new Group();
            while (p.tok != token.EOF && p.tok != token.RPAREN) {
                list.push(f(g, i++));
                if (!p.osemi(token.RPAREN)) {
                    break;
                }
            }
            p.want(token.RPAREN);
        }
        else {
            list.push(f(null, i));
        }
    }
    advanceUntil(...followlist) {
        const p = this;
        if (followlist.length == 0) {
            p.next();
            return;
        }
        if (p.fnest > 0) {
            loop1: while (!followlist.includes(p.tok)) {
                switch (p.tok) {
                    case token.EOF:
                    case token.BREAK:
                    case token.CONTINUE:
                    case token.DEFER:
                    case token.FALLTHROUGH:
                    case token.FOR:
                    case token.FUN:
                    case token.GO:
                    case token.IF:
                    case token.RETURN:
                    case token.SELECT:
                    case token.SWITCH:
                    case token.TYPE:
                        break loop1;
                }
                p.next();
            }
        }
        else {
            while (!(p.tok == token.EOF || followlist.includes(p.tok))) {
                p.next();
            }
        }
    }
    syntaxError(msg, pos = this.pos) {
        const p = this;
        const position = p.sfile.position(pos);
        if (msg == "") {
        }
        else if (msg.startsWith("in ") ||
            msg.startsWith("at ") ||
            msg.startsWith("after ")) {
            msg = " " + msg;
        }
        else if (msg.startsWith("expecting ")) {
            msg = ", " + msg;
        }
        else {
            p.errorAt(msg, position);
            return;
        }
        let cond = (p.tok == token.EOF ? 'unexpected end of input' :
            `unexpected ${tokstr(p.tok)}`);
        p.errorAt(cond + msg, position);
        if (DEBUG) {
            console.error(`  p.tok = ${token[p.tok]} ${tokstr(p.tok)}`);
        }
    }
    diag(k, msg, pos = this.pos, code) {
        const p = this;
        if (k == "error") {
            p.error(msg, pos, code);
        }
        else if (p.diagh) {
            p.diagh(p.sfile.position(pos), msg, k);
        }
    }
}
function isEmptyFunExpr(d) {
    return d instanceof FunExpr && !d.body;
}
//# sourceMappingURL=parser.js.map

class pkgBinder extends ErrorReporter {
    constructor(pkg, fset, importer, types, errh) {
        super('E_RESOLVE', errh);
        this.pkg = pkg;
        this.fset = fset;
        this.importer = importer;
        this.types = types;
        this.errorCount = 0;
        this.imports = new Map();
        this.undef = null;
    }
    bind() {
        const b = this;
        return Promise.all(b.pkg.files.map(f => this._resolveImports(f))).then(() => {
            if (b.errorCount > 0) {
                return;
            }
            for (let f of b.pkg.files) {
                b._resolveIdents(f);
            }
            b._resolveTypes();
        });
    }
    _resolveImports(f) {
        const b = this;
        if (!f.imports || f.imports.length == 0) {
            return Promise.resolve();
        }
        const pv = [];
        for (let decl of f.imports) {
            if (!b.importer) {
                b.error(`unresolvable import ${decl.path}`, decl.path.pos);
                break;
            }
            const path = decodeToString(decl.path.value);
            pv.push(b.importer(b.imports, path)
                .then((pkg) => { b.integrateImport(f, decl, pkg); })
                .catch(err => {
                b.error(`could not import ${path} (${err.message || err})`, decl.path.pos);
            }));
        }
        return Promise.all(pv).then(() => { });
    }
    integrateImport(f, imp, pkg) {
        let name = imp.localIdent ? imp.localIdent.value : pkg.name;
        if (name.toString() == ".") {
        }
        else if (name.toString() != "_") {
            f.scope.declareEnt(new Ent(name, imp, null, null, pkg.data));
        }
    }
    _resolveIdents(f) {
        const b = this;
        if (f.unresolved)
            for (let id of f.unresolved) {
                let ent = f.scope.lookup(id.value);
                if (!ent) {
                    b.error(`${id} undefined`, id.pos);
                    if (!b.undef) {
                        b.undef = new Set();
                    }
                    b.undef.add(id);
                    continue;
                }
                debuglog(`${id} (${ent.value && ent.value.constructor.name})` +
                    ` at ${b.fset.position(id.pos)}`);
                id.refEnt(ent);
                let t = id.type;
                if (t instanceof UnresolvedType) {
                    assert(ent.value != null);
                    id.type = b.types.resolve(ent.value);
                    assert(!(id.type instanceof UnresolvedType), 'still unresolved');
                    debuglog('len(t.refs):', t.refs ? t.refs.size : 0);
                    if (t.refs)
                        for (let ref of t.refs) {
                            if (ref instanceof FunSig || ref instanceof FunType) {
                                ref.result = id.type;
                            }
                            else {
                                assert(ref instanceof Expr);
                                ref.type = id.type;
                            }
                        }
                }
            }
    }
    _resolveTypes() {
        const b = this;
        for (let ut of b.types.unresolved) {
            const expr = ut.def;
            assert(expr instanceof Expr);
            const t = expr.type;
            if (!(t instanceof UnresolvedType)) {
                continue;
            }
            if (b.undef && expr instanceof Ident && b.undef.has(expr)) {
                continue;
            }
            expr.type = null;
            const restyp = b.types.maybeResolve(expr);
            if (!restyp) {
                expr.type = t;
                debuglog(`cannot resolve type of ${expr} ${b.fset.position(expr.pos)}`);
                continue;
            }
            if (t.refs)
                for (let ref of t.refs) {
                    if (ref instanceof FunSig || ref instanceof FunType) {
                        ref.result = restyp;
                    }
                    else {
                        assert(ref instanceof Expr);
                        ref.type = restyp;
                    }
                }
        }
    }
    error(msg, pos, c) {
        const b = this;
        b.errorAt(msg, b.fset.position(pos), c);
    }
}
function bindpkg(pkg, fset, importer, typeres, errh) {
    const b = new pkgBinder(pkg, fset, importer, typeres, errh);
    return b.bind().then(() => b.errorCount != 0);
}
//# sourceMappingURL=bind.js.map

const NoPos = 0;

class Position {
    constructor(filename = '', offset = 0, line = 0, column = 0) {
        this.filename = filename;
        this.offset = offset;
        this.line = line;
        this.column = column;
    }
    isValid() {
        return this.line > 0;
    }
    toString() {
        let p = this;
        let s = p.filename;
        if (p.isValid()) {
            if (s) {
                s += ":";
            }
            s += `${p.line}:${p.column}`;
        }
        return s || "-";
    }
}
const invalidPosition = new Position();
class SrcFile {
    constructor(name, base, size, lines) {
        this.name = name;
        this.base = base;
        this.size = size;
        this.lines = lines;
        this.infos = [];
    }
    get lineCount() {
        return this.lines.length;
    }
    addLine(offset) {
        const f = this;
        const i = f.lines.length;
        if ((i === 0 || f.lines[i - 1] < offset) && offset < f.size) {
            f.lines.push(offset);
        }
    }
    addLineInfo(offset, filename, line) {
        const f = this;
        const i = f.infos.length;
        if (i == 0 || f.infos[i - 1].offset < offset && offset < f.size) {
            f.infos.push({ offset, filename, line });
        }
    }
    pos(offset) {
        const f = this;
        if (offset > f.size) {
            panic("illegal file offset");
        }
        return f.base + offset;
    }
    offset(p) {
        const f = this;
        if (p < f.base || p > f.base + f.size) {
            panic("illegal Pos value");
        }
        return p - f.base;
    }
    position(p, adjusted = true) {
        const f = this;
        if (p == NoPos) {
            return invalidPosition;
        }
        if (p < f.base || p > f.base + f.size) {
            panic("illegal Pos value");
        }
        return f._position(p, adjusted);
    }
    _position(p, adjusted) {
        const f = this;
        const offset = p - f.base;
        let filename = f.name;
        let line = 0, column = 0;
        let i = searchInts(f.lines, offset);
        if (i >= 0) {
            line = i + 1;
            column = offset - f.lines[i] + 1;
        }
        if (adjusted && f.infos.length > 0) {
            let i = searchLineInfos(f.infos, offset);
            if (i >= 0) {
                const alt = f.infos[i];
                filename = alt.filename;
                i = searchInts(f.lines, alt.offset);
                if (i >= 0) {
                    line += alt.line - i - 1;
                }
            }
        }
        return new Position(filename, offset, line, column);
    }
}
function searchLineInfos(a, x) {
    return search(a.length, (i) => a[i].offset > x) - 1;
}
class SrcFileSet {
    constructor(base = 1, files = [], last = null) {
        this.base = base;
        this.files = files;
        this.last = last;
    }
    addFile(filename, size, base = -1) {
        const s = this;
        if (base < 0) {
            base = s.base;
        }
        if (base < s.base || size < 0) {
            panic("illegal base or size");
        }
        const f = new SrcFile(filename, base, size, [0]);
        base += size + 1;
        if (base < 0) {
            panic("Pos offset overflow (too much source code in file set)");
        }
        s.base = base;
        s.files.push(f);
        s.last = f;
        return f;
    }
    findFile(p) {
        if (p == NoPos) {
            return null;
        }
        const s = this;
        let f = s.last;
        if (f && f.base <= p && p <= f.base + f.size) {
            return f;
        }
        let i = searchFiles(s.files, p);
        if (i >= 0) {
            f = s.files[i];
            if (p <= f.base + f.size) {
                s.last = f;
                return f;
            }
        }
        return null;
    }
    position(p, adjusted = true) {
        const f = this.findFile(p);
        return f ? f.position(p, adjusted) : invalidPosition;
    }
}
function searchFiles(a, x) {
    return search(a.length, (i) => a[i].base > x) - 1;
}
function searchInts(a, x) {
    let i = 0, j = a.length;
    while (i < j) {
        const h = i + (((j - i) / 2) >> 0);
        if (a[h] <= x) {
            i = h + 1;
        }
        else {
            j = h;
        }
    }
    return i - 1;
}
//# sourceMappingURL=pos.js.map

let _nextId = 0;
class ByteStr {
    constructor(hash, bytes) {
        this.hash = hash;
        this.bytes = bytes;
        this._id = _nextId++;
    }
    isUnderscore() {
        return this.hash == 0xda0c1970 && this.bytes[0] == 0x5f;
    }
    toString() {
        return decodeToString(this.bytes);
    }
    equals(other) {
        return (this.hash == other.hash &&
            this.bytes.length == other.bytes.length &&
            bufcmp$1(this.bytes, other.bytes) == 0);
    }
}
class ByteStrSet {
    constructor() {
        this._m = new Map();
    }
    emplace(value, hash = 0) {
        if (!hash) {
            hash = hashBytes(value, 0, value.length);
        }
        let v = this._m.get(hash);
        if (v) {
            for (let bs of v) {
                if (bs.bytes.length == value.length && bufcmp$1(bs.bytes, value) == 0) {
                    return bs;
                }
            }
            const bs = new ByteStr(hash, value);
            v.push(bs);
            return bs;
        }
        else {
            const bs = new ByteStr(hash, value);
            this._m.set(hash, [bs]);
            return bs;
        }
    }
}
function hashBytes(buf, offs, length) {
    var h = 0x811c9dc5, i = offs, e = offs + length;
    while (i < e) {
        h = (h ^ buf[i++]) * 0x1000193;
    }
    return h >>> 0;
}
function asciiByteStr(s) {
    let b = asciibuf(s);
    return new ByteStr(hashBytes(b, 0, b.length), b);
}
//# sourceMappingURL=bytestr.js.map

class TypeSet {
    constructor() {
        this.types = new Map();
    }
    intern(t) {
        let s = this.types.get(t.constructor);
        if (s) {
            for (let i of s) {
                if (i.equals(t)) {
                    assert(i instanceof t.constructor);
                    return i;
                }
            }
            s.add(t);
        }
        else {
            this.types.set(t.constructor, new Set([t]));
        }
        return t;
    }
}
//# sourceMappingURL=typeset.js.map

class ReprCtx {
    constructor() {
        this.groupIds = new Map();
        this.nextGroupId = 0;
        this.ind = '  ';
        this.typedepth = 0;
        this.style = termColorSupport ? style : noStyle;
    }
    groupId(g) {
        let gid = g.id || this.groupIds.get(g);
        if (gid === undefined) {
            gid = this.nextGroupId++;
            this.groupIds.set(g, gid);
        }
        return gid.toString(36);
    }
}
const defaultCtx = new ReprCtx();
function astRepr(n, options) {
    let ctx = defaultCtx;
    if (options) {
        ctx = new ReprCtx();
        if (options.colors !== undefined) {
            ctx.style = options.colors ? style : noStyle;
        }
    }
    if (n instanceof Package) {
        return reprpkg(n, ctx);
    }
    if (n instanceof File) {
        return reprfile(n, '\n', ctx);
    }
    else {
        return repr1(n, '\n', ctx).trim();
    }
}
function reprpkg(n, c) {
    let s = `(pkg "${n.name.replace(/"/g, '\\"')}"`;
    if (n.files.length) {
        let nl = '\n  ';
        for (let f of n.files) {
            s += nl + reprfile(f, nl, c);
        }
        s = s.trimRight() + '\n';
    }
    return s + ')';
}
function reprfile(n, nl, c) {
    let s = `(file "${n.sfile.name.replace(/"/g, '\\"')}"`;
    if (n.decls.length) {
        let nl2 = nl + '  ';
        for (let d of n.decls) {
            s += nl2 + repr1(d, nl2, c);
        }
        s = s.trimRight() + nl;
    }
    return s + ')';
}
function reprt(t, _newline, c) {
    return c.style.blue(`<${t || 'nil'}>`);
}
function reprv(nv, newline, c, delims = '()') {
    return ((delims[0] || '') +
        nv.map(n => repr1(n, newline, c)).join(' ') +
        (delims[1] || ''));
}
function reprid(id, c) {
    return (decodeToString(id.value.bytes));
}
function reprcons(n, c) {
    return c.style.grey(n.constructor.name);
}
function repr1(n, newline, c, flag = 0) {
    assert(n);
    if (n instanceof Atom) {
        return c.style.purple(c.style.bold(n.name));
    }
    if (n instanceof NumLit) {
        return reprt(n.type, newline, c) + c.style.green(n.value.toString());
    }
    if (n instanceof StringLit) {
        let s = JSON.stringify(decodeToString(n.value));
        return reprt(n.type, newline, c) + c.style.green(s);
    }
    if (n instanceof Ident) {
        return (c.typedepth ? '' : reprt(n.type, newline, c)) + reprid(n, c);
    }
    if (n instanceof RestTypeExpr) {
        return '...' + repr1(n.expr, newline, c);
    }
    if (n instanceof TypeExpr) {
        return reprt(n.type, newline, c);
    }
    if (n instanceof BadExpr) {
        return 'BAD';
    }
    if (n instanceof BadTypeExpr) {
        return 'BAD_TYPE';
    }
    if (n instanceof Type) {
        return c.style.blue(n.toString());
    }
    const nl2 = newline + c.ind;
    if (n instanceof Field) {
        let s = repr1(n.type, nl2, c);
        if (n.name) {
            s = '(' + repr1(n.name, nl2, c) + ' ' + s + ')';
        }
        return s;
    }
    if (n instanceof Block) {
        return (n.list.length ?
            newline + '(' + reprt(n.type, newline, c) + 'block ' +
                n.list.map(n => nl2 + repr1(n, nl2, c).trim()).join('') +
                newline + ')' :
            '(block)');
    }
    if (n instanceof WhileStmt) {
        return ('(while ' + repr1(n.cond, nl2, c) + ' ' +
            repr1(n.body, nl2, c) + newline + ')');
    }
    if (n instanceof ReturnStmt) {
        if (n.result) {
            return newline + `(return ${repr1(n.result, nl2, c)})`;
        }
        return newline + reprcons(n, c);
    }
    if (n instanceof IfExpr) {
        let s = ((flag ? '' :
            newline + '(' + reprt(n.type, newline, c)) +
            'if ' + repr1(n.cond, nl2, c) +
            repr1(n.then, newline, c));
        if (n.els_) {
            s += newline + 'else ' + repr1(n.els_, newline, c, 1);
        }
        return flag ? s : s + ')';
    }
    if (n instanceof FunSig) {
        const restype = n.result ? n.result.type : t_nil;
        return reprv(n.params, nl2, c) + ' -> ' + reprt(restype, nl2, c);
    }
    if (n instanceof Assignment) {
        let s = newline + `(${c.style.grey('assign')} `;
        s += reprv(n.lhs, nl2, c);
        if (n.op == token.ILLEGAL) {
            s += ' = ';
        }
        else {
            s += ' ' + tokstr(n.op) + ' ';
        }
        s += reprv(n.rhs, nl2, c);
        return s + ')';
    }
    if (n instanceof MultiDecl) {
        return newline + `(${reprcons(n, c)}` + ' ' + reprv(n.decls, nl2, c, '') + ')';
    }
    if (n instanceof SelectorExpr) {
        return ('(SEL ' +
            repr1(n.lhs, newline, c) + '.' +
            repr1(n.rhs, newline, c) + ')');
    }
    if (n instanceof IndexExpr) {
        return (`(${reprt(n.type, newline, c)}index ` +
            repr1(n.operand, newline, c) + ' ' +
            repr1(n.index, newline, c) +
            ')');
    }
    if (n instanceof SliceExpr) {
        return (`(${reprt(n.type, newline, c)}slice ` +
            repr1(n.operand, newline, c) + ' ' +
            (n.start ? repr1(n.start, newline, c) : 'nil') + ' ' +
            (n.end ? repr1(n.end, newline, c) : 'nil') +
            ')');
    }
    if (n instanceof Operation) {
        let ts = c.typedepth ? '' : reprt(n.type, newline, c);
        let s = '(' + ts + c.style.orange(token[n.op]) + ' ' + repr1(n.x, nl2, c);
        if (n.y) {
            s += ' ' + repr1(n.y, nl2, c);
        }
        return s + ')';
    }
    let s = '(';
    if (n instanceof Expr && !c.typedepth) {
        s += reprt(n.type, newline, c);
    }
    if (n instanceof FunExpr) {
        s += 'fun ';
        if (n.isInit) {
            s += 'init ';
        }
        else if (n.name) {
            s += reprid(n.name, c) + ' ';
        }
        s += repr1(n.sig, newline, c);
        if (n.body) {
            s += ' ' + repr1(n.body, nl2, c);
        }
        return s + ')';
    }
    s += reprcons(n, c);
    if (n instanceof ImportDecl) {
        s += ' path: ' + repr1(n.path, nl2, c);
        if (n.localIdent) {
            s += newline +
                c.ind + 'localIdent: ' + repr1(n.localIdent, nl2, c);
        }
        return s + ' )';
    }
    if (n instanceof VarDecl) {
        if (n.group) {
            s += ' [#' + c.groupId(n.group) + ']';
        }
        if (n.type) {
            s += reprt(n.type.type, newline, c) + ' ' + reprv(n.idents, nl2, c);
        }
        else {
            s += ' (' + n.idents.map(id => reprt(id.type, newline, c) + reprid(id, c)).join(' ') + ')';
        }
        if (n.values) {
            s += ' ' + reprv(n.values, nl2, c);
        }
        return s + ')';
    }
    if (n instanceof TypeDecl) {
        if (n.group) {
            s += ' [#' + c.groupId(n.group) + ']';
        }
        s += ' ' + repr1(n.ident, nl2, c);
        if (n.alias) {
            s += ' =';
        }
        return s + ' ' + repr1(n.type, nl2, c) + ')';
    }
    if (n instanceof CallExpr) {
        s += ' ' + repr1(n.fun, newline, c) + ' (';
        s += reprv(n.args, nl2, c, '');
        if (n.hasDots) {
            s += '...';
        }
        return s + '))';
    }
    if (n instanceof TypeConvExpr) {
        return s + ' ' + repr1(n.expr, newline, c) + ')';
    }
    if (n instanceof TupleExpr) {
        return s + ' ' + reprv(n.exprs, nl2, c, '') + ')';
    }
    if (n.constructor === NoOpStmt) {
        return 'noop';
    }
    return '(???' + reprcons(n, c) + ' ' + repr(n) + ')';
}
//# sourceMappingURL=ast_repr.js.map

class Universe {
    constructor(strSet, typeSet) {
        this.strSet = strSet;
        this.typeSet = typeSet;
        const decls = new Map();
        for (let name of Object.keys(builtInTypes)) {
            const t = builtInTypes[name];
            const namebuf = strSet.emplace(asciibuf(name));
            decls.set(namebuf, new Ent(namebuf, t, null, t.type));
        }
        for (let name of Object.keys(builtInValues)) {
            const v = builtInValues[name];
            const namebuf = strSet.emplace(asciibuf(name));
            decls.set(namebuf, new Ent(namebuf, v, v, v.type));
        }
        this.scope = new Scope(null, decls);
    }
    internType(t) {
        return this.typeSet.intern(t);
    }
}
//# sourceMappingURL=universe.js.map

var TypeCompat;
(function (TypeCompat) {
    TypeCompat[TypeCompat["NO"] = 0] = "NO";
    TypeCompat[TypeCompat["LOSSY"] = 1] = "LOSSY";
    TypeCompat[TypeCompat["LOSSLESS"] = 2] = "LOSSLESS";
})(TypeCompat || (TypeCompat = {}));
const uintz = 32;
const typeCompatMap = new Map([
    [t_u64, new Map([
            [t_uint, TypeCompat.LOSSLESS],
            [t_int, TypeCompat.LOSSLESS],
            [t_i8, TypeCompat.LOSSLESS],
            [t_i16, TypeCompat.LOSSLESS],
            [t_i32, TypeCompat.LOSSLESS],
            [t_i64, TypeCompat.LOSSLESS],
            [t_u8, TypeCompat.LOSSLESS],
            [t_u16, TypeCompat.LOSSLESS],
            [t_u32, TypeCompat.LOSSLESS],
            [t_f32, TypeCompat.LOSSY],
            [t_f64, TypeCompat.LOSSY],
        ])],
    [t_i64, new Map([
            [t_uint, uintz <= 63 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
            [t_int, TypeCompat.LOSSLESS],
            [t_i8, TypeCompat.LOSSLESS],
            [t_i16, TypeCompat.LOSSLESS],
            [t_i32, TypeCompat.LOSSLESS],
            [t_u8, TypeCompat.LOSSLESS],
            [t_u16, TypeCompat.LOSSLESS],
            [t_u32, TypeCompat.LOSSLESS],
            [t_u64, TypeCompat.LOSSY],
            [t_f32, TypeCompat.LOSSY],
            [t_f64, TypeCompat.LOSSY],
        ])],
    [t_u32, new Map([
            [t_uint, uintz <= 32 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
            [t_int, uintz <= 32 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
            [t_i8, TypeCompat.LOSSLESS],
            [t_i16, TypeCompat.LOSSLESS],
            [t_i32, TypeCompat.LOSSLESS],
            [t_i64, TypeCompat.LOSSY],
            [t_u8, TypeCompat.LOSSLESS],
            [t_u16, TypeCompat.LOSSLESS],
            [t_u64, TypeCompat.LOSSY],
            [t_f32, TypeCompat.LOSSY],
            [t_f64, TypeCompat.LOSSY],
        ])],
    [t_i32, new Map([
            [t_uint, TypeCompat.LOSSY],
            [t_int, uintz <= 32 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
            [t_i8, TypeCompat.LOSSLESS],
            [t_i16, TypeCompat.LOSSLESS],
            [t_i64, TypeCompat.LOSSY],
            [t_u8, TypeCompat.LOSSLESS],
            [t_u16, TypeCompat.LOSSLESS],
            [t_u32, TypeCompat.LOSSY],
            [t_u64, TypeCompat.LOSSY],
            [t_f32, TypeCompat.LOSSY],
            [t_f64, TypeCompat.LOSSY],
        ])],
    [t_uint, new Map([
            [t_int, TypeCompat.LOSSLESS],
            [t_i8, TypeCompat.LOSSLESS],
            [t_i16, TypeCompat.LOSSLESS],
            [t_i32, TypeCompat.LOSSLESS],
            [t_i64, uintz >= 64 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
            [t_u8, TypeCompat.LOSSLESS],
            [t_u16, TypeCompat.LOSSLESS],
            [t_u32, uintz >= 32 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
            [t_u64, uintz >= 64 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
            [t_f32, TypeCompat.LOSSY],
            [t_f64, TypeCompat.LOSSY],
        ])],
    [t_int, new Map([
            [t_uint, TypeCompat.LOSSY],
            [t_i8, TypeCompat.LOSSLESS],
            [t_i16, TypeCompat.LOSSLESS],
            [t_i32, TypeCompat.LOSSLESS],
            [t_i64, uintz >= 64 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
            [t_u8, TypeCompat.LOSSLESS],
            [t_u16, TypeCompat.LOSSLESS],
            [t_u32, uintz >= 32 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
            [t_u64, TypeCompat.LOSSY],
            [t_f32, TypeCompat.LOSSY],
            [t_f64, TypeCompat.LOSSY],
        ])],
    [t_u16, new Map([
            [t_uint, TypeCompat.LOSSY],
            [t_int, TypeCompat.LOSSY],
            [t_i8, TypeCompat.LOSSLESS],
            [t_i16, TypeCompat.LOSSLESS],
            [t_i32, TypeCompat.LOSSY],
            [t_i64, TypeCompat.LOSSY],
            [t_u8, TypeCompat.LOSSLESS],
            [t_u32, TypeCompat.LOSSY],
            [t_u64, TypeCompat.LOSSY],
            [t_f32, TypeCompat.LOSSY],
            [t_f64, TypeCompat.LOSSY],
        ])],
    [t_i16, new Map([
            [t_uint, TypeCompat.LOSSY],
            [t_int, TypeCompat.LOSSY],
            [t_i8, TypeCompat.LOSSLESS],
            [t_i32, TypeCompat.LOSSY],
            [t_i64, TypeCompat.LOSSY],
            [t_u8, TypeCompat.LOSSLESS],
            [t_u16, TypeCompat.LOSSY],
            [t_u32, TypeCompat.LOSSY],
            [t_u64, TypeCompat.LOSSY],
            [t_f32, TypeCompat.LOSSY],
            [t_f64, TypeCompat.LOSSY],
        ])],
    [t_u8, new Map([
            [t_uint, TypeCompat.LOSSY],
            [t_int, TypeCompat.LOSSY],
            [t_i8, TypeCompat.LOSSLESS],
            [t_i16, TypeCompat.LOSSY],
            [t_i32, TypeCompat.LOSSY],
            [t_i64, TypeCompat.LOSSY],
            [t_u16, TypeCompat.LOSSY],
            [t_u32, TypeCompat.LOSSY],
            [t_u64, TypeCompat.LOSSY],
            [t_f32, TypeCompat.LOSSY],
            [t_f64, TypeCompat.LOSSY],
        ])],
    [t_i8, new Map([
            [t_uint, TypeCompat.LOSSY],
            [t_int, TypeCompat.LOSSY],
            [t_i16, TypeCompat.LOSSY],
            [t_i32, TypeCompat.LOSSY],
            [t_i64, TypeCompat.LOSSY],
            [t_u8, TypeCompat.LOSSY],
            [t_u16, TypeCompat.LOSSY],
            [t_u32, TypeCompat.LOSSY],
            [t_u64, TypeCompat.LOSSY],
            [t_f32, TypeCompat.LOSSY],
            [t_f64, TypeCompat.LOSSY],
        ])],
    [t_f32, new Map([
            [t_uint, TypeCompat.LOSSY],
            [t_int, TypeCompat.LOSSY],
            [t_i8, TypeCompat.LOSSLESS],
            [t_i16, TypeCompat.LOSSLESS],
            [t_i32, TypeCompat.LOSSY],
            [t_i64, TypeCompat.LOSSY],
            [t_u8, TypeCompat.LOSSLESS],
            [t_u16, TypeCompat.LOSSLESS],
            [t_u32, TypeCompat.LOSSY],
            [t_u64, TypeCompat.LOSSY],
            [t_f64, TypeCompat.LOSSY],
        ])],
    [t_f64, new Map([
            [t_uint, uintz <= 32 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
            [t_int, uintz <= 32 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
            [t_i8, TypeCompat.LOSSLESS],
            [t_i16, TypeCompat.LOSSLESS],
            [t_i32, TypeCompat.LOSSLESS],
            [t_i64, TypeCompat.LOSSY],
            [t_u8, TypeCompat.LOSSLESS],
            [t_u16, TypeCompat.LOSSLESS],
            [t_u32, TypeCompat.LOSSLESS],
            [t_u64, TypeCompat.LOSSY],
            [t_f32, TypeCompat.LOSSLESS],
        ])],
]);
function basicTypeCompat(dst, src) {
    assert(dst !== src, "same type is always compatible");
    let s = typeCompatMap.get(dst);
    return s && s.get(src) || TypeCompat.NO;
}
TEST("basicTypeCompat", () => {
    function assertTypeCompat(dst, src, expect, cons) {
        const r = basicTypeCompat(dst, src);
        assert(r === expect, `${dst}(${src}) == ${TypeCompat[r]} (expected ${TypeCompat[expect]})`, cons);
    }
    function assert_LOSSLESS(dst, src) {
        assertTypeCompat(dst, src, TypeCompat.LOSSLESS, assert_LOSSLESS);
    }
    function assert_LOSSY(dst, src) {
        assertTypeCompat(dst, src, TypeCompat.LOSSY, assert_LOSSY);
    }
    assert_LOSSLESS(t_u64, t_uint);
    assert_LOSSLESS(t_u64, t_int);
    assert_LOSSLESS(t_u64, t_i64);
    assert_LOSSLESS(t_u64, t_u32);
    assert_LOSSLESS(t_u64, t_i32);
    assert_LOSSLESS(t_u64, t_u16);
    assert_LOSSLESS(t_u64, t_i16);
    assert_LOSSLESS(t_u64, t_u8);
    assert_LOSSLESS(t_u64, t_i8);
    assert_LOSSY(t_u64, t_f32);
    assert_LOSSY(t_u64, t_f64);
    assert_LOSSLESS(t_i64, t_uint);
    if (uintz == 64) {
        assert_LOSSY(t_i64, t_int);
    }
    else {
        assert_LOSSLESS(t_i64, t_int);
    }
    assert_LOSSY(t_i64, t_u64);
    assert_LOSSLESS(t_i64, t_u32);
    assert_LOSSLESS(t_i64, t_i32);
    assert_LOSSLESS(t_i64, t_u16);
    assert_LOSSLESS(t_i64, t_i16);
    assert_LOSSLESS(t_i64, t_u8);
    assert_LOSSLESS(t_i64, t_i8);
    assert_LOSSY(t_i64, t_f32);
    assert_LOSSY(t_i64, t_f64);
    if (uintz == 64) {
        assert_LOSSY(t_u32, t_uint);
        assert_LOSSY(t_u32, t_int);
    }
    else {
        assert_LOSSLESS(t_u32, t_uint);
        assert_LOSSLESS(t_u32, t_int);
    }
    assert_LOSSY(t_u32, t_u64);
    assert_LOSSY(t_u32, t_i64);
    assert_LOSSLESS(t_u32, t_i32);
    assert_LOSSLESS(t_u32, t_u16);
    assert_LOSSLESS(t_u32, t_i16);
    assert_LOSSLESS(t_u32, t_u8);
    assert_LOSSLESS(t_u32, t_i8);
    assert_LOSSY(t_u32, t_f32);
    assert_LOSSY(t_u32, t_f64);
    assert_LOSSY(t_i32, t_uint);
    if (uintz == 64) {
        assert_LOSSY(t_i32, t_int);
    }
    else {
        assert_LOSSLESS(t_i32, t_int);
    }
    assert_LOSSY(t_i32, t_u64);
    assert_LOSSY(t_i32, t_i64);
    assert_LOSSY(t_i32, t_u32);
    assert_LOSSLESS(t_i32, t_u16);
    assert_LOSSLESS(t_i32, t_i16);
    assert_LOSSLESS(t_i32, t_u8);
    assert_LOSSLESS(t_i32, t_i8);
    assert_LOSSY(t_i32, t_f32);
    assert_LOSSY(t_i32, t_f64);
    assert_LOSSY(t_u16, t_uint);
    assert_LOSSY(t_u16, t_int);
    assert_LOSSY(t_u16, t_u64);
    assert_LOSSY(t_u16, t_i64);
    assert_LOSSY(t_u16, t_u32);
    assert_LOSSY(t_u16, t_i32);
    assert_LOSSLESS(t_u16, t_i16);
    assert_LOSSLESS(t_u16, t_u8);
    assert_LOSSLESS(t_u16, t_i8);
    assert_LOSSY(t_u16, t_f32);
    assert_LOSSY(t_u16, t_f64);
    assert_LOSSY(t_i16, t_uint);
    assert_LOSSY(t_i16, t_int);
    assert_LOSSY(t_i16, t_u64);
    assert_LOSSY(t_i16, t_i64);
    assert_LOSSY(t_i16, t_u32);
    assert_LOSSY(t_i16, t_i32);
    assert_LOSSY(t_i16, t_u16);
    assert_LOSSLESS(t_i16, t_u8);
    assert_LOSSLESS(t_i16, t_i8);
    assert_LOSSY(t_i16, t_f32);
    assert_LOSSY(t_i16, t_f64);
    assert_LOSSY(t_u8, t_uint);
    assert_LOSSY(t_u8, t_int);
    assert_LOSSY(t_u8, t_u64);
    assert_LOSSY(t_u8, t_i64);
    assert_LOSSY(t_u8, t_u32);
    assert_LOSSY(t_u8, t_i32);
    assert_LOSSY(t_u8, t_u16);
    assert_LOSSY(t_u8, t_i16);
    assert_LOSSLESS(t_u8, t_i8);
    assert_LOSSY(t_u8, t_f32);
    assert_LOSSY(t_u8, t_f64);
    assert_LOSSY(t_i8, t_uint);
    assert_LOSSY(t_i8, t_int);
    assert_LOSSY(t_i8, t_u64);
    assert_LOSSY(t_i8, t_i64);
    assert_LOSSY(t_i8, t_u32);
    assert_LOSSY(t_i8, t_i32);
    assert_LOSSY(t_i8, t_u16);
    assert_LOSSY(t_i8, t_i16);
    assert_LOSSY(t_i8, t_u8);
    assert_LOSSY(t_i8, t_f32);
    assert_LOSSY(t_i8, t_f64);
    if (uintz <= 32) {
        assert_LOSSLESS(t_f64, t_uint);
        assert_LOSSLESS(t_f64, t_int);
    }
    else {
        assert_LOSSY(t_f64, t_uint);
        assert_LOSSY(t_f64, t_int);
    }
    assert_LOSSY(t_f64, t_u64);
    assert_LOSSY(t_f64, t_i64);
    assert_LOSSLESS(t_f64, t_u32);
    assert_LOSSLESS(t_f64, t_i32);
    assert_LOSSLESS(t_f64, t_u16);
    assert_LOSSLESS(t_f64, t_i16);
    assert_LOSSLESS(t_f64, t_u8);
    assert_LOSSLESS(t_f64, t_i8);
    assert_LOSSLESS(t_f64, t_f32);
    assert_LOSSY(t_f32, t_uint);
    assert_LOSSY(t_f32, t_int);
    assert_LOSSY(t_f32, t_u64);
    assert_LOSSY(t_f32, t_i64);
    assert_LOSSY(t_f32, t_u32);
    assert_LOSSY(t_f32, t_i32);
    assert_LOSSLESS(t_f32, t_u16);
    assert_LOSSLESS(t_f32, t_i16);
    assert_LOSSLESS(t_f32, t_u8);
    assert_LOSSLESS(t_f32, t_i8);
    assert_LOSSY(t_f32, t_f64);
});
//# sourceMappingURL=typecompat.js.map

function isResolvedType(t) {
    return t ? t.constructor !== UnresolvedType : false;
}
class TypeResolver extends ErrorReporter {
    constructor() {
        super('E_RESOLVE');
        this.resolvers = new Map();
        this.maybeResolveNodeWithTypeExpr = (n) => {
            return n.type ? n.type.type : null;
        };
        this.maybeResolveIdent = (n) => {
            const r = this;
            if (n.ent) {
                if (isResolvedType(n.ent.type)) {
                    return n.ent.type;
                }
                const tx = n.ent.getTypeExpr();
                if (tx) {
                    return r.maybeResolve(tx);
                }
            }
            return null;
        };
        this.maybeResolveBlock = (n) => {
            const r = this;
            if (n.list.length == 0) {
                return t_nil;
            }
            let s = n.list[n.list.length - 1];
            if (s instanceof Expr) {
                return r.resolve(s);
            }
            return t_nil;
        };
        this.maybeResolveFunExpr = (n) => {
            const r = this;
            const s = n.sig;
            let restype = t_nil;
            if (s.result) {
                restype = r.resolve(s.result);
            }
            else {
                if (n.body) {
                    restype = r.resolve(n.body);
                }
            }
            let argtypes = s.params.map(field => r.resolve(field.type));
            let t = r.getFunType(argtypes, restype);
            if (t.result instanceof UnresolvedType) {
                t.result.addRef(t);
            }
            return t;
        };
        this.maybeResolveTupleExpr = (n) => {
            return this.maybeResolveTupleType(n.exprs);
        };
        this.maybeResolveRestTypeExpr = (n) => {
            const r = this;
            let t = r.maybeResolve(n.expr);
            return isResolvedType(t) ? r.getRestType(t) : t;
        };
        this.maybeResolveCallExpr = (n) => {
            const r = this;
            const funtype = r.resolve(n.fun);
            for (let arg of n.args) {
                r.maybeResolve(arg);
            }
            if (funtype instanceof FunType) {
                return funtype.result;
            }
            return null;
        };
        this.maybeResolveAssignment = (n) => {
            const r = this;
            if (n.lhs.length == 1) {
                return r.resolve(n.lhs[0]);
            }
            return r.maybeResolveTupleType(n.lhs);
        };
        this.maybeResolveOperation = (n) => {
            const r = this;
            const xt = r.resolve(n.x);
            if (!n.y) {
                return xt;
            }
            else {
                const yt = r.resolve(n.y);
                if (n.op > token.cmpop_beg && n.op < token.cmpop_end) {
                    return t_bool;
                }
                if (xt instanceof UnresolvedType || yt instanceof UnresolvedType) {
                    return null;
                }
                if (xt === yt || xt.equals(yt)) {
                    return xt;
                }
                let x = r.convert(xt, n.y);
                if (x) {
                    return x === n.y ? yt : r.resolve(x);
                }
                r.error(`invalid operation (mismatched types ${xt} and ${yt})`, n.pos);
            }
            return null;
        };
        this.maybeResolveIndexExpr = (n) => {
            const r = this;
            let opt = r.resolve(n.operand);
            if (opt instanceof UnresolvedType) {
                debuglog(`[index type] deferred to bind stage`);
            }
            else if (opt instanceof TupleType) {
                r.maybeResolveTupleAccess(n);
            }
            else {
                debuglog(`[index type] operand is not a tuple; opt = ${opt}`);
            }
            return n.type;
        };
        this.maybeResolveIfExpr = (n) => {
            const r = this;
            let thentyp = r.resolve(n.then);
            if (!n.els_) {
                if (thentyp instanceof StrType && thentyp.length != 0) {
                    return t_str;
                }
                return thentyp;
            }
            let eltyp = r.resolve(n.els_);
            if (eltyp.equals(thentyp)) {
                return thentyp;
            }
            if (eltyp === t_nil) {
                if (thentyp === t_nil) {
                    return t_nil;
                }
                if (thentyp instanceof BasicType) {
                    r.error(`mixing ${thentyp} and optional type`, n.pos, 'E_CONV');
                }
                return r.getOptionalType(thentyp);
            }
            if (thentyp === t_nil) {
                if (eltyp instanceof BasicType) {
                    r.error(`mixing optional and ${eltyp} type`, n.pos, 'E_CONV');
                }
                return r.getOptionalType(eltyp);
            }
            if (eltyp instanceof OptionalType) {
                if (thentyp instanceof OptionalType) {
                    if (eltyp.type instanceof StrType &&
                        thentyp.type instanceof StrType) {
                        assert(eltyp.type.length != thentyp.type.length, "str type matches but StrType.equals failed");
                        return t_stropt;
                    }
                    return r.getOptionalUnionType2(thentyp, eltyp);
                }
                return r.joinOptional(n.pos, eltyp, thentyp);
            }
            if (thentyp instanceof OptionalType) {
                return r.joinOptional(n.pos, thentyp, eltyp);
            }
            if (eltyp instanceof StrType && thentyp instanceof StrType) {
                return t_str;
            }
            if (eltyp instanceof UnionType) {
                if (thentyp instanceof OptionalType) {
                    return r.joinOptional(n.pos, thentyp, eltyp);
                }
                if (thentyp instanceof UnionType) {
                    return r.mergeUnions(thentyp, eltyp);
                }
                eltyp.add(thentyp);
                return eltyp;
            }
            if (thentyp instanceof UnionType) {
                thentyp.add(eltyp);
                return thentyp;
            }
            return r.getUnionType2(thentyp, eltyp);
        };
        this.setupResolvers();
    }
    init(fset, universe, errh) {
        const r = this;
        r.errh = errh;
        r.fset = fset;
        r.universe = universe;
        r.unresolved = new Set();
    }
    error(msg, pos = NoPos, typ) {
        const r = this;
        r.errorAt(msg, r.fset.position(pos), typ);
    }
    syntaxError(msg, pos = NoPos) {
        this.error(msg, pos, 'E_SYNTAX');
    }
    getTupleType(types) {
        return this.universe.internType(new TupleType(types));
    }
    getRestType(t) {
        return this.universe.internType(new RestType(t));
    }
    getOptionalUnionType2(l, r) {
        return this.universe.internType(new UnionType(new Set([
            l.type instanceof StrType && l.type.length != -1 ? t_stropt : l,
            r.type instanceof StrType && r.type.length != -1 ? t_stropt : r,
        ])));
    }
    getUnionType2(l, r) {
        return this.universe.internType(new UnionType(new Set([
            l instanceof StrType && l.length != -1 ? t_str : l,
            r instanceof StrType && r.length != -1 ? t_str : r,
        ])));
    }
    getFunType(args, result) {
        return this.universe.internType(new FunType(args, result));
    }
    getOptionalType(t) {
        return (t instanceof OptionalType ? t :
            t instanceof StrType ? t_stropt :
                this.universe.internType(new OptionalType(t)));
    }
    getStrType(length) {
        return (length < 0 ? t_str :
            length == 0 ? t_str0 :
                this.universe.internType(new StrType(length)));
    }
    resolve(n) {
        if (n.type instanceof Type) {
            if (n.type instanceof UnresolvedType) {
                n.type.addRef(n);
            }
            return n.type;
        }
        const r = this;
        let t = r.maybeResolve(n);
        if (!t) {
            t = r.markUnresolved(n);
            if (n instanceof SelectorExpr &&
                n.lhs instanceof Ident &&
                n.lhs.ent) {
                r.error(`${n} undefined`, n.pos);
            }
        }
        n.type = t;
        return t;
    }
    setupResolvers() {
        const r = this;
        r.resolvers.set(Field, r.maybeResolveNodeWithTypeExpr);
        r.resolvers.set(VarDecl, r.maybeResolveNodeWithTypeExpr);
        r.resolvers.set(TypeDecl, r.maybeResolveNodeWithTypeExpr);
        r.resolvers.set(Ident, r.maybeResolveIdent);
        r.resolvers.set(Block, r.maybeResolveBlock);
        r.resolvers.set(FunExpr, r.maybeResolveFunExpr);
        r.resolvers.set(TupleExpr, r.maybeResolveTupleExpr);
        r.resolvers.set(RestTypeExpr, r.maybeResolveRestTypeExpr);
        r.resolvers.set(CallExpr, r.maybeResolveCallExpr);
        r.resolvers.set(Assignment, r.maybeResolveAssignment);
        r.resolvers.set(Operation, r.maybeResolveOperation);
        r.resolvers.set(IndexExpr, r.maybeResolveIndexExpr);
        r.resolvers.set(IfExpr, r.maybeResolveIfExpr);
    }
    maybeResolve(n) {
        const r = this;
        if (isResolvedType(n.type)) {
            return n.type;
        }
        const resolver = r.resolvers.get(n.constructor);
        if (resolver) {
            return n.type = resolver(n);
        }
        debuglog(`TODO handle ${n.constructor.name}`);
        return null;
    }
    maybeResolveTupleType(exprs) {
        const r = this;
        let types = [];
        for (const x of exprs) {
            types.push(r.resolve(x));
        }
        return r.getTupleType(types);
    }
    joinOptional(pos, opt, t) {
        const r = this;
        if (opt.type.equals(t)) {
            return opt;
        }
        if (opt.type instanceof StrType && t instanceof StrType) {
            assert(opt.type.length != t.length, "str type matches but StrType.equals failed");
            return t_stropt;
        }
        if (t instanceof UnionType) {
            let ut = new UnionType(new Set([opt]));
            for (let t1 of t.types) {
                if (!(t1 instanceof OptionalType)) {
                    if (t1 instanceof BasicType) {
                        this.error(`mixing optional and ${t1} type`, pos, 'E_CONV');
                    }
                    else {
                        t1 = r.getOptionalType(t1);
                    }
                }
                ut.add(t1);
            }
            return ut;
        }
        if (t instanceof BasicType) {
            this.error(`mixing optional and ${t} type`, pos, 'E_CONV');
            return t;
        }
        return r.getOptionalType(t);
    }
    mergeOptionalUnions(a, b) {
        const r = this;
        let ut = new UnionType(new Set());
        for (let t of a.types) {
            if (!(t instanceof OptionalType)) {
                t = r.getOptionalType(t);
            }
            ut.add(t);
        }
        for (let t of b.types) {
            if (!(t instanceof OptionalType)) {
                t = r.getOptionalType(t);
            }
            ut.add(t);
        }
        return r.universe.internType(ut);
    }
    mergeUnions(a, b) {
        const r = this;
        let ut = new UnionType(new Set());
        for (let t of a.types) {
            if (t instanceof OptionalType) {
                return r.mergeOptionalUnions(a, b);
            }
            ut.add(t);
        }
        for (let t of b.types) {
            if (t instanceof OptionalType) {
                return r.mergeOptionalUnions(a, b);
            }
            ut.add(t);
        }
        return r.universe.internType(ut);
    }
    resolveIndex(x) {
        const r = this;
        let opt = r.resolve(x.operand);
        if (opt instanceof UnresolvedType) {
            debuglog(`[index type] deferred to bind stage`);
        }
        else if (opt instanceof TupleType) {
            r.maybeResolveTupleAccess(x);
        }
        else {
            debuglog(`TODO [index type] operand is not a tuple; opt = ${opt}`);
        }
        return x;
    }
    tupleSlice(x) {
        const p = this;
        let tupletype = x.operand.type;
        assert(tupletype, 'unresolved operand type');
        assert(tupletype instanceof TupleType);
        assert(tupletype.types.length > 0, 'empty tuple');
        let tuplelen = tupletype.types.length;
        let starti = 0;
        let endi = tuplelen;
        if (x.start) {
            starti = numEvalU32(x.start);
            if (starti < 0) {
                p.syntaxError(`invalid index into type ${tupletype}`, x.start.pos);
                return false;
            }
            if (starti >= tuplelen) {
                p.outOfBoundsAccess(starti, tupletype, x.start.pos);
                return false;
            }
        }
        if (x.end) {
            endi = numEvalU32(x.end);
            if (endi < 0) {
                p.syntaxError(`invalid index into type ${tupletype}`, x.end.pos);
                return false;
            }
            if (endi >= tuplelen) {
                p.outOfBoundsAccess(endi, tupletype, x.end.pos);
                return false;
            }
        }
        if (starti >= endi) {
            if (starti == endi) {
                p.syntaxError(`invalid empty slice: ${starti} == ${endi}`, x.pos);
            }
            else {
                p.syntaxError(`invalid slice index: ${starti} > ${endi}`, x.pos);
            }
            return false;
        }
        let len = endi - starti;
        if (len == 1) {
            p.syntaxError(`invalid single-element slice into type ${tupletype}`, x.pos);
            return false;
        }
        x.startnum = starti;
        x.endnum = endi;
        if (len == tuplelen) {
            x.type = tupletype;
        }
        else {
            x.type = p.getTupleType(tupletype.types.slice(starti, endi));
        }
        return true;
    }
    maybeResolveTupleAccess(x) {
        const p = this;
        let tupletype = x.operand.type;
        assert(tupletype, 'unresolved operand type');
        assert(tupletype instanceof TupleType);
        assert(tupletype.types.length > 0, 'empty tuple');
        let i = numEvalU32(x.index);
        if (i < 0) {
            if (i == -1) {
                p.outOfBoundsAccess(i, tupletype, x.index.pos);
            }
            else {
                p.syntaxError(`invalid index into type ${tupletype}`, x.index.pos);
            }
            return false;
        }
        let memberTypes = tupletype.types;
        if (i >= memberTypes.length) {
            p.outOfBoundsAccess(i, tupletype, x.index.pos);
            return false;
        }
        x.indexnum = i;
        x.type = memberTypes[i];
        return true;
    }
    outOfBoundsAccess(i, t, pos) {
        this.syntaxError(`out-of-bounds index ${i} on type ${t}`, pos);
    }
    markUnresolved(expr) {
        const t = new UnresolvedType(expr);
        debuglog(`expr ${expr} at ${this.fset.position(expr.pos)}`);
        this.unresolved.add(t);
        return t;
    }
    isConstant(x) {
        return (x instanceof LiteralExpr ||
            (x instanceof Ident && x.ent != null && x.ent.isConstant()));
    }
    convert(t, x) {
        const r = this;
        const xt = r.resolve(x);
        if (xt === t || xt.equals(t)) {
            return x;
        }
        if (r.isConstant(x) &&
            t instanceof BasicType &&
            xt instanceof BasicType) {
            switch (basicTypeCompat(t, xt)) {
                case TypeCompat.NO: {
                    return null;
                }
                case TypeCompat.LOSSY: {
                    r.error(`constant ${x} truncated to ${t}`, x.pos, 'E_CONV');
                    return new TypeConvExpr(x.pos, x.scope, x, t);
                }
                case TypeCompat.LOSSLESS: {
                    return new TypeConvExpr(x.pos, x.scope, x, t);
                }
            }
        }
        debuglog(`TODO conversion of ${x} into type ${t}`);
        return null;
    }
}
//# sourceMappingURL=resolve.js.map

const emptyRegSet = UInt64.ZERO;
const noReg = 255;
function fmtRegSet(m) {
    let s = '{';
    for (let r = 0 >>> 0; !m.isZero(); r++) {
        if (m.shr(r & 1).isZero()) {
            continue;
        }
        m = m.and(UInt64.ONE.shl(r).not());
        s += ` r${r}`;
    }
    return s == '{' ? '{}' : s + ' }';
}
function regBuilder(names) {
    const num = new Map(names.map((k, i) => [k, i]));
    return function (s) {
        let m = emptyRegSet;
        for (let r of s.trim().split(/\s+/)) {
            let n = num.get(r);
            if (n !== undefined) {
                m = m.or(UInt64.ONE.shl(n));
                continue;
            }
            panic("register " + r + " not found");
        }
        return m;
    };
}
//# sourceMappingURL=reg.js.map

class RegInfo {
    constructor(inputs = [], outputs = [], clobbers = emptyRegSet) {
        this.inputs = inputs.map((regs, idx) => ({ idx, regs }));
        this.outputs = outputs.map((regs, idx) => ({ idx, regs }));
        this.clobbers = clobbers;
    }
}
var SymEffect;
(function (SymEffect) {
    SymEffect[SymEffect["None"] = 0] = "None";
    SymEffect[SymEffect["Read"] = 1] = "Read";
    SymEffect[SymEffect["Write"] = 2] = "Write";
    SymEffect[SymEffect["Addr"] = 4] = "Addr";
    SymEffect[SymEffect["ReadWrite"] = 3] = "ReadWrite";
})(SymEffect || (SymEffect = {}));
class Op {
    constructor(name, argLen, props) {
        this.type = null;
        this.aux = null;
        this.constant = false;
        this.commutative = false;
        this.resultInArg0 = false;
        this.resultNotInArgs = false;
        this.rematerializeable = false;
        this.clobberFlags = false;
        this.call = false;
        this.nilCheck = false;
        this.faultOnNilArg0 = false;
        this.faultOnNilArg1 = false;
        this.usesScratch = false;
        this.hasSideEffects = false;
        this.zeroWidth = false;
        this.symEffect = SymEffect.None;
        this.reg = new RegInfo();
        if (props)
            for (let k in props) {
                
                this[k] = props[k];
            }
        this.name = name;
        this.argLen = argLen || 0;
    }
    toString() {
        return this.name;
    }
}
const t_addr = t_usize;
function op(name, argLen, props) {
    return new Op(name, argLen, props);
}
const ops = {
    Invalid: op("Invalid", 0),
    Unknown: op("Unknown", 0),
    Phi: op("Phi", -1, { zeroWidth: true }),
    Copy: op("Copy", 1),
    Arg: op("Arg", 0, { zeroWidth: true }),
    CallArg: op("CallArg", 1, { zeroWidth: true }),
    NilCheck: op("NilCheck", 2, { nilCheck: true, faultOnNilArg0: true }),
    Call: op("Call", 1, { aux: t_usize, call: true }),
    TailCall: op("TailCall", 1, { aux: t_usize, call: true }),
    ConstBool: op("ConstBool", 0, { aux: t_bool, constant: true }),
    ConstI8: op("ConstI8", 0, { aux: t_u8, constant: true }),
    ConstI16: op("ConstI16", 0, { aux: t_u16, constant: true }),
    ConstI32: op("ConstI32", 0, { aux: t_u32, constant: true }),
    ConstI64: op("ConstI64", 0, { aux: t_u64, constant: true }),
    ConstF32: op("ConstF32", 0, { aux: t_u32, constant: true }),
    ConstF64: op("ConstF64", 0, { aux: t_u64, constant: true }),
    SP: op("SP", 0, { zeroWidth: true }),
    SB: op("SB", 0, { type: t_usize, zeroWidth: true }),
    Load: op("Load", 2),
    Store: op("Store", 3, { type: t_addr }),
    Move: op("Move", 3, { type: t_addr }),
    Zero: op("Zero", 2, { type: t_addr }),
    AddI8: op("AddI8", 2, { commutative: true, resultInArg0: true }),
    AddI16: op("AddI16", 2, { commutative: true, resultInArg0: true }),
    AddI32: op("AddI32", 2, { commutative: true, resultInArg0: true }),
    AddI64: op("AddI64", 2, { commutative: true, resultInArg0: true }),
    AddF32: op("AddF32", 2, { commutative: true, resultInArg0: true }),
    AddF64: op("AddF64", 2, { commutative: true, resultInArg0: true }),
    SubI8: op("SubI8", 2, { resultInArg0: true }),
    SubI16: op("SubI16", 2, { resultInArg0: true }),
    SubI32: op("SubI32", 2, { resultInArg0: true }),
    SubI64: op("SubI64", 2, { resultInArg0: true }),
    SubF32: op("SubF32", 2, { resultInArg0: true }),
    SubF64: op("SubF64", 2, { resultInArg0: true }),
    MulI8: op("MulI8", 2, { commutative: true, resultInArg0: true }),
    MulI16: op("MulI16", 2, { commutative: true, resultInArg0: true }),
    MulI32: op("MulI32", 2, { commutative: true, resultInArg0: true }),
    MulI64: op("MulI64", 2, { commutative: true, resultInArg0: true }),
    MulF32: op("MulF32", 2, { commutative: true, resultInArg0: true }),
    MulF64: op("MulF64", 2, { commutative: true, resultInArg0: true }),
    DivS8: op("DivS8", 2, { resultInArg0: true }),
    DivU8: op("DivU8", 2, { resultInArg0: true }),
    DivS16: op("DivS16", 2, { resultInArg0: true }),
    DivU16: op("DivU16", 2, { resultInArg0: true }),
    DivS32: op("DivS32", 2, { resultInArg0: true }),
    DivU32: op("DivU32", 2, { resultInArg0: true }),
    DivS64: op("DivS64", 2, { resultInArg0: true }),
    DivU64: op("DivU64", 2, { resultInArg0: true }),
    DivF32: op("DivF32", 2, { resultInArg0: true }),
    DivF64: op("DivF64", 2, { resultInArg0: true }),
    RemS8: op("RemS8", 2, { resultInArg0: true }),
    RemU8: op("RemU8", 2, { resultInArg0: true }),
    RemS16: op("RemS16", 2, { resultInArg0: true }),
    RemU16: op("RemU16", 2, { resultInArg0: true }),
    RemS32: op("RemS32", 2, { resultInArg0: true }),
    RemU32: op("RemU32", 2, { resultInArg0: true }),
    RemI64: op("RemI64", 2, { resultInArg0: true }),
    RemU64: op("RemU64", 2, { resultInArg0: true }),
    AndI8: op("AndI8", 2, { commutative: true, resultInArg0: true }),
    AndI16: op("AndI16", 2, { commutative: true, resultInArg0: true }),
    AndI32: op("AndI32", 2, { commutative: true, resultInArg0: true }),
    AndI64: op("AndI64", 2, { commutative: true, resultInArg0: true }),
    OrI8: op("OrI8", 2, { commutative: true, resultInArg0: true }),
    OrI16: op("OrI16", 2, { commutative: true, resultInArg0: true }),
    OrI32: op("OrI32", 2, { commutative: true, resultInArg0: true }),
    OrI64: op("OrI64", 2, { commutative: true, resultInArg0: true }),
    XorI8: op("XorI8", 2, { commutative: true, resultInArg0: true }),
    XorI16: op("XorI16", 2, { commutative: true, resultInArg0: true }),
    XorI32: op("XorI32", 2, { commutative: true, resultInArg0: true }),
    XorI64: op("XorI64", 2, { commutative: true, resultInArg0: true }),
    ShLI8x8: op("ShLI8x8", 2, { aux: t_bool }),
    ShLI8x16: op("ShLI8x16", 2, { aux: t_bool }),
    ShLI8x32: op("ShLI8x32", 2, { aux: t_bool }),
    ShLI8x64: op("ShLI8x64", 2, { aux: t_bool }),
    ShLI16x8: op("ShLI16x8", 2, { aux: t_bool }),
    ShLI16x16: op("ShLI16x16", 2, { aux: t_bool }),
    ShLI16x32: op("ShLI16x32", 2, { aux: t_bool }),
    ShLI16x64: op("ShLI16x64", 2, { aux: t_bool }),
    ShLI32x8: op("ShLI32x8", 2, { aux: t_bool }),
    ShLI32x16: op("ShLI32x16", 2, { aux: t_bool }),
    ShLI32x32: op("ShLI32x32", 2, { aux: t_bool }),
    ShLI32x64: op("ShLI32x64", 2, { aux: t_bool }),
    ShLI64x8: op("ShLI64x8", 2, { aux: t_bool }),
    ShLI64x16: op("ShLI64x16", 2, { aux: t_bool }),
    ShLI64x32: op("ShLI64x32", 2, { aux: t_bool }),
    ShLI64x64: op("ShLI64x64", 2, { aux: t_bool }),
    ShRS8x8: op("ShRS8x8", 2, { aux: t_bool }),
    ShRS8x16: op("ShRS8x16", 2, { aux: t_bool }),
    ShRS8x32: op("ShRS8x32", 2, { aux: t_bool }),
    ShRS8x64: op("ShRS8x64", 2, { aux: t_bool }),
    ShRS16x8: op("ShRS16x8", 2, { aux: t_bool }),
    ShRS16x16: op("ShRS16x16", 2, { aux: t_bool }),
    ShRS16x32: op("ShRS16x32", 2, { aux: t_bool }),
    ShRS16x64: op("ShRS16x64", 2, { aux: t_bool }),
    ShRS32x8: op("ShRS32x8", 2, { aux: t_bool }),
    ShRS32x16: op("ShRS32x16", 2, { aux: t_bool }),
    ShRS32x32: op("ShRS32x32", 2, { aux: t_bool }),
    ShRS32x64: op("ShRS32x64", 2, { aux: t_bool }),
    ShRS64x8: op("ShRS64x8", 2, { aux: t_bool }),
    ShRS64x16: op("ShRS64x16", 2, { aux: t_bool }),
    ShRS64x32: op("ShRS64x32", 2, { aux: t_bool }),
    ShRS64x64: op("ShRS64x64", 2, { aux: t_bool }),
    ShRU8x8: op("ShRU8x8", 2, { aux: t_bool }),
    ShRU8x16: op("ShRU8x16", 2, { aux: t_bool }),
    ShRU8x32: op("ShRU8x32", 2, { aux: t_bool }),
    ShRU8x64: op("ShRU8x64", 2, { aux: t_bool }),
    ShRU16x8: op("ShRU16x8", 2, { aux: t_bool }),
    ShRU16x16: op("ShRU16x16", 2, { aux: t_bool }),
    ShRU16x32: op("ShRU16x32", 2, { aux: t_bool }),
    ShRU16x64: op("ShRU16x64", 2, { aux: t_bool }),
    ShRU32x8: op("ShRU32x8", 2, { aux: t_bool }),
    ShRU32x16: op("ShRU32x16", 2, { aux: t_bool }),
    ShRU32x32: op("ShRU32x32", 2, { aux: t_bool }),
    ShRU32x64: op("ShRU32x64", 2, { aux: t_bool }),
    ShRU64x8: op("ShRU64x8", 2, { aux: t_bool }),
    ShRU64x16: op("ShRU64x16", 2, { aux: t_bool }),
    ShRU64x32: op("ShRU64x32", 2, { aux: t_bool }),
    ShRU64x64: op("ShRU64x64", 2, { aux: t_bool }),
    EqI8: op("EqI8", 2, { commutative: true, type: t_bool }),
    EqI16: op("EqI16", 2, { commutative: true, type: t_bool }),
    EqI32: op("EqI32", 2, { commutative: true, type: t_bool }),
    EqI64: op("EqI64", 2, { commutative: true, type: t_bool }),
    EqF32: op("EqF32", 2, { commutative: true, type: t_bool }),
    EqF64: op("EqF64", 2, { commutative: true, type: t_bool }),
    NeqI8: op("NeqI8", 2, { commutative: true, type: t_bool }),
    NeqI16: op("NeqI16", 2, { commutative: true, type: t_bool }),
    NeqI32: op("NeqI32", 2, { commutative: true, type: t_bool }),
    NeqI64: op("NeqI64", 2, { commutative: true, type: t_bool }),
    NeqF32: op("NeqF32", 2, { commutative: true, type: t_bool }),
    NeqF64: op("NeqF64", 2, { commutative: true, type: t_bool }),
    LessS8: op("LessS8", 2, { type: t_bool }),
    LessU8: op("LessU8", 2, { type: t_bool }),
    LessS16: op("LessS16", 2, { type: t_bool }),
    LessU16: op("LessU16", 2, { type: t_bool }),
    LessS32: op("LessS32", 2, { type: t_bool }),
    LessU32: op("LessU32", 2, { type: t_bool }),
    LessS64: op("LessS64", 2, { type: t_bool }),
    LessU64: op("LessU64", 2, { type: t_bool }),
    LessF32: op("LessF32", 2, { type: t_bool }),
    LessF64: op("LessF64", 2, { type: t_bool }),
    LeqS8: op("LeqS8", 2, { type: t_bool }),
    LeqU8: op("LeqU8", 2, { type: t_bool }),
    LeqS16: op("LeqS16", 2, { type: t_bool }),
    LeqU16: op("LeqU16", 2, { type: t_bool }),
    LeqS32: op("LeqS32", 2, { type: t_bool }),
    LeqU32: op("LeqU32", 2, { type: t_bool }),
    LeqS64: op("LeqS64", 2, { type: t_bool }),
    LeqU64: op("LeqU64", 2, { type: t_bool }),
    LeqF32: op("LeqF32", 2, { type: t_bool }),
    LeqF64: op("LeqF64", 2, { type: t_bool }),
    GreaterS8: op("GreaterS8", 2, { type: t_bool }),
    GreaterU8: op("GreaterU8", 2, { type: t_bool }),
    GreaterS16: op("GreaterS16", 2, { type: t_bool }),
    GreaterU16: op("GreaterU16", 2, { type: t_bool }),
    GreaterS32: op("GreaterS32", 2, { type: t_bool }),
    GreaterU32: op("GreaterU32", 2, { type: t_bool }),
    GreaterS64: op("GreaterS64", 2, { type: t_bool }),
    GreaterU64: op("GreaterU64", 2, { type: t_bool }),
    GreaterF32: op("GreaterF32", 2, { type: t_bool }),
    GreaterF64: op("GreaterF64", 2, { type: t_bool }),
    GeqS8: op("GeqS8", 2, { type: t_bool }),
    GeqU8: op("GeqU8", 2, { type: t_bool }),
    GeqS16: op("GeqS16", 2, { type: t_bool }),
    GeqU16: op("GeqU16", 2, { type: t_bool }),
    GeqS32: op("GeqS32", 2, { type: t_bool }),
    GeqU32: op("GeqU32", 2, { type: t_bool }),
    GeqS64: op("GeqS64", 2, { type: t_bool }),
    GeqU64: op("GeqU64", 2, { type: t_bool }),
    GeqF32: op("GeqF32", 2, { type: t_bool }),
    GeqF64: op("GeqF64", 2, { type: t_bool }),
    Not: op("Not", 1, { type: t_bool }),
    MinF32: op("MinF32", 2),
    MinF64: op("MinF64", 2),
    MaxF32: op("MaxF32", 2),
    MaxF64: op("MaxF64", 2),
    NegI8: op("NegI8", 1),
    NegI16: op("NegI16", 1),
    NegI32: op("NegI32", 1),
    NegI64: op("NegI64", 1),
    NegF32: op("NegF32", 1),
    NegF64: op("NegF64", 1),
    CtzI8: op("CtzI8", 1),
    CtzI16: op("CtzI16", 1),
    CtzI32: op("CtzI32", 1),
    CtzI64: op("CtzI64", 1),
    CtzI8NonZero: op("CtzI8NonZero", 1),
    CtzI16NonZero: op("CtzI16NonZero", 1),
    CtzI32NonZero: op("CtzI32NonZero", 1),
    CtzI64NonZero: op("CtzI64NonZero", 1),
    BitLen8: op("BitLen8", 1),
    BitLen16: op("BitLen16", 1),
    BitLen32: op("BitLen32", 1),
    BitLen64: op("BitLen64", 1),
    PopCountI8: op("PopCountI8", 1),
    PopCountI16: op("PopCountI16", 1),
    PopCountI32: op("PopCountI32", 1),
    PopCountI64: op("PopCountI64", 1),
    SqrtF32: op("SqrtF32", 1),
    SqrtF64: op("SqrtF64", 1),
    FloorF32: op("FloorF32", 1),
    FloorF64: op("FloorF64", 1),
    CeilF32: op("CeilF32", 1),
    CeilF64: op("CeilF64", 1),
    TruncF32: op("TruncF32", 1),
    TruncF64: op("TruncF64", 1),
    RoundF32: op("RoundF32", 1),
    RoundF64: op("RoundF64", 1),
    RoundToEvenF32: op("RoundToEvenF32", 1),
    RoundToEvenF64: op("RoundToEvenF64", 1),
    AbsF32: op("AbsF32", 1),
    AbsF64: op("AbsF64", 1),
    CopysignF32: op("CopysignF32", 2),
    CopysignF64: op("CopysignF64", 2),
    SignExtI8to16: op("SignExtS8to16", 1, { type: t_i16 }),
    SignExtI8to32: op("SignExtS8to32", 1, { type: t_i32 }),
    SignExtI8to64: op("SignExtS8to64", 1, { type: t_i64 }),
    SignExtI16to32: op("SignExtS16to32", 1, { type: t_i32 }),
    SignExtI16to64: op("SignExtS16to64", 1, { type: t_i64 }),
    SignExtI32to64: op("SignExtS32to64", 1, { type: t_i64 }),
    ZeroExtI8to16: op("ZeroExtU8to16", 1, { type: t_u16 }),
    ZeroExtI8to32: op("ZeroExtU8to32", 1, { type: t_u32 }),
    ZeroExtI8to64: op("ZeroExtU8to64", 1, { type: t_u64 }),
    ZeroExtI16to32: op("ZeroExtU16to32", 1, { type: t_u32 }),
    ZeroExtI16to64: op("ZeroExtU16to64", 1, { type: t_u64 }),
    ZeroExtI32to64: op("ZeroExtU32to64", 1, { type: t_u64 }),
    TruncI16to8: op("TruncI16to8", 1),
    TruncI32to8: op("TruncI32to8", 1),
    TruncI32to16: op("TruncI32to16", 1),
    TruncI64to8: op("TruncI64to8", 1),
    TruncI64to16: op("TruncI64to16", 1),
    TruncI64to32: op("TruncI64to32", 1),
    ConvI32toF32: op("ConvI32toF32", 1, { type: t_f32 }),
    ConvI32toF64: op("ConvI32toF64", 1, { type: t_f64 }),
    ConvI64toF32: op("ConvI64toF32", 1, { type: t_f32 }),
    ConvI64toF64: op("ConvI64toF64", 1, { type: t_f64 }),
    ConvF32toI32: op("ConvF32toI32", 1, { type: t_i32 }),
    ConvF32toI64: op("ConvF32toI64", 1, { type: t_i64 }),
    ConvF64toI32: op("ConvF64toI32", 1, { type: t_i32 }),
    ConvF64toI64: op("ConvF64toI64", 1, { type: t_i64 }),
    ConvF32toF64: op("ConvF32toF64", 1, { type: t_f64 }),
    ConvF64toF32: op("ConvF64toF32", 1, { type: t_f32 }),
    ConvU32toF32: op("ConvU32toF32", 1, { type: t_f32 }),
    ConvU32toF64: op("ConvU32toF64", 1, { type: t_f64 }),
    ConvF32toU32: op("ConvF32toU32", 1, { type: t_u32 }),
    ConvF64toU32: op("ConvF64toU32", 1, { type: t_u32 }),
    ConvU64toF32: op("ConvU64toF32", 1, { type: t_f32 }),
    ConvU64toF64: op("ConvU64toF64", 1, { type: t_f64 }),
    ConvF32toU64: op("ConvF32toU64", 1, { type: t_u64 }),
    ConvF64toU64: op("ConvF64toU64", 1, { type: t_u64 }),
    AtomicLoad32: op("AtomicLoad32", 2, {}),
    AtomicLoad64: op("AtomicLoad64", 2, {}),
    AtomicLoadPtr: op("AtomicLoadPtr", 2, {}),
    AtomicStore32: op("AtomicStore32", 3, { hasSideEffects: true }),
    AtomicStore64: op("AtomicStore64", 3, { hasSideEffects: true }),
    AtomicStorePtrNoWB: op("AtomicStorePtrNoWB", 3, { type: t_addr, hasSideEffects: true }),
    AtomicExchange32: op("AtomicExchange32", 3, { hasSideEffects: true }),
    AtomicExchange64: op("AtomicExchange64", 3, { hasSideEffects: true }),
    AtomicAdd32: op("AtomicAdd32", 3, { hasSideEffects: true }),
    AtomicAdd64: op("AtomicAdd64", 3, { hasSideEffects: true }),
    AtomicCompareAndSwap32: op("AtomicCompareAndSwap32", 4, { hasSideEffects: true }),
    AtomicCompareAndSwap64: op("AtomicCompareAndSwap64", 4, { hasSideEffects: true }),
    AtomicAnd8: op("AtomicAnd8", 3, { type: t_addr, hasSideEffects: true }),
    AtomicOr8: op("AtomicOr8", 3, { type: t_addr, hasSideEffects: true }),
};
//# sourceMappingURL=op.js.map

function consteval2(op, t, x, y) {
    const xn = x;
    const yn = y;
    const xo = x;
    const yo = y;
    switch (op) {
        case ops.AddI8:
        case ops.AddI16:
        case ops.AddI32:
            return t.isSignedInt ? (xn + yn | 0) : (xn + yn >>> 0);
        case ops.AddI64:
            return xo.add(yo);
        case ops.AddF32:
        case ops.AddF64:
            return xn + yn;
        case ops.SubI8:
        case ops.SubI16:
        case ops.SubI32:
            return t.isSignedInt ? (xn - yn | 0) : (xn - yn >>> 0);
        case ops.SubI64:
            return xo.sub(yo);
        case ops.SubF32:
        case ops.SubF64:
            return xn - yn;
        case ops.MulI8:
        case ops.MulI16:
        case ops.MulI32:
            return t.isSignedInt ? Math.imul(xn, yn) : (Math.imul(xn, yn) >>> 0);
        case ops.MulI64:
            return xo.mul(yo);
        case ops.MulF32:
        case ops.MulF64:
            return xn * yn;
        case ops.DivS8:
        case ops.DivS16:
        case ops.DivS32:
            return xn / yn | 0;
        case ops.DivU8:
        case ops.DivU16:
        case ops.DivU32:
            return xn / yn >>> 0;
        case ops.DivS64:
        case ops.DivU64:
            return xo.div(yo);
        case ops.DivF32:
        case ops.DivF64:
            return xn / yn;
        case ops.RemS8:
        case ops.RemS16:
        case ops.RemS32:
            return xn % yn | 0;
        case ops.RemU8:
        case ops.RemU16:
        case ops.RemU32:
            return xn % yn >>> 0;
        case ops.RemI64:
        case ops.RemU64:
            return xo.mod(yo);
        case ops.AndI8:
        case ops.AndI16:
        case ops.AndI32:
            return xn & yn;
        case ops.AndI64:
            return xo.and(yo);
        case ops.OrI8:
        case ops.OrI16:
        case ops.OrI32:
            return xn | yn;
        case ops.OrI64:
            return xo.or(yo);
        case ops.XorI8:
        case ops.XorI16:
        case ops.XorI32:
            return xn ^ yn;
        case ops.XorI64:
            return xo.xor(yo);
        case ops.ShLI8x8:
        case ops.ShLI8x16:
        case ops.ShLI8x32:
        case ops.ShLI16x8:
        case ops.ShLI16x16:
        case ops.ShLI16x32:
        case ops.ShLI32x8:
        case ops.ShLI32x16:
        case ops.ShLI32x32:
            return xn << yn;
        case ops.ShLI8x64:
        case ops.ShLI16x64:
        case ops.ShLI32x64:
            return xn << yo.toUInt32();
        case ops.ShLI64x8:
        case ops.ShLI64x16:
        case ops.ShLI64x32:
        case ops.ShLI64x64:
            return xo.shl(yo.toUInt32());
        case ops.ShRS8x8:
        case ops.ShRS8x16:
        case ops.ShRS8x32:
        case ops.ShRS16x8:
        case ops.ShRS16x16:
        case ops.ShRS16x32:
        case ops.ShRS32x8:
        case ops.ShRS32x16:
        case ops.ShRS32x32:
            return xn >> yn;
        case ops.ShRS8x64:
        case ops.ShRS16x64:
        case ops.ShRS32x64:
            return xn >> yo.toUInt32();
        case ops.ShRS64x8:
        case ops.ShRS64x16:
        case ops.ShRS64x32:
        case ops.ShRS64x64:
            return xo.shr(yo.toUInt32());
        case ops.ShRU8x8:
        case ops.ShRU8x16:
        case ops.ShRU8x32:
        case ops.ShRU16x8:
        case ops.ShRU16x16:
        case ops.ShRU16x32:
        case ops.ShRU32x8:
        case ops.ShRU32x16:
        case ops.ShRU32x32:
            return xn >>> yn;
        case ops.ShRU8x64:
        case ops.ShRU16x64:
        case ops.ShRU32x64:
            return xn >>> yo.toUInt32();
        case ops.ShRU64x8:
        case ops.ShRU64x16:
        case ops.ShRU64x32:
        case ops.ShRU64x64:
            return xo.shr(yo.toUInt32());
        case ops.EqI8:
        case ops.EqI16:
        case ops.EqI32:
        case ops.EqF32:
        case ops.EqF64:
            return xn === yn ? 1 : 0;
        case ops.EqI64:
            return xo.eq(yo) ? 1 : 0;
        case ops.NeqI8:
        case ops.NeqI16:
        case ops.NeqI32:
        case ops.NeqF32:
        case ops.NeqF64:
            return xn !== yn ? 1 : 0;
        case ops.NeqI64:
            return xo.neq(yo) ? 1 : 0;
        case ops.LessS8:
        case ops.LessU8:
        case ops.LessS16:
        case ops.LessU16:
        case ops.LessS32:
        case ops.LessU32:
        case ops.LessF32:
        case ops.LessF64:
            return xn < yn ? 1 : 0;
        case ops.LessS64:
        case ops.LessU64:
            return xo.lt(yo) ? 1 : 0;
        case ops.LeqS8:
        case ops.LeqU8:
        case ops.LeqS16:
        case ops.LeqU16:
        case ops.LeqS32:
        case ops.LeqU32:
        case ops.LeqF32:
        case ops.LeqF64:
            return xn <= yn ? 1 : 0;
        case ops.LeqS64:
        case ops.LeqU64:
            return xo.lte(yo) ? 1 : 0;
        case ops.GreaterS8:
        case ops.GreaterU8:
        case ops.GreaterS16:
        case ops.GreaterU16:
        case ops.GreaterS32:
        case ops.GreaterU32:
        case ops.GreaterF32:
        case ops.GreaterF64:
            return xn > yn ? 1 : 0;
        case ops.GreaterS64:
        case ops.GreaterU64:
            return xo.gt(yo) ? 1 : 0;
        case ops.GeqS8:
        case ops.GeqU8:
        case ops.GeqS16:
        case ops.GeqU16:
        case ops.GeqS32:
        case ops.GeqU32:
        case ops.GeqF32:
        case ops.GeqF64:
            return xn >= yn ? 1 : 0;
        case ops.GeqS64:
        case ops.GeqU64:
            return xo.gte(yo) ? 1 : 0;
        case ops.MinF32:
        case ops.MinF64:
            return Math.min(xn, yn);
        case ops.MaxF32:
        case ops.MaxF64:
            return Math.max(xn, yn);
    }
    assert(false, `unexpected ${op}`);
    return null;
}
function consteval1(op, t, x) {
    return null;
}
//# sourceMappingURL=consteval.js.map

function optcf_op1(b, op, x) {
    if (x.op.constant) {
        assert(isNum(x.aux));
        let val = consteval1(op, x.type, x.aux);
        if (val !== null) {
            return b.f.constVal(x.type, val);
        }
    }
    return null;
}
function optcf_op2(b, op, x, y) {
    if (!x.op.constant || !y.op.constant) {
        return null;
    }
    assert(isNum(x.aux));
    assert(isNum(y.aux));
    let xval = x.aux;
    let yval = y.aux;
    if (x.type !== y.type) {
        let lossless;
        [yval, lossless] = numconv(yval, x.type);
        if (!lossless) {
            return null;
        }
    }
    let val = consteval2(op, x.type, xval, yval);
    if (val !== null) {
        return b.f.constVal(x.type, val);
    }
    return null;
}
//# sourceMappingURL=opt_cf.js.map

function postorder(f) {
    let explored = new Array(f.numBlocks());
    let order = [];
    let s = [{ b: f.entry, index: 0 }];
    explored[f.entry.id] = true;
    while (s.length > 0) {
        let tos = s.length - 1;
        let x = s[tos];
        let b = x.b;
        let i = x.index;
        if (i < b.succs.length) {
            s[tos].index++;
            let bb = b.succs[i];
            if (!explored[bb.id]) {
                explored[bb.id] = true;
                s.push({ b: bb, index: 0 });
            }
        }
        else {
            s = s.slice(0, tos);
            order.push(b);
        }
    }
    return order;
}
//# sourceMappingURL=postorder.js.map

const byteStr_main = asciiByteStr("main");
const byteStr_anonfun = asciiByteStr("anonfun");
class Value {
    constructor(id, b, op, type, aux) {
        this.pos = NoPos;
        this.args = [];
        this.comment = '';
        this.prevv = null;
        this.nextv = null;
        this.reg = null;
        this.uses = 0;
        this.id = id;
        this.op = op;
        this.type = type;
        this.b = b;
        this.aux = aux;
        assert(type instanceof BasicType);
        assert(type.mem > 0, `ir.Value assigned abstract type ${type}`);
    }
    toString() {
        return 'v' + this.id;
    }
    auxIsZero() {
        assert(isNum(this.aux), `aux is not a number`);
        return numIsZero(this.aux);
    }
    reset(op) {
        assert(op, `null op`);
        const v = this;
        v.op = op;
        v.resetArgs();
        v.aux = null;
    }
    setArgs1(a) {
        this.resetArgs();
        this.addArg(a);
    }
    setArg(i, v) {
        assert(this.args[i], `setArg on null slot ${i}`);
        this.args[i].uses--;
        this.args[i] = v;
        v.uses++;
    }
    resetArgs() {
        for (let a of this.args) {
            a.uses--;
        }
        this.args.length = 0;
    }
    addArg(v) {
        assert(v !== this, `using self as arg to self`);
        v.uses++;
        this.args.push(v);
    }
    removeArg(i) {
        let v = this.args[i];
        v.uses--;
        this.args.splice(i, 1);
    }
    rematerializeable() {
        if (!this.op.rematerializeable) {
            return false;
        }
        for (let a of this.args) {
            if (a.op !== ops.SP && a.op !== ops.SB) {
                return false;
            }
        }
        return true;
    }
}
var BlockKind;
(function (BlockKind) {
    BlockKind[BlockKind["Invalid"] = 0] = "Invalid";
    BlockKind[BlockKind["Plain"] = 1] = "Plain";
    BlockKind[BlockKind["If"] = 2] = "If";
    BlockKind[BlockKind["Ret"] = 3] = "Ret";
    BlockKind[BlockKind["First"] = 4] = "First";
})(BlockKind || (BlockKind = {}));
var BranchPrediction;
(function (BranchPrediction) {
    BranchPrediction[BranchPrediction["Unlikely"] = -1] = "Unlikely";
    BranchPrediction[BranchPrediction["Unknown"] = 0] = "Unknown";
    BranchPrediction[BranchPrediction["Likely"] = 1] = "Likely";
})(BranchPrediction || (BranchPrediction = {}));
class Block$1 {
    constructor(kind, id, f) {
        this.pos = NoPos;
        this.kind = BlockKind.Invalid;
        this.succs = [];
        this.preds = [];
        this.control = null;
        this.values = [];
        this.sealed = false;
        this.comment = '';
        this.likely = BranchPrediction.Unknown;
        this.kind = kind;
        this.id = id;
        this.f = f;
    }
    pushValueFront(v) {
        this.values.unshift(v);
    }
    replaceValue(existingv, newv) {
        assert(existingv !== newv, 'trying to replace V with V');
        this.f.freeValue(existingv);
        existingv.b = null;
    }
    setControl(v) {
        let existing = this.control;
        if (existing) {
            existing.uses--;
        }
        this.control = v;
        if (v) {
            v.uses++;
        }
    }
    removeNthPred(i) {
        this.preds.splice(i, 1);
        this.f.invalidateCFG();
    }
    removePred(e) {
        let i = this.preds.indexOf(e);
        assert(i > -1, `${e} not a predecessor of ${this}`);
        this.removeNthPred(i);
        return i;
    }
    removeNthSucc(i) {
        this.succs.splice(i, 1);
        this.f.invalidateCFG();
    }
    removeSucc(s) {
        let i = this.succs.indexOf(s);
        assert(i > -1, `${s} not a successor of ${this}`);
        this.removeNthSucc(i);
        return i;
    }
    newPhi(t) {
        let v = this.f.newValue(this, ops.Phi, t, null);
        this.values.push(v);
        return v;
    }
    newValue0(op, t = null, aux = null) {
        let v = this.f.newValue(this, op, t, aux);
        this.values.push(v);
        return v;
    }
    newValue1(op, t, arg0, aux = null) {
        let v = this.f.newValue(this, op, t, aux);
        v.args = [arg0];
        arg0.uses++;
        this.values.push(v);
        return v;
    }
    newValue2(op, t, arg0, arg1, aux = null) {
        let v = this.f.newValue(this, op, t, aux);
        v.args = [arg0, arg1];
        arg0.uses++;
        arg1.uses++;
        this.values.push(v);
        return v;
    }
    toString() {
        return 'b' + this.id;
    }
}
class Fun {
    constructor(type, name, nargs) {
        this.bid = 0;
        this.vid = 0;
        this.consts = null;
        this.namedValues = new Map();
        this.regAlloc = null;
        this._cachedPostorder = null;
        this.entry = new Block$1(BlockKind.Plain, this.bid++, this);
        this.blocks = [this.entry];
        this.type = type;
        this.name = name || byteStr_anonfun;
        this.nargs = nargs;
    }
    newBlock(k) {
        assert(this.bid < 0xFFFFFFFF, "too many block IDs generated");
        let b = new Block$1(k, this.bid++, this);
        this.blocks.push(b);
        return b;
    }
    freeBlock(b) {
        assert(b.f != null, `trying to free an already freed block ${b}`);
        b.f = null;
    }
    newValue(b, op, t, aux) {
        assert(this.vid < 0xFFFFFFFF, "too many value IDs generated");
        assert(!t || !op.type || op.type.mem == 0 || t === op.type, `op ${op} with different concrete type (op.type=${op.type}, t=${t})`);
        return new Value(this.vid++, b, op, t || op.type || t_nil, aux);
    }
    freeValue(v) {
        assert(v.b, `trying to free an already freed value ${v}`);
        assert(v.uses == 0, `value ${v} still has ${v.uses} uses`);
        assert(v.args.length == 0, `value ${v} still has ${v.args.length} args`);
    }
    constVal(t, c) {
        let f = this;
        let op = ops.Invalid;
        switch (t) {
            case t_bool:
                op = ops.ConstBool;
                break;
            case t_u8:
            case t_i8:
                op = ops.ConstI8;
                break;
            case t_u16:
            case t_i16:
                op = ops.ConstI16;
                break;
            case t_u32:
            case t_i32:
                op = ops.ConstI32;
                break;
            case t_u64:
            case t_i64:
                op = ops.ConstI64;
                break;
            case t_f32:
                op = ops.ConstF32;
                break;
            case t_f64:
                op = ops.ConstF64;
                break;
            default:
                assert(false, `invalid constant type ${t}`);
                break;
        }
        if (!f.consts) {
            f.consts = new Map();
        }
        let nvmap = f.consts.get(op);
        if (!nvmap) {
            nvmap = new Map();
            f.consts.set(op, nvmap);
        }
        let v = nvmap.get(c);
        if (!v) {
            v = f.blocks[0].newValue0(op, t, c);
            nvmap.set(c, v);
        }
        return v;
    }
    removeBlock(b) {
        let i = this.blocks.indexOf(b);
        assert(i != -1, `block ${b} not part of function`);
        this.blocks.splice(i, 1);
        this.invalidateCFG();
    }
    numBlocks() {
        return this.bid;
    }
    numValues() {
        return this.vid;
    }
    postorder() {
        if (!this._cachedPostorder) {
            this._cachedPostorder = postorder(this);
        }
        return this._cachedPostorder;
    }
    invalidateCFG() {
        this._cachedPostorder = null;
    }
    toString() {
        return this.name.toString();
    }
}
class Pkg {
    constructor() {
        this.funs = new Map();
        this.init = null;
    }
    mainFun() {
        for (let fn of this.funs.values()) {
            if (byteStr_main.equals(fn.name)) {
                return fn;
            }
        }
        return null;
    }
}
//# sourceMappingURL=ssa.js.map

function opselect1(tok, x) {
    switch (tok) {
        case token.NOT: return ops.Not;
        case token.ADD:
            switch (x.mem) {
                case Mem.i8: return ops.NegI8;
                case Mem.i16: return ops.NegI16;
                case Mem.i32: return ops.NegI32;
                case Mem.i64: return ops.NegI64;
                case Mem.i32: return ops.NegF32;
                case Mem.i64: return ops.NegF64;
            }
            ;
            break;
    }
    assert(false, `invalid token.${token[tok]} with type ${x}`);
    return ops.Invalid;
}
function opselect2(tok, x, y) {
    switch (tok) {
        case token.ADD:
            switch (x.mem) {
                case Mem.i8: return ops.AddI8;
                case Mem.i16: return ops.AddI16;
                case Mem.i32: return ops.AddI32;
                case Mem.i64: return ops.AddI64;
                case Mem.f32: return ops.AddF32;
                case Mem.f64: return ops.AddF64;
            }
            ;
            break;
        case token.SUB:
            switch (x.mem) {
                case Mem.i8: return ops.SubI8;
                case Mem.i16: return ops.SubI16;
                case Mem.i32: return ops.SubI32;
                case Mem.i64: return ops.SubI64;
                case Mem.f32: return ops.SubF32;
                case Mem.f64: return ops.SubF64;
            }
            ;
            break;
        case token.MUL:
            switch (x.mem) {
                case Mem.i8: return ops.MulI8;
                case Mem.i16: return ops.MulI16;
                case Mem.i32: return ops.MulI32;
                case Mem.i64: return ops.MulI64;
                case Mem.f32: return ops.MulF32;
                case Mem.f64: return ops.MulF64;
            }
            ;
            break;
        case token.QUO:
            switch (x) {
                case t_i8: return ops.DivS8;
                case t_u8: return ops.DivU8;
                case t_i16: return ops.DivS16;
                case t_u16: return ops.DivU16;
                case t_i32: return ops.DivS32;
                case t_u32: return ops.DivU32;
                case t_i64: return ops.DivS64;
                case t_u64: return ops.DivU64;
                case t_f32: return ops.DivF32;
                case t_f64: return ops.DivF64;
            }
            ;
            break;
        case token.REM:
            switch (x) {
                case t_i8: return ops.RemS8;
                case t_u8: return ops.RemU8;
                case t_i16: return ops.RemS16;
                case t_u16: return ops.RemU16;
                case t_i32: return ops.RemS32;
                case t_u32: return ops.RemU32;
                case t_i64: return ops.RemI64;
                case t_u64: return ops.RemU64;
            }
            ;
            break;
        case token.AND:
            switch (x.mem) {
                case Mem.i8: return ops.AndI8;
                case Mem.i16: return ops.AndI16;
                case Mem.i32: return ops.AndI32;
                case Mem.i64: return ops.AndI64;
            }
            ;
            break;
        case token.OR:
            switch (x.mem) {
                case Mem.i8: return ops.OrI8;
                case Mem.i16: return ops.OrI16;
                case Mem.i32: return ops.OrI32;
                case Mem.i64: return ops.OrI64;
            }
            ;
            break;
        case token.XOR:
            switch (x.mem) {
                case Mem.i8: return ops.XorI8;
                case Mem.i16: return ops.XorI16;
                case Mem.i32: return ops.XorI32;
                case Mem.i64: return ops.XorI64;
            }
            ;
            break;
        case token.AND_NOT:
            assert(false, 'AND_NOT "&^" not yet supported');
            break;
        case token.EQL:
            switch (x.mem) {
                case Mem.i8: return ops.EqI8;
                case Mem.i16: return ops.EqI16;
                case Mem.i32: return ops.EqI32;
                case Mem.i64: return ops.EqI64;
                case Mem.f32: return ops.EqF32;
                case Mem.f64: return ops.EqF64;
            }
            ;
            break;
        case token.NEQ:
            switch (x.mem) {
                case Mem.i8: return ops.NeqI8;
                case Mem.i16: return ops.NeqI16;
                case Mem.i32: return ops.NeqI32;
                case Mem.i64: return ops.NeqI64;
                case Mem.f32: return ops.NeqF32;
                case Mem.f64: return ops.NeqF64;
            }
            ;
            break;
        case token.LSS:
            switch (x) {
                case t_i8: return ops.LessS8;
                case t_u8: return ops.LessU8;
                case t_i16: return ops.LessS16;
                case t_u16: return ops.LessU16;
                case t_i32: return ops.LessS32;
                case t_u32: return ops.LessU32;
                case t_i64: return ops.LessS64;
                case t_u64: return ops.LessU64;
                case t_f32: return ops.LessF32;
                case t_f64: return ops.LessF64;
            }
            ;
            break;
        case token.LEQ:
            switch (x) {
                case t_i8: return ops.LeqS8;
                case t_u8: return ops.LeqU8;
                case t_i16: return ops.LeqS16;
                case t_u16: return ops.LeqU16;
                case t_i32: return ops.LeqS32;
                case t_u32: return ops.LeqU32;
                case t_i64: return ops.LeqS64;
                case t_u64: return ops.LeqU64;
                case t_f32: return ops.LeqF32;
                case t_f64: return ops.LeqF64;
            }
            ;
            break;
        case token.GTR:
            switch (x) {
                case t_i8: return ops.GreaterS8;
                case t_u8: return ops.GreaterU8;
                case t_i16: return ops.GreaterS16;
                case t_u16: return ops.GreaterU16;
                case t_i32: return ops.GreaterS32;
                case t_u32: return ops.GreaterU32;
                case t_i64: return ops.GreaterS64;
                case t_u64: return ops.GreaterU64;
                case t_f32: return ops.GreaterF32;
                case t_f64: return ops.GreaterF64;
            }
            ;
            break;
        case token.GEQ:
            switch (x) {
                case t_i8: return ops.GeqS8;
                case t_u8: return ops.GeqU8;
                case t_i16: return ops.GeqS16;
                case t_u16: return ops.GeqU16;
                case t_i32: return ops.GeqS32;
                case t_u32: return ops.GeqU32;
                case t_i64: return ops.GeqS64;
                case t_u64: return ops.GeqU64;
                case t_f32: return ops.GeqF32;
                case t_f64: return ops.GeqF64;
            }
            ;
            break;
        case token.SHL:
            switch (x.mem) {
                case Mem.i8:
                    switch (y) {
                        case t_u8: return ops.ShLI8x8;
                        case t_u16: return ops.ShLI8x16;
                        case t_u32: return ops.ShLI8x32;
                        case t_u64: return ops.ShLI8x64;
                    }
                    break;
                case Mem.i16:
                    switch (y) {
                        case t_u8: return ops.ShLI16x8;
                        case t_u16: return ops.ShLI16x16;
                        case t_u32: return ops.ShLI16x32;
                        case t_u64: return ops.ShLI16x64;
                    }
                    break;
                case Mem.i32:
                    switch (y) {
                        case t_u8: return ops.ShLI32x8;
                        case t_u16: return ops.ShLI32x16;
                        case t_u32: return ops.ShLI32x32;
                        case t_u64: return ops.ShLI32x64;
                    }
                    break;
                case Mem.i64:
                    switch (y) {
                        case t_u8: return ops.ShLI64x8;
                        case t_u16: return ops.ShLI64x16;
                        case t_u32: return ops.ShLI64x32;
                        case t_u64: return ops.ShLI64x64;
                    }
                    break;
            }
            ;
            break;
        case token.SHR:
            assert(y.isUnsignedInt);
            switch (x) {
                case t_i8:
                    switch (y) {
                        case t_u8: return ops.ShRS8x8;
                        case t_u16: return ops.ShRS8x16;
                        case t_u32: return ops.ShRS8x32;
                        case t_u64: return ops.ShRS8x64;
                    }
                    break;
                case t_u8:
                    switch (y) {
                        case t_u8: return ops.ShRU8x8;
                        case t_u16: return ops.ShRU8x16;
                        case t_u32: return ops.ShRU8x32;
                        case t_u64: return ops.ShRU8x64;
                    }
                    break;
                case t_i16:
                    switch (y) {
                        case t_u8: return ops.ShRS16x8;
                        case t_u16: return ops.ShRS16x16;
                        case t_u32: return ops.ShRS16x32;
                        case t_u64: return ops.ShRS16x64;
                    }
                    break;
                case t_u16:
                    switch (y) {
                        case t_u8: return ops.ShRU16x8;
                        case t_u16: return ops.ShRU16x16;
                        case t_u32: return ops.ShRU16x32;
                        case t_u64: return ops.ShRU16x64;
                    }
                    break;
                case t_i32:
                    switch (y) {
                        case t_u8: return ops.ShRS32x8;
                        case t_u16: return ops.ShRS32x16;
                        case t_u32: return ops.ShRS32x32;
                        case t_u64: return ops.ShRS32x64;
                    }
                    break;
                case t_u32:
                    switch (y) {
                        case t_u8: return ops.ShRU32x8;
                        case t_u16: return ops.ShRU32x16;
                        case t_u32: return ops.ShRU32x32;
                        case t_u64: return ops.ShRU32x64;
                    }
                    break;
                case t_i64:
                    switch (y) {
                        case t_u8: return ops.ShRS64x8;
                        case t_u16: return ops.ShRS64x16;
                        case t_u32: return ops.ShRS64x32;
                        case t_u64: return ops.ShRS64x64;
                    }
                    break;
                case t_u64:
                    switch (y) {
                        case t_u8: return ops.ShRU64x8;
                        case t_u16: return ops.ShRU64x16;
                        case t_u32: return ops.ShRU64x32;
                        case t_u64: return ops.ShRU64x64;
                    }
                    break;
            }
            ;
            break;
    }
    assert(false, `invalid token.${token[tok]} with types ${x}, ${y}`);
    return ops.Invalid;
}

//# sourceMappingURL=opselect.js.map

class IRFmt {
    constructor(types, style$$1, println) {
        this.types = types;
        this.style = style$$1;
        this.println = println;
        this.rarr = style$$1.grey(' —> ');
        this.larr = style$$1.grey(' <— ');
    }
}
function fmtval(f, v) {
    assert(v.op, `value ${v} without .op`);
    let s = `v${v.id} = `;
    s += v.op.name;
    if (f.types) {
        s += ' ' + f.style.grey(`<${v.type}>`);
    }
    for (let arg of v.args) {
        s += ' ' + arg;
    }
    if (v.aux !== null) {
        s += ` [${v.aux}]`;
    }
    if (v.reg) {
        s += ` {${style.orange(v.reg.name)}}`;
    }
    if (v.comment) {
        s += f.style.grey('  // ' + v.comment);
    }
    return s;
}
function printval(f, v, indent) {
    f.println(indent + fmtval(f, v));
}
function printblock(f, b, indent) {
    let label = b.toString();
    let preds = '';
    let meta = '';
    if (b.preds.length) {
        preds = f.larr + b.preds.map(b => f.style.lightyellow(b.toString())).join(', ');
        f.println('');
    }
    let comment = b.comment ? f.style.grey('  // ' + b.comment) : '';
    f.println(indent + f.style.lightyellow(label + ':') + preds + meta + comment);
    let valindent = indent + '  ';
    for (let v of b.values) {
        printval(f, v, valindent);
    }
    const fmtsucc = (b) => {
        let s = f.style.lightyellow(b.toString());
        switch (b.likely) {
            case BranchPrediction.Likely:
                s += f.style.grey(' (likely)');
                break;
            case BranchPrediction.Unlikely:
                s += f.style.grey(' (unlikely)');
                break;
        }
        return s;
    };
    switch (b.kind) {
        case BlockKind.Plain: {
            let contb = b.succs[0];
            if (contb) {
                f.println(indent +
                    f.style.cyan('cont') + f.rarr +
                    fmtsucc(contb));
            }
            break;
        }
        case BlockKind.First:
        case BlockKind.If: {
            let thenb = b.succs[0];
            let elseb = b.succs[1];
            if (thenb && elseb) {
                assert(b.control, "missing control (condition) value");
                f.println(indent +
                    f.style.cyan(b.kind == BlockKind.If ? 'if' : 'first') +
                    ` ${b.control}${f.rarr}` +
                    fmtsucc(thenb) + ', ' + fmtsucc(elseb));
            }
            break;
        }
        case BlockKind.Ret: {
            assert(b.succs.length == 0, "can't have successor to return block");
            f.println(indent +
                f.style.cyan('ret') + (b.control ? ' ' + b.control : ''));
            break;
        }
        default:
            assert(false, `unexpected block kind ${BlockKind[b.kind]}`);
    }
}
function printfun(f, fn) {
    f.println(f.style.white(fn.toString()) +
        ' (' + fn.type.args.join(' ') + ')->' + fn.type.result);
    for (let b of fn.blocks) {
        printblock(f, b, '  ');
    }
}
function printpkg(f, pkg) {
    let isFirst = true;
    for (let fn of pkg.funs.values()) {
        printfun(f, fn);
        if (isFirst) {
            isFirst = false;
        }
        else {
            f.println('');
        }
    }
}
function printir(v, w, o) {
    let f = new IRFmt(!(o && o.noTypes), (o && o.colors ? style :
        o && o.colors === false ? noStyle :
            stdoutStyle), w || console.log.bind(console));
    if (v instanceof Pkg) {
        printpkg(f, v);
    }
    else if (v instanceof Fun) {
        printfun(f, v);
    }
    else if (v instanceof Block$1) {
        printblock(f, v, '');
    }
    else if (v instanceof Value) {
        printval(f, v, '');
    }
    else {
        let o = v;
        assert(false, `unexpected value ${o && typeof o == 'object' ? o.constructor.name : o}`);
    }
}
function fmtir(v, options) {
    let str = '';
    let w = (s) => { str += s + '\n'; };
    printir(v, w, options);
    return str.replace(/\r?\n$/, '');
}

class LocalSlot {
    constructor(n, type, offs) {
        this.n = n;
        this.type = type;
        this.offs = offs;
    }
    key() {
        if (!this._key) {
            this._key = `${this.n} ${this.type} ${this.offs}`;
        }
        return this._key;
    }
    toString() {
        if (this.offs == 0) {
            return `${this.n}[${this.type}]`;
        }
        return `${this.n}+${this.offs}[${this.type}]`;
    }
}
//# sourceMappingURL=localslot.js.map

const dlog = function (..._) { };
const bitypes = builtInTypes;
var IRBuilderFlags;
(function (IRBuilderFlags) {
    IRBuilderFlags[IRBuilderFlags["Default"] = 0] = "Default";
    IRBuilderFlags[IRBuilderFlags["Comments"] = 2] = "Comments";
})(IRBuilderFlags || (IRBuilderFlags = {}));
class TmpName extends ByteStr {
}
class IRBuilder {
    constructor() {
        this.sfile = null;
        this.diagh = null;
        this.flags = IRBuilderFlags.Default;
        this.tmpNames = [];
        this.tmpNameBytes = null;
        this.tmpNameHash = 0;
    }
    init(config, diagh = null, flags = IRBuilderFlags.Default) {
        const r = this;
        r.config = config;
        r.pkg = new Pkg();
        r.sfile = null;
        r.diagh = diagh;
        r.vars = new Map();
        r.defvars = [];
        r.incompletePhis = null;
        r.flags = flags;
        const [intt_s, intt_u] = intTypes(config.intSize);
        const [sizet_s, sizet_u] = intTypes(config.addrSize);
        this.concreteType = (t) => {
            switch (t) {
                case t_int: return intt_s;
                case t_uint: return intt_u;
                case t_isize: return sizet_s;
                case t_usize: return sizet_u;
                default:
                    assert(t instanceof BasicType, `${t} is not a BasicType`);
                    return t;
            }
        };
    }
    addTopLevel(sfile, d) {
        const r = this;
        r.sfile = sfile;
        if (d instanceof MultiDecl) {
            for (let d2 of d.decls) {
                r.addTopLevel(sfile, d2);
            }
        }
        else if (d instanceof VarDecl) {
            r.global(d);
        }
        else if (d instanceof FunExpr) {
            if (d.isInit) {
                assert(d.sig.params.length == 0, 'init fun with parameters');
                assert(d.sig.result === bitypes.nil, 'init fun with result');
                assert(d.body, 'missing body');
                r.initCode(d.body);
            }
            else if (d.body) {
                return r.fun(d);
            }
            else {
                
            }
        }
        else if (d instanceof ImportDecl) {
            
        }
        else if (d instanceof TypeDecl) {
            
        }
        return null;
    }
    startBlock(b) {
        const r = this;
        assert(r.b == null, "starting block without ending block");
        r.b = b;
    }
    startSealedBlock(b) {
        this.sealBlock(b);
        this.startBlock(b);
    }
    sealBlock(b) {
        const s = this;
        assert(!b.sealed, `block ${b} already sealed`);
        if (s.incompletePhis) {
            let entries = s.incompletePhis.get(b);
            if (entries) {
                for (let [name, phi] of entries) {
                    s.addPhiOperands(name, phi);
                }
                s.incompletePhis.delete(b);
            }
        }
        b.sealed = true;
    }
    endBlock() {
        const r = this;
        let b = r.b;
        assert(b != null, "no current block");
        r.defvars[b.id] = r.vars;
        r.vars = new Map();
        if (DEBUG) {
            
            r.b = null;
        }
        if (b.kind == BlockKind.Ret &&
            b.values.length &&
            b.values[b.values.length - 1].op == ops.Call) {
            b.values[b.values.length - 1].op = ops.TailCall;
        }
        return b;
    }
    startFun(f) {
        const s = this;
        assert(s.f == null, "starting function with existing function");
        s.f = f;
    }
    endFun() {
        const s = this;
        assert(s.f, "ending function without a current function");
        for (let name of s.f.namedValues.keys()) {
            let e = s.f.namedValues.get(name);
            let line = `  {${name}}\t=> `;
            if (e && e.values.length) {
                line += e.values.join(', ');
            }
            else {
                line += '-';
            }
            
        }
        if (DEBUG) {
            
            s.f = null;
        }
    }
    concreteType(t) {
        return t_nil;
    }
    nilValue() {
        assert(this.b, "no current block");
        return this.b.newValue0(ops.Unknown, t_nil);
    }
    global(_) {
        
    }
    initCode(_body) {
    }
    fun(x) {
        const r = this;
        assert(x.body, `unresolved function ${x}`);
        assert(x.type, "unresolved function type");
        let funtype = x.type;
        let f = new Fun(funtype, x.name ? x.name.value : null, x.sig.params.length);
        for (let i = 0; i < x.sig.params.length; i++) {
            let p = x.sig.params[i];
            if (p.name && !p.name.value.isUnderscore()) {
                let t = r.concreteType(funtype.args[i]);
                let name = p.name.value;
                let v = f.entry.newValue0(ops.Arg, t, i);
                if (r.flags & IRBuilderFlags.Comments) {
                    v.comment = name.toString();
                }
                r.vars.set(name, v);
            }
        }
        r.startFun(f);
        r.startSealedBlock(f.entry);
        let bodyval = r.block(x.body);
        if (r.b) {
            r.b.kind = BlockKind.Ret;
            if (!(x.body instanceof Block)) {
                r.b.setControl(bodyval);
            }
            r.endBlock();
        }
        assert(r.b == null, "function exit block not ended");
        assert(f.blocks[f.blocks.length - 1].kind == BlockKind.Ret, "last block in function is not BlockKind.Ret");
        r.endFun();
        r.pkg.funs.set(f.name, f);
        return f;
    }
    block(x) {
        const r = this;
        if (x instanceof Block) {
            let end = x.list.length;
            let lasti = end - 1;
            for (let i = 0; i != end; ++i) {
                if (!r.b) {
                    r.diag('warn', `unreachable code`, x.list[i].pos);
                    break;
                }
                r.stmt(x.list[i], i == lasti);
            }
            return null;
        }
        else {
            return r.expr(x);
        }
    }
    stmt(s, isLast = false) {
        const r = this;
        if (s instanceof IfExpr) {
            r.if_(s);
        }
        else if (s instanceof ReturnStmt) {
            r.ret(r.expr(s.result));
        }
        else if (s instanceof WhileStmt) {
            r.while_(s);
        }
        else if (s instanceof Expr) {
            if (!isLast && s instanceof Ident) {
                r.diag('warn', `unused expression`, s.pos);
            }
            else {
                r.expr(s);
            }
        }
        else if (s instanceof VarDecl) {
            if (s.values) {
                for (let i = 0; i < s.idents.length; i++) {
                    let id = s.idents[i];
                    let v = r.expr(s.values[i]);
                    assert(!r.vars.has(id.value), `redeclaration of var ${id.value}`);
                    r.vars.set(id.value, v);
                }
            }
            else {
                assert(s.type, 'var decl without type or values');
                let t = s.type.type;
                assert(t, 'unresolved type');
                assert(t instanceof BasicType, 'non-basic type not yet supported');
                let v = r.f.constVal(t, 0);
                for (let id of s.idents) {
                    assert(!r.vars.has(id.value), `redeclaration of var ${id.value}`);
                    r.vars.set(id.value, v);
                }
            }
        }
        else {
            dlog(`TODO: handle ${s.constructor.name}`);
        }
    }
    ret(val) {
        const r = this;
        let b = r.endBlock();
        b.kind = BlockKind.Ret;
        b.setControl(val);
    }
    while_(n) {
        const s = this;
        let entryb = s.endBlock();
        assert(entryb.kind == BlockKind.Plain);
        let ifb = s.f.newBlock(BlockKind.If);
        entryb.succs = [ifb];
        ifb.preds = [entryb];
        s.startBlock(ifb);
        let control = s.expr(n.cond);
        if (s.config.optimize && control.op.constant) {
            if (control.auxIsZero()) {
                ifb.kind = BlockKind.Plain;
                s.sealBlock(ifb);
                printir(entryb);
                return;
            }
        }
        ifb = s.endBlock();
        ifb.setControl(control);
        let thenb = s.f.newBlock(BlockKind.Plain);
        thenb.preds = [ifb];
        s.startSealedBlock(thenb);
        s.block(n.body);
        thenb = s.endBlock();
        thenb.succs = [ifb];
        ifb.preds = [entryb, thenb];
        s.sealBlock(ifb);
        let nextb = s.f.newBlock(BlockKind.Plain);
        nextb.preds = [ifb];
        ifb.succs = [thenb, nextb];
        s.startSealedBlock(nextb);
        if (s.flags & IRBuilderFlags.Comments) {
            ifb.comment = 'while';
            thenb.comment = 'then';
            nextb.comment = 'endwhile';
        }
    }
    if_(s) {
        const r = this;
        let control = r.expr(s.cond);
        if (r.config.optimize && control.op.constant) {
            if (control.auxIsZero()) {
                if (s.els_) {
                    r.block(s.els_);
                }
            }
            else {
                r.block(s.then);
            }
            return;
        }
        let ifb = r.endBlock();
        ifb.kind = BlockKind.If;
        ifb.setControl(control);
        let thenb = r.f.newBlock(BlockKind.Plain);
        let elseb = r.f.newBlock(BlockKind.Plain);
        ifb.succs = [thenb, elseb];
        thenb.preds = [ifb];
        r.startSealedBlock(thenb);
        r.block(s.then);
        thenb = r.endBlock();
        if (s.els_) {
            let contb = r.f.newBlock(BlockKind.Plain);
            elseb.preds = [ifb];
            r.startSealedBlock(elseb);
            r.block(s.els_);
            elseb = r.endBlock();
            elseb.succs = [contb];
            thenb.succs = [contb];
            contb.preds = [thenb, elseb];
            r.startSealedBlock(contb);
            if (r.flags & IRBuilderFlags.Comments) {
                thenb.comment = 'then';
                elseb.comment = 'else';
                contb.comment = 'endif';
            }
        }
        else {
            thenb.succs = [elseb];
            elseb.preds = [ifb, thenb];
            elseb.succs = [];
            r.startSealedBlock(elseb);
            if (r.flags & IRBuilderFlags.Comments) {
                thenb.comment = 'then';
                elseb.comment = 'endif';
            }
        }
    }
    assign(left, right) {
        const s = this;
        assert(left instanceof Ident, `${left.constructor.name} not supported`);
        let name = left.value;
        s.writeVariable(name, right);
        return right;
    }
    assignment(s) {
        const r = this;
        if (s.op == token.INC || s.op == token.DEC) {
            assert(s.lhs.length == 1);
            assert(s.rhs.length == 0);
            let lhs = s.lhs[0];
            let x = r.expr(lhs);
            let y = r.f.constVal(x.type, 1);
            let tok = s.op == token.INC ? token.ADD : token.SUB;
            let op = opselect2(tok, x.type, y.type);
            let v = r.b.newValue2(op, x.type, x, y);
            return r.assign(lhs, v);
        }
        if (s.op != token.ASSIGN) {
            assert(s.op < token.assignop_beg || s.op > token.assignop_end, `invalid assignment operation ${token[s.op]}`);
            assert(s.lhs.length == 1);
            assert(s.rhs.length == 1);
            let lhs = s.lhs[0];
            let x = r.expr(lhs);
            let y = r.expr(s.rhs[0]);
            let op = opselect2(s.op, x.type, y.type);
            let v = r.b.newValue2(op, x.type, x, y);
            return r.assign(lhs, v);
        }
        let z = s.lhs.length;
        let preloadRhs = null;
        if (z > 1) {
            let leftnames = new Map();
            for (let i = 0; i < z; i++) {
                let x = s.lhs[i];
                if (x instanceof Ident) {
                    leftnames.set(x.value, i);
                }
            }
            for (let i = 0; i < z; i++) {
                let x = s.rhs[i];
                if (x instanceof Ident) {
                    let Li = leftnames.get(x.value);
                    if (Li == i) {
                        r.diag('warn', `${x} assigned to itself`, x.pos);
                    }
                    else if (Li !== undefined) {
                        if (!preloadRhs) {
                            preloadRhs = new Array(s.rhs.length);
                        }
                        preloadRhs[i] = r.expr(x);
                    }
                }
            }
        }
        let v = null;
        for (let i = 0; i < z; i++) {
            let left = s.lhs[i];
            let k;
            if (preloadRhs && (k = preloadRhs[i])) {
                v = k;
            }
            else {
                v = r.expr(s.rhs[i]);
            }
            v = r.assign(left, v);
            if (r.flags & IRBuilderFlags.Comments && left.isIdent()) {
                v.comment = left.toString();
            }
        }
        return v;
    }
    expr(s) {
        const r = this;
        assert(s.type, `type not resolved for ${s}`);
        if (s instanceof NumLit) {
            const t = r.concreteType(s.type);
            return r.f.constVal(t, s.value);
        }
        if (s instanceof Ident) {
            const t = r.concreteType(s.type);
            return r.readVariable(s.value, t, null);
        }
        if (s instanceof Assignment) {
            return r.assignment(s);
        }
        if (s instanceof Operation) {
            if (s.op == token.OROR || s.op == token.ANDAND) {
                return r.opAndAnd(s);
            }
            const t = r.concreteType(s.type);
            let left = r.expr(s.x);
            if (s.y) {
                let right = r.expr(s.y);
                let op = opselect2(s.op, left.type, right.type);
                if (r.config.optimize) {
                    let v = optcf_op2(r.b, op, left, right);
                    if (v) {
                        return v;
                    }
                }
                return r.b.newValue2(op, t, left, right);
            }
            let op = opselect1(s.op, left.type);
            if (r.config.optimize) {
                let v = optcf_op1(r.b, op, left);
                if (v) {
                    return v;
                }
            }
            return r.b.newValue1(op, t, left);
        }
        if (s instanceof CallExpr) {
            return r.funcall(s);
        }
        dlog(`TODO: handle ${s.constructor.name}`);
        return r.nilValue();
    }
    copy(v) {
        return this.b.newValue1(ops.Copy, v.type, v);
    }
    allocTmpName() {
        let n = this.tmpNames.pop();
        if (!n) {
            if (this.tmpNameBytes) {
                n = new TmpName(this.tmpNameHash, this.tmpNameBytes);
            }
            else {
                n = asciiByteStr('tmp');
                this.tmpNameBytes = n.bytes;
                this.tmpNameHash = n.hash;
            }
        }
        return n;
    }
    freeTmpName(n) {
        this.tmpNames.push(n);
    }
    opAndAnd(n) {
        const s = this;
        assert(n.y != null);
        let tmpname = s.allocTmpName();
        let left = s.expr(n.x);
        s.writeVariable(tmpname, left);
        let t = left.type;
        let rightb = s.f.newBlock(BlockKind.Plain);
        let contb = s.f.newBlock(BlockKind.Plain);
        let ifb = s.endBlock();
        ifb.kind = BlockKind.If;
        ifb.setControl(left);
        if (n.op == token.OROR) {
            ifb.succs = [contb, rightb];
        }
        else {
            assert(n.op == token.ANDAND);
            ifb.succs = [rightb, contb];
        }
        rightb.preds = [ifb];
        s.startSealedBlock(rightb);
        let right = s.expr(n.y);
        s.writeVariable(tmpname, right);
        rightb = s.endBlock();
        rightb.succs = [contb];
        assert(t.equals(right.type), "operands have different types");
        contb.preds = [ifb, rightb];
        s.startSealedBlock(contb);
        let v = s.readVariable(tmpname, t_bool, null);
        s.removeVariable(ifb, tmpname);
        s.freeTmpName(tmpname);
        return v;
    }
    funcall(x) {
        const s = this;
        if (x.hasDots) {
            
        }
        let argvals = [];
        for (let arg of x.args) {
            argvals.push(s.expr(arg));
        }
        if (s.flags & IRBuilderFlags.Comments &&
            x.fun instanceof Ident &&
            x.fun.ent) {
            let fx = x.fun.ent.decl;
            let funstr = x.fun.toString() + '/';
            for (let i = 0; i < argvals.length; i++) {
                let v = argvals[i];
                let v2 = s.b.newValue1(ops.CallArg, v.type, v);
                if (s.flags & IRBuilderFlags.Comments) {
                    let param = fx.sig.params[i];
                    if (param.name) {
                        v2.comment = funstr + param.name.toString();
                    }
                }
            }
        }
        else {
            for (let v of argvals) {
                s.b.newValue1(ops.CallArg, v.type, v);
            }
        }
        assert(x.fun instanceof Ident, "non-id callee not yet supported");
        let funid = x.fun;
        assert(funid.ent, "unresolved callee");
        let ft = funid.type;
        assert(ft, "unresolved function type");
        let rt = ft.result;
        assert(ft.result instanceof BasicType, `non-basic type ${ft.result.constructor.name} not yet supported`);
        return s.b.newValue0(ops.Call, rt, funid.value);
    }
    readVariable(name, t, b) {
        const s = this;
        if (!b || b === s.b) {
            let v = s.vars.get(name);
            if (v) {
                return v;
            }
            b = s.b;
        }
        else {
            let m = s.defvars[b.id];
            if (m) {
                let v = m.get(name);
                if (v) {
                    return v;
                }
            }
        }
        return s.readVariableRecursive(name, t, b);
    }
    removeVariable(b, name) {
        if (b === this.b) {
            return this.vars.delete(name);
        }
        let m = this.defvars[b.id];
        return m ? m.delete(name) : false;
    }
    readGlobal(name) {
        const s = this;
        return s.nilValue();
    }
    writeVariable(name, v, b) {
        const s = this;
        dlog(`${b || s.b} ${name} = ${v.op} ${v}`);
        if (!b || b === s.b) {
            s.vars.set(name, v);
        }
        else {
            let m = s.defvars[b.id];
            if (m) {
                m.set(name, v);
            }
            else {
                s.defvars[b.id] = new Map([[name, v]]);
            }
        }
        if (!(name instanceof TmpName)) {
            let local = new LocalSlot(name, v.type, 0);
            let e = s.f.namedValues.get(local.key());
            if (e) {
                e.values.push(v);
            }
            else {
                s.f.namedValues.set(local.key(), { local, values: [v] });
            }
        }
    }
    addIncompletePhi(phi, name, b) {
        const s = this;
        let names = s.incompletePhis ? s.incompletePhis.get(b) : null;
        if (!names) {
            names = new Map();
            if (!s.incompletePhis) {
                s.incompletePhis = new Map();
            }
            s.incompletePhis.set(b, names);
        }
        names.set(name, phi);
    }
    readVariableRecursive(name, t, b) {
        const s = this;
        let val;
        if (!b.sealed) {
            val = b.newPhi(t);
            s.addIncompletePhi(val, name, b);
        }
        else if (b.preds.length == 1) {
            dlog(`${b} ${name} common case: single predecessor ${b.preds[0]}`);
            val = s.readVariable(name, t, b.preds[0]);
            
        }
        else if (b.preds.length == 0) {
            val = s.readGlobal(name);
        }
        else {
            val = b.newPhi(t);
            s.writeVariable(name, val, b);
            val = s.addPhiOperands(name, val);
        }
        s.writeVariable(name, val, b);
        return val;
    }
    addPhiOperands(name, phi) {
        const s = this;
        assert(phi.op === ops.Phi);
        assert(phi.b.preds.length > 0, 'phi in block without predecessors');
        for (let pred of phi.b.preds) {
            let v = s.readVariable(name, phi.type, pred);
            if (v !== phi) {
                dlog(`  ${pred} ${v}<${v.op}>`);
                phi.addArg(v);
            }
        }
        return phi;
    }
    diag(k, msg, pos) {
        const r = this;
        assert(k != "error", "unexpected DiagKind 'error'");
        if (r.diagh) {
            assert(r.sfile);
            r.diagh(r.sfile.position(pos), msg, k);
        }
    }
}
//# sourceMappingURL=builder.js.map

const Nanosecond = 1;
const Microsecond = 1000 * Nanosecond;
const Millisecond = 1000 * Microsecond;
const Second = 1000 * Millisecond;
const Minute = 60 * Second;
const Hour = 60 * Minute;
const monotime = (typeof performance != 'undefined' ? () => performance.now() * Millisecond :
    (typeof process != 'undefined' && process.hrtime) ? () => {
        let t = process.hrtime();
        return (t[0] * 1e9) + t[1];
    } :
        () => Date.now() * Millisecond);
const wasmMemory = new WebAssembly.Memory({ initial: 2, maximum: 2 });
const wasm$1 = (typeof WebAssembly != 'undefined' ?
    new WebAssembly.Instance(new WebAssembly.Module(new Uint8Array([
        0, 97, 115, 109, 1, 0, 0, 0, 1, 11, 2, 96, 0, 1, 127, 96, 2, 127, 127, 1, 127, 2, 16, 1, 3, 101,
        110, 118, 6, 109, 101, 109, 111, 114, 121, 2, 1, 2, 2, 3, 4, 3, 0, 0, 1, 7, 34, 3, 6, 98, 117, 102,
        112, 116, 114, 0, 0, 7, 98, 117, 102, 115, 105, 122, 101, 0, 1, 11, 102, 109, 116, 100, 117,
        114, 97, 116, 105, 111, 110, 0, 2, 10, 231, 12, 3, 5, 0, 65, 128, 8, 11, 4, 0, 65, 32, 11, 217,
        12, 5, 2, 127, 3, 126, 2, 127, 1, 126, 4, 127, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 33, 4,
        32, 4, 66, 0, 83, 33, 10, 66, 0, 32, 4, 125, 33, 6, 32, 10, 69, 4, 64, 32, 4, 33, 6, 11, 65, 159, 8,
        65, 243, 0, 58, 0, 0, 2, 64, 32, 6, 66, 128, 148, 235, 220, 3, 84, 4, 64, 2, 64, 32, 6, 66, 0, 81,
        4, 64, 2, 64, 65, 158, 8, 65, 48, 58, 0, 0, 65, 30, 15, 11, 11, 32, 6, 66, 232, 7, 84, 4, 64, 2, 64,
        65, 158, 8, 65, 238, 0, 58, 0, 0, 65, 30, 33, 2, 11, 5, 2, 64, 32, 6, 66, 192, 132, 61, 84, 4, 127,
        2, 127, 65, 158, 8, 65, 181, 127, 58, 0, 0, 65, 3, 33, 11, 65, 30, 11, 5, 2, 127, 65, 158, 8, 65,
        237, 0, 58, 0, 0, 65, 6, 33, 11, 65, 30, 11, 11, 33, 2, 32, 6, 33, 4, 3, 64, 32, 4, 32, 4, 66, 10,
        128, 34, 6, 66, 10, 126, 125, 33, 5, 32, 5, 66, 0, 82, 33, 8, 32, 7, 32, 8, 114, 33, 7, 32, 7, 65,
        255, 1, 113, 69, 33, 12, 32, 2, 65, 127, 106, 33, 8, 32, 12, 69, 4, 64, 2, 64, 32, 8, 65, 128, 8,
        106, 33, 13, 32, 5, 167, 33, 2, 32, 2, 65, 48, 114, 33, 2, 32, 2, 65, 255, 1, 113, 33, 2, 32, 13,
        32, 2, 58, 0, 0, 32, 8, 33, 2, 11, 11, 32, 3, 65, 1, 106, 33, 3, 32, 3, 32, 11, 71, 4, 64, 2, 64, 32,
        6, 33, 4, 12, 2, 11, 11, 11, 32, 2, 65, 127, 106, 33, 3, 32, 12, 69, 4, 64, 2, 64, 32, 3, 65, 128,
        8, 106, 33, 2, 32, 2, 65, 46, 58, 0, 0, 32, 3, 33, 2, 11, 11, 32, 4, 66, 10, 84, 4, 64, 2, 64, 32, 2,
        65, 127, 106, 33, 2, 32, 2, 65, 128, 8, 106, 33, 3, 32, 3, 65, 48, 58, 0, 0, 12, 6, 11, 11, 11, 11,
        3, 64, 32, 2, 65, 127, 106, 33, 2, 32, 6, 32, 6, 66, 10, 128, 34, 4, 66, 10, 126, 125, 33, 5, 32,
        5, 167, 33, 3, 32, 3, 65, 48, 114, 33, 3, 32, 3, 65, 255, 1, 113, 33, 7, 32, 2, 65, 128, 8, 106,
        33, 3, 32, 3, 32, 7, 58, 0, 0, 32, 6, 66, 10, 90, 4, 64, 2, 64, 32, 4, 33, 6, 12, 2, 11, 11, 11, 11,
        5, 2, 64, 32, 6, 32, 6, 66, 10, 128, 34, 4, 66, 10, 126, 125, 33, 5, 32, 5, 66, 0, 81, 4, 127, 65,
        31, 5, 2, 127, 32, 5, 167, 33, 2, 32, 2, 65, 48, 114, 33, 2, 32, 2, 65, 255, 1, 113, 33, 2, 65,
        158, 8, 32, 2, 58, 0, 0, 65, 30, 11, 11, 33, 7, 32, 4, 66, 10, 130, 33, 4, 32, 5, 32, 4, 132, 33, 5,
        32, 5, 66, 0, 81, 33, 2, 32, 7, 65, 127, 106, 33, 3, 32, 2, 4, 64, 32, 7, 33, 2, 5, 2, 64, 32, 3, 65,
        128, 8, 106, 33, 8, 32, 4, 167, 33, 2, 32, 2, 65, 48, 114, 33, 2, 32, 2, 65, 255, 1, 113, 33, 2,
        32, 8, 32, 2, 58, 0, 0, 32, 3, 33, 2, 32, 7, 65, 126, 106, 33, 3, 11, 11, 32, 6, 66, 228, 0, 128,
        33, 4, 32, 4, 66, 10, 130, 33, 4, 32, 5, 32, 4, 132, 33, 5, 32, 5, 66, 0, 82, 4, 64, 2, 64, 32, 3,
        65, 128, 8, 106, 33, 7, 32, 4, 167, 33, 2, 32, 2, 65, 48, 114, 33, 2, 32, 2, 65, 255, 1, 113, 33,
        2, 32, 7, 32, 2, 58, 0, 0, 32, 3, 34, 2, 65, 127, 106, 33, 3, 11, 11, 32, 6, 66, 232, 7, 128, 33, 4,
        32, 4, 66, 10, 130, 33, 4, 32, 5, 32, 4, 132, 33, 5, 32, 5, 66, 0, 82, 4, 64, 2, 64, 32, 3, 65, 128,
        8, 106, 33, 7, 32, 4, 167, 33, 2, 32, 2, 65, 48, 114, 33, 2, 32, 2, 65, 255, 1, 113, 33, 2, 32, 7,
        32, 2, 58, 0, 0, 32, 3, 34, 2, 65, 127, 106, 33, 3, 11, 11, 32, 6, 66, 144, 206, 0, 128, 33, 4, 32,
        4, 66, 10, 130, 33, 4, 32, 5, 32, 4, 132, 33, 5, 32, 5, 66, 0, 82, 4, 64, 2, 64, 32, 3, 65, 128, 8,
        106, 33, 7, 32, 4, 167, 33, 2, 32, 2, 65, 48, 114, 33, 2, 32, 2, 65, 255, 1, 113, 33, 2, 32, 7, 32,
        2, 58, 0, 0, 32, 3, 34, 2, 65, 127, 106, 33, 3, 11, 11, 32, 6, 66, 160, 141, 6, 128, 33, 4, 32, 4,
        66, 10, 130, 33, 4, 32, 5, 32, 4, 132, 33, 5, 32, 5, 66, 0, 82, 4, 64, 2, 64, 32, 3, 65, 128, 8,
        106, 33, 7, 32, 4, 167, 33, 2, 32, 2, 65, 48, 114, 33, 2, 32, 2, 65, 255, 1, 113, 33, 2, 32, 7, 32,
        2, 58, 0, 0, 32, 3, 34, 2, 65, 127, 106, 33, 3, 11, 11, 32, 6, 66, 192, 132, 61, 128, 33, 4, 32, 4,
        66, 10, 130, 33, 4, 32, 5, 32, 4, 132, 33, 5, 32, 5, 66, 0, 82, 4, 64, 2, 64, 32, 3, 65, 128, 8,
        106, 33, 7, 32, 4, 167, 33, 2, 32, 2, 65, 48, 114, 33, 2, 32, 2, 65, 255, 1, 113, 33, 2, 32, 7, 32,
        2, 58, 0, 0, 32, 3, 34, 2, 65, 127, 106, 33, 3, 11, 11, 32, 6, 66, 128, 173, 226, 4, 128, 33, 4,
        32, 4, 66, 10, 130, 33, 4, 32, 5, 32, 4, 132, 33, 9, 32, 9, 66, 0, 82, 4, 64, 2, 64, 32, 3, 65, 128,
        8, 106, 33, 7, 32, 4, 167, 33, 2, 32, 2, 65, 48, 114, 33, 2, 32, 2, 65, 255, 1, 113, 33, 2, 32, 7,
        32, 2, 58, 0, 0, 32, 3, 34, 2, 65, 127, 106, 33, 3, 11, 11, 32, 6, 66, 128, 194, 215, 47, 128, 33,
        4, 32, 4, 66, 10, 130, 33, 5, 32, 9, 32, 5, 132, 33, 4, 32, 4, 66, 0, 82, 4, 64, 2, 64, 32, 3, 65,
        128, 8, 106, 33, 7, 32, 5, 167, 33, 2, 32, 2, 65, 48, 114, 33, 2, 32, 2, 65, 255, 1, 113, 33, 2,
        32, 7, 32, 2, 58, 0, 0, 32, 3, 65, 127, 106, 33, 2, 32, 2, 65, 128, 8, 106, 33, 3, 32, 3, 65, 46,
        58, 0, 0, 11, 11, 32, 6, 66, 128, 148, 235, 220, 3, 128, 33, 4, 32, 4, 66, 60, 130, 33, 4, 32, 4,
        66, 0, 81, 4, 64, 2, 64, 32, 2, 65, 127, 106, 33, 2, 32, 2, 65, 128, 8, 106, 33, 3, 32, 3, 65, 48,
        58, 0, 0, 11, 5, 3, 64, 32, 2, 65, 127, 106, 33, 2, 32, 4, 32, 4, 66, 10, 128, 34, 5, 66, 10, 126,
        125, 33, 9, 32, 9, 167, 33, 3, 32, 3, 65, 48, 114, 33, 3, 32, 3, 65, 255, 1, 113, 33, 7, 32, 2, 65,
        128, 8, 106, 33, 3, 32, 3, 32, 7, 58, 0, 0, 32, 4, 66, 10, 90, 4, 64, 2, 64, 32, 5, 33, 4, 12, 2, 11,
        11, 11, 11, 32, 6, 66, 255, 175, 157, 194, 223, 1, 86, 4, 64, 2, 64, 32, 6, 66, 128, 176, 157,
        194, 223, 1, 128, 33, 4, 32, 2, 65, 127, 106, 33, 3, 32, 3, 65, 128, 8, 106, 33, 7, 32, 7, 65,
        237, 0, 58, 0, 0, 32, 4, 66, 60, 130, 33, 4, 32, 4, 66, 0, 81, 4, 64, 2, 64, 32, 2, 65, 126, 106,
        33, 2, 32, 2, 65, 128, 8, 106, 33, 3, 32, 3, 65, 48, 58, 0, 0, 11, 5, 2, 64, 32, 3, 33, 2, 3, 64, 32,
        2, 65, 127, 106, 33, 2, 32, 4, 32, 4, 66, 10, 128, 34, 5, 66, 10, 126, 125, 33, 9, 32, 9, 167, 33,
        3, 32, 3, 65, 48, 114, 33, 3, 32, 3, 65, 255, 1, 113, 33, 7, 32, 2, 65, 128, 8, 106, 33, 3, 32, 3,
        32, 7, 58, 0, 0, 32, 4, 66, 10, 90, 4, 64, 2, 64, 32, 5, 33, 4, 12, 2, 11, 11, 11, 11, 11, 32, 6, 66,
        255, 191, 226, 133, 227, 232, 0, 86, 4, 64, 2, 64, 32, 6, 66, 128, 192, 226, 133, 227, 232, 0,
        128, 33, 6, 32, 2, 65, 127, 106, 33, 2, 32, 2, 65, 128, 8, 106, 33, 3, 32, 3, 65, 232, 0, 58, 0, 0,
        3, 64, 32, 2, 65, 127, 106, 33, 2, 32, 6, 32, 6, 66, 10, 128, 34, 4, 66, 10, 126, 125, 33, 5, 32,
        5, 167, 33, 3, 32, 3, 65, 48, 114, 33, 3, 32, 3, 65, 255, 1, 113, 33, 7, 32, 2, 65, 128, 8, 106,
        33, 3, 32, 3, 32, 7, 58, 0, 0, 32, 6, 66, 10, 90, 4, 64, 2, 64, 32, 4, 33, 6, 12, 2, 11, 11, 11, 11,
        11, 11, 11, 11, 11, 11, 32, 10, 69, 4, 64, 32, 2, 15, 11, 32, 2, 65, 127, 106, 33, 3, 32, 3, 65,
        128, 8, 106, 33, 2, 32, 2, 65, 45, 58, 0, 0, 32, 3, 11
    ])), {
        env: { memory: wasmMemory }
    }).exports :
    null);
const fmtduration = (wasm$1 ? (() => {
    let p = wasm$1.bufptr();
    let z = wasm$1.bufsize();
    let u8heap = new Uint8Array(wasmMemory.buffer);
    return function fmtduration(d) {
        let [low, high] = f64ToS32pair(d);
        let w = wasm$1.fmtduration(low, high);
        return String.fromCharCode.apply(null, u8heap.subarray(p + w, p + z));
    };
})() :
    (d) => {
        return `${(d / 1e9).toFixed(1)}ms`;
    });
function fmtduration2(d) {
    return fmtduration(d < Nanosecond ? 1 :
        d < Microsecond ? Math.round(d / (Nanosecond / 100)) * (Nanosecond / 100) :
            d < Millisecond ? Math.round(d / (Microsecond / 100)) * (Microsecond / 100) :
                d < Second ? Math.round(d / (Millisecond / 100)) * (Millisecond / 100) :
                    d);
}
TEST("fmtduration", () => {
    const samples = [
        ["0s", 0],
        ["1ns", 1 * Nanosecond],
        ["1.1µs", 1100 * Nanosecond],
        ["2.2ms", 2200 * Microsecond],
        ["3.3s", 3300 * Millisecond],
        ["4m5s", 4 * Minute + 5 * Second],
        ["4m5.001s", 4 * Minute + 5001 * Millisecond],
        ["5h6m7.001s", 5 * Hour + 6 * Minute + 7001 * Millisecond],
        ["8m0.000000001s", 8 * Minute + 1 * Nanosecond],
        ["2562047h47m16.854775807s",
            SInt64.ONE.shl(63).sub(SInt64.ONE).toFloat64()
        ],
        ["-2562047h47m16.854775808s",
            SInt64.ONENEG.shl(63).toFloat64()
        ],
    ];
    for (let [expectedResult, input] of samples) {
        let actualResult = fmtduration(input);
        assert(actualResult == expectedResult, `${actualResult} == ${expectedResult}`);
    }
});
//# sourceMappingURL=time.js.map

function copyelim(f) {
    for (let b of f.blocks) {
        for (let v of b.values) {
            copyelimValue(v);
        }
    }
    for (let b of f.blocks) {
        let v = b.control;
        if (v && v.op === ops.Copy) {
            b.setControl(v.args[0]);
        }
    }
    for (let e of f.namedValues.values()) {
        let values = e.values;
        for (let i = 0; i < values.length; i++) {
            let v = values[i];
            if (v.op === ops.Copy) {
                values[i] = v.args[0];
            }
        }
    }
}
function copySource(v) {
    assert(v.op === ops.Copy);
    assert(v.args.length == 1);
    let w = v.args[0];
    let slow = w;
    let advance = false;
    while (w.op === ops.Copy) {
        w = w.args[0];
        if (w === slow) {
            w.reset(ops.Unknown);
            break;
        }
        if (advance) {
            slow = slow.args[0];
        }
        advance = !advance;
    }
    while (v != w) {
        let x = v.args[0];
        v.setArg(0, w);
        v = x;
    }
    return w;
}
function copyelimValue(v) {
    for (let i = 0; i < v.args.length; i++) {
        let a = v.args[i];
        if (a.op === ops.Copy) {
            v.setArg(i, copySource(a));
        }
    }
}
//# sourceMappingURL=copyelim.js.map

function phielim(f) {
    while (true) {
        let change = false;
        for (let b of f.blocks) {
            for (let v of b.values) {
                copyelimValue(v);
                change = phielimValue(v) || change;
            }
        }
        if (!change) {
            break;
        }
    }
}
function phielimValue(v) {
    if (v.op !== ops.Phi) {
        return false;
    }
    let args = v.args;
    assert(args, `Phi ${v} without args`);
    var w = null;
    for (let x of args) {
        if (x === v) {
            continue;
        }
        if (x === w) {
            continue;
        }
        if (w) {
            return false;
        }
        w = x;
    }
    if (!w) {
        return false;
    }
    v.op = ops.Copy;
    v.setArgs1(w);
    debuglog(`eliminated phi ${v}`);
    return true;
}
//# sourceMappingURL=phielim.js.map

function rewrite(f, rb, rv) {
    while (true) {
        let change = false;
        for (let b of f.blocks) {
            if (b.control && b.control.op === ops.Copy) {
                while (b.control.op === ops.Copy) {
                    assert(b.control != null);
                    assert(b.control.args[0] != null);
                    b.setControl(b.control.args[0]);
                }
            }
            if (rb(b)) {
                change = true;
            }
            for (let j = 0; j < b.values.length; j++) {
                let v = b.values[j];
                change = phielimValue(v) || change;
                for (let i = 0; i < v.args.length; i++) {
                    let a = v.args[i];
                    if (a.op !== ops.Copy) {
                        continue;
                    }
                    let aa = copySource(a);
                    v.setArg(i, aa);
                    change = true;
                    while (a.uses == 0) {
                        let b = a.args[0];
                        a.reset(ops.Invalid);
                        a = b;
                    }
                }
                change = rv(v) || change;
            }
        }
        if (!change) {
            break;
        }
    }
    for (let b of f.blocks) {
        let j = 0;
        for (let i = 0; i < b.values.length; i++) {
            let v = b.values[i];
            if (v.op === ops.Invalid) {
                f.freeValue(v);
                continue;
            }
            if (i != j) {
                b.values[j] = v;
            }
            j++;
        }
        b.values.length = j;
    }
}
//# sourceMappingURL=rewrite.js.map

function nullLowerBlock(_) { return false; }
function nullLowerValue(_) { return false; }
function lower(f, c) {
    if (c.lowerBlock || c.lowerValue) {
        rewrite(f, c.lowerBlock || nullLowerBlock, c.lowerValue || nullLowerValue);
    }
}
//# sourceMappingURL=lower.js.map

const dlog$1 = function (..._) { };
function deadcode(f) {
    assert(f.regAlloc == null, `deadcode after regalloc for ${f}`);
    let reachable = reachableBlocks(f);
    dlog$1(`reachable blocks:`, reachable
        .map((reachable, id) => reachable ? id : undefined)
        .filter(id => id !== undefined)
        .join('  '));
    for (let b of f.blocks) {
        if (reachable[b.id]) {
            continue;
        }
        let nsuccs = b.succs ? b.succs.length : 0;
        for (let i = 0; i < nsuccs;) {
            let e = b.succs[i];
            if (reachable[e.id]) {
                removeEdge(b, i);
            }
            else {
                i++;
            }
        }
    }
    for (let b of f.blocks) {
        if (!reachable[b.id]) {
            continue;
        }
        if (b.kind != BlockKind.First) {
            continue;
        }
        removeEdge(b, 1);
        b.kind = BlockKind.Plain;
        b.likely = BranchPrediction.Unknown;
    }
    copyelim(f);
    let live = liveValues(f, reachable);
    dlog$1(`live values:`, Object.keys(live).map(k => 'v' + k).join(', '));
    let s = new Set();
    for (let [key, e] of f.namedValues) {
        let j = 0;
        s.clear();
        for (let v of e.values) {
            if (live[v.id] && !s.has(v)) {
                e.values[j] = v;
                j++;
                s.add(v);
            }
        }
        if (j == 0) {
            f.namedValues.delete(key);
        }
        else {
            for (let k = e.values.length - 1; k >= j; k--) {
                e.values[k] = undefined;
            }
            e.values.length = j;
        }
    }
    dlog$1(`live names':`, Array.from(f.namedValues.keys()).join(', '));
    for (let b of f.blocks) {
        if (!reachable[b.id]) {
            b.setControl(null);
        }
        for (let v of b.values) {
            if (!live[v.id]) {
                v.resetArgs();
            }
        }
    }
    for (let b of f.blocks) {
        let i = 0;
        for (let v of b.values) {
            if (live[v.id]) {
                b.values[i] = v;
                i++;
            }
            else {
                f.freeValue(v);
            }
        }
        b.values.length = i;
    }
    let i = 0;
    for (let b of f.blocks) {
        if (reachable[b.id]) {
            f.blocks[i] = b;
            i++;
        }
        else {
            if (b.values.length > 0) {
                panic(`live values in unreachable block ${b}: ${b.values.join(', ')}`);
            }
            f.freeBlock(b);
        }
    }
    f.blocks.length = i;
}
function reachableBlocks(f) {
    let reachable = new Array(f.numBlocks());
    reachable[f.entry.id] = true;
    let p = [];
    p.push(f.entry);
    while (p.length > 0) {
        let b = p.pop();
        let succs = b.succs;
        if (succs) {
            if (b.kind == BlockKind.First) {
                succs = succs.slice(0, 1);
            }
            for (let c of succs) {
                assert(c.id < reachable.length, `block ${c} >= f.numBlocks()=${reachable.length}`);
                if (!reachable[c.id]) {
                    reachable[c.id] = true;
                    p.push(c);
                }
            }
        }
    }
    return reachable;
}
function liveValues(f, reachable) {
    let live = new Array(f.numBlocks());
    if (f.regAlloc) {
        live.fill(true);
        return live;
    }
    let q = [];
    for (let b of f.blocks) {
        if (!reachable[b.id]) {
            continue;
        }
        let v = b.control;
        if (v && !live[v.id]) {
            live[v.id] = true;
            q.push(v);
        }
        for (let v of b.values) {
            if ((v.op.call || v.op.hasSideEffects) && !live[v.id]) {
                live[v.id] = true;
                q.push(v);
            }
            if (v.op.nilCheck && !live[v.id]) {
                live[v.id] = true;
                q.push(v);
            }
        }
    }
    while (q.length > 0) {
        let v = q.pop();
        for (let i = 0; i < v.args.length; i++) {
            let x = v.args[i];
            if (v.op === ops.Phi && !reachable[v.b.preds[i].id]) {
                continue;
            }
            if (!live[x.id]) {
                live[x.id] = true;
                q.push(x);
            }
        }
    }
    return live;
}
function removeEdge(b, i) {
    let c = b.succs[i];
    b.removeNthSucc(i);
    let j = c.removePred(b);
    let n = c.preds.length;
    for (let v of c.values) {
        if (v.op !== ops.Phi) {
            continue;
        }
        v.args[j].uses--;
        v.args[j] = v.args[n];
        v.args.length = n;
        phielimValue(v);
    }
}
//# sourceMappingURL=deadcode.js.map

function shortcircuit(f) {
    for (let b of f.blocks) {
        for (let v of b.values) {
            if (v.op !== ops.Phi) {
                continue;
            }
            if (v.type !== t_bool) {
                continue;
            }
            for (let i = 0; i < v.args.length; i++) {
                let p = b.preds[i];
                if (p.kind != BlockKind.If) {
                    continue;
                }
                let a = v.args[i];
                if (p.control !== a) {
                    continue;
                }
            }
        }
    }
}
//# sourceMappingURL=shortcircuit.js.map

class DesiredState {
    constructor(copyOther) {
        this.entries = [];
        this.avoid = emptyRegSet;
        if (copyOther) {
            this.copy(copyOther);
        }
    }
    toString() {
        let s = '{';
        s += this.entries.map(e => `v${e.id}[` + e.regs.filter(r => r != noReg).map(r => `r${r}`).join(' ') + ']').join(', ');
        s += `}`;
        if (!this.avoid.isZero()) {
            s += `avoid=${fmtRegSet(this.avoid)}`;
        }
        return s;
    }
    clear() {
        this.entries.length = 0;
        this.avoid = emptyRegSet;
    }
    get(vid) {
        for (let e of this.entries) {
            if (e.id == vid) {
                return e.regs;
            }
        }
        return [noReg, noReg, noReg, noReg];
    }
    add(vid, r) {
        const d = this;
        d.avoid = d.avoid.or(UInt64.ONE.shl(r));
        for (let e of d.entries) {
            if (e.id != vid) {
                continue;
            }
            if (e.regs[0] == r) {
                return;
            }
            for (let j = 1; j < e.regs.length; j++) {
                if (e.regs[j] == r) {
                    e.regs.copyWithin(1, 0, j);
                    e.regs[0] = r;
                    return;
                }
            }
            e.regs.copyWithin(1, 0);
            e.regs[0] = r;
            return;
        }
        d.entries.push({ id: vid, regs: [r, noReg, noReg, noReg] });
    }
    addList(vid, regs) {
        for (let i = regs.length - 1; i >= 0; i--) {
            let r = regs[i];
            if (r != noReg) {
                this.add(vid, r);
            }
        }
    }
    clobber(m) {
        let d = this;
        for (let i = 0; i < d.entries.length;) {
            let e = d.entries[i];
            let j = 0;
            for (let r of e.regs) {
                if (r != noReg && m.shr(r).and(UInt64.ONE).isZero()) {
                    e.regs[j] = r;
                    j++;
                }
            }
            if (j == 0) {
                d.entries[i] = d.entries[d.entries.length - 1];
                d.entries.splice(d.entries.length - 1, 1);
                continue;
            }
            for (; j < e.regs.length; j++) {
                e.regs[j] = noReg;
            }
            i++;
        }
        d.avoid = d.avoid.and(m.not());
    }
    copy(x) {
        this.entries.splice(0, this.entries.length, ...x.entries);
        this.avoid = x.avoid;
    }
    remove(vid) {
        for (let e of this.entries) {
            if (e.id == vid) {
                let regs = e.regs;
                let z = this.entries.length - 1;
                e = this.entries[z];
                this.entries.splice(z, 1);
                return regs;
            }
        }
        return [noReg, noReg, noReg, noReg];
    }
    merge(x) {
        this.avoid = this.avoid.or(x.avoid);
        for (let e of x.entries) {
            this.addList(e.id, e.regs);
        }
    }
}
//# sourceMappingURL=reg_desiredstate.js.map

class IntGraph {
    constructor() {
        this.nodes = [];
        this.length = 0;
    }
    copy() {
        let g = new IntGraph();
        g.length = this.length;
        g.nodes = [];
        for (let id = 0; id < this.nodes.length; id++) {
            let s = this.nodes[id];
            if (s !== undefined) {
                g.nodes[id] = new Set(s);
            }
        }
        return g;
    }
    has(id) {
        return !!this.nodes[id];
    }
    add(id) {
        if (!this.nodes[id]) {
            this.nodes[id] = new Set();
            this.length++;
        }
    }
    remove(id) {
        let s = this.nodes[id];
        if (s) {
            for (let id2 of s) {
                this.nodes[id2].delete(id);
            }
            
            this.nodes[id] = undefined;
            this.length--;
        }
    }
    connect(id1, id2) {
        let s = this.nodes[id1];
        if (!s) {
            this.nodes[id1] = new Set([id2]);
            this.length++;
        }
        else {
            s.add(id2);
        }
        s = this.nodes[id2];
        if (!s) {
            this.nodes[id2] = new Set([id1]);
            this.length++;
        }
        else {
            s.add(id1);
        }
    }
    connected(id1, id2) {
        let s = this.nodes[id1];
        return s && s.has(id2);
    }
    disconnect(id1, id2) {
        let s = this.nodes[id1];
        if (s) {
            s.delete(id2);
        }
        s = this.nodes[id2];
        if (s) {
            s.delete(id1);
        }
    }
    edges(id) {
        return this.nodes[id];
    }
    degree(id) {
        return this.nodes[id].size;
    }
    any() {
        for (let id = 0; id < this.nodes.length; id++) {
            if (this.nodes[id] !== undefined) {
                return id;
            }
        }
        return undefined;
    }
    keys() {
        let keys = [];
        for (let id = 0; id < this.nodes.length; id++) {
            if (this.nodes[id] !== undefined) {
                keys.push(id);
            }
        }
        return keys;
    }
    fmt() {
        let pairs = new Set();
        for (let k in this.nodes) {
            let id = k;
            let edges = this.edges(id);
            if (edges) {
                if (edges.size > 0) {
                    for (let id2 of edges) {
                        if (id < id2) {
                            pairs.add(`${id} -- ${id2}`);
                        }
                        else {
                            pairs.add(`${id2} -- ${id}`);
                        }
                    }
                }
                else {
                    pairs.add(`${id}`);
                }
            }
        }
        return Array.from(pairs).join('\n');
    }
}
//# sourceMappingURL=intgraph.js.map

const dlog$2 = function (..._) { };
const allocatorCache = new Map();
let allocator = null;
function regalloc(f, config) {
    if (!allocator || allocator.config !== config) {
        allocator = allocatorCache.get(config) || null;
        if (!allocator) {
            allocator = new RegAllocator(config);
            allocatorCache.set(config, allocator);
        }
    }
    allocator.regallocFun(f);
}
const likelyDistance = 1;
const normalDistance = 10;
const unlikelyDistance = 100;
const maxregs = 64;
const noReg$1 = 255 >>> 0;
function countRegs(m) {
    return m.popcnt();
}
function pickReg(m) {
    if (m.isZero()) {
        panic("can't pick a register from an empty set");
    }
    for (let i = 0;; i++) {
        if (!m.and(UInt64.ONE).isZero()) {
            return i;
        }
        m = m.shr(1);
    }
}
class ValState {
    constructor(v) {
        this.regs = emptyRegSet;
        this.needReg = false;
        this.rematerializeable = false;
        this.mindist = 0;
        this.maxdist = 0;
        this.v = v;
    }
}
class RegAllocator {
    constructor(config) {
        this.addrtype = t_u32;
        this.visitOrder = [];
        this.values = [];
        this.live = [];
        this.desired = [];
        const a = this;
        this.config = config;
        this.addrtype = intTypes(config.addrSize)[1];
        this.addrsize = config.addrSize;
        this.registers = config.registers;
        this.numregs = config.registers.length;
        if (a.numregs == 0 || a.numregs > maxregs) {
            panic(`invalid number of registers: ${a.numregs}`);
        }
        this.SPReg = noReg$1;
        this.SBReg = noReg$1;
        this.GReg = noReg$1;
        for (let r = 0; r < a.numregs; r++) {
            switch (a.registers[r].name) {
                case "SP":
                    a.SPReg = r;
                    break;
                case "SB":
                    a.SBReg = r;
                    break;
                case "g":
                    if (config.hasGReg) {
                        a.GReg = r;
                    }
                    ;
                    break;
            }
        }
        if (a.SPReg == noReg$1) {
            panic("no SP register found");
        }
        if (a.SBReg == noReg$1) {
            panic("no SB register found");
        }
        if (config.hasGReg && a.GReg == noReg$1) {
            panic("no g register found");
        }
        this.allocatable = config.gpRegMask.or(config.fpRegMask.or(config.specialRegMask));
        this.allocatable = this.allocatable.and(UInt64.ONE.shl(a.SPReg).not());
        this.allocatable = this.allocatable.and(UInt64.ONE.shl(a.SBReg).not());
        this.allocatable = this.allocatable.and(UInt64.ONE.shl(a.GReg).not());
    }
    regallocFun(f) {
        const a = this;
        a.f = f;
        assert(f.regAlloc == null, `registers already allocated for ${f}`);
        f.regAlloc = new Array(f.numValues());
        const SP = f.newValue(f.entry, ops.SP, a.addrtype, null);
        SP.reg = a.registers[this.SPReg];
        f.entry.pushValueFront(SP);
        a.visitOrder = f.blocks;
        a.values = new Array(f.numValues());
        for (let b of a.visitOrder) {
            for (let v of b.values) {
                let t = v.type;
                let val = new ValState(v);
                a.values[v.id] = val;
                if (t.mem > 0 && !t.isTuple() && v !== SP) {
                    val.needReg = true;
                    val.rematerializeable = v.rematerializeable();
                }
            }
        }
        a.computeLive();
        dlog$2("\nlive values at end of each block\n" + a.fmtLive());
        for (let vs of a.values) {
            if (vs) {
                dlog$2(`  v${vs.v.id} - ` + [
                    ['needReg', vs.needReg],
                    ['mindist', vs.mindist],
                    ['maxdist', vs.maxdist],
                ].map(v => v.join(': ')).join(', '));
            }
        }
        let ig = a.buildInterferenceGraph();
        if (DEBUG) {
            let ifstr = ig.fmt();
            let vizurl = ('https://rsms.me/co/doc/chaitin/?' +
                'input=ifg&enable-briggs=1&immediate=1&ifg=' +
                encodeURIComponent(ifstr.trim().split(/[\r\n]+/).map(s => s.trim()).join('\n')).replace(/\%20/g, '+'));
            
        }
        a.pickValues(ig);
    }
    pickValues(ig) {
        const a = this;
        let gpk = 3;
        let valstack = [];
        let spills = new Set();
        let x = 20;
        let sortedIds = ig.keys();
        function sortIds() {
            sortedIds.sort((a, b) => ig.degree(a) - ig.degree(b));
        }
        sortIds();
        pick_loop: while (true && x--) {
            for (let i = 0; i < sortedIds.length; i++) {
                let id = sortedIds[i];
                let edges = ig.edges(id);
                assert(edges, `missing edge data for v${id}`);
                if (edges.size < gpk) {
                    dlog$2(`pick v${id} with degree ${edges.size} < R`);
                    sortedIds.splice(i, 1);
                    ig.remove(id);
                    valstack.push({ id, edges });
                    continue pick_loop;
                }
            }
            if (ig.length == 0) {
                break;
            }
            let id = sortedIds.shift();
            let edges = ig.edges(id);
            dlog$2(`pick v${id} with degree ${edges.size} >= R (maybe spill)`);
            ig.remove(id);
            valstack.push({ id, edges });
            spills.add(id);
        }
        dlog$2(`spills:`, spills.size == 0 ? '(none)' :
            Array.from(spills).map(id => `v${id}`).join(" "));
        dlog$2('valstack:', valstack.map(v => `v${v.id}`).join(' '));
        let reg = -1;
        while (true) {
            let v = valstack.pop();
            if (!v) {
                return true;
            }
            reg = (reg + 1) % gpk;
            let i = gpk;
            let conflict = true;
            reg_conflict_loop: while (i--) {
                for (let id2 of v.edges) {
                    let reg2 = a.values[id2].v.reg;
                    if (reg2 && reg2.num == reg) {
                        reg = (reg + 1) % gpk;
                        continue reg_conflict_loop;
                    }
                }
                conflict = false;
                break;
            }
            if (conflict) {
                dlog$2(`unable to find register for v${v.id}`);
                reg = noReg$1;
            }
            dlog$2(`pop v${v.id} {${reg}} edges:`, v.edges);
            ig.add(v.id);
            for (let id2 of v.edges) {
                ig.connect(v.id, id2);
            }
            let val = a.values[v.id];
            assert(val.needReg, `unexpected v${v.id}.needReg=false`);
            val.v.reg = a.registers[reg];
        }
    }
    buildInterferenceGraph() {
        const a = this;
        const f = a.f;
        let g = new IntGraph();
        for (let i = f.blocks.length, b; b = f.blocks[--i];) {
            let live = new Set();
            let liveout = a.live[b.id];
            if (liveout) {
                for (let e of liveout) {
                    live.add(e.id);
                }
            }
            for (let i = b.values.length - 1; i >= 0; --i) {
                let v = b.values[i];
                live.delete(v.id);
                for (let id2 of live) {
                    g.connect(v.id, id2);
                }
                for (let operand of v.args) {
                    live.add(operand.id);
                }
            }
        }
        return g;
    }
    regspec(op) {
        return op.reg;
    }
    computeLive() {
        const a = this;
        const f = a.f;
        a.live = new Array(f.numBlocks());
        a.desired = new Array(f.numBlocks());
        let phis = [];
        let live = new Map();
        let t = new Map();
        let desired = new DesiredState();
        let po = f.postorder();
        while (true) {
            let changed = false;
            for (let b of po) {
                live.clear();
                let liv = a.live[b.id];
                if (liv)
                    for (let e of liv) {
                        live.set(e.id, { val: e.dist + b.values.length, pos: e.pos });
                    }
                if (b.control && a.values[b.control.id].needReg) {
                    live.set(b.control.id, { val: b.values.length, pos: b.pos });
                }
                phis = [];
                for (let i = b.values.length - 1; i >= 0; i--) {
                    let v = b.values[i];
                    let x = live.get(v.id);
                    if (x) {
                        a.values[v.id].maxdist = x.val;
                        live.delete(v.id);
                    }
                    if (v.op === ops.Phi) {
                        phis.push(v);
                        continue;
                    }
                    if (v.op.call) {
                        for (let v of live.values()) {
                            v.val += unlikelyDistance;
                        }
                    }
                    for (let arg of v.args) {
                        if (a.values[arg.id].needReg) {
                            live.set(arg.id, { val: i, pos: v.pos });
                        }
                    }
                }
                let other = a.desired[b.id];
                if (other) {
                    desired.copy(other);
                }
                else {
                    desired.clear();
                }
                for (let i = b.values.length - 1; i >= 0; i--) {
                    let v = b.values[i];
                    let prefs = desired.remove(v.id);
                    if (v.op === ops.Phi) {
                        continue;
                    }
                    let regspec = a.regspec(v.op);
                    desired.clobber(regspec.clobbers);
                    for (let j of regspec.inputs) {
                        if (countRegs(j.regs) != 1) {
                            continue;
                        }
                        desired.clobber(j.regs);
                        desired.add(v.args[j.idx].id, pickReg(j.regs));
                    }
                    if (v.op.resultInArg0) {
                        if (v.op.commutative) {
                            desired.addList(v.args[1].id, prefs);
                        }
                        desired.addList(v.args[0].id, prefs);
                    }
                }
                for (let i = 0; i < b.preds.length; i++) {
                    let p = b.preds[i];
                    let delta = normalDistance;
                    if (p.succs.length == 2) {
                        if (p.succs[0] == b && p.likely == BranchPrediction.Likely ||
                            p.succs[1] == b && p.likely == BranchPrediction.Unlikely) {
                            delta = likelyDistance;
                        }
                        else if (p.succs[0] == b && p.likely == BranchPrediction.Unlikely ||
                            p.succs[1] == b && p.likely == BranchPrediction.Likely) {
                            delta = unlikelyDistance;
                        }
                    }
                    let pdesired = a.desired[p.id];
                    if (!pdesired) {
                        a.desired[p.id] = new DesiredState(desired);
                    }
                    else {
                        pdesired.merge(desired);
                    }
                    t.clear();
                    let plive = a.live[p.id];
                    if (plive)
                        for (let e of plive) {
                            t.set(e.id, { val: e.dist, pos: e.pos });
                        }
                    let update = false;
                    for (let [key, e] of live) {
                        let d = e.val + delta;
                        let e2 = t.get(key);
                        if (!e2 || d < e2.val) {
                            update = true;
                            t.set(key, { val: d, pos: e.pos });
                        }
                    }
                    for (let v of phis) {
                        let id = v.args[i].id;
                        if (a.values[id].needReg) {
                            let e2 = t.get(id);
                            if (!e2 || delta < e2.val) {
                                update = true;
                                t.set(id, { val: delta, pos: v.pos });
                            }
                        }
                    }
                    if (!update) {
                        continue;
                    }
                    let l = new Array(t.size), j = 0;
                    for (let [key, e] of t) {
                        l[j++] = { id: key, dist: e.val, pos: e.pos };
                    }
                    a.live[p.id] = l;
                    changed = true;
                }
            }
            if (!changed) {
                break;
            }
        }
    }
    fmtLive() {
        const a = this;
        let s = '';
        for (let b of a.f.blocks) {
            s += `  ${b}:`;
            let blive = a.live[b.id];
            if (blive)
                for (let x of blive) {
                    s += `  v${x.id}`;
                    let desired = a.desired[b.id];
                    if (desired)
                        for (let e of desired.entries) {
                            if (e.id != x.id) {
                                continue;
                            }
                            s += "[";
                            let first = true;
                            for (let r of e.regs) {
                                if (r == noReg$1) {
                                    continue;
                                }
                                if (!first) {
                                    s += ",";
                                }
                                let reg = a.registers[r];
                                s += `${reg.name}#${reg.num}`;
                                first = false;
                            }
                            s += "]";
                        }
                }
            if (a.desired[b.id]) {
                let avoid = a.desired[b.id].avoid;
                if (!avoid.isZero()) {
                    s += " avoid=" + fmtRegSet(avoid);
                }
            }
            s += "\n";
        }
        return s.trimRight();
    }
}
//# sourceMappingURL=regalloc.js.map

function optional(name, fn) {
    return { name, fn, required: false };
}
function required(name, fn) {
    return { name, fn, required: true };
}
const passes = [
    optional("early phielim", phielim),
    optional("early copyelim", copyelim),
    optional("early deadcode", deadcode),
    optional("short circuit", shortcircuit),
    required("generic deadcode", deadcode),
    required("lower", lower),
    required("lowered deadcode", deadcode),
    optional("early phielim", phielim),
    optional("early copyelim", copyelim),
    optional("late deadcode", deadcode),
    required("regalloc", regalloc),
];

function runPassesDev(f, c, stopAt, post) {
    let totaltime = 0;
    for (let p of passes) {
        if (p.name == stopAt) {
            break;
        }
        if (c.optimize || p.required) {
            console.log(`running pass ${p.name}`);
            let t = monotime();
            p.fn(f, c);
            t = monotime() - t;
            totaltime += t;
            console.log(`pass ${p.name} finished in ${fmtduration2(t)}`);
            if (post) {
                post(p);
            }
        }
    }
    console.log(`passes over ${f.name} finished in ${fmtduration2(totaltime)}`);
}
//# sourceMappingURL=passes.js.map

class Config {
    constructor(props) {
        this.arch = '?';
        this.optimize = false;
        this.addrSize = 4;
        this.regSize = 4;
        this.intSize = 4;
        this.registers = [];
        this.hasGReg = false;
        this.gpRegMask = emptyRegSet;
        this.fpRegMask = emptyRegSet;
        this.specialRegMask = emptyRegSet;
        this.lowerBlock = null;
        this.lowerValue = null;
        if (props)
            for (let k of Object.keys(props)) {
                if (!(k in this)) {
                    panic(`invalid config property ${k}`);
                }
                
                this[k] = props[k];
            }
    }
    toString() {
        return `${this.arch}/${this.addrSize * 8}/${this.optimize ? 'opt' : 'debug'}`;
    }
}
//# sourceMappingURL=config.js.map

class ArchInfo {
    constructor(name, props) {
        this.addrSize = 4;
        this.regSize = 0;
        this.intSize = 0;
        this.ops = [];
        this.regNames = [];
        this.gpRegMask = emptyRegSet;
        this.fpRegMask = emptyRegSet;
        this.specialRegMask = emptyRegSet;
        this.generic = false;
        this.lowerBlock = null;
        this.lowerValue = null;
        this.name = name;
        for (let k of Object.keys(props)) {
            assert(k in this);
            this[k] = props[k];
        }
        assert(this.regNames.length <= 64, 'too many registers');
        assert(this.addrSize == 4 || this.addrSize == 8, `invalid addrSize ${this.addrSize}`);
        this.regSize = this.regSize || this.addrSize;
        this.intSize = this.intSize || this.addrSize;
    }
    config(props) {
        const registers = this.regNames.map((name, num) => ({ num, name }));
        const c = {
            arch: this.name,
            registers,
            addrSize: this.addrSize,
            regSize: this.regSize,
            intSize: this.intSize,
            hasGReg: this.regNames.includes("g"),
            gpRegMask: this.gpRegMask,
            fpRegMask: this.fpRegMask,
            specialRegMask: this.specialRegMask,
            lowerBlock: this.lowerBlock,
            lowerValue: this.lowerValue,
        };
        if (props) {
            Object.assign(c, props);
        }
        return new Config(c);
    }
}
//# sourceMappingURL=arch.js.map

const regNames = [
    "R0",
    "R1",
    "R2",
    "R3",
    "R4",
    "R5",
    "R6",
    "R7",
    "R8",
    "R9",
    "R10",
    "R11",
    "R12",
    "R13",
    "R14",
    "R15",
    "R16",
    "R17",
    "R18",
    "R19",
    "R20",
    "R21",
    "R22",
    "R24",
    "R25",
    "R28",
    "R29",
    "SP",
    "g",
    "F0",
    "F2",
    "F4",
    "F6",
    "F8",
    "F10",
    "F12",
    "F14",
    "F16",
    "F18",
    "F20",
    "F22",
    "F24",
    "F26",
    "F28",
    "F30",
    "SB",
];
const buildReg = regBuilder(regNames);
const gp = buildReg(`
  R1  R2  R3  R4  R5  R6  R7  R8  R9  R10 R11 R12 R13 R14 R15 R16
  R17 R18 R19 R20 R21 R22     R24 R25         R28 R29
`);
const fp = buildReg(`
  F0 F2 F4 F6 F8 F10 F12 F14 F16 F18 F20 F22 F24 F26 F28 F30
`);
for (let name in ops) {
    let op = ops[name];
    if (!op.zeroWidth && !op.call) {
        let regs = gp;
        if (op.argLen > 0) {
            op.reg.inputs = [];
            for (let i = 0; i < op.argLen; i++) {
                op.reg.inputs[i] = { idx: i, regs };
            }
        }
        op.reg.outputs = [{ idx: 0, regs }];
    }
}
const gpg = gp.or(buildReg("g"));
const gpspg = gpg.or(buildReg("SP"));
const gp01 = new RegInfo([], [gp]);
const gp21 = new RegInfo([gpg, gpg], [gp]);
const gp11sp = new RegInfo([gpspg], [gp]);
function op$1(name, argLen, props) {
    return new Op(name, argLen, props);
}
const aops = {
    MOVWconst: op$1("MOVWconst", 0, {
        reg: gp01,
        aux: t_u32,
        type: t_u32,
        rematerializeable: true,
    }),
    ADDW: op$1("ADDW", 2, { reg: gp21, type: t_u32, commutative: true }),
    ADDWconst: op$1("ADDWconst", 1, {
        reg: gp11sp,
        type: t_u32,
        aux: t_u32,
        commutative: true,
    }),
    LowNilCheck: op$1("LowNilCheck", 2, {
        reg: new RegInfo([gpg], []),
        nilCheck: true,
        faultOnNilArg0: true,
    }),
};
var covm = new ArchInfo("covm", {
    addrSize: 4,
    ops: Object.values(aops),
    regNames: regNames,
    gpRegMask: gp,
    fpRegMask: fp,
    lowerBlock: lowerBlockCovm,
    lowerValue: lowerValueCovm,
});
function lowerBlockCovm(b) {
    return false;
}
const valueLoweringFuns = new Map([
    [ops.NilCheck, (v) => {
            v.op = aops.LowNilCheck;
            return true;
        }],
    [ops.ConstI32, (v) => {
            let val = v.aux;
            v.reset(aops.MOVWconst);
            v.aux = val;
            return true;
        }],
    [ops.AddI32, (v) => {
            let [x, y] = v.args;
            v.reset(aops.ADDW);
            v.addArg(x);
            v.addArg(y);
            return true;
        }],
    [aops.ADDW, (v) => {
            while (true) {
                let x = v.args[0];
                let v_1 = v.args[1];
                if (v_1.op !== aops.MOVWconst) {
                    break;
                }
                let c = v_1.aux;
                v.reset(aops.ADDWconst);
                v.aux = c;
                v.addArg(x);
                debuglog(`rewrite ${v} (ADD x (MOVWconst [c])) -> (ADDWconst [c] x)`);
                return true;
            }
            return false;
        }],
]);
function lowerValueCovm(v) {
    let lf = valueLoweringFuns.get(v.op);
    return lf ? lf(v) : false;
}
//# sourceMappingURL=covm.js.map

const archs = {
    [covm.name]: covm,
};
//# sourceMappingURL=all.js.map

const wasm$2 = (typeof WebAssembly != 'undefined' ?
    new WebAssembly.Instance(new WebAssembly.Module(new Uint8Array([
        0, 97, 115, 109, 1, 0, 0, 0, 1, 9, 2, 96, 0, 1, 127, 96, 1, 127, 0, 3, 4, 3, 0, 1, 0, 6, 16, 3, 126, 1,
        66, 1, 11, 126, 1, 66, 2, 11, 127, 1, 65, 0, 11, 7, 37, 3, 8, 103, 101, 116, 95, 104, 105, 103,
        104, 0, 0, 4, 115, 101, 101, 100, 0, 1, 15, 120, 111, 114, 115, 104, 105, 102, 116, 49, 50, 56,
        112, 108, 117, 115, 0, 2, 10, 110, 3, 4, 0, 35, 2, 11, 15, 0, 32, 0, 173, 36, 0, 32, 0, 173, 66, 1,
        124, 36, 1, 11, 87, 1, 4, 126, 35, 0, 33, 0, 35, 1, 33, 1, 32, 1, 36, 0, 32, 0, 66, 23, 134, 33, 2,
        32, 2, 32, 0, 133, 33, 0, 32, 0, 66, 17, 136, 33, 2, 32, 1, 66, 26, 136, 33, 3, 32, 0, 32, 1, 133,
        33, 0, 32, 0, 32, 3, 133, 33, 0, 32, 0, 32, 2, 133, 33, 0, 32, 0, 36, 1, 32, 0, 32, 1, 124, 33, 1,
        32, 1, 66, 32, 135, 167, 36, 2, 32, 1, 167, 11
    ])), {}).exports :
    null);
let js_state0 = 1 | 0;
let js_state1 = 2 | 0;
function i32rand_mwc1616() {
    js_state0 = 18030 * (js_state0 & 0xffff) + (js_state0 >> 16);
    js_state1 = 30903 * (js_state1 & 0xffff) + (js_state1 >> 16);
    return js_state0 << 16 + (js_state1 & 0xffff);
}
const seed = (wasm$2 !== null ? wasm$2.seed : (n) => {
    js_state0 = n | 0;
    js_state1 = (n + 1) | 0;
});
const sint64rand = (wasm$2 !== null ? () => {
    const low = wasm$2.xorshift128plus();
    return new SInt64(low, wasm$2.get_high());
} : () => new SInt64(i32rand_mwc1616(), i32rand_mwc1616()));
const uint64rand = (wasm$2 !== null ? () => {
    const low = wasm$2.xorshift128plus();
    return new UInt64(low, wasm$2.get_high());
} : () => new UInt64(i32rand_mwc1616(), i32rand_mwc1616()));
seed((Math.random() * 0xffffffff) >>> 0);
//# sourceMappingURL=int64_rand.js.map

function assertEq(actual, expected, context) {
    assert(actual === expected, `expected ${JSON.stringify(expected)} ` +
        `but instead got ${JSON.stringify(actual)}` +
        (context ? ' — ' + context : ''), assertEq);
}
function assertEqList(actualList, expectedList) {
    if (actualList.length !== expectedList.length) {
        assert(false, `expected list of length ${expectedList.length} ` +
            `but got ${actualList.length}`, assertEqList);
    }
    for (let i = 0; i < expectedList.length; i++) {
        assert(actualList[i] === expectedList[i], `expected list item #${i} to be ${JSON.stringify(expectedList[i])} ` +
            `but got ${JSON.stringify(actualList[i])}`, assertEqList);
    }
}
function assertEqObj(actualObj, expectedObj) {
    let actualKeys = Object.keys(actualObj);
    let expectedKeys = Object.keys(expectedObj);
    if (actualKeys.length !== expectedKeys.length) {
        assert(false, `expected object with ${expectedKeys.length} properties ` +
            `but got one with ${actualKeys.length} properties`, assertEqObj);
    }
    for (let i = 0; i < expectedKeys.length; i++) {
        let k = expectedKeys[i];
        assert(actualObj[k] === expectedObj[k], `expected property ${k} to be ${JSON.stringify(expectedObj[k])} ` +
            `but got ${JSON.stringify(actualObj[k])}`, assertEqObj);
    }
}
function assertThrows(fn) {
    try {
        fn();
        assert(false, 'expected exception to be thrown', assertThrows);
    }
    catch (e) {
    }
}
class QCGenBase {
    constructor(size = 0) {
        this.size = size >>> 0;
    }
    gen(i) {
        return undefined;
    }
}
class QCF64Gen extends QCGenBase {
    constructor(a, b) {
        if (a > b) {
            let t = a;
            a = b;
            b = t;
        }
        super(Math.ceil(b - a));
        this.gen = () => Math.random() * (b - a) + a;
    }
}
class QCS32Gen extends QCGenBase {
    constructor(a, b) {
        a = a | 0;
        b = b | 0;
        if (a > b) {
            let t = a;
            a = b;
            b = t;
        }
        super(b - a);
        this.gen = () => Math.floor(Math.random() * (b + 1 - a) + a) | 0;
    }
}
class QCU32Gen extends QCGenBase {
    constructor(a, b) {
        a = a >>> 0;
        b = b >>> 0;
        if (a > b) {
            let t = a;
            a = b;
            b = t;
        }
        super(b - a);
        this.gen = () => Math.floor(Math.random() * (b + 1 - a) + a) >>> 0;
    }
}
function quickcheck(gen, arg1, arg2) {
    let check = arg2;
    let options = arg1;
    if (arg2 === undefined) {
        check = arg1;
        options = {};
    }
    else if (!options || typeof options != 'object') {
        throw new Error('argument 2 is not an options object');
    }
    const opt = Object.assign({
        timeout: 1000,
    }, gen, options);
    opt.timeout = Math.max(0, opt.timeout);
    let g = gen;
    if (Array.isArray(gen)) {
        let [a, b] = gen;
        if (typeof a == 'number' && typeof b == 'number') {
            if (Math.round(a) != a) {
                g = new QCF64Gen(a, b);
            }
            else if (Math.min(a, b) < 0) {
                g = new QCS32Gen(a, b);
            }
            else {
                g = new QCU32Gen(a, b);
            }
        }
        else {
            throw new Error(`unexpected range type ${typeof a}`);
        }
    }
    let timeStarted = monotime();
    for (let i = 0; i < g.size; i++) {
        let v = g.gen(i);
        let ok = check(v);
        if (!ok) {
            assert(false, `quickcheck failure for input ${v}, generation ${i}`, quickcheck);
        }
        if (opt.timeout && i % 100 == 0 && monotime() - timeStarted > opt.timeout) {
            break;
        }
    }
}
//# sourceMappingURL=test.js.map

TEST('basic', () => {
    let s, u;
    s = new SInt64(0xFFFFFFFF | 0, 0x7FFFFFFF | 0);
    assertEq(s.toFloat64(), 9223372036854775807);
    assertEq(s.toString(10), "9223372036854775807");
    s = new SInt64(0 | 0, 0 | 0);
    assertEq(s.toFloat64(), 0);
    assertEq(s.toString(10), "0");
    u = new UInt64(0xFFFFFFFF | 0, 0xFFFFFFFF | 0);
    assertEq(u.toString(10), "18446744073709551615");
});
TEST('constants', () => {
    let s, u;
    s = new SInt64(0xFFFFFFFF | 0, 0x7FFFFFFF | 0);
    assert(s.constructor === SInt64.MAX.constructor);
    assert(s.eq(SInt64.MAX));
    s = new SInt64(0, 0x80000000 | 0);
    assert(s.constructor === SInt64.MIN.constructor);
    assert(s.eq(SInt64.MIN));
    s = new SInt64(0, 0);
    assert(s.constructor === SInt64.ZERO.constructor);
    assert(s.eq(SInt64.ZERO));
    s = new SInt64(1, 0);
    assert(s.constructor === SInt64.ONE.constructor);
    assert(s.eq(SInt64.ONE));
    s = new SInt64(-1 | 0, -1);
    assert(s.constructor === SInt64.ONENEG.constructor);
    assert(s.eq(SInt64.ONENEG));
    u = new UInt64(0xFFFFFFFF | 0, 0xFFFFFFFF | 0);
    assert(u.constructor === UInt64.MAX.constructor);
    assert(u.eq(UInt64.MAX));
    u = new UInt64(0, 0);
    assert(u.constructor === UInt64.MIN.constructor);
    assert(u.constructor === UInt64.ZERO.constructor);
    assert(u.eq(UInt64.MIN));
    assert(u.eq(UInt64.ZERO));
});
TEST('toString', () => {
    let s, u;
    s = SInt64.MAX;
    assertEq(s.toString(16), "7fffffffffffffff");
    assertEq(s.toString(10), "9223372036854775807");
    assertEq(s.toString(8), "777777777777777777777");
    assertEq(s.toString(36), "1y2p0ij32e8e7");
    s = SInt64.MIN;
    assertEq(s.toString(16), "-8000000000000000");
    assertEq(s.toString(10), "-9223372036854775808");
    assertEq(s.toString(8), "-1000000000000000000000");
    assertEq(s.toString(36), "-1y2p0ij32e8e8");
    u = UInt64.MAX;
    assertEq(u.toString(16), "ffffffffffffffff");
    assertEq(u.toString(10), "18446744073709551615");
    assertEq(u.toString(8), "1777777777777777777777");
    assertEq(u.toString(36), "3w5e11264sgsf");
});
TEST('fromStr', () => {
    function t(I, s, radix) {
        assertEq(I.fromStr(s, radix).toString(radix), s);
    }
    t(SInt64, "7fffffffffffffff", 16);
    t(SInt64, "9223372036854775807", 10);
    t(SInt64, "777777777777777777777", 8);
    t(SInt64, "1y2p0ij32e8e7", 36);
    t(SInt64, "-8000000000000000", 16);
    t(SInt64, "-9223372036854775808", 10);
    t(SInt64, "-1000000000000000000000", 8);
    t(SInt64, "-1y2p0ij32e8e8", 36);
    t(UInt64, "efffffffffffffff", 16);
    t(UInt64, "ffffffffffffffff", 16);
    t(UInt64, "18446744073709551615", 10);
    t(UInt64, "1777777777777777777777", 8);
    t(UInt64, "3w5e11264sgsf", 36);
});
TEST('fromByteStr', () => {
    function t(I, str, radix) {
        let inbuf = asciibuf(str);
        let u = I.fromByteStr(inbuf, radix);
        assertEq(u.toString(radix), str);
    }
    t(SInt64, "7fffffffffffffff", 16);
    t(SInt64, "9223372036854775807", 10);
    t(SInt64, "777777777777777777777", 8);
    t(SInt64, "1y2p0ij32e8e7", 36);
    t(SInt64, "-8000000000000000", 16);
    t(SInt64, "-9223372036854775808", 10);
    t(SInt64, "-1000000000000000000000", 8);
    t(SInt64, "-1y2p0ij32e8e8", 36);
    t(UInt64, "efffffffffffffff", 16);
    t(UInt64, "ffffffffffffffff", 16);
    t(UInt64, "18446744073709551615", 10);
    t(UInt64, "1777777777777777777777", 8);
    t(UInt64, "3w5e11264sgsf", 36);
});
TEST('fromByteStr0', () => {
    function t(I, str, radix) {
        let expectstr = str;
        if (str[0] == '-') {
            str = str.substr(1);
        }
        let inbuf = asciibuf(str);
        let u = I.fromByteStr0(inbuf, radix, 0, inbuf.length);
        assertEq(u.toString(radix), expectstr);
    }
    t(SInt64, "7fffffffffffffff", 16);
    t(SInt64, "9223372036854775807", 10);
    t(SInt64, "777777777777777777777", 8);
    t(SInt64, "1y2p0ij32e8e7", 36);
    t(SInt64, "-8000000000000000", 16);
    t(SInt64, "-9223372036854775808", 10);
    t(SInt64, "-1000000000000000000000", 8);
    t(SInt64, "-1y2p0ij32e8e8", 36);
    t(UInt64, "efffffffffffffff", 16);
    t(UInt64, "ffffffffffffffff", 16);
    t(UInt64, "18446744073709551615", 10);
    t(UInt64, "1777777777777777777777", 8);
    t(UInt64, "3w5e11264sgsf", 36);
});
TEST('toBytes', () => {
    let s;
    s = new SInt64(0x01234567, 0x12345678);
    assertEqList(s.toBytesBE(), [0x12, 0x34, 0x56, 0x78, 0x01, 0x23, 0x45, 0x67]);
    assertEqList(s.toBytesLE(), [0x67, 0x45, 0x23, 0x01, 0x78, 0x56, 0x34, 0x12]);
});
TEST('fromBytes', () => {
    let s, u;
    s = new SInt64(0x01234567, 0x12345678);
    u = new UInt64(0x01234567, 0x12345678);
    assertEqObj(SInt64.fromBytesLE(s.toBytesLE()), s);
    assertEqObj(SInt64.fromBytesBE([0x12, 0x34, 0x56, 0x78, 0x01, 0x23, 0x45, 0x67]), s);
    assertEqObj(SInt64.fromBytesLE([0x67, 0x45, 0x23, 0x01, 0x78, 0x56, 0x34, 0x12]), s);
    assertEqObj(UInt64.fromBytesLE([0x67, 0x45, 0x23, 0x01, 0x78, 0x56, 0x34, 0x12]), u);
});
TEST('fromInt32', () => {
    let s, u;
    s = SInt64.fromInt32(0x7FFFFFFF);
    assertEq(s.toString(10), '2147483647');
    s = SInt64.fromInt32(0xFFFFFFFF);
    assertEq(s.toString(10), '-1');
    s = SInt64.fromInt32(-0x80000000);
    assertEq(s.toString(10), '-2147483648');
    s = SInt64.fromInt32(-0x80000001);
    assertEq(s.toString(10), '2147483647');
    u = UInt64.fromInt32(0xFFFFFFFF);
    assertEq(u.toString(10), '4294967295');
    u = UInt64.fromInt32(0xFFFFFFFFFF);
    assertEq(u.toString(10), '4294967295');
    u = UInt64.fromInt32(-0xFFFFFFFe);
    assertEq(u.toString(10), '18446744069414584322');
    u = new UInt64(-1, -1);
    assertEq(u._low, -1);
    assertEq(u._high, -1);
    assertEq(u.toString(10), '18446744073709551615');
    u = UInt64.fromInt32(-1);
    assertEq(u._low, -1);
    assertEq(u._high, -1);
    assertEq(u.toString(10), '18446744073709551615');
    u = UInt64.fromInt32(-2);
    assertEq(u.toString(10), '18446744073709551614');
});
TEST('fromFloat64/s', () => {
    let s;
    s = SInt64.fromFloat64(0x7FFFFFFF);
    assertEq(s.toFloat64(), 2147483647);
    assertEq(s.toString(10), '2147483647');
    s = SInt64.fromFloat64(0xFFFFFFFFFF);
    assertEq(s.toFloat64(), 1099511627775);
    assertEq(s.toString(10), '1099511627775');
    s = SInt64.fromFloat64(-0xFFFFFFFFFF);
    assertEq(s.toFloat64(), -1099511627775);
    assertEq(s.toString(10), '-1099511627775');
    s = SInt64.fromFloat64(0x7FFFFFFFFFFFFFFF);
    assertEq(s.toFloat64(), 9223372036854775807);
    assertEq(s.toString(10), '9223372036854775807');
    s = SInt64.fromFloat64(-0x8000000000000000);
    assertEq(s.toFloat64(), -9223372036854775808);
    assertEq(s.toString(10), '-9223372036854775808');
    s = SInt64.fromFloat64(0xFFFFFFFFFFFFFFFF);
    assertEq(s.toFloat64(), 9223372036854775807);
    assertEq(s.toString(10), '9223372036854775807');
});
TEST('fromFloat64/u', () => {
    let u;
    u = UInt64.fromFloat64(0x7FFFFFFF);
    assertEq(u.toFloat64(), 2147483647);
    assertEq(u.toString(10), '2147483647');
    u = UInt64.fromFloat64(0xFFFFFFFFFF);
    assertEq(u.toFloat64(), 1099511627775);
    assertEq(u.toString(10), '1099511627775');
    u = UInt64.fromFloat64(0xFFFFFFFFFFFFFFFF);
    assertEq(u.toFloat64(), 18446744073709551615);
    assertEq(u.toString(10), '18446744073709551615');
    u = UInt64.fromFloat64(-1);
    assertEq(u.toFloat64(), 0);
    assertEq(u.toString(10), '0');
    u = UInt64.fromFloat64(-0xFFFFFFFFFF);
    assertEq(u.toFloat64(), 0);
    assertEq(u.toString(10), '0');
});
TEST('maybeFromFloat64/s', () => {
    let s;
    s = SInt64.maybeFromFloat64(123);
    assert(s != null);
    assertEq(s.toFloat64(), 123);
    assertEq(s.toString(10), '123');
    s = SInt64.maybeFromFloat64(0x7FFFFFFF);
    assert(s != null);
    assertEq(s.toFloat64(), 2147483647);
    assertEq(s.toString(10), '2147483647');
    s = SInt64.maybeFromFloat64(0xFFFFFFFFFF);
    assert(s != null);
    assertEq(s.toFloat64(), 1099511627775);
    assertEq(s.toString(10), '1099511627775');
    s = SInt64.maybeFromFloat64(-0xFFFFFFFFFF);
    assert(s != null);
    assertEq(s.toFloat64(), -1099511627775);
    assertEq(s.toString(10), '-1099511627775');
    s = SInt64.maybeFromFloat64(0x7FFFFFFFFFFFFFFF);
    assert(s != null);
    assertEq(s.toFloat64(), 9223372036854775807);
    assertEq(s.toString(10), '9223372036854775807');
    s = SInt64.maybeFromFloat64(-0x8000000000000000);
    assert(s != null);
    assertEq(s.toFloat64(), -9223372036854775808);
    assertEq(s.toString(10), '-9223372036854775808');
    s = SInt64.maybeFromFloat64(0xFFFFFFFFFFFFFFFF);
    assertEq(s, null);
});
TEST('maybeFromFloat64/u', () => {
    let u;
    u = UInt64.maybeFromFloat64(0x7FFFFFFF);
    assert(u != null);
    assertEq(u.toFloat64(), 2147483647);
    assertEq(u.toString(10), '2147483647');
    u = UInt64.maybeFromFloat64(0xFFFFFFFFFF);
    assert(u != null);
    assertEq(u.toFloat64(), 1099511627775);
    assertEq(u.toString(10), '1099511627775');
    u = UInt64.maybeFromFloat64(0xFFFFFFFFFFFFFFFF);
    assert(u != null);
    assertEq(u.toFloat64(), 18446744073709551615);
    assertEq(u.toString(10), '18446744073709551615');
    u = UInt64.maybeFromFloat64(-1);
    assertEq(u, null);
    u = UInt64.maybeFromFloat64(-0xFFFFFFFFFF);
    assertEq(u, null);
});
TEST('sign-conv', () => {
    let s, u;
    s = SInt64.fromFloat64(-1);
    assertEq(s.toFloat64(), -1);
    assertEq(s.toString(10), '-1');
    u = s.toUnsigned();
    assertEq(u.toFloat64(), 0xFFFFFFFFFFFFFFFF);
    assertEq(u.toString(16), 'ffffffffffffffff');
    s = u.toSigned();
    assertEq(s.toFloat64(), -1);
    assertEq(s.toString(10), '-1');
});
TEST('sub-max-signed', () => {
    let u;
    u = UInt64.MAX.sub(SInt64.MAX).sub(SInt64.ONE);
    assertEq(u.toFloat64(), SInt64.MAX.toFloat64());
    assertEq(u.toString(), SInt64.MAX.toString());
});
TEST('sub-max-unsigned', () => {
    let u;
    u = UInt64.MAX.sub(UInt64.MAX);
    assertEq(u._low, 0);
    assertEq(u._high, 0);
    assertEq(u.toFloat64(), 0);
    assertEq(u.toString(), '0');
});
TEST('sub-zero-cross-sign', () => {
    let s, u;
    u = UInt64.MAX.sub(UInt64.ONE);
    assertEq(u.toFloat64(), 0xFFFFFFFFFFFFFFFe);
    assertEq(u.toString(), '18446744073709551614');
    u = UInt64.MAX.sub(SInt64.ONENEG);
    assertEq(u.toFloat64(), 0);
    assertEq(u.toString(), '0');
    s = SInt64.fromInt32(-1);
    assertEq(s._low, -1);
    assertEq(s._high, -1);
    u = UInt64.fromInt32(0).add(s);
    assertEq(u.toFloat64(), 0xFFFFFFFFFFFFFFFF);
    assertEq(u.toString(), '18446744073709551615');
});
let js_mul = SInt64.prototype._js_mul;
let js_div_s = SInt64.prototype._js_div;
let js_div_u = UInt64.prototype._js_div;
let js_mod_s = SInt64.prototype._js_mod;
let js_popcnt = SInt64.prototype._js_popcnt;
TEST('div-max', () => {
    let s, u;
    s = UInt64.MAX.div(SInt64.MAX);
    assertEq(s.toFloat64(), 2);
    assertEq(s.toString(), '2');
    u = UInt64.MAX.div(UInt64.MAX);
    assertEq(u.toString(), '1');
});
if (js_div_u)
    TEST('div-max/js', () => {
        let s, u;
        s = js_div_u.call(UInt64.MAX, SInt64.MAX);
        assertEq(s.toFloat64(), 2);
        assertEq(s.toString(), '2');
        u = js_div_u.call(UInt64.MAX, UInt64.MAX);
        assertEq(u.toString(), '1');
    });
TEST('div-neg', () => {
    let s, u;
    s = SInt64.fromInt32(-2);
    assertEq(s.toUnsigned().toString(), UInt64.MAX.sub(UInt64.ONE).toString());
    u = UInt64.MAX.div(s);
    assertEq(u.toString(), '1');
    s = SInt64.MIN.div(SInt64.ONE);
    assertEq(s.toString(), SInt64.MIN.toString());
});
if (js_div_u)
    TEST('div-neg/js', () => {
        let s, u;
        s = SInt64.fromInt32(-2);
        u = js_div_u.call(UInt64.MAX, s);
        assertEq(u.toString(), '1');
        s = js_div_s.call(SInt64.MIN, SInt64.ONE);
        assertEq(s.toString(), SInt64.MIN.toString());
    });
TEST('div-unsigned', () => {
    let a = new UInt64(0, 8);
    let b = UInt64.fromFloat64(2656901066);
    let x = a.div(b);
    assertEq(x.toString(), '12');
    assertEq(x.constructor, UInt64);
});
if (js_div_u)
    TEST('div-unsigned/js', () => {
        let a = new UInt64(0, 8);
        let b = UInt64.fromFloat64(2656901066);
        let x = js_div_u.call(a, b);
        assertEq(x.toString(), '12');
        assertEq(x.constructor, UInt64);
    });
TEST('msb-unsigned', () => {
    let u = UInt64.ONE.shl(63);
    assert(u.eq(SInt64.MIN) == false);
    assertEq(u.toString(), "9223372036854775808");
});
TEST('popcnt/s/quickcheck', () => {
    function popcnt_naive(n) {
        let c = 0;
        while (!n.isZero()) {
            n = n.and(n.sub(SInt64.ONE));
            c++;
        }
        return c;
    }
    quickcheck({ timeout: 100, size: Infinity, gen: sint64rand }, n => n.popcnt() == popcnt_naive(n));
    quickcheck({ timeout: 100, size: Infinity, gen: sint64rand }, n => js_popcnt.call(n) == popcnt_naive(n));
});
TEST('popcnt/u/quickcheck', () => {
    function popcnt_naive(n) {
        let c = 0;
        while (!n.isZero()) {
            n = n.and(n.sub(UInt64.ONE));
            c++;
        }
        return c;
    }
    quickcheck({ timeout: 100, size: Infinity, gen: uint64rand }, n => n.popcnt() == popcnt_naive(n));
    quickcheck({ timeout: 100, size: Infinity, gen: uint64rand }, n => js_popcnt.call(n) == popcnt_naive(n));
});
function i32array(v) {
    for (let i = 0; i < v.length; ++i) {
        v[i] = v[i] & 0xFFFFFFFF;
    }
    return v;
}
var TEST_BITS = i32array([
    0x80000000, 0x00000000, 0xb776d5f5, 0x5634e2db, 0xffefffff, 0xffffffff,
    0xfff00000, 0x00000000, 0xfffeffff, 0xffffffff, 0xffff0000, 0x00000000,
    0xfffffffe, 0xffffffff, 0xffffffff, 0x00000000, 0xffffffff, 0xfeffffff,
    0xffffffff, 0xff000000, 0xffffffff, 0xfffeffff, 0xffffffff, 0xffff0000,
    0xffffffff, 0xffff7fff, 0xffffffff, 0xffff8000, 0xffffffff, 0xfffffffe,
    0xffffffff, 0xffffffff, 0x00000000, 0x00000000, 0x00000000, 0x00000001,
    0x00000000, 0x00000002, 0x00000000, 0x00007fff, 0x00000000, 0x00008000,
    0x00000000, 0x0000ffff, 0x00000000, 0x00010000, 0x00000000, 0x00ffffff,
    0x00000000, 0x01000000, 0x00000000, 0x5634e2db, 0x00000000, 0xb776d5f5,
    0x00000000, 0xffffffff, 0x00000001, 0x00000000, 0x0000ffff, 0xffffffff,
    0x00010000, 0x00000000, 0x000fffff, 0xffffffff, 0x00100000, 0x00000000,
    0x5634e2db, 0xb776d5f5, 0x7fffffff, 0xffffffff
]);
var TEST_ADD_BITS = i32array([
    0x3776d5f5, 0x5634e2db, 0x7fefffff, 0xffffffff, 0xb766d5f5, 0x5634e2da,
    0x7ff00000, 0x00000000, 0xb766d5f5, 0x5634e2db, 0xffdfffff, 0xffffffff,
    0x7ffeffff, 0xffffffff, 0xb775d5f5, 0x5634e2da, 0xffeeffff, 0xfffffffe,
    0xffeeffff, 0xffffffff, 0x7fff0000, 0x00000000, 0xb775d5f5, 0x5634e2db,
    0xffeeffff, 0xffffffff, 0xffef0000, 0x00000000, 0xfffdffff, 0xffffffff,
    0x7ffffffe, 0xffffffff, 0xb776d5f4, 0x5634e2da, 0xffeffffe, 0xfffffffe,
    0xffeffffe, 0xffffffff, 0xfffefffe, 0xfffffffe, 0xfffefffe, 0xffffffff,
    0x7fffffff, 0x00000000, 0xb776d5f4, 0x5634e2db, 0xffeffffe, 0xffffffff,
    0xffefffff, 0x00000000, 0xfffefffe, 0xffffffff, 0xfffeffff, 0x00000000,
    0xfffffffd, 0xffffffff, 0x7fffffff, 0xfeffffff, 0xb776d5f5, 0x5534e2da,
    0xffefffff, 0xfefffffe, 0xffefffff, 0xfeffffff, 0xfffeffff, 0xfefffffe,
    0xfffeffff, 0xfeffffff, 0xfffffffe, 0xfefffffe, 0xfffffffe, 0xfeffffff,
    0x7fffffff, 0xff000000, 0xb776d5f5, 0x5534e2db, 0xffefffff, 0xfeffffff,
    0xffefffff, 0xff000000, 0xfffeffff, 0xfeffffff, 0xfffeffff, 0xff000000,
    0xfffffffe, 0xfeffffff, 0xfffffffe, 0xff000000, 0xffffffff, 0xfdffffff,
    0x7fffffff, 0xfffeffff, 0xb776d5f5, 0x5633e2da, 0xffefffff, 0xfffefffe,
    0xffefffff, 0xfffeffff, 0xfffeffff, 0xfffefffe, 0xfffeffff, 0xfffeffff,
    0xfffffffe, 0xfffefffe, 0xfffffffe, 0xfffeffff, 0xffffffff, 0xfefefffe,
    0xffffffff, 0xfefeffff, 0x7fffffff, 0xffff0000, 0xb776d5f5, 0x5633e2db,
    0xffefffff, 0xfffeffff, 0xffefffff, 0xffff0000, 0xfffeffff, 0xfffeffff,
    0xfffeffff, 0xffff0000, 0xfffffffe, 0xfffeffff, 0xfffffffe, 0xffff0000,
    0xffffffff, 0xfefeffff, 0xffffffff, 0xfeff0000, 0xffffffff, 0xfffdffff,
    0x7fffffff, 0xffff7fff, 0xb776d5f5, 0x563462da, 0xffefffff, 0xffff7ffe,
    0xffefffff, 0xffff7fff, 0xfffeffff, 0xffff7ffe, 0xfffeffff, 0xffff7fff,
    0xfffffffe, 0xffff7ffe, 0xfffffffe, 0xffff7fff, 0xffffffff, 0xfeff7ffe,
    0xffffffff, 0xfeff7fff, 0xffffffff, 0xfffe7ffe, 0xffffffff, 0xfffe7fff,
    0x7fffffff, 0xffff8000, 0xb776d5f5, 0x563462db, 0xffefffff, 0xffff7fff,
    0xffefffff, 0xffff8000, 0xfffeffff, 0xffff7fff, 0xfffeffff, 0xffff8000,
    0xfffffffe, 0xffff7fff, 0xfffffffe, 0xffff8000, 0xffffffff, 0xfeff7fff,
    0xffffffff, 0xfeff8000, 0xffffffff, 0xfffe7fff, 0xffffffff, 0xfffe8000,
    0xffffffff, 0xfffeffff, 0x7fffffff, 0xfffffffe, 0xb776d5f5, 0x5634e2d9,
    0xffefffff, 0xfffffffd, 0xffefffff, 0xfffffffe, 0xfffeffff, 0xfffffffd,
    0xfffeffff, 0xfffffffe, 0xfffffffe, 0xfffffffd, 0xfffffffe, 0xfffffffe,
    0xffffffff, 0xfefffffd, 0xffffffff, 0xfefffffe, 0xffffffff, 0xfffefffd,
    0xffffffff, 0xfffefffe, 0xffffffff, 0xffff7ffd, 0xffffffff, 0xffff7ffe,
    0x7fffffff, 0xffffffff, 0xb776d5f5, 0x5634e2da, 0xffefffff, 0xfffffffe,
    0xffefffff, 0xffffffff, 0xfffeffff, 0xfffffffe, 0xfffeffff, 0xffffffff,
    0xfffffffe, 0xfffffffe, 0xfffffffe, 0xffffffff, 0xffffffff, 0xfefffffe,
    0xffffffff, 0xfeffffff, 0xffffffff, 0xfffefffe, 0xffffffff, 0xfffeffff,
    0xffffffff, 0xffff7ffe, 0xffffffff, 0xffff7fff, 0xffffffff, 0xfffffffd,
    0x80000000, 0x00000000, 0xb776d5f5, 0x5634e2db, 0xffefffff, 0xffffffff,
    0xfff00000, 0x00000000, 0xfffeffff, 0xffffffff, 0xffff0000, 0x00000000,
    0xfffffffe, 0xffffffff, 0xffffffff, 0x00000000, 0xffffffff, 0xfeffffff,
    0xffffffff, 0xff000000, 0xffffffff, 0xfffeffff, 0xffffffff, 0xffff0000,
    0xffffffff, 0xffff7fff, 0xffffffff, 0xffff8000, 0xffffffff, 0xfffffffe,
    0xffffffff, 0xffffffff, 0x80000000, 0x00000001, 0xb776d5f5, 0x5634e2dc,
    0xfff00000, 0x00000000, 0xfff00000, 0x00000001, 0xffff0000, 0x00000000,
    0xffff0000, 0x00000001, 0xffffffff, 0x00000000, 0xffffffff, 0x00000001,
    0xffffffff, 0xff000000, 0xffffffff, 0xff000001, 0xffffffff, 0xffff0000,
    0xffffffff, 0xffff0001, 0xffffffff, 0xffff8000, 0xffffffff, 0xffff8001,
    0xffffffff, 0xffffffff, 0x00000000, 0x00000000, 0x00000000, 0x00000001,
    0x80000000, 0x00000002, 0xb776d5f5, 0x5634e2dd, 0xfff00000, 0x00000001,
    0xfff00000, 0x00000002, 0xffff0000, 0x00000001, 0xffff0000, 0x00000002,
    0xffffffff, 0x00000001, 0xffffffff, 0x00000002, 0xffffffff, 0xff000001,
    0xffffffff, 0xff000002, 0xffffffff, 0xffff0001, 0xffffffff, 0xffff0002,
    0xffffffff, 0xffff8001, 0xffffffff, 0xffff8002, 0x00000000, 0x00000000,
    0x00000000, 0x00000001, 0x00000000, 0x00000002, 0x00000000, 0x00000003,
    0x80000000, 0x00007fff, 0xb776d5f5, 0x563562da, 0xfff00000, 0x00007ffe,
    0xfff00000, 0x00007fff, 0xffff0000, 0x00007ffe, 0xffff0000, 0x00007fff,
    0xffffffff, 0x00007ffe, 0xffffffff, 0x00007fff, 0xffffffff, 0xff007ffe,
    0xffffffff, 0xff007fff, 0xffffffff, 0xffff7ffe, 0xffffffff, 0xffff7fff,
    0xffffffff, 0xfffffffe, 0xffffffff, 0xffffffff, 0x00000000, 0x00007ffd,
    0x00000000, 0x00007ffe, 0x00000000, 0x00007fff, 0x00000000, 0x00008000,
    0x00000000, 0x00008001, 0x80000000, 0x00008000, 0xb776d5f5, 0x563562db,
    0xfff00000, 0x00007fff, 0xfff00000, 0x00008000, 0xffff0000, 0x00007fff,
    0xffff0000, 0x00008000, 0xffffffff, 0x00007fff, 0xffffffff, 0x00008000,
    0xffffffff, 0xff007fff, 0xffffffff, 0xff008000, 0xffffffff, 0xffff7fff,
    0xffffffff, 0xffff8000, 0xffffffff, 0xffffffff, 0x00000000, 0x00000000,
    0x00000000, 0x00007ffe, 0x00000000, 0x00007fff, 0x00000000, 0x00008000,
    0x00000000, 0x00008001, 0x00000000, 0x00008002, 0x00000000, 0x0000ffff,
    0x80000000, 0x0000ffff, 0xb776d5f5, 0x5635e2da, 0xfff00000, 0x0000fffe,
    0xfff00000, 0x0000ffff, 0xffff0000, 0x0000fffe, 0xffff0000, 0x0000ffff,
    0xffffffff, 0x0000fffe, 0xffffffff, 0x0000ffff, 0xffffffff, 0xff00fffe,
    0xffffffff, 0xff00ffff, 0xffffffff, 0xfffffffe, 0xffffffff, 0xffffffff,
    0x00000000, 0x00007ffe, 0x00000000, 0x00007fff, 0x00000000, 0x0000fffd,
    0x00000000, 0x0000fffe, 0x00000000, 0x0000ffff, 0x00000000, 0x00010000,
    0x00000000, 0x00010001, 0x00000000, 0x00017ffe, 0x00000000, 0x00017fff,
    0x80000000, 0x00010000, 0xb776d5f5, 0x5635e2db, 0xfff00000, 0x0000ffff,
    0xfff00000, 0x00010000, 0xffff0000, 0x0000ffff, 0xffff0000, 0x00010000,
    0xffffffff, 0x0000ffff, 0xffffffff, 0x00010000, 0xffffffff, 0xff00ffff,
    0xffffffff, 0xff010000, 0xffffffff, 0xffffffff, 0x00000000, 0x00000000,
    0x00000000, 0x00007fff, 0x00000000, 0x00008000, 0x00000000, 0x0000fffe,
    0x00000000, 0x0000ffff, 0x00000000, 0x00010000, 0x00000000, 0x00010001,
    0x00000000, 0x00010002, 0x00000000, 0x00017fff, 0x00000000, 0x00018000,
    0x00000000, 0x0001ffff, 0x80000000, 0x00ffffff, 0xb776d5f5, 0x5734e2da,
    0xfff00000, 0x00fffffe, 0xfff00000, 0x00ffffff, 0xffff0000, 0x00fffffe,
    0xffff0000, 0x00ffffff, 0xffffffff, 0x00fffffe, 0xffffffff, 0x00ffffff,
    0xffffffff, 0xfffffffe, 0xffffffff, 0xffffffff, 0x00000000, 0x00fefffe,
    0x00000000, 0x00feffff, 0x00000000, 0x00ff7ffe, 0x00000000, 0x00ff7fff,
    0x00000000, 0x00fffffd, 0x00000000, 0x00fffffe, 0x00000000, 0x00ffffff,
    0x00000000, 0x01000000, 0x00000000, 0x01000001, 0x00000000, 0x01007ffe,
    0x00000000, 0x01007fff, 0x00000000, 0x0100fffe, 0x00000000, 0x0100ffff,
    0x80000000, 0x01000000, 0xb776d5f5, 0x5734e2db, 0xfff00000, 0x00ffffff,
    0xfff00000, 0x01000000, 0xffff0000, 0x00ffffff, 0xffff0000, 0x01000000,
    0xffffffff, 0x00ffffff, 0xffffffff, 0x01000000, 0xffffffff, 0xffffffff,
    0x00000000, 0x00000000, 0x00000000, 0x00feffff, 0x00000000, 0x00ff0000,
    0x00000000, 0x00ff7fff, 0x00000000, 0x00ff8000, 0x00000000, 0x00fffffe,
    0x00000000, 0x00ffffff, 0x00000000, 0x01000000, 0x00000000, 0x01000001,
    0x00000000, 0x01000002, 0x00000000, 0x01007fff, 0x00000000, 0x01008000,
    0x00000000, 0x0100ffff, 0x00000000, 0x01010000, 0x00000000, 0x01ffffff,
    0x80000000, 0x5634e2db, 0xb776d5f5, 0xac69c5b6, 0xfff00000, 0x5634e2da,
    0xfff00000, 0x5634e2db, 0xffff0000, 0x5634e2da, 0xffff0000, 0x5634e2db,
    0xffffffff, 0x5634e2da, 0xffffffff, 0x5634e2db, 0x00000000, 0x5534e2da,
    0x00000000, 0x5534e2db, 0x00000000, 0x5633e2da, 0x00000000, 0x5633e2db,
    0x00000000, 0x563462da, 0x00000000, 0x563462db, 0x00000000, 0x5634e2d9,
    0x00000000, 0x5634e2da, 0x00000000, 0x5634e2db, 0x00000000, 0x5634e2dc,
    0x00000000, 0x5634e2dd, 0x00000000, 0x563562da, 0x00000000, 0x563562db,
    0x00000000, 0x5635e2da, 0x00000000, 0x5635e2db, 0x00000000, 0x5734e2da,
    0x00000000, 0x5734e2db, 0x80000000, 0xb776d5f5, 0xb776d5f6, 0x0dabb8d0,
    0xfff00000, 0xb776d5f4, 0xfff00000, 0xb776d5f5, 0xffff0000, 0xb776d5f4,
    0xffff0000, 0xb776d5f5, 0xffffffff, 0xb776d5f4, 0xffffffff, 0xb776d5f5,
    0x00000000, 0xb676d5f4, 0x00000000, 0xb676d5f5, 0x00000000, 0xb775d5f4,
    0x00000000, 0xb775d5f5, 0x00000000, 0xb77655f4, 0x00000000, 0xb77655f5,
    0x00000000, 0xb776d5f3, 0x00000000, 0xb776d5f4, 0x00000000, 0xb776d5f5,
    0x00000000, 0xb776d5f6, 0x00000000, 0xb776d5f7, 0x00000000, 0xb77755f4,
    0x00000000, 0xb77755f5, 0x00000000, 0xb777d5f4, 0x00000000, 0xb777d5f5,
    0x00000000, 0xb876d5f4, 0x00000000, 0xb876d5f5, 0x00000001, 0x0dabb8d0,
    0x80000000, 0xffffffff, 0xb776d5f6, 0x5634e2da, 0xfff00000, 0xfffffffe,
    0xfff00000, 0xffffffff, 0xffff0000, 0xfffffffe, 0xffff0000, 0xffffffff,
    0xffffffff, 0xfffffffe, 0xffffffff, 0xffffffff, 0x00000000, 0xfefffffe,
    0x00000000, 0xfeffffff, 0x00000000, 0xfffefffe, 0x00000000, 0xfffeffff,
    0x00000000, 0xffff7ffe, 0x00000000, 0xffff7fff, 0x00000000, 0xfffffffd,
    0x00000000, 0xfffffffe, 0x00000000, 0xffffffff, 0x00000001, 0x00000000,
    0x00000001, 0x00000001, 0x00000001, 0x00007ffe, 0x00000001, 0x00007fff,
    0x00000001, 0x0000fffe, 0x00000001, 0x0000ffff, 0x00000001, 0x00fffffe,
    0x00000001, 0x00ffffff, 0x00000001, 0x5634e2da, 0x00000001, 0xb776d5f4,
    0x80000001, 0x00000000, 0xb776d5f6, 0x5634e2db, 0xfff00000, 0xffffffff,
    0xfff00001, 0x00000000, 0xffff0000, 0xffffffff, 0xffff0001, 0x00000000,
    0xffffffff, 0xffffffff, 0x00000000, 0x00000000, 0x00000000, 0xfeffffff,
    0x00000000, 0xff000000, 0x00000000, 0xfffeffff, 0x00000000, 0xffff0000,
    0x00000000, 0xffff7fff, 0x00000000, 0xffff8000, 0x00000000, 0xfffffffe,
    0x00000000, 0xffffffff, 0x00000001, 0x00000000, 0x00000001, 0x00000001,
    0x00000001, 0x00000002, 0x00000001, 0x00007fff, 0x00000001, 0x00008000,
    0x00000001, 0x0000ffff, 0x00000001, 0x00010000, 0x00000001, 0x00ffffff,
    0x00000001, 0x01000000, 0x00000001, 0x5634e2db, 0x00000001, 0xb776d5f5,
    0x00000001, 0xffffffff, 0x8000ffff, 0xffffffff, 0xb777d5f5, 0x5634e2da,
    0xfff0ffff, 0xfffffffe, 0xfff0ffff, 0xffffffff, 0xffffffff, 0xfffffffe,
    0xffffffff, 0xffffffff, 0x0000fffe, 0xfffffffe, 0x0000fffe, 0xffffffff,
    0x0000ffff, 0xfefffffe, 0x0000ffff, 0xfeffffff, 0x0000ffff, 0xfffefffe,
    0x0000ffff, 0xfffeffff, 0x0000ffff, 0xffff7ffe, 0x0000ffff, 0xffff7fff,
    0x0000ffff, 0xfffffffd, 0x0000ffff, 0xfffffffe, 0x0000ffff, 0xffffffff,
    0x00010000, 0x00000000, 0x00010000, 0x00000001, 0x00010000, 0x00007ffe,
    0x00010000, 0x00007fff, 0x00010000, 0x0000fffe, 0x00010000, 0x0000ffff,
    0x00010000, 0x00fffffe, 0x00010000, 0x00ffffff, 0x00010000, 0x5634e2da,
    0x00010000, 0xb776d5f4, 0x00010000, 0xfffffffe, 0x00010000, 0xffffffff,
    0x80010000, 0x00000000, 0xb777d5f5, 0x5634e2db, 0xfff0ffff, 0xffffffff,
    0xfff10000, 0x00000000, 0xffffffff, 0xffffffff, 0x00000000, 0x00000000,
    0x0000fffe, 0xffffffff, 0x0000ffff, 0x00000000, 0x0000ffff, 0xfeffffff,
    0x0000ffff, 0xff000000, 0x0000ffff, 0xfffeffff, 0x0000ffff, 0xffff0000,
    0x0000ffff, 0xffff7fff, 0x0000ffff, 0xffff8000, 0x0000ffff, 0xfffffffe,
    0x0000ffff, 0xffffffff, 0x00010000, 0x00000000, 0x00010000, 0x00000001,
    0x00010000, 0x00000002, 0x00010000, 0x00007fff, 0x00010000, 0x00008000,
    0x00010000, 0x0000ffff, 0x00010000, 0x00010000, 0x00010000, 0x00ffffff,
    0x00010000, 0x01000000, 0x00010000, 0x5634e2db, 0x00010000, 0xb776d5f5,
    0x00010000, 0xffffffff, 0x00010001, 0x00000000, 0x0001ffff, 0xffffffff,
    0x800fffff, 0xffffffff, 0xb786d5f5, 0x5634e2da, 0xffffffff, 0xfffffffe,
    0xffffffff, 0xffffffff, 0x000effff, 0xfffffffe, 0x000effff, 0xffffffff,
    0x000ffffe, 0xfffffffe, 0x000ffffe, 0xffffffff, 0x000fffff, 0xfefffffe,
    0x000fffff, 0xfeffffff, 0x000fffff, 0xfffefffe, 0x000fffff, 0xfffeffff,
    0x000fffff, 0xffff7ffe, 0x000fffff, 0xffff7fff, 0x000fffff, 0xfffffffd,
    0x000fffff, 0xfffffffe, 0x000fffff, 0xffffffff, 0x00100000, 0x00000000,
    0x00100000, 0x00000001, 0x00100000, 0x00007ffe, 0x00100000, 0x00007fff,
    0x00100000, 0x0000fffe, 0x00100000, 0x0000ffff, 0x00100000, 0x00fffffe,
    0x00100000, 0x00ffffff, 0x00100000, 0x5634e2da, 0x00100000, 0xb776d5f4,
    0x00100000, 0xfffffffe, 0x00100000, 0xffffffff, 0x0010ffff, 0xfffffffe,
    0x0010ffff, 0xffffffff, 0x80100000, 0x00000000, 0xb786d5f5, 0x5634e2db,
    0xffffffff, 0xffffffff, 0x00000000, 0x00000000, 0x000effff, 0xffffffff,
    0x000f0000, 0x00000000, 0x000ffffe, 0xffffffff, 0x000fffff, 0x00000000,
    0x000fffff, 0xfeffffff, 0x000fffff, 0xff000000, 0x000fffff, 0xfffeffff,
    0x000fffff, 0xffff0000, 0x000fffff, 0xffff7fff, 0x000fffff, 0xffff8000,
    0x000fffff, 0xfffffffe, 0x000fffff, 0xffffffff, 0x00100000, 0x00000000,
    0x00100000, 0x00000001, 0x00100000, 0x00000002, 0x00100000, 0x00007fff,
    0x00100000, 0x00008000, 0x00100000, 0x0000ffff, 0x00100000, 0x00010000,
    0x00100000, 0x00ffffff, 0x00100000, 0x01000000, 0x00100000, 0x5634e2db,
    0x00100000, 0xb776d5f5, 0x00100000, 0xffffffff, 0x00100001, 0x00000000,
    0x0010ffff, 0xffffffff, 0x00110000, 0x00000000, 0x001fffff, 0xffffffff,
    0xd634e2db, 0xb776d5f5, 0x0dabb8d1, 0x0dabb8d0, 0x5624e2db, 0xb776d5f4,
    0x5624e2db, 0xb776d5f5, 0x5633e2db, 0xb776d5f4, 0x5633e2db, 0xb776d5f5,
    0x5634e2da, 0xb776d5f4, 0x5634e2da, 0xb776d5f5, 0x5634e2db, 0xb676d5f4,
    0x5634e2db, 0xb676d5f5, 0x5634e2db, 0xb775d5f4, 0x5634e2db, 0xb775d5f5,
    0x5634e2db, 0xb77655f4, 0x5634e2db, 0xb77655f5, 0x5634e2db, 0xb776d5f3,
    0x5634e2db, 0xb776d5f4, 0x5634e2db, 0xb776d5f5, 0x5634e2db, 0xb776d5f6,
    0x5634e2db, 0xb776d5f7, 0x5634e2db, 0xb77755f4, 0x5634e2db, 0xb77755f5,
    0x5634e2db, 0xb777d5f4, 0x5634e2db, 0xb777d5f5, 0x5634e2db, 0xb876d5f4,
    0x5634e2db, 0xb876d5f5, 0x5634e2dc, 0x0dabb8d0, 0x5634e2dc, 0x6eedabea,
    0x5634e2dc, 0xb776d5f4, 0x5634e2dc, 0xb776d5f5, 0x5635e2db, 0xb776d5f4,
    0x5635e2db, 0xb776d5f5, 0x5644e2db, 0xb776d5f4, 0x5644e2db, 0xb776d5f5,
    0xffffffff, 0xffffffff, 0x3776d5f5, 0x5634e2da, 0x7fefffff, 0xfffffffe,
    0x7fefffff, 0xffffffff, 0x7ffeffff, 0xfffffffe, 0x7ffeffff, 0xffffffff,
    0x7ffffffe, 0xfffffffe, 0x7ffffffe, 0xffffffff, 0x7fffffff, 0xfefffffe,
    0x7fffffff, 0xfeffffff, 0x7fffffff, 0xfffefffe, 0x7fffffff, 0xfffeffff,
    0x7fffffff, 0xffff7ffe, 0x7fffffff, 0xffff7fff, 0x7fffffff, 0xfffffffd,
    0x7fffffff, 0xfffffffe, 0x7fffffff, 0xffffffff, 0x80000000, 0x00000000,
    0x80000000, 0x00000001, 0x80000000, 0x00007ffe, 0x80000000, 0x00007fff,
    0x80000000, 0x0000fffe, 0x80000000, 0x0000ffff, 0x80000000, 0x00fffffe,
    0x80000000, 0x00ffffff, 0x80000000, 0x5634e2da, 0x80000000, 0xb776d5f4,
    0x80000000, 0xfffffffe, 0x80000000, 0xffffffff, 0x8000ffff, 0xfffffffe,
    0x8000ffff, 0xffffffff, 0x800fffff, 0xfffffffe, 0x800fffff, 0xffffffff,
    0xd634e2db, 0xb776d5f4
]);
var TEST_SUB_BITS = i32array([
    0x00000000, 0x00000000, 0xc8892a0a, 0xa9cb1d25, 0x80100000, 0x00000001,
    0x80100000, 0x00000000, 0x80010000, 0x00000001, 0x80010000, 0x00000000,
    0x80000001, 0x00000001, 0x80000001, 0x00000000, 0x80000000, 0x01000001,
    0x80000000, 0x01000000, 0x80000000, 0x00010001, 0x80000000, 0x00010000,
    0x80000000, 0x00008001, 0x80000000, 0x00008000, 0x80000000, 0x00000002,
    0x80000000, 0x00000001, 0x80000000, 0x00000000, 0x7fffffff, 0xffffffff,
    0x7fffffff, 0xfffffffe, 0x7fffffff, 0xffff8001, 0x7fffffff, 0xffff8000,
    0x7fffffff, 0xffff0001, 0x7fffffff, 0xffff0000, 0x7fffffff, 0xff000001,
    0x7fffffff, 0xff000000, 0x7fffffff, 0xa9cb1d25, 0x7fffffff, 0x48892a0b,
    0x7fffffff, 0x00000001, 0x7fffffff, 0x00000000, 0x7fff0000, 0x00000001,
    0x7fff0000, 0x00000000, 0x7ff00000, 0x00000001, 0x7ff00000, 0x00000000,
    0x29cb1d24, 0x48892a0b, 0x00000000, 0x00000001, 0x3776d5f5, 0x5634e2db,
    0x00000000, 0x00000000, 0xb786d5f5, 0x5634e2dc, 0xb786d5f5, 0x5634e2db,
    0xb777d5f5, 0x5634e2dc, 0xb777d5f5, 0x5634e2db, 0xb776d5f6, 0x5634e2dc,
    0xb776d5f6, 0x5634e2db, 0xb776d5f5, 0x5734e2dc, 0xb776d5f5, 0x5734e2db,
    0xb776d5f5, 0x5635e2dc, 0xb776d5f5, 0x5635e2db, 0xb776d5f5, 0x563562dc,
    0xb776d5f5, 0x563562db, 0xb776d5f5, 0x5634e2dd, 0xb776d5f5, 0x5634e2dc,
    0xb776d5f5, 0x5634e2db, 0xb776d5f5, 0x5634e2da, 0xb776d5f5, 0x5634e2d9,
    0xb776d5f5, 0x563462dc, 0xb776d5f5, 0x563462db, 0xb776d5f5, 0x5633e2dc,
    0xb776d5f5, 0x5633e2db, 0xb776d5f5, 0x5534e2dc, 0xb776d5f5, 0x5534e2db,
    0xb776d5f5, 0x00000000, 0xb776d5f4, 0x9ebe0ce6, 0xb776d5f4, 0x5634e2dc,
    0xb776d5f4, 0x5634e2db, 0xb775d5f5, 0x5634e2dc, 0xb775d5f5, 0x5634e2db,
    0xb766d5f5, 0x5634e2dc, 0xb766d5f5, 0x5634e2db, 0x6141f319, 0x9ebe0ce6,
    0x3776d5f5, 0x5634e2dc, 0x7fefffff, 0xffffffff, 0x48792a0a, 0xa9cb1d24,
    0x00000000, 0x00000000, 0xffffffff, 0xffffffff, 0xfff10000, 0x00000000,
    0xfff0ffff, 0xffffffff, 0xfff00001, 0x00000000, 0xfff00000, 0xffffffff,
    0xfff00000, 0x01000000, 0xfff00000, 0x00ffffff, 0xfff00000, 0x00010000,
    0xfff00000, 0x0000ffff, 0xfff00000, 0x00008000, 0xfff00000, 0x00007fff,
    0xfff00000, 0x00000001, 0xfff00000, 0x00000000, 0xffefffff, 0xffffffff,
    0xffefffff, 0xfffffffe, 0xffefffff, 0xfffffffd, 0xffefffff, 0xffff8000,
    0xffefffff, 0xffff7fff, 0xffefffff, 0xffff0000, 0xffefffff, 0xfffeffff,
    0xffefffff, 0xff000000, 0xffefffff, 0xfeffffff, 0xffefffff, 0xa9cb1d24,
    0xffefffff, 0x48892a0a, 0xffefffff, 0x00000000, 0xffeffffe, 0xffffffff,
    0xffef0000, 0x00000000, 0xffeeffff, 0xffffffff, 0xffe00000, 0x00000000,
    0xffdfffff, 0xffffffff, 0xa9bb1d24, 0x48892a0a, 0x7ff00000, 0x00000000,
    0x7ff00000, 0x00000000, 0x48792a0a, 0xa9cb1d25, 0x00000000, 0x00000001,
    0x00000000, 0x00000000, 0xfff10000, 0x00000001, 0xfff10000, 0x00000000,
    0xfff00001, 0x00000001, 0xfff00001, 0x00000000, 0xfff00000, 0x01000001,
    0xfff00000, 0x01000000, 0xfff00000, 0x00010001, 0xfff00000, 0x00010000,
    0xfff00000, 0x00008001, 0xfff00000, 0x00008000, 0xfff00000, 0x00000002,
    0xfff00000, 0x00000001, 0xfff00000, 0x00000000, 0xffefffff, 0xffffffff,
    0xffefffff, 0xfffffffe, 0xffefffff, 0xffff8001, 0xffefffff, 0xffff8000,
    0xffefffff, 0xffff0001, 0xffefffff, 0xffff0000, 0xffefffff, 0xff000001,
    0xffefffff, 0xff000000, 0xffefffff, 0xa9cb1d25, 0xffefffff, 0x48892a0b,
    0xffefffff, 0x00000001, 0xffefffff, 0x00000000, 0xffef0000, 0x00000001,
    0xffef0000, 0x00000000, 0xffe00000, 0x00000001, 0xffe00000, 0x00000000,
    0xa9bb1d24, 0x48892a0b, 0x7ff00000, 0x00000001, 0x7ffeffff, 0xffffffff,
    0x48882a0a, 0xa9cb1d24, 0x000f0000, 0x00000000, 0x000effff, 0xffffffff,
    0x00000000, 0x00000000, 0xffffffff, 0xffffffff, 0xffff0001, 0x00000000,
    0xffff0000, 0xffffffff, 0xffff0000, 0x01000000, 0xffff0000, 0x00ffffff,
    0xffff0000, 0x00010000, 0xffff0000, 0x0000ffff, 0xffff0000, 0x00008000,
    0xffff0000, 0x00007fff, 0xffff0000, 0x00000001, 0xffff0000, 0x00000000,
    0xfffeffff, 0xffffffff, 0xfffeffff, 0xfffffffe, 0xfffeffff, 0xfffffffd,
    0xfffeffff, 0xffff8000, 0xfffeffff, 0xffff7fff, 0xfffeffff, 0xffff0000,
    0xfffeffff, 0xfffeffff, 0xfffeffff, 0xff000000, 0xfffeffff, 0xfeffffff,
    0xfffeffff, 0xa9cb1d24, 0xfffeffff, 0x48892a0a, 0xfffeffff, 0x00000000,
    0xfffefffe, 0xffffffff, 0xfffe0000, 0x00000000, 0xfffdffff, 0xffffffff,
    0xffef0000, 0x00000000, 0xffeeffff, 0xffffffff, 0xa9ca1d24, 0x48892a0a,
    0x7fff0000, 0x00000000, 0x7fff0000, 0x00000000, 0x48882a0a, 0xa9cb1d25,
    0x000f0000, 0x00000001, 0x000f0000, 0x00000000, 0x00000000, 0x00000001,
    0x00000000, 0x00000000, 0xffff0001, 0x00000001, 0xffff0001, 0x00000000,
    0xffff0000, 0x01000001, 0xffff0000, 0x01000000, 0xffff0000, 0x00010001,
    0xffff0000, 0x00010000, 0xffff0000, 0x00008001, 0xffff0000, 0x00008000,
    0xffff0000, 0x00000002, 0xffff0000, 0x00000001, 0xffff0000, 0x00000000,
    0xfffeffff, 0xffffffff, 0xfffeffff, 0xfffffffe, 0xfffeffff, 0xffff8001,
    0xfffeffff, 0xffff8000, 0xfffeffff, 0xffff0001, 0xfffeffff, 0xffff0000,
    0xfffeffff, 0xff000001, 0xfffeffff, 0xff000000, 0xfffeffff, 0xa9cb1d25,
    0xfffeffff, 0x48892a0b, 0xfffeffff, 0x00000001, 0xfffeffff, 0x00000000,
    0xfffe0000, 0x00000001, 0xfffe0000, 0x00000000, 0xffef0000, 0x00000001,
    0xffef0000, 0x00000000, 0xa9ca1d24, 0x48892a0b, 0x7fff0000, 0x00000001,
    0x7ffffffe, 0xffffffff, 0x48892a09, 0xa9cb1d24, 0x000fffff, 0x00000000,
    0x000ffffe, 0xffffffff, 0x0000ffff, 0x00000000, 0x0000fffe, 0xffffffff,
    0x00000000, 0x00000000, 0xffffffff, 0xffffffff, 0xffffffff, 0x01000000,
    0xffffffff, 0x00ffffff, 0xffffffff, 0x00010000, 0xffffffff, 0x0000ffff,
    0xffffffff, 0x00008000, 0xffffffff, 0x00007fff, 0xffffffff, 0x00000001,
    0xffffffff, 0x00000000, 0xfffffffe, 0xffffffff, 0xfffffffe, 0xfffffffe,
    0xfffffffe, 0xfffffffd, 0xfffffffe, 0xffff8000, 0xfffffffe, 0xffff7fff,
    0xfffffffe, 0xffff0000, 0xfffffffe, 0xfffeffff, 0xfffffffe, 0xff000000,
    0xfffffffe, 0xfeffffff, 0xfffffffe, 0xa9cb1d24, 0xfffffffe, 0x48892a0a,
    0xfffffffe, 0x00000000, 0xfffffffd, 0xffffffff, 0xfffeffff, 0x00000000,
    0xfffefffe, 0xffffffff, 0xffefffff, 0x00000000, 0xffeffffe, 0xffffffff,
    0xa9cb1d23, 0x48892a0a, 0x7fffffff, 0x00000000, 0x7fffffff, 0x00000000,
    0x48892a09, 0xa9cb1d25, 0x000fffff, 0x00000001, 0x000fffff, 0x00000000,
    0x0000ffff, 0x00000001, 0x0000ffff, 0x00000000, 0x00000000, 0x00000001,
    0x00000000, 0x00000000, 0xffffffff, 0x01000001, 0xffffffff, 0x01000000,
    0xffffffff, 0x00010001, 0xffffffff, 0x00010000, 0xffffffff, 0x00008001,
    0xffffffff, 0x00008000, 0xffffffff, 0x00000002, 0xffffffff, 0x00000001,
    0xffffffff, 0x00000000, 0xfffffffe, 0xffffffff, 0xfffffffe, 0xfffffffe,
    0xfffffffe, 0xffff8001, 0xfffffffe, 0xffff8000, 0xfffffffe, 0xffff0001,
    0xfffffffe, 0xffff0000, 0xfffffffe, 0xff000001, 0xfffffffe, 0xff000000,
    0xfffffffe, 0xa9cb1d25, 0xfffffffe, 0x48892a0b, 0xfffffffe, 0x00000001,
    0xfffffffe, 0x00000000, 0xfffeffff, 0x00000001, 0xfffeffff, 0x00000000,
    0xffefffff, 0x00000001, 0xffefffff, 0x00000000, 0xa9cb1d23, 0x48892a0b,
    0x7fffffff, 0x00000001, 0x7fffffff, 0xfeffffff, 0x48892a0a, 0xa8cb1d24,
    0x000fffff, 0xff000000, 0x000fffff, 0xfeffffff, 0x0000ffff, 0xff000000,
    0x0000ffff, 0xfeffffff, 0x00000000, 0xff000000, 0x00000000, 0xfeffffff,
    0x00000000, 0x00000000, 0xffffffff, 0xffffffff, 0xffffffff, 0xff010000,
    0xffffffff, 0xff00ffff, 0xffffffff, 0xff008000, 0xffffffff, 0xff007fff,
    0xffffffff, 0xff000001, 0xffffffff, 0xff000000, 0xffffffff, 0xfeffffff,
    0xffffffff, 0xfefffffe, 0xffffffff, 0xfefffffd, 0xffffffff, 0xfeff8000,
    0xffffffff, 0xfeff7fff, 0xffffffff, 0xfeff0000, 0xffffffff, 0xfefeffff,
    0xffffffff, 0xfe000000, 0xffffffff, 0xfdffffff, 0xffffffff, 0xa8cb1d24,
    0xffffffff, 0x47892a0a, 0xfffffffe, 0xff000000, 0xfffffffe, 0xfeffffff,
    0xfffeffff, 0xff000000, 0xfffeffff, 0xfeffffff, 0xffefffff, 0xff000000,
    0xffefffff, 0xfeffffff, 0xa9cb1d24, 0x47892a0a, 0x7fffffff, 0xff000000,
    0x7fffffff, 0xff000000, 0x48892a0a, 0xa8cb1d25, 0x000fffff, 0xff000001,
    0x000fffff, 0xff000000, 0x0000ffff, 0xff000001, 0x0000ffff, 0xff000000,
    0x00000000, 0xff000001, 0x00000000, 0xff000000, 0x00000000, 0x00000001,
    0x00000000, 0x00000000, 0xffffffff, 0xff010001, 0xffffffff, 0xff010000,
    0xffffffff, 0xff008001, 0xffffffff, 0xff008000, 0xffffffff, 0xff000002,
    0xffffffff, 0xff000001, 0xffffffff, 0xff000000, 0xffffffff, 0xfeffffff,
    0xffffffff, 0xfefffffe, 0xffffffff, 0xfeff8001, 0xffffffff, 0xfeff8000,
    0xffffffff, 0xfeff0001, 0xffffffff, 0xfeff0000, 0xffffffff, 0xfe000001,
    0xffffffff, 0xfe000000, 0xffffffff, 0xa8cb1d25, 0xffffffff, 0x47892a0b,
    0xfffffffe, 0xff000001, 0xfffffffe, 0xff000000, 0xfffeffff, 0xff000001,
    0xfffeffff, 0xff000000, 0xffefffff, 0xff000001, 0xffefffff, 0xff000000,
    0xa9cb1d24, 0x47892a0b, 0x7fffffff, 0xff000001, 0x7fffffff, 0xfffeffff,
    0x48892a0a, 0xa9ca1d24, 0x000fffff, 0xffff0000, 0x000fffff, 0xfffeffff,
    0x0000ffff, 0xffff0000, 0x0000ffff, 0xfffeffff, 0x00000000, 0xffff0000,
    0x00000000, 0xfffeffff, 0x00000000, 0x00ff0000, 0x00000000, 0x00feffff,
    0x00000000, 0x00000000, 0xffffffff, 0xffffffff, 0xffffffff, 0xffff8000,
    0xffffffff, 0xffff7fff, 0xffffffff, 0xffff0001, 0xffffffff, 0xffff0000,
    0xffffffff, 0xfffeffff, 0xffffffff, 0xfffefffe, 0xffffffff, 0xfffefffd,
    0xffffffff, 0xfffe8000, 0xffffffff, 0xfffe7fff, 0xffffffff, 0xfffe0000,
    0xffffffff, 0xfffdffff, 0xffffffff, 0xfeff0000, 0xffffffff, 0xfefeffff,
    0xffffffff, 0xa9ca1d24, 0xffffffff, 0x48882a0a, 0xfffffffe, 0xffff0000,
    0xfffffffe, 0xfffeffff, 0xfffeffff, 0xffff0000, 0xfffeffff, 0xfffeffff,
    0xffefffff, 0xffff0000, 0xffefffff, 0xfffeffff, 0xa9cb1d24, 0x48882a0a,
    0x7fffffff, 0xffff0000, 0x7fffffff, 0xffff0000, 0x48892a0a, 0xa9ca1d25,
    0x000fffff, 0xffff0001, 0x000fffff, 0xffff0000, 0x0000ffff, 0xffff0001,
    0x0000ffff, 0xffff0000, 0x00000000, 0xffff0001, 0x00000000, 0xffff0000,
    0x00000000, 0x00ff0001, 0x00000000, 0x00ff0000, 0x00000000, 0x00000001,
    0x00000000, 0x00000000, 0xffffffff, 0xffff8001, 0xffffffff, 0xffff8000,
    0xffffffff, 0xffff0002, 0xffffffff, 0xffff0001, 0xffffffff, 0xffff0000,
    0xffffffff, 0xfffeffff, 0xffffffff, 0xfffefffe, 0xffffffff, 0xfffe8001,
    0xffffffff, 0xfffe8000, 0xffffffff, 0xfffe0001, 0xffffffff, 0xfffe0000,
    0xffffffff, 0xfeff0001, 0xffffffff, 0xfeff0000, 0xffffffff, 0xa9ca1d25,
    0xffffffff, 0x48882a0b, 0xfffffffe, 0xffff0001, 0xfffffffe, 0xffff0000,
    0xfffeffff, 0xffff0001, 0xfffeffff, 0xffff0000, 0xffefffff, 0xffff0001,
    0xffefffff, 0xffff0000, 0xa9cb1d24, 0x48882a0b, 0x7fffffff, 0xffff0001,
    0x7fffffff, 0xffff7fff, 0x48892a0a, 0xa9ca9d24, 0x000fffff, 0xffff8000,
    0x000fffff, 0xffff7fff, 0x0000ffff, 0xffff8000, 0x0000ffff, 0xffff7fff,
    0x00000000, 0xffff8000, 0x00000000, 0xffff7fff, 0x00000000, 0x00ff8000,
    0x00000000, 0x00ff7fff, 0x00000000, 0x00008000, 0x00000000, 0x00007fff,
    0x00000000, 0x00000000, 0xffffffff, 0xffffffff, 0xffffffff, 0xffff8001,
    0xffffffff, 0xffff8000, 0xffffffff, 0xffff7fff, 0xffffffff, 0xffff7ffe,
    0xffffffff, 0xffff7ffd, 0xffffffff, 0xffff0000, 0xffffffff, 0xfffeffff,
    0xffffffff, 0xfffe8000, 0xffffffff, 0xfffe7fff, 0xffffffff, 0xfeff8000,
    0xffffffff, 0xfeff7fff, 0xffffffff, 0xa9ca9d24, 0xffffffff, 0x4888aa0a,
    0xfffffffe, 0xffff8000, 0xfffffffe, 0xffff7fff, 0xfffeffff, 0xffff8000,
    0xfffeffff, 0xffff7fff, 0xffefffff, 0xffff8000, 0xffefffff, 0xffff7fff,
    0xa9cb1d24, 0x4888aa0a, 0x7fffffff, 0xffff8000, 0x7fffffff, 0xffff8000,
    0x48892a0a, 0xa9ca9d25, 0x000fffff, 0xffff8001, 0x000fffff, 0xffff8000,
    0x0000ffff, 0xffff8001, 0x0000ffff, 0xffff8000, 0x00000000, 0xffff8001,
    0x00000000, 0xffff8000, 0x00000000, 0x00ff8001, 0x00000000, 0x00ff8000,
    0x00000000, 0x00008001, 0x00000000, 0x00008000, 0x00000000, 0x00000001,
    0x00000000, 0x00000000, 0xffffffff, 0xffff8002, 0xffffffff, 0xffff8001,
    0xffffffff, 0xffff8000, 0xffffffff, 0xffff7fff, 0xffffffff, 0xffff7ffe,
    0xffffffff, 0xffff0001, 0xffffffff, 0xffff0000, 0xffffffff, 0xfffe8001,
    0xffffffff, 0xfffe8000, 0xffffffff, 0xfeff8001, 0xffffffff, 0xfeff8000,
    0xffffffff, 0xa9ca9d25, 0xffffffff, 0x4888aa0b, 0xfffffffe, 0xffff8001,
    0xfffffffe, 0xffff8000, 0xfffeffff, 0xffff8001, 0xfffeffff, 0xffff8000,
    0xffefffff, 0xffff8001, 0xffefffff, 0xffff8000, 0xa9cb1d24, 0x4888aa0b,
    0x7fffffff, 0xffff8001, 0x7fffffff, 0xfffffffe, 0x48892a0a, 0xa9cb1d23,
    0x000fffff, 0xffffffff, 0x000fffff, 0xfffffffe, 0x0000ffff, 0xffffffff,
    0x0000ffff, 0xfffffffe, 0x00000000, 0xffffffff, 0x00000000, 0xfffffffe,
    0x00000000, 0x00ffffff, 0x00000000, 0x00fffffe, 0x00000000, 0x0000ffff,
    0x00000000, 0x0000fffe, 0x00000000, 0x00007fff, 0x00000000, 0x00007ffe,
    0x00000000, 0x00000000, 0xffffffff, 0xffffffff, 0xffffffff, 0xfffffffe,
    0xffffffff, 0xfffffffd, 0xffffffff, 0xfffffffc, 0xffffffff, 0xffff7fff,
    0xffffffff, 0xffff7ffe, 0xffffffff, 0xfffeffff, 0xffffffff, 0xfffefffe,
    0xffffffff, 0xfeffffff, 0xffffffff, 0xfefffffe, 0xffffffff, 0xa9cb1d23,
    0xffffffff, 0x48892a09, 0xfffffffe, 0xffffffff, 0xfffffffe, 0xfffffffe,
    0xfffeffff, 0xffffffff, 0xfffeffff, 0xfffffffe, 0xffefffff, 0xffffffff,
    0xffefffff, 0xfffffffe, 0xa9cb1d24, 0x48892a09, 0x7fffffff, 0xffffffff,
    0x7fffffff, 0xffffffff, 0x48892a0a, 0xa9cb1d24, 0x00100000, 0x00000000,
    0x000fffff, 0xffffffff, 0x00010000, 0x00000000, 0x0000ffff, 0xffffffff,
    0x00000001, 0x00000000, 0x00000000, 0xffffffff, 0x00000000, 0x01000000,
    0x00000000, 0x00ffffff, 0x00000000, 0x00010000, 0x00000000, 0x0000ffff,
    0x00000000, 0x00008000, 0x00000000, 0x00007fff, 0x00000000, 0x00000001,
    0x00000000, 0x00000000, 0xffffffff, 0xffffffff, 0xffffffff, 0xfffffffe,
    0xffffffff, 0xfffffffd, 0xffffffff, 0xffff8000, 0xffffffff, 0xffff7fff,
    0xffffffff, 0xffff0000, 0xffffffff, 0xfffeffff, 0xffffffff, 0xff000000,
    0xffffffff, 0xfeffffff, 0xffffffff, 0xa9cb1d24, 0xffffffff, 0x48892a0a,
    0xffffffff, 0x00000000, 0xfffffffe, 0xffffffff, 0xffff0000, 0x00000000,
    0xfffeffff, 0xffffffff, 0xfff00000, 0x00000000, 0xffefffff, 0xffffffff,
    0xa9cb1d24, 0x48892a0a, 0x80000000, 0x00000000, 0x80000000, 0x00000000,
    0x48892a0a, 0xa9cb1d25, 0x00100000, 0x00000001, 0x00100000, 0x00000000,
    0x00010000, 0x00000001, 0x00010000, 0x00000000, 0x00000001, 0x00000001,
    0x00000001, 0x00000000, 0x00000000, 0x01000001, 0x00000000, 0x01000000,
    0x00000000, 0x00010001, 0x00000000, 0x00010000, 0x00000000, 0x00008001,
    0x00000000, 0x00008000, 0x00000000, 0x00000002, 0x00000000, 0x00000001,
    0x00000000, 0x00000000, 0xffffffff, 0xffffffff, 0xffffffff, 0xfffffffe,
    0xffffffff, 0xffff8001, 0xffffffff, 0xffff8000, 0xffffffff, 0xffff0001,
    0xffffffff, 0xffff0000, 0xffffffff, 0xff000001, 0xffffffff, 0xff000000,
    0xffffffff, 0xa9cb1d25, 0xffffffff, 0x48892a0b, 0xffffffff, 0x00000001,
    0xffffffff, 0x00000000, 0xffff0000, 0x00000001, 0xffff0000, 0x00000000,
    0xfff00000, 0x00000001, 0xfff00000, 0x00000000, 0xa9cb1d24, 0x48892a0b,
    0x80000000, 0x00000001, 0x80000000, 0x00000001, 0x48892a0a, 0xa9cb1d26,
    0x00100000, 0x00000002, 0x00100000, 0x00000001, 0x00010000, 0x00000002,
    0x00010000, 0x00000001, 0x00000001, 0x00000002, 0x00000001, 0x00000001,
    0x00000000, 0x01000002, 0x00000000, 0x01000001, 0x00000000, 0x00010002,
    0x00000000, 0x00010001, 0x00000000, 0x00008002, 0x00000000, 0x00008001,
    0x00000000, 0x00000003, 0x00000000, 0x00000002, 0x00000000, 0x00000001,
    0x00000000, 0x00000000, 0xffffffff, 0xffffffff, 0xffffffff, 0xffff8002,
    0xffffffff, 0xffff8001, 0xffffffff, 0xffff0002, 0xffffffff, 0xffff0001,
    0xffffffff, 0xff000002, 0xffffffff, 0xff000001, 0xffffffff, 0xa9cb1d26,
    0xffffffff, 0x48892a0c, 0xffffffff, 0x00000002, 0xffffffff, 0x00000001,
    0xffff0000, 0x00000002, 0xffff0000, 0x00000001, 0xfff00000, 0x00000002,
    0xfff00000, 0x00000001, 0xa9cb1d24, 0x48892a0c, 0x80000000, 0x00000002,
    0x80000000, 0x00000002, 0x48892a0a, 0xa9cb1d27, 0x00100000, 0x00000003,
    0x00100000, 0x00000002, 0x00010000, 0x00000003, 0x00010000, 0x00000002,
    0x00000001, 0x00000003, 0x00000001, 0x00000002, 0x00000000, 0x01000003,
    0x00000000, 0x01000002, 0x00000000, 0x00010003, 0x00000000, 0x00010002,
    0x00000000, 0x00008003, 0x00000000, 0x00008002, 0x00000000, 0x00000004,
    0x00000000, 0x00000003, 0x00000000, 0x00000002, 0x00000000, 0x00000001,
    0x00000000, 0x00000000, 0xffffffff, 0xffff8003, 0xffffffff, 0xffff8002,
    0xffffffff, 0xffff0003, 0xffffffff, 0xffff0002, 0xffffffff, 0xff000003,
    0xffffffff, 0xff000002, 0xffffffff, 0xa9cb1d27, 0xffffffff, 0x48892a0d,
    0xffffffff, 0x00000003, 0xffffffff, 0x00000002, 0xffff0000, 0x00000003,
    0xffff0000, 0x00000002, 0xfff00000, 0x00000003, 0xfff00000, 0x00000002,
    0xa9cb1d24, 0x48892a0d, 0x80000000, 0x00000003, 0x80000000, 0x00007fff,
    0x48892a0a, 0xa9cb9d24, 0x00100000, 0x00008000, 0x00100000, 0x00007fff,
    0x00010000, 0x00008000, 0x00010000, 0x00007fff, 0x00000001, 0x00008000,
    0x00000001, 0x00007fff, 0x00000000, 0x01008000, 0x00000000, 0x01007fff,
    0x00000000, 0x00018000, 0x00000000, 0x00017fff, 0x00000000, 0x00010000,
    0x00000000, 0x0000ffff, 0x00000000, 0x00008001, 0x00000000, 0x00008000,
    0x00000000, 0x00007fff, 0x00000000, 0x00007ffe, 0x00000000, 0x00007ffd,
    0x00000000, 0x00000000, 0xffffffff, 0xffffffff, 0xffffffff, 0xffff8000,
    0xffffffff, 0xffff7fff, 0xffffffff, 0xff008000, 0xffffffff, 0xff007fff,
    0xffffffff, 0xa9cb9d24, 0xffffffff, 0x4889aa0a, 0xffffffff, 0x00008000,
    0xffffffff, 0x00007fff, 0xffff0000, 0x00008000, 0xffff0000, 0x00007fff,
    0xfff00000, 0x00008000, 0xfff00000, 0x00007fff, 0xa9cb1d24, 0x4889aa0a,
    0x80000000, 0x00008000, 0x80000000, 0x00008000, 0x48892a0a, 0xa9cb9d25,
    0x00100000, 0x00008001, 0x00100000, 0x00008000, 0x00010000, 0x00008001,
    0x00010000, 0x00008000, 0x00000001, 0x00008001, 0x00000001, 0x00008000,
    0x00000000, 0x01008001, 0x00000000, 0x01008000, 0x00000000, 0x00018001,
    0x00000000, 0x00018000, 0x00000000, 0x00010001, 0x00000000, 0x00010000,
    0x00000000, 0x00008002, 0x00000000, 0x00008001, 0x00000000, 0x00008000,
    0x00000000, 0x00007fff, 0x00000000, 0x00007ffe, 0x00000000, 0x00000001,
    0x00000000, 0x00000000, 0xffffffff, 0xffff8001, 0xffffffff, 0xffff8000,
    0xffffffff, 0xff008001, 0xffffffff, 0xff008000, 0xffffffff, 0xa9cb9d25,
    0xffffffff, 0x4889aa0b, 0xffffffff, 0x00008001, 0xffffffff, 0x00008000,
    0xffff0000, 0x00008001, 0xffff0000, 0x00008000, 0xfff00000, 0x00008001,
    0xfff00000, 0x00008000, 0xa9cb1d24, 0x4889aa0b, 0x80000000, 0x00008001,
    0x80000000, 0x0000ffff, 0x48892a0a, 0xa9cc1d24, 0x00100000, 0x00010000,
    0x00100000, 0x0000ffff, 0x00010000, 0x00010000, 0x00010000, 0x0000ffff,
    0x00000001, 0x00010000, 0x00000001, 0x0000ffff, 0x00000000, 0x01010000,
    0x00000000, 0x0100ffff, 0x00000000, 0x00020000, 0x00000000, 0x0001ffff,
    0x00000000, 0x00018000, 0x00000000, 0x00017fff, 0x00000000, 0x00010001,
    0x00000000, 0x00010000, 0x00000000, 0x0000ffff, 0x00000000, 0x0000fffe,
    0x00000000, 0x0000fffd, 0x00000000, 0x00008000, 0x00000000, 0x00007fff,
    0x00000000, 0x00000000, 0xffffffff, 0xffffffff, 0xffffffff, 0xff010000,
    0xffffffff, 0xff00ffff, 0xffffffff, 0xa9cc1d24, 0xffffffff, 0x488a2a0a,
    0xffffffff, 0x00010000, 0xffffffff, 0x0000ffff, 0xffff0000, 0x00010000,
    0xffff0000, 0x0000ffff, 0xfff00000, 0x00010000, 0xfff00000, 0x0000ffff,
    0xa9cb1d24, 0x488a2a0a, 0x80000000, 0x00010000, 0x80000000, 0x00010000,
    0x48892a0a, 0xa9cc1d25, 0x00100000, 0x00010001, 0x00100000, 0x00010000,
    0x00010000, 0x00010001, 0x00010000, 0x00010000, 0x00000001, 0x00010001,
    0x00000001, 0x00010000, 0x00000000, 0x01010001, 0x00000000, 0x01010000,
    0x00000000, 0x00020001, 0x00000000, 0x00020000, 0x00000000, 0x00018001,
    0x00000000, 0x00018000, 0x00000000, 0x00010002, 0x00000000, 0x00010001,
    0x00000000, 0x00010000, 0x00000000, 0x0000ffff, 0x00000000, 0x0000fffe,
    0x00000000, 0x00008001, 0x00000000, 0x00008000, 0x00000000, 0x00000001,
    0x00000000, 0x00000000, 0xffffffff, 0xff010001, 0xffffffff, 0xff010000,
    0xffffffff, 0xa9cc1d25, 0xffffffff, 0x488a2a0b, 0xffffffff, 0x00010001,
    0xffffffff, 0x00010000, 0xffff0000, 0x00010001, 0xffff0000, 0x00010000,
    0xfff00000, 0x00010001, 0xfff00000, 0x00010000, 0xa9cb1d24, 0x488a2a0b,
    0x80000000, 0x00010001, 0x80000000, 0x00ffffff, 0x48892a0a, 0xaacb1d24,
    0x00100000, 0x01000000, 0x00100000, 0x00ffffff, 0x00010000, 0x01000000,
    0x00010000, 0x00ffffff, 0x00000001, 0x01000000, 0x00000001, 0x00ffffff,
    0x00000000, 0x02000000, 0x00000000, 0x01ffffff, 0x00000000, 0x01010000,
    0x00000000, 0x0100ffff, 0x00000000, 0x01008000, 0x00000000, 0x01007fff,
    0x00000000, 0x01000001, 0x00000000, 0x01000000, 0x00000000, 0x00ffffff,
    0x00000000, 0x00fffffe, 0x00000000, 0x00fffffd, 0x00000000, 0x00ff8000,
    0x00000000, 0x00ff7fff, 0x00000000, 0x00ff0000, 0x00000000, 0x00feffff,
    0x00000000, 0x00000000, 0xffffffff, 0xffffffff, 0xffffffff, 0xaacb1d24,
    0xffffffff, 0x49892a0a, 0xffffffff, 0x01000000, 0xffffffff, 0x00ffffff,
    0xffff0000, 0x01000000, 0xffff0000, 0x00ffffff, 0xfff00000, 0x01000000,
    0xfff00000, 0x00ffffff, 0xa9cb1d24, 0x49892a0a, 0x80000000, 0x01000000,
    0x80000000, 0x01000000, 0x48892a0a, 0xaacb1d25, 0x00100000, 0x01000001,
    0x00100000, 0x01000000, 0x00010000, 0x01000001, 0x00010000, 0x01000000,
    0x00000001, 0x01000001, 0x00000001, 0x01000000, 0x00000000, 0x02000001,
    0x00000000, 0x02000000, 0x00000000, 0x01010001, 0x00000000, 0x01010000,
    0x00000000, 0x01008001, 0x00000000, 0x01008000, 0x00000000, 0x01000002,
    0x00000000, 0x01000001, 0x00000000, 0x01000000, 0x00000000, 0x00ffffff,
    0x00000000, 0x00fffffe, 0x00000000, 0x00ff8001, 0x00000000, 0x00ff8000,
    0x00000000, 0x00ff0001, 0x00000000, 0x00ff0000, 0x00000000, 0x00000001,
    0x00000000, 0x00000000, 0xffffffff, 0xaacb1d25, 0xffffffff, 0x49892a0b,
    0xffffffff, 0x01000001, 0xffffffff, 0x01000000, 0xffff0000, 0x01000001,
    0xffff0000, 0x01000000, 0xfff00000, 0x01000001, 0xfff00000, 0x01000000,
    0xa9cb1d24, 0x49892a0b, 0x80000000, 0x01000001, 0x80000000, 0x5634e2db,
    0x48892a0b, 0x00000000, 0x00100000, 0x5634e2dc, 0x00100000, 0x5634e2db,
    0x00010000, 0x5634e2dc, 0x00010000, 0x5634e2db, 0x00000001, 0x5634e2dc,
    0x00000001, 0x5634e2db, 0x00000000, 0x5734e2dc, 0x00000000, 0x5734e2db,
    0x00000000, 0x5635e2dc, 0x00000000, 0x5635e2db, 0x00000000, 0x563562dc,
    0x00000000, 0x563562db, 0x00000000, 0x5634e2dd, 0x00000000, 0x5634e2dc,
    0x00000000, 0x5634e2db, 0x00000000, 0x5634e2da, 0x00000000, 0x5634e2d9,
    0x00000000, 0x563462dc, 0x00000000, 0x563462db, 0x00000000, 0x5633e2dc,
    0x00000000, 0x5633e2db, 0x00000000, 0x5534e2dc, 0x00000000, 0x5534e2db,
    0x00000000, 0x00000000, 0xffffffff, 0x9ebe0ce6, 0xffffffff, 0x5634e2dc,
    0xffffffff, 0x5634e2db, 0xffff0000, 0x5634e2dc, 0xffff0000, 0x5634e2db,
    0xfff00000, 0x5634e2dc, 0xfff00000, 0x5634e2db, 0xa9cb1d24, 0x9ebe0ce6,
    0x80000000, 0x5634e2dc, 0x80000000, 0xb776d5f5, 0x48892a0b, 0x6141f31a,
    0x00100000, 0xb776d5f6, 0x00100000, 0xb776d5f5, 0x00010000, 0xb776d5f6,
    0x00010000, 0xb776d5f5, 0x00000001, 0xb776d5f6, 0x00000001, 0xb776d5f5,
    0x00000000, 0xb876d5f6, 0x00000000, 0xb876d5f5, 0x00000000, 0xb777d5f6,
    0x00000000, 0xb777d5f5, 0x00000000, 0xb77755f6, 0x00000000, 0xb77755f5,
    0x00000000, 0xb776d5f7, 0x00000000, 0xb776d5f6, 0x00000000, 0xb776d5f5,
    0x00000000, 0xb776d5f4, 0x00000000, 0xb776d5f3, 0x00000000, 0xb77655f6,
    0x00000000, 0xb77655f5, 0x00000000, 0xb775d5f6, 0x00000000, 0xb775d5f5,
    0x00000000, 0xb676d5f6, 0x00000000, 0xb676d5f5, 0x00000000, 0x6141f31a,
    0x00000000, 0x00000000, 0xffffffff, 0xb776d5f6, 0xffffffff, 0xb776d5f5,
    0xffff0000, 0xb776d5f6, 0xffff0000, 0xb776d5f5, 0xfff00000, 0xb776d5f6,
    0xfff00000, 0xb776d5f5, 0xa9cb1d25, 0x00000000, 0x80000000, 0xb776d5f6,
    0x80000000, 0xffffffff, 0x48892a0b, 0xa9cb1d24, 0x00100001, 0x00000000,
    0x00100000, 0xffffffff, 0x00010001, 0x00000000, 0x00010000, 0xffffffff,
    0x00000002, 0x00000000, 0x00000001, 0xffffffff, 0x00000001, 0x01000000,
    0x00000001, 0x00ffffff, 0x00000001, 0x00010000, 0x00000001, 0x0000ffff,
    0x00000001, 0x00008000, 0x00000001, 0x00007fff, 0x00000001, 0x00000001,
    0x00000001, 0x00000000, 0x00000000, 0xffffffff, 0x00000000, 0xfffffffe,
    0x00000000, 0xfffffffd, 0x00000000, 0xffff8000, 0x00000000, 0xffff7fff,
    0x00000000, 0xffff0000, 0x00000000, 0xfffeffff, 0x00000000, 0xff000000,
    0x00000000, 0xfeffffff, 0x00000000, 0xa9cb1d24, 0x00000000, 0x48892a0a,
    0x00000000, 0x00000000, 0xffffffff, 0xffffffff, 0xffff0001, 0x00000000,
    0xffff0000, 0xffffffff, 0xfff00001, 0x00000000, 0xfff00000, 0xffffffff,
    0xa9cb1d25, 0x48892a0a, 0x80000001, 0x00000000, 0x80000001, 0x00000000,
    0x48892a0b, 0xa9cb1d25, 0x00100001, 0x00000001, 0x00100001, 0x00000000,
    0x00010001, 0x00000001, 0x00010001, 0x00000000, 0x00000002, 0x00000001,
    0x00000002, 0x00000000, 0x00000001, 0x01000001, 0x00000001, 0x01000000,
    0x00000001, 0x00010001, 0x00000001, 0x00010000, 0x00000001, 0x00008001,
    0x00000001, 0x00008000, 0x00000001, 0x00000002, 0x00000001, 0x00000001,
    0x00000001, 0x00000000, 0x00000000, 0xffffffff, 0x00000000, 0xfffffffe,
    0x00000000, 0xffff8001, 0x00000000, 0xffff8000, 0x00000000, 0xffff0001,
    0x00000000, 0xffff0000, 0x00000000, 0xff000001, 0x00000000, 0xff000000,
    0x00000000, 0xa9cb1d25, 0x00000000, 0x48892a0b, 0x00000000, 0x00000001,
    0x00000000, 0x00000000, 0xffff0001, 0x00000001, 0xffff0001, 0x00000000,
    0xfff00001, 0x00000001, 0xfff00001, 0x00000000, 0xa9cb1d25, 0x48892a0b,
    0x80000001, 0x00000001, 0x8000ffff, 0xffffffff, 0x488a2a0a, 0xa9cb1d24,
    0x00110000, 0x00000000, 0x0010ffff, 0xffffffff, 0x00020000, 0x00000000,
    0x0001ffff, 0xffffffff, 0x00010001, 0x00000000, 0x00010000, 0xffffffff,
    0x00010000, 0x01000000, 0x00010000, 0x00ffffff, 0x00010000, 0x00010000,
    0x00010000, 0x0000ffff, 0x00010000, 0x00008000, 0x00010000, 0x00007fff,
    0x00010000, 0x00000001, 0x00010000, 0x00000000, 0x0000ffff, 0xffffffff,
    0x0000ffff, 0xfffffffe, 0x0000ffff, 0xfffffffd, 0x0000ffff, 0xffff8000,
    0x0000ffff, 0xffff7fff, 0x0000ffff, 0xffff0000, 0x0000ffff, 0xfffeffff,
    0x0000ffff, 0xff000000, 0x0000ffff, 0xfeffffff, 0x0000ffff, 0xa9cb1d24,
    0x0000ffff, 0x48892a0a, 0x0000ffff, 0x00000000, 0x0000fffe, 0xffffffff,
    0x00000000, 0x00000000, 0xffffffff, 0xffffffff, 0xfff10000, 0x00000000,
    0xfff0ffff, 0xffffffff, 0xa9cc1d24, 0x48892a0a, 0x80010000, 0x00000000,
    0x80010000, 0x00000000, 0x488a2a0a, 0xa9cb1d25, 0x00110000, 0x00000001,
    0x00110000, 0x00000000, 0x00020000, 0x00000001, 0x00020000, 0x00000000,
    0x00010001, 0x00000001, 0x00010001, 0x00000000, 0x00010000, 0x01000001,
    0x00010000, 0x01000000, 0x00010000, 0x00010001, 0x00010000, 0x00010000,
    0x00010000, 0x00008001, 0x00010000, 0x00008000, 0x00010000, 0x00000002,
    0x00010000, 0x00000001, 0x00010000, 0x00000000, 0x0000ffff, 0xffffffff,
    0x0000ffff, 0xfffffffe, 0x0000ffff, 0xffff8001, 0x0000ffff, 0xffff8000,
    0x0000ffff, 0xffff0001, 0x0000ffff, 0xffff0000, 0x0000ffff, 0xff000001,
    0x0000ffff, 0xff000000, 0x0000ffff, 0xa9cb1d25, 0x0000ffff, 0x48892a0b,
    0x0000ffff, 0x00000001, 0x0000ffff, 0x00000000, 0x00000000, 0x00000001,
    0x00000000, 0x00000000, 0xfff10000, 0x00000001, 0xfff10000, 0x00000000,
    0xa9cc1d24, 0x48892a0b, 0x80010000, 0x00000001, 0x800fffff, 0xffffffff,
    0x48992a0a, 0xa9cb1d24, 0x00200000, 0x00000000, 0x001fffff, 0xffffffff,
    0x00110000, 0x00000000, 0x0010ffff, 0xffffffff, 0x00100001, 0x00000000,
    0x00100000, 0xffffffff, 0x00100000, 0x01000000, 0x00100000, 0x00ffffff,
    0x00100000, 0x00010000, 0x00100000, 0x0000ffff, 0x00100000, 0x00008000,
    0x00100000, 0x00007fff, 0x00100000, 0x00000001, 0x00100000, 0x00000000,
    0x000fffff, 0xffffffff, 0x000fffff, 0xfffffffe, 0x000fffff, 0xfffffffd,
    0x000fffff, 0xffff8000, 0x000fffff, 0xffff7fff, 0x000fffff, 0xffff0000,
    0x000fffff, 0xfffeffff, 0x000fffff, 0xff000000, 0x000fffff, 0xfeffffff,
    0x000fffff, 0xa9cb1d24, 0x000fffff, 0x48892a0a, 0x000fffff, 0x00000000,
    0x000ffffe, 0xffffffff, 0x000f0000, 0x00000000, 0x000effff, 0xffffffff,
    0x00000000, 0x00000000, 0xffffffff, 0xffffffff, 0xa9db1d24, 0x48892a0a,
    0x80100000, 0x00000000, 0x80100000, 0x00000000, 0x48992a0a, 0xa9cb1d25,
    0x00200000, 0x00000001, 0x00200000, 0x00000000, 0x00110000, 0x00000001,
    0x00110000, 0x00000000, 0x00100001, 0x00000001, 0x00100001, 0x00000000,
    0x00100000, 0x01000001, 0x00100000, 0x01000000, 0x00100000, 0x00010001,
    0x00100000, 0x00010000, 0x00100000, 0x00008001, 0x00100000, 0x00008000,
    0x00100000, 0x00000002, 0x00100000, 0x00000001, 0x00100000, 0x00000000,
    0x000fffff, 0xffffffff, 0x000fffff, 0xfffffffe, 0x000fffff, 0xffff8001,
    0x000fffff, 0xffff8000, 0x000fffff, 0xffff0001, 0x000fffff, 0xffff0000,
    0x000fffff, 0xff000001, 0x000fffff, 0xff000000, 0x000fffff, 0xa9cb1d25,
    0x000fffff, 0x48892a0b, 0x000fffff, 0x00000001, 0x000fffff, 0x00000000,
    0x000f0000, 0x00000001, 0x000f0000, 0x00000000, 0x00000000, 0x00000001,
    0x00000000, 0x00000000, 0xa9db1d24, 0x48892a0b, 0x80100000, 0x00000001,
    0xd634e2db, 0xb776d5f5, 0x9ebe0ce6, 0x6141f31a, 0x5644e2db, 0xb776d5f6,
    0x5644e2db, 0xb776d5f5, 0x5635e2db, 0xb776d5f6, 0x5635e2db, 0xb776d5f5,
    0x5634e2dc, 0xb776d5f6, 0x5634e2dc, 0xb776d5f5, 0x5634e2db, 0xb876d5f6,
    0x5634e2db, 0xb876d5f5, 0x5634e2db, 0xb777d5f6, 0x5634e2db, 0xb777d5f5,
    0x5634e2db, 0xb77755f6, 0x5634e2db, 0xb77755f5, 0x5634e2db, 0xb776d5f7,
    0x5634e2db, 0xb776d5f6, 0x5634e2db, 0xb776d5f5, 0x5634e2db, 0xb776d5f4,
    0x5634e2db, 0xb776d5f3, 0x5634e2db, 0xb77655f6, 0x5634e2db, 0xb77655f5,
    0x5634e2db, 0xb775d5f6, 0x5634e2db, 0xb775d5f5, 0x5634e2db, 0xb676d5f6,
    0x5634e2db, 0xb676d5f5, 0x5634e2db, 0x6141f31a, 0x5634e2db, 0x00000000,
    0x5634e2da, 0xb776d5f6, 0x5634e2da, 0xb776d5f5, 0x5633e2db, 0xb776d5f6,
    0x5633e2db, 0xb776d5f5, 0x5624e2db, 0xb776d5f6, 0x5624e2db, 0xb776d5f5,
    0x00000000, 0x00000000, 0xd634e2db, 0xb776d5f6, 0xffffffff, 0xffffffff,
    0xc8892a0a, 0xa9cb1d24, 0x80100000, 0x00000000, 0x800fffff, 0xffffffff,
    0x80010000, 0x00000000, 0x8000ffff, 0xffffffff, 0x80000001, 0x00000000,
    0x80000000, 0xffffffff, 0x80000000, 0x01000000, 0x80000000, 0x00ffffff,
    0x80000000, 0x00010000, 0x80000000, 0x0000ffff, 0x80000000, 0x00008000,
    0x80000000, 0x00007fff, 0x80000000, 0x00000001, 0x80000000, 0x00000000,
    0x7fffffff, 0xffffffff, 0x7fffffff, 0xfffffffe, 0x7fffffff, 0xfffffffd,
    0x7fffffff, 0xffff8000, 0x7fffffff, 0xffff7fff, 0x7fffffff, 0xffff0000,
    0x7fffffff, 0xfffeffff, 0x7fffffff, 0xff000000, 0x7fffffff, 0xfeffffff,
    0x7fffffff, 0xa9cb1d24, 0x7fffffff, 0x48892a0a, 0x7fffffff, 0x00000000,
    0x7ffffffe, 0xffffffff, 0x7fff0000, 0x00000000, 0x7ffeffff, 0xffffffff,
    0x7ff00000, 0x00000000, 0x7fefffff, 0xffffffff, 0x29cb1d24, 0x48892a0a,
    0x00000000, 0x00000000
]);
var TEST_MUL_BITS = i32array([
    0x80000000, 0x00000000, 0x80000000, 0x00000000, 0x1ad92a0a, 0xa9cb1d25,
    0x00000000, 0x00000000, 0xd2500000, 0x00000000, 0x00100000, 0x00000000,
    0x80000000, 0x00000000, 0x65ae2a0a, 0xa9cb1d25, 0x00110000, 0x00000001,
    0x00100000, 0x00000000, 0x00000000, 0x00000000, 0x1d250000, 0x00000000,
    0x00010000, 0x00000000, 0x00000000, 0x00000000, 0x00010000, 0x00000000,
    0x80000000, 0x00000000, 0xf254472f, 0xa9cb1d25, 0x00100001, 0x00000001,
    0x00100000, 0x00000000, 0x00010001, 0x00000001, 0x00010000, 0x00000000,
    0x00000000, 0x00000000, 0xa9cb1d25, 0x00000000, 0x00000001, 0x00000000,
    0x00000000, 0x00000000, 0x00000001, 0x00000000, 0x00000000, 0x00000000,
    0x00000001, 0x00000000, 0x80000000, 0x00000000, 0x5332f527, 0xcecb1d25,
    0x00100000, 0x01000001, 0x00100000, 0x00000000, 0x00010000, 0x01000001,
    0x00010000, 0x00000000, 0x01000001, 0x01000001, 0x01000001, 0x00000000,
    0x00000000, 0x00000000, 0x0aa9cb1d, 0x25000000, 0x00000000, 0x01000000,
    0x00000000, 0x00000000, 0x00000000, 0x01000000, 0x00000000, 0x00000000,
    0x01000000, 0x01000000, 0x01000000, 0x00000000, 0x00010000, 0x01000000,
    0x80000000, 0x00000000, 0x7293d3d5, 0xc6f01d25, 0x00100000, 0x00010001,
    0x00100000, 0x00000000, 0x00010000, 0x00010001, 0x00010000, 0x00000000,
    0x00010001, 0x00010001, 0x00010001, 0x00000000, 0x00000100, 0x01010001,
    0x00000100, 0x01000000, 0x00000000, 0x00000000, 0x2a0aa9cb, 0x1d250000,
    0x00000000, 0x00010000, 0x00000000, 0x00000000, 0x00000000, 0x00010000,
    0x00000000, 0x00000000, 0x00010000, 0x00010000, 0x00010000, 0x00000000,
    0x00000100, 0x00010000, 0x00000100, 0x00000000, 0x00000001, 0x00010000,
    0x80000000, 0x00000000, 0xdd8e7ef0, 0x385d9d25, 0x00100000, 0x00008001,
    0x00100000, 0x00000000, 0x80010000, 0x00008001, 0x80010000, 0x00000000,
    0x00008001, 0x00008001, 0x00008001, 0x00000000, 0x00000080, 0x01008001,
    0x00000080, 0x01000000, 0x00000000, 0x80018001, 0x00000000, 0x80010000,
    0x00000000, 0x00000000, 0x950554e5, 0x8e928000, 0x00000000, 0x00008000,
    0x00000000, 0x00000000, 0x80000000, 0x00008000, 0x80000000, 0x00000000,
    0x00008000, 0x00008000, 0x00008000, 0x00000000, 0x00000080, 0x00008000,
    0x00000080, 0x00000000, 0x00000000, 0x80008000, 0x00000000, 0x80000000,
    0x00000000, 0x40008000, 0x00000000, 0x00000000, 0x91125415, 0x53963a4a,
    0x00200000, 0x00000002, 0x00200000, 0x00000000, 0x00020000, 0x00000002,
    0x00020000, 0x00000000, 0x00000002, 0x00000002, 0x00000002, 0x00000000,
    0x00000000, 0x02000002, 0x00000000, 0x02000000, 0x00000000, 0x00020002,
    0x00000000, 0x00020000, 0x00000000, 0x00010002, 0x00000000, 0x00010000,
    0x80000000, 0x00000000, 0x48892a0a, 0xa9cb1d25, 0x00100000, 0x00000001,
    0x00100000, 0x00000000, 0x00010000, 0x00000001, 0x00010000, 0x00000000,
    0x00000001, 0x00000001, 0x00000001, 0x00000000, 0x00000000, 0x01000001,
    0x00000000, 0x01000000, 0x00000000, 0x00010001, 0x00000000, 0x00010000,
    0x00000000, 0x00008001, 0x00000000, 0x00008000, 0x00000000, 0x00000002,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x80000000, 0x00000000, 0xb776d5f5, 0x5634e2db,
    0xffefffff, 0xffffffff, 0xfff00000, 0x00000000, 0xfffeffff, 0xffffffff,
    0xffff0000, 0x00000000, 0xfffffffe, 0xffffffff, 0xffffffff, 0x00000000,
    0xffffffff, 0xfeffffff, 0xffffffff, 0xff000000, 0xffffffff, 0xfffeffff,
    0xffffffff, 0xffff0000, 0xffffffff, 0xffff7fff, 0xffffffff, 0xffff8000,
    0xffffffff, 0xfffffffe, 0xffffffff, 0xffffffff, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x6eedabea, 0xac69c5b6, 0xffdfffff, 0xfffffffe,
    0xffe00000, 0x00000000, 0xfffdffff, 0xfffffffe, 0xfffe0000, 0x00000000,
    0xfffffffd, 0xfffffffe, 0xfffffffe, 0x00000000, 0xffffffff, 0xfdfffffe,
    0xffffffff, 0xfe000000, 0xffffffff, 0xfffdfffe, 0xffffffff, 0xfffe0000,
    0xffffffff, 0xfffefffe, 0xffffffff, 0xffff0000, 0xffffffff, 0xfffffffc,
    0xffffffff, 0xfffffffe, 0x00000000, 0x00000000, 0x00000000, 0x00000002,
    0x80000000, 0x00000000, 0xb383d525, 0x1b389d25, 0x000fffff, 0xffff8001,
    0x00100000, 0x00000000, 0x8000ffff, 0xffff8001, 0x80010000, 0x00000000,
    0xffff8000, 0xffff8001, 0xffff8001, 0x00000000, 0xffffff80, 0x00ff8001,
    0xffffff80, 0x01000000, 0xffffffff, 0x80008001, 0xffffffff, 0x80010000,
    0xffffffff, 0xc0000001, 0xffffffff, 0xc0008000, 0xffffffff, 0xffff0002,
    0xffffffff, 0xffff8001, 0x00000000, 0x00000000, 0x00000000, 0x00007fff,
    0x00000000, 0x0000fffe, 0x00000000, 0x00000000, 0x6afaab1a, 0x716d8000,
    0xffffffff, 0xffff8000, 0x00000000, 0x00000000, 0x7fffffff, 0xffff8000,
    0x80000000, 0x00000000, 0xffff7fff, 0xffff8000, 0xffff8000, 0x00000000,
    0xffffff7f, 0xffff8000, 0xffffff80, 0x00000000, 0xffffffff, 0x7fff8000,
    0xffffffff, 0x80000000, 0xffffffff, 0xbfff8000, 0xffffffff, 0xc0000000,
    0xffffffff, 0xffff0000, 0xffffffff, 0xffff8000, 0x00000000, 0x00000000,
    0x00000000, 0x00008000, 0x00000000, 0x00010000, 0x00000000, 0x3fff8000,
    0x80000000, 0x00000000, 0x1e7e803f, 0x8ca61d25, 0x000fffff, 0xffff0001,
    0x00100000, 0x00000000, 0x0000ffff, 0xffff0001, 0x00010000, 0x00000000,
    0xffff0000, 0xffff0001, 0xffff0001, 0x00000000, 0xffffff00, 0x00ff0001,
    0xffffff00, 0x01000000, 0xffffffff, 0x00000001, 0xffffffff, 0x00010000,
    0xffffffff, 0x7fff8001, 0xffffffff, 0x80008000, 0xffffffff, 0xfffe0002,
    0xffffffff, 0xffff0001, 0x00000000, 0x00000000, 0x00000000, 0x0000ffff,
    0x00000000, 0x0001fffe, 0x00000000, 0x7ffe8001, 0x00000000, 0x7fff8000,
    0x00000000, 0x00000000, 0xd5f55634, 0xe2db0000, 0xffffffff, 0xffff0000,
    0x00000000, 0x00000000, 0xffffffff, 0xffff0000, 0x00000000, 0x00000000,
    0xfffeffff, 0xffff0000, 0xffff0000, 0x00000000, 0xfffffeff, 0xffff0000,
    0xffffff00, 0x00000000, 0xfffffffe, 0xffff0000, 0xffffffff, 0x00000000,
    0xffffffff, 0x7fff0000, 0xffffffff, 0x80000000, 0xffffffff, 0xfffe0000,
    0xffffffff, 0xffff0000, 0x00000000, 0x00000000, 0x00000000, 0x00010000,
    0x00000000, 0x00020000, 0x00000000, 0x7fff0000, 0x00000000, 0x80000000,
    0x00000000, 0xffff0000, 0x80000000, 0x00000000, 0x3ddf5eed, 0x84cb1d25,
    0x000fffff, 0xff000001, 0x00100000, 0x00000000, 0x0000ffff, 0xff000001,
    0x00010000, 0x00000000, 0xff000000, 0xff000001, 0xff000001, 0x00000000,
    0xffff0000, 0x00000001, 0xffff0000, 0x01000000, 0xfffffeff, 0xff010001,
    0xffffff00, 0x00010000, 0xffffff7f, 0xff008001, 0xffffff80, 0x00008000,
    0xffffffff, 0xfe000002, 0xffffffff, 0xff000001, 0x00000000, 0x00000000,
    0x00000000, 0x00ffffff, 0x00000000, 0x01fffffe, 0x0000007f, 0xfeff8001,
    0x0000007f, 0xffff8000, 0x000000ff, 0xfeff0001, 0x000000ff, 0xffff0000,
    0x00000000, 0x00000000, 0xf55634e2, 0xdb000000, 0xffffffff, 0xff000000,
    0x00000000, 0x00000000, 0xffffffff, 0xff000000, 0x00000000, 0x00000000,
    0xfeffffff, 0xff000000, 0xff000000, 0x00000000, 0xfffeffff, 0xff000000,
    0xffff0000, 0x00000000, 0xfffffeff, 0xff000000, 0xffffff00, 0x00000000,
    0xffffff7f, 0xff000000, 0xffffff80, 0x00000000, 0xffffffff, 0xfe000000,
    0xffffffff, 0xff000000, 0x00000000, 0x00000000, 0x00000000, 0x01000000,
    0x00000000, 0x02000000, 0x0000007f, 0xff000000, 0x00000080, 0x00000000,
    0x000000ff, 0xff000000, 0x00000100, 0x00000000, 0x0000ffff, 0xff000000,
    0x80000000, 0x00000000, 0xbc56e5ef, 0x15ff6759, 0xd24fffff, 0xa9cb1d25,
    0xd2500000, 0x00000000, 0x1d24ffff, 0xa9cb1d25, 0x1d250000, 0x00000000,
    0xa9cb1d24, 0xa9cb1d25, 0xa9cb1d25, 0x00000000, 0xffa9cb1c, 0xcecb1d25,
    0xffa9cb1d, 0x25000000, 0xffffa9ca, 0xc6f01d25, 0xffffa9cb, 0x1d250000,
    0xffffd4e5, 0x385d9d25, 0xffffd4e5, 0x8e928000, 0xffffffff, 0x53963a4a,
    0xffffffff, 0xa9cb1d25, 0x00000000, 0x00000000, 0x00000000, 0x5634e2db,
    0x00000000, 0xac69c5b6, 0x00002b1a, 0x1b389d25, 0x00002b1a, 0x716d8000,
    0x00005634, 0x8ca61d25, 0x00005634, 0xe2db0000, 0x005634e2, 0x84cb1d25,
    0x005634e2, 0xdb000000, 0x80000000, 0x00000000, 0x74756f10, 0x9f4f5297,
    0xa0afffff, 0x48892a0b, 0xa0b00000, 0x00000000, 0x2a0affff, 0x48892a0b,
    0x2a0b0000, 0x00000000, 0x48892a0a, 0x48892a0b, 0x48892a0b, 0x00000000,
    0xff488929, 0x53892a0b, 0xff48892a, 0x0b000000, 0xffff4888, 0x72942a0b,
    0xffff4889, 0x2a0b0000, 0xffffa443, 0xdd8eaa0b, 0xffffa444, 0x95058000,
    0xfffffffe, 0x91125416, 0xffffffff, 0x48892a0b, 0x00000000, 0x00000000,
    0x00000000, 0xb776d5f5, 0x00000001, 0x6eedabea, 0x00005bba, 0xb383aa0b,
    0x00005bbb, 0x6afa8000, 0x0000b776, 0x1e7e2a0b, 0x0000b776, 0xd5f50000,
    0x00b776d5, 0x3d892a0b, 0x00b776d5, 0xf5000000, 0x3dc7d297, 0x9f4f5297,
    0x80000000, 0x00000000, 0x9ebe0ce5, 0xa9cb1d25, 0x000fffff, 0x00000001,
    0x00100000, 0x00000000, 0x0000ffff, 0x00000001, 0x00010000, 0x00000000,
    0x00000000, 0x00000001, 0x00000001, 0x00000000, 0xfeffffff, 0x01000001,
    0xff000000, 0x01000000, 0xfffeffff, 0x00010001, 0xffff0000, 0x00010000,
    0xffff7fff, 0x00008001, 0xffff8000, 0x00008000, 0xfffffffe, 0x00000002,
    0xffffffff, 0x00000001, 0x00000000, 0x00000000, 0x00000000, 0xffffffff,
    0x00000001, 0xfffffffe, 0x00007ffe, 0xffff8001, 0x00007fff, 0xffff8000,
    0x0000fffe, 0xffff0001, 0x0000ffff, 0xffff0000, 0x00fffffe, 0xff000001,
    0x00ffffff, 0xff000000, 0x5634e2da, 0xa9cb1d25, 0xb776d5f4, 0x48892a0b,
    0x00000000, 0x00000000, 0x5634e2db, 0x00000000, 0xffffffff, 0x00000000,
    0x00000000, 0x00000000, 0xffffffff, 0x00000000, 0x00000000, 0x00000000,
    0xffffffff, 0x00000000, 0x00000000, 0x00000000, 0xfeffffff, 0x00000000,
    0xff000000, 0x00000000, 0xfffeffff, 0x00000000, 0xffff0000, 0x00000000,
    0xffff7fff, 0x00000000, 0xffff8000, 0x00000000, 0xfffffffe, 0x00000000,
    0xffffffff, 0x00000000, 0x00000000, 0x00000000, 0x00000001, 0x00000000,
    0x00000002, 0x00000000, 0x00007fff, 0x00000000, 0x00008000, 0x00000000,
    0x0000ffff, 0x00000000, 0x00010000, 0x00000000, 0x00ffffff, 0x00000000,
    0x01000000, 0x00000000, 0x5634e2db, 0x00000000, 0xb776d5f5, 0x00000000,
    0xffffffff, 0x00000000, 0x80000000, 0x00000000, 0x2b642a0a, 0xa9cb1d25,
    0x000f0000, 0x00000001, 0x00100000, 0x00000000, 0x00000000, 0x00000001,
    0x00010000, 0x00000000, 0xffff0001, 0x00000001, 0x00000001, 0x00000000,
    0xffff0000, 0x01000001, 0x00000000, 0x01000000, 0xffff0000, 0x00010001,
    0x00000000, 0x00010000, 0x7fff0000, 0x00008001, 0x80000000, 0x00008000,
    0xfffe0000, 0x00000002, 0xffff0000, 0x00000001, 0x00000000, 0x00000000,
    0x0000ffff, 0xffffffff, 0x0001ffff, 0xfffffffe, 0x7ffeffff, 0xffff8001,
    0x7fffffff, 0xffff8000, 0xfffeffff, 0xffff0001, 0xffffffff, 0xffff0000,
    0xfffeffff, 0xff000001, 0xffffffff, 0xff000000, 0xe2daffff, 0xa9cb1d25,
    0xd5f4ffff, 0x48892a0b, 0xfffeffff, 0x00000001, 0xffffffff, 0x00000000,
    0x00000000, 0x00000000, 0xe2db0000, 0x00000000, 0xffff0000, 0x00000000,
    0x00000000, 0x00000000, 0xffff0000, 0x00000000, 0x00000000, 0x00000000,
    0xffff0000, 0x00000000, 0x00000000, 0x00000000, 0xffff0000, 0x00000000,
    0x00000000, 0x00000000, 0xffff0000, 0x00000000, 0x00000000, 0x00000000,
    0x7fff0000, 0x00000000, 0x80000000, 0x00000000, 0xfffe0000, 0x00000000,
    0xffff0000, 0x00000000, 0x00000000, 0x00000000, 0x00010000, 0x00000000,
    0x00020000, 0x00000000, 0x7fff0000, 0x00000000, 0x80000000, 0x00000000,
    0xffff0000, 0x00000000, 0x00000000, 0x00000000, 0xffff0000, 0x00000000,
    0x00000000, 0x00000000, 0xe2db0000, 0x00000000, 0xd5f50000, 0x00000000,
    0xffff0000, 0x00000000, 0x00000000, 0x00000000, 0xffff0000, 0x00000000,
    0x80000000, 0x00000000, 0x76392a0a, 0xa9cb1d25, 0x00000000, 0x00000001,
    0x00100000, 0x00000000, 0xfff10000, 0x00000001, 0x00010000, 0x00000000,
    0xfff00001, 0x00000001, 0x00000001, 0x00000000, 0xfff00000, 0x01000001,
    0x00000000, 0x01000000, 0xfff00000, 0x00010001, 0x00000000, 0x00010000,
    0xfff00000, 0x00008001, 0x00000000, 0x00008000, 0xffe00000, 0x00000002,
    0xfff00000, 0x00000001, 0x00000000, 0x00000000, 0x000fffff, 0xffffffff,
    0x001fffff, 0xfffffffe, 0xffefffff, 0xffff8001, 0xffffffff, 0xffff8000,
    0xffefffff, 0xffff0001, 0xffffffff, 0xffff0000, 0xffefffff, 0xff000001,
    0xffffffff, 0xff000000, 0x2dafffff, 0xa9cb1d25, 0x5f4fffff, 0x48892a0b,
    0xffefffff, 0x00000001, 0xffffffff, 0x00000000, 0xffef0000, 0x00000001,
    0xffff0000, 0x00000000, 0x00000000, 0x00000000, 0x2db00000, 0x00000000,
    0xfff00000, 0x00000000, 0x00000000, 0x00000000, 0xfff00000, 0x00000000,
    0x00000000, 0x00000000, 0xfff00000, 0x00000000, 0x00000000, 0x00000000,
    0xfff00000, 0x00000000, 0x00000000, 0x00000000, 0xfff00000, 0x00000000,
    0x00000000, 0x00000000, 0xfff00000, 0x00000000, 0x00000000, 0x00000000,
    0xffe00000, 0x00000000, 0xfff00000, 0x00000000, 0x00000000, 0x00000000,
    0x00100000, 0x00000000, 0x00200000, 0x00000000, 0xfff00000, 0x00000000,
    0x00000000, 0x00000000, 0xfff00000, 0x00000000, 0x00000000, 0x00000000,
    0xfff00000, 0x00000000, 0x00000000, 0x00000000, 0x2db00000, 0x00000000,
    0x5f500000, 0x00000000, 0xfff00000, 0x00000000, 0x00000000, 0x00000000,
    0xfff00000, 0x00000000, 0x00000000, 0x00000000, 0xfff00000, 0x00000000,
    0x80000000, 0x00000000, 0x8a74d669, 0x9f4f5297, 0x4a7b1d24, 0x48892a0b,
    0xa0b00000, 0x00000000, 0xd3d61d24, 0x48892a0b, 0x2a0b0000, 0x00000000,
    0xf254472f, 0x48892a0b, 0x48892a0b, 0x00000000, 0xce13a64e, 0x53892a0b,
    0x2448892a, 0x0b000000, 0xc6ef65ad, 0x72942a0b, 0x1d244889, 0x2a0b0000,
    0x385d4168, 0xdd8eaa0b, 0x8e922444, 0x95058000, 0x53963a48, 0x91125416,
    0xa9cb1d24, 0x48892a0b, 0x00000000, 0x00000000, 0x5634e2db, 0xb776d5f5,
    0xac69c5b7, 0x6eedabea, 0x1b38f8df, 0xb383aa0b, 0x716ddbbb, 0x6afa8000,
    0x8ca6d49b, 0x1e7e2a0b, 0xe2dbb776, 0xd5f50000, 0x858293fa, 0x3d892a0b,
    0xdbb776d5, 0xf5000000, 0x53c739f0, 0x9f4f5297, 0x22ca6fa5, 0x36ad9c79,
    0x6141f319, 0x48892a0b, 0xb776d5f5, 0x00000000, 0x7fc01d24, 0x48892a0b,
    0xd5f50000, 0x00000000, 0x091b1d24, 0x48892a0b, 0x5f500000, 0x00000000,
    0x80000000, 0x00000000, 0xc8892a0a, 0xa9cb1d25, 0x80100000, 0x00000001,
    0x00100000, 0x00000000, 0x80010000, 0x00000001, 0x00010000, 0x00000000,
    0x80000001, 0x00000001, 0x00000001, 0x00000000, 0x80000000, 0x01000001,
    0x00000000, 0x01000000, 0x80000000, 0x00010001, 0x00000000, 0x00010000,
    0x80000000, 0x00008001, 0x00000000, 0x00008000, 0x00000000, 0x00000002,
    0x80000000, 0x00000001, 0x00000000, 0x00000000, 0x7fffffff, 0xffffffff,
    0xffffffff, 0xfffffffe, 0x7fffffff, 0xffff8001, 0xffffffff, 0xffff8000,
    0x7fffffff, 0xffff0001, 0xffffffff, 0xffff0000, 0x7fffffff, 0xff000001,
    0xffffffff, 0xff000000, 0x7fffffff, 0xa9cb1d25, 0x7fffffff, 0x48892a0b,
    0x7fffffff, 0x00000001, 0xffffffff, 0x00000000, 0x7fff0000, 0x00000001,
    0xffff0000, 0x00000000, 0x7ff00000, 0x00000001, 0xfff00000, 0x00000000,
    0x29cb1d24, 0x48892a0b
]);
var TEST_DIV_BITS = i32array([
    0x00000000, 0x00000001, 0x00000000, 0x00000001, 0x00000000, 0x000007ff,
    0x00000000, 0x00000800, 0x00000000, 0x00007fff, 0x00000000, 0x00008000,
    0x00000000, 0x7fffffff, 0x00000000, 0x80000000, 0x0000007f, 0xffff8000,
    0x00000080, 0x00000000, 0x00007fff, 0x80007fff, 0x00008000, 0x00000000,
    0x0000fffe, 0x0003fff8, 0x00010000, 0x00000000, 0x40000000, 0x00000000,
    0x80000000, 0x00000000, 0x80000000, 0x00000000, 0xc0000000, 0x00000000,
    0xfffefffd, 0xfffbfff8, 0xffff0000, 0x00000000, 0xffff7fff, 0x7fff8000,
    0xffff8000, 0x00000000, 0xffffff7f, 0xffff8000, 0xffffff80, 0x00000000,
    0xfffffffe, 0x83e3cc1a, 0xffffffff, 0x4d64985a, 0xffffffff, 0x80000000,
    0xffffffff, 0x80000000, 0xffffffff, 0xffff8000, 0xffffffff, 0xffff8000,
    0xffffffff, 0xfffff800, 0xffffffff, 0xfffff800, 0xffffffff, 0xffffffff,
    0xffffffff, 0xffffffff, 0x00000000, 0x00000000, 0x00000000, 0x00000001,
    0x00000000, 0x00000488, 0x00000000, 0x00000488, 0x00000000, 0x00004889,
    0x00000000, 0x00004889, 0x00000000, 0x48892a0a, 0x00000000, 0x48892a0a,
    0x00000048, 0x8929c220, 0x00000048, 0x892a0aa9, 0x00004888, 0xe181c849,
    0x00004889, 0x2a0aa9cb, 0x00009111, 0x31f2efb0, 0x00009112, 0x54155396,
    0x24449505, 0x54e58e92, 0x48892a0a, 0xa9cb1d25, 0xb776d5f5, 0x5634e2db,
    0xdbbb6afa, 0xab1a716e, 0xffff6eec, 0x89c3bff2, 0xffff6eed, 0xabeaac6a,
    0xffffb776, 0x8d6be3a1, 0xffffb776, 0xd5f55635, 0xffffffb7, 0x76d5acce,
    0xffffffb7, 0x76d5f557, 0xffffffff, 0x2898cfc6, 0xffffffff, 0x9ac930b4,
    0xffffffff, 0xb776d5f6, 0xffffffff, 0xb776d5f6, 0xffffffff, 0xffffb777,
    0xffffffff, 0xffffb777, 0xffffffff, 0xfffffb78, 0xffffffff, 0xfffffb78,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000001, 0x00000000, 0x00000001,
    0x00000000, 0x0000000f, 0x00000000, 0x00000010, 0x00000000, 0x000fffff,
    0x00000000, 0x00100000, 0x00000000, 0x0ffffff0, 0x00000000, 0x10000000,
    0x0000000f, 0xfff0000f, 0x00000010, 0x00000000, 0x0000001f, 0xffc0007f,
    0x00000020, 0x00000000, 0x00080000, 0x00000000, 0x00100000, 0x00000001,
    0xffefffff, 0xffffffff, 0xfff80000, 0x00000000, 0xffffffdf, 0xffbfff80,
    0xffffffe0, 0x00000000, 0xffffffef, 0xffeffff0, 0xfffffff0, 0x00000000,
    0xffffffff, 0xeffffff0, 0xffffffff, 0xf0000000, 0xffffffff, 0xffd07c7a,
    0xffffffff, 0xffe9ac94, 0xffffffff, 0xfff00000, 0xffffffff, 0xfff00000,
    0xffffffff, 0xfffffff0, 0xffffffff, 0xfffffff0, 0xffffffff, 0xffffffff,
    0xffffffff, 0xffffffff, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000001, 0x00000000, 0x0000000f, 0x00000000, 0x00000010,
    0x00000000, 0x000fffff, 0x00000000, 0x00100000, 0x00000000, 0x0ffffff0,
    0x00000000, 0x10000000, 0x0000000f, 0xfff0000f, 0x00000010, 0x00000000,
    0x0000001f, 0xffc0007f, 0x00000020, 0x00000000, 0x00080000, 0x00000000,
    0x00100000, 0x00000000, 0xfff00000, 0x00000000, 0xfff80000, 0x00000000,
    0xffffffdf, 0xffbfff80, 0xffffffe0, 0x00000000, 0xffffffef, 0xffeffff0,
    0xfffffff0, 0x00000000, 0xffffffff, 0xeffffff0, 0xffffffff, 0xf0000000,
    0xffffffff, 0xffd07c7a, 0xffffffff, 0xffe9ac94, 0xffffffff, 0xfff00000,
    0xffffffff, 0xfff00000, 0xffffffff, 0xfffffff0, 0xffffffff, 0xfffffff0,
    0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000001,
    0x00000000, 0x00000001, 0x00000000, 0x0000ffff, 0x00000000, 0x00010000,
    0x00000000, 0x00ffffff, 0x00000000, 0x01000000, 0x00000000, 0xffff0001,
    0x00000001, 0x00000000, 0x00000001, 0xfffc0007, 0x00000002, 0x00000000,
    0x00008000, 0x00000000, 0x00010000, 0x00000001, 0xfffeffff, 0xffffffff,
    0xffff8000, 0x00000000, 0xfffffffd, 0xfffbfff8, 0xfffffffe, 0x00000000,
    0xfffffffe, 0xfffeffff, 0xffffffff, 0x00000000, 0xffffffff, 0xfeffffff,
    0xffffffff, 0xff000000, 0xffffffff, 0xfffd07c8, 0xffffffff, 0xfffe9aca,
    0xffffffff, 0xffff0000, 0xffffffff, 0xffff0000, 0xffffffff, 0xffffffff,
    0xffffffff, 0xffffffff, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000001, 0x00000000, 0x0000ffff,
    0x00000000, 0x00010000, 0x00000000, 0x00ffffff, 0x00000000, 0x01000000,
    0x00000000, 0xffff0000, 0x00000001, 0x00000000, 0x00000001, 0xfffc0007,
    0x00000002, 0x00000000, 0x00008000, 0x00000000, 0x00010000, 0x00000000,
    0xffff0000, 0x00000000, 0xffff8000, 0x00000000, 0xfffffffd, 0xfffbfff8,
    0xfffffffe, 0x00000000, 0xfffffffe, 0xfffeffff, 0xffffffff, 0x00000000,
    0xffffffff, 0xfeffffff, 0xffffffff, 0xff000000, 0xffffffff, 0xfffd07c8,
    0xffffffff, 0xfffe9aca, 0xffffffff, 0xffff0000, 0xffffffff, 0xffff0000,
    0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000001, 0x00000000, 0x00000001, 0x00000000, 0x000000ff,
    0x00000000, 0x00000100, 0x00000000, 0x0000ffff, 0x00000000, 0x00010000,
    0x00000000, 0x0001fffc, 0x00000000, 0x00020000, 0x00000000, 0x80000000,
    0x00000001, 0x00000001, 0xfffffffe, 0xffffffff, 0xffffffff, 0x80000000,
    0xffffffff, 0xfffdfffc, 0xffffffff, 0xfffe0000, 0xffffffff, 0xfffeffff,
    0xffffffff, 0xffff0000, 0xffffffff, 0xffffff00, 0xffffffff, 0xffffff00,
    0xffffffff, 0xfffffffe, 0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff,
    0xffffffff, 0xffffffff, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000001,
    0x00000000, 0x000000ff, 0x00000000, 0x00000100, 0x00000000, 0x0000ffff,
    0x00000000, 0x00010000, 0x00000000, 0x0001fffc, 0x00000000, 0x00020000,
    0x00000000, 0x80000000, 0x00000001, 0x00000000, 0xffffffff, 0x00000000,
    0xffffffff, 0x80000000, 0xffffffff, 0xfffdfffc, 0xffffffff, 0xfffe0000,
    0xffffffff, 0xfffeffff, 0xffffffff, 0xffff0000, 0xffffffff, 0xffffff00,
    0xffffffff, 0xffffff00, 0xffffffff, 0xfffffffe, 0xffffffff, 0xffffffff,
    0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000001, 0x00000000, 0x00000001,
    0x00000000, 0x000000ff, 0x00000000, 0x00000100, 0x00000000, 0x000001ff,
    0x00000000, 0x00000200, 0x00000000, 0x00800000, 0x00000000, 0x01000001,
    0xffffffff, 0xfeffffff, 0xffffffff, 0xff800000, 0xffffffff, 0xfffffe00,
    0xffffffff, 0xfffffe00, 0xffffffff, 0xffffff00, 0xffffffff, 0xffffff00,
    0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000001, 0x00000000, 0x000000ff, 0x00000000, 0x00000100,
    0x00000000, 0x000001ff, 0x00000000, 0x00000200, 0x00000000, 0x00800000,
    0x00000000, 0x01000000, 0xffffffff, 0xff000000, 0xffffffff, 0xff800000,
    0xffffffff, 0xfffffe00, 0xffffffff, 0xfffffe00, 0xffffffff, 0xffffff00,
    0xffffffff, 0xffffff00, 0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000001,
    0x00000000, 0x00000001, 0x00000000, 0x00000001, 0x00000000, 0x00000002,
    0x00000000, 0x00008000, 0x00000000, 0x00010001, 0xffffffff, 0xfffeffff,
    0xffffffff, 0xffff8000, 0xffffffff, 0xfffffffe, 0xffffffff, 0xfffffffe,
    0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000001, 0x00000000, 0x00000001,
    0x00000000, 0x00000002, 0x00000000, 0x00008000, 0x00000000, 0x00010000,
    0xffffffff, 0xffff0000, 0xffffffff, 0xffff8000, 0xffffffff, 0xfffffffe,
    0xffffffff, 0xfffffffe, 0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000001, 0x00000000, 0x00000001, 0x00000000, 0x00004000,
    0x00000000, 0x00008001, 0xffffffff, 0xffff7fff, 0xffffffff, 0xffffc000,
    0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000001,
    0x00000000, 0x00004000, 0x00000000, 0x00008000, 0xffffffff, 0xffff8000,
    0xffffffff, 0xffffc000, 0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000001, 0x00000000, 0x00000002,
    0xffffffff, 0xfffffffe, 0xffffffff, 0xffffffff, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000001, 0xffffffff, 0xffffffff, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0xffffffff, 0xffffffff,
    0x00000000, 0x00000001, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0xffffffff, 0xffffffff,
    0xffffffff, 0xfffffffe, 0x00000000, 0x00000002, 0x00000000, 0x00000001,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0xffffffff, 0xffffc001, 0xffffffff, 0xffff8001, 0x00000000, 0x00007fff,
    0x00000000, 0x00003fff, 0x00000000, 0x00000001, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0xffffffff, 0xffffffff, 0xffffffff, 0xffffc000, 0xffffffff, 0xffff8000,
    0x00000000, 0x00008000, 0x00000000, 0x00004000, 0x00000000, 0x00000001,
    0x00000000, 0x00000001, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff, 0xffff8001,
    0xffffffff, 0xffff0001, 0x00000000, 0x0000ffff, 0x00000000, 0x00007fff,
    0x00000000, 0x00000002, 0x00000000, 0x00000001, 0x00000000, 0x00000001,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff, 0xfffffffe,
    0xffffffff, 0xffff8000, 0xffffffff, 0xffff0000, 0x00000000, 0x00010000,
    0x00000000, 0x00008000, 0x00000000, 0x00000002, 0x00000000, 0x00000002,
    0x00000000, 0x00000001, 0x00000000, 0x00000001, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0xffffffff, 0xffffff01, 0xffffffff, 0xffffff01, 0xffffffff, 0xfffffe01,
    0xffffffff, 0xfffffe01, 0xffffffff, 0xff800001, 0xffffffff, 0xff000001,
    0x00000000, 0x00ffffff, 0x00000000, 0x007fffff, 0x00000000, 0x00000200,
    0x00000000, 0x000001ff, 0x00000000, 0x00000100, 0x00000000, 0x000000ff,
    0x00000000, 0x00000001, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0xffffffff, 0xffffffff, 0xffffffff, 0xffffff01, 0xffffffff, 0xffffff00,
    0xffffffff, 0xfffffe01, 0xffffffff, 0xfffffe00, 0xffffffff, 0xff800000,
    0xffffffff, 0xff000000, 0x00000000, 0x01000000, 0x00000000, 0x00800000,
    0x00000000, 0x00000200, 0x00000000, 0x00000200, 0x00000000, 0x00000100,
    0x00000000, 0x00000100, 0x00000000, 0x00000001, 0x00000000, 0x00000001,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0xffffffff, 0xffffffaa, 0xffffffff, 0xffffffaa, 0xffffffff, 0xffffa9cc,
    0xffffffff, 0xffffa9cc, 0xffffffff, 0xffff5398, 0xffffffff, 0xffff5397,
    0xffffffff, 0xd4e58e93, 0xffffffff, 0xa9cb1d25, 0x00000000, 0x5634e2db,
    0x00000000, 0x2b1a716d, 0x00000000, 0x0000ac6b, 0x00000000, 0x0000ac69,
    0x00000000, 0x00005635, 0x00000000, 0x00005634, 0x00000000, 0x00000056,
    0x00000000, 0x00000056, 0x00000000, 0x00000001, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0xffffffff, 0xffffff49, 0xffffffff, 0xffffff49,
    0xffffffff, 0xffff488a, 0xffffffff, 0xffff488a, 0xffffffff, 0xfffe9116,
    0xffffffff, 0xfffe9113, 0xffffffff, 0xa4449506, 0xffffffff, 0x48892a0b,
    0x00000000, 0xb776d5f5, 0x00000000, 0x5bbb6afa, 0x00000000, 0x00016ef0,
    0x00000000, 0x00016eed, 0x00000000, 0x0000b777, 0x00000000, 0x0000b776,
    0x00000000, 0x000000b7, 0x00000000, 0x000000b7, 0x00000000, 0x00000002,
    0x00000000, 0x00000001, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0xffffffff, 0xffffff01,
    0xffffffff, 0xffffff01, 0xffffffff, 0xffff0001, 0xffffffff, 0xffff0001,
    0xffffffff, 0xfffe0004, 0xffffffff, 0xfffe0001, 0xffffffff, 0x80000001,
    0xffffffff, 0x00000001, 0x00000000, 0xffffffff, 0x00000000, 0x7fffffff,
    0x00000000, 0x00020004, 0x00000000, 0x0001ffff, 0x00000000, 0x00010001,
    0x00000000, 0x0000ffff, 0x00000000, 0x00000100, 0x00000000, 0x000000ff,
    0x00000000, 0x00000002, 0x00000000, 0x00000001, 0x00000000, 0x00000001,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0xffffffff, 0xffffffff,
    0xffffffff, 0xffffff01, 0xffffffff, 0xffffff00, 0xffffffff, 0xffff0001,
    0xffffffff, 0xffff0000, 0xffffffff, 0xfffe0004, 0xffffffff, 0xfffe0000,
    0xffffffff, 0x80000000, 0xffffffff, 0x00000000, 0x00000001, 0x00000000,
    0x00000000, 0x80000000, 0x00000000, 0x00020004, 0x00000000, 0x00020000,
    0x00000000, 0x00010001, 0x00000000, 0x00010000, 0x00000000, 0x00000100,
    0x00000000, 0x00000100, 0x00000000, 0x00000002, 0x00000000, 0x00000001,
    0x00000000, 0x00000001, 0x00000000, 0x00000001, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0xffffffff, 0xffff0001,
    0xffffffff, 0xffff0001, 0xffffffff, 0xff000001, 0xffffffff, 0xff000001,
    0xffffffff, 0x00010000, 0xffffffff, 0x00000001, 0xfffffffe, 0x0003fff9,
    0xfffffffe, 0x00000001, 0xffff8000, 0x00000001, 0xffff0000, 0x00000001,
    0x0000ffff, 0xffffffff, 0x00007fff, 0xffffffff, 0x00000002, 0x00040008,
    0x00000001, 0xffffffff, 0x00000001, 0x00010001, 0x00000000, 0xffffffff,
    0x00000000, 0x01000001, 0x00000000, 0x00ffffff, 0x00000000, 0x0002f838,
    0x00000000, 0x00016536, 0x00000000, 0x00010000, 0x00000000, 0x0000ffff,
    0x00000000, 0x00000001, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0xffffffff, 0xffffffff,
    0xffffffff, 0xffff0001, 0xffffffff, 0xffff0000, 0xffffffff, 0xff000001,
    0xffffffff, 0xff000000, 0xffffffff, 0x00010000, 0xffffffff, 0x00000000,
    0xfffffffe, 0x0003fff9, 0xfffffffe, 0x00000000, 0xffff8000, 0x00000000,
    0xffff0000, 0x00000000, 0x00010000, 0x00000000, 0x00008000, 0x00000000,
    0x00000002, 0x00040008, 0x00000002, 0x00000000, 0x00000001, 0x00010001,
    0x00000001, 0x00000000, 0x00000000, 0x01000001, 0x00000000, 0x01000000,
    0x00000000, 0x0002f838, 0x00000000, 0x00016536, 0x00000000, 0x00010000,
    0x00000000, 0x00010000, 0x00000000, 0x00000001, 0x00000000, 0x00000001,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0xffffffff, 0xfffffff1,
    0xffffffff, 0xfffffff1, 0xffffffff, 0xfff00001, 0xffffffff, 0xfff00001,
    0xffffffff, 0xf0000010, 0xffffffff, 0xf0000001, 0xfffffff0, 0x000ffff1,
    0xfffffff0, 0x00000001, 0xffffffe0, 0x003fff81, 0xffffffe0, 0x00000001,
    0xfff80000, 0x00000001, 0xfff00000, 0x00000001, 0x000fffff, 0xffffffff,
    0x0007ffff, 0xffffffff, 0x00000020, 0x00400080, 0x0000001f, 0xffffffff,
    0x00000010, 0x00100010, 0x0000000f, 0xffffffff, 0x00000000, 0x10000010,
    0x00000000, 0x0fffffff, 0x00000000, 0x002f8386, 0x00000000, 0x0016536c,
    0x00000000, 0x00100000, 0x00000000, 0x000fffff, 0x00000000, 0x00000010,
    0x00000000, 0x0000000f, 0x00000000, 0x00000001, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0xffffffff, 0xffffffff,
    0xffffffff, 0xfffffff1, 0xffffffff, 0xfffffff0, 0xffffffff, 0xfff00001,
    0xffffffff, 0xfff00000, 0xffffffff, 0xf0000010, 0xffffffff, 0xf0000000,
    0xfffffff0, 0x000ffff1, 0xfffffff0, 0x00000000, 0xffffffe0, 0x003fff81,
    0xffffffe0, 0x00000000, 0xfff80000, 0x00000000, 0xfff00000, 0x00000000,
    0x00100000, 0x00000000, 0x00080000, 0x00000000, 0x00000020, 0x00400080,
    0x00000020, 0x00000000, 0x00000010, 0x00100010, 0x00000010, 0x00000000,
    0x00000000, 0x10000010, 0x00000000, 0x10000000, 0x00000000, 0x002f8386,
    0x00000000, 0x0016536c, 0x00000000, 0x00100000, 0x00000000, 0x00100000,
    0x00000000, 0x00000010, 0x00000000, 0x00000010, 0x00000000, 0x00000001,
    0x00000000, 0x00000001, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0xffffffff, 0xffffffff, 0xffffffff, 0xfffffa9d,
    0xffffffff, 0xfffffa9d, 0xffffffff, 0xffffa9cc, 0xffffffff, 0xffffa9cc,
    0xffffffff, 0xa9cb1d25, 0xffffffff, 0xa9cb1d25, 0xffffffa9, 0xcb1d7a7e,
    0xffffffa9, 0xcb1d2449, 0xffffa9cb, 0x7358d531, 0xffffa9cb, 0x1d24488a,
    0xffff5397, 0x93196ae0, 0xffff5396, 0x3a489113, 0xd4e58e92, 0x24449506,
    0xa9cb1d24, 0x48892a0b, 0x5634e2db, 0xb776d5f5, 0x2b1a716d, 0xdbbb6afa,
    0x0000ac6b, 0x1e8dac09, 0x0000ac69, 0xc5b76eed, 0x00005635, 0x3910f087,
    0x00005634, 0xe2dbb776, 0x00000056, 0x34e331ec, 0x00000056, 0x34e2dbb7,
    0x00000001, 0x00000002, 0x00000000, 0x784a3552, 0x00000000, 0x5634e2dc,
    0x00000000, 0x5634e2db, 0x00000000, 0x00005634, 0x00000000, 0x00005634,
    0x00000000, 0x00000563, 0x00000000, 0x00000563, 0x00000000, 0x00000001,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0xffffffff, 0xffffffff,
    0xffffffff, 0xfffff801, 0xffffffff, 0xfffff801, 0xffffffff, 0xffff8001,
    0xffffffff, 0xffff8001, 0xffffffff, 0x80000001, 0xffffffff, 0x80000001,
    0xffffff80, 0x00008000, 0xffffff80, 0x00000001, 0xffff8000, 0x7fff8001,
    0xffff8000, 0x00000001, 0xffff0001, 0xfffc0008, 0xffff0000, 0x00000001,
    0xc0000000, 0x00000001, 0x80000000, 0x00000001, 0x7fffffff, 0xffffffff,
    0x3fffffff, 0xffffffff, 0x00010002, 0x00040008, 0x0000ffff, 0xffffffff,
    0x00008000, 0x80008000, 0x00007fff, 0xffffffff, 0x00000080, 0x00008000,
    0x0000007f, 0xffffffff, 0x00000001, 0x7c1c33e6, 0x00000000, 0xb29b67a6,
    0x00000000, 0x80000000, 0x00000000, 0x7fffffff, 0x00000000, 0x00008000,
    0x00000000, 0x00007fff, 0x00000000, 0x00000800, 0x00000000, 0x000007ff,
    0x00000000, 0x00000001, 0x00000000, 0x00000001
]);
var TEST_STRINGS = [
    '-9223372036854775808',
    '-5226755067826871589',
    '-4503599627370497',
    '-4503599627370496',
    '-281474976710657',
    '-281474976710656',
    '-4294967297',
    '-4294967296',
    '-16777217',
    '-16777216',
    '-65537',
    '-65536',
    '-32769',
    '-32768',
    '-2',
    '-1',
    '0',
    '1',
    '2',
    '32767',
    '32768',
    '65535',
    '65536',
    '16777215',
    '16777216',
    '1446306523',
    '3078018549',
    '4294967295',
    '4294967296',
    '281474976710655',
    '281474976710656',
    '4503599627370495',
    '4503599627370496',
    '6211839219354490357',
    '9223372036854775807'
];
TEST('ToFromBits', () => {
    for (var i = 0; i < TEST_BITS.length; i += 2) {
        let val = new SInt64(TEST_BITS[i + 1], TEST_BITS[i]);
        assertEq(val._low, TEST_BITS[i + 1]);
        assertEq(val._high, TEST_BITS[i]);
    }
});
TEST('ToFromInt32', () => {
    for (var i = 0; i < TEST_BITS.length; i += 1) {
        let val = SInt64.fromInt32(TEST_BITS[i]);
        assertEq(val.toInt32(), TEST_BITS[i]);
    }
});
TEST('ToFromFloat64', () => {
    for (var i = 0; i < TEST_BITS.length; i += 2) {
        let num = TEST_BITS[i] * Math.pow(2, 32) + TEST_BITS[i + 1] >= 0 ?
            TEST_BITS[i + 1] :
            Math.pow(2, 32) + TEST_BITS[i + 1];
        let val = SInt64.fromFloat64(num);
        assertEq(val.toFloat64(), num);
    }
    assertEq(SInt64.fromFloat64(NaN), SInt64.ZERO);
    assertEq(SInt64.fromFloat64(Infinity), SInt64.MAX);
    assertEq(SInt64.fromFloat64(-Infinity), SInt64.MIN);
});
TEST('FromDecimalCachedValues', () => {
    assertThrows(() => SInt64.fromInt32(0.1));
    assertThrows(() => SInt64.fromInt32(0.2));
    assertThrows(() => SInt64.fromInt32(1.1));
});
TEST('egz', () => {
    for (var i = 0; i < TEST_BITS.length; i += 2) {
        let val = new SInt64(TEST_BITS[i + 1], TEST_BITS[i]);
        assertEq(val.eqz(), TEST_BITS[i] == 0 && TEST_BITS[i + 1] == 0);
    }
});
TEST('isNeg', () => {
    for (var i = 0; i < TEST_BITS.length; i += 2) {
        let val = new SInt64(TEST_BITS[i + 1], TEST_BITS[i]);
        assertEq(val.isNeg(), (TEST_BITS[i] >> 31) != 0);
    }
});
TEST('isOdd', () => {
    for (var i = 0; i < TEST_BITS.length; i += 2) {
        let val = new SInt64(TEST_BITS[i + 1], TEST_BITS[i]);
        assertEq(val.isOdd(), (TEST_BITS[i + 1] & 1) != 0);
    }
});
TEST('comparisons', () => {
    for (let i = 0; i < TEST_BITS.length; i += 2) {
        let vi = new SInt64(TEST_BITS[i + 1], TEST_BITS[i]);
        for (let j = 0; j < TEST_BITS.length; j += 2) {
            let vj = new SInt64(TEST_BITS[j + 1], TEST_BITS[j]);
            assertEq(vi.eq(vj), i == j, "comparison#" + i);
            assertEq(vi.lt(vj), i < j, "comparison#" + i);
            assertEq(vi.lte(vj), i <= j, "comparison#" + i);
            assertEq(vi.gt(vj), i > j, "comparison#" + i);
            assertEq(vi.gte(vj), i >= j, "comparison#" + i);
        }
    }
});
TEST('bitOperations', () => {
    for (let i = 0; i < TEST_BITS.length; i += 2) {
        let actx = `bitOperations[i=${i}]`;
        let vi = new SInt64(TEST_BITS[i + 1], TEST_BITS[i]);
        assertEq(vi.not()._high, ~TEST_BITS[i], actx);
        assertEq(vi.not()._low, ~TEST_BITS[i + 1], actx);
        for (let j = 0; j < TEST_BITS.length; j += 2) {
            actx = `bitOperations[i=${i},j=${j}]`;
            let vj = new SInt64(TEST_BITS[j + 1], TEST_BITS[j]);
            assertEq(vi.and(vj)._high, TEST_BITS[i] & TEST_BITS[j], actx);
            assertEq(vi.and(vj)._low, TEST_BITS[i + 1] & TEST_BITS[j + 1], actx);
            assertEq(vi.or(vj)._high, TEST_BITS[i] | TEST_BITS[j], actx);
            assertEq(vi.or(vj)._low, TEST_BITS[i + 1] | TEST_BITS[j + 1], actx);
            assertEq(vi.xor(vj)._high, TEST_BITS[i] ^ TEST_BITS[j], actx);
            assertEq(vi.xor(vj)._low, TEST_BITS[i + 1] ^ TEST_BITS[j + 1], actx);
        }
        actx = `bitOperations[i=${i}]`;
        assertEq(vi.shl(0)._high, TEST_BITS[i], actx);
        assertEq(vi.shl(0)._low, TEST_BITS[i + 1], actx);
        assertEq(vi.shr_s(0)._high, TEST_BITS[i], actx);
        assertEq(vi.shr_s(0)._low, TEST_BITS[i + 1], actx);
        assertEq(vi.shr_u(0)._high, TEST_BITS[i], actx);
        assertEq(vi.shr_u(0)._low, TEST_BITS[i + 1], actx);
        for (let len = 1; len < 64; ++len) {
            actx = `bitOperations[i=${i},len=${len}]`;
            if (len < 32) {
                assertEq(vi.shl(len)._high, (TEST_BITS[i] << len) | (TEST_BITS[i + 1] >>> (32 - len)), actx);
                assertEq(vi.shl(len)._low, TEST_BITS[i + 1] << len, actx);
                assertEq(vi.shr_s(len)._high, TEST_BITS[i] >> len, actx);
                assertEq(vi.shr_s(len)._low, (TEST_BITS[i + 1] >>> len) | (TEST_BITS[i] << (32 - len)), actx);
                assertEq(vi.shr_u(len)._high, TEST_BITS[i] >>> len, actx);
                assertEq(vi.shr_u(len)._low, (TEST_BITS[i + 1] >>> len) | (TEST_BITS[i] << (32 - len)), actx);
            }
            else {
                assertEq(vi.shl(len)._high, TEST_BITS[i + 1] << (len - 32), actx);
                assertEq(vi.shl(len)._low, 0, actx);
                assertEq(vi.shr_s(len)._high, TEST_BITS[i] >= 0 ? 0 : -1, actx);
                assertEq(vi.shr_s(len)._low, TEST_BITS[i] >> (len - 32), actx);
                assertEq(vi.shr_u(len)._high, 0, actx);
                if (len == 32) {
                    assertEq(vi.shr_u(len)._low, TEST_BITS[i], actx);
                }
                else {
                    assertEq(vi.shr_u(len)._low, TEST_BITS[i] >>> (len - 32), actx);
                }
            }
        }
        actx = `bitOperations[i=${i}]`;
        assertEq(vi.shl(64)._high, TEST_BITS[i], actx);
        assertEq(vi.shl(64)._low, TEST_BITS[i + 1], actx);
        assertEq(vi.shr_s(64)._high, TEST_BITS[i], actx);
        assertEq(vi.shr_s(64)._low, TEST_BITS[i + 1], actx);
        assertEq(vi.shr_u(64)._high, TEST_BITS[i], actx);
        assertEq(vi.shr_u(64)._low, TEST_BITS[i + 1], actx);
    }
});
TEST('neg', () => {
    for (let i = 0; i < TEST_BITS.length; i += 2) {
        let vi = new SInt64(TEST_BITS[i + 1], TEST_BITS[i]);
        if (TEST_BITS[i + 1] == 0) {
            assertEq(vi.neg()._high, (~TEST_BITS[i] + 1) | 0);
            assertEq(vi.neg()._low, 0);
        }
        else {
            assertEq(vi.neg()._high, ~TEST_BITS[i]);
            assertEq(vi.neg()._low, (~TEST_BITS[i + 1] + 1) | 0);
        }
    }
});
TEST('add', () => {
    let count = 0;
    for (let i = 0; i < TEST_BITS.length; i += 2) {
        let vi = new SInt64(TEST_BITS[i + 1], TEST_BITS[i]);
        for (let j = 0; j < i; j += 2) {
            let vj = new SInt64(TEST_BITS[j + 1], TEST_BITS[j]);
            let result = vi.add(vj);
            assertEq(result._high, TEST_ADD_BITS[count++]);
            assertEq(result._low, TEST_ADD_BITS[count++]);
        }
    }
});
TEST('sub', () => {
    let count = 0;
    for (let i = 0; i < TEST_BITS.length; i += 2) {
        let vi = new SInt64(TEST_BITS[i + 1], TEST_BITS[i]);
        for (let j = 0; j < TEST_BITS.length; j += 2) {
            let vj = new SInt64(TEST_BITS[j + 1], TEST_BITS[j]);
            let result = vi.sub(vj);
            assertEq(result._high, TEST_SUB_BITS[count++]);
            assertEq(result._low, TEST_SUB_BITS[count++]);
        }
    }
});
TEST('mul', () => {
    let count = 0;
    for (let i = 0; i < TEST_BITS.length; i += 2) {
        let vi = new SInt64(TEST_BITS[i + 1], TEST_BITS[i]);
        for (let j = 0; j < i; j += 2) {
            let vj = new SInt64(TEST_BITS[j + 1], TEST_BITS[j]);
            let result = vi.mul(vj);
            assertEq(result._high, TEST_MUL_BITS[count++]);
            assertEq(result._low, TEST_MUL_BITS[count++]);
        }
    }
});
if (js_mul)
    TEST('mul/js', () => {
        let count = 0;
        for (let i = 0; i < TEST_BITS.length; i += 2) {
            let vi = new SInt64(TEST_BITS[i + 1], TEST_BITS[i]);
            for (let j = 0; j < i; j += 2) {
                let vj = new SInt64(TEST_BITS[j + 1], TEST_BITS[j]);
                let result = js_mul.call(vi, vj);
                assertEq(result._high, TEST_MUL_BITS[count++]);
                assertEq(result._low, TEST_MUL_BITS[count++]);
            }
        }
    });
TEST('div-mod', () => {
    let countPerDivModCall = 0;
    for (let j = 0; j < TEST_BITS.length; j += 2) {
        let vj = new SInt64(TEST_BITS[j + 1], TEST_BITS[j]);
        if (!vj.eqz()) {
            countPerDivModCall += 2;
        }
    }
    let countDivMod = 0;
    for (let i = 0; i < TEST_BITS.length; i += 2) {
        let count = countDivMod;
        countDivMod += countPerDivModCall;
        let vi = new SInt64(TEST_BITS[i + 1], TEST_BITS[i]);
        for (let j = 0; j < TEST_BITS.length; j += 2) {
            let vj = new SInt64(TEST_BITS[j + 1], TEST_BITS[j]);
            if (!vj.eqz()) {
                let divResult = vi.div(vj);
                assertEq(divResult._high, TEST_DIV_BITS[count]);
                assertEq(divResult._low, TEST_DIV_BITS[count + 1]);
                let modResult = vi.mod(vj);
                let combinedResult = divResult.mul(vj).add(modResult);
                assert(vi.eq(combinedResult));
                if (js_div_s) {
                    assert(js_mod_s);
                    divResult = js_div_s.call(vi, vj);
                    assertEq(divResult._high, TEST_DIV_BITS[count]);
                    assertEq(divResult._low, TEST_DIV_BITS[count + 1]);
                    let modResult = js_mod_s.call(vi, vj);
                    let combinedResult = divResult.mul(vj).add(modResult);
                    assert(vi.eq(combinedResult));
                }
                count += 2;
            }
        }
    }
});
TEST('ToFromString', () => {
    for (let i = 0; i < TEST_BITS.length; i += 2) {
        let vi = new SInt64(TEST_BITS[i + 1], TEST_BITS[i]);
        let str = vi.toString(10);
        assertEq(str, TEST_STRINGS[i / 2]);
        let n = SInt64.fromStr(str, 10);
        assertEq(n._high, TEST_BITS[i]);
        assertEq(n._low, TEST_BITS[i + 1]);
        for (let radix = 2; radix <= 36; ++radix) {
            let result = vi.toString(radix);
            n = SInt64.fromStr(result, radix);
            assertEq(n._high, TEST_BITS[i]);
            assertEq(n._low, TEST_BITS[i + 1]);
        }
    }
    assertEq(SInt64.fromStr("zzzzzz", 36).toString(36), "zzzzzz");
    assertEq(SInt64.fromStr("-zzzzzz", 36).toString(36), "-zzzzzz");
});
//# sourceMappingURL=int64_test.js.map

const SEMIC = token.SEMICOLON;
const ReportErrors = false;
function dedentMultiLineString(s) {
    let p = s.lastIndexOf('\n');
    if (p == -1 || p == s.length - 1) {
        return s;
    }
    let ind = s.substr(p);
    let v = [];
    for (let line of s.split('\n')) {
        if (line.indexOf(ind) != 0) {
            return s;
        }
        v.push(line.substr(ind.length));
    }
    return v.join('\n');
}
function onScanError(position, message) {
    console.error(`[error] ${message} at ${position}`);
}

function sourceScanner(srctext) {
    let s = new Scanner();
    let fileSet = new SrcFileSet();
    let src = asciibuf(dedentMultiLineString(srctext));
    let file = fileSet.addFile('a', src.length);
    s.init(file, src, ReportErrors ? onScanError : null);
    return s;
}
function assertTokens(srctext, tokens) {
    let s = sourceScanner(srctext);
    let i = 0;
    s.next();
    while (s.tok != token.EOF) {
        assert(i < tokens.length, `too many tokens produced; ` +
            `got extra ${token[s.tok]} (${tokstr(s.tok)}) ` +
            `at ${s.sfile.position(s.pos)}`, assertTokens);
        let etok = tokens[i++];
        assert(etok === s.tok, `expected ${token[etok]} (${tokstr(etok)}) ` +
            `but got ${token[s.tok]} (${tokstr(s.tok)}) ` +
            `at ${s.sfile.position(s.pos)}`, assertTokens);
        s.next();
    }
    assert(i == tokens.length, `too few tokens produced`, assertTokens);
}
function assertGotTok(s, t) {
    s.next();
    assert(s.tok == t, `expected token.${token[t]} ` +
        `but got ${token[s.tok]} (${tokstr(s.tok)}) ` +
        `at ${s.sfile.position(s.pos)}`, assertGotTok);
}
TEST('basics', () => {
    assertTokens(`
    123  // implicit semicolon here
    // line comment
    bob; // explicit semicolon doesn't generate implicit semicolon
    /* multi-line
       comment
       ignored */
    ]  // implicit semicolon here
    `, [
        token.INT, SEMIC,
        token.NAME, SEMIC,
        token.RBRACKET, SEMIC,
    ]);
});
TEST('char', () => {
    let samples = [
        ['a', 0x61],
        ['K', 0x4B],
        ['\\n', 0xA],
        ['\\t', 0x9],
        ['\\f', 0xC],
        ['\\0', 0],
        ['\\x00', 0],
        ['\\x0A', 0xA],
        ['\\xff', 0xff],
        ['\\u221A', 0x221A],
        ['\\U00010299', 0x10299],
    ];
    let src = samples.map(sample => `'${sample[0]}'`).join('\n');
    let s = sourceScanner(src);
    for (let [_, value] of samples) {
        assertGotTok(s, token.CHAR);
        assertEq(s.int32val, value);
        assertGotTok(s, SEMIC);
    }
    assertGotTok(s, token.EOF);
});
TEST('char/invalid', () => {
    let singleInvalidCharSources = [
        "''",
        "'ab'",
        "'\n'",
        "'\x00'",
        "'\x09'",
        "'\\'",
        "'\\2'",
        "'a",
        "'\\U00110000'",
    ];
    for (let src of singleInvalidCharSources) {
        let s = sourceScanner(src);
        assertGotTok(s, token.ILLEGAL);
        assert(isNaN(s.int32val));
        assertGotTok(s, SEMIC);
        assertGotTok(s, token.EOF);
    }
});
//# sourceMappingURL=scanner_test.js.map

function numberBaseForToken(t) {
    return (t == token.INT_HEX ? 16 :
        t == token.INT_OCT ? 8 :
            t == token.INT_BIN ? 2 :
                10);
}
function assertGotI32Val(s, t, expectedString) {
    assertGotTok(s, t);
    let base = numberBaseForToken(t);
    if (isNaN(s.int32val)) {
        assert(false, `expected int32 value but none was parsed (s.int32val=NaN)` +
            ` at ${s.sfile.position(s.pos)}`, assertGotI32Val);
    }
    else if (base == 16) {
        assert(s.int32val.toString(base) === expectedString, `expected int32 value ${expectedString}` +
            ` but got 0x${s.int32val.toString(base)}` +
            ` at ${s.sfile.position(s.pos)}`, assertGotI32Val);
    }
    else {
        assert(s.int32val.toString(base) === expectedString, `expected int32 value ${expectedString}` +
            ` but got ${s.int32val.toString(base)} (0x${s.int32val.toString(16)})` +
            ` at ${s.sfile.position(s.pos)}`, assertGotI32Val);
    }
}
function assertGotF64Val(s, expectedVal) {
    assertGotTok(s, token.FLOAT);
    assert(!isNaN(s.floatval), `expected float value but none was parsed (s.floatval=NaN)` +
        ` at ${s.sfile.position(s.pos)}`, assertGotF64Val);
    assert(s.floatval === expectedVal, `expected float value ${expectedVal} but got ${s.floatval}` +
        ` at ${s.sfile.position(s.pos)}`, assertGotF64Val);
}
function assertGotI64Val(s, t, expectedString) {
    assertGotTok(s, t);
    let base = numberBaseForToken(t);
    if (!s.int64val) {
        assert(false, `expected int64 value but none was parsed` +
            ` at ${s.sfile.position(s.pos)}`, assertGotI64Val);
    }
    else if (base == 16) {
        assert(s.int64val.toString(base) === expectedString, `expected int64 value ${expectedString}` +
            ` but got 0x${s.int64val.toString(base)}` +
            ` at ${s.sfile.position(s.pos)}`, assertGotI64Val);
    }
    else {
        assert(s.int64val.toString(base) === expectedString, `expected int64 value ${expectedString}` +
            ` but got ${s.int64val.toString(base)} (0x${s.int64val.toString(16)})` +
            ` at ${s.sfile.position(s.pos)}`, assertGotI64Val);
    }
}
function assertGotInvalidInt(s, t) {
    let base = numberBaseForToken(t);
    assertGotTok(s, t);
    assert(isNaN(s.int32val), `expected invalid int but got` +
        ` int32val ${s.int32val.toString(base)} (0x${s.int32val.toString(16)})` +
        ` at ${s.sfile.position(s.pos)}`, assertGotInvalidInt);
    assert(s.int64val == null, `expected invalid int` +
        ` but got int64val ${s.int64val ? s.int64val.toString(base) : '0'}` +
        ` (0x${s.int64val ? s.int64val.toString(16) : '0'})` +
        ` at ${s.sfile.position(s.pos)}`, assertGotInvalidInt);
}
function expectedStringFromSource(s, t) {
    let base = numberBaseForToken(t);
    if (s[0] == '+') {
        s = s.substr(1);
    }
    if (base != 10) {
        s = (s[0] == '-' ? '-' + s.substr(3) :
            s.substr(2));
    }
    return (s == '-0' ? '0' :
        s[0] == '+' ? s.substr(1) :
            s);
}
function assertScanI32s(samples) {
    for (let sample of samples) {
        let source = sample[0];
        let expectToken = sample[1];
        let expectString = expectedStringFromSource(source, expectToken);
        let s = sourceScanner(source);
        assertGotI32Val(s, expectToken, expectString);
    }
}
function assertScanI64s(samples) {
    for (let sample of samples) {
        let source = sample[0];
        let expectToken = sample[1];
        let expectString = expectedStringFromSource(source, expectToken);
        let s = sourceScanner(source);
        assertGotI64Val(s, expectToken, expectString);
    }
}
function assertScanBigInts(samples) {
    for (let sample of samples) {
        let source = sample[0];
        let expectToken = sample[1];
        let s = sourceScanner(source);
        assertGotInvalidInt(s, expectToken);
    }
}
function assertScanF64s(samples) {
    for (let source of samples) {
        let expectVal = parseFloat(source);
        let s = sourceScanner(source);
        assertGotF64Val(s, expectVal);
    }
}
TEST('int/unsigned/base16', () => {
    assertScanI32s([
        ['0x0', token.INT_HEX],
        ['0x1', token.INT_HEX],
        ['0x123', token.INT_HEX],
        ['0xff0099', token.INT_HEX],
        ['0xdeadbeef', token.INT_HEX],
        ['0xffffffff', token.INT_HEX],
    ]);
    assertScanI64s([
        ['0x100000000', token.INT_HEX],
        ['0x53e2d6238da3', token.INT_HEX],
        ['0x346dc5d638865', token.INT_HEX],
        ['0x20c49ba5e353f7', token.INT_HEX],
        ['0x147ae147ae147ae', token.INT_HEX],
        ['0xccccccccccccccc', token.INT_HEX],
        ['0xde0b6b3a763ffff', token.INT_HEX],
        ['0xde0b6b3a7640000', token.INT_HEX],
        ['0x7fffffffffffffff', token.INT_HEX],
        ['0x8000000000000000', token.INT_HEX],
        ['0x8ac7230335dc1bff', token.INT_HEX],
        ['0xffffffffffffffff', token.INT_HEX],
    ]);
    assertScanBigInts([
        ['0x10000000000000000', token.INT_HEX],
        ['0x10000000000000002', token.INT_HEX],
        ['0x100000000fffffffe', token.INT_HEX],
        ['0x100000000ffffffff', token.INT_HEX],
        ['0x100000000fffffffd', token.INT_HEX],
        ['0x29d42b64e76714244cb', token.INT_HEX],
    ]);
});
TEST('int/unsigned/base10', () => {
    assertScanI32s([
        ['0', token.INT],
        ['1', token.INT],
        ['123', token.INT],
        ['4294967295', token.INT],
    ]);
    assertScanI64s([
        ['4294967296', token.INT],
        ['92233720368547', token.INT],
        ['922337203685477', token.INT],
        ['9223372036854775', token.INT],
        ['92233720368547758', token.INT],
        ['922337203685477580', token.INT],
        ['999999999999999999', token.INT],
        ['1000000000000000000', token.INT],
        ['9223372036854775807', token.INT],
        ['9223372036854775808', token.INT],
        ['9999999994294967295', token.INT],
        ['10000000000000000000', token.INT],
        ['10000000009999999999', token.INT],
        ['9999999999999999999', token.INT],
        ['9999999999800000000', token.INT],
        ['18446744073709551615', token.INT],
    ]);
    assertScanBigInts([
        ['18446744073709551616', token.INT],
        ['18446744073709551618', token.INT],
        ['18446744078004518910', token.INT],
        ['18446744078004518911', token.INT],
        ['18446744078004518909', token.INT],
        ['90000000000000000000', token.INT],
        ['20000000000000000000', token.INT],
        ['22222222222222222222', token.INT],
        ['99999999999999999999', token.INT],
        ['12345678901234567890123', token.INT],
        ['99999999999999999999999999999999999', token.INT],
    ]);
});
TEST('int/unsigned/base8', () => {
    assertScanI32s([
        ['0o0', token.INT_OCT],
        ['0o1', token.INT_OCT],
        ['0o123', token.INT_OCT],
        ['0o4671', token.INT_OCT],
        ['0o37777777777', token.INT_OCT],
    ]);
    assertScanI64s([
        ['0o40000000000', token.INT_OCT],
        ['0o2476132610706643', token.INT_OCT],
        ['0o32155613530704145', token.INT_OCT],
        ['0o406111564570651767', token.INT_OCT],
        ['0o5075341217270243656', token.INT_OCT],
        ['0o63146314631463146314', token.INT_OCT],
        ['0o67405553164730777777', token.INT_OCT],
        ['0o67405553164731000000', token.INT_OCT],
        ['0o777777777777777777777', token.INT_OCT],
        ['0o1000000000000000000000', token.INT_OCT],
        ['0o1053071060146567015777', token.INT_OCT],
        ['0o1777777777777777777777', token.INT_OCT],
    ]);
    assertScanBigInts([
        ['0o2000000000000000000000', token.INT_OCT],
        ['0o2000000000037777777776', token.INT_OCT],
        ['0o2000000000037777777777', token.INT_OCT],
        ['0o2000000000037777777775', token.INT_OCT],
        ['0o7777777777777777777777', token.INT_OCT],
        ['0o10000000000000000000000', token.INT_OCT],
        ['0o2472412662347316120442313', token.INT_OCT],
    ]);
});
TEST('int/unsigned/base2', () => {
    assertScanI32s([
        ['0b0', token.INT_BIN],
        ['0b1', token.INT_BIN],
        ['0b100', token.INT_BIN],
        ['0b111', token.INT_BIN],
        ['0b10101', token.INT_BIN],
        ['0b11111111111111111111111111111111', token.INT_BIN],
    ]);
    assertScanI64s([
        ['0b100000000000000000000000000000000',
            token.INT_BIN],
        ['0b10100111110001011010110001000111000110110100011',
            token.INT_BIN],
        ['0b11010001101101110001011101011000111000100001100101',
            token.INT_BIN],
        ['0b100000110001001001101110100101111000110101001111110111',
            token.INT_BIN],
        ['0b101000111101011100001010001111010111000010100011110101110',
            token.INT_BIN],
        ['0b110011001100110011001100110011001100110011001100110011001100',
            token.INT_BIN],
        ['0b110111100000101101101011001110100111011000111111111111111111',
            token.INT_BIN],
        ['0b110111100000101101101011001110100111011001000000000000000000',
            token.INT_BIN],
        ['0b111111111111111111111111111111111111111111111111111111111111111',
            token.INT_BIN],
        ['0b1000000000000000000000000000000000000000000000000000000000000000',
            token.INT_BIN],
        ['0b1000101011000111001000110000001100110101110111000001101111111111',
            token.INT_BIN],
        ['0b1111111111111111111111111111111111111111111111111111111111111111',
            token.INT_BIN],
    ]);
    assertScanBigInts([
        ['0b10000000000000000000000000000000000000000000000000000000000000000',
            token.INT_BIN],
        ['0b10000000000000000000000000000000011111111111111111111111111111110',
            token.INT_BIN],
        ['0b10000000000000000000000000000000011111111111111111111111111111111',
            token.INT_BIN],
        ['0b10000000000000000000000000000000011111111111111111111111111111101',
            token.INT_BIN],
        [
            '0b10100111010100001010110110010011100111011001110001010000100100010011001011',
            token.INT_BIN
        ],
    ]);
});
TEST('int/signed/base16', () => {
    assertScanI32s([
        ['-0x0', token.INT_HEX],
        ['+0x0', token.INT_HEX],
        ['-0x1', token.INT_HEX],
        ['+0x12c', token.INT_HEX],
        ['-0x12c', token.INT_HEX],
        ['+0xaff', token.INT_HEX],
        ['-0xaff', token.INT_HEX],
        ['-0x80000000', token.INT_HEX],
        ['+0x7fffffff', token.INT_HEX],
    ]);
    assertScanI64s([
        ['-0x80000001', token.INT_HEX],
        ['+0x80000000', token.INT_HEX],
        ['-0x100000000', token.INT_HEX],
        ['-0x1000000000000000', token.INT_HEX],
        ['+0x1000000000000000', token.INT_HEX],
        ['-0xfffffffffffffff', token.INT_HEX],
        ['+0xfffffffffffffff', token.INT_HEX],
        ['-0x7fffffffffffffff', token.INT_HEX],
        ['-0x8000000000000000', token.INT_HEX],
        ['+0x7fffffffffffffff', token.INT_HEX],
    ]);
    assertScanBigInts([
        ['-0x8000000000000001', token.INT_HEX],
        ['-0x8000000000000002', token.INT_HEX],
        ['+0x8000000000000000', token.INT_HEX],
        ['+0x8000000000000001', token.INT_HEX],
        ['+0xffffffffffffffff', token.INT_HEX],
        ['-0xffffffffffffffff', token.INT_HEX],
        ['+0x1000000000000000f', token.INT_HEX],
        ['-0x1000000000000000f', token.INT_HEX],
        ['+0xcacacacacaccacacacacac', token.INT_HEX],
    ]);
});
TEST('int/signed/base10', () => {
    assertScanI32s([
        ['-1', token.INT],
        ['+1', token.INT],
        ['-0', token.INT],
        ['+0', token.INT],
        ['-123', token.INT],
        ['+123', token.INT],
        ['-987', token.INT],
        ['-2147483648', token.INT],
        ['+2147483647', token.INT],
    ]);
    assertScanI64s([
        ['-2147483649', token.INT],
        ['+2147483648', token.INT],
        ['-10000000000', token.INT],
        ['-92233720368547', token.INT],
        ['-9223372036854775807', token.INT],
        ['-9223372036854775808', token.INT],
        ['+9223372036854775807', token.INT],
    ]);
    assertScanBigInts([
        ['-9223372036854775809', token.INT],
        ['+9223372036854775808', token.INT],
        ['-9999999999999999999', token.INT],
        ['+9999999999999999999', token.INT],
        ['-999999999999999999999999', token.INT],
        ['+999999999999999999999999', token.INT],
    ]);
});
TEST('int/signed/base8', () => {
    assertScanI32s([
        ['-0o1', token.INT_OCT],
        ['+0o1', token.INT_OCT],
        ['-0o0', token.INT_OCT],
        ['+0o0', token.INT_OCT],
        ['-0o173', token.INT_OCT],
        ['+0o173', token.INT_OCT],
        ['-0o1467', token.INT_OCT],
        ['-0o20000000000', token.INT_OCT],
        ['+0o17777777777', token.INT_OCT],
    ]);
    assertScanI64s([
        ['-0o20000000001', token.INT_OCT],
        ['+0o20000000000', token.INT_OCT],
        ['+0o651341234707', token.INT_OCT],
        ['-0o777777777777777777777', token.INT_OCT],
        ['-0o1000000000000000000000', token.INT_OCT],
        ['+0o777777777777777777777', token.INT_OCT],
    ]);
    assertScanBigInts([
        ['-0o1000000000000000000001', token.INT_OCT],
        ['+0o1000000000000000000000', token.INT_OCT],
        ['+0o1000000000000000000001', token.INT_OCT],
        ['+0o7777777777777777777777', token.INT_OCT],
        ['+0o10000000000000000000000', token.INT_OCT],
        ['-0o10000000000000000000000', token.INT_OCT],
        ['-0o12345671234567123456712345', token.INT_OCT],
    ]);
});
TEST('int/signed/base2', () => {
    assertScanI32s([
        ['-0b1', token.INT_BIN],
        ['+0b1', token.INT_BIN],
        ['-0b0', token.INT_BIN],
        ['+0b0', token.INT_BIN],
        ['-0b110', token.INT_BIN],
        ['+0b110', token.INT_BIN],
        ['-0b111001', token.INT_BIN],
        ['-0b10000000000000000000000000000000', token.INT_BIN],
        ['+0b1111111111111111111111111111111', token.INT_BIN],
    ]);
    assertScanI64s([
        ['-0b10000000000000000000000000000001', token.INT_BIN],
        ['+0b10000000000000000000000000000000', token.INT_BIN],
        ['+0b110101010101010101010101010101010', token.INT_BIN],
        ['+0b1101111110000001111111000001111111', token.INT_BIN],
        ['-0b111111111111111111111111111111111111111111111111111111111111111',
            token.INT_BIN],
        ['-0b1000000000000000000000000000000000000000000000000000000000000000',
            token.INT_BIN],
        ['+0b111111111111111111111111111111111111111111111111111111111111111',
            token.INT_BIN],
    ]);
    assertScanBigInts([
        ['-0b1000000000000000000000000000000000000000000000000000000000000001',
            token.INT_BIN],
        ['+0b1000000000000000000000000000000000000000000000000000000000000000',
            token.INT_BIN],
        ['-0b10000000000000000000000000000000000000000000000000000000000000000',
            token.INT_BIN],
        ['+0b10000000000000000000000000000000000000000000000000000000000000000',
            token.INT_BIN],
        ['-0b11111111111111111111111111111111111111111111111111111111111111111111',
            token.INT_BIN],
        ['+0b11111111111111111111111111111111111111111111111111111111111111111111',
            token.INT_BIN],
    ]);
});
TEST('int/neg-base10-quickcheck', () => {
    function negI64Gen(i) {
        return '-9223372036854775' + (i >= 0 ? i.toString() : '');
    }
    quickcheck([-1, 808], i => {
        let src = negI64Gen(i);
        let s = sourceScanner(src);
        s.next();
        return (s.tok == token.INT &&
            isNaN(s.int32val) &&
            s.int64val != null &&
            s.int64val.toString() === src);
    });
    quickcheck([809, 10000], i => {
        let src = negI64Gen(i);
        let s = sourceScanner(src);
        s.next();
        return (s.tok == token.INT &&
            isNaN(s.int32val) &&
            s.int64val == null);
    });
});
TEST('float', () => {
    assertScanF64s([
        '1.0',
        '0.',
        '0.0',
        '72.40',
        '072.40',
        '2.71828',
        '1.e+0',
        '6.67428e-11',
        '1E6',
        '.25',
        '.12345E+5',
    ]);
    assertScanF64s([
        '-1.0',
        '-0.',
        '-0.0',
        '-72.40',
        '-072.40',
        '-2.71828',
        '-1.e+0',
        '-6.67428e-11',
        '-1E6',
        '-.25',
        '-.12345E+5',
    ]);
    assertScanF64s([
        '+1.0',
        '+0.',
        '+0.0',
        '+72.40',
        '+072.40',
        '+2.71828',
        '+1.e+0',
        '+6.67428e-11',
        '+1E6',
        '+.25',
        '+.12345E+5',
    ]);
});
//# sourceMappingURL=scan_num_test.js.map

function uintpairs(s) {
    return s
        .trim()
        .split(/[\n;]+/)
        .map(s => s.trim())
        .filter(s => s.length)
        .map(uints);
}
function uints(s) {
    return s.trim().split(/\s+/).map(v => Number(v) >>> 0);
}
let samples = {
    nodes: uints(`1 2 3 4 5 6 7 8   10 11 12 13 14    16 17 18 19 20 21 22
     23 24 25 26 27 28
     210 211 212 213 214     216 217 218 219 220
    `),
    holes: uints(` 9 15 30 40 50 60 120 123 215 `),
    edges: uintpairs(`
    2 1
    3 2 ; 3 1
    4 2 ; 4 1
    5 4 ; 5 2
    6 4 ; 6 1
    7 4 ; 7 2 ; 7 6
    8 4 ; 8 7
    10 4 ; 10 8 ; 10 7
    11 4 ; 11 8
    12 4 ; 12 7
    13 4 ; 13 8 ; 13 12 ; 13 1 ; 13 2 ; 13 26 ; 13 218
    14 13 ; 14 4
    16 14 ; 16 13 ; 16 4
    17 14
    18 13
    19 14 ; 19 18
    20 19

    22  21
    23  22  ; 23  21
    24  22  ; 24  21
    25  24  ; 25  22
    26  24  ; 26  21
    27  24  ; 27  22  ; 27 26
    28  24  ; 28  27
    210 24  ; 210 28  ; 210 27 ; 210 5 ; 210 2 ; 210 3 ; 210 25
    211 24  ; 211 28
    212 24  ; 212 27
    213 24  ; 213 28  ; 213 212
    214 213 ; 214 24
    216 214 ; 216 213 ; 216 24
    217 214
    218 213
    219 214 ; 219 218
    220 219
  `)
};
TEST('general', () => {
    let g = new IntGraph();
    for (let id of samples.nodes) {
        g.add(id);
    }
    let maxid = 0;
    for (let id of samples.nodes) {
        assert(g.has(id), `g.has(${id})`);
        maxid = Math.max(maxid, id);
    }
    for (let id of samples.holes) {
        assert(!g.has(id), `!g.has(/* hole */ ${id})`);
    }
    for (let id of samples.nodes) {
        assert(!g.has(id + maxid + 1), `!g.has(${id + maxid + 1})`);
        assert(!g.has(id - maxid - 1), `!g.has(${id - maxid - 1})`);
    }
    let connections = new Map();
    for (let e of samples.edges) {
        g.connect(e[0], e[1]);
        let s0 = connections.get(e[0]);
        if (s0) {
            s0.add(e[1]);
        }
        else {
            connections.set(e[0], new Set([e[1]]));
        }
        let s1 = connections.get(e[1]);
        if (s1) {
            s1.add(e[0]);
        }
        else {
            connections.set(e[1], new Set([e[0]]));
        }
    }
    for (let id of samples.nodes) {
        let expectedDegree = connections.get(id) ? connections.get(id).size : 0;
        assert(g.degree(id) == expectedDegree, `g.degree(${id}) = ${g.degree(id)} = ${expectedDegree}`);
    }
    for (let e of samples.edges) {
        assert(g.connected(e[0], e[1]), `g.connected(${e[0]}, ${e[1]})`);
        assert(g.connected(e[1], e[0]), `g.connected(${e[1]}, ${e[0]})`);
    }
    for (let id1 of samples.nodes) {
        let expectedEdges = connections.get(id1);
        for (let id2 of samples.nodes) {
            let isConnected = g.connected(id1, id2);
            if (expectedEdges && expectedEdges.has(id2)) {
                assert(isConnected, `g.connected(${id1}, ${id2})`);
            }
            else {
                assert(!isConnected, `!g.connected(${id1}, ${id2})`);
            }
        }
    }
    let removed = new Set();
    for (let id of samples.nodes) {
        g.remove(id);
        removed.add(id);
        assert(!g.has(id), `!g.has(${id}) after removing it`);
        for (let [id1, id2] of samples.edges) {
            let isconn1 = g.connected(id1, id2);
            let isconn2 = g.connected(id2, id1);
            if (removed.has(id1)) {
                assert(!isconn1, `g.connected(${id1}, ${id2}) even though ${id1} has been removed`);
                assert(!isconn2, `g.connected(${id2}, ${id1}) even though ${id1} has been removed`);
            }
            else if (removed.has(id2)) {
                assert(!isconn1, `g.connected(${id1}, ${id2}) even though ${id2} has been removed`);
                assert(!isconn2, `g.connected(${id2}, ${id1}) even though ${id2} has been removed`);
            }
            else {
                assert(isconn1, `g.connected(${id1}, ${id2})`);
                assert(isconn2, `g.connected(${id2}, ${id1})`);
            }
        }
    }
});
//# sourceMappingURL=intgraph_test.js.map

//# sourceMappingURL=all_tests.js.map

let readFileSync;
let isNodeJsLikeEnv = false;
try {
    const _readFileSync = require('fs').readFileSync;
    readFileSync = _readFileSync;
    isNodeJsLikeEnv = true;
}
catch (_) {
    let global_readFileSync = global['readFileSync'];
    if (global_readFileSync && typeof global_readFileSync == 'function') {
        readFileSync = global_readFileSync;
    }
    else {
        readFileSync = (fn, options) => {
            console.log('TODO read', fn, 'options:', options);
            return new Uint8Array(0);
        };
    }
}
const reprOptions = { colors: stdoutSupportsStyle };
let diagnostics;
function errh(pos, message, errcode) {
    if (isNodeJsLikeEnv) {
        let msg = `${pos}: ${message} (${errcode})`;
        console.error(stdoutStyle.red(msg));
    }
    diagnostics.push({ type: 'error', errcode, message, pos });
}
function diagh(pos, message, type) {
    if (isNodeJsLikeEnv) {
        const msg = `${pos}: ${type}: ${message}`;
        console.log('[diag] ' +
            (type == "info" ? stdoutStyle.cyan(msg) :
                stdoutStyle.lightyellow(msg)));
    }
    diagnostics.push({ type, message, pos });
}
function parsePkg(name, sources, universe, parser, typeres) {
    const pkg = new Package(name, new Scope(universe.scope));
    const fset = new SrcFileSet();
    typeres.init(fset, universe, errh);
    for (let filename of sources) {
        if (isNodeJsLikeEnv) {
            banner(`parse ${filename}`);
        }
        const sdata = readFileSync(filename, { flag: 'r' });
        const sfile = fset.addFile(filename, sdata.length);
        parser.initParser(sfile, sdata, universe, pkg.scope, typeres, errh, diagh, Mode.ScanComments);
        const file = parser.parseFile();
        pkg.files.push(file);
        if (isNodeJsLikeEnv) {
            if (file.imports) {
                console.log(`${file.imports.length} imports`);
                for (let imp of file.imports) {
                    console.log(astRepr(imp, reprOptions));
                }
            }
            if (file.unresolved) {
                console.log(`${file.unresolved.size} unresolved references`);
                for (let ident of file.unresolved) {
                    console.log(' - ' + astRepr(ident, reprOptions));
                }
            }
            console.log(`${file.decls.length} declarations`);
            console.log(astRepr(file, reprOptions));
        }
    }
    if (parser.errorCount > 0 || typeres.errorCount > 0) {
        return Promise.resolve({ pkg, success: false });
    }
    if (isNodeJsLikeEnv) {
        banner(`bind & assemble ${pkg}`);
    }
    function importer(_imports, _path) {
        return Promise.reject(new Error(`not found`));
    }
    return bindpkg(pkg, fset, importer, typeres, errh)
        .then(hasErrors => ({ pkg, success: !hasErrors }));
}
async function main(options) {
    const strSet = new ByteStrSet();
    const typeSet = new TypeSet();
    const universe = new Universe(strSet, typeSet);
    const typeres = new TypeResolver();
    const parser = new Parser();
    options = options || {};
    const _sources = (options.sources && options.sources.length ? options.sources :
        ['example/ssa1.xl']);
    diagnostics = [];
    let r = await parsePkg("example", _sources, universe, parser, typeres);
    if (!r.success) {
        return { success: false, diagnostics, ast: r.pkg };
    }
    if (options.noIR) {
        return { success: true, diagnostics, ast: r.pkg };
    }
    console.log('available target archs:', Object.keys(archs).join(', '));
    const arch = archs['covm'];
    const config = arch.config({
        optimize: !options.noOptimize,
    });
    console.log(`selected target config: ${config}`);
    const irb = new IRBuilder();
    irb.init(config, diagh, IRBuilderFlags.Comments);
    try {
        for (let file of r.pkg.files) {
            if (isNodeJsLikeEnv) {
                banner(`${r.pkg} ${file.sfile.name} ${file.decls.length} declarations`);
                console.log(astRepr(r.pkg, reprOptions));
                banner(`ssa-ir ${file.sfile.name}`);
            }
            let sfile = file.sfile;
            for (let d of file.decls) {
                let fn = irb.addTopLevel(sfile, d);
                if (isNodeJsLikeEnv && fn) {
                    console.log(`\n-----------------------\n`);
                    printir(fn);
                }
            }
            let stopAtPass = options.genericIR ? "lower" : "";
            for (let [_, f] of irb.pkg.funs) {
                runPassesDev(f, config, stopAtPass, pass => {
                    if (isNodeJsLikeEnv) {
                        console.log(`------------------------------------------------\n` +
                            `after ${pass.name}\n`);
                        printir(f);
                        console.log(`------------------------------------------------`);
                    }
                });
            }
        }
        return {
            success: true,
            diagnostics,
            ast: r.pkg,
            ir: irb.pkg,
        };
    }
    catch (error) {
        if (isNodeJsLikeEnv) {
            throw error;
        }
        return { success: false, error, diagnostics, ast: r.pkg };
    }
}
function banner(message) {
    if (stdoutSupportsStyle) {
        const s = (s) => '\x1b[40m' + stdoutStyle.white(s) + '\x1b[0m';
        process.stdout.write(s('\n\n  ' + message + '\n') + '\n\n');
    }
    else {
        console.log('\n========================================================\n' +
            message +
            '\n--------------------------------------------------------');
    }
}
if (typeof global.runAllTests == 'function') {
    global.runAllTests();
}
if (isNodeJsLikeEnv) {
    if (process.argv.includes('-test-only')) {
        console.log('only running unit tests');
    }
    else {
        main({
            sources: process.argv.slice(2).filter(v => !v.startsWith('-')),
            noOptimize: process.argv.includes('-no-optimize'),
        }).catch(err => {
            console.error(err.stack || '' + err);
            process.exit(1);
        });
    }
}
else {
    global['colang'] = {
        main,
        fmtast: astRepr,
        fmtir,
        printir,
    };
}
//# sourceMappingURL=main.js.map
})(typeof exports != "undefined" ? exports : this);
//# sourceMappingURL=xlang.debug.js.map
