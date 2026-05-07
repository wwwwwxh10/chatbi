import { Button, Card, Form, Input, Modal, Select, Space, Switch, Table, Tag, Typography, Upload, message, theme } from 'antd'
import { useTranslation } from 'react-i18next'
import { PageIntro } from '../components/PageIntro'
import { useState } from 'react'
import { UploadPanel } from '../components/UploadPanel'
import { useSystemStore } from '../store/systemStore'
import { useUsersStore } from '../store/usersStore'
import type { SystemUser, UserRole, UserStatus } from '../store/usersStore'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { confirmDelete } from '../components/confirmDelete'

export default function SystemManagementPage({ mode }: { mode: 'users' | 'settings' }) {
  const { t } = useTranslation()
  const { token } = theme.useToken()
  const systemName = useSystemStore((s) => s.systemName)
  const logo = useSystemStore((s) => s.logoDataUrl)
  const setSystemName = useSystemStore((s) => s.setSystemName)
  const setLogo = useSystemStore((s) => s.setLogoDataUrl)

  const users = useUsersStore((s) => s.users)
  const addUser = useUsersStore((s) => s.addUser)
  const updateUser = useUsersStore((s) => s.updateUser)
  const removeUser = useUsersStore((s) => s.removeUser)

  const [userOpen, setUserOpen] = useState(false)
  const [editing, setEditing] = useState<SystemUser | null>(null)
  const [userForm] = Form.useForm<{ accountId: string; accountName: string; role: UserRole }>()

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageIntro title={t('intro.system.title')} description={t('intro.system.desc')} />
      {mode === 'users' ? (
        <Card
          size="small"
          title={t('system.users.title')}
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditing(null)
                userForm.setFieldsValue({ accountId: '', accountName: '', role: 'Analyst' })
                setUserOpen(true)
              }}
            >
              新建
            </Button>
          }
        >
          <Table
            size="middle"
            pagination={false}
            dataSource={users.map((u) => ({ ...u, key: u.id }))}
            columns={[
              { title: '账号ID', dataIndex: 'accountId', key: 'accountId', width: 160, ellipsis: true },
              { title: '账号名', dataIndex: 'accountName', key: 'accountName', width: 180, ellipsis: true },
              {
                title: '角色',
                dataIndex: 'role',
                key: 'role',
                width: 140,
                render: (v: UserRole) => <Tag color={v === 'Admin' ? 'geekblue' : v === 'Analyst' ? 'blue' : 'default'}>{v}</Tag>,
              },
              {
                title: '启用',
                dataIndex: 'status',
                key: 'status',
                width: 120,
                render: (_v: UserStatus, r: SystemUser) => (
                  <Switch
                    checked={r.status === 'Active'}
                    onChange={(checked) => updateUser(r.id, { status: checked ? 'Active' : 'Disabled' })}
                  />
                ),
              },
              {
                title: '操作',
                key: 'actions',
                width: 160,
                align: 'right' as const,
                render: (_: unknown, r: SystemUser) => (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', columnGap: 6, width: '100%', justifyItems: 'center' }}>
                    <Button
                      type="text"
                      className="iconOnly"
                      icon={<EditOutlined />}
                      onClick={() => {
                        setEditing(r)
                        userForm.setFieldsValue({ accountId: r.accountId, accountName: r.accountName, role: r.role })
                        setUserOpen(true)
                      }}
                    />
                    <Button
                      type="text"
                      danger
                      className="iconOnly"
                      icon={<DeleteOutlined />}
                      onClick={() => {
                        confirmDelete({ title: '确认删除该用户？', onOk: () => removeUser(r.id) })
                      }}
                    />
                  </div>
                ),
              },
            ]}
          />

          <Modal
            open={userOpen}
            destroyOnHidden
            title={editing ? '编辑用户' : '新建用户'}
            okText={t('actions.save')}
            cancelText={t('actions.cancel')}
            centered
            onCancel={() => {
              setUserOpen(false)
              setEditing(null)
              userForm.resetFields()
            }}
            onOk={async () => {
              const v = await userForm.validateFields()
              if (!editing) {
                addUser({
                  id: `u-${Date.now()}`,
                  accountId: v.accountId.trim(),
                  accountName: v.accountName.trim(),
                  role: v.role,
                  status: 'Active',
                  mustChangePassword: true,
                })
              } else {
                updateUser(editing.id, { accountId: v.accountId.trim(), accountName: v.accountName.trim(), role: v.role })
              }
              setUserOpen(false)
              setEditing(null)
              userForm.resetFields()
              void message.success('已保存')
            }}
          >
            <Form form={userForm} layout="vertical">
              <Form.Item name="accountId" label="账号ID" rules={[{ required: true, message: t('validation.required') }]}>
                <Input placeholder="例如：zhangsan" />
              </Form.Item>
              <Form.Item name="accountName" label="账号名" rules={[{ required: true, message: t('validation.required') }]}>
                <Input placeholder="例如：张三" />
              </Form.Item>
              <Form.Item name="role" label="角色" rules={[{ required: true, message: t('validation.required') }]}>
                <Select options={[{ label: 'Admin', value: 'Admin' }, { label: 'Analyst', value: 'Analyst' }, { label: 'Viewer', value: 'Viewer' }]} />
              </Form.Item>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                初始密码：88888888（首次登录需修改）
              </Typography.Text>
            </Form>
          </Modal>
        </Card>
      ) : (
        <Card size="small" title={t('system.settings.title')}>
          <Form
            layout="vertical"
            onFinish={async () => {
              await new Promise((r) => setTimeout(r, 350))
              void message.success('已保存')
            }}
            initialValues={{ systemName }}
          >
            <Form.Item label="系统名称" name="systemName" rules={[{ required: true, message: t('validation.required') }]}>
              <Input
                placeholder="例如：ChatBI"
                onChange={(e) => {
                  const v = e.target.value
                  setSystemName(v)
                }}
              />
            </Form.Item>

            <Form.Item label="系统 Logo">
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 12,
                    border: `1px solid ${token.colorSplit}`,
                    background: token.colorFillTertiary,
                    display: 'grid',
                    placeItems: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {logo ? <img src={logo} alt={systemName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: token.colorTextTertiary }}>—</span>}
                </div>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <UploadPanel
                    title="点击上传"
                    description="PNG/JPG，30×30，≤200KB"
                    height={92}
                    maxCount={1}
                    accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                    beforeUpload={(file) => {
                      const isOk = /image\/(png|jpeg)/.test(file.type)
                      if (!isOk) {
                        void message.error('仅支持 PNG/JPG')
                        return Upload.LIST_IGNORE
                      }
                      if (file.size > 200 * 1024) {
                        void message.error('图片需小于 200KB')
                        return Upload.LIST_IGNORE
                      }
                      return false
                    }}
                    onChange={(info) => {
                      const f = info.file?.originFileObj
                      if (!(f instanceof File)) return
                      const reader = new FileReader()
                      reader.onload = () => {
                        const dataUrl = typeof reader.result === 'string' ? reader.result : null
                        setLogo(dataUrl)
                      }
                      reader.readAsDataURL(f)
                    }}
                  />
                </div>
                <Button
                  onClick={() => setLogo(null)}
                  disabled={!logo}
                >
                  清除
                </Button>
              </div>
            </Form.Item>

            <Button type="primary" htmlType="submit">
              {t('actions.save')}
            </Button>
          </Form>
        </Card>
      )}
    </Space>
  )
}
