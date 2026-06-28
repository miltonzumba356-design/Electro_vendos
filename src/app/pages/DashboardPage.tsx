import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Skeleton } from '@/app/components/ui/skeleton'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/app/components/ui/chart'
import { produtosService } from '@/services/produtos'
import { clientesService } from '@/services/clientes'
import { vendasService } from '@/services/vendas'
import type { ProdutoStockBaixo, VendaResponse, ClienteResponse } from '@/types'
import { ShoppingCart, Users, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { format, startOfWeek, addDays } from 'date-fns'
import { useDateFnsLocale } from '@/i18n/useDateFnsLocale'

/* ── Paleta ────────────────────────────────────────────────── */
const C_PRIMARY = '#6366f1'
const C_GREEN   = '#22c55e'
const C_AMBER   = '#f59e0b'
const C_CYAN    = '#06b6d4'
const PIE_COLORS = ['#6366f1','#22c55e','#f59e0b','#8b5cf6','#06b6d4','#f97316','#ec4899']
const DAYS_ABBR  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

/* ── Helpers ───────────────────────────────────────────────── */
function formatKz(value: number) {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency', currency: 'AOA', maximumFractionDigits: 0,
  }).format(value)
}
function formatK(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000)     return `${(value / 1_000).toFixed(0)}k`
  return value.toString()
}

/* ── Donut chart configs (estáticos) ───────────────────────── */
const donutConfig: ChartConfig = Object.fromEntries(
  DAYS_ABBR.map((d, i) => [d, { label: d, color: PIE_COLORS[i] }])
)

/* ── Stat card ─────────────────────────────────────────────── */
function StatCard({
  title, value, subtitle, icon: Icon, loading, accent, trend,
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  loading?: boolean
  accent?: string
  trend?: number
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-xl" style={{ background: accent ?? C_PRIMARY }} />
      <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</CardTitle>
        <div className="rounded-lg p-1.5" style={{ background: (accent ?? C_PRIMARY) + '18' }}>
          <Icon className="size-4" style={{ color: accent ?? C_PRIMARY }} />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <>
            <Skeleton className="h-8 w-28 mb-1" />
            <Skeleton className="h-3 w-20" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold tracking-tight">{value}</div>
            <div className="flex items-center gap-2 mt-1">
              {trend !== undefined && trend !== 0 && (
                <span className={`flex items-center gap-0.5 text-xs font-medium ${trend > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {trend > 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                  {Math.abs(trend)}
                </span>
              )}
              {trend === 0 && (
                <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                  <Minus className="size-3" /> 0
                </span>
              )}
              {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

/* ── Label central do Donut ────────────────────────────────── */
function DonutCenter({ cx, cy, total }: { cx: number; cy: number; total: number }) {
  return (
    <g>
      <text x={cx} y={cy - 6} textAnchor="middle" fill="currentColor" fontSize={10} opacity={0.5}>Total</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="currentColor" fontWeight="700" fontSize={12}>
        {formatK(total)}
      </text>
    </g>
  )
}

/* ── Page ──────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { t }    = useTranslation()
  const dfLocale = useDateFnsLocale()

  const [vendas,     setVendas]     = useState<VendaResponse[]>([])
  const [clientes,   setClientes]   = useState<ClienteResponse[]>([])
  const [stockBaixo, setStockBaixo] = useState<ProdutoStockBaixo[]>([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [v, c, s] = await Promise.allSettled([
          vendasService.listar(),
          clientesService.listar(),
          produtosService.stockBaixo(),
        ])
        if (v.status === 'fulfilled') setVendas(v.value)
        if (c.status === 'fulfilled') setClientes(c.value)
        if (s.status === 'fulfilled') setStockBaixo(s.value)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  /* derivações */
  const todayStr     = useMemo(() => new Date().toDateString(), [])
  const yesterdayStr = useMemo(() => { const d = new Date(); d.setDate(d.getDate()-1); return d.toDateString() }, [])
  const vendasHoje   = useMemo(() => vendas.filter(v => new Date(v.criado_em).toDateString() === todayStr), [vendas, todayStr])
  const vendasOntem  = useMemo(() => vendas.filter(v => new Date(v.criado_em).toDateString() === yesterdayStr), [vendas, yesterdayStr])
  const totalHoje    = useMemo(() => vendasHoje.reduce((s,v) => s + v.total_final, 0), [vendasHoje])

  /* gráfico de área — 30 dias */
  const areaData = useMemo(() => Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    const str = d.toDateString()
    const vs  = vendas.filter(v => new Date(v.criado_em).toDateString() === str)
    return {
      dia:   format(d, 'dd/MM', { locale: dfLocale }),
      total: vs.reduce((s,v) => s + v.total_final, 0),
    }
  }), [vendas, dfLocale])

  /* donut — por dia da semana */
  const donutData = useMemo(() => DAYS_ABBR
    .map((name, i) => ({
      name,
      total: vendas.filter(v => new Date(v.criado_em).getDay() === i).reduce((s,v) => s + v.total_final, 0),
    }))
    .filter(d => d.total > 0),
  [vendas]) // eslint-disable-line react-hooks/exhaustive-deps
  const totalDonut = useMemo(() => donutData.reduce((s,d) => s + d.total, 0), [donutData])

  /* comparação semanal — usa chaves fixas thisWeek / lastWeek */
  const weekData = useMemo(() => {
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 })
    return Array.from({ length: 7 }, (_, i) => {
      const thisDay = addDays(monday, i)
      const lastDay = addDays(monday, i - 7)
      return {
        day:      format(thisDay, 'EEE', { locale: dfLocale }),
        thisWeek: vendas.filter(v => new Date(v.criado_em).toDateString() === thisDay.toDateString()).reduce((s,v) => s + v.total_final, 0),
        lastWeek: vendas.filter(v => new Date(v.criado_em).toDateString() === lastDay.toDateString()).reduce((s,v) => s + v.total_final, 0),
      }
    })
  }, [vendas, dfLocale])

  /* configs dependentes do locale/t() */
  const localAreaConfig = useMemo<ChartConfig>(() => ({
    total: { label: t('dashboard.sales'), color: C_PRIMARY },
  }), [t])

  const localWeekConfig = useMemo<ChartConfig>(() => ({
    thisWeek: { label: t('dashboard.thisWeek'), color: C_PRIMARY },
    lastWeek: { label: t('dashboard.lastWeek'), color: '#94a3b8' },
  }), [t])

  /* vendas recentes */
  const recentes = useMemo(() => [...vendas]
    .sort((a,b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())
    .slice(0, 6),
  [vendas])

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground text-sm">
          {format(new Date(), t('dashboard.dateFormat'), { locale: dfLocale })}
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('dashboard.todaySales')}
          value={loading ? '—' : vendasHoje.length}
          subtitle={loading ? undefined : formatKz(totalHoje)}
          icon={ShoppingCart} loading={loading} accent={C_PRIMARY}
          trend={loading ? undefined : vendasHoje.length - vendasOntem.length}
        />
        <StatCard
          title={t('dashboard.totalClients')}
          value={loading ? '—' : clientes.length}
          subtitle={t('dashboard.registeredClients')}
          icon={Users} loading={loading} accent={C_GREEN}
        />
        <StatCard
          title={t('dashboard.totalRevenue')}
          value={loading ? '—' : formatKz(totalHoje)}
          subtitle={t('dashboard.salesCount', { count: vendasHoje.length })}
          icon={TrendingUp} loading={loading} accent={C_AMBER}
        />
        <StatCard
          title={t('dashboard.stockAlerts')}
          value={loading ? '—' : stockBaixo.length}
          subtitle={t('dashboard.productsBelow')}
          icon={AlertTriangle} loading={loading}
          accent={stockBaixo.length > 0 ? '#ef4444' : C_CYAN}
        />
      </div>

      {/* ── Área 30 dias + Donut ── */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">

        {/* Gráfico de Área */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t('dashboard.last30Days')}</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            {loading ? <Skeleton className="h-52 w-full" /> : (
              <ChartContainer config={localAreaConfig} className="h-[210px]">
                <AreaChart data={areaData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="var(--color-total)" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="dia" tick={{ fontSize: 10 }}
                    tickLine={false} axisLine={false} interval={4}
                  />
                  <YAxis
                    tickFormatter={formatK} tick={{ fontSize: 10 }}
                    tickLine={false} axisLine={false} width={40}
                  />
                  <ChartTooltip
                    cursor={{ stroke: 'var(--color-total)', strokeWidth: 1, strokeDasharray: '4 2' }}
                    content={
                      <ChartTooltipContent
                        formatter={(value) => (
                          <span className="font-mono font-semibold tabular-nums ml-4">
                            {formatKz(value as number)}
                          </span>
                        )}
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="var(--color-total)"
                    strokeWidth={2.5}
                    fill="url(#gradArea)"
                    dot={false}
                    activeDot={{ r: 5, fill: 'var(--color-total)', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Donut — por dia da semana */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t('dashboard.salesDays')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3 pb-4">
            {loading ? <Skeleton className="h-52 w-full" /> : donutData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-10">{t('dashboard.noData')}</p>
            ) : (
              <>
                <ChartContainer config={donutConfig} className="h-[175px]">
                  <PieChart>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          nameKey="name"
                          formatter={(value) => (
                            <span className="font-mono font-semibold tabular-nums ml-4">
                              {formatKz(value as number)}
                            </span>
                          )}
                        />
                      }
                    />
                    <Pie
                      data={donutData}
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={78}
                      dataKey="total" nameKey="name"
                      paddingAngle={2} strokeWidth={0}
                    >
                      {donutData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={PIE_COLORS[DAYS_ABBR.indexOf(entry.name) % PIE_COLORS.length]}
                        />
                      ))}
                      <DonutCenter cx={0} cy={0} total={totalDonut} />
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
                  {donutData.map((d) => {
                    const idx = DAYS_ABBR.indexOf(d.name)
                    return (
                      <span key={d.name} className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="size-2 rounded-full inline-block" style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }} />
                        {d.name}
                      </span>
                    )
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Comparação semanal + Vendas recentes ── */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">

        {/* Barras agrupadas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t('dashboard.weeklyComparison')}</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            {loading ? <Skeleton className="h-44 w-full" /> : (
              <ChartContainer config={localWeekConfig} className="h-[180px]">
                <BarChart data={weekData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={formatK} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={38} />
                  <ChartTooltip
                    cursor={{ fill: 'transparent' }}
                    content={
                      <ChartTooltipContent
                        formatter={(value) => (
                          <span className="font-mono font-semibold tabular-nums ml-4">
                            {formatKz(value as number)}
                          </span>
                        )}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="thisWeek" fill="var(--color-thisWeek)" radius={[3,3,0,0]} maxBarSize={18} />
                  <Bar dataKey="lastWeek" fill="var(--color-lastWeek)" radius={[3,3,0,0]} maxBarSize={18} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Vendas recentes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t('dashboard.recentSales')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="px-6 space-y-2 py-2">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : recentes.length === 0 ? (
              <p className="text-sm text-muted-foreground px-6 py-6">{t('dashboard.noSales')}</p>
            ) : (
              <ul>
                {recentes.map((v, idx) => (
                  <li
                    key={v.id}
                    className={`flex items-center justify-between px-6 py-2.5 text-sm ${idx < recentes.length - 1 ? 'border-b' : ''}`}
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{v.cliente_nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(v.criado_em), 'dd/MM HH:mm', { locale: dfLocale })} · {v.utilizador_nome}
                      </p>
                    </div>
                    <span className="ml-4 font-semibold shrink-0">{formatKz(v.total_final)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Stock crítico ── */}
      {(loading || stockBaixo.length > 0) && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="size-4 text-destructive" />
              {t('dashboard.criticalStock')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex gap-2 flex-wrap">
                {[1,2,3].map(i => <Skeleton key={i} className="h-8 w-36" />)}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {stockBaixo.map(p => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-1.5"
                  >
                    <span className="text-sm font-medium truncate max-w-[120px] sm:max-w-[180px]">{p.nome}</span>
                    <Badge variant="destructive" className="shrink-0 text-xs">
                      {p.stock_atual}/{p.stock_minimo}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
