import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'motion/react'
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import vendosLogo from '@/assets/vendos-logo.png'
import loginIllustration from '@/assets/login-illustration.jpg'
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

/* ── Animação (mobile) ─────────────────────────────────────── */
const containerVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
}
const itemVariants = {
  hidden:  { y: 16, opacity: 0 },
  visible: { y: 0,  opacity: 1 },
}

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

/* ── Painel direito — imagem (mobile desktop antigo) ───────── */
function ImagePanel() {
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: '#EEF4FB' }}>
      <img
        src={loginIllustration}
        alt="ElectroVendos — gestão de vendas"
        className="absolute inset-0 w-full h-full object-contain p-8"
        draggable={false}
      />
      <div
        className="absolute bottom-0 inset-x-0 py-3 px-6 flex items-center justify-center"
        style={{ background: `linear-gradient(to top, ${BLUE}33, transparent)` }}
      >
        <img src={vendosLogo} alt="ElectroVendos" className="h-12 w-auto object-contain" draggable={false} />
      </div>
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

/* ── Formulário mobile (mantido igual) ────────────────────── */
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

/* ── Formulário DESKTOP — novo design ─────────────────────── */
function DesktopFormContent({ form, loading, showPassword, onTogglePassword, onSubmit }: FormContentProps) {
  const { t } = useTranslation()

  const inputCls = cn(
    'h-[42px] rounded-[5px] border border-[#ECECEC] bg-white px-3',
    'text-sm text-[#2F3A4F] placeholder:text-[#A8B3C5]',
    'focus-visible:ring-1 focus-visible:ring-[#0F6CB5]/30 focus-visible:border-[#0F6CB5]',
    'transition-all duration-200 shadow-none',
  )
  const labelCls = 'block text-[12px] font-[500] text-[#A0A7B5] mb-[6px]'

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <label className={labelCls}>Email</label>
              <FormControl>
                <Input type="email" placeholder="user@example.com" autoComplete="email" disabled={loading} className={inputCls} {...field} />
              </FormControl>
              <FormMessage className="text-[11px]" />
            </FormItem>
          )}
        />

        {/* Password */}
        <div className="mt-5">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <label className={labelCls}>Password</label>
                <div className="relative">
                  <FormControl>
                    <Input type={showPassword ? 'text' : 'password'} placeholder="Enter your password" autoComplete="current-password" disabled={loading} className={cn(inputCls, 'pr-10')} {...field} />
                  </FormControl>
                  <button
                    type="button"
                    onClick={onTogglePassword}
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:text-[#0F6CB5]"
                    style={{ color: '#A8B3C5' }}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <FormMessage className="text-[11px]" />
              </FormItem>
            )}
          />
        </div>

        {/* Forgot */}
        <div className="mt-3 flex justify-end">
          <button type="button" className="text-[11px] text-[#A0A7B5] hover:text-[#0F6CB5] transition-colors">
            {t('login.forgotPassword')}
          </button>
        </div>

        {/* Submit */}
        <div className="mt-[30px]">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-1.5 text-white font-semibold text-[11px] tracking-wider rounded-[2px] transition-all hover:opacity-90 active:scale-95"
            style={{
              width: 100,
              height: 36,
              background: loading ? '#94A3B8' : BLUE,
            }}
          >
            {loading && <Loader2 className="h-3 w-3 animate-spin" />}
            {loading ? 'A ENTRAR' : 'LOGIN'}
          </button>
        </div>
      </form>
    </Form>
  )
}

/* ── Language selector desktop (estilos compactos) ────────── */
function DesktopLanguagePicker() {
  const { i18n } = useTranslation()
  const current = i18n.language as LangCode

  return (
    <div className="flex flex-wrap gap-1.5">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => i18next.changeLanguage(lang.code)}
          className={cn(
            'flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-all border',
            current === lang.code
              ? 'text-white border-transparent'
              : 'bg-transparent text-[#A0A7B5] border-[#E8ECF4] hover:border-[#0F6CB5] hover:text-[#0F6CB5]',
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

/* ── Ilustração SVG SaaS ───────────────────────────────────── */
function SaasIllustration() {
  return (
    <svg viewBox="0 0 800 580" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <filter id="ds" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#0F6CB5" floodOpacity="0.11" />
        </filter>
      </defs>

      {/* ── fundo orgânico ── */}
      <ellipse cx="490" cy="295" rx="330" ry="258" fill="#EAF2FF" opacity="0.70" />
      <ellipse cx="510" cy="275" rx="248" ry="208" fill="#D6E8FF" opacity="0.30" />

      {/* ── círculos decorativos ── */}
      <circle cx="108" cy="82"  r="52" fill="#4D8DFF" opacity="0.09" />
      <circle cx="726" cy="105" r="36" fill="#0F6CB5" opacity="0.07" />
      <circle cx="712" cy="476" r="58" fill="#4D8DFF" opacity="0.11" />
      <circle cx="132" cy="490" r="28" fill="#0F6CB5" opacity="0.07" />
      <circle cx="762" cy="310" r="18" fill="#EAF2FF" opacity="0.55" />
      <circle cx="78"  cy="330" r="14" fill="#4D8DFF" opacity="0.16" />

      {/* pontos pequenos */}
      <circle cx="174" cy="155" r="5"  fill="#4D8DFF" opacity="0.38" />
      <circle cx="190" cy="172" r="3"  fill="#0F6CB5" opacity="0.24" />
      <circle cx="648" cy="70"  r="5"  fill="#4D8DFF" opacity="0.38" />
      <circle cx="664" cy="88"  r="3"  fill="#0F6CB5" opacity="0.24" />
      <circle cx="748" cy="196" r="4"  fill="#4D8DFF" opacity="0.30" />
      <circle cx="96"  cy="420" r="4"  fill="#4D8DFF" opacity="0.26" />

      {/* ── dashboard ── */}
      <g transform="translate(255,104) rotate(-4,210,170)">
        {/* sombra */}
        <rect x="12" y="20" width="424" height="316" rx="14" fill="#0F6CB5" opacity="0.06" />
        {/* painel branco */}
        <rect x="0"  y="0"  width="424" height="316" rx="14" fill="white" filter="url(#ds)" />

        {/* sidebar */}
        <rect x="0" y="0" width="74" height="316" rx="14" fill="#0F6CB5" />
        <rect x="58" y="0" width="16" height="316" fill="#0F6CB5" />

        {/* itens sidebar */}
        <circle cx="23" cy="38"  r="6" fill="white" opacity="0.88" />
        <rect   x="37" y="34"  width="22" height="8" rx="4" fill="white" opacity="0.55" />
        <circle cx="23" cy="74"  r="5" fill="white" opacity="0.45" />
        <rect   x="37" y="71"  width="18" height="7" rx="3" fill="white" opacity="0.32" />
        <circle cx="23" cy="108" r="5" fill="white" opacity="0.45" />
        <rect   x="37" y="105" width="18" height="7" rx="3" fill="white" opacity="0.32" />
        <circle cx="23" cy="142" r="5" fill="white" opacity="0.45" />
        <rect   x="37" y="139" width="18" height="7" rx="3" fill="white" opacity="0.32" />
        <circle cx="23" cy="176" r="5" fill="white" opacity="0.45" />
        <rect   x="37" y="173" width="18" height="7" rx="3" fill="white" opacity="0.32" />
        {/* indicador activo */}
        <rect x="0" y="64" width="5" height="28" rx="2.5" fill="white" opacity="0.82" />

        {/* top bar */}
        <rect x="84" y="12"  width="330" height="26" rx="5" fill="#F5F8FF" />
        <rect x="94" y="19"  width="68"  height="10" rx="3" fill="#E8ECF4" />
        <rect x="362" y="16" width="28"  height="14" rx="7" fill="#0F6CB5" opacity="0.14" />
        <circle cx="402" cy="23" r="9" fill="#EAF2FF" />

        {/* cards KPI */}
        <rect x="84"  y="50" width="96" height="62" rx="7" fill="#F8FAFE" stroke="#E8ECF4" strokeWidth="1" />
        <rect x="190" y="50" width="96" height="62" rx="7" fill="#F8FAFE" stroke="#E8ECF4" strokeWidth="1" />
        <rect x="296" y="50" width="96" height="62" rx="7" fill="#F8FAFE" stroke="#E8ECF4" strokeWidth="1" />

        <rect x="94"  y="60" width="42" height="7" rx="3" fill="#A8B3C5" opacity="0.48" />
        <rect x="94"  y="74" width="58" height="12" rx="3" fill="#0F6CB5" opacity="0.28" />
        <rect x="94"  y="92" width="32" height="7"  rx="3" fill="#A8B3C5" opacity="0.28" />
        <circle cx="166" cy="76" r="10" fill="#EAF2FF" />

        <rect x="200" y="60" width="42" height="7" rx="3" fill="#A8B3C5" opacity="0.48" />
        <rect x="200" y="74" width="58" height="12" rx="3" fill="#4D8DFF" opacity="0.45" />
        <rect x="200" y="92" width="32" height="7"  rx="3" fill="#A8B3C5" opacity="0.28" />
        <circle cx="272" cy="76" r="10" fill="#EAF2FF" />

        <rect x="306" y="60" width="42" height="7" rx="3" fill="#A8B3C5" opacity="0.48" />
        <rect x="306" y="74" width="58" height="12" rx="3" fill="#0F6CB5" opacity="0.18" />
        <rect x="306" y="92" width="32" height="7"  rx="3" fill="#A8B3C5" opacity="0.28" />
        <circle cx="378" cy="76" r="10" fill="#EAF2FF" />

        {/* gráfico de barras */}
        <rect x="84"  y="124" width="196" height="178" rx="7" fill="#F8FAFE" stroke="#E8ECF4" strokeWidth="1" />
        <rect x="94"  y="134" width="82"  height="7"   rx="3" fill="#A8B3C5" opacity="0.48" />
        <line x1="98" y1="284" x2="268" y2="284" stroke="#E8ECF4" strokeWidth="1" />

        <rect x="108" y="230" width="20" height="54" rx="4" fill="#EAF2FF" />
        <rect x="108" y="252" width="20" height="32" rx="4" fill="#4D8DFF" opacity="0.60" />
        <rect x="140" y="212" width="20" height="72" rx="4" fill="#EAF2FF" />
        <rect x="140" y="232" width="20" height="52" rx="4" fill="#0F6CB5" opacity="0.52" />
        <rect x="172" y="222" width="20" height="62" rx="4" fill="#EAF2FF" />
        <rect x="172" y="242" width="20" height="42" rx="4" fill="#4D8DFF" opacity="0.60" />
        <rect x="204" y="202" width="20" height="82" rx="4" fill="#EAF2FF" />
        <rect x="204" y="218" width="20" height="66" rx="4" fill="#0F6CB5" opacity="0.68" />
        <rect x="236" y="218" width="20" height="66" rx="4" fill="#EAF2FF" />
        <rect x="236" y="234" width="20" height="50" rx="4" fill="#4D8DFF" opacity="0.60" />

        {/* gráfico de pizza */}
        <rect x="290" y="124" width="124" height="104" rx="7" fill="#F8FAFE" stroke="#E8ECF4" strokeWidth="1" />
        <rect x="300" y="134" width="56"  height="7"   rx="3" fill="#A8B3C5" opacity="0.48" />
        <circle cx="352" cy="186" r="30" fill="#EAF2FF" />
        <path d="M352 186 L352 156 A30 30 0 0 1 378 201 Z" fill="#0F6CB5" opacity="0.68" />
        <path d="M352 186 L378 201 A30 30 0 0 1 340 214 Z" fill="#4D8DFF" opacity="0.80" />
        <path d="M352 186 L340 214 A30 30 0 0 1 322 186 Z" fill="#A8B3C5" opacity="0.42" />

        {/* legenda */}
        <circle cx="302" cy="228" r="4" fill="#0F6CB5" opacity="0.68" />
        <rect   x="310" y="224" width="22" height="7" rx="2" fill="#A8B3C5" opacity="0.38" />
        <circle cx="342" cy="228" r="4" fill="#4D8DFF" opacity="0.80" />
        <rect   x="350" y="224" width="22" height="7" rx="2" fill="#A8B3C5" opacity="0.38" />

        {/* linha temporal */}
        <rect x="290" y="238" width="124" height="64" rx="7" fill="#F8FAFE" stroke="#E8ECF4" strokeWidth="1" />
        <rect x="300" y="248" width="46"  height="6"  rx="3" fill="#A8B3C5" opacity="0.48" />
        <polyline points="300,282 318,266 336,274 354,258 372,267 390,252 406,260" stroke="#0F6CB5" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.58" />
        <polyline points="300,288 318,278 336,284 354,272 372,280 390,268 406,275" stroke="#4D8DFF" strokeWidth="2"   fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
      </g>

      {/* ── mulher (esquerda) ── */}
      <g transform="translate(196,205)">
        <ellipse cx="0" cy="196" rx="20" ry="5" fill="#0F6CB5" opacity="0.08" />

        {/* pernas */}
        <rect x="-14" y="148" width="12" height="44" rx="6" fill="#2F3A4F" opacity="0.82" />
        <rect x="2"   y="148" width="12" height="44" rx="6" fill="#2F3A4F" opacity="0.82" />
        <ellipse cx="-8" cy="192" rx="11" ry="5" fill="#0F6CB5" opacity="0.65" />
        <ellipse cx="8"  cy="192" rx="11" ry="5" fill="#0F6CB5" opacity="0.65" />

        {/* corpo */}
        <path d="M-20 78 Q-24 128 -18 152 L18 152 Q24 128 20 78 Z" fill="#0F6CB5" opacity="0.72" />

        {/* braço esq — tablet */}
        <path d="M-20 94 Q-37 108 -40 126" stroke="#FBBF8C" strokeWidth="9" strokeLinecap="round" fill="none" />
        <rect x="-54" y="116" width="24" height="18" rx="3" fill="#4D8DFF" opacity="0.82" />
        <rect x="-52" y="118" width="20" height="14" rx="2" fill="white" opacity="0.45" />

        {/* braço dir */}
        <path d="M20 94 Q33 106 30 120" stroke="#FBBF8C" strokeWidth="9" strokeLinecap="round" fill="none" />

        {/* pescoço / cabeça */}
        <rect x="-6"  y="52"  width="12" height="16" rx="4" fill="#FBBF8C" />
        <circle cx="0" cy="36" r="22" fill="#FBBF8C" />

        {/* cabelo */}
        <path d="M-22 38 Q-24 8 0 14 Q24 8 22 38 Q18 18 0 20 Q-18 18 -22 38 Z" fill="#2F3A4F" opacity="0.88" />
        <path d="M22 28 Q34 18 30 36" stroke="#2F3A4F" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.88" />

        {/* rosto */}
        <circle cx="-7" cy="36" r="2" fill="#2F3A4F" opacity="0.55" />
        <circle cx="7"  cy="36" r="2" fill="#2F3A4F" opacity="0.55" />
        <path d="M-4 44 Q0 47 4 44" stroke="#2F3A4F" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.45" />
        <path d="M-12 68 Q0 76 12 68" stroke="white" strokeWidth="1.5" fill="none" opacity="0.45" />
      </g>

      {/* mini gráfico de barras junto à mulher */}
      <g transform="translate(138,318)">
        <line x1="0" y1="44" x2="42" y2="44" stroke="#E8ECF4" strokeWidth="1" />
        <rect x="0"  y="14" width="9" height="30" rx="3" fill="#EAF2FF" />
        <rect x="0"  y="26" width="9" height="18" rx="3" fill="#4D8DFF" opacity="0.52" />
        <rect x="14" y="2"  width="9" height="42" rx="3" fill="#EAF2FF" />
        <rect x="14" y="12" width="9" height="32" rx="3" fill="#0F6CB5" opacity="0.44" />
        <rect x="28" y="8"  width="9" height="36" rx="3" fill="#EAF2FF" />
        <rect x="28" y="20" width="9" height="24" rx="3" fill="#4D8DFF" opacity="0.52" />
      </g>

      {/* ── homem (direita) ── */}
      <g transform="translate(664,200)">
        <ellipse cx="0" cy="198" rx="20" ry="5" fill="#0F6CB5" opacity="0.08" />

        {/* pernas */}
        <rect x="-14" y="150" width="12" height="44" rx="6" fill="#1a2535" opacity="0.82" />
        <rect x="2"   y="150" width="12" height="44" rx="6" fill="#1a2535" opacity="0.82" />
        <ellipse cx="-8" cy="194" rx="11" ry="5" fill="#2F3A4F" opacity="0.75" />
        <ellipse cx="8"  cy="194" rx="11" ry="5" fill="#2F3A4F" opacity="0.75" />

        {/* corpo — fato */}
        <path d="M-20 78 Q-22 130 -18 152 L18 152 Q22 130 20 78 Z" fill="#2F3A4F" opacity="0.86" />
        {/* gravata */}
        <path d="M-4 78 L0 86 L4 78 L2 116 Q0 122 -2 116 Z" fill="#0F6CB5" opacity="0.65" />
        {/* lapelas */}
        <path d="M-12 78 L-6 66 L0 78" fill="#1a2535" opacity="0.88" />
        <path d="M12  78 L6  66 L0 78" fill="#1a2535" opacity="0.88" />

        {/* braço esq — a apontar para dashboard */}
        <path d="M-20 94 Q-50 70 -70 63" stroke="#FBBF8C" strokeWidth="9" strokeLinecap="round" fill="none" />
        <circle cx="-70" cy="63" r="7" fill="#FBBF8C" />

        {/* braço dir — tablet */}
        <path d="M20 100 Q36 112 34 128" stroke="#FBBF8C" strokeWidth="9" strokeLinecap="round" fill="none" />
        <rect x="24" y="118" width="22" height="16" rx="3" fill="#4D8DFF" opacity="0.82" />
        <rect x="26" y="120" width="18" height="12" rx="2" fill="white" opacity="0.45" />

        {/* pescoço / cabeça */}
        <rect x="-6" y="52"  width="12" height="16" rx="4" fill="#FBBF8C" />
        <circle cx="0" cy="36" r="22" fill="#FBBF8C" />

        {/* cabelo */}
        <path d="M-22 36 Q-22 12 0 16 Q22 12 22 36 Q18 20 0 22 Q-18 20 -22 36 Z" fill="#2F3A4F" opacity="0.88" />

        {/* rosto */}
        <circle cx="-7" cy="36" r="2" fill="#2F3A4F" opacity="0.55" />
        <circle cx="7"  cy="36" r="2" fill="#2F3A4F" opacity="0.55" />
        <path d="M-4 44 Q0 48 4 44" stroke="#2F3A4F" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.45" />
      </g>

      {/* ── folhas decorativas ── */}
      <path d="M62 392 Q44 340 86 325 Q118 318 108 376 Q98 422 62 392 Z"  fill="#4D8DFF" opacity="0.12" />
      <path d="M746 378 Q764 326 722 316 Q690 308 702 368 Q714 418 746 378 Z" fill="#0F6CB5" opacity="0.09" />

      {/* ── mini cards flutuantes ── */}
      <g transform="translate(152,190)">
        <rect x="0" y="0" width="50" height="30" rx="6" fill="white" stroke="#E8ECF4" strokeWidth="1" opacity="0.92" />
        <circle cx="11" cy="15" r="5" fill="#0F6CB5" opacity="0.38" />
        <rect x="21" y="9"  width="22" height="5" rx="2" fill="#A8B3C5" opacity="0.38" />
        <rect x="21" y="17" width="16" height="4" rx="2" fill="#4D8DFF" opacity="0.38" />
      </g>

      <g transform="translate(636,165)">
        <rect x="0" y="0" width="58" height="32" rx="6" fill="white" stroke="#E8ECF4" strokeWidth="1" opacity="0.88" />
        <rect x="8" y="9"  width="42" height="5" rx="2" fill="#A8B3C5" opacity="0.38" />
        <rect x="8" y="18" width="30" height="5" rx="2" fill="#0F6CB5" opacity="0.32" />
        <circle cx="50" cy="15" r="6" fill="#EAF2FF" />
      </g>
    </svg>
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
    <>
      {/* ════════════════════════════════════════════════════
          MOBILE  (<md) — MANTIDO IGUAL
          ════════════════════════════════════════════════════ */}
      <div
        className="flex md:hidden flex-col min-h-screen"
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

      {/* ════════════════════════════════════════════════════
          DESKTOP (md+) — NOVO DESIGN
          ════════════════════════════════════════════════════ */}
      <div className="hidden md:flex h-screen w-full bg-white overflow-hidden">

        {/* ── Painel esquerdo — formulário ── */}
        <div
          className="flex flex-col justify-center shrink-0"
          style={{ width: '32%', paddingLeft: 70, paddingRight: 40 }}
        >
          {/* Logo */}
          <img src={vendosLogo} alt="ElectroVendos" className="h-12 w-auto object-contain mb-10 self-start" draggable={false} />

          {/* Título */}
          <h1
            className="font-bold leading-tight mb-2"
            style={{ fontSize: 34, color: '#2C3E50', fontFamily: 'inherit' }}
          >
            Login
          </h1>

          {/* Subtítulo */}
          <p
            className="mb-10"
            style={{ fontSize: 13, color: '#A0A7B5', fontWeight: 400, lineHeight: 1.5 }}
          >
            {t('login.subtitle')}
          </p>

          {/* Formulário desktop */}
          <DesktopFormContent {...baseProps} />

          {/* Selector de língua */}
          <div className="mt-10">
            <p className="text-[11px] text-[#A0A7B5] mb-2">{t('login.language')}</p>
            <DesktopLanguagePicker />
          </div>

          {/* Rodapé */}
          <p className="mt-6 text-[11px] text-[#A0A7B5]">
            {t('login.problems')}{' '}
            <button type="button" className="font-medium hover:underline" style={{ color: ORANGE }}>
              {t('login.contactSupport')}
            </button>
          </p>
        </div>

        {/* ── Painel direito — ilustração ── */}
        <div className="flex-1 relative overflow-hidden" style={{ background: '#F4F8FF' }}>
          <SaasIllustration />
        </div>
      </div>
    </>
  )
}
