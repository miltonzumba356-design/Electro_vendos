import React, { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '@/services/auth'
import type { LoginRequest } from '@/types'

interface AuthUser {
  nome: string
  role: string
  token: string
}

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isGestor: boolean
  login: (data: LoginRequest) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const nome = localStorage.getItem('user_nome')
    const role = localStorage.getItem('user_role')
    if (token && nome && role) {
      setUser({ token, nome, role })
    }
    setIsLoading(false)
  }, [])

  async function login(data: LoginRequest) {
    const res = await authService.login(data)
    localStorage.setItem('token', res.access_token)
    localStorage.setItem('user_nome', res.nome)
    localStorage.setItem('user_role', res.role)
    setUser({ token: res.access_token, nome: res.nome, role: res.role })
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user_nome')
    localStorage.removeItem('user_role')
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isGestor: user?.role === 'GESTOR',
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
