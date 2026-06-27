import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Separator } from '@/app/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu'
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Warehouse,
  BarChart3,
  CreditCard,
  UsersRound,
  LogOut,
  Menu,
  Banknote,
  Globe,
} from 'lucide-react'
import vendosLogo from '@/assets/vendos-logo.png'
import { cn } from '@/app/components/ui/utils'
import { LANGUAGES, type LangCode } from '@/i18n/index'
import i18next from 'i18next'

const navDefs = [
  { to: '/',             key: 'dashboard',    icon: LayoutDashboard, gestorOnly: false },
  { to: '/produtos',     key: 'products',     icon: Package,         gestorOnly: false },
  { to: '/clientes',     key: 'clients',      icon: Users,           gestorOnly: false },
  { to: '/vendas',       key: 'sales',        icon: ShoppingCart,    gestorOnly: false },
  { to: '/prestacoes',   key: 'installments', icon: CreditCard,      gestorOnly: false },
  { to: '/stock',        key: 'stock',        icon: Warehouse,       gestorOnly: true  },
  { to: '/utilizadores', key: 'users',        icon: UsersRound,      gestorOnly: true  },
  { to: '/fluxo-caixa',  key: 'cashFlow',     icon: Banknote,        gestorOnly: true  },
  { to: '/relatorios',   key: 'reports',      icon: BarChart3,       gestorOnly: false },
]

/* ── Compact language picker (topbar + sidebar) ─────────────── */
function LangSelector({ align = 'end' }: { align?: 'start' | 'end' }) {
  const { i18n } = useTranslation()
  const current = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 px-2 h-8 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <Globe className="size-3.5 shrink-0" />
          <span>{current.flag}</span>
          <span className="uppercase">{current.code}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-[160px]">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => i18next.changeLanguage(lang.code)}
            className={cn(
              'gap-2 cursor-pointer',
              (i18n.language as LangCode) === lang.code && 'bg-accent font-medium'
            )}
          >
            <span>{lang.flag}</span>
            <span>{lang.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { t }                    = useTranslation()
  const { user, logout, isGestor } = useAuth()
  const location                 = useLocation()
  const navigate                 = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems = navDefs.filter((item) => !item.gestorOnly || isGestor)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-64 bg-card border-r flex flex-col transition-transform duration-200 md:relative md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand */}
        <div className="flex items-center justify-center px-4 py-3 border-b">
          <img src={vendosLogo} alt="ElectroVendos" className="h-12 w-auto object-contain" draggable={false} />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navItems.map(({ to, key, icon: Icon }) => {
            const active = location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="size-4 shrink-0" />
                {t(`nav.${key}`)}
              </Link>
            )
          })}
        </nav>

        {/* User footer */}
        <div className="px-3 py-3 border-t space-y-2">
          <div className="px-3 py-1">
            <p className="text-sm font-medium truncate">{user?.nome}</p>
            <Badge
              variant={isGestor ? 'default' : 'secondary'}
              className="text-xs mt-1"
            >
              {user?.role}
            </Badge>
          </div>
          <Separator />
          {/* Language selector in sidebar */}
          <div className="flex items-center justify-between px-1">
            <LangSelector align="start" />
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground"
            onClick={handleLogout}
          >
            <LogOut className="size-4" />
            {t('nav.logout')}
          </Button>
        </div>
      </aside>

      {/* Content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="flex items-center gap-2 px-4 py-3 border-b bg-card md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <img src={vendosLogo} alt="ElectroVendos" className="h-9 w-auto object-contain" draggable={false} />
          {/* Language selector — right side of topbar */}
          <div className="ml-auto">
            <LangSelector align="end" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
