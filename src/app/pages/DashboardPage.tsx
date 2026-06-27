import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Skeleton } from '@/app/components/ui/skeleton'
import { produtosService } from '@/services/produtos'
import { clientesService } from '@/services/clientes'
import { vendasService } from '@/services/vendas'
import type { ProdutoStockBaixo, VendaResponse, ClienteResponse } from '@/types'
import {
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'
import { useDateFnsLocale } from '@/i18n/useDateFnsLocale'

function formatKz(value: number) {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    maximumFractionDigits: 0,
  }).format(value)
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  loading,
  variant,
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  loading?: boolean
  variant?: 'default' | 'warning'
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon
          className={`size-4 ${variant === 'warning' ? 'text-destructive' : 'text-muted-foreground'}`}
        />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <div className={`text-2xl font-bold ${variant === 'warning' ? 'text-destructive' : ''}`}>
              {value}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const dfLocale = useDateFnsLocale()

  const [vendas, setVendas] = useState<VendaResponse[]>([])
  const [clientes, setClientes] = useState<ClienteResponse[]>([])
  const [stockBaixo, setStockBaixo] = useState<ProdutoStockBaixo[]>([])
  const [loading, setLoading] = useState(true)

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

  const today = new Date().toDateString()
  const vendasHoje = vendas.filter(
    (v) => new Date(v.criado_em).toDateString() === today
  )
  const totalHoje = vendasHoje.reduce((sum, v) => sum + v.total_final, 0)
  const totalGeral = vendas.reduce((sum, v) => sum + v.total_final, 0)

  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const label = format(d, 'dd/MM', { locale: dfLocale })
    const dayStr = d.toDateString()
    const total = vendas
      .filter((v) => new Date(v.criado_em).toDateString() === dayStr)
      .reduce((sum, v) => sum + v.total_final, 0)
    return { dia: label, total }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground text-sm">
          {format(new Date(), t('dashboard.dateFormat'), { locale: dfLocale })}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('dashboard.todaySales')}
          value={loading ? '—' : vendasHoje.length}
          subtitle={loading ? undefined : formatKz(totalHoje)}
          icon={ShoppingCart}
          loading={loading}
        />
        <StatCard
          title={t('dashboard.totalClients')}
          value={loading ? '—' : clientes.length}
          subtitle={t('dashboard.registeredClients')}
          icon={Users}
          loading={loading}
        />
        <StatCard
          title={t('dashboard.totalRevenue')}
          value={loading ? '—' : formatKz(totalGeral)}
          subtitle={t('dashboard.salesCount', { count: vendas.length })}
          icon={TrendingUp}
          loading={loading}
        />
        <StatCard
          title={t('dashboard.stockAlerts')}
          value={loading ? '—' : stockBaixo.length}
          subtitle={t('dashboard.productsBelow')}
          icon={AlertTriangle}
          loading={loading}
          variant={stockBaixo.length > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t('dashboard.last7Days')}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="dia" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    formatter={(value: number) => [formatKz(value), t('dashboard.sales')]}
                  />
                  <Bar dataKey="total" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="size-4 text-destructive" />
              {t('dashboard.criticalStock')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : stockBaixo.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('dashboard.noCritical')}</p>
            ) : (
              <ul className="space-y-2">
                {stockBaixo.slice(0, 6).map((p) => (
                  <li key={p.id} className="flex items-center justify-between text-sm">
                    <span className="truncate flex-1 mr-2">{p.nome}</span>
                    <Badge variant="destructive" className="shrink-0">
                      {p.stock_atual}/{p.stock_minimo}
                    </Badge>
                  </li>
                ))}
                {stockBaixo.length > 6 && (
                  <p className="text-xs text-muted-foreground">
                    {t('common.more', { count: stockBaixo.length - 6 })}
                  </p>
                )}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent sales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('dashboard.recentSales')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : vendas.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('dashboard.noSales')}</p>
          ) : (
            <div className="space-y-2">
              {[...vendas]
                .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())
                .slice(0, 5)
                .map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{v.cliente_nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(v.criado_em), 'dd/MM/yyyy HH:mm', { locale: dfLocale })} · {v.utilizador_nome}
                      </p>
                    </div>
                    <span className="text-sm font-semibold">{formatKz(v.total_final)}</span>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
