export function DatabaseDuotoneIcon({ size = 18, primary = '#1677ff', secondary = 'rgba(255,255,255,0.72)' }: { size?: number; primary?: string; secondary?: string }) {
  const s = size
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="12" cy="6" rx="8" ry="3" fill={secondary} opacity="0.9" />
      <path d="M4 6v8c0 1.7 3.6 3 8 3s8-1.3 8-3V6" stroke={secondary} strokeWidth="1.6" opacity="0.9" />
      <path d="M4 10c0 1.7 3.6 3 8 3s8-1.3 8-3" stroke={secondary} strokeWidth="1.6" opacity="0.55" />
      <path d="M4 14c0 1.7 3.6 3 8 3s8-1.3 8-3" stroke={primary} strokeWidth="1.6" opacity="0.9" />
      <circle cx="18.6" cy="16.3" r="1.1" fill={primary} />
    </svg>
  )
}

