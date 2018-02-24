/* xlang 1.0.0-debug */

'use strict';

var VERSION = "1.0.0-debug", DEBUG = true;
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
if("undefined"==typeof process)




{


throw(e=new Error("assertion failure: "+(msg||cond))).name="AssertionError",e}var e;_stackTrace(cons);console.error("assertion failure:",msg||cond),console.error(_stackTrace(cons)),exit(3)}}





function repr(obj){

try{
return JSON.stringify(obj)}
catch(_){
return String(obj)}}



function TEST(){}

var allTests=[];
TEST=((name,f)=>{
void 0===f&&

(name=(f=name).name||"?");

let e=new Error,srcloc="?";
if(e.stack){
let sf=e.stack.split(/\n/,3)[2],
m=/\s+\(.+\/(src\/.+)\)$/.exec(sf);
m&&
(srcloc=m[1])}


allTests.push({f,name,srcloc})});

var runAllTests=function(){
for(let i=0;i<allTests.length;++i){
let t=allTests[i];
console.log(`[TEST] ${t.name}${t.srcloc?" "+t.srcloc:""}`),
t.f()}};


"undefined"!=typeof process&&process.nextTick?
process.nextTick(runAllTests):

setTimeout(runAllTests,0);

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

function tokstr(t) {
    return tokenStrings.get(t) || token[t].toLowerCase();
}
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
    token[token["literal_int_beg"] = 6] = "literal_int_beg";
    token[token["INT"] = 7] = "INT";
    token[token["INT_BIN"] = 8] = "INT_BIN";
    token[token["INT_OCT"] = 9] = "INT_OCT";
    token[token["INT_HEX"] = 10] = "INT_HEX";
    token[token["literal_int_end"] = 11] = "literal_int_end";
    token[token["FLOAT"] = 12] = "FLOAT";
    token[token["RATIO"] = 13] = "RATIO";
    token[token["CHAR"] = 14] = "CHAR";
    token[token["STRING"] = 15] = "STRING";
    token[token["STRING_MULTI"] = 16] = "STRING_MULTI";
    token[token["STRING_PIECE"] = 17] = "STRING_PIECE";
    token[token["literal_end"] = 18] = "literal_end";
    token[token["delim_beg"] = 19] = "delim_beg";
    token[token["LPAREN"] = 20] = "LPAREN";
    token[token["LBRACKET"] = 21] = "LBRACKET";
    token[token["LBRACE"] = 22] = "LBRACE";
    token[token["COMMA"] = 23] = "COMMA";
    token[token["DOT"] = 24] = "DOT";
    token[token["PERIODS"] = 25] = "PERIODS";
    token[token["ELLIPSIS"] = 26] = "ELLIPSIS";
    token[token["RPAREN"] = 27] = "RPAREN";
    token[token["RBRACKET"] = 28] = "RBRACKET";
    token[token["RBRACE"] = 29] = "RBRACE";
    token[token["SEMICOLON"] = 30] = "SEMICOLON";
    token[token["COLON"] = 31] = "COLON";
    token[token["delim_end"] = 32] = "delim_end";
    token[token["operator_beg"] = 33] = "operator_beg";
    token[token["ASSIGN"] = 34] = "ASSIGN";
    token[token["assignop_beg"] = 35] = "assignop_beg";
    token[token["ADD_ASSIGN"] = 36] = "ADD_ASSIGN";
    token[token["SUB_ASSIGN"] = 37] = "SUB_ASSIGN";
    token[token["MUL_ASSIGN"] = 38] = "MUL_ASSIGN";
    token[token["QUO_ASSIGN"] = 39] = "QUO_ASSIGN";
    token[token["REM_ASSIGN"] = 40] = "REM_ASSIGN";
    token[token["AND_ASSIGN"] = 41] = "AND_ASSIGN";
    token[token["OR_ASSIGN"] = 42] = "OR_ASSIGN";
    token[token["XOR_ASSIGN"] = 43] = "XOR_ASSIGN";
    token[token["SHL_ASSIGN"] = 44] = "SHL_ASSIGN";
    token[token["SHR_ASSIGN"] = 45] = "SHR_ASSIGN";
    token[token["AND_NOT_ASSIGN"] = 46] = "AND_NOT_ASSIGN";
    token[token["assignop_end"] = 47] = "assignop_end";
    token[token["INC"] = 48] = "INC";
    token[token["DEC"] = 49] = "DEC";
    token[token["SET_ASSIGN"] = 50] = "SET_ASSIGN";
    token[token["NOT"] = 51] = "NOT";
    token[token["ARROWL"] = 52] = "ARROWL";
    token[token["ARROWR"] = 53] = "ARROWR";
    token[token["cmpop_beg"] = 54] = "cmpop_beg";
    token[token["OROR"] = 55] = "OROR";
    token[token["ANDAND"] = 56] = "ANDAND";
    token[token["EQL"] = 57] = "EQL";
    token[token["NEQ"] = 58] = "NEQ";
    token[token["LSS"] = 59] = "LSS";
    token[token["LEQ"] = 60] = "LEQ";
    token[token["GTR"] = 61] = "GTR";
    token[token["GEQ"] = 62] = "GEQ";
    token[token["cmpop_end"] = 63] = "cmpop_end";
    token[token["ADD"] = 64] = "ADD";
    token[token["SUB"] = 65] = "SUB";
    token[token["OR"] = 66] = "OR";
    token[token["XOR"] = 67] = "XOR";
    token[token["MUL"] = 68] = "MUL";
    token[token["QUO"] = 69] = "QUO";
    token[token["REM"] = 70] = "REM";
    token[token["AND"] = 71] = "AND";
    token[token["AND_NOT"] = 72] = "AND_NOT";
    token[token["SHL"] = 73] = "SHL";
    token[token["SHR"] = 74] = "SHR";
    token[token["operator_end"] = 75] = "operator_end";
    token[token["keyword_beg"] = 76] = "keyword_beg";
    token[token["BREAK"] = 77] = "BREAK";
    token[token["CONTINUE"] = 78] = "CONTINUE";
    token[token["DEFAULT"] = 79] = "DEFAULT";
    token[token["DEFER"] = 80] = "DEFER";
    token[token["ELSE"] = 81] = "ELSE";
    token[token["ENUM"] = 82] = "ENUM";
    token[token["FALLTHROUGH"] = 83] = "FALLTHROUGH";
    token[token["FOR"] = 84] = "FOR";
    token[token["FUN"] = 85] = "FUN";
    token[token["GO"] = 86] = "GO";
    token[token["IF"] = 87] = "IF";
    token[token["IMPORT"] = 88] = "IMPORT";
    token[token["INTERFACE"] = 89] = "INTERFACE";
    token[token["IN"] = 90] = "IN";
    token[token["RETURN"] = 91] = "RETURN";
    token[token["SELECT"] = 92] = "SELECT";
    token[token["SWITCH"] = 93] = "SWITCH";
    token[token["SYMBOL"] = 94] = "SYMBOL";
    token[token["TYPE"] = 95] = "TYPE";
    token[token["WHILE"] = 96] = "WHILE";
    token[token["keyword_end"] = 97] = "keyword_end";
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
    return Uint8Array.from(s, (v, k) => s.charCodeAt(k));
}

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
} : function (...v) { };
//# sourceMappingURL=util.js.map

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
const InvalidChar = 0xFFFD;
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
TEST("path.dir", () => {
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
TEST("path.clean", () => {
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
TEST("path.isAbs", () => {
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
TEST("path.join", () => {
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
        this.pos = 0;
        this.startoffs = 0;
        this.endoffs = 0;
        this.tok = token.EOF;
        this.prec = prec.LOWEST;
        this.intval = 0;
        this.hash = 0;
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
            const ch = s.ch;
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
                    s.scanNumber(ch);
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
                        s.scanFloatNumber(true);
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
                    else {
                        if (s.gotchar(0x3D)) {
                            s.tok = token.SUB_ASSIGN;
                        }
                        else if (s.gotchar(ch)) {
                            s.tok = token.DEC;
                            insertSemi = true;
                        }
                        else {
                            s.tok = token.SUB;
                            s.prec = prec.ADD;
                        }
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
        switch (s.ch) {
            case -1:
            case 0xA: {
                s.error("unterminated character literal");
                s.tok = token.ILLEGAL;
                return;
            }
            case 0x27: {
                s.error("empty character literal or unescaped ' in character literal");
                s.readchar();
                s.intval = InvalidChar;
                return;
            }
            case 0x5c: {
                s.readchar();
                cp = s.scanEscape(0x27);
                break;
            }
            default: {
                cp = s.ch;
                s.readchar();
                break;
            }
        }
        if (s.ch == 0x27) {
            s.readchar();
            s.intval = cp;
        }
        else {
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
            s.intval = InvalidChar;
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
                break;
            case 0x55:
                s.readchar();
                n = 8;
                base = 16;
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
        return cp;
    }
    scanNumber(c) {
        let s = this;
        if (c == 0x30) {
            switch (s.ch) {
                case 0x78:
                case 0x58: {
                    s.tok = token.INT_HEX;
                    s.readchar();
                    while (isHexDigit(s.ch)) {
                        s.readchar();
                    }
                    if (s.offset - s.startoffs <= 2 || isLetter$1(s.ch)) {
                        while (isLetter$1(s.ch) || isDigit$1(s.ch)) {
                            s.readchar();
                        }
                        s.error("invalid hex number");
                    }
                    return;
                }
                case 0x6F:
                case 0x4F:
                    s.tok = token.INT_OCT;
                    return s.scanRadixInt8(8);
                case 0x62:
                case 0x42:
                    s.tok = token.INT_BIN;
                    return s.scanRadixInt8(2);
                case 0x2e:
                case 0x65:
                case 0x45:
                    return s.scanFloatNumber(false);
                case 0x2f:
                    if (s.scanRatioNumber()) {
                        s.error("invalid zero ratio");
                        return;
                    }
                    break;
            }
        }
        while (isDigit$1(s.ch)) {
            s.readchar();
        }
        s.tok = token.INT;
        switch (s.ch) {
            case 0x2e:
            case 0x65:
            case 0x45:
                s.scanFloatNumber(false);
                break;
            case 0x2f:
                s.scanRatioNumber();
                break;
        }
    }
    scanRadixInt8(base) {
        const s = this;
        s.readchar();
        let isInvalid = false;
        while (isDigit$1(s.ch)) {
            if (s.ch - 0x30 >= base) {
                isInvalid = true;
            }
            s.readchar();
        }
        if (isInvalid || s.offset - s.startoffs <= 2) {
            s.error(`invalid ${base == 8 ? "octal" : "binary"} number`);
        }
    }
    scanRatioNumber() {
        const s = this;
        const startoffs = s.offset;
        s.readchar();
        while (isDigit$1(s.ch)) {
            s.readchar();
        }
        if (startoffs + 1 == s.offset) {
            s.ch = 0x2f;
            s.offset = startoffs;
            s.rdOffset = s.offset + 1;
            return false;
        }
        if (s.ch == 0x2e) {
            s.error("invalid ratio");
        }
        s.tok = token.RATIO;
        return true;
    }
    scanFloatNumber(seenDecimal) {
        const s = this;
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
            while (isDigit$1(s.ch)) {
                valid = true;
                s.readchar();
            }
            if (!valid) {
                s.error("invalid floating-point exponent");
            }
        }
        s.tok = token.FLOAT;
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
function isHexDigit(c) {
    return ((0x30 <= c && c <= 0x39) ||
        (0x41 <= c && c <= 0x46) ||
        (0x61 <= c && c <= 0x66));
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

function strtou(b, base, offs = 0) {
    assert(base >= 2);
    assert(base <= 36);
    var end = b.length;
    var acc = 0;
    var any = 0;
    var cutoff = Math.floor(Number.MAX_SAFE_INTEGER / base);
    var cutlim = Number.MAX_SAFE_INTEGER % base;
    var i = offs, c = 0;
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
        if (any < 0 || acc > cutoff || (acc == cutoff && c > cutlim)) {
            any = -1;
        }
        else {
            any = 1;
            acc = (acc * base) + c;
        }
        i++;
    }
    return ((any < 0 ||
        any == 0) ? -1 :
        acc);
}
TEST("strtou", () => {
    function t(input, base, expect) {
        let buf = Uint8Array.from(input, (v, k) => input.charCodeAt(k));
        let output = strtou(buf, base);
        assert(output === expect, `strtou32("${input}", ${base}) => ${output}; expected ${expect}`);
    }
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
    constructor(name, decl, value, data = null, type = null) {
        this.name = name;
        this.decl = decl;
        this.value = value;
        this.data = data;
        this.type = type;
        this.writes = 0;
        this.nreads = 0;
    }
    getTypeExpr() {
        return ((this.decl && (this.decl instanceof Field ||
            this.decl instanceof VarDecl) && this.decl.type) ||
            (this.value && this.value.type) ||
            this.value);
    }
    get isConstant() {
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
}
class BadExpr extends Expr {
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
        this.index = index;
        this.indexv = -1;
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
    }
    toString() {
        return `${this.operand}[${this.start || ''}:${this.end || ''}]`;
    }
}
class RestExpr extends Expr {
    constructor(pos, scope, expr) {
        super(pos, scope);
        this.expr = expr;
    }
}
class LiteralExpr extends Expr {
}
class BasicLit extends LiteralExpr {
    constructor(pos, scope, kind, value, op = token.ILLEGAL) {
        super(pos, scope);
        this.kind = kind;
        this.value = value;
        this.op = op;
    }
    toString() {
        return ((this.op != token.ILLEGAL ? tokstr(this.op) : '') +
            decodeToString(this.value));
    }
    isInt() {
        return (token.literal_int_beg < this.kind &&
            this.kind < token.literal_int_end);
    }
    isFloat() {
        return this.kind == token.FLOAT;
    }
    isSignedInt() {
        assert(this.isInt(), "called isSignedInt on non-integer");
        return (this.type instanceof IntType ? this.type.signed :
            this.op == token.SUB);
    }
    parseSInt() {
        let base = 0, b = this.value;
        switch (this.kind) {
            case token.INT_BIN:
                base = 2;
                b = b.subarray(2);
                break;
            case token.INT_OCT:
                base = 8;
                b = b.subarray(2);
                break;
            case token.INT:
                base = 10;
                break;
            case token.INT_HEX:
                base = 16;
                b = b.subarray(2);
                break;
            default: return -1;
        }
        var v = parseInt(String.fromCharCode.apply(null, b), base);
        return (v > Number.MAX_SAFE_INTEGER || v < Number.MIN_SAFE_INTEGER ? NaN :
            v);
    }
    parseUInt() {
        assert(this.isInt(), "calling parseUInt on a non-integer");
        if (this.op == token.SUB) {
            return -1;
        }
        let base = 0, offs = 0;
        switch (this.kind) {
            case token.INT_BIN:
                base = 2;
                offs = 2;
                break;
            case token.INT_OCT:
                base = 8;
                offs = 2;
                break;
            case token.INT:
                base = 10;
                break;
            case token.INT_HEX:
                base = 16;
                offs = 2;
                break;
            default: return -1;
        }
        return strtou(this.value, base, offs);
    }
    parseFloat() {
        assert(this.isFloat(), "called parseFloat on non-float");
        let str = String.fromCharCode.apply(null, this.value);
        let c = parseFloat(str);
        assert(!isNaN(c), `failed to parse "${str}"`);
        if (!isNaN(c) && this.op == token.SUB) {
            c = -c;
        }
        return c;
    }
}
class StringLit extends LiteralExpr {
    constructor(pos, scope, value) {
        super(pos, scope);
        this.value = value;
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
class IntrinsicVal extends Expr {
    constructor(name, type) {
        super(0, nilScope);
        this.name = name;
        this.type = type;
    }
}
class TypeConvExpr extends Expr {
    constructor(pos, scope, expr, type) {
        super(pos, scope);
        this.expr = expr;
        this.type = type;
    }
}
class Type extends Expr {
    constructor(pos, scope) {
        super(pos, scope);
        this.ent = null;
        this.type = this;
    }
    accepts(other) {
        return this.equals(other);
    }
    equals(other) {
        return this === other;
    }
}
class UnresolvedType extends Type {
    constructor(pos, scope, expr) {
        super(pos, scope);
        this.expr = expr;
        this.refs = null;
    }
    addRef(x) {
        assert(x !== this.expr);
        if (!this.refs) {
            this.refs = new Set([x]);
        }
        else {
            this.refs.add(x);
        }
    }
    toString() {
        return '~' + this.expr.toString();
    }
}
var RegType;
(function (RegType) {
    RegType[RegType["i32"] = 0] = "i32";
    RegType[RegType["i64"] = 1] = "i64";
    RegType[RegType["f32"] = 2] = "f32";
    RegType[RegType["f64"] = 3] = "f64";
})(RegType || (RegType = {}));
class BasicType extends Type {
    constructor(bitsize, regtype, name) {
        super(0, nilScope);
        this.bitsize = bitsize;
        this.regtype = regtype;
        this.name = name;
    }
    toString() {
        return this.name;
    }
    equals(other) {
        return this === other;
    }
}
class IntType extends BasicType {
    constructor(bitsize, regtype, name, signed) {
        super(bitsize, regtype, name);
        this.signed = signed;
    }
}
const uintz = 32;
const uintregtype = uintz <= 32 ? RegType.i32 : RegType.i64;
const u_t_auto = new BasicType(0, RegType.i32, 'auto');
const u_t_nil = new BasicType(0, RegType.i32, 'nil');
const u_t_bool = new BasicType(1, RegType.i32, 'bool');
const u_t_u8 = new IntType(8, RegType.i32, 'u8', false);
const u_t_i8 = new IntType(7, RegType.i32, 'i8', true);
const u_t_u16 = new IntType(16, RegType.i32, 'u16', false);
const u_t_i16 = new IntType(15, RegType.i32, 'i16', true);
const u_t_u32 = new IntType(32, RegType.i32, 'u32', false);
const u_t_i32 = new IntType(31, RegType.i32, 'i32', true);
const u_t_u64 = new IntType(64, RegType.i64, 'u64', false);
const u_t_i64 = new IntType(63, RegType.i64, 'i64', true);
const u_t_f32 = new BasicType(32, RegType.f32, 'f32');
const u_t_f64 = new BasicType(64, RegType.f64, 'f64');
const u_t_uint = new IntType(uintz, uintregtype, 'uint', false);
const u_t_int = new IntType(uintz - 1, uintregtype, 'int', true);
class StrType extends Type {
    constructor(length) {
        super(0, nilScope);
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
const u_t_str = new StrType(-1);
class RestType extends Type {
    constructor(pos, scope, type) {
        super(pos, scope);
        this.type = type;
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
    constructor(pos, scope, types) {
        super(pos, scope);
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
}
class FunType extends Type {
    constructor(pos, scope, inputs, result) {
        super(pos, scope);
        this.inputs = inputs;
        this.result = result;
    }
    equals(other) {
        return (this === other ||
            (other instanceof FunType &&
                this.inputs.length == other.inputs.length &&
                this.result.equals(other.result) &&
                this.inputs.every((t, i) => t.equals(other.inputs[i]))));
    }
}
class UnionType extends Type {
    constructor(types) {
        super(0, nilScope);
        this.types = types;
    }
    add(t) {
        assert(!(t instanceof UnionType));
        this.types.add(t);
    }
    toString() {
        let s = '(U ', first = true;
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
        super(0, nilScope);
        this.type = type;
        assert(!(type instanceof OptionalType));
        assert(!(type instanceof UnionType));
        assert(!(type instanceof BasicType));
    }
    toString() {
        return this.type.toString() + '?';
    }
    equals(other) {
        return (this === other ||
            (other instanceof OptionalType &&
                this.type.equals(other.type)));
    }
    accepts(other) {
        return (this.equals(other) ||
            this.type.equals(other) ||
            other === u_t_nil);
    }
}
const u_t_optstr = new OptionalType(u_t_str);
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
//# sourceMappingURL=ast.js.map

const kEmptyByteArray = new Uint8Array(0);
const kBytes__ = new Uint8Array([0x5f]);
const kBytes_dot = new Uint8Array([0x2e]);
const kBytes_init = new Uint8Array([0x69, 0x6e, 0x69, 0x74]);
const emptyExprList = [];
class funInfo {
    constructor(f) {
        this.f = f;
        this.autort = null;
    }
    addInferredReturnType(t) {
        if (this.autort == null) {
            this.autort = new UnionType(new Set([t]));
        }
        else {
            this.autort.add(t);
        }
    }
}
class Parser extends Scanner {
    constructor() {
        super(...arguments);
        this.fnest = 0;
        this.diagh = null;
        this.initfnest = 0;
        this.importDecl = (group) => {
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
                path = new StringLit(p.pos, p.scope, kEmptyByteArray);
                p.advanceUntil(token.SEMICOLON, token.RPAREN);
            }
            const d = new ImportDecl(p.pos, p.scope, path, localIdent);
            if (hasLocalIdent && localIdent) {
                p.declare(p.filescope, localIdent, d, null);
            }
            return d;
        };
        this.typeDecl = (group, nth) => {
            const p = this;
            const pos = p.pos;
            const ident = p.ident();
            const alias = p.got(token.ASSIGN);
            let t = p.maybeType();
            if (!t) {
                t = p.bad();
                p.syntaxError("in type declaration");
                p.advanceUntil(token.SEMICOLON, token.RPAREN);
            }
            const d = new TypeDecl(pos, p.scope, ident, alias, t, group);
            return d;
        };
        this.basicLitErrH = (msg, pos) => {
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
        if (x.value === p._id__) {
            return x;
        }
        let s = x.scope;
        while (s) {
            const ent = s.lookupImm(x.value);
            if (ent) {
                x.refEnt(ent);
                if (!x.type) {
                    const tx = ent.getTypeExpr();
                    x.type = tx ? p.types.resolve(tx) : null;
                    if (!x.type) {
                        x.type = p.types.markUnresolved(x);
                    }
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
        const sig = p.funSig(isInitFun ? u_t_nil : u_t_auto);
        const f = new FunExpr(pos, p.scope, name, sig, isInitFun);
        if (isInitFun) {
            if (sig.params.length > 0) {
                p.syntaxError(`init function with parameters`, sig.pos);
            }
            if (sig.result !== u_t_nil) {
                p.syntaxError(`init function with result`, sig.pos);
            }
        }
        else {
            if (sig.result !== u_t_auto) {
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
                let lastindex = f.body.list.length - 1;
                let result = f.body.list[lastindex];
                if (result instanceof Expr) {
                    let rettype = p.types.resolve(result);
                    let ret = new ReturnStmt(result.pos, result.scope, result, rettype);
                    f.body.list[lastindex] = ret;
                }
            }
            if (sig.result === u_t_auto) {
                if (fi.autort == null) {
                    sig.result = p.types.resolve(f.body);
                }
                else if (fi.autort.types.size == 1) {
                    sig.result = fi.autort.types.values().next().value;
                }
                else {
                    sig.result = fi.autort;
                }
            }
        }
        else {
            if (sig.result == u_t_auto) {
                sig.result = u_t_nil;
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
        let seenRestExpr = false;
        const paramsPos = p.pos;
        const fields = [];
        const scope = p.scope;
        while (p.tok != token.RPAREN) {
            let pos = p.pos;
            let typ = u_t_auto;
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
                    typ = p.bad();
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
                        typ = new RestExpr(pos, scope, x);
                    }
                    else {
                        typ = p.bad();
                        p.syntaxError("expecting type after ...");
                    }
                    if (seenRestExpr) {
                        p.syntaxError("can only use ... with final parameter");
                        continue;
                    }
                    else {
                        seenRestExpr = true;
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
                let t = u_t_auto;
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
                                f.type = p.bad(f.type.pos);
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
                        if (typ instanceof RestExpr) {
                            typ = typ.expr;
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
                const typexpr = id.ent.getTypeExpr();
                assert(typexpr != null);
                const typ = p.types.resolve(typexpr);
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
            p.checkBasicTypeMutation(lhs[0], t);
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
            p.checkBasicTypeMutation(lhs[0], t);
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
    checkBasicTypeMutation(x, t) {
        if (!(t instanceof IntType) &&
            t !== u_t_f32 && t !== u_t_f64 &&
            !(t instanceof UnresolvedType)) {
            this.syntaxError(`cannot mutate ${x}`, x.pos);
        }
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
        assert(frtype instanceof Type, "currFun sig.result type not resolved");
        const n = new ReturnStmt(pos, p.scope, u_t_nil, frtype);
        if (p.tok == token.SEMICOLON || p.tok == token.RBRACE) {
            if (frtype !== u_t_nil) {
                if (frtype === u_t_auto && fi.autort == null) {
                    fi.f.sig.result = u_t_nil;
                }
                else {
                    p.syntaxError(`missing return value; expecting ${fi.autort || frtype}`);
                }
            }
            return n;
        }
        const xs = p.exprList(null);
        let rval = (xs.length == 1 ? xs[0] :
            new TupleExpr(xs[0].pos, xs[0].scope, xs));
        if (frtype === u_t_nil) {
            p.syntaxError("function does not return a value", rval.pos);
            return n;
        }
        const rtype = p.types.resolve(rval);
        if (frtype === u_t_auto) {
            fi.addInferredReturnType(rtype);
        }
        else if (!(rtype instanceof UnresolvedType) && !frtype.equals(rtype)) {
            const convres = p.types.convert(frtype, rval);
            if (convres) {
                rval = convres;
            }
            else {
                p.syntaxError((rval.type instanceof UnresolvedType ?
                    `cannot use "${rval}" as return type ${frtype}` :
                    `cannot use "${rval}" (type ${rval.type}) as return type ${frtype}`), rval.pos);
            }
        }
        n.result = rval;
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
                if (token.literal_beg < p.tok && p.tok < token.literal_end) {
                    return p.basicLit(ctx, t);
                }
                let x = new Operation(pos, p.scope, t, p.unaryExpr(ctx));
                p.types.resolve(x);
                return x;
            }
            case token.AND: {
                p.next();
                let x = new Operation(pos, p.scope, t, p.unaryExpr(ctx));
                p.types.resolve(x);
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
            default: {
                if (token.literal_beg < p.tok && p.tok < token.literal_end) {
                    return p.basicLit(ctx);
                }
                const x = p.bad();
                p.syntaxError("expecting expression");
                return x;
            }
        }
    }
    basicLit(ctx, op) {
        const p = this;
        assert(token.literal_beg < p.tok && p.tok < token.literal_end);
        const x = new BasicLit(p.pos, p.scope, p.tok, p.takeByteValue(), op);
        const reqt = p.ctxType(ctx);
        x.type = p.universe.basicLitType(x, reqt, p.basicLitErrH, op);
        p.next();
        return x;
    }
    strlit() {
        const p = this;
        assert(p.tok == token.STRING);
        const n = new StringLit(p.pos, p.scope, p.takeByteValue());
        n.type = new StrType(n.value.length);
        p.next();
        return n;
    }
    selectorExpr(operand, ctx) {
        const p = this;
        p.want(token.DOT);
        const pos = p.pos;
        let rhs;
        if (p.tok == token.NAME) {
            rhs = p.dotident(ctx, p.ident());
        }
        else if (p.tok > token.literal_int_beg &&
            p.tok < token.literal_int_end) {
            return p.types.resolveIndex(new IndexExpr(pos, p.scope, operand, p.basicLit(ctx)));
        }
        else {
            p.syntaxError('expecting name or integer after "."');
            rhs = p.bad(pos);
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
            let end = null;
            if (!p.got(token.RBRACKET)) {
                end = p.expr(ctx);
                p.want(token.RBRACKET);
            }
            return new SliceExpr(pos, p.scope, operand, x1, end);
        }
        p.want(token.RBRACKET);
        return p.types.resolveIndex(new IndexExpr(pos, p.scope, operand, x1));
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
    maybeType() {
        const p = this;
        let x = null;
        switch (p.tok) {
            case token.NAME:
                x = p.dotident(null, p.resolve(p.ident()));
                break;
            case token.LPAREN:
                const t = p.tupleType();
                x = (t.exprs.length == 0 ? null :
                    t.exprs.length == 1 ? t.exprs[0] :
                        t);
                break;
            default:
                return null;
        }
        return x && p.types.resolve(x) || null;
    }
    type() {
        const p = this;
        let t = p.maybeType();
        if (!t) {
            t = p.bad();
            p.syntaxError("expecting type");
            p.next();
        }
        return t;
    }
    tupleType() {
        const p = this;
        p.want(token.LPAREN);
        const pos = p.pos;
        const l = [];
        while (p.tok != token.RPAREN) {
            l.push(p.type());
            if (!p.ocomma(token.RPAREN)) {
                break;
            }
        }
        p.want(token.RPAREN);
        return new TupleExpr(pos, p.scope, l);
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
            f.scope.declareEnt(new Ent(name, imp, null, pkg.data));
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
                id.refEnt(ent);
                let t = id.type;
                if (t instanceof UnresolvedType) {
                    assert(ent.value != null);
                    id.type = b.types.resolve(ent.value);
                    assert(!(id.type instanceof UnresolvedType), 'still unresolved');
                    if (t.refs)
                        for (let ref of t.refs) {
                            if (ref instanceof FunSig || ref instanceof FunType) {
                                ref.result = id.type;
                            }
                            else {
                                ref.type = id.type;
                            }
                        }
                }
            }
    }
    _resolveTypes() {
        const b = this;
        for (let ut of b.types.unresolved) {
            const t = ut.expr.type;
            if (!(t instanceof UnresolvedType)) {
                continue;
            }
            if (b.undef && ut.expr instanceof Ident && b.undef.has(ut.expr)) {
                continue;
            }
            ut.expr.type = null;
            const restyp = b.types.maybeResolve(ut.expr);
            if (!restyp) {
                ut.expr.type = t;
                debuglog(`cannot resolve type of ${ut.expr} ${b.fset.position(ut.expr.pos)}`);
                continue;
            }
            if (t.refs)
                for (let ref of t.refs) {
                    if (ref instanceof FunSig || ref instanceof FunType) {
                        ref.result = restyp;
                    }
                    else {
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
function _reprt(t, nl, c) {
    if (t instanceof BasicType) {
        return c.style.bold(t.name);
    }
    if (t instanceof TupleType) {
        return '(' + t.types.map(t => _reprt(t, nl, c)).join(', ') + ')';
    }
    if (t instanceof RestType) {
        return '...' + _reprt(t.type, nl, c);
    }
    if (t instanceof FunType) {
        return ('(' + t.inputs.map(it => _reprt(it, nl, c)).join(', ') + ')' +
            '->' + _reprt(t.result, nl, c));
    }
    if (t instanceof UnresolvedType) {
        return '~';
    }
    return t.toString();
}
function reprt0(tx, nl, c) {
    if (!tx) {
        return '?';
    }
    let t = (tx instanceof Type ? tx :
        tx.type && tx.type !== tx && tx.type instanceof Type ? tx.type :
            null);
    if (t) {
        c.typedepth++;
        const v = _reprt(t, nl, c);
        c.typedepth--;
        return v;
    }
    return '~' + repr1(tx, nl, c);
}
function reprt(tx, newline, c) {
    return c.style.blue(`<${reprt0(tx, newline, c)}>`);
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
    if (n instanceof BasicType) {
        return c.style.purple(c.style.bold(n.name));
    }
    if (n instanceof BasicLit || n instanceof StringLit) {
        let s = JSON.stringify(decodeToString(n.value));
        if (!(n instanceof StringLit)) {
            s = s.substr(1, s.length - 2);
        }
        return reprt(n.type, newline, c) + c.style.green(s);
    }
    if (n instanceof Ident) {
        return (c.typedepth ? '' : reprt(n.type, newline, c)) + reprid(n, c);
    }
    if (n instanceof RestExpr) {
        return '...' + repr1(n.expr, newline, c);
    }
    if (n instanceof BadExpr) {
        return 'BAD';
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
        return reprv(n.params, nl2, c) + ' -> ' + reprt(n.result, nl2, c);
    }
    if (n instanceof Assignment) {
        let s = newline + `(${reprcons(n, c)} `;
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
            s += reprt(n.type, newline, c) + ' ' + reprv(n.idents, nl2, c);
        }
        else {
            s += ' (' + n.idents.map(id => reprt(id, newline, c) + reprid(id, c)).join(' ') + ')';
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
//# sourceMappingURL=ast-repr.js.map

const universeTypes = new Map();
const universeValues = new Map();
function namedtype(x, name) {
    assert(!universeTypes.has(name));
    universeTypes.set(name, x);
    return x;
}
function ival(name, typ) {
    const x = new IntrinsicVal(name, typ);
    assert(!universeValues.has(name));
    universeValues.set(name, x);
    return x;
}
const u_v_true = ival('true', u_t_bool);
const u_v_false = ival('false', u_t_bool);
const u_v_nil = ival('nil', u_t_nil);
const uintz$1 = 32;
namedtype(u_t_bool, 'bool');
namedtype(u_t_uint, 'uint');
namedtype(u_t_int, 'int');
namedtype(u_t_i8, 'i8');
namedtype(u_t_i16, 'i16');
namedtype(u_t_i32, 'i32');
namedtype(u_t_i64, 'i64');
namedtype(u_t_u8, 'u8');
namedtype(u_t_u16, 'u16');
namedtype(u_t_u32, 'u32');
namedtype(u_t_u64, 'u64');
namedtype(u_t_f32, 'f32');
namedtype(u_t_f64, 'f64');
namedtype(u_t_str, 'str');
const universeTypeAliases = new Map([
    ['byte', 'u8'],
    ['char', 'u32'],
]);
var TypeCompat;
(function (TypeCompat) {
    TypeCompat[TypeCompat["NO"] = 0] = "NO";
    TypeCompat[TypeCompat["LOSSY"] = 1] = "LOSSY";
    TypeCompat[TypeCompat["LOSSLESS"] = 2] = "LOSSLESS";
})(TypeCompat || (TypeCompat = {}));
const typeCompatMap = new Map([
    [u_t_u64, new Map([
            [u_t_uint, TypeCompat.LOSSLESS],
            [u_t_int, TypeCompat.LOSSLESS],
            [u_t_i8, TypeCompat.LOSSLESS],
            [u_t_i16, TypeCompat.LOSSLESS],
            [u_t_i32, TypeCompat.LOSSLESS],
            [u_t_i64, TypeCompat.LOSSLESS],
            [u_t_u8, TypeCompat.LOSSLESS],
            [u_t_u16, TypeCompat.LOSSLESS],
            [u_t_u32, TypeCompat.LOSSLESS],
            [u_t_f32, TypeCompat.LOSSY],
            [u_t_f64, TypeCompat.LOSSY],
        ])],
    [u_t_i64, new Map([
            [u_t_uint, uintz$1 <= 63 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
            [u_t_int, TypeCompat.LOSSLESS],
            [u_t_i8, TypeCompat.LOSSLESS],
            [u_t_i16, TypeCompat.LOSSLESS],
            [u_t_i32, TypeCompat.LOSSLESS],
            [u_t_u8, TypeCompat.LOSSLESS],
            [u_t_u16, TypeCompat.LOSSLESS],
            [u_t_u32, TypeCompat.LOSSLESS],
            [u_t_u64, TypeCompat.LOSSY],
            [u_t_f32, TypeCompat.LOSSY],
            [u_t_f64, TypeCompat.LOSSY],
        ])],
    [u_t_u32, new Map([
            [u_t_uint, uintz$1 <= 32 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
            [u_t_int, uintz$1 <= 32 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
            [u_t_i8, TypeCompat.LOSSLESS],
            [u_t_i16, TypeCompat.LOSSLESS],
            [u_t_i32, TypeCompat.LOSSLESS],
            [u_t_i64, TypeCompat.LOSSY],
            [u_t_u8, TypeCompat.LOSSLESS],
            [u_t_u16, TypeCompat.LOSSLESS],
            [u_t_u64, TypeCompat.LOSSY],
            [u_t_f32, TypeCompat.LOSSY],
            [u_t_f64, TypeCompat.LOSSY],
        ])],
    [u_t_i32, new Map([
            [u_t_uint, TypeCompat.LOSSY],
            [u_t_int, uintz$1 <= 32 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
            [u_t_i8, TypeCompat.LOSSLESS],
            [u_t_i16, TypeCompat.LOSSLESS],
            [u_t_i64, TypeCompat.LOSSY],
            [u_t_u8, TypeCompat.LOSSLESS],
            [u_t_u16, TypeCompat.LOSSLESS],
            [u_t_u32, TypeCompat.LOSSY],
            [u_t_u64, TypeCompat.LOSSY],
            [u_t_f32, TypeCompat.LOSSY],
            [u_t_f64, TypeCompat.LOSSY],
        ])],
    [u_t_uint, new Map([
            [u_t_int, TypeCompat.LOSSLESS],
            [u_t_i8, TypeCompat.LOSSLESS],
            [u_t_i16, TypeCompat.LOSSLESS],
            [u_t_i32, TypeCompat.LOSSLESS],
            [u_t_i64, uintz$1 >= 64 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
            [u_t_u8, TypeCompat.LOSSLESS],
            [u_t_u16, TypeCompat.LOSSLESS],
            [u_t_u32, uintz$1 >= 32 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
            [u_t_u64, uintz$1 >= 64 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
            [u_t_f32, TypeCompat.LOSSY],
            [u_t_f64, TypeCompat.LOSSY],
        ])],
    [u_t_int, new Map([
            [u_t_uint, TypeCompat.LOSSY],
            [u_t_i8, TypeCompat.LOSSLESS],
            [u_t_i16, TypeCompat.LOSSLESS],
            [u_t_i32, TypeCompat.LOSSLESS],
            [u_t_i64, uintz$1 >= 64 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
            [u_t_u8, TypeCompat.LOSSLESS],
            [u_t_u16, TypeCompat.LOSSLESS],
            [u_t_u32, uintz$1 >= 32 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
            [u_t_u64, TypeCompat.LOSSY],
            [u_t_f32, TypeCompat.LOSSY],
            [u_t_f64, TypeCompat.LOSSY],
        ])],
    [u_t_u16, new Map([
            [u_t_uint, TypeCompat.LOSSY],
            [u_t_int, TypeCompat.LOSSY],
            [u_t_i8, TypeCompat.LOSSLESS],
            [u_t_i16, TypeCompat.LOSSLESS],
            [u_t_i32, TypeCompat.LOSSY],
            [u_t_i64, TypeCompat.LOSSY],
            [u_t_u8, TypeCompat.LOSSLESS],
            [u_t_u32, TypeCompat.LOSSY],
            [u_t_u64, TypeCompat.LOSSY],
            [u_t_f32, TypeCompat.LOSSY],
            [u_t_f64, TypeCompat.LOSSY],
        ])],
    [u_t_i16, new Map([
            [u_t_uint, TypeCompat.LOSSY],
            [u_t_int, TypeCompat.LOSSY],
            [u_t_i8, TypeCompat.LOSSLESS],
            [u_t_i32, TypeCompat.LOSSY],
            [u_t_i64, TypeCompat.LOSSY],
            [u_t_u8, TypeCompat.LOSSLESS],
            [u_t_u16, TypeCompat.LOSSY],
            [u_t_u32, TypeCompat.LOSSY],
            [u_t_u64, TypeCompat.LOSSY],
            [u_t_f32, TypeCompat.LOSSY],
            [u_t_f64, TypeCompat.LOSSY],
        ])],
    [u_t_u8, new Map([
            [u_t_uint, TypeCompat.LOSSY],
            [u_t_int, TypeCompat.LOSSY],
            [u_t_i8, TypeCompat.LOSSLESS],
            [u_t_i16, TypeCompat.LOSSY],
            [u_t_i32, TypeCompat.LOSSY],
            [u_t_i64, TypeCompat.LOSSY],
            [u_t_u16, TypeCompat.LOSSY],
            [u_t_u32, TypeCompat.LOSSY],
            [u_t_u64, TypeCompat.LOSSY],
            [u_t_f32, TypeCompat.LOSSY],
            [u_t_f64, TypeCompat.LOSSY],
        ])],
    [u_t_i8, new Map([
            [u_t_uint, TypeCompat.LOSSY],
            [u_t_int, TypeCompat.LOSSY],
            [u_t_i16, TypeCompat.LOSSY],
            [u_t_i32, TypeCompat.LOSSY],
            [u_t_i64, TypeCompat.LOSSY],
            [u_t_u8, TypeCompat.LOSSY],
            [u_t_u16, TypeCompat.LOSSY],
            [u_t_u32, TypeCompat.LOSSY],
            [u_t_u64, TypeCompat.LOSSY],
            [u_t_f32, TypeCompat.LOSSY],
            [u_t_f64, TypeCompat.LOSSY],
        ])],
    [u_t_f32, new Map([
            [u_t_uint, TypeCompat.LOSSY],
            [u_t_int, TypeCompat.LOSSY],
            [u_t_i8, TypeCompat.LOSSLESS],
            [u_t_i16, TypeCompat.LOSSLESS],
            [u_t_i32, TypeCompat.LOSSY],
            [u_t_i64, TypeCompat.LOSSY],
            [u_t_u8, TypeCompat.LOSSLESS],
            [u_t_u16, TypeCompat.LOSSLESS],
            [u_t_u32, TypeCompat.LOSSY],
            [u_t_u64, TypeCompat.LOSSY],
            [u_t_f64, TypeCompat.LOSSY],
        ])],
    [u_t_f64, new Map([
            [u_t_uint, uintz$1 <= 32 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
            [u_t_int, uintz$1 <= 32 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
            [u_t_i8, TypeCompat.LOSSLESS],
            [u_t_i16, TypeCompat.LOSSLESS],
            [u_t_i32, TypeCompat.LOSSLESS],
            [u_t_i64, TypeCompat.LOSSY],
            [u_t_u8, TypeCompat.LOSSLESS],
            [u_t_u16, TypeCompat.LOSSLESS],
            [u_t_u32, TypeCompat.LOSSLESS],
            [u_t_u64, TypeCompat.LOSSY],
            [u_t_f32, TypeCompat.LOSSLESS],
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
    assert_LOSSLESS(u_t_u64, u_t_uint);
    assert_LOSSLESS(u_t_u64, u_t_int);
    assert_LOSSLESS(u_t_u64, u_t_i64);
    assert_LOSSLESS(u_t_u64, u_t_u32);
    assert_LOSSLESS(u_t_u64, u_t_i32);
    assert_LOSSLESS(u_t_u64, u_t_u16);
    assert_LOSSLESS(u_t_u64, u_t_i16);
    assert_LOSSLESS(u_t_u64, u_t_u8);
    assert_LOSSLESS(u_t_u64, u_t_i8);
    assert_LOSSY(u_t_u64, u_t_f32);
    assert_LOSSY(u_t_u64, u_t_f64);
    assert_LOSSLESS(u_t_i64, u_t_uint);
    if (uintz$1 == 64) {
        assert_LOSSY(u_t_i64, u_t_int);
    }
    else {
        assert_LOSSLESS(u_t_i64, u_t_int);
    }
    assert_LOSSY(u_t_i64, u_t_u64);
    assert_LOSSLESS(u_t_i64, u_t_u32);
    assert_LOSSLESS(u_t_i64, u_t_i32);
    assert_LOSSLESS(u_t_i64, u_t_u16);
    assert_LOSSLESS(u_t_i64, u_t_i16);
    assert_LOSSLESS(u_t_i64, u_t_u8);
    assert_LOSSLESS(u_t_i64, u_t_i8);
    assert_LOSSY(u_t_i64, u_t_f32);
    assert_LOSSY(u_t_i64, u_t_f64);
    if (uintz$1 == 64) {
        assert_LOSSY(u_t_u32, u_t_uint);
        assert_LOSSY(u_t_u32, u_t_int);
    }
    else {
        assert_LOSSLESS(u_t_u32, u_t_uint);
        assert_LOSSLESS(u_t_u32, u_t_int);
    }
    assert_LOSSY(u_t_u32, u_t_u64);
    assert_LOSSY(u_t_u32, u_t_i64);
    assert_LOSSLESS(u_t_u32, u_t_i32);
    assert_LOSSLESS(u_t_u32, u_t_u16);
    assert_LOSSLESS(u_t_u32, u_t_i16);
    assert_LOSSLESS(u_t_u32, u_t_u8);
    assert_LOSSLESS(u_t_u32, u_t_i8);
    assert_LOSSY(u_t_u32, u_t_f32);
    assert_LOSSY(u_t_u32, u_t_f64);
    assert_LOSSY(u_t_i32, u_t_uint);
    if (uintz$1 == 64) {
        assert_LOSSY(u_t_i32, u_t_int);
    }
    else {
        assert_LOSSLESS(u_t_i32, u_t_int);
    }
    assert_LOSSY(u_t_i32, u_t_u64);
    assert_LOSSY(u_t_i32, u_t_i64);
    assert_LOSSY(u_t_i32, u_t_u32);
    assert_LOSSLESS(u_t_i32, u_t_u16);
    assert_LOSSLESS(u_t_i32, u_t_i16);
    assert_LOSSLESS(u_t_i32, u_t_u8);
    assert_LOSSLESS(u_t_i32, u_t_i8);
    assert_LOSSY(u_t_i32, u_t_f32);
    assert_LOSSY(u_t_i32, u_t_f64);
    assert_LOSSY(u_t_u16, u_t_uint);
    assert_LOSSY(u_t_u16, u_t_int);
    assert_LOSSY(u_t_u16, u_t_u64);
    assert_LOSSY(u_t_u16, u_t_i64);
    assert_LOSSY(u_t_u16, u_t_u32);
    assert_LOSSY(u_t_u16, u_t_i32);
    assert_LOSSLESS(u_t_u16, u_t_i16);
    assert_LOSSLESS(u_t_u16, u_t_u8);
    assert_LOSSLESS(u_t_u16, u_t_i8);
    assert_LOSSY(u_t_u16, u_t_f32);
    assert_LOSSY(u_t_u16, u_t_f64);
    assert_LOSSY(u_t_i16, u_t_uint);
    assert_LOSSY(u_t_i16, u_t_int);
    assert_LOSSY(u_t_i16, u_t_u64);
    assert_LOSSY(u_t_i16, u_t_i64);
    assert_LOSSY(u_t_i16, u_t_u32);
    assert_LOSSY(u_t_i16, u_t_i32);
    assert_LOSSY(u_t_i16, u_t_u16);
    assert_LOSSLESS(u_t_i16, u_t_u8);
    assert_LOSSLESS(u_t_i16, u_t_i8);
    assert_LOSSY(u_t_i16, u_t_f32);
    assert_LOSSY(u_t_i16, u_t_f64);
    assert_LOSSY(u_t_u8, u_t_uint);
    assert_LOSSY(u_t_u8, u_t_int);
    assert_LOSSY(u_t_u8, u_t_u64);
    assert_LOSSY(u_t_u8, u_t_i64);
    assert_LOSSY(u_t_u8, u_t_u32);
    assert_LOSSY(u_t_u8, u_t_i32);
    assert_LOSSY(u_t_u8, u_t_u16);
    assert_LOSSY(u_t_u8, u_t_i16);
    assert_LOSSLESS(u_t_u8, u_t_i8);
    assert_LOSSY(u_t_u8, u_t_f32);
    assert_LOSSY(u_t_u8, u_t_f64);
    assert_LOSSY(u_t_i8, u_t_uint);
    assert_LOSSY(u_t_i8, u_t_int);
    assert_LOSSY(u_t_i8, u_t_u64);
    assert_LOSSY(u_t_i8, u_t_i64);
    assert_LOSSY(u_t_i8, u_t_u32);
    assert_LOSSY(u_t_i8, u_t_i32);
    assert_LOSSY(u_t_i8, u_t_u16);
    assert_LOSSY(u_t_i8, u_t_i16);
    assert_LOSSY(u_t_i8, u_t_u8);
    assert_LOSSY(u_t_i8, u_t_f32);
    assert_LOSSY(u_t_i8, u_t_f64);
    if (uintz$1 <= 32) {
        assert_LOSSLESS(u_t_f64, u_t_uint);
        assert_LOSSLESS(u_t_f64, u_t_int);
    }
    else {
        assert_LOSSY(u_t_f64, u_t_uint);
        assert_LOSSY(u_t_f64, u_t_int);
    }
    assert_LOSSY(u_t_f64, u_t_u64);
    assert_LOSSY(u_t_f64, u_t_i64);
    assert_LOSSLESS(u_t_f64, u_t_u32);
    assert_LOSSLESS(u_t_f64, u_t_i32);
    assert_LOSSLESS(u_t_f64, u_t_u16);
    assert_LOSSLESS(u_t_f64, u_t_i16);
    assert_LOSSLESS(u_t_f64, u_t_u8);
    assert_LOSSLESS(u_t_f64, u_t_i8);
    assert_LOSSLESS(u_t_f64, u_t_f32);
    assert_LOSSY(u_t_f32, u_t_uint);
    assert_LOSSY(u_t_f32, u_t_int);
    assert_LOSSY(u_t_f32, u_t_u64);
    assert_LOSSY(u_t_f32, u_t_i64);
    assert_LOSSY(u_t_f32, u_t_u32);
    assert_LOSSY(u_t_f32, u_t_i32);
    assert_LOSSLESS(u_t_f32, u_t_u16);
    assert_LOSSLESS(u_t_f32, u_t_i16);
    assert_LOSSLESS(u_t_f32, u_t_u8);
    assert_LOSSLESS(u_t_f32, u_t_i8);
    assert_LOSSY(u_t_f32, u_t_f64);
});
function intBinBits(v, neg) {
    let start = 2;
    while (v[start] == 0x30) {
        start++;
    }
    let n = v.length - start;
    if (n > 64) {
        return 0;
    }
    if (n == 0) {
        return 1;
    }
    if (neg) {
        if (n == 64) {
            let i = start;
            while (v[++i] == 0x30) { }
            if (i - start == 64) {
                return 63;
            }
            return 0;
        }
        if (n > 31) {
            let i = start;
            while (v[++i] == 0x30) { }
            if (i - start == 32) {
                return 31;
            }
            return 63;
        }
        n--;
    }
    return n;
}
function testIntBits(fn, v) {
    let input = v[0];
    let expected = v[1];
    let neg = false;
    if (input[0] == '-') {
        neg = true;
        input = input.substr(1);
    }
    let actual = fn(asciibuf(input), neg);
    assert(actual == expected, JSON.stringify(v[0]) + ` => ${actual}; expected ${expected}`);
}
TEST("intBinBits", () => {
    [
        ["0b0", 1],
        ["0b1111111", 7],
        ["0b10000000", 8],
        ["0b11111111", 8],
        ["0b100000000", 9],
        ["0b111111111111111", 15],
        ["0b1000000000000000", 16],
        ["0b1111111111111111", 16],
        ["0b10000000000000000", 17],
        ["0b1111111111111111111111111111111", 31],
        ["0b10000000000000000000000000000000", 32],
        ["0b11111111111111111111111111111111", 32],
        ["0b100000000000000000000000000000000", 33],
        ["0b11111111111111111111111111111111111111111111111111111", 53],
        ["0b111111111111111111111111111111111111111111111111111111111111111", 63],
        ["0b1000000000000000000000000000000000000000000000000000000000000000", 64],
        ["0b1111111111111111111111111111111111111111111111111111111111111111", 64],
        ["0b10000000000000000000000000000000000000000000000000000000000000000", 0],
        ["-0b10000000000000000000000000000000", 31],
        ["-0b10000000000000000000000000000001", 63],
        ["-0b1000000000000000000000000000000000000000000000000000000000000000", 63],
        ["-0b1000000000000000000000000000000000000000000000000000000000000001", 0],
    ].map(v => testIntBits(intBinBits, v));
});
const i32minOctBuf = new Uint8Array([
    50, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48
]);
const i64minOctBuf = new Uint8Array([
    49, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48
]);
function intOctBits(b, neg) {
    let start = 2;
    while (b[start] == 0x30) {
        start++;
    }
    let z = b.length - start;
    return (z < 3 ? 7 :
        z == 3 ? (b[start] < 0x32 ? 7 :
            b[start] < 0x34 ? 8 :
                15) :
            z < 6 ? 15 :
                z == 6 && b[start] < 0x32 ? 16 :
                    z < 11 ? 31 :
                        z == 11 ? (neg ? (bufcmp$1(b, i32minOctBuf, start) <= 0 ? 31 : 63) :
                            b[start] < 0x32 ? 31 :
                                b[start] < 0x34 ? 32 :
                                    63) :
                            z < 22 ? 63 :
                                z == 22 ? (neg ? (bufcmp$1(b, i64minOctBuf, start) <= 0 ? 63 : 0) :
                                    b[start] < 0x32 ? 64 :
                                        0) :
                                    0);
}
TEST("intOctBits", () => {
    [
        ["0o0", 7],
        ["0o177", 7],
        ["0o200", 8],
        ["0o377", 8],
        ["0o400", 15],
        ["0o77777", 15],
        ["0o100000", 16],
        ["0o177777", 16],
        ["0o200000", 31],
        ["0o17777777777", 31],
        ["0o20000000000", 32],
        ["0o37777777777", 32],
        ["0o40000000000", 63],
        ["0o377777777777777777", 63],
        ["0o777777777777777777777", 63],
        ["0o1000000000000000000000", 64],
        ["0o1777777777777777777777", 64],
        ["0o2000000000000000000000", 0],
        ["-0o20000000000", 31],
        ["-0o20000000001", 63],
        ["-0o1000000000000000000000", 63],
        ["-0o1000000000000000000001", 0],
    ].map(v => testIntBits(intOctBits, v));
});
const i64maxDecBuf = new Uint8Array([
    57, 50, 50, 51, 51, 55, 50, 48, 51, 54, 56, 53, 52, 55, 55, 53, 56, 48, 55
]);
const i64minDecBuf = new Uint8Array([
    57, 50, 50, 51, 51, 55, 50, 48, 51, 54, 56, 53, 52, 55, 55, 53, 56, 48, 56
]);
const u64maxDecBuf = new Uint8Array([
    49, 56, 52, 52, 54, 55, 52, 52, 48, 55, 51, 55, 48, 57, 53, 53, 49, 54, 49, 53
]);
function intDecBits(b, neg) {
    let v = 0, z = b.length;
    for (let i = 0; i < z; i++) {
        v = v * 10 + (b[i] - 0x30);
    }
    if (v < 0x80) {
        return 7;
    }
    if (v < 0x1FFFFFFFFFFFFF) {
        let bits = Math.floor(Math.log2(neg ? v - 1 : v)) + 1;
        if (neg && bits > 31) {
            bits = 63;
        }
        return bits;
    }
    let start = 0;
    while (b[start] == 0x30) {
        start++;
    }
    z = b.length - start;
    return (z < 19 ? 63 :
        z == 19 ?
            bufcmp$1(b, neg ? i64minDecBuf : i64maxDecBuf, start) <= 0 ? 63 :
                neg ? 0 : 64 :
            z == 20 && bufcmp$1(b, u64maxDecBuf, start) <= 0 ? 64 : 0);
}
TEST("intDecBits", () => {
    [
        ["0", 7],
        ["127", 7],
        ["128", 8],
        ["255", 8],
        ["256", 9],
        ["32767", 15],
        ["32768", 16],
        ["65535", 16],
        ["65536", 17],
        ["2147483647", 31],
        ["2147483648", 32],
        ["4294967295", 32],
        ["4294967296", 33],
        ["9007199254740991", 63],
        ["9223372036854775807", 63],
        ["9223372036854775808", 64],
        ["18446744073709551615", 64],
        ["18446744073709551616", 0],
        ["-2147483648", 31],
        ["-2147483649", 63],
        ["-9223372036854775808", 63],
        ["-9223372036854775809", 0],
    ].map(v => testIntBits(intDecBits, v));
});
const i64minHexBuf = new Uint8Array([
    56, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48
]);
function intHexBits(b, neg) {
    let v = 0, z = b.length;
    for (let n = 0, i = 2; i < z; i++) {
        n = b[i];
        n = (n >= 0x30 && n <= 0x39 ? n - 0x30 :
            n >= 0x41 && n <= 0x46 ? n - 0x41 + 10 :
                n - 0x61 + 10);
        v = v * 16 + n;
    }
    if (v < 0x80) {
        return 7;
    }
    if (v < 0x1FFFFFFFFFFFFF) {
        let bits = Math.floor(Math.log2(neg ? v - 1 : v)) + 1;
        if (neg && bits > 31) {
            bits = 63;
        }
        return bits;
    }
    let start = 2;
    while (b[start] == 0x30) {
        start++;
    }
    z = b.length - start;
    return (z < 16 || (z == 16 && b[start] <= 0x37) ? 63 :
        z == 16 ?
            neg ? (bufcmp$1(b, i64minHexBuf, start) <= 0 ? 63 : 0) :
                64 :
            0);
}
TEST("intHexBits", () => {
    [
        ["0x0", 7],
        ["0x7F", 7],
        ["0x80", 8],
        ["0xFF", 8],
        ["0x100", 9],
        ["0x7FFF", 15],
        ["0x8000", 16],
        ["0xFFFF", 16],
        ["0x10000", 17],
        ["0x7FFFFFFF", 31],
        ["0x80000000", 32],
        ["0xFFFFFFFF", 32],
        ["0x100000000", 33],
        ["0x1FFFFFFFFFFFFF", 63],
        ["0x7FFFFFFFFFFFFFFF", 63],
        ["0x8000000000000000", 64],
        ["0xFFFFFFFFFFFFFFFF", 64],
        ["0x10000000000000000", 0],
        ["-0x80000000", 31],
        ["-0x80000001", 63],
        ["-0x8000000000000000", 63],
        ["-0x8000000000000001", 0],
    ].map(v => testIntBits(intHexBits, v));
});
function intBits(x, neg) {
    switch (x.kind) {
        case token.INT_BIN: return intBinBits(x.value, neg);
        case token.INT_OCT: return intOctBits(x.value, neg);
        case token.INT: return intDecBits(x.value, neg);
        case token.INT_HEX: return intHexBits(x.value, neg);
        default: return 0;
    }
}
function intLitTypeFitter(x, reqt, errh, op) {
    const neg = op == token.SUB;
    let bits = intBits(x, neg);
    const maxtype = neg ? u_t_i64 : u_t_u64;
    if (bits == 0) {
        if (errh) {
            let t = reqt instanceof BasicType ? reqt : maxtype;
            errh(`constant ${x} overflows ${t.name}`, x.pos);
            bits = 64;
        }
    }
    else if (reqt) {
        if (reqt instanceof IntType) {
            if (reqt.bitsize >= bits && (!neg || reqt.signed)) {
                return reqt;
            }
            if (errh) {
                errh(`constant ${x} overflows ${reqt.name}`, x.pos);
                bits = 64;
            }
        }
        else if (reqt === u_t_f64 || reqt === u_t_f32) {
            return reqt;
        }
        else if (errh) {
            errh(`cannot use ${x} as type ${reqt}`, x.pos);
        }
    }
    else if (neg && bits >= 64 && errh) {
        errh(`constant ${x} overflows i64`, x.pos);
    }
    return (bits <= 31 ? u_t_int :
        bits <= 63 ? u_t_i64 :
            maxtype);
}
function floatLitTypeFitter(x, reqt, errh, op) {
    if (reqt && reqt !== u_t_f32 && reqt !== u_t_f64) {
        if (reqt instanceof IntType) {
            errh && errh(`constant ${x} truncated to ${reqt.name}`, x.pos);
            return reqt;
        }
        else if (errh) {
            errh(`cannot use ${x} as type ${reqt}`, x.pos);
        }
    }
    return reqt === u_t_f32 ? u_t_f32 : u_t_f64;
}
function charLitTypeFitter(x, reqt, errh, op) {
    if (reqt) {
        if (reqt instanceof IntType) {
            return reqt;
        }
        errh && errh(`cannot use ${x} as type ${reqt}`, x.pos);
    }
    return op == token.SUB ? u_t_i32 : u_t_u32;
}
const basicLitTypesFitters = new Map([
    [token.CHAR, charLitTypeFitter],
    [token.INT, intLitTypeFitter],
    [token.INT_BIN, intLitTypeFitter],
    [token.INT_OCT, intLitTypeFitter],
    [token.INT_HEX, intLitTypeFitter],
    [token.FLOAT, floatLitTypeFitter],
]);
class Universe {
    constructor(strSet, typeSet) {
        this.strSet = strSet;
        this.typeSet = typeSet;
        const unidecls = new Map();
        for (let [name, t] of universeTypes) {
            let n = strSet.emplace(asciibuf(name));
            unidecls.set(n, new Ent(n, t, t));
        }
        for (let [aliasName, canonName] of universeTypeAliases) {
            let aliasNameBuf = strSet.emplace(asciibuf(aliasName));
            let canonNameBuf = strSet.emplace(asciibuf(canonName));
            const obj = unidecls.get(canonNameBuf);
            assert(obj);
            unidecls.set(aliasNameBuf, obj);
        }
        for (let [name, x] of universeValues) {
            let n = strSet.emplace(asciibuf(name));
            unidecls.set(n, new Ent(n, x, x));
        }
        this.scope = new Scope(null, unidecls);
    }
    basicLitType(x, reqt, errh, op) {
        let f = basicLitTypesFitters.get(x.kind);
        assert(f, `missing type fitter for ${tokstr(x.kind)}`);
        return f(x, reqt || null, errh, op);
    }
    internType(t) {
        return this.typeSet.intern(t);
    }
}
//# sourceMappingURL=universe.js.map

class EvalConst {
}
class IntEvalConst extends EvalConst {
    constructor(value) {
        super();
        this.value = value;
    }
}
class TypeResolver extends ErrorReporter {
    constructor() {
        super('E_RESOLVE');
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
    resolve(n) {
        if (n instanceof Type) {
            return n;
        }
        if (n.type instanceof Type) {
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
    maybeResolve(n) {
        const r = this;
        if (n instanceof Type) {
            return n;
        }
        if (n.type && n.type.constructor !== UnresolvedType) {
            return r.resolve(n.type);
        }
        if (n instanceof Ident) {
            if (n.ent) {
                const tx = n.ent.getTypeExpr();
                return tx && r.maybeResolve(tx) || null;
            }
            return null;
        }
        if (n instanceof Block) {
            if (n.list.length == 0) {
                return u_t_nil;
            }
            let s = n.list[n.list.length - 1];
            if (s instanceof Expr) {
                return r.resolve(s);
            }
            return u_t_nil;
        }
        if (n instanceof FunExpr) {
            const s = n.sig;
            let t = r.universe.internType(new FunType(s.pos, s.scope, s.params.map(field => r.resolve(field.type)), r.resolve(s.result)));
            if (t.result instanceof UnresolvedType) {
                t.result.addRef(t);
            }
            return t;
        }
        if (n instanceof TupleExpr) {
            return r.maybeResolveTupleType(n.pos, n.scope, n.exprs);
        }
        if (n instanceof RestExpr) {
            if (n.expr) {
                let t = r.resolve(n.expr);
                return r.universe.internType(new RestType(n.pos, n.scope, t));
            }
            return null;
        }
        if (n instanceof CallExpr) {
            const funtype = r.resolve(n.fun);
            for (let arg of n.args) {
                r.resolve(arg);
            }
            if (funtype instanceof FunType) {
                return funtype.result;
            }
            return null;
        }
        if (n instanceof Operation) {
            const xt = r.resolve(n.x);
            if (!n.y) {
                return xt;
            }
            else {
                const yt = r.resolve(n.y);
                if (n.op > token.cmpop_beg && n.op < token.cmpop_end) {
                    return u_t_bool;
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
        }
        if (n instanceof Assignment) {
            if (n.lhs.length == 1) {
                return r.resolve(n.lhs[0]);
            }
            return r.maybeResolveTupleType(n.pos, n.scope, n.lhs);
        }
        if (n instanceof ReturnStmt) {
            return n.result ? r.resolve(n.result) : u_t_nil;
        }
        if (n instanceof IfExpr) {
            return r.maybeResolveIfExpr(n);
        }
        if (n instanceof IndexExpr) {
            r.resolveIndex(n);
            return n.type;
        }
        debuglog(`TODO handle ${n.constructor.name}`);
        return null;
    }
    maybeResolveTupleType(pos, scope, exprs) {
        const r = this;
        let types = [];
        for (const x of exprs) {
            const t = r.resolve(x);
            if (!t) {
                return null;
            }
            types.push(t);
        }
        return r.universe.internType(new TupleType(pos, scope, types));
    }
    joinOptional(pos, opt, t) {
        const r = this;
        if (opt.type.equals(t)) {
            return opt;
        }
        if (opt.type instanceof StrType && t instanceof StrType) {
            assert(opt.type.length != t.length, "str type matches but StrType.equals failed");
            return u_t_optstr;
        }
        if (t instanceof UnionType) {
            let ut = new UnionType(new Set([opt]));
            for (let t1 of t.types) {
                if (!(t1 instanceof OptionalType)) {
                    if (t1 instanceof BasicType) {
                        this.error(`mixing optional and ${t1} type`, pos, 'E_CONV');
                    }
                    else {
                        t1 = (t1 instanceof StrType ? u_t_optstr :
                            r.universe.internType(new OptionalType(t1)));
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
        return (t instanceof StrType ? u_t_optstr :
            r.universe.internType(new OptionalType(t)));
    }
    mergeOptionalUnions(a, b) {
        const r = this;
        let ut = new UnionType(new Set());
        for (let t of a.types) {
            if (!(t instanceof OptionalType)) {
                t = (t instanceof StrType ? u_t_optstr :
                    r.universe.internType(new OptionalType(t)));
            }
            ut.add(t);
        }
        for (let t of b.types) {
            if (!(t instanceof OptionalType)) {
                t = (t instanceof StrType ? u_t_optstr :
                    r.universe.internType(new OptionalType(t)));
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
    makeOptionalUnionType2(l, r) {
        return this.universe.internType(new UnionType(new Set([
            l.type instanceof StrType && l.type.length != -1 ? u_t_optstr : l,
            r.type instanceof StrType && r.type.length != -1 ? u_t_optstr : r,
        ])));
    }
    makeUnionType2(l, r) {
        return this.universe.internType(new UnionType(new Set([
            l instanceof StrType && l.length != -1 ? u_t_str : l,
            r instanceof StrType && r.length != -1 ? u_t_str : r,
        ])));
    }
    maybeResolveIfExpr(n) {
        const r = this;
        let thentyp = r.resolve(n.then);
        if (!n.els_) {
            if (thentyp instanceof StrType && thentyp.length != 0) {
                return u_t_str;
            }
            return thentyp;
        }
        let eltyp = r.resolve(n.els_);
        if (eltyp.equals(thentyp)) {
            return thentyp;
        }
        if (eltyp === u_t_nil) {
            if (thentyp === u_t_nil) {
                return u_t_nil;
            }
            if (thentyp instanceof BasicType) {
                r.error(`mixing ${thentyp} and optional type`, n.pos, 'E_CONV');
            }
            return (thentyp instanceof OptionalType ? thentyp :
                thentyp instanceof StrType ? u_t_optstr :
                    r.universe.internType(new OptionalType(thentyp)));
        }
        if (thentyp === u_t_nil) {
            if (eltyp instanceof BasicType) {
                r.error(`mixing optional and ${eltyp} type`, n.pos, 'E_CONV');
            }
            return (eltyp instanceof OptionalType ? eltyp :
                eltyp instanceof StrType ? u_t_optstr :
                    r.universe.internType(new OptionalType(eltyp)));
        }
        if (eltyp instanceof OptionalType) {
            if (thentyp instanceof OptionalType) {
                if (eltyp.type instanceof StrType &&
                    thentyp.type instanceof StrType) {
                    assert(eltyp.type.length != thentyp.type.length, "str type matches but StrType.equals failed");
                    return u_t_optstr;
                }
                return r.makeOptionalUnionType2(thentyp, eltyp);
            }
            return r.joinOptional(n.pos, eltyp, thentyp);
        }
        if (thentyp instanceof OptionalType) {
            return r.joinOptional(n.pos, thentyp, eltyp);
        }
        if (eltyp instanceof StrType && thentyp instanceof StrType) {
            return u_t_str;
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
        return r.makeUnionType2(thentyp, eltyp);
    }
    resolveIndex(x) {
        const r = this;
        let opt = r.resolve(x.operand);
        if (opt instanceof UnresolvedType) {
            debuglog(`[index type] deferred to bind stage`);
        }
        else if (opt instanceof TupleType) {
            r.resolveTupleIndex(x, opt);
        }
        else {
            debuglog(`TODO [index type] operand is not a tuple; opt = ${opt}`);
        }
        return x;
    }
    resolveTupleIndex(x, opt) {
        const r = this;
        let it = r.resolve(x.index);
        if (it instanceof UnresolvedType) {
            debuglog(`index resolution deferred to post-resolve`);
            x.type = r.markUnresolved(x);
            return;
        }
        const ix = x.index;
        let index = r.resolveLitConstant(ix, intEvaluator);
        if (index == null) {
            r.syntaxError('non-constant tuple index', ix.pos);
            return;
        }
        if (index instanceof EvalConst) {
            assert(index instanceof IntEvalConst, "there is not other kind");
            x.indexv = index.value;
        }
        else {
            let index2 = index;
            assert(index2 instanceof LiteralExpr);
            if (index2.type && !(index2.type instanceof IntType) ||
                !(index2 instanceof BasicLit) ||
                !index2.isInt()) {
                r.syntaxError(`invalid index type ${index2.type || index2}`, ix.pos);
                return;
            }
            x.indexv = index2.parseUInt();
            if (x.indexv == -1) {
                r.syntaxError(`invalid index ${index2}`, ix.pos);
                return;
            }
        }
        if (x.indexv < 0 || x.indexv >= opt.types.length) {
            r.syntaxError(`out-of-bounds tuple index ${x.indexv} on type ${opt}`, ix.pos);
            return;
        }
        x.type = opt.types[x.indexv];
        if (!(x.index instanceof BasicLit)) {
            const bl = new BasicLit(x.index.pos, x.index.scope, token.INT, asciibuf(x.indexv.toString(10)));
            bl.type = r.universe.basicLitType(bl);
            x.index = bl;
        }
    }
    resolveLitConstant(x, evaluator) {
        const r = this;
        if (x instanceof LiteralExpr) {
            return x;
        }
        if (x instanceof Ident) {
            if (x.ent && x.ent.writes == 0 && x.ent.value) {
                return r.resolveLitConstant(x.ent.value, evaluator);
            }
        }
        else if (x instanceof IndexExpr) {
            let opt = r.resolve(x.operand);
            if (opt instanceof TupleType) {
                let tuple;
                if (x.operand instanceof Ident) {
                    assert(x.operand.ent != null);
                    const ent = x.operand.ent;
                    assert(ent.value instanceof TupleExpr);
                    tuple = ent.value;
                }
                else {
                    assert(x.operand instanceof TupleExpr);
                    tuple = x.operand;
                }
                if (x.indexv >= 0) {
                    assert(x.indexv < tuple.exprs.length);
                    return r.resolveLitConstant(tuple.exprs[x.indexv], evaluator);
                }
                else {
                    debuglog(`x.indexv < 0 for IndexExpr ${x}`);
                }
            }
            else {
                debuglog(`TODO ${x.constructor.name} operand ${opt}`);
            }
        }
        else if (x instanceof Operation) {
            const lval = r.resolveLitConstant(x.x, evaluator);
            if (lval) {
                if (!x.y) {
                    return evaluator(x.op, lval);
                }
                else {
                    const rval = r.resolveLitConstant(x.y, evaluator);
                    if (rval) {
                        return evaluator(x.op, lval, rval);
                    }
                }
            }
        }
        else {
            debuglog(`TODO ${x.constructor.name}`);
        }
        return null;
    }
    markUnresolved(expr) {
        const t = new UnresolvedType(expr.pos, expr.scope, expr);
        debuglog(`expr ${expr} as ${this.fset.position(expr.pos)}`);
        this.unresolved.add(t);
        return t;
    }
    isConstant(x) {
        return (x instanceof LiteralExpr ||
            (x instanceof Ident && x.ent != null && x.ent.isConstant));
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
function intEvaluator(op, x, y) {
    if (!(x instanceof BasicLit) || !x.isInt()) {
        return null;
    }
    const xs = x.isSignedInt();
    let xv = xs ? x.parseSInt() : x.parseUInt();
    if ((!xs && xv < 0) || isNaN(xv)) {
        return null;
    }
    if (y) {
        if (!(y instanceof BasicLit) || !y.isInt()) {
            return null;
        }
        const ys = y.isSignedInt();
        let yv = ys ? y.parseSInt() : y.parseUInt();
        if ((!ys && yv < 0) || isNaN(yv)) {
            return null;
        }
        switch (op) {
            case token.ADD: return new IntEvalConst(xv + yv);
            case token.SUB: return new IntEvalConst(xv - yv);
            case token.OR: return new IntEvalConst(xv | yv);
            case token.XOR: return new IntEvalConst(xv ^ yv);
            case token.MUL: return new IntEvalConst(Math.round(xv * yv));
            case token.QUO: return new IntEvalConst(Math.round(xv / yv));
            case token.REM: return new IntEvalConst(xv % yv);
            case token.AND: return new IntEvalConst(xv & yv);
            default:
                debuglog(`TODO eval binary op (${token[op]} ${x} (${xv}) ${y})`);
        }
    }
    else {
        switch (op) {
            case token.ADD: return new IntEvalConst(+xv);
            case token.SUB: return new IntEvalConst(-xv);
            case token.INC: return new IntEvalConst(++xv);
            case token.DEC: return new IntEvalConst(--xv);
            default:
                debuglog(`TODO eval unary op (${token[op]} ${x})`);
        }
    }
    return null;
}
//# sourceMappingURL=resolve.js.map

const byteStr_anonfun = asciiByteStr('anonfun');
var Op;
(function (Op) {
    Op[Op["None"] = 0] = "None";
    Op[Op["Copy"] = 1] = "Copy";
    Op[Op["Phi"] = 2] = "Phi";
    Op[Op["LoadParam"] = 3] = "LoadParam";
    Op[Op["PushParam"] = 4] = "PushParam";
    Op[Op["Call"] = 5] = "Call";
    Op[Op["i32Const"] = 6] = "i32Const";
    Op[Op["i64Const"] = 7] = "i64Const";
    Op[Op["f32Const"] = 8] = "f32Const";
    Op[Op["f64Const"] = 9] = "f64Const";
    Op[Op["i32Load"] = 10] = "i32Load";
    Op[Op["i32load8_s"] = 11] = "i32load8_s";
    Op[Op["i32load8_u"] = 12] = "i32load8_u";
    Op[Op["i32load16_s"] = 13] = "i32load16_s";
    Op[Op["i32load16_u"] = 14] = "i32load16_u";
    Op[Op["i64Load"] = 15] = "i64Load";
    Op[Op["i64load8_s"] = 16] = "i64load8_s";
    Op[Op["i64load8_u"] = 17] = "i64load8_u";
    Op[Op["i64load16_s"] = 18] = "i64load16_s";
    Op[Op["i64load16_u"] = 19] = "i64load16_u";
    Op[Op["i64load32_s"] = 20] = "i64load32_s";
    Op[Op["i64load32_u"] = 21] = "i64load32_u";
    Op[Op["f32Load"] = 22] = "f32Load";
    Op[Op["f64Load"] = 23] = "f64Load";
    Op[Op["i32Store"] = 24] = "i32Store";
    Op[Op["i32Store8"] = 25] = "i32Store8";
    Op[Op["i32Store16"] = 26] = "i32Store16";
    Op[Op["i64Store"] = 27] = "i64Store";
    Op[Op["i64Store8"] = 28] = "i64Store8";
    Op[Op["i64Store16"] = 29] = "i64Store16";
    Op[Op["i64Store32"] = 30] = "i64Store32";
    Op[Op["f32Store"] = 31] = "f32Store";
    Op[Op["f64Store"] = 32] = "f64Store";
    Op[Op["i32Add"] = 33] = "i32Add";
    Op[Op["i32Sub"] = 34] = "i32Sub";
    Op[Op["i32Mul"] = 35] = "i32Mul";
    Op[Op["i32Div_s"] = 36] = "i32Div_s";
    Op[Op["i32Div_u"] = 37] = "i32Div_u";
    Op[Op["i32Rem_s"] = 38] = "i32Rem_s";
    Op[Op["i32Rem_u"] = 39] = "i32Rem_u";
    Op[Op["i32Neg"] = 40] = "i32Neg";
    Op[Op["i32And"] = 41] = "i32And";
    Op[Op["i32Or"] = 42] = "i32Or";
    Op[Op["i32Xor"] = 43] = "i32Xor";
    Op[Op["i32Shl"] = 44] = "i32Shl";
    Op[Op["i32Shr_u"] = 45] = "i32Shr_u";
    Op[Op["i32Shr_s"] = 46] = "i32Shr_s";
    Op[Op["i32Rotl"] = 47] = "i32Rotl";
    Op[Op["i32Rotr"] = 48] = "i32Rotr";
    Op[Op["i32Eq"] = 49] = "i32Eq";
    Op[Op["i32Ne"] = 50] = "i32Ne";
    Op[Op["i32Lt_s"] = 51] = "i32Lt_s";
    Op[Op["i32Lt_u"] = 52] = "i32Lt_u";
    Op[Op["i32Le_s"] = 53] = "i32Le_s";
    Op[Op["i32Le_u"] = 54] = "i32Le_u";
    Op[Op["i32Gt_s"] = 55] = "i32Gt_s";
    Op[Op["i32Gt_u"] = 56] = "i32Gt_u";
    Op[Op["i32Ge_s"] = 57] = "i32Ge_s";
    Op[Op["i32Ge_u"] = 58] = "i32Ge_u";
    Op[Op["i32Clz"] = 59] = "i32Clz";
    Op[Op["i32Ctz"] = 60] = "i32Ctz";
    Op[Op["i32Popcnt"] = 61] = "i32Popcnt";
    Op[Op["i32Eqz"] = 62] = "i32Eqz";
    Op[Op["i64Add"] = 63] = "i64Add";
    Op[Op["i64Sub"] = 64] = "i64Sub";
    Op[Op["i64Mul"] = 65] = "i64Mul";
    Op[Op["i64Div_s"] = 66] = "i64Div_s";
    Op[Op["i64Div_u"] = 67] = "i64Div_u";
    Op[Op["i64Rem_s"] = 68] = "i64Rem_s";
    Op[Op["i64Rem_u"] = 69] = "i64Rem_u";
    Op[Op["i64And"] = 70] = "i64And";
    Op[Op["i64Neg"] = 71] = "i64Neg";
    Op[Op["i64Or"] = 72] = "i64Or";
    Op[Op["i64Xor"] = 73] = "i64Xor";
    Op[Op["i64Shl"] = 74] = "i64Shl";
    Op[Op["i64Shr_u"] = 75] = "i64Shr_u";
    Op[Op["i64Shr_s"] = 76] = "i64Shr_s";
    Op[Op["i64Rotl"] = 77] = "i64Rotl";
    Op[Op["i64Rotr"] = 78] = "i64Rotr";
    Op[Op["i64Eq"] = 79] = "i64Eq";
    Op[Op["i64Ne"] = 80] = "i64Ne";
    Op[Op["i64Lt_s"] = 81] = "i64Lt_s";
    Op[Op["i64Lt_u"] = 82] = "i64Lt_u";
    Op[Op["i64Le_s"] = 83] = "i64Le_s";
    Op[Op["i64Le_u"] = 84] = "i64Le_u";
    Op[Op["i64Gt_s"] = 85] = "i64Gt_s";
    Op[Op["i64Gt_u"] = 86] = "i64Gt_u";
    Op[Op["i64Ge_s"] = 87] = "i64Ge_s";
    Op[Op["i64Ge_u"] = 88] = "i64Ge_u";
    Op[Op["i64Clz"] = 89] = "i64Clz";
    Op[Op["i64Ctz"] = 90] = "i64Ctz";
    Op[Op["i64Popcnt"] = 91] = "i64Popcnt";
    Op[Op["i64Eqz"] = 92] = "i64Eqz";
    Op[Op["f32Add"] = 93] = "f32Add";
    Op[Op["f32Sub"] = 94] = "f32Sub";
    Op[Op["f32Mul"] = 95] = "f32Mul";
    Op[Op["f32Div"] = 96] = "f32Div";
    Op[Op["f32Abs"] = 97] = "f32Abs";
    Op[Op["f32Neg"] = 98] = "f32Neg";
    Op[Op["f32Cps"] = 99] = "f32Cps";
    Op[Op["f32Ceil"] = 100] = "f32Ceil";
    Op[Op["f32Floor"] = 101] = "f32Floor";
    Op[Op["f32Trunc"] = 102] = "f32Trunc";
    Op[Op["f32Near"] = 103] = "f32Near";
    Op[Op["f32Eq"] = 104] = "f32Eq";
    Op[Op["f32Ne"] = 105] = "f32Ne";
    Op[Op["f32Lt"] = 106] = "f32Lt";
    Op[Op["f32Le"] = 107] = "f32Le";
    Op[Op["f32Gt"] = 108] = "f32Gt";
    Op[Op["f32Ge"] = 109] = "f32Ge";
    Op[Op["f32Sqrt"] = 110] = "f32Sqrt";
    Op[Op["f32Min"] = 111] = "f32Min";
    Op[Op["f32Max"] = 112] = "f32Max";
    Op[Op["f64Add"] = 113] = "f64Add";
    Op[Op["f64Sub"] = 114] = "f64Sub";
    Op[Op["f64Mul"] = 115] = "f64Mul";
    Op[Op["f64Div"] = 116] = "f64Div";
    Op[Op["f64Abs"] = 117] = "f64Abs";
    Op[Op["f64Neg"] = 118] = "f64Neg";
    Op[Op["f64Cps"] = 119] = "f64Cps";
    Op[Op["f64Ceil"] = 120] = "f64Ceil";
    Op[Op["f64Floor"] = 121] = "f64Floor";
    Op[Op["f64Trunc"] = 122] = "f64Trunc";
    Op[Op["f64Near"] = 123] = "f64Near";
    Op[Op["f64Eq"] = 124] = "f64Eq";
    Op[Op["f64Ne"] = 125] = "f64Ne";
    Op[Op["f64Lt"] = 126] = "f64Lt";
    Op[Op["f64Le"] = 127] = "f64Le";
    Op[Op["f64Gt"] = 128] = "f64Gt";
    Op[Op["f64Ge"] = 129] = "f64Ge";
    Op[Op["f64Sqrt"] = 130] = "f64Sqrt";
    Op[Op["f64Min"] = 131] = "f64Min";
    Op[Op["f64Max"] = 132] = "f64Max";
    Op[Op["i32Wrap_i64"] = 133] = "i32Wrap_i64";
    Op[Op["i32Trunc_s_f32"] = 134] = "i32Trunc_s_f32";
    Op[Op["i32Trunc_s_f64"] = 135] = "i32Trunc_s_f64";
    Op[Op["i32Trunc_u_f32"] = 136] = "i32Trunc_u_f32";
    Op[Op["i32Trunc_u_f64"] = 137] = "i32Trunc_u_f64";
    Op[Op["i32Rein_f32"] = 138] = "i32Rein_f32";
    Op[Op["i64Extend_s_i32"] = 139] = "i64Extend_s_i32";
    Op[Op["i64Extend_u_i32"] = 140] = "i64Extend_u_i32";
    Op[Op["i64Trunc_s_f32"] = 141] = "i64Trunc_s_f32";
    Op[Op["i64Trunc_s_f64"] = 142] = "i64Trunc_s_f64";
    Op[Op["i64Trunc_u_f32"] = 143] = "i64Trunc_u_f32";
    Op[Op["i64Trunc_u_f64"] = 144] = "i64Trunc_u_f64";
    Op[Op["i64Rein_f64"] = 145] = "i64Rein_f64";
    Op[Op["f32Demote_f64"] = 146] = "f32Demote_f64";
    Op[Op["f32Convert_s_i32"] = 147] = "f32Convert_s_i32";
    Op[Op["f32Convert_s_i64"] = 148] = "f32Convert_s_i64";
    Op[Op["f32Convert_u_i32"] = 149] = "f32Convert_u_i32";
    Op[Op["f32Convert_u_i64"] = 150] = "f32Convert_u_i64";
    Op[Op["f32Rein_i32"] = 151] = "f32Rein_i32";
    Op[Op["f64Promote_f32"] = 152] = "f64Promote_f32";
    Op[Op["f64Convert_s_i32"] = 153] = "f64Convert_s_i32";
    Op[Op["f64Convert_s_i64"] = 154] = "f64Convert_s_i64";
    Op[Op["f64Convert_u_i32"] = 155] = "f64Convert_u_i32";
    Op[Op["f64Convert_u_i64"] = 156] = "f64Convert_u_i64";
    Op[Op["f64Rein_i64"] = 157] = "f64Rein_i64";
    Op[Op["Trap"] = 158] = "Trap";
})(Op || (Op = {}));
function getop(tok, t) {
    switch (tok) {
        case token.EQL:
            switch (t.regtype) {
                case RegType.i32: return Op.i32Eq;
                case RegType.i64: return Op.i64Eq;
                case RegType.f32: return Op.f32Eq;
                case RegType.f64: return Op.f64Eq;
            }
            ;
            break;
        case token.NEQ:
            switch (t.regtype) {
                case RegType.i32: return Op.i32Ne;
                case RegType.i64: return Op.i64Ne;
                case RegType.f32: return Op.f32Ne;
                case RegType.f64: return Op.f64Ne;
            }
            ;
            break;
        case token.LSS:
            switch (t.regtype) {
                case RegType.i32: return t.signed ? Op.i32Lt_s : Op.i32Lt_u;
                case RegType.i64: return t.signed ? Op.i64Lt_s : Op.i64Lt_u;
                case RegType.f32: return Op.f32Lt;
                case RegType.f64: return Op.f64Lt;
            }
            ;
            break;
        case token.LEQ:
            switch (t.regtype) {
                case RegType.i32: return t.signed ? Op.i32Le_s : Op.i32Le_u;
                case RegType.i64: return t.signed ? Op.i64Le_s : Op.i64Le_u;
                case RegType.f32: return Op.f32Le;
                case RegType.f64: return Op.f64Le;
            }
            ;
            break;
        case token.GTR:
            switch (t.regtype) {
                case RegType.i32: return t.signed ? Op.i32Gt_s : Op.i32Gt_u;
                case RegType.i64: return t.signed ? Op.i64Gt_s : Op.i64Gt_u;
                case RegType.f32: return Op.f32Gt;
                case RegType.f64: return Op.f64Gt;
            }
            ;
            break;
        case token.GEQ:
            switch (t.regtype) {
                case RegType.i32: return t.signed ? Op.i32Ge_s : Op.i32Ge_u;
                case RegType.i64: return t.signed ? Op.i64Ge_s : Op.i64Ge_u;
                case RegType.f32: return Op.f32Ge;
                case RegType.f64: return Op.f64Ge;
            }
            ;
            break;
        case token.ADD:
            switch (t.regtype) {
                case RegType.i32: return Op.i32Add;
                case RegType.i64: return Op.i64Add;
                case RegType.f32: return Op.f32Add;
                case RegType.f64: return Op.f64Add;
            }
            ;
            break;
        case token.SUB:
            switch (t.regtype) {
                case RegType.i32: return Op.i32Sub;
                case RegType.i64: return Op.i64Sub;
                case RegType.f32: return Op.f32Sub;
                case RegType.f64: return Op.f64Sub;
            }
            ;
            break;
        case token.MUL:
            switch (t.regtype) {
                case RegType.i32: return Op.i32Mul;
                case RegType.i64: return Op.i64Mul;
                case RegType.f32: return Op.f32Mul;
                case RegType.f64: return Op.f64Mul;
            }
            ;
            break;
        case token.QUO:
            switch (t.regtype) {
                case RegType.i32: return t.signed ? Op.i32Div_s : Op.i32Div_u;
                case RegType.i64: return t.signed ? Op.i64Div_s : Op.i64Div_u;
                case RegType.f32: return Op.f32Div;
                case RegType.f64: return Op.f64Div;
            }
            ;
            break;
        case token.REM:
            switch (t.regtype) {
                case RegType.i32: return t.signed ? Op.i32Rem_s : Op.i32Rem_u;
                case RegType.i64: return t.signed ? Op.i64Rem_s : Op.i64Rem_u;
            }
            ;
            break;
        case token.OR:
            switch (t.regtype) {
                case RegType.i32: return Op.i32Or;
                case RegType.i64: return Op.i64Or;
            }
            ;
            break;
        case token.XOR:
            switch (t.regtype) {
                case RegType.i32: return Op.i32Xor;
                case RegType.i64: return Op.i64Xor;
            }
            ;
            break;
        case token.AND:
            switch (t.regtype) {
                case RegType.i32: return Op.i32And;
                case RegType.i64: return Op.i64And;
            }
            ;
            break;
        case token.SHL:
            switch (t.regtype) {
                case RegType.i32: return Op.i32Shl;
                case RegType.i64: return Op.i64Shl;
            }
            ;
            break;
        case token.SHR:
            switch (t.regtype) {
                case RegType.i32: return t.signed ? Op.i32Shr_s : Op.i32Shr_u;
                case RegType.i64: return t.signed ? Op.i64Shr_s : Op.i64Shr_u;
            }
            ;
            break;
        case token.AND_NOT:
            assert(false, 'AND_NOT "&^" not yet supported');
            return Op.None;
        default:
            assert(false, `unexpected operator token ${token[tok]}`);
            return Op.None;
    }
    assert(false, `invalid operation for floating-point number`);
    return Op.None;
}
class Value {
    constructor(id, op, type, b, aux) {
        this.args = null;
        this.comment = '';
        this.uses = 0;
        this.users = new Set();
        this.id = id;
        this.op = op;
        this.type = type;
        this.b = b;
        this.aux = aux;
    }
    toString() {
        return 'v' + this.id;
    }
    appendArg(v) {
        assert(this.op == Op.Phi, "appendArg on non-phi value");
        assert(v !== this, `using self as arg to self`);
        if (!this.args) {
            this.args = [v];
        }
        else {
            this.args.push(v);
        }
        v.uses++;
        v.users.add(this);
    }
    replaceBy(v) {
        assert(v !== this, 'trying to replace V with V');
        for (let user of this.users) {
            if (user !== v && user.args) {
                for (let i = 0; i < user.args.length; i++) {
                    if (user.args[i] === this) {
                        debuglog(`replace ${this} in user ${user} with ${v}`);
                        user.args[i] = v;
                        v.users.add(user);
                        v.uses++;
                        this.uses--;
                    }
                }
            }
            else if (user === v) {
                assert(false, `TODO user==v (v=${v} this=${this}) -- CYCLIC USE!`);
            }
        }
        let i = this.b.values.indexOf(this);
        assert(i != -1, "not in parent block but still references block");
        this.b.values.splice(i, 1);
        if (DEBUG) {
            
            this.b = null;
        }
    }
}
var BlockKind;
(function (BlockKind) {
    BlockKind[BlockKind["Invalid"] = 0] = "Invalid";
    BlockKind[BlockKind["Plain"] = 1] = "Plain";
    BlockKind[BlockKind["If"] = 2] = "If";
    BlockKind[BlockKind["Ret"] = 3] = "Ret";
})(BlockKind || (BlockKind = {}));
class Block$1 {
    constructor(kind, id, f) {
        this.kind = BlockKind.Invalid;
        this.preds = [];
        this.control = null;
        this.values = [];
        this.sealed = false;
        this.comment = '';
        this.kind = kind;
        this.id = id;
        this.f = f;
    }
    newPhi(t) {
        let v = this.f.newValue(Op.Phi, t, this, null);
        this.values.push(v);
        return v;
    }
    newValue0(op, t, aux = null) {
        let v = this.f.newValue(op, t, this, aux);
        this.values.push(v);
        return v;
    }
    newValue1(op, t, arg0, aux = null) {
        let v = this.f.newValue(op, t, this, aux);
        v.args = [arg0];
        arg0.uses++;
        arg0.users.add(v);
        this.values.push(v);
        return v;
    }
    newValue2(op, t, arg0, arg1, aux = null) {
        let v = this.f.newValue(op, t, this, aux);
        v.args = [arg0, arg1];
        arg0.uses++;
        arg0.users.add(v);
        arg1.uses++;
        arg1.users.add(v);
        this.values.push(v);
        return v;
    }
    toString() {
        return 'b' + this.id;
    }
}
class Fun {
    constructor(type, name) {
        this.bid = 0;
        this.vid = 0;
        this.consts = null;
        this.blocks = [
            new Block$1(BlockKind.Plain, 0, this)
        ];
        this.type = type;
        this.name = name;
    }
    newBlock(k) {
        assert(this.bid < 0xFFFFFFFF, "too many block IDs generated");
        let b = new Block$1(k, ++this.bid, this);
        this.blocks.push(b);
        return b;
    }
    newValue(op, t, b, aux) {
        assert(this.vid < 0xFFFFFFFF, "too many value IDs generated");
        return new Value(++this.vid, op, t, b, aux);
    }
    constVal(t, c) {
        let f = this;
        let vv;
        let op = Op.None;
        switch (t.regtype) {
            case RegType.i32:
                op = Op.i32Const;
                break;
            case RegType.i64:
                op = Op.i64Const;
                break;
            case RegType.f32:
                op = Op.f32Const;
                break;
            case RegType.f64:
                op = Op.f64Const;
                break;
        }
        assert(op != Op.None);
        if (!f.consts) {
            f.consts = new Map();
        }
        else {
            vv = f.consts.get(c);
            if (vv)
                for (let v of vv) {
                    if (v.op == op && v.type.equals(t)) {
                        assert(v.aux === c, `cached const ${v} should have aux ${c}`);
                        return v;
                    }
                }
        }
        let v = f.blocks[0].newValue0(op, t, c);
        if (!vv) {
            f.consts.set(c, [v]);
        }
        else {
            vv.push(v);
        }
        return v;
    }
    toString() {
        return this.name.toString();
    }
}
class Pkg {
    constructor() {
        this.nI32 = 0;
        this.nI64 = 0;
        this.nF32 = 0;
        this.nF64 = 0;
        this.funs = [];
        this.init = null;
    }
}
var IRFlags;
(function (IRFlags) {
    IRFlags[IRFlags["Default"] = 0] = "Default";
    IRFlags[IRFlags["Comments"] = 1] = "Comments";
})(IRFlags || (IRFlags = {}));
class IRBuilder {
    constructor() {
        this.sfile = null;
        this.diagh = null;
        this.flags = IRFlags.Default;
    }
    init(diagh = null, flags = IRFlags.Default) {
        const r = this;
        r.pkg = new Pkg();
        r.sfile = null;
        r.diagh = diagh;
        r.vars = new Map();
        r.defvars = [];
        r.incompletePhis = null;
        r.flags = flags;
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
        debuglog(`${b}`);
        if (s.incompletePhis) {
            let entries = s.incompletePhis.get(b);
            if (entries) {
                for (let [name, phi] of entries) {
                    debuglog(`complete pending phi ${phi} (${name})`);
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
        while (r.defvars.length <= b.id) {
            r.defvars.push(null);
        }
        r.defvars[b.id] = r.vars;
        r.vars = new Map();
        r.b = null;
        return b;
    }
    startFun(f) {
        const r = this;
        assert(r.f == null, "starting function with existing function");
        r.f = f;
    }
    endFun() {
        const r = this;
        assert(r.f, "ending function without a current function");
        r.f = null;
    }
    nilValue() {
        assert(this.b, "no current block");
        return this.b.newValue0(Op.None, u_t_nil);
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
                assert(d.sig.result === u_t_nil, 'init fun with result');
                assert(d.body, 'missing body');
                r.initCode(d.body);
            }
            else if (d.body) {
                return r.fun(d);
            }
            else {
                debuglog(`skipping pure function declaration ${d}`);
            }
        }
        else if (d instanceof ImportDecl) {
            debuglog(`TODO ImportDecl`);
        }
        else if (d instanceof TypeDecl) {
            debuglog(`TODO TypeDecl`);
        }
        return null;
    }
    global(v) {
        debuglog(`TODO`);
    }
    initCode(body) {
    }
    fun(x) {
        const r = this;
        assert(x.body, `unresolved function ${x}`);
        assert(x.type, "unresolved function type");
        let funtype = x.type;
        let f = new Fun(funtype, x.name ? x.name.value : byteStr_anonfun);
        let entryb = f.blocks[0];
        for (let i = 0; i < x.sig.params.length; i++) {
            let p = x.sig.params[i];
            if (p.name) {
                let t = funtype.inputs[i];
                let name = p.name.value;
                let v = entryb.newValue0(Op.LoadParam, t, i);
                if (r.flags & IRFlags.Comments) {
                    v.comment = name.toString();
                }
                r.vars.set(name, v);
            }
        }
        r.startFun(f);
        r.startSealedBlock(entryb);
        let bodyval = r.block(x.body);
        if (r.b) {
            r.b.kind = BlockKind.Ret;
            if (!(x.body instanceof Block)) {
                r.b.control = bodyval;
            }
            r.endBlock();
        }
        assert(r.b == null, "function exit block not ended");
        assert(f.blocks[f.blocks.length - 1].kind == BlockKind.Ret, "last block in function is not BlockKind.Ret");
        r.endFun();
        r.pkg.funs.push(f);
        return f;
    }
    block(x) {
        const r = this;
        if (x instanceof Block) {
            let end = x.list.length;
            let lasti = end - 1;
            for (let i = 0; i != end; ++i) {
                if (!r.b) {
                    debuglog('block ended early');
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
            debuglog(`TODO: handle ${s.constructor.name}`);
        }
    }
    ret(val) {
        const r = this;
        let b = r.endBlock();
        b.kind = BlockKind.Ret;
        b.control = val;
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
        ifb = s.endBlock();
        ifb.control = control;
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
        if (s.flags & IRFlags.Comments) {
            ifb.comment = 'while';
            thenb.comment = 'then';
            nextb.comment = 'endwhile';
        }
    }
    if_(s) {
        const r = this;
        let control = r.expr(s.cond);
        let ifb = r.endBlock();
        ifb.kind = BlockKind.If;
        ifb.control = control;
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
            if (r.flags & IRFlags.Comments) {
                thenb.comment = 'then';
                elseb.comment = 'else';
                contb.comment = 'endif';
            }
        }
        else {
            thenb.succs = [elseb];
            elseb.preds = [ifb, thenb];
            elseb.succs = null;
            r.startSealedBlock(elseb);
            if (r.flags & IRFlags.Comments) {
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
            assert(lhs.type instanceof BasicType, `${lhs.type} is not BasicType`);
            let t = lhs.type;
            let x = r.expr(lhs);
            let y = r.f.constVal(t, 1);
            let op = getop(s.op == token.INC ? token.ADD : token.SUB, t);
            let v = r.b.newValue2(op, t, x, y);
            return r.assign(lhs, v);
        }
        if (s.op != token.ASSIGN) {
            assert(s.op < token.assignop_beg || s.op > token.assignop_end, `invalid assignment operation ${token[s.op]}`);
            assert(s.lhs.length == 1);
            assert(s.rhs.length == 1);
            let lhs = s.lhs[0];
            let t = lhs.type;
            assert(t instanceof BasicType, "increment operation on complex type");
            let op = getop(s.op, t);
            let x = r.expr(lhs);
            let y = r.expr(s.rhs[0]);
            let v = r.b.newValue2(op, t, x, y);
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
        }
        return v;
    }
    expr(s) {
        const r = this;
        assert(s.type, `type not resolved for ${s}`);
        if (s instanceof BasicLit) {
            if (s.op != token.ILLEGAL) {
                debuglog(`TODO handle BasicLit.op`);
            }
            let t = s.type;
            let c = 0;
            if (s.isInt()) {
                c = s.isSignedInt() ? s.parseSInt() : s.parseUInt();
            }
            else {
                c = s.parseFloat();
            }
            return r.f.constVal(t, c);
        }
        if (s instanceof Ident) {
            return r.readVariable(s.value, s.type, null);
        }
        if (s instanceof Assignment) {
            return r.assignment(s);
        }
        if (s instanceof Operation) {
            if (s.op == token.OROR || s.op == token.ANDAND) {
                return r.opAndAnd(s);
            }
            else {
                let left = r.expr(s.x);
                let t = s.type;
                assert(t instanceof BasicType);
                let op = getop(s.op, t);
                if (s.y) {
                    let right = r.expr(s.y);
                    return r.b.newValue2(op, t, left, right);
                }
                else {
                    return r.b.newValue1(op, t, left);
                }
            }
        }
        if (s instanceof CallExpr) {
            return r.funcall(s);
        }
        debuglog(`TODO: handle ${s.constructor.name}`);
        return r.nilValue();
    }
    opAndAnd(n) {
        const s = this;
        assert(n.y != null);
        let tmpname = asciiByteStr('tmp');
        let left = s.expr(n.x);
        s.writeVariable(tmpname, left);
        let t = left.type;
        let rightb = s.f.newBlock(BlockKind.Plain);
        let contb = s.f.newBlock(BlockKind.Plain);
        let ifb = s.endBlock();
        ifb.kind = BlockKind.If;
        ifb.control = left;
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
        let tmpv = s.b.newValue1(Op.Copy, right.type, right);
        s.writeVariable(tmpname, tmpv);
        rightb = s.endBlock();
        rightb.succs = [contb];
        assert(t.equals(right.type), "operands have different types");
        contb.preds = [ifb, rightb];
        s.startSealedBlock(contb);
        return s.readVariable(tmpname, u_t_bool, null);
    }
    funcall(x) {
        const s = this;
        if (x.hasDots) {
            debuglog(`TODO: handle call with hasDots`);
        }
        let argvals = [];
        for (let arg of x.args) {
            argvals.push(s.expr(arg));
        }
        for (let v of argvals) {
            s.b.newValue1(Op.PushParam, v.type, v);
        }
        assert(x.fun instanceof Ident, "non-id callee not yet supported");
        let funid = x.fun;
        assert(funid.ent, "unresolved callee");
        let ft = funid.type;
        assert(ft, "unresolved function type");
        return s.b.newValue0(Op.Call, ft.result, funid.value);
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
    readGlobal(name) {
        const s = this;
        debuglog(`TODO readGlobal ${name}`);
        return s.nilValue();
    }
    writeVariable(name, v, b) {
        const s = this;
        debuglog(`${b || s.b} ${name} = ${Op[v.op]} ${v}`);
        if (!b || b === s.b) {
            s.vars.set(name, v);
        }
        else {
            while (s.defvars.length <= b.id) {
                s.defvars.push(null);
            }
            let m = s.defvars[b.id];
            if (m) {
                m.set(name, v);
            }
            else {
                s.defvars[b.id] = new Map([[name, v]]);
            }
        }
    }
    addIncompletePhi(phi, name, b) {
        const s = this;
        debuglog(`${b} ${phi} var=${name}`);
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
            debuglog(`${b} ${name} not yet sealed`);
            val = b.newPhi(t);
            s.addIncompletePhi(val, name, b);
        }
        else if (b.preds.length == 1) {
            debuglog(`${b} ${name} common case: single predecessor ${b.preds[0]}`);
            val = s.readVariable(name, t, b.preds[0]);
            debuglog(`found ${name} : ${val}`);
        }
        else if (b.preds.length == 0) {
            debuglog(`${b} ${name} uncommon case: outside of function`);
            val = s.readGlobal(name);
        }
        else {
            debuglog(`${b} ${name} uncommon case: multiple predecessors`);
            val = b.newPhi(t);
            s.writeVariable(name, val, b);
            val = s.addPhiOperands(name, val);
        }
        s.writeVariable(name, val, b);
        return val;
    }
    addPhiOperands(name, phi) {
        const s = this;
        assert(phi.op == Op.Phi);
        debuglog(`${name} phi=${phi}`);
        for (let pred of phi.b.preds) {
            debuglog(`  ${pred}`);
            let v = s.readVariable(name, phi.type, pred);
            if (v !== phi) {
                debuglog(`  ${pred} ${v}<${Op[v.op]}>`);
                phi.appendArg(v);
            }
        }
        return s.tryRemoveTrivialPhi(phi);
    }
    tryRemoveTrivialPhi(phi) {
        const s = this;
        assert(phi.op == Op.Phi);
        let same = null;
        debuglog(`${phi.b} ${phi}`);
        assert(phi.args != null, "phi without operands");
        for (let operand of phi.args) {
            if (operand === same || operand === phi) {
                continue;
            }
            if (same != null) {
                debuglog(`${phi.b} ${phi} not trivial (keep)`);
                return phi;
            }
            same = operand;
        }
        debuglog(`${phi.b} ${phi} is trivial (remove)`);
        if (same == null) {
            debuglog(`${phi.b} ${phi} unreachable or in the start block`);
            same = new Value(0, Op.None, u_t_nil, phi.b, null);
        }
        phi.users.delete(phi);
        let users = phi.users;
        debuglog(`${phi.b} replace ${phi} with ${same} (aux = ${same.aux})`);
        phi.replaceBy(same);
        assert(phi.uses == 0, `still used even after Value.replaceBy`);
        for (let use of users) {
            if (use.op == Op.Phi) {
                s.tryRemoveTrivialPhi(use);
            }
        }
        return same;
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
//# sourceMappingURL=ir.js.map

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
    let s = `v${v.id} = `;
    s += Op[v.op];
    if (f.types) {
        s += ' ' + f.style.grey(`<${v.type}>`);
    }
    if (v.args)
        for (let arg of v.args) {
            s += ' ' + arg;
        }
    if (v.aux !== null) {
        s += ' [' + v.aux + ']';
    }
    if (v.comment) {
        s += '  // ' + v.comment;
    }
    return s;
}
function printval(f, v, indent) {
    f.println(indent + fmtval(f, v));
}
function printblock(f, b, indent) {
    let label = b.toString();
    let preds = '';
    if (b.preds && b.preds.length) {
        preds = f.larr + b.preds.map(b => f.style.lightyellow(b.toString())).join(', ');
    }
    let comment = b.comment ? '  // ' + b.comment : '';
    f.println(indent + f.style.lightyellow(label + ':') + preds + comment);
    let valindent = indent + '  ';
    for (let v of b.values) {
        printval(f, v, valindent);
    }
    switch (b.kind) {
        case BlockKind.Plain: {
            assert(b.succs != null, 'missing successor for plain block');
            assert(b.succs && b.succs.length == 1, `b.succs.length = ${b.succs && b.succs.length || 0}; expected 1`);
            let succs = b.succs;
            let contb = succs[0];
            f.println(indent +
                f.style.cyan('cont') + f.rarr +
                f.style.lightyellow(contb.toString()));
            break;
        }
        case BlockKind.If: {
            assert(b.succs != null, 'missing successors for if block');
            assert(b.succs && b.succs.length == 2, `b.succs.length = ${b.succs && b.succs.length || 0}; expected 2`);
            assert(b.control, "missing control (condition) value");
            let succs = b.succs;
            let thenb = succs[0];
            let elseb = succs[1];
            f.println(indent +
                f.style.cyan('if') +
                ` ${b.control}${f.rarr}` +
                f.style.lightyellow(thenb.toString()) + ' ' +
                f.style.lightyellow(elseb.toString()));
            break;
        }
        case BlockKind.Ret: {
            assert(b.succs == null, "can't have successor to return block");
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
        ' (' + fn.type.inputs.join(' ') + ')->' + fn.type.result);
    let first = true;
    for (let b of fn.blocks) {
        if (first) {
            first = false;
        }
        else {
            f.println('');
        }
        printblock(f, b, '  ');
    }
}
function printpkg(f, pkg) {
    for (let i = 0; i < pkg.funs.length; i++) {
        printfun(f, pkg.funs[i]);
        if (i + 1 < pkg.funs.length) {
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
    return str;
}
//# sourceMappingURL=ir-repr.js.map

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
function main(sources, noIR) {
    const strSet = new ByteStrSet();
    const typeSet = new TypeSet();
    const universe = new Universe(strSet, typeSet);
    const typeres = new TypeResolver();
    const parser = new Parser();
    const _sources = sources || ['example/ssa1.xl'];
    diagnostics = [];
    let p = parsePkg("example", _sources, universe, parser, typeres).then(r => {
        if (!r.success) {
            return { success: false, diagnostics, ast: r.pkg };
        }
        if (noIR) {
            return { success: true, diagnostics, ast: r.pkg };
        }
        const irb = new IRBuilder();
        irb.init(diagh, IRFlags.Comments);
        try {
            for (const file of r.pkg.files) {
                if (isNodeJsLikeEnv) {
                    banner(`${r.pkg} ${file.sfile.name} ${file.decls.length} declarations`);
                    console.log(astRepr(r.pkg, reprOptions));
                    banner(`ssa-ir ${file.sfile.name}`);
                }
                let sfile = file.sfile;
                for (let d of file.decls) {
                    let n = irb.addTopLevel(sfile, d);
                    if (isNodeJsLikeEnv) {
                        if (n) {
                            console.log(`\n-----------------------\n`);
                            printir(n);
                        }
                    }
                }
            }
            return { success: true, diagnostics, ast: r.pkg, ir: irb.pkg };
        }
        catch (error) {
            if (isNodeJsLikeEnv) {
                throw error;
            }
            return { success: false, error, diagnostics, ast: r.pkg };
        }
    });
    if (!sources && isNodeJsLikeEnv) {
        return p.catch(err => {
            console.error(err.stack || '' + err);
            process.exit(1);
            return { success: false, diagnostics };
        });
    }
    return p;
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
if (isNodeJsLikeEnv) {
    main();
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
//# sourceMappingURL=xlang.debug.js.map
