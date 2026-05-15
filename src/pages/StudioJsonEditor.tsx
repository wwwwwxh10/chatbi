import { Card, Typography, theme } from 'antd'
import { useMemo, useRef } from 'react'
import { WarningFilled } from '@ant-design/icons'
import { highlightJson, KIND_NAME } from './studioModel'
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

  const linesArr = useMemo(() => text.split('\n'), [text])
  const lines = Math.max(1, linesArr.length)
  const errLines = useMemo(() => {
    const xs = (error?.issues ?? []).map((x) => x.line).filter((x): x is number => typeof x === 'number' && Number.isFinite(x))
    if (typeof error?.line === 'number' && Number.isFinite(error.line)) xs.push(error.line)
    const set = new Set<number>()
    for (const n of xs) {
      const clamped = Math.max(1, Math.min(lines, n))
      set.add(clamped)
    }
    return set
  }, [error, lines])
  const highlightedLines = useMemo(() => {
    const raw = highlightJson(text)
    return raw.split('\n')
  }, [text])

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
    <div style={{ width: fullscreen ? 'calc(100vw - 92px)' : 640, maxWidth: '100%' }}>
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
        <div style={{ border: `1px solid ${token.colorSplit}`, borderRadius: 12, overflow: 'hidden', background: 'rgba(10, 14, 24, 0.90)' }}>
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
                borderRight: `1px solid ${token.colorSplit}`,
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
                {highlightedLines.map((ln, i) => {
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
                      dangerouslySetInnerHTML={{ __html: ln || ' ' }}
                    />
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

      {slot.kind && error ? (
        <div
          style={{
            marginTop: 0,
            borderRadius: '0 0 12px 12px',
            background: 'rgba(127, 29, 29, 0.72)',
            borderTop: '1px solid rgba(239, 68, 68, 0.35)',
            padding: '10px 12px',
          }}
        >
          <div style={{ color: 'rgba(254, 226, 226, 0.95)', fontSize: 12, lineHeight: 1.35 }}>
            <div style={{ fontWeight: 800, marginBottom: 4 }}>语法解析错误</div>
            <div style={{ display: 'grid', gap: 4 }}>
              {(error.issues && error.issues.length ? error.issues : [{ message: error.message, line: error.line }]).map((it, idx) => (
                <div key={idx}>
                  {it.line ? `第 ${it.line} 行：` : ''}
                  {it.message}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )

  return body
}
