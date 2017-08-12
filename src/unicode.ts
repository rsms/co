import * as utf8 from './utf8'

export const
  MaxRune     = 0x10FFFF, // Maximum valid Unicode code point.
  MaxASCII    = 0x007F,   // maximum ASCII value.
  MaxLatin1   = 0x00FF,   // maximum Latin-1 value.
  InvalidChar = 0xFFFD    // Represents invalid code points.


const fmt4 = '0000'

export function repr(cp :int) :string {
  let s = cp.toString(16)
  if (cp <= 0xFFFF) {
    s = fmt4.substr(0, fmt4.length - s.length) + s
  }
  let str = JSON.stringify(utf8.encodeToString(cp))
  str = str.substr(1, str.length-2)
  return `U+${s} '${str}'`
}

export function isLetter(c :int) :bool {
  return (
    0x41 <= c && c <= 0x1E943 && ( // LATIN CAPITAL LETTER A..ADLAM SMALL LETTER SHA
    (0x41 <= c && c <= 0x5A) || // LATIN CAPITAL LETTER A..LATIN CAPITAL LETTER Z
    (0x61 <= c && c <= 0x7A) || // LATIN SMALL LETTER A..LATIN SMALL LETTER Z
    c == 0xB5 || // MICRO SIGN
    (0xC0 <= c && c <= 0xD6) || // LATIN CAPITAL LETTER A WITH GRAVE..LATIN CAPITAL LETTER O WITH DIAERESIS
    (0xD8 <= c && c <= 0xF6) || // LATIN CAPITAL LETTER O WITH STROKE..LATIN SMALL LETTER O WITH DIAERESIS
    (0xF8 <= c && c <= 0x1BA) || // LATIN SMALL LETTER O WITH STROKE..LATIN SMALL LETTER EZH WITH TAIL
    (0x1BC <= c && c <= 0x1BF) || // LATIN CAPITAL LETTER TONE FIVE..LATIN LETTER WYNN
    c == 0x1C4 || // LATIN CAPITAL LETTER DZ WITH CARON
    (0x1C6 <= c && c <= 0x1C7) || // LATIN SMALL LETTER DZ WITH CARON..LATIN CAPITAL LETTER LJ
    (0x1C9 <= c && c <= 0x1CA) || // LATIN SMALL LETTER LJ..LATIN CAPITAL LETTER NJ
    (0x1CC <= c && c <= 0x1F1) || // LATIN SMALL LETTER NJ..LATIN CAPITAL LETTER DZ
    (0x1F3 <= c && c <= 0x293) || // LATIN SMALL LETTER DZ..LATIN SMALL LETTER EZH WITH CURL
    (0x295 <= c && c <= 0x2AF) || // LATIN LETTER PHARYNGEAL VOICED FRICATIVE..LATIN SMALL LETTER TURNED H WITH FISHHOOK AND TAIL
    (0x370 <= c && c <= 0x373) || // GREEK CAPITAL LETTER HETA..GREEK SMALL LETTER ARCHAIC SAMPI
    (0x376 <= c && c <= 0x377) || // GREEK CAPITAL LETTER PAMPHYLIAN DIGAMMA..GREEK SMALL LETTER PAMPHYLIAN DIGAMMA
    (0x37B <= c && c <= 0x37D) || // GREEK SMALL REVERSED LUNATE SIGMA SYMBOL..GREEK SMALL REVERSED DOTTED LUNATE SIGMA SYMBOL
    c == 0x37F || // GREEK CAPITAL LETTER YOT
    c == 0x386 || // GREEK CAPITAL LETTER ALPHA WITH TONOS
    (0x388 <= c && c <= 0x38A) || // GREEK CAPITAL LETTER EPSILON WITH TONOS..GREEK CAPITAL LETTER IOTA WITH TONOS
    c == 0x38C || // GREEK CAPITAL LETTER OMICRON WITH TONOS
    (0x38E <= c && c <= 0x3A1) || // GREEK CAPITAL LETTER UPSILON WITH TONOS..GREEK CAPITAL LETTER RHO
    (0x3A3 <= c && c <= 0x3F5) || // GREEK CAPITAL LETTER SIGMA..GREEK LUNATE EPSILON SYMBOL
    (0x3F7 <= c && c <= 0x481) || // GREEK CAPITAL LETTER SHO..CYRILLIC SMALL LETTER KOPPA
    (0x48A <= c && c <= 0x52F) || // CYRILLIC CAPITAL LETTER SHORT I WITH TAIL..CYRILLIC SMALL LETTER EL WITH DESCENDER
    (0x531 <= c && c <= 0x556) || // ARMENIAN CAPITAL LETTER AYB..ARMENIAN CAPITAL LETTER FEH
    (0x561 <= c && c <= 0x587) || // ARMENIAN SMALL LETTER AYB..ARMENIAN SMALL LIGATURE ECH YIWN
    (0x10A0 <= c && c <= 0x10C5) || // GEORGIAN CAPITAL LETTER AN..GEORGIAN CAPITAL LETTER HOE
    c == 0x10C7 || // GEORGIAN CAPITAL LETTER YN
    c == 0x10CD || // GEORGIAN CAPITAL LETTER AEN
    (0x13A0 <= c && c <= 0x13F5) || // CHEROKEE LETTER A..CHEROKEE LETTER MV
    (0x13F8 <= c && c <= 0x13FD) || // CHEROKEE SMALL LETTER YE..CHEROKEE SMALL LETTER MV
    (0x1C80 <= c && c <= 0x1C88) || // CYRILLIC SMALL LETTER ROUNDED VE..CYRILLIC SMALL LETTER UNBLENDED UK
    (0x1D00 <= c && c <= 0x1D2B) || // LATIN LETTER SMALL CAPITAL A..CYRILLIC LETTER SMALL CAPITAL EL
    (0x1D6B <= c && c <= 0x1D77) || // LATIN SMALL LETTER UE..LATIN SMALL LETTER TURNED G
    (0x1D79 <= c && c <= 0x1D9A) || // LATIN SMALL LETTER INSULAR G..LATIN SMALL LETTER EZH WITH RETROFLEX HOOK
    (0x1E00 <= c && c <= 0x1F15) || // LATIN CAPITAL LETTER A WITH RING BELOW..GREEK SMALL LETTER EPSILON WITH DASIA AND OXIA
    (0x1F18 <= c && c <= 0x1F1D) || // GREEK CAPITAL LETTER EPSILON WITH PSILI..GREEK CAPITAL LETTER EPSILON WITH DASIA AND OXIA
    (0x1F20 <= c && c <= 0x1F45) || // GREEK SMALL LETTER ETA WITH PSILI..GREEK SMALL LETTER OMICRON WITH DASIA AND OXIA
    (0x1F48 <= c && c <= 0x1F4D) || // GREEK CAPITAL LETTER OMICRON WITH PSILI..GREEK CAPITAL LETTER OMICRON WITH DASIA AND OXIA
    (0x1F50 <= c && c <= 0x1F57) || // GREEK SMALL LETTER UPSILON WITH PSILI..GREEK SMALL LETTER UPSILON WITH DASIA AND PERISPOMENI
    c == 0x1F59 || // GREEK CAPITAL LETTER UPSILON WITH DASIA
    c == 0x1F5B || // GREEK CAPITAL LETTER UPSILON WITH DASIA AND VARIA
    c == 0x1F5D || // GREEK CAPITAL LETTER UPSILON WITH DASIA AND OXIA
    (0x1F5F <= c && c <= 0x1F7D) || // GREEK CAPITAL LETTER UPSILON WITH DASIA AND PERISPOMENI..GREEK SMALL LETTER OMEGA WITH OXIA
    (0x1F80 <= c && c <= 0x1F87) || // GREEK SMALL LETTER ALPHA WITH PSILI AND YPOGEGRAMMENI..GREEK SMALL LETTER ALPHA WITH DASIA AND PERISPOMENI AND YPOGEGRAMMENI
    (0x1F90 <= c && c <= 0x1F97) || // GREEK SMALL LETTER ETA WITH PSILI AND YPOGEGRAMMENI..GREEK SMALL LETTER ETA WITH DASIA AND PERISPOMENI AND YPOGEGRAMMENI
    (0x1FA0 <= c && c <= 0x1FA7) || // GREEK SMALL LETTER OMEGA WITH PSILI AND YPOGEGRAMMENI..GREEK SMALL LETTER OMEGA WITH DASIA AND PERISPOMENI AND YPOGEGRAMMENI
    (0x1FB0 <= c && c <= 0x1FB4) || // GREEK SMALL LETTER ALPHA WITH VRACHY..GREEK SMALL LETTER ALPHA WITH OXIA AND YPOGEGRAMMENI
    (0x1FB6 <= c && c <= 0x1FBB) || // GREEK SMALL LETTER ALPHA WITH PERISPOMENI..GREEK CAPITAL LETTER ALPHA WITH OXIA
    c == 0x1FBE || // GREEK PROSGEGRAMMENI
    (0x1FC2 <= c && c <= 0x1FC4) || // GREEK SMALL LETTER ETA WITH VARIA AND YPOGEGRAMMENI..GREEK SMALL LETTER ETA WITH OXIA AND YPOGEGRAMMENI
    (0x1FC6 <= c && c <= 0x1FCB) || // GREEK SMALL LETTER ETA WITH PERISPOMENI..GREEK CAPITAL LETTER ETA WITH OXIA
    (0x1FD0 <= c && c <= 0x1FD3) || // GREEK SMALL LETTER IOTA WITH VRACHY..GREEK SMALL LETTER IOTA WITH DIALYTIKA AND OXIA
    (0x1FD6 <= c && c <= 0x1FDB) || // GREEK SMALL LETTER IOTA WITH PERISPOMENI..GREEK CAPITAL LETTER IOTA WITH OXIA
    (0x1FE0 <= c && c <= 0x1FEC) || // GREEK SMALL LETTER UPSILON WITH VRACHY..GREEK CAPITAL LETTER RHO WITH DASIA
    (0x1FF2 <= c && c <= 0x1FF4) || // GREEK SMALL LETTER OMEGA WITH VARIA AND YPOGEGRAMMENI..GREEK SMALL LETTER OMEGA WITH OXIA AND YPOGEGRAMMENI
    (0x1FF6 <= c && c <= 0x1FFB) || // GREEK SMALL LETTER OMEGA WITH PERISPOMENI..GREEK CAPITAL LETTER OMEGA WITH OXIA
    c == 0x2102 || // DOUBLE-STRUCK CAPITAL C
    c == 0x2107 || // EULER CONSTANT
    (0x210A <= c && c <= 0x2113) || // SCRIPT SMALL G..SCRIPT SMALL L
    c == 0x2115 || // DOUBLE-STRUCK CAPITAL N
    (0x2119 <= c && c <= 0x211D) || // DOUBLE-STRUCK CAPITAL P..DOUBLE-STRUCK CAPITAL R
    c == 0x2124 || // DOUBLE-STRUCK CAPITAL Z
    c == 0x2126 || // OHM SIGN
    c == 0x2128 || // BLACK-LETTER CAPITAL Z
    (0x212A <= c && c <= 0x212D) || // KELVIN SIGN..BLACK-LETTER CAPITAL C
    (0x212F <= c && c <= 0x2134) || // SCRIPT SMALL E..SCRIPT SMALL O
    c == 0x2139 || // INFORMATION SOURCE
    (0x213C <= c && c <= 0x213F) || // DOUBLE-STRUCK SMALL PI..DOUBLE-STRUCK CAPITAL PI
    (0x2145 <= c && c <= 0x2149) || // DOUBLE-STRUCK ITALIC CAPITAL D..DOUBLE-STRUCK ITALIC SMALL J
    c == 0x214E || // TURNED SMALL F
    (0x2183 <= c && c <= 0x2184) || // ROMAN NUMERAL REVERSED ONE HUNDRED..LATIN SMALL LETTER REVERSED C
    (0x2C00 <= c && c <= 0x2C2E) || // GLAGOLITIC CAPITAL LETTER AZU..GLAGOLITIC CAPITAL LETTER LATINATE MYSLITE
    (0x2C30 <= c && c <= 0x2C5E) || // GLAGOLITIC SMALL LETTER AZU..GLAGOLITIC SMALL LETTER LATINATE MYSLITE
    (0x2C60 <= c && c <= 0x2C7B) || // LATIN CAPITAL LETTER L WITH DOUBLE BAR..LATIN LETTER SMALL CAPITAL TURNED E
    (0x2C7E <= c && c <= 0x2CE4) || // LATIN CAPITAL LETTER S WITH SWASH TAIL..COPTIC SYMBOL KAI
    (0x2CEB <= c && c <= 0x2CEE) || // COPTIC CAPITAL LETTER CRYPTOGRAMMIC SHEI..COPTIC SMALL LETTER CRYPTOGRAMMIC GANGIA
    (0x2CF2 <= c && c <= 0x2CF3) || // COPTIC CAPITAL LETTER BOHAIRIC KHEI..COPTIC SMALL LETTER BOHAIRIC KHEI
    (0x2D00 <= c && c <= 0x2D25) || // GEORGIAN SMALL LETTER AN..GEORGIAN SMALL LETTER HOE
    c == 0x2D27 || // GEORGIAN SMALL LETTER YN
    c == 0x2D2D || // GEORGIAN SMALL LETTER AEN
    (0xA640 <= c && c <= 0xA66D) || // CYRILLIC CAPITAL LETTER ZEMLYA..CYRILLIC SMALL LETTER DOUBLE MONOCULAR O
    (0xA680 <= c && c <= 0xA69B) || // CYRILLIC CAPITAL LETTER DWE..CYRILLIC SMALL LETTER CROSSED O
    (0xA722 <= c && c <= 0xA76F) || // LATIN CAPITAL LETTER EGYPTOLOGICAL ALEF..LATIN SMALL LETTER CON
    (0xA771 <= c && c <= 0xA787) || // LATIN SMALL LETTER DUM..LATIN SMALL LETTER INSULAR T
    (0xA78B <= c && c <= 0xA78E) || // LATIN CAPITAL LETTER SALTILLO..LATIN SMALL LETTER L WITH RETROFLEX HOOK AND BELT
    (0xA790 <= c && c <= 0xA7AE) || // LATIN CAPITAL LETTER N WITH DESCENDER..LATIN CAPITAL LETTER SMALL CAPITAL I
    (0xA7B0 <= c && c <= 0xA7B7) || // LATIN CAPITAL LETTER TURNED K..LATIN SMALL LETTER OMEGA
    c == 0xA7FA || // LATIN LETTER SMALL CAPITAL TURNED M
    (0xAB30 <= c && c <= 0xAB5A) || // LATIN SMALL LETTER BARRED ALPHA..LATIN SMALL LETTER Y WITH SHORT RIGHT LEG
    (0xAB60 <= c && c <= 0xAB65) || // LATIN SMALL LETTER SAKHA YAT..GREEK LETTER SMALL CAPITAL OMEGA
    (0xAB70 <= c && c <= 0xABBF) || // CHEROKEE SMALL LETTER A..CHEROKEE SMALL LETTER YA
    (0xFB00 <= c && c <= 0xFB06) || // LATIN SMALL LIGATURE FF..LATIN SMALL LIGATURE ST
    (0xFB13 <= c && c <= 0xFB17) || // ARMENIAN SMALL LIGATURE MEN NOW..ARMENIAN SMALL LIGATURE MEN XEH
    (0xFF21 <= c && c <= 0xFF3A) || // FULLWIDTH LATIN CAPITAL LETTER A..FULLWIDTH LATIN CAPITAL LETTER Z
    (0xFF41 <= c && c <= 0xFF5A) || // FULLWIDTH LATIN SMALL LETTER A..FULLWIDTH LATIN SMALL LETTER Z
    (0x10400 <= c && c <= 0x1044F) || // DESERET CAPITAL LETTER LONG I..DESERET SMALL LETTER EW
    (0x104B0 <= c && c <= 0x104D3) || // OSAGE CAPITAL LETTER A..OSAGE CAPITAL LETTER ZHA
    (0x104D8 <= c && c <= 0x104FB) || // OSAGE SMALL LETTER A..OSAGE SMALL LETTER ZHA
    (0x10C80 <= c && c <= 0x10CB2) || // OLD HUNGARIAN CAPITAL LETTER A..OLD HUNGARIAN CAPITAL LETTER US
    (0x10CC0 <= c && c <= 0x10CF2) || // OLD HUNGARIAN SMALL LETTER A..OLD HUNGARIAN SMALL LETTER US
    (0x118A0 <= c && c <= 0x118DF) || // WARANG CITI CAPITAL LETTER NGAA..WARANG CITI SMALL LETTER VIYO
    (0x1D400 <= c && c <= 0x1D454) || // MATHEMATICAL BOLD CAPITAL A..MATHEMATICAL ITALIC SMALL G
    (0x1D456 <= c && c <= 0x1D49C) || // MATHEMATICAL ITALIC SMALL I..MATHEMATICAL SCRIPT CAPITAL A
    (0x1D49E <= c && c <= 0x1D49F) || // MATHEMATICAL SCRIPT CAPITAL C..MATHEMATICAL SCRIPT CAPITAL D
    c == 0x1D4A2 || // MATHEMATICAL SCRIPT CAPITAL G
    (0x1D4A5 <= c && c <= 0x1D4A6) || // MATHEMATICAL SCRIPT CAPITAL J..MATHEMATICAL SCRIPT CAPITAL K
    (0x1D4A9 <= c && c <= 0x1D4AC) || // MATHEMATICAL SCRIPT CAPITAL N..MATHEMATICAL SCRIPT CAPITAL Q
    (0x1D4AE <= c && c <= 0x1D4B9) || // MATHEMATICAL SCRIPT CAPITAL S..MATHEMATICAL SCRIPT SMALL D
    c == 0x1D4BB || // MATHEMATICAL SCRIPT SMALL F
    (0x1D4BD <= c && c <= 0x1D4C3) || // MATHEMATICAL SCRIPT SMALL H..MATHEMATICAL SCRIPT SMALL N
    (0x1D4C5 <= c && c <= 0x1D505) || // MATHEMATICAL SCRIPT SMALL P..MATHEMATICAL FRAKTUR CAPITAL B
    (0x1D507 <= c && c <= 0x1D50A) || // MATHEMATICAL FRAKTUR CAPITAL D..MATHEMATICAL FRAKTUR CAPITAL G
    (0x1D50D <= c && c <= 0x1D514) || // MATHEMATICAL FRAKTUR CAPITAL J..MATHEMATICAL FRAKTUR CAPITAL Q
    (0x1D516 <= c && c <= 0x1D51C) || // MATHEMATICAL FRAKTUR CAPITAL S..MATHEMATICAL FRAKTUR CAPITAL Y
    (0x1D51E <= c && c <= 0x1D539) || // MATHEMATICAL FRAKTUR SMALL A..MATHEMATICAL DOUBLE-STRUCK CAPITAL B
    (0x1D53B <= c && c <= 0x1D53E) || // MATHEMATICAL DOUBLE-STRUCK CAPITAL D..MATHEMATICAL DOUBLE-STRUCK CAPITAL G
    (0x1D540 <= c && c <= 0x1D544) || // MATHEMATICAL DOUBLE-STRUCK CAPITAL I..MATHEMATICAL DOUBLE-STRUCK CAPITAL M
    c == 0x1D546 || // MATHEMATICAL DOUBLE-STRUCK CAPITAL O
    (0x1D54A <= c && c <= 0x1D550) || // MATHEMATICAL DOUBLE-STRUCK CAPITAL S..MATHEMATICAL DOUBLE-STRUCK CAPITAL Y
    (0x1D552 <= c && c <= 0x1D6A5) || // MATHEMATICAL DOUBLE-STRUCK SMALL A..MATHEMATICAL ITALIC SMALL DOTLESS J
    (0x1D6A8 <= c && c <= 0x1D6C0) || // MATHEMATICAL BOLD CAPITAL ALPHA..MATHEMATICAL BOLD CAPITAL OMEGA
    (0x1D6C2 <= c && c <= 0x1D6DA) || // MATHEMATICAL BOLD SMALL ALPHA..MATHEMATICAL BOLD SMALL OMEGA
    (0x1D6DC <= c && c <= 0x1D6FA) || // MATHEMATICAL BOLD EPSILON SYMBOL..MATHEMATICAL ITALIC CAPITAL OMEGA
    (0x1D6FC <= c && c <= 0x1D714) || // MATHEMATICAL ITALIC SMALL ALPHA..MATHEMATICAL ITALIC SMALL OMEGA
    (0x1D716 <= c && c <= 0x1D734) || // MATHEMATICAL ITALIC EPSILON SYMBOL..MATHEMATICAL BOLD ITALIC CAPITAL OMEGA
    (0x1D736 <= c && c <= 0x1D74E) || // MATHEMATICAL BOLD ITALIC SMALL ALPHA..MATHEMATICAL BOLD ITALIC SMALL OMEGA
    (0x1D750 <= c && c <= 0x1D76E) || // MATHEMATICAL BOLD ITALIC EPSILON SYMBOL..MATHEMATICAL SANS-SERIF BOLD CAPITAL OMEGA
    (0x1D770 <= c && c <= 0x1D788) || // MATHEMATICAL SANS-SERIF BOLD SMALL ALPHA..MATHEMATICAL SANS-SERIF BOLD SMALL OMEGA
    (0x1D78A <= c && c <= 0x1D7A8) || // MATHEMATICAL SANS-SERIF BOLD EPSILON SYMBOL..MATHEMATICAL SANS-SERIF BOLD ITALIC CAPITAL OMEGA
    (0x1D7AA <= c && c <= 0x1D7C2) || // MATHEMATICAL SANS-SERIF BOLD ITALIC SMALL ALPHA..MATHEMATICAL SANS-SERIF BOLD ITALIC SMALL OMEGA
    (0x1D7C4 <= c && c <= 0x1D7CB) || // MATHEMATICAL SANS-SERIF BOLD ITALIC EPSILON SYMBOL..MATHEMATICAL BOLD SMALL DIGAMMA
    (0x1E900 <= c && c <= 0x1E943) // ADLAM CAPITAL LETTER ALIF..ADLAM SMALL LETTER SHA
  ))
}

export function isDigit(c :int) :bool {
  return (
    0x30 <= c && c <= 0x1E959 && ( // DIGIT ZERO..ADLAM DIGIT NINE
    (0x30 <= c && c <= 0x39) || // DIGIT ZERO..DIGIT NINE
    (0x660 <= c && c <= 0x669) || // ARABIC-INDIC DIGIT ZERO..ARABIC-INDIC DIGIT NINE
    (0x6F0 <= c && c <= 0x6F9) || // EXTENDED ARABIC-INDIC DIGIT ZERO..EXTENDED ARABIC-INDIC DIGIT NINE
    (0x7C0 <= c && c <= 0x7C9) || // NKO DIGIT ZERO..NKO DIGIT NINE
    (0x966 <= c && c <= 0x96F) || // DEVANAGARI DIGIT ZERO..DEVANAGARI DIGIT NINE
    (0x9E6 <= c && c <= 0x9EF) || // BENGALI DIGIT ZERO..BENGALI DIGIT NINE
    (0xA66 <= c && c <= 0xA6F) || // GURMUKHI DIGIT ZERO..GURMUKHI DIGIT NINE
    (0xAE6 <= c && c <= 0xAEF) || // GUJARATI DIGIT ZERO..GUJARATI DIGIT NINE
    (0xB66 <= c && c <= 0xB6F) || // ORIYA DIGIT ZERO..ORIYA DIGIT NINE
    (0xBE6 <= c && c <= 0xBEF) || // TAMIL DIGIT ZERO..TAMIL DIGIT NINE
    (0xC66 <= c && c <= 0xC6F) || // TELUGU DIGIT ZERO..TELUGU DIGIT NINE
    (0xCE6 <= c && c <= 0xCEF) || // KANNADA DIGIT ZERO..KANNADA DIGIT NINE
    (0xD66 <= c && c <= 0xD6F) || // MALAYALAM DIGIT ZERO..MALAYALAM DIGIT NINE
    (0xDE6 <= c && c <= 0xDEF) || // SINHALA LITH DIGIT ZERO..SINHALA LITH DIGIT NINE
    (0xE50 <= c && c <= 0xE59) || // THAI DIGIT ZERO..THAI DIGIT NINE
    (0xED0 <= c && c <= 0xED9) || // LAO DIGIT ZERO..LAO DIGIT NINE
    (0xF20 <= c && c <= 0xF29) || // TIBETAN DIGIT ZERO..TIBETAN DIGIT NINE
    (0x1040 <= c && c <= 0x1049) || // MYANMAR DIGIT ZERO..MYANMAR DIGIT NINE
    (0x1090 <= c && c <= 0x1099) || // MYANMAR SHAN DIGIT ZERO..MYANMAR SHAN DIGIT NINE
    (0x17E0 <= c && c <= 0x17E9) || // KHMER DIGIT ZERO..KHMER DIGIT NINE
    (0x1810 <= c && c <= 0x1819) || // MONGOLIAN DIGIT ZERO..MONGOLIAN DIGIT NINE
    (0x1946 <= c && c <= 0x194F) || // LIMBU DIGIT ZERO..LIMBU DIGIT NINE
    (0x19D0 <= c && c <= 0x19D9) || // NEW TAI LUE DIGIT ZERO..NEW TAI LUE DIGIT NINE
    (0x1A80 <= c && c <= 0x1A89) || // TAI THAM HORA DIGIT ZERO..TAI THAM HORA DIGIT NINE
    (0x1A90 <= c && c <= 0x1A99) || // TAI THAM THAM DIGIT ZERO..TAI THAM THAM DIGIT NINE
    (0x1B50 <= c && c <= 0x1B59) || // BALINESE DIGIT ZERO..BALINESE DIGIT NINE
    (0x1BB0 <= c && c <= 0x1BB9) || // SUNDANESE DIGIT ZERO..SUNDANESE DIGIT NINE
    (0x1C40 <= c && c <= 0x1C49) || // LEPCHA DIGIT ZERO..LEPCHA DIGIT NINE
    (0x1C50 <= c && c <= 0x1C59) || // OL CHIKI DIGIT ZERO..OL CHIKI DIGIT NINE
    (0xA620 <= c && c <= 0xA629) || // VAI DIGIT ZERO..VAI DIGIT NINE
    (0xA8D0 <= c && c <= 0xA8D9) || // SAURASHTRA DIGIT ZERO..SAURASHTRA DIGIT NINE
    (0xA900 <= c && c <= 0xA909) || // KAYAH LI DIGIT ZERO..KAYAH LI DIGIT NINE
    (0xA9D0 <= c && c <= 0xA9D9) || // JAVANESE DIGIT ZERO..JAVANESE DIGIT NINE
    (0xA9F0 <= c && c <= 0xA9F9) || // MYANMAR TAI LAING DIGIT ZERO..MYANMAR TAI LAING DIGIT NINE
    (0xAA50 <= c && c <= 0xAA59) || // CHAM DIGIT ZERO..CHAM DIGIT NINE
    (0xABF0 <= c && c <= 0xABF9) || // MEETEI MAYEK DIGIT ZERO..MEETEI MAYEK DIGIT NINE
    (0xFF10 <= c && c <= 0xFF19) || // FULLWIDTH DIGIT ZERO..FULLWIDTH DIGIT NINE
    (0x104A0 <= c && c <= 0x104A9) || // OSMANYA DIGIT ZERO..OSMANYA DIGIT NINE
    (0x11066 <= c && c <= 0x1106F) || // BRAHMI DIGIT ZERO..BRAHMI DIGIT NINE
    (0x110F0 <= c && c <= 0x110F9) || // SORA SOMPENG DIGIT ZERO..SORA SOMPENG DIGIT NINE
    (0x11136 <= c && c <= 0x1113F) || // CHAKMA DIGIT ZERO..CHAKMA DIGIT NINE
    (0x111D0 <= c && c <= 0x111D9) || // SHARADA DIGIT ZERO..SHARADA DIGIT NINE
    (0x112F0 <= c && c <= 0x112F9) || // KHUDAWADI DIGIT ZERO..KHUDAWADI DIGIT NINE
    (0x11450 <= c && c <= 0x11459) || // NEWA DIGIT ZERO..NEWA DIGIT NINE
    (0x114D0 <= c && c <= 0x114D9) || // TIRHUTA DIGIT ZERO..TIRHUTA DIGIT NINE
    (0x11650 <= c && c <= 0x11659) || // MODI DIGIT ZERO..MODI DIGIT NINE
    (0x116C0 <= c && c <= 0x116C9) || // TAKRI DIGIT ZERO..TAKRI DIGIT NINE
    (0x11730 <= c && c <= 0x11739) || // AHOM DIGIT ZERO..AHOM DIGIT NINE
    (0x118E0 <= c && c <= 0x118E9) || // WARANG CITI DIGIT ZERO..WARANG CITI DIGIT NINE
    (0x11C50 <= c && c <= 0x11C59) || // BHAIKSUKI DIGIT ZERO..BHAIKSUKI DIGIT NINE
    (0x11D50 <= c && c <= 0x11D59) || // MASARAM GONDI DIGIT ZERO..MASARAM GONDI DIGIT NINE
    (0x16A60 <= c && c <= 0x16A69) || // MRO DIGIT ZERO..MRO DIGIT NINE
    (0x16B50 <= c && c <= 0x16B59) || // PAHAWH HMONG DIGIT ZERO..PAHAWH HMONG DIGIT NINE
    (0x1D7CE <= c && c <= 0x1D7FF) || // MATHEMATICAL BOLD DIGIT ZERO..MATHEMATICAL MONOSPACE DIGIT NINE
    (0x1E950 <= c && c <= 0x1E959) // ADLAM DIGIT ZERO..ADLAM DIGIT NINE
  ))
}

export function isWhitespace(c :int) :bool {
  return (
    0x0 <= c && c <= 0x3000 && ( // <control>..IDEOGRAPHIC SPACE
    (0x0 <= c && c <= 0x20) || // <control>..SPACE
    (0x7F <= c && c <= 0xA0) || // <control>..NO-BREAK SPACE
    c == 0x1680 || // OGHAM SPACE MARK
    (0x2000 <= c && c <= 0x200A) || // EN QUAD..HAIR SPACE
    (0x2028 <= c && c <= 0x2029) || // LINE SEPARATOR..PARAGRAPH SEPARATOR
    c == 0x202F || // NARROW NO-BREAK SPACE
    c == 0x205F || // MEDIUM MATHEMATICAL SPACE
    c == 0x3000 // IDEOGRAPHIC SPACE
  ))
}


export function isEmojiPresentation(c :int) :bool {
  return (
    0x231A <= c && c <= 0x1F9E6 && ( // WATCH..SOCKS
    (0x231A <= c && c <= 0x231B) || // WATCH..HOURGLASS
    (0x23E9 <= c && c <= 0x23EC) || // BLACK RIGHT-POINTING DOUBLE TRIANGLE..BLACK DOWN-POINTING DOUBLE TRIANGLE
    c == 0x23F0 || // <unknown>
    c == 0x23F3 || // <unknown>
    (0x25FD <= c && c <= 0x25FE) || // WHITE MEDIUM SMALL SQUARE..BLACK MEDIUM SMALL SQUARE
    (0x2614 <= c && c <= 0x2615) || // UMBRELLA WITH RAIN DROPS..HOT BEVERAGE
    (0x2648 <= c && c <= 0x2653) || // ARIES..PISCES
    c == 0x267F || // <unknown>
    c == 0x2693 || // <unknown>
    c == 0x26A1 || // <unknown>
    (0x26AA <= c && c <= 0x26AB) || // MEDIUM WHITE CIRCLE..MEDIUM BLACK CIRCLE
    (0x26BD <= c && c <= 0x26BE) || // SOCCER BALL..BASEBALL
    (0x26C4 <= c && c <= 0x26C5) || // SNOWMAN WITHOUT SNOW..SUN BEHIND CLOUD
    c == 0x26CE || // <unknown>
    c == 0x26D4 || // <unknown>
    c == 0x26EA || // <unknown>
    (0x26F2 <= c && c <= 0x26F3) || // FOUNTAIN..FLAG IN HOLE
    c == 0x26F5 || // <unknown>
    c == 0x26FA || // <unknown>
    c == 0x26FD || // <unknown>
    c == 0x2705 || // <unknown>
    (0x270A <= c && c <= 0x270B) || // RAISED FIST..RAISED HAND
    c == 0x2728 || // <unknown>
    c == 0x274C || // <unknown>
    c == 0x274E || // <unknown>
    (0x2753 <= c && c <= 0x2755) || // BLACK QUESTION MARK ORNAMENT..WHITE EXCLAMATION MARK ORNAMENT
    c == 0x2757 || // <unknown>
    (0x2795 <= c && c <= 0x2797) || // HEAVY PLUS SIGN..HEAVY DIVISION SIGN
    c == 0x27B0 || // <unknown>
    c == 0x27BF || // <unknown>
    (0x2B1B <= c && c <= 0x2B1C) || // BLACK LARGE SQUARE..WHITE LARGE SQUARE
    c == 0x2B50 || // <unknown>
    c == 0x2B55 || // <unknown>
    c == 0x1F004 || // <unknown>
    c == 0x1F0CF || // <unknown>
    c == 0x1F18E || // <unknown>
    (0x1F191 <= c && c <= 0x1F19A) || // SQUARED CL..SQUARED VS
    (0x1F1E6 <= c && c <= 0x1F1FF) || // REGIONAL INDICATOR SYMBOL LETTER A..REGIONAL INDICATOR SYMBOL LETTER Z
    c == 0x1F201 || // <unknown>
    c == 0x1F21A || // <unknown>
    c == 0x1F22F || // <unknown>
    (0x1F232 <= c && c <= 0x1F236) || // SQUARED CJK UNIFIED IDEOGRAPH-7981..SQUARED CJK UNIFIED IDEOGRAPH-6709
    (0x1F238 <= c && c <= 0x1F23A) || // SQUARED CJK UNIFIED IDEOGRAPH-7533..SQUARED CJK UNIFIED IDEOGRAPH-55B6
    (0x1F250 <= c && c <= 0x1F251) || // CIRCLED IDEOGRAPH ADVANTAGE..CIRCLED IDEOGRAPH ACCEPT
    (0x1F300 <= c && c <= 0x1F320) || // CYCLONE..SHOOTING STAR
    (0x1F32D <= c && c <= 0x1F335) || // HOT DOG..CACTUS
    (0x1F337 <= c && c <= 0x1F37C) || // TULIP..BABY BOTTLE
    (0x1F37E <= c && c <= 0x1F393) || // BOTTLE WITH POPPING CORK..GRADUATION CAP
    (0x1F3A0 <= c && c <= 0x1F3C4) || // CAROUSEL HORSE..SURFER
    c == 0x1F3C5 || // <unknown>
    (0x1F3C6 <= c && c <= 0x1F3CA) || // TROPHY..SWIMMER
    (0x1F3CF <= c && c <= 0x1F3D3) || // CRICKET BAT AND BALL..TABLE TENNIS PADDLE AND BALL
    (0x1F3E0 <= c && c <= 0x1F3F0) || // HOUSE BUILDING..EUROPEAN CASTLE
    c == 0x1F3F4 || // <unknown>
    (0x1F3F8 <= c && c <= 0x1F43E) || // BADMINTON RACQUET AND SHUTTLECOCK..PAW PRINTS
    c == 0x1F440 || // <unknown>
    (0x1F442 <= c && c <= 0x1F4F7) || // EAR..CAMERA
    c == 0x1F4F8 || // <unknown>
    (0x1F4F9 <= c && c <= 0x1F4FC) || // VIDEO CAMERA..VIDEOCASSETTE
    c == 0x1F4FF || // <unknown>
    (0x1F500 <= c && c <= 0x1F53D) || // TWISTED RIGHTWARDS ARROWS..DOWN-POINTING SMALL RED TRIANGLE
    (0x1F54B <= c && c <= 0x1F54E) || // KAABA..MENORAH WITH NINE BRANCHES
    (0x1F550 <= c && c <= 0x1F567) || // CLOCK FACE ONE OCLOCK..CLOCK FACE TWELVE-THIRTY
    c == 0x1F57A || // <unknown>
    (0x1F595 <= c && c <= 0x1F596) || // REVERSED HAND WITH MIDDLE FINGER EXTENDED..RAISED HAND WITH PART BETWEEN MIDDLE AND RING FINGERS
    c == 0x1F5A4 || // <unknown>
    (0x1F5FB <= c && c <= 0x1F5FF) || // MOUNT FUJI..MOYAI
    c == 0x1F600 || // <unknown>
    (0x1F601 <= c && c <= 0x1F610) || // GRINNING FACE WITH SMILING EYES..NEUTRAL FACE
    c == 0x1F611 || // <unknown>
    (0x1F612 <= c && c <= 0x1F614) || // UNAMUSED FACE..PENSIVE FACE
    c == 0x1F615 || // <unknown>
    c == 0x1F616 || // <unknown>
    c == 0x1F617 || // <unknown>
    c == 0x1F618 || // <unknown>
    c == 0x1F619 || // <unknown>
    c == 0x1F61A || // <unknown>
    c == 0x1F61B || // <unknown>
    (0x1F61C <= c && c <= 0x1F61E) || // FACE WITH STUCK-OUT TONGUE AND WINKING EYE..DISAPPOINTED FACE
    c == 0x1F61F || // <unknown>
    (0x1F620 <= c && c <= 0x1F62B) || // ANGRY FACE..TIRED FACE
    c == 0x1F62C || // <unknown>
    c == 0x1F62D || // <unknown>
    (0x1F62E <= c && c <= 0x1F633) || // FACE WITH OPEN MOUTH..FLUSHED FACE
    c == 0x1F634 || // <unknown>
    (0x1F635 <= c && c <= 0x1F64F) || // DIZZY FACE..PERSON WITH FOLDED HANDS
    (0x1F680 <= c && c <= 0x1F6C5) || // ROCKET..LEFT LUGGAGE
    c == 0x1F6CC || // <unknown>
    c == 0x1F6D0 || // <unknown>
    (0x1F6D1 <= c && c <= 0x1F6D2) || // OCTAGONAL SIGN..SHOPPING TROLLEY
    (0x1F6EB <= c && c <= 0x1F6EC) || // AIRPLANE DEPARTURE..AIRPLANE ARRIVING
    (0x1F6F4 <= c && c <= 0x1F6F8) || // SCOOTER..FLYING SAUCER
    (0x1F910 <= c && c <= 0x1F91E) || // ZIPPER-MOUTH FACE..HAND WITH INDEX AND MIDDLE FINGERS CROSSED
    c == 0x1F91F || // <unknown>
    (0x1F920 <= c && c <= 0x1F92F) || // FACE WITH COWBOY HAT..SHOCKED FACE WITH EXPLODING HEAD
    c == 0x1F930 || // <unknown>
    (0x1F931 <= c && c <= 0x1F93A) || // BREAST-FEEDING..FENCER
    (0x1F93C <= c && c <= 0x1F93E) || // WRESTLERS..HANDBALL
    (0x1F940 <= c && c <= 0x1F945) || // WILTED FLOWER..GOAL NET
    (0x1F947 <= c && c <= 0x1F94B) || // FIRST PLACE MEDAL..MARTIAL ARTS UNIFORM
    c == 0x1F94C || // <unknown>
    (0x1F950 <= c && c <= 0x1F96B) || // CROISSANT..CANNED FOOD
    (0x1F980 <= c && c <= 0x1F997) || // CRAB..CRICKET
    c == 0x1F9C0 || // <unknown>
    (0x1F9D0 <= c && c <= 0x1F9E6) // FACE WITH MONOCLE..SOCKS
  ))
}

export function isEmojiModifierBase(c :int) :bool {
  return (
    0x261D <= c && c <= 0x1F9DD && ( // <unknown>..ELF
    c == 0x261D || // <unknown>
    c == 0x26F9 || // <unknown>
    (0x270A <= c && c <= 0x270D) || // RAISED FIST..WRITING HAND
    c == 0x1F385 || // <unknown>
    (0x1F3C2 <= c && c <= 0x1F3C4) || // SNOWBOARDER..SURFER
    c == 0x1F3C7 || // <unknown>
    c == 0x1F3CA || // <unknown>
    (0x1F3CB <= c && c <= 0x1F3CC) || // WEIGHT LIFTER..GOLFER
    (0x1F442 <= c && c <= 0x1F443) || // EAR..NOSE
    (0x1F446 <= c && c <= 0x1F450) || // WHITE UP POINTING BACKHAND INDEX..OPEN HANDS SIGN
    (0x1F466 <= c && c <= 0x1F469) || // BOY..WOMAN
    c == 0x1F46E || // <unknown>
    (0x1F470 <= c && c <= 0x1F478) || // BRIDE WITH VEIL..PRINCESS
    c == 0x1F47C || // <unknown>
    (0x1F481 <= c && c <= 0x1F483) || // INFORMATION DESK PERSON..DANCER
    (0x1F485 <= c && c <= 0x1F487) || // NAIL POLISH..HAIRCUT
    c == 0x1F4AA || // <unknown>
    (0x1F574 <= c && c <= 0x1F575) || // MAN IN BUSINESS SUIT LEVITATING..SLEUTH OR SPY
    c == 0x1F57A || // <unknown>
    c == 0x1F590 || // <unknown>
    (0x1F595 <= c && c <= 0x1F596) || // REVERSED HAND WITH MIDDLE FINGER EXTENDED..RAISED HAND WITH PART BETWEEN MIDDLE AND RING FINGERS
    (0x1F645 <= c && c <= 0x1F647) || // FACE WITH NO GOOD GESTURE..PERSON BOWING DEEPLY
    (0x1F64B <= c && c <= 0x1F64F) || // HAPPY PERSON RAISING ONE HAND..PERSON WITH FOLDED HANDS
    c == 0x1F6A3 || // <unknown>
    (0x1F6B4 <= c && c <= 0x1F6B6) || // BICYCLIST..PEDESTRIAN
    c == 0x1F6C0 || // <unknown>
    c == 0x1F6CC || // <unknown>
    c == 0x1F918 || // <unknown>
    (0x1F919 <= c && c <= 0x1F91C) || // CALL ME HAND..RIGHT-FACING FIST
    c == 0x1F91E || // <unknown>
    c == 0x1F91F || // <unknown>
    c == 0x1F926 || // <unknown>
    c == 0x1F930 || // <unknown>
    (0x1F931 <= c && c <= 0x1F939) || // BREAST-FEEDING..JUGGLING
    (0x1F93D <= c && c <= 0x1F93E) || // WATER POLO..HANDBALL
    (0x1F9D1 <= c && c <= 0x1F9DD) // ADULT..ELF
  ))
}

export function isEmojiModifier(c :int) :bool {
  return (
    (0x1F3FB <= c && c <= 0x1F3FF) // EMOJI MODIFIER FITZPATRICK TYPE-1-2..EMOJI MODIFIER FITZPATRICK TYPE-6
  )
}

// const
//   featDigit      = 1<< 1 -1,
//   featHexDigit   = 1<< 2 -1,
//   featWhitespace = 1<< 3 -1,
//   featLetter     = 1<< 4 -1

// // must smaller than utf8.UniSelf
// const asciiFeats = new Uint8Array([
//   /* 0    0  NUL */ 0,
//   /* 1    1  SOH */ 0,
//   /* 2    2  STX */ 0,
//   /* 3    3  ETX */ 0,
//   /* 4    4  EOT */ 0,
//   /* 5    5  ENQ */ 0,
//   /* 6    6  ACK */ 0,
//   /* 7    7  BEL */ 0,
//   /* 8    8  BS  */ 0,
//   /* 9    9  TAB */ featWhitespace,
//   /* 10   A  LF  */ featWhitespace,
//   /* 11   B  VT  */ 0,
//   /* 12   C  FF  */ 0,
//   /* 13   D  CR  */ featWhitespace,
//   /* 14   E  SO  */ 0,
//   /* 15   F  SI  */ 0,
//   /* 16  10  DLE */ 0,
//   /* 17  11  DC1 */ 0,
//   /* 18  12  DC2 */ 0,
//   /* 19  13  DC3 */ 0,
//   /* 20  14  DC4 */ 0,
//   /* 21  15  NAK */ 0,
//   /* 22  16  SYN */ 0,
//   /* 23  17  ETB */ 0,
//   /* 24  18  CAN */ 0,
//   /* 25  19  EM  */ 0,
//   /* 26  1A  SUB */ 0,
//   /* 27  1B  ESC */ 0,
//   /* 28  1C  FS  */ 0,
//   /* 29  1D  GS  */ 0,
//   /* 30  1E  RS  */ 0,
//   /* 31  1F  US  */ 0,
//   /* 32  20  SP  */ featWhitespace,
//   /* 33  21  !   */ 0,
//   /* 34  22  "   */ 0,
//   /* 35  23  #   */ 0,
//   /* 36  24  $   */ 0,
//   /* 37  25  %   */ 0,
//   /* 38  26  &   */ 0,
//   /* 39  27  '   */ 0,
//   /* 40  28  (   */ 0,
//   /* 41  29  )   */ 0,
//   /* 42  2A  *   */ 0,
//   /* 43  2B  +   */ 0,
//   /* 44  2C  ,   */ 0,
//   /* 45  2D  -   */ 0,
//   /* 46  2E  .   */ 0,
//   /* 47  2F  /   */ 0,
//   /* 48  30  0   */ featDigit | featHexDigit,
//   /* 49  31  1   */ featDigit | featHexDigit,
//   /* 50  32  2   */ featDigit | featHexDigit,
//   /* 51  33  3   */ featDigit | featHexDigit,
//   /* 52  34  4   */ featDigit | featHexDigit,
//   /* 53  35  5   */ featDigit | featHexDigit,
//   /* 54  36  6   */ featDigit | featHexDigit,
//   /* 55  37  7   */ featDigit | featHexDigit,
//   /* 56  38  8   */ featDigit | featHexDigit,
//   /* 57  39  9   */ featDigit | featHexDigit,
//   /* 58  3A  :   */ 0,
//   /* 59  3B  ;   */ 0,
//   /* 60  3C  <   */ 0,
//   /* 61  3D  =   */ 0,
//   /* 62  3E  >   */ 0,
//   /* 63  3F  ?   */ 0,
//   /* 64  40  @   */ 0,
//   /* 65  41  A   */ featLetter | featHexDigit,
//    66  42  B    featLetter | featHexDigit,
//   /* 67  43  C   */ featLetter | featHexDigit,
//   /* 68  44  D   */ featLetter | featHexDigit,
//   /* 69  45  E   */ featLetter | featHexDigit,
//   /* 70  46  F   */ featLetter | featHexDigit,
//   /* 71  47  G   */ featLetter,
//   /* 72  48  H   */ featLetter,
//   /* 73  49  I   */ featLetter,
//   /* 74  4A  J   */ featLetter,
//   /* 75  4B  K   */ featLetter,
//   /* 76  4C  L   */ featLetter,
//   /* 77  4D  M   */ featLetter,
//   /* 78  4E  N   */ featLetter,
//   /* 79  4F  O   */ featLetter,
//   /* 80  50  P   */ featLetter,
//   /* 81  51  Q   */ featLetter,
//   /* 82  52  R   */ featLetter,
//   /* 83  53  S   */ featLetter,
//   /* 84  54  T   */ featLetter,
//   /* 85  55  U   */ featLetter,
//   /* 86  56  V   */ featLetter,
//   /* 87  57  W   */ featLetter,
//   /* 88  58  X   */ featLetter,
//   /* 89  59  Y   */ featLetter,
//   /* 90  5A  Z   */ featLetter,
//   /* 91  5B  [   */ 0,
//   /* 92  5C  \   */ 0,
//   /* 93  5D  ]   */ 0,
//   /* 94  5E  ^   */ 0,
//   /* 95  5F  _   */ 0,
//   /* 96  60  `   */ 0,
//   /* 97  61  a   */ featLetter | featHexDigit,
//   /* 98  62  b   */ featLetter | featHexDigit,
//   /* 99  63  c   */ featLetter | featHexDigit,
//   /* 100 64  d   */ featLetter | featHexDigit,
//   /* 101 65  e   */ featLetter | featHexDigit,
//   /* 102 66  f   */ featLetter | featHexDigit,
//   /* 103 67  g   */ featLetter,
//   /* 104 68  h   */ featLetter,
//   /* 105 69  i   */ featLetter,
//   /* 106 6A  j   */ featLetter,
//   /* 107 6B  k   */ featLetter,
//   /* 108 6C  l   */ featLetter,
//   /* 109 6D  m   */ featLetter,
//   /* 110 6E  n   */ featLetter,
//   /* 111 6F  o   */ featLetter,
//   /* 112 70  p   */ featLetter,
//   /* 113 71  q   */ featLetter,
//   /* 114 72  r   */ featLetter,
//   /* 115 73  s   */ featLetter,
//   /* 116 74  t   */ featLetter,
//   /* 117 75  u   */ featLetter,
//   /* 118 76  v   */ featLetter,
//   /* 119 77  w   */ featLetter,
//   /* 120 78  x   */ featLetter,
//   /* 121 79  y   */ featLetter,
//   /* 122 7A  z   */ featLetter,
//   /* 123 7B  {   */ 0,
//   /* 124 7C  |   */ 0,
//   /* 125 7D  }   */ 0,
//   /* 126 7E  ~   */ 0,
//   /* 127 7F  DEL */ 0,
// ])
