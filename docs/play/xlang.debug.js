/* xlang 1.0.0-debug */

'use strict';

var VERSION = "1.0.0-debug", DEBUG = true;
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
_stackTrace(cons);
console.error("assertion failure:",msg||cond),
console.error(_stackTrace(cons)),
exit(3)}}




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

var fs = require('fs');

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

function tokstr(t) {
    return tokenStrings.get(t) || token[t].toLowerCase();
}
var prec;
(function (prec) {
    prec[prec["LOWEST"] = 0] = "LOWEST";
    prec[prec["OR"] = 1] = "OR";
    prec[prec["AND"] = 2] = "AND";
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
    token[token["INT"] = 6] = "INT";
    token[token["INT_BIN"] = 7] = "INT_BIN";
    token[token["INT_OCT"] = 8] = "INT_OCT";
    token[token["INT_HEX"] = 9] = "INT_HEX";
    token[token["FLOAT"] = 10] = "FLOAT";
    token[token["RATIO"] = 11] = "RATIO";
    token[token["CHAR"] = 12] = "CHAR";
    token[token["STRING"] = 13] = "STRING";
    token[token["STRING_MULTI"] = 14] = "STRING_MULTI";
    token[token["STRING_PIECE"] = 15] = "STRING_PIECE";
    token[token["literal_end"] = 16] = "literal_end";
    token[token["delim_beg"] = 17] = "delim_beg";
    token[token["LPAREN"] = 18] = "LPAREN";
    token[token["LBRACK"] = 19] = "LBRACK";
    token[token["LBRACE"] = 20] = "LBRACE";
    token[token["COMMA"] = 21] = "COMMA";
    token[token["DOT"] = 22] = "DOT";
    token[token["PERIODS"] = 23] = "PERIODS";
    token[token["ELLIPSIS"] = 24] = "ELLIPSIS";
    token[token["RPAREN"] = 25] = "RPAREN";
    token[token["RBRACK"] = 26] = "RBRACK";
    token[token["RBRACE"] = 27] = "RBRACE";
    token[token["SEMICOLON"] = 28] = "SEMICOLON";
    token[token["COLON"] = 29] = "COLON";
    token[token["delim_end"] = 30] = "delim_end";
    token[token["operator_beg"] = 31] = "operator_beg";
    token[token["ASSIGN"] = 32] = "ASSIGN";
    token[token["assignop_beg"] = 33] = "assignop_beg";
    token[token["ADD_ASSIGN"] = 34] = "ADD_ASSIGN";
    token[token["SUB_ASSIGN"] = 35] = "SUB_ASSIGN";
    token[token["MUL_ASSIGN"] = 36] = "MUL_ASSIGN";
    token[token["QUO_ASSIGN"] = 37] = "QUO_ASSIGN";
    token[token["REM_ASSIGN"] = 38] = "REM_ASSIGN";
    token[token["AND_ASSIGN"] = 39] = "AND_ASSIGN";
    token[token["OR_ASSIGN"] = 40] = "OR_ASSIGN";
    token[token["XOR_ASSIGN"] = 41] = "XOR_ASSIGN";
    token[token["SHL_ASSIGN"] = 42] = "SHL_ASSIGN";
    token[token["SHR_ASSIGN"] = 43] = "SHR_ASSIGN";
    token[token["AND_NOT_ASSIGN"] = 44] = "AND_NOT_ASSIGN";
    token[token["assignop_end"] = 45] = "assignop_end";
    token[token["INC"] = 46] = "INC";
    token[token["DEC"] = 47] = "DEC";
    token[token["SET_ASSIGN"] = 48] = "SET_ASSIGN";
    token[token["NOT"] = 49] = "NOT";
    token[token["ARROWL"] = 50] = "ARROWL";
    token[token["ARROWR"] = 51] = "ARROWR";
    token[token["LOR"] = 52] = "LOR";
    token[token["LAND"] = 53] = "LAND";
    token[token["EQL"] = 54] = "EQL";
    token[token["NEQ"] = 55] = "NEQ";
    token[token["LSS"] = 56] = "LSS";
    token[token["LEQ"] = 57] = "LEQ";
    token[token["GTR"] = 58] = "GTR";
    token[token["GEQ"] = 59] = "GEQ";
    token[token["ADD"] = 60] = "ADD";
    token[token["SUB"] = 61] = "SUB";
    token[token["OR"] = 62] = "OR";
    token[token["XOR"] = 63] = "XOR";
    token[token["MUL"] = 64] = "MUL";
    token[token["QUO"] = 65] = "QUO";
    token[token["REM"] = 66] = "REM";
    token[token["AND"] = 67] = "AND";
    token[token["AND_NOT"] = 68] = "AND_NOT";
    token[token["SHL"] = 69] = "SHL";
    token[token["SHR"] = 70] = "SHR";
    token[token["operator_end"] = 71] = "operator_end";
    token[token["keyword_beg"] = 72] = "keyword_beg";
    token[token["BREAK"] = 73] = "BREAK";
    token[token["CONTINUE"] = 74] = "CONTINUE";
    token[token["DEFAULT"] = 75] = "DEFAULT";
    token[token["DEFER"] = 76] = "DEFER";
    token[token["ELSE"] = 77] = "ELSE";
    token[token["ENUM"] = 78] = "ENUM";
    token[token["FALLTHROUGH"] = 79] = "FALLTHROUGH";
    token[token["FOR"] = 80] = "FOR";
    token[token["FUN"] = 81] = "FUN";
    token[token["GO"] = 82] = "GO";
    token[token["IF"] = 83] = "IF";
    token[token["IMPORT"] = 84] = "IMPORT";
    token[token["INTERFACE"] = 85] = "INTERFACE";
    token[token["IN"] = 86] = "IN";
    token[token["RETURN"] = 87] = "RETURN";
    token[token["SELECT"] = 88] = "SELECT";
    token[token["SWITCH"] = 89] = "SWITCH";
    token[token["SYMBOL"] = 90] = "SYMBOL";
    token[token["TYPE"] = 91] = "TYPE";
    token[token["keyword_end"] = 92] = "keyword_end";
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
    [token.LAND, "&&"],
    [token.LOR, "||"],
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
    [token.LBRACK, "["],
    [token.LBRACE, "{"],
    [token.COMMA, ","],
    [token.DOT, "."],
    [token.RPAREN, ")"],
    [token.RBRACK, "]"],
    [token.RBRACE, "}"],
    [token.SEMICOLON, ";"],
    [token.COLON, ":"],
]);
for (let i = token.keyword_beg + 1; i < token.keyword_end; ++i) {
    const t = token[i];
    tokenStrings.set(token[t], t.toLowerCase());
}
const cdat = new Uint8Array([
    102, 117, 110, 100, 101, 102, 101, 114, 98, 114, 101, 97, 107, 99, 111, 110, 116, 105, 110, 117,
    101, 100, 101, 102, 97, 117, 108, 116, 101, 110, 117, 109, 101, 108, 115, 101, 102, 97, 108,
    108, 116, 104, 114, 111, 117, 103, 104, 102, 111, 114, 105, 110, 116, 101, 114, 102, 97, 99,
    101, 105, 102, 103, 111, 105, 109, 112, 111, 114, 116, 105, 110, 115, 101, 108, 101, 99, 116,
    114, 101, 116, 117, 114, 110, 115, 119, 105, 116, 99, 104, 115, 121, 109, 98, 111, 108, 116,
    121, 112, 101
]);
const keywords = new BTree({ k: cdat.subarray(0, 3), v: token.FUN,
    L: { k: cdat.subarray(3, 8), v: token.DEFER,
        L: { k: cdat.subarray(8, 13), v: token.BREAK,
            R: { k: cdat.subarray(13, 21), v: token.CONTINUE,
                R: { k: cdat.subarray(21, 28), v: token.DEFAULT } } },
        R: { k: cdat.subarray(28, 32), v: token.ENUM,
            L: { k: cdat.subarray(32, 36), v: token.ELSE },
            R: { k: cdat.subarray(36, 47), v: token.FALLTHROUGH,
                R: { k: cdat.subarray(47, 50), v: token.FOR } } } },
    R: { k: cdat.subarray(50, 59), v: token.INTERFACE,
        L: { k: cdat.subarray(59, 61), v: token.IF,
            L: { k: cdat.subarray(61, 63), v: token.GO },
            R: { k: cdat.subarray(63, 69), v: token.IMPORT,
                R: { k: cdat.subarray(69, 71), v: token.IN } } },
        R: { k: cdat.subarray(71, 77), v: token.SELECT,
            L: { k: cdat.subarray(77, 83), v: token.RETURN },
            R: { k: cdat.subarray(83, 89), v: token.SWITCH,
                R: { k: cdat.subarray(89, 95), v: token.SYMBOL,
                    R: { k: cdat.subarray(95, 99), v: token.TYPE } } } } } });
function lookupKeyword(ident) {
    return keywords.get(ident) || token.NAME;
}

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
function buf8str(b) {
    return decodeToString(b);
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
    }
}

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
        s.readchar();
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
                    if (isDigit(s.ch)) {
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
                    s.tok = token.LBRACK;
                    break;
                case 0x5d:
                    s.tok = token.RBRACK;
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
                        s.tok = token.LAND;
                        s.prec = prec.AND;
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
                        s.tok = token.LOR;
                        s.prec = prec.OR;
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
    constructor(pos, scope, type, ident) {
        super(pos, scope);
        this.type = type;
        this.ident = ident;
    }
}
class Ent {
    constructor(name, decl, value, data = null) {
        this.name = name;
        this.decl = decl;
        this.value = value;
        this.data = data;
        this.writes = 0;
        this.reads = new Set();
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
class Decl extends Node {
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
class Stmt extends Node {
}
class BlockStmt extends Stmt {
    constructor(pos, scope, list) {
        super(pos, scope);
        this.list = list;
    }
}
class SimpleStmt extends Stmt {
}
class ExprStmt extends SimpleStmt {
    constructor(pos, scope, expr) {
        super(pos, scope);
        this.expr = expr;
    }
}
class ReturnStmt extends Stmt {
    constructor(pos, scope, result) {
        super(pos, scope);
        this.result = result;
    }
}
class AssignStmt extends SimpleStmt {
    constructor(pos, scope, op, lhs, rhs) {
        super(pos, scope);
        this.op = op;
        this.lhs = lhs;
        this.rhs = rhs;
    }
}
class DeclStmt extends SimpleStmt {
    constructor(pos, scope, decls) {
        super(pos, scope);
        this.decls = decls;
    }
}
class Expr extends Node {
    constructor() {
        super(...arguments);
        this.type = null;
    }
}
class BadExpr extends Expr {
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
class Ident extends Expr {
    constructor(pos, scope, value) {
        super(pos, scope);
        this.value = value;
        this.ent = null;
    }
    toString() { return String(this.value); }
    refEnt(ent) {
        assert(this !== ent.decl, "ref declaration");
        ent.reads.add(this);
        this.ent = ent;
    }
    unrefEnt() {
        assert(this.ent, "null ent");
        const ent = this.ent;
        const _ok = ent.reads.delete(this);
        assert(_ok, "ent not referenced");
        this.ent = null;
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
    constructor(pos, scope, tok, value) {
        super(pos, scope);
        this.tok = tok;
        this.value = value;
    }
    toString() {
        return decodeToString(this.value);
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
class Operation extends Expr {
    constructor(pos, scope, op, x, y = null) {
        super(pos, scope);
        this.op = op;
        this.x = x;
        this.y = y;
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
class ParenExpr extends Expr {
    constructor(pos, scope, x) {
        super(pos, scope);
        this.x = x;
    }
}
class FunDecl extends Expr {
    constructor(pos, scope, name, sig, isInit = false) {
        super(pos, scope);
        this.name = name;
        this.sig = sig;
        this.isInit = isInit;
        this.body = null;
        this.nlocali32 = 0;
        this.nlocali64 = 0;
        this.nlocalf32 = 0;
        this.nlocalf64 = 0;
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
        if (!this.refs) {
            this.refs = [x];
        }
        else {
            this.refs.push(x);
        }
    }
    toString() {
        return this.expr.toString();
    }
}
class IntrinsicType extends Type {
    constructor(bitsize, name) {
        super(0, nilScope);
        this.bitsize = bitsize;
        this.name = name;
    }
    toString() {
        return this.name;
    }
    equals(other) {
        return (this === other ||
            (other instanceof ConstStringType && this.name == 'string'));
    }
}
class ConstStringType extends IntrinsicType {
    constructor(bitsize, length) {
        super(bitsize, 'str');
        this.bitsize = bitsize;
        this.length = length;
    }
    toString() {
        return `str[${this.length}]`;
    }
    equals(other) {
        return (this === other ||
            (other instanceof ConstStringType &&
                this.bitsize == other.bitsize &&
                this.length == other.length) ||
            (other instanceof IntrinsicType &&
                other.name == 'string'));
    }
}
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
            other instanceof RestType && this.type.equals(other.type));
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
    constructor(pos, scope, inputs, output) {
        super(pos, scope);
        this.inputs = inputs;
        this.output = output;
    }
    equals(other) {
        return (this === other ||
            (other instanceof FunType &&
                this.output.equals(other.output) &&
                this.inputs.length == other.inputs.length &&
                this.inputs.every((t, i) => t.equals(other.inputs[i]))));
    }
}
class File {
    constructor(sfile, scope, imports, decls, unresolved) {
        this.sfile = sfile;
        this.scope = scope;
        this.imports = imports;
        this.decls = decls;
        this.unresolved = unresolved;
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

const universeTypes = new Map();
const universeValues = new Map();
function ityp(bitsize, name) {
    const x = new IntrinsicType(bitsize, name);
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
const uintz = 32;
const u_t_void = new IntrinsicType(0, 'void');
const u_t_auto = new IntrinsicType(0, 'auto');
const u_t_nil = new IntrinsicType(0, '?');
const u_t_bool = ityp(1, 'bool');
const u_t_uint = ityp(uintz, 'uint');
const u_t_int = ityp(uintz - 1, 'int');
const u_t_i8 = ityp(7, 'i8');
const u_t_i16 = ityp(15, 'i16');
const u_t_i32 = ityp(31, 'i32');
const u_t_i64 = ityp(63, 'i64');
const u_t_u8 = ityp(8, 'u8');
const u_t_u16 = ityp(16, 'u16');
const u_t_u32 = ityp(32, 'u32');
const u_t_u64 = ityp(64, 'u64');
const u_t_f32 = ityp(32, 'f32');
const u_t_f64 = ityp(64, 'f64');
const u_t_string = ityp(uintz, 'string');
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
            [u_t_uint, uintz <= 63 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
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
            [u_t_uint, uintz <= 32 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
            [u_t_int, uintz <= 32 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
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
            [u_t_int, uintz <= 32 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
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
            [u_t_i64, uintz >= 64 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
            [u_t_u8, TypeCompat.LOSSLESS],
            [u_t_u16, TypeCompat.LOSSLESS],
            [u_t_u32, uintz >= 32 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
            [u_t_u64, uintz >= 64 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
            [u_t_f32, TypeCompat.LOSSY],
            [u_t_f64, TypeCompat.LOSSY],
        ])],
    [u_t_int, new Map([
            [u_t_uint, TypeCompat.LOSSY],
            [u_t_i8, TypeCompat.LOSSLESS],
            [u_t_i16, TypeCompat.LOSSLESS],
            [u_t_i32, TypeCompat.LOSSLESS],
            [u_t_i64, uintz >= 64 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
            [u_t_u8, TypeCompat.LOSSLESS],
            [u_t_u16, TypeCompat.LOSSLESS],
            [u_t_u32, uintz >= 32 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
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
            [u_t_uint, uintz <= 32 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
            [u_t_int, uintz <= 32 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
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
    if (uintz == 64) {
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
    if (uintz == 64) {
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
    if (uintz == 64) {
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
    if (uintz <= 32) {
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
function intBinBits(v) {
    let start = 2;
    while (v[start] == 0x30) {
        start++;
    }
    let n = v.length - start;
    return n > 64 ? 0 : n || 1;
}
TEST("intBinBits", () => {
    for (let v of [
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
    ]) {
        let input = v[0];
        let expected = v[1];
        let actual = intBinBits(asciibuf(input));
        assert(actual == expected, `${JSON.stringify(input)} => ${actual}; expected ${expected}`);
    }
});
function intOctBits(b) {
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
                        z == 11 ? (b[start] < 0x32 ? 31 :
                            b[start] < 0x34 ? 32 :
                                63) :
                            z < 22 ? 63 :
                                z == 22 && b[start] < 0x32 ? 64 :
                                    0);
}
TEST("intOctBits", () => {
    for (let v of [
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
    ]) {
        let input = v[0];
        let expected = v[1];
        let actual = intOctBits(asciibuf(input));
        assert(actual === expected, `${JSON.stringify(input)} => ${actual}; expected ${expected}`);
    }
});
const i64maxDecBuf = new Uint8Array([
    57, 50, 50, 51, 51, 55, 50, 48, 51, 54, 56, 53, 52, 55, 55, 53, 56, 48, 55
]);
const u64maxDecBuf = new Uint8Array([
    49, 56, 52, 52, 54, 55, 52, 52, 48, 55, 51, 55, 48, 57, 53, 53, 49, 54, 49, 53
]);
function intDecBits(b) {
    let v = 0, z = b.length;
    for (let i = 0; i < z; i++) {
        v = v * 10 + (b[i] - 0x30);
    }
    if (v < 0x1FFFFFFFFFFFFF) {
        return v < 0x80 ? 7 : Math.floor(Math.log2(v)) + 1;
    }
    let start = 0;
    while (b[start] == 0x30) {
        start++;
    }
    z = b.length - start;
    return (z < 19 ? 63 :
        z == 19 ? bufcmp$1(b, i64maxDecBuf, start) <= 0 ? 63 : 64 :
            z == 20 && bufcmp$1(b, u64maxDecBuf, start) <= 0 ? 64 :
                0);
}
TEST("intDecBits", () => {
    for (let v of [
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
    ]) {
        let input = v[0];
        let expected = v[1];
        let actual = intDecBits(asciibuf(input));
        assert(actual == expected, `${JSON.stringify(input)} => ${actual}; expected ${expected}`);
    }
});
function intHexBits(b) {
    let v = 0, z = b.length;
    for (let n = 0, i = 2; i < z; i++) {
        n = b[i];
        n = (n >= 0x30 && n <= 0x39 ? n - 0x30 :
            n >= 0x41 && n <= 0x46 ? n - 0x41 + 10 :
                n - 0x61 + 10);
        v = v * 16 + n;
    }
    if (v < 0x1FFFFFFFFFFFFF) {
        return v < 0x80 ? 7 : Math.floor(Math.log2(v)) + 1;
    }
    let start = 2;
    while (b[start] == 0x30) {
        start++;
    }
    z = b.length - start;
    return (z < 16 || (z == 16 && b[start] <= 0x37) ? 63 :
        z == 16 ? 64 :
            0);
}
TEST("intHexBits", () => {
    for (let v of [
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
    ]) {
        let input = v[0];
        let expected = v[1];
        let actual = intHexBits(asciibuf(input));
        assert(actual == expected, `${JSON.stringify(input)} => ${actual}; expected ${expected}`);
    }
});
function intLitTypeFitter(x, reqt, errh) {
    let bits = 0;
    switch (x.tok) {
        case token.INT_BIN:
            bits = intBinBits(x.value);
            break;
        case token.INT_OCT:
            bits = intOctBits(x.value);
            break;
        case token.INT:
            bits = intDecBits(x.value);
            break;
        case token.INT_HEX:
            bits = intHexBits(x.value);
            break;
    }
    if (bits == 0) {
        if (errh) {
            let t = reqt instanceof IntrinsicType ? reqt : u_t_u64;
            errh(`constant ${buf8str(x.value)} overflows ${t.name}`, x.pos);
            bits = 64;
        }
    }
    else if (reqt instanceof IntrinsicType) {
        if (reqt.bitsize >= bits) {
            return reqt;
        }
        if (errh) {
            errh(`constant ${buf8str(x.value)} overflows ${reqt.name}`, x.pos);
            bits = 64;
        }
    }
    return (bits <= 31 ? u_t_int :
        bits <= 63 ? u_t_i64 :
            u_t_u64);
}
function floatLitTypeFitter(x, reqt, errh) {
    return u_t_f64;
}
function charLitTypeFitter(x, reqt, errh) {
    return u_t_u32;
}
const basicLitTypesFitters = new Map([
    [token.CHAR, charLitTypeFitter],
    [token.INT, intLitTypeFitter],
    [token.INT_BIN, intLitTypeFitter],
    [token.INT_OCT, intLitTypeFitter],
    [token.INT_HEX, intLitTypeFitter],
    [token.FLOAT, floatLitTypeFitter],
]);
const u_v_true = ival('true', u_t_bool);
const u_v_false = ival('false', u_t_bool);
const u_v_nil = ival('nil', u_t_nil);
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
    basicLitType(x, reqType, errh) {
        let f = basicLitTypesFitters.get(x.tok);
        assert(f, `missing type fitter for ${tokstr(x.tok)}`);
        return f(x, reqType || null, errh);
    }
    internType(t) {
        return this.typeSet.intern(t);
    }
}

var DiagKind;
(function (DiagKind) {
    DiagKind[DiagKind["INFO"] = 0] = "INFO";
    DiagKind[DiagKind["WARN"] = 1] = "WARN";
    DiagKind[DiagKind["ERROR"] = 2] = "ERROR";
})(DiagKind || (DiagKind = {}));
const kEmptyByteArray = new Uint8Array(0);
const kBytes__ = new Uint8Array([0x5f]);
const kBytes_dot = new Uint8Array([0x2e]);
const kBytes_init = new Uint8Array([0x69, 0x6e, 0x69, 0x74]);
const emptyExprList = [];
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
    inFun() {
        return this.funstack[0] || null;
    }
    currFun() {
        assert(this.funstack.length > 0, 'access current function at file level');
        return this.funstack[0];
    }
    pushFun(f) {
        this.funstack.push(f);
    }
    popFun() {
        assert(this.funstack.length > 0, 'popFun with empty funstack');
        return this.funstack.pop();
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
                if (ent.reads.size == 0) {
                    if (ent.decl instanceof Field) {
                        p.diag(DiagKind.WARN, `${name} not used`, ent.decl.pos, (ent.decl.scope.isFunScope ? 'E_UNUSED_PARAM' :
                            'E_UNUSED_FIELD'));
                    }
                    else {
                        p.diag(DiagKind.WARN, `${name} declared and not used`, ent.decl.pos, 'E_UNUSED_VAR');
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
        const ent = new Ent(ident.value, decl, x);
        if (scope.declareEnt(ent)) {
            const f = p.inFun();
            if (f) {
                f.nlocali32++;
                debuglog(`${ident} in scope#${scope.level()}; ` +
                    `nlocali32: ${f.nlocali32}`);
            }
        }
        else {
            p.syntaxError(`${ident} redeclared`, ident.pos);
        }
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
        assert(x.ent == null, "identifier already declared or resolved");
        if (x.value === p._id__) {
            return x;
        }
        let s = x.scope;
        while (s) {
            const ent = s.lookupImm(x.value);
            if (ent) {
                x.refEnt(ent);
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
            if (ctx instanceof AssignStmt) {
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
                    decls.push(p.funDecl());
                    break;
                default: {
                    if (p.tok == token.LBRACE &&
                        decls.length > 0 &&
                        isEmptyFunDecl(decls[decls.length - 1])) {
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
        if (d.type) {
            const t = p.types.resolve(d.type);
            d.type = t;
            d.idents.forEach(ident => { ident.type = t; });
        }
        else {
            assert(d.values, "no type and no vals");
            let vals = d.values;
            for (let x of vals) {
                p.types.resolve(x);
            }
            vals.forEach((v, i) => {
                let ident = d.idents[i];
                ident.type = v.type;
            });
        }
        p.declarev(d.scope, idents, d, d.values);
        return d;
    }
    funDecl() {
        const p = this;
        const pos = p.pos;
        p.want(token.FUN);
        const name = p.ident();
        const isInitFun = p.scope === p.filescope && name.value.equals(p._id_init);
        const scope = p.scope === p.filescope ? p.pkgscope : p.scope;
        p.pushScope(new Scope(p.scope, null, true));
        const d = new FunDecl(pos, p.scope, name, p.funSig(u_t_void), isInitFun);
        if (isInitFun) {
            if (d.sig.params.length > 0) {
                p.syntaxError(`init function with parameters`, d.sig.pos);
            }
            if (d.sig.result !== u_t_void) {
                p.syntaxError(`init function with result`, d.sig.pos);
            }
        }
        else {
            p.declare(scope, name, d, d);
        }
        if (isInitFun || p.tok != token.SEMICOLON) {
            if (isInitFun) {
                p.initfnest++;
            }
            p.pushFun(d);
            d.body = p.funBody(name);
            p.popFun();
            if (isInitFun) {
                p.initfnest--;
            }
        }
        p.popScope();
        if (d.sig.result === u_t_void) {
            d.sig.result = d.body instanceof ExprStmt ? d.body.expr : u_t_void;
        }
        const funtype = p.types.resolve(d);
        if (!isInitFun) {
            name.type = funtype;
        }
        return d;
    }
    funStmt(ctx) {
        const p = this;
        const pos = p.pos;
        p.want(token.FUN);
        const name = p.maybeIdent();
        const scope = p.scope;
        p.pushScope(new Scope(scope, null, true));
        const d = new FunDecl(pos, scope, name, p.funSig(u_t_void));
        if (name && !ctx) {
            p.declare(name.scope, name, d, d);
        }
        p.pushFun(d);
        d.body = p.funBody(name);
        p.popFun();
        p.popScope();
        if (d.sig.result === u_t_void) {
            d.sig.result = d.body instanceof ExprStmt ? d.body.expr : u_t_void;
        }
        const funtype = p.types.resolve(d);
        if (name) {
            name.type = funtype;
        }
        return d;
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
        const fields = [];
        let seenRestExpr = false;
        while (p.tok != token.RPAREN) {
            let f = new Field(p.pos, p.scope, u_t_auto, null);
            f.ident = p.ident();
            p.declare(f.ident.scope, f.ident, f, null);
            if (p.tok == token.ELLIPSIS) {
                f.type = p.restExpr(u_t_auto);
                if (seenRestExpr) {
                    p.syntaxError("can only use ... with final parameter in list");
                    continue;
                }
                else {
                    seenRestExpr = true;
                }
            }
            else if (p.tok != token.COMMA &&
                p.tok != token.SEMICOLON &&
                p.tok != token.RPAREN) {
                f.type = p.type();
            }
            f.ident.type = p.types.resolve(f.type);
            if (!p.ocomma(token.RPAREN)) {
                break;
            }
            fields.push(f);
        }
        p.want(token.RPAREN);
        return fields;
    }
    funBody(funcname) {
        const p = this;
        if (p.tok == token.LBRACE) {
            return p.block();
        }
        const pos = p.pos;
        if (p.got(token.ARROWR)) {
            const s = p.maybeStmt();
            if (s) {
                return s;
            }
        }
        if (funcname) {
            p.syntaxError(`${funcname} is missing function body`, pos);
        }
        else {
            p.syntaxError("missing function body", pos);
        }
        return new SimpleStmt(pos, p.scope);
    }
    block() {
        const p = this;
        const pos = p.pos;
        p.want(token.LBRACE);
        const list = p.stmtList();
        p.want(token.RBRACE);
        return new BlockStmt(pos, p.scope, list);
    }
    declStmt(f) {
        const p = this;
        const pos = p.pos;
        p.next();
        const decls = [];
        p.appendGroup(decls, f);
        return new DeclStmt(pos, p.scope, decls);
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
    assignment(lhs) {
        const p = this;
        p.want(token.ASSIGN);
        const s = new AssignStmt(lhs[0].pos, p.scope, token.ASSIGN, lhs, []);
        s.rhs = p.exprList(s);
        for (let i = 0; i < lhs.length; ++i) {
            const id = lhs[i];
            if (id instanceof Ident) {
                assert(s.rhs[i]);
                if (id.ent && p.shouldStoreToEnt(id.ent, id.scope)) {
                    id.ent.writes++;
                    if (id.ent.value && id.ent.value.type) {
                        id.type = id.ent.value.type;
                        const val = s.rhs[i];
                        const typ = id.ent.value.type;
                        const convertedVal = p.types.convert(typ, val);
                        if (!convertedVal) {
                            p.error((val.type instanceof UnresolvedType ?
                                `cannot convert "${val}" to type ${typ}` :
                                `cannot convert "${val}" (type ${val.type}) to type ${typ}`), val.pos);
                        }
                        else if (convertedVal !== val) {
                            s.rhs[i] = convertedVal;
                        }
                    }
                }
                else {
                    if (p.unresolved) {
                        p.unresolved.delete(id);
                    }
                    p.declare(id.scope, id, s, s.rhs[i]);
                    id.type = p.types.resolve(s.rhs[i]);
                    if (id.type instanceof UnresolvedType) {
                        id.type.addRef(id);
                    }
                }
            }
        }
        return s;
    }
    simpleStmt(lhs) {
        const p = this;
        if (p.tok == token.ASSIGN) {
            return p.assignment(lhs);
        }
        const pos = lhs[0].pos;
        if (lhs.length != 1) {
            p.syntaxError("expecting := or = or comma");
            p.advanceUntil(token.SEMICOLON, token.RBRACE);
            return new ExprStmt(lhs[0].pos, p.scope, lhs[0]);
        }
        p.types.resolve(lhs[0]);
        if (token.assignop_beg < p.tok && p.tok < token.assignop_end) {
            const op = p.tok;
            p.next();
            const s = new AssignStmt(pos, p.scope, op, lhs, []);
            s.rhs = p.exprList(s);
            return s;
        }
        if (p.tok == token.INC || p.tok == token.DEC) {
            const op = p.tok;
            p.next();
            const operand = lhs[0];
            if (operand instanceof Ident &&
                operand.ent &&
                !(operand.ent.decl instanceof VarDecl)) {
                p.syntaxError(`cannot mutate ${operand}`, operand.pos);
            }
            return new AssignStmt(pos, p.scope, op, lhs, emptyExprList);
        }
        if (p.tok == token.ARROWL) {
            p.syntaxError("TODO simpleStmt ARROWL");
        }
        if (p.tok == token.ARROWR) {
            p.syntaxError("TODO simpleStmt ARROWR");
        }
        return new ExprStmt(lhs[0].pos, p.scope, lhs[0]);
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
                return p.declStmt(p.typeDecl);
            case token.ADD:
            case token.SUB:
            case token.MUL:
            case token.AND:
            case token.NOT:
            case token.XOR:
            case token.FUN:
            case token.LPAREN:
            case token.LBRACK:
            case token.INTERFACE:
                return p.simpleStmt(p.exprList(null));
            case token.RETURN:
                return p.returnStmt();
            default:
                if (token.literal_beg < p.tok && p.tok < token.literal_end) {
                    return p.simpleStmt(p.exprList(null));
                }
        }
        return null;
    }
    returnStmt() {
        const p = this;
        const pos = p.pos;
        p.want(token.RETURN);
        const n = new ReturnStmt(pos, p.scope, null);
        const ftype = p.types.resolve(p.currFun());
        assert(ftype instanceof FunType);
        const frtype = ftype.output;
        if (p.tok == token.SEMICOLON || p.tok == token.RBRACE) {
            if (frtype !== u_t_void) {
                p.syntaxError("missing return value", pos);
                return n;
            }
            return n;
        }
        const xs = p.exprList(null);
        let rval = (xs.length == 1 ? xs[0] :
            new TupleExpr(xs[0].pos, xs[0].scope, xs));
        if (frtype === u_t_void) {
            p.syntaxError("function does not return a value", rval.pos);
            return n;
        }
        const rtype = p.types.resolve(rval);
        if (!frtype.equals(rtype)) {
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
            case token.MUL:
            case token.ADD:
            case token.SUB:
            case token.NOT:
            case token.XOR: {
                p.next();
                return new Operation(pos, p.scope, t, p.unaryExpr(ctx));
            }
            case token.AND: {
                p.next();
                return new Operation(pos, p.scope, t, unparen(p.unaryExpr(ctx)));
            }
        }
        return p.primExpr(true, ctx);
    }
    primExpr(keepParens, ctx) {
        const p = this;
        let x = p.operand(keepParens, ctx);
        loop: while (true) {
            switch (p.tok) {
                case token.LPAREN:
                    x = p.call(x, ctx);
                    break;
                default:
                    break loop;
            }
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
    operand(keepParens, ctx) {
        const p = this;
        switch (p.tok) {
            case token.NAME:
            case token.NAMEAT:
                return p.dotident(p.resolve(p.ident()));
            case token.LPAREN:
                return p.parenOrTupleExpr(keepParens, ctx);
            case token.FUN:
                return p.funStmt(ctx);
            case token.STRING:
                return p.strlit();
            default: {
                if (token.literal_beg < p.tok && p.tok < token.literal_end) {
                    const x = new BasicLit(p.pos, p.scope, p.tok, p.takeByteValue());
                    x.type = p.universe.basicLitType(x, p.ctxType(ctx), p.basicLitErrH);
                    p.next();
                    return x;
                }
                const x = p.bad();
                p.syntaxError("expecting expression");
                p.next();
                return x;
            }
        }
    }
    strlit() {
        const p = this;
        assert(p.tok == token.STRING);
        const n = new StringLit(p.pos, p.scope, p.takeByteValue());
        n.type = new ConstStringType(u_t_uint.bitsize, n.value.length);
        p.next();
        return n;
    }
    parenOrTupleExpr(keepParens, ctx) {
        const p = this;
        const pos = p.pos;
        p.want(token.LPAREN);
        const l = [];
        while (true) {
            l.push(p.expr(ctx));
            if (!p.ocomma(token.RPAREN)) {
                break;
            }
            if (p.tok == token.RPAREN) {
                break;
            }
        }
        p.want(token.RPAREN);
        return (l.length == 1 ? (keepParens ? new ParenExpr(pos, p.scope, l[0]) :
            l[0]) :
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
                x = p.dotident(p.resolve(p.ident()));
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
    restExpr(defaultType) {
        const p = this;
        const pos = p.pos;
        p.want(token.ELLIPSIS);
        const rt = new RestExpr(pos, p.scope, p.maybeType() || defaultType);
        p.types.resolve(rt);
        return rt;
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
    dotident(ident) {
        const p = this;
        if (p.tok == token.DOT) {
            const pos = p.pos;
            p.next();
            const rhs = p.dotident(p.ident());
            return new SelectorExpr(pos, p.scope, ident, rhs);
        }
        return ident;
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
        p.errorAt("unexpected " + tokstr(p.tok) + msg, position);
    }
    diag(k, msg, pos = this.pos, code) {
        const p = this;
        if (k == DiagKind.ERROR) {
            p.error(msg, pos, code);
        }
        else if (p.diagh) {
            p.diagh(p.sfile.position(pos), msg, k);
        }
    }
}
function unparen(x) {
    while (x instanceof ParenExpr) {
        x = x.x;
    }
    return x;
}
function isEmptyFunDecl(d) {
    return d instanceof FunDecl && !d.body;
}

class pkgBinder extends ErrorReporter {
    constructor(pkg, fset, importer, types, errh) {
        super('E_RESOLVE', errh);
        this.pkg = pkg;
        this.fset = fset;
        this.importer = importer;
        this.types = types;
        this.errorCount = 0;
        this.imports = new Map();
    }
    bind() {
        const b = this;
        return Promise.all(b.pkg.files.map(f => this._bind1(f))).then(() => {
            if (b.errorCount > 0) {
                return;
            }
            for (let f of b.pkg.files) {
                b._bind2(f);
            }
            b._bind3();
        });
    }
    _bind1(f) {
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
    _bind2(f) {
        const b = this;
        if (f.unresolved)
            for (let id of f.unresolved) {
                let ent = f.scope.lookup(id.value);
                if (!ent) {
                    b.error(`${id} undefined`, id.pos);
                    continue;
                }
                debuglog(`${id}`, ent.value && ent.value.constructor.name);
                id.refEnt(ent);
                let t = id.type;
                if (t instanceof UnresolvedType && ent.value) {
                    id.type = b.types.resolve(ent.value);
                    assert(!(id.type instanceof UnresolvedType), 'TODO still unresolved');
                    if (t.refs)
                        for (let ref of t.refs) {
                            ref.type = id.type;
                        }
                }
            }
    }
    _bind3() {
        const b = this;
        for (let ut of b.types.unresolved) {
            const t = ut.expr.type;
            if (!(t instanceof UnresolvedType)) {
                continue;
            }
            const restyp = b.types.resolve(ut.expr);
            if (restyp instanceof UnresolvedType) {
                b.error(`undefined type ${ut.expr}`, ut.expr.pos);
            }
            else {
                if (t.refs)
                    for (let ref of t.refs) {
                        console.log(`ref[1] ${ref}`);
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

class TypeSet {
    constructor() {
        this.types = new Map();
    }
    intern(t) {
        let s = this.types.get(t.constructor);
        if (s) {
            for (let i of s) {
                if (i.equals(t)) {
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
        'white': sfn('38;5;255', '39'),
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
    return termColorSupport && w.isTTY && style || noStyle;
}
const stdoutStyle = (typeof process != 'undefined' && streamStyle(process.stdout) || noStyle);
const stderrStyle = (typeof process != 'undefined' && streamStyle(process.stderr) || noStyle);
const stdoutSupportsStyle = stdoutStyle !== noStyle;

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
function astRepr(n, options) {
    let ctx = defaultCtx;
    if (options) {
        ctx = new ReprCtx();
        if (options.colors !== undefined) {
            ctx.style = options.colors ? style : noStyle;
        }
    }
    return repr1(n, '\n', ctx).trim();
}
const defaultCtx = new ReprCtx();
function _reprt(t, nl, c) {
    if (t instanceof ConstStringType) {
        return `${t.name}[${t.length}]`;
    }
    if (t instanceof IntrinsicType) {
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
            '->' + _reprt(t.output, nl, c));
    }
    if (t instanceof UnresolvedType) {
        return '~';
    }
    return `???${t.constructor.name}`;
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
    return decodeToString(id.value.bytes);
}
function reprcons(n, c) {
    return c.style.grey(n.constructor.name);
}
function repr1(n, newline, c) {
    if (n instanceof IntrinsicType) {
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
        if (n.ident) {
            s = '(' + repr1(n.ident, nl2, c) + ' ' + s + ')';
        }
        return s;
    }
    if (n instanceof BlockStmt) {
        return (n.list.length ?
            newline + '{' + reprv(n.list, nl2, c, '') + newline + '}' :
            '{}');
    }
    if (n instanceof ReturnStmt) {
        if (n.result) {
            return newline + `(${reprcons(n, c)} ${repr1(n.result, nl2, c)})`;
        }
        return newline + reprcons(n, c);
    }
    if (n instanceof ExprStmt) {
        return newline + `(${reprcons(n, c)} ${repr1(n.expr, nl2, c)})`;
    }
    if (n instanceof FunSig) {
        return reprv(n.params, nl2, c) + ' -> ' + reprt(n.result, nl2, c);
    }
    if (n instanceof AssignStmt) {
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
    if (n instanceof DeclStmt) {
        return newline + `(${reprcons(n, c)}` + ' ' + reprv(n.decls, nl2, c, '') + ')';
    }
    if (n instanceof SelectorExpr) {
        return ('(SEL ' +
            repr1(n.lhs, newline, c) + '.' +
            repr1(n.rhs, newline, c) + ')');
    }
    let s = '(';
    if (n instanceof Expr && !c.typedepth) {
        s += reprt(n.type, newline, c);
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
        return s + ' )';
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
    if (n instanceof Operation) {
        s += ' ' + tokstr(n.op) + ' ' + repr1(n.x, nl2, c);
        if (n.y) {
            s += ' ' + repr1(n.y, nl2, c);
        }
        return s + ')';
    }
    if (n instanceof CallExpr) {
        s += ' ' + repr1(n.fun, newline, c) + ' (';
        s += reprv(n.args, nl2, c, '');
        if (n.hasDots) {
            s += '...';
        }
        return s + '))';
    }
    if (n instanceof ParenExpr) {
        return s + ' ' + repr1(n.x, newline, c) + ')';
    }
    if (n instanceof TypeConvExpr) {
        return s + ' ' + repr1(n.expr, newline, c) + ')';
    }
    if (n instanceof FunDecl) {
        s += ' ';
        if (n.isInit) {
            s += 'init ';
        }
        else if (n.name) {
            s += repr1(n.name, newline, c) + ' ';
        }
        s += repr1(n.sig, newline, c);
        if (n.body) {
            s += ' ' + repr1(n.body, nl2, c);
        }
        return s + ')';
    }
    if (n instanceof TupleExpr) {
        return s + ' ' + reprv(n.exprs, nl2, c, '') + ')';
    }
    if (n.constructor === SimpleStmt) {
        return 'noop';
    }
    return '(???' + reprcons(n, c) + ' ' + repr(n) + ')';
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
    resolve(n) {
        if (n instanceof Type) {
            return n;
        }
        if (n.type instanceof Type && n.type.constructor !== UnresolvedType) {
            return n.type;
        }
        const r = this;
        let t = r.maybeResolve(n);
        if (!t) {
            if (n.type) {
                return n.type;
            }
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
                if (n.ent.value) {
                    return r.maybeResolve(n.ent.value);
                }
                if (n.ent.decl instanceof Expr) {
                    return r.maybeResolve(n.ent.decl);
                }
            }
            return null;
        }
        if (n instanceof FunDecl) {
            const s = n.sig;
            return r.universe.internType(new FunType(s.pos, s.scope, s.params.map(field => r.resolve(field.type)), r.resolve(s.result)));
        }
        if (n instanceof TupleExpr) {
            let types = [];
            for (const x1 of n.exprs) {
                const t = r.resolve(x1);
                if (!t) {
                    return null;
                }
                types.push(t);
            }
            return r.universe.internType(new TupleType(n.pos, n.scope, types));
        }
        if (n instanceof RestExpr) {
            let t = n.expr && r.resolve(n.expr) || u_t_auto;
            return r.universe.internType(new RestType(n.pos, n.scope, t));
        }
        if (n instanceof CallExpr) {
            const funtype = r.resolve(n.fun);
            for (let arg of n.args) {
                r.resolve(arg);
            }
            if (funtype instanceof FunType) {
                return funtype.output;
            }
            return null;
        }
        debuglog(`TODO handle ${n.constructor.name}`);
        return null;
    }
    markUnresolved(expr) {
        const t = new UnresolvedType(expr.pos, expr.scope, expr);
        debuglog(`expr ${expr}`);
        this.unresolved.add(t);
        return t;
    }
    isConstant(x) {
        return (x instanceof LiteralExpr ||
            (x instanceof Ident && x.ent != null && x.ent.isConstant));
    }
    convert(t, x) {
        const xt = this.resolve(x);
        if (xt.equals(t)) {
            return x;
        }
        if (this.isConstant(x) &&
            t instanceof IntrinsicType &&
            xt instanceof IntrinsicType) {
            switch (basicTypeCompat(t, xt)) {
                case TypeCompat.NO: break;
                case TypeCompat.LOSSY: {
                    this.error(`constant ${x} truncated to ${t}`, x.pos, 'E_CONV');
                    return new TypeConvExpr(x.pos, x.scope, x, t);
                }
                case TypeCompat.LOSSLESS: {
                    return new TypeConvExpr(x.pos, x.scope, x, t);
                }
            }
        }
        return null;
    }
}

const reprOptions = { colors: stdoutSupportsStyle };
function parsePkg(name, sources, universe, parser, typeres) {
    const pkg = new Package(name, new Scope(universe.scope));
    const sfileSet = new SrcFileSet();
    const errh = (p, msg, typ) => {
        console.error(stdoutStyle.red(`${p}: ${msg} (${typ})`));
    };
    const diagh = (p, msg, k) => {
        const m = `[diag] ${p}: ${msg} (${DiagKind[k]})`;
        console.log(k == DiagKind.INFO ? stdoutStyle.cyan(m) : stdoutStyle.lightyellow(m));
    };
    typeres.init(sfileSet, universe, errh);
    for (let filename of sources) {
        console.log('\n--------------------------------------------------------\n' +
            `parse ${filename}`);
        const sdata = fs.readFileSync(filename, { flag: 'r' });
        const sfile = sfileSet.addFile(filename, sdata.length);
        parser.initParser(sfile, sdata, universe, pkg.scope, typeres, errh, diagh, Mode.ScanComments);
        const file = parser.parseFile();
        pkg.files.push(file);
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
        for (let decl of file.decls) {
            console.log(astRepr(decl, reprOptions));
        }
    }
    if (parser.errorCount != 0) {
        return Promise.resolve({ pkg, success: false });
    }
    console.log('\n--------------------------------------------------------\n' +
        `bind & assemble ${pkg}`);
    function importer(_imports, _path) {
        return Promise.reject(new Error(`not found`));
    }
    return bindpkg(pkg, sfileSet, importer, typeres, errh)
        .then(hasErrors => ({ pkg, success: !hasErrors }));
}
function main() {
    const strSet = new ByteStrSet();
    const typeSet = new TypeSet();
    const universe = new Universe(strSet, typeSet);
    const typeres = new TypeResolver();
    const parser = new Parser();
    parsePkg("example", ['example/scope4.xl'], universe, parser, typeres).then(r => {
        if (!r.success) {
            return;
        }
        for (const file of r.pkg.files) {
            console.log('\n========================================================');
            console.log(`${r.pkg} ${file.sfile.name} ${file.decls.length} declarations`);
            console.log('--------------------------------------------------------');
            for (let decl of file.decls) {
                console.log(astRepr(decl, reprOptions));
            }
        }
    });
}
main();
//# sourceMappingURL=xlang.debug.js.map
