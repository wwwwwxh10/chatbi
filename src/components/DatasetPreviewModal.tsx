import { Button, Drawer, Empty, Input, Space, Table, Tabs, Typography, theme } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { DataTableIcon } from './icons/DataTableIcon'
import { useAppStore } from '../store/appStore'

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

const FIELD_DESCRIPTION_EN: Record<string, string> = {
  '预订日期': 'Reservation date',
  '汽车品牌': 'Manufacturer',
  '车型': 'Model',
  '分公司': 'Branch',
  '车辆状态': 'Vehicle status',
  '订金（KWD）': 'Deposit (KWD)',
  '车辆标识': 'Vehicle ID',
  '年款': 'Model year',
  '库存类型': 'Stock type',
  '订单确认日期': 'Order confirmation date',
  '交付日期': 'Delivery date',
  '询价日期': 'Enquiry date',
  '意向品牌': 'Preferred manufacturer',
  '意向车型': 'Preferred model',
  '询价来源': 'Enquiry source',
  '跟进状态': 'Follow-up status',
  '开票日期': 'Invoice date',
  '配置版本': 'Variant',
  '销售价格（KWD）': 'Selling price (KWD)',
  '利润（KWD）': 'Profit (KWD)',
}

const AAS_COLUMNS = [
  'Vehicle ID', 'Reserved By', 'Name', 'Manufacturer', 'Manufacturer Desc', 'Model Analysis Code', 'Model Code', 'Model Desc', 'Variant Code', 'Variant Desc',
  'Vehicle Desc', 'Colour', 'Colour Desc', 'Model Year', 'VIN', 'Customer Name', 'Mobile No.', 'Total Deposit', 'Reservation Date', 'Reservation Exp. Date',
  'Vehicle Status', 'Vehicle Status Desc', 'Branch', 'Branch Name', 'Stock Type', 'Stock Type Desc', 'Order Confirmation Date', 'Delivery Date', 'Enq. No.', 'Enquiry Progress',
  'Enquiry Progress Desc', 'Invoice (T/F)', 'Shipment Name', 'New/Used', 'Actual date received', 'Delivery Status code', 'Delivery Status code Desc', 'Customer ID', 'Estimated date received', 'Order Invoice Date',
  'Vehicle Adoption Date', 'Order Invoice Account No', 'Account Name', 'Trade-In Value', 'Enq. Type Code', 'Enq. Type Name', 'Vehicle Registration Date', 'Order Number', 'Selling Price', 'Profit',
] as const

const AAS_DATE_FIELDS = new Set(['Reservation Date', 'Reservation Exp. Date', 'Order Confirmation Date', 'Delivery Date', 'Actual date received', 'Estimated date received', 'Order Invoice Date', 'Vehicle Adoption Date', 'Vehicle Registration Date'])
const AAS_NUMBER_FIELDS = new Set(['Vehicle ID', 'Model Year', 'Total Deposit', 'Branch', 'Enq. No.', 'Delivery Status code', 'Customer ID', 'Trade-In Value', 'Order Number', 'Selling Price', 'Profit'])

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
  const base = (tableName || 'vehicle_sales').toLowerCase()

  if (base.includes('aas_sample')) {
    return AAS_COLUMNS.map((name, index) => {
      const type: FieldType = AAS_DATE_FIELDS.has(name) ? 'Date' : AAS_NUMBER_FIELDS.has(name) ? 'Num' : 'Str'
      return { id: `aas-${index}`, name, physicalName: name, type, role: AAS_NUMBER_FIELDS.has(name) ? 'measure' : 'dimension', description: name }
    })
  }

  if (base.includes('reservation')) {
    return [
      { id: 'd-1', name: 'reservation_date', physicalName: 'reservation_date', type: 'Date', role: 'dimension', description: '预订日期' },
      { id: 'd-2', name: 'manufacturer', physicalName: 'manufacturer_desc', type: 'Str', role: 'dimension', description: '汽车品牌' },
      { id: 'd-3', name: 'model', physicalName: 'model_desc', type: 'Str', role: 'dimension', description: '车型' },
      { id: 'd-4', name: 'branch', physicalName: 'branch_name', type: 'Str', role: 'dimension', description: '分公司' },
      { id: 'd-5', name: 'status', physicalName: 'vehicle_status_desc', type: 'Str', role: 'dimension', description: '车辆状态' },
      { id: 'm-1', name: 'deposit_kwd', physicalName: 'total_deposit', type: 'Num', role: 'measure', description: '订金（KWD）' },
    ]
  }

  if (base.includes('inventory')) {
    return [
      { id: 'd-1', name: 'vehicle_id', physicalName: 'vehicle_id', type: 'Str', role: 'dimension', description: '车辆标识' },
      { id: 'd-2', name: 'manufacturer', physicalName: 'manufacturer_desc', type: 'Str', role: 'dimension', description: '汽车品牌' },
      { id: 'd-3', name: 'model', physicalName: 'model_desc', type: 'Str', role: 'dimension', description: '车型' },
      { id: 'd-4', name: 'model_year', physicalName: 'model_year', type: 'Num', role: 'dimension', description: '年款' },
      { id: 'd-5', name: 'branch', physicalName: 'branch_name', type: 'Str', role: 'dimension', description: '分公司' },
      { id: 'd-6', name: 'stock_type', physicalName: 'stock_type_desc', type: 'Str', role: 'dimension', description: '库存类型' },
      { id: 'd-7', name: 'vehicle_status', physicalName: 'vehicle_status_desc', type: 'Str', role: 'dimension', description: '车辆状态' },
    ]
  }

  if (base.includes('delivery')) {
    return [
      { id: 'd-1', name: 'order_confirmation_date', physicalName: 'order_confirmation_date', type: 'Date', role: 'dimension', description: '订单确认日期' },
      { id: 'd-2', name: 'delivery_date', physicalName: 'delivery_date', type: 'Date', role: 'dimension', description: '交付日期' },
      { id: 'd-3', name: 'manufacturer', physicalName: 'manufacturer_desc', type: 'Str', role: 'dimension', description: '汽车品牌' },
      { id: 'd-4', name: 'model', physicalName: 'model_desc', type: 'Str', role: 'dimension', description: '车型' },
      { id: 'd-5', name: 'branch', physicalName: 'branch_name', type: 'Str', role: 'dimension', description: '分公司' },
    ]
  }

  if (base.includes('enquir')) {
    return [
      { id: 'd-1', name: 'enquiry_date', physicalName: 'enquiry_date', type: 'Date', role: 'dimension', description: '询价日期' },
      { id: 'd-2', name: 'manufacturer', physicalName: 'manufacturer_desc', type: 'Str', role: 'dimension', description: '意向品牌' },
      { id: 'd-3', name: 'model', physicalName: 'model_desc', type: 'Str', role: 'dimension', description: '意向车型' },
      { id: 'd-4', name: 'source', physicalName: 'enquiry_source', type: 'Str', role: 'dimension', description: '询价来源' },
      { id: 'd-5', name: 'status', physicalName: 'enquiry_status', type: 'Str', role: 'dimension', description: '跟进状态' },
    ]
  }

  return [
    { id: 'd-1', name: 'invoice_date', physicalName: 'order_invoice_date', type: 'Date', role: 'dimension', description: '开票日期' },
    { id: 'd-2', name: 'manufacturer', physicalName: 'manufacturer_desc', type: 'Str', role: 'dimension', description: '汽车品牌' },
    { id: 'd-3', name: 'model', physicalName: 'model_desc', type: 'Str', role: 'dimension', description: '车型' },
    { id: 'd-4', name: 'variant', physicalName: 'variant_desc', type: 'Str', role: 'dimension', description: '配置版本' },
    { id: 'd-5', name: 'model_year', physicalName: 'model_year', type: 'Num', role: 'dimension', description: '年款' },
    { id: 'd-6', name: 'branch', physicalName: 'branch_name', type: 'Str', role: 'dimension', description: '分公司' },
    { id: 'm-1', name: 'selling_price_kwd', physicalName: 'selling_price', type: 'Num', role: 'measure', description: '销售价格（KWD）' },
    { id: 'm-2', name: 'profit_kwd', physicalName: 'profit', type: 'Num', role: 'measure', description: '利润（KWD）' },
  ]
}

function buildRows(tableName: string) {
  const base = (tableName || 'vehicle_sales').toLowerCase()
  const manufacturers = ['BMW', 'Land Rover', 'Geely', 'MINI', 'Rolls-Royce']
  const models = ['5 Series', 'Defender', 'Monjaro', 'Countryman', 'Cullinan']
  const branches = ['Al-Rai', 'Shuwaikh', 'Ahmadi', 'Jahra']

  return Array.from({ length: 120 }).map((_, i) => {
    const date = `2025-0${(i % 3) + 1}-${String((i % 27) + 1).padStart(2, '0')}`
    const manufacturer = manufacturers[i % manufacturers.length]
    const model = models[i % models.length]
    const branch = branches[i % branches.length]
    if (base.includes('aas_sample')) {
      const values: Record<string, string | number | boolean> = {
        'Vehicle ID': 57543 + i, 'Reserved By': `user-${9304 + (i % 8)}`, Name: 'Sales Consultant', Manufacturer: manufacturer === 'Land Rover' ? 'LANDROV' : manufacturer.toUpperCase(),
        'Manufacturer Desc': manufacturer, 'Model Analysis Code': model, 'Model Code': model.toUpperCase(), 'Model Desc': model, 'Variant Code': `VAR-${100 + i}`,
        'Variant Desc': `${model} ${['Premium', 'Sport', 'Luxury'][i % 3]}`, 'Vehicle Desc': `${model} ${['Premium', 'Sport', 'Luxury'][i % 3]}`, Colour: ['1CD', '1AZ', '490'][i % 3],
        'Colour Desc': ['Grasmere Green', 'Phoenix Orange', 'Mandarin II Solid'][i % 3], 'Model Year': 2024 + (i % 2), VIN: `***********${String(9606 + i).slice(-4)}`,
        'Customer Name': `Customer ${String(i + 1).padStart(4, '0')}`, 'Mobile No.': '******90', 'Total Deposit': i % 3 ? 500 + (i % 8) * 250 : '',
        'Reservation Date': date, 'Reservation Exp. Date': i % 4 ? '2025-04-15' : '', 'Vehicle Status': ['A', 'X', 'I'][i % 3], 'Vehicle Status Desc': ['Adopted', 'Closed', 'Invoiced'][i % 3],
        Branch: 1011 + (i % 4), 'Branch Name': branch, 'Stock Type': ['RETAIL', 'HIDDEN'][i % 2], 'Stock Type Desc': i % 2 ? 'Hidden stock' : 'Retail sales stock',
        'Order Confirmation Date': i % 3 ? date : '', 'Delivery Date': i % 3 ? date : '', 'Enq. No.': i % 3 ? 34000 + i : '', 'Enquiry Progress': i % 3 ? 'Inv' : '',
        'Enquiry Progress Desc': i % 3 ? 'Invoiced' : '', 'Invoice (T/F)': i % 3 !== 0, 'Shipment Name': `SHIPMENT-${100 + i}`, 'New/Used': 'N',
        'Actual date received': '2025-01-15', 'Delivery Status code': i % 5, 'Delivery Status code Desc': ['Not arranged', 'Planned', 'Confirmed'][i % 3], 'Customer ID': i % 3 ? 21000 + i : '',
        'Estimated date received': '2025-01-15', 'Order Invoice Date': i % 3 ? date : '', 'Vehicle Adoption Date': '2025-01-15', 'Order Invoice Account No': i % 3 ? `B${String(i + 2).padStart(7, '0')}` : '',
        'Account Name': i % 3 ? 'Finance Account' : '', 'Trade-In Value': i % 4 ? 0 : 8600, 'Enq. Type Code': i % 3 ? 'RETAIL' : '', 'Enq. Type Name': i % 3 ? 'Retail sale' : '',
        'Vehicle Registration Date': i % 3 ? date : '', 'Order Number': i % 3 ? 20000 + i : '', 'Selling Price': 16500 + (i % 18) * 725, Profit: Number((4892.489 - (i % 7) * 820.35).toFixed(3)),
      }
      return { ...Object.fromEntries(AAS_COLUMNS.map((column) => [column, values[column] ?? ''])), key: i }
    }
    if (base.includes('reservation')) return { reservation_date: date, manufacturer, model, branch, status: i % 4 === 0 ? 'Expired' : 'Active', deposit_kwd: 500 + (i % 8) * 250, key: i }
    if (base.includes('inventory')) return { vehicle_id: `VEH-${String(10001 + i)}`, manufacturer, model, model_year: 2024 + (i % 2), branch, stock_type: i % 5 ? 'Available' : 'Reserved', vehicle_status: 'In Stock', key: i }
    if (base.includes('delivery')) return { order_confirmation_date: date, delivery_date: `2025-0${(i % 3) + 2}-${String((i % 27) + 1).padStart(2, '0')}`, manufacturer, model, branch, key: i }
    if (base.includes('enquir')) return { enquiry_date: date, manufacturer, model, source: ['Showroom', 'Website', 'Call Center'][i % 3], status: ['Open', 'Follow-up', 'Converted'][i % 3], key: i }
    return { invoice_date: date, manufacturer, model, variant: ['Premium', 'Sport', 'Luxury'][i % 3], model_year: 2024 + (i % 2), branch, selling_price_kwd: 14500 + (i % 18) * 725, profit_kwd: 1200 + (i % 11) * 260, key: i }
  })
}

export function DatasetPreviewModal({
  open,
  onClose,
  tables,
  initialActive,
  defaultTab = 'preview',
  zIndex = 1600,
  hideTableList = false,
  previewRows,
}: {
  open: boolean
  onClose: () => void
  tables: string[]
  initialActive?: string
  defaultTab?: 'preview' | 'fields'
  zIndex?: number
  hideTableList?: boolean
  previewRows?: Array<Record<string, unknown>>
}) {
  const { token } = theme.useToken()
  const locale = useAppStore((state) => state.locale)
  const en = locale === 'en-US'
  const [drawerHeight, setDrawerHeight] = useState(680)

  useEffect(() => {
    if (!open) return
    const compute = () => {
      const desired = window.innerHeight - 32
      setDrawerHeight(Math.max(560, Math.min(820, desired)))
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [open])
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

  const fields = useMemo(() => {
    if (!previewRows?.length) return buildFields(activeName)
    return Object.keys(previewRows[0]).map((name, index) => {
      const values = previewRows.map((row) => row[name]).filter((value) => value != null && value !== '')
      const numeric = values.length > 0 && values.every((value) => typeof value === 'number' || !Number.isNaN(Number(value)))
      const dateLike = !numeric && values.length > 0 && values.every((value) => /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(String(value)))
      const type: FieldType = numeric ? 'Num' : dateLike ? 'Date' : 'Str'
      return { id: `uploaded-${index}`, name, physicalName: name, type, role: numeric ? 'measure' : 'dimension', description: name } as Field
    })
  }, [activeName, previewRows])
  const rows = useMemo(() => previewRows?.length ? previewRows : buildRows(activeName), [activeName, previewRows, refreshTick])

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
      { title: en ? 'Field' : '字段名', dataIndex: 'name', key: 'name', width: '27%' },
      {
        title: en ? 'Physical field' : '物理字段名',
        dataIndex: 'physicalName',
        key: 'physicalName',
        width: '31%',
        render: (v: string) => <Typography.Text code>{v}</Typography.Text>,
      },
      { title: en ? 'Type' : '字段类型', dataIndex: 'type', key: 'type', width: '14%', render: (v: FieldType) => typePill(v) },
      {
        title: en ? 'Description' : '字段描述',
        dataIndex: 'description',
        key: 'description',
        width: '28%',
        render: (value: string) => en ? FIELD_DESCRIPTION_EN[value] ?? value : value,
      },
    ] as ColumnsType<Field>
  }, [en])

  const dimCount = useMemo(() => fields.filter((f) => f.role === 'dimension').length, [fields])
  const meaCount = useMemo(() => fields.filter((f) => f.role === 'measure').length, [fields])

  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="bottom"
      height={drawerHeight}
      title={en ? 'Data table' : '数据表'}
      zIndex={zIndex}
      destroyOnClose
      mask
      maskClosable
      keyboard
      getContainer={() => document.body}
      styles={{ mask: { background: 'rgba(0,0,0,0.28)' }, body: { padding: 12, height: '100%', minHeight: 0 } }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: hideTableList ? '1fr' : '300px 1fr',
          border: `1px solid ${token.colorSplit}`,
          borderRadius: 12,
          overflow: 'hidden',
          height: '100%',
          minHeight: 0,
          background: token.colorBgContainer,
        }}
      >
        {!hideTableList ? <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, borderRight: `1px solid ${token.colorSplit}` }}>
          <div style={{ padding: 12 }}>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={en ? 'Search' : '搜索'}
              prefix={<SearchOutlined />}
              allowClear
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
        </div> : null}

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
                  label: <Typography.Text style={{ fontWeight: 650 }}>{en ? 'Data preview' : '数据预览'}</Typography.Text>,
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
                            {en ? 'Fields' : '总字段数'} {fields.length}　<span style={{ color: token.colorPrimary }}>●</span> {en ? 'Dimensions' : '维度'} <span style={{ color: token.colorPrimary, fontWeight: 750 }}>{dimCount}</span>　<span style={{ color: token.colorPrimary }}>●</span> {en ? 'Measures' : '度量'}{' '}
                            <span style={{ color: token.colorPrimary, fontWeight: 750 }}>{meaCount}</span>
                          </div>
                          <Space size={10} align="center">
                            <span style={{ color: token.colorTextSecondary }}>{en ? 'Previewing up to 100 rows' : '最多预览前100条'}</span>
                            <Button
                              type="text"
                              size="small"
                              icon={<ReloadOutlined style={{ color: token.colorPrimary }} />}
                              style={{ fontSize: 12, color: token.colorPrimary }}
                              onClick={() => setRefreshTick((x) => x + 1)}
                            >
                              {en ? 'Refresh' : '刷新'}
                            </Button>
                          </Space>
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'fields',
                  label: <Typography.Text style={{ fontWeight: 650 }}>{en ? 'Field details' : '字段详情'}</Typography.Text>,
                  children: (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
                      <div style={{ flex: 1, minHeight: 0, border: `1px solid ${token.colorSplit}`, borderRadius: 12, overflow: 'hidden' }}>
                        <Table className="dsPreviewTable dsFieldTable" size="middle" pagination={false} columns={fieldColumns} dataSource={fields as any} sticky tableLayout="fixed" scroll={{ y: Math.max(300, drawerHeight - 250) }} />
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
    </Drawer>
  )
}
