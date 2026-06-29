import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { faturasService } from '@/services/faturas'
import { clientesService } from '@/services/clientes'
import type {
  FaturaResumida,
  FaturaResponse,
  FaturaItemCreate,
  ClienteResponse,
  PerformanceResponse,
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
import { Separator } from '@/app/components/ui/separator'
import { Skeleton } from '@/app/components/ui/skeleton'
import { Combobox } from '@/app/components/ui/combobox'
import {
  Plus,
  Eye,
  XCircle,
  Trash2,
  RefreshCw,
  FileText,
  TrendingUp,
  Users,
  DollarSign,
  Percent,
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

function formatKz(v: number) {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    maximumFractionDigits: 0,
  }).format(v)
}

function statusBadge(cancelada_em: string | null) {
  return cancelada_em
    ? <Badge variant="destructive">Cancelada</Badge>
    : <Badge variant="default" className="bg-green-600 hover:bg-green-700">Activa</Badge>
}

/* ── Detalhe de fatura ──────────────────────────────────────── */
function FaturaDetalheDialog({
  fatura, onCancelar, onClose, t,
}: {
  fatura: FaturaResponse | null
  onCancelar: (id: string) => void
  onClose: () => void
  t: TFunction
}) {
  if (!fatura) return null
  return (
    <Dialog open={!!fatura} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('invoices.detailTitle')} #{fatura.numero}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">{t('common.client')}</p>
              <p className="font-medium">{fatura.cliente_nome}</p>
            </div>
            <div>
              <p className="text-muted-foreground">NIF</p>
              <p>{fatura.cliente_nif || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('invoices.colDate')}</p>
              <p>{format(new Date(fatura.emitida_em), 'dd/MM/yyyy HH:mm')}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('invoices.colStatus')}</p>
              {statusBadge(fatura.cancelada_em)}
            </div>
          </div>

          <Separator />

          <div className="space-y-1">
            <p className="text-sm font-medium">{t('invoices.items')}</p>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('invoices.itemName')}</TableHead>
                    <TableHead className="text-center">{t('invoices.itemQty')}</TableHead>
                    <TableHead className="text-right">{t('invoices.itemPrice')}</TableHead>
                    <TableHead className="text-center">IVA</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fatura.itens.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.produto_nome}</TableCell>
                      <TableCell className="text-center">{item.quantidade}</TableCell>
                      <TableCell className="text-right">{formatKz(item.preco_unitario)}</TableCell>
                      <TableCell className="text-center">{item.iva}%</TableCell>
                      <TableCell className="text-right">{formatKz(item.subtotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('invoices.subtotalNoIva')}</span>
              <span>{formatKz(fatura.total_sem_iva)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('invoices.totalIva')}</span>
              <span>{formatKz(fatura.total_iva)}</span>
            </div>
            {fatura.total_desconto > 0 && (
              <div className="flex justify-between text-destructive">
                <span>{t('invoices.totalDiscount')}</span>
                <span>-{formatKz(fatura.total_desconto)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-base">
              <span>{t('invoices.totalFinal')}</span>
              <span>{formatKz(fatura.total_final)}</span>
            </div>
          </div>

          {!fatura.cancelada_em && (
            <Button
              variant="destructive"
              className="w-full gap-2"
              onClick={() => onCancelar(fatura.id)}
            >
              <XCircle className="size-4" />
              {t('invoices.cancel')}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ── Nova Fatura dialog ─────────────────────────────────────── */
function NovaFaturaDialog({
  clientes, onSuccess, onClose, t,
}: {
  clientes: ClienteResponse[]
  onSuccess: (f: FaturaResponse) => void
  onClose: () => void
  t: TFunction
}) {
  const [clienteId, setClienteId] = useState('')
  const [desconto, setDesconto] = useState('')
  const [itens, setItens] = useState<FaturaItemCreate[]>([
    { produto_nome: '', quantidade: 1, preco_unitario: 0, iva: 14 },
  ])
  const [saving, setSaving] = useState(false)

  function addItem() {
    setItens((prev) => [...prev, { produto_nome: '', quantidade: 1, preco_unitario: 0, iva: 14 }])
  }

  function removeItem(i: number) {
    setItens((prev) => prev.filter((_, idx) => idx !== i))
  }

  function updateItem(i: number, field: keyof FaturaItemCreate, val: string | number) {
    setItens((prev) => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item))
  }

  const totalSemIva = itens.reduce((s, item) => s + item.quantidade * item.preco_unitario, 0)
  const totalIva = itens.reduce((s, item) => s + item.quantidade * item.preco_unitario * (item.iva ?? 0) / 100, 0)
  const descontoVal = desconto ? totalSemIva * Number(desconto) / 100 : 0
  const totalFinal = totalSemIva + totalIva - descontoVal

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clienteId) { toast.error(t('invoices.toasts.selectClient')); return }
    if (itens.some((i) => !i.produto_nome || i.preco_unitario <= 0)) {
      toast.error(t('invoices.toasts.invalidItems'))
      return
    }
    setSaving(true)
    try {
      const nova = await faturasService.criar({
        cliente_id: clienteId,
        itens,
        desconto_percentual: desconto ? Number(desconto) : null,
      })
      toast.success(t('invoices.toasts.created'))
      onSuccess(nova)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('invoices.toasts.createError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('invoices.newTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('common.client')} *</Label>
              <Combobox
                options={clientes.map((c) => ({ value: c.id, label: c.nome }))}
                value={clienteId}
                onValueChange={setClienteId}
                placeholder={t('sales.selectClient')}
                searchPlaceholder={t('common.search')}
                emptyText={t('clients.empty')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">{t('invoices.fieldDiscount')} (%)</Label>
              <Input
                id="desc"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={desconto}
                onChange={(e) => setDesconto(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{t('invoices.items')}</p>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1">
                <Plus className="size-3" /> {t('invoices.addItem')}
              </Button>
            </div>

            {itens.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-12 sm:col-span-4">
                  {i === 0 && <Label className="text-xs mb-1 block">{t('invoices.itemName')}</Label>}
                  <Input
                    value={item.produto_nome}
                    onChange={(e) => updateItem(i, 'produto_nome', e.target.value)}
                    placeholder={t('invoices.itemNamePlaceholder')}
                    required
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  {i === 0 && <Label className="text-xs mb-1 block">{t('invoices.itemQty')}</Label>}
                  <Input
                    type="number"
                    min="1"
                    value={item.quantidade}
                    onChange={(e) => updateItem(i, 'quantidade', Number(e.target.value))}
                    required
                  />
                </div>
                <div className="col-span-4 sm:col-span-3">
                  {i === 0 && <Label className="text-xs mb-1 block">{t('invoices.itemPrice')}</Label>}
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.preco_unitario}
                    onChange={(e) => updateItem(i, 'preco_unitario', Number(e.target.value))}
                    required
                  />
                </div>
                <div className="col-span-3 sm:col-span-2">
                  {i === 0 && <Label className="text-xs mb-1 block">IVA (%)</Label>}
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={item.iva ?? 14}
                    onChange={(e) => updateItem(i, 'iva', Number(e.target.value))}
                  />
                </div>
                <div className={`col-span-1 flex ${i === 0 ? 'mt-5' : ''}`}>
                  {itens.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(i)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>{t('invoices.subtotalNoIva')}</span>
              <span>{formatKz(totalSemIva)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>IVA</span>
              <span>{formatKz(totalIva)}</span>
            </div>
            {descontoVal > 0 && (
              <div className="flex justify-between text-destructive">
                <span>{t('invoices.totalDiscount')} ({desconto}%)</span>
                <span>-{formatKz(descontoVal)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-1">
              <span>{t('invoices.totalFinal')}</span>
              <span>{formatKz(totalFinal)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? t('common.creating') : t('invoices.emit')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ── Lista de Faturas ───────────────────────────────────────── */
function FaturasTab({ clientes, t }: { clientes: ClienteResponse[]; t: TFunction }) {
  const [faturas, setFaturas] = useState<FaturaResumida[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [novaOpen, setNovaOpen] = useState(false)
  const [detalheFatura, setDetalheFatura] = useState<FaturaResponse | null>(null)
  const [loadingDetalhe, setLoadingDetalhe] = useState(false)

  const [filtroCliente, setFiltroCliente] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  async function load() {
    setLoading(true)
    try {
      const res = await faturasService.listar({
        cliente_id: filtroCliente || null,
        data_inicio: dataInicio || null,
        data_fim: dataFim || null,
        limit: 100,
      })
      setFaturas(res.faturas)
      setTotal(res.total)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function verDetalhe(id: string) {
    setLoadingDetalhe(true)
    try {
      const f = await faturasService.buscar(id)
      setDetalheFatura(f)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.loadError'))
    } finally {
      setLoadingDetalhe(false)
    }
  }

  async function handleCancelar(id: string) {
    try {
      await faturasService.cancelar(id)
      toast.success(t('invoices.toasts.cancelled'))
      setDetalheFatura(null)
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('invoices.toasts.cancelError'))
    }
  }

  function handleNovaSucesso(nova: FaturaResponse) {
    setNovaOpen(false)
    load()
    setDetalheFatura(nova)
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1 min-w-[180px]">
          <Label>{t('common.client')}</Label>
          <Combobox
            options={[
              { value: '', label: t('invoices.allClients') },
              ...clientes.map((c) => ({ value: c.id, label: c.nome })),
            ]}
            value={filtroCliente}
            onValueChange={setFiltroCliente}
            placeholder={t('invoices.allClients')}
            searchPlaceholder={t('sales.searchClient')}
            emptyText={t('sales.noClient')}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="fi">{t('invoices.dateFrom')}</Label>
          <Input id="fi" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-36" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ff">{t('invoices.dateTo')}</Label>
          <Input id="ff" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-36" />
        </div>
        <Button variant="outline" onClick={load} className="gap-2">
          <RefreshCw className="size-4" /> {t('common.filter')}
        </Button>
        <div className="flex-1" />
        <Button onClick={() => setNovaOpen(true)} className="gap-2">
          <Plus className="size-4" /> {t('invoices.new')}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">{total} {t('invoices.totalCount')}</p>

      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('invoices.colNumber')}</TableHead>
              <TableHead>{t('common.client')}</TableHead>
              <TableHead>{t('invoices.colItems')}</TableHead>
              <TableHead className="text-right">{t('invoices.totalFinal')}</TableHead>
              <TableHead>{t('invoices.colDate')}</TableHead>
              <TableHead>{t('invoices.colStatus')}</TableHead>
              <TableHead className="text-right">{t('common.actions')}</TableHead>
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
            ) : faturas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="size-8 opacity-30" />
                    {t('invoices.empty')}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              faturas.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-mono font-medium">{f.numero}</TableCell>
                  <TableCell className="font-medium">{f.cliente_nome}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{f.total_itens}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{formatKz(f.total_final)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(f.emitida_em), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                  <TableCell>{statusBadge(f.cancelada_em)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => verDetalhe(f.id)}
                      disabled={loadingDetalhe}
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

      {novaOpen && (
        <NovaFaturaDialog
          clientes={clientes}
          onSuccess={handleNovaSucesso}
          onClose={() => setNovaOpen(false)}
          t={t}
        />
      )}

      <FaturaDetalheDialog
        fatura={detalheFatura}
        onCancelar={handleCancelar}
        onClose={() => setDetalheFatura(null)}
        t={t}
      />
    </div>
  )
}

/* ── Estatísticas / Performance ─────────────────────────────── */
function EstatisticasTab({ t }: { t: TFunction }) {
  const [perf, setPerf] = useState<PerformanceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  async function load() {
    setLoading(true)
    try {
      const res = await faturasService.performance(dataInicio || undefined, dataFim || undefined)
      setPerf(res)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor="pi">{t('invoices.dateFrom')}</Label>
          <Input id="pi" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-36" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="pf">{t('invoices.dateTo')}</Label>
          <Input id="pf" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-36" />
        </div>
        <Button variant="outline" onClick={load} className="gap-2">
          <RefreshCw className="size-4" /> {t('common.filter')}
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-8 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : perf ? (
        <>
          {/* Resumo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: FileText,   label: t('invoices.statEmitted'),    value: String(perf.resumo.total_emitidas)   },
              { icon: XCircle,    label: t('invoices.statCancelled'),   value: String(perf.resumo.total_canceladas) },
              { icon: TrendingUp, label: t('invoices.statActive'),      value: String(perf.resumo.total_ativas)     },
              { icon: Percent,    label: t('invoices.statCancelRate'),  value: `${perf.resumo.taxa_cancelamento.toFixed(1)}%` },
            ].map(({ icon: Icon, label, value }) => (
              <Card key={label}>
                <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
                  <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
                  <Icon className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="pb-4 px-4">
                  <p className="text-2xl font-bold">{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Valores */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: DollarSign, label: t('invoices.statTotalBilled'),  value: formatKz(perf.valores.total_faturado)    },
              { icon: DollarSign, label: t('invoices.statAvgInvoice'),   value: formatKz(perf.valores.media_por_fatura)  },
              { icon: DollarSign, label: t('invoices.statLargest'),      value: formatKz(perf.valores.maior_fatura)      },
            ].map(({ icon: Icon, label, value }) => (
              <Card key={label}>
                <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
                  <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
                  <Icon className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="pb-4 px-4">
                  <p className="text-xl font-bold">{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Top Clientes */}
          {perf.top_clientes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="size-4" /> {t('invoices.topClients')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {perf.top_clientes.map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-sm py-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="w-6 h-6 flex items-center justify-center p-0 text-xs">
                          {i + 1}
                        </Badge>
                        <span className="font-medium">{c.cliente_nome}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatKz(c.total_faturado)}</p>
                        <p className="text-xs text-muted-foreground">{c.faturas} {t('invoices.invoicesCount')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}
    </div>
  )
}

/* ── Main Page ──────────────────────────────────────────────── */
export default function FaturasPage() {
  const { t } = useTranslation()
  const [clientes, setClientes] = useState<ClienteResponse[]>([])

  useEffect(() => {
    clientesService.listar().then(setClientes).catch(() => {})
  }, [])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('invoices.title')}</h1>
        <p className="text-muted-foreground text-sm">{t('invoices.subtitle')}</p>
      </div>

      <Tabs defaultValue="faturas">
        <TabsList>
          <TabsTrigger value="faturas">{t('invoices.tabList')}</TabsTrigger>
          <TabsTrigger value="stats">{t('invoices.tabStats')}</TabsTrigger>
        </TabsList>
        <div className="mt-4">
          <TabsContent value="faturas">
            <FaturasTab clientes={clientes} t={t} />
          </TabsContent>
          <TabsContent value="stats">
            <EstatisticasTab t={t} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
