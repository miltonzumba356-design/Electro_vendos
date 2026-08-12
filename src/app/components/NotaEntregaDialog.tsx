import { useEffect, useState } from 'react'
import type { TFunction } from 'i18next'
import { imprimirNotaEntrega, visualizarNotaEntrega } from '@/lib/recibo'
import type { NotaEntregaItem, NotaEntregaFormato } from '@/lib/recibo'
import type { ClienteResponse } from '@/types'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Textarea } from '@/app/components/ui/textarea'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { Combobox } from '@/app/components/ui/combobox'
import { Separator } from '@/app/components/ui/separator'
import { Eye, Printer } from 'lucide-react'

type ClienteModo = 'manual' | 'existente' | 'nenhum'

export interface NotaEntregaOrigem {
  tipo: 'venda' | 'fatura'
  ref: string
  clienteNome: string
  clienteNif: string | null
  data: string
  itens: { produto_nome: string; quantidade: number }[]
}

export function NotaEntregaDialog({
  origem, clientes, onClose, t,
}: {
  origem: NotaEntregaOrigem | null
  clientes: ClienteResponse[]
  onClose: () => void
  t: TFunction
}) {
  const [itens, setItens] = useState<NotaEntregaItem[]>([])
  const [motorista, setMotorista] = useState('')
  const [matricula, setMatricula] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [formato, setFormato] = useState<NotaEntregaFormato>('a4')

  const [clienteModo, setClienteModo] = useState<ClienteModo>('manual')
  const [clienteExistenteId, setClienteExistenteId] = useState('')
  const [clienteNome, setClienteNome] = useState('')
  const [clienteNif, setClienteNif] = useState('')
  const [clienteTelefone, setClienteTelefone] = useState('')
  const [clienteLocal, setClienteLocal] = useState('')

  useEffect(() => {
    if (origem) {
      setItens(origem.itens.map((i) => ({
        produto_nome: i.produto_nome, quantidade: i.quantidade, descricao: i.produto_nome,
      })))
      setMotorista('')
      setMatricula('')
      setObservacoes('')
      setFormato('a4')
      setClienteModo('manual')
      setClienteExistenteId('')
      setClienteNome(origem.clienteNome || '')
      setClienteNif(origem.clienteNif || '')
      setClienteTelefone('')
      setClienteLocal('')
    }
  }, [origem])

  function updateDescricao(i: number, value: string) {
    setItens((prev) => prev.map((item, idx) => (idx === i ? { ...item, descricao: value } : item)))
  }

  function handleSelecionarClienteExistente(id: string) {
    setClienteExistenteId(id)
    const c = clientes.find((c) => c.id === id)
    if (c) {
      setClienteNome(c.nome)
      setClienteNif(c.nif ?? '')
      setClienteTelefone(c.telefone ?? '')
      setClienteLocal(c.endereco ?? '')
    }
  }

  function buildDados() {
    if (!origem) return null
    const semCliente = clienteModo === 'nenhum'
    return {
      origemTipo: origem.tipo,
      origemRef: origem.ref,
      clienteNome: semCliente ? undefined : (clienteNome || undefined),
      clienteNif: semCliente ? undefined : (clienteNif || undefined),
      clienteTelefone: semCliente ? undefined : (clienteTelefone || undefined),
      clienteEndereco: semCliente ? undefined : (clienteLocal || undefined),
      data: origem.data,
      motorista: motorista || undefined,
      matricula: matricula || undefined,
      observacoes: observacoes || undefined,
      itens,
    }
  }

  function handlePreview() {
    const dados = buildDados()
    if (dados) visualizarNotaEntrega(dados, formato)
  }

  function handlePrint() {
    const dados = buildDados()
    if (dados) imprimirNotaEntrega(dados, formato)
  }

  return (
    <Dialog open={!!origem} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('deliveryNotes.dialogTitle')}</DialogTitle>
        </DialogHeader>
        {origem && (
          <div className="space-y-4 pt-2">
            <div className="space-y-3">
              <Label>{t('deliveryNotes.clientSection')}</Label>
              <div className="flex gap-2">
                {(['manual', 'existente', 'nenhum'] as const).map((m) => (
                  <Button
                    key={m}
                    type="button"
                    variant={clienteModo === m ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setClienteModo(m)}
                  >
                    {t(`deliveryNotes.clientMode.${m}`)}
                  </Button>
                ))}
              </div>

              {clienteModo === 'existente' && (
                <Combobox
                  options={clientes.map((c) => ({
                    value: c.id,
                    label: c.nome + (c.telefone ? ` · ${c.telefone}` : ''),
                  }))}
                  value={clienteExistenteId}
                  onValueChange={handleSelecionarClienteExistente}
                  placeholder={t('deliveryNotes.selectClientPlaceholder')}
                  searchPlaceholder={t('common.search')}
                  emptyText={t('clients.empty')}
                />
              )}

              {clienteModo !== 'nenhum' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="ne-cliente-nome">{t('deliveryNotes.fieldClientName')}</Label>
                    <Input
                      id="ne-cliente-nome"
                      value={clienteNome}
                      onChange={(e) => setClienteNome(e.target.value)}
                      placeholder={t('deliveryNotes.clientNamePlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ne-cliente-nif">{t('deliveryNotes.fieldClientNif')}</Label>
                    <Input
                      id="ne-cliente-nif"
                      value={clienteNif}
                      onChange={(e) => setClienteNif(e.target.value)}
                      placeholder={t('deliveryNotes.clientNifPlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ne-cliente-telefone">{t('deliveryNotes.fieldClientPhone')}</Label>
                    <Input
                      id="ne-cliente-telefone"
                      value={clienteTelefone}
                      onChange={(e) => setClienteTelefone(e.target.value)}
                      placeholder={t('deliveryNotes.clientPhonePlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ne-cliente-local">{t('deliveryNotes.fieldClientAddress')}</Label>
                    <Input
                      id="ne-cliente-local"
                      value={clienteLocal}
                      onChange={(e) => setClienteLocal(e.target.value)}
                      placeholder={t('deliveryNotes.clientAddressPlaceholder')}
                    />
                  </div>
                </div>
              )}

              {clienteModo === 'nenhum' && (
                <p className="text-xs text-muted-foreground">{t('deliveryNotes.noClientNote')}</p>
              )}
            </div>

            <Separator />

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
                <Label htmlFor="ne-motorista">{t('deliveryNotes.fieldDriver')}</Label>
                <Input
                  id="ne-motorista"
                  value={motorista}
                  onChange={(e) => setMotorista(e.target.value)}
                  placeholder={t('deliveryNotes.driverPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ne-matricula">{t('deliveryNotes.fieldPlate')}</Label>
                <Input
                  id="ne-matricula"
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                  placeholder={t('deliveryNotes.platePlaceholder')}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ne-observacoes">{t('deliveryNotes.fieldNotes')}</Label>
              <Textarea
                id="ne-observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder={t('deliveryNotes.notesPlaceholder')}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('deliveryNotes.fieldFormat')}</Label>
              <Select value={formato} onValueChange={(v) => setFormato(v as NotaEntregaFormato)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="a4">{t('deliveryNotes.formatA4')}</SelectItem>
                  <SelectItem value="termica80">{t('deliveryNotes.formatThermal80')}</SelectItem>
                  <SelectItem value="tpa58">{t('deliveryNotes.formatTpa58')}</SelectItem>
                </SelectContent>
              </Select>
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
