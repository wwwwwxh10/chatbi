import type { CSSProperties } from 'react'

export function DataTableIcon({ size = 16, color = 'currentColor', search = false, style }: { size?: number; color?: string; search?: boolean; style?: CSSProperties }) {
  const s = Math.max(12, size)

  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', ...style }}>
      <rect x="2" y="2" width="20" height="20" rx="6" fill={color} />
      <path d="m12 5.4 6 3.25-6 3.25-6-3.25L12 5.4Z" fill="white" />
      <path d="m6 9.75 5.25 2.84v6.01L6 15.76V9.75Z" fill="white" opacity=".78" />
      <path d="m18 9.75-5.25 2.84v6.01L18 15.76V9.75Z" fill="white" opacity=".96" />
      <path d="M12 12.35v5.95M6.45 9.05 12 12.08l5.55-3.03" stroke={color} strokeWidth=".65" strokeLinecap="round" strokeLinejoin="round" opacity=".42" />

      {search ? (
        <>
          <circle cx="18.3" cy="17.7" r="2.8" fill="white" stroke={color} strokeWidth="1.4" />
          <path d="M20.35 19.75l2.05 2.05" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
        </>
      ) : null}
    </svg>
  )
}

export function DataTableSearchIcon(props: { size?: number; color?: string; primaryColor?: string; secondaryColor?: string; style?: CSSProperties }) {
  const { size = 16, color = 'currentColor', primaryColor, secondaryColor, style } = props
  const s = Math.max(12, size)
  const sw = 1.4
  const c1 = secondaryColor ?? color
  const c2 = primaryColor ?? color
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', ...style }}>
      <path d="M6.2 5.3h11.6c.88 0 1.6.72 1.6 1.6v7.4c0 .88-.72 1.6-1.6 1.6H6.2c-.88 0-1.6-.72-1.6-1.6V6.9c0-.88.72-1.6 1.6-1.6Z" stroke={c1} strokeWidth={sw} opacity={0.92} rx="2.6" />
      <path d="M6 9h12" stroke={c1} strokeWidth={sw} opacity={0.55} strokeLinecap="round" />
      <path d="M8 7.2h6.8" stroke={c1} strokeWidth={sw} opacity={0.85} strokeLinecap="round" />

      <circle cx="16.9" cy="16.9" r="2.5" stroke={c2} strokeWidth={sw} opacity={0.92} />
      <path d="M18.7 18.7l2.1 2.1" stroke={c2} strokeWidth={sw} opacity={0.92} strokeLinecap="round" />
    </svg>
  )
}
