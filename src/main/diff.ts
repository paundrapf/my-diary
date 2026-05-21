import DiffMatchPatch from 'diff-match-patch'

const dmp = new DiffMatchPatch()

export function computeDiff(textA: string, textB: string): string {
  const diffs = dmp.diff_main(textA, textB)
  dmp.diff_cleanupSemantic(diffs)

  let result = ''
  for (const [op, text] of diffs) {
    switch (op) {
      case 0:
        result += text
        break
      case 1:
        result += `{++${text}++}`
        break
      case -1:
        result += `{--${text}--}`
        break
    }
  }
  return result
}

export function computeDiffHtml(textA: string, textB: string): string {
  const diffs = dmp.diff_main(textA, textB)
  dmp.diff_cleanupSemantic(diffs)

  let html = ''
  for (const [op, text] of diffs) {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    switch (op) {
      case 0:
        html += `<span class="diff-equal">${escaped}</span>`
        break
      case 1:
        html += `<span class="diff-insert">${escaped}</span>`
        break
      case -1:
        html += `<span class="diff-delete">${escaped}</span>`
        break
    }
  }
  return html
}
