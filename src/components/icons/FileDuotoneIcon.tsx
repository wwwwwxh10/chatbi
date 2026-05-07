export function FileDuotoneIcon({ size = 18, primary = '#1677ff', secondary = 'rgba(255,255,255,0.72)' }: { size?: number; primary?: string; secondary?: string }) {
  const s = size
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" stroke={secondary} strokeWidth="1.6" />
      <path d="M14 3v5h5" stroke={secondary} strokeWidth="1.6" />
      <path d="M8 13h8" stroke={primary} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8 16h6" stroke={secondary} strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
    </svg>
  )
}

