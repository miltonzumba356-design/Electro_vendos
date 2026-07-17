import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { relatoriosService } from '@/services/relatorios'
import { clientesService } from '@/services/clientes'
import { vendasService } from '@/services/vendas'
import { produtosService } from '@/services/produtos'
import { metasService } from '@/services/metas'
import type {
  RelatorioVendasPeriodo,
  RelatorioClienteFiel,
  RelatorioClienteInativo,
  RelatorioProdutoVendido,
  RelatorioVendaCliente,
  ProdutoStockBaixo,
  ClienteResponse,
  VendaResponse,
  ExtratoCliente,
  RelatorioLucroProduto,
  RelatorioMetasProgresso,
  ProdutoResponse,
} from '@/types'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Badge } from '@/app/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { Combobox } from '@/app/components/ui/combobox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { TablePagination } from '@/app/components/ui/table-pagination'
import { usePagination } from '@/lib/usePagination'
import { exportTablePdf, type PdfColumn } from '@/lib/pdf'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table'
import { Skeleton } from '@/app/components/ui/skeleton'
import { AlertTriangle, FileDown, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

function DownloadPdfButton({
  onClick, disabled, t,
}: { onClick: () => void; disabled?: boolean; t: TFunction }) {
  return (
    <Button variant="outline" size="sm" className="gap-2" disabled={disabled} onClick={onClick}>
      <FileDown className="size-4" />
      {t('common.downloadPdf')}
    </Button>
  )
}

function formatKz(value: number) {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    maximumFractionDigits: 0,
  }).format(value)
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-muted/30 rounded-md p-3">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="font-semibold text-sm">{value}</p>
    </div>
  )
}

function PeriodoStats({ data, t }: { data: RelatorioVendasPeriodo; t: TFunction }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatCard label={t('reports.totalSales')}   value={data.total_vendas} />
        <StatCard label={t('reports.totalRevenue')} value={formatKz(data.total_receita)} />
        <StatCard label={t('reports.totalPending')} value={formatKz(data.total_pendente)} />
        <StatCard label={t('reports.netRevenue')}   value={formatKz(data.total_sem_iva)} />
        <StatCard label={t('reports.totalVat')}     value={formatKz(data.total_iva)} />
        <StatCard label={t('reports.discounts')}    value={formatKz(data.total_descontos)} />
        <StatCard label={t('reports.grossProfit')}  value={formatKz(data.lucro_bruto)} />
        <StatCard label={t('reports.avgTicket')}    value={formatKz(data.ticket_medio)} />
      </div>
      {data.produtos_mais_vendidos.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2 text-muted-foreground">{t('reports.topProducts')}</h4>
          <div className="rounded-md border bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('reports.colProduct')}</TableHead>
                  <TableHead className="text-right">{t('reports.soldQty')}</TableHead>
                  <TableHead className="text-right">{t('reports.totalIncome')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.produtos_mais_vendidos.map((p) => (
                  <TableRow key={p.produto_id}>
                    <TableCell className="font-medium">{p.produto_nome}</TableCell>
                    <TableCell className="text-right">{p.quantidade_vendida}</TableCell>
                    <TableCell className="text-right font-semibold">{formatKz(p.total_receita)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Vendas por período ─────────────────────────────────────── */
function VendasPeriodo({ t }: { t: TFunction }) {
  const [result, setResult] = useState<RelatorioVendasPeriodo | null>(null)
  const [loading, setLoading] = useState(false)
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')

  async function carregar(e?: React.FormEvent) {
    e?.preventDefault()
    setLoading(true)
    try {
      const data = await relatoriosService.vendasPeriodo(
        inicio ? new Date(inicio).toISOString() : undefined,
        fim ? new Date(fim + 'T23:59:59').toISOString() : undefined
      )
      setResult(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro')
    } finally { setLoading(false) }
  }

  useEffect(() => { carregar() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      <form onSubmit={carregar} className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label>{t('reports.startDate')} <span className="text-muted-foreground text-xs">({t('reports.emptyIsToday')})</span></Label>
          <Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>{t('reports.endDate')} <span className="text-muted-foreground text-xs">({t('reports.emptyIsToday')})</span></Label>
          <Input type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? t('reports.loading') : t('reports.consult')}
        </Button>
        {result && (
          <DownloadPdfButton
            t={t}
            onClick={() => exportTablePdf({
              title: t('reports.cardPeriod'),
              columns: [
                { header: t('reports.colProduct'), key: 'produto' },
                { header: t('reports.soldQty'), key: 'qtd', align: 'right' },
                { header: t('reports.totalIncome'), key: 'receita', align: 'right' },
              ],
              rows: result.produtos_mais_vendidos.map((p) => ({
                produto: p.produto_nome, qtd: p.quantidade_vendida, receita: formatKz(p.total_receita),
              })),
              totalsRow: [
                t('reports.totalSales'), String(result.total_vendas), formatKz(result.total_receita),
              ],
              filename: 'vendas-periodo',
            })}
          />
        )}
      </form>
      {loading && <Skeleton className="h-32 w-full" />}
      {result && <PeriodoStats data={result} t={t} />}
    </div>
  )
}

/* ── Clientes fiéis ─────────────────────────────────────────── */
function ClientesFieis({ t }: { t: TFunction }) {
  const [result, setResult] = useState<RelatorioClienteFiel[]>([])
  const [loading, setLoading] = useState(false)
  const [limite, setLimite] = useState('10')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await relatoriosService.clientesFieis(Number(limite))
      setResult(res)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro')
    } finally { setLoading(false) }
  }

  const nivelVariant = (nivel: string) => {
    if (nivel === 'OURO')  return 'default'
    if (nivel === 'PRATA') return 'secondary'
    return 'outline'
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="space-y-1">
          <Label>{t('reports.limit')}</Label>
          <Input type="number" value={limite} onChange={(e) => setLimite(e.target.value)} className="w-24" min="1" max="100" />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? t('reports.loading') : t('reports.consult')}
        </Button>
        {result.length > 0 && (
          <DownloadPdfButton
            t={t}
            onClick={() => exportTablePdf({
              title: t('reports.cardLoyal'),
              columns: [
                { header: t('reports.colClient'), key: 'cliente' },
                { header: t('reports.totalSales'), key: 'vendas', align: 'right' },
                { header: t('reports.totalSpent'), key: 'gasto', align: 'right' },
                { header: t('reports.avgPerSale'), key: 'media', align: 'right' },
                { header: t('reports.level'), key: 'nivel' },
                { header: t('reports.lastPurchase'), key: 'ultima' },
              ],
              rows: result.map((r) => ({
                cliente: r.cliente_nome, vendas: r.total_vendas, gasto: formatKz(r.total_gasto),
                media: formatKz(r.media_por_venda), nivel: r.nivel,
                ultima: r.ultima_compra ? format(new Date(r.ultima_compra), 'dd/MM/yyyy') : '—',
              })),
              filename: 'clientes-fieis',
            })}
          />
        )}
      </form>
      {loading && <Skeleton className="h-32 w-full" />}
      {result.length > 0 && (
        <div className="rounded-md border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('reports.rank')}</TableHead>
                <TableHead>{t('reports.colClient')}</TableHead>
                <TableHead className="text-right">{t('reports.totalSales')}</TableHead>
                <TableHead className="text-right">{t('reports.totalSpent')}</TableHead>
                <TableHead className="text-right">{t('reports.avgPerSale')}</TableHead>
                <TableHead>{t('reports.level')}</TableHead>
                <TableHead>{t('reports.lastPurchase')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.map((r, i) => (
                <TableRow key={r.cliente_id}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-medium">{r.cliente_nome}</TableCell>
                  <TableCell className="text-right">{r.total_vendas}</TableCell>
                  <TableCell className="text-right font-semibold">{formatKz(r.total_gasto)}</TableCell>
                  <TableCell className="text-right">{formatKz(r.media_por_venda)}</TableCell>
                  <TableCell>
                    <Badge variant={nivelVariant(r.nivel) as 'default' | 'secondary' | 'outline'}>
                      {r.nivel}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {r.ultima_compra ? format(new Date(r.ultima_compra), 'dd/MM/yyyy') : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

/* ── Clientes inativos ──────────────────────────────────────── */
function ClientesInativos({ t }: { t: TFunction }) {
  const [result, setResult] = useState<RelatorioClienteInativo[]>([])
  const [loading, setLoading] = useState(false)
  const [dias, setDias] = useState('90')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await relatoriosService.clientesInativos(Number(dias))
      setResult(res)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro')
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="space-y-1">
          <Label>{t('reports.daysSince')}</Label>
          <Input type="number" value={dias} onChange={(e) => setDias(e.target.value)} className="w-24" min="1" />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? t('reports.loading') : t('reports.consult')}
        </Button>
        {result.length > 0 && (
          <DownloadPdfButton
            t={t}
            onClick={() => exportTablePdf({
              title: t('reports.cardInactive'),
              columns: [
                { header: t('common.name'), key: 'nome' },
                { header: t('reports.colPhone'), key: 'telefone' },
                { header: t('reports.colEmail'), key: 'email' },
              ],
              rows: result.map((r) => ({ nome: r.nome, telefone: r.telefone ?? '—', email: r.email ?? '—' })),
              filename: 'clientes-inativos',
            })}
          />
        )}
      </form>
      {loading && <Skeleton className="h-32 w-full" />}
      {result.length > 0 && (
        <div className="rounded-md border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common.name')}</TableHead>
                <TableHead>{t('reports.colPhone')}</TableHead>
                <TableHead>{t('reports.colEmail')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.nome}</TableCell>
                  <TableCell>{r.telefone ?? '—'}</TableCell>
                  <TableCell>{r.email ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

/* ── Produtos mais vendidos ─────────────────────────────────── */
function ProdutosMaisVendidos({ t }: { t: TFunction }) {
  const [result, setResult] = useState<RelatorioProdutoVendido[]>([])
  const [loading, setLoading] = useState(false)
  const [limite, setLimite] = useState('10')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await relatoriosService.produtosMaisVendidos(Number(limite))
      setResult(res)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro')
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="space-y-1">
          <Label>{t('reports.limit')}</Label>
          <Input type="number" value={limite} onChange={(e) => setLimite(e.target.value)} className="w-24" min="1" max="100" />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? t('reports.loading') : t('reports.consult')}
        </Button>
        {result.length > 0 && (
          <DownloadPdfButton
            t={t}
            onClick={() => exportTablePdf({
              title: t('reports.cardBestSelling'),
              columns: [
                { header: t('reports.colProduct'), key: 'produto' },
                { header: t('reports.soldQty'), key: 'qtd', align: 'right' },
                { header: t('reports.totalIncome'), key: 'receita', align: 'right' },
              ],
              rows: result.map((r) => ({
                produto: r.produto_nome, qtd: r.quantidade_vendida, receita: formatKz(r.total_receita),
              })),
              filename: 'produtos-mais-vendidos',
            })}
          />
        )}
      </form>
      {loading && <Skeleton className="h-32 w-full" />}
      {result.length > 0 && (
        <div className="rounded-md border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('reports.rank')}</TableHead>
                <TableHead>{t('reports.colProduct')}</TableHead>
                <TableHead className="text-right">{t('reports.soldQty')}</TableHead>
                <TableHead className="text-right">{t('reports.totalIncome')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.map((r, i) => (
                <TableRow key={r.produto_id}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-medium">{r.produto_nome}</TableCell>
                  <TableCell className="text-right">{r.quantidade_vendida}</TableCell>
                  <TableCell className="text-right font-semibold">{formatKz(r.total_receita)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

/* ── Vendas por cliente ─────────────────────────────────────── */
function VendasPorCliente({ t }: { t: TFunction }) {
  const [result, setResult] = useState<RelatorioVendaCliente[]>([])
  const [loading, setLoading] = useState(false)
  const [limite, setLimite] = useState('10')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await relatoriosService.vendasPorCliente(Number(limite))
      setResult(res)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro')
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="space-y-1">
          <Label>{t('reports.limit')}</Label>
          <Input type="number" value={limite} onChange={(e) => setLimite(e.target.value)} className="w-24" min="1" max="100" />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? t('reports.loading') : t('reports.consult')}
        </Button>
        {result.length > 0 && (
          <DownloadPdfButton
            t={t}
            onClick={() => exportTablePdf({
              title: t('reports.cardByClient'),
              columns: [
                { header: t('reports.colClient'), key: 'cliente' },
                { header: t('reports.totalPurchases'), key: 'compras', align: 'right' },
                { header: t('reports.totalSpent'), key: 'gasto', align: 'right' },
                { header: t('reports.avgPerSale'), key: 'media', align: 'right' },
              ],
              rows: result.map((r) => ({
                cliente: r.cliente_nome, compras: r.total_compras, gasto: formatKz(r.total_gasto),
                media: formatKz(r.media_por_venda),
              })),
              filename: 'vendas-por-cliente',
            })}
          />
        )}
      </form>
      {loading && <Skeleton className="h-32 w-full" />}
      {result.length > 0 && (
        <div className="rounded-md border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('reports.rank')}</TableHead>
                <TableHead>{t('reports.colClient')}</TableHead>
                <TableHead className="text-right">{t('reports.totalPurchases')}</TableHead>
                <TableHead className="text-right">{t('reports.totalSpent')}</TableHead>
                <TableHead className="text-right">{t('reports.avgPerSale')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.map((r, i) => (
                <TableRow key={r.cliente_id}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-medium">{r.cliente_nome}</TableCell>
                  <TableCell className="text-right">{r.total_compras}</TableCell>
                  <TableCell className="text-right font-semibold">{formatKz(r.total_gasto)}</TableCell>
                  <TableCell className="text-right">{formatKz(r.media_por_venda)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

/* ── Histórico do cliente ───────────────────────────────────── */
function HistoricoClienteTab({ t }: { t: TFunction }) {
  const [clientes, setClientes] = useState<ClienteResponse[]>([])
  const [vendas, setVendas] = useState<VendaResponse[]>([])
  const [clienteId, setClienteId] = useState('')
  const [extrato, setExtrato] = useState<ExtratoCliente | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      clientesService.listar().catch(() => []),
      vendasService.listar().catch(() => []),
    ]).then(([c, v]) => { setClientes(c); setVendas(v) })
  }, [])

  const clienteSelecionado = clientes.find((c) => c.id === clienteId) ?? null
  const vendasCliente = vendas
    .filter((v) => v.cliente_id === clienteId)
    .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())
  const { page, pageItems, totalPages, setPage, resetPage } = usePagination(vendasCliente)

  async function handleSelecionar(id: string) {
    setClienteId(id)
    resetPage()
    if (!id) { setExtrato(null); return }
    setLoading(true)
    try {
      const res = await relatoriosService.extratoCliente(id)
      setExtrato(res)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const clienteOptions = clientes.map((c) => ({ value: c.id, label: c.nome }))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-2 max-w-lg flex-1 min-w-[220px]">
          <Label>{t('common.client')}</Label>
          <Combobox
            options={clienteOptions}
            value={clienteId}
            onValueChange={handleSelecionar}
            placeholder={t('reports.selectClientPlaceholder')}
            searchPlaceholder={t('common.search')}
            emptyText={t('clients.empty')}
          />
        </div>
        {clienteSelecionado && (
          <DownloadPdfButton
            t={t}
            onClick={() => exportTablePdf({
              title: t('reports.cardClientHistory'),
              subtitle: clienteSelecionado.nome,
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
              filename: `historico-${clienteSelecionado.nome}`,
            })}
          />
        )}
      </div>

      {loading && <Skeleton className="h-32 w-full" />}

      {clienteSelecionado && !loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label={t('common.phone')} value={clienteSelecionado.telefone ?? '—'} />
            <StatCard label={t('common.email')} value={clienteSelecionado.email ?? '—'} />
            <StatCard label={t('clients.fieldNif')} value={clienteSelecionado.nif ?? '—'} />
            <StatCard label={t('reports.clientSince')} value={format(new Date(clienteSelecionado.criado_em), 'dd/MM/yyyy')} />
          </div>
          {clienteSelecionado.endereco && (
            <p className="text-sm text-muted-foreground">{t('common.address')}: {clienteSelecionado.endereco}</p>
          )}

          {extrato && extrato.total_devido > 0 && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3">
              <p className="text-xs text-muted-foreground mb-1">{t('reports.totalOwed')}</p>
              <p className="font-semibold text-destructive">{formatKz(extrato.total_devido)}</p>
            </div>
          )}

          <div>
            <h4 className="text-sm font-semibold mb-2 text-muted-foreground">{t('reports.sectionSales')}</h4>
            {vendasCliente.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('reports.emptySales')}</p>
            ) : (
              <>
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
                      {pageItems.map((v) => (
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
                <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </>
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
                      <TableRow key={d.divida_id}>
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
      )}
    </div>
  )
}

/* ── Stock crítico ──────────────────────────────────────────── */
function StockCritico({ t }: { t: TFunction }) {
  const [result, setResult] = useState<ProdutoStockBaixo[]>([])
  const [loading, setLoading] = useState(false)

  async function handleConsultar() {
    setLoading(true)
    try {
      const res = await relatoriosService.stockBaixo()
      setResult(res)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro')
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleConsultar} disabled={loading}>
          {loading ? t('reports.loading') : t('reports.consultCritical')}
        </Button>
        {result.length > 0 && (
          <DownloadPdfButton
            t={t}
            onClick={() => exportTablePdf({
              title: t('reports.cardCritical'),
              columns: [
                { header: t('reports.colProduct'), key: 'produto' },
                { header: t('reports.currentStock'), key: 'atual', align: 'right' },
                { header: t('reports.minStock'), key: 'minimo', align: 'right' },
                { header: t('reports.missing'), key: 'falta', align: 'right' },
              ],
              rows: result.map((p) => ({
                produto: p.nome, atual: p.stock_atual, minimo: p.stock_minimo, falta: p.diferenca,
              })),
              filename: 'stock-critico',
            })}
          />
        )}
      </div>
      {loading && <Skeleton className="h-32 w-full" />}
      {result.length > 0 && (
        <div className="rounded-md border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('reports.colProduct')}</TableHead>
                <TableHead className="text-right">{t('reports.currentStock')}</TableHead>
                <TableHead className="text-right">{t('reports.minStock')}</TableHead>
                <TableHead className="text-right">{t('reports.missing')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="size-3.5 text-destructive" />
                      {p.nome}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-destructive font-medium">{p.stock_atual}</TableCell>
                  <TableCell className="text-right">{p.stock_minimo}</TableCell>
                  <TableCell className="text-right font-semibold text-destructive">{p.diferenca}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

/* ── Lucro por produto ──────────────────────────────────────── */
function LucroPorProduto({ t }: { t: TFunction }) {
  const [result, setResult] = useState<RelatorioLucroProduto[]>([])
  const [loading, setLoading] = useState(false)
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')
  const [nome, setNome] = useState('')
  const [limite, setLimite] = useState('10')

  async function carregar(e?: React.FormEvent) {
    e?.preventDefault()
    setLoading(true)
    try {
      const res = await relatoriosService.lucroPorProduto({
        data_inicio: inicio ? new Date(inicio).toISOString() : undefined,
        data_fim: fim ? new Date(fim + 'T23:59:59').toISOString() : undefined,
        nome: nome || undefined,
        limite: Number(limite),
      })
      setResult(res)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.loadError'))
    } finally { setLoading(false) }
  }

  useEffect(() => { carregar() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const columns: PdfColumn[] = [
    { header: t('reports.colProduct'), key: 'produto' },
    { header: t('reports.soldQty'), key: 'qtd', align: 'right' },
    { header: t('reports.totalIncome'), key: 'receita', align: 'right' },
    { header: t('reports.totalCost'), key: 'custo', align: 'right' },
    { header: t('reports.profit'), key: 'lucro', align: 'right' },
    { header: t('reports.margin'), key: 'margem', align: 'right' },
  ]

  return (
    <div className="space-y-4">
      <form onSubmit={carregar} className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label>{t('reports.startDate')} <span className="text-muted-foreground text-xs">({t('reports.emptyIsAllTime')})</span></Label>
          <Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>{t('reports.endDate')} <span className="text-muted-foreground text-xs">({t('reports.emptyIsAllTime')})</span></Label>
          <Input type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>{t('reports.searchProduct')}</Label>
          <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder={t('reports.searchProductPlaceholder')} className="w-44" />
        </div>
        <div className="space-y-1">
          <Label>{t('reports.limit')}</Label>
          <Input type="number" value={limite} onChange={(e) => setLimite(e.target.value)} className="w-24" min="1" max="100" />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? t('reports.loading') : t('reports.consult')}
        </Button>
        {result.length > 0 && (
          <DownloadPdfButton
            t={t}
            onClick={() => exportTablePdf({
              title: t('reports.cardProfit'),
              columns,
              rows: result.map((r) => ({
                produto: r.produto_nome, qtd: r.quantidade_vendida, receita: formatKz(r.total_receita),
                custo: formatKz(r.total_custo), lucro: formatKz(r.lucro), margem: `${r.margem_percentual.toFixed(1)}%`,
              })),
              filename: 'lucro-por-produto',
            })}
          />
        )}
      </form>
      {loading && <Skeleton className="h-32 w-full" />}
      {result.length > 0 && (
        <div className="rounded-md border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('reports.colProduct')}</TableHead>
                <TableHead className="text-right">{t('reports.soldQty')}</TableHead>
                <TableHead className="text-right">{t('reports.totalIncome')}</TableHead>
                <TableHead className="text-right">{t('reports.totalCost')}</TableHead>
                <TableHead className="text-right">{t('reports.profit')}</TableHead>
                <TableHead className="text-right">{t('reports.margin')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.map((r) => (
                <TableRow key={r.produto_id}>
                  <TableCell className="font-medium">{r.produto_nome}</TableCell>
                  <TableCell className="text-right">{r.quantidade_vendida}</TableCell>
                  <TableCell className="text-right">{formatKz(r.total_receita)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{formatKz(r.total_custo)}</TableCell>
                  <TableCell className="text-right font-semibold text-green-600">{formatKz(r.lucro)}</TableCell>
                  <TableCell className="text-right">{r.margem_percentual.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

/* ── Metas de receita e lucro ───────────────────────────────── */
// O backend não tem parâmetro "periodo" — só data_inicio/data_fim. O
// seletor de mês (YYYY-MM) é convertido aqui para o intervalo do mês inteiro.
function periodoParaDatas(periodo: string): { data_inicio?: string; data_fim?: string } {
  if (!periodo) return {}
  const [anoStr, mesStr] = periodo.split('-')
  const ano = Number(anoStr)
  const mes = Number(mesStr)
  const inicio = new Date(Date.UTC(ano, mes - 1, 1, 0, 0, 0))
  const fim = new Date(Date.UTC(ano, mes, 0, 23, 59, 59))
  return { data_inicio: inicio.toISOString(), data_fim: fim.toISOString() }
}

/* ── Nova meta dialog ───────────────────────────────────────── */
function NovaMetaDialog({
  onSuccess, onClose, t,
}: {
  onSuccess: () => void
  onClose: () => void
  t: TFunction
}) {
  const [produtos, setProdutos] = useState<ProdutoResponse[]>([])
  const [produtoId, setProdutoId] = useState('')
  const [periodo, setPeriodo] = useState(() => new Date().toISOString().slice(0, 7))
  const [metaReceita, setMetaReceita] = useState('')
  const [metaLucro, setMetaLucro] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    produtosService.listar().then(setProdutos).catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!produtoId) { toast.error(t('reports.toasts.selectProduct')); return }
    const receita = Number(metaReceita)
    const lucro = Number(metaLucro)
    if (!receita || receita <= 0 || !lucro || lucro <= 0) {
      toast.error(t('reports.toasts.invalidGoal'))
      return
    }
    const { data_inicio, data_fim } = periodoParaDatas(periodo)
    if (!data_inicio || !data_fim) return
    setSaving(true)
    try {
      await metasService.criar({ produto_id: produtoId, data_inicio, data_fim, meta_receita: receita, meta_lucro: lucro })
      toast.success(t('reports.toasts.goalSaved'))
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('reports.toasts.goalSaveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('reports.newGoalTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>{t('reports.colProduct')} *</Label>
            <Combobox
              options={produtos.map((p) => ({ value: p.id, label: p.nome }))}
              value={produtoId}
              onValueChange={setProdutoId}
              placeholder={t('installments.selectProduct')}
              searchPlaceholder={t('common.search')}
              emptyText={t('products.empty')}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('reports.period')} *</Label>
            <Input type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="meta-receita">{t('reports.goalRevenue')} *</Label>
              <Input
                id="meta-receita"
                type="number"
                min="0.01"
                step="0.01"
                value={metaReceita}
                onChange={(e) => setMetaReceita(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meta-lucro">{t('reports.goalProfit')} *</Label>
              <Input
                id="meta-lucro"
                type="number"
                min="0.01"
                step="0.01"
                value={metaLucro}
                onChange={(e) => setMetaLucro(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function MetasProgresso({ t }: { t: TFunction }) {
  const [result, setResult] = useState<RelatorioMetasProgresso | null>(null)
  const [loading, setLoading] = useState(false)
  const [periodo, setPeriodo] = useState(() => new Date().toISOString().slice(0, 7))
  const [nome, setNome] = useState('')
  const [limite, setLimite] = useState('')
  const [novaMetaOpen, setNovaMetaOpen] = useState(false)

  async function carregar(e?: React.FormEvent) {
    e?.preventDefault()
    setLoading(true)
    try {
      const { data_inicio, data_fim } = periodoParaDatas(periodo)
      const res = await relatoriosService.metasProgresso({
        data_inicio,
        data_fim,
        nome: nome || undefined,
        limite: limite ? Number(limite) : undefined,
      })
      setResult(res)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.loadError'))
    } finally { setLoading(false) }
  }

  useEffect(() => { carregar() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      <form onSubmit={carregar} className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label>{t('reports.period')}</Label>
          <Input type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>{t('reports.searchProduct')}</Label>
          <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder={t('reports.searchProductPlaceholder')} className="w-44" />
        </div>
        <div className="space-y-1">
          <Label>{t('reports.limit')}</Label>
          <Input type="number" value={limite} onChange={(e) => setLimite(e.target.value)} className="w-24" min="1" placeholder="—" />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? t('reports.loading') : t('reports.consult')}
        </Button>
        <Button type="button" variant="outline" className="gap-2" onClick={() => setNovaMetaOpen(true)}>
          <Plus className="size-4" />
          {t('reports.newGoal')}
        </Button>
        {result && result.produtos.length > 0 && (
          <DownloadPdfButton
            t={t}
            onClick={() => exportTablePdf({
              title: t('reports.cardGoals'),
              subtitle: periodo,
              columns: [
                { header: t('reports.colProduct'), key: 'produto' },
                { header: t('reports.goalRevenue'), key: 'metaReceita', align: 'right' },
                { header: t('reports.revenueRaised'), key: 'receita', align: 'right' },
                { header: t('reports.goalProfit'), key: 'metaLucro', align: 'right' },
                { header: t('reports.profitRealized'), key: 'lucro', align: 'right' },
                { header: t('reports.pctRevenue'), key: 'pctReceita', align: 'right' },
                { header: t('reports.pctProfit'), key: 'pctLucro', align: 'right' },
              ],
              rows: result.produtos.map((p) => ({
                produto: p.produto_nome, metaReceita: formatKz(p.meta_receita), receita: formatKz(p.receita_arrecadada),
                metaLucro: formatKz(p.meta_lucro), lucro: formatKz(p.lucro_realizado),
                pctReceita: `${p.percentual_meta_receita.toFixed(0)}%`, pctLucro: `${p.percentual_meta_lucro.toFixed(0)}%`,
              })),
              filename: `metas-${periodo}`,
            })}
          />
        )}
      </form>

      {novaMetaOpen && (
        <NovaMetaDialog
          onSuccess={() => { setNovaMetaOpen(false); carregar() }}
          onClose={() => setNovaMetaOpen(false)}
          t={t}
        />
      )}

      {loading && <Skeleton className="h-32 w-full" />}

      {result && !loading && (
        <div className="space-y-4">
          {result.totais && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label={t('reports.goalRevenue')} value={formatKz(result.totais.meta_receita_total)} />
              <StatCard label={t('reports.revenueRaised')} value={formatKz(result.totais.receita_arrecadada_total)} />
              <StatCard label={t('reports.goalProfit')} value={formatKz(result.totais.meta_lucro_total)} />
              <StatCard label={t('reports.profitRealized')} value={formatKz(result.totais.lucro_realizado_total)} />
              <StatCard label={t('reports.pctRevenue')} value={`${result.totais.percentual_meta_receita.toFixed(0)}%`} />
              <StatCard label={t('reports.pctProfit')} value={`${result.totais.percentual_meta_lucro.toFixed(0)}%`} />
              <StatCard label={t('reports.quantityProducts')} value={result.totais.quantidade_produtos} />
              <StatCard label={t('reports.unitsSold')} value={result.totais.unidades_vendidas_total} />
            </div>
          )}

          {result.produtos.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('reports.emptyGoals')}</p>
          ) : (
            <div className="rounded-md border bg-card overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('reports.colProduct')}</TableHead>
                    <TableHead className="text-right">{t('reports.goalRevenue')}</TableHead>
                    <TableHead className="text-right">{t('reports.revenueRaised')}</TableHead>
                    <TableHead className="text-right">{t('reports.pctRevenue')}</TableHead>
                    <TableHead className="text-right">{t('reports.goalProfit')}</TableHead>
                    <TableHead className="text-right">{t('reports.profitRealized')}</TableHead>
                    <TableHead className="text-right">{t('reports.pctProfit')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.produtos.map((p) => (
                    <TableRow key={p.produto_id}>
                      <TableCell className="font-medium">{p.produto_nome}</TableCell>
                      <TableCell className="text-right">{formatKz(p.meta_receita)}</TableCell>
                      <TableCell className="text-right">{formatKz(p.receita_arrecadada)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={p.percentual_meta_receita >= 100 ? 'default' : 'secondary'}>
                          {p.percentual_meta_receita.toFixed(0)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatKz(p.meta_lucro)}</TableCell>
                      <TableCell className="text-right font-semibold text-green-600">{formatKz(p.lucro_realizado)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={p.percentual_meta_lucro >= 100 ? 'default' : 'secondary'}>
                          {p.percentual_meta_lucro.toFixed(0)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Main Page ──────────────────────────────────────────────── */
export default function RelatoriosPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('reports.title')}</h1>
        <p className="text-muted-foreground text-sm">{t('reports.subtitle')}</p>
      </div>

      <Tabs defaultValue="vendas-periodo">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="vendas-periodo">{t('reports.tabPeriod')}</TabsTrigger>
          <TabsTrigger value="vendas-por-cliente">{t('reports.tabByClient')}</TabsTrigger>
          <TabsTrigger value="historico-cliente">{t('reports.tabClientHistory')}</TabsTrigger>
          <TabsTrigger value="clientes-fieis">{t('reports.tabLoyal')}</TabsTrigger>
          <TabsTrigger value="clientes-inativos">{t('reports.tabInactive')}</TabsTrigger>
          <TabsTrigger value="mais-vendidos">{t('reports.tabBestSelling')}</TabsTrigger>
          <TabsTrigger value="lucro">{t('reports.tabProfit')}</TabsTrigger>
          <TabsTrigger value="metas">{t('reports.tabGoals')}</TabsTrigger>
          <TabsTrigger value="stock-critico">{t('reports.tabCritical')}</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="vendas-periodo">
            <Card><CardHeader><CardTitle className="text-base">{t('reports.cardPeriod')}</CardTitle></CardHeader>
              <CardContent><VendasPeriodo t={t} /></CardContent></Card>
          </TabsContent>
          <TabsContent value="vendas-por-cliente">
            <Card><CardHeader><CardTitle className="text-base">{t('reports.cardByClient')}</CardTitle></CardHeader>
              <CardContent><VendasPorCliente t={t} /></CardContent></Card>
          </TabsContent>
          <TabsContent value="historico-cliente">
            <Card><CardHeader><CardTitle className="text-base">{t('reports.cardClientHistory')}</CardTitle></CardHeader>
              <CardContent><HistoricoClienteTab t={t} /></CardContent></Card>
          </TabsContent>
          <TabsContent value="clientes-fieis">
            <Card><CardHeader><CardTitle className="text-base">{t('reports.cardLoyal')}</CardTitle></CardHeader>
              <CardContent><ClientesFieis t={t} /></CardContent></Card>
          </TabsContent>
          <TabsContent value="clientes-inativos">
            <Card><CardHeader><CardTitle className="text-base">{t('reports.cardInactive')}</CardTitle></CardHeader>
              <CardContent><ClientesInativos t={t} /></CardContent></Card>
          </TabsContent>
          <TabsContent value="mais-vendidos">
            <Card><CardHeader><CardTitle className="text-base">{t('reports.cardBestSelling')}</CardTitle></CardHeader>
              <CardContent><ProdutosMaisVendidos t={t} /></CardContent></Card>
          </TabsContent>
          <TabsContent value="lucro">
            <Card><CardHeader><CardTitle className="text-base">{t('reports.cardProfit')}</CardTitle></CardHeader>
              <CardContent><LucroPorProduto t={t} /></CardContent></Card>
          </TabsContent>
          <TabsContent value="metas">
            <Card><CardHeader><CardTitle className="text-base">{t('reports.cardGoals')}</CardTitle></CardHeader>
              <CardContent><MetasProgresso t={t} /></CardContent></Card>
          </TabsContent>
          <TabsContent value="stock-critico">
            <Card><CardHeader><CardTitle className="text-base">{t('reports.cardCritical')}</CardTitle></CardHeader>
              <CardContent><StockCritico t={t} /></CardContent></Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
