import { useEffect, useMemo, useRef, useState } from 'react'

function formatCompact(n: number) {
  return n.toLocaleString('zh-CN', { maximumFractionDigits: 0 })
}

export function KpiCard({
  title,
  unit,
  value,
  delta,
}: {
  title: string
  unit: string
  value: number
  delta: number
}) {
  const deltaLabel = `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`
  return (
    <div className="kpi">
      <div className="kpiTitle">{title}</div>
      <div className="kpiRow">
        <div className="kpiValue">
          {formatCompact(value)}
          <span className="kpiUnit">{unit}</span>
        </div>
        <div className={delta >= 0 ? 'kpiDelta up' : 'kpiDelta down'}>
          {deltaLabel}
        </div>
      </div>
      <div className="kpiHint">口径：当日已支付订单 GMV</div>
    </div>
  )
}

function Digit({ d }: { d: string }) {
  return <span className="flipDigit">{d}</span>
}

export function FlipCounter({
  title,
  unit,
  target,
  showTitle = true,
}: {
  title: string
  unit: string
  target: number
  showTitle?: boolean
}) {
  const [value, setValue] = useState(() => Math.max(0, Math.floor(target * 0.72)))
  const valueRef = useRef(value)

  useEffect(() => {
    valueRef.current = value
  }, [value])

  useEffect(() => {
    const duration = 900
    const start = performance.now()
    const from = valueRef.current
    const to = target

    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      const next = Math.floor(from + (to - from) * (1 - Math.pow(1 - p, 3)))
      setValue(next)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target])

  const digits = useMemo(() => formatCompact(value).split(''), [value])

  return (
    <div className="flip">
      {showTitle ? <div className="kpiTitle">{title}</div> : null}
      <div className="flipRow" aria-label={`${title} ${value}${unit}`}>
        {digits.map((d, idx) => (
          <Digit key={`${value}-${idx}`} d={d} />
        ))}
        <span className="kpiUnit">{unit}</span>
      </div>
    </div>
  )
}

export function ProgressBar({
  title,
  unit,
  value,
  max,
}: {
  title: string
  unit: string
  value: number
  max: number
}) {
  const pct = Math.max(0, Math.min(1, value / max))
  const label = `${Math.round(pct * 100)}${unit}`

  return (
    <div className="progress">
      <div className="kpiTitle">{title}</div>
      <div className="progressRow">
        <div className="progressTrack" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
          <div className="progressFill" style={{ width: `${pct * 100}%` }} />
          <div className="progressGlow" style={{ left: `${pct * 100}%` }} />
        </div>
        <div className="progressLabel">{label}</div>
      </div>
      <div className="kpiHint">阈值：70% 预警 · 90% 达标</div>
    </div>
  )
}
