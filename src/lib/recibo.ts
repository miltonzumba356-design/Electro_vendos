import type { VendaResponse, MovimentoResponse, DividaFornecedorResponse } from '@/types'
import { exportHtmlToPdf } from '@/lib/pdf'

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}

// Nomes de clientes/produtos/motivos vêm de dados inseridos pelo utilizador;
// escapamos antes de injetar via document.write para evitar que um nome como
// "<script>...</script>" execute no popup de impressão.
function esc(value: string): string {
  return value.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c])
}

function fmtKz(v: number): string {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency', currency: 'AOA', maximumFractionDigits: 0,
  }).format(v)
}

function fmtData(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const CSS = `
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Courier New',monospace;font-size:12px;width:302px;margin:0 auto;padding:12px 8px;color:#111}
  h1{text-align:center;font-size:15px;font-weight:700;letter-spacing:2px;margin-bottom:2px}
  .sub{text-align:center;font-size:11px;margin-bottom:6px}
  hr{border:none;border-top:1px dashed #555;margin:6px 0}
  .row{display:flex;justify-content:space-between;padding:1px 0;font-size:11px;gap:8px}
  .row span:last-child{text-align:right;flex-shrink:0}
  .bold{font-weight:700;font-size:13px;border-top:1px solid #111;margin-top:5px;padding-top:5px}
  table{width:100%;border-collapse:collapse;font-size:11px;margin:4px 0}
  th{border-bottom:1px solid #555;padding:2px 0;text-align:left;font-size:10px}
  th.r,td.r{text-align:right}
  td{padding:2px 0;vertical-align:top}
  .footer{text-align:center;font-size:10px;margin-top:12px;line-height:1.6}
  @media print{@page{margin:5mm}button{display:none!important}}
`

function extrairTitulo(html: string): string {
  const m = html.match(/<title>(.*?)<\/title>/)
  return (m ? m[1] : 'documento').replace(/\s+/g, '_')
}

function abrirJanela(html: string, autoPrint: boolean, width = 380, height = 680) {
  const win = window.open('', '_blank', `width=${width},height=${height},toolbar=no,menubar=no,location=no,scrollbars=yes`)
  if (!win) { alert('Por favor, permita pop-ups para imprimir.'); return }
  win.document.write(html)
  win.document.close()
  if (autoPrint) {
    win.addEventListener('load', () => {
      win.print()
      win.addEventListener('afterprint', () => win.close())
    })
  } else {
    // Os botões não usam onclick inline — o CSP do site (script-src 'self') pode
    // ser herdado por este popup about:blank e bloquear handlers inline. Os
    // listeners são ligados aqui, a partir do script já carregado da app (o
    // popup about:blank partilha a origem do opener, por isso isto funciona).
    win.document.getElementById('btn-voltar')?.addEventListener('click', () => win.close())
    win.document.getElementById('btn-imprimir')?.addEventListener('click', () => win.print())

    const btnPdf = win.document.getElementById('btn-pdf') as HTMLButtonElement | null
    const botoes = win.document.getElementById('botoes-preview') as HTMLElement | null
    btnPdf?.addEventListener('click', async () => {
      const original = btnPdf.textContent
      btnPdf.disabled = true
      btnPdf.textContent = 'A gerar...'
      if (botoes) botoes.style.display = 'none'
      try {
        await exportHtmlToPdf(win.document.body, extrairTitulo(html))
      } finally {
        if (botoes) botoes.style.display = ''
        btnPdf.disabled = false
        btnPdf.textContent = original
      }
    })
  }
}

const BOTAO_IMPRIMIR = `
  <div id="botoes-preview" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:14px">
    <button id="btn-voltar" type="button" style="flex:1;padding:10px;border:1px solid #ccc;border-radius:8px;background:#fff;color:#111;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer">
      Voltar
    </button>
    <button id="btn-pdf" type="button" style="flex:1;padding:10px;border:none;border-radius:8px;background:#0F6CB5;color:#fff;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer">
      Baixar PDF
    </button>
    <button id="btn-imprimir" type="button" style="flex:1;padding:10px;border:none;border-radius:8px;background:#111;color:#fff;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer">
      Imprimir
    </button>
  </div>
`

// Documento largo tipo A4 — usado pela Factura Recibo/Crédito e pela Nota de
// Entrega. Distinto do CSS acima (que é o talão estreito das notas de stock).
const CSS_FATURA = `
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Arial,Helvetica,sans-serif;font-size:13px;max-width:800px;margin:0 auto;padding:32px;color:#111}
  .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #0F6CB5;padding-bottom:16px;margin-bottom:20px;gap:16px}
  .empresa h1{font-size:20px;color:#0F6CB5;letter-spacing:1px}
  .empresa p{font-size:11px;color:#666;margin-top:2px}
  .doc-info{text-align:right}
  .doc-info h2{font-size:16px;letter-spacing:1px}
  .doc-info p{font-size:11px;color:#555;margin-top:2px}
  .cliente-box{background:#f7f9fb;border-radius:6px;padding:12px 16px;margin-bottom:20px;display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .cliente-box .label{font-size:10px;text-transform:uppercase;color:#888;letter-spacing:0.5px}
  .cliente-box .valor{font-size:13px;font-weight:600;margin-top:2px}
  .cliente-nif{font-size:11px;color:#666;margin-top:2px}
  .info-row{display:flex;justify-content:space-between;font-size:11px;margin-top:4px}
  .info-row .ok{color:#16a34a;font-weight:700}
  .info-row .pendente{color:#dc2626;font-weight:700}
  table{width:100%;border-collapse:collapse;margin-bottom:16px}
  th{background:#0F6CB5;color:#fff;text-align:left;padding:8px;font-size:11px}
  th.r,td.r{text-align:right}
  td{padding:8px;border-bottom:1px solid #eee;font-size:12px}
  .totais{margin-left:auto;width:280px}
  .totais-row{display:flex;justify-content:space-between;padding:4px 0;font-size:12px;color:#444}
  .totais-row.final{font-weight:700;font-size:16px;color:#111;border-top:2px solid #111;padding-top:8px;margin-top:4px}
  .assinaturas{display:flex;justify-content:space-between;gap:24px;margin-top:60px}
  .assinatura{flex:1;text-align:center}
  .assinatura .nome{font-size:11px;color:#444;margin-bottom:28px;min-height:14px}
  .assinatura .linha{border-top:1px solid #111;padding-top:6px;font-size:11px;color:#555}
  .footer{text-align:center;font-size:11px;color:#888;margin-top:32px;line-height:1.6}
  @media print{@page{margin:15mm}button{display:none!important}}
`

function gerarFaturaVendaHtml(venda: VendaResponse, clienteNif: string | null, comBotaoImprimir: boolean): string {
  const isCredito = venda.credito
  const titulo = isCredito ? 'FACTURA DE CRÉDITO' : 'FACTURA RECIBO'

  const linhas = venda.itens.map((item) => `
    <tr>
      <td>${esc(item.produto_nome)}</td>
      <td class="r">${item.quantidade}</td>
      <td class="r">${fmtKz(item.preco_unitario)}</td>
      <td class="r">${item.iva_aplicado}%</td>
      <td class="r">${fmtKz(item.subtotal)}</td>
    </tr>`).join('')

  const descontoHtml = venda.desconto_percentual > 0
    ? `<div class="totais-row"><span>Desconto (${venda.desconto_percentual}%)</span><span>-${fmtKz(venda.total_desconto)}</span></div>`
    : ''

  const nifHtml = clienteNif
    ? `<p class="cliente-nif">NIF: ${esc(clienteNif)}</p>`
    : ''

  const estadoHtml = isCredito
    ? `<div class="info-row"><span>Estado:</span><span class="${venda.credito_pago ? 'ok' : 'pendente'}">${venda.credito_pago ? 'Pago' : 'Pendente'}</span></div>`
    : ''

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${titulo}</title><style>${CSS_FATURA}</style></head>
<body>
  <div class="header">
    <div class="empresa">
      <h1>ELECTRO VENDOS</h1>
      <p>Sistema de Gestão de Vendas</p>
    </div>
    <div class="doc-info">
      <h2>${titulo}</h2>
      <p>Ref.: ${venda.id.slice(0, 8).toUpperCase()}</p>
      <p>Data: ${fmtData(venda.criado_em)}</p>
    </div>
  </div>

  <div class="cliente-box">
    <div>
      <p class="label">Cliente</p>
      <p class="valor">${esc(venda.cliente_nome)}</p>
      ${nifHtml}
    </div>
    <div>
      <p class="label">Operador</p>
      <p class="valor">${esc(venda.utilizador_nome)}</p>
      ${estadoHtml}
    </div>
  </div>

  <table>
    <thead><tr><th>Produto</th><th class="r">Qtd</th><th class="r">Preço Unit.</th><th class="r">IVA</th><th class="r">Subtotal</th></tr></thead>
    <tbody>${linhas}</tbody>
  </table>

  <div class="totais">
    <div class="totais-row"><span>Subtotal s/ IVA</span><span>${fmtKz(venda.total_sem_iva)}</span></div>
    <div class="totais-row"><span>IVA</span><span>${fmtKz(venda.total_iva)}</span></div>
    ${descontoHtml}
    <div class="totais-row final"><span>TOTAL</span><span>${fmtKz(venda.total_final)}</span></div>
  </div>

  <div class="footer"><p>Obrigado pela sua preferência!</p><p>${new Date().getFullYear()} &copy; Electro Vendos</p></div>
  ${comBotaoImprimir ? BOTAO_IMPRIMIR : ''}
</body></html>`
}

export function imprimirVenda(venda: VendaResponse, clienteNif?: string | null) {
  abrirJanela(gerarFaturaVendaHtml(venda, clienteNif ?? null, false), true, 900, 1000)
}

export function visualizarVenda(venda: VendaResponse, clienteNif?: string | null) {
  abrirJanela(gerarFaturaVendaHtml(venda, clienteNif ?? null, true), false, 900, 1000)
}

// ── Nota de Entrega ──────────────────────────────────────────────
// Documento de transporte gerado a partir de uma venda ou fatura já
// existente — não corresponde a nenhuma entidade na API, é montado no
// frontend a partir dos itens já carregados (ver NotasEntregaPage).
export interface NotaEntregaItem {
  produto_nome: string
  quantidade: number
  descricao: string
}

export interface NotaEntregaData {
  origemTipo: 'venda' | 'fatura'
  origemRef: string
  clienteNome: string
  clienteNif?: string | null
  data: string
  motorista?: string
  matricula?: string
  observacoes?: string
  itens: NotaEntregaItem[]
}

function gerarNotaEntregaHtml(dados: NotaEntregaData, comBotaoImprimir: boolean): string {
  const linhas = dados.itens.map((item) => `
    <tr>
      <td>${esc(item.descricao || item.produto_nome)}</td>
      <td class="r">${item.quantidade}</td>
    </tr>`).join('')

  const nifHtml = dados.clienteNif
    ? `<p class="cliente-nif">NIF: ${esc(dados.clienteNif)}</p>`
    : ''

  const matriculaHtml = dados.matricula
    ? `<div class="info-row"><span>Matrícula:</span><span>${esc(dados.matricula)}</span></div>`
    : ''

  const observacoesHtml = dados.observacoes
    ? `<p style="font-size:12px;color:#444;margin-top:12px"><strong>Observações:</strong> ${esc(dados.observacoes)}</p>`
    : ''

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Nota de Entrega</title><style>${CSS_FATURA}</style></head>
<body>
  <div class="header">
    <div class="empresa">
      <h1>ELECTRO VENDOS</h1>
      <p>Sistema de Gestão de Vendas</p>
    </div>
    <div class="doc-info">
      <h2>NOTA DE ENTREGA</h2>
      <p>Ref.: ${esc(dados.origemRef)} (${dados.origemTipo === 'venda' ? 'Venda' : 'Fatura'})</p>
      <p>Data: ${fmtData(dados.data)}</p>
    </div>
  </div>

  <div class="cliente-box">
    <div>
      <p class="label">Cliente</p>
      <p class="valor">${esc(dados.clienteNome)}</p>
      ${nifHtml}
    </div>
    <div>
      <p class="label">Motorista/Camionista</p>
      <p class="valor">${dados.motorista ? esc(dados.motorista) : '—'}</p>
      ${matriculaHtml}
    </div>
  </div>

  <table>
    <thead><tr><th>Descrição</th><th class="r">Quantidade</th></tr></thead>
    <tbody>${linhas}</tbody>
  </table>
  ${observacoesHtml}

  <div class="assinaturas">
    <div class="assinatura">
      <p class="nome">${dados.motorista ? esc(dados.motorista) : ''}</p>
      <p class="linha">Assinatura do Camionista</p>
    </div>
    <div class="assinatura">
      <p class="nome">${esc(dados.clienteNome)}</p>
      <p class="linha">Assinatura do Cliente</p>
    </div>
    <div class="assinatura">
      <p class="nome"></p>
      <p class="linha">Assinatura do Administrador</p>
    </div>
  </div>

  <div class="footer"><p>${new Date().getFullYear()} &copy; Electro Vendos</p></div>
  ${comBotaoImprimir ? BOTAO_IMPRIMIR : ''}
</body></html>`
}

export function imprimirNotaEntrega(dados: NotaEntregaData) {
  abrirJanela(gerarNotaEntregaHtml(dados, false), true, 900, 1000)
}

export function visualizarNotaEntrega(dados: NotaEntregaData) {
  abrirJanela(gerarNotaEntregaHtml(dados, true), false, 900, 1000)
}

// Constrói o link wa.me com um resumo em texto da venda. Sem número de
// telefone do cliente, o WhatsApp mostra o seletor de contactos do utilizador.
export function partilharVendaWhatsapp(venda: VendaResponse, telefone?: string | null) {
  const linhas = venda.itens.map((item) => `• ${item.produto_nome} x${item.quantidade} — ${fmtKz(item.subtotal)}`)
  const mensagem = [
    `*ELECTRO VENDOS* — Recibo de Venda`,
    `Cliente: ${venda.cliente_nome}`,
    `Data: ${fmtData(venda.criado_em)}`,
    '',
    ...linhas,
    '',
    `Total: ${fmtKz(venda.total_final)}`,
    '',
    'Obrigado pela sua preferência!',
  ].join('\n')

  const numero = telefone ? telefone.replace(/[^0-9]/g, '') : ''
  const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`
  window.open(url, '_blank')
}

// Constrói o link wa.me com o extrato de transações de um fornecedor (compras
// a crédito registadas). Sem número de telefone do fornecedor, o WhatsApp
// mostra o seletor de contactos do utilizador.
export function partilharExtratoFornecedorWhatsapp(
  fornecedor: { nome: string; telefone?: string | null },
  dividas: DividaFornecedorResponse[],
  totais: { gasto: number; pago: number; devido: number }
) {
  const linhas = dividas.map((d) => {
    const moeda = d.moeda ?? 'AOA'
    return `• ${d.produto_nome ?? 'Compra'}${d.quantidade ? ` x${d.quantidade}` : ''} — ${fmtKz(d.valor_total)} ${moeda} (${d.status})`
  })
  const mensagem = [
    `*ELECTRO VENDOS* — Extrato de Fornecedor`,
    `Fornecedor: ${fornecedor.nome}`,
    '',
    ...linhas,
    '',
    `Total gasto: ${fmtKz(totais.gasto)}`,
    `Total pago: ${fmtKz(totais.pago)}`,
    `Total em dívida: ${fmtKz(totais.devido)}`,
  ].join('\n')

  const numero = fornecedor.telefone ? fornecedor.telefone.replace(/[^0-9]/g, '') : ''
  const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`
  window.open(url, '_blank')
}

function gerarEntradaStockHtml(m: MovimentoResponse, comBotaoImprimir: boolean): string {
  const totalHtml = m.preco_unitario
    ? `<hr><div class="row"><span>Preço unitário:</span><span>${fmtKz(m.preco_unitario)}</span></div>
       <div class="row bold"><span>TOTAL:</span><span>${fmtKz(m.preco_unitario * m.quantidade)}</span></div>`
    : ''

  const motivoHtml = m.motivo
    ? `<hr><div class="row"><span>Motivo:</span><span>${esc(m.motivo)}</span></div>`
    : ''

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Nota de Entrada</title><style>${CSS}</style></head>
<body>
  <h1>ELECTRO VENDOS</h1>
  <p class="sub">Nota de Entrada de Stock</p>
  <hr>
  <div class="row"><span>Data:</span><span>${fmtData(m.criado_em)}</span></div>
  <div class="row"><span>Ref.:</span><span>${m.id.slice(0, 8).toUpperCase()}</span></div>
  <div class="row"><span>Operador:</span><span>${esc(m.utilizador_nome)}</span></div>
  <hr>
  <div class="row"><span>Produto:</span><span>${esc(m.produto_nome)}</span></div>
  <div class="row"><span>Quantidade:</span><span>${m.quantidade}</span></div>
  ${totalHtml}
  ${motivoHtml}
  <div class="footer"><p>Documento de uso interno</p><p>${new Date().getFullYear()} &copy; Electro Vendos</p></div>
  ${comBotaoImprimir ? BOTAO_IMPRIMIR : ''}
</body></html>`
}

export function imprimirEntradaStock(m: MovimentoResponse) {
  abrirJanela(gerarEntradaStockHtml(m, false), true)
}

export function visualizarEntradaStock(m: MovimentoResponse) {
  abrirJanela(gerarEntradaStockHtml(m, true), false)
}
