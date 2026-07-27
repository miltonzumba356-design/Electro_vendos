import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { fornecedoresService } from '@/services/fornecedores'
import type { FornecedorResponse, ExtratoFornecedor } from '@/types'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
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
import { exportMultiSectionPdf, getMultiSectionPdfBlob, exportTablePdf, type PdfSection } from '@/lib/pdf'
import { partilharArquivoOuTexto } from '@/lib/share'
import { ArrowLeft, FileDown, MessageCircle, Printer, History } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

// Os valores de compras/dívidas a fornecedores ficam sempre em Kz — a API
// não converte moeda, só regista em que moeda cada pagamento foi feito.
function formatKz(v: number) {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    maximumFractionDigits: 0,
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
  const [extrato, setExtrato] = useState<ExtratoFornecedor | null>(null)
  const [loading, setLoading] = useState(true)
  const [sharing, setSharing] = useState(false)
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      fornecedoresService.buscar(id),
      fornecedoresService.extrato(id, {
        data_inicio: dataInicio ? new Date(dataInicio).toISOString() : undefined,
        data_fim: dataFim ? new Date(dataFim + 'T23:59:59').toISOString() : undefined,
      }),
    ])
      .then(([f, e]) => { setFornecedor(f); setExtrato(e) })
      .catch((err) => toast.error(err instanceof Error ? err.message : t('common.loadError')))
      .finally(() => setLoading(false))
  }, [id, dataInicio, dataFim]) // eslint-disable-line react-hooks/exhaustive-deps

  const documentos = extrato?.documentos ?? []
  const facturas = documentos.filter((d) => d.tipo === 'Factura')
  const recibos = documentos.filter((d) => d.tipo === 'Recibo')
  const documentosOrdenados = [...documentos].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

  const totalComprado = facturas.reduce((s, d) => s + d.valor, 0)
  const totalPago = recibos.reduce((s, d) => s + Math.abs(d.valor), 0)
  const totalDevido = extrato?.total_devido ?? 0

  // Agrupa as facturas (compras) por produto — cada produto vira a sua
  // própria secção no PDF, com o custo de cada compra e o total pago ao
  // fornecedor por aquele produto.
  function buildProdutoSections(): PdfSection[] {
    const porProduto = new Map<string, { data: string; numero: number | string; valor: number }[]>()
    for (const d of facturas) {
      const nome = d.produto_nome ?? t('reports.colProduct')
      if (!porProduto.has(nome)) porProduto.set(nome, [])
      porProduto.get(nome)!.push({
        data: format(new Date(d.data), 'dd/MM/yyyy'),
        numero: d.numero ?? '—',
        valor: d.valor,
      })
    }
    return [...porProduto.entries()].map(([produto, linhas]) => ({
      heading: produto,
      columns: [
        { header: t('invoices.colNumber'), key: 'numero' },
        { header: t('common.date'), key: 'data' },
        { header: t('reports.totalCost'), key: 'valor', align: 'right' as const },
      ],
      rows: linhas.map((l) => ({ numero: l.numero, data: l.data, valor: formatKz(l.valor) })),
      totalsRow: ['', t('common.total'), formatKz(linhas.reduce((s, l) => s + l.valor, 0))],
    }))
  }

  function buildSections(): PdfSection[] {
    return [
      {
        heading: t('suppliers.sectionPurchases'),
        columns: [
          { header: t('invoices.colNumber'), key: 'numero' },
          { header: t('suppliers.colProduct'), key: 'produto' },
          { header: t('common.date'), key: 'data' },
          { header: t('common.total'), key: 'valor', align: 'right' },
        ],
        rows: facturas.map((d) => ({
          numero: d.numero ?? '—', produto: d.produto_nome ?? '—',
          data: format(new Date(d.data), 'dd/MM/yyyy'), valor: formatKz(d.valor),
        })),
        totalsRow: ['', '', t('common.total'), formatKz(totalComprado)],
        emptyLabel: t('suppliers.emptyPurchases'),
      },
      {
        heading: t('suppliers.sectionPayments'),
        columns: [
          { header: t('invoices.colNumber'), key: 'numero' },
          { header: t('suppliers.colProduct'), key: 'produto' },
          { header: t('common.date'), key: 'data' },
          { header: t('suppliers.paymentCurrency'), key: 'moeda' },
          { header: t('common.total'), key: 'valor', align: 'right' },
        ],
        rows: recibos.map((d) => ({
          numero: d.numero ?? '—', produto: d.produto_nome ?? '—',
          data: format(new Date(d.data), 'dd/MM/yyyy HH:mm'), moeda: d.moeda ?? '—',
          valor: formatKz(Math.abs(d.valor)),
        })),
        totalsRow: ['', '', '', t('common.total'), formatKz(totalPago)],
        emptyLabel: t('suppliers.emptyPayments'),
      },
      ...buildProdutoSections(),
    ]
  }

  function buildInfoLines(): string[] {
    if (!fornecedor) return []
    return [
      `${t('common.phone')}: ${fornecedor.telefone ?? '—'}   ${t('suppliers.fieldNif')}: ${fornecedor.nif ?? '—'}`,
      `${t('suppliers.totalSpent')}: ${formatKz(totalComprado)}   ${t('common.paid')}: ${formatKz(totalPago)}   ${t('suppliers.totalOwed')}: ${formatKz(totalDevido)}`,
    ]
  }

  function handleBaixarPdf() {
    if (!fornecedor) return
    exportMultiSectionPdf({
      title: t('suppliers.extratoTitle'),
      subtitle: fornecedor.nome,
      infoLines: buildInfoLines(),
      sections: buildSections(),
      filename: `fornecedor-${fornecedor.nome}`,
      qrUrl: `${window.location.origin}/fornecedores/${fornecedor.id}`,
    })
  }

  function handleBaixarHistoricoPagamentos() {
    if (!fornecedor) return
    exportTablePdf({
      title: t('installments.paymentHistoryTitle'),
      subtitle: fornecedor.nome,
      columns: [
        { header: t('invoices.colNumber'), key: 'numero' },
        { header: t('suppliers.colProduct'), key: 'produto' },
        { header: t('common.date'), key: 'data' },
        { header: t('common.total'), key: 'valor', align: 'right' },
        { header: t('suppliers.paymentCurrency'), key: 'moeda' },
      ],
      rows: recibos.map((d) => ({
        numero: d.numero ?? '—', produto: d.produto_nome ?? '—',
        data: format(new Date(d.data), 'dd/MM/yyyy HH:mm'),
        valor: formatKz(Math.abs(d.valor)), moeda: d.moeda ?? '—',
      })),
      filename: `historico-pagamentos-${fornecedor.nome}`,
      qrUrl: `${window.location.origin}/fornecedores/${fornecedor.id}`,
    })
  }

  function handleImprimir() {
    window.print()
  }

  async function handlePartilhar() {
    if (!fornecedor) return
    setSharing(true)
    try {
      const blob = await getMultiSectionPdfBlob({
        title: t('suppliers.extratoTitle'),
        subtitle: fornecedor.nome,
        infoLines: buildInfoLines(),
        sections: buildSections(),
        qrUrl: `${window.location.origin}/fornecedores/${fornecedor.id}`,
      })
      const file = new File([blob], `extrato-${fornecedor.nome}.pdf`, { type: 'application/pdf' })
      const mensagem = [
        `*ELECTRO VENDOS* — ${t('suppliers.extratoTitle')}`,
        `${t('suppliers.colSupplier')}: ${fornecedor.nome}`,
        '',
        `${t('suppliers.totalSpent')}: ${formatKz(totalComprado)}`,
        `${t('common.paid')}: ${formatKz(totalPago)}`,
        totalDevido > 0 ? `${t('suppliers.totalOwed')}: ${formatKz(totalDevido)}` : '',
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
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground space-x-4">
            {fornecedor.telefone && <span>{t('common.phone')}: {fornecedor.telefone}</span>}
            {fornecedor.nif && <span>{t('suppliers.fieldNif')}: {fornecedor.nif}</span>}
            {fornecedor.endereco && <span>{t('common.address')}: {fornecedor.endereco}</span>}
          </div>

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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MiniStat label={t('suppliers.totalSpent')} value={formatKz(totalComprado)} />
            <MiniStat label={t('common.paid')} value={formatKz(totalPago)} />
            <MiniStat label={t('suppliers.totalOwed')} value={formatKz(totalDevido)} danger={totalDevido > 0} />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" disabled={documentos.length === 0} onClick={handleBaixarPdf}>
              <FileDown className="size-4" />
              {t('common.downloadPdf')}
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              disabled={recibos.length === 0}
              onClick={handleBaixarHistoricoPagamentos}
            >
              <FileDown className="size-4" />
              {t('installments.downloadPaymentHistory')}
            </Button>
            <Button variant="outline" className="gap-2" disabled={documentos.length === 0} onClick={handleImprimir}>
              <Printer className="size-4" />
              {t('deliveryNotes.printOrDownload')}
            </Button>
            <Button
              variant="outline"
              className="gap-2 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
              disabled={documentos.length === 0 || sharing}
              onClick={handlePartilhar}
            >
              <MessageCircle className="size-4" />
              {sharing ? t('reports.loading') : t('sales.shareWhatsapp')}
            </Button>
          </div>

          <Separator />

          {documentos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">{t('suppliers.debtEmpty')}</p>
          ) : (
            <div className="rounded-md border bg-card overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('invoices.colNumber')}</TableHead>
                    <TableHead>{t('reports.colType')}</TableHead>
                    <TableHead>{t('suppliers.colProduct')}</TableHead>
                    <TableHead>{t('suppliers.colDate')}</TableHead>
                    <TableHead>{t('suppliers.paymentCurrency')}</TableHead>
                    <TableHead className="text-right">{t('common.total')}</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documentosOrdenados.map((d) => (
                    <TableRow
                      key={d.id}
                      className={d.tipo === 'Factura' ? 'cursor-pointer hover:bg-muted/40' : ''}
                      onClick={() => { if (d.tipo === 'Factura') navigate(`/fornecedores/dividas/${d.id}`) }}
                    >
                      <TableCell className="text-muted-foreground text-sm">{d.numero ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={d.tipo === 'Factura' ? 'text-destructive' : 'text-green-600'}>
                          {d.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{d.produto_nome ?? '—'}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(d.data), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>
                        {d.moeda ? <Badge variant="outline">{d.moeda}</Badge> : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${d.tipo === 'Factura' ? 'text-destructive' : 'text-green-600'}`}>
                        {formatKz(Math.abs(d.valor))}
                      </TableCell>
                      <TableCell>
                        {d.tipo === 'Factura' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title={t('installments.paymentHistoryTitle')}
                            onClick={(e) => { e.stopPropagation(); navigate(`/fornecedores/dividas/${d.id}`) }}
                          >
                            <History className="size-4 text-muted-foreground" />
                          </Button>
                        )}
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
