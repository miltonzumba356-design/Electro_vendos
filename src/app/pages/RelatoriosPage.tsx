import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { relatoriosService } from '@/services/relatorios'
import type {
  RelatorioVendasPeriodo,
  RelatorioClienteFiel,
  RelatorioClienteInativo,
  RelatorioProdutoVendido,
  RelatorioVendaCliente,
  ProdutoStockBaixo,
} from '@/types'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Badge } from '@/app/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table'
import { Skeleton } from '@/app/components/ui/skeleton'
import { AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      <StatCard label={t('reports.totalSales')}   value={data.total_vendas} />
      <StatCard label={t('reports.totalRevenue')} value={formatKz(data.total_receita)} />
      <StatCard label={t('reports.netRevenue')}   value={formatKz(data.total_sem_iva)} />
      <StatCard label={t('reports.totalVat')}     value={formatKz(data.total_iva)} />
      <StatCard label={t('reports.discounts')}    value={formatKz(data.total_descontos)} />
      <StatCard label={t('reports.grossProfit')}  value={formatKz(data.lucro_bruto)} />
      <StatCard label={t('reports.avgTicket')}    value={formatKz(data.ticket_medio)} />
    </div>
  )
}

/* ── Vendas por período ─────────────────────────────────────── */
function VendasPeriodo({ t }: { t: TFunction }) {
  const [result, setResult] = useState<RelatorioVendasPeriodo | null>(null)
  const [loading, setLoading] = useState(false)
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!inicio || !fim) { toast.error(t('reports.fillDates')); return }
    setLoading(true)
    try {
      const data = await relatoriosService.vendasPeriodo(
        new Date(inicio).toISOString(),
        new Date(fim + 'T23:59:59').toISOString()
      )
      setResult(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro')
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label>{t('reports.startDate')}</Label>
          <Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>{t('reports.endDate')}</Label>
          <Input type="date" value={fim} onChange={(e) => setFim(e.target.value)} required />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? t('reports.loading') : t('reports.consult')}
        </Button>
      </form>
      {loading && <Skeleton className="h-32 w-full" />}
      {result && <PeriodoStats data={result} t={t} />}
    </div>
  )
}

/* ── Vendas diárias ─────────────────────────────────────────── */
function VendasDiario({ t }: { t: TFunction }) {
  const [result, setResult] = useState<RelatorioVendasPeriodo | null>(null)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await relatoriosService.vendasDiario(data || undefined)
      setResult(res)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro')
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label>{t('common.date')} <span className="text-muted-foreground text-xs">(vazio = hoje)</span></Label>
          <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? t('reports.loading') : t('reports.consult')}
        </Button>
      </form>
      {loading && <Skeleton className="h-32 w-full" />}
      {result && <PeriodoStats data={result} t={t} />}
    </div>
  )
}

/* ── Vendas mensais ─────────────────────────────────────────── */
function VendasMensal({ t }: { t: TFunction }) {
  const [result, setResult] = useState<RelatorioVendasPeriodo | null>(null)
  const [loading, setLoading] = useState(false)
  const now = new Date()
  const [ano, setAno] = useState(String(now.getFullYear()))
  const [mes, setMes] = useState(String(now.getMonth() + 1))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await relatoriosService.vendasMensal(Number(ano), Number(mes))
      setResult(res)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro')
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label>{t('reports.year')}</Label>
          <Input type="number" value={ano} onChange={(e) => setAno(e.target.value)} className="w-24" min="2020" max="2099" />
        </div>
        <div className="space-y-1">
          <Label>{t('reports.month')}</Label>
          <Input type="number" value={mes} onChange={(e) => setMes(e.target.value)} className="w-20" min="1" max="12" />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? t('reports.loading') : t('reports.consult')}
        </Button>
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
      <Button onClick={handleConsultar} disabled={loading}>
        {loading ? t('reports.loading') : t('reports.consultCritical')}
      </Button>
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
          <TabsTrigger value="vendas-diario">{t('reports.tabDaily')}</TabsTrigger>
          <TabsTrigger value="vendas-mensal">{t('reports.tabMonthly')}</TabsTrigger>
          <TabsTrigger value="vendas-por-cliente">{t('reports.tabByClient')}</TabsTrigger>
          <TabsTrigger value="clientes-fieis">{t('reports.tabLoyal')}</TabsTrigger>
          <TabsTrigger value="clientes-inativos">{t('reports.tabInactive')}</TabsTrigger>
          <TabsTrigger value="mais-vendidos">{t('reports.tabBestSelling')}</TabsTrigger>
          <TabsTrigger value="stock-critico">{t('reports.tabCritical')}</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="vendas-periodo">
            <Card><CardHeader><CardTitle className="text-base">{t('reports.cardPeriod')}</CardTitle></CardHeader>
              <CardContent><VendasPeriodo t={t} /></CardContent></Card>
          </TabsContent>
          <TabsContent value="vendas-diario">
            <Card><CardHeader><CardTitle className="text-base">{t('reports.cardDaily')}</CardTitle></CardHeader>
              <CardContent><VendasDiario t={t} /></CardContent></Card>
          </TabsContent>
          <TabsContent value="vendas-mensal">
            <Card><CardHeader><CardTitle className="text-base">{t('reports.cardMonthly')}</CardTitle></CardHeader>
              <CardContent><VendasMensal t={t} /></CardContent></Card>
          </TabsContent>
          <TabsContent value="vendas-por-cliente">
            <Card><CardHeader><CardTitle className="text-base">{t('reports.cardByClient')}</CardTitle></CardHeader>
              <CardContent><VendasPorCliente t={t} /></CardContent></Card>
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
          <TabsContent value="stock-critico">
            <Card><CardHeader><CardTitle className="text-base">{t('reports.cardCritical')}</CardTitle></CardHeader>
              <CardContent><StockCritico t={t} /></CardContent></Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
