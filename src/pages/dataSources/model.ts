export type DataSourceType =
  | 'file'
  | 'mysql'
  | 'oracle'
  | 'postgres'
  | 'hive'
  | 'teradata'
  | 'iceberg'
  | 'clickhouse'
  | 'doris'
  | 'starrocks'
  | 'other'
export type DataSourceStatus = 'unknown' | 'ok' | 'error'

export type DataAccessMode = 'direct' | 'extract'
export type ExtractMode = 'full' | 'incremental'
export type ExtractFrequency = '5m' | '10m' | '30m' | '1h' | '1d'

export type DataSource = {
  id: string
  name: string
  type: DataSourceType
  dbVersion?: string
  accessMode?: DataAccessMode
  extractMode?: ExtractMode
  extractFrequency?: ExtractFrequency
  host: string
  port: number
  database: string
  username: string
  fileName?: string
  headerRow?: number
  datasetSelected?: number
  datasetTotal?: number
  status: DataSourceStatus
  statusMessage?: string
  updatedAt: string
}

export function nowId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function nowText() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ')
}

export function setQuery(search: string, next: Record<string, string | null>) {
  const p = new URLSearchParams(search)
  for (const [k, v] of Object.entries(next)) {
    if (v === null) p.delete(k)
    else p.set(k, v)
  }
  const s = p.toString()
  return s ? `?${s}` : ''
}

export function buildSeed(): DataSource[] {
  return [
    {
      id: 'ds-biz',
      name: '业务库',
      type: 'postgres',
      accessMode: 'direct',
      host: '10.0.0.12',
      port: 5432,
      database: 'biz',
      username: 'readonly',
      datasetSelected: 30,
      datasetTotal: 45,
      status: 'ok',
      updatedAt: nowText(),
    },
    {
      id: 'ds-warehouse',
      name: '数仓',
      type: 'hive',
      accessMode: 'extract',
      extractMode: 'full',
      extractFrequency: '1h',
      host: '10.0.0.21',
      port: 10000,
      database: 'dwh',
      username: 'etl',
      datasetSelected: 68,
      datasetTotal: 92,
      status: 'ok',
      updatedAt: nowText(),
    },
    {
      id: 'ds-ads',
      name: '实时分析库',
      type: 'clickhouse',
      accessMode: 'direct',
      host: '10.0.0.33',
      port: 8123,
      database: 'rt_analytics',
      username: 'reader',
      datasetSelected: 24,
      datasetTotal: 31,
      status: 'ok',
      updatedAt: nowText(),
    },
    {
      id: 'ds-orders-mysql',
      name: '订单库',
      type: 'mysql',
      accessMode: 'extract',
      extractMode: 'incremental',
      extractFrequency: '10m',
      host: '10.0.0.17',
      port: 3306,
      database: 'orders',
      username: 'ro',
      datasetSelected: 15,
      datasetTotal: 20,
      status: 'ok',
      updatedAt: nowText(),
    },
    {
      id: 'ds-file-1',
      name: '活动复盘文件',
      type: 'file',
      accessMode: 'direct',
      host: '',
      port: 0,
      database: '',
      username: '',
      fileName: 'activity_report.xlsx',
      headerRow: 1,
      datasetSelected: 2,
      datasetTotal: 2,
      status: 'ok',
      updatedAt: nowText(),
    },
    {
      id: 'ds-risk',
      name: '风控库',
      type: 'postgres',
      accessMode: 'direct',
      host: '10.0.0.44',
      port: 5432,
      database: 'risk',
      username: 'readonly',
      datasetSelected: 12,
      datasetTotal: 18,
      status: 'error',
      updatedAt: nowText(),
    },
    {
      id: 'ds-marketing',
      name: '营销中台',
      type: 'doris',
      accessMode: 'direct',
      host: '10.0.0.55',
      port: 9030,
      database: 'marketing',
      username: 'reader',
      datasetSelected: 40,
      datasetTotal: 57,
      status: 'ok',
      updatedAt: nowText(),
    },
  ]
}
