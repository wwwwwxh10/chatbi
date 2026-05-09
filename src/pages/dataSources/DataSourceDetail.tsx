import { Button, Card, Empty, Input, List, Space, Switch, Table, Tabs, Typography, theme } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
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

function buildSeed(_ds: DataSource, lang: 'zh' | 'en'): Dataset[] {
  const provinces = lang === 'en' ? ['Shanghai', 'Zhejiang', 'Guangdong', 'Jiangsu', 'Sichuan', 'Hubei'] : ['上海', '浙江', '广东', '江苏', '四川', '湖北']
  const cities = lang === 'en' ? ['Shanghai', 'Hangzhou', 'Guangzhou', 'Shenzhen', 'Nanjing', 'Chengdu', 'Wuhan', 'Suzhou'] : ['上海', '杭州', '广州', '深圳', '南京', '成都', '武汉', '苏州']
  const operators = lang === 'en' ? ['CMCC', 'CUCC', 'CTCC'] : ['移动', '联通', '电信']
  const plans = lang === 'en' ? ['Plan 129', 'Plan 199', '5G 299', 'Campus 59', 'Bundle 169'] : ['畅享 129', '畅享 199', '5G 尊享 299', '校园 59', '融合 169']
  const netTypes = ['4G', '5G']

  const mkRows = (kind: 'subs' | 'cdr_voice' | 'cdr_data' | 'billing_monthly' | 'network_kpi_daily'): Array<Record<string, string | number | null>> => {
    return Array.from({ length: 120 }).map((_, i) => {
      const dt = `2026-0${String((i % 6) + 1)}-${String((i % 27) + 1).padStart(2, '0')}`
      const month = `2026-0${String((i % 6) + 1)}-01`
      const province = provinces[i % provinces.length]
      const city = cities[i % cities.length]
      const operator = operators[i % operators.length]
      const msisdn = `13${(i % 9) + 1}${String(80000000 + i).slice(0, 8)}`
      const plan = plans[i % plans.length]
      const net_type = netTypes[i % netTypes.length]

      if (kind === 'cdr_voice') {
        const call_minutes = (i % 85) + 5
        const call_fee = Number((call_minutes * 0.15 + (i % 7) * 0.2).toFixed(2))
        const call_cnt = (i % 23) + 1
        const row: Record<string, string | number | null> = { dt, msisdn, province, city, operator, call_cnt, call_minutes, call_fee }
        return row
      }

      if (kind === 'cdr_data') {
        const data_mb = (i % 1800) + 200
        const data_fee = Number((data_mb * 0.002 + (i % 5) * 0.3).toFixed(2))
        const sessions = (i % 60) + 10
        const row: Record<string, string | number | null> = { dt, msisdn, province, city, operator, net_type, data_mb, data_fee, sessions }
        return row
      }

      if (kind === 'billing_monthly') {
        const arpu = Number((89 + (i % 120) * 0.7).toFixed(2))
        const mrr = Number((arpu * (1 + ((i % 4) * 0.03))).toFixed(2))
        const overage_fee = Number(((i % 8) * 3.5).toFixed(2))
        const row: Record<string, string | number | null> = { month, msisdn, operator, plan, arpu, mrr, overage_fee }
        return row
      }

      if (kind === 'network_kpi_daily') {
        const dau = 80000 + (i % 28) * 2300
        const drop_rate = Number((0.2 + (i % 7) * 0.05).toFixed(2))
        const latency_ms = 18 + (i % 12) * 3
        const cqi = Number((8.5 + (i % 8) * 0.3).toFixed(1))
        const row: Record<string, string | number | null> = { dt, province, city, net_type, dau, drop_rate, latency_ms, cqi }
        return row
      }

      const arpu = Number((99 + (i % 80) * 0.8).toFixed(2))
      const churn_rate = Number((0.8 + (i % 9) * 0.12).toFixed(2))
      const tenure_months = (i % 72) + 1
      const row: Record<string, string | number | null> = { dt, msisdn, province, city, operator, plan, arpu, churn_rate, tenure_months }
      return row
    })
  }

  const mkFields = (kind: Dataset['name']): Field[] => {
    if (kind === 'cdr_voice') {
      return [
        { id: 'd-1', displayName: lang === 'en' ? 'Date' : '日期', physicalName: 'dt', type: 'Date', role: 'dimension', description: lang === 'en' ? 'Date' : '日期', enabled: true },
        { id: 'd-2', displayName: lang === 'en' ? 'MSISDN' : '手机号', physicalName: 'msisdn', type: 'Str', role: 'dimension', description: lang === 'en' ? 'Phone number' : '号码', enabled: true },
        { id: 'd-3', displayName: lang === 'en' ? 'Province' : '省份', physicalName: 'province', type: 'Geo', role: 'dimension', description: lang === 'en' ? 'Province' : '省份', enabled: true },
        { id: 'd-4', displayName: lang === 'en' ? 'City' : '城市', physicalName: 'city', type: 'Geo', role: 'dimension', description: lang === 'en' ? 'City' : '城市', enabled: true },
        { id: 'd-5', displayName: lang === 'en' ? 'Operator' : '运营商', physicalName: 'operator', type: 'Str', role: 'dimension', description: lang === 'en' ? 'Operator' : '运营商', enabled: true },
        { id: 'm-1', displayName: lang === 'en' ? 'Call Count' : '通话次数', physicalName: 'call_cnt', type: 'Num', role: 'measure', description: lang === 'en' ? 'Call count' : '通话次数', enabled: true },
        { id: 'm-2', displayName: lang === 'en' ? 'Minutes' : '通话分钟', physicalName: 'call_minutes', type: 'Num', role: 'measure', description: lang === 'en' ? 'Call minutes' : '通话时长(分钟)', enabled: true },
        { id: 'm-3', displayName: lang === 'en' ? 'Call Fee' : '通话费用', physicalName: 'call_fee', type: 'Num', role: 'measure', description: lang === 'en' ? 'Call fee' : '通话费用(元)', enabled: true },
      ]
    }

    if (kind === 'cdr_data') {
      return [
        { id: 'd-1', displayName: lang === 'en' ? 'Date' : '日期', physicalName: 'dt', type: 'Date', role: 'dimension', description: lang === 'en' ? 'Date' : '日期', enabled: true },
        { id: 'd-2', displayName: lang === 'en' ? 'MSISDN' : '手机号', physicalName: 'msisdn', type: 'Str', role: 'dimension', description: lang === 'en' ? 'Phone number' : '号码', enabled: true },
        { id: 'd-3', displayName: lang === 'en' ? 'Province' : '省份', physicalName: 'province', type: 'Geo', role: 'dimension', description: lang === 'en' ? 'Province' : '省份', enabled: true },
        { id: 'd-4', displayName: lang === 'en' ? 'City' : '城市', physicalName: 'city', type: 'Geo', role: 'dimension', description: lang === 'en' ? 'City' : '城市', enabled: true },
        { id: 'd-5', displayName: lang === 'en' ? 'Operator' : '运营商', physicalName: 'operator', type: 'Str', role: 'dimension', description: lang === 'en' ? 'Operator' : '运营商', enabled: true },
        { id: 'd-6', displayName: lang === 'en' ? 'Net Type' : '网络制式', physicalName: 'net_type', type: 'Str', role: 'dimension', description: lang === 'en' ? 'Network type' : '网络制式', enabled: true },
        { id: 'm-1', displayName: lang === 'en' ? 'Data (MB)' : '流量(MB)', physicalName: 'data_mb', type: 'Num', role: 'measure', description: lang === 'en' ? 'Data usage in MB' : '流量使用(MB)', enabled: true },
        { id: 'm-2', displayName: lang === 'en' ? 'Data Fee' : '流量费用', physicalName: 'data_fee', type: 'Num', role: 'measure', description: lang === 'en' ? 'Data fee' : '流量费用(元)', enabled: true },
        { id: 'm-3', displayName: lang === 'en' ? 'Sessions' : '会话数', physicalName: 'sessions', type: 'Num', role: 'measure', description: lang === 'en' ? 'Data sessions' : '会话数', enabled: true },
      ]
    }

    if (kind === 'billing_monthly') {
      return [
        { id: 'd-1', displayName: lang === 'en' ? 'Month' : '月份', physicalName: 'month', type: 'Date', role: 'dimension', description: lang === 'en' ? 'Month' : '月份', enabled: true },
        { id: 'd-2', displayName: lang === 'en' ? 'MSISDN' : '手机号', physicalName: 'msisdn', type: 'Str', role: 'dimension', description: lang === 'en' ? 'Phone number' : '号码', enabled: true },
        { id: 'd-3', displayName: lang === 'en' ? 'Operator' : '运营商', physicalName: 'operator', type: 'Str', role: 'dimension', description: lang === 'en' ? 'Operator' : '运营商', enabled: true },
        { id: 'd-4', displayName: lang === 'en' ? 'Plan' : '套餐', physicalName: 'plan', type: 'Str', role: 'dimension', description: lang === 'en' ? 'Plan' : '套餐', enabled: true },
        { id: 'm-1', displayName: 'ARPU', physicalName: 'arpu', type: 'Num', role: 'measure', description: lang === 'en' ? 'ARPU' : 'ARPU(元)', enabled: true },
        { id: 'm-2', displayName: 'MRR', physicalName: 'mrr', type: 'Num', role: 'measure', description: lang === 'en' ? 'MRR' : 'MRR(元)', enabled: true },
        { id: 'm-3', displayName: lang === 'en' ? 'Overage Fee' : '超套费用', physicalName: 'overage_fee', type: 'Num', role: 'measure', description: lang === 'en' ? 'Overage fee' : '超套费用(元)', enabled: true },
      ]
    }

    if (kind === 'network_kpi_daily') {
      return [
        { id: 'd-1', displayName: lang === 'en' ? 'Date' : '日期', physicalName: 'dt', type: 'Date', role: 'dimension', description: lang === 'en' ? 'Date' : '日期', enabled: true },
        { id: 'd-2', displayName: lang === 'en' ? 'Province' : '省份', physicalName: 'province', type: 'Geo', role: 'dimension', description: lang === 'en' ? 'Province' : '省份', enabled: true },
        { id: 'd-3', displayName: lang === 'en' ? 'City' : '城市', physicalName: 'city', type: 'Geo', role: 'dimension', description: lang === 'en' ? 'City' : '城市', enabled: true },
        { id: 'd-4', displayName: lang === 'en' ? 'Net Type' : '网络制式', physicalName: 'net_type', type: 'Str', role: 'dimension', description: lang === 'en' ? 'Network type' : '网络制式', enabled: true },
        { id: 'm-1', displayName: 'DAU', physicalName: 'dau', type: 'Num', role: 'measure', description: lang === 'en' ? 'Daily active users' : '日活', enabled: true },
        { id: 'm-2', displayName: lang === 'en' ? 'Drop Rate' : '掉线率', physicalName: 'drop_rate', type: 'Num', role: 'measure', description: lang === 'en' ? 'Drop rate (%)' : '掉线率(%)', enabled: true },
        { id: 'm-3', displayName: lang === 'en' ? 'Latency' : '时延', physicalName: 'latency_ms', type: 'Num', role: 'measure', description: lang === 'en' ? 'Latency (ms)' : '时延(ms)', enabled: true },
        { id: 'm-4', displayName: 'CQI', physicalName: 'cqi', type: 'Num', role: 'measure', description: lang === 'en' ? 'Channel quality index' : '信道质量(CQI)', enabled: true },
      ]
    }

    return [
      { id: 'd-1', displayName: lang === 'en' ? 'Date' : '日期', physicalName: 'dt', type: 'Date', role: 'dimension', description: lang === 'en' ? 'Date' : '日期', enabled: true },
      { id: 'd-2', displayName: lang === 'en' ? 'MSISDN' : '手机号', physicalName: 'msisdn', type: 'Str', role: 'dimension', description: lang === 'en' ? 'Phone number' : '号码', enabled: true },
      { id: 'd-3', displayName: lang === 'en' ? 'Province' : '省份', physicalName: 'province', type: 'Geo', role: 'dimension', description: lang === 'en' ? 'Province' : '省份', enabled: true },
      { id: 'd-4', displayName: lang === 'en' ? 'City' : '城市', physicalName: 'city', type: 'Geo', role: 'dimension', description: lang === 'en' ? 'City' : '城市', enabled: true },
      { id: 'd-5', displayName: lang === 'en' ? 'Operator' : '运营商', physicalName: 'operator', type: 'Str', role: 'dimension', description: lang === 'en' ? 'Operator' : '运营商', enabled: true },
      { id: 'd-6', displayName: lang === 'en' ? 'Plan' : '套餐', physicalName: 'plan', type: 'Str', role: 'dimension', description: lang === 'en' ? 'Plan' : '套餐', enabled: true },
      { id: 'm-1', displayName: 'ARPU', physicalName: 'arpu', type: 'Num', role: 'measure', description: lang === 'en' ? 'ARPU' : 'ARPU(元)', enabled: true },
      { id: 'm-2', displayName: lang === 'en' ? 'Churn Rate' : '流失率', physicalName: 'churn_rate', type: 'Num', role: 'measure', description: lang === 'en' ? 'Churn rate (%)' : '流失率(%)', enabled: true },
      { id: 'm-3', displayName: lang === 'en' ? 'Tenure' : '在网月龄', physicalName: 'tenure_months', type: 'Num', role: 'measure', description: lang === 'en' ? 'Tenure (months)' : '在网月龄(月)', enabled: true },
    ]
  }

  const names: Dataset['name'][] = ['subs', 'cdr_voice', 'cdr_data', 'billing_monthly', 'network_kpi_daily']
  return names.map((name) => ({ name, fields: mkFields(name), previewRows: mkRows(name as any) }))
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

  useEffect(() => {
    setActiveTable('')
    setDatasets(buildSeed(dataSource, lang))
    setTabKey('preview')
  }, [dataSource.id, lang])


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

  if (!current) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={null} />

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
                  <div style={{ flex: 1, minHeight: 0, border: `1px solid ${token.colorSplit}`, borderRadius: 12, overflow: 'hidden' }}>
                    {previewColumns.length ? (
                      <Table
                        size="middle"
                        sticky
                        scroll={{ x: 1400 }}
                        pagination={false}
                        className="dsPreviewTable"
                        columns={previewColumns}
                        dataSource={(current.previewRows ?? []).slice(0, 100).map((r, i) => ({ ...r, key: i }))}
                      />
                    ) : (
                      <div style={{ height: '100%', display: 'grid', placeItems: 'center' }}>
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={null} />
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
