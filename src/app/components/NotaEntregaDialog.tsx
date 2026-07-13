import { useEffect, useState } from 'react'
import type { TFunction } from 'i18next'
import { imprimirNotaEntrega, visualizarNotaEntrega } from '@/lib/recibo'
import type { NotaEntregaItem } from '@/lib/recibo'
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
import { Separator } from '@/app/components/ui/separator'
import { Eye, Printer } from 'lucide-react'

export interface NotaEntregaOrigem {
  tipo: 'venda' | 'fatura'
  ref: string
  clienteNome: string
  clienteNif: string | null
  data: string
  itens: { produto_nome: string; quantidade: number }[]
}

export function NotaEntregaDialog({
  origem, onClose, t,
}: {
  origem: NotaEntregaOrigem | null
  onClose: () => void
  t: TFunction
}) {
  const [itens, setItens] = useState<NotaEntregaItem[]>([])
  const [motorista, setMotorista] = useState('')
  const [matricula, setMatricula] = useState('')
  const [observacoes, setObservacoes] = useState('')

  useEffect(() => {
    if (origem) {
      setItens(origem.itens.map((i) => ({
        produto_nome: i.produto_nome, quantidade: i.quantidade, descricao: i.produto_nome,
      })))
      setMotorista('')
      setMatricula('')
      setObservacoes('')
    }
  }, [origem])

  function updateDescricao(i: number, value: string) {
    setItens((prev) => prev.map((item, idx) => (idx === i ? { ...item, descricao: value } : item)))
  }

  function buildDados() {
    if (!origem) return null
    return {
      origemTipo: origem.tipo,
      origemRef: origem.ref,
      clienteNome: origem.clienteNome,
      clienteNif: origem.clienteNif,
      data: origem.data,
      motorista: motorista || undefined,
      matricula: matricula || undefined,
      observacoes: observacoes || undefined,
      itens,
    }
  }

  function handlePreview() {
    const dados = buildDados()
    if (dados) visualizarNotaEntrega(dados)
  }

  function handlePrint() {
    const dados = buildDados()
    if (dados) imprimirNotaEntrega(dados)
  }

  return (
    <Dialog open={!!origem} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('deliveryNotes.dialogTitle')}</DialogTitle>
        </DialogHeader>
        {origem && (
          <div className="space-y-4 pt-2">
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
