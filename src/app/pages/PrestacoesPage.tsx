import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { prestacoesService } from '@/services/prestacoes'
import { vendasService } from '@/services/vendas'
import type {
  PrestacaoResponse,
  VendaResponse,
  ClienteDividaResponse,
} from '@/types'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Badge } from '@/app/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
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
import { Separator } from '@/app/components/ui/separator'
import { Skeleton } from '@/app/components/ui/skeleton'
import { Progress } from '@/app/components/ui/progress'
import { Plus, Eye, CreditCard, Search, Users } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

function formatKz(value: number) {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    maximumFractionDigits: 0,
  }).format(value)
}

function situacaoBadge(situacao: string) {
  const map: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    PAGO: 'default', PENDENTE: 'outline', ATRASADO: 'destructive', PARCIAL: 'secondary',
  }
  return <Badge variant={map[situacao] ?? 'secondary'}>{situacao}</Badge>
}

/* ── Detalhes de plano ──────────────────────────────────────── */
function DetalhesDialog({
  prestacao, onPagar, onClose, t,
}: {
  prestacao: PrestacaoResponse | null
  onPagar: (id: string) => void
  onClose: () => void
  t: TFunction
}) {
  if (!prestacao) return null
  const pct = prestacao.valor_total > 0
    ? Math.round((prestacao.valor_pago / prestacao.valor_total) * 100)
    : 0

  return (
    <Dialog open={!!prestacao} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('installments.detailsTitle')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">{t('installments.detailsClient')}</p>
              <p className="font-medium">{prestacao.cliente_nome}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('installments.detailsStatus')}</p>
              {situacaoBadge(prestacao.situacao)}
            </div>
            <div>
              <p className="text-muted-foreground">{t('installments.detailsCount')}</p>
              <p className="font-medium">{prestacao.numero_prestacoes}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('installments.detailsCreated')}</p>
              <p>{format(new Date(prestacao.criado_em), 'dd/MM/yyyy')}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('installments.progress')}</span>
              <span className="font-medium">{pct}%</span>
            </div>
            <Progress value={pct} className="h-2" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
              <div className="text-center">
                <p className="text-muted-foreground text-xs">{t('common.total')}</p>
                <p className="font-semibold">{formatKz(prestacao.valor_total)}</p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground text-xs">{t('common.paid')}</p>
                <p className="font-semibold text-green-600">{formatKz(prestacao.valor_pago)}</p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground text-xs">{t('common.balance')}</p>
                <p className="font-semibold text-destructive">{formatKz(prestacao.saldo)}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-medium">{t('installments.portions')}</p>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {prestacao.pagamentos.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-1.5 px-2 rounded-md bg-muted/30 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={p.pago ? 'default' : 'outline'}
                      className="text-xs w-5 h-5 flex items-center justify-center p-0"
                    >
                      {i + 1}
                    </Badge>
                    <div>
                      <p>{formatKz(p.valor)}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('installments.due')} {format(new Date(p.data_vencimento), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {p.pago ? (
                      <div>
                        <Badge variant="default" className="text-xs">{t('common.paid')}</Badge>
                        {p.data_pagamento && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(new Date(p.data_pagamento), 'dd/MM/yyyy')}
                          </p>
                        )}
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-xs">{t('common.pending')}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {prestacao.saldo > 0 && (
            <Button className="w-full gap-2" onClick={() => onPagar(prestacao.id)}>
              <CreditCard className="size-4" />
              {t('installments.registerPayment')}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ── Registar pagamento dialog ──────────────────────────────── */
function PagamentoDialog({
  prestacaoId, onSuccess, onClose, t,
}: {
  prestacaoId: string | null
  onSuccess: (updated: PrestacaoResponse) => void
  onClose: () => void
  t: TFunction
}) {
  const [valor, setValor] = useState('')
  const [data, setData] = useState(new Date().toISOString().slice(0, 16))
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!prestacaoId || !valor || Number(valor) <= 0) {
      toast.error(t('installments.toasts.invalidValue'))
      return
    }
    setSaving(true)
    try {
      const updated = await prestacoesService.registarPagamento(prestacaoId, {
        valor: Number(valor),
        data_pagamento: new Date(data).toISOString(),
      })
      onSuccess(updated)
      toast.success(t('installments.toasts.paymentRegistered'))
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('installments.toasts.paymentError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!prestacaoId} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('installments.paymentTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="valor">{t('installments.fieldValue')} *</Label>
            <Input
              id="valor"
              type="number"
              min="0.01"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder={t('installments.valuePlaceholder')}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="data_pag">{t('installments.fieldPaymentDate')} *</Label>
            <Input
              id="data_pag"
              type="datetime-local"
              value={data}
              onChange={(e) => setData(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? t('common.registering') : t('common.register')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ── Planos tab ─────────────────────────────────────────────── */
function PlanosTab({ t }: { t: TFunction }) {
  const [prestacoes, setPrestacoes] = useState<PrestacaoResponse[]>([])
  const [vendas, setVendas] = useState<VendaResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [novoOpen, setNovoOpen] = useState(false)
  const [vendaId, setVendaId] = useState('')
  const [numPrestacoes, setNumPrestacoes] = useState('6')
  const [saving, setSaving] = useState(false)

  const [detalhes, setDetalhes] = useState<PrestacaoResponse | null>(null)
  const [pagarId, setPagarId] = useState<string | null>(null)

  async function load() {
    try {
      const [p, v] = await Promise.allSettled([
        prestacoesService.listar(),
        vendasService.listar(),
      ])
      if (p.status === 'fulfilled') setPrestacoes(p.value)
      if (v.status === 'fulfilled') setVendas(v.value)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('installments.toasts.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!vendaId) { toast.error(t('installments.toasts.selectSale')); return }
    const n = Number(numPrestacoes)
    if (n < 1 || n > 48) { toast.error(t('installments.toasts.invalidInstallments')); return }
    setSaving(true)
    try {
      const novo = await prestacoesService.criar({ venda_id: vendaId, numero_prestacoes: n })
      setPrestacoes((prev) => [novo, ...prev])
      toast.success(t('installments.toasts.planCreated'))
      setNovoOpen(false)
      setVendaId('')
      setNumPrestacoes('6')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('installments.toasts.planCreateError'))
    } finally {
      setSaving(false)
    }
  }

  function handlePagarSuccess(updated: PrestacaoResponse) {
    setPrestacoes((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    if (detalhes?.id === updated.id) setDetalhes(updated)
    setPagarId(null)
  }

  const filtered = prestacoes
    .filter((p) => p.cliente_nome.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={t('installments.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setNovoOpen(true)} className="gap-2">
          <Plus className="size-4" />
          {t('installments.newPlan')}
        </Button>
      </div>

      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('installments.colClient')}</TableHead>
              <TableHead>{t('installments.colInstallments')}</TableHead>
              <TableHead className="text-right">{t('installments.colTotal')}</TableHead>
              <TableHead className="text-right">{t('installments.colPaid')}</TableHead>
              <TableHead className="text-right">{t('installments.colBalance')}</TableHead>
              <TableHead>{t('installments.colStatus')}</TableHead>
              <TableHead>{t('installments.colDate')}</TableHead>
              <TableHead className="text-right">{t('installments.colActions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  {t('installments.empty')}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.cliente_nome}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{p.numero_prestacoes}x</Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatKz(p.valor_total)}</TableCell>
                  <TableCell className="text-right text-green-600">{formatKz(p.valor_pago)}</TableCell>
                  <TableCell className="text-right font-medium text-destructive">
                    {formatKz(p.saldo)}
                  </TableCell>
                  <TableCell>{situacaoBadge(p.situacao)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(p.criado_em), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setDetalhes(p)}>
                        <Eye className="size-4" />
                      </Button>
                      {p.saldo > 0 && (
                        <Button variant="ghost" size="icon" onClick={() => setPagarId(p.id)}>
                          <CreditCard className="size-4 text-primary" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Novo plano dialog */}
      <Dialog open={novoOpen} onOpenChange={setNovoOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('installments.newPlanTitle')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>{t('installments.fieldSale')} *</Label>
              <Select value={vendaId} onValueChange={setVendaId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('installments.selectSale')} />
                </SelectTrigger>
                <SelectContent>
                  {vendas.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.cliente_nome} — {formatKz(v.total_final)} ({format(new Date(v.criado_em), 'dd/MM/yyyy')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="num">{t('installments.fieldNumInstallments')} *</Label>
              <Input
                id="num"
                type="number"
                min="1"
                max="48"
                value={numPrestacoes}
                onChange={(e) => setNumPrestacoes(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setNovoOpen(false)} disabled={saving}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? t('common.creating') : t('installments.createPlan')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <DetalhesDialog
        prestacao={detalhes}
        onPagar={(id) => { setDetalhes(null); setPagarId(id) }}
        onClose={() => setDetalhes(null)}
        t={t}
      />

      <PagamentoDialog
        prestacaoId={pagarId}
        onSuccess={handlePagarSuccess}
        onClose={() => setPagarId(null)}
        t={t}
      />
    </div>
  )
}

/* ── Dívidas tab — mostra todos os clientes com dívidas em aberto ── */
function DividasTab({ t }: { t: TFunction }) {
  const [prestacoes, setPrestacoes] = useState<PrestacaoResponse[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [detalhe, setDetalhe]       = useState<ClienteDividaResponse | null>(null)
  const [loadingDetalhe, setLoadingDetalhe] = useState(false)

  useEffect(() => {
    prestacoesService.listar()
      .then(setPrestacoes)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  /* Agrega prestações por cliente — só mostra quem tem saldo > 0 */
  const clientesComDivida = useMemo(() => {
    const map = new Map<string, {
      id: string; nome: string
      total: number; pago: number; saldo: number; count: number
    }>()
    for (const p of prestacoes) {
      if (!map.has(p.cliente_id)) {
        map.set(p.cliente_id, { id: p.cliente_id, nome: p.cliente_nome, total: 0, pago: 0, saldo: 0, count: 0 })
      }
      const entry = map.get(p.cliente_id)!
      entry.total += p.valor_total
      entry.pago  += p.valor_pago
      entry.saldo += p.saldo
      entry.count += 1
    }
    return [...map.values()]
      .filter(c => c.saldo > 0)
      .sort((a, b) => b.saldo - a.saldo)
  }, [prestacoes])

  const filtrados = useMemo(() => {
    if (!search) return clientesComDivida
    const q = search.toLowerCase()
    return clientesComDivida.filter(c => c.nome.toLowerCase().includes(q))
  }, [clientesComDivida, search])

  async function handleVerDetalhe(clienteId: string) {
    setLoadingDetalhe(true)
    try {
      const data = await prestacoesService.dividasCliente(clienteId)
      setDetalhe(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('installments.toasts.debtError'))
    } finally {
      setLoadingDetalhe(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Barra de pesquisa */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder={t('installments.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabela de todos os clientes com dívidas */}
      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('installments.colClient')}</TableHead>
              <TableHead className="text-center">{t('installments.totalDebts')}</TableHead>
              <TableHead className="text-right">{t('installments.totalOwed')}</TableHead>
              <TableHead className="text-right">{t('installments.totalPaid')}</TableHead>
              <TableHead className="text-right">{t('installments.openBalance')}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="size-8 opacity-30" />
                    <p>{t('installments.empty')}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtrados.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => handleVerDetalhe(c.id)}
                >
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{c.count}x</Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatKz(c.total)}</TableCell>
                  <TableCell className="text-right text-green-600">{formatKz(c.pago)}</TableCell>
                  <TableCell className="text-right font-semibold text-destructive">{formatKz(c.saldo)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" disabled={loadingDetalhe}>
                      <Eye className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog detalhe do cliente seleccionado */}
      <Dialog open={!!detalhe} onOpenChange={() => setDetalhe(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="size-4" />
              {detalhe?.cliente_nome}
            </DialogTitle>
          </DialogHeader>
          {detalhe && (
            <div className="space-y-4 pt-2">
              {/* Resumo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: t('installments.totalDebts'),  value: String(detalhe.total_dividas),         hi: false },
                  { label: t('installments.totalOwed'),   value: formatKz(detalhe.valor_total_devido),  hi: false },
                  { label: t('installments.totalPaid'),   value: formatKz(detalhe.valor_total_pago),    hi: false },
                  { label: t('installments.openBalance'), value: formatKz(detalhe.saldo_aberto),        hi: detalhe.saldo_aberto > 0 },
                ].map(({ label, value, hi }) => (
                  <Card key={label}>
                    <CardHeader className="pb-1 pt-4 px-4">
                      <CardTitle className="text-xs text-muted-foreground">{label}</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4 px-4">
                      <p className={`text-lg font-bold ${hi ? 'text-destructive' : ''}`}>{value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Planos do cliente */}
              {detalhe.prestacoes.length > 0 && (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('installments.colInstallments')}</TableHead>
                        <TableHead className="text-right">{t('installments.colTotal')}</TableHead>
                        <TableHead className="text-right">{t('installments.colPaid')}</TableHead>
                        <TableHead className="text-right">{t('installments.colBalance')}</TableHead>
                        <TableHead>{t('installments.colStatus')}</TableHead>
                        <TableHead>{t('installments.colDate')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detalhe.prestacoes.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell><Badge variant="secondary">{p.numero_prestacoes}x</Badge></TableCell>
                          <TableCell className="text-right">{formatKz(p.valor_total)}</TableCell>
                          <TableCell className="text-right text-green-600">{formatKz(p.valor_pago)}</TableCell>
                          <TableCell className="text-right font-medium text-destructive">{formatKz(p.saldo)}</TableCell>
                          <TableCell>{situacaoBadge(p.situacao)}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(p.criado_em), 'dd/MM/yyyy')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ── Main Page ──────────────────────────────────────────────── */
export default function PrestacoesPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('installments.title')}</h1>
        <p className="text-muted-foreground text-sm">{t('installments.subtitle')}</p>
      </div>

      <Tabs defaultValue="planos">
        <TabsList>
          <TabsTrigger value="planos">{t('installments.tabPlans')}</TabsTrigger>
          <TabsTrigger value="dividas">{t('installments.tabDebts')}</TabsTrigger>
        </TabsList>
        <div className="mt-4">
          <TabsContent value="planos"><PlanosTab t={t} /></TabsContent>
          <TabsContent value="dividas"><DividasTab t={t} /></TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
