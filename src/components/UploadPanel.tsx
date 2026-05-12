import { Upload, theme } from 'antd'
import type { UploadProps } from 'antd'
import { CheckCircleOutlined, UploadOutlined, WarningOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import type { UploadFile } from 'antd/es/upload/interface'

export function UploadPanel({
  title,
  description,
  height = 140,
  templateAction,
  helperAction,
  seedFileName,
  seedStatus = 'done',
  seedKey,
  ...props
}: UploadProps & {
  title: string
  description?: string
  height?: number
  templateAction?: { label: string; onClick: () => void }
  helperAction?: { label: string; onClick: () => void }
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

  const shouldFailByName = (name: string) => {
    const lower = String(name ?? '').toLowerCase()
    return lower.includes('fail') || lower.includes('error')
  }

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
        customRequest={
          props.customRequest ??
          ((options: any) => {
            const { onSuccess, onProgress, onError, file, filename } = options
            const rawName = String(file?.name ?? filename ?? '')
            const shouldFail = shouldFailByName(rawName)
            let pct = 0
            const timer = window.setInterval(() => {
              pct = Math.min(100, pct + 10)
              onProgress?.({ percent: pct })
              if (pct >= 100) {
                window.clearInterval(timer)
                window.setTimeout(() => {
                  if (shouldFail) onError?.(new Error('Upload failed'), { status: 500 }, file)
                  else onSuccess?.('ok')
                }, 120)
              }
            }, 90)
          })
        }
        onChange={(info) => {
          const incoming = info.fileList.slice(0, maxCount)
          if (!props.fileList) setInternalFileList(incoming)
          props.onChange?.({ ...info, fileList: incoming } as any)
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
            {templateAction || helperAction ? (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
                {templateAction ? (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={templateAction.onClick}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') templateAction.onClick()
                    }}
                    style={{
                      fontSize: 12,
                      color: token.colorPrimary,
                      fontWeight: 650,
                      cursor: 'pointer',
                    }}
                  >
                    {templateAction.label}
                  </div>
                ) : null}
                {helperAction ? (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={helperAction.onClick}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') helperAction.onClick()
                    }}
                    style={{
                      fontSize: 12,
                      color: token.colorPrimary,
                      fontWeight: 650,
                      cursor: 'pointer',
                    }}
                  >
                    {helperAction.label}
                  </div>
                ) : null}
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
              className="uploadRow"
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

              {f.status === 'done' ? (
                <span aria-label="成功" style={{ flex: 'none', display: 'grid', placeItems: 'center', width: 14, height: 14, color: token.colorTextTertiary, marginRight: 10 }}>
                  <CheckCircleOutlined style={{ fontSize: 12 }} />
                </span>
              ) : null}
              {f.status === 'error' ? (
                <span aria-label="失败" style={{ flex: 'none', display: 'grid', placeItems: 'center', width: 14, height: 14, color: token.colorError, marginRight: 10 }}>
                  <WarningOutlined style={{ fontSize: 12 }} />
                </span>
              ) : null}

              {f.status === 'uploading' ? (
                <div style={{ flex: 'none', width: 120, height: 4, borderRadius: 2, background: token.colorFillTertiary, overflow: 'hidden', marginRight: 12 }}>
                  <div
                    style={{
                      width: `${percentOf(f)}%`,
                      height: '100%',
                      borderRadius: 2,
                      background: token.colorTextTertiary,
                      transition: 'width 120ms linear',
                    }}
                  />
                </div>
              ) : (
                <div style={{ flex: 'none', width: 120, marginRight: 12 }} />
              )}

              <div className="uploadRowActions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
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
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 8,
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer',
                    color: token.colorTextSecondary,
                    border: 'none',
                    background: 'transparent',
                    padding: 0,
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.background = token.colorFillTertiary
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                  }}
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
