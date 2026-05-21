import { Component, useEffect, useState, type ReactNode } from 'react'

function formatError(err: unknown) {
  if (!err) return 'Unknown error'
  if (typeof err === 'string') return err
  const anyErr = err as any
  const msg = typeof anyErr?.message === 'string' ? anyErr.message : String(err)
  const stack = typeof anyErr?.stack === 'string' ? anyErr.stack : ''
  return stack && !stack.includes(msg) ? `${msg}\n${stack}` : stack || msg
}

function Overlay({ text }: { text: string }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.92)',
        color: 'rgba(255,255,255,0.92)',
        zIndex: 99999,
        padding: 18,
        overflow: 'auto',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        fontSize: 12,
        lineHeight: 1.55,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 800 }}>发生运行时错误（请把下面内容截图/复制给我）</div>
        <button
          onClick={() => window.location.reload()}
          style={{
            appearance: 'none',
            border: '1px solid rgba(255,255,255,0.22)',
            background: 'rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.92)',
            borderRadius: 10,
            padding: '8px 12px',
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          刷新
        </button>
      </div>
      <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{text}</pre>
    </div>
  )
}

export function GlobalErrorOverlay({ children }: { children: ReactNode }) {
  const [errorText, setErrorText] = useState<string | null>(null)

  useEffect(() => {
    const onError = (e: any) => {
      const err = e?.error ?? e
      setErrorText(formatError(err))
    }
    const onRejection = (e: any) => {
      const reason = e?.reason
      setErrorText(formatError(reason))
    }
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])

  return (
    <>
      {children}
      {errorText ? <Overlay text={errorText} /> : null}
    </>
  )
}

export class AppErrorBoundary extends Component<{ children: ReactNode }, { errorText: string | null }> {
  state = { errorText: null }

  static getDerivedStateFromError(err: unknown) {
    return { errorText: formatError(err) }
  }

  componentDidCatch(err: unknown) {
    this.setState({ errorText: formatError(err) })
  }

  render() {
    const txt = this.state.errorText
    if (txt) return <Overlay text={txt} />
    return this.props.children
  }
}
