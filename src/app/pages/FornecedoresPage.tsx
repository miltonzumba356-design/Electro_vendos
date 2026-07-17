import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { useAuth } from '@/contexts/AuthContext'
import { fornecedoresService } from '@/services/fornecedores'
import { produtosService } from '@/services/produtos'
import type {
  FornecedorResponse,
  FornecedorCreate,
  DividaFornecedorResponse,
  TotalDividasFornecedorResponse,
  ProdutoResponse,
  CompraFornecedorCreate,
  Moeda,
} from '@/types'
import { MOEDAS } from '@/types'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Badge } from '@/app/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { Separator } from '@/app/components/ui/separator'
import { Skeleton } from '@/app/components/ui/skeleton'
import { Combobox } from '@/app/components/ui/combobox'
import { TablePagination } from '@/app/components/ui/table-pagination'
import { usePagination } from '@/lib/usePagination'
import { exportTablePdf, type PdfColumn } from '@/lib/pdf'
import { partilharExtratoFornecedorWhatsapp } from '@/lib/recibo'
import { Plus, Search, ShoppingCart, Wallet, DollarSign, Receipt, FileDown, MessageCircle } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

function MiniStat({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="bg-muted/30 rounded-md p-3">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`font-semibold text-sm ${danger ? 'text-destructive' : ''}`}>{value}</p>
    </div>
  )
}

function formatKz(v: number) {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    maximumFractionDigits: 0,
  }).format(v)
}

// Formata respeitando a moeda escolhida — o Kz (AOA) não usa casas decimais
// (valores muito grandes), USD/EUR usam as 2 casas habituais.
function formatMoeda(v: number, moeda: Moeda | string = 'AOA') {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: moeda,
    maximumFractionDigits: moeda === 'AOA' ? 0 : 2,
  }).format(v)
}

/* ── Novo fornecedor dialog ─────────────────────────────────── */
interface FornecedorFormData {
  nome: string
  telefone: string
  nif: string
  endereco: string
}

const defaultFornecedorForm: FornecedorFormData = {
  nome: '', telefone: '', nif: '', endereco: '',
}

function NovoFornecedorDialog({
  onSuccess, onClose, t,
}: {
  onSuccess: (f: FornecedorResponse) => void
  onClose: () => void
  t: TFunction
}) {
  const [form, setForm] = useState<FornecedorFormData>(defaultFornecedorForm)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) {
      toast.error(t('suppliers.toasts.nameRequired'))
      return
    }
    setSaving(true)
    try {
      const data: FornecedorCreate = {
        nome: form.nome,
        telefone: form.telefone || null,
        nif: form.nif || null,
        endereco: form.endereco || null,
      }
      const novo = await fornecedoresService.criar(data)
      toast.success(t('suppliers.toasts.created'))
      onSuccess(novo)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('suppliers.toasts.saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('suppliers.newTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="f-nome">{t('common.name')} *</Label>
            <Input
              id="f-nome"
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              placeholder={t('suppliers.namePlaceholder')}
              maxLength={100}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="f-telefone">{t('common.phone')}</Label>
            <Input
              id="f-telefone"
              value={form.telefone}
              onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
              placeholder={t('suppliers.phonePlaceholder')}
              maxLength={20}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="f-nif">{t('suppliers.fieldNif')}</Label>
            <Input
              id="f-nif"
              value={form.nif}
              onChange={(e) => setForm((f) => ({ ...f, nif: e.target.value }))}
              placeholder={t('suppliers.nifPlaceholder')}
              maxLength={20}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="f-endereco">{t('common.address')}</Label>
            <Input
              id="f-endereco"
              value={form.endereco}
              onChange={(e) => setForm((f) => ({ ...f, endereco: e.target.value }))}
              placeholder={t('suppliers.addressPlaceholder')}
              maxLength={200}
            />
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? t('common.creating') : t('common.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ── Nova compra a fornecedor dialog ─────────────────────────── */
function NovaCompraDialog({
  fornecedores, produtos, presetFornecedorId, onSuccess, onClose, t,
}: {
  fornecedores: FornecedorResponse[]
  produtos: ProdutoResponse[]
  presetFornecedorId?: string
  onSuccess: () => void
  onClose: () => void
  t: TFunction
}) {
  const [fornecedorId, setFornecedorId] = useState(presetFornecedorId ?? '')
  const [produtoId, setProdutoId] = useState('')
  const [quantidade, setQuantidade] = useState('1')
  const [precoUnitario, setPrecoUnitario] = useState('')
  const [moeda, setMoeda] = useState<Moeda>('AOA')
  const [saving, setSaving] = useState(false)

  const total = (Number(quantidade) || 0) * (Number(precoUnitario) || 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fornecedorId) { toast.error(t('suppliers.toasts.selectSupplier')); return }
    if (!produtoId) { toast.error(t('suppliers.toasts.selectProduct')); return }
    const qtd = Number(quantidade)
    const preco = Number(precoUnitario)
    if (!qtd || qtd <= 0 || !preco || preco <= 0) {
      toast.error(t('suppliers.toasts.invalidPurchase'))
      return
    }
    setSaving(true)
    try {
      const data: CompraFornecedorCreate = { produto_id: produtoId, quantidade: qtd, preco_unitario: preco, moeda }
      await fornecedoresService.comprar(fornecedorId, data)
      toast.success(t('suppliers.toasts.purchaseRegistered'))
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('suppliers.toasts.purchaseError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('suppliers.newPurchaseTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>{t('suppliers.title')} *</Label>
            <Combobox
              options={fornecedores.map((f) => ({ value: f.id, label: f.nome }))}
              value={fornecedorId}
              onValueChange={setFornecedorId}
              placeholder={t('suppliers.selectSupplier')}
              searchPlaceholder={t('common.search')}
              emptyText={t('suppliers.empty')}
              disabled={!!presetFornecedorId}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('suppliers.fieldProduct')} *</Label>
            <Combobox
              options={produtos.map((p) => ({ value: p.id, label: p.nome }))}
              value={produtoId}
              onValueChange={setProdutoId}
              placeholder={t('suppliers.selectProduct')}
              searchPlaceholder={t('common.search')}
              emptyText={t('products.empty')}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="c-qtd">{t('suppliers.fieldQuantity')} *</Label>
              <Input
                id="c-qtd"
                type="number"
                min="1"
                step="1"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-preco">{t('suppliers.fieldUnitPrice')} *</Label>
              <Input
                id="c-preco"
                type="number"
                min="0.01"
                step="0.01"
                value={precoUnitario}
                onChange={(e) => setPrecoUnitario(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('suppliers.fieldCurrency')}</Label>
            <Select value={moeda} onValueChange={(v) => setMoeda(v as Moeda)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MOEDAS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-base">
            <span>{t('common.total')}</span>
            <span>{formatMoeda(total, moeda)}</span>
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

/* ── Pagar dívida a fornecedor dialog ────────────────────────── */
function PagarDividaFornecedorDialog({
  divida, onSuccess, onClose, t,
}: {
  divida: DividaFornecedorResponse | null
  onSuccess: (updated: DividaFornecedorResponse) => void
  onClose: () => void
  t: TFunction
}) {
  const [valor, setValor] = useState('')
  const [moeda, setMoeda] = useState<Moeda>('AOA')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (divida) {
      setValor(String(divida.saldo))
      setMoeda(divida.moeda ?? 'AOA')
    }
  }, [divida])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!divida || !valor || Number(valor) <= 0) {
      toast.error(t('suppliers.toasts.invalidValue'))
      return
    }
    setSaving(true)
    try {
      const updated = await fornecedoresService.dividas.pagar({ divida_id: divida.id, valor: Number(valor), moeda })
      onSuccess(updated)
      toast.success(t('suppliers.toasts.paymentRegistered'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('suppliers.toasts.paymentError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!divida} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('suppliers.payDebtTitle')}</DialogTitle>
        </DialogHeader>
        {divida && (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              {divida.fornecedor_nome ?? '—'} · {t('common.balance')}{' '}
              <span className="font-semibold text-foreground">{formatMoeda(divida.saldo, divida.moeda ?? 'AOA')}</span>
            </p>
            <div className="space-y-2">
              <Label htmlFor="valor-divida-forn">{t('suppliers.fieldValue')} *</Label>
              <Input
                id="valor-divida-forn"
                type="number"
                min="0.01"
                max={divida.saldo}
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t('suppliers.fieldCurrency')}</Label>
              <Select value={moeda} onValueChange={(v) => setMoeda(v as Moeda)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MOEDAS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
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
        )}
      </DialogContent>
    </Dialog>
  )
}

/* ── Extrato do fornecedor (transações, gasto, dívida, partilhar/PDF) ── */
function FornecedorExtratoDialog({
  fornecedor, onClose, t,
}: {
  fornecedor: FornecedorResponse | null
  onClose: () => void
  t: TFunction
}) {
  const [dividas, setDividas] = useState<DividaFornecedorResponse[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!fornecedor) { setDividas([]); return }
    setLoading(true)
    fornecedoresService.dividas.listar({ fornecedor_id: fornecedor.id })
      .then(setDividas)
      .catch(() => toast.error(t('common.loadError')))
      .finally(() => setLoading(false))
  }, [fornecedor])

  const totalGasto = dividas.reduce((s, d) => s + d.valor_total, 0)
  const totalPago = dividas.reduce((s, d) => s + d.valor_pago, 0)
  const totalDevido = dividas.reduce((s, d) => s + d.saldo, 0)

  const columns: PdfColumn[] = [
    { header: t('suppliers.colProduct'), key: 'produto' },
    { header: t('suppliers.colQuantity'), key: 'quantidade', align: 'right' },
    { header: t('common.total'), key: 'total', align: 'right' },
    { header: t('common.paid'), key: 'pago', align: 'right' },
    { header: t('common.balance'), key: 'saldo', align: 'right' },
    { header: t('suppliers.fieldCurrency'), key: 'moeda' },
    { header: t('common.status'), key: 'status' },
    { header: t('suppliers.colDate'), key: 'data' },
  ]

  function buildRows() {
    return dividas.map((d) => ({
      produto: d.produto_nome ?? '—', quantidade: d.quantidade ?? '—', total: formatMoeda(d.valor_total, d.moeda ?? 'AOA'),
      pago: formatMoeda(d.valor_pago, d.moeda ?? 'AOA'), saldo: formatMoeda(d.saldo, d.moeda ?? 'AOA'),
      moeda: d.moeda ?? 'AOA', status: d.status,
      data: format(new Date(d.criado_em), 'dd/MM/yyyy'),
    }))
  }

  return (
    <Dialog open={!!fornecedor} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{fornecedor?.nome}</DialogTitle>
        </DialogHeader>
        {fornecedor && (
          <div className="space-y-4 pt-2">
            {fornecedor.telefone && (
              <p className="text-sm text-muted-foreground">{t('common.phone')}: {fornecedor.telefone}</p>
            )}

            {loading ? <Skeleton className="h-32 w-full" /> : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <MiniStat label={t('suppliers.totalSpent')} value={formatKz(totalGasto)} />
                  <MiniStat label={t('common.paid')} value={formatKz(totalPago)} />
                  <MiniStat label={t('suppliers.totalOwed')} value={formatKz(totalDevido)} danger={totalDevido > 0} />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="gap-2"
                    disabled={dividas.length === 0}
                    onClick={() => exportTablePdf({
                      title: t('suppliers.extratoTitle'),
                      subtitle: fornecedor.nome,
                      columns,
                      rows: buildRows(),
                      filename: `fornecedor-${fornecedor.nome}`,
                    })}
                  >
                    <FileDown className="size-4" />
                    {t('common.downloadPdf')}
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                    disabled={dividas.length === 0}
                    onClick={() => partilharExtratoFornecedorWhatsapp(
                      fornecedor, dividas, { gasto: totalGasto, pago: totalPago, devido: totalDevido }
                    )}
                  >
                    <MessageCircle className="size-4" />
                    {t('sales.shareWhatsapp')}
                  </Button>
                </div>

                {dividas.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">{t('suppliers.debtEmpty')}</p>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('suppliers.colProduct')}</TableHead>
                          <TableHead className="text-right">{t('suppliers.colQuantity')}</TableHead>
                          <TableHead className="text-right">{t('common.total')}</TableHead>
                          <TableHead className="text-right">{t('common.paid')}</TableHead>
                          <TableHead className="text-right">{t('common.balance')}</TableHead>
                          <TableHead>{t('suppliers.fieldCurrency')}</TableHead>
                          <TableHead>{t('common.status')}</TableHead>
                          <TableHead>{t('suppliers.colDate')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dividas.map((d) => (
                          <TableRow key={d.id}>
                            <TableCell className="font-medium">{d.produto_nome ?? '—'}</TableCell>
                            <TableCell className="text-right">{d.quantidade ?? '—'}</TableCell>
                            <TableCell className="text-right">{formatMoeda(d.valor_total, d.moeda ?? 'AOA')}</TableCell>
                            <TableCell className="text-right text-green-600">{formatMoeda(d.valor_pago, d.moeda ?? 'AOA')}</TableCell>
                            <TableCell className="text-right font-medium text-destructive">{formatMoeda(d.saldo, d.moeda ?? 'AOA')}</TableCell>
                            <TableCell><Badge variant="outline">{d.moeda ?? 'AOA'}</Badge></TableCell>
                            <TableCell>
                              <Badge variant={d.status === 'PAGA' ? 'default' : 'destructive'}>{d.status}</Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {format(new Date(d.criado_em), 'dd/MM/yyyy')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

/* ── Tab: Fornecedores ────────────────────────────────────────── */
function FornecedoresTab({
  fornecedores, produtos, loading, isGestor, onCreated, onCompraSuccess, onSelecionar, t,
}: {
  fornecedores: FornecedorResponse[]
  produtos: ProdutoResponse[]
  loading: boolean
  isGestor: boolean
  onCreated: (f: FornecedorResponse) => void
  onCompraSuccess: () => void
  onSelecionar: (f: FornecedorResponse) => void
  t: TFunction
}) {
  const [search, setSearch] = useState('')
  const [novoOpen, setNovoOpen] = useState(false)
  const [compraFornecedorId, setCompraFornecedorId] = useState<string | null>(null)

  const filtered = fornecedores.filter((f) =>
    f.nome.toLowerCase().includes(search.toLowerCase()) ||
    (f.telefone ?? '').includes(search) ||
    (f.nif ?? '').includes(search)
  )
  const { page, pageItems, totalPages, setPage, resetPage } = usePagination(filtered)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={t('suppliers.searchPlaceholder')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage() }}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          className="gap-2 shrink-0"
          disabled={filtered.length === 0}
          onClick={() => exportTablePdf({
            title: t('suppliers.title'),
            columns: [
              { header: t('common.name'), key: 'nome' },
              { header: t('suppliers.colPhone'), key: 'telefone' },
              { header: t('suppliers.colNif'), key: 'nif' },
              { header: t('suppliers.colAddress'), key: 'endereco' },
              { header: t('suppliers.colRegistered'), key: 'criado_em' },
            ],
            rows: filtered.map((f) => ({
              nome: f.nome, telefone: f.telefone ?? '—', nif: f.nif ?? '—',
              endereco: f.endereco ?? '—', criado_em: format(new Date(f.criado_em), 'dd/MM/yyyy'),
            })),
            filename: 'fornecedores',
          })}
        >
          <FileDown className="size-4" />
          {t('common.downloadPdf')}
        </Button>
        {isGestor && (
          <Button onClick={() => setNovoOpen(true)} className="gap-2 shrink-0">
            <Plus className="size-4" />
            {t('suppliers.new')}
          </Button>
        )}
      </div>

      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('common.name')}</TableHead>
              <TableHead>{t('suppliers.colPhone')}</TableHead>
              <TableHead>{t('suppliers.colNif')}</TableHead>
              <TableHead>{t('suppliers.colAddress')}</TableHead>
              <TableHead>{t('suppliers.colRegistered')}</TableHead>
              {isGestor && <TableHead className="text-right">{t('suppliers.colActions')}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: isGestor ? 6 : 5 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isGestor ? 6 : 5} className="text-center text-muted-foreground py-8">
                  {t('suppliers.empty')}
                </TableCell>
              </TableRow>
            ) : (
              pageItems.map((f) => (
                <TableRow key={f.id} className="cursor-pointer hover:bg-muted/40" onClick={() => onSelecionar(f)}>
                  <TableCell className="font-medium">{f.nome}</TableCell>
                  <TableCell>{f.telefone ?? '—'}</TableCell>
                  <TableCell>{f.nif ?? '—'}</TableCell>
                  <TableCell className="max-w-40 truncate">{f.endereco ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(f.criado_em), 'dd/MM/yyyy')}
                  </TableCell>
                  {isGestor && (
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); setCompraFornecedorId(f.id) }}
                        title={t('suppliers.newPurchase')}
                      >
                        <ShoppingCart className="size-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {novoOpen && (
        <NovoFornecedorDialog
          onSuccess={(f) => { setNovoOpen(false); onCreated(f) }}
          onClose={() => setNovoOpen(false)}
          t={t}
        />
      )}

      {compraFornecedorId && (
        <NovaCompraDialog
          fornecedores={fornecedores}
          produtos={produtos}
          presetFornecedorId={compraFornecedorId}
          onSuccess={() => { setCompraFornecedorId(null); onCompraSuccess() }}
          onClose={() => setCompraFornecedorId(null)}
          t={t}
        />
      )}
    </div>
  )
}

/* ── Tab: Dívidas a fornecedores ─────────────────────────────── */
function DividasFornecedorTab({
  fornecedores, produtos, isGestor, onSelecionar, t,
}: {
  fornecedores: FornecedorResponse[]
  produtos: ProdutoResponse[]
  isGestor: boolean
  onSelecionar: (f: FornecedorResponse) => void
  t: TFunction
}) {
  const [dividas, setDividas] = useState<DividaFornecedorResponse[]>([])
  const [total, setTotal] = useState<TotalDividasFornecedorResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFiltro, setStatusFiltro] = useState<'DIVIDA' | 'PAGA' | 'TODAS'>('DIVIDA')
  const [fornecedorFiltro, setFornecedorFiltro] = useState('')
  const [pagarDivida, setPagarDivida] = useState<DividaFornecedorResponse | null>(null)
  const [novaCompraOpen, setNovaCompraOpen] = useState(false)

  const { page, pageItems, totalPages, setPage, resetPage } = usePagination(dividas)

  async function load() {
    setLoading(true)
    try {
      const [dividasData, totalData] = await Promise.all([
        fornecedoresService.dividas.listar({
          status: statusFiltro === 'TODAS' ? undefined : statusFiltro,
          fornecedor_id: fornecedorFiltro || undefined,
        }),
        fornecedoresService.dividas.total(),
      ])
      setDividas(dividasData)
      setTotal(totalData)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(); resetPage() }, [statusFiltro, fornecedorFiltro])

  function handlePago(updated: DividaFornecedorResponse) {
    setDividas((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
    setPagarDivida(null)
    fornecedoresService.dividas.total().then(setTotal).catch(() => {})
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">{t('suppliers.totalDebts')}</CardTitle>
            <Receipt className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-4 px-4">
            <p className="text-2xl font-bold">{total ? total.quantidade_dividas : '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">{t('suppliers.totalOwed')}</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-4 px-4">
            <p className="text-2xl font-bold">{total ? formatKz(total.total_devido) : '—'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1 min-w-[200px]">
          <Label>{t('suppliers.title')}</Label>
          <Combobox
            options={[
              { value: '', label: t('suppliers.allSuppliers') },
              ...fornecedores.map((f) => ({ value: f.id, label: f.nome })),
            ]}
            value={fornecedorFiltro}
            onValueChange={setFornecedorFiltro}
            placeholder={t('suppliers.allSuppliers')}
            searchPlaceholder={t('common.search')}
            emptyText={t('suppliers.empty')}
          />
        </div>
        <div className="flex gap-2">
          {(['DIVIDA', 'PAGA', 'TODAS'] as const).map((s) => (
            <Button
              key={s}
              type="button"
              variant={statusFiltro === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFiltro(s)}
            >
              {t(`suppliers.debtStatus.${s}`)}
            </Button>
          ))}
        </div>
        <div className="flex-1" />
        <Button
          variant="outline"
          className="gap-2"
          disabled={dividas.length === 0}
          onClick={() => exportTablePdf({
            title: t('suppliers.tabDebts'),
            columns: [
              { header: t('suppliers.colSupplier'), key: 'fornecedor' },
              { header: t('suppliers.colProduct'), key: 'produto' },
              { header: t('suppliers.colQuantity'), key: 'quantidade', align: 'right' },
              { header: t('common.total'), key: 'total', align: 'right' },
              { header: t('common.paid'), key: 'pago', align: 'right' },
              { header: t('common.balance'), key: 'saldo', align: 'right' },
              { header: t('suppliers.fieldCurrency'), key: 'moeda' },
              { header: t('common.status'), key: 'status' },
              { header: t('suppliers.colDate'), key: 'data' },
            ],
            rows: dividas.map((d) => ({
              fornecedor: d.fornecedor_nome ?? '—', produto: d.produto_nome ?? '—',
              quantidade: d.quantidade ?? '—', total: formatMoeda(d.valor_total, d.moeda ?? 'AOA'),
              pago: formatMoeda(d.valor_pago, d.moeda ?? 'AOA'), saldo: formatMoeda(d.saldo, d.moeda ?? 'AOA'),
              moeda: d.moeda ?? 'AOA', status: d.status,
              data: format(new Date(d.criado_em), 'dd/MM/yyyy'),
            })),
            filename: 'dividas-fornecedores',
          })}
        >
          <FileDown className="size-4" />
          {t('common.downloadPdf')}
        </Button>
        {isGestor && (
          <Button onClick={() => setNovaCompraOpen(true)} className="gap-2">
            <Plus className="size-4" /> {t('suppliers.newPurchase')}
          </Button>
        )}
      </div>

      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('suppliers.colSupplier')}</TableHead>
              <TableHead>{t('suppliers.colProduct')}</TableHead>
              <TableHead className="text-right">{t('suppliers.colQuantity')}</TableHead>
              <TableHead className="text-right">{t('common.total')}</TableHead>
              <TableHead className="text-right">{t('common.paid')}</TableHead>
              <TableHead className="text-right">{t('common.balance')}</TableHead>
              <TableHead>{t('suppliers.fieldCurrency')}</TableHead>
              <TableHead>{t('common.status')}</TableHead>
              <TableHead>{t('suppliers.colDate')}</TableHead>
              {isGestor && <TableHead className="text-right">{t('suppliers.colActions')}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: isGestor ? 10 : 9 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : dividas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isGestor ? 10 : 9} className="text-center text-muted-foreground py-8">
                  {t('suppliers.debtEmpty')}
                </TableCell>
              </TableRow>
            ) : (
              pageItems.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">
                    <button
                      type="button"
                      className="hover:underline text-left"
                      onClick={() => {
                        const f = fornecedores.find((fo) => fo.id === d.fornecedor_id)
                        if (f) onSelecionar(f)
                      }}
                    >
                      {d.fornecedor_nome ?? '—'}
                    </button>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{d.produto_nome ?? '—'}</TableCell>
                  <TableCell className="text-right">{d.quantidade ?? '—'}</TableCell>
                  <TableCell className="text-right">{formatMoeda(d.valor_total, d.moeda ?? 'AOA')}</TableCell>
                  <TableCell className="text-right text-green-600">{formatMoeda(d.valor_pago, d.moeda ?? 'AOA')}</TableCell>
                  <TableCell className="text-right font-medium text-destructive">{formatMoeda(d.saldo, d.moeda ?? 'AOA')}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{d.moeda ?? 'AOA'}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={d.status === 'PAGA' ? 'default' : 'destructive'}>{d.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(d.criado_em), 'dd/MM/yyyy')}
                  </TableCell>
                  {isGestor && (
                    <TableCell className="text-right">
                      {d.status !== 'PAGA' && (
                        <Button variant="ghost" size="icon" onClick={() => setPagarDivida(d)}>
                          <Wallet className="size-4 text-primary" />
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <PagarDividaFornecedorDialog
        divida={pagarDivida}
        onSuccess={handlePago}
        onClose={() => setPagarDivida(null)}
        t={t}
      />

      {novaCompraOpen && (
        <NovaCompraDialog
          fornecedores={fornecedores}
          produtos={produtos}
          onSuccess={() => { setNovaCompraOpen(false); load() }}
          onClose={() => setNovaCompraOpen(false)}
          t={t}
        />
      )}
    </div>
  )
}

/* ── Main Page ────────────────────────────────────────────────── */
export default function FornecedoresPage() {
  const { t } = useTranslation()
  const { isGestor } = useAuth()
  const [fornecedores, setFornecedores] = useState<FornecedorResponse[]>([])
  const [produtos, setProdutos] = useState<ProdutoResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [extratoFornecedor, setExtratoFornecedor] = useState<FornecedorResponse | null>(null)

  async function load() {
    setLoading(true)
    try {
      const [f, p] = await Promise.all([fornecedoresService.listar(), produtosService.listar()])
      setFornecedores(f)
      setProdutos(p)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('suppliers.toasts.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('suppliers.title')}</h1>
        <p className="text-muted-foreground text-sm">{t('suppliers.subtitle')}</p>
      </div>

      <Tabs defaultValue="fornecedores">
        <TabsList>
          <TabsTrigger value="fornecedores">{t('suppliers.tabList')}</TabsTrigger>
          <TabsTrigger value="dividas">{t('suppliers.tabDebts')}</TabsTrigger>
        </TabsList>
        <div className="mt-4">
          <TabsContent value="fornecedores">
            <FornecedoresTab
              fornecedores={fornecedores}
              produtos={produtos}
              loading={loading}
              isGestor={isGestor}
              onCreated={(f) => setFornecedores((prev) => [f, ...prev])}
              onCompraSuccess={load}
              onSelecionar={setExtratoFornecedor}
              t={t}
            />
          </TabsContent>
          <TabsContent value="dividas">
            <DividasFornecedorTab
              fornecedores={fornecedores}
              produtos={produtos}
              isGestor={isGestor}
              onSelecionar={setExtratoFornecedor}
              t={t}
            />
          </TabsContent>
        </div>
      </Tabs>

      <FornecedorExtratoDialog
        fornecedor={extratoFornecedor}
        onClose={() => setExtratoFornecedor(null)}
        t={t}
      />
    </div>
  )
}
