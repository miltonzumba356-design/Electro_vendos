import { api } from '@/lib/api'
import type {
  FornecedorCreate,
  FornecedorResponse,
  CompraFornecedorCreate,
  DividaFornecedorResponse,
  PagarDividaFornecedorRequest,
  TotalDividasFornecedorResponse,
  ExtratoFornecedor,
} from '@/types'

export const fornecedoresService = {
  listar: (params?: { skip?: number; limit?: number }) =>
    api.get<FornecedorResponse[]>('/fornecedores', params),

  buscar: (id: string) =>
    api.get<FornecedorResponse>(`/fornecedores/${id}`),

  criar: (data: FornecedorCreate) =>
    api.post<FornecedorResponse>('/fornecedores', data),

  // NOTA: o backend em produção ainda só aceita 1 produto por chamada
  // (produto_id/quantidade/preco_unitario na raiz do body) — o payload
  // { itens: [...], moeda } documentado ainda não foi implantado no servidor
  // (confirmado por um 422 "Field required" nesses 3 campos ao enviar
  // itens/moeda). Até isso ser implantado, cada item do carrinho é enviado
  // numa chamada separada nesse formato antigo, criando uma dívida por
  // produto; `moeda` vai como campo extra (ignorado com segurança pelo
  // Pydantic) para já funcionar assim que o suporte a moeda for implantado.
  // Quando o backend passar a aceitar o payload novo, troque isto por uma
  // única chamada com `data` diretamente.
  comprar: async (fornecedorId: string, data: CompraFornecedorCreate) => {
    const resultados: DividaFornecedorResponse[] = []
    for (const item of data.itens) {
      const resultado = await api.post<DividaFornecedorResponse>(`/fornecedores/${fornecedorId}/compras`, {
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        moeda: data.moeda,
      })
      resultados.push(resultado)
    }
    return resultados
  },

  // Histórico cronológico de facturas (compras a crédito) e recibos (pagamentos)
  // do fornecedor. Sem data_inicio/data_fim, traz todo o histórico.
  extrato: (fornecedorId: string, params?: { data_inicio?: string; data_fim?: string }) =>
    api.get<ExtratoFornecedor>(`/fornecedores/${fornecedorId}/extrato`, params),

  dividas: {
    listar: (params?: { fornecedor_id?: string; status?: 'DIVIDA' | 'PAGA'; data_inicio?: string; data_fim?: string; skip?: number; limit?: number }) =>
      api.get<DividaFornecedorResponse[]>('/fornecedores/dividas', params),

    total: () =>
      api.get<TotalDividasFornecedorResponse>('/fornecedores/dividas/total'),

    buscar: (id: string) =>
      api.get<DividaFornecedorResponse>(`/fornecedores/dividas/${id}`),

    // Busca a factura (dívida) a fornecedor pelo número sequencial.
    buscarPorNumero: (numero: number) =>
      api.get<DividaFornecedorResponse>(`/fornecedores/dividas/numero/${numero}`),

    pagar: (data: PagarDividaFornecedorRequest) =>
      api.post<DividaFornecedorResponse>('/fornecedores/dividas/pagar', data),
  },
}
