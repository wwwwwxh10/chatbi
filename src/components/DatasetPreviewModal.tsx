import { Button, Empty, Input, Modal, Space, Table, Tabs, Typography, theme } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useRef, useState } from 'react'
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
  const base = tableName || 'orders'
  const dim: Field[] = [
    { id: 'd-1', name: 'date', physicalName: 'COL_2', type: 'Date', role: 'dimension', description: '日期' },
    { id: 'd-2', name: base === 'users' ? 'country' : 'city', physicalName: 'COL_3', type: 'Geo', role: 'dimension', description: '地域' },
    { id: 'd-3', name: base === 'users' ? 'user_id' : 'order_id', physicalName: 'COL_5', type: 'Str', role: 'dimension', description: 'ID' },
  ]
  const mea: Field[] = [
    { id: 'm-1', name: base === 'events' ? 'cnt' : 'amount', physicalName: 'COL_15', type: 'Num', role: 'measure', description: '数值' },
    { id: 'm-2', name: base === 'events' ? 'uv' : 'qty', physicalName: 'COL_16', type: 'Num', role: 'measure', description: '辅助指标' },
  ]
  return [...dim, ...mea]
}

function buildRows(tableName: string) {
  const base = tableName || 'orders'
  return Array.from({ length: 120 }).map((_, i) => ({
    date: `2025-0${(i % 9) + 1}-01`,
    city: i % 2 === 0 ? '上海' : '杭州',
    country: i % 2 === 0 ? 'CN' : 'US',
    order_id: `O${1000 + i}`,
    user_id: `U${1000 + i}`,
    amount: Number(((i + 3) * 137.42).toFixed(2)),
    qty: i % 7,
    cnt: (i + 1) * 3,
    uv: (i + 1) * 2,
    key: i,
  }))
    .map((r) => {
      if (base === 'users') return { date: r.date, country: r.country, user_id: r.user_id, qty: r.qty, key: r.key }
      if (base === 'events') return { date: r.date, city: r.city, cnt: r.cnt, uv: r.uv, key: r.key }
      return { date: r.date, city: r.city, order_id: r.order_id, amount: r.amount, qty: r.qty, key: r.key }
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
  const previewTableWrapRef = useRef<HTMLDivElement | null>(null)
  const [previewScrollY, setPreviewScrollY] = useState(320)

  useEffect(() => {
    if (!open) return
    setQuery('')
    const initial = (initialActive ?? '').trim() || (tables?.[0] ?? '')
    setActive(initial)
    setTab(defaultTab)
    setRefreshTick((x) => x + 1)
  }, [defaultTab, initialActive, open])

  useEffect(() => {
    const el = previewTableWrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const h = el.getBoundingClientRect().height
      setPreviewScrollY(Math.max(200, Math.floor(h)))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

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
  const previewY = useMemo(() => Math.max(240, previewScrollY - 12), [previewScrollY])

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
                      <div ref={previewTableWrapRef} style={{ flex: 1, minHeight: 0, border: `1px solid ${token.colorSplit}`, borderRadius: 12, overflow: 'hidden' }}>
                        <Table
                          size="middle"
                          pagination={false}
                          className="dsPreviewTable"
                          columns={previewColumns}
                          dataSource={(rows as any).slice(0, 100)}
                          sticky
                          scroll={{ x: 1400, y: previewY }}
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
