import { useMemo, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import type { Demo } from '../charts/types'
import { getDemoOption } from '../charts/getDemoOption'
import type { ChartHover } from '../components/EChart'
import { EChart } from '../components/EChart'
import { FlipCounter, KpiCard, ProgressBar } from '../components/MetricCards'
import type { Theme } from '../theme/types'

function onEnterOrSpace(e: ReactKeyboardEvent, fn: () => void) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    fn()
  }
}

function InteractPanel({
  hover,
  selected,
}: {
  hover: ChartHover | null
  selected: ChartHover | null
}) {
  return (
    <section className="panel">
      <div className="panelTitle">交互状态</div>
      <div className="panelBody">
        <div className="kv">
          <div className="k">默认态</div>
          <div className="v">展示全部数据与图例</div>
        </div>
        <div className="kv">
          <div className="k">Hover</div>
          <div className="v">
            {hover?.seriesName || hover?.name
              ? `${hover.seriesName ?? ''}${hover.seriesName && hover.name ? ' · ' : ''}${hover.name ?? ''}`
              : '—'}
          </div>
        </div>
        <div className="kv">
          <div className="k">点击选中</div>
          <div className="v">
            {selected?.seriesName || selected?.name
              ? `${selected.seriesName ?? ''}${selected.seriesName && selected.name ? ' · ' : ''}${selected.name ?? ''}`
              : '—'}
          </div>
        </div>
      </div>
    </section>
  )
}

function ThemePalette({ theme }: { theme: Theme }) {
  return (
    <section className="panel">
      <div className="panelTitle">当前主题色卡</div>
      <div className="panelBody">
        <div className="paletteRow">
          {theme.palette.map((c) => (
            <div key={c} className="paletteItem">
              <span className="paletteSwatch" style={{ background: c }} />
              <span className="paletteHex">{c}</span>
            </div>
          ))}
        </div>
        <div className="panelHint">
          新增维度时，会从色卡中按顺序/循环分配颜色。
        </div>
      </div>
    </section>
  )
}

export function ChartDemoPage({ demo, theme }: { demo: Demo; theme: Theme }) {
  const [hover, setHover] = useState<ChartHover | null>(null)
  const [selected, setSelected] = useState<ChartHover | null>(null)

  const option = useMemo(() => {
    if (demo.kind !== 'echarts') return null
    return getDemoOption(demo.id, theme)
  }, [demo.id, demo.kind, theme])

  return (
    <div className="page">
      <div className="pageHeader">
        <div className="pageTitle">{demo.name}</div>
        <div className="pageDesc">{demo.description}</div>
        <div className="metaRow">
          <span className="chip">单位：{demo.unit}</span>
          <span className="chip">{demo.axisHint}</span>
          <span className="chip">图例：已启用</span>
        </div>
      </div>

      <div className="demoLayout">
        <section className="chartPanel">
          {demo.kind === 'echarts' && option ? (
            <EChart
              option={option}
              onHover={(v) => setHover(v)}
              onLeave={() => setHover(null)}
              onClick={(v) => setSelected(v)}
            />
          ) : null}

          {demo.kind === 'kpi' ? (
            <div
              className="demoInteract"
              onMouseEnter={() => setHover({ name: '指标卡' })}
              onMouseLeave={() => setHover(null)}
              onClick={() => setSelected({ name: '指标卡' })}
              onKeyDown={(e) => onEnterOrSpace(e, () => setSelected({ name: '指标卡' }))}
              role="button"
              tabIndex={0}
            >
              <KpiCard title="当日 GMV" unit={demo.unit} value={128_560} delta={6.3} />
            </div>
          ) : null}

          {demo.kind === 'flip' ? (
            <div
              className="demoInteract"
              onMouseEnter={() => setHover({ name: '翻牌器' })}
              onMouseLeave={() => setHover(null)}
              onClick={() => setSelected({ name: '翻牌器' })}
              onKeyDown={(e) => onEnterOrSpace(e, () => setSelected({ name: '翻牌器' }))}
              role="button"
              tabIndex={0}
            >
              <FlipCounter title="实时在线" unit={demo.unit} target={38_640} />
            </div>
          ) : null}

          {demo.kind === 'progress' ? (
            <div
              className="demoInteract"
              onMouseEnter={() => setHover({ name: '进度条' })}
              onMouseLeave={() => setHover(null)}
              onClick={() => setSelected({ name: '进度条' })}
              onKeyDown={(e) => onEnterOrSpace(e, () => setSelected({ name: '进度条' }))}
              role="button"
              tabIndex={0}
            >
              <ProgressBar title="季度目标完成率" unit={demo.unit} value={86} max={100} />
            </div>
          ) : null}
        </section>

        <div className="sidePanels">
          <InteractPanel hover={hover} selected={selected} />
          <ThemePalette theme={theme} />
        </div>
      </div>
    </div>
  )
}
