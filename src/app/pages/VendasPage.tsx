import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { vendasService } from '@/services/vendas'
import { produtosService } from '@/services/produtos'
import { clientesService } from '@/services/clientes'
import { dividasService } from '@/services/dividas'
import type {
  VendaResponse,
  ProdutoResponse,
  ClienteResponse,
  ItemVendaInput,
  VendaCreate,
  DividaCheckResponse,
  DividaResponse,
} from '@/types'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Badge } from '@/app/components/ui/badge'
import { Checkbox } from '@/app/components/ui/checkbox'
import { Alert, AlertTitle, AlertDescription } from '@/app/components/ui/alert'
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
import { Combobox } from '@/app/components/ui/combobox'
import { Skeleton } from '@/app/components/ui/skeleton'
import { Separator } from '@/app/components/ui/separator'
import { TablePagination } from '@/app/components/ui/table-pagination'
import { usePagination } from '@/lib/usePagination'
import { Plus, Eye, Trash2, Search, Printer, AlertTriangle, Wallet, MessageCircle, X, FileSignature, FileDown } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { imprimirVenda, visualizarVenda, partilharVendaWhatsapp } from '@/lib/recibo'
import { exportTablePdf } from '@/lib/pdf'
import { NotaEntregaDialog } from '@/app/components/NotaEntregaDialog'
import type { NotaEntregaOrigem } from '@/app/components/NotaEntregaDialog'
import PrestacoesPage from '@/app/pages/PrestacoesPage'

function formatKz(value: number) {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    maximumFractionDigits: 0,
  }).format(value)
}

interface ItemForm {
  produto_id: string
  quantidade: number
}

/* ── Tab: Vendas ──────────────────────────────────────────────── */
function VendasTab({ t }: { t: TFunction }) {
  const [vendas, setVendas] = useState<VendaResponse[]>([])
  const [produtos, setProdutos] = useState<ProdutoResponse[]>([])
  const [clientes, setClientes] = useState<ClienteResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [novaVendaOpen, setNovaVendaOpen] = useState(false)
  const [detalhesVenda, setDetalhesVenda] = useState<VendaResponse | null>(null)
  const [vendaConcluida, setVendaConcluida] = useState<{ venda: VendaResponse; telefone: string | null } | null>(null)
  const [notaEntregaOrigem, setNotaEntregaOrigem] = useState<NotaEntregaOrigem | null>(null)

  const [clienteMode, setClienteMode] = useState<'existente' | 'novo' | 'nenhum'>('nenhum')
  const [clienteId, setClienteId] = useState('')
  const [novoClienteNome, setNovoClienteNome] = useState('')
  const [novoClienteTelefone, setNovoClienteTelefone] = useState('')
  const [itens, setItens] = useState<ItemForm[]>([{ produto_id: '', quantidade: 1 }])
  const [credito, setCredito] = useState(false)
  const [descontoPercentual, setDescontoPercentual] = useState('')
  const [saving, setSaving] = useState(false)

  const [dividaCheck, setDividaCheck] = useState<DividaCheckResponse | null>(null)
  const [confirmarDivida, setConfirmarDivida] = useState(false)
  const [descontoDivida, setDescontoDivida] = useState('')

  async function load() {
    try {
      const [v, p, c] = await Promise.allSettled([
        vendasService.listar(),
        produtosService.listar(),
        clientesService.listar(),
      ])
      if (v.status === 'fulfilled') setVendas(v.value)
      if (p.status === 'fulfilled') setProdutos(p.value)
      if (c.status === 'fulfilled') setClientes(c.value)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('sales.toasts.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (clienteMode === 'existente' && clienteId) {
      dividasService.verificarCliente(clienteId)
        .then(setDividaCheck)
        .catch(() => setDividaCheck(null))
    } else {
      setDividaCheck(null)
    }
    setConfirmarDivida(false)
    setDescontoDivida('')
  }, [clienteMode, clienteId])

  function openNovaVenda() {
    setClienteMode('nenhum')
    setClienteId('')
    setNovoClienteNome('')
    setNovoClienteTelefone('')
    setItens([{ produto_id: '', quantidade: 1 }])
    setCredito(false)
    setDescontoPercentual('')
    setDividaCheck(null)
    setConfirmarDivida(false)
    setDescontoDivida('')
    setNovaVendaOpen(true)
  }

  function addItem() {
    setItens((prev) => [...prev, { produto_id: '', quantidade: 1 }])
  }

  function removeItem(i: number) {
    setItens((prev) => prev.filter((_, idx) => idx !== i))
  }

  function updateItem(i: number, field: keyof ItemForm, value: string | number) {
    setItens((prev) =>
      prev.map((item, idx) => (idx === i ? { ...item, [field]: value } : item))
    )
  }

  function calcSubtotal(item: ItemForm): number {
    const produto = produtos.find((p) => p.id === item.produto_id)
    if (!produto) return 0
    return produto.preco_com_iva * item.quantidade
  }

  const totalEstimado = itens.reduce((sum, item) => sum + calcSubtotal(item), 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validItens = itens.filter((i) => i.produto_id && i.quantidade > 0)
    if (validItens.length === 0) {
      toast.error(t('sales.toasts.minOneProduct'))
      return
    }
    if (dividaCheck?.tem_divida && !confirmarDivida) {
      toast.error(t('sales.toasts.debtConfirmRequired'))
      return
    }
    const vendaItens: ItemVendaInput[] = validItens.map((i) => ({
      produto_id: i.produto_id,
      quantidade: i.quantidade,
    }))
    setSaving(true)
    try {
      const payload: VendaCreate = {
        itens: vendaItens,
        cliente_id: clienteMode === 'existente' && clienteId ? clienteId : null,
        cliente:
          clienteMode === 'novo' && novoClienteNome
            ? { nome: novoClienteNome, telefone: novoClienteTelefone || undefined }
            : null,
        credito,
        ...(descontoPercentual ? { desconto_percentual: Number(descontoPercentual) } : {}),
        ...(dividaCheck?.tem_divida && confirmarDivida
          ? { desconto_divida: descontoDivida ? Number(descontoDivida) : 0 }
          : {}),
      }
      const telefoneCliente =
        clienteMode === 'existente' && clienteId
          ? clientes.find((c) => c.id === clienteId)?.telefone ?? null
          : clienteMode === 'novo'
            ? novoClienteTelefone || null
            : null

      const nova = await vendasService.criar(payload)
      setVendas((prev) => [nova, ...prev])
      toast.success(t('sales.toasts.registered'))
      setNovaVendaOpen(false)
      setVendaConcluida({ venda: nova, telefone: telefoneCliente })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('sales.toasts.registerError'))
    } finally {
      setSaving(false)
    }
  }

  const filtered = [...vendas]
    .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())
    .filter(
      (v) =>
        v.cliente_nome.toLowerCase().includes(search.toLowerCase()) ||
        v.utilizador_nome.toLowerCase().includes(search.toLowerCase())
    )
  const { page, pageItems, totalPages, setPage, resetPage } = usePagination(filtered)

  const clienteModeLabel = (m: 'nenhum' | 'existente' | 'novo') => {
    if (m === 'nenhum')    return t('sales.noClient')
    if (m === 'existente') return t('sales.existingClient')
    return t('sales.newClient')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-sm">{t('sales.count', { count: vendas.length })}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2 shrink-0"
            disabled={filtered.length === 0}
            onClick={() => exportTablePdf({
              title: t('sales.title'),
              columns: [
                { header: t('sales.colDate'), key: 'data' },
                { header: t('sales.colClient'), key: 'cliente' },
                { header: t('sales.colOperator'), key: 'operador' },
                { header: t('sales.colItems'), key: 'itens', align: 'right' },
                { header: t('sales.colNetTotal'), key: 'liquido', align: 'right' },
                { header: t('sales.colFinalTotal'), key: 'total', align: 'right' },
                { header: t('sales.colType'), key: 'tipo' },
              ],
              rows: filtered.map((v) => ({
                data: format(new Date(v.criado_em), 'dd/MM/yyyy HH:mm'), cliente: v.cliente_nome,
                operador: v.utilizador_nome, itens: v.itens.length, liquido: formatKz(v.total_sem_iva),
                total: formatKz(v.total_final),
                tipo: v.credito ? (v.credito_pago ? t('sales.creditPaid') : t('sales.creditPending')) : t('sales.cash'),
              })),
              filename: 'vendas',
            })}
          >
            <FileDown className="size-4" />
            {t('common.downloadPdf')}
          </Button>
          <Button onClick={openNovaVenda} className="gap-2 shrink-0">
            <Plus className="size-4" />
            {t('sales.new')}
          </Button>
        </div>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder={t('sales.searchPlaceholder')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); resetPage() }}
          className="pl-9"
        />
      </div>

      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('sales.colDate')}</TableHead>
              <TableHead>{t('sales.colClient')}</TableHead>
              <TableHead>{t('sales.colOperator')}</TableHead>
              <TableHead className="text-right">{t('sales.colItems')}</TableHead>
              <TableHead className="text-right">{t('sales.colNetTotal')}</TableHead>
              <TableHead className="text-right">{t('sales.colFinalTotal')}</TableHead>
              <TableHead>{t('sales.colType')}</TableHead>
              <TableHead className="text-right">{t('sales.colActions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  {t('sales.empty')}
                </TableCell>
              </TableRow>
            ) : (
              pageItems.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(v.criado_em), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="font-medium">{v.cliente_nome}</TableCell>
                  <TableCell className="text-muted-foreground">{v.utilizador_nome}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">{v.itens.length}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatKz(v.total_sem_iva)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatKz(v.total_final)}</TableCell>
                  <TableCell>
                    {v.credito ? (
                      <Badge variant={v.credito_pago ? 'default' : 'destructive'}>
                        {v.credito_pago ? t('sales.creditPaid') : t('sales.creditPending')}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">{t('sales.cash')}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setDetalhesVenda(v)}>
                      <Eye className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Nova venda dialog */}
      <Dialog open={novaVendaOpen} onOpenChange={setNovaVendaOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('sales.newTitle')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            <div className="space-y-3">
              <Label>{t('sales.clientLabel')}</Label>
              <div className="flex gap-2">
                {(['nenhum', 'existente', 'novo'] as const).map((m) => (
                  <Button
                    key={m}
                    type="button"
                    variant={clienteMode === m ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setClienteMode(m)}
                  >
                    {clienteModeLabel(m)}
                  </Button>
                ))}
              </div>

              {clienteMode === 'existente' && (
                <Combobox
                  options={clientes.map((c) => ({
                    value: c.id,
                    label: c.nome + (c.telefone ? ` · ${c.telefone}` : ''),
                  }))}
                  value={clienteId}
                  onValueChange={setClienteId}
                  placeholder={t('sales.selectClient')}
                  searchPlaceholder={t('common.search')}
                  emptyText={t('clients.empty')}
                />
              )}

              {clienteMode === 'novo' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>{t('sales.clientName')} *</Label>
                    <Input
                      value={novoClienteNome}
                      onChange={(e) => setNovoClienteNome(e.target.value)}
                      placeholder={t('sales.clientName')}
                      maxLength={100}
                      required={clienteMode === 'novo'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('sales.clientPhone')}</Label>
                    <Input
                      value={novoClienteTelefone}
                      onChange={(e) => setNovoClienteTelefone(e.target.value)}
                      placeholder="923456789"
                      maxLength={20}
                    />
                  </div>
                </div>
              )}

              {dividaCheck?.tem_divida && (
                <Alert variant="destructive">
                  <AlertTriangle />
                  <AlertTitle>{t('sales.debtWarningTitle')}</AlertTitle>
                  <AlertDescription>
                    <p>
                      {dividaCheck.mensagem ?? t('sales.debtWarningDesc', { value: formatKz(dividaCheck.total_devido) })}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <Checkbox
                        id="confirmar-divida"
                        checked={confirmarDivida}
                        onCheckedChange={(v) => setConfirmarDivida(v === true)}
                      />
                      <Label htmlFor="confirmar-divida" className="font-normal cursor-pointer">
                        {t('sales.debtConfirmLabel')}
                      </Label>
                    </div>
                    {confirmarDivida && (
                      <div className="w-full sm:w-48 pt-1 space-y-1">
                        <Label htmlFor="desconto-divida" className="text-xs">{t('sales.debtDiscountLabel')}</Label>
                        <Input
                          id="desconto-divida"
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={descontoDivida}
                          onChange={(e) => setDescontoDivida(e.target.value)}
                          placeholder="0"
                        />
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t('sales.products')}</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="size-3.5 mr-1" />
                  {t('sales.addProduct')}
                </Button>
              </div>

              <div className="space-y-2">
                {itens.map((item, i) => {
                  const produto = produtos.find((p) => p.id === item.produto_id)
                  return (
                    <div key={i} className="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
                      <div className="flex-1 w-full space-y-1">
                        {i === 0 && <span className="text-xs text-muted-foreground">{t('sales.selectProduct').replace('...','')}</span>}
                        <Combobox
                          options={produtos.map((p) => ({
                            value: p.id,
                            label: `${p.nome} — ${formatKz(p.preco_com_iva)}`,
                          }))}
                          value={item.produto_id}
                          onValueChange={(v) => updateItem(i, 'produto_id', v)}
                          placeholder={t('sales.selectProduct')}
                          searchPlaceholder={t('common.search')}
                          emptyText={t('products.empty')}
                        />
                      </div>
                      <div className="w-full sm:w-24 space-y-1">
                        {i === 0 && <span className="text-xs text-muted-foreground">{t('sales.qty')}</span>}
                        <Input
                          type="number"
                          min="1"
                          max={produto?.stock_atual ?? 9999}
                          value={item.quantidade}
                          onChange={(e) => updateItem(i, 'quantidade', Number(e.target.value))}
                        />
                      </div>
                      <div className="w-full sm:w-28 space-y-1">
                        {i === 0 && <span className="text-xs text-muted-foreground">{t('sales.subtotal')}</span>}
                        <div className="h-9 flex items-center px-3 border rounded-md bg-muted/30 text-sm font-medium">
                          {formatKz(calcSubtotal(item))}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(i)}
                        disabled={itens.length === 1}
                        className="sm:self-end"
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  )
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 pt-2">
                  <Checkbox
                    id="venda-credito"
                    checked={credito}
                    onCheckedChange={(v) => setCredito(v === true)}
                  />
                  <Label htmlFor="venda-credito" className="font-normal cursor-pointer">
                    {t('sales.creditSaleLabel')}
                  </Label>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="desconto-pct" className="text-xs">{t('sales.discountLabel')}</Label>
                  <Input
                    id="desconto-pct"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={descontoPercentual}
                    onChange={(e) => setDescontoPercentual(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{t('sales.estimatedTotal')}</p>
                  <p className="text-xl font-bold">{formatKz(totalEstimado)}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setNovaVendaOpen(false)} disabled={saving}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? t('sales.registering') : t('sales.register')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Venda registada — o que fazer a seguir */}
      <Dialog open={!!vendaConcluida} onOpenChange={() => setVendaConcluida(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('sales.doneTitle')}</DialogTitle>
          </DialogHeader>
          {vendaConcluida && (
            <div className="space-y-3 pt-2">
              <p className="text-sm text-muted-foreground">
                {t('sales.doneDesc', { total: formatKz(vendaConcluida.venda.total_final) })}
              </p>
              <div className="grid gap-2">
                <Button
                  variant="outline"
                  className="justify-start gap-2"
                  onClick={() => visualizarVenda(
                    vendaConcluida.venda,
                    clientes.find((c) => c.id === vendaConcluida.venda.cliente_id)?.nif
                  )}
                >
                  <Eye className="size-4" />
                  {t('sales.preview')}
                </Button>
                <Button
                  variant="outline"
                  className="justify-start gap-2"
                  onClick={() => imprimirVenda(
                    vendaConcluida.venda,
                    clientes.find((c) => c.id === vendaConcluida.venda.cliente_id)?.nif
                  )}
                >
                  <Printer className="size-4" />
                  {t('sales.printReceipt')}
                </Button>
                <Button
                  variant="outline"
                  className="justify-start gap-2 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                  onClick={() => partilharVendaWhatsapp(vendaConcluida.venda, vendaConcluida.telefone)}
                >
                  <MessageCircle className="size-4" />
                  {t('sales.shareWhatsapp')}
                </Button>
              </div>
              <Button variant="ghost" className="w-full gap-2" onClick={() => setVendaConcluida(null)}>
                <X className="size-4" />
                {t('common.close')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Detalhes venda dialog */}
      <Dialog open={!!detalhesVenda} onOpenChange={() => setDetalhesVenda(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <DialogTitle>{t('sales.detailsTitle')}</DialogTitle>
              {detalhesVenda && (
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setNotaEntregaOrigem({
                      tipo: 'venda',
                      ref: detalhesVenda.id.slice(0, 8).toUpperCase(),
                      clienteNome: detalhesVenda.cliente_nome,
                      clienteNif: clientes.find((c) => c.id === detalhesVenda.cliente_id)?.nif ?? null,
                      data: detalhesVenda.criado_em,
                      itens: detalhesVenda.itens.map((i) => ({ produto_nome: i.produto_nome, quantidade: i.quantidade })),
                    })}
                  >
                    <FileSignature className="size-4" />
                    {t('deliveryNotes.buttonLabel')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => imprimirVenda(
                      detalhesVenda,
                      clientes.find((c) => c.id === detalhesVenda.cliente_id)?.nif
                    )}
                  >
                    <Printer className="size-4" />
                    {t('sales.printReceipt')}
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>
          {detalhesVenda && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">{t('sales.detailsClient')}</p>
                  <p className="font-medium">{detalhesVenda.cliente_nome}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('sales.detailsOperator')}</p>
                  <p className="font-medium">{detalhesVenda.utilizador_nome}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('sales.detailsDate')}</p>
                  <p>{format(new Date(detalhesVenda.criado_em), 'dd/MM/yyyy HH:mm')}</p>
                </div>
                {detalhesVenda.credito && (
                  <div>
                    <p className="text-muted-foreground">{t('sales.colType')}</p>
                    <Badge variant={detalhesVenda.credito_pago ? 'default' : 'destructive'}>
                      {detalhesVenda.credito_pago ? t('sales.creditPaid') : t('sales.creditPending')}
                    </Badge>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-medium">{t('sales.detailsItems')}</p>
                {detalhesVenda.itens.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.produto_nome} × {item.quantidade}</span>
                    <span>{formatKz(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('sales.detailsNetSubtotal')}</span>
                  <span>{formatKz(detalhesVenda.total_sem_iva)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('sales.detailsVat')}</span>
                  <span>{formatKz(detalhesVenda.total_iva)}</span>
                </div>
                {detalhesVenda.desconto_percentual > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>{t('sales.detailsDiscount', { pct: detalhesVenda.desconto_percentual })}</span>
                    <span>-{formatKz(detalhesVenda.total_desconto)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-1">
                  <span>{t('sales.detailsFinalTotal')}</span>
                  <span>{formatKz(detalhesVenda.total_final)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <NotaEntregaDialog origem={notaEntregaOrigem} onClose={() => setNotaEntregaOrigem(null)} t={t} />
    </div>
  )
}

/* ── Pagar dívida dialog (dívidas de crédito) ────────────────────── */
function PagarDividaDialog({
  divida, onSuccess, onClose, t,
}: {
  divida: DividaResponse | null
  onSuccess: (updated: DividaResponse) => void
  onClose: () => void
  t: TFunction
}) {
  const [valor, setValor] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (divida) setValor(String(divida.saldo))
  }, [divida])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!divida || !valor || Number(valor) <= 0) {
      toast.error(t('installments.toasts.invalidValue'))
      return
    }
    setSaving(true)
    try {
      const updated = await dividasService.pagar(divida.id, { valor: Number(valor) })
      onSuccess(updated)
      toast.success(t('sales.toasts.debtPaymentRegistered'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('sales.toasts.debtPaymentError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!divida} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('sales.payDebtTitle')}</DialogTitle>
        </DialogHeader>
        {divida && (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              {divida.cliente_nome ?? '—'} · {t('installments.colBalance')}{' '}
              <span className="font-semibold text-foreground">{formatKz(divida.saldo)}</span>
            </p>
            <div className="space-y-2">
              <Label htmlFor="valor-divida">{t('installments.fieldValue')} *</Label>
              <Input
                id="valor-divida"
                type="number"
                min="0.01"
                max={divida.saldo}
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
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
        )}
      </DialogContent>
    </Dialog>
  )
}

/* ── Tab: Dívidas (vendas a crédito) ─────────────────────────────── */
function DividasCreditoTab({ t }: { t: TFunction }) {
  const [dividas, setDividas] = useState<DividaResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFiltro, setStatusFiltro] = useState<'DIVIDA' | 'PAGA' | 'TODAS'>('DIVIDA')
  const [pagarDivida, setPagarDivida] = useState<DividaResponse | null>(null)

  const filtered = dividas.filter((d) => (d.cliente_nome ?? '').toLowerCase().includes(search.toLowerCase()))
  const { page, pageItems, totalPages, setPage, resetPage } = usePagination(filtered)

  async function load(status: 'DIVIDA' | 'PAGA' | 'TODAS') {
    setLoading(true)
    try {
      const data = await dividasService.listar(status === 'TODAS' ? undefined : { status })
      setDividas(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(statusFiltro); resetPage() }, [statusFiltro])

  function handlePago(updated: DividaResponse) {
    setDividas((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
    setPagarDivida(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={t('sales.searchPlaceholder')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage() }}
            className="pl-9"
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
              {t(`sales.debtStatus.${s}`)}
            </Button>
          ))}
        </div>
        <Button
          variant="outline"
          className="gap-2"
          disabled={filtered.length === 0}
          onClick={() => exportTablePdf({
            title: t('sales.tabDebts'),
            columns: [
              { header: t('sales.colClient'), key: 'cliente' },
              { header: t('sales.debtProduct'), key: 'produto' },
              { header: t('installments.colTotal'), key: 'total', align: 'right' },
              { header: t('installments.colPaid'), key: 'pago', align: 'right' },
              { header: t('installments.colBalance'), key: 'saldo', align: 'right' },
              { header: t('installments.colStatus'), key: 'status' },
              { header: t('installments.colDate'), key: 'data' },
            ],
            rows: filtered.map((d) => ({
              cliente: d.cliente_nome ?? '—', produto: d.produto_nome ?? '—',
              total: formatKz(d.valor_total), pago: formatKz(d.valor_pago), saldo: formatKz(d.saldo),
              status: d.status, data: format(new Date(d.criado_em), 'dd/MM/yyyy'),
            })),
            filename: 'dividas-clientes',
          })}
        >
          <FileDown className="size-4" />
          {t('common.downloadPdf')}
        </Button>
      </div>

      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('sales.colClient')}</TableHead>
              <TableHead>{t('sales.debtProduct')}</TableHead>
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
                  {t('sales.debtEmpty')}
                </TableCell>
              </TableRow>
            ) : (
              pageItems.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.cliente_nome ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{d.produto_nome ?? '—'}</TableCell>
                  <TableCell className="text-right">{formatKz(d.valor_total)}</TableCell>
                  <TableCell className="text-right text-green-600">{formatKz(d.valor_pago)}</TableCell>
                  <TableCell className="text-right font-medium text-destructive">{formatKz(d.saldo)}</TableCell>
                  <TableCell>
                    <Badge variant={d.status === 'PAGA' ? 'default' : 'destructive'}>{d.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(d.criado_em), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    {d.status !== 'PAGA' && (
                      <Button variant="ghost" size="icon" onClick={() => setPagarDivida(d)}>
                        <Wallet className="size-4 text-primary" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <PagarDividaDialog
        divida={pagarDivida}
        onSuccess={handlePago}
        onClose={() => setPagarDivida(null)}
        t={t}
      />
    </div>
  )
}

/* ── Main Page ────────────────────────────────────────────────── */
export default function VendasPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('sales.title')}</h1>
        <p className="text-muted-foreground text-sm">{t('sales.moduleSubtitle')}</p>
      </div>

      <Tabs defaultValue="vendas">
        <TabsList>
          <TabsTrigger value="vendas">{t('sales.tabSales')}</TabsTrigger>
          <TabsTrigger value="prestacoes">{t('sales.tabInstallments')}</TabsTrigger>
          <TabsTrigger value="dividas">{t('sales.tabDebts')}</TabsTrigger>
        </TabsList>
        <div className="mt-4">
          <TabsContent value="vendas"><VendasTab t={t} /></TabsContent>
          <TabsContent value="prestacoes"><PrestacoesPage /></TabsContent>
          <TabsContent value="dividas"><DividasCreditoTab t={t} /></TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
