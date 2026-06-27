import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { vendasService } from '@/services/vendas'
import { produtosService } from '@/services/produtos'
import { clientesService } from '@/services/clientes'
import type { VendaResponse, ProdutoResponse, ClienteResponse, ItemVendaInput } from '@/types'
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
import { Separator } from '@/app/components/ui/separator'
import { Plus, Eye, Trash2, Search } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

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

export default function VendasPage() {
  const { t } = useTranslation()
  const [vendas, setVendas] = useState<VendaResponse[]>([])
  const [produtos, setProdutos] = useState<ProdutoResponse[]>([])
  const [clientes, setClientes] = useState<ClienteResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [novaVendaOpen, setNovaVendaOpen] = useState(false)
  const [detalhesVenda, setDetalhesVenda] = useState<VendaResponse | null>(null)

  const [clienteMode, setClienteMode] = useState<'existente' | 'novo' | 'nenhum'>('nenhum')
  const [clienteId, setClienteId] = useState('')
  const [novoClienteNome, setNovoClienteNome] = useState('')
  const [novoClienteTelefone, setNovoClienteTelefone] = useState('')
  const [itens, setItens] = useState<ItemForm[]>([{ produto_id: '', quantidade: 1 }])
  const [saving, setSaving] = useState(false)

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

  function openNovaVenda() {
    setClienteMode('nenhum')
    setClienteId('')
    setNovoClienteNome('')
    setNovoClienteTelefone('')
    setItens([{ produto_id: '', quantidade: 1 }])
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
    const vendaItens: ItemVendaInput[] = validItens.map((i) => ({
      produto_id: i.produto_id,
      quantidade: i.quantidade,
    }))
    setSaving(true)
    try {
      const payload = {
        itens: vendaItens,
        cliente_id: clienteMode === 'existente' && clienteId ? clienteId : null,
        cliente:
          clienteMode === 'novo' && novoClienteNome
            ? { nome: novoClienteNome, telefone: novoClienteTelefone || undefined }
            : null,
      }
      const nova = await vendasService.criar(payload)
      setVendas((prev) => [nova, ...prev])
      toast.success(t('sales.toasts.registered'))
      setNovaVendaOpen(false)
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

  const clienteModeLabel = (m: 'nenhum' | 'existente' | 'novo') => {
    if (m === 'nenhum')    return t('sales.noClient')
    if (m === 'existente') return t('sales.existingClient')
    return t('sales.newClient')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('sales.title')}</h1>
          <p className="text-muted-foreground text-sm">{t('sales.count', { count: vendas.length })}</p>
        </div>
        <Button onClick={openNovaVenda} className="gap-2 shrink-0">
          <Plus className="size-4" />
          {t('sales.new')}
        </Button>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder={t('sales.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
              <TableHead className="text-right">{t('sales.colActions')}</TableHead>
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
                  {t('sales.empty')}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((v) => (
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
                <Select value={clienteId} onValueChange={setClienteId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('sales.selectClient')} />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome} {c.telefone ? `· ${c.telefone}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {clienteMode === 'novo' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>{t('sales.clientName')} *</Label>
                    <Input
                      value={novoClienteNome}
                      onChange={(e) => setNovoClienteNome(e.target.value)}
                      placeholder={t('sales.clientName')}
                      required={clienteMode === 'novo'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('sales.clientPhone')}</Label>
                    <Input
                      value={novoClienteTelefone}
                      onChange={(e) => setNovoClienteTelefone(e.target.value)}
                      placeholder="923456789"
                    />
                  </div>
                </div>
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
                        <Select
                          value={item.produto_id}
                          onValueChange={(v) => updateItem(i, 'produto_id', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('sales.selectProduct')} />
                          </SelectTrigger>
                          <SelectContent>
                            {produtos.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.nome} — {formatKz(p.preco_com_iva)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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

      {/* Detalhes venda dialog */}
      <Dialog open={!!detalhesVenda} onOpenChange={() => setDetalhesVenda(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('sales.detailsTitle')}</DialogTitle>
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
    </div>
  )
}
