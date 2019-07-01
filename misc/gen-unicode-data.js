const fs = require('fs')

const GeneralCategories = {
  Lu: ["Uppercase_Letter", "an uppercase letter"],
  Ll: ["Lowercase_Letter", "a lowercase letter"],
  Lt: ["Titlecase_Letter", "a digraphic character, with first part uppercase"],
  Lm: ["Modifier_Letter", "a modifier letter"],
  Lo: ["Other_Letter", "other letters, including syllables and ideographs"],
  Mn: ["Nonspacing_Mark", "a nonspacing combining mark (zero advance width)"],
  Mc: ["Spacing_Mark", "a spacing combining mark (positive advance width)"],
  Me: ["Enclosing_Mark", "an enclosing combining mark"],
  Nd: ["Decimal_Number", "a decimal digit"],
  Nl: ["Letter_Number", "a letterlike numeric character"],
  No: ["Other_Number", "a numeric character of other type"],
  Pc: ["Connector_Punctuation", "a connecting punctuation mark, like a tie"],
  Pd: ["Dash_Punctuation", "a dash or hyphen punctuation mark"],
  Ps: ["Open_Punctuation", "an opening punctuation mark (of a pair)"],
  Pe: ["Close_Punctuation", "a closing punctuation mark (of a pair)"],
  Pi: ["Initial_Punctuation", "an initial quotation mark"],
  Pf: ["Final_Punctuation", "a final quotation mark"],
  Po: ["Other_Punctuation", "a punctuation mark of other type"],
  Sm: ["Math_Symbol", "a symbol of mathematical use"],
  Sc: ["Currency_Symbol", "a currency sign"],
  Sk: ["Modifier_Symbol", "a non-letterlike modifier symbol"],
  So: ["Other_Symbol", "a symbol of other type"],
  Zs: ["Space_Separator", "a space character (of various non-zero widths)"],
  Zl: ["Line_Separator", "U+2028 LINE SEPARATOR only"],
  Zp: ["Paragraph_Separator", "U+2029 PARAGRAPH SEPARATOR only"],
  Cc: ["Control", "a C0 or C1 control code"],
  Cf: ["Format", "a format control character"],
  Cs: ["Surrogate", "a surrogate code point"],
  Co: ["Private_Use", "a private-use character"],
  Cn: ["Unassigned", "a reserved unassigned code point or a noncharacter"],
} // categories

// CPs in these categories are all considered "whitespace".
// Based on http://www.unicode.org/Public/10.0.0/ucd/PropList.txt
const WhitespaceCats = ['Cc', 'Zl', 'Zp', 'Zs']
const LetterCats = ['Lu', 'Ll']
// const NthIdentifiers = LetterCats.concat(['Lt', 'Lo', 'Sm', 'Sc', 'Sk', 'So'])
const DigitCats = ['Nd']
const HexDigitRanges = [
  [0x0030, 0x0039], // Nd  [10] DIGIT ZERO..DIGIT NINE
  [0x0041, 0x0046], // L&   [6] LATIN CAPITAL LETTER A..LATIN CAPITAL LETTER F
  [0x0061, 0x0066], // L&   [6] LATIN SMALL LETTER A..LATIN SMALL LETTER F
  [0xFF10, 0xFF19], // Nd  [10] FULLWIDTH DIGIT ZERO..FULLWIDTH DIGIT NINE
  [0xFF21, 0xFF26], // L&   [6] FULLWIDTH LATIN CAPITAL LETTER A..FULLWIDTH LATIN CAPITAL LETTER F
  [0xFF41, 0xFF46], // L&   [6] FULLWIDTH LATIN SMALL LETTER A..FULLWIDTH LATIN SMALL LETTER F
]

const cats = new Map() // cat string => cps int[]
const codepoints = new Map() // cp => [info]

// Fields (values map to indices into table rows)
const
  CodePoint = 0,
  Name = 1,
  GeneralCategory = 2,
  CanonicalCombiningClass = 3,
  BidirectionalClass = 4,
  DecompositionMapping = 5,
  DecimalValue = 6,
  DigitValue = 7,
  NumericValue = 8,
  BidirectionalMirrored = 9,
  Unicode1Name = 10,
  ISO10646Comment = 11,
  UppercaseMapping = 12,
  LowercaseMapping = 13,
  TitlecaseMapping = 14;


function main() {
  loadUnicodeData()
  loadEmojiData()

  console.log('// whitespace\n' + genUniCategoryCode(WhitespaceCats))
  console.log('// letters\n' + genUniCategoryCode(LetterCats))
  console.log('// digits\n' + genUniCategoryCode(DigitCats))

  // console.log('// Nth identifier\n' + genUniCategoryCode(NthIdentifiers))

  console.log('// Emoji_Presentation\n' +
    genRangesCode(cpsToRanges(cats.get('Emoji_Presentation'))))

  console.log('// Emoji_Modifier_Base\n' +
    genRangesCode(cpsToRanges(cats.get('Emoji_Modifier_Base'))))

  console.log('// Emoji_Modifier\n' +
    genRangesCode(cpsToRanges(cats.get('Emoji_Modifier'))))

  // console.log('// hex digits\n' + genRangesCode(HexDigitRanges))
}


function loadEmojiData() {
  // curl -O https://unicode.org/Public/emoji/12.0/emoji-data.txt
  //
  //  <cp range> <SP>+ ";" <category> <SP>* # <SP>* <uc-version> <SP>+ [<range-length>] <comment>? <LF>
  //
  const lines = fs.readFileSync(__dirname + '/emoji-data.txt', 'utf8').trim().split('\n')
  const emojiCats = new Set()

  for (let line of lines) {
    line = line.trim()
    if (line.startsWith('#') || line == '') {
      // comment or empty
      continue
    }
    line = line.split('#')[0].split(';').map(s => s.trim())
    const cpstr = line[0]
    const cat = line[1]
    emojiCats.add(cat)

    let cps = [cpstr]
    if (cpstr.indexOf('..') != -1) {
      let v = cpstr.split('..').map(s => parseInt(s, 16))
      cps = []
      for (let c = v[0]; c <= v[1]; ++c) {
        cps.push(c)
      }
    }

    for (cp of cps) {
      let v = cats.get(cat)
      if (!v) {
        cats.set(cat, [cp])
      } else {
        v.push(cp)
      }
    }
  }
}


function loadUnicodeData() {
  // http://www.unicode.org/Public/10.0.0/ucd/UnicodeData.txt
  // curl -O https://www.unicode.org/Public/12.1.0/ucd/UnicodeData.txt
  const lines = fs.readFileSync(__dirname + '/UnicodeData.txt', 'utf8').trim().split('\n')
  // See ftp://ftp.unicode.org/Public/3.0-Update/UnicodeData-3.0.0.html
  // See   #General%20Category  for a list of categories (field 2)
  //
  //                 2F47;KANGXI RADICAL SUN;So;0;ON;<compat> 65E5;;;;N;;;;;
  //
  //  Example line: "0004;<control>;Cc;0;BN; ; ; ; ;N;END OF TRANSMISSION;  ;  ;  ; ..."
  //  Field:            0;        1; 2;3; 4;5;6;7;8;9;                 10;11;12;13; ...
  //

  cats.clear()

  for (const line of lines) {
    const v = line.split(';')
    const cp = parseInt(v[CodePoint], 16)
    const name = v[Name]
    const cat = v[GeneralCategory]

    codepoints.set(cp, v)

    const catinfo = GeneralCategories[cat]

    if (catinfo) {
      let cps = cats.get(cat)
      if (!cps) {
        cats.set(cat, cps = [[cp]])
      } else {
        let range = cps[cps.length-1]
        if (range && range[range.length-1] == cp-1) {
          // in range
          range.push(cp)
        } else {
          // new range
          cps.push([cp])
        }
      }
    }
  }
}


function cpsForCategories(categories) { // cps int[]
  // collect codepoints
  let cps = []
  for (const cat of categories) {
    if (!cats.get(cat)) {
      console.error(`Can't find category ${cat}`)
    }
    for (const range of cats.get(cat)) {
      for (const cp of range) {
        cps.push(cp)
      }
    }
  }

  // sort 0..N
  cps.sort((a, b) => a < b ? -1 : b < a ? 1 : 0)

  return cps
}


function cpsToRanges(cps) {
  let ranges = []
  let range = []
  for (const cp of cps) {
    if (range.length == 0 || range[range.length-1] == cp-1) {
      range.push(cp)
    } else {
      ranges.push(range)
      range = [cp]
    }
  }
  if (range.length) {
    ranges.push(range)
  }
  return ranges
}


function genUniCategoryCode(categories) {
  let cps = cpsForCategories(categories)
  let ranges = cpsToRanges(cps)
  return genRangesCode(ranges)
}


function genRangesCode(ranges) {
  // Expects ranges to be sorted 0..N
  //
  // Note: We are not building switches because its much slower in V8 than
  // to use regular comparison operators.
  //
  const minCp = ranges[0][0]
  const maxCp = ranges[ranges.length-1][ranges[ranges.length-1].length-1]
  let js = ''
  if (ranges.length) {
    js += '  return (\n'

    if (ranges.length > 1) {
      js += `    ${hex(minCp)} <= c && c <= ${hex(maxCp)} && ( // ${cpName(minCp)}..${cpName(maxCp)}\n`
    }

    for (let i = 0; i < ranges.length; ++i) {
      const range = ranges[i]
      const startCp = range[0], endCp = range[range.length-1]
      const tail = i+1 < ranges.length ? ' ||' : ''
      if (range.length == 1) {
        js += `    c == ${hex(startCp)}${tail} // ${cpName(startCp)}`
      } else {
        js += `    (${hex(startCp)} <= c && c <= ${hex(endCp)})${tail} // ${cpName(startCp)}..${cpName(endCp)}`
      }
      js += '\n'
    }
    if (ranges.length > 1) {
      js += '  ))'
    } else {
      js += '  )'
    }
  } else {
    js += '  return false;'
  }
  return js
}

function hex(n) {
  return '0x' + n.toString(16).toUpperCase()
}


function cpName(c) {
  // U+00AB NAME OF CODEPOINT
  const info = codepoints.get(c)
  // return fmtCodepoint(c) + ' ' + (info ? info[Name] : '<unknown>')
  return info ? info[Name] : '<unknown>'
}


const maxCp = 0x10FFFF // Maximum valid Unicode code point.

function unicodeToString(cp) {
  if (cp < 0 || cp > maxCp) {
    throw new Error(`invalid unicode code point ${cp}`);
  }
  if (cp < 0x10000) {
    return String.fromCharCode(cp);
  }
  cp -= 0x10000;
  return String.fromCharCode((cp >> 10) + surrogateMin, (cp % rune2Max) + 0xDC00);
}


const fmt4 = '0000';

function fmtCodepoint(cp) {
  let s = cp.toString(16).toUpperCase();
  if (cp <= 0xFFFF) {
    s = fmt4.substr(0, fmt4.length - s.length) + s;
  }
  return 'U+' + s;
}

function reprCodepoint(cp) {
  let str = JSON.stringify(unicodeToString(cp));
  return `${fmtCodepoint(s)} '${str.substr(1, str.length - 2)}'`;
}



main()
