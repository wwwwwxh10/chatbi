import {
  Button,
  Card,
  Checkbox,
  Col,
  Drawer,
  Dropdown,
  Empty,
  Form,
  Grid,
  Input,
  InputNumber,
  Modal,
  Pagination,
  Popover,
  Radio,
  Row,
  Select,
  Select as AntSelect,
  Space,
  Steps,
  message,
  Typography,
  theme,
} from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageIntro } from '../components/PageIntro'
import { DataSourceTypeIcon } from '../components/DataSourceTypeIcon'
import { nowId, nowText } from './dataSources/model'
import type { DataSource, DataSourceType } from './dataSources/model'
import {
  CheckCircleFilled,
  CloseCircleFilled,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
  MinusCircleFilled,
  PlusOutlined,
  SearchOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { DataTableIcon } from '../components/icons/DataTableIcon'
import { useNavigate, useParams } from 'react-router-dom'
import { useDataSourcesStore } from '../store/dataSourcesStore'
import { DataSourceDetail } from './dataSources/DataSourceDetail'
import { UploadPanel } from '../components/UploadPanel'
import { useAppStore } from '../store/appStore'
import { DatabaseDuotoneIcon } from '../components/icons/DatabaseDuotoneIcon'
import { FileDuotoneIcon } from '../components/icons/FileDuotoneIcon'
import type { DataAccessMode, ExtractFrequency, ExtractMode } from './dataSources/model'
import { useDashboardsStore } from '../store/dashboardsStore'

function statusTag(s: DataSource['status'], t: (k: string) => string) {
  if (s === 'unknown') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(148,163,184,0.95)', fontSize: 12 }}>
        <MinusCircleFilled />
        <span>{t('dataSources.status.unknown')}</span>
      </span>
    )
  }
  if (s === 'ok') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#22C55E', fontSize: 12 }}>
        <CheckCircleFilled />
        <span>{t('dataSources.status.ok')}</span>
      </span>
    )
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#F97316', fontSize: 12 }}>
      <CloseCircleFilled />
      <span>{t('dataSources.status.error')}</span>
    </span>
  )
}

export default function DataSourcesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()

  const themeMode = useAppStore((s) => s.themeMode)

  const { token } = theme.useToken()
  const isDark = themeMode === 'dark'
  const screens = Grid.useBreakpoint()
  const WHITELIST =
    '47.101.108.0/24,101.132.48.0/24,47.101.107.0/24,139.224.92.0/24,139.224.4.0/24,106.15.146.0/24,106.15.145.0/24,106.15.143.0/24,106.15.14.0/24,106.15.13.0/24,100.104.0.0/16,139.224.19.222,47.102.111.163'
  const items = useDataSourcesStore((s) => s.items)
  const addItem = useDataSourcesStore((s) => s.addItem)
  const updateItem = useDataSourcesStore((s) => s.updateItem)
  const removeItem = useDataSourcesStore((s) => s.removeItem)
  const dashboards = useDashboardsStore((s) => s.items)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<DataSourceType | 'all'>('all')
  const [page, setPage] = useState(1)

  const [accessHelpOpen, setAccessHelpOpen] = useState(false)

  const [detailDrawerHeight, setDetailDrawerHeight] = useState(560)
  const current = useMemo(() => (id ? items.find((x) => x.id === id) : null), [id, items])

  useEffect(() => {
    if (!id) return
    const compute = () => {
      const desired = window.innerHeight - 56
      setDetailDrawerHeight(Math.max(480, Math.min(720, desired)))
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [id])

  const [editTarget, setEditTarget] = useState<DataSource | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DataSource | null>(null)

  const [dbWizardOpen, setDbWizardOpen] = useState(false)
  const [dbWizardStep, setDbWizardStep] = useState(0)
  const [dbSelectedType, setDbSelectedType] = useState<DataSourceType | null>(null)
  const [dbTypeSearch, setDbTypeSearch] = useState('')
  const [dbWizardMode, setDbWizardMode] = useState<'create' | 'edit'>('create')
  const [dbSelectedDatasets, setDbSelectedDatasets] = useState<string[]>([])
  const [dbDatasetSearch, setDbDatasetSearch] = useState('')

  const [fileOpen, setFileOpen] = useState(false)
  const [fileWizardMode, setFileWizardMode] = useState<'create' | 'edit'>('create')
  const [fileSelectedDatasets, setFileSelectedDatasets] = useState<string[]>([])
  const [localFileName, setLocalFileName] = useState<string>('')

  const [cardMenuOpenId, setCardMenuOpenId] = useState<string | null>(null)
  const closeCardMenuTimerRef = useRef<number | null>(null)

  const [dbForm] = Form.useForm<{
    name: string
    dbVersion?: string
    host: string
    port: number
    database: string
    username: string
    password?: string
    accessMode?: DataAccessMode
    extractMode?: ExtractMode
    extractFrequency?: ExtractFrequency
  }>()

  const [fileForm] = Form.useForm<{
    fileList?: { originFileObj?: File }[]
  }>()

  const dbDatasetOptions = useMemo(() => ['orders', 'order_items', 'users', 'events', 'products', 'sessions'], [])
  const fileDatasetOptions = useMemo(
    () => ['Sheet1', 'Sheet2', 'Sheet3', 'Sheet4', 'Sheet5', 'Sheet6', 'Sheet7', 'Sheet8', 'Sheet9', 'Sheet10'],
    [],
  )

  const deleteLinkedDashboards = useMemo(() => {
    if (!deleteTarget) return []
    const n = Math.max(0, Number(deleteTarget.datasetSelected ?? 0) || 0)
    if (n === 0) return []
    const tables = deleteTarget.type === 'file' ? fileDatasetOptions.slice(0, n) : dbDatasetOptions.slice(0, n)
    if (!tables.length) return []
    const s = new Set(tables)
    return dashboards.filter((d) => d.tables.some((x) => s.has(x))).map((d) => d.title)
  }, [dashboards, dbDatasetOptions, deleteTarget, fileDatasetOptions])

  const typeCatalogAll = useMemo(
    () => [
      { key: 'file' as const, label: '本地文件', icon: <DataSourceTypeIcon type="file" /> },
      { key: 'mysql' as const, label: 'MySQL', icon: <DataSourceTypeIcon type="mysql" /> },
      { key: 'oracle' as const, label: 'Oracle', icon: <DataSourceTypeIcon type="oracle" /> },
      { key: 'postgres' as const, label: 'PostgreSQL', icon: <DataSourceTypeIcon type="postgres" /> },
      { key: 'hive' as const, label: 'Hive', icon: <DataSourceTypeIcon type="hive" /> },
      { key: 'teradata' as const, label: 'Teradata', icon: <DataSourceTypeIcon type="teradata" /> },
      { key: 'iceberg' as const, label: 'Iceberg', icon: <DataSourceTypeIcon type="iceberg" /> },
      { key: 'clickhouse' as const, label: 'ClickHouse', icon: <DataSourceTypeIcon type="clickhouse" /> },
      { key: 'doris' as const, label: 'Apache Doris', icon: <DataSourceTypeIcon type="doris" /> },
      { key: 'starrocks' as const, label: 'StarRocks', icon: <DataSourceTypeIcon type="starrocks" /> },
    ],
    [],
  )

  const dbTypeCatalogAll = useMemo(() => typeCatalogAll.filter((x) => x.key !== 'file'), [typeCatalogAll])

  const dbTypeCatalog = useMemo(
    () => dbTypeCatalogAll.filter((x) => x.label.toLowerCase().includes(dbTypeSearch.trim().toLowerCase())),
    [dbTypeCatalogAll, dbTypeSearch],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((it) => {
      const matchType = typeFilter === 'all' ? true : it.type === typeFilter
      const matchQ = !q ? true : it.name.toLowerCase().includes(q)
      return matchType && matchQ
    })
  }, [items, query, typeFilter])

  const PAGE_SIZE = 12

  useEffect(() => {
    setPage(1)
  }, [query, typeFilter])

  const paged = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page])

  const openWizard = (entry?: 'database' | 'file') => {
    if (entry === 'file') {
      setFileWizardMode('create')
      setFileSelectedDatasets(fileDatasetOptions.slice(0, 3))
      setEditTarget(null)
      setFileOpen(true)
      setLocalFileName('')
      fileForm.resetFields()
      return
    }

    setDbWizardMode('create')
    setDbSelectedDatasets([])
    setEditTarget(null)
    setDbWizardOpen(true)
    setDbWizardStep(0)
    setDbSelectedType(null)
    setDbTypeSearch('')
    dbForm.resetFields()
    dbForm.setFieldsValue({ accessMode: 'direct' as DataAccessMode, extractMode: 'full' as ExtractMode, extractFrequency: '1d' as ExtractFrequency, dbVersion: '8.0' })
  }

  const openEditWizard = (ds: DataSource) => {
    setEditTarget(ds)
    if (ds.type === 'file') {
      setFileWizardMode('edit')
      setFileSelectedDatasets(fileDatasetOptions.slice(0, Math.max(0, Number(ds.datasetSelected ?? 0) || 0)))
      setFileOpen(true)
      setLocalFileName(ds.fileName ?? '')
      fileForm.resetFields()
      return
    }

    setDbWizardMode('edit')
    setDbWizardOpen(true)
    setDbWizardStep(1)
    setDbSelectedType(ds.type)
    setDbTypeSearch('')
    setDbSelectedDatasets(dbDatasetOptions.slice(0, Math.max(0, Number(ds.datasetSelected ?? 0) || 0)))
    dbForm.resetFields()
    dbForm.setFieldsValue({
      name: ds.name,
      host: ds.host,
      port: ds.port,
      database: ds.database,
      username: ds.username,
      dbVersion: ds.dbVersion ?? '8.0',
      accessMode: ds.accessMode ?? 'direct',
      extractMode: ds.extractMode ?? 'full',
      extractFrequency: ds.extractFrequency ?? '1d',
    })
  }

  const closeDbWizard = () => {
    setDbWizardOpen(false)
    setDbWizardStep(0)
    setDbSelectedType(null)
    setDbTypeSearch('')
    setDbWizardMode('create')
    setDbSelectedDatasets([])
    setEditTarget(null)
    dbForm.resetFields()
  }

  const closeFile = () => {
    setFileOpen(false)
    setFileWizardMode('create')
    setFileSelectedDatasets([])
    setEditTarget(null)
    setLocalFileName('')
    fileForm.resetFields()
  }


  const typeLabel = (k: DataSourceType) => {
    if (k === 'file') return t('dataSources.localFile')
    const hit = typeCatalogAll.find((x) => x.key === k)
    if (hit) return hit.label
    if (k === 'other') return t('common.other')
    return k
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageIntro title={t('intro.dataSources.title')} description={t('intro.dataSources.desc')} />

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <Space>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('actions.search')}
            prefix={<SearchOutlined />}
            allowClear
            style={{ width: 280 }}
          />
          <Select
            value={typeFilter}
            style={{ width: 160 }}
            options={[
              { label: t('dataSources.allTypes'), value: 'all' },
              ...typeCatalogAll.map((x) => ({
                label: x.label,
                value: x.key,
              })),
            ]}
            onChange={(v) => setTypeFilter(v)}
          />
        </Space>


        <Dropdown
          trigger={['hover', 'click']}
          placement="bottomRight"
          menu={{
            items: [
              {
                key: 'database',
                label: (
                  <Space size={10}>
                    <DatabaseDuotoneIcon
                      primary={token.colorPrimary}
                      secondary={themeMode === 'dark' ? 'rgba(255,255,255,0.75)' : 'rgba(15,23,42,0.68)'}
                    />
                    <span>数据库</span>
                  </Space>
                ),
              },
              {
                key: 'file',
                label: (
                  <Space size={10}>
                    <FileDuotoneIcon
                      primary={token.colorPrimary}
                      secondary={themeMode === 'dark' ? 'rgba(255,255,255,0.75)' : 'rgba(15,23,42,0.68)'}
                    />
                    <span>本地文件</span>
                  </Space>
                ),
              },
            ],
            onClick: ({ key }) => openWizard(key === 'file' ? 'file' : 'database'),
          }}
        >
          <Button type="primary" icon={<PlusOutlined />}>
            {t('actions.newDataSource')}
          </Button>
        </Dropdown>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('dataSources.empty')} />
        </Card>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {paged.map((ds) => (
              <Col key={ds.id} xs={24} md={12} xl={8} xxl={6}>
                <div
                  style={{ position: 'relative' }}
                  onMouseEnter={() => {
                    if (closeCardMenuTimerRef.current) window.clearTimeout(closeCardMenuTimerRef.current)
                    closeCardMenuTimerRef.current = null
                    setCardMenuOpenId(ds.id)
                  }}
                  onMouseLeave={() => {
                    if (closeCardMenuTimerRef.current) window.clearTimeout(closeCardMenuTimerRef.current)
                    closeCardMenuTimerRef.current = window.setTimeout(() => setCardMenuOpenId(null), 120)
                  }}
                >
                  <Popover
                    open={cardMenuOpenId === ds.id}
                    placement="bottomRight"
                    trigger={[]}
                    getPopupContainer={() => document.body}
                    autoAdjustOverflow={false}
                    arrow={{ pointAtCenter: true }}
                    overlayInnerStyle={{ padding: 8 }}
                    align={{ offset: [0, 10] }}
                    overlayStyle={{ zIndex: 2100 }}
                    content={
                      <div
                        onMouseEnter={() => {
                          if (closeCardMenuTimerRef.current) window.clearTimeout(closeCardMenuTimerRef.current)
                          closeCardMenuTimerRef.current = null
                          setCardMenuOpenId(ds.id)
                        }}
                        onMouseLeave={() => {
                          if (closeCardMenuTimerRef.current) window.clearTimeout(closeCardMenuTimerRef.current)
                          closeCardMenuTimerRef.current = window.setTimeout(() => setCardMenuOpenId(null), 120)
                        }}
                      >
                        <Space direction="vertical" size={6} style={{ padding: 4 }}>
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={(e) => {
                              e.stopPropagation()
                              setCardMenuOpenId(null)
                              openEditWizard(ds)
                            }}
                          >
                            编辑
                          </Button>
                          <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={(e) => {
                              e.stopPropagation()
                              setCardMenuOpenId(null)
                              setDeleteTarget(ds)
                            }}
                          >
                            删除
                          </Button>
                        </Space>
                      </div>
                    }
                  >
                    <div
                      style={{
                        position: 'absolute',
                        right: 14,
                        bottom: 14,
                        width: 0,
                        height: 0,
                        pointerEvents: 'none',
                      }}
                    />
                  </Popover>
                  <Card
                    className={cardMenuOpenId === ds.id ? 'dsCard dsCardActive' : 'dsCard'}
                    hoverable
                    onClick={() => navigate(`/data-sources/${ds.id}`)}
                    styles={{ body: { padding: 16, height: '100%', display: 'flex', flexDirection: 'column' } }}
                    style={{ height: 132 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <Space size={10} align="start">
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            background: token.colorFillTertiary,
                            display: 'grid',
                            placeItems: 'center',
                          }}
                        >
                          <DataSourceTypeIcon type={ds.type} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <Typography.Text strong style={{ display: 'block' }}>
                            {ds.name}
                          </Typography.Text>
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            {typeLabel(ds.type)}
                          </Typography.Text>
                        </div>
                      </Space>

                      <div style={{ flex: 'none', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', gap: 10, paddingTop: 2 }}>
                        {statusTag(ds.status, t)}
                      </div>
                    </div>

                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10 }}>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <DataTableIcon size={14} color={token.colorTextSecondary} />
                          {ds.datasetSelected ?? 0}
                        </span>
                      </Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {ds.updatedAt}
                      </Typography.Text>
                    </div>
                  </Card>
                </div>
              </Col>
            ))}
          </Row>

          {filtered.length > 0 ? (
            <div style={{ paddingTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
              <Pagination size="small" current={page} pageSize={PAGE_SIZE} total={filtered.length} showSizeChanger={false} onChange={(p) => setPage(p)} />
            </div>
          ) : null}
        </>
      )}

      <Modal
        open={fileOpen}
        onCancel={closeFile}
        width={860}
        destroyOnHidden
        title={fileWizardMode === 'edit' ? '编辑本地文件' : '新建本地文件'}
        centered
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
        footer={
          <Space style={{ width: '100%', justifyContent: 'flex-end' }} size={12}>
            <Button onClick={closeFile}>{t('actions.cancel')}</Button>
            <Button
              type="primary"
              onClick={async () => {
                const v = await fileForm.validateFields()
                const f = v.fileList?.[0]?.originFileObj
                const fileName = f?.name ?? localFileName ?? editTarget?.fileName ?? ''
                const inferredName = fileName ? fileName.replace(/\.(xls|xlsx|csv|json|xml)$/i, '') : ''
                const next: DataSource = {
                  id: editTarget?.id ?? nowId(),
                  name: (editTarget?.name ?? inferredName) || '本地文件',
                  type: 'file',
                  host: '',
                  port: 0,
                  database: '',
                  username: '',
                  fileName,
                  headerRow: editTarget?.headerRow ?? 1,
                  datasetSelected: fileSelectedDatasets.length,
                  datasetTotal: fileDatasetOptions.length,
                  status: editTarget?.status ?? 'ok',
                  updatedAt: nowText(),
                }
                if (fileWizardMode === 'edit' && editTarget) updateItem(editTarget.id, next)
                else addItem(next)
                closeFile()
              }}
            >
              {t('actions.save')}
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" size={14} style={{ width: '100%' }}>
          <Form form={fileForm} layout="vertical">
            <Form.Item
              name="fileList"
              rules={fileWizardMode === 'create' ? [{ required: true, message: t('validation.required') }] : []}
              valuePropName="fileList"
              getValueFromEvent={(e) => e?.fileList}
            >
              <UploadPanel
                title="点击上传"
                description="支持 .xls / .xlsx / .CSV 格式"
                height={260}
                maxCount={1}
                accept=".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                onChange={(info) => {
                  const f = info.file?.originFileObj
                  if (!(f instanceof File)) return
                  setLocalFileName(f.name)
                }}
              />
            </Form.Item>
          </Form>

          <div style={{ marginTop: 6, paddingTop: 6 }}>
            <div style={{ fontWeight: 650, color: token.colorTextSecondary, marginBottom: 8 }}>温馨提示</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: token.colorTextSecondary, fontSize: 12, lineHeight: 1.9 }}>
              <li>请上传结构化数据；有合并单元格的，请处理/拆分后再上传</li>
              <li>系统默认将文件首行为标题行，第二行开始识别为要上传的数据</li>
              <li>最大支持上传的单个文件大小不超过 50M</li>
              <li>最多支持 10 个 Sheet 解析；超过请拆分为多个文件分别上传</li>
            </ul>
          </div>
        </Space>
      </Modal>

      <Modal
        open={!!deleteTarget}
        centered
        width={360}
        zIndex={20000}
        getContainer={() => document.body}
        title={
          <div style={{ paddingRight: 28, fontWeight: 800, fontSize: 18, lineHeight: 1.35 }}>
            {deleteTarget?.type === 'file' ? '删除本地文件' : '删除数据库'}
          </div>
        }
        okText="删除"
        cancelText="取消"
        okButtonProps={{ danger: true, disabled: deleteLinkedDashboards.length > 0 }}
        onCancel={() => setDeleteTarget(null)}
        onOk={() => {
          if (!deleteTarget) return
          if (deleteLinkedDashboards.length > 0) {
            void message.warning('该数据源已关联仪表盘，请先从仪表盘中移除关联的数据表后再删除。')
            return
          }
          const target = deleteTarget
          const id = target.id
          setDeleteTarget(null)
          removeItem(id)
          void message.success('已删除')
        }}
      >
        <div style={{ paddingTop: 8, paddingBottom: 18, lineHeight: 1.65, color: 'var(--ant-color-text-secondary)' }}>
          {deleteTarget ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>{`将删除${deleteTarget.type === 'file' ? '本地文件' : '数据库'}“${deleteTarget.name}”。删除后不可恢复。`}</div>
              {deleteLinkedDashboards.length ? (
                <div style={{ border: `1px solid ${token.colorErrorBorder}`, background: token.colorErrorBg, borderRadius: 12, padding: 10, color: token.colorTextSecondary }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <InfoCircleOutlined style={{ marginTop: 2, color: token.colorError }} />
                    <div style={{ lineHeight: 1.65 }}>
                      已关联仪表盘：{deleteLinkedDashboards.join('、')}。请先从上述仪表盘中移除关联的数据表后再删除。
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            ''
          )}
        </div>
      </Modal>

      <Modal
        open={dbWizardOpen}
        onCancel={closeDbWizard}
        width={860}
        destroyOnHidden
        title={dbWizardMode === 'edit' ? '编辑数据库' : '新建数据库'}
        centered
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
        footer={
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Button onClick={closeDbWizard}>{t('actions.cancel')}</Button>
            <Space size={12}>
              {dbWizardStep === 1 ? (
                <Button
                  icon={<SettingOutlined />}
                  onClick={async () => {
                    await dbForm.validateFields()
                    void message.success(t('dataSources.testConnection') + '成功')
                  }}
                >
                  {t('dataSources.testConnection')}
                </Button>
              ) : null}
              <Button disabled={dbWizardStep === 0} onClick={() => setDbWizardStep((s) => Math.max(0, s - 1))}>
                {t('dataSources.prev')}
              </Button>
              {dbWizardStep < 2 ? (
                <Button
                  type="primary"
                  disabled={dbWizardStep === 0 ? !dbSelectedType : false}
                  onClick={async () => {
                    if (dbWizardStep === 0) {
                      setDbWizardStep(1)
                      return
                    }
                    await dbForm.validateFields()
                    if (dbSelectedDatasets.length === 0) setDbSelectedDatasets(dbDatasetOptions.slice(0, 3))
                    setDbWizardStep(2)
                  }}
                >
                  {t('dataSources.next')}
                </Button>
              ) : (
                <Button
                  type="primary"
                  onClick={async () => {
                    const v = await dbForm.validateFields()
                    const ds: DataSource = {
                      id: editTarget?.id ?? nowId(),
                      name: v.name,
                      type: (dbSelectedType ?? editTarget?.type ?? 'other') as DataSourceType,
                      dbVersion: v.dbVersion,
                      accessMode: (v.accessMode as DataAccessMode) ?? 'direct',
                      extractMode: (v.extractMode as ExtractMode) ?? 'full',
                      extractFrequency: (v.extractFrequency as ExtractFrequency) ?? '1h',
                      host: v.host,
                      port: v.port,
                      database: editTarget?.database ?? v.database ?? '',
                      username: v.username,
                      datasetSelected: dbSelectedDatasets.length,
                      datasetTotal: dbDatasetOptions.length,
                      status: editTarget?.status ?? 'ok',
                      statusMessage: editTarget?.statusMessage,
                      updatedAt: nowText(),
                    }
                    if (dbWizardMode === 'edit' && editTarget) updateItem(editTarget.id, ds)
                    else addItem(ds)
                    closeDbWizard()
                  }}
                >
                  {t('actions.save')}
                </Button>
              )}
            </Space>
          </Space>
        }
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Steps current={dbWizardStep} items={[{ title: t('dataSources.stepPick') }, { title: t('dataSources.stepCredentials') }, { title: t('dataSources.stepDatasets') }]} />

          {dbWizardStep === 0 ? (
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Input
                value={dbTypeSearch}
                onChange={(e) => setDbTypeSearch(e.target.value)}
                placeholder={t('actions.search')}
                prefix={<SearchOutlined />}
                allowClear
              />
              <Row gutter={[12, 12]} style={{ marginInline: 0 }}>
                {dbTypeCatalog.map((x) => (
                  <Col key={x.key} xs={12} md={8}>
                    <Card
                      hoverable={dbWizardMode !== 'edit'}
                      onClick={() => {
                        if (dbWizardMode === 'edit') return
                        setDbSelectedType(x.key)
                      }}
                      styles={{ body: { padding: 12 } }}
                      style={{
                        borderColor: dbSelectedType === x.key ? token.colorPrimary : token.colorSplit,
                        opacity: dbWizardMode === 'edit' && dbSelectedType !== x.key ? 0.55 : 1,
                        cursor: dbWizardMode === 'edit' ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <Space size={10}>
                        {x.icon}
                        <Typography.Text>{x.label}</Typography.Text>
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Space>
          ) : null}

          {dbWizardStep === 1 ? (
            <Card>
              {dbSelectedType ? (
                <div
                  style={{
                    borderRadius: 10,
                    padding: '8px 10px',
                    background: token.colorFillTertiary,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <InfoCircleOutlined style={{ color: token.colorPrimary }} />
                  <Typography.Text style={{ color: token.colorTextSecondary }}>提示：支持5.5、5.6、5.7、8.0版本</Typography.Text>
                </div>
              ) : null}
              <Form
                key={dbSelectedType ?? 'none'}
                form={dbForm}
                layout="vertical"
              >
                <Row gutter={12}>
                  <Col xs={24} md={24}>
                    <Form.Item name="name" label={t('dataSources.formName')} rules={[{ required: true, message: t('validation.required') }]}>
                      <Input placeholder={t('dataSources.formNamePh')} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={12}>
                  <Col xs={24} md={12}>
                    <Form.Item name="host" label={t('dataSources.form.host')} rules={[{ required: true, message: t('validation.required') }]}>
                      <Input placeholder="10.0.0.12" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="port" label={t('dataSources.form.port')} rules={[{ required: true, message: t('validation.required') }]}>
                      <InputNumber min={0} style={{ width: '100%' }} placeholder="5432" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={12}>
                  <Col xs={24} md={12}>
                    <Form.Item name="username" label={t('dataSources.form.username')} rules={[{ required: true, message: t('validation.required') }]}>
                      <Input placeholder="readonly" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="password" label={t('dataSources.formPassword')}>
                      <Input.Password placeholder="******" style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={12}>
                  <Col xs={24} md={24}>
                    <Form.Item name="dbVersion" label="数据库版本" rules={[{ required: true, message: t('validation.required') }]}>
                      <AntSelect options={[{ label: '5.5', value: '5.5' }, { label: '5.6', value: '5.6' }, { label: '5.7', value: '5.7' }, { label: '8.0', value: '8.0' }]} />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="accessMode"
                  label={
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      接入方式
                      <InfoCircleOutlined style={{ cursor: 'pointer', color: token.colorTextTertiary }} onClick={() => setAccessHelpOpen(true)} />
                    </span>
                  }
                  rules={[{ required: true, message: t('validation.required') }]}
                  style={{ marginBottom: 10 }}
                >
                  <Radio.Group
                    style={{ display: 'flex' }}
                  >
                    <Space size={28} align="center" wrap>
                      <Radio value="direct">数据直连</Radio>
                      <Radio value="extract">数据抽取</Radio>
                    </Space>
                  </Radio.Group>
                </Form.Item>

                <Form.Item noStyle shouldUpdate={(p, c) => p.accessMode !== c.accessMode}>
                  {({ getFieldValue }) => {
                    const mode = getFieldValue('accessMode') as DataAccessMode
                    if (mode !== 'extract') return null
                    return (
                      <Row gutter={12} align="middle">
                        <Col xs={24} md={12}>
                          <Form.Item
                            name="extractMode"
                            label="抽取方式"
                            rules={[{ required: true, message: t('validation.required') }]}
                            style={{ marginBottom: 0 }}
                          >
                            <Radio.Group>
                              <Space size={28} align="center" wrap>
                                <Radio value="full">全量抽取</Radio>
                                <Radio value="incremental">增量抽取</Radio>
                              </Space>
                            </Radio.Group>
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item
                            name="extractFrequency"
                            label="抽取频率"
                            rules={[{ required: true, message: t('validation.required') }]}
                            style={{ marginBottom: 0 }}
                          >
                            <AntSelect
                              options={[
                                { label: '5分钟', value: '5m' },
                                { label: '10分钟', value: '10m' },
                                { label: '30分钟', value: '30m' },
                                { label: '1小时', value: '1h' },
                                { label: '1天', value: '1d' },
                              ]}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    )
                  }}
                </Form.Item>

                <div style={{ marginTop: 12 }}>
                  <Typography.Text style={{ fontWeight: 650 }}>连接前，请添加如下白名单列表。</Typography.Text>
                  <div style={{ height: 8 }} />
                  <div
                    style={{
                      borderRadius: 12,
                      padding: 12,
                      background: token.colorFillTertiary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <Typography.Text style={{ color: token.colorTextSecondary, fontSize: 13, lineHeight: 1.6 }}>
                      {WHITELIST}
                    </Typography.Text>
                    <Button
                      type="link"
                      icon={<CopyOutlined />}
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(WHITELIST)
                        } catch {
                          const el = document.createElement('textarea')
                          el.value = WHITELIST
                          document.body.appendChild(el)
                          el.select()
                          document.execCommand('copy')
                          document.body.removeChild(el)
                        }
                      }}
                    >
                      复制白名单
                    </Button>
                  </div>
                </div>
              </Form>
            </Card>
          ) : null}

          {dbWizardStep === 2 ? (
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <Typography.Text type="secondary" style={{ fontSize: 14 }}>
                  可选数据表（{dbSelectedDatasets.length}/{dbDatasetOptions.length}）
                </Typography.Text>
                <Space size={6}>
                  <Button type="text" size="small" style={{ fontSize: 12, color: token.colorTextSecondary }} onClick={() => setDbSelectedDatasets(dbDatasetOptions)}>
                    全选
                  </Button>
                  <Button type="text" size="small" style={{ fontSize: 12, color: token.colorTextSecondary }} onClick={() => setDbSelectedDatasets([])}>
                    清空
                  </Button>
                </Space>
              </div>
              <div style={{ height: 8 }} />
              <Input
                value={dbDatasetSearch}
                allowClear
                prefix={<SearchOutlined />}
                placeholder="搜索数据表"
                onChange={(e) => setDbDatasetSearch(e.target.value)}
              />
              <div style={{ height: 10 }} />
              <div style={{ border: `1px solid ${token.colorSplit}`, borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ maxHeight: 280, overflow: 'auto', padding: 10 }}>
                  <Checkbox.Group
                    style={{ width: '100%' }}
                    value={dbSelectedDatasets}
                    onChange={(vals) => setDbSelectedDatasets((Array.isArray(vals) ? vals : []).map(String))}
                  >
                    <Space direction="vertical" size={10} style={{ width: '100%' }}>
                      {dbDatasetOptions
                        .filter((x) => x.toLowerCase().includes(dbDatasetSearch.trim().toLowerCase()))
                        .map((x) => (
                          <Checkbox key={x} value={x} style={{ width: '100%', fontSize: 14 }}>
                            <Space size={10}>
                              <DataTableIcon size={14} color={token.colorTextSecondary} />
                              <span style={{ fontSize: 14 }}>{x}</span>
                            </Space>
                          </Checkbox>
                        ))}
                    </Space>
                  </Checkbox.Group>
                </div>
              </div>
            </Card>
          ) : null}
        </Space>
      </Modal>

      <Modal
        open={accessHelpOpen}
        onCancel={() => setAccessHelpOpen(false)}
        footer={null}
        centered
        width={980}
        style={{ maxWidth: 980, width: 'calc(100vw - 48px)' }}
        title={<div style={{ paddingRight: 28, fontWeight: 800, fontSize: 18, lineHeight: 1.35 }}>接入方式说明</div>}
        destroyOnHidden
        styles={{ body: { padding: 18, background: token.colorBgContainer } }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: screens.md ? 'minmax(0, 1fr) minmax(0, 1fr)' : 'minmax(0, 1fr)',
            gap: 18,
          }}
        >
          <div
            style={{
              background: token.colorBgContainer,
              borderRadius: 18,
              boxShadow: 'none',
              border: `1px solid ${token.colorSplit}`,
              padding: 22,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ fontSize: 22, fontWeight: 850, color: token.colorText }}>直连模式</div>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: isDark ? 'rgba(59,130,246,0.18)' : 'rgba(59,130,246,0.12)',
                  color: isDark ? 'rgba(147,197,253,0.95)' : '#2563EB',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                数据时效性高
              </span>
            </div>
            <div style={{ color: token.colorTextSecondary, fontSize: 14, lineHeight: 1.7 }}>
              数据原地不动，通过计算下推实现秒级响应，确保感知最新业务波动。
            </div>

            <div style={{ paddingTop: 4, paddingBottom: 2 }}>
              <div style={{ width: '100%', overflow: 'hidden' }}>
                <svg viewBox="0 0 520 160" width="100%" height="160" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="directAccent" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor={token.colorPrimary} stopOpacity="0.95" />
                      <stop offset="1" stopColor={token.colorPrimaryBg} stopOpacity="0.95" />
                    </linearGradient>
                    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                      <path d="M1 1 L9 5 L1 9" fill="none" stroke={token.colorTextTertiary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </marker>
                  </defs>

                  <g opacity={isDark ? 0.9 : 1}>
                    <g transform="translate(92,54)">
                      <circle cx="32" cy="26" r="10" fill={token.colorTextSecondary} opacity="0.65" />
                      <path d="M18 52c4-10 24-10 28 0" stroke={token.colorTextSecondary} strokeWidth="6" strokeLinecap="round" opacity="0.55" />
                      <text x="32" y="88" textAnchor="middle" fontSize="13" fill={token.colorTextSecondary}>提问</text>
                    </g>

                    <g>
                      <path d="M176 86H344" stroke={token.colorTextTertiary} strokeWidth="2" strokeLinecap="round" markerEnd="url(#arrow)" opacity={isDark ? 0.55 : 0.7} />
                      <text x="260" y="70" textAnchor="middle" fontSize="12" fill={token.colorPrimary} fontWeight="700">NL2SQL</text>
                    </g>

                    <g transform="translate(364,54)">
                      <ellipse cx="32" cy="18" rx="18" ry="8" fill="url(#directAccent)" opacity="0.55" />
                      <rect x="14" y="18" width="36" height="28" fill="url(#directAccent)" opacity="0.38" />
                      <ellipse cx="32" cy="46" rx="18" ry="8" fill="url(#directAccent)" opacity="0.55" />
                      <ellipse cx="32" cy="18" rx="18" ry="8" fill="none" stroke="url(#directAccent)" strokeWidth="2" opacity="0.9" />
                      <rect x="14" y="18" width="36" height="28" fill="none" stroke="url(#directAccent)" strokeWidth="2" opacity="0.9" />
                      <ellipse cx="32" cy="46" rx="18" ry="8" fill="none" stroke="url(#directAccent)" strokeWidth="2" opacity="0.9" />
                      <text x="32" y="88" textAnchor="middle" fontSize="13" fill={token.colorTextSecondary}>高性能数仓</text>
                    </g>
                  </g>
                </svg>
              </div>
            </div>

            <div style={{ marginTop: 2, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, color: token.colorText }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: isDark ? 'rgba(147,197,253,0.95)' : '#2563EB', marginTop: 8, flex: 'none' }} />
                <span>零存储成本：不搬运原始数据</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: isDark ? 'rgba(147,197,253,0.95)' : '#2563EB', marginTop: 8, flex: 'none' }} />
                <span>极致实时：直连数仓，数据不延时</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: isDark ? 'rgba(147,197,253,0.95)' : '#2563EB', marginTop: 8, flex: 'none' }} />
                <span>适用场景：Doris, StarRocks, ClickHouse</span>
              </div>
            </div>

            <Button
              size="large"
              block
              style={{
                marginTop: 'auto',
                height: 44,
                borderRadius: 10,
                borderColor: isDark ? 'rgba(255,255,255,0.16)' : '#D1D5DB',
                color: token.colorText,
                background: token.colorBgContainer,
              }}
              onClick={() => {
                dbForm.setFieldsValue({ accessMode: 'direct' })
                setAccessHelpOpen(false)
              }}
            >
              选择直连模式
            </Button>
          </div>

          <div
            style={{
              background: token.colorBgContainer,
              borderRadius: 18,
              boxShadow: 'none',
              border: `1px solid ${token.colorSplit}`,
              padding: 22,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ fontSize: 22, fontWeight: 850, color: token.colorText }}>加速模式</div>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: isDark ? 'rgba(34,197,94,0.16)' : 'rgba(34,197,94,0.14)',
                  color: isDark ? 'rgba(134,239,172,0.95)' : '#16A34A',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                查询响应快
              </span>
            </div>
            <div style={{ color: token.colorTextSecondary, fontSize: 14, lineHeight: 1.7 }}>
              数据同步至内置计算引擎，屏蔽主库压力，提供毫秒级问答体验。
            </div>

            <div style={{ paddingTop: 4, paddingBottom: 2 }}>
              <div style={{ width: '100%', overflow: 'hidden' }}>
                <svg viewBox="0 0 520 160" width="100%" height="160" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="accelAccent" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor={token.colorSuccess} stopOpacity="0.95" />
                      <stop offset="1" stopColor={token.colorSuccessBg} stopOpacity="0.95" />
                    </linearGradient>
                    <marker id="arrow2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                      <path d="M1 1 L9 5 L1 9" fill="none" stroke={token.colorTextTertiary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </marker>
                  </defs>

                  <g opacity={isDark ? 0.9 : 1}>
                    <g transform="translate(78,54)">
                      <ellipse cx="32" cy="18" rx="18" ry="8" fill={token.colorTextSecondary} opacity="0.18" />
                      <rect x="14" y="18" width="36" height="28" fill={token.colorTextSecondary} opacity="0.10" />
                      <ellipse cx="32" cy="46" rx="18" ry="8" fill={token.colorTextSecondary} opacity="0.18" />
                      <ellipse cx="32" cy="18" rx="18" ry="8" fill="none" stroke={token.colorTextSecondary} strokeWidth="2" opacity="0.45" />
                      <rect x="14" y="18" width="36" height="28" fill="none" stroke={token.colorTextSecondary} strokeWidth="2" opacity="0.45" />
                      <ellipse cx="32" cy="46" rx="18" ry="8" fill="none" stroke={token.colorTextSecondary} strokeWidth="2" opacity="0.45" />
                      <text x="32" y="88" textAnchor="middle" fontSize="13" fill={token.colorTextSecondary}>业务主库</text>
                    </g>

                    <g>
                      <text x="183" y="70" textAnchor="middle" fontSize="12" fill={token.colorTextTertiary}>
                        同步
                      </text>
                      <path
                        d="M146 86H220"
                        stroke={token.colorTextTertiary}
                        strokeWidth="2"
                        strokeLinecap="round"
                        markerEnd="url(#arrow2)"
                        opacity={isDark ? 0.55 : 0.7}
                      />
                      <path
                        d="M302 86H396"
                        stroke={token.colorTextTertiary}
                        strokeWidth="2"
                        strokeLinecap="round"
                        markerEnd="url(#arrow2)"
                        opacity={isDark ? 0.55 : 0.7}
                      />
                    </g>

                    <g transform="translate(228,54)">
                      <rect x="4" y="4" width="56" height="56" rx="16" fill="none" stroke="url(#accelAccent)" strokeWidth="2" strokeDasharray="5 5" opacity="0.95" />
                      <path d="M37 16 L28 36 H38 L32 52 L48 32 H37" transform="translate(-6,0)" fill="url(#accelAccent)" opacity="0.95" />
                      <text x="32" y="88" textAnchor="middle" fontSize="13" fill={token.colorTextSecondary}>
                        内置加速引擎
                      </text>
                    </g>

                    <g transform="translate(396,54)">
                      <circle cx="32" cy="26" r="10" fill={token.colorTextSecondary} opacity="0.65" />
                      <path d="M18 52c4-10 24-10 28 0" stroke={token.colorTextSecondary} strokeWidth="6" strokeLinecap="round" opacity="0.55" />
                      <text x="32" y="88" textAnchor="middle" fontSize="13" fill={token.colorTextSecondary}>提问</text>
                    </g>
                  </g>
                </svg>
              </div>
            </div>

            <div style={{ marginTop: 2, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, color: token.colorText }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: isDark ? 'rgba(147,197,253,0.95)' : '#2563EB', marginTop: 8, flex: 'none' }} />
                <span>护航主库：复杂计算不影响生产系统</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: isDark ? 'rgba(147,197,253,0.95)' : '#2563EB', marginTop: 8, flex: 'none' }} />
                <span>极致性能：内置索引加速，无视源库性能</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: isDark ? 'rgba(147,197,253,0.95)' : '#2563EB', marginTop: 8, flex: 'none' }} />
                <span>适用场景：MySQL, Oracle, SQL Server</span>
              </div>
            </div>

            <Button
              size="large"
              block
              style={{
                marginTop: 'auto',
                height: 44,
                borderRadius: 10,
                borderColor: isDark ? 'rgba(255,255,255,0.16)' : '#D1D5DB',
                color: token.colorText,
                background: token.colorBgContainer,
              }}
              onClick={() => {
                dbForm.setFieldsValue({ accessMode: 'extract' })
                dbForm.setFieldsValue({ extractMode: 'full', extractFrequency: '1d' })
                setAccessHelpOpen(false)
              }}
            >
              选择加速模式
            </Button>
          </div>
        </div>
      </Modal>

      <Drawer
        open={!!id}
        onClose={() => navigate('/data-sources')}
        placement="bottom"
        height={detailDrawerHeight}
        zIndex={2000}
        title={<Typography.Text style={{ fontWeight: 750 }}>{current?.name ?? '数据源'}</Typography.Text>}
        destroyOnClose
        mask
        maskClosable
        keyboard
        getContainer={() => document.body}
        styles={{ mask: { background: 'rgba(0,0,0,0.28)' }, body: { padding: 12, height: '100%', minHeight: 0 } }}
      >
        {current ? (
          <div style={{ height: '100%', minHeight: 0, overflow: 'hidden' }}>
            <DataSourceDetail dataSource={current} />
          </div>
        ) : (
          <Card>
            <Empty description={null} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            <div style={{ height: 10 }} />
            <Button onClick={() => navigate('/data-sources')}>返回</Button>
          </Card>
        )}
      </Drawer>
    </Space>
  )
}
