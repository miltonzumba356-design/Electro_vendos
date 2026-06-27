import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { authService } from '@/services/auth'
import type { UtilizadorResponse, RegisterRequest } from '@/types'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { Skeleton } from '@/app/components/ui/skeleton'
import { UserPlus, Search } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

const ROLES = ['OPERADOR', 'GESTOR'] as const

export default function UtilizadoresPage() {
  const { t } = useTranslation()
  const [utilizadores, setUtilizadores] = useState<UtilizadorResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [novoOpen, setNovoOpen] = useState(false)
  const [form, setForm] = useState<RegisterRequest>({
    nome: '',
    email: '',
    password: '',
    role: 'OPERADOR',
  })
  const [saving, setSaving] = useState(false)

  async function load() {
    try {
      const data = await authService.listarUtilizadores()
      setUtilizadores(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('users.toasts.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function handleChange(field: keyof RegisterRequest, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome || !form.email || !form.password) {
      toast.error(t('users.toasts.fillRequired'))
      return
    }
    setSaving(true)
    try {
      const novo = await authService.register(form)
      setUtilizadores((prev) => [...prev, novo])
      toast.success(t('users.toasts.created', { name: novo.nome }))
      setNovoOpen(false)
      setForm({ nome: '', email: '', password: '', role: 'OPERADOR' })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('users.toasts.createError'))
    } finally {
      setSaving(false)
    }
  }

  const filtered = utilizadores.filter(
    (u) =>
      u.nome.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('users.title')}</h1>
        <p className="text-muted-foreground text-sm">{t('users.subtitle')}</p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={t('users.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setNovoOpen(true)} className="gap-2">
          <UserPlus className="size-4" />
          {t('users.new')}
        </Button>
      </div>

      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('users.colName')}</TableHead>
              <TableHead>{t('users.colEmail')}</TableHead>
              <TableHead>{t('users.colProfile')}</TableHead>
              <TableHead>{t('users.colStatus')}</TableHead>
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
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  {t('users.empty')}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'GESTOR' ? 'default' : 'secondary'}>
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.ativo ? 'outline' : 'destructive'}>
                      {u.ativo ? t('common.active') : t('common.inactive')}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={novoOpen} onOpenChange={setNovoOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('users.newTitle')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="u-nome">{t('users.fieldFullName')} *</Label>
              <Input
                id="u-nome"
                value={form.nome}
                onChange={(e) => handleChange('nome', e.target.value)}
                placeholder={t('users.fullNamePlaceholder')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-email">{t('common.email')} *</Label>
              <Input
                id="u-email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder={t('users.emailPlaceholder')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-password">{t('users.fieldPassword')} *</Label>
              <Input
                id="u-password"
                type="password"
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder={t('users.passwordPlaceholder')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t('users.fieldProfile')}</Label>
              <Select value={form.role} onValueChange={(v) => handleChange('role', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setNovoOpen(false)} disabled={saving}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? t('users.creating') : t('users.create')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
