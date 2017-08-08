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

export function isLetter(cp :int) :bool {
  if (cp < utf8.UniSelf) {
    return (asciiFeats[cp] & featLetter) != 0
  }
  // TODO
  return false
}

export function isDigit(cp :int) :bool {
  if (cp < utf8.UniSelf) {
    return (asciiFeats[cp] & featDigit) != 0
  }
  // TODO
  return false
}

export function isHexDigit(cp :int) :bool {
  if (cp < utf8.UniSelf) {
    return (asciiFeats[cp] & featHexDigit) != 0
  }
  // TODO
  return false
}

export function isWhitespace(cp :int) :bool {
  if (cp < utf8.UniSelf) {
    return (asciiFeats[cp] & featWhitespace) != 0
  }
  // TODO
  return false
}

const
  featDigit      = 1<< 1 -1,
  featHexDigit   = 1<< 2 -1,
  featWhitespace = 1<< 3 -1,
  featLetter     = 1<< 4 -1

// must smaller than utf8.UniSelf
const asciiFeats = new Uint8Array([
  /* 0    0  NUL */ 0,
  /* 1    1  SOH */ 0,
  /* 2    2  STX */ 0,
  /* 3    3  ETX */ 0,
  /* 4    4  EOT */ 0,
  /* 5    5  ENQ */ 0,
  /* 6    6  ACK */ 0,
  /* 7    7  BEL */ 0,
  /* 8    8  BS  */ 0,
  /* 9    9  TAB */ featWhitespace,
  /* 10   A  LF  */ featWhitespace,
  /* 11   B  VT  */ 0,
  /* 12   C  FF  */ 0,
  /* 13   D  CR  */ featWhitespace,
  /* 14   E  SO  */ 0,
  /* 15   F  SI  */ 0,
  /* 16  10  DLE */ 0,
  /* 17  11  DC1 */ 0,
  /* 18  12  DC2 */ 0,
  /* 19  13  DC3 */ 0,
  /* 20  14  DC4 */ 0,
  /* 21  15  NAK */ 0,
  /* 22  16  SYN */ 0,
  /* 23  17  ETB */ 0,
  /* 24  18  CAN */ 0,
  /* 25  19  EM  */ 0,
  /* 26  1A  SUB */ 0,
  /* 27  1B  ESC */ 0,
  /* 28  1C  FS  */ 0,
  /* 29  1D  GS  */ 0,
  /* 30  1E  RS  */ 0,
  /* 31  1F  US  */ 0,
  /* 32  20  SP  */ featWhitespace,
  /* 33  21  !   */ 0,
  /* 34  22  "   */ 0,
  /* 35  23  #   */ 0,
  /* 36  24  $   */ 0,
  /* 37  25  %   */ 0,
  /* 38  26  &   */ 0,
  /* 39  27  '   */ 0,
  /* 40  28  (   */ 0,
  /* 41  29  )   */ 0,
  /* 42  2A  *   */ 0,
  /* 43  2B  +   */ 0,
  /* 44  2C  ,   */ 0,
  /* 45  2D  -   */ 0,
  /* 46  2E  .   */ 0,
  /* 47  2F  /   */ 0,
  /* 48  30  0   */ featDigit | featHexDigit,
  /* 49  31  1   */ featDigit | featHexDigit,
  /* 50  32  2   */ featDigit | featHexDigit,
  /* 51  33  3   */ featDigit | featHexDigit,
  /* 52  34  4   */ featDigit | featHexDigit,
  /* 53  35  5   */ featDigit | featHexDigit,
  /* 54  36  6   */ featDigit | featHexDigit,
  /* 55  37  7   */ featDigit | featHexDigit,
  /* 56  38  8   */ featDigit | featHexDigit,
  /* 57  39  9   */ featDigit | featHexDigit,
  /* 58  3A  :   */ 0,
  /* 59  3B  ;   */ 0,
  /* 60  3C  <   */ 0,
  /* 61  3D  =   */ 0,
  /* 62  3E  >   */ 0,
  /* 63  3F  ?   */ 0,
  /* 64  40  @   */ 0,
  /* 65  41  A   */ featLetter | featHexDigit,
  /* 66  42  B   */ featLetter | featHexDigit,
  /* 67  43  C   */ featLetter | featHexDigit,
  /* 68  44  D   */ featLetter | featHexDigit,
  /* 69  45  E   */ featLetter | featHexDigit,
  /* 70  46  F   */ featLetter | featHexDigit,
  /* 71  47  G   */ featLetter,
  /* 72  48  H   */ featLetter,
  /* 73  49  I   */ featLetter,
  /* 74  4A  J   */ featLetter,
  /* 75  4B  K   */ featLetter,
  /* 76  4C  L   */ featLetter,
  /* 77  4D  M   */ featLetter,
  /* 78  4E  N   */ featLetter,
  /* 79  4F  O   */ featLetter,
  /* 80  50  P   */ featLetter,
  /* 81  51  Q   */ featLetter,
  /* 82  52  R   */ featLetter,
  /* 83  53  S   */ featLetter,
  /* 84  54  T   */ featLetter,
  /* 85  55  U   */ featLetter,
  /* 86  56  V   */ featLetter,
  /* 87  57  W   */ featLetter,
  /* 88  58  X   */ featLetter,
  /* 89  59  Y   */ featLetter,
  /* 90  5A  Z   */ featLetter,
  /* 91  5B  [   */ 0,
  /* 92  5C  \   */ 0,
  /* 93  5D  ]   */ 0,
  /* 94  5E  ^   */ 0,
  /* 95  5F  _   */ 0,
  /* 96  60  `   */ 0,
  /* 97  61  a   */ featLetter | featHexDigit,
  /* 98  62  b   */ featLetter | featHexDigit,
  /* 99  63  c   */ featLetter | featHexDigit,
  /* 100 64  d   */ featLetter | featHexDigit,
  /* 101 65  e   */ featLetter | featHexDigit,
  /* 102 66  f   */ featLetter | featHexDigit,
  /* 103 67  g   */ featLetter,
  /* 104 68  h   */ featLetter,
  /* 105 69  i   */ featLetter,
  /* 106 6A  j   */ featLetter,
  /* 107 6B  k   */ featLetter,
  /* 108 6C  l   */ featLetter,
  /* 109 6D  m   */ featLetter,
  /* 110 6E  n   */ featLetter,
  /* 111 6F  o   */ featLetter,
  /* 112 70  p   */ featLetter,
  /* 113 71  q   */ featLetter,
  /* 114 72  r   */ featLetter,
  /* 115 73  s   */ featLetter,
  /* 116 74  t   */ featLetter,
  /* 117 75  u   */ featLetter,
  /* 118 76  v   */ featLetter,
  /* 119 77  w   */ featLetter,
  /* 120 78  x   */ featLetter,
  /* 121 79  y   */ featLetter,
  /* 122 7A  z   */ featLetter,
  /* 123 7B  {   */ 0,
  /* 124 7C  |   */ 0,
  /* 125 7D  }   */ 0,
  /* 126 7E  ~   */ 0,
  /* 127 7F  DEL */ 0,
])

