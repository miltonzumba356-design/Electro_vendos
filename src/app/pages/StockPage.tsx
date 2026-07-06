import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { stockService } from '@/services/stock'
import { produtosService } from '@/services/produtos'
import type { MovimentoResponse, ProdutoResponse } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Badge } from '@/app/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { Combobox } from '@/app/components/ui/combobox'
import { Skeleton } from '@/app/components/ui/skeleton'
import { Plus, Search, Eye, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function StockPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isGestor } = useAuth()
  const [movimentos, setMovimentos] = useState<MovimentoResponse[]>([])
  const [produtos, setProdutos] = useState<ProdutoResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    produto_id: '',
    tipo: 'ENTRADA' as 'ENTRADA' | 'SAIDA',
    quantidade: '1',
    motivo: '',
    preco_unitario: '',
  })

  async function load() {
    setLoading(true)
    try {
      const [m, p] = await Promise.allSettled([
        stockService.listarMovimentos(),
        produtosService.listar(),
      ])
      if (m.status === 'fulfilled') setMovimentos(m.value)
      if (p.status === 'fulfilled') setProdutos(p.value)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('stock.toasts.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openDialog() {
    setForm({ produto_id: '', tipo: 'ENTRADA', quantidade: '1', motivo: '', preco_unitario: '' })
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.produto_id) {
      toast.error(t('stock.toasts.selectProduct'))
      return
    }
    if (Number(form.quantidade) < 1) {
      toast.error(t('stock.toasts.minQty'))
      return
    }
    setSaving(true)
    try {
      const novo = await stockService.registarMovimento({
        produto_id: form.produto_id,
        tipo: form.tipo,
        quantidade: Number(form.quantidade),
        motivo: form.motivo || null,
        preco_unitario: form.preco_unitario ? Number(form.preco_unitario) : null,
      })
      setMovimentos((prev) => [novo, ...prev])
      toast.success(t('stock.toasts.registered'))
      setDialogOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('stock.toasts.registerError'))
    } finally {
      setSaving(false)
    }
  }

  const resumoPorProduto = useMemo(() => {
    return produtos
      .map((p) => {
        const movs = movimentos.filter((m) => m.produto_id === p.id)
        const entradas = movs
          .filter((m) => m.tipo === 'ENTRADA')
          .reduce((sum, m) => sum + m.quantidade, 0)
        const saidas = movs
          .filter((m) => m.tipo === 'SAIDA')
          .reduce((sum, m) => sum + m.quantidade, 0)
        return { produto: p, entradas, saidas, movimentos: movs.length }
      })
      .filter((r) => r.produto.nome.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.produto.nome.localeCompare(b.produto.nome))
  }, [produtos, movimentos, search])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('stock.title')}</h1>
          <p className="text-muted-foreground text-sm">{t('stock.subtitle')}</p>
        </div>
        {isGestor && (
          <Button onClick={openDialog} className="gap-2 shrink-0">
            <Plus className="size-4" />
            {t('stock.registerMovement')}
          </Button>
        )}
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder={t('stock.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table — um produto por linha */}
      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('stock.colProduct')}</TableHead>
              <TableHead className="text-right">{t('stock.colCurrentStock')}</TableHead>
              <TableHead className="text-right">{t('stock.colTotalIn')}</TableHead>
              <TableHead className="text-right">{t('stock.colTotalOut')}</TableHead>
              <TableHead className="text-right">{t('stock.colMovements')}</TableHead>
              <TableHead className="text-right">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : resumoPorProduto.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {t('stock.emptyProducts')}
                </TableCell>
              </TableRow>
            ) : (
              resumoPorProduto.map(({ produto, entradas, saidas, movimentos: count }) => (
                <TableRow
                  key={produto.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => navigate(`/stock/${produto.id}`)}
                >
                  <TableCell className="font-medium">{produto.nome}</TableCell>
                  <TableCell className="text-right">{produto.stock_atual}</TableCell>
                  <TableCell className="text-right text-green-600">+{entradas}</TableCell>
                  <TableCell className="text-right text-destructive">-{saidas}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">{count}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); navigate(`/stock/${produto.id}`) }}
                    >
                      <Eye className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Registar movimento dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('stock.dialogTitle')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>{t('stock.fieldProduct')} *</Label>
              <Combobox
                options={produtos.map((p) => ({
                  value: p.id,
                  label: `${p.nome} (stock: ${p.stock_atual})`,
                }))}
                value={form.produto_id}
                onValueChange={(v) => setForm((f) => ({ ...f, produto_id: v }))}
                placeholder={t('sales.selectProduct')}
                searchPlaceholder={t('common.search')}
                emptyText={t('products.empty')}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('stock.fieldType')} *</Label>
              <div className="flex gap-2">
                {(['ENTRADA', 'SAIDA'] as const).map((tp) => (
                  <Button
                    key={tp}
                    type="button"
                    variant={form.tipo === tp ? 'default' : 'outline'}
                    onClick={() => setForm((f) => ({ ...f, tipo: tp }))}
                    className="flex-1 gap-2"
                  >
                    {tp === 'ENTRADA' ? (
                      <ArrowUpCircle className="size-4" />
                    ) : (
                      <ArrowDownCircle className="size-4" />
                    )}
                    {tp}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="quantidade">{t('stock.fieldQty')} *</Label>
                <Input
                  id="quantidade"
                  type="number"
                  min="1"
                  value={form.quantidade}
                  onChange={(e) => setForm((f) => ({ ...f, quantidade: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preco_unitario">
                  {t('stock.fieldUnitPrice')}
                  {form.tipo === 'ENTRADA' && (
                    <span className="text-xs text-muted-foreground ml-1">{t('stock.costLabel')}</span>
                  )}
                </Label>
                <Input
                  id="preco_unitario"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.preco_unitario}
                  onChange={(e) => setForm((f) => ({ ...f, preco_unitario: e.target.value }))}
                  placeholder={t('common.optional')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivo">{t('stock.fieldReason')}</Label>
              <Input
                id="motivo"
                value={form.motivo}
                onChange={(e) => setForm((f) => ({ ...f, motivo: e.target.value }))}
                placeholder={t('stock.reasonPlaceholder')}
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? t('common.registering') : t('common.register')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
