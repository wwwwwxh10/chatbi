import type { Theme } from './types'

export function applyThemeToDom(theme: Theme) {
  const el = document.documentElement
  el.dataset.theme = theme.id
  el.style.setProperty('--accent', theme.palette[0] ?? '#6aa9ff')
  el.style.setProperty('--accent-2', theme.palette[1] ?? '#7c5cff')
  el.style.setProperty('--warn', theme.palette[2] ?? '#ffb020')
  el.style.setProperty('--bad', theme.palette[3] ?? '#ff5c7a')
  el.style.setProperty('--good', theme.palette[4] ?? '#33d19a')
  el.style.setProperty('--bg-0', theme.ui.bg0)
  el.style.setProperty('--bg-1', theme.ui.bg1)
  el.style.setProperty('--surface-0', theme.ui.surface0)
  el.style.setProperty('--surface-1', theme.ui.surface1)
  el.style.setProperty('--border-0', theme.ui.border0)
  el.style.setProperty('--text-0', theme.ui.text0)
  el.style.setProperty('--text-1', theme.ui.text1)
  el.style.setProperty('--text-2', theme.ui.text2)
  el.style.setProperty('--ring', theme.ui.ring)
  el.style.setProperty('--shadow-0', theme.ui.shadow0)
}
