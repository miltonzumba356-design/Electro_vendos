import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { TrendingUp, TrendingDown, Wallet, RefreshCw, Plus, BarChart2 } from 'lucide-react'
import { fluxoCaixaService } from '@/services/fluxoCaixa'
import type {
  LancamentoResponse,
  SaldoResponse,
  DemonstrativoResponse,
  CategoriaGrupoResponse,
} from '@/types'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'

const formatKz = (v: number) =>
  new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(v)

const CATEGORIAS_ENTRADA = ['VENDA', 'RECEBIMENTO_PRESTACAO', 'OUTRO_ENTRADA']
const CATEGORIAS_SAIDA   = ['SALARIO', 'RENDA', 'ENERGIA', 'COMPRA_STOCK', 'OUTRO_SAIDA']

function tipoVariant(tipo: string): 'default' | 'destructive' {
  return tipo === 'ENTRADA' ? 'default' : 'destructive'
}

/* ── Saldo cards ──────────────────────────────────────────── */
function SaldoCards({ saldo, t }: { saldo: SaldoResponse | null; t: TFunction }) {
  if (!saldo) return null
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Wallet className="size-4" /> {t('cashflow.currentBalance')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatKz(saldo.saldo_atual)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="size-4 text-green-500" /> {t('cashflow.totalIn')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-green-600">{formatKz(saldo.total_entradas)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingDown className="size-4 text-red-500" /> {t('cashflow.totalOut')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-red-600">{formatKz(saldo.total_saidas)}</p>
        </CardContent>
      </Card>
    </div>
  )
}

/* ── Novo lançamento dialog ───────────────────────────────── */
function NovoLancamentoDialog({
  open, onClose, onCreated, t,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
  t: TFunction
}) {
  const [tipo, setTipo]           = useState<'ENTRADA' | 'SAIDA'>('ENTRADA')
  const [categoria, setCategoria] = useState('')
  const [valor, setValor]         = useState('')
  const [descricao, setDescricao] = useState('')
  const [data, setData]           = useState(format(new Date(), 'yyyy-MM-dd'))
  const [loading, setLoading]     = useState(false)

  const categorias = tipo === 'ENTRADA' ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!categoria || !valor || !descricao || !data) {
      toast.error(t('cashflow.toasts.fillAll'))
      return
    }
    const valorNum = parseFloat(valor)
    if (isNaN(valorNum) || valorNum <= 0) {
      toast.error(t('cashflow.toasts.invalidValue'))
      return
    }
    setLoading(true)
    try {
      await fluxoCaixaService.criarLancamento({
        tipo, categoria, valor: valorNum, descricao, data_movimento: data,
      })
      toast.success(t('cashflow.toasts.registered'))
      onCreated()
      onClose()
      setValor(''); setDescricao(''); setCategoria('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('cashflow.toasts.registerError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('cashflow.newEntryTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('cashflow.fieldType')}</Label>
              <Select value={tipo} onValueChange={(v) => { setTipo(v as 'ENTRADA' | 'SAIDA'); setCategoria('') }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENTRADA">{t('cashflow.typeIn')}</SelectItem>
                  <SelectItem value="SAIDA">{t('cashflow.typeOut')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('cashflow.fieldDate')}</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('cashflow.fieldCategory')}</Label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger><SelectValue placeholder={t('cashflow.categorySelect')} /></SelectTrigger>
              <SelectContent>
                {categorias.map((c) => (
                  <SelectItem key={c} value={c}>{c.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('cashflow.fieldDesc')}</Label>
            <Input
              placeholder={t('cashflow.descPlaceholder')}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>{t('cashflow.fieldValue')}</Label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('cashflow.saving') : t('cashflow.register')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ── Aba Extrato ──────────────────────────────────────────── */
function ExtratoTab({ t }: { t: TFunction }) {
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim]       = useState('')
  const [categoria, setCategoria]   = useState('')
  const [lancamentos, setLancamentos] = useState<LancamentoResponse[]>([])
  const [totais, setTotais] = useState({ total_lancamentos: 0, total_entradas: 0, total_saidas: 0, saldo_periodo: 0 })
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (dataInicio) params.data_inicio = dataInicio
      if (dataFim)    params.data_fim    = dataFim
      if (categoria)  params.categoria   = categoria
      const res = await fluxoCaixaService.listarLancamentos(params)
      setLancamentos(res.lancamentos)
      setTotais({
        total_lancamentos: res.total_lancamentos,
        total_entradas: res.total_entradas,
        total_saidas: res.total_saidas,
        saldo_periodo: res.saldo_periodo,
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('cashflow.toasts.loadError'))
    } finally {
      setLoading(false)
    }
  }, [dataInicio, dataFim, categoria])

  useEffect(() => { carregar() }, [carregar])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs">{t('cashflow.filterStart')}</Label>
          <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-full sm:w-40" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t('cashflow.filterEnd')}</Label>
          <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-full sm:w-40" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t('cashflow.filterCategory')}</Label>
          <Select value={categoria || '__all__'} onValueChange={(v) => setCategoria(v === '__all__' ? '' : v)}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">{t('cashflow.filterAll')}</SelectItem>
              {[...CATEGORIAS_ENTRADA, ...CATEGORIAS_SAIDA].map((c) => (
                <SelectItem key={c} value={c}>{c.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={carregar} disabled={loading}>
          <RefreshCw className="size-4 mr-1" /> {t('cashflow.refresh')}
        </Button>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="size-4 mr-1" /> {t('cashflow.newEntry')}
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t('cashflow.totalEntries'), value: totais.total_lancamentos.toString(), color: '' },
          { label: t('cashflow.periodIn'),      value: formatKz(totais.total_entradas),    color: 'text-green-600' },
          { label: t('cashflow.periodOut'),     value: formatKz(totais.total_saidas),      color: 'text-red-600' },
          { label: t('cashflow.periodBalance'), value: formatKz(totais.saldo_periodo),     color: totais.saldo_periodo >= 0 ? 'text-green-600' : 'text-red-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-sm font-semibold mt-0.5 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('cashflow.colDate')}</TableHead>
              <TableHead>{t('cashflow.colDescription')}</TableHead>
              <TableHead>{t('cashflow.colCategory')}</TableHead>
              <TableHead>{t('cashflow.colType')}</TableHead>
              <TableHead className="text-right">{t('cashflow.colValue')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {t('cashflow.loading')}
                </TableCell>
              </TableRow>
            ) : lancamentos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {t('cashflow.empty')}
                </TableCell>
              </TableRow>
            ) : (
              lancamentos.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-sm">{l.data_movimento}</TableCell>
                  <TableCell className="max-w-xs truncate">{l.descricao}</TableCell>
                  <TableCell>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{l.categoria.replace(/_/g, ' ')}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={tipoVariant(l.tipo)} className="text-xs">{l.tipo}</Badge>
                  </TableCell>
                  <TableCell className={`text-right font-medium text-sm ${l.tipo === 'ENTRADA' ? 'text-green-600' : 'text-red-600'}`}>
                    {l.tipo === 'SAIDA' ? '-' : ''}{formatKz(l.valor)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <NovoLancamentoDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={carregar}
        t={t}
      />
    </div>
  )
}

/* ── Aba Demonstrativo ───────────────────────────────────── */
function CategoriaTable({ title, rows, t }: { title: string; rows: CategoriaGrupoResponse[]; t: TFunction }) {
  return (
    <div>
      <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">{title}</h4>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('cashflow.colCategory')}</TableHead>
              <TableHead className="text-center">{t('cashflow.colQty')}</TableHead>
              <TableHead className="text-right">{t('common.total')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                  {t('cashflow.empty')}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.categoria}>
                  <TableCell className="font-medium text-sm">{r.categoria.replace(/_/g, ' ')}</TableCell>
                  <TableCell className="text-center text-sm">{r.quantidade}</TableCell>
                  <TableCell className="text-right text-sm font-medium">{formatKz(r.total)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function DemonstrativoTab({ t }: { t: TFunction }) {
  const hoje = format(new Date(), 'yyyy-MM-dd')
  const inicioMes = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')
  const [dataInicio, setDataInicio] = useState(inicioMes)
  const [dataFim, setDataFim]       = useState(hoje)
  const [demo, setDemo]             = useState<DemonstrativoResponse | null>(null)
  const [loading, setLoading]       = useState(false)

  async function carregar() {
    if (!dataInicio || !dataFim) {
      toast.error(t('cashflow.toasts.selectPeriod'))
      return
    }
    setLoading(true)
    try {
      const res = await fluxoCaixaService.demonstrativo(dataInicio, dataFim)
      setDemo(res)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('cashflow.toasts.statementError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs">{t('cashflow.filterStart')}</Label>
          <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-full sm:w-40" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t('cashflow.filterEnd')}</Label>
          <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-full sm:w-40" />
        </div>
        <Button variant="outline" size="sm" onClick={carregar} disabled={loading}>
          <BarChart2 className="size-4 mr-1" /> {t('cashflow.generate')}
        </Button>
      </div>

      {demo && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-xs text-green-700 font-medium">{t('cashflow.statementIn')}</p>
              <p className="text-xl font-bold text-green-700 mt-1">{formatKz(demo.total_entradas)}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-xs text-red-700 font-medium">{t('cashflow.statementOut')}</p>
              <p className="text-xl font-bold text-red-700 mt-1">{formatKz(demo.total_saidas)}</p>
            </div>
            <div className={`border rounded-lg p-4 text-center ${demo.saldo_final >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
              <p className={`text-xs font-medium ${demo.saldo_final >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                {t('cashflow.statementBalance')}
              </p>
              <p className={`text-xl font-bold mt-1 ${demo.saldo_final >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                {formatKz(demo.saldo_final)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CategoriaTable title={t('cashflow.inByCategory')} rows={demo.entradas} t={t} />
            <CategoriaTable title={t('cashflow.outByCategory')} rows={demo.saidas} t={t} />
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Aba Sincronizar ─────────────────────────────────────── */
function SincronizarTab({ t }: { t: TFunction }) {
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<{ total_sincronizados: number; sincronizados: Record<string, number> } | null>(null)

  async function handleSync() {
    setLoading(true)
    try {
      const res = await fluxoCaixaService.sincronizar()
      setResultado(res)
      toast.success(t('cashflow.syncResult', { count: res.total_sincronizados }))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('cashflow.toasts.syncError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div className="bg-muted/40 rounded-lg p-4 text-sm text-muted-foreground leading-relaxed">
        <p className="font-medium text-foreground mb-1">{t('cashflow.syncWhat')}</p>
        {t('cashflow.syncInfo')}
      </div>

      <Button onClick={handleSync} disabled={loading} className="w-full sm:w-auto">
        <RefreshCw className={`size-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
        {loading ? t('cashflow.syncing') : t('cashflow.syncButton')}
      </Button>

      {resultado && (
        <div className="border rounded-lg p-4 space-y-3">
          <p className="font-semibold text-sm">
            {t('cashflow.syncResult', { count: resultado.total_sincronizados })}
          </p>
          <div className="divide-y text-sm">
            {Object.entries(resultado.sincronizados).map(([k, v]) => (
              <div key={k} className="flex justify-between py-2">
                <span className="text-muted-foreground capitalize">{k.replace(/_/g, ' ')}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Page ────────────────────────────────────────────────── */
export default function FluxoCaixaPage() {
  const { t } = useTranslation()
  const [saldo, setSaldo] = useState<SaldoResponse | null>(null)

  useEffect(() => {
    fluxoCaixaService.saldo()
      .then(setSaldo)
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('cashflow.title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('cashflow.subtitle')}</p>
      </div>

      <SaldoCards saldo={saldo} t={t} />

      <Tabs defaultValue="extrato">
        <TabsList>
          <TabsTrigger value="extrato">{t('cashflow.tabExtract')}</TabsTrigger>
          <TabsTrigger value="demonstrativo">{t('cashflow.tabStatement')}</TabsTrigger>
          <TabsTrigger value="sincronizar">{t('cashflow.tabSync')}</TabsTrigger>
        </TabsList>

        <TabsContent value="extrato" className="mt-4">
          <ExtratoTab t={t} />
        </TabsContent>
        <TabsContent value="demonstrativo" className="mt-4">
          <DemonstrativoTab t={t} />
        </TabsContent>
        <TabsContent value="sincronizar" className="mt-4">
          <SincronizarTab t={t} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
