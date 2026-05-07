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
      title={editing ? t('actions.edit') : t('actions.newDataSource')}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={onSave} type="primary">
            {t('actions.save')}
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
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
