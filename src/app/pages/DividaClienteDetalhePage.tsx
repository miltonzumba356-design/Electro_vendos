import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { dividasService } from '@/services/dividas'
import { clientesService } from '@/services/clientes'
import type { DividaResponse } from '@/types'
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

function MiniStat({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="bg-muted/30 rounded-md p-3">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`font-semibold text-sm ${danger ? 'text-destructive' : ''}`}>{value}</p>
    </div>
  )
}

export default function DividaClienteDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [divida, setDivida] = useState<DividaResponse | null>(null)
  const [telefone, setTelefone] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    dividasService.buscar(id)
      .then((d) => {
        setDivida(d)
        return clientesService.buscar(d.cliente_id).catch(() => null)
      })
      .then((c) => setTelefone(c?.telefone ?? null))
      .catch((err) => toast.error(err instanceof Error ? err.message : t('common.loadError')))
      .finally(() => setLoading(false))
  }, [id])

  const columns: PdfColumn[] = [
    { header: t('common.date'), key: 'data' },
    { header: t('common.total'), key: 'valor', align: 'right' },
    { header: t('installments.colPaidToDate'), key: 'totalPago', align: 'right' },
    { header: t('common.balance'), key: 'saldo', align: 'right' },
    { header: t('suppliers.paymentCurrency'), key: 'moeda' },
  ]

  // Ordena por data e vai descontando do valor_total — cada pagamento mostra
  // o total já pago e o saldo restante naquele momento, não só o valor isolado.
  function pagamentosComSaldo() {
    if (!divida) return []
    const ordenados = [...divida.pagamentos].sort(
      (a, b) => new Date(a.data_pagamento).getTime() - new Date(b.data_pagamento).getTime()
    )
    let acumulado = 0
    return ordenados.map((p) => {
      acumulado += p.valor
      return { ...p, totalPago: acumulado, saldo: Math.max(divida.valor_total - acumulado, 0) }
    })
  }

  function buildRows() {
    return pagamentosComSaldo().map((p) => ({
      data: format(new Date(p.data_pagamento), 'dd/MM/yyyy HH:mm'),
      valor: formatKz(p.valor), totalPago: formatKz(p.totalPago), saldo: formatKz(p.saldo), moeda: p.moeda,
    }))
  }

  function buildInfoLines(): string[] {
    if (!divida) return []
    return [
      `${t('common.client')}: ${divida.cliente_nome ?? '—'}`,
      `${t('reports.colProduct')}: ${divida.produto_nome ?? '—'}`,
      `${t('common.total')}: ${formatKz(divida.valor_total)}   ${t('common.paid')}: ${formatKz(divida.valor_pago)}   ${t('common.balance')}: ${formatKz(divida.saldo)}`,
    ]
  }

  function handleBaixarPdf() {
    if (!divida) return
    exportTablePdf({
      title: t('installments.paymentHistoryTitle'),
      subtitle: divida.produto_nome ?? undefined,
      infoLines: buildInfoLines(),
      columns,
      rows: buildRows(),
      filename: `divida-${divida.id.slice(0, 8)}`,
      qrUrl: `${window.location.origin}/dividas/${divida.id}`,
    })
  }

  function handleImprimir() {
    window.print()
  }

  async function handlePartilhar() {
    if (!divida) return
    setSharing(true)
    try {
      const blob = await getTablePdfBlob({
        title: t('installments.paymentHistoryTitle'),
        subtitle: divida.produto_nome ?? undefined,
        infoLines: buildInfoLines(),
        columns,
        rows: buildRows(),
        qrUrl: `${window.location.origin}/dividas/${divida.id}`,
      })
      const file = new File([blob], `divida-${divida.id.slice(0, 8)}.pdf`, { type: 'application/pdf' })
      const mensagem = [
        `*ELECTRO VENDOS* — ${t('installments.paymentHistoryTitle')}`,
        `${t('common.client')}: ${divida.cliente_nome ?? '—'}`,
        `${t('reports.colProduct')}: ${divida.produto_nome ?? '—'}`,
        '',
        ...pagamentosComSaldo().map((p) =>
          `• ${format(new Date(p.data_pagamento), 'dd/MM/yyyy')} — ${formatKz(p.valor)} (${p.moeda}) — ${t('common.balance')}: ${formatKz(p.saldo)}`
        ),
        '',
        `${t('common.total')}: ${formatKz(divida.valor_total)}`,
        `${t('common.paid')}: ${formatKz(divida.valor_pago)}`,
        `${t('common.balance')}: ${formatKz(divida.saldo)}`,
      ].join('\n')
      const resultado = await partilharArquivoOuTexto(file, mensagem, telefone)
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
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          {loading ? (
            <Skeleton className="h-7 w-48" />
          ) : (
            <h1 className="text-2xl font-bold tracking-tight">{divida?.produto_nome ?? t('sales.debtProduct')}</h1>
          )}
          <p className="text-muted-foreground text-sm">{t('installments.paymentHistoryTitle')}</p>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : divida ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>{t('common.client')}: {divida.cliente_nome ?? '—'}</span>
            <Badge variant={divida.status === 'PAGA' ? 'default' : 'destructive'}>{divida.status}</Badge>
            <span>{format(new Date(divida.criado_em), 'dd/MM/yyyy')}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MiniStat label={t('common.total')} value={formatKz(divida.valor_total)} />
            <MiniStat label={t('common.paid')} value={formatKz(divida.valor_pago)} />
            <MiniStat label={t('common.balance')} value={formatKz(divida.saldo)} danger={divida.saldo > 0} />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" disabled={divida.pagamentos.length === 0} onClick={handleBaixarPdf}>
              <FileDown className="size-4" />
              {t('common.downloadPdf')}
            </Button>
            <Button variant="outline" className="gap-2" disabled={divida.pagamentos.length === 0} onClick={handleImprimir}>
              <Printer className="size-4" />
              {t('deliveryNotes.printOrDownload')}
            </Button>
            <Button
              variant="outline"
              className="gap-2 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
              disabled={divida.pagamentos.length === 0 || sharing}
              onClick={handlePartilhar}
            >
              <MessageCircle className="size-4" />
              {sharing ? t('reports.loading') : t('sales.shareWhatsapp')}
            </Button>
          </div>

          <Separator />

          {divida.pagamentos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">{t('installments.paymentHistoryEmpty')}</p>
          ) : (
            <div className="rounded-md border bg-card overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('common.date')}</TableHead>
                    <TableHead className="text-right">{t('common.total')}</TableHead>
                    <TableHead className="text-right">{t('installments.colPaidToDate')}</TableHead>
                    <TableHead className="text-right">{t('common.balance')}</TableHead>
                    <TableHead>{t('suppliers.paymentCurrency')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagamentosComSaldo().map((p, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(p.data_pagamento), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatKz(p.valor)}</TableCell>
                      <TableCell className="text-right text-green-600">{formatKz(p.totalPago)}</TableCell>
                      <TableCell className="text-right font-medium text-destructive">{formatKz(p.saldo)}</TableCell>
                      <TableCell><Badge variant="outline">{p.moeda}</Badge></TableCell>
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
