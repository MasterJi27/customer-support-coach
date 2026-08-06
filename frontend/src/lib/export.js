export function downloadCsv(filename, rows) {
  const csv = rows
    .map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export async function downloadPdf(filename, { title, subtitle = '', sections = [] }) {
  // jspdf + jspdf-autotable (+ their html2canvas dependency) are ~250KB — only
  // pull them in when a PDF export is actually requested, not on initial load.
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  let y = 16

  doc.setFontSize(16)
  doc.setTextColor(17, 24, 39)
  doc.text(title, 14, y)
  y += 6

  if (subtitle) {
    doc.setFontSize(9)
    doc.setTextColor(107, 114, 128)
    doc.text(subtitle, 14, y)
    y += 6
  }

  sections.forEach(section => {
    if (section.heading) {
      doc.setFontSize(11)
      doc.setTextColor(17, 24, 39)
      doc.text(section.heading, 14, y)
      y += 5
    }
    if (section.table) {
      autoTable(doc, {
        startY: y,
        head: [section.table.columns],
        body: section.table.rows,
        headStyles: { fillColor: [16, 185, 129], fontSize: 9, fontStyle: 'bold' },
        bodyStyles: { fontSize: 9, textColor: [51, 65, 85] },
        alternateRowStyles: { fillColor: [245, 250, 252] },
        margin: { left: 14, right: 14 },
      })
      y = doc.lastAutoTable.finalY + 8
    }
    if (section.text) {
      doc.setFontSize(9)
      doc.setTextColor(51, 65, 85)
      const lines = doc.splitTextToSize(section.text, 182)
      doc.text(lines, 14, y)
      y += lines.length * 4.5 + 4
    }
  })

  doc.save(filename)
}
