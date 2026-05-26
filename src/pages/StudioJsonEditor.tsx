import { Card, Typography, theme } from 'antd'
import { useMemo, useRef } from 'react'
import { WarningFilled } from '@ant-design/icons'
import { KIND_NAME, validateWidget } from './studioModel'
import type { WidgetKind, WidgetSlot } from './studioModel'

export function StudioJsonEditor({
  slot,
  text,
  error,
  fullscreen,
  readOnly,
  onPickKind,
  onChangeText,
}: {
  slot: WidgetSlot
  text: string
  error: WidgetSlot['error']
  fullscreen: boolean
  readOnly: boolean
  onPickKind: (kind: WidgetKind) => void
  onChangeText: (text: string) => void
}) {
  const { token } = theme.useToken()

  const effectiveError = useMemo(() => {
    if (!slot.kind) return null
    if (error) return error
    const v = validateWidget(slot.kind, text)
    return 'error' in v ? v.error : null
  }, [error, slot.kind, text])

  const linesArr = useMemo(() => text.split('\n'), [text])
  const lines = Math.max(1, linesArr.length)
  const errLines = useMemo(() => {
    const xs = (effectiveError?.issues ?? []).map((x) => x.line).filter((x): x is number => typeof x === 'number' && Number.isFinite(x))
    if (typeof effectiveError?.line === 'number' && Number.isFinite(effectiveError.line)) xs.push(effectiveError.line)
    const set = new Set<number>()
    for (const n of xs) {
      const clamped = Math.max(1, Math.min(lines, n))
      set.add(clamped)
    }
    return set
  }, [effectiveError, lines])
  const highlightedLines = useMemo(() => {
    const tokenRe = /"(?:\\.|[^"\\])*"|\btrue\b|\bfalse\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g
    const renderLine = (line: string) => {
      const out: any[] = []
      let last = 0
      tokenRe.lastIndex = 0
      for (;;) {
        const m = tokenRe.exec(line)
        if (!m) break
        const start = m.index
        const end = start + m[0].length
        if (start > last) out.push({ t: line.slice(last, start), c: null })
        const raw = m[0]
        let color: string | null = null
        if (raw[0] === '"') {
          const rest = line.slice(end)
          const isKey = /^\s*:/.test(rest)
          color = isKey ? '#93c5fd' : '#fca5a5'
        } else if (raw === 'true' || raw === 'false' || raw === 'null') color = '#86efac'
        else color = '#fcd34d'
        out.push({ t: raw, c: color })
        last = end
      }
      if (last < line.length) out.push({ t: line.slice(last), c: null })
      return out.map((it, idx) =>
        it.c ? (
          <span key={idx} style={{ color: it.c }}>
            {it.t}
          </span>
        ) : (
          <span key={idx}>{it.t}</span>
        ),
      )
    }
    return linesArr.map((ln) => renderLine(ln))
  }, [linesArr])

  const preRef = useRef<HTMLPreElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const syncingRef = useRef(false)
  const syncTo = (from: 'pre' | 'ta') => {
    if (syncingRef.current) return
    const pre = preRef.current
    const ta = textareaRef.current
    if (!pre || !ta) return
    syncingRef.current = true
    if (from === 'pre') {
      ta.scrollTop = pre.scrollTop
      ta.scrollLeft = pre.scrollLeft
    } else {
      pre.scrollTop = ta.scrollTop
      pre.scrollLeft = ta.scrollLeft
    }
    requestAnimationFrame(() => {
      syncingRef.current = false
    })
  }
  const body = (
    <div style={{ width: '100%', maxWidth: fullscreen ? 'calc(100vw - 92px)' : 640, margin: '0 auto' }}>
      {!slot.kind ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {(
            [
              'kpi',
              'flip',
              'gauge',
              'progress',
              'wave',
              'line',
              'line-curve',
              'line-area',
              'bar',
              'bar-h',
              'bar-grouped',
              'bar-stacked',
              'pie',
              'donut',
              'rose',
              'radar',
              'bubble',
              'scatter',
              'funnel',
              'sankey',
            ] as WidgetKind[]
          ).map((k) => (
            <Card key={k} hoverable styles={{ body: { padding: 12 } }} onClick={() => onPickKind(k)}>
              <Typography.Text strong>{KIND_NAME[k]}</Typography.Text>
              <div style={{ height: 4 }} />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                点击填充到当前槽位
              </Typography.Text>
            </Card>
          ))}
        </div>
      ) : (
        <div style={{ border: 'none', borderRadius: 4, overflow: 'hidden', background: 'rgba(8, 13, 23, 0.88)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr' }}>
            <div
              style={{
                padding: '12px 0',
                textAlign: 'right',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                fontSize: 12,
                lineHeight: '18px',
                color: token.colorTextTertiary,
                userSelect: 'none',
                borderRight: '1px solid rgba(255,255,255,0.10)',
              }}
            >
              {Array.from({ length: lines }).map((_, i) => {
                const n = i + 1
                const isErr = errLines.has(n)
                return (
                  <div
                    key={i}
                    style={{
                      paddingRight: 10,
                      paddingLeft: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: 6,
                      background: isErr ? 'rgba(239, 68, 68, 0.14)' : 'transparent',
                    }}
                  >
                    {isErr ? <WarningFilled style={{ color: '#f59e0b', fontSize: 12 }} /> : null}
                    <span>{n}</span>
                  </div>
                )
              })}
            </div>

            <div style={{ position: 'relative', minHeight: fullscreen ? 'min(72vh, 720px)' : 280 }}>
              <pre
                ref={preRef}
                aria-hidden
                onScroll={() => syncTo('pre')}
                style={{
                  position: 'absolute',
                  inset: 0,
                  margin: 0,
                  padding: 12,
                  minHeight: fullscreen ? 'min(72vh, 720px)' : 280,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  fontSize: 12,
                  lineHeight: '18px',
                  whiteSpace: 'pre',
                  color: token.colorText,
                  overflow: 'auto',
                }}
              >
                {highlightedLines.map((nodes, i) => {
                  const n = i + 1
                  const isErr = errLines.has(n)
                  return (
                    <div
                      key={i}
                      style={{
                        background: isErr ? 'rgba(239, 68, 68, 0.16)' : 'transparent',
                        borderLeft: isErr ? '3px solid rgba(239, 68, 68, 0.75)' : '3px solid transparent',
                        paddingLeft: 9,
                        marginLeft: -12,
                        paddingRight: 12,
                      }}
                    >
                      {nodes.length ? nodes : ' '}
                    </div>
                  )
                })}
              </pre>

              <textarea
                ref={textareaRef}
                value={text}
                readOnly={readOnly}
                spellCheck={false}
                onScroll={() => syncTo('ta')}
                onChange={(e) => onChangeText(e.target.value)}
                style={{
                  position: 'absolute',
                  inset: 0,
                  margin: 0,
                  padding: 12,
                  border: 0,
                  outline: 'none',
                  resize: 'none',
                  background: 'transparent',
                  color: 'transparent',
                  caretColor: token.colorText,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  fontSize: 12,
                  lineHeight: '18px',
                  whiteSpace: 'pre',
                  overflow: 'auto',
                }}
              />

            </div>
          </div>
        </div>
      )}

      {slot.kind && effectiveError ? (
        <div
          style={{
            marginTop: 0,
            borderRadius: '0 0 4px 4px',
            background: 'rgba(127, 29, 29, 0.72)',
            borderTop: '1px solid rgba(239, 68, 68, 0.35)',
            padding: '10px 12px',
          }}
        >
          <div style={{ color: 'rgba(254, 226, 226, 0.95)', fontSize: 12, lineHeight: 1.35 }}>
            <div style={{ fontWeight: 800, marginBottom: 4 }}>
              {String(effectiveError.message ?? '').startsWith('Schema:') ? '配置校验错误' : '语法解析错误'}
            </div>
            <div style={{ display: 'grid', gap: 4 }}>
              {(effectiveError.issues && effectiveError.issues.length ? effectiveError.issues : [{ message: effectiveError.message, line: effectiveError.line }]).map(
                (it, idx) => (
                <div key={idx}>
                  {it.line ? `第 ${it.line} 行：` : ''}
                  {it.message}
                </div>
              ),
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )

  return body
}
