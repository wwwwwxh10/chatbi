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
    const spec = (() => {
      const excel = new Set(['xls', 'xlsx', 'csv'])
      const word = new Set(['doc', 'docx'])
      const ppt = new Set(['ppt', 'pptx'])
      const pdf = new Set(['pdf'])
      const image = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'])
      const zip = new Set(['zip', 'rar', '7z'])
      if (excel.has(ext)) return { kind: 'excel' as const, ribbon: '#107C41', label: 'X' }
      if (word.has(ext)) return { kind: 'word' as const, ribbon: '#185ABD', label: 'W' }
      if (ppt.has(ext)) return { kind: 'ppt' as const, ribbon: '#D24726', label: 'P' }
      if (pdf.has(ext)) return { kind: 'pdf' as const, ribbon: '#B30B00', label: 'P' }
      if (image.has(ext)) return { kind: 'image' as const, ribbon: '#0078D4', label: 'I' }
      if (zip.has(ext)) return { kind: 'zip' as const, ribbon: '#6B7280', label: 'Z' }
      if (ext) return { kind: 'other' as const, ribbon: '#64748B', label: ext.toUpperCase().slice(0, 1) }
      return { kind: 'other' as const, ribbon: '#64748B', label: 'F' }
    })()

    const label = spec.label
    const ribbon = spec.ribbon

    return (
      <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="uploadFileRibbon" x1="2.2" y1="1.2" x2="6.4" y2="14.8" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={ribbon} stopOpacity="1" />
            <stop offset="1" stopColor={ribbon} stopOpacity="0.86" />
          </linearGradient>
        </defs>

        <rect x="2.2" y="1.2" width="11.6" height="13.6" rx="2" fill="rgba(255,255,255,0.96)" />
        <rect x="2.2" y="1.2" width="11.6" height="13.6" rx="2" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="0.9" />
        <path d="M10.2 1.2v2.55c0 0.72 0.58 1.3 1.3 1.3h2.3" fill="rgba(0,0,0,0.03)" />
        <path d="M10.2 1.2v2.55c0 0.72 0.58 1.3 1.3 1.3h2.3" fill="none" stroke="rgba(0,0,0,0.10)" strokeWidth="0.9" />

        <rect x="2.2" y="1.2" width="4.2" height="13.6" rx="2" fill="url(#uploadFileRibbon)" />

        {spec.kind === 'pdf' ? (
          <>
            <rect x="7.4" y="9.2" width="5.6" height="2.6" rx="0.8" fill={ribbon} opacity="0.12" />
            <text
              x="10.2"
              y="11.1"
              textAnchor="middle"
              fontSize="5.1"
              fontFamily="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Segoe UI', Arial"
              fontWeight="900"
              fill={ribbon}
              opacity="0.92"
            >
              PDF
            </text>
          </>
        ) : spec.kind === 'image' ? (
          <>
            <rect x="7.45" y="5.75" width="5.3" height="4.8" rx="0.9" fill={ribbon} opacity="0.06" />
            <path d="M8.15 10.0l1.15-1.25 0.85 0.9 0.8-1.0 0.95 1.35" fill="none" stroke={ribbon} strokeOpacity="0.42" strokeWidth="0.9" strokeLinejoin="round" />
            <circle cx="8.85" cy="6.9" r="0.5" fill={ribbon} opacity="0.30" />
          </>
        ) : null}

        <text
          x="4.3"
          y="10.25"
          textAnchor="middle"
          fontSize="8.2"
          fontFamily="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Segoe UI', Arial"
          fontWeight="900"
          fill="rgba(255,255,255,0.96)"
        >
          {label}
        </text>
      </svg>
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
        progress={{ strokeColor: token.colorSuccess, size: 'small' }}
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
              <div style={{ flex: 'none', width: 16, height: 16, display: 'grid', placeItems: 'center', marginRight: 8 }}>
                {fileIcon(String(f.name ?? ''))}
              </div>
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
                <span aria-label="成功" style={{ flex: 'none', display: 'grid', placeItems: 'center', width: 14, height: 14, color: token.colorSuccess, marginRight: 10 }}>
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
                      background: token.colorSuccess,
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
