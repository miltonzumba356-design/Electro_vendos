import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { relatoriosService } from '@/services/relatorios'
import { clientesService } from '@/services/clientes'
import { vendasService } from '@/services/vendas'
import { produtosService } from '@/services/produtos'
import { metasService } from '@/services/metas'
import { dividasService } from '@/services/dividas'
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
import { exportTablePdf, exportLedgerPdf, formatPeriodoPdf, type PdfColumn, type LedgerMovimento, type LedgerEntidade } from '@/lib/pdf'
import { GOLDENMARK_LOGO_DATA_URL } from '@/assets/goldenmarkLogo'
import { useAuth } from '@/contexts/AuthContext'
import ClienteLivroRazao from '@/app/components/ClienteLivroRazao'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table'
import { Skeleton } from '@/app/components/ui/skeleton'
import { AlertTriangle, FileDown, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

// Proporção real do logo da Goldenmark (1125×365 px) — diferente do
// vendos-logo.png padrão, por isso é preciso informar aqui para não distorcer.
const GOLDENMARK_LOGO_ASPECT = 365 / 1125

function DownloadPdfButton({
  onClick, disabled, label, t,
}: { onClick: () => void; disabled?: boolean; label?: string; t: TFunction }) {
  return (
    <Button variant="outline" size="sm" className="gap-2" disabled={disabled} onClick={onClick}>
      <FileDown className="size-4" />
      {label ?? t('common.downloadPdf')}
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
              infoLines: [`${t('reports.period')}: ${formatPeriodoPdf(inicio, fim, t('reports.periodToday'))}`],
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

// Um cliente por linha, com o total ainda em aberto somado de todas as suas
// dívidas — a API não tem um endpoint dedicado para isto, por isso agregamos
// aqui a partir de GET /dividas?status=DIVIDA (a mesma lista que já alimenta
// a aba "Dívidas" de Vendas).
interface ClienteDividaAgregada {
  cliente_id: string
  cliente_nome: string
  quantidade_dividas: number
  total_devido: number
}

/* ── Clientes com dívida ────────────────────────────────────── */
function ClientesComDivida({ t }: { t: TFunction }) {
  const navigate = useNavigate()
  const [result, setResult] = useState<ClienteDividaAgregada[]>([])
  const [loading, setLoading] = useState(true)

  async function carregar() {
    setLoading(true)
    try {
      const dividas = await dividasService.listar({ status: 'DIVIDA' })
      const porCliente = new Map<string, ClienteDividaAgregada>()
      for (const d of dividas) {
        if (d.saldo <= 0) continue
        const atual = porCliente.get(d.cliente_id) ?? {
          cliente_id: d.cliente_id,
          cliente_nome: d.cliente_nome ?? '—',
          quantidade_dividas: 0,
          total_devido: 0,
        }
        atual.quantidade_dividas += 1
        atual.total_devido += d.saldo
        porCliente.set(d.cliente_id, atual)
      }
      setResult(Array.from(porCliente.values()).sort((a, b) => b.total_devido - a.total_devido))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.loadError'))
    } finally { setLoading(false) }
  }

  useEffect(() => { carregar() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const totalGeral = result.reduce((s, r) => s + r.total_devido, 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {t('reports.debtClientsCount', { count: result.length })}
          {result.length > 0 && ` — ${t('reports.totalOwed')}: ${formatKz(totalGeral)}`}
        </p>
        {result.length > 0 && (
          <DownloadPdfButton
            t={t}
            onClick={() => exportTablePdf({
              title: t('reports.cardDebtClients'),
              columns: [
                { header: t('reports.colClient'), key: 'cliente' },
                { header: t('reports.debtClientsCountCol'), key: 'quantidade', align: 'right' },
                { header: t('reports.totalOwed'), key: 'total', align: 'right' },
              ],
              rows: result.map((r) => ({
                cliente: r.cliente_nome, quantidade: r.quantidade_dividas, total: formatKz(r.total_devido),
              })),
              filename: 'clientes-com-divida',
            })}
          />
        )}
      </div>
      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : result.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">{t('reports.debtClientsEmpty')}</p>
      ) : (
        <div className="rounded-md border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('reports.colClient')}</TableHead>
                <TableHead className="text-right">{t('reports.debtClientsCountCol')}</TableHead>
                <TableHead className="text-right">{t('reports.totalOwed')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.map((r) => (
                <TableRow
                  key={r.cliente_id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => navigate(`/clientes/${r.cliente_id}`)}
                >
                  <TableCell className="font-medium">{r.cliente_nome}</TableCell>
                  <TableCell className="text-right">{r.quantidade_dividas}</TableCell>
                  <TableCell className="text-right font-semibold text-destructive">{formatKz(r.total_devido)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
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
  const { user } = useAuth()
  const [clientes, setClientes] = useState<ClienteResponse[]>([])
  const [vendas, setVendas] = useState<VendaResponse[]>([])
  const [clienteId, setClienteId] = useState('')
  const [extrato, setExtrato] = useState<ExtratoCliente | null>(null)
  const [loading, setLoading] = useState(false)
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [numeroFiltro, setNumeroFiltro] = useState('')

  useEffect(() => {
    Promise.all([
      clientesService.listar().catch(() => []),
      vendasService.listar().catch(() => []),
    ]).then(([c, v]) => { setClientes(c); setVendas(v) })
  }, [])

  const clienteSelecionado = clientes.find((c) => c.id === clienteId) ?? null
  const vendasCliente = vendas
    .filter((v) => v.cliente_id === clienteId)
    .filter((v) => (!dataInicio || new Date(v.criado_em) >= new Date(dataInicio)) && (!dataFim || new Date(v.criado_em) <= new Date(dataFim + 'T23:59:59')))
    .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())

  async function carregarExtrato(id: string) {
    if (!id) { setExtrato(null); return }
    setLoading(true)
    try {
      const res = await relatoriosService.extratoCliente(id, {
        data_inicio: dataInicio ? new Date(dataInicio).toISOString() : undefined,
        data_fim: dataFim ? new Date(dataFim + 'T23:59:59').toISOString() : undefined,
        numero: numeroFiltro ? Number(numeroFiltro) : undefined,
      })
      setExtrato(res)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.loadError'))
    } finally {
      setLoading(false)
    }
  }

  function handleSelecionar(id: string) {
    setClienteId(id)
    carregarExtrato(id)
  }

  useEffect(() => {
    if (clienteId) carregarExtrato(clienteId)
  }, [dataInicio, dataFim, numeroFiltro]) // eslint-disable-line react-hooks/exhaustive-deps

  const clienteOptions = clientes.map((c) => ({ value: c.id, label: c.nome }))

  // Constrói os movimentos do Livro Razão a partir do extrato já calculado
  // pela API (extrato.documentos): cada dívida (Factura) é um débito e cada
  // pagamento (Recibo) é um crédito. Puramente uma transformação de
  // apresentação — os valores vêm exatamente como a API já os calcula.
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
    if (!clienteSelecionado) return { nome: '' }
    return {
      nome: clienteSelecionado.nome,
      codigo: clienteSelecionado.id.slice(0, 8).toUpperCase(),
      nif: clienteSelecionado.nif,
      telefone: clienteSelecionado.telefone,
      email: clienteSelecionado.email,
      morada: clienteSelecionado.endereco,
      estado: (extrato?.total_devido ?? 0) > 0 ? 'Com saldo em aberto' : 'Regularizado',
      dataRegisto: clienteSelecionado.criado_em,
    }
  }

  function buildPeriodoLabel(): string {
    if (!dataInicio && !dataFim) return 'Todo o histórico'
    const ini = dataInicio ? format(new Date(dataInicio), 'dd/MM/yyyy') : '—'
    const fim = dataFim ? format(new Date(dataFim), 'dd/MM/yyyy') : '—'
    return `${ini} a ${fim}`
  }

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
        <div className="space-y-1">
          <Label className="text-xs">{t('reports.startDate')} <span className="text-muted-foreground">({t('reports.emptyIsAllTime')})</span></Label>
          <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-36" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t('reports.endDate')} <span className="text-muted-foreground">({t('reports.emptyIsAllTime')})</span></Label>
          <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-36" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t('reports.searchByNumber')}</Label>
          <Input
            placeholder={t('reports.searchByNumberPlaceholder')}
            value={numeroFiltro}
            onChange={(e) => setNumeroFiltro(e.target.value)}
            className="w-32"
            inputMode="numeric"
          />
        </div>
        {clienteSelecionado && (
          <DownloadPdfButton
            t={t}
            onClick={() => exportLedgerPdf({
              titulo: 'EXTRATO / HISTÓRICO DO CLIENTE',
              entidadeLabel: 'Cliente',
              entidade: buildEntidade(),
              periodoLabel: buildPeriodoLabel(),
              saldoInicial: 0,
              movimentos: buildMovimentos(),
              utilizador: user?.nome,
              filename: `historico-${clienteSelecionado.nome}`,
              logoDataUrl: GOLDENMARK_LOGO_DATA_URL,
              logoAspect: GOLDENMARK_LOGO_ASPECT,
              logoFormat: 'JPEG',
            })}
          />
        )}
        {clienteSelecionado && extrato && extrato.dividas.some((d) => d.pagamentos.length > 0) && (
          <DownloadPdfButton
            t={t}
            label={t('installments.downloadPaymentHistory')}
            onClick={() => exportTablePdf({
              title: t('installments.paymentHistoryTitle'),
              subtitle: clienteSelecionado.nome,
              infoLines: [`${t('reports.period')}: ${buildPeriodoLabel()}`],
              columns: [
                { header: t('reports.colProduct'), key: 'produto' },
                { header: t('common.date'), key: 'data' },
                { header: t('common.total'), key: 'valor', align: 'right' },
                { header: t('suppliers.paymentCurrency'), key: 'moeda' },
              ],
              rows: extrato.dividas.flatMap((d) => d.pagamentos.map((p) => ({
                produto: d.produto_nome ?? '—',
                data: format(new Date(p.data_pagamento), 'dd/MM/yyyy HH:mm'),
                valor: formatKz(p.valor), moeda: p.moeda,
              }))),
              filename: `historico-pagamentos-${clienteSelecionado.nome}`,
            })}
          />
        )}
      </div>

      {loading && <Skeleton className="h-32 w-full" />}

      {clienteSelecionado && !loading && (
        <ClienteLivroRazao cliente={clienteSelecionado} extrato={extrato} vendasCliente={vendasCliente} />
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

  // Totais agregados de todos os produtos devolvidos pela pesquisa atual —
  // o backend só devolve o lucro por produto individualmente, então o
  // "lucro total" é sempre calculado aqui, no cliente, a partir da lista.
  const totais = result.reduce(
    (acc, r) => ({
      quantidade: acc.quantidade + r.quantidade_vendida,
      receita: acc.receita + r.total_receita,
      custo: acc.custo + r.total_custo,
      lucro: acc.lucro + r.lucro,
    }),
    { quantidade: 0, receita: 0, custo: 0, lucro: 0 }
  )
  const margemMedia = totais.receita > 0 ? (totais.lucro / totais.receita) * 100 : 0

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
              infoLines: [`${t('reports.period')}: ${formatPeriodoPdf(inicio, fim, t('reports.periodAllTime'))}`],
              columns,
              rows: result.map((r) => ({
                produto: r.produto_nome, qtd: r.quantidade_vendida, receita: formatKz(r.total_receita),
                custo: formatKz(r.total_custo), lucro: formatKz(r.lucro), margem: `${r.margem_percentual.toFixed(1)}%`,
              })),
              totalsRow: [
                t('reports.totalProfit'), String(totais.quantidade), formatKz(totais.receita),
                formatKz(totais.custo), formatKz(totais.lucro), `${margemMedia.toFixed(1)}%`,
              ],
              filename: 'lucro-por-produto',
            })}
          />
        )}
      </form>
      {loading && <Skeleton className="h-32 w-full" />}
      {result.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard label={t('reports.quantityProducts')} value={result.length} />
            <StatCard label={t('reports.soldQty')} value={totais.quantidade} />
            <StatCard label={t('reports.totalIncome')} value={formatKz(totais.receita)} />
            <StatCard label={t('reports.totalCost')} value={formatKz(totais.custo)} />
            <StatCard label={t('reports.totalProfit')} value={formatKz(totais.lucro)} />
          </div>
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
              <TableFooter>
                <TableRow>
                  <TableCell>{t('reports.totalProfit')}</TableCell>
                  <TableCell className="text-right">{totais.quantidade}</TableCell>
                  <TableCell className="text-right">{formatKz(totais.receita)}</TableCell>
                  <TableCell className="text-right">{formatKz(totais.custo)}</TableCell>
                  <TableCell className="text-right text-green-600">{formatKz(totais.lucro)}</TableCell>
                  <TableCell className="text-right">{margemMedia.toFixed(1)}%</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </>
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
          <TabsTrigger value="clientes-divida">{t('reports.tabDebtClients')}</TabsTrigger>
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
          <TabsContent value="clientes-divida">
            <Card><CardHeader><CardTitle className="text-base">{t('reports.cardDebtClients')}</CardTitle></CardHeader>
              <CardContent><ClientesComDivida t={t} /></CardContent></Card>
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
