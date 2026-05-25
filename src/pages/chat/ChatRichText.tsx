import { theme } from 'antd'
import { useMemo } from 'react'
import type { ReactNode } from 'react'

const BASE_LINE_HEIGHT = 1.6
const EMPHASIS_WEIGHT = 700
const METRIC_WEIGHT = 800
const BLOCK_GAP = 8
const TITLE_CONTENT_GAP = 6
const SECTION_GAP = 6

function metricTone(token: ReturnType<typeof theme.useToken>['token'], _raw: string) {
  return { color: token.colorPrimary }
}

function shouldHighlightMetric(seg: string, full: string, start: number, end: number) {
  const s = seg.replace(/\s+/g, '')
  if (!s) return false
  if (/^[¥￥]/.test(s)) return true
  if (/%$/.test(s)) return true
  if (/[万亿]$/.test(s)) return true
  if (/^[+-]/.test(s)) return true
  if (/,/.test(s)) return true

  const prev = start > 0 ? full[start - 1] : ''
  const next = end < full.length ? full[end] : ''
  if (next === '月' || next === '年' || next === '日' || next === '号') return false
  if (prev === '较' && (next === '月' || next === '年')) return false
  if (prev === '第') return true
  if (s.includes('.')) return true
  if (s.length <= 2) return false
  if (s.length === 4 && !s.includes('.')) return false
  return false
}

function renderMetricSegments(token: ReturnType<typeof theme.useToken>['token'], text: string) {
  const out: ReactNode[] = []
  const re = /[¥￥]?\s*[+-]?\d{1,3}(?:,\d{3})*(?:\.\d+)?(?:%|万|亿)?/g
  let last = 0
  for (;;) {
    const m = re.exec(text)
    if (!m) break
    const seg = m[0]
    const start = m.index
    const end = start + seg.length
    if (start > last) out.push(<span key={`${last}-t`}>{text.slice(last, start)}</span>)
    const highlight = shouldHighlightMetric(seg, text, start, end)
    if (!highlight) {
      out.push(<span key={`${start}-n`}>{seg}</span>)
    } else {
      const tone = metricTone(token, seg)
      out.push(
        <span
          key={`${start}-m`}
          style={{
            fontWeight: METRIC_WEIGHT,
            color: tone.color,
          }}
        >
          {seg}
        </span>,
      )
    }
    last = end
  }
  if (last < text.length) out.push(<span key={`${last}-e`}>{text.slice(last)}</span>)
  return out
}

function InlineRich({ text }: { text: string }) {
  const { token } = theme.useToken()
  const parts = useMemo(() => String(text ?? '').split('**'), [text])
  return (
    <>
      {parts.map((p, idx) => {
        const isEmphasis = idx % 2 === 1
        return (
          <span key={idx} style={isEmphasis ? { fontWeight: EMPHASIS_WEIGHT } : undefined}>
            {renderMetricSegments(token, p)}
          </span>
        )
      })}
    </>
  )
}

function renderBullets(lines: string[]) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {lines.map((x, idx) => (
        <div key={idx} style={{ display: 'flex', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0, lineHeight: BASE_LINE_HEIGHT }}>
            <InlineRich text={x} />
          </div>
        </div>
      ))}
    </div>
  )
}

function normalizeBlocks(text: string) {
  const blocks = String(text ?? '')
    .split(/\n\s*\n/g)
    .map((x) => x.trim())
    .filter((x) => x)
  const isShortTitle = (s: string) => {
    const t = s.trim()
    return t.endsWith('：') && t.length <= 16
  }
  const merged: string[] = []
  for (let i = 0; i < blocks.length; i++) {
    const cur = blocks[i]
    const next = blocks[i + 1]
    if (next && isShortTitle(cur) && (next.includes('\n') || next.trimStart().startsWith('- ') || next.length > 0)) {
      merged.push(`${cur}\n${next}`)
      i++
      continue
    }
    merged.push(cur)
  }
  return merged
}

function parseContextTags(text: string) {
  const raw = String(text ?? '')
  const ctxMatch = raw.match(/「([^」]+)」/)
  const ctxRaw = String(ctxMatch?.[1] ?? '').trim()
  const cleaned = ctxRaw.replace(/^已选中：/, '').trim()
  const tags = cleaned
    ? cleaned
        .split('｜')
        .map((x) => x.trim())
        .filter((x) => x)
    : []
  return { tags, ctxRaw }
}

export function ChatRichText({ text, showContextTags }: { text: string; showContextTags?: boolean }) {
  const { token } = theme.useToken()
  const raw = String(text ?? '').trim()
  const hasContext = /锁定当前上下文/.test(raw) && /「[^」]+」/.test(raw)
  const { tags } = useMemo(() => parseContextTags(raw), [raw])

  const bodyText = useMemo(() => {
    if (!hasContext) return raw
    return raw
      .replace(/已为你自动进入分析状态，并锁定当前上下文：/g, '')
      .replace(/您可以继续追问：/g, '您可以继续追问：')
      .replace(/「[^」]+」/g, '')
      .trim()
  }, [hasContext, raw])

  const blocks = useMemo(() => normalizeBlocks(bodyText), [bodyText])

  const renderBlock = (block: string, i: number) => {
    const isFollowUpHead = /^(您可以继续追问|追问建议)：?$/.test(block.trim())
    const lines = block
      .split('\n')
      .map((x) => x.trimEnd())
      .filter((x) => x.trim())
    const headLine = lines[0]?.trim() ?? ''
    const headIsTitle = /：$/.test(headLine) && headLine.length <= 16
    const followUpByFirstLine = /^(您可以继续追问|追问建议)：?$/.test(headLine)
    const deepAnalysisTitle = i === 0 && /^已进入“.+”深度分析模式/.test(headLine)

    if (lines.length > 1 && (headIsTitle || deepAnalysisTitle)) {
      const rest = lines.slice(1)
      const restFirstBullet = rest.findIndex((x) => x.trimStart().startsWith('- '))
      const restIsBullets = restFirstBullet === 0
      const items = restIsBullets ? rest.map((x) => x.replace(/^\-\s+/, '').trim()) : rest
      return (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: TITLE_CONTENT_GAP }}>
          {followUpByFirstLine ? <div style={{ height: 1, background: token.colorFillSecondary, opacity: 0.9 }} /> : null}
          <div
            style={{
              fontSize: 'var(--font-size-base)',
              lineHeight: BASE_LINE_HEIGHT,
              fontWeight: deepAnalysisTitle ? 800 : EMPHASIS_WEIGHT,
            }}
          >
            <InlineRich text={headLine} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {items.map((x, idx) => (
              <div key={idx} style={{ lineHeight: BASE_LINE_HEIGHT }}>
                <InlineRich text={x} />
              </div>
            ))}
          </div>
        </div>
      )
    }
    const firstBullet = lines.findIndex((x) => x.trimStart().startsWith('- '))
    if (firstBullet >= 0) {
      const head = lines.slice(0, firstBullet).join(' ').trim()
      const items = lines.slice(firstBullet).map((x) => x.replace(/^\-\s+/, '').trim())
      return (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: SECTION_GAP }}>
          {head ? (
            <div style={{ fontSize: 'var(--font-size-base)', lineHeight: BASE_LINE_HEIGHT, fontWeight: EMPHASIS_WEIGHT }}>
              <InlineRich text={head} />
            </div>
          ) : null}
          {renderBullets(items)}
        </div>
      )
    }

    if ((/：$/.test(block) && block.length <= 16) || deepAnalysisTitle) {
      return (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: TITLE_CONTENT_GAP }}>
          {isFollowUpHead ? <div style={{ height: 1, background: token.colorFillSecondary, opacity: 0.9 }} /> : null}
          <div style={{ fontSize: 'var(--font-size-base)', lineHeight: BASE_LINE_HEIGHT, fontWeight: deepAnalysisTitle ? 800 : EMPHASIS_WEIGHT }}>
            <InlineRich text={block} />
          </div>
        </div>
      )
    }

    return (
      <div key={i} style={{ whiteSpace: 'pre-wrap', lineHeight: BASE_LINE_HEIGHT, fontSize: 'var(--font-size-base)' }}>
        <InlineRich text={block} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: BLOCK_GAP, lineHeight: BASE_LINE_HEIGHT, fontSize: 'var(--font-size-base)' }}>
      {hasContext && showContextTags !== false ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: SECTION_GAP }}>
          <div style={{ fontSize: 'var(--font-size-base)', lineHeight: BASE_LINE_HEIGHT, fontWeight: EMPHASIS_WEIGHT }}>
            已锁定当前分析上下文：
          </div>
          {tags.length ? (
            <div style={{ fontSize: 'var(--font-size-base)', lineHeight: BASE_LINE_HEIGHT, fontWeight: 650, color: token.colorTextSecondary }}>
              {tags.join('｜')}
            </div>
          ) : null}
        </div>
      ) : null}
      {blocks.map(renderBlock)}
    </div>
  )
}
