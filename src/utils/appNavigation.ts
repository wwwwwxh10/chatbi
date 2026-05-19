function getBaseUrl() {
  const rawBase = import.meta.env.BASE_URL || '/'
  return rawBase.endsWith('/') ? rawBase : `${rawBase}/`
}

export function getRouterBasename() {
  const base = getBaseUrl()
  return base === '/' ? '/' : base.replace(/\/$/, '')
}

export function resolveAppUrl(path: string) {
  if (typeof window === 'undefined') return path
  const normalized = path.startsWith('/') ? path.slice(1) : path
  return new URL(normalized, new URL(getBaseUrl(), window.location.origin)).toString()
}

export function openAppPath(path: string, target = '_blank') {
  if (typeof window === 'undefined') return null
  const url = resolveAppUrl(path)
  const opened = window.open(url, target)

  if (opened) {
    try {
      opened.opener = null
    } catch {
      // Ignore cross-window security errors.
    }
    return opened
  }

  if (target === '_blank') {
    window.location.assign(url)
  }

  return null
}
