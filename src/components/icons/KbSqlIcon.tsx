import type { CSSProperties } from 'react'

export function KbSqlIcon({ size = 16, color = 'currentColor', style }: { size?: number; color?: string; style?: CSSProperties }) {
  const s = Math.max(12, size)
  const sw = 1.7
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', ...style }}>
      <path d="M8.2 7.6 5 12l3.2 4.4" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" opacity={0.92} />
      <path d="M15.8 7.6 19 12l-3.2 4.4" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" opacity={0.92} />
      <path d="M10.2 17.4h3.6" stroke={color} strokeWidth={sw} strokeLinecap="round" opacity={0.65} />
      <path d="M10.6 6.8h4.2" stroke={color} strokeWidth={sw} strokeLinecap="round" opacity={0.65} />
    </svg>
  )
}

