import { Button, Card, Empty, Input, List, Space, Switch, Table, Tabs, Typography, theme } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { DataSource } from './model'
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { DataTableIcon } from '../../components/icons/DataTableIcon'
import { useAppStore } from '../../store/appStore'

type FieldType = 'Str' | 'Num' | 'Date' | 'Geo' | 'ImgUrl' | 'ImgFile'
type FieldRole = 'dimension' | 'measure'

type Field = {
  id: string
  displayName: string
  physicalName: string
  type: FieldType
  role: FieldRole
  description: string
  enabled: boolean
  hidden?: boolean
}

const TEXT = {
  zh: {
    refresh: '刷新',
    preview: '数据预览',
    fields: '字段详情',
    dim: '维度',
    mea: '度量',
    total: '总字段数',
    max100: '最多预览前100条',
    semanticHint: '通过“字段名/字段描述”增强语义口径，系统将用于对话解释与口径提示。',
    datasetList: '数据表列表',
    datasetSearch: '搜索数据表',
    colDisplay: '字段名',
    colPhysical: '物理字段名',
    colType: '字段类型',
    colDesc: '字段描述',
    descPh: '用于增强语义理解',
  },
  en: {
    refresh: 'Refresh',
    preview: 'Data preview',
    fields: 'Field details',
    dim: 'Dimensions',
    mea: 'Measures',
    total: 'Total fields',
    max100: 'Preview up to 100 rows',
    semanticHint: 'Use “Display name / Description” to enhance semantics for chat explanation and definition hints.',
    datasetList: 'Datasets',
    datasetSearch: 'Search datasets',
    colDisplay: 'Display name',
    colPhysical: 'Physical name',
    colType: 'Type',
    colDesc: 'Description',
    descPh: 'Enhance semantics',
  },
} as const

type Dataset = {
  name: string
  fields: Field[]
  previewRows: Array<Record<string, string | number | null>>
}

function buildSeed(ds: DataSource, lang: 'zh' | 'en'): Dataset[] {
  const base = ds.type === 'file' ? 'sheet_1' : 'orders'
  const dimFields: Field[] = Array.from({ length: 14 }).map((_, i) => {
    const idx = i + 2
    const physical = `COL_${idx}`
    const type: FieldType =
      idx === 2
        ? 'Date'
        : idx === 3
          ? 'Geo'
          : idx === 4
            ? 'ImgUrl'
            : idx === 7
              ? 'ImgFile'
              : 'Str'
    return {
      id: `d-${idx}`,
      displayName: physical,
      physicalName: physical,
      type,
      role: 'dimension',
      description:
        idx === 8
          ? lang === 'en'
            ? 'Year'
            : '年份'
          : idx === 9
            ? lang === 'en'
              ? 'Month'
              : '月份'
            : idx === 10
              ? lang === 'en'
                ? 'Department'
                : '部门'
              : String(idx),
      hidden: idx === 7,
      enabled: true,
    }
  })

  const measureFields: Field[] = Array.from({ length: 5 }).map((_, i) => {
    const idx = 15 + i
    const physical = `COL_${idx}`
    return {
      id: `m-${idx}`,
      displayName: physical,
      physicalName: physical,
      type: 'Num',
      role: 'measure',
      description:
        idx === 15
          ? lang === 'en'
            ? 'Metric A'
            : '指标A'
          : idx === 16
            ? lang === 'en'
              ? 'Metric B'
              : '指标B'
            : lang === 'en'
              ? `Measure ${i + 1}`
              : `度量${i + 1}`,
      enabled: true,
    }
  })

  const rows = Array.from({ length: 120 }).map((_, r) => {
    const row: Record<string, string | number | null> = {}
    for (const f of [...dimFields, ...measureFields]) {
      if (f.physicalName === 'COL_2') row[f.physicalName] = `2025-0${(r % 9) + 1}-01`
      else if (f.physicalName === 'COL_3') row[f.physicalName] = r % 2 === 0 ? '上海' : '杭州'
      else if (f.physicalName === 'COL_4') row[f.physicalName] = 'https://example.com/img.png'
      else if (f.physicalName === 'COL_7') row[f.physicalName] = r % 3 === 0 ? 'uploaded://image' : '-'
      if (f.physicalName === 'COL_8') row[f.physicalName] = '2015年'
      else if (f.physicalName === 'COL_9') row[f.physicalName] = `${(r % 6) + 1}月`
      else if (f.physicalName === 'COL_10') row[f.physicalName] = r % 2 === 0 ? '客服部' : '招商部'
      else if (f.physicalName === 'COL_6') row[f.physicalName] = r % 5 === 2 ? '#REF!' : '-'
      else if (f.physicalName === 'COL_15') row[f.physicalName] = r % 7 < 4 ? '#DIV/0!' : 0
      else if (f.physicalName === 'COL_16') row[f.physicalName] = r % 7 < 4 ? '#DIV/0!' : Number((0.18 + (r % 5) * 0.01).toFixed(6))
      else row[f.physicalName] = '-'
    }
    return row
  })

  const ds1: Dataset = {
    name: base,
    fields: [...dimFields, ...measureFields],
    previewRows: rows,
  }

  const ds2: Dataset = {
    name: ds.type === 'file' ? 'sheet_2' : 'users',
    fields: [
      {
        id: 'u-1',
        displayName: 'user_id',
        physicalName: 'user_id',
        type: 'Str',
        role: 'dimension',
        description: lang === 'en' ? 'User ID' : '用户ID',
        enabled: true,
      },
      {
        id: 'u-2',
        displayName: 'signup_date',
        physicalName: 'signup_date',
        type: 'Date',
        role: 'dimension',
        description: lang === 'en' ? 'Signup date' : '注册时间',
        enabled: true,
      },
      {
        id: 'u-3',
        displayName: 'country',
        physicalName: 'country',
        type: 'Str',
        role: 'dimension',
        description: lang === 'en' ? 'Country/Region' : '国家/地区',
        enabled: true,
      },
      {
        id: 'u-4',
        displayName: 'order_cnt',
        physicalName: 'order_cnt',
        type: 'Num',
        role: 'measure',
        description: lang === 'en' ? 'Order count' : '订单数',
        enabled: true,
      },
    ],
    previewRows: Array.from({ length: 120 }).map((_, i) => ({
      user_id: `U${String(1000 + i)}`,
      signup_date: `2025-0${(i % 9) + 1}-01`,
      country: i % 2 === 0 ? 'CN' : 'US',
      order_cnt: i % 7,
    })),
  }

  return [ds1, ds2]
}

export function DataSourceDetail({ dataSource }: { dataSource: DataSource }) {
  const { token } = theme.useToken()
  const locale = useAppStore((s) => s.locale)
  const lang = locale === 'en-US' ? 'en' : 'zh'
  const L = TEXT[lang]
  const [dsQuery, setDsQuery] = useState('')
  const [activeTable, setActiveTable] = useState<string>('')
  const [datasets, setDatasets] = useState<Dataset[]>(() => buildSeed(dataSource, lang))
  const [tabKey, setTabKey] = useState<'preview' | 'fields'>('preview')
  const previewTableWrapRef = useRef<HTMLDivElement | null>(null)
  const [previewScrollY, setPreviewScrollY] = useState(360)

  useEffect(() => {
    setActiveTable('')
    setDatasets(buildSeed(dataSource, lang))
    setTabKey('preview')
  }, [dataSource.id, lang])

  useEffect(() => {
    const el = previewTableWrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const h = el.getBoundingClientRect().height
      setPreviewScrollY(Math.max(240, Math.floor(h)))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const updateField = (datasetName: string, fieldId: string, patch: Partial<Field>) => {
    setDatasets((prev) =>
      prev.map((d) =>
        d.name !== datasetName
          ? d
          : {
              ...d,
              fields: d.fields.map((f) => (f.id === fieldId ? { ...f, ...patch } : f)),
            },
      ),
    )
  }

  const current = useMemo(() => {
    const name = activeTable || datasets[0]?.name
    return datasets.find((x) => x.name === name) ?? datasets[0]
  }, [activeTable, datasets])

  const previewY = useMemo(() => {
    const byWrap = Math.max(240, previewScrollY - 12)
    const byRows = Math.max(240, (current?.previewRows ?? []).slice(0, 100).length * 44 + 12)
    return Math.min(byWrap, byRows)
  }, [previewScrollY, current])

  const visibleFields = useMemo(() => current?.fields ?? [], [current])
  const enabledFields = useMemo(() => visibleFields.filter((f) => f.enabled), [visibleFields])

  const typePill = (type: FieldType) => {
    const label =
      type === 'Str'
        ? 'Str.'
        : type === 'Num'
          ? 'Num'
          : type === 'Date'
            ? 'Date'
            : type === 'Geo'
              ? 'Geo'
              : type === 'ImgUrl'
                ? 'Img'
                : 'File'

    const fg =
      type === 'Num'
        ? '#16A34A'
        : type === 'Date'
          ? '#9333EA'
          : type === 'Geo'
            ? '#0891B2'
            : type === 'ImgUrl'
              ? '#A16207'
              : type === 'ImgFile'
                ? '#C2410C'
                : '#2563EB'

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '0 0',
          borderRadius: 0,
          color: fg,
          fontSize: 12,
          fontWeight: 700,
          lineHeight: 1.2,
        }}
      >
        {label}
      </span>
    )
  }

  const dimFields = useMemo(() => visibleFields.filter((f) => f.role === 'dimension'), [visibleFields])
  const meaFields = useMemo(() => visibleFields.filter((f) => f.role === 'measure'), [visibleFields])

  const previewColumns: ColumnsType<Record<string, string | number | null>> = useMemo(() => {
    const cols = enabledFields.slice(0, 10)
    return cols.map((f) => ({
      title: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {f.displayName}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>{typePill(f.type)}</div>
        </div>
      ),
      dataIndex: f.physicalName,
      key: f.physicalName,
      width: 140,
      ellipsis: true,
      render: (v) => <span style={{ color: v === '#REF!' || v === '#DIV/0!' ? token.colorError : token.colorText }}>{String(v ?? '-') }</span>,
    }))
    return cols.length ? cols : []
  }, [enabledFields, token.colorError, token.colorText])

  const fieldColumns: ColumnsType<Field> = [
    {
      title: L.colDisplay,
      dataIndex: 'displayName',
      key: 'displayName',
      width: 220,
      render: (_v, r) => (
        <Input
          value={r.displayName}
          size="small"
          onChange={(e) => updateField(current.name, r.id, { displayName: e.target.value })}
        />
      ),
    },
    {
      title: L.colPhysical,
      dataIndex: 'physicalName',
      key: 'physicalName',
      width: 240,
      render: (v) => <Typography.Text code>{v}</Typography.Text>,
    },
    { title: L.colType, dataIndex: 'type', key: 'type', width: 120, render: (v: FieldType) => typePill(v) },
    {
      title: L.colDesc,
      dataIndex: 'description',
      key: 'description',
      render: (_v, r) => (
        <Input
          value={r.description}
          size="small"
          placeholder={L.descPh}
          onChange={(e) => updateField(current.name, r.id, { description: e.target.value })}
        />
      ),
    },
    {
      title: '启用',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 90,
      fixed: 'right',
      render: (_v, r) => <Switch checked={r.enabled} onChange={(checked) => updateField(current.name, r.id, { enabled: checked })} />,
    },
  ]

  if (!current) return <Empty description={null} />

  const filteredDatasets = useMemo(() => {
    const q = dsQuery.trim().toLowerCase()
    if (!q) return datasets
    return datasets.filter((d) => d.name.toLowerCase().includes(q))
  }, [datasets, dsQuery])

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'stretch', height: '100%', minHeight: 0 }}>
      <Card styles={{ body: { padding: 0, height: '100%', display: 'flex', flexDirection: 'column' } }} style={{ width: 300, flex: 'none', height: '100%', minHeight: 0 }}>
        <div style={{ padding: 12 }}>
          <Space direction="vertical" size={10} style={{ width: '100%' }}>
            <Input value={dsQuery} onChange={(e) => setDsQuery(e.target.value)} placeholder={L.datasetSearch} prefix={<SearchOutlined />} />
          </Space>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 12, paddingTop: 0 }}>
          <List
            split={false}
            dataSource={filteredDatasets}
            renderItem={(it) => (
              <List.Item style={{ paddingInline: 0, paddingBlock: 6, border: 0 }}>
                <Button
                  type="text"
                  block
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    gap: 10,
                    height: 44,
                    borderRadius: 14,
                    border: 'none',
                    background: current.name === it.name ? token.colorFillSecondary : token.colorFillQuaternary,
                    color: token.colorText,
                  }}
                  onClick={() => setActiveTable(it.name)}
                  icon={<DataTableIcon size={16} color={current.name === it.name ? token.colorPrimary : token.colorTextSecondary} />}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.name}</span>
                </Button>
              </List.Item>
            )}
          />
        </div>
      </Card>

      <Card styles={{ body: { padding: 12, height: '100%', display: 'flex', flexDirection: 'column' } }} style={{ flex: 1, minWidth: 0, height: '100%', minHeight: 0 }}>
        <Tabs
          activeKey={tabKey}
          onChange={(k) => setTabKey(k === 'fields' ? 'fields' : 'preview')}
          style={{ flex: 1, minHeight: 0 }}
          className="dsDetailTabs fillTabs"
          items={[
            {
              key: 'preview',
              label: L.preview,
              children: (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
                  <div ref={previewTableWrapRef} style={{ flex: 1, minHeight: 0, border: `1px solid ${token.colorSplit}`, borderRadius: 12, overflow: 'hidden' }}>
                    {previewColumns.length ? (
                      <Table
                        size="middle"
                        sticky
                        scroll={{ x: 1400, y: previewY }}
                        pagination={false}
                        className="dsPreviewTable"
                        columns={previewColumns}
                        dataSource={(current.previewRows ?? []).slice(0, 100).map((r, i) => ({ ...r, key: i }))}
                      />
                    ) : (
                      <div style={{ height: '100%', display: 'grid', placeItems: 'center' }}>
                        <Empty description={null} />
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 'none', marginTop: 'auto', borderTop: `1px solid ${token.colorSplit}`, paddingTop: 10, paddingBottom: 2, background: token.colorBgContainer }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, fontSize: 12, color: token.colorTextSecondary }}>
                      <div>
                        {L.total} {visibleFields.length}　<span style={{ color: token.colorPrimary }}>●</span> {L.dim}{' '}
                        <span style={{ color: token.colorPrimary, fontWeight: 750 }}>{dimFields.length}</span>　<span style={{ color: token.colorPrimary }}>●</span> {L.mea}{' '}
                        <span style={{ color: token.colorPrimary, fontWeight: 750 }}>{meaFields.length}</span>
                      </div>
                      <Space size={10} align="center">
                        <span style={{ color: token.colorTextSecondary }}>{L.max100}</span>
                        <Button
                          type="text"
                          size="small"
                          icon={<ReloadOutlined style={{ color: token.colorPrimary }} />}
                          style={{ fontSize: 12, color: token.colorPrimary }}
                          onClick={() => setDatasets(buildSeed(dataSource, lang))}
                        >
                          {L.refresh}
                        </Button>
                      </Space>
                    </div>
                  </div>
                </div>
              ),
            },
            {
              key: 'fields',
              label: L.fields,
              children: (
                <div style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ flex: 1, minHeight: 0, overflow: 'auto', paddingRight: 2 }}>
                    <Space direction="vertical" size={10} style={{ width: '100%' }}>
                      <Card size="small" styles={{ body: { padding: 0 } }}>
                        <div style={{ padding: '10px 12px', fontSize: 12 }}>
                          <span style={{ color: token.colorPrimary, fontWeight: 700 }}>●</span> {L.dim}：
                          <span style={{ color: token.colorPrimary, fontWeight: 750 }}> {dimFields.length}</span>
                        </div>
                        <Table
                          size="small"
                          pagination={false}
                          columns={fieldColumns}
                          dataSource={dimFields.map((x) => ({ ...x, key: x.id }))}
                          scroll={{ x: 'max-content' }}
                        />
                      </Card>

                      <Card size="small" styles={{ body: { padding: 0 } }}>
                        <div style={{ padding: '10px 12px', fontSize: 12 }}>
                          <span style={{ color: token.colorPrimary, fontWeight: 700 }}>●</span> {L.mea}：
                          <span style={{ color: token.colorPrimary, fontWeight: 750 }}> {meaFields.length}</span>
                        </div>
                        <Table
                          size="small"
                          pagination={false}
                          columns={fieldColumns}
                          dataSource={meaFields.map((x) => ({ ...x, key: x.id }))}
                          scroll={{ x: 'max-content' }}
                        />
                      </Card>
                    </Space>
                  </div>

                  <div
                    style={{
                      flex: 'none',
                      borderTop: `1px solid ${token.colorSplit}`,
                      paddingTop: 10,
                      marginTop: 10,
                      background: token.colorBgContainer,
                      fontSize: 12,
                      color: token.colorTextSecondary,
                    }}
                  >
                    {L.semanticHint}
                  </div>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  )
}
