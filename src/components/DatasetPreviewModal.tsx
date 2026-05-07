import { Button, Empty, Input, Modal, Space, Table, Tabs, Typography, theme } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { DataTableIcon } from './icons/DataTableIcon'

type FieldType = 'Str' | 'Num' | 'Date' | 'Geo'
type FieldRole = 'dimension' | 'measure'

type Field = {
  id: string
  name: string
  physicalName: string
  type: FieldType
  role: FieldRole
  description: string
}

function typePill(type: FieldType) {
  const label = type === 'Str' ? 'Str.' : type
  const fg =
    type === 'Num'
      ? '#16A34A'
      : type === 'Date'
        ? '#9333EA'
        : type === 'Geo'
          ? '#0891B2'
          : '#2563EB'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', color: fg, fontSize: 12, fontWeight: 700, lineHeight: 1.1 }}>
      {label}
    </span>
  )
}

function buildFields(tableName: string): Field[] {
  const base = (tableName || 'subs').toLowerCase()

  if (base.includes('cdr_voice')) {
    return [
      { id: 'd-1', name: 'date', physicalName: 'dt', type: 'Date', role: 'dimension', description: '日期' },
      { id: 'd-2', name: 'msisdn', physicalName: 'msisdn', type: 'Str', role: 'dimension', description: '手机号' },
      { id: 'd-3', name: 'province', physicalName: 'province', type: 'Geo', role: 'dimension', description: '省份' },
      { id: 'd-4', name: 'city', physicalName: 'city', type: 'Geo', role: 'dimension', description: '城市' },
      { id: 'd-5', name: 'operator', physicalName: 'operator', type: 'Str', role: 'dimension', description: '运营商' },
      { id: 'm-1', name: 'call_minutes', physicalName: 'call_minutes', type: 'Num', role: 'measure', description: '通话时长(分钟)' },
      { id: 'm-2', name: 'call_fee', physicalName: 'call_fee', type: 'Num', role: 'measure', description: '通话费用(元)' },
    ]
  }

  if (base.includes('cdr_data')) {
    return [
      { id: 'd-1', name: 'date', physicalName: 'dt', type: 'Date', role: 'dimension', description: '日期' },
      { id: 'd-2', name: 'msisdn', physicalName: 'msisdn', type: 'Str', role: 'dimension', description: '手机号' },
      { id: 'd-3', name: 'province', physicalName: 'province', type: 'Geo', role: 'dimension', description: '省份' },
      { id: 'd-4', name: 'operator', physicalName: 'operator', type: 'Str', role: 'dimension', description: '运营商' },
      { id: 'd-5', name: 'net_type', physicalName: 'net_type', type: 'Str', role: 'dimension', description: '网络制式' },
      { id: 'm-1', name: 'data_mb', physicalName: 'data_mb', type: 'Num', role: 'measure', description: '流量使用(MB)' },
      { id: 'm-2', name: 'data_fee', physicalName: 'data_fee', type: 'Num', role: 'measure', description: '流量费用(元)' },
    ]
  }

  if (base.includes('billing')) {
    return [
      { id: 'd-1', name: 'month', physicalName: 'month', type: 'Date', role: 'dimension', description: '月份' },
      { id: 'd-2', name: 'msisdn', physicalName: 'msisdn', type: 'Str', role: 'dimension', description: '手机号' },
      { id: 'd-3', name: 'plan', physicalName: 'plan', type: 'Str', role: 'dimension', description: '套餐' },
      { id: 'd-4', name: 'operator', physicalName: 'operator', type: 'Str', role: 'dimension', description: '运营商' },
      { id: 'm-1', name: 'arpu', physicalName: 'arpu', type: 'Num', role: 'measure', description: 'ARPU(元)' },
      { id: 'm-2', name: 'mrr', physicalName: 'mrr', type: 'Num', role: 'measure', description: 'MRR(元)' },
    ]
  }

  if (base.includes('network_kpi')) {
    return [
      { id: 'd-1', name: 'date', physicalName: 'dt', type: 'Date', role: 'dimension', description: '日期' },
      { id: 'd-2', name: 'province', physicalName: 'province', type: 'Geo', role: 'dimension', description: '省份' },
      { id: 'd-3', name: 'city', physicalName: 'city', type: 'Geo', role: 'dimension', description: '城市' },
      { id: 'd-4', name: 'net_type', physicalName: 'net_type', type: 'Str', role: 'dimension', description: '网络制式' },
      { id: 'm-1', name: 'dau', physicalName: 'dau', type: 'Num', role: 'measure', description: '日活' },
      { id: 'm-2', name: 'drop_rate', physicalName: 'drop_rate', type: 'Num', role: 'measure', description: '掉线率(%)' },
      { id: 'm-3', name: 'latency_ms', physicalName: 'latency_ms', type: 'Num', role: 'measure', description: '时延(ms)' },
    ]
  }

  return [
    { id: 'd-1', name: 'date', physicalName: 'dt', type: 'Date', role: 'dimension', description: '日期' },
    { id: 'd-2', name: 'msisdn', physicalName: 'msisdn', type: 'Str', role: 'dimension', description: '手机号' },
    { id: 'd-3', name: 'province', physicalName: 'province', type: 'Geo', role: 'dimension', description: '省份' },
    { id: 'd-4', name: 'city', physicalName: 'city', type: 'Geo', role: 'dimension', description: '城市' },
    { id: 'd-5', name: 'operator', physicalName: 'operator', type: 'Str', role: 'dimension', description: '运营商' },
    { id: 'd-6', name: 'plan', physicalName: 'plan', type: 'Str', role: 'dimension', description: '套餐' },
    { id: 'm-1', name: 'arpu', physicalName: 'arpu', type: 'Num', role: 'measure', description: 'ARPU(元)' },
    { id: 'm-2', name: 'churn_rate', physicalName: 'churn_rate', type: 'Num', role: 'measure', description: '流失率(%)' },
  ]
}

function buildRows(tableName: string) {
  const base = (tableName || 'subs').toLowerCase()
  const provinces = ['上海', '浙江', '广东', '江苏', '四川', '湖北']
  const cities = ['上海', '杭州', '广州', '深圳', '南京', '成都', '武汉', '苏州']
  const operators = ['移动', '联通', '电信']
  const plans = ['畅享 129', '畅享 199', '5G 尊享 299', '校园 59', '融合 169']
  const netTypes = ['4G', '5G', 'WiFi']

  return Array.from({ length: 120 }).map((_, i) => {
    const dt = `2026-0${((i % 6) + 1).toString()}-${String(((i % 27) + 1)).padStart(2, '0')}`
    const province = provinces[i % provinces.length]
    const city = cities[i % cities.length]
    const operator = operators[i % operators.length]
    const msisdn = `13${(i % 9) + 1}${String(80000000 + i).slice(0, 8)}`
    const plan = plans[i % plans.length]
    const net_type = netTypes[i % netTypes.length]

    if (base.includes('cdr_voice')) {
      const call_minutes = (i % 85) + 5
      const call_fee = Number((call_minutes * 0.15 + (i % 7) * 0.2).toFixed(2))
      return { dt, msisdn, province, city, operator, call_minutes, call_fee, key: i }
    }

    if (base.includes('cdr_data')) {
      const data_mb = (i % 1800) + 200
      const data_fee = Number((data_mb * 0.002 + (i % 5) * 0.3).toFixed(2))
      return { dt, msisdn, province, operator, net_type, data_mb, data_fee, key: i }
    }

    if (base.includes('billing')) {
      const month = `2026-0${((i % 6) + 1).toString()}-01`
      const arpu = Number((89 + (i % 120) * 0.7).toFixed(2))
      const mrr = Number((arpu * (1 + ((i % 4) * 0.03))).toFixed(2))
      return { month, msisdn, plan, operator, arpu, mrr, key: i }
    }

    if (base.includes('network_kpi')) {
      const dau = 80000 + (i % 28) * 2300
      const drop_rate = Number((0.2 + (i % 7) * 0.05).toFixed(2))
      const latency_ms = 18 + (i % 12) * 3
      return { dt, province, city, net_type, dau, drop_rate, latency_ms, key: i }
    }

    const arpu = Number((99 + (i % 80) * 0.8).toFixed(2))
    const churn_rate = Number((0.8 + (i % 9) * 0.12).toFixed(2))
    return { dt, msisdn, province, city, operator, plan, arpu, churn_rate, key: i }
  })
}

export function DatasetPreviewModal({
  open,
  onClose,
  tables,
  initialActive,
  defaultTab = 'preview',
  zIndex = 1600,
}: {
  open: boolean
  onClose: () => void
  tables: string[]
  initialActive?: string
  defaultTab?: 'preview' | 'fields'
  zIndex?: number
}) {
  const { token } = theme.useToken()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(initialActive ?? '')
  const [tab, setTab] = useState<'preview' | 'fields'>(defaultTab)
  const [refreshTick, setRefreshTick] = useState(0)

  useEffect(() => {
    if (!open) return
    setQuery('')
    const initial = (initialActive ?? '').trim() || (tables?.[0] ?? '')
    setActive(initial)
    setTab(defaultTab)
    setRefreshTick((x) => x + 1)
  }, [defaultTab, initialActive, open])

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (tables ?? []).filter((x) => !q || String(x).toLowerCase().includes(q))
  }, [query, tables])

  const activeName = useMemo(() => {
    const a = active || initialActive || list[0] || ''
    return list.includes(a) ? a : list[0] || ''
  }, [active, initialActive, list])

  const fields = useMemo(() => buildFields(activeName), [activeName])
  const rows = useMemo(() => buildRows(activeName), [activeName, refreshTick])

  const previewColumns = useMemo(() => {
    const sample = rows[0] ?? {}
    const cols = fields.filter((f) => Object.prototype.hasOwnProperty.call(sample, f.name))
    return cols.map((f) => ({
      title: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>{typePill(f.type)}</div>
        </div>
      ),
      dataIndex: f.name,
      key: f.name,
      width: 140,
      ellipsis: true,
      render: (v: any) => (
        <span style={{ color: v === '#REF!' || v === '#DIV/0!' ? token.colorError : token.colorText }}>{String(v ?? '-')}</span>
      ),
    })) as ColumnsType<any>
  }, [fields, rows, token.colorError, token.colorText])

  const fieldColumns = useMemo(() => {
    return [
      { title: '字段名', dataIndex: 'name', key: 'name', width: 180 },
      { title: '物理字段名', dataIndex: 'physicalName', key: 'physicalName', width: 180, render: (v: string) => <Typography.Text code>{v}</Typography.Text> },
      { title: '字段类型', dataIndex: 'type', key: 'type', width: 120, render: (v: FieldType) => typePill(v) },
      { title: '字段描述', dataIndex: 'description', key: 'description' },
    ] as ColumnsType<Field>
  }, [])

  const dimCount = useMemo(() => fields.filter((f) => f.role === 'dimension').length, [fields])
  const meaCount = useMemo(() => fields.filter((f) => f.role === 'measure').length, [fields])

  return (
    <Modal open={open} onCancel={onClose} footer={null} width={980} centered destroyOnHidden title="数据表" zIndex={zIndex}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr',
          border: `1px solid ${token.colorSplit}`,
          borderRadius: 12,
          overflow: 'hidden',
          height: 660,
          background: token.colorBgContainer,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, borderRight: `1px solid ${token.colorSplit}` }}>
          <div style={{ padding: 12 }}>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索数据表"
              prefix={<SearchOutlined />}
            />
          </div>

          <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 12, paddingTop: 0 }}>
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              {list.map((tb) => {
                const on = tb === activeName
                return (
                  <div
                    key={tb}
                    onClick={() => setActive(tb)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 14,
                      border: `1px solid ${token.colorSplit}`,
                      background: on ? token.colorFillSecondary : token.colorBgContainer,
                      cursor: 'pointer',
                      transition: 'border-color 120ms ease, background-color 120ms ease',
                    }}
                    onMouseEnter={(e) => {
                      if (on) return
                      e.currentTarget.style.background = token.colorFillTertiary
                    }}
                    onMouseLeave={(e) => {
                      if (on) return
                      e.currentTarget.style.background = token.colorBgContainer
                    }}
                  >
                    <span style={{ width: 18, height: 18, display: 'grid', placeItems: 'center' }}>
                      <DataTableIcon size={16} color={on ? token.colorPrimary : token.colorTextSecondary} />
                    </span>
                    <div style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tb}</div>
                  </div>
                )
              })}
            </Space>
          </div>
        </div>

        <div style={{ overflow: 'hidden', padding: 12, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {activeName ? (
            <Tabs
              activeKey={tab}
              onChange={(k) => setTab(k as any)}
              style={{ flex: 1, minHeight: 0 }}
              className="fillTabs"
              items={[
                {
                  key: 'preview',
                  label: <Typography.Text style={{ fontWeight: 650 }}>数据预览</Typography.Text>,
                  children: (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
                      <div style={{ flex: 1, minHeight: 0, border: `1px solid ${token.colorSplit}`, borderRadius: 12, overflow: 'hidden' }}>
                        <Table
                          size="middle"
                          pagination={false}
                          className="dsPreviewTable"
                          columns={previewColumns}
                          dataSource={(rows as any).slice(0, 100)}
                          sticky
                          scroll={{ x: 1400 }}
                        />
                      </div>

                      <div style={{ flex: 'none', marginTop: 'auto', borderTop: `1px solid ${token.colorSplit}`, paddingTop: 10, paddingBottom: 2, background: token.colorBgContainer }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, fontSize: 12, color: token.colorTextSecondary }}>
                          <div>
                            总字段数 {fields.length}　<span style={{ color: token.colorPrimary }}>●</span> 维度 <span style={{ color: token.colorPrimary, fontWeight: 750 }}>{dimCount}</span>　<span style={{ color: token.colorPrimary }}>●</span> 度量{' '}
                            <span style={{ color: token.colorPrimary, fontWeight: 750 }}>{meaCount}</span>
                          </div>
                          <Space size={10} align="center">
                            <span style={{ color: token.colorTextSecondary }}>最多预览前100条</span>
                            <Button
                              type="text"
                              size="small"
                              icon={<ReloadOutlined style={{ color: token.colorPrimary }} />}
                              style={{ fontSize: 12, color: token.colorPrimary }}
                              onClick={() => setRefreshTick((x) => x + 1)}
                            >
                              刷新
                            </Button>
                          </Space>
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'fields',
                  label: <Typography.Text style={{ fontWeight: 650 }}>字段详情</Typography.Text>,
                  children: (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
                      <div style={{ flex: 1, minHeight: 0, border: `1px solid ${token.colorSplit}`, borderRadius: 12, overflow: 'auto' }}>
                        <Table size="middle" pagination={false} columns={fieldColumns} dataSource={fields as any} scroll={{ x: 'max-content' }} />
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          ) : (
            <Empty description={null} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </div>
      </div>
    </Modal>
  )
}
