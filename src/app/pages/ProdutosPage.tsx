import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { produtosService } from '@/services/produtos'
import type { ProdutoResponse, ProdutoCreate, ProdutoUpdate } from '@/types'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog'
import { Skeleton } from '@/app/components/ui/skeleton'
import { Plus, Pencil, Trash2, AlertTriangle, Search } from 'lucide-react'
import { toast } from 'sonner'

function formatKz(value: number) {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    maximumFractionDigits: 0,
  }).format(value)
}

interface FormData {
  nome: string
  descricao: string
  codigo_barras: string
  preco_custo: string
  preco_venda: string
  iva: string
  stock_atual: string
  stock_minimo: string
}

const defaultForm: FormData = {
  nome: '',
  descricao: '',
  codigo_barras: '',
  preco_custo: '0',
  preco_venda: '0',
  iva: '14',
  stock_atual: '0',
  stock_minimo: '0',
}

export default function ProdutosPage() {
  const { t } = useTranslation()
  const { isGestor } = useAuth()
  const [produtos, setProdutos] = useState<ProdutoResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ProdutoResponse | null>(null)
  const [form, setForm] = useState<FormData>(defaultForm)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<ProdutoResponse | null>(null)

  async function load() {
    try {
      const data = await produtosService.listar()
      setProdutos(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('products.toasts.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditing(null)
    setForm(defaultForm)
    setDialogOpen(true)
  }

  function openEdit(p: ProdutoResponse) {
    setEditing(p)
    setForm({
      nome: p.nome,
      descricao: p.descricao ?? '',
      codigo_barras: p.codigo_barras ?? '',
      preco_custo: String(p.preco_custo),
      preco_venda: String(p.preco_venda),
      iva: String(p.iva),
      stock_atual: String(p.stock_atual),
      stock_minimo: String(p.stock_minimo),
    })
    setDialogOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) {
      toast.error(t('products.toasts.nameRequired'))
      return
    }
    setSaving(true)
    try {
      if (editing) {
        const update: ProdutoUpdate = {
          nome: form.nome || null,
          descricao: form.descricao || null,
          codigo_barras: form.codigo_barras || null,
          preco_custo: form.preco_custo ? Number(form.preco_custo) : null,
          preco_venda: form.preco_venda ? Number(form.preco_venda) : null,
          iva: form.iva ? Number(form.iva) : null,
          stock_minimo: form.stock_minimo ? Number(form.stock_minimo) : null,
        }
        const updated = await produtosService.atualizar(editing.id, update)
        setProdutos((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
        toast.success(t('products.toasts.updated'))
      } else {
        const create: ProdutoCreate = {
          nome: form.nome,
          descricao: form.descricao || null,
          codigo_barras: form.codigo_barras || null,
          preco_custo: Number(form.preco_custo),
          preco_venda: Number(form.preco_venda),
          iva: Number(form.iva),
          stock_atual: Number(form.stock_atual),
          stock_minimo: Number(form.stock_minimo),
        }
        const novo = await produtosService.criar(create)
        setProdutos((prev) => [novo, ...prev])
        toast.success(t('products.toasts.created'))
      }
      setDialogOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('products.toasts.saveError'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await produtosService.remover(deleteTarget.id)
      setProdutos((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      toast.success(t('products.toasts.deactivated'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('products.toasts.deleteError'))
    } finally {
      setDeleteTarget(null)
    }
  }

  const filtered = produtos.filter((p) =>
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    (p.codigo_barras ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('products.title')}</h1>
          <p className="text-muted-foreground text-sm">{t('products.count', { count: produtos.length })}</p>
        </div>
        {isGestor && (
          <Button onClick={openCreate} className="gap-2 shrink-0">
            <Plus className="size-4" />
            {t('products.new')}
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder={t('products.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('products.colName')}</TableHead>
              <TableHead>{t('products.colBarcode')}</TableHead>
              <TableHead className="text-right">{t('products.colSalePrice')}</TableHead>
              <TableHead className="text-right">{t('products.colVat')}</TableHead>
              <TableHead className="text-right">{t('products.colWithVat')}</TableHead>
              <TableHead className="text-right">{t('products.colStock')}</TableHead>
              <TableHead>{t('products.colStatus')}</TableHead>
              {isGestor && <TableHead className="text-right">{t('products.colActions')}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: isGestor ? 8 : 7 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isGestor ? 8 : 7} className="text-center text-muted-foreground py-8">
                  {t('products.empty')}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => {
                const lowStock = p.stock_atual <= p.stock_minimo
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {p.nome}
                        {lowStock && (
                          <AlertTriangle className="size-3.5 text-destructive shrink-0" />
                        )}
                      </div>
                      {p.descricao && (
                        <p className="text-xs text-muted-foreground truncate max-w-48">{p.descricao}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.codigo_barras ?? '—'}
                    </TableCell>
                    <TableCell className="text-right">{formatKz(p.preco_venda)}</TableCell>
                    <TableCell className="text-right">{p.iva}%</TableCell>
                    <TableCell className="text-right font-medium">{formatKz(p.preco_com_iva)}</TableCell>
                    <TableCell className="text-right">
                      <span className={lowStock ? 'text-destructive font-medium' : ''}>
                        {p.stock_atual}
                      </span>
                      <span className="text-muted-foreground text-xs">/{p.stock_minimo}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.ativo ? 'default' : 'secondary'}>
                        {p.ativo ? t('common.active') : t('common.inactive')}
                      </Badge>
                    </TableCell>
                    {isGestor && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(p)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(p)}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto w-full">
          <DialogHeader>
            <DialogTitle>{editing ? t('products.editTitle') : t('products.newTitle')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="nome">{t('products.fieldName')} *</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                placeholder={t('products.namePlaceholder')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">{t('products.fieldDesc')}</Label>
              <Input
                id="descricao"
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                placeholder={t('products.descPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="codigo_barras">{t('products.fieldBarcode')}</Label>
              <Input
                id="codigo_barras"
                value={form.codigo_barras}
                onChange={(e) => setForm((f) => ({ ...f, codigo_barras: e.target.value }))}
                placeholder={t('products.barcodePlaceholder')}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="preco_custo">{t('products.fieldCostPrice')}</Label>
                <Input
                  id="preco_custo"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.preco_custo}
                  onChange={(e) => setForm((f) => ({ ...f, preco_custo: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preco_venda">{t('products.fieldSalePrice')}</Label>
                <Input
                  id="preco_venda"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.preco_venda}
                  onChange={(e) => setForm((f) => ({ ...f, preco_venda: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="iva">{t('products.fieldVat')}</Label>
                <Input
                  id="iva"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={form.iva}
                  onChange={(e) => setForm((f) => ({ ...f, iva: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock_atual">{t('products.fieldCurrentStock')}</Label>
                <Input
                  id="stock_atual"
                  type="number"
                  min="0"
                  value={form.stock_atual}
                  onChange={(e) => setForm((f) => ({ ...f, stock_atual: e.target.value }))}
                  disabled={!!editing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock_minimo">{t('products.fieldMinStock')}</Label>
                <Input
                  id="stock_minimo"
                  type="number"
                  min="0"
                  value={form.stock_minimo}
                  onChange={(e) => setForm((f) => ({ ...f, stock_minimo: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? t('common.saving') : t('common.save')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('products.deactivateTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('products.deactivateDesc', { name: deleteTarget?.nome })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              {t('products.deactivate')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
