import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { Sidebar } from './components/Sidebar'
import { Button, Dropdown, Form, Input, Layout, Modal, Space, message } from 'antd'
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
import SmartQueryPage from './pages/SmartQueryPage'
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

import { AppErrorBoundary, GlobalErrorOverlay } from './components/GlobalErrorOverlay'

type PageMeta = {
  title: string
}

export default function App() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()

  const [collapsed, setCollapsed] = useState(false)
  const isChatWorkspace =
    location.pathname.startsWith('/dashboard/chat-workspace') || location.pathname.startsWith('/dashboard/chat-workspace-studio-demo')
  const isLogin = location.pathname === '/login'
  const isSmartQuery = location.pathname.startsWith('/smart-query')
  const isStudio = location.pathname.startsWith('/dashboard/studio')
  const isStudioEditor = location.pathname === '/dashboard/studio/new' || /^\/dashboard\/studio\/[^/]+$/.test(location.pathname)
  const isStudioPreview = /^\/dashboard\/studio\/[^/]+\/preview$/.test(location.pathname)
  const isDashboardPreview = location.pathname === '/dashboard/preview'
  const isDashboardModule = location.pathname.startsWith('/dashboard') && !location.pathname.startsWith('/dashboard/chat') && !isChatWorkspace

  const [systemOpen, setSystemOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)

  const [pwdOpen, setPwdOpen] = useState(false)
  const [pwdForm] = Form.useForm<{ oldPassword: string; newPassword: string; confirmPassword: string }>()

  const themeMode = useAppStore((s) => s.themeMode)
  const locale = useAppStore((s) => s.locale)
  const setLocale = useAppStore((s) => s.setLocale)

  const isAuthed = useAuthStore((s) => s.isAuthed)
  const logout = useAuthStore((s) => s.logout)



  const pageMeta: PageMeta = useMemo(() => {
    if (location.pathname.startsWith('/smart-query')) return { title: '智能问数' }
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
    const showSidebar = !isChatWorkspace && !isLogin && !isSmartQuery
    const showHeader = !isChatWorkspace && !isLogin && !isStudio && !isSmartQuery
    document.body.classList.toggle('appModalInset', showHeader)
    document.body.style.setProperty('--app-sidebar-width', showSidebar ? (collapsed ? '72px' : '260px') : '0px')
    document.body.style.setProperty('--app-header-height', showHeader ? '56px' : '0px')
    return () => {
      document.body.classList.remove('appModalInset')
      document.body.style.removeProperty('--app-sidebar-width')
      document.body.style.removeProperty('--app-header-height')
    }
  }, [collapsed, isChatWorkspace, isLogin, isSmartQuery, isStudio])

  useEffect(() => {
    setCollapsed(isStudioEditor || isStudioPreview || isDashboardPreview)
  }, [isDashboardPreview, isStudioEditor, isStudioPreview])

  useEffect(() => {
    if (!isAuthed && location.pathname !== '/login') {
      navigate('/login', { replace: true })
      return
    }
    if (isAuthed && location.pathname === '/login') {
      navigate('/smart-query', { replace: true, state: { openWelcome: true } })
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
      {isChatWorkspace || isLogin || isStudio || isSmartQuery ? null : (
        <Layout.Header className="appHeader" style={{ height: 56, paddingInline: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
            <button type="button" className="appHeaderBrand" onClick={() => navigate('/dashboard')} aria-label="ChatBI">
              <AppLogoWordmark size={32} />
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
        {isChatWorkspace || isLogin || isSmartQuery ? null : <Sidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />}
        <Layout.Content
          className={isDashboardModule ? 'dashboardContentNoScrollbar' : undefined}
          style={{
            padding: isChatWorkspace || isLogin || isStudio || isSmartQuery ? 0 : 16,
            minHeight: 0,
            height: isChatWorkspace || isLogin || isStudio || isSmartQuery ? '100vh' : 'calc(100vh - 56px)',
            overflow: isLogin || isSmartQuery ? 'hidden' : isChatWorkspace ? 'visible' : isStudio ? 'hidden' : 'auto',
          }}
        >
          <Routes>
            <Route path="/" element={<Navigate to="/smart-query" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/smart-query" element={<SmartQueryPage />} />
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
