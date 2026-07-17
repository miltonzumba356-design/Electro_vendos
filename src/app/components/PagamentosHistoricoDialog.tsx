import type { TFunction } from 'i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { Badge } from '@/app/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table'
import { format } from 'date-fns'

function formatKz(v: number) {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    maximumFractionDigits: 0,
  }).format(v)
}

export interface PagamentoHistoricoItem {
  valor: number
  moeda: string
  data_pagamento: string
}

// Histórico de pagamentos de uma dívida (cliente ou fornecedor) — o valor
// fica sempre em Kz, a moeda é só um registo informativo de cada pagamento.
export function PagamentosHistoricoDialog({
  titulo, pagamentos, onClose, t,
}: {
  titulo: string | null
  pagamentos: PagamentoHistoricoItem[]
  onClose: () => void
  t: TFunction
}) {
  return (
    <Dialog open={!!titulo} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('installments.paymentHistoryTitle')}</DialogTitle>
        </DialogHeader>
        {titulo && (
          <div className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">{titulo}</p>
            {pagamentos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">{t('installments.paymentHistoryEmpty')}</p>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('common.date')}</TableHead>
                      <TableHead className="text-right">{t('common.total')}</TableHead>
                      <TableHead>{t('suppliers.paymentCurrency')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagamentos.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(p.data_pagamento), 'dd/MM/yyyy HH:mm')}
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatKz(p.valor)}</TableCell>
                        <TableCell><Badge variant="outline">{p.moeda}</Badge></TableCell>
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
  )
}
