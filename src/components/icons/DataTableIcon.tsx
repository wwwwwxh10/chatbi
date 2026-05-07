import type { CSSProperties } from 'react'

export function DataTableIcon({ size = 16, color = 'currentColor', search = false, style }: { size?: number; color?: string; search?: boolean; style?: CSSProperties }) {
  const s = Math.max(12, size)
  const sw = 1.4
  const r = 2.6
  const headerH = 4.2

  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', ...style }}>
      <path
        d="M5.6 4.8h12.8c.99 0 1.8.81 1.8 1.8v10.8c0 .99-.81 1.8-1.8 1.8H5.6c-.99 0-1.8-.81-1.8-1.8V6.6c0-.99.81-1.8 1.8-1.8Z"
        stroke={color}
        strokeWidth={sw}
        opacity={0.9}
        rx={r}
      />
      <path d={`M5.2 ${6.6 + headerH}h13.6`} stroke={color} strokeWidth={sw} opacity={0.65} strokeLinecap="round" />
      <path d="M9.6 6.2h8.2" stroke={color} strokeWidth={sw} opacity={0.9} strokeLinecap="round" />
      <path d="M7.2 10.6v7.2" stroke={color} strokeWidth={sw} opacity={0.55} strokeLinecap="round" />
      <path d="M12 10.6v7.2" stroke={color} strokeWidth={sw} opacity={0.55} strokeLinecap="round" />
      <path d="M16.8 10.6v7.2" stroke={color} strokeWidth={sw} opacity={0.55} strokeLinecap="round" />
      <path d="M5.6 14h12.8" stroke={color} strokeWidth={sw} opacity={0.45} strokeLinecap="round" />
      <path d="M5.6 17.2h12.8" stroke={color} strokeWidth={sw} opacity={0.45} strokeLinecap="round" />

      <path
        d="M5.6 4.8h12.8c.99 0 1.8.81 1.8 1.8v4.2H3.8V6.6c0-.99.81-1.8 1.8-1.8Z"
        fill={color}
        opacity={0.16}
        rx={r}
      />

      {search ? (
        <>
          <circle cx="18.3" cy="17.7" r="2.8" stroke={color} strokeWidth={sw} opacity={0.95} />
          <path d="M20.35 19.75l2.05 2.05" stroke={color} strokeWidth={sw} strokeLinecap="round" opacity={0.95} />
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
