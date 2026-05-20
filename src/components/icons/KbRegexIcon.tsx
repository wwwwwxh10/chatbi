import type { CSSProperties } from 'react'

export function KbRegexIcon({ size = 16, color = 'currentColor', style }: { size?: number; color?: string; style?: CSSProperties }) {
  const s = Math.max(12, size)
  const sw = 1.85
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', ...style }}>
      <path d="M5.6 7h4.8" stroke={color} strokeWidth={sw} strokeLinecap="round" opacity={0.9} />
      <path d="M5.6 12h6.0" stroke={color} strokeWidth={sw} strokeLinecap="round" opacity={0.9} />
      <path d="M5.6 17h4.2" stroke={color} strokeWidth={sw} strokeLinecap="round" opacity={0.9} />

      <path d="M11.6 12h2.6" stroke={color} strokeWidth={sw} strokeLinecap="round" opacity={0.78} />
      <path d="M13.6 10.7 15 12l-1.4 1.3" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" opacity={0.78} />

      <path d="M15.4 7h4.9" stroke={color} strokeWidth={sw} strokeLinecap="round" opacity={0.92} />
      <path d="M14.6 12h5.7" stroke={color} strokeWidth={sw} strokeLinecap="round" opacity={0.92} />
      <path d="M15.4 17h4.9" stroke={color} strokeWidth={sw} strokeLinecap="round" opacity={0.92} />
    </svg>
  )
}
