# SDD — ElectroVendos
## Specification-Driven Development Document

**Versão:** 1.0  
**Data:** 2026-06-29  
**Aplicação:** ElectroVendos — Sistema de Gestão de Vendas  
**API:** Bisness SAIDE v1.0

---

## 1. Visão Geral do Sistema

ElectroVendos é uma aplicação web de gestão comercial que actua como frontend para a API REST "Bisness SAIDE". Permite gerir produtos, clientes, vendas a pronto, vendas a prestações, stock, faturas, fluxo de caixa e relatórios.

### 1.1 Objectivos
- Registar e consultar vendas em tempo real
- Gerir planos de pagamento a prestações com controlo de vencimentos e multas
- Emitir e gerir faturas com itens livres e IVA configurável
- Monitorizar stock com alertas de nível mínimo
- Produzir relatórios financeiros por período, cliente e produto
- Suporte multi-idioma (PT / EN / FR / ZH / AR)

### 1.2 Utilizadores
| Role | Acesso |
|------|--------|
| `GESTOR` | Acesso total — todos os módulos incluindo Stock, Utilizadores e Fluxo de Caixa |
| `OPERADOR` | Vendas, Clientes, Produtos (leitura), Prestações, Faturas, Relatórios |

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework UI | React | 18.3.1 |
| Linguagem | TypeScript | — |
| Bundler | Vite | 6.3.5 |
| Estilização | Tailwind CSS | 4.1.12 |
| Componentes | shadcn/ui (Radix UI) | — |
| Routing | React Router | 7.13.0 |
| Gráficos | Recharts | 2.15.2 |
| Formulários | React Hook Form + Zod | 7.55.0 / 4.x |
| i18n | i18next + react-i18next | 26.x / 17.x |
| Notificações | Sonner | 2.0.3 |
| Ícones | Lucide React | 0.487.0 |
| Datas | date-fns | 3.6.0 |
| Testes | Vitest + Testing Library | 4.x |

---

## 3. Arquitectura

### 3.1 Estrutura de Ficheiros

```
ElectroVendos/
├── public/
│   └── _redirects              # Fallback SPA para Netlify/static hosts
├── src/
│   ├── assets/                 # Logo, imagens estáticas
│   ├── app/
│   │   ├── App.tsx             # BrowserRouter + rotas protegidas
│   │   ├── components/
│   │   │   ├── Layout.tsx      # Sidebar responsiva + navbar
│   │   │   ├── AiAssistant.tsx # Chat widget IA flutuante
│   │   │   └── ui/             # shadcn/ui components (button, dialog, table, …)
│   │   └── pages/
│   │       ├── LoginPage.tsx
│   │       ├── DashboardPage.tsx
│   │       ├── ProdutosPage.tsx
│   │       ├── ClientesPage.tsx
│   │       ├── VendasPage.tsx
│   │       ├── PrestacoesPage.tsx
│   │       ├── FaturasPage.tsx
│   │       ├── StockPage.tsx
│   │       ├── RelatoriosPage.tsx
│   │       ├── FluxoCaixaPage.tsx
│   │       └── UtilizadoresPage.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx     # JWT em localStorage, hook useAuth
│   ├── i18n/
│   │   ├── index.ts            # Configuração i18next, LANGUAGES map
│   │   └── locales/            # pt.ts · en.ts · fr.ts · zh.ts · ar.ts
│   ├── lib/
│   │   ├── api.ts              # Cliente HTTP base (fetch + auth automática)
│   │   └── recibo.ts           # Impressão de recibos via window.print()
│   ├── services/               # Uma função por endpoint da API
│   │   ├── auth.ts
│   │   ├── clientes.ts
│   │   ├── produtos.ts
│   │   ├── vendas.ts
│   │   ├── stock.ts
│   │   ├── prestacoes.ts
│   │   ├── faturas.ts
│   │   ├── relatorios.ts
│   │   ├── fluxo-caixa.ts
│   │   └── ia.ts
│   └── types/
│       └── index.ts            # Todos os tipos TypeScript derivados da OpenAPI
├── vite.config.ts              # appType: 'spa' para fallback F5
├── SDD.md                      # Este documento
└── ducumenti_API.md            # Especificação OpenAPI da API backend
```

### 3.2 Fluxo de Dados

```
Utilizador → Página → Service → api.ts → API REST
                                   ↑
                           AuthContext (Bearer token injectado automaticamente)
```

`api.ts` injeta o header `Authorization: Bearer <token>` em todos os pedidos. Erros 401 fazem logout automático.

### 3.3 Rotas

| Rota | Componente | Role mínima |
|------|-----------|------------|
| `/login` | LoginPage | — (pública) |
| `/` | DashboardPage | OPERADOR |
| `/produtos` | ProdutosPage | OPERADOR |
| `/clientes` | ClientesPage | OPERADOR |
| `/vendas` | VendasPage | OPERADOR |
| `/prestacoes` | PrestacoesPage | OPERADOR |
| `/faturas` | FaturasPage | OPERADOR |
| `/stock` | StockPage | GESTOR |
| `/utilizadores` | UtilizadoresPage | GESTOR |
| `/fluxo-caixa` | FluxoCaixaPage | GESTOR |
| `/relatorios` | RelatoriosPage | OPERADOR |

---

## 4. Módulos e Especificações

### 4.1 Autenticação (`/auth`)

**Especificação:**
- Login via `POST /auth/login` → recebe `access_token` + `nome` + `role`
- Token guardado em `localStorage` com chave `ev_token`
- `GET /auth/me` valida sessão no arranque da app
- Logout limpa localStorage e redireciona para `/login`

**Estados:**
- `isLoading: true` enquanto valida token inicial
- `isGestor: boolean` derivado de `role === 'GESTOR'`

---

### 4.2 Produtos (`/produtos`)

**Especificação:**
- Listagem paginada com filtro por nome/código de barras (client-side)
- CRUD completo para GESTOR; OPERADOR só lê
- Badge de estado Ativo/Inativo
- Stock mínimo — alertas visuais quando `stock_atual < stock_minimo`

**Endpoints cobertos:**
| Método | Endpoint | Acção |
|--------|---------|-------|
| GET | `/produtos` | Listar todos |
| POST | `/produtos` | Criar |
| GET | `/produtos/{id}` | Detalhe |
| PUT | `/produtos/{id}` | Actualizar |
| DELETE | `/produtos/{id}` | Remover/desactivar |
| GET | `/produtos/stock/baixo` | Stock abaixo do mínimo |

---

### 4.3 Clientes (`/clientes`)

**Especificação:**
- CRUD completo, todos os roles
- Campos: nome*, telefone, email, NIF, endereço
- Pesquisa por nome em tempo real (client-side)

**Endpoints cobertos:**
| Método | Endpoint |
|--------|---------|
| GET | `/clientes` |
| POST | `/clientes` |
| GET | `/clientes/{id}` |
| PUT | `/clientes/{id}` |
| DELETE | `/clientes/{id}` |

---

### 4.4 Vendas (`/vendas`)

**Especificação:**
- Registo de venda com cliente (existente, novo inline ou anónimo) + itens dinâmicos
- Cálculo automático de IVA, desconto e total final
- Impressão de recibo automática após registo + botão manual no detalhe
- Recibo gerado via `window.open + document.write + window.print()` (formato térmico 302px)

**Payload de criação:**
```ts
VendaCreate {
  cliente_id?: string | null
  cliente?: { nome, telefone } | null   // cliente novo inline
  itens: [{ produto_id, quantidade }]
}
```

**Endpoints cobertos:**
| Método | Endpoint |
|--------|---------|
| GET | `/vendas` |
| POST | `/vendas` |
| GET | `/vendas/{id}` |

---

### 4.5 Prestações (`/prestacoes`)

**Especificação — Tab Planos:**
- Criar plano: seleccionar cliente (Combobox), produto financiado (Combobox), valor total, nº prestações (1–48), taxa multa (%), data início
- Listar todos os planos com estado (PAGO / PENDENTE / ATRASADO / PARCIAL)
- Ver detalhe: produto, data início, taxa multa, lista de parcelas com data vencimento e multa acumulada
- Registar pagamento: valor + data

**Especificação — Tab Dívidas:**
- Agrega prestações por cliente client-side (sem chamada extra)
- Filtro por nome em tempo real
- Click → detalhe via `GET /prestacoes/clientes/{id}/dividas`
- Mostra 4 KPIs + tabela de planos do cliente

**Especificação — Tab Vencimentos:**
- Filtro por Ano + Mês → `GET /prestacoes/vencimentos-mes?ano=&mes=`
- Tabela com cliente, produto, valor, data vencimento, dias em atraso
- Linhas em atraso destacadas a vermelho

**Payload de criação (correcto):**
```ts
PrestacaoCreate {
  cliente_id: string
  produto_id: string
  valor_total: number
  numero_prestacoes: number      // 1–48
  data_inicio?: string | null    // ISO 8601
  taxa_multa?: number            // 0–100
}
```

**Endpoints cobertos:**
| Método | Endpoint |
|--------|---------|
| GET | `/prestacoes` |
| POST | `/prestacoes` |
| GET | `/prestacoes/{id}` |
| POST | `/prestacoes/{id}/pagamentos` |
| GET | `/prestacoes/clientes/{id}/dividas` |
| GET | `/prestacoes/vencimentos-mes` |

---

### 4.6 Faturas (`/faturas`)

**Especificação — Tab Lista:**
- Filtros: cliente (Combobox), data início, data fim → `GET /faturas?...`
- Nova fatura: cliente + itens livres (descrição + qtd + preço + IVA) + desconto %
- IVA default 14% por item, configurável por linha
- Preview de totais (sem IVA / IVA / desconto / total final) em tempo real
- Ver detalhe de fatura completa incluindo todos os itens
- Cancelar fatura activa → `POST /faturas/{id}/cancelar`

**Especificação — Tab Estatísticas:**
- Filtro por período → `GET /faturas/performance/estatisticas`
- 4 KPIs de resumo (emitidas, canceladas, activas, taxa cancelamento)
- 3 KPIs de valores (total faturado, média, maior fatura)
- Top clientes por valor faturado

**Payload de criação:**
```ts
FaturaCreate {
  cliente_id: string
  itens: [{ produto_nome: string, quantidade, preco_unitario, iva? }]
  desconto_percentual?: number | null
}
```

**Endpoints cobertos:**
| Método | Endpoint |
|--------|---------|
| GET | `/faturas` |
| POST | `/faturas` |
| GET | `/faturas/{id}` |
| POST | `/faturas/{id}/cancelar` |
| GET | `/faturas/performance/estatisticas` |

---

### 4.7 Stock (`/stock`) — apenas GESTOR

**Especificação:**
- Histórico de movimentos com filtro por produto
- Registar movimento: ENTRADA ou SAÍDA, quantidade, motivo, preço unitário
- Botão de impressão de recibo para movimentos ENTRADA

**Endpoints cobertos:**
| Método | Endpoint |
|--------|---------|
| GET | `/stock/movimentos` |
| POST | `/stock/movimento` |

---

### 4.8 Fluxo de Caixa (`/caixa`) — apenas GESTOR

**Especificação:**
- Lançamentos manuais (ENTRADA / SAÍDA) com categoria
- Sincronização automática com vendas/pagamentos/compras de stock
- Demonstrativo financeiro por período (entradas e saídas agrupadas por categoria)
- Saldo actual em tempo real
- Histórico de sincronizações

**Endpoints cobertos:**
| Método | Endpoint |
|--------|---------|
| GET | `/caixa/lancamentos` |
| POST | `/caixa/lancamentos` |
| DELETE | `/caixa/lancamentos/{id}` |
| GET | `/caixa/saldo` |
| POST | `/caixa/sincronizar` |
| GET | `/caixa/demonstrativo` |
| GET | `/caixa/sincronizacoes` |

---

### 4.9 Relatórios (`/relatorios`)

**Especificação — 8 relatórios em Tabs:**

| Tab | Endpoint | Parâmetros |
|-----|---------|-----------|
| Por Período | `GET /relatorios/vendas/periodo` | data_inicio, data_fim |
| Diário | `GET /relatorios/vendas/diario` | data |
| Mensal | `GET /relatorios/vendas/mensal` | ano, mes |
| Por Cliente | `GET /relatorios/vendas/por-cliente` | data_inicio, data_fim |
| Clientes Fiéis | `GET /relatorios/clientes/fieis` | — |
| Clientes Inativos | `GET /relatorios/clientes/inativos` | dias_sem_compra |
| Mais Vendidos | `GET /relatorios/produtos/mais-vendidos` | limit |
| Stock Crítico | `GET /relatorios/produtos/stock-critico` | — |

---

### 4.10 Utilizadores (`/auth/utilizadores`) — apenas GESTOR

**Especificação:**
- Listar todos os utilizadores registados
- Criar novo utilizador com role (GESTOR / OPERADOR)
- Activar / Desactivar conta

---

### 4.11 Assistente IA (`/ia`)

**Especificação:**
- Widget flutuante (botão fixo no canto inferior direito)
- Criar sessão → enviar perguntas em linguagem natural
- Respostas da IA sobre os dados do negócio
- Histórico de mensagens por sessão (scroll infinito)

**Endpoints cobertos:**
| Método | Endpoint |
|--------|---------|
| GET | `/ia/sessoes` |
| POST | `/ia/sessoes` |
| GET | `/ia/sessoes/{id}/mensagens` |
| POST | `/ia/sessoes/{id}/perguntar` |
| DELETE | `/ia/sessoes/{id}` |

---

## 5. Modelos de Dados Principais

### 5.1 PrestacaoCreate
```ts
{
  cliente_id: string
  produto_id: string
  valor_total: number
  numero_prestacoes: number  // 1–48
  data_inicio?: string | null
  taxa_multa?: number        // percentagem 0–100
}
```

### 5.2 PrestacaoResponse
```ts
{
  id: string
  produto_id: string
  produto_nome: string
  cliente_id: string
  cliente_nome: string
  valor_total: number
  valor_pago: number
  saldo: number
  numero_prestacoes: number
  taxa_multa: number
  data_inicio: string
  situacao: 'PAGO' | 'PENDENTE' | 'ATRASADO' | 'PARCIAL'
  criado_em: string
  pagamentos: PagamentoResponse[]
}
```

### 5.3 PagamentoResponse
```ts
{
  id: string
  valor: number
  data_vencimento: string
  data_pagamento: string | null
  pago: boolean
  multa: number
}
```

### 5.4 FaturaCreate
```ts
{
  cliente_id: string
  itens: [{ produto_nome: string, quantidade: number, preco_unitario: number, iva?: number }]
  desconto_percentual?: number | null
}
```

### 5.5 FaturaResponse
```ts
{
  id: string
  numero: string        // ex: "FAT-000001"
  cliente_id: string
  cliente_nome: string
  cliente_nif: string | null
  total_sem_iva: number
  total_iva: number
  total_desconto: number
  total_final: number
  emitida_em: string
  cancelada_em: string | null
  itens: FaturaItemResponse[]
}
```

### 5.6 VencimentoResponse
```ts
{
  prestacao_id: string
  pagamento_id: string
  cliente_nome: string
  produto_nome: string
  valor: number
  data_vencimento: string
  dias_atraso: number
}
```

---

## 6. Internacionalização (i18n)

**Idiomas suportados:**

| Código | Língua | Ficheiro |
|--------|-------|---------|
| `pt` | Português (padrão) | `src/i18n/locales/pt.ts` |
| `en` | English | `src/i18n/locales/en.ts` |
| `fr` | Français | `src/i18n/locales/fr.ts` |
| `zh` | 中文 | `src/i18n/locales/zh.ts` |
| `ar` | العربية | `src/i18n/locales/ar.ts` |

**Namespaces de tradução:**

| Namespace | Conteúdo |
|-----------|---------|
| `common` | Labels globais (cancelar, guardar, pesquisar, cliente, filtrar…) |
| `nav` | Itens da navegação lateral |
| `login` | Página de autenticação |
| `dashboard` | Painel principal |
| `products` | Módulo de produtos |
| `clients` | Módulo de clientes |
| `sales` | Módulo de vendas |
| `stock` | Módulo de stock |
| `installments` | Módulo de prestações |
| `invoices` | Módulo de faturas |
| `reports` | Módulo de relatórios |
| `cashFlow` | Fluxo de caixa |
| `users` | Utilizadores |
| `ai` | Assistente IA |

---

## 7. Impressão de Recibos

**Implementado em:** `src/lib/recibo.ts`

**Funciona via:** `window.open('', '_blank') + document.write(html) + window.print()`  
(sem dependências externas — funciona em qualquer browser moderno)

**Formato:** Recibo térmico 302px de largura, fonte monoespaçada, cabeçalho + itens + totais + rodapé

**Triggers:**
- `imprimirVenda(venda)` — chamado automaticamente após registo de venda + botão no detalhe
- `imprimirEntradaStock(movimento)` — botão na linha de ENTRADA na tabela de stock

---

## 8. Configuração e Deployment

### 8.1 Variáveis de Ambiente
```env
VITE_API_BASE_URL=http://localhost:8000
```

### 8.2 Desenvolvimento Local
```bash
npm install
npm run dev      # http://localhost:5173
```

### 8.3 Build de Produção
```bash
npm run build    # gera /dist
```

### 8.4 SPA Fallback
- **Dev/Preview:** `vite.config.ts` → `appType: 'spa'` (Vite serve `index.html` para todas as rotas)
- **Netlify/Vercel/static:** `public/_redirects` → `/* /index.html 200`
- **Apache:** configurar `mod_rewrite` para redirecionar para `index.html`
- **Nginx:** `try_files $uri $uri/ /index.html`

### 8.5 Testes
```bash
npm test             # Vitest (run once)
npm run test:watch   # Modo watch
npm run test:coverage
```

---

## 9. Cobertura de Endpoints da API

| Módulo | Endpoints na API | Implementados | Cobertura |
|--------|----------------|--------------|-----------|
| Auth | 5 | 5 | 100% |
| Produtos | 6 | 6 | 100% |
| Clientes | 5 | 5 | 100% |
| Vendas | 3 | 3 | 100% |
| Prestações | 6 | 6 | 100% |
| Faturas | 5 | 5 | 100% |
| Stock | 2 | 2 | 100% |
| Fluxo de Caixa | 7 | 7 | 100% |
| Relatórios | 8 | 8 | 100% |
| Utilizadores | 3 | 3 | 100% |
| IA | 5 | 5 | 100% |
| **Total** | **55** | **55** | **100%** |

---

## 10. Decisões de Design Notáveis

| Decisão | Justificação |
|---------|-------------|
| `cmdk` com `shouldFilter={false}` | Evita reset do estado de pesquisa em re-renders de componentes pai (dialog) |
| Agregação de dívidas client-side | Evita N+1 chamadas à API; usa `useMemo` sobre a lista de prestações já carregada |
| `appType: 'spa'` no Vite config | Solução oficial Vite 6 para SPA fallback — substitui plugins `configureServer` customizados |
| Recibos via `window.print()` | Zero dependências; funciona offline; sem geração de PDF no servidor |
| Itens de fatura como texto livre | API `/faturas` não tem FK para produtos — permite faturar serviços e itens ad-hoc |
| `PrestacaoCreate` sem `venda_id` | A API Bisness SAIDE v1 mudou o schema — prestação é agora independente de uma venda específica |
