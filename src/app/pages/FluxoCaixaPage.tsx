import { useState, useEffect, useCallback, useMemo, Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  TrendingUp, TrendingDown, Wallet, RefreshCw, Plus, ChevronDown, ChevronRight,
} from 'lucide-react'
import { fluxoCaixaService } from '@/services/fluxoCaixa'
import { vendasService } from '@/services/vendas'
import type {
  LancamentoResponse,
  SaldoResponse,
  VendaResponse,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { TablePagination } from '@/app/components/ui/table-pagination'
import { usePagination } from '@/lib/usePagination'

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

const SEM_CLIENTE = '__sem_cliente__'

interface GrupoCliente {
  chave: string
  nome: string
  lancamentos: LancamentoResponse[]
  totalEntradas: number
  totalSaidas: number
}

/* ── Extrato ──────────────────────────────────────────────── */
function ExtratoTab({ t }: { t: TFunction }) {
  const [dataInicio, setDataInicio]         = useState('')
  const [dataFim, setDataFim]               = useState('')
  const [categoria, setCategoria]           = useState('')
  const [lancamentos, setLancamentos]       = useState<LancamentoResponse[]>([])
  const [vendas, setVendas]                 = useState<VendaResponse[]>([])
  const [totais, setTotais] = useState({
    total_lancamentos: 0, total_entradas: 0, total_saidas: 0, saldo_periodo: 0,
  })
  const [loading, setLoading]   = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fluxoCaixaService.listarLancamentos({
        data_inicio: dataInicio || undefined,
        data_fim:    dataFim    || undefined,
        categoria:   categoria  || undefined,
      })
      setLancamentos(res.lancamentos)
      setTotais({
        total_lancamentos: res.total_lancamentos,
        total_entradas:    res.total_entradas,
        total_saidas:      res.total_saidas,
        saldo_periodo:     res.saldo_periodo,
      })
      resetPage()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('cashflow.toasts.loadError'))
    } finally {
      setLoading(false)
    }
  }, [dataInicio, dataFim, categoria])

  useEffect(() => { carregar() }, [carregar])

  useEffect(() => {
    vendasService.listar().then(setVendas).catch(() => {})
  }, [])

  function toggleExpandido(chave: string) {
    setExpandidos((prev) => {
      const next = new Set(prev)
      if (next.has(chave)) next.delete(chave)
      else next.add(chave)
      return next
    })
  }

  const vendaClienteMap = useMemo(() => {
    const map = new Map<string, { id: string; nome: string }>()
    for (const v of vendas) map.set(v.id, { id: v.cliente_id, nome: v.cliente_nome })
    return map
  }, [vendas])

  const grupos = useMemo<GrupoCliente[]>(() => {
    const mapa = new Map<string, GrupoCliente>()
    for (const l of lancamentos) {
      const venda = l.categoria === 'VENDA' && l.venda_id ? vendaClienteMap.get(l.venda_id) : undefined
      const chave = venda ? venda.id : SEM_CLIENTE
      const nome = venda ? venda.nome : t('cashflow.noClient')
      let grupo = mapa.get(chave)
      if (!grupo) {
        grupo = { chave, nome, lancamentos: [], totalEntradas: 0, totalSaidas: 0 }
        mapa.set(chave, grupo)
      }
      grupo.lancamentos.push(l)
      if (l.tipo === 'ENTRADA') grupo.totalEntradas += l.valor
      else grupo.totalSaidas += l.valor
    }
    const lista = Array.from(mapa.values())
    lista.sort((a, b) => {
      if (a.chave === SEM_CLIENTE) return 1
      if (b.chave === SEM_CLIENTE) return -1
      return a.nome.localeCompare(b.nome)
    })
    return lista
  }, [lancamentos, vendaClienteMap, t])
  const { page, pageItems, totalPages, setPage, resetPage } = usePagination(grupos)

  const ordemCategorias = [...CATEGORIAS_ENTRADA, ...CATEGORIAS_SAIDA]

  function subgruposPorCategoria(itens: LancamentoResponse[]) {
    const mapa = new Map<string, LancamentoResponse[]>()
    for (const l of itens) {
      const arr = mapa.get(l.categoria) ?? []
      arr.push(l)
      mapa.set(l.categoria, arr)
    }
    const chaves = Array.from(mapa.keys()).sort((a, b) => {
      const ia = ordemCategorias.indexOf(a)
      const ib = ordemCategorias.indexOf(b)
      if (ia === -1 && ib === -1) return a.localeCompare(b)
      if (ia === -1) return 1
      if (ib === -1) return -1
      return ia - ib
    })
    return chaves.map((cat) => {
      const itensCat = mapa.get(cat)!
      const subtotal = itensCat.reduce((sum, l) => sum + (l.tipo === 'ENTRADA' ? l.valor : -l.valor), 0)
      return { categoria: cat, itens: itensCat, subtotal }
    })
  }

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
              <TableHead>{t('cashflow.colClient')}</TableHead>
              <TableHead className="text-right">{t('cashflow.totalEntries')}</TableHead>
              <TableHead className="text-right">{t('cashflow.periodIn')}</TableHead>
              <TableHead className="text-right">{t('cashflow.periodOut')}</TableHead>
              <TableHead className="text-right">{t('cashflow.colBalance')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {t('cashflow.loading')}
                </TableCell>
              </TableRow>
            ) : grupos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {t('cashflow.empty')}
                </TableCell>
              </TableRow>
            ) : (
              pageItems.map((grupo) => {
                const expandido = expandidos.has(grupo.chave)
                const saldo = grupo.totalEntradas - grupo.totalSaidas
                return (
                  <Fragment key={grupo.chave}>
                    <TableRow
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleExpandido(grupo.chave)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-1.5">
                          {expandido
                            ? <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                            : <ChevronRight className="size-4 text-muted-foreground shrink-0" />}
                          {grupo.nome}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{grupo.lancamentos.length}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium text-green-600">
                        {formatKz(grupo.totalEntradas)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium text-red-600">
                        {formatKz(grupo.totalSaidas)}
                      </TableCell>
                      <TableCell className={`text-right font-semibold text-sm ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatKz(saldo)}
                      </TableCell>
                    </TableRow>
                    {expandido && (
                      <TableRow>
                        <TableCell colSpan={5} className="bg-muted/20 p-0">
                          <div className="p-3 space-y-3">
                            {subgruposPorCategoria(grupo.lancamentos).map((sub) => (
                              <div key={sub.categoria} className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                                    {sub.categoria.replace(/_/g, ' ')}
                                  </span>
                                  <span className={`text-xs font-medium ${sub.subtotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatKz(sub.subtotal)}
                                  </span>
                                </div>
                                <div className="space-y-1 pl-1">
                                  {sub.itens.map((l) => (
                                    <div key={l.id} className="flex justify-between items-center gap-3 text-sm">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-xs text-muted-foreground shrink-0">{l.data_movimento}</span>
                                        <span className="truncate">
                                          {l.descricao}
                                          {l.periodo_referencia && (
                                            <span className="ml-1 text-xs text-muted-foreground">({l.periodo_referencia})</span>
                                          )}
                                        </span>
                                        <Badge variant={tipoVariant(l.tipo)} className="text-xs shrink-0">{l.tipo}</Badge>
                                      </div>
                                      <span className={`shrink-0 font-medium ${l.tipo === 'ENTRADA' ? 'text-green-600' : 'text-red-600'}`}>
                                        {l.tipo === 'SAIDA' ? '-' : ''}{formatKz(l.valor)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
      <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <NovoLancamentoDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={carregar}
        t={t}
      />
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

      <ExtratoTab t={t} />
    </div>
  )
}
