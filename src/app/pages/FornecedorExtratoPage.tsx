import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { fornecedoresService } from '@/services/fornecedores'
import type { FornecedorResponse, DividaFornecedorResponse } from '@/types'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table'
import { Skeleton } from '@/app/components/ui/skeleton'
import { Separator } from '@/app/components/ui/separator'
import { exportTablePdf, getTablePdfBlob, type PdfColumn } from '@/lib/pdf'
import { montarMensagemExtratoFornecedor } from '@/lib/recibo'
import { partilharArquivoOuTexto } from '@/lib/share'
import { ArrowLeft, FileDown, MessageCircle } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

function formatKz(v: number) {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    maximumFractionDigits: 0,
  }).format(v)
}

function formatMoeda(v: number, moeda: string = 'AOA') {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: moeda,
    maximumFractionDigits: moeda === 'AOA' ? 0 : 2,
  }).format(v)
}

function MiniStat({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="bg-muted/30 rounded-md p-3">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`font-semibold text-sm ${danger ? 'text-destructive' : ''}`}>{value}</p>
    </div>
  )
}

export default function FornecedorExtratoPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [fornecedor, setFornecedor] = useState<FornecedorResponse | null>(null)
  const [dividas, setDividas] = useState<DividaFornecedorResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      fornecedoresService.buscar(id),
      fornecedoresService.dividas.listar({ fornecedor_id: id }),
    ])
      .then(([f, d]) => { setFornecedor(f); setDividas(d) })
      .catch((err) => toast.error(err instanceof Error ? err.message : t('common.loadError')))
      .finally(() => setLoading(false))
  }, [id])

  const totalGasto = dividas.reduce((s, d) => s + d.valor_total, 0)
  const totalPago = dividas.reduce((s, d) => s + d.valor_pago, 0)
  const totalDevido = dividas.reduce((s, d) => s + d.saldo, 0)

  const columns: PdfColumn[] = [
    { header: t('suppliers.colProduct'), key: 'produto' },
    { header: t('suppliers.colQuantity'), key: 'quantidade', align: 'right' },
    { header: t('common.total'), key: 'total', align: 'right' },
    { header: t('common.paid'), key: 'pago', align: 'right' },
    { header: t('common.balance'), key: 'saldo', align: 'right' },
    { header: t('suppliers.fieldCurrency'), key: 'moeda' },
    { header: t('common.status'), key: 'status' },
    { header: t('suppliers.colDate'), key: 'data' },
  ]

  function buildRows() {
    return dividas.map((d) => ({
      produto: d.produto_nome ?? '—', quantidade: d.quantidade ?? '—', total: formatMoeda(d.valor_total, d.moeda ?? 'AOA'),
      pago: formatMoeda(d.valor_pago, d.moeda ?? 'AOA'), saldo: formatMoeda(d.saldo, d.moeda ?? 'AOA'),
      moeda: d.moeda ?? 'AOA', status: d.status,
      data: format(new Date(d.criado_em), 'dd/MM/yyyy'),
    }))
  }

  function handleBaixarPdf() {
    if (!fornecedor) return
    exportTablePdf({
      title: t('suppliers.extratoTitle'),
      subtitle: fornecedor.nome,
      columns,
      rows: buildRows(),
      filename: `fornecedor-${fornecedor.nome}`,
    })
  }

  async function handlePartilhar() {
    if (!fornecedor) return
    setSharing(true)
    try {
      const blob = getTablePdfBlob({ title: t('suppliers.extratoTitle'), subtitle: fornecedor.nome, columns, rows: buildRows() })
      const file = new File([blob], `extrato-${fornecedor.nome}.pdf`, { type: 'application/pdf' })
      const mensagem = montarMensagemExtratoFornecedor(
        fornecedor, dividas, { gasto: totalGasto, pago: totalPago, devido: totalDevido }
      )
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
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground space-x-4">
            {fornecedor.telefone && <span>{t('common.phone')}: {fornecedor.telefone}</span>}
            {fornecedor.nif && <span>{t('suppliers.fieldNif')}: {fornecedor.nif}</span>}
            {fornecedor.endereco && <span>{t('common.address')}: {fornecedor.endereco}</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MiniStat label={t('suppliers.totalSpent')} value={formatKz(totalGasto)} />
            <MiniStat label={t('common.paid')} value={formatKz(totalPago)} />
            <MiniStat label={t('suppliers.totalOwed')} value={formatKz(totalDevido)} danger={totalDevido > 0} />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" disabled={dividas.length === 0} onClick={handleBaixarPdf}>
              <FileDown className="size-4" />
              {t('common.downloadPdf')}
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

          {dividas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">{t('suppliers.debtEmpty')}</p>
          ) : (
            <div className="rounded-md border bg-card overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('suppliers.colProduct')}</TableHead>
                    <TableHead className="text-right">{t('suppliers.colQuantity')}</TableHead>
                    <TableHead className="text-right">{t('common.total')}</TableHead>
                    <TableHead className="text-right">{t('common.paid')}</TableHead>
                    <TableHead className="text-right">{t('common.balance')}</TableHead>
                    <TableHead>{t('suppliers.fieldCurrency')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead>{t('suppliers.colDate')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dividas.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.produto_nome ?? '—'}</TableCell>
                      <TableCell className="text-right">{d.quantidade ?? '—'}</TableCell>
                      <TableCell className="text-right">{formatMoeda(d.valor_total, d.moeda ?? 'AOA')}</TableCell>
                      <TableCell className="text-right text-green-600">{formatMoeda(d.valor_pago, d.moeda ?? 'AOA')}</TableCell>
                      <TableCell className="text-right font-medium text-destructive">{formatMoeda(d.saldo, d.moeda ?? 'AOA')}</TableCell>
                      <TableCell><Badge variant="outline">{d.moeda ?? 'AOA'}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={d.status === 'PAGA' ? 'default' : 'destructive'}>{d.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(d.criado_em), 'dd/MM/yyyy')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
