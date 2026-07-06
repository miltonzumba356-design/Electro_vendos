import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'motion/react'
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import vendosLogo from '@/assets/vendos-logo.png'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/app/components/ui/form'
import { cn } from '@/app/components/ui/utils'
import { LANGUAGES, type LangCode } from '@/i18n/index'
import i18next from 'i18next'

/* ── Brand tokens ──────────────────────────────────────────── */
const BLUE   = '#0F6CB5'
const ORANGE = '#E97817'

/* ── Language selector ─────────────────────────────────────── */
function LanguagePicker() {
  const { i18n } = useTranslation()
  const current = i18n.language as LangCode

  return (
    <div className="flex flex-wrap gap-1.5 justify-center">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => i18next.changeLanguage(lang.code)}
          className={cn(
            'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all border',
            current === lang.code
              ? 'text-white border-transparent shadow-sm'
              : 'bg-transparent text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600',
          )}
          style={current === lang.code ? { background: BLUE } : undefined}
        >
          <span>{lang.flag}</span>
          <span>{lang.label}</span>
        </button>
      ))}
    </div>
  )
}

/* ── Tipos do formulário ───────────────────────────────────── */
type FormValues = { email: string; password: string }

interface FormContentProps {
  form:             ReturnType<typeof useForm<FormValues>>
  loading:          boolean
  showPassword:     boolean
  onTogglePassword: () => void
  onSubmit:         (data: FormValues) => Promise<void>
}

/* ── Formulário (ecrã único, igual em desktop e mobile) ───── */
function FormContent({ form, loading, showPassword, onTogglePassword, onSubmit }: FormContentProps) {
  const { t } = useTranslation()

  const fieldCls = cn(
    'h-14 rounded-2xl text-sm transition-all',
    'border border-[#E5E7EB] bg-[#F5F7FA] text-[#111827] placeholder:text-gray-400',
    'focus-visible:border-[#0F6CB5] focus-visible:ring-2 focus-visible:ring-[#0F6CB5]/20',
  )

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: BLUE }} />
                <FormControl>
                  <Input type="email" placeholder="milton@gmail.com" autoComplete="email" disabled={loading} className={cn(fieldCls, 'pl-11 pr-4')} {...field} />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: BLUE }} />
                <FormControl>
                  <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" autoComplete="current-password" disabled={loading} className={cn(fieldCls, 'pl-11 pr-12')} {...field} />
                </FormControl>
                <button type="button" onClick={onTogglePassword} disabled={loading} className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors" style={{ color: '#9CA3AF' }} tabIndex={-1}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Forgot */}
        <div className="flex justify-end -mt-1">
          <button type="button" className="text-sm font-medium hover:underline" style={{ color: ORANGE }}>
            {t('login.forgotPassword')}
          </button>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full h-14 rounded-[18px] text-white font-semibold border-0 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
          style={{
            background: loading
              ? '#94A3B8'
              : `linear-gradient(90deg, ${BLUE} 0%, #1a85d4 50%, ${ORANGE} 100%)`,
          }}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? t('login.submitting') : t('login.submit')}
        </Button>
      </form>
    </Form>
  )
}

/* ── Página ────────────────────────────────────────────────── */
export default function LoginPage() {
  const { t, i18n } = useTranslation()
  const { login }   = useAuth()
  const navigate    = useNavigate()
  const [loading, setLoading]           = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const formSchema = z.object({
    email:    z.string().email({ message: t('login.emailInvalid') }),
    password: z.string().min(1, { message: t('login.passwordRequired') }),
  })

  const form = useForm<FormValues>({
    resolver:      zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  })

  i18n.on('languageChanged', () => form.clearErrors())

  async function handleSubmit(data: FormValues) {
    setLoading(true)
    try {
      await login({ email: data.email, password: data.password })
      navigate('/')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('login.invalidCredentials'))
    } finally {
      setLoading(false)
    }
  }

  const baseProps = { form, loading, showPassword, onTogglePassword: () => setShowPassword((v) => !v), onSubmit: handleSubmit }

  const footer = (
    <p className="text-center text-sm text-gray-400 mt-2">
      {t('login.problems')}{' '}
      <button type="button" className="font-medium hover:underline" style={{ color: ORANGE }}>
        {t('login.contactSupport')}
      </button>
    </p>
  )

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{
        background: `linear-gradient(160deg, rgba(15,108,181,0.18) 0%, rgba(18,114,192,0.12) 50%, rgba(233,120,23,0.15) 100%), #f8fafd`,
      }}
    >
      {/* Logo header */}
      <div className="flex items-center justify-center px-8" style={{ height: '30vh' }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <img src={vendosLogo} alt="ElectroVendos" className="h-24 w-auto object-contain" draggable={false} />
        </motion.div>
      </div>

      {/* White card */}
      <motion.div
        className="flex-1 bg-white px-6 pt-8 pb-10 overflow-y-auto"
        style={{ borderRadius: '35px 35px 0 0', boxShadow: '0 -8px 32px rgba(15,108,181,0.14)' }}
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="max-w-[420px] mx-auto space-y-5">
          <div>
            <p className="text-xs text-gray-400 mb-2 text-center">{t('login.language')}</p>
            <LanguagePicker />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#111827] tracking-tight">{t('login.title')}</h1>
            <p className="text-sm text-gray-500 mt-1">{t('login.subtitle')}</p>
          </div>
          <FormContent {...baseProps} />
          {footer}
        </div>
      </motion.div>
    </div>
  )
}
