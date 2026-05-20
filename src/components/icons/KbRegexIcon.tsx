import type { CSSProperties } from 'react'

export function KbRegexIcon({ size = 16, color = 'currentColor', style }: { size?: number; color?: string; style?: CSSProperties }) {
  const s = Math.max(12, size)
  const sw = 1.6
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', ...style }}>
      <path
        d="M7 4.6h7.2l3.8 3.8V19c0 1.3-1 2.4-2.4 2.4H7c-1.3 0-2.4-1-2.4-2.4V7c0-1.3 1-2.4 2.4-2.4Z"
        stroke={color}
        strokeWidth={sw}
        opacity={0.92}
        rx="2.6"
      />
      <path d="M14.2 4.6V8.8H18" stroke={color} strokeWidth={sw} opacity={0.72} strokeLinejoin="round" />
      <path d="M8 12.2h8" stroke={color} strokeWidth={sw} opacity={0.55} strokeLinecap="round" />
      <path d="M8 15.4h6.2" stroke={color} strokeWidth={sw} opacity={0.55} strokeLinecap="round" />
      <path d="M15.6 15.4h.4" stroke={color} strokeWidth={sw} opacity={0.55} strokeLinecap="round" />
      <path d="M8 18.2h3.2" stroke={color} strokeWidth={sw} opacity={0.55} strokeLinecap="round" />
      <path d="M12.9 18.2h3.1" stroke={color} strokeWidth={sw} opacity={0.55} strokeLinecap="round" />
    </svg>
  )
}

