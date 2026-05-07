import type { Theme, ThemeId } from '../theme/types'
import { THEMES } from '../theme/themes'
import { useThemeStore } from '../store/themeStore'

function Swatches({ palette }: { palette: string[] }) {
  return (
    <div className="swatches" aria-hidden="true">
      {palette.slice(0, 10).map((c) => (
        <span key={c} className="swatch" style={{ background: c }} />
      ))}
    </div>
  )
}

function ThemeBtn({
  theme,
  active,
  onSelect,
}: {
  theme: Theme
  active: boolean
  onSelect: (id: ThemeId) => void
}) {
  return (
    <button
      type="button"
      className={active ? 'themeBtn active' : 'themeBtn'}
      onClick={() => onSelect(theme.id)}
    >
      <div className="themeBtnTop">
        <div className="themeName">{theme.name}</div>
        <div className="themeId">{theme.id}</div>
      </div>
      <Swatches palette={theme.palette} />
    </button>
  )
}

export function ThemeSwitcher() {
  const themeId = useThemeStore((s) => s.themeId)
  const setThemeId = useThemeStore((s) => s.setThemeId)

  return (
    <div className="themeBar" role="group" aria-label="全局配色主题">
      <ThemeBtn
        theme={THEMES.business}
        active={themeId === 'business'}
        onSelect={setThemeId}
      />
      <ThemeBtn
        theme={THEMES.vibrant}
        active={themeId === 'vibrant'}
        onSelect={setThemeId}
      />
      <ThemeBtn
        theme={THEMES.fresh}
        active={themeId === 'fresh'}
        onSelect={setThemeId}
      />
    </div>
  )
}

