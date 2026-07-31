import { useState, useMemo, Fragment, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import type { FornecedorResponse, DividaFornecedorResponse } from '@/types'
import { Badge } from '@/app/components/ui/badge'
import { Input } from '@/app/components/ui/input'
import { Separator } from '@/app/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/ui/tooltip'
import { formatMoeda, detectarMoedaUnica } from '@/lib/moeda'
import { ArrowUp, ArrowDown, ArrowUpDown, Search } from 'lucide-react'
import { format } from 'date-fns'

// Bloco "Livro Razão" do histórico de um fornecedor — mesma estrutura do
// ClienteLivroRazao (Dados do Fornecedor, Resumo Financeiro, Linha Temporal
// Financeira e a tabela pesquisável/ordenável com saldo acumulado), para que
// as duas páginas de extrato tenham a mesma organização visual. Puramente
// apresentacional: recebe fornecedor/dividas já carregados por quem o usa —
// só reorganiza os dados existentes (dividas + pagamentos) para exibição
// cronológica com saldo acumulado.

function MiniStat({
  label, value, hint, danger, positive, destaque,
}: { label: string; value: string; hint?: string; danger?: boolean; positive?: boolean; destaque?: boolean }) {
  return (
    <div className="bg-muted/30 rounded-md p-3">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`truncate ${destaque ? 'text-xl font-bold' : 'text-sm font-semibold'} ${danger ? 'text-destructive' : positive ? 'text-green-600' : ''}`}>{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{hint}</p>}
    </div>
  )
}

// Par label/valor simples, sem caixa própria — usado dentro do cartão de
// perfil do fornecedor, que já é o contentor visual.
function Field({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium truncate">{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground truncate">{hint}</p>}
    </div>
  )
}

interface RazaoLinha {
  dividaId: string
  data: string
  documento: string
  tipo: 'Fatura' | 'Recibo'
  descricao: string
  debito?: number
  credito?: number
  // Convenção: saldo = crédito acumulado - débito acumulado, positivo quando
  // não há dívida (verde), negativo enquanto ainda devemos ao fornecedor
  // (vermelho) — mesma convenção usada no Livro Razão do cliente.
  saldo: number
}

type OrdenarPor = 'data' | 'documento' | 'tipo' | 'valor' | 'saldo'

function badgeTipoClass(tipo: 'Fatura' | 'Recibo') {
  return tipo === 'Fatura' ? 'text-blue-600 border-blue-200' : 'text-green-600 border-green-200'
}

function grupoTemporalDe(dataISO: string, t: TFunction): string {
  const d = new Date(dataISO)
  const dia = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const hoje = new Date()
  const hojeDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  const diffDias = Math.round((hojeDia.getTime() - dia.getTime()) / 86400000)
  if (diffDias <= 0) return t('reports.ledgerGroupToday')
  if (diffDias === 1) return t('reports.ledgerGroupYesterday')
  if (diffDias <= 7) return t('reports.ledgerGroupThisWeek')
  if (dia.getFullYear() === hojeDia.getFullYear() && dia.getMonth() === hojeDia.getMonth()) return t('reports.ledgerGroupThisMonth')
  return t('reports.ledgerGroupOlder')
}

function SortableHead({
  campo, ordenarPor, ordemAsc, onToggle, align, children,
}: {
  campo: OrdenarPor
  ordenarPor: OrdenarPor
  ordemAsc: boolean
  onToggle: (campo: OrdenarPor) => void
  align?: 'right'
  children: ReactNode
}) {
  const ativo = ordenarPor === campo
  return (
    <TableHead className={align === 'right' ? 'text-right' : ''}>
      <button
        type="button"
        className={`inline-flex items-center gap-1 hover:text-foreground transition-colors ${ativo ? 'text-foreground font-semibold' : ''}`}
        onClick={() => onToggle(campo)}
      >
        {children}
        {ativo ? (ordemAsc ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ArrowUpDown className="size-3 opacity-40" />}
      </button>
    </TableHead>
  )
}

export default function FornecedorLivroRazao({
  fornecedor, dividas,
}: {
  fornecedor: FornecedorResponse
  dividas: DividaFornecedorResponse[]
}) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [busca, setBusca] = useState('')
  const [ordenarPor, setOrdenarPor] = useState<OrdenarPor>('data')
  const [ordemAsc, setOrdemAsc] = useState(true)

  const totalComprado = dividas.reduce((s, d) => s + d.valor_total, 0)
  const totalPago = dividas.reduce((s, d) => s + d.valor_pago, 0)
  const totalDevido = dividas.reduce((s, d) => s + d.saldo, 0)
  const moedaUnica = detectarMoedaUnica(dividas)
  const fmt = (v: number) => formatMoeda(v, moedaUnica)

  // Fonte: cada dívida (compra a crédito) + os pagamentos aninhados nela —
  // toda dívida já traz o seu id, por isso tanto a linha da Factura como a de
  // cada Recibo sabem exatamente para que página de dívida navegar (a mesma
  // página de detalhe, /fornecedores/dividas/{id}).
  const razaoBase = useMemo<RazaoLinha[]>(() => {
    type Bruta = Omit<RazaoLinha, 'saldo'>
    const bruta: Bruta[] = []
    for (const d of dividas) {
      bruta.push({
        dividaId: d.id,
        data: d.criado_em,
        documento: d.numero != null ? `FT${String(d.numero).padStart(4, '0')}` : d.id.slice(0, 6).toUpperCase(),
        tipo: 'Fatura',
        descricao: d.produto_nome ?? t('reports.ledgerDescPurchase'),
        debito: d.valor_total,
      })
      for (const p of d.pagamentos) {
        bruta.push({
          dividaId: d.id,
          data: p.data_pagamento,
          documento: p.numero != null ? `RC${String(p.numero).padStart(4, '0')}` : `${d.id.slice(0, 4).toUpperCase()}-P`,
          tipo: 'Recibo',
          descricao: d.produto_nome ? `${t('reports.ledgerDescPayment')} — ${d.produto_nome}` : t('reports.ledgerDescPayment'),
          credito: p.valor,
        })
      }
    }
    bruta.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    let saldo = 0
    return bruta.map((r) => {
      saldo += (r.credito ?? 0) - (r.debito ?? 0)
      return { ...r, saldo }
    })
  }, [dividas, t])

  const razaoFiltrada = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    const base = termo
      ? razaoBase.filter((r) =>
          r.documento.toLowerCase().includes(termo) ||
          r.tipo.toLowerCase().includes(termo) ||
          r.descricao.toLowerCase().includes(termo) ||
          fmt(r.debito ?? r.credito ?? 0).toLowerCase().includes(termo)
        )
      : razaoBase
    const valorDe = (r: RazaoLinha) => r.debito ?? r.credito ?? 0
    const ordenadas = [...base].sort((a, b) => {
      let cmp = 0
      if (ordenarPor === 'data') cmp = new Date(a.data).getTime() - new Date(b.data).getTime()
      else if (ordenarPor === 'documento') cmp = a.documento.localeCompare(b.documento)
      else if (ordenarPor === 'valor') cmp = valorDe(a) - valorDe(b)
      else if (ordenarPor === 'saldo') cmp = a.saldo - b.saldo
      else if (ordenarPor === 'tipo') cmp = a.tipo.localeCompare(b.tipo)
      return ordemAsc ? cmp : -cmp
    })
    return ordenadas
  }, [razaoBase, busca, ordenarPor, ordemAsc])

  // Cabeçalhos de grupo (Hoje/Ontem/Esta Semana/...) só fazem sentido
  // enquanto a lista está em ordem cronológica.
  const linhasComGrupo = useMemo(() => {
    if (ordenarPor !== 'data') return razaoFiltrada.map((linha) => ({ grupo: null as string | null, linha }))
    let ultimoGrupo: string | null = null
    return razaoFiltrada.map((linha) => {
      const grupoAtual = grupoTemporalDe(linha.data, t)
      const mostrarGrupo = grupoAtual !== ultimoGrupo
      ultimoGrupo = grupoAtual
      return { grupo: mostrarGrupo ? grupoAtual : null, linha }
    })
  }, [razaoFiltrada, ordenarPor, t])

  function toggleSort(campo: OrdenarPor) {
    if (ordenarPor === campo) { setOrdemAsc((v) => !v); return }
    setOrdenarPor(campo)
    setOrdemAsc(true)
  }

  function abrirDocumento(dividaId: string) {
    navigate(`/fornecedores/dividas/${dividaId}`)
  }

  const ultimaCompra = useMemo(() => {
    if (dividas.length === 0) return null
    return [...dividas].sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())[0].criado_em
  }, [dividas])
  const saldoAtualExibido = -totalDevido
  const totalFaturas = razaoBase.filter((r) => r.tipo === 'Fatura').length
  const totalRecibos = razaoBase.filter((r) => r.tipo === 'Recibo').length
  const temSaldoEmAberto = totalDevido > 0

  return (
    <div className="space-y-5">
      {/* 1. Resumo do Fornecedor */}
      <div className="space-y-4">
        {/* Perfil — nome e estado em destaque, restante identificação como detalhe */}
        <div>
          <h4 className="text-sm font-semibold mb-2 text-muted-foreground">{t('reports.ledgerSupplierData')}</h4>
          <div className="rounded-md border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-lg font-bold leading-tight truncate">{fornecedor.nome}</p>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{t('reports.ledgerCode')}: {fornecedor.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <Badge variant={temSaldoEmAberto ? 'destructive' : 'default'} className="shrink-0">
                {temSaldoEmAberto ? t('reports.ledgerStatusOpen') : t('reports.ledgerStatusRegular')}
              </Badge>
            </div>
            <Separator className="my-3" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field label={t('suppliers.fieldNif')} value={fornecedor.nif ?? '—'} />
              <Field label={t('reports.ledgerContact')} value={fornecedor.telefone ?? '—'} />
              <Field label={t('reports.supplierSince')} value={format(new Date(fornecedor.criado_em), 'dd/MM/yyyy')} />
              <Field label={t('reports.lastPurchase')} value={ultimaCompra ? format(new Date(ultimaCompra), 'dd/MM/yyyy') : '—'} />
            </div>
          </div>
        </div>

        {/* Indicadores financeiros — saldo atual em destaque, restante em apoio */}
        <div>
          <h4 className="text-sm font-semibold mb-2 text-muted-foreground">{t('reports.ledgerFinancialSummary')}</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <MiniStat
              label={t('reports.ledgerCurrentBalance')}
              value={fmt(Math.abs(saldoAtualExibido))}
              danger={saldoAtualExibido < 0}
              positive={saldoAtualExibido > 0}
              destaque
            />
            <MiniStat label={t('reports.ledgerTotalPurchased')} value={fmt(totalComprado)} />
            <MiniStat label={t('reports.ledgerTotalPaid')} value={fmt(totalPago)} />
            <MiniStat label={t('reports.ledgerAvailableCredit')} value="—" hint={t('reports.ledgerNotTracked')} />
            <MiniStat label={t('reports.ledgerTotalInvoices')} value={String(totalFaturas)} />
            <MiniStat label={t('reports.ledgerTotalReceipts')} value={String(totalRecibos)} />
          </div>
        </div>
      </div>

      {/* 2. Linha Temporal Financeira */}
      {razaoBase.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2 text-muted-foreground">{t('reports.ledgerTimeline')}</h4>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <span className="shrink-0 rounded-full border px-3 py-1 text-xs bg-muted/40 whitespace-nowrap">
              {t('reports.ledgerInitialBalance')}
            </span>
            {razaoBase.map((linha, i) => (
              <div key={`${linha.dividaId}-${linha.documento}-${i}`} className="flex items-center gap-2 shrink-0">
                <span className="text-muted-foreground">→</span>
                <span className={`rounded-full border px-3 py-1 text-xs whitespace-nowrap ${badgeTipoClass(linha.tipo)}`}>
                  {linha.documento}
                </span>
              </div>
            ))}
            <span className="text-muted-foreground">→</span>
            <span className="shrink-0 rounded-full border px-3 py-1 text-xs bg-muted/40 whitespace-nowrap">
              {t('reports.ledgerCurrentBalance')}
            </span>
          </div>
        </div>
      )}

      {/* 3. Livro Razão */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h4 className="text-sm font-semibold text-muted-foreground">{t('reports.ledgerTitle')}</h4>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder={t('reports.ledgerSearchPlaceholder')}
              className="pl-8"
            />
          </div>
        </div>

        {razaoBase.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">{t('reports.ledgerEmpty')}</p>
        ) : linhasComGrupo.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">{t('reports.ledgerEmptyFiltered')}</p>
        ) : (
          <>
            {/* Desktop / tablet: tabela */}
            <div className="hidden md:block rounded-md border bg-card overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHead campo="data" ordenarPor={ordenarPor} ordemAsc={ordemAsc} onToggle={toggleSort}>
                      {t('common.date')}
                    </SortableHead>
                    <SortableHead campo="documento" ordenarPor={ordenarPor} ordemAsc={ordemAsc} onToggle={toggleSort}>
                      {t('reports.ledgerColDocument')}
                    </SortableHead>
                    <SortableHead campo="tipo" ordenarPor={ordenarPor} ordemAsc={ordemAsc} onToggle={toggleSort}>
                      {t('reports.colType')}
                    </SortableHead>
                    <TableHead>{t('deliveryNotes.colDescription')}</TableHead>
                    <SortableHead campo="valor" ordenarPor={ordenarPor} ordemAsc={ordemAsc} onToggle={toggleSort} align="right">
                      {t('reports.ledgerColDebit')}
                    </SortableHead>
                    <SortableHead campo="valor" ordenarPor={ordenarPor} ordemAsc={ordemAsc} onToggle={toggleSort} align="right">
                      {t('reports.ledgerColCredit')}
                    </SortableHead>
                    <SortableHead campo="saldo" ordenarPor={ordenarPor} ordemAsc={ordemAsc} onToggle={toggleSort} align="right">
                      {t('common.balance')}
                    </SortableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linhasComGrupo.map(({ grupo, linha }, i) => (
                    <Fragment key={`${linha.dividaId}-${linha.tipo}-${linha.documento}-${i}`}>
                      {grupo && (
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableCell colSpan={7} className="text-xs font-semibold text-muted-foreground py-1.5">
                            {grupo}
                          </TableCell>
                        </TableRow>
                      )}
                      <TableRow className="cursor-pointer hover:bg-muted/40" onClick={() => abrirDocumento(linha.dividaId)}>
                        <TableCell className="text-center text-muted-foreground text-sm">
                          {format(new Date(linha.data), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span
                                className="font-medium text-primary hover:underline cursor-pointer"
                                onClick={(e) => { e.stopPropagation(); abrirDocumento(linha.dividaId) }}
                              >
                                {linha.documento}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>{t('reports.ledgerViewDocument')}</TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={badgeTipoClass(linha.tipo)}>
                            {linha.tipo === 'Fatura' ? t('reports.ledgerBadgeInvoice') : t('reports.ledgerBadgeReceipt')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-[220px] truncate">{linha.descricao}</TableCell>
                        <TableCell className="text-right">{linha.debito ? fmt(linha.debito) : '—'}</TableCell>
                        <TableCell className="text-right text-green-600">{linha.credito ? fmt(linha.credito) : '—'}</TableCell>
                        <TableCell className={`text-right font-semibold ${linha.saldo > 0 ? 'text-green-600' : linha.saldo < 0 ? 'text-destructive' : ''}`}>
                          {fmt(linha.saldo)}
                        </TableCell>
                      </TableRow>
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile: cartões cronológicos */}
            <div className="md:hidden space-y-2">
              {linhasComGrupo.map(({ grupo, linha }, i) => (
                <Fragment key={`m-${linha.dividaId}-${linha.tipo}-${linha.documento}-${i}`}>
                  {grupo && <p className="text-xs font-semibold text-muted-foreground pt-2">{grupo}</p>}
                  <div
                    className="rounded-md border bg-card p-3 cursor-pointer active:bg-muted/40"
                    onClick={() => abrirDocumento(linha.dividaId)}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge variant="outline" className={badgeTipoClass(linha.tipo)}>
                          {linha.tipo === 'Fatura' ? t('reports.ledgerBadgeInvoice') : t('reports.ledgerBadgeReceipt')}
                        </Badge>
                        <span className="font-medium text-primary text-sm truncate">{linha.documento}</span>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{format(new Date(linha.data), 'dd/MM/yyyy')}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 truncate">{linha.descricao}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        {linha.debito
                          ? <span className="text-destructive">-{fmt(linha.debito)}</span>
                          : linha.credito
                            ? <span className="text-green-600">+{fmt(linha.credito)}</span>
                            : '—'}
                      </span>
                      <span className={`font-semibold ${linha.saldo > 0 ? 'text-green-600' : linha.saldo < 0 ? 'text-destructive' : ''}`}>
                        {fmt(linha.saldo)}
                      </span>
                    </div>
                  </div>
                </Fragment>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
