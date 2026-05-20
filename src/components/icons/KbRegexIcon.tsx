import type { CSSProperties } from 'react'

export function KbRegexIcon({ size = 16, color = 'currentColor', style }: { size?: number; color?: string; style?: CSSProperties }) {
  const s = Math.max(12, size)
  const sw = 1.85
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', ...style }}>
      <path d="M7.5 6.4 6.1 17.6" stroke={color} strokeWidth={sw} strokeLinecap="round" opacity={0.9} />
      <path d="M16.5 6.4 17.9 17.6" stroke={color} strokeWidth={sw} strokeLinecap="round" opacity={0.9} />
      <circle cx="11" cy="12" r="1.15" fill={color} opacity={0.9} />
      <path d="M14.8 9.9v4.2" stroke={color} strokeWidth={sw} strokeLinecap="round" opacity={0.92} />
      <path d="M12.7 12h4.2" stroke={color} strokeWidth={sw} strokeLinecap="round" opacity={0.92} />
      <path d="M13.35 10.55l3.1 3.1" stroke={color} strokeWidth={sw} strokeLinecap="round" opacity={0.92} />
      <path d="M16.45 10.55l-3.1 3.1" stroke={color} strokeWidth={sw} strokeLinecap="round" opacity={0.92} />
    </svg>
  )
}
