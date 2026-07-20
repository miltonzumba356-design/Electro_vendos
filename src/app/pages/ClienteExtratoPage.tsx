import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { clientesService } from '@/services/clientes'
import { vendasService } from '@/services/vendas'
import { relatoriosService } from '@/services/relatorios'
import type { ClienteResponse, VendaResponse, ExtratoCliente } from '@/types'
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

export default function ClienteExtratoPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [cliente, setCliente] = useState<ClienteResponse | null>(null)
  const [vendas, setVendas] = useState<VendaResponse[]>([])
  const [extrato, setExtrato] = useState<ExtratoCliente | null>(null)
  const [loading, setLoading] = useState(true)
  const [sharing, setSharing] = useState(false)
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

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

  function handleBaixarPdf() {
    if (!cliente) return
    exportTablePdf({
      title: t('reports.cardClientHistory'),
      subtitle: cliente.nome,
      columns: [
        { header: t('common.date'), key: 'data' },
        { header: t('sales.colItems'), key: 'itens', align: 'right' },
        { header: t('common.total'), key: 'total', align: 'right' },
        { header: t('reports.colType'), key: 'tipo' },
      ],
      rows: vendasCliente.map((v) => ({
        data: format(new Date(v.criado_em), 'dd/MM/yyyy'), itens: v.itens.length,
        total: formatKz(v.total_final),
        tipo: v.credito ? (v.credito_pago ? t('sales.creditPaid') : t('sales.creditPending')) : t('sales.cash'),
      })),
      filename: `historico-${cliente.nome}`,
      qrUrl: `${window.location.origin}/clientes/${cliente.id}`,
    })
  }

  function handleImprimir() {
    window.print()
  }

  async function handlePartilhar() {
    if (!cliente) return
    setSharing(true)
    try {
      const columns: PdfColumn[] = [
        { header: t('common.date'), key: 'data' },
        { header: t('sales.colItems'), key: 'itens', align: 'right' },
        { header: t('common.total'), key: 'total', align: 'right' },
        { header: t('reports.colType'), key: 'tipo' },
      ]
      const blob = await getTablePdfBlob({
        title: t('reports.cardClientHistory'),
        subtitle: cliente.nome,
        columns,
        rows: vendasCliente.map((v) => ({
          data: format(new Date(v.criado_em), 'dd/MM/yyyy'), itens: v.itens.length,
          total: formatKz(v.total_final),
          tipo: v.credito ? (v.credito_pago ? t('sales.creditPaid') : t('sales.creditPending')) : t('sales.cash'),
        })),
        qrUrl: `${window.location.origin}/clientes/${cliente.id}`,
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
          <p className="text-muted-foreground text-sm">{t('reports.cardClientHistory')}</p>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : cliente ? (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground space-x-4">
            {cliente.telefone && <span>{t('common.phone')}: {cliente.telefone}</span>}
            {cliente.email && <span>{t('common.email')}: {cliente.email}</span>}
            {cliente.nif && <span>{t('clients.fieldNif')}: {cliente.nif}</span>}
            {cliente.endereco && <span>{t('common.address')}: {cliente.endereco}</span>}
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
            <MiniStat label={t('sales.title')} value={String(vendasCliente.length)} />
            <MiniStat label={t('reports.totalSpent')} value={formatKz(totalGasto)} />
            <MiniStat label={t('reports.totalOwed')} value={formatKz(extrato?.total_devido ?? 0)} danger={(extrato?.total_devido ?? 0) > 0} />
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

          <div>
            <h4 className="text-sm font-semibold mb-2 text-muted-foreground">{t('reports.sectionSales')}</h4>
            {vendasCliente.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('reports.emptySales')}</p>
            ) : (
              <div className="rounded-md border bg-card overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('common.date')}</TableHead>
                      <TableHead className="text-right">{t('sales.colItems')}</TableHead>
                      <TableHead className="text-right">{t('common.total')}</TableHead>
                      <TableHead>{t('reports.colType')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendasCliente.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(v.criado_em), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">{v.itens.length}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">{formatKz(v.total_final)}</TableCell>
                        <TableCell>
                          {v.credito ? (
                            <Badge variant={v.credito_pago ? 'default' : 'destructive'}>
                              {v.credito_pago ? t('sales.creditPaid') : t('sales.creditPending')}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">{t('sales.cash')}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2 text-muted-foreground">{t('reports.sectionCreditDebts')}</h4>
            {!extrato || extrato.dividas.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('reports.emptyDebts')}</p>
            ) : (
              <div className="rounded-md border bg-card overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('reports.colProduct')}</TableHead>
                      <TableHead>{t('common.date')}</TableHead>
                      <TableHead className="text-right">{t('common.total')}</TableHead>
                      <TableHead className="text-right">{t('common.paid')}</TableHead>
                      <TableHead className="text-right">{t('common.balance')}</TableHead>
                      <TableHead>{t('common.status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {extrato.dividas.map((d) => (
                      <TableRow
                        key={d.divida_id}
                        className="cursor-pointer hover:bg-muted/40"
                        onClick={() => navigate(`/dividas/${d.divida_id}`)}
                      >
                        <TableCell className="font-medium">{d.produto_nome ?? '—'}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(d.data_compra), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="text-right">{formatKz(d.valor_total)}</TableCell>
                        <TableCell className="text-right text-green-600">{formatKz(d.valor_pago)}</TableCell>
                        <TableCell className="text-right font-medium text-destructive">{formatKz(d.saldo)}</TableCell>
                        <TableCell>
                          <Badge variant={d.status === 'PAGA' ? 'default' : 'destructive'}>{d.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2 text-muted-foreground">{t('reports.sectionInstallments')}</h4>
            {!extrato || extrato.prestacoes.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('reports.emptyInstallments')}</p>
            ) : (
              <div className="rounded-md border bg-card overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('reports.colProduct')}</TableHead>
                      <TableHead>{t('common.date')}</TableHead>
                      <TableHead className="text-right">{t('common.total')}</TableHead>
                      <TableHead className="text-right">{t('common.paid')}</TableHead>
                      <TableHead className="text-right">{t('common.balance')}</TableHead>
                      <TableHead>{t('common.status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {extrato.prestacoes.map((p) => (
                      <TableRow key={p.prestacao_id}>
                        <TableCell className="font-medium">{p.produto_nome ?? '—'}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(p.data_compra), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="text-right">{formatKz(p.valor_total)}</TableCell>
                        <TableCell className="text-right text-green-600">{formatKz(p.valor_pago)}</TableCell>
                        <TableCell className="text-right font-medium text-destructive">{formatKz(p.saldo)}</TableCell>
                        <TableCell>
                          <Badge variant={p.situacao === 'PAGO' ? 'default' : 'secondary'}>{p.situacao}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
