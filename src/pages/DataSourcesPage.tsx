import {
  Button,
  Card,
  Checkbox,
  Col,
  Dropdown,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popover,
  Radio,
  Row,
  Select,
  Select as AntSelect,
  Space,
  Steps,
  Typography,
  theme,
} from 'antd'
import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageIntro } from '../components/PageIntro'
import { DataSourceTypeIcon } from '../components/DataSourceTypeIcon'
import { nowId, nowText } from './dataSources/model'
import type { DataSource, DataSourceType } from './dataSources/model'
import {
  CheckCircleFilled,
  CloseCircleFilled,
  DeleteOutlined,
  EditOutlined,
  MinusCircleFilled,
  PlusOutlined,
  SearchOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { DataTableIcon } from '../components/icons/DataTableIcon'
import { useNavigate } from 'react-router-dom'
import { useDataSourcesStore } from '../store/dataSourcesStore'
import { UploadPanel } from '../components/UploadPanel'
import { useAppStore } from '../store/appStore'
import { DatabaseDuotoneIcon } from '../components/icons/DatabaseDuotoneIcon'
import { FileDuotoneIcon } from '../components/icons/FileDuotoneIcon'
import type { DataAccessMode, ExtractFrequency, ExtractMode } from './dataSources/model'

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

  const themeMode = useAppStore((s) => s.themeMode)

  const { token } = theme.useToken()
  const items = useDataSourcesStore((s) => s.items)
  const addItem = useDataSourcesStore((s) => s.addItem)
  const updateItem = useDataSourcesStore((s) => s.updateItem)
  const removeItem = useDataSourcesStore((s) => s.removeItem)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<DataSourceType | 'all'>('all')

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
  const fileDatasetOptions = useMemo(() => ['Sheet1', 'Sheet2', 'Sheet3', 'Sheet4', 'Sheet5'], [])

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
    dbForm.setFieldsValue({ accessMode: 'direct' as DataAccessMode })
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
      accessMode: ds.accessMode ?? 'direct',
      extractMode: ds.extractMode ?? 'full',
      extractFrequency: ds.extractFrequency ?? '1h',
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
            style={{ width: 280 }}
          />
          <Select
            value={typeFilter}
            style={{ width: 160 }}
            options={[
              { label: t('dataSources.allTypes'), value: 'all' },
              ...typeCatalogAll.map((x) => ({ label: x.label, value: x.key })),
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
          <Empty description={t('dataSources.empty')} />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {filtered.map((ds) => (
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
                  align={{ offset: [12, 16] }}
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
                      right: 16,
                      bottom: 14,
                      width: 120,
                      height: 1,
                      pointerEvents: 'none',
                    }}
                  />
                </Popover>
                <Card
                  className="dsCard"
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
                          border: `1px solid ${token.colorSplit}`,
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
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <DataTableIcon size={14} color={token.colorTextSecondary} />
                        {ds.type === 'file' ? '--' : `${ds.datasetSelected ?? 0}/${ds.datasetTotal ?? 0}`}
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
      )}

      <Modal
        open={fileOpen}
        onCancel={closeFile}
        width={860}
        destroyOnHidden
        title={fileWizardMode === 'edit' ? '编辑数据源' : '文件上传'}
        centered
        footer={
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
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
                description="支持 .csv、.xlsx、.xls、.json、.xml"
                height={260}
                maxCount={1}
                accept=".xls,.xlsx,.csv,.json,.xml,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,application/json,application/xml,text/xml"
                onChange={(info) => {
                  const f = info.file?.originFileObj
                  if (!(f instanceof File)) return
                  setLocalFileName(f.name)
                }}
              />
            </Form.Item>
          </Form>

          <div style={{ borderTop: `1px solid ${token.colorSplit}`, marginTop: 6, paddingTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 10, color: token.colorTextSecondary }}>
              <div style={{ flex: 1, height: 1, background: token.colorSplit }} />
              <div style={{ fontWeight: 650 }}>温馨提示</div>
              <div style={{ flex: 1, height: 1, background: token.colorSplit }} />
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, color: token.colorTextSecondary, fontSize: 12, lineHeight: 1.9 }}>
              <li>请上传结构化数据；有合并单元格的，请处理/拆分后再上传</li>
              <li>系统默认将文件首行为标题行，第二行开始识别为要上传的数据</li>
              <li>最大支持上传的单个文件大小不超过 50M</li>
              <li>最多支持 5 个 Sheet 解析；超过请拆分为多个文件分别上传</li>
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
        title={<div style={{ paddingRight: 28, fontWeight: 800, fontSize: 18, lineHeight: 1.35 }}>确认删除数据源</div>}
        okText="删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        onCancel={() => setDeleteTarget(null)}
        onOk={() => {
          if (!deleteTarget) return
          const id = deleteTarget.id
          setDeleteTarget(null)
          removeItem(id)
        }}
      >
        <div style={{ paddingTop: 8, paddingBottom: 18, lineHeight: 1.65, color: 'var(--ant-color-text-secondary)' }}>
          {deleteTarget ? `将删除数据源“${deleteTarget.name}”。删除后不可恢复。` : ''}
        </div>
      </Modal>

      <Modal
        open={dbWizardOpen}
        onCancel={closeDbWizard}
        width={860}
        destroyOnHidden
        title={t('dataSources.newTitle')}
        centered
        footer={
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Button onClick={closeDbWizard}>{t('actions.cancel')}</Button>
            <Space>
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
                      accessMode: (v.accessMode as DataAccessMode) ?? 'direct',
                      extractMode: (v.extractMode as ExtractMode) ?? 'full',
                      extractFrequency: (v.extractFrequency as ExtractFrequency) ?? '1h',
                      host: v.host,
                      port: v.port,
                      database: v.database,
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
                placeholder={t('dataSources.searchType')}
                prefix={<SearchOutlined />}
              />
              <Row gutter={[12, 12]}>
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
                    <Form.Item name="database" label={t('dataSources.form.database')} rules={[{ required: true, message: t('validation.required') }]}>
                      <Input placeholder="biz" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="username" label={t('dataSources.form.username')} rules={[{ required: true, message: t('validation.required') }]}>
                      <Input placeholder="readonly" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item name="password" label={t('dataSources.formPassword')}>
                  <Input.Password placeholder="******" style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                  name="accessMode"
                  label="接入方式"
                  rules={[{ required: true, message: t('validation.required') }]}
                  style={{ marginBottom: 10 }}
                >
                  <Radio.Group
                    options={[
                      { label: '数据直连', value: 'direct' },
                      { label: '数据抽取', value: 'extract' },
                    ]}
                  />
                </Form.Item>

                <Form.Item noStyle shouldUpdate={(p, c) => p.accessMode !== c.accessMode}>
                  {({ getFieldValue }) => {
                    const mode = getFieldValue('accessMode') as DataAccessMode
                    if (mode !== 'extract') return null
                    return (
                      <Row gutter={12}>
                        <Col xs={24} md={12}>
                          <Form.Item name="extractMode" label="抽取方式" style={{ marginBottom: 0 }}>
                            <Radio.Group
                              options={[
                                { label: '全量抽取', value: 'full' },
                                { label: '增量抽取', value: 'incremental' },
                              ]}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item name="extractFrequency" label="抽取频率" style={{ marginBottom: 0 }}>
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

                <Button icon={<SettingOutlined />}>{t('dataSources.testConnection')}</Button>
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
    </Space>
  )
}
