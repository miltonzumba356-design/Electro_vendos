// A API não faz conversão de câmbio — um valor gravado em USD continua em
// USD para sempre, nunca é recalculado para Kz. "KZ" é só o apelido que a
// app usa para o Kwanza (não é um código ISO 4217 válido); para formatar
// precisamos do código real "AOA".
const CODIGO_ISO: Record<string, string> = { KZ: 'AOA', AOA: 'AOA', USD: 'USD', EUR: 'EUR' }

// Formata um valor monetário na moeda em que ele foi efetivamente registado
// (moeda da compra/factura, ou moeda de um pagamento específico) — nunca
// assume Kz por padrão quando a moeda vem null/undefined de registos antigos,
// cai para Kz só como aproximação razoável.
export function formatMoeda(valor: number, moeda?: string | null): string {
  const codigo = CODIGO_ISO[(moeda ?? 'KZ').toUpperCase()] ?? 'AOA'
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: codigo,
    maximumFractionDigits: 0,
  }).format(valor)
}

// Um fornecedor pode ter dívidas em moedas diferentes (cada compra tem a sua
// própria moeda_compra). Só dá para mostrar um total/saldo agregado numa
// única moeda quando TODAS as dívidas estiverem na mesma — caso contrário,
// somar valores em moedas diferentes sem conversão não produz um número
// correto em nenhuma delas, e quem chama deve cair para uma aproximação.
export function detectarMoedaUnica(itens: { moeda_compra?: string | null }[]): string | undefined {
  const moedas = new Set(itens.map((i) => i.moeda_compra ?? 'KZ'))
  return moedas.size === 1 ? [...moedas][0] : undefined
}
