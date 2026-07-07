import React, { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '@/services/auth'
import { authStorage } from '@/lib/authStorage'
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
    const token = authStorage.getToken()
    const stored = authStorage.getUser()
    if (token && stored) {
      setUser({ token, nome: stored.nome, role: stored.role })
    }
    setIsLoading(false)
  }, [])

  async function login(data: LoginRequest) {
    const res = await authService.login(data)
    authStorage.set(res.access_token, res.nome, res.role)
    setUser({ token: res.access_token, nome: res.nome, role: res.role })
  }

  function logout() {
    authStorage.clear()
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
