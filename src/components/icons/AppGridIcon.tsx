export function AppGridIcon({ size = 18, primary = '#1677ff', secondary = 'rgba(255,255,255,0.72)' }: { size?: number; primary?: string; secondary?: string }) {
  const s = size
  const g = Math.max(2, Math.round(s * 0.12))
  const cell = Math.round((s - g) / 2)
  const cellSize = cell - g
  const rectH = cellSize
  const rectY = 0
  const cx = cellSize / 2
  const cy = rectH / 2
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x={0} y={rectY} width={cellSize} height={rectH} rx={0} fill={primary} transform={`rotate(45 ${cx} ${cy})`} />
      <rect x={cell} y={rectY} width={cellSize} height={rectH} rx={0} fill={secondary} />
      <rect x={0} y={cell + rectY} width={cellSize} height={rectH} rx={0} fill={secondary} />
      <rect x={cell} y={cell + rectY} width={cellSize} height={rectH} rx={0} fill={secondary} />
    </svg>
  )
}
