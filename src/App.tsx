import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { Sidebar } from './components/Sidebar'
import { Button, Dropdown, Form, Input, Layout, Modal, Space, Upload, message, theme } from 'antd'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import DashboardChatPage from './pages/DashboardChatPage'
import DashboardChatWorkspacePage from './pages/DashboardChatWorkspacePage'
import ChatConversationPage from './pages/ChatConversationPage'
import DashboardDetailPage from './pages/DashboardDetailPage'
import DashboardPreviewPage from './pages/DashboardPreviewPage'
import DashboardStudioPageV2 from './pages/DashboardStudioPageV2'
import DataSourcesPage from './pages/DataSourcesPage'
import KnowledgeBasePage from './pages/KnowledgeBasePage'
import NotFoundPage from './pages/NotFoundPage'
import SystemManagementPage from './pages/SystemManagementPage'
import LoginPage from './pages/LoginPage'
import { useTranslation } from 'react-i18next'
import { useAppStore } from './store/appStore'
import {
  BgColorsOutlined,
  CheckOutlined,
  GlobalOutlined,
  KeyOutlined,
  LogoutOutlined,
  MoonOutlined,
  SettingOutlined,
  SunOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { AppLogoWordmark } from './components/logo/AppLogoWordmark'
import { useAuthStore } from './store/authStore'
import { useSystemStore } from './store/systemStore'
import { AppLogoMark } from './components/logo/AppLogoMark'
import { AppErrorBoundary, GlobalErrorOverlay } from './components/GlobalErrorOverlay'

type PageMeta = {
  title: string
}

export default function App() {
  const { t } = useTranslation()
  const { token } = theme.useToken()
  const location = useLocation()
  const navigate = useNavigate()

  const [collapsed, setCollapsed] = useState(false)
  const isChatWorkspace =
    location.pathname.startsWith('/dashboard/chat-workspace') || location.pathname.startsWith('/dashboard/chat-workspace-studio-demo')
  const isLogin = location.pathname === '/login'
  const isStudio = location.pathname.startsWith('/dashboard/studio')
  const isStudioEditor = location.pathname === '/dashboard/studio/new' || /^\/dashboard\/studio\/[^/]+$/.test(location.pathname)
  const isDashboardModule = location.pathname.startsWith('/dashboard') && !location.pathname.startsWith('/dashboard/chat') && !isChatWorkspace

  const [systemOpen, setSystemOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)

  const [systemSettingsOpen, setSystemSettingsOpen] = useState(false)
  const [settingsName, setSettingsName] = useState('')
  const [settingsLogo, setSettingsLogo] = useState<string | null>(null)

  const [pwdOpen, setPwdOpen] = useState(false)
  const [pwdForm] = Form.useForm<{ oldPassword: string; newPassword: string; confirmPassword: string }>()

  const themeMode = useAppStore((s) => s.themeMode)
  const locale = useAppStore((s) => s.locale)
  const setLocale = useAppStore((s) => s.setLocale)

  const isAuthed = useAuthStore((s) => s.isAuthed)
  const logout = useAuthStore((s) => s.logout)

  const systemName = useSystemStore((s) => s.systemName)
  const logo = useSystemStore((s) => s.logoDataUrl)
  const setSystemName = useSystemStore((s) => s.setSystemName)
  const setLogo = useSystemStore((s) => s.setLogoDataUrl)

  const pageMeta: PageMeta = useMemo(() => {
    if (location.pathname.startsWith('/dashboard/chat')) return { title: t('dashboard.chat') }
    if (location.pathname.startsWith('/data-sources')) return { title: t('dataSources.title') }
    if (location.pathname.startsWith('/knowledge-base')) return { title: t('nav.knowledgeBase') }
    if (location.pathname.startsWith('/system')) return { title: t('system.title') }
    if (location.pathname.startsWith('/login')) return { title: 'Login' }
    return { title: t('nav.dashboard') }
  }, [location.pathname, t])

  useEffect(() => {
    document.title = `${pageMeta.title} - ChatBI`
  }, [pageMeta.title])

  useEffect(() => {
    const showSidebar = !isChatWorkspace && !isLogin
    const showHeader = !isChatWorkspace && !isLogin && !isStudio
    document.body.classList.toggle('appModalInset', showHeader)
    document.body.style.setProperty('--app-sidebar-width', showSidebar ? (collapsed ? '72px' : '260px') : '0px')
    document.body.style.setProperty('--app-header-height', showHeader ? '56px' : '0px')
    return () => {
      document.body.classList.remove('appModalInset')
      document.body.style.removeProperty('--app-sidebar-width')
      document.body.style.removeProperty('--app-header-height')
    }
  }, [collapsed, isChatWorkspace, isLogin, isStudio])

  useEffect(() => {
    setCollapsed(isStudioEditor)
  }, [isStudioEditor])

  useEffect(() => {
    if (!isAuthed && location.pathname !== '/login') {
      navigate('/login', { replace: true })
      return
    }
    if (isAuthed && location.pathname === '/login') {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthed, location.pathname, navigate])

  const systemMenuItems = useMemo(
    () => [
      { key: 'system:users', label: t('nav.systemUsers'), icon: <UserOutlined /> },
      { key: 'system:settings', label: t('nav.systemSettings'), icon: <SettingOutlined /> },
    ],
    [t],
  )

  const accountMenuItems = useMemo(
    () => [
      {
        key: 'lang',
        label: t('header.language'),
        icon: <GlobalOutlined />,
        children: [
          {
            key: 'lang:zh-CN',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <span>{locale === 'zh-CN' ? '中文' : 'Chinese'}</span>
                {locale === 'zh-CN' ? <CheckOutlined /> : null}
              </span>
            ),
          },
          {
            key: 'lang:en-US',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <span>{locale === 'zh-CN' ? '英文' : 'English'}</span>
                {locale === 'en-US' ? <CheckOutlined /> : null}
              </span>
            ),
          },
        ],
      },
      {
        key: 'theme',
        label: t('header.theme'),
        icon: <BgColorsOutlined />,
        children: [
          {
            key: 'theme:light',
            icon: <SunOutlined />,
            label: (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <span>{locale === 'zh-CN' ? '浅色' : 'Light'}</span>
                {themeMode === 'light' ? <CheckOutlined /> : null}
              </span>
            ),
          },
          {
            key: 'theme:dark',
            icon: <MoonOutlined />,
            label: (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <span>{locale === 'zh-CN' ? '深色' : 'Dark'}</span>
                {themeMode === 'dark' ? <CheckOutlined /> : null}
              </span>
            ),
          },
        ],
      },
      { type: 'divider' as const },
      { key: 'account:password', label: t('header.changePassword'), icon: <KeyOutlined /> },
      { key: 'account:logout', label: t('header.logout'), icon: <LogoutOutlined /> },
    ],
    [locale, t, themeMode],
  )

  return (
    <AppErrorBoundary>
      <GlobalErrorOverlay>
        <Layout className={isChatWorkspace ? 'appRoot chatWorkspace' : 'appRoot'}>
      {isChatWorkspace || isLogin || isStudio ? null : (
        <Layout.Header className="appHeader" style={{ height: 56, paddingInline: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
            <button type="button" className="appHeaderBrand" onClick={() => navigate('/dashboard')} aria-label="ChatBI">
              {logo ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                  <img
                    src={logo}
                    alt={systemName}
                    style={{ width: 32, height: 32, aspectRatio: '1 / 1', borderRadius: 12, objectFit: 'contain', flex: 'none' }}
                  />
                  <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: 0.2 }}>{systemName}</span>
                </div>
              ) : systemName === 'ChatBI' ? (
                <AppLogoWordmark size={36} fontSize={24} />
              ) : (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                  <AppLogoMark size={32} />
                  <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: 0.2 }}>{systemName}</span>
                </div>
              )}
            </button>
          </div>

          <Space size={10} align="center" className="appHeaderRight">
            <Dropdown
              menu={{
                items: systemMenuItems,
                onClick: ({ key }) => {
                  if (key === 'system:users') navigate('/system/users')
                  if (key === 'system:settings') {
                    setSystemOpen(false)
                    setSettingsName(systemName)
                    setSettingsLogo(logo)
                    setSystemSettingsOpen(true)
                  }
                },
              }}
              trigger={['hover', 'click']}
              open={systemOpen}
              onOpenChange={setSystemOpen}
              mouseEnterDelay={0.05}
              mouseLeaveDelay={0.08}
              placement="bottomRight"
              overlayStyle={{ zIndex: 9999 }}
              overlayClassName="headerMenu"
              getPopupContainer={() => document.body}
            >
              <Button type="text" className="appHeaderIconButton" aria-label={t('header.system')} title={t('header.system')}>
                <SettingOutlined style={{ fontSize: 18 }} />
              </Button>
            </Dropdown>

            <Dropdown
              menu={{
                items: accountMenuItems,
                onClick: ({ key }) => {
                  if (key === 'account:logout') {
                    logout()
                    navigate('/login', { replace: true })
                  }
                  if (key === 'account:password') {
                    setPwdOpen(true)
                    pwdForm.resetFields()
                  }
                  if (key === 'theme:light') useAppStore.getState().setThemeMode('light')
                  if (key === 'theme:dark') useAppStore.getState().setThemeMode('dark')
                  if (key === 'lang:zh-CN') setLocale('zh-CN')
                  if (key === 'lang:en-US') setLocale('en-US')
                },
              }}
              trigger={['hover', 'click']}
              open={accountOpen}
              onOpenChange={setAccountOpen}
              mouseEnterDelay={0.05}
              mouseLeaveDelay={0.08}
              placement="bottomRight"
              overlayStyle={{ zIndex: 9999 }}
              overlayClassName="headerMenu"
              getPopupContainer={() => document.body}
            >
              <Button type="text" className="appHeaderIconButton" aria-label={t('header.user')} title={t('header.user')}>
                <UserOutlined style={{ fontSize: 18 }} />
              </Button>
            </Dropdown>
          </Space>
        </Layout.Header>
      )}

      <Layout style={{ minHeight: 0 }}>
        {isChatWorkspace || isLogin ? null : <Sidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />}
        <Layout.Content
          className={isDashboardModule ? 'dashboardContentNoScrollbar' : undefined}
          style={{
            padding: isChatWorkspace || isLogin || isStudio ? 0 : 16,
            minHeight: 0,
            height: isChatWorkspace || isLogin || isStudio ? '100vh' : 'calc(100vh - 56px)',
            overflow: isLogin ? 'hidden' : isChatWorkspace ? 'visible' : isStudio ? 'hidden' : 'auto',
          }}
        >
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard/chat" element={<DashboardChatPage />} />
            <Route path="/dashboard/chat-workspace" element={<DashboardChatWorkspacePage />} />
            <Route path="/dashboard/chat-workspace-studio-demo" element={<DashboardChatWorkspacePage />} />
            <Route path="/chat/:conversationId" element={<ChatConversationPage />} />
            <Route path="/dashboard/studio/new" element={<DashboardStudioPageV2 mode="new" />} />
            <Route path="/dashboard/studio/:id/preview" element={<DashboardStudioPageV2 mode="preview" />} />
            <Route path="/dashboard/studio/:id" element={<DashboardStudioPageV2 mode="edit" />} />
            <Route path="/dashboard/preview" element={<DashboardPreviewPage />} />
            <Route path="/dashboard/detail" element={<DashboardDetailPage />} />
            <Route path="/dashboard" element={<DashboardPage refreshKey={0} />} />
            <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
            <Route path="/data-sources" element={<DataSourcesPage />} />
            <Route path="/data-sources/:id" element={<DataSourcesPage />} />
            <Route path="/system/users" element={<SystemManagementPage mode="users" />} />
            <Route path="/system/settings" element={<Navigate to="/system/users" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout.Content>
      </Layout>

      <Modal
        open={systemSettingsOpen}
        title={<div style={{ paddingRight: 28, fontWeight: 800, fontSize: 18, lineHeight: 1.35 }}>系统设置</div>}
        centered
        width={720}
        destroyOnHidden
        onCancel={() => setSystemSettingsOpen(false)}
        okText={t('actions.save')}
        cancelText={t('actions.cancel')}
        onOk={async () => {
          const nextName = String(settingsName ?? '').trim()
          if (!nextName) {
            void message.error(t('validation.required'))
            return
          }
          setSystemName(nextName)
          setLogo(settingsLogo)
          await new Promise((r) => setTimeout(r, 250))
          void message.success('已保存')
          setSystemSettingsOpen(false)
        }}
      >
        <Form layout="vertical">
          <Form.Item label="系统名称" required>
            <Input value={settingsName} onChange={(e) => setSettingsName(e.target.value)} placeholder="例如：ChatBI" />
          </Form.Item>

          <Form.Item label="系统 Logo" required>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  border: `1px solid ${token.colorSplit}`,
                  background: token.colorFillTertiary,
                  display: 'grid',
                  placeItems: 'center',
                  overflow: 'hidden',
                  flex: 'none',
                }}
              >
                {settingsLogo ? <img src={settingsLogo} alt={settingsName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <AppLogoMark size={34} />}
              </div>

              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Upload
                  accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                  maxCount={1}
                  showUploadList={false}
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
                      setSettingsLogo(dataUrl)
                      void message.success('已选择新图标')
                    }
                    reader.readAsDataURL(f)
                  }}
                >
                  <Button type="default" size="small" style={{ alignSelf: 'flex-start', opacity: 0.82 }}>
                    更换图标
                  </Button>
                </Upload>
                {settingsLogo ? (
                  <Button
                    type="link"
                    size="small"
                    style={{ alignSelf: 'flex-start', paddingInline: 0, height: 22, opacity: 0.82 }}
                    onClick={() => setSettingsLogo(null)}
                  >
                    恢复默认
                  </Button>
                ) : null}
                <div style={{ fontSize: 12, color: token.colorTextSecondary }}>建议尺寸 48×48 px 以内；支持 PNG、JPG 格式；文件大小不超过 200KB。</div>
              </div>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={pwdOpen}
        title={t('header.changePassword')}
        onCancel={() => setPwdOpen(false)}
        okText={t('actions.save')}
        cancelText={t('actions.cancel')}
        onOk={async () => {
          try {
            const v = await pwdForm.validateFields()
            if (String(v.newPassword) !== String(v.confirmPassword)) {
              void message.error(t('account.passwordMismatch'))
              return
            }
            await new Promise((r) => setTimeout(r, 450))
            void message.success(t('account.passwordUpdated'))
            pwdForm.resetFields()
            setPwdOpen(false)
          } catch {
          }
        }}
      >
        <Form form={pwdForm} layout="vertical">
          <Form.Item name="oldPassword" label={t('account.oldPassword')} rules={[{ required: true, message: t('validation.required') }]}>
            <Input.Password placeholder="******" />
          </Form.Item>
          <Form.Item name="newPassword" label={t('account.newPassword')} rules={[{ required: true, message: t('validation.required') }]}>
            <Input.Password placeholder="******" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label={t('account.confirmPassword')}
            rules={[{ required: true, message: t('validation.required') }]}
          >
            <Input.Password placeholder="******" />
          </Form.Item>
        </Form>
      </Modal>
        </Layout>
      </GlobalErrorOverlay>
    </AppErrorBoundary>
  )
}
