import type { CSSProperties } from 'react'

export function DashboardIcon({
  size = 16,
  color = 'currentColor',
  primaryColor,
  secondaryColor,
  style,
}: {
  size?: number
  color?: string
  primaryColor?: string
  secondaryColor?: string
  style?: CSSProperties
}) {
  const s = Math.max(12, size)
  const sw = 1.4
  const c1 = secondaryColor ?? color
  const c2 = primaryColor ?? color
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', ...style }}>
      <circle cx="12" cy="12" r="8" stroke={c1} strokeWidth={sw} opacity={0.9} />
      <path d="M12 12l3.8-2.4" stroke={c2} strokeWidth={sw} opacity={0.92} strokeLinecap="round" />
      <circle cx="12" cy="12" r="1.2" fill={c2} opacity={0.9} />

      <path d="M12 4v1.7" stroke={c1} strokeWidth={sw} opacity={0.45} strokeLinecap="round" />
      <path d="M20 12h-1.7" stroke={c1} strokeWidth={sw} opacity={0.45} strokeLinecap="round" />
      <path d="M12 20v-1.7" stroke={c1} strokeWidth={sw} opacity={0.45} strokeLinecap="round" />
      <path d="M4 12h1.7" stroke={c1} strokeWidth={sw} opacity={0.45} strokeLinecap="round" />
    </svg>
  )
}
