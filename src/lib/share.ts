export type ResultadoPartilha = 'partilhado' | 'descarregado' | 'cancelado'

// Tenta partilhar o ficheiro diretamente (ex.: para o WhatsApp) via Web Share
// API — funciona em navegadores móveis e em muitos desktops recentes, e deixa
// o utilizador escolher a app de destino com o ficheiro já anexado. Quando o
// navegador não suporta partilha de ficheiros (ex.: a maioria dos desktops
// antigos), descarrega o PDF e abre o WhatsApp só com o texto — o utilizador
// tem de anexar o ficheiro manualmente.
export async function partilharArquivoOuTexto(
  file: File,
  mensagem: string,
  telefone?: string | null
): Promise<ResultadoPartilha> {
  const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean }

  if (nav.canShare && nav.canShare({ files: [file] }) && navigator.share) {
    try {
      await navigator.share({ files: [file], text: mensagem, title: file.name })
      return 'partilhado'
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return 'cancelado'
      // Outros erros (ex.: app indisponível) caem no fallback abaixo.
    }
  }

  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)

  const numero = telefone ? telefone.replace(/[^0-9]/g, '') : ''
  const waUrl = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`
  window.open(waUrl, '_blank')
  return 'descarregado'
}
