import { Upload, theme } from 'antd'
import type { UploadProps } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import type { UploadFile } from 'antd/es/upload/interface'

export function UploadPanel({
  title,
  description,
  height = 140,
  templateAction,
  seedFileName,
  seedStatus = 'done',
  seedKey,
  ...props
}: UploadProps & {
  title: string
  description?: string
  height?: number
  templateAction?: { label: string; onClick: () => void }
  seedFileName?: string
  seedStatus?: UploadFile['status']
  seedKey?: string | number
}) {
  const { token } = theme.useToken()
  const [internalFileList, setInternalFileList] = useState<UploadFile[]>([])

  useEffect(() => {
    if (props.fileList) return
    const name = String(seedFileName ?? '').trim()
    if (!name) {
      setInternalFileList([])
      return
    }
    setInternalFileList([
      {
        uid: `seed-${String(seedKey ?? '0')}`,
        name,
        status: seedStatus,
        percent: seedStatus === 'done' ? 100 : seedStatus === 'uploading' ? 30 : 0,
      },
    ])
  }, [props.fileList, seedFileName, seedKey, seedStatus])

  const fileList = props.fileList ?? internalFileList
  const maxCount = typeof props.maxCount === 'number' ? props.maxCount : 5

  const fileExt = (name: string) => {
    const s = String(name ?? '').trim().toLowerCase()
    const idx = s.lastIndexOf('.')
    if (idx < 0) return ''
    return s.slice(idx + 1)
  }

  const fileIcon = (name: string) => {
    const ext = fileExt(name)
    const key = ext || 'file'
    const src = `/vendor/wps-icons/${key}@2x.png`
    const fallbackSvg =
      'data:image/svg+xml,' +
      encodeURIComponent(
        `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.2 2.5h5.2l2.4 2.4v8.6c0 .6-.5 1.1-1.1 1.1H4.2c-.6 0-1.1-.5-1.1-1.1V3.6c0-.6.5-1.1 1.1-1.1Z" stroke="${token.colorTextTertiary}" stroke-width="1.2"/><path d="M9.4 2.5v2.4h2.4" stroke="${token.colorTextTertiary}" stroke-width="1.2"/></svg>`,
      )
    return (
      <img
        src={src}
        width={16}
        height={16}
        alt={key}
        style={{ display: 'block', borderRadius: 4, opacity: 0.92 }}
        onError={(e) => {
          e.currentTarget.src = fallbackSvg
        }}
      />
    )
  }

  const percentOf = (f?: UploadFile) => {
    if (!f) return 0
    if (typeof f.percent === 'number') return Math.max(0, Math.min(100, Math.round(f.percent)))
    if (f.status === 'uploading') return 50
    if (f.status === 'done') return 100
    return 0
  }

  const titleNode = (() => {
    const t = String(title || '').trim()
    if (t.startsWith('点击')) {
      const rest = t.slice(2)
      return (
        <>
          <span style={{ color: token.colorPrimary, fontWeight: 650 }}>点击</span>
          <span style={{ color: token.colorText, fontWeight: 650 }}>{rest}</span>
        </>
      )
    }
    return <span style={{ color: token.colorPrimary, fontWeight: 650 }}>{t}</span>
  })()

  return (
    <div style={{ width: '100%' }}>
      <Upload
        {...props}
        style={{ width: '100%', display: 'block' }}
        fileList={fileList}
        maxCount={maxCount}
        beforeUpload={async (file, files) => {
          const res = props.beforeUpload?.(file, files)
          const v = res instanceof Promise ? await res : res
          if (v === Upload.LIST_IGNORE) return Upload.LIST_IGNORE
          if (v === false) return false
          return true
        }}
        customRequest={(options: any) => {
          const { onSuccess, onProgress } = options
          let pct = 0
          const timer = window.setInterval(() => {
            pct = Math.min(100, pct + 12)
            onProgress?.({ percent: pct })
            if (pct >= 100) {
              window.clearInterval(timer)
              window.setTimeout(() => onSuccess?.('ok'), 120)
            }
          }, 80)
        }}
        onChange={(info) => {
          const incoming = info.fileList
          const f = info.file

          const emit = (nextList: UploadFile[]) => {
            if (!props.fileList) setInternalFileList(nextList)
            props.onChange?.({ ...info, fileList: nextList, file: f } as any)
          }

          if (!f?.status) {
            const base: UploadFile = { ...f, status: 'uploading', percent: 0 }
            const nextList = [...incoming.filter((x) => x.uid !== base.uid), base].slice(0, maxCount)
            emit(nextList)

            let pct = 0
            const timer = window.setInterval(() => {
              pct = Math.min(100, pct + 14)
              const updated: UploadFile = { ...base, percent: pct, status: pct >= 100 ? 'done' : 'uploading' }
              emit(nextList.map((x) => (x.uid === base.uid ? updated : x)))
              if (pct >= 100) window.clearInterval(timer)
            }, 90)
            return
          }

          emit(incoming.slice(0, maxCount))
        }}
        onRemove={(file) => {
          if (!props.fileList) setInternalFileList((prev) => prev.filter((x) => x.uid !== file.uid))
          return true
        }}
        showUploadList={false}
        progress={{ strokeColor: token.colorPrimary, size: 'small' }}
      >
        <div
          style={{
            height,
            borderRadius: 16,
            border: `1px dashed ${token.colorSplit}`,
            background: token.colorBgContainer,
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            userSelect: 'none',
            width: '100%',
            opacity: fileList.length >= maxCount ? 0.72 : 1,
            pointerEvents: fileList.length >= maxCount ? 'none' : 'auto',
          }}
        >
          <div style={{ textAlign: 'center', paddingInline: 18 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 10px',
                border: `1px solid ${token.colorSplit}`,
                background: token.colorFillTertiary,
                color: token.colorTextSecondary,
              }}
            >
              <UploadOutlined style={{ fontSize: 19 }} />
            </div>
            <div style={{ fontSize: 14, color: token.colorText }}>{titleNode}</div>
            {description ? <div style={{ marginTop: 6, fontSize: 12, color: token.colorTextSecondary }}>{description}</div> : null}
            {templateAction ? (
              <div
                role="button"
                tabIndex={0}
                onClick={templateAction.onClick}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') templateAction.onClick()
                }}
                style={{
                  marginTop: 6,
                  fontSize: 12,
                  color: token.colorPrimary,
                  fontWeight: 650,
                  cursor: 'pointer',
                }}
              >
                {templateAction.label}
              </div>
            ) : null}
          </div>
        </div>
      </Upload>

      {fileList.length ? (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }} aria-live="polite">
          {fileList.map((f) => (
            <div
              key={f.uid}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 10px',
                borderRadius: 10,
                border: `1px solid ${token.colorSplit}`,
                background: token.colorBgContainer,
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLDivElement).style.background = token.colorFillQuaternary
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLDivElement).style.background = token.colorBgContainer
              }}
            >
              <div style={{ flex: 'none', width: 16, height: 16, display: 'grid', placeItems: 'center', marginRight: 8 }}>{fileIcon(String(f.name ?? ''))}</div>
              <div
                style={{
                  minWidth: 0,
                  maxWidth: 220,
                  flex: 'none',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: 12,
                  color:
                    f.status === 'error'
                      ? token.colorError
                      : f.status === 'done'
                        ? token.colorText
                        : token.colorTextSecondary,
                  opacity: f.status === 'uploading' ? 0.72 : 1,
                  marginRight: 4,
                }}
              >
                {String(f.name ?? '')}
              </div>

              {f.status === 'uploading' ? (
                <div style={{ flex: 'none', width: 120, height: 4, borderRadius: 2, background: token.colorFillTertiary, overflow: 'hidden', marginRight: 12 }}>
                  <div style={{ width: `${percentOf(f)}%`, height: '100%', borderRadius: 2, background: token.colorPrimary, transition: 'width 120ms linear' }} />
                </div>
              ) : (
                <div style={{ flex: 'none', width: 120, marginRight: 12 }} />
              )}

              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                {f.status === 'error' ? (
                  <button
                    type="button"
                    aria-label="重试"
                    onClick={() => {
                      if (props.fileList) return
                      setInternalFileList((prev) => prev.map((x) => (x.uid === f.uid ? { ...x, status: 'uploading', percent: 0 } : x)))
                    }}
                    style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', color: token.colorTextSecondary }}
                  >
                    ↻
                  </button>
                ) : null}
                <button
                  type="button"
                  aria-label="删除"
                  onClick={() => {
                    const ok = props.onRemove?.(f as any)
                    if (ok === false) return
                    const nextList = fileList.filter((x) => x.uid !== f.uid)
                    if (props.fileList) {
                      props.onChange?.({ file: { ...f, status: 'removed' }, fileList: nextList } as any)
                      return
                    }
                    setInternalFileList(nextList)
                  }}
                  style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', color: token.colorTextSecondary }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
