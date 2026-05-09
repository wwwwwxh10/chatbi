import {
  Alert,
  Button,
  Card,
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  Segmented,
  Space,
  Tag,
  Typography,
} from 'antd'
import type { FormInstance } from 'antd'
import type { DataSource, DataSourceType } from './model'
import { useTranslation } from 'react-i18next'

function statusTag(s: DataSource['status'], t: (k: string) => string) {
  if (s === 'ok') return <Tag color="green">{t('dataSources.status.ok')}</Tag>
  if (s === 'error') return <Tag color="red">{t('dataSources.status.error')}</Tag>
  return <Tag>{t('dataSources.status.unknown')}</Tag>
}

export default function DataSourceDrawer({
  open,
  editing,
  activeTab,
  setActiveTab,
  form,
  testing,
  testState,
  onTest,
  onSave,
  onClose,
}: {
  open: boolean
  editing: DataSource | null
  activeTab: 'conn' | 'meta'
  setActiveTab: (k: 'conn' | 'meta') => void
  form: FormInstance<{
    name: string
    type: DataSourceType
    dbVersion?: string
    host: string
    port: number
    database: string
    username: string
  }>
  testing: boolean
  testState: { type: 'success' | 'error'; msg: string } | null
  onTest: (ds: DataSource) => void
  onSave: () => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const dsType = Form.useWatch('type', form) as DataSourceType | undefined
  const WHITELIST =
    '47.101.108.0/24,101.132.48.0/24,47.101.107.0/24,139.224.92.0/24,139.224.4.0/24,106.15.146.0/24,106.15.145.0/24,106.15.143.0/24,106.15.14.0/24,106.15.13.0/24,100.104.0.0/16,139.224.19.222,47.102.111.163'
  const metaPreview = (() => {
    if (!editing) return null
    if (editing.status !== 'ok') return null
    return {
      schemas: ['public', 'analytics'],
      tables: ['orders', 'order_items', 'users', 'events'],
    }
  })()

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={560}
      title={editing ? (editing.type === 'file' ? '编辑本地文件' : '编辑数据库') : '新建数据库'}
      destroyOnHidden
      styles={{ mask: { background: 'rgba(0,0,0,0.28)' } }}
      getContainer={() => document.body}
      extra={
        <Space>
          <Button onClick={onSave} type="primary">
            {t('actions.save')}
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        {dsType ? <Alert type="info" showIcon message="提示：支持5.5、5.6、5.7、8.0版本" /> : null}
        {testState ? <Alert type={testState.type} message={testState.msg} showIcon /> : null}

        {editing ? (
          <Space>
            <Typography.Text type="secondary">{t('dataSources.table.status')}：</Typography.Text>
            {statusTag(editing.status, t)}
            {editing.statusMessage ? (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {editing.statusMessage}
              </Typography.Text>
            ) : null}
          </Space>
        ) : null}

        <Segmented
          value={activeTab}
          onChange={(k) => setActiveTab(k as 'conn' | 'meta')}
          options={[
            { label: t('dataSources.form.connection'), value: 'conn' },
            { label: t('dataSources.form.metadata'), value: 'meta' },
          ]}
          style={{ alignSelf: 'flex-start' }}
        />

        {activeTab === 'conn' ? (
          <Form
            layout="vertical"
            form={form}
            initialValues={{
              name: '',
              type: 'postgres',
              dbVersion: '8.0',
              host: '',
              port: 5432,
              database: '',
              username: '',
            }}
          >
            <Form.Item name="name" label={t('dataSources.table.name')} rules={[{ required: true, message: t('validation.required') }]}>
              <Input placeholder={t('dataSources.form.namePlaceholder')} />
            </Form.Item>
            <Form.Item name="type" label={t('dataSources.table.type')} rules={[{ required: true, message: t('validation.required') }]}>
              <Select
                options={[
                  { label: 'PostgreSQL', value: 'postgres' },
                  { label: 'MySQL', value: 'mysql' },
                  { label: t('common.other'), value: 'other' },
                ]}
              />
            </Form.Item>

            {dsType === 'mysql' ? (
              <Form.Item name="dbVersion" label="数据库版本" rules={[{ required: true, message: t('validation.required') }]}>
                <Select options={[{ label: '5.5', value: '5.5' }, { label: '5.6', value: '5.6' }, { label: '5.7', value: '5.7' }, { label: '8.0', value: '8.0' }]} />
              </Form.Item>
            ) : null}
            <Form.Item name="host" label={t('dataSources.form.host')} rules={[{ required: true, message: t('validation.required') }]}>
              <Input placeholder="10.0.0.12" />
            </Form.Item>
            <Form.Item name="port" label={t('dataSources.form.port')} rules={[{ required: true, message: t('validation.required') }]}>
              <InputNumber style={{ width: '100%' }} min={1} max={65535} />
            </Form.Item>
            <Form.Item name="database" label={t('dataSources.form.database')} rules={[{ required: true, message: t('validation.required') }]}>
              <Input placeholder="biz" />
            </Form.Item>
            <Form.Item name="username" label={t('dataSources.form.username')} rules={[{ required: true, message: t('validation.required') }]}>
              <Input placeholder="readonly" />
            </Form.Item>

            {editing ? (
              <Button loading={testing} onClick={() => onTest(editing)}>
                {t('actions.test')}
              </Button>
            ) : (
              <Typography.Text type="secondary">{t('dataSources.form.saveTip')}</Typography.Text>
            )}

            <div style={{ marginTop: 12 }}>
              <Typography.Text style={{ fontWeight: 650 }}>连接前，请添加如下白名单列表。</Typography.Text>
              <div style={{ height: 8 }} />
              <div
                style={{
                  borderRadius: 12,
                  padding: 12,
                  background: 'rgba(255,255,255,0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <Typography.Text style={{ color: 'var(--ant-color-text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
                  {WHITELIST}
                </Typography.Text>
                <Typography.Link
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
                </Typography.Link>
              </div>
            </div>
          </Form>
        ) : (
          <Card size="small">
            {!editing ? (
              <Typography.Text type="secondary">{t('dataSources.form.selectTip')}</Typography.Text>
            ) : editing.status !== 'ok' ? (
              <Typography.Text type="secondary">{t('dataSources.form.statusTip')}</Typography.Text>
            ) : !metaPreview ? (
              <Typography.Text type="secondary">{t('dataSources.form.emptyTip')}</Typography.Text>
            ) : (
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <div>
                  <Typography.Text strong>Schema</Typography.Text>
                  <div style={{ marginTop: 8 }}>
                    <Space wrap>
                      {metaPreview.schemas.map((s) => (
                        <Tag key={s}>{s}</Tag>
                      ))}
                    </Space>
                  </div>
                </div>
                <div>
                  <Typography.Text strong>Tables</Typography.Text>
                  <div style={{ marginTop: 8 }}>
                    <Space wrap>
                      {metaPreview.tables.map((t) => (
                        <Tag key={t}>{t}</Tag>
                      ))}
                    </Space>
                  </div>
                </div>
              </Space>
            )}
          </Card>
        )}
      </Space>
    </Drawer>
  )
}
