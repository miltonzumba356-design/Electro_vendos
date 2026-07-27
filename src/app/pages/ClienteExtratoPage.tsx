import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { clientesService } from '@/services/clientes'
import { vendasService } from '@/services/vendas'
import { relatoriosService } from '@/services/relatorios'
import { useAuth } from '@/contexts/AuthContext'
import type { ClienteResponse, VendaResponse, ExtratoCliente } from '@/types'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Skeleton } from '@/app/components/ui/skeleton'
import { Separator } from '@/app/components/ui/separator'
import ClienteLivroRazao from '@/app/components/ClienteLivroRazao'
import { exportLedgerPdf, getLedgerPdfBlob, type LedgerMovimento, type LedgerEntidade } from '@/lib/pdf'
import { partilharArquivoOuTexto } from '@/lib/share'
import { ArrowLeft, FileDown, MessageCircle, Printer } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

function formatKz(v: number) {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    maximumFractionDigits: 0,
  }).format(v)
}

export default function ClienteExtratoPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [cliente, setCliente] = useState<ClienteResponse | null>(null)
  const [vendas, setVendas] = useState<VendaResponse[]>([])
  const [extrato, setExtrato] = useState<ExtratoCliente | null>(null)
  const [loading, setLoading] = useState(true)
  const [sharing, setSharing] = useState(false)
  // Os filtros de data ficam na própria URL — assim, ao abrir um documento e
  // voltar (botão "Voltar" reutiliza o histórico do browser), os filtros
  // aplicados aqui continuam preservados.
  const dataInicio = searchParams.get('inicio') ?? ''
  const dataFim = searchParams.get('fim') ?? ''

  function setDataInicio(valor: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (valor) next.set('inicio', valor); else next.delete('inicio')
      return next
    })
  }
  function setDataFim(valor: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (valor) next.set('fim', valor); else next.delete('fim')
      return next
    })
  }

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      clientesService.buscar(id),
      vendasService.listar().catch(() => []),
      relatoriosService.extratoCliente(id, {
        data_inicio: dataInicio ? new Date(dataInicio).toISOString() : undefined,
        data_fim: dataFim ? new Date(dataFim + 'T23:59:59').toISOString() : undefined,
      }),
    ])
      .then(([c, v, e]) => { setCliente(c); setVendas(v); setExtrato(e) })
      .catch((err) => toast.error(err instanceof Error ? err.message : t('common.loadError')))
      .finally(() => setLoading(false))
  }, [id, dataInicio, dataFim]) // eslint-disable-line react-hooks/exhaustive-deps

  const vendasCliente = vendas
    .filter((v) => v.cliente_id === id)
    .filter((v) => (!dataInicio || new Date(v.criado_em) >= new Date(dataInicio)) && (!dataFim || new Date(v.criado_em) <= new Date(dataFim + 'T23:59:59')))
    .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())

  const totalGasto = vendasCliente.reduce((s, v) => s + v.total_final, 0)

  // Constrói os movimentos do Livro Razão a partir do extrato já calculado
  // pela API (extrato.documentos): cada dívida (Factura) é um débito e cada
  // pagamento (Recibo) é um crédito. Puramente uma transformação de
  // apresentação — os valores vêm exatamente como a API já os calcula, nada
  // é recalculado aqui além do saldo acumulado exibido linha a linha.
  function buildMovimentos(): LedgerMovimento[] {
    return (extrato?.documentos ?? []).map((doc) => {
      const isFactura = doc.tipo === 'Factura'
      const codigo = doc.numero != null
        ? `${isFactura ? 'FT' : 'RC'}${String(doc.numero).padStart(3, '0')}`
        : doc.id.slice(0, 6).toUpperCase()
      return {
        data: doc.data,
        documento: codigo,
        tipo: isFactura ? 'Fatura' : 'Recebimento',
        descricao: doc.produto_nome ?? (isFactura ? 'Venda a crédito' : 'Pagamento de dívida'),
        debito: isFactura ? doc.valor : undefined,
        credito: isFactura ? undefined : Math.abs(doc.valor),
      }
    })
  }

  function buildEntidade(): LedgerEntidade {
    if (!cliente) return { nome: '' }
    return {
      nome: cliente.nome,
      codigo: cliente.id.slice(0, 8).toUpperCase(),
      nif: cliente.nif,
      telefone: cliente.telefone,
      email: cliente.email,
      morada: cliente.endereco,
      estado: (extrato?.total_devido ?? 0) > 0 ? 'Com saldo em aberto' : 'Regularizado',
      dataRegisto: cliente.criado_em,
    }
  }

  function buildPeriodoLabel(): string {
    if (!dataInicio && !dataFim) return 'Todo o histórico'
    const ini = dataInicio ? format(new Date(dataInicio), 'dd/MM/yyyy') : '—'
    const fim = dataFim ? format(new Date(dataFim), 'dd/MM/yyyy') : '—'
    return `${ini} a ${fim}`
  }

  function handleBaixarPdf() {
    if (!cliente) return
    exportLedgerPdf({
      titulo: 'EXTRATO / HISTÓRICO DO CLIENTE',
      entidadeLabel: 'Cliente',
      entidade: buildEntidade(),
      periodoLabel: buildPeriodoLabel(),
      saldoInicial: 0,
      movimentos: buildMovimentos(),
      utilizador: user?.nome,
      filename: `historico-${cliente.nome}`,
    })
  }

  function handleImprimir() {
    window.print()
  }

  async function handlePartilhar() {
    if (!cliente) return
    setSharing(true)
    try {
      const blob = await getLedgerPdfBlob({
        titulo: 'EXTRATO / HISTÓRICO DO CLIENTE',
        entidadeLabel: 'Cliente',
        entidade: buildEntidade(),
        periodoLabel: buildPeriodoLabel(),
        saldoInicial: 0,
        movimentos: buildMovimentos(),
        utilizador: user?.nome,
      })
      const file = new File([blob], `historico-${cliente.nome}.pdf`, { type: 'application/pdf' })
      const mensagem = [
        `*ELECTRO VENDOS* — ${t('reports.cardClientHistory')}`,
        `${t('common.client')}: ${cliente.nome}`,
        '',
        `${t('sales.title')}: ${vendasCliente.length}`,
        `${t('reports.totalSpent')}: ${formatKz(totalGasto)}`,
        extrato && extrato.total_devido > 0 ? `${t('reports.totalOwed')}: ${formatKz(extrato.total_devido)}` : '',
      ].filter(Boolean).join('\n')
      const resultado = await partilharArquivoOuTexto(file, mensagem, cliente.telefone)
      if (resultado === 'descarregado') {
        toast.info(t('suppliers.toasts.pdfDownloadedAttachManually'))
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.loadError'))
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/clientes')}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          {loading ? (
            <Skeleton className="h-7 w-48" />
          ) : (
            <h1 className="text-2xl font-bold tracking-tight">{cliente?.nome ?? t('clients.title')}</h1>
          )}
          <p className="text-muted-foreground text-sm">{t('reports.ledgerTitle')} — {t('reports.cardClientHistory')}</p>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : cliente ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs">{t('reports.startDate')} <span className="text-muted-foreground">({t('reports.emptyIsAllTime')})</span></Label>
              <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-36" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('reports.endDate')} <span className="text-muted-foreground">({t('reports.emptyIsAllTime')})</span></Label>
              <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-36" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" disabled={vendasCliente.length === 0} onClick={handleBaixarPdf}>
              <FileDown className="size-4" />
              {t('common.downloadPdf')}
            </Button>
            <Button variant="outline" className="gap-2" disabled={vendasCliente.length === 0} onClick={handleImprimir}>
              <Printer className="size-4" />
              {t('deliveryNotes.printOrDownload')}
            </Button>
            <Button
              variant="outline"
              className="gap-2 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
              disabled={vendasCliente.length === 0 || sharing}
              onClick={handlePartilhar}
            >
              <MessageCircle className="size-4" />
              {sharing ? t('reports.loading') : t('sales.shareWhatsapp')}
            </Button>
          </div>

          <Separator />

          <ClienteLivroRazao cliente={cliente} extrato={extrato} vendasCliente={vendasCliente} />
        </div>
      ) : null}
    </div>
  )
}
