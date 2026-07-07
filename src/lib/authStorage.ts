/**
 * Sem controlo sobre o backend não é possível usar cookies httpOnly — só o
 * servidor pode defini-los, JavaScript não consegue criar um cookie httpOnly.
 * A alternativa mais segura no browser é manter o token em memória (nunca em
 * `window`) e usar sessionStorage apenas para sobreviver a um refresh de
 * página. Ao contrário de localStorage, sessionStorage é limpo quando o
 * separador fecha, reduzindo o tempo de exposição num computador partilhado.
 */
const KEY_TOKEN = 'token'
const KEY_NOME = 'user_nome'
const KEY_ROLE = 'user_role'

let memoryToken: string | null = null

// Migração única: versões anteriores guardavam o token em localStorage
// (persiste indefinidamente). Move para sessionStorage e limpa o legado.
;(function migrateLegacyStorage() {
  const legacyToken = localStorage.getItem(KEY_TOKEN)
  if (legacyToken && !sessionStorage.getItem(KEY_TOKEN)) {
    sessionStorage.setItem(KEY_TOKEN, legacyToken)
    const legacyNome = localStorage.getItem(KEY_NOME)
    const legacyRole = localStorage.getItem(KEY_ROLE)
    if (legacyNome) sessionStorage.setItem(KEY_NOME, legacyNome)
    if (legacyRole) sessionStorage.setItem(KEY_ROLE, legacyRole)
  }
  localStorage.removeItem(KEY_TOKEN)
  localStorage.removeItem(KEY_NOME)
  localStorage.removeItem(KEY_ROLE)
})()

export const authStorage = {
  getToken(): string | null {
    if (memoryToken) return memoryToken
    memoryToken = sessionStorage.getItem(KEY_TOKEN)
    return memoryToken
  },

  getUser(): { nome: string; role: string } | null {
    const nome = sessionStorage.getItem(KEY_NOME)
    const role = sessionStorage.getItem(KEY_ROLE)
    return nome && role ? { nome, role } : null
  },

  set(token: string, nome: string, role: string) {
    memoryToken = token
    sessionStorage.setItem(KEY_TOKEN, token)
    sessionStorage.setItem(KEY_NOME, nome)
    sessionStorage.setItem(KEY_ROLE, role)
  },

  clear() {
    memoryToken = null
    sessionStorage.removeItem(KEY_TOKEN)
    sessionStorage.removeItem(KEY_NOME)
    sessionStorage.removeItem(KEY_ROLE)
  },
}
