import { useEffect, useState } from 'react'
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
import { Plus, Filter, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

function formatKz(value: number) {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    maximumFractionDigits: 0,
  }).format(value)
}

export default function StockPage() {
  const { t } = useTranslation()
  const { isGestor } = useAuth()
  const [movimentos, setMovimentos] = useState<MovimentoResponse[]>([])
  const [produtos, setProdutos] = useState<ProdutoResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [filterProduto, setFilterProduto] = useState<string>('all')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    produto_id: '',
    tipo: 'ENTRADA' as 'ENTRADA' | 'SAIDA',
    quantidade: '1',
    motivo: '',
    preco_unitario: '',
  })

  async function load(produto_id?: string) {
    setLoading(true)
    try {
      const [m, p] = await Promise.allSettled([
        stockService.listarMovimentos(produto_id === 'all' ? undefined : produto_id),
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

  function handleFilterChange(value: string) {
    setFilterProduto(value)
    load(value)
  }

  const sorted = [...movimentos].sort(
    (a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
  )

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

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="size-4 text-muted-foreground shrink-0" />
        <Combobox
          options={[
            { value: 'all', label: t('stock.allProducts') },
            ...produtos.map((p) => ({ value: p.id, label: p.nome })),
          ]}
          value={filterProduto}
          onValueChange={(v) => handleFilterChange(v || 'all')}
          placeholder={t('stock.filterByProduct')}
          searchPlaceholder={t('common.search')}
          emptyText={t('products.empty')}
          className="w-full sm:w-64"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('stock.colDate')}</TableHead>
              <TableHead>{t('stock.colProduct')}</TableHead>
              <TableHead>{t('stock.colType')}</TableHead>
              <TableHead className="text-right">{t('stock.colQuantity')}</TableHead>
              <TableHead className="text-right">{t('stock.colUnitPrice')}</TableHead>
              <TableHead>{t('stock.colReason')}</TableHead>
              <TableHead>{t('stock.colUser')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  {t('stock.empty')}
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(m.criado_em), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="font-medium">{m.produto_nome}</TableCell>
                  <TableCell>
                    <Badge
                      variant={m.tipo === 'ENTRADA' ? 'default' : 'destructive'}
                      className="gap-1"
                    >
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
