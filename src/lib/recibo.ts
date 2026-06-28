import type { VendaResponse, MovimentoResponse } from '@/types'

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

function openPrint(html: string) {
  const win = window.open('', '_blank', 'width=380,height=680,toolbar=no,menubar=no,location=no,scrollbars=yes')
  if (!win) { alert('Por favor, permita pop-ups para imprimir.'); return }
  win.document.write(html)
  win.document.close()
  win.addEventListener('load', () => {
    win.print()
    win.addEventListener('afterprint', () => win.close())
  })
}

export function imprimirVenda(venda: VendaResponse) {
  const linhas = venda.itens.map((item) => `
    <tr>
      <td style="padding-right:4px">${item.produto_nome}</td>
      <td class="r">${item.quantidade}</td>
      <td class="r">${fmtKz(item.preco_unitario)}</td>
      <td class="r">${fmtKz(item.subtotal)}</td>
    </tr>`).join('')

  const descontoHtml = venda.desconto_percentual > 0
    ? `<div class="row"><span>Desconto (${venda.desconto_percentual}%):</span><span>-${fmtKz(venda.total_desconto)}</span></div>`
    : ''

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Recibo</title><style>${CSS}</style></head>
<body>
  <h1>ELECTRO VENDOS</h1>
  <p class="sub">Recibo de Venda</p>
  <hr>
  <div class="row"><span>Data:</span><span>${fmtData(venda.criado_em)}</span></div>
  <div class="row"><span>Ref.:</span><span>${venda.id.slice(0, 8).toUpperCase()}</span></div>
  <div class="row"><span>Cliente:</span><span>${venda.cliente_nome}</span></div>
  <div class="row"><span>Operador:</span><span>${venda.utilizador_nome}</span></div>
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
</body></html>`

  openPrint(html)
}

export function imprimirEntradaStock(m: MovimentoResponse) {
  const totalHtml = m.preco_unitario
    ? `<hr><div class="row"><span>Preço unitário:</span><span>${fmtKz(m.preco_unitario)}</span></div>
       <div class="row bold"><span>TOTAL:</span><span>${fmtKz(m.preco_unitario * m.quantidade)}</span></div>`
    : ''

  const motivoHtml = m.motivo
    ? `<hr><div class="row"><span>Motivo:</span><span>${m.motivo}</span></div>`
    : ''

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Nota de Entrada</title><style>${CSS}</style></head>
<body>
  <h1>ELECTRO VENDOS</h1>
  <p class="sub">Nota de Entrada de Stock</p>
  <hr>
  <div class="row"><span>Data:</span><span>${fmtData(m.criado_em)}</span></div>
  <div class="row"><span>Ref.:</span><span>${m.id.slice(0, 8).toUpperCase()}</span></div>
  <div class="row"><span>Operador:</span><span>${m.utilizador_nome}</span></div>
  <hr>
  <div class="row"><span>Produto:</span><span>${m.produto_nome}</span></div>
  <div class="row"><span>Quantidade:</span><span>${m.quantidade}</span></div>
  ${totalHtml}
  ${motivoHtml}
  <div class="footer"><p>Documento de uso interno</p><p>${new Date().getFullYear()} &copy; Electro Vendos</p></div>
</body></html>`

  openPrint(html)
}
