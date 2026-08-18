import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { lixeiraService } from '@/services/lixeira'
import type { LixeiraItemResponse, LixeiraTipo } from '@/types'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
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
import { TablePagination } from '@/app/components/ui/table-pagination'
import { usePagination } from '@/lib/usePagination'
import { Search, RotateCcw, Trash2, Inbox } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

const TIPOS: LixeiraTipo[] = ['divida', 'venda', 'produto', 'fatura']

const BADGE_VARIANT: Record<LixeiraTipo, 'destructive' | 'default' | 'secondary' | 'outline'> = {
  divida: 'destructive',
  venda: 'default',
  produto: 'secondary',
  fatura: 'outline',
}

// Campos técnicos que não interessam mostrar no resumo de `detalhes` (ids,
// já cobertos pela descrição/coluna própria).
const CAMPOS_DETALHES_OCULTOS = new Set(['id', 'cliente_id', 'produto_id', 'venda_id', 'fornecedor_id'])

function formatDetalheValor(valor: unknown): string {
  if (valor === null || valor === undefined) return '—'
  if (typeof valor === 'boolean') return valor ? 'Sim' : 'Não'
  return String(valor)
}

function formatDetalheChave(chave: string): string {
  const texto = chave.replace(/_/g, ' ')
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export default function LixeiraPage() {
  const { t } = useTranslation()
  const [items, setItems] = useState<LixeiraItemResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | LixeiraTipo>('todos')
  const [search, setSearch] = useState('')
  const [restaurandoId, setRestaurandoId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<LixeiraItemResponse | null>(null)
  const [eliminando, setEliminando] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await lixeiraService.listar(tipoFiltro === 'todos' ? undefined : tipoFiltro)
      setItems(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('trash.toasts.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [tipoFiltro])

  const filtered = items.filter((i) => i.descricao.toLowerCase().includes(search.toLowerCase()))
  const { page, pageItems, totalPages, setPage, resetPage } = usePagination(filtered)

  async function handleRestaurar(item: LixeiraItemResponse) {
    setRestaurandoId(item.id)
    try {
      await lixeiraService.restaurar(item.id, item.tipo)
      setItems((prev) => prev.filter((i) => i.id !== item.id))
      toast.success(t('trash.toasts.restored', { descricao: item.descricao }))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('trash.toasts.restoreError'))
    } finally {
      setRestaurandoId(null)
    }
  }

  async function handleEliminarConfirmado() {
    if (!deleteTarget) return
    setEliminando(true)
    try {
      await lixeiraService.eliminarPermanente(deleteTarget.id, deleteTarget.tipo)
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id))
      toast.success(t('trash.toasts.deleted', { descricao: deleteTarget.descricao }))
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('trash.toasts.deleteError'))
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('trash.title')}</h1>
        <p className="text-muted-foreground text-sm">{t('trash.subtitle')}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={t('trash.searchPlaceholder')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage() }}
            className="pl-9"
          />
        </div>
        <Select value={tipoFiltro} onValueChange={(v) => setTipoFiltro(v as 'todos' | LixeiraTipo)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">{t('trash.filterAll')}</SelectItem>
            {TIPOS.map((tipo) => (
              <SelectItem key={tipo} value={tipo}>{t(`trash.type${tipo.charAt(0).toUpperCase()}${tipo.slice(1)}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('trash.colType')}</TableHead>
              <TableHead>{t('trash.colDescription')}</TableHead>
              <TableHead>{t('trash.colDeletedAt')}</TableHead>
              <TableHead className="text-right">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : pageItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                  <div className="flex flex-col items-center gap-2">
                    <Inbox className="size-8 text-muted-foreground/50" />
                    {t('trash.empty')}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              pageItems.map((item) => {
                const detalhesEntries = item.detalhes
                  ? Object.entries(item.detalhes).filter(([k]) => !CAMPOS_DETALHES_OCULTOS.has(k))
                  : []
                return (
                  <TableRow key={`${item.tipo}-${item.id}`}>
                    <TableCell>
                      <Badge variant={BADGE_VARIANT[item.tipo]}>
                        {t(`trash.type${item.tipo.charAt(0).toUpperCase()}${item.tipo.slice(1)}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.descricao}
                      {detalhesEntries.length > 0 && (
                        <p className="text-xs text-muted-foreground font-normal mt-0.5">
                          {detalhesEntries.map(([k, v]) => `${formatDetalheChave(k)}: ${formatDetalheValor(v)}`).join(' · ')}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.eliminado_em ? format(new Date(item.eliminado_em), 'dd/MM/yyyy HH:mm') : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          disabled={restaurandoId === item.id}
                          onClick={() => handleRestaurar(item)}
                        >
                          <RotateCcw className="size-4" />
                          {t('trash.restore')}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeleteTarget(item)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('trash.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('trash.deleteConfirmDesc', { descricao: deleteTarget?.descricao })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminando}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEliminarConfirmado}
              disabled={eliminando}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {t('trash.deletePermanent')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
