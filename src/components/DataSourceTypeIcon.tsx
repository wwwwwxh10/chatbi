import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { FileExcelOutlined } from '@ant-design/icons'

import mysqlSvgRaw from 'simple-icons/icons/mysql.svg?raw'
import postgresqlSvgRaw from 'simple-icons/icons/postgresql.svg?raw'
import apacheHiveSvgRaw from 'simple-icons/icons/apachehive.svg?raw'
import teradataSvgRaw from 'simple-icons/icons/teradata.svg?raw'
import clickhouseSvgRaw from 'simple-icons/icons/clickhouse.svg?raw'
import apacheDorisSvgRaw from 'simple-icons/icons/apachedoris.svg?raw'

import starrocksSvg from '../assets/datasource-icons/starrocks.svg'
import icebergPng from '../assets/datasource-icons/iceberg.png'

type IconSpec =
  | { kind: 'raw'; raw: string; color: string }
  | { kind: 'img'; src: string }

const ICON_SPEC: Record<string, IconSpec> = {
  mysql: { kind: 'raw', raw: mysqlSvgRaw, color: '#4479A1' },
  postgres: { kind: 'raw', raw: postgresqlSvgRaw, color: '#4169E1' },
  hive: { kind: 'raw', raw: apacheHiveSvgRaw, color: '#FDEE21' },
  teradata: { kind: 'raw', raw: teradataSvgRaw, color: '#F37440' },
  clickhouse: { kind: 'raw', raw: clickhouseSvgRaw, color: '#FFCC01' },
  doris: { kind: 'raw', raw: apacheDorisSvgRaw, color: '#4C8BF5' },
  starrocks: { kind: 'img', src: starrocksSvg },
  iceberg: { kind: 'img', src: icebergPng },
}

function OracleWordmark({ size }: { size: number }) {
  const w = Math.round(size * 2.8)
  const h = size
  return (
    <svg width={w} height={h} viewBox="0 0 120 24" role="img" aria-label="oracle" style={{ display: 'block' }}>
      <text x="0" y="18" fontSize="18" fontFamily="Arial Black, Arial, sans-serif" fill="#F80000">
        ORACLE
      </text>
    </svg>
  )
}

function renderRawSvg(raw: string, size: number, color: string) {
  const svg = raw
    .replace('<svg', `<svg width="${size}" height="${size}" fill="currentColor"`)
    .replace(/<title>[\s\S]*?<\/title>/, '')
  return (
    <span
      role="img"
      style={{
        width: size,
        height: size,
        display: 'inline-block',
        color,
      }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

export function DataSourceTypeIcon({ type, size = 18 }: { type: string; size?: number }): ReactNode {
  const [failed, setFailed] = useState(false)
  if (type === 'oracle') return <OracleWordmark size={size} />
  if (type === 'file') return <FileExcelOutlined style={{ fontSize: size, color: '#22C55E' }} />

  const spec = useMemo(() => {
    if (failed) return null
    return ICON_SPEC[type] ?? null
  }, [failed, type])

  if (!spec) {
    const text = type ? String(type).slice(0, 2).toUpperCase() : ''
    return (
      <span
        aria-label={type}
        style={{
          width: size,
          height: size,
          display: 'inline-grid',
          placeItems: 'center',
          borderRadius: 6,
          background: 'rgba(255,255,255,0.10)',
          color: 'rgba(255,255,255,0.72)',
          fontSize: Math.max(9, Math.floor(size * 0.42)),
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        {text}
      </span>
    )
  }

  if (spec.kind === 'raw') return renderRawSvg(spec.raw, size, spec.color)

  return (
    <img
      src={spec.src}
      alt={type}
      width={size}
      height={size}
      style={{ display: 'block', objectFit: 'contain' }}
      onError={() => setFailed(true)}
    />
  )
}
