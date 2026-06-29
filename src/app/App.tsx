import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { Layout } from '@/app/components/Layout'
import { Toaster } from '@/app/components/ui/sonner'
import LoginPage from '@/app/pages/LoginPage'
import DashboardPage from '@/app/pages/DashboardPage'
import ProdutosPage from '@/app/pages/ProdutosPage'
import ClientesPage from '@/app/pages/ClientesPage'
import VendasPage from '@/app/pages/VendasPage'
import StockPage from '@/app/pages/StockPage'
import PrestacoesPage from '@/app/pages/PrestacoesPage'
import UtilizadoresPage from '@/app/pages/UtilizadoresPage'
import RelatoriosPage from '@/app/pages/RelatoriosPage'
import FluxoCaixaPage from '@/app/pages/FluxoCaixaPage'
import FaturasPage from '@/app/pages/FaturasPage'

function ProtectedRoute({ children, gestorOnly = false }: {
  children: React.ReactNode
  gestorOnly?: boolean
}) {
  const { user, isLoading, isGestor } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-muted-foreground text-sm">A carregar...</div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (gestorOnly && !isGestor) return <Navigate to="/" replace />

  return <Layout>{children}</Layout>
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
      />
      <Route
        path="/produtos"
        element={<ProtectedRoute><ProdutosPage /></ProtectedRoute>}
      />
      <Route
        path="/clientes"
        element={<ProtectedRoute><ClientesPage /></ProtectedRoute>}
      />
      <Route
        path="/vendas"
        element={<ProtectedRoute><VendasPage /></ProtectedRoute>}
      />
      <Route
        path="/prestacoes"
        element={<ProtectedRoute><PrestacoesPage /></ProtectedRoute>}
      />
      <Route
        path="/stock"
        element={<ProtectedRoute gestorOnly><StockPage /></ProtectedRoute>}
      />
      <Route
        path="/utilizadores"
        element={<ProtectedRoute gestorOnly><UtilizadoresPage /></ProtectedRoute>}
      />
      <Route
        path="/fluxo-caixa"
        element={<ProtectedRoute gestorOnly><FluxoCaixaPage /></ProtectedRoute>}
      />
      <Route
        path="/faturas"
        element={<ProtectedRoute><FaturasPage /></ProtectedRoute>}
      />
      <Route
        path="/relatorios"
        element={<ProtectedRoute><RelatoriosPage /></ProtectedRoute>}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster richColors />
      </AuthProvider>
    </BrowserRouter>
  )
}
