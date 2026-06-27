import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { clientesService } from '@/services/clientes'
import type { ClienteResponse, ClienteCreate, ClienteUpdate } from '@/types'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
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
import { Skeleton } from '@/app/components/ui/skeleton'
import { Plus, Pencil, Search } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface FormData {
  nome: string
  telefone: string
  email: string
  nif: string
  endereco: string
}

const defaultForm: FormData = {
  nome: '',
  telefone: '',
  email: '',
  nif: '',
  endereco: '',
}

export default function ClientesPage() {
  const { t } = useTranslation()
  const [clientes, setClientes] = useState<ClienteResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ClienteResponse | null>(null)
  const [form, setForm] = useState<FormData>(defaultForm)
  const [saving, setSaving] = useState(false)

  async function load() {
    try {
      const data = await clientesService.listar()
      setClientes(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('clients.toasts.loadError'))
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

  function openEdit(c: ClienteResponse) {
    setEditing(c)
    setForm({
      nome: c.nome,
      telefone: c.telefone ?? '',
      email: c.email ?? '',
      nif: c.nif ?? '',
      endereco: c.endereco ?? '',
    })
    setDialogOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) {
      toast.error(t('clients.toasts.nameRequired'))
      return
    }
    setSaving(true)
    try {
      if (editing) {
        const update: ClienteUpdate = {
          nome: form.nome || null,
          telefone: form.telefone || null,
          email: form.email || null,
          nif: form.nif || null,
          endereco: form.endereco || null,
        }
        const updated = await clientesService.atualizar(editing.id, update)
        setClientes((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
        toast.success(t('clients.toasts.updated'))
      } else {
        const create: ClienteCreate = {
          nome: form.nome,
          telefone: form.telefone || null,
          email: form.email || null,
          nif: form.nif || null,
          endereco: form.endereco || null,
        }
        const novo = await clientesService.criar(create)
        setClientes((prev) => [novo, ...prev])
        toast.success(t('clients.toasts.created'))
      }
      setDialogOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('clients.toasts.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const filtered = clientes.filter((c) =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    (c.telefone ?? '').includes(search) ||
    (c.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (c.nif ?? '').includes(search)
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('clients.title')}</h1>
          <p className="text-muted-foreground text-sm">{t('clients.count', { count: clientes.length })}</p>
        </div>
        <Button onClick={openCreate} className="gap-2 shrink-0">
          <Plus className="size-4" />
          {t('clients.new')}
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder={t('clients.searchPlaceholder')}
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
              <TableHead>{t('common.name')}</TableHead>
              <TableHead>{t('clients.colPhone')}</TableHead>
              <TableHead>{t('clients.colEmail')}</TableHead>
              <TableHead>{t('clients.colNif')}</TableHead>
              <TableHead>{t('clients.colAddress')}</TableHead>
              <TableHead>{t('clients.colRegistered')}</TableHead>
              <TableHead className="text-right">{t('clients.colActions')}</TableHead>
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
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  {t('clients.empty')}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell>{c.telefone ?? '—'}</TableCell>
                  <TableCell>{c.email ?? '—'}</TableCell>
                  <TableCell>{c.nif ?? '—'}</TableCell>
                  <TableCell className="max-w-40 truncate">{c.endereco ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(c.criado_em), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                      <Pencil className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? t('clients.editTitle') : t('clients.newTitle')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="nome">{t('common.name')} *</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                placeholder={t('clients.namePlaceholder')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">{t('common.phone')}</Label>
              <Input
                id="telefone"
                value={form.telefone}
                onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
                placeholder={t('clients.phonePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('common.email')}</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder={t('clients.emailPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nif">{t('clients.fieldNif')}</Label>
              <Input
                id="nif"
                value={form.nif}
                onChange={(e) => setForm((f) => ({ ...f, nif: e.target.value }))}
                placeholder={t('clients.nifPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endereco">{t('common.address')}</Label>
              <Input
                id="endereco"
                value={form.endereco}
                onChange={(e) => setForm((f) => ({ ...f, endereco: e.target.value }))}
                placeholder={t('clients.addressPlaceholder')}
              />
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
    </div>
  )
}
