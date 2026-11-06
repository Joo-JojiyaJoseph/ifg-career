const BOM = String.fromCharCode(0xfeff)

/** Download rows as a CSV file (UTF-8 with a byte order mark so Excel opens it correctly). */
export function downloadCsv(filename, columns, rows) {
  const escape = (value) => {
    const text = value === null || value === undefined ? '' : String(value)
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  const lines = [columns.map((column) => escape(column.label)).join(','), ...rows.map((row) => columns.map((column) => escape(row[column.key])).join(','))]
  const blob = new Blob([BOM + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
