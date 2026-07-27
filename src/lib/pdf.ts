import type { jsPDF as JsPDF } from 'jspdf'
import logoUrl from '@/assets/vendos-logo.png'

// jspdf/jspdf-autotable/html2canvas/qrcode são pesados e só são precisos
// quando o utilizador realmente exporta/partilha um PDF — importados aqui em
// separado para ficarem no seu próprio chunk, em vez de inflar o bundle
// principal (o build falha acima de 2MB por causa do limite de pré-cache do
// service worker).
async function carregarJsPdf() {
  const { jsPDF } = await import('jspdf')
  return jsPDF
}

async function carregarAutoTable() {
  const { default: autoTable } = await import('jspdf-autotable')
  return autoTable
}

async function carregarHtml2Canvas() {
  const { default: html2canvas } = await import('html2canvas')
  return html2canvas
}

const BRAND = '#0F6CB5'
const LOGO_ASPECT = 331 / 755 // altura/largura originais do logo

let logoDataUrlCache: string | null | undefined

async function carregarLogoDataUrl(): Promise<string | null> {
  if (logoDataUrlCache !== undefined) return logoDataUrlCache
  try {
    const res = await fetch(logoUrl)
    const blob = await res.blob()
    logoDataUrlCache = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })
  } catch {
    logoDataUrlCache = null
  }
  return logoDataUrlCache
}

async function carregarQrDataUrl(url: string): Promise<string | null> {
  try {
    const QRCode = await import('qrcode')
    return await QRCode.toDataURL(url, { margin: 1, width: 200, color: { dark: '#111111', light: '#ffffff' } })
  } catch {
    return null
  }
}

export interface PdfColumn {
  header: string
  key: string
  align?: 'left' | 'right' | 'center'
}

export interface ExportTablePdfOptions {
  title: string
  subtitle?: string
  // Linhas de resumo (ex.: cliente, produto, totais) mostradas entre o
  // cabeçalho e a tabela — úteis para PDFs de detalhe de um único registo.
  infoLines?: string[]
  columns: PdfColumn[]
  rows: Array<Record<string, string | number>>
  filename: string
  totalsRow?: Array<string | number>
  // URL para um QR code no cabeçalho (ex.: link direto ao registo na app),
  // usado para validar o documento — só faz sentido em PDFs de um registo
  // específico (fornecedor, cliente, dívida, produto).
  qrUrl?: string
}

const HEADER_HEIGHT = 34

async function drawHeader(doc: JsPDF, title: string, subtitle?: string, qrUrl?: string) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const [logoDataUrl, qrDataUrl] = await Promise.all([
    carregarLogoDataUrl(),
    qrUrl ? carregarQrDataUrl(qrUrl) : Promise.resolve(null),
  ])

  let textX = 12
  if (logoDataUrl) {
    const logoW = 30
    const logoH = logoW * LOGO_ASPECT
    doc.addImage(logoDataUrl, 'PNG', 12, 7, logoW, logoH)
    textX = 12 + logoW + 6
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(BRAND)
  doc.text(title, textX, 14)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor('#555555')
  const now = new Date()
  doc.text(`Gerado em ${now.toLocaleDateString('pt-AO')} ${now.toLocaleTimeString('pt-AO')}`, textX, 20)
  if (subtitle) doc.text(subtitle, textX, 25.5)

  if (qrDataUrl) {
    const qrSize = 20
    doc.addImage(qrDataUrl, 'PNG', pageWidth - qrSize - 12, 6, qrSize, qrSize)
  }

  doc.setDrawColor(BRAND)
  doc.setLineWidth(0.8)
  doc.line(12, HEADER_HEIGHT - 2, pageWidth - 12, HEADER_HEIGHT - 2)
  doc.setTextColor('#111111')
}

async function buildTableDoc({ title, subtitle, infoLines, columns, rows, totalsRow, qrUrl }: Omit<ExportTablePdfOptions, 'filename'>): Promise<JsPDF> {
  const [jsPDF, autoTable] = await Promise.all([carregarJsPdf(), carregarAutoTable()])

  const landscape = columns.length > 5
  const doc = new jsPDF({ orientation: landscape ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' })

  await drawHeader(doc, title, subtitle, qrUrl)

  let startY = HEADER_HEIGHT + 6
  if (infoLines && infoLines.length > 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor('#333333')
    infoLines.forEach((line, i) => doc.text(line, 12, startY + i * 5.5))
    startY += infoLines.length * 5.5 + 4
    doc.setTextColor('#111111')
  }

  autoTable(doc, {
    startY,
    head: [columns.map((c) => c.header)],
    body: rows.map((r) => columns.map((c) => r[c.key] ?? '—')),
    foot: totalsRow ? [totalsRow] : undefined,
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: BRAND, textColor: '#ffffff', fontStyle: 'bold' },
    footStyles: { fillColor: '#f0f4f8', textColor: '#111111', fontStyle: 'bold' },
    columnStyles: Object.fromEntries(
      columns.map((c, i) => [i, { halign: c.align ?? 'left' }])
    ),
    margin: { top: HEADER_HEIGHT + 6, left: 12, right: 12 },
  })

  return doc
}

// Exporta uma tabela de dados (relatórios, listas) para PDF, com cabeçalho
// de marca (logótipo + QR opcional) e paginação automática do jspdf-autotable.
export async function exportTablePdf({ filename, ...opts }: ExportTablePdfOptions) {
  const doc = await buildTableDoc(opts)
  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`)
}

// Igual a exportTablePdf, mas devolve o PDF como Blob em vez de o descarregar
// — usado para partilhar o ficheiro (ex.: Web Share API para o WhatsApp).
export async function getTablePdfBlob(opts: Omit<ExportTablePdfOptions, 'filename'>): Promise<Blob> {
  const doc = await buildTableDoc(opts)
  return doc.output('blob')
}

// Uma secção de um PDF com várias tabelas (ex.: histórico do cliente: vendas,
// dívidas, prestações, e depois uma tabela por produto). Secções sem linhas
// são omitidas.
export interface PdfSection {
  heading: string
  columns: PdfColumn[]
  rows: Array<Record<string, string | number>>
  totalsRow?: Array<string | number>
  emptyLabel?: string
}

export interface ExportMultiSectionPdfOptions {
  title: string
  subtitle?: string
  infoLines?: string[]
  sections: PdfSection[]
  filename: string
  qrUrl?: string
}

async function buildMultiSectionDoc({ title, subtitle, infoLines, sections, qrUrl }: Omit<ExportMultiSectionPdfOptions, 'filename'>): Promise<JsPDF> {
  const [jsPDF, autoTable] = await Promise.all([carregarJsPdf(), carregarAutoTable()])
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageHeight = doc.internal.pageSize.getHeight()

  await drawHeader(doc, title, subtitle, qrUrl)

  let y = HEADER_HEIGHT + 6
  if (infoLines && infoLines.length > 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor('#333333')
    infoLines.forEach((line, i) => doc.text(line, 12, y + i * 5.5))
    y += infoLines.length * 5.5 + 6
    doc.setTextColor('#111111')
  }

  for (const section of sections) {
    if (y > pageHeight - 30) { doc.addPage(); y = 16 }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(BRAND)
    doc.text(section.heading, 12, y)
    y += 5
    doc.setTextColor('#111111')

    if (section.rows.length === 0) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor('#777777')
      doc.text(section.emptyLabel ?? '—', 12, y + 3)
      doc.setTextColor('#111111')
      y += 12
      continue
    }

    autoTable(doc, {
      startY: y,
      head: [section.columns.map((c) => c.header)],
      body: section.rows.map((r) => section.columns.map((c) => r[c.key] ?? '—')),
      foot: section.totalsRow ? [section.totalsRow] : undefined,
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: BRAND, textColor: '#ffffff', fontStyle: 'bold' },
      footStyles: { fillColor: '#f0f4f8', textColor: '#111111', fontStyle: 'bold' },
      columnStyles: Object.fromEntries(
        section.columns.map((c, i) => [i, { halign: c.align ?? 'left' }])
      ),
      margin: { left: 12, right: 12 },
    })

    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
    y = finalY + 10
  }

  return doc
}

// Exporta várias tabelas num único PDF (ex.: histórico do cliente: vendas,
// dívidas, prestações, e depois uma secção por produto), com o mesmo
// cabeçalho de marca das restantes exportações.
export async function exportMultiSectionPdf({ filename, ...opts }: ExportMultiSectionPdfOptions) {
  const doc = await buildMultiSectionDoc(opts)
  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`)
}

// Igual a exportMultiSectionPdf, mas devolve o PDF como Blob em vez de o
// descarregar — usado para partilhar o ficheiro (ex.: Web Share API).
export async function getMultiSectionPdfBlob(opts: Omit<ExportMultiSectionPdfOptions, 'filename'>): Promise<Blob> {
  const doc = await buildMultiSectionDoc(opts)
  return doc.output('blob')
}

// Converte um documento HTML já renderizado (ex.: o popup de recibo/nota) em
// PDF real, capturando-o como imagem paginada — preserva o layout exato do
// documento em vez de reconstruir o texto via API do jsPDF.
export async function exportHtmlToPdf(target: HTMLElement, filename: string) {
  const [jsPDF, html2canvas] = await Promise.all([carregarJsPdf(), carregarHtml2Canvas()])

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
