import type { VendaResponse, MovimentoResponse } from '@/types'

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

function abrirJanela(html: string, autoPrint: boolean) {
  const win = window.open('', '_blank', 'width=380,height=680,toolbar=no,menubar=no,location=no,scrollbars=yes')
  if (!win) { alert('Por favor, permita pop-ups para imprimir.'); return }
  win.document.write(html)
  win.document.close()
  if (autoPrint) {
    win.addEventListener('load', () => {
      win.print()
      win.addEventListener('afterprint', () => win.close())
    })
  } else {
    // O botão não usa onclick inline — o CSP do site (script-src 'self') pode
    // ser herdado por este popup about:blank e bloquear handlers inline. O
    // listener é ligado aqui, a partir do script já carregado da app.
    win.document.getElementById('btn-imprimir')?.addEventListener('click', () => win.print())
  }
}

const BOTAO_IMPRIMIR = `
  <button id="btn-imprimir" style="display:block;width:100%;margin-top:14px;padding:10px;border:none;border-radius:8px;background:#111;color:#fff;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer">
    Imprimir
  </button>
`

function gerarReciboVendaHtml(venda: VendaResponse, comBotaoImprimir: boolean): string {
  const linhas = venda.itens.map((item) => `
    <tr>
      <td style="padding-right:4px">${esc(item.produto_nome)}</td>
      <td class="r">${item.quantidade}</td>
      <td class="r">${fmtKz(item.preco_unitario)}</td>
      <td class="r">${fmtKz(item.subtotal)}</td>
    </tr>`).join('')

  const descontoHtml = venda.desconto_percentual > 0
    ? `<div class="row"><span>Desconto (${venda.desconto_percentual}%):</span><span>-${fmtKz(venda.total_desconto)}</span></div>`
    : ''

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Recibo</title><style>${CSS}</style></head>
<body>
  <h1>ELECTRO VENDOS</h1>
  <p class="sub">Recibo de Venda</p>
  <hr>
  <div class="row"><span>Data:</span><span>${fmtData(venda.criado_em)}</span></div>
  <div class="row"><span>Ref.:</span><span>${venda.id.slice(0, 8).toUpperCase()}</span></div>
  <div class="row"><span>Cliente:</span><span>${esc(venda.cliente_nome)}</span></div>
  <div class="row"><span>Operador:</span><span>${esc(venda.utilizador_nome)}</span></div>
  <hr>
  <table>
    <thead><tr><th>Produto</th><th class="r">Qtd</th><th class="r">Preço</th><th class="r">Total</th></tr></thead>
    <tbody>${linhas}</tbody>
  </table>
  <hr>
  <div class="row"><span>Subtotal s/ IVA:</span><span>${fmtKz(venda.total_sem_iva)}</span></div>
  <div class="row"><span>IVA:</span><span>${fmtKz(venda.total_iva)}</span></div>
  ${descontoHtml}
  <div class="row bold"><span>TOTAL:</span><span>${fmtKz(venda.total_final)}</span></div>
  <div class="footer"><p>Obrigado pela sua preferência!</p><p>${new Date().getFullYear()} &copy; Electro Vendos</p></div>
  ${comBotaoImprimir ? BOTAO_IMPRIMIR : ''}
</body></html>`
}

export function imprimirVenda(venda: VendaResponse) {
  abrirJanela(gerarReciboVendaHtml(venda, false), true)
}

export function visualizarVenda(venda: VendaResponse) {
  abrirJanela(gerarReciboVendaHtml(venda, true), false)
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

export function imprimirEntradaStock(m: MovimentoResponse) {
  const totalHtml = m.preco_unitario
    ? `<hr><div class="row"><span>Preço unitário:</span><span>${fmtKz(m.preco_unitario)}</span></div>
       <div class="row bold"><span>TOTAL:</span><span>${fmtKz(m.preco_unitario * m.quantidade)}</span></div>`
    : ''

  const motivoHtml = m.motivo
    ? `<hr><div class="row"><span>Motivo:</span><span>${esc(m.motivo)}</span></div>`
    : ''

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Nota de Entrada</title><style>${CSS}</style></head>
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
</body></html>`

  abrirJanela(html, true)
}
