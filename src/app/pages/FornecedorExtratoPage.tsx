import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { fornecedoresService } from '@/services/fornecedores'
import { useAuth } from '@/contexts/AuthContext'
import type { FornecedorResponse, DividaFornecedorResponse } from '@/types'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Skeleton } from '@/app/components/ui/skeleton'
import { Separator } from '@/app/components/ui/separator'
import FornecedorLivroRazao from '@/app/components/FornecedorLivroRazao'
import { exportLedgerPdf, getLedgerPdfBlob, formatPeriodoPdf, type LedgerMovimento, type LedgerEntidade } from '@/lib/pdf'
import { partilharArquivoOuTexto } from '@/lib/share'
import { ArrowLeft, FileDown, MessageCircle, Printer } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

export default function FornecedorExtratoPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user } = useAuth()

  const [fornecedor, setFornecedor] = useState<FornecedorResponse | null>(null)
  const [dividas, setDividas] = useState<DividaFornecedorResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [sharing, setSharing] = useState(false)
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      fornecedoresService.buscar(id),
      fornecedoresService.dividas.listar({
        fornecedor_id: id,
        data_inicio: dataInicio ? new Date(dataInicio).toISOString() : undefined,
        data_fim: dataFim ? new Date(dataFim + 'T23:59:59').toISOString() : undefined,
        limit: 200,
      }),
    ])
      .then(([f, d]) => { setFornecedor(f); setDividas(d) })
      .catch((err) => toast.error(err instanceof Error ? err.message : t('common.loadError')))
      .finally(() => setLoading(false))
  }, [id, dataInicio, dataFim]) // eslint-disable-line react-hooks/exhaustive-deps

  const totalDevido = dividas.reduce((s, d) => s + d.saldo, 0)

  // Constrói os movimentos do Livro Razão (PDF) a partir das dívidas já
  // carregadas: cada dívida (Factura) é um débito e cada pagamento (Recibo)
  // é um crédito — mesma transformação de apresentação usada no extrato do
  // cliente (ver ClienteExtratoPage.buildMovimentos).
  function buildMovimentos(): LedgerMovimento[] {
    const movimentos: LedgerMovimento[] = []
    for (const d of dividas) {
      const codigo = d.numero != null ? `FT${String(d.numero).padStart(4, '0')}` : d.id.slice(0, 6).toUpperCase()
      movimentos.push({
        data: d.criado_em,
        documento: codigo,
        tipo: 'Fatura',
        descricao: d.produto_nome ?? 'Compra a crédito',
        debito: d.valor_total,
      })
      for (const p of d.pagamentos) {
        movimentos.push({
          data: p.data_pagamento,
          documento: p.numero != null ? `RC${String(p.numero).padStart(4, '0')}` : `${d.id.slice(0, 4).toUpperCase()}-P`,
          tipo: 'Recibo',
          descricao: d.produto_nome ? `Pagamento de dívida — ${d.produto_nome}` : 'Pagamento de dívida',
          credito: p.valor,
        })
      }
    }
    return movimentos
  }

  function buildEntidade(): LedgerEntidade {
    if (!fornecedor) return { nome: '' }
    return {
      nome: fornecedor.nome,
      codigo: fornecedor.id.slice(0, 8).toUpperCase(),
      nif: fornecedor.nif,
      telefone: fornecedor.telefone,
      morada: fornecedor.endereco,
      estado: totalDevido > 0 ? 'Com saldo em aberto' : 'Regularizado',
      dataRegisto: fornecedor.criado_em,
    }
  }

  function buildPeriodoLabel(): string {
    return formatPeriodoPdf(dataInicio, dataFim, t('reports.periodAllTime'))
  }

  function handleBaixarPdf() {
    if (!fornecedor) return
    exportLedgerPdf({
      titulo: 'EXTRATO / HISTÓRICO DO FORNECEDOR',
      entidadeLabel: 'Fornecedor',
      entidade: buildEntidade(),
      periodoLabel: buildPeriodoLabel(),
      saldoInicial: 0,
      movimentos: buildMovimentos(),
      utilizador: user?.nome,
      filename: `fornecedor-${fornecedor.nome}`,
    })
  }

  function handleImprimir() {
    window.print()
  }

  async function handlePartilhar() {
    if (!fornecedor) return
    setSharing(true)
    try {
      const blob = await getLedgerPdfBlob({
        titulo: 'EXTRATO / HISTÓRICO DO FORNECEDOR',
        entidadeLabel: 'Fornecedor',
        entidade: buildEntidade(),
        periodoLabel: buildPeriodoLabel(),
        saldoInicial: 0,
        movimentos: buildMovimentos(),
        utilizador: user?.nome,
      })
      const file = new File([blob], `fornecedor-${fornecedor.nome}.pdf`, { type: 'application/pdf' })
      const totalComprado = dividas.reduce((s, d) => s + d.valor_total, 0)
      const totalPago = dividas.reduce((s, d) => s + d.valor_pago, 0)
      const mensagem = [
        `*ELECTRO VENDOS* — ${t('suppliers.extratoTitle')}`,
        `${t('suppliers.colSupplier')}: ${fornecedor.nome}`,
        '',
        `${t('suppliers.totalSpent')}: ${new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(totalComprado)}`,
        `${t('common.paid')}: ${new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(totalPago)}`,
        totalDevido > 0 ? `${t('suppliers.totalOwed')}: ${new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(totalDevido)}` : '',
      ].filter(Boolean).join('\n')
      const resultado = await partilharArquivoOuTexto(file, mensagem, fornecedor.telefone)
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
        <Button variant="ghost" size="icon" onClick={() => navigate('/fornecedores')}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          {loading ? (
            <Skeleton className="h-7 w-48" />
          ) : (
            <h1 className="text-2xl font-bold tracking-tight">{fornecedor?.nome ?? t('suppliers.title')}</h1>
          )}
          <p className="text-muted-foreground text-sm">{t('suppliers.extratoTitle')}</p>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : fornecedor ? (
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
            <Button variant="outline" className="gap-2" disabled={dividas.length === 0} onClick={handleBaixarPdf}>
              <FileDown className="size-4" />
              {t('common.downloadPdf')}
            </Button>
            <Button variant="outline" className="gap-2" disabled={dividas.length === 0} onClick={handleImprimir}>
              <Printer className="size-4" />
              {t('deliveryNotes.printOrDownload')}
            </Button>
            <Button
              variant="outline"
              className="gap-2 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
              disabled={dividas.length === 0 || sharing}
              onClick={handlePartilhar}
            >
              <MessageCircle className="size-4" />
              {sharing ? t('reports.loading') : t('sales.shareWhatsapp')}
            </Button>
          </div>

          <Separator />

          <FornecedorLivroRazao fornecedor={fornecedor} dividas={dividas} />
        </div>
      ) : null}
    </div>
  )
}
