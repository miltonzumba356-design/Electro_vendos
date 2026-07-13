import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { stockService } from '@/services/stock'
import { produtosService } from '@/services/produtos'
import type { MovimentoResponse, ProdutoResponse } from '@/types'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
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
import { TablePagination } from '@/app/components/ui/table-pagination'
import { usePagination } from '@/lib/usePagination'
import { ArrowLeft, ArrowUpCircle, ArrowDownCircle, Printer } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { imprimirEntradaStock } from '@/lib/recibo'

function formatKz(value: number) {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    maximumFractionDigits: 0,
  }).format(value)
}

export default function StockProdutoPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [produto, setProduto] = useState<ProdutoResponse | null>(null)
  const [movimentos, setMovimentos] = useState<MovimentoResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([produtosService.buscar(id), stockService.listarMovimentos(id)])
      .then(([p, m]) => {
        setProduto(p)
        setMovimentos([...m].sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()))
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : t('stock.toasts.loadError')))
      .finally(() => setLoading(false))
  }, [id])

  const entradas = movimentos.filter((m) => m.tipo === 'ENTRADA').reduce((sum, m) => sum + m.quantidade, 0)
  const saidas = movimentos.filter((m) => m.tipo === 'SAIDA').reduce((sum, m) => sum + m.quantidade, 0)
  const { page, pageItems, totalPages, setPage } = usePagination(movimentos)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/stock')}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          {loading ? (
            <Skeleton className="h-7 w-48" />
          ) : (
            <h1 className="text-2xl font-bold tracking-tight">{produto?.nome ?? t('stock.title')}</h1>
          )}
          <p className="text-muted-foreground text-sm">{t('stock.detailsHistory')}</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs text-muted-foreground">{t('stock.colCurrentStock')}</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 px-4">
              <p className="text-lg font-bold">{produto?.stock_atual}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs text-muted-foreground">{t('stock.colTotalIn')}</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 px-4">
              <p className="text-lg font-bold text-green-600">+{entradas}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs text-muted-foreground">{t('stock.colTotalOut')}</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 px-4">
              <p className="text-lg font-bold text-destructive">-{saidas}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Separator />

      <div className="space-y-2">
        <p className="text-sm font-medium">{t('stock.detailsHistory')}</p>
        <div className="rounded-md border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('stock.colDate')}</TableHead>
                <TableHead>{t('stock.colType')}</TableHead>
                <TableHead className="text-right">{t('stock.colQuantity')}</TableHead>
                <TableHead className="text-right">{t('stock.colUnitPrice')}</TableHead>
                <TableHead>{t('stock.colReason')}</TableHead>
                <TableHead>{t('stock.colUser')}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : movimentos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {t('stock.detailsEmpty')}
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(m.criado_em), 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={m.tipo === 'ENTRADA' ? 'default' : 'destructive'} className="gap-1">
                        {m.tipo === 'ENTRADA' ? (
                          <ArrowUpCircle className="size-3" />
                        ) : (
                          <ArrowDownCircle className="size-3" />
                        )}
                        {m.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {m.tipo === 'SAIDA' ? '-' : '+'}{m.quantidade}
                    </TableCell>
                    <TableCell className="text-right">
                      {m.preco_unitario != null ? formatKz(m.preco_unitario) : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-40 truncate">
                      {m.motivo ?? '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{m.utilizador_nome}</TableCell>
                    <TableCell>
                      {m.tipo === 'ENTRADA' && (
                        <Button variant="ghost" size="icon" title="Imprimir nota de entrada" onClick={() => imprimirEntradaStock(m)}>
                          <Printer className="size-4 text-muted-foreground" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  )
}
