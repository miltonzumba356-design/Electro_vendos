import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import html2canvas from 'html2canvas'

const BRAND = '#0F6CB5'

export interface PdfColumn {
  header: string
  key: string
  align?: 'left' | 'right' | 'center'
}

export interface ExportTablePdfOptions {
  title: string
  subtitle?: string
  columns: PdfColumn[]
  rows: Array<Record<string, string | number>>
  filename: string
  totalsRow?: Array<string | number>
}

function drawHeader(doc: jsPDF, title: string, subtitle?: string) {
  const pageWidth = doc.internal.pageSize.getWidth()
  doc.setFillColor(BRAND)
  doc.rect(0, 0, pageWidth, 22, 'F')
  doc.setTextColor('#ffffff')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('ELECTRO VENDOS', 12, 10)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(title, 12, 17)

  doc.setFontSize(8)
  const now = new Date()
  const gerado = `Gerado em ${now.toLocaleDateString('pt-AO')} ${now.toLocaleTimeString('pt-AO')}`
  doc.text(gerado, pageWidth - 12, 10, { align: 'right' })
  if (subtitle) doc.text(subtitle, pageWidth - 12, 17, { align: 'right' })
  doc.setTextColor('#111111')
}

// Exporta uma tabela de dados (relatórios, listas) para PDF, com cabeçalho
// de marca e paginação automática do jspdf-autotable.
export function exportTablePdf({ title, subtitle, columns, rows, filename, totalsRow }: ExportTablePdfOptions) {
  const landscape = columns.length > 5
  const doc = new jsPDF({ orientation: landscape ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' })

  drawHeader(doc, title, subtitle)

  autoTable(doc, {
    startY: 28,
    head: [columns.map((c) => c.header)],
    body: rows.map((r) => columns.map((c) => r[c.key] ?? '—')),
    foot: totalsRow ? [totalsRow] : undefined,
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: BRAND, textColor: '#ffffff', fontStyle: 'bold' },
    footStyles: { fillColor: '#f0f4f8', textColor: '#111111', fontStyle: 'bold' },
    columnStyles: Object.fromEntries(
      columns.map((c, i) => [i, { halign: c.align ?? 'left' }])
    ),
    margin: { top: 28, left: 12, right: 12 },
  })

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`)
}

// Converte um documento HTML já renderizado (ex.: o popup de recibo/nota) em
// PDF real, capturando-o como imagem paginada — preserva o layout exato do
// documento em vez de reconstruir o texto via API do jsPDF.
export async function exportHtmlToPdf(target: HTMLElement, filename: string) {
  const canvas = await html2canvas(target, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
  const imgData = canvas.toDataURL('image/png')

  const pdfWidth = 210 // A4 mm
  const pageHeight = 297
  const imgWidth = pdfWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  let heightLeft = imgHeight
  let position = 0

  doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
  heightLeft -= pageHeight

  while (heightLeft > 0) {
    position = heightLeft - imgHeight
    doc.addPage()
    doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
  }

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`)
}
