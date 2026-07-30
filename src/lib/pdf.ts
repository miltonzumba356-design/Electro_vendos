import type { jsPDF as JsPDF } from 'jspdf'
import { format } from 'date-fns'
import logoUrl from '@/assets/vendos-logo.png'
import { EMPRESA } from './empresa'

// Formata o intervalo de datas escolhido pelo utilizador (inputs <input
// type="date">, ex.: '2026-01-01') para ser impresso no cabeçalho do PDF —
// assim o documento gerado sempre regista exatamente o período consultado.
// `vazio` é o texto usado quando nenhuma das datas foi preenchida (varia por
// relatório: "Hoje" quando o backend assume o dia actual, "Todo o histórico"
// quando assume tudo).
export function formatPeriodoPdf(dataInicio: string, dataFim: string, vazio: string): string {
  if (!dataInicio && !dataFim) return vazio
  const fmt = (v: string) => format(new Date(v), 'dd/MM/yyyy')
  if (dataInicio && dataFim) return `${fmt(dataInicio)} a ${fmt(dataFim)}`
  if (dataInicio) return `A partir de ${fmt(dataInicio)}`
  return `Até ${fmt(dataFim)}`
}

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

// ── Livro Razão / Extrato de conta corrente (cliente ou fornecedor) ───────
// Template de PDF no formato de livro-razão profissional: cabeçalho com os
// dados da empresa, dados da entidade, cartões de resumo financeiro e uma
// tabela de movimentos (Débito/Crédito/Saldo acumulado), com rodapé e área
// de assinatura repetidos em todas as páginas. Puramente de apresentação —
// quem chama já traz os valores calculados (nenhum cálculo de negócio
// acontece aqui, só formatação e acumulação de saldo para exibição).

const LEDGER_DEBITO = '#B91C1C'
const LEDGER_CREDITO = '#15803D'
const LEDGER_MUTED = '#6B7280'
const LEDGER_BORDER = '#D9DEE5'
const LEDGER_ZEBRA = '#F7F9FC'
const LEDGER_CARD_BG = '#F3F6FA'
const LEDGER_MARGIN = 12
const LEDGER_PAGE_W = 210
const LEDGER_PAGE_H = 297
const LEDGER_CONTENT_W = LEDGER_PAGE_W - LEDGER_MARGIN * 2

export interface LedgerEntidade {
  nome: string
  codigo?: string
  nif?: string | null
  telefone?: string | null
  email?: string | null
  morada?: string | null
  estado?: string
  dataRegisto?: string
}

export interface LedgerMovimento {
  data: string
  documento: string
  tipo: string
  descricao: string
  debito?: number
  credito?: number
}

export interface ExportLedgerPdfOptions {
  titulo: string
  entidadeLabel: string
  entidade: LedgerEntidade
  periodoLabel: string
  saldoInicial: number
  movimentos: LedgerMovimento[]
  utilizador?: string | null
  filename: string
}

function fmtKzLedger(v: number) {
  return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(v)
}

function desenharCard(doc: JsPDF, x: number, y: number, w: number, h: number, label: string, value: string, cor = '#111111') {
  doc.setFillColor(LEDGER_CARD_BG)
  doc.roundedRect(x, y, w, h, 1.5, 1.5, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(LEDGER_MUTED)
  doc.text(label, x + 4, y + 6)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(cor)
  doc.text(value, x + 4, y + 12.5)
  doc.setTextColor('#111111')
}

function desenharRodapeLedger(doc: JsPDF, pageNumber: number, utilizador?: string | null) {
  const y = LEDGER_PAGE_H - 16
  doc.setDrawColor(LEDGER_BORDER)
  doc.setLineWidth(0.3)
  doc.line(LEDGER_MARGIN, y, LEDGER_PAGE_W - LEDGER_MARGIN, y)

  const now = new Date()
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(LEDGER_MUTED)
  doc.text('Electro Vendos', LEDGER_MARGIN, y + 5)
  const emitido = `Emitido em ${now.toLocaleDateString('pt-AO')} ${now.toLocaleTimeString('pt-AO')}${utilizador ? ` por ${utilizador}` : ''}`
  doc.text(emitido, LEDGER_PAGE_W / 2, y + 5, { align: 'center' })
  // Reserva a área "Página N" — a numeração total é escrita numa segunda
  // passada, quando o número final de páginas já é conhecido.
  doc.text(`Página ${pageNumber}`, LEDGER_PAGE_W - LEDGER_MARGIN, y + 5, { align: 'right' })
  doc.setTextColor('#111111')
}

function desenharCabecalhoContinuacao(doc: JsPDF, entidadeLabel: string, entidadeNome: string) {
  doc.setDrawColor(BRAND)
  doc.setLineWidth(0.6)
  doc.line(LEDGER_MARGIN, 18, LEDGER_PAGE_W - LEDGER_MARGIN, 18)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(BRAND)
  doc.text('EXTRATO / HISTÓRICO — Livro Razão (continuação)', LEDGER_MARGIN, 12)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(LEDGER_MUTED)
  doc.text(`${entidadeLabel}: ${entidadeNome}`, LEDGER_PAGE_W - LEDGER_MARGIN, 12, { align: 'right' })
  doc.setTextColor('#111111')
}

interface TopoLedgerResult {
  y: number
  rightX: number
  paginasHeaderY: number
  totalDebitos: number
  totalCreditos: number
  saldoFinal: number
}

// Desenha o bloco do topo, comum aos dois formatos de Livro Razão (tabela
// única ou secções tituladas): cabeçalho da empresa + título/metadados,
// dados da entidade e os 6 cartões de resumo financeiro. Devolve o Y onde o
// conteúdo (tabela ou secções) deve começar, mais os totais já calculados a
// partir dos movimentos (para os cartões finais) e as coordenadas que a
// segunda passada de paginação precisa de reescrever.
function desenharTopoLedger(doc: JsPDF, opts: {
  titulo: string
  entidadeLabel: string
  entidade: LedgerEntidade
  periodoLabel: string
  saldoInicial: number
  movimentos: LedgerMovimento[]
  logoDataUrl: string | null
}): TopoLedgerResult {
  const { titulo, entidadeLabel, entidade, periodoLabel, saldoInicial, movimentos, logoDataUrl } = opts

  // ── Cabeçalho: empresa (esquerda) + título/metadados (direita) ──────
  let leftY = 13
  let textX = LEDGER_MARGIN
  if (logoDataUrl) {
    const logoW = 24
    const logoH = logoW * LOGO_ASPECT
    doc.addImage(logoDataUrl, 'PNG', LEDGER_MARGIN, 8, logoW, logoH)
    textX = LEDGER_MARGIN + logoW + 5
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor('#111111')
  doc.text(EMPRESA.nome, textX, leftY)
  leftY += 4.5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(LEDGER_MUTED)
  const linhasEmpresa = [
    EMPRESA.nif ? `NIF: ${EMPRESA.nif}` : null,
    EMPRESA.morada || null,
    [EMPRESA.telefone, EMPRESA.email].filter(Boolean).join('  •  ') || null,
    EMPRESA.website || null,
  ].filter((l): l is string => Boolean(l))
  for (const linha of linhasEmpresa) {
    doc.text(linha, textX, leftY)
    leftY += 4
  }

  const rightX = LEDGER_PAGE_W - LEDGER_MARGIN
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(BRAND)
  doc.text(titulo, rightX, 13, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(LEDGER_MUTED)
  const agora = new Date()
  doc.text(`Data de emissão: ${agora.toLocaleDateString('pt-AO')} ${agora.toLocaleTimeString('pt-AO')}`, rightX, 19, { align: 'right' })
  doc.text(`Período: ${periodoLabel}`, rightX, 24, { align: 'right' })
  // "Páginas" é preenchido na segunda passada, quando o total é conhecido.
  const paginasHeaderY = 29

  let y = Math.max(leftY, 34) + 3
  doc.setDrawColor(BRAND)
  doc.setLineWidth(0.8)
  doc.line(LEDGER_MARGIN, y, LEDGER_PAGE_W - LEDGER_MARGIN, y)
  y += 7
  doc.setTextColor('#111111')

  // ── Dados da entidade ─────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(BRAND)
  doc.text(`DADOS DO ${entidadeLabel.toUpperCase()}`, LEDGER_MARGIN, y)
  y += 4
  doc.setTextColor('#111111')

  const boxTop = y
  const linhasEntidade: [string, string][][] = [
    [['Nome', entidade.nome || '—'], ['Código', entidade.codigo || '—']],
    [['NIF', entidade.nif || '—'], ['Telefone', entidade.telefone || '—']],
    [['Email', entidade.email || '—'], ['Morada', entidade.morada || '—']],
    [['Estado', entidade.estado || '—'], ['Data de registo', entidade.dataRegisto ? new Date(entidade.dataRegisto).toLocaleDateString('pt-AO') : '—']],
  ]
  const rowH = 6.2
  const boxH = linhasEntidade.length * rowH + 4
  doc.setDrawColor(LEDGER_BORDER)
  doc.setLineWidth(0.3)
  doc.roundedRect(LEDGER_MARGIN, boxTop, LEDGER_CONTENT_W, boxH, 1.5, 1.5)

  let rowY = boxTop + 5.5
  const col1X = LEDGER_MARGIN + 4
  const col2X = LEDGER_MARGIN + LEDGER_CONTENT_W / 2 + 2
  for (const [[l1, v1], [l2, v2]] of linhasEntidade) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(LEDGER_MUTED)
    doc.text(`${l1}:`, col1X, rowY)
    doc.text(`${l2}:`, col2X, rowY)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor('#111111')
    doc.text(String(v1), col1X + 22, rowY)
    doc.text(String(v2), col2X + 26, rowY)
    rowY += rowH
  }
  y = boxTop + boxH + 8

  // ── Resumo financeiro ────────────────────────────────────────────
  const totalDebitos = movimentos.reduce((s, m) => s + (m.debito ?? 0), 0)
  const totalCreditos = movimentos.reduce((s, m) => s + (m.credito ?? 0), 0)
  const saldoFinal = saldoInicial + totalDebitos - totalCreditos
  const numFaturas = movimentos.filter((m) => (m.debito ?? 0) > 0).length
  const numPagamentos = movimentos.filter((m) => (m.credito ?? 0) > 0).length

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(BRAND)
  doc.text('RESUMO FINANCEIRO', LEDGER_MARGIN, y)
  y += 4
  doc.setTextColor('#111111')

  const gap = 5
  const cardW = (LEDGER_CONTENT_W - gap * 2) / 3
  const cardH = 15.5
  const cards: [string, string, string][] = [
    ['Saldo Inicial', fmtKzLedger(saldoInicial), '#111111'],
    ['Total de Débitos', fmtKzLedger(totalDebitos), LEDGER_DEBITO],
    ['Total de Créditos', fmtKzLedger(totalCreditos), LEDGER_CREDITO],
    ['Saldo Final', fmtKzLedger(saldoFinal), saldoFinal > 0 ? LEDGER_DEBITO : '#111111'],
    ['Nº de Faturas', String(numFaturas), '#111111'],
    ['Nº de Pagamentos', String(numPagamentos), '#111111'],
  ]
  cards.forEach(([label, value, cor], i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    desenharCard(doc, LEDGER_MARGIN + col * (cardW + gap), y + row * (cardH + gap), cardW, cardH, label, value, cor)
  })
  const tableStartY = y + 2 * cardH + gap + 8

  return { y: tableStartY, rightX, paginasHeaderY, totalDebitos, totalCreditos, saldoFinal }
}

// Cartões finais (totais + saldo final) e área de assinatura, no fecho do
// documento — quebra de página automática se não houver espaço na página
// atual, redesenhando cabeçalho de continuação e rodapé nessa nova página.
function desenharFechoLedger(doc: JsPDF, params: {
  entidadeLabel: string
  entidadeNome: string
  totalDebitos: number
  totalCreditos: number
  saldoFinal: number
  utilizador?: string | null
  cursorY: number
}) {
  const { entidadeLabel, entidadeNome, totalDebitos, totalCreditos, saldoFinal, utilizador } = params
  let cursorY = params.cursorY

  const ESPACO_FECHO = 62
  if (cursorY > LEDGER_PAGE_H - ESPACO_FECHO) {
    doc.addPage()
    desenharCabecalhoContinuacao(doc, entidadeLabel, entidadeNome)
    desenharRodapeLedger(doc, doc.internal.getNumberOfPages(), utilizador)
    cursorY = 26
  }

  const gap = 5
  const cardH = 15.5
  let closeY = cursorY + 9
  const closeCardW = (LEDGER_CONTENT_W - gap * 2) / 3
  desenharCard(doc, LEDGER_MARGIN, closeY, closeCardW, cardH, 'Total de Débitos', fmtKzLedger(totalDebitos), LEDGER_DEBITO)
  desenharCard(doc, LEDGER_MARGIN + closeCardW + gap, closeY, closeCardW, cardH, 'Total de Créditos', fmtKzLedger(totalCreditos), LEDGER_CREDITO)
  desenharCard(doc, LEDGER_MARGIN + (closeCardW + gap) * 2, closeY, closeCardW, cardH, 'Saldo Final', fmtKzLedger(saldoFinal), saldoFinal > 0 ? LEDGER_DEBITO : '#111111')
  closeY += cardH + 16

  doc.setDrawColor('#333333')
  doc.setLineWidth(0.3)
  const assinaturaW = 78
  doc.line(LEDGER_MARGIN, closeY, LEDGER_MARGIN + assinaturaW, closeY)
  doc.line(LEDGER_PAGE_W - LEDGER_MARGIN - assinaturaW, closeY, LEDGER_PAGE_W - LEDGER_MARGIN, closeY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(LEDGER_MUTED)
  doc.text('Assinatura do Responsável', LEDGER_MARGIN + assinaturaW / 2, closeY + 5, { align: 'center' })
  doc.text(`Assinatura do ${entidadeLabel}`, LEDGER_PAGE_W - LEDGER_MARGIN - assinaturaW / 2, closeY + 5, { align: 'center' })
  doc.setTextColor('#111111')
}

// Segunda passada: agora que o número total de páginas é conhecido, reescreve
// "Páginas: N" no cabeçalho da 1ª página e "Página X de N" no rodapé de
// todas as páginas (a área é pintada de branco antes, por cima do texto
// provisório desenhado durante a primeira passada).
function patchPaginacaoLedger(doc: JsPDF, paginasHeaderY: number, rightX: number) {
  const totalPaginas = doc.internal.getNumberOfPages()
  for (let p = 1; p <= totalPaginas; p++) {
    doc.setPage(p)
    if (p === 1) {
      doc.setFillColor('#ffffff')
      doc.rect(LEDGER_PAGE_W - LEDGER_MARGIN - 40, paginasHeaderY - 3.5, 40, 5, 'F')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(LEDGER_MUTED)
      doc.text(`Páginas: ${totalPaginas}`, rightX, paginasHeaderY, { align: 'right' })
    }
    const footerY = LEDGER_PAGE_H - 16 + 5
    doc.setFillColor('#ffffff')
    doc.rect(LEDGER_PAGE_W - LEDGER_MARGIN - 34, footerY - 3.5, 34, 5, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(LEDGER_MUTED)
    doc.text(`Página ${p} de ${totalPaginas}`, LEDGER_PAGE_W - LEDGER_MARGIN, footerY, { align: 'right' })
  }
  doc.setTextColor('#111111')
}

async function buildLedgerDoc(opts: Omit<ExportLedgerPdfOptions, 'filename'>): Promise<JsPDF> {
  const { titulo, entidadeLabel, entidade, periodoLabel, saldoInicial, movimentos, utilizador } = opts
  const [jsPDF, autoTable] = await Promise.all([carregarJsPdf(), carregarAutoTable()])
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const logoDataUrl = await carregarLogoDataUrl()

  const { y: tableStartY, rightX, paginasHeaderY, totalDebitos, totalCreditos, saldoFinal } =
    desenharTopoLedger(doc, { titulo, entidadeLabel, entidade, periodoLabel, saldoInicial, movimentos, logoDataUrl })

  // ── Tabela de movimentos, com saldo acumulado linha a linha ────────
  let saldoCorrente = saldoInicial
  const body = [...movimentos]
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    .map((m) => {
      saldoCorrente += (m.debito ?? 0) - (m.credito ?? 0)
      return {
        data: new Date(m.data).toLocaleDateString('pt-AO'),
        documento: m.documento,
        tipo: m.tipo,
        descricao: m.descricao,
        debito: m.debito ? fmtKzLedger(m.debito) : '—',
        credito: m.credito ? fmtKzLedger(m.credito) : '—',
        saldo: fmtKzLedger(saldoCorrente),
        _isDebito: (m.debito ?? 0) > 0,
        _isCredito: (m.credito ?? 0) > 0,
      }
    })

  autoTable(doc, {
    startY: tableStartY,
    head: [['Data', 'Documento', 'Tipo', 'Descrição', 'Débito', 'Crédito', 'Saldo']],
    body: body.map((r) => [r.data, r.documento, r.tipo, r.descricao, r.debito, r.credito, r.saldo]),
    showHead: 'everyPage',
    styles: { fontSize: 8.3, cellPadding: 2.2, lineColor: LEDGER_BORDER, lineWidth: 0.1, textColor: '#111111' },
    headStyles: { fillColor: BRAND, textColor: '#ffffff', fontStyle: 'bold', fontSize: 8.3 },
    alternateRowStyles: { fillColor: LEDGER_ZEBRA },
    columnStyles: {
      0: { halign: 'center', cellWidth: 20 },
      1: { halign: 'center', cellWidth: 18 },
      2: { halign: 'left', cellWidth: 24 },
      3: { halign: 'left' },
      4: { halign: 'right', cellWidth: 20 },
      5: { halign: 'right', cellWidth: 20 },
      6: { halign: 'right', cellWidth: 22, fontStyle: 'bold' },
    },
    margin: { top: 24, left: LEDGER_MARGIN, right: LEDGER_MARGIN, bottom: 26 },
    didParseCell: (data: { section: string; column: { index: number }; row: { index: number }; cell: { styles: { textColor: string | number[] } } }) => {
      if (data.section !== 'body') return
      const row = body[data.row.index]
      if (!row) return
      if (data.column.index === 4 && row._isDebito) data.cell.styles.textColor = LEDGER_DEBITO
      if (data.column.index === 5 && row._isCredito) data.cell.styles.textColor = LEDGER_CREDITO
    },
    didDrawPage: (data: { pageNumber: number }) => {
      if (data.pageNumber > 1) desenharCabecalhoContinuacao(doc, entidadeLabel, entidade.nome)
      desenharRodapeLedger(doc, data.pageNumber, utilizador)
    },
  })

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
  desenharFechoLedger(doc, { entidadeLabel, entidadeNome: entidade.nome, totalDebitos, totalCreditos, saldoFinal, utilizador, cursorY: finalY })
  patchPaginacaoLedger(doc, paginasHeaderY, rightX)

  return doc
}

// ── Livro Razão em secções tituladas (ex.: fornecedores: Compras, Pagamentos,
// e uma secção por produto) — mesmo cabeçalho/dados da entidade/resumo e
// rodapé/assinatura do formato de tabela única, mas o corpo é uma sequência
// de tabelas com o seu próprio título, em vez de um único razão cronológico.
export interface LedgerTableSection {
  titulo: string
  colunas: PdfColumn[]
  linhas: Array<Record<string, string | number>>
  totalsRow?: Array<string | number>
  emptyLabel?: string
}

export interface ExportLedgerSectionsPdfOptions {
  titulo: string
  entidadeLabel: string
  entidade: LedgerEntidade
  periodoLabel: string
  saldoInicial: number
  movimentos: LedgerMovimento[]
  sections: LedgerTableSection[]
  utilizador?: string | null
  filename: string
}

async function buildLedgerSectionsDoc(opts: Omit<ExportLedgerSectionsPdfOptions, 'filename'>): Promise<JsPDF> {
  const { titulo, entidadeLabel, entidade, periodoLabel, saldoInicial, movimentos, sections, utilizador } = opts
  const [jsPDF, autoTable] = await Promise.all([carregarJsPdf(), carregarAutoTable()])
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const logoDataUrl = await carregarLogoDataUrl()

  const { y: startY, rightX, paginasHeaderY, totalDebitos, totalCreditos, saldoFinal } =
    desenharTopoLedger(doc, { titulo, entidadeLabel, entidade, periodoLabel, saldoInicial, movimentos, logoDataUrl })

  let y = startY
  for (const section of sections) {
    if (y > LEDGER_PAGE_H - 40) {
      doc.addPage()
      desenharCabecalhoContinuacao(doc, entidadeLabel, entidade.nome)
      desenharRodapeLedger(doc, doc.internal.getNumberOfPages(), utilizador)
      y = 26
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(BRAND)
    doc.text(section.titulo, LEDGER_MARGIN, y)
    y += 5
    doc.setTextColor('#111111')

    if (section.linhas.length === 0) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(LEDGER_MUTED)
      doc.text(section.emptyLabel ?? '—', LEDGER_MARGIN, y + 3)
      doc.setTextColor('#111111')
      y += 12
      continue
    }

    autoTable(doc, {
      startY: y,
      head: [section.colunas.map((c) => c.header)],
      body: section.linhas.map((r) => section.colunas.map((c) => r[c.key] ?? '—')),
      foot: section.totalsRow ? [section.totalsRow] : undefined,
      showHead: 'everyPage',
      styles: { fontSize: 8.3, cellPadding: 2.2, lineColor: LEDGER_BORDER, lineWidth: 0.1, textColor: '#111111' },
      headStyles: { fillColor: BRAND, textColor: '#ffffff', fontStyle: 'bold', fontSize: 8.3 },
      footStyles: { fillColor: LEDGER_CARD_BG, textColor: '#111111', fontStyle: 'bold', fontSize: 8.3 },
      alternateRowStyles: { fillColor: LEDGER_ZEBRA },
      columnStyles: Object.fromEntries(section.colunas.map((c, i) => [i, { halign: c.align ?? 'left' }])),
      margin: { top: 24, left: LEDGER_MARGIN, right: LEDGER_MARGIN, bottom: 26 },
      didDrawPage: (data: { pageNumber: number }) => {
        if (data.pageNumber > 1) desenharCabecalhoContinuacao(doc, entidadeLabel, entidade.nome)
        desenharRodapeLedger(doc, data.pageNumber, utilizador)
      },
    })

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
  }

  desenharFechoLedger(doc, { entidadeLabel, entidadeNome: entidade.nome, totalDebitos, totalCreditos, saldoFinal, utilizador, cursorY: y - 10 })
  patchPaginacaoLedger(doc, paginasHeaderY, rightX)

  return doc
}

// Exporta o histórico/extrato de uma entidade (cliente ou fornecedor) em
// formato de Livro Razão digital — cabeçalho com dados da empresa, dados da
// entidade, cartões de resumo e tabela de movimentos com saldo acumulado.
export async function exportLedgerPdf({ filename, ...opts }: ExportLedgerPdfOptions) {
  const doc = await buildLedgerDoc(opts)
  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`)
}

// Igual a exportLedgerPdf, mas devolve o PDF como Blob em vez de o
// descarregar — usado para partilhar o ficheiro (ex.: Web Share API).
export async function getLedgerPdfBlob(opts: Omit<ExportLedgerPdfOptions, 'filename'>): Promise<Blob> {
  const doc = await buildLedgerDoc(opts)
  return doc.output('blob')
}

// Exporta um Livro Razão em secções tituladas (cada uma com a sua própria
// tabela) — mesmo cabeçalho, dados da entidade, resumo financeiro, rodapé e
// assinaturas do formato de tabela única.
export async function exportLedgerSectionsPdf({ filename, ...opts }: ExportLedgerSectionsPdfOptions) {
  const doc = await buildLedgerSectionsDoc(opts)
  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`)
}

// Igual a exportLedgerSectionsPdf, mas devolve o PDF como Blob em vez de o
// descarregar — usado para partilhar o ficheiro (ex.: Web Share API).
export async function getLedgerSectionsPdfBlob(opts: Omit<ExportLedgerSectionsPdfOptions, 'filename'>): Promise<Blob> {
  const doc = await buildLedgerSectionsDoc(opts)
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
