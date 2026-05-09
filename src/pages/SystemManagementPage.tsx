import { Button, Card, Form, Input, Modal, Select, Space, Switch, Table, Tag, Upload, message, theme } from 'antd'
import { useTranslation } from 'react-i18next'
import { PageIntro } from '../components/PageIntro'
import { useMemo, useState } from 'react'
import { UploadPanel } from '../components/UploadPanel'
import { useSystemStore } from '../store/systemStore'
import { useUsersStore } from '../store/usersStore'
import type { SystemUser, UserRole, UserStatus } from '../store/usersStore'
import { DeleteOutlined, EditOutlined, InfoCircleOutlined, KeyOutlined, PlusOutlined, RadarChartOutlined, SafetyCertificateOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons'

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

  const [roleHelpOpen, setRoleHelpOpen] = useState(false)
  const [resetTarget, setResetTarget] = useState<SystemUser | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SystemUser | null>(null)

  const [keyword, setKeyword] = useState('')

  const ROLE_META: Record<UserRole, { name: string; desc: string; tag: string }> = {
    Admin: {
      name: '系统管理员',
      desc: '负责平台的全局运行维护与安全管控。具备用户账号分配、角色权限授权及系统参数配置权限，是系统稳定运行的核心保障。',
      tag: 'geekblue',
    },
    Analyst: {
      name: '数据分析师',
      desc: '负责数据资产的建设与AI语义建模。通过配置数据源、维护指标口径与语义知识库，以及搭建可视化仪表盘，将原始数据转化为AI可理解的业务洞察。',
      tag: 'blue',
    },
    Viewer: {
      name: '普通用户',
      desc: '负责数据的消费与业务探索。支持通过自然语言对话（问数）即时获取分析结果，查看并订阅已发布的报表，实现零门槛的数据决策。',
      tag: 'default',
    },
  }

  const visibleUsers = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) => u.accountId.toLowerCase().includes(q) || u.accountName.toLowerCase().includes(q) || ROLE_META[u.role].name.toLowerCase().includes(q))
  }, [ROLE_META, keyword, users])

  const roleOptions = useMemo(
    () =>
      (
        [
          { value: 'Admin', label: ROLE_META.Admin.name },
          { value: 'Analyst', label: ROLE_META.Analyst.name },
          { value: 'Viewer', label: ROLE_META.Viewer.name },
        ] as const
      ).map((x) => ({ ...x, value: x.value as UserRole })),
    [ROLE_META],
  )

  const intro = useMemo(() => {
    if (mode === 'users') {
      return {
        title: '用户管理',
        desc: '集中管理系统用户信息，灵活配置角色权限，保障账号安全与系统合规。',
      }
    }
    return { title: t('intro.system.title'), desc: t('intro.system.desc') }
  }, [mode, t])

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageIntro title={intro.title} description={intro.desc} />
      {mode === 'users' ? (
        <Card size="small" styles={{ body: { padding: 0 } }}>
          <div
            style={{
              height: 56,
              paddingInline: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              borderBottom: `1px solid ${token.colorSplit}`,
            }}
          >
            <Input
              value={keyword}
              placeholder="搜索账号/角色"
              style={{ width: 280 }}
              allowClear
              prefix={<SearchOutlined />}
              onChange={(e) => setKeyword(e.target.value)}
            />

            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditing(null)
                  userForm.setFieldsValue({ accountId: '', accountName: '', role: 'Analyst' })
                  setUserOpen(true)
                }}
              >
                新建用户
              </Button>
            </Space>
          </div>

          <div style={{ padding: 16, paddingTop: 16 }}>
            <Table
              size="middle"
              tableLayout="fixed"
              dataSource={visibleUsers.map((u) => ({ ...u, key: u.id }))}
              pagination={{ pageSize: 8, showSizeChanger: true }}
              columns={[
                { title: '账号ID', dataIndex: 'accountId', key: 'accountId', width: 160, ellipsis: true },
                { title: '账号名', dataIndex: 'accountName', key: 'accountName', width: 180, ellipsis: true },
                {
                  title: '角色',
                  dataIndex: 'role',
                  key: 'role',
                  width: 140,
                  render: (v: UserRole) => (
                    <Tag color={ROLE_META[v].tag} style={{ marginInlineEnd: 0 }}>
                      {ROLE_META[v].name}
                    </Tag>
                  ),
                },
                {
                  title: '启用',
                  dataIndex: 'status',
                  key: 'status',
                  width: 120,
                  render: (_v: UserStatus, r: SystemUser) => (
                    <Switch checked={r.status === 'Active'} onChange={(checked) => updateUser(r.id, { status: checked ? 'Active' : 'Disabled' })} />
                  ),
                },
                {
                  title: '操作',
                  key: 'actions',
                  width: 120,
                  className: 'actionCol',
                  onHeaderCell: () => ({ className: 'actionCol' }),
                  onCell: () => ({ className: 'actionCol', style: { width: 120, minWidth: 120, maxWidth: 120 } }),
                  align: 'center' as const,
                  render: (_: unknown, r: SystemUser) => (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', columnGap: 2, width: '100%', justifyItems: 'center' }}>
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
                        className="iconOnly"
                        icon={<KeyOutlined />}
                        onClick={() => {
                          setResetTarget(r)
                        }}
                      />
                      <Button
                        type="text"
                        danger
                        className="iconOnly"
                        icon={<DeleteOutlined />}
                        onClick={() => {
                          setDeleteTarget(r)
                        }}
                      />
                    </div>
                  ),
                },
              ]}
            />
          </div>

          <Modal
            open={!!resetTarget}
            onCancel={() => setResetTarget(null)}
            centered
            width={380}
            destroyOnHidden
            title={<div style={{ paddingRight: 28, fontWeight: 800, fontSize: 18, lineHeight: 1.35 }}>重置密码</div>}
            okText="重置"
            cancelText="取消"
            onOk={() =>
              new Promise<void>((res) => {
                if (!resetTarget) {
                  res()
                  return
                }
                updateUser(resetTarget.id, { mustChangePassword: true })
                window.setTimeout(() => {
                  void message.success('已重置为初始密码：88888888')
                  setResetTarget(null)
                  res()
                }, 320)
              })
            }
          >
            <div style={{ color: token.colorTextSecondary, lineHeight: 1.75 }}>
              将用户“{resetTarget?.accountName ?? '-'}”密码重置为初始密码，并要求下次登录修改。
            </div>
          </Modal>

          <Modal
            open={!!deleteTarget}
            onCancel={() => setDeleteTarget(null)}
            centered
            width={380}
            destroyOnHidden
            title={<div style={{ paddingRight: 28, fontWeight: 800, fontSize: 18, lineHeight: 1.35 }}>删除用户</div>}
            okText="删除"
            okButtonProps={{ danger: true }}
            cancelText="取消"
            onOk={() =>
              new Promise<void>((res) => {
                if (!deleteTarget) {
                  res()
                  return
                }
                removeUser(deleteTarget.id)
                window.setTimeout(() => {
                  void message.success('已删除')
                  setDeleteTarget(null)
                  res()
                }, 280)
              })
            }
          >
            <div style={{ color: token.colorTextSecondary, lineHeight: 1.75 }}>将删除用户“{deleteTarget?.accountName ?? '-'}”。删除后不可恢复。</div>
          </Modal>

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
            {!editing ? (
              <div
                style={{
                  marginBottom: 12,
                  borderRadius: 12,
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: token.colorFillTertiary,
                  color: token.colorText,
                }}
              >
                <InfoCircleOutlined style={{ color: token.colorPrimary, fontSize: 16 }} />
                <span style={{ fontSize: 13, fontWeight: 650 }}>提示：初始密码为 88888888（首次登录需修改）</span>
              </div>
            ) : null}

            <Form form={userForm} layout="vertical">
              <Form.Item name="accountId" label="账号ID" rules={[{ required: true, message: t('validation.required') }]}>
                <Input placeholder="例如：zhangsan" />
              </Form.Item>
              <Form.Item name="accountName" label="账号名" rules={[{ required: true, message: t('validation.required') }]}>
                <Input placeholder="例如：张三" />
              </Form.Item>

              <Form.Item
                name="role"
                label={
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    角色
                    <InfoCircleOutlined
                      style={{ color: token.colorTextTertiary, fontSize: 12, cursor: 'pointer' }}
                      onClick={() => setRoleHelpOpen(true)}
                    />
                  </span>
                }
                rules={[{ required: true, message: t('validation.required') }]}
              >
                <Select options={roleOptions} />
              </Form.Item>
            </Form>
          </Modal>

          <Modal
            open={roleHelpOpen}
            onCancel={() => setRoleHelpOpen(false)}
            footer={null}
            centered
            width={920}
            destroyOnHidden
            title={<div style={{ paddingRight: 28, fontWeight: 800, fontSize: 18, lineHeight: 1.35 }}>角色说明</div>}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
              {([
                { k: 'Admin' as const, icon: <SafetyCertificateOutlined style={{ fontSize: 18 }} />, color: 'linear-gradient(135deg, rgba(43,92,246,0.26) 0%, rgba(43,92,246,0.06) 55%, rgba(20,24,33,0) 100%)' },
                { k: 'Analyst' as const, icon: <RadarChartOutlined style={{ fontSize: 18 }} />, color: 'linear-gradient(135deg, rgba(99,102,241,0.22) 0%, rgba(99,102,241,0.06) 55%, rgba(20,24,33,0) 100%)' },
                { k: 'Viewer' as const, icon: <UserOutlined style={{ fontSize: 18 }} />, color: 'linear-gradient(135deg, rgba(34,211,238,0.18) 0%, rgba(34,211,238,0.05) 55%, rgba(20,24,33,0) 100%)' },
              ] as const).map((it) => (
                <Card key={it.k} styles={{ body: { padding: 14 } }} style={{ borderRadius: 14, borderColor: token.colorSplit, background: token.colorBgContainer }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 14,
                        background: it.color,
                        border: `1px solid ${token.colorSplit}`,
                        display: 'grid',
                        placeItems: 'center',
                        fontWeight: 900,
                        color: token.colorText,
                      }}
                    >
                      {it.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 850, fontSize: 16, lineHeight: 1.2 }}>{ROLE_META[it.k].name}</div>
                    </div>
                  </div>
                  <div
                    title={ROLE_META[it.k].desc}
                      style={{
                      color: token.colorTextSecondary,
                      lineHeight: 1.7,
                        fontSize: 12,
                      display: '-webkit-box',
                        WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {ROLE_META[it.k].desc}
                  </div>
                </Card>
              ))}
            </div>
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
