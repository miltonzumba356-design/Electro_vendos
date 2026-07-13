import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { vendasService } from '@/services/vendas'
import { faturasService } from '@/services/faturas'
import { clientesService } from '@/services/clientes'
import type { VendaResponse, FaturaResumida, ClienteResponse } from '@/types'
import { imprimirNotaEntrega, visualizarNotaEntrega } from '@/lib/recibo'
import type { NotaEntregaItem, NotaEntregaData } from '@/lib/recibo'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Textarea } from '@/app/components/ui/textarea'
import { Combobox } from '@/app/components/ui/combobox'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table'
import { Separator } from '@/app/components/ui/separator'
import { Eye, Printer } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

function formatKz(v: number) {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    maximumFractionDigits: 0,
  }).format(v)
}

interface OrigemInfo {
  clienteNome: string
  clienteNif: string | null
  data: string
  refLabel: string
}

export default function NotasEntregaPage() {
  const { t } = useTranslation()
  const [origemTipo, setOrigemTipo] = useState<'venda' | 'fatura'>('venda')
  const [vendas, setVendas] = useState<VendaResponse[]>([])
  const [faturas, setFaturas] = useState<FaturaResumida[]>([])
  const [clientes, setClientes] = useState<ClienteResponse[]>([])
  const [origemId, setOrigemId] = useState('')
  const [loadingOrigem, setLoadingOrigem] = useState(false)
  const [origemInfo, setOrigemInfo] = useState<OrigemInfo | null>(null)
  const [itens, setItens] = useState<NotaEntregaItem[]>([])
  const [motorista, setMotorista] = useState('')
  const [matricula, setMatricula] = useState('')
  const [observacoes, setObservacoes] = useState('')

  useEffect(() => {
    Promise.all([
      vendasService.listar().catch(() => []),
      faturasService.listar({ limit: 100 }).catch(() => ({ total: 0, faturas: [] })),
      clientesService.listar().catch(() => []),
    ]).then(([v, f, c]) => {
      setVendas(v)
      setFaturas(f.faturas)
      setClientes(c)
    })
  }, [])

  function trocarOrigemTipo(tipo: 'venda' | 'fatura') {
    setOrigemTipo(tipo)
    setOrigemId('')
    setOrigemInfo(null)
    setItens([])
  }

  async function selecionarOrigem(id: string) {
    setOrigemId(id)
    if (!id) { setOrigemInfo(null); setItens([]); return }
    setLoadingOrigem(true)
    try {
      if (origemTipo === 'venda') {
        const venda = await vendasService.buscar(id)
        const nif = clientes.find((c) => c.id === venda.cliente_id)?.nif ?? null
        setOrigemInfo({
          clienteNome: venda.cliente_nome,
          clienteNif: nif,
          data: venda.criado_em,
          refLabel: venda.id.slice(0, 8).toUpperCase(),
        })
        setItens(venda.itens.map((i) => ({
          produto_nome: i.produto_nome, quantidade: i.quantidade, descricao: i.produto_nome,
        })))
      } else {
        const fatura = await faturasService.buscar(id)
        setOrigemInfo({
          clienteNome: fatura.cliente_nome,
          clienteNif: fatura.cliente_nif,
          data: fatura.emitida_em,
          refLabel: fatura.numero,
        })
        setItens(fatura.itens.map((i) => ({
          produto_nome: i.produto_nome, quantidade: i.quantidade, descricao: i.produto_nome,
        })))
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('deliveryNotes.toasts.loadError'))
    } finally {
      setLoadingOrigem(false)
    }
  }

  function updateDescricao(i: number, value: string) {
    setItens((prev) => prev.map((item, idx) => (idx === i ? { ...item, descricao: value } : item)))
  }

  function buildDados(): NotaEntregaData | null {
    if (!origemInfo) return null
    return {
      origemTipo,
      origemRef: origemInfo.refLabel,
      clienteNome: origemInfo.clienteNome,
      clienteNif: origemInfo.clienteNif,
      data: origemInfo.data,
      motorista: motorista || undefined,
      matricula: matricula || undefined,
      observacoes: observacoes || undefined,
      itens,
    }
  }

  function handlePreview() {
    const dados = buildDados()
    if (!dados) { toast.error(t('deliveryNotes.toasts.selectSource')); return }
    visualizarNotaEntrega(dados)
  }

  function handlePrint() {
    const dados = buildDados()
    if (!dados) { toast.error(t('deliveryNotes.toasts.selectSource')); return }
    imprimirNotaEntrega(dados)
  }

  const vendaOptions = [...vendas]
    .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())
    .map((v) => ({
      value: v.id,
      label: `${format(new Date(v.criado_em), 'dd/MM/yyyy')} — ${v.cliente_nome} — ${formatKz(v.total_final)}`,
    }))

  const faturaOptions = faturas.map((f) => ({
    value: f.id,
    label: `${f.numero} — ${f.cliente_nome}`,
  }))

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('deliveryNotes.title')}</h1>
        <p className="text-muted-foreground text-sm">{t('deliveryNotes.subtitle')}</p>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant={origemTipo === 'venda' ? 'default' : 'outline'}
          size="sm"
          onClick={() => trocarOrigemTipo('venda')}
        >
          {t('deliveryNotes.sourceSale')}
        </Button>
        <Button
          type="button"
          variant={origemTipo === 'fatura' ? 'default' : 'outline'}
          size="sm"
          onClick={() => trocarOrigemTipo('fatura')}
        >
          {t('deliveryNotes.sourceInvoice')}
        </Button>
      </div>

      <div className="space-y-2 max-w-lg">
        <Label>{origemTipo === 'venda' ? t('deliveryNotes.selectSale') : t('deliveryNotes.selectInvoice')}</Label>
        <Combobox
          options={origemTipo === 'venda' ? vendaOptions : faturaOptions}
          value={origemId}
          onValueChange={selecionarOrigem}
          placeholder={origemTipo === 'venda' ? t('deliveryNotes.selectSale') : t('deliveryNotes.selectInvoice')}
          searchPlaceholder={t('common.search')}
          emptyText={t('deliveryNotes.emptySource')}
        />
      </div>

      {loadingOrigem && <p className="text-sm text-muted-foreground">{t('common.loading')}</p>}

      {origemInfo && !loadingOrigem && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('deliveryNotes.itemsTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">{t('common.client')}</p>
                <p className="font-medium">{origemInfo.clienteNome}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('deliveryNotes.colDate')}</p>
                <p className="font-medium">{format(new Date(origemInfo.data), 'dd/MM/yyyy')}</p>
              </div>
            </div>

            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('deliveryNotes.colProduct')}</TableHead>
                    <TableHead>{t('deliveryNotes.colDescription')}</TableHead>
                    <TableHead className="text-right">{t('deliveryNotes.colQuantity')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itens.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-muted-foreground">{item.produto_nome}</TableCell>
                      <TableCell>
                        <Input value={item.descricao} onChange={(e) => updateDescricao(i, e.target.value)} />
                      </TableCell>
                      <TableCell className="text-right">{item.quantidade}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="motorista">{t('deliveryNotes.fieldDriver')}</Label>
                <Input
                  id="motorista"
                  value={motorista}
                  onChange={(e) => setMotorista(e.target.value)}
                  placeholder={t('deliveryNotes.driverPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="matricula">{t('deliveryNotes.fieldPlate')}</Label>
                <Input
                  id="matricula"
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                  placeholder={t('deliveryNotes.platePlaceholder')}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="observacoes">{t('deliveryNotes.fieldNotes')}</Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder={t('deliveryNotes.notesPlaceholder')}
                rows={3}
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
              <Button type="button" variant="outline" className="gap-2" onClick={handlePreview}>
                <Eye className="size-4" />
                {t('deliveryNotes.preview')}
              </Button>
              <Button type="button" className="gap-2" onClick={handlePrint}>
                <Printer className="size-4" />
                {t('deliveryNotes.printOrDownload')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
