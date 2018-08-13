
export function fmtAsciiMatrix<T>(
  values :ArrayLike<T>,
  length: int,
  fmtval :(v:T)=>string = String
) : string {
  let lines :string[] = []
  const colw = 4
  let rowspacer = '| '
  let zeroes = '0000000000000000'
  let spaces = '                '
  let hyphns = '----------------'
  
  const ralign = (s :string, len :int, padding :string) =>
    padding.substr(0, Math.max(0, len - s.length)) + s

  const lalign = (s :string, len :int, padding :string) =>
    s + padding.substr(0, Math.max(0, len - s.length))

  let header1 :string[] = [spaces.substr(0, colw + rowspacer.length)]
  let header2 :string[] = [spaces.substr(0, colw + rowspacer.length)]
  for (let col = 0; col < length; col++) {
    header1.push(lalign(col.toString(), colw, spaces))
    header2.push(hyphns.substr(0, colw-1) + ' ')
  }
  lines.push(header1.join(''))
  lines.push(header2.join(''))

  for (let row = 0; row < length; row++) {
    let line :string[] = [
      lalign(row.toString(), colw, spaces) + rowspacer
    ]
    for (let col = 0; col < length; col++) {
      let value = values[ row + (col * length) ]
      line.push(
        lalign(
          ralign(fmtval(value), 2, zeroes),
          colw,
          spaces
        )
      )
    }
    lines.push(line.join(''))
  }
  return lines.join('\n')
}
