import {
  CheckOutlined,
  CloseOutlined,
  CodeOutlined,
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  GlobalOutlined,
  KeyOutlined,
  LikeOutlined,
  DislikeOutlined,
  LogoutOutlined,
  MoreOutlined,
  MoonOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
  StopOutlined,
  SunOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Button, Dropdown, Empty, Form, Input, Modal, Popover, Radio, Space, Table, Tabs, Tooltip, Typography, Upload, message, theme } from 'antd'
import { ArrowUp, ArrowUpRight, Copy, Download, PanelLeftClose, PanelLeftOpen, Paperclip, Share2, ThumbsUp } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import type { EChartsOption } from 'echarts'
import { AppLogoWordmark } from '../components/logo/AppLogoWordmark'
import { DatasetPreviewModal } from '../components/DatasetPreviewModal'
import { DataTableIcon, DataTableSearchIcon } from '../components/icons/DataTableIcon'
import { CHART_TYPE_ICONS, CHART_TYPE_LABELS, type ChartTypeKey } from '../components/icons/ChartTypeIcons'
import { EChart } from '../components/EChart'
import { VirtualAvatar } from '../components/VirtualAvatar'
import { ChatRichText } from './chat/ChatRichText'
import { useAppStore } from '../store/appStore'
import { useAuthStore } from '../store/authStore'
import {
  downloadText,
  nowId,
  toCsv,
  type ChatMessage,
  type MessageResult,
} from './chat/chatUtils'
import { buildAutomotiveMockResult } from './chat/automotiveMock'
import { canonicalQuestion, localizeAutomotiveResult, questionText, QUESTIONS_ZH } from './chat/smartQueryLocale'
import { CHART_PALETTES } from './studioModel'
import './SmartQueryPage.css'

type QuerySession = {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  model: string
  dataSourceId?: string
  attachmentName?: string
  messages: ChatMessage[]
  results: Record<string, MessageResult>
}

const STORAGE_KEY = 'chatbi-smart-query-sessions-v1'
const ACTIVE_KEY = 'chatbi-smart-query-active-v1'
const MODELS = [
  { key: 'deepseek-v3', label: 'DeepSeek-V3', logoUrl: '/vendor/deepseek.png' },
  { key: 'deepseek-r1', label: 'DeepSeek-R1', logoUrl: '/vendor/deepseek.png' },
  { key: 'qwen3.6', label: 'Qwen3.6', logoUrl: '/vendor/Qwen.png' },
]
const QUICK_QUESTIONS = [...QUESTIONS_ZH]
const DATASETS = [
  { id: 'aas_sample_dataset', name: 'AAS-Sample Data Set', description: '客户车辆销售、库存、预留、交付与利润数据' },
  { id: 'vehicle_inventory', name: '车辆库存', description: '库存状态、库龄、分公司与车辆类型' },
  { id: 'vehicle_reservations', name: '车辆预订', description: '预订日期、有效期、品牌与车型' },
  { id: 'vehicle_delivery', name: '车辆交付', description: '订单确认、交付日期与交付状态' },
  { id: 'customer_enquiries', name: '客户询价', description: '询价来源、意向品牌与跟进状态' },
]
const WORKBENCH_URL = import.meta.env.VITE_WORKBENCH_URL || '/dashboard'

function createSession(): QuerySession {
  const now = Date.now()
  return { id: nowId(), name: '新会话', createdAt: now, updatedAt: now, model: MODELS[0].key, messages: [], results: {} }
}

function createDemoSession(id: string, name: string, daysAgo: number): QuerySession {
  const timestamp = Date.now() - daysAgo * 86400000
  return { id, name, createdAt: timestamp, updatedAt: timestamp, model: MODELS[0].key, messages: [], results: {} }
}

function loadSessions(): QuerySession[] {
  const demos = [
    createDemoSession('smart-query-demo-recent', 'BMW 5 系近半年销量', 3),
    createDemoSession('smart-query-demo-earlier', '各品牌库存车辆分析', 18),
  ]
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    if (Array.isArray(parsed) && parsed.length) {
      const legacyNames: Record<string, string> = {
        '今天新增用户数是多少？': '当前库存车辆总数是多少？',
        '本周核心指标表现如何？': '2024 年 BMW 3 系销量',
        '近 7 天业务指标趋势': 'BMW 5 系近半年销量',
        '上月用户增长分析': '各品牌库存车辆分析',
      }
      const sessions = (parsed as QuerySession[]).map((session) => {
        if (session.id === 'smart-query-demo-recent') return { ...session, name: 'BMW 5 系近半年销量' }
        if (session.id === 'smart-query-demo-earlier') return { ...session, name: '各品牌库存车辆分析' }
        if (legacyNames[session.name]) return { ...session, name: legacyNames[session.name], messages: [], results: {} }
        const results = { ...session.results }
        const messages = session.messages.map((message, index) => {
          if (message.role === 'user') return { ...message, dataSourceId: message.dataSourceId ?? session.dataSourceId }
          if (results[message.id]?.status !== 'done') return message
          const question = [...session.messages.slice(0, index)].reverse().find((item) => item.role === 'user')?.content ?? ''
          if (!/车辆|库存|bmw|land rover|利润|预留|预订|到货|运输|新车|二手|制造商|开票|亏损|g60|x7/i.test(question)) return message
          const refreshed = buildAutomotiveMockResult(question)
          results[message.id] = { ...refreshed, tookMs: results[message.id].tookMs }
          return { ...message, content: refreshed.answerText }
        })
        return { ...session, dataSourceId: session.dataSourceId === 'vehicle_sales' ? 'aas_sample_dataset' : session.dataSourceId, messages, results }
      })
      return [...sessions, ...demos.filter((demo) => !sessions.some((session) => session.id === demo.id))]
    }
  } catch {
    // Invalid local data falls back to a clean first session.
  }
  return [createSession(), ...demos]
}

function groupLabel(timestamp: number) {
  const now = new Date()
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  if (timestamp >= startToday) return '今天'
  if (timestamp >= startToday - 6 * 86400000) return '最近 7 天'
  return '更早'
}

export default function SmartQueryPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const themeMode = useAppStore((state) => state.themeMode)
  const locale = useAppStore((state) => state.locale)
  const en = locale === 'en-US'
  const logout = useAuthStore((state) => state.logout)
  const [initialPageState] = useState(() => {
    const storedSessions = loadSessions()
    const openWelcome = Boolean((location.state as { openWelcome?: boolean } | null)?.openWelcome)
    if (!openWelcome) return { sessions: storedSessions, activeId: localStorage.getItem(ACTIVE_KEY) ?? '' }
    const welcomeSession = createSession()
    return { sessions: [welcomeSession, ...storedSessions], activeId: welcomeSession.id }
  })
  const [sessions, setSessions] = useState<QuerySession[]>(initialPageState.sessions)
  const [activeId, setActiveId] = useState(initialPageState.activeId)
  const [search, setSearch] = useState('')
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const [sqlOpen, setSqlOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [dataPreviewOpen, setDataPreviewOpen] = useState(false)
  const [previewTable, setPreviewTable] = useState('aas_sample_dataset')
  const [uploadedRows, setUploadedRows] = useState<Array<Record<string, unknown>> | undefined>(undefined)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<QuerySession | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [renameError, setRenameError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<QuerySession | null>(null)
  const [passwordForm] = Form.useForm<{ oldPassword: string; newPassword: string; confirmPassword: string }>()
  const listRef = useRef<HTMLDivElement | null>(null)
  const timerRef = useRef<number | null>(null)

  const active = sessions.find((session) => session.id === activeId) ?? sessions[0]

  useEffect(() => {
    if (!activeId && sessions[0]) setActiveId(sessions[0].id)
  }, [activeId, sessions])

  useEffect(() => {
    if ((location.state as { openWelcome?: boolean } | null)?.openWelcome) {
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.pathname, location.state, navigate])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  }, [sessions])

  useEffect(() => {
    if (active?.id) localStorage.setItem(ACTIVE_KEY, active.id)
  }, [active?.id])

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTo({ top: el.scrollHeight })
  }, [active?.messages.length, sending])

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
  }, [])

  const updateActive = (updater: (session: QuerySession) => QuerySession) => {
    if (!active) return
    setSessions((previous) => previous.map((session) => (session.id === active.id ? updater(session) : session)))
  }

  const newSession = () => {
    const session = createSession()
    setSessions((previous) => [session, ...previous])
    setActiveId(session.id)
    setInput('')
    setSending(false)
    setPendingId(null)
  }

  const removeSession = (session: QuerySession) => {
    setDeleteTarget(session)
  }

  const renameSession = (session: QuerySession) => {
    setRenameTarget(session)
    setRenameValue(session.name)
    setRenameError('')
  }

  const send = (raw: string) => {
    if (!active || sending) return
    const question = raw.trim()
    if (!question) return
    const assistantId = nowId()
    const userMessage: ChatMessage = { id: nowId(), role: 'user', content: question, at: Date.now(), dataSourceId: active.dataSourceId }
    const assistantMessage: ChatMessage = { id: assistantId, role: 'assistant', content: en ? 'Analyzing...' : '正在分析问题...', at: Date.now() }
    setInput('')
    setSending(true)
    setPendingId(assistantId)
    updateActive((session) => ({
      ...session,
      name: session.messages.some((item) => item.role === 'user') ? session.name : question.replace(/\s+/g, ' ').slice(0, 18),
      updatedAt: Date.now(),
      messages: [...session.messages, userMessage, assistantMessage],
      results: { ...session.results, [assistantId]: { status: 'running', answerText: en ? 'Analyzing...' : '正在分析问题...' } },
    }))
    const startedAt = Date.now()
    timerRef.current = window.setTimeout(() => {
      const result = buildAutomotiveMockResult(question)
      const complete = { ...result, status: result.status === 'clarifying' ? 'clarifying' as const : 'done' as const, tookMs: Date.now() - startedAt }
      setSessions((previous) => previous.map((session) => session.id === active.id ? {
        ...session,
        updatedAt: Date.now(),
        messages: session.messages.map((item) => item.id === assistantId ? { ...item, content: complete.answerText, at: Date.now() } : item),
        results: { ...session.results, [assistantId]: complete },
      } : session))
      setView(complete.chart || complete.metric ? 'chart' : 'table')
      setSending(false)
      setPendingId(null)
      timerRef.current = null
    }, 2200)
  }

  const stop = () => {
    if (!pendingId || !active) return
    if (timerRef.current) window.clearTimeout(timerRef.current)
    const id = pendingId
    updateActive((session) => ({
      ...session,
      updatedAt: Date.now(),
      messages: session.messages.map((item) => item.id === id ? { ...item, content: en ? 'Stopped' : '已停止' } : item),
      results: { ...session.results, [id]: { status: 'stopped', answerText: en ? 'Stopped' : '已停止' } },
    }))
    setSending(false)
    setPendingId(null)
    timerRef.current = null
  }

  const latestResultEntry = useMemo(() => {
    if (!active) return undefined
    return [...active.messages].reverse().map((item) => [item.id, active.results[item.id]] as const).find(([, result]) => result)
  }, [active])
  const latestResult = latestResultEntry?.[1]

  const exportCsv = (result: MessageResult) => {
    if (!result.table) return
    const title = active ? questionText(active.name, locale) : (en ? 'Result' : '结果')
    downloadText(`${en ? 'Smart-Query' : '智能问数'}-${title}.csv`, toCsv(result.table.columns, result.table.rows), 'text/csv;charset=utf-8')
  }

  const openBuiltInPreview = () => {
    setUploadedRows(undefined)
    setPreviewTable(active?.dataSourceId || 'aas_sample_dataset')
    setDataPreviewOpen(true)
  }

  const openAttachment = async (file: File) => {
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' }).slice(0, 100)
      if (!rows.length) {
        void message.warning(en ? 'The file contains no previewable data' : '文件中没有可预览的数据')
        return
      }
      const table = file.name.replace(/\.[^.]+$/, '') || 'uploaded_data'
      updateActive((session) => ({ ...session, attachmentName: file.name, dataSourceId: table, updatedAt: Date.now() }))
      setUploadedRows(rows)
      setPreviewTable(table)
      setDataPreviewOpen(true)
    } catch {
      void message.error(en ? 'Failed to parse the file. Check its format.' : '文件解析失败，请检查文件格式')
    }
  }

  const reopenAttachment = () => {
    if (!uploadedRows?.length) {
      void message.info(en ? 'Select the local file again to preview it after refreshing the page' : '刷新页面后需要重新选择本地文件才能预览内容')
      return
    }
    setDataPreviewOpen(true)
  }

  const filtered = sessions
    .filter((session) => questionText(session.name, locale).toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => b.updatedAt - a.updatedAt)
  const groups = ['今天', '最近 7 天', '更早']

  return (
    <div className={`smartQueryRoot ${sidebarCollapsed ? 'sidebarCollapsed' : ''} ${en ? 'isEnglish' : ''}`}>
      <aside className="smartQuerySidebar">
        <div className="smartQueryBrand">
          {!sidebarCollapsed ? <AppLogoWordmark size={30} fontSize={20} /> : null}
          <Tooltip title={sidebarCollapsed ? (en ? 'Expand conversations' : '展开会话列表') : (en ? 'Collapse conversations' : '收起会话列表')}>
            <Button type="text" className="smartQueryCollapse" icon={sidebarCollapsed ? <PanelLeftOpen size={16} strokeWidth={1.25} /> : <PanelLeftClose size={16} strokeWidth={1.25} />} onClick={() => setSidebarCollapsed((value) => !value)} />
          </Tooltip>
        </div>
        <Tooltip title={sidebarCollapsed ? (en ? 'New conversation' : '新建会话') : undefined} placement="right">
          <Button type="primary" block icon={<PlusOutlined />} onClick={newSession}>{sidebarCollapsed ? null : (en ? 'New conversation' : '新建会话')}</Button>
        </Tooltip>
        {!sidebarCollapsed ? <Input className="smartQuerySearch" allowClear prefix={<SearchOutlined />} placeholder={en ? 'Search conversations' : '搜索会话'} value={search} onChange={(event) => setSearch(event.target.value)} /> : null}
        {!sidebarCollapsed ? <div className="smartQuerySessions">
              {filtered.length ? groups.map((group) => (
            <section key={group}>
              <div className="smartQueryGroupLabel">{en ? ({ 今天: 'Today', '最近 7 天': 'Last 7 days', 更早: 'Earlier' } as Record<string, string>)[group] : group}</div>
              {filtered.filter((session) => groupLabel(session.updatedAt) === group).map((session) => (
                <div
                  key={session.id}
                  role="button"
                  tabIndex={0}
                  className={`smartQuerySession ${session.id === active?.id ? 'isActive' : ''}`}
                  onClick={() => setActiveId(session.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') setActiveId(session.id)
                  }}
                >
                  <span className="smartQuerySessionName">{session.name === '新会话' && en ? 'New conversation' : questionText(session.name, locale)}</span>
                  <Dropdown trigger={['click']} menu={{ items: [
                    { key: 'rename', icon: <EditOutlined />, label: en ? 'Rename' : '重命名' },
                    { key: 'delete', icon: <DeleteOutlined />, label: en ? 'Delete' : '删除' },
                  ], onClick: ({ key, domEvent }) => { domEvent.stopPropagation(); if (key === 'rename') renameSession(session); else removeSession(session) } }}>
                    <Button type="text" size="small" icon={<MoreOutlined />} onClick={(event) => event.stopPropagation()} />
                  </Dropdown>
                </div>
              ))}
            </section>
          )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={en ? 'No matching conversations' : '没有匹配的会话'} />}
        </div> : <div className="smartQueryCollapsedRail" />}
        <div className="smartQuerySidebarFooter">
          <Tooltip title={sidebarCollapsed ? (en ? 'Go to workspace' : '前往工作台') : undefined} placement="right">
            <button className="smartQueryFooterAction" onClick={() => window.location.assign(WORKBENCH_URL)}>
              <CodeOutlined /><span>{en ? 'Go to workspace' : '前往工作台'}</span><ArrowUpRight className="smartQueryWorkbenchArrow" size={15} strokeWidth={1.35} />
            </button>
          </Tooltip>
          <div className="smartQueryAccountArea">
          <Dropdown placement="topLeft" trigger={['click']} menu={{ items: [
            { key: 'theme', icon: <SettingOutlined />, label: en ? 'Theme' : '主题', children: [
              { key: 'theme:light', icon: <SunOutlined />, label: en ? 'Light' : '浅色', extra: themeMode === 'light' ? <CheckOutlined /> : null },
              { key: 'theme:dark', icon: <MoonOutlined />, label: en ? 'Dark' : '深色', extra: themeMode === 'dark' ? <CheckOutlined /> : null },
            ] },
            { key: 'language', icon: <GlobalOutlined />, label: en ? 'Language' : '语言', children: [
              { key: 'lang:zh-CN', label: '中文', extra: locale === 'zh-CN' ? <CheckOutlined /> : null },
              { key: 'lang:en-US', label: 'English', extra: locale === 'en-US' ? <CheckOutlined /> : null },
            ] },
            { type: 'divider' },
            { key: 'account:password', icon: <KeyOutlined />, label: en ? 'Change password' : '修改密码' },
            { key: 'logout', icon: <LogoutOutlined />, label: en ? 'Sign out' : '退出登录', danger: true },
          ], onClick: ({ key }) => {
            if (key === 'theme:light') useAppStore.getState().setThemeMode('light')
            if (key === 'theme:dark') useAppStore.getState().setThemeMode('dark')
            if (key === 'lang:zh-CN') useAppStore.getState().setLocale('zh-CN')
            if (key === 'lang:en-US') useAppStore.getState().setLocale('en-US')
            if (key === 'account:password') { passwordForm.resetFields(); setPasswordOpen(true) }
            if (key === 'logout') { logout(); navigate('/login', { replace: true }) }
          } }}>
            <button className="smartQueryAccount"><span className="smartQueryAccountAvatar"><UserOutlined style={{ fontSize: 18 }} /></span><span className="smartQueryAccountText">admin</span></button>
          </Dropdown>
          </div>
        </div>
      </aside>

      <main className="smartQueryMain">
        {active?.messages.length ? <header className="smartQueryHeader">
          <div><Typography.Title level={4} style={{ margin: 0 }}>{active ? (active.name === '新会话' && en ? 'New conversation' : questionText(active.name, locale)) : (en ? 'Smart Query' : '智能问数')}</Typography.Title></div>
        </header> : null}

        <div className="smartQueryThread" ref={listRef}>
          {!active?.messages.length ? (
            <div className="smartQueryWelcome">
              <div className="smartQueryWelcomeIntro">
                <SmartQueryWelcomeAvatar />
                <Typography.Title level={3}><TypewriterText text={en ? 'Hello, I am your AI data analyst' : '你好，我是你的超级数据分析师'} /></Typography.Title>
              </div>
              <Composer
                large
                input={input}
                sending={sending}
                model={active.model}
                dataSourceId={active.dataSourceId}
                attachmentName={active.attachmentName}
                onInput={setInput}
                onModel={(model) => updateActive((session) => ({ ...session, model, updatedAt: Date.now() }))}
                onDataSelect={(dataSourceId) => updateActive((session) => ({ ...session, dataSourceId, attachmentName: undefined, updatedAt: Date.now() }))}
                onDataPreview={openBuiltInPreview}
                onDataRemove={() => updateActive((session) => ({ ...session, dataSourceId: undefined, updatedAt: Date.now() }))}
                onAttachment={openAttachment}
                onAttachmentPreview={reopenAttachment}
                onAttachmentRemove={() => updateActive((session) => ({ ...session, attachmentName: undefined, dataSourceId: undefined, updatedAt: Date.now() }))}
                onSend={send}
                onStop={stop}
              />
            </div>
          ) : (
            <div className="smartQueryMessages">
              {active.messages.map((item) => {
                const result = active.results[item.id]
                const question = item.role === 'assistant' ? [...active.messages].slice(0, active.messages.indexOf(item)).reverse().find((message) => message.role === 'user')?.content ?? active.name : ''
                const localizedResult = result?.status === 'done' ? localizeAutomotiveResult(question, result, locale) : result
                return <div key={item.id} className={`smartQueryMessage ${item.role}`}>
                  {item.role === 'assistant' ? <VirtualAvatar size={32} transparent /> : null}
                  <div className="smartQueryMessageBody">
                    {item.role === 'assistant' && result?.status === 'running' ? <div className="llmOutputBox smartQueryRunning"><SparkleIcon /><span>{en ? 'Analyzing...' : '正在分析问题...'}</span></div> : null}
                    {item.role === 'user' ? <UserQueryMessage item={item} /> : null}
                    {item.role === 'assistant' && (!result || (result.status !== 'running' && result.status !== 'done')) ? <div className="smartQueryBubble"><ChatRichText text={item.content} /></div> : null}
                    {item.role === 'assistant' && localizedResult?.status === 'done' ? <><ResultBlock question={questionText(question, locale)} result={localizedResult} view={view} onView={setView} onSql={() => setSqlOpen(true)} /><MessageActions content={localizedResult.answerText} result={localizedResult} onExport={() => exportCsv(localizedResult)} at={item.at} /><FollowUpQuestions question={question} onSend={send} /></> : null}
                  </div>
                </div>
              })}
            </div>
          )}
        </div>

        {active?.messages.length ? <footer className="smartQueryComposer"><Composer showQuick input={input} sending={sending} model={active.model} dataSourceId={active.dataSourceId} attachmentName={active.attachmentName} onInput={setInput} onModel={(model) => updateActive((session) => ({ ...session, model, updatedAt: Date.now() }))} onDataSelect={(dataSourceId) => updateActive((session) => ({ ...session, dataSourceId, attachmentName: undefined, updatedAt: Date.now() }))} onDataPreview={openBuiltInPreview} onDataRemove={() => updateActive((session) => ({ ...session, dataSourceId: undefined, updatedAt: Date.now() }))} onAttachment={openAttachment} onAttachmentPreview={reopenAttachment} onAttachmentRemove={() => updateActive((session) => ({ ...session, attachmentName: undefined, dataSourceId: undefined, updatedAt: Date.now() }))} onSend={send} onStop={stop} /><div className="smartQueryHint">{en ? 'AI-generated content. Verify important data.' : '内容由 AI 生成，请核对重要数据'}</div></footer> : null}
      </main>

      <Modal centered open={sqlOpen} title={en ? 'AI query process' : 'AI取数过程'} width="min(940px, calc(100vw - 48px))" okText={en ? 'OK' : '确定'} cancelButtonProps={{ style: { display: 'none' } }} onCancel={() => setSqlOpen(false)} onOk={() => setSqlOpen(false)}>
        <Tabs className="smartQuerySqlTabs" items={[{ key: 'logic', label: en ? 'Business logic SQL' : '业务逻辑SQL', children: <pre className="smartQuerySql">{latestResult?.sql ?? (en ? 'No SQL' : '暂无 SQL')}</pre> }, { key: 'execute', label: en ? 'Execution SQL' : '执行SQL', children: <pre className="smartQuerySql">{latestResult?.sql ?? (en ? 'No SQL' : '暂无 SQL')}</pre> }]} />
      </Modal>
      <Modal centered open={Boolean(renameTarget)} title={en ? 'Rename conversation' : '重命名会话'} okText={en ? 'Save' : '保存'} cancelText={en ? 'Cancel' : '取消'} onCancel={() => setRenameTarget(null)} onOk={() => {
        const name = renameValue.trim()
        if (!name) { setRenameError(en ? 'Enter a conversation name' : '请输入会话名称'); return }
        setSessions((previous) => previous.map((item) => item.id === renameTarget?.id ? { ...item, name, updatedAt: Date.now() } : item))
        setRenameTarget(null)
      }}>
        <Input autoFocus maxLength={40} status={renameError ? 'error' : undefined} value={renameValue} onChange={(event) => { setRenameValue(event.target.value); if (event.target.value.trim()) setRenameError('') }} onPressEnter={() => {
          const name = renameValue.trim()
          if (!name) { setRenameError(en ? 'Enter a conversation name' : '请输入会话名称'); return }
          setSessions((previous) => previous.map((item) => item.id === renameTarget?.id ? { ...item, name, updatedAt: Date.now() } : item))
          setRenameTarget(null)
        }} />
        {renameError ? <Typography.Text type="danger">{renameError}</Typography.Text> : null}
      </Modal>
      <Modal centered open={Boolean(deleteTarget)} title={en ? 'Delete conversation' : '删除会话'} okText={en ? 'Delete' : '删除'} cancelText={en ? 'Cancel' : '取消'} onCancel={() => setDeleteTarget(null)} onOk={() => {
        if (!deleteTarget) return
        setSessions((previous) => {
          const next = previous.filter((item) => item.id !== deleteTarget.id)
          if (activeId === deleteTarget.id) setActiveId(next[0]?.id ?? '')
          return next.length ? next : [createSession()]
        })
        setDeleteTarget(null)
      }}>
        {en ? `Delete “${deleteTarget?.name ?? ''}”? This cannot be undone.` : `确认删除“${deleteTarget?.name ?? ''}”吗？删除后不可恢复。`}
      </Modal>
      <DatasetPreviewModal open={dataPreviewOpen} onClose={() => setDataPreviewOpen(false)} tables={[previewTable]} initialActive={previewTable} previewRows={uploadedRows} hideTableList zIndex={2500} />
      <Modal open={passwordOpen} title={en ? 'Change password' : '修改密码'} okText={en ? 'Save' : '保存'} cancelText={en ? 'Cancel' : '取消'} onCancel={() => setPasswordOpen(false)} onOk={async () => { const values = await passwordForm.validateFields(); if (values.newPassword !== values.confirmPassword) { void message.error(en ? 'The new passwords do not match' : '两次输入的新密码不一致'); return } void message.success(en ? 'Password updated' : '密码修改成功'); setPasswordOpen(false) }}>
        <Form form={passwordForm} layout="vertical"><Form.Item name="oldPassword" label={en ? 'Current password' : '原密码'} rules={[{ required: true, message: en ? 'Enter your current password' : '请输入原密码' }]}><Input.Password /></Form.Item><Form.Item name="newPassword" label={en ? 'New password' : '新密码'} rules={[{ required: true, message: en ? 'Enter a new password' : '请输入新密码' }]}><Input.Password /></Form.Item><Form.Item name="confirmPassword" label={en ? 'Confirm password' : '确认新密码'} rules={[{ required: true, message: en ? 'Enter the new password again' : '请再次输入新密码' }]}><Input.Password /></Form.Item></Form>
      </Modal>
    </div>
  )
}

function SmartQueryWelcomeAvatar() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  useEffect(() => {
    const image = new Image()
    image.src = '/virtual-avatar.png'
    image.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) return
      context.drawImage(image, 60, 0, 1160, 1160, 0, 0, canvas.width, canvas.height)
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height)
      const { data } = pixels
      const width = canvas.width
      const height = canvas.height
      const visited = new Uint8Array(width * height)
      const queue: number[] = []
      for (let x = 0; x < width; x += 1) queue.push(x, (height - 1) * width + x)
      for (let y = 0; y < height; y += 1) queue.push(y * width, y * width + width - 1)
      while (queue.length) {
        const pixel = queue.pop()!
        if (visited[pixel]) continue
        visited[pixel] = 1
        const offset = pixel * 4
        const red = data[offset]
        const green = data[offset + 1]
        const blue = data[offset + 2]
        const nearWhite = Math.min(red, green, blue) > 245 && Math.max(red, green, blue) - Math.min(red, green, blue) < 18
        if (!nearWhite) continue
        data[offset + 3] = 0
        const x = pixel % width
        const y = Math.floor(pixel / width)
        if (x > 0) queue.push(pixel - 1)
        if (x < width - 1) queue.push(pixel + 1)
        if (y > 0) queue.push(pixel - width)
        if (y < height - 1) queue.push(pixel + width)
      }
      const fringe = new Uint8ClampedArray(data)
      for (let y = 1; y < height - 1; y += 1) {
        for (let x = 1; x < width - 1; x += 1) {
          const pixel = y * width + x
          const offset = pixel * 4
          if (data[offset + 3] === 0) continue
          const red = data[offset]
          const green = data[offset + 1]
          const blue = data[offset + 2]
          const nearWhite = Math.min(red, green, blue) > 232 && Math.max(red, green, blue) - Math.min(red, green, blue) < 24
          const touchesTransparency = [pixel - 1, pixel + 1, pixel - width, pixel + width].some((neighbor) => data[neighbor * 4 + 3] === 0)
          if (nearWhite && touchesTransparency) fringe[offset + 3] = 0
        }
      }
      data.set(fringe)
      context.putImageData(pixels, 0, 0)
    }
  }, [])
  return <canvas ref={canvasRef} className="smartQueryWelcomeAvatar" width={240} height={240} aria-hidden="true" />
}

function TypewriterText({ text }: { text: string }) {
  const [visible, setVisible] = useState('')
  useEffect(() => {
    let index = 0
    const timer = window.setInterval(() => {
      index += 1
      setVisible(text.slice(0, index))
      if (index >= text.length) window.clearInterval(timer)
    }, 70)
    return () => window.clearInterval(timer)
  }, [text])
  return <span className="smartQueryTypewriter">{visible}</span>
}

function SparkleIcon() {
  return <span className="biSparkleIcon"><svg viewBox="0 0 24 24" fill="none"><path d="M12 2.8l1.4 6a1.7 1.7 0 0 0 1.25 1.25l6 1.4-6 1.4a1.7 1.7 0 0 0-1.25 1.25l-1.4 6-1.4-6a1.7 1.7 0 0 0-1.25-1.25l-6-1.4 6-1.4A1.7 1.7 0 0 0 10.6 8.8l1.4-6Z" fill="currentColor"/><path className="sparkleSmall" d="M21.2 1.8l.42 1.85c.05.19.2.33.39.38l1.85.43-1.85.42a.5.5 0 0 0-.39.39l-.42 1.85-.43-1.85a.5.5 0 0 0-.39-.39l-1.85-.42 1.85-.43c.19-.05.34-.2.38-.39l.43-1.84Z" fill="currentColor" opacity=".58"/></svg></span>
}

function QuickQuestionIcon({ neutral, accent }: { neutral: string; accent: string }) {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M13.2 2.8 5.8 13h5.7l-.7 8.2L18.2 11h-5.7l.7-8.2Z" stroke={neutral} strokeWidth="1.5" strokeLinejoin="round" /><path d="m11.5 13-.7 8.2 4.35-6" stroke={accent} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function UploadAttachmentIcon({ neutral, accent }: { neutral: string; accent: string }) {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m20.2 11.2-8.1 8.1a5.2 5.2 0 0 1-7.4-7.4l8.7-8.7a3.6 3.6 0 0 1 5.1 5.1" stroke={neutral} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="m18.5 8.3-8.7 8.7A2 2 0 1 1 7 14.2l7.9-7.9" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function TableViewIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="2.3" y="2.7" width="11.4" height="10.6" rx="2" stroke="#A3A8B3" strokeWidth="1.2" /><path d="M2.8 6h10.4M6 6v6.8M10 6v6.8" stroke="#A3A8B3" strokeWidth="1.1" /><rect x="3.8" y="3.9" width="3.2" height="1" rx=".5" fill="#1677FF" /></svg>
}

function Composer({ large = false, showQuick = false, input, sending, model, dataSourceId, attachmentName, onInput, onModel, onDataSelect, onDataPreview, onDataRemove, onAttachment, onAttachmentPreview, onAttachmentRemove, onSend, onStop }: { large?: boolean; showQuick?: boolean; input: string; sending: boolean; model: string; dataSourceId?: string; attachmentName?: string; onInput: (value: string) => void; onModel: (value: string) => void; onDataSelect: (value: string) => void; onDataPreview: () => void; onDataRemove: () => void; onAttachment: (file: File) => void | Promise<void>; onAttachmentPreview: () => void; onAttachmentRemove: () => void; onSend: (value: string) => void; onStop: () => void }) {
  const { token } = theme.useToken()
  const locale = useAppStore((state) => state.locale)
  const en = locale === 'en-US'
  const [dataOpen, setDataOpen] = useState(false)
  const [dataSearch, setDataSearch] = useState('')
  const [quickOpen, setQuickOpen] = useState(false)
  const [quickSeed, setQuickSeed] = useState(0)
  const quickPrompts = useMemo(() => {
    const size = 5
    const start = (quickSeed * size) % QUICK_QUESTIONS.length
    return Array.from({ length: size }, (_, index) => questionText(QUICK_QUESTIONS[(start + index) % QUICK_QUESTIONS.length], locale))
  }, [locale, quickSeed])
  const normalizedModel = MODELS.find((item) => item.key === model || item.label === model) ?? MODELS[0]
  const selectedData = DATASETS.find((item) => item.id === dataSourceId)
  const datasetCopy: Record<string, { name: string; description: string }> = {
    aas_sample_dataset: { name: 'AAS-Sample Data Set', description: 'Vehicle sales, inventory, reservations, deliveries, and profit data' },
    vehicle_inventory: { name: 'Vehicle Inventory', description: 'Inventory status, aging, branch, and vehicle type' },
    vehicle_reservations: { name: 'Vehicle Reservations', description: 'Reservation dates, expiry, brand, and model' },
    vehicle_delivery: { name: 'Vehicle Delivery', description: 'Order confirmation, delivery date, and delivery status' },
    customer_enquiries: { name: 'Customer Enquiries', description: 'Enquiry source, preferred brand, and follow-up status' },
  }
  const visibleDatasets = DATASETS.filter((item) => `${item.name}${item.description}`.toLowerCase().includes(dataSearch.trim().toLowerCase()))
  return <div className={`smartQueryComposerCore ${large ? 'isLarge' : ''}`}>
    {quickOpen ? <div className="smartQueryQuickPanel">
      <div className="smartQueryQuickHeader">
        <span>{en ? 'Related questions' : '相关问题'}</span>
        <Button type="text" size="small" icon={<ReloadOutlined />} onClick={() => setQuickSeed((seed) => seed + 1)}>{en ? 'More' : '换一批'}</Button>
      </div>
      <div className="smartQueryQuickList">
        {quickPrompts.map((question) => <Button type="text" key={question} onClick={() => { setQuickOpen(false); onSend(question) }}><span>{question}</span></Button>)}
      </div>
    </div> : null}
    <div className="chatInputBox smartQueryInputBox">
      {(selectedData || attachmentName) ? <div className="smartQuerySelectedData">
        {selectedData ? <Tooltip title={<><strong>{en ? datasetCopy[selectedData.id]?.name ?? selectedData.name : selectedData.name}</strong><br /><span>{en ? 'Click to preview' : '点击预览数据'}</span></>}><div className="smartQueryAttachmentChip" role="button" tabIndex={0} onClick={onDataPreview}><button className="smartQueryChipDelete" aria-label={en ? 'Remove data' : '删除数据'} onClick={(event) => { event.stopPropagation(); onDataRemove() }}><CloseOutlined /></button><DataTableIcon size={20} color={token.colorPrimary} /><span>{en ? datasetCopy[selectedData.id]?.name ?? selectedData.name : selectedData.name}</span></div></Tooltip> : null}
        {attachmentName ? <Tooltip title={<><strong>{attachmentName}</strong><br /><span>{en ? 'Click to preview' : '点击预览数据'}</span></>}><div className="smartQueryAttachmentChip" role="button" tabIndex={0} onClick={onAttachmentPreview}><button className="smartQueryChipDelete" aria-label={en ? 'Remove attachment' : '删除附件'} onClick={(event) => { event.stopPropagation(); onAttachmentRemove() }}><CloseOutlined /></button><Paperclip size={15} /><span>{attachmentName}</span></div></Tooltip> : null}
      </div> : null}
      <Input.TextArea value={input} disabled={sending} variant="borderless" autoSize={{ minRows: large ? 4 : 1, maxRows: large ? 6 : 4 }} placeholder={en ? 'Ask in natural language to get data insights quickly' : '你可以用自然语言提问，快速获得数据结论与洞察'} onChange={(event) => onInput(event.target.value)} onPressEnter={(event) => { if (event.shiftKey) return; event.preventDefault(); onSend(input) }} styles={{ textarea: { background: 'transparent' } }} />
      <div className="smartQueryInputToolbar"><div className="smartQueryInputToolsLeft">
        {showQuick ? <Tooltip title={en ? 'Suggested questions' : '快捷提问'}><Button aria-label={en ? 'Suggested questions' : '快捷提问'} type="text" className="iconOnly smartQueryQuickTrigger" icon={<QuickQuestionIcon neutral={token.colorTextSecondary} accent={token.colorPrimary} />} onClick={() => setQuickOpen((open) => !open)} /></Tooltip> : null}
        <Popover open={dataOpen} onOpenChange={setDataOpen} trigger="click" placement="bottomLeft" content={<div className="smartQueryDataPicker"><div className="smartQueryDataPickerHeader"><Typography.Title level={5}>{en ? 'Select data' : '选择数据'}</Typography.Title><span>{visibleDatasets.length} {en ? 'items' : '项'}</span></div><Input allowClear prefix={<SearchOutlined />} placeholder={en ? 'Search tables or descriptions' : '搜索数据表名称或说明'} value={dataSearch} onChange={(event) => setDataSearch(event.target.value)} /><div className="smartQueryDataList">{visibleDatasets.length ? visibleDatasets.map((item) => <button key={item.id} className={item.id === dataSourceId ? 'isSelected' : ''} onClick={() => { onDataSelect(item.id); setDataOpen(false) }}><span className="smartQueryDatasetIcon"><DataTableIcon size={17} color={item.id === dataSourceId ? token.colorPrimary : token.colorTextSecondary} /></span><span><strong>{en ? datasetCopy[item.id]?.name ?? item.name : item.name}</strong><small>{en ? datasetCopy[item.id]?.description ?? item.description : item.description}</small></span><Radio checked={item.id === dataSourceId} /></button>) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={en ? 'No matching data' : '没有匹配的数据'} />}</div></div>}>
          <Tooltip title={en ? 'Select data' : '选择数据'}><Button aria-label={en ? 'Select data' : '选择数据'} type="text" className="iconOnly smartQueryToolButton" icon={<DataTableSearchIcon size={17} secondaryColor={token.colorTextSecondary} primaryColor={token.colorPrimary} />} /></Tooltip>
        </Popover>
        <Upload accept=".csv,.xlsx,.xls" fileList={[]} showUploadList={false} beforeUpload={(file) => { void onAttachment(file); return Upload.LIST_IGNORE }}><Tooltip title={en ? 'Upload attachment' : '上传附件'}><Button aria-label={en ? 'Upload attachment' : '上传附件'} type="text" className="iconOnly smartQueryToolButton" icon={<UploadAttachmentIcon neutral={token.colorTextSecondary} accent={token.colorPrimary} />} /></Tooltip></Upload>
      </div><div className="smartQueryInputToolsRight">
        <Dropdown trigger={['click']} placement="topRight" overlayClassName="modelMenu" menu={{ items: MODELS.map((item) => ({ key: item.key, label: <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, minWidth: 176 }}><span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 400 }}><img src={item.logoUrl} alt="" width={18} height={18} /><span>{item.label}</span></span><span style={{ color: token.colorPrimary, opacity: item.key === normalizedModel.key ? 1 : 0 }}><CheckOutlined /></span></div> })), onClick: ({ key }) => onModel(key) }}><Button type="text" className="smartQueryModelButton">{normalizedModel.label}<DownOutlined /></Button></Dropdown>
        {sending ? <Tooltip title={en ? 'Stop' : '停止'}><Button shape="circle" className="smartQuerySend" danger icon={<StopOutlined />} onClick={onStop} /></Tooltip> : <Tooltip title={en ? 'Send' : '发送'}><Button type="primary" shape="circle" className="smartQuerySend" icon={<ArrowUp size={17} strokeWidth={1.8} />} disabled={!input.trim()} onClick={() => onSend(input)} /></Tooltip>}
      </div></div>
    </div>
    {large ? <div className="smartQuerySuggestions">{QUICK_QUESTIONS.slice(0, 4).map((question) => <button key={question} onClick={() => onSend(questionText(question, locale))}>{questionText(question, locale)}</button>)}</div> : null}
  </div>
}

function ResultBlock({ question, result, view, onView, onSql }: { question: string; result: MessageResult; view: 'chart' | 'table'; onView: (view: 'chart' | 'table') => void; onSql: () => void }) {
  const { token } = theme.useToken()
  const locale = useAppStore((state) => state.locale)
  const en = locale === 'en-US'
  const supportedChartTypes = inferSupportedChartTypes(result)
  const hasChart = supportedChartTypes.size > 0
  const resolvedView = view === 'chart' && !hasChart && result.table ? 'table' : view === 'table' && !result.table && hasChart ? 'chart' : view
  const [chartType, setChartType] = useState<ChartTypeKey>(() => inferDefaultChartType(result))
  const chart = pickChartOption(result, chartType)
  const chartOption = chart ? restoreChartTypography(chart, token.colorTextSecondary, token.colorSplit) : undefined
  const chartTypes = Object.keys(CHART_TYPE_LABELS) as ChartTypeKey[]
  return <div className="llmOutputBox smartQueryResult">
    <div className="smartQueryResultToolbar">
      <strong>{question}</strong>
      <Space className="smartQueryResultControls" size={10}>
        <div className="smartQueryViewSwitch"><Button aria-label={en ? 'Details table' : '明细表'} type="text" disabled={!result.table} className={resolvedView === 'table' && Boolean(result.table) ? 'isActive' : ''} icon={<TableViewIcon />} onClick={() => onView('table')} /><Popover trigger={['hover', 'click']} placement="bottomRight" content={<div className="smartQueryChartTypes">{chartTypes.map((type) => { const disabled = !supportedChartTypes.has(type); const labels: Record<ChartTypeKey, string> = { bar: 'Bar', pie: 'Pie', line: 'Line', metric: 'Metric', funnel: 'Funnel', radar: 'Radar', bubble: 'Bubble', scatter: 'Scatter', sankey: 'Sankey' }; return <button key={type} disabled={disabled} className={type === chartType ? 'isActive' : ''} onClick={() => { if (disabled) return; setChartType(type); onView('chart') }}>{CHART_TYPE_ICONS[type]}<span>{en ? labels[type] : CHART_TYPE_LABELS[type]}</span></button> })}</div>}><Button aria-label={en ? 'Chart types' : '图表类型'} type="text" disabled={!hasChart} className={resolvedView === 'chart' && hasChart ? 'isActive' : ''} icon={CHART_TYPE_ICONS[chartType]} onClick={() => onView('chart')} /></Popover></div>
        <Tooltip title={en ? 'View SQL' : '查看 SQL'}><Button aria-label={en ? 'View SQL' : '查看 SQL'} type="text" size="small" className="smartQueryResultAction" disabled={!result.sql} onClick={onSql} icon={<span>SQL</span>} /></Tooltip>
      </Space>
    </div>
    {result.metric && resolvedView === 'chart' && chartType === 'metric' ? <div className="smartQueryMetric"><span>{result.metric.label}</span><strong>{result.metric.value}</strong></div> : null}
    {resolvedView === 'chart' ? (chartOption ? <div className="smartQueryChart"><EChart option={{ ...chartOption, color: CHART_PALETTES.cyber.colors, backgroundColor: 'transparent' }} /></div> : null) : (result.table ? <div className="smartQueryResultTable"><Table size="small" pagination={false} columns={result.table.columns.map((column) => ({ title: column, dataIndex: column, key: column }))} dataSource={result.table.rows.map((row, index) => ({ ...row, key: index }))} scroll={{ x: 'max-content' }} /></div> : null)}
    <div className="smartQueryNarrative"><ChatRichText text={highlightBusinessNarrative(result.answerText || (en ? 'The vehicle business analysis is complete.' : '已完成车辆业务数据分析，关键结果见上方。'))} /></div>
  </div>
}

function highlightBusinessNarrative(text: string) {
  const highlights = /(\d[\d,.]*\s*(?:KWD|辆|台|vehicles?|units?|%))|(当前库存(?:车辆)?|新车|二手车|总利润|销售额|月均销量|平均售价|亏损销售|融资销售|现金销售|预留数量|库存数量|current inventory(?: vehicles)?|new vehicles?|used vehicles?|total profit|total revenue|monthly average(?: sales)?|average selling price|loss-making sales|financed sales|cash sales|reservations?|inventory count|BMW(?:\s+[A-Z0-9-]+|\s+\d\s*(?:系|Series))?|Land Rover|Range Rover|Defender|Geely|GWM|Haval|MINI|Rolls[- ]Royce|McLaren|Closed|Invoiced|Adopted|On Order|Finished|Consigned)/gi
  let count = 0
  return String(text).split('**').map((part, index) => {
    if (index % 2 === 1) return `**${part}**`
    return part.replace(highlights, (match) => {
      if (count >= 3) return match
      count += 1
      return `**${match}**`
    })
  }).join('')
}

function restoreChartTypography(option: EChartsOption, textColor: string, splitColor: string): EChartsOption {
  const axis = (value: unknown) => {
    const apply = (item: Record<string, unknown>) => ({
      ...item,
      axisLabel: { ...((item.axisLabel as Record<string, unknown>) ?? {}), color: textColor },
      nameTextStyle: { ...((item.nameTextStyle as Record<string, unknown>) ?? {}), color: textColor },
      axisLine: { ...((item.axisLine as Record<string, unknown>) ?? {}), lineStyle: { ...(((item.axisLine as Record<string, unknown>)?.lineStyle as Record<string, unknown>) ?? {}), color: splitColor } },
    })
    if (Array.isArray(value)) return value.map((item) => apply((item ?? {}) as Record<string, unknown>))
    return value ? apply(value as Record<string, unknown>) : value
  }
  const legend = Array.isArray(option.legend)
    ? option.legend.map((item) => ({ ...item, textStyle: { ...(item.textStyle ?? {}), color: textColor } }))
    : option.legend ? { ...option.legend, textStyle: { ...(option.legend.textStyle ?? {}), color: textColor } } : option.legend
  return { ...option, textStyle: { ...(option.textStyle ?? {}), color: textColor }, legend, xAxis: axis(option.xAxis) as EChartsOption['xAxis'], yAxis: axis(option.yAxis) as EChartsOption['yAxis'] }
}

function inferSupportedChartTypes(result: MessageResult) {
  const supported = new Set<ChartTypeKey>()
  if (result.metric) supported.add('metric')
  ;[result.chart, ...Object.values(result.chartVariants ?? {})].filter(Boolean).forEach((option) => {
    const series = (option as { series?: unknown })?.series
    const list = Array.isArray(series) ? series : series ? [series] : []
    list.forEach((item) => {
      const type = String((item as { type?: string }).type ?? '')
      if (type === 'bar') supported.add('bar')
      if (type === 'line') supported.add('line')
      if (type === 'pie') supported.add('pie')
      if (type === 'funnel') supported.add('funnel')
      if (type === 'radar') supported.add('radar')
      if (type === 'scatter') supported.add('scatter')
      if (type === 'effectScatter') supported.add('bubble')
      if (type === 'sankey') supported.add('sankey')
    })
  })
  const hasChartSemantics = Boolean(result.chart || Object.keys(result.chartVariants ?? {}).length)
  if (hasChartSemantics && buildDerivedChartOption('bar', result)) supported.add('bar')
  if (hasChartSemantics && buildDerivedChartOption('line', result)) supported.add('line')
  if (hasChartSemantics && buildDerivedChartOption('pie', result)) supported.add('pie')
  return supported
}

function inferDefaultChartType(result: MessageResult): ChartTypeKey {
  const supported = inferSupportedChartTypes(result)
  return (['pie', 'bar', 'line', 'metric', 'funnel', 'radar', 'bubble', 'scatter', 'sankey'] as ChartTypeKey[]).find((type) => supported.has(type)) ?? 'bar'
}

function pickChartOption(result: MessageResult, type: ChartTypeKey) {
  const variants = result.chartVariants ?? {}
  const aliases: Record<ChartTypeKey, string[]> = { bar: ['bar', '柱状图', '柱图'], line: ['line', '折线图', '折线'], pie: ['pie', '饼图'], metric: ['metric', '指标卡'], funnel: ['funnel', '漏斗图'], radar: ['radar', '雷达图'], bubble: ['bubble', '气泡图'], scatter: ['scatter', '散点图'], sankey: ['sankey', '桑基图'] }
  for (const key of aliases[type]) if (variants[key]) return variants[key]
  if (type === 'metric') return undefined
  const chartSeries = (result.chart as { series?: Array<{ type?: string }> | { type?: string } } | undefined)?.series
  const series = Array.isArray(chartSeries) ? chartSeries : chartSeries ? [chartSeries] : []
  if (series.some((item) => item?.type === type || (type === 'bubble' && item?.type === 'effectScatter'))) return result.chart
  return buildDerivedChartOption(type, result) ?? result.chart ?? Object.values(variants)[0]
}

function parseChartNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const matched = String(value ?? '').replaceAll(',', '').match(/-?\d+(?:\.\d+)?/)
  return matched ? Number(matched[0]) : null
}

function buildDerivedChartOption(type: ChartTypeKey, result: MessageResult): EChartsOption | null {
  if (!['bar', 'line', 'pie'].includes(type) || !result.table || result.table.columns.length < 2 || !result.table.rows.length) return null
  const { columns, rows } = result.table
  if (columns.some((column) => /单位|unit/i.test(column)) && columns.some((column) => /指标|metric/i.test(column))) return null
  const dimension = columns[0]
  const value = columns.find((column, index) => index > 0 && rows.some((row) => parseChartNumber(row[column]) !== null))
  if (!value) return null
  const labels = rows.map((row) => String(row[dimension] ?? ''))
  const values = rows.map((row) => parseChartNumber(row[value]) ?? 0)
  const isTimeSeries = /日期|时间|月份|年月|季度|周|day|date|time|month|quarter/i.test(dimension)
    || labels.every((label) => /^\d{4}[-/.年]\d{1,2}|^\d{1,2}\s*月$/.test(label))
  if (type === 'line' && !isTimeSeries) return null
  if (type === 'pie' && (rows.length < 2 || rows.length > 8 || values.some((item) => item < 0))) return null
  if (type === 'bar' && rows.length > 30) return null
  if (type === 'pie') return { tooltip: { trigger: 'item' }, legend: { bottom: 0 }, series: [{ type: 'pie', radius: ['44%', '68%'], center: ['50%', '45%'], label: { formatter: '{b}: {c}' }, data: labels.map((name, index) => ({ name, value: values[index] })) }] }
  const base: EChartsOption = {
    grid: { left: 20, right: 24, top: 32, bottom: 42, containLabel: true },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: labels, axisTick: { show: false }, axisLabel: { hideOverlap: true, rotate: labels.length > 8 ? 24 : 0 } },
    yAxis: { type: 'value', splitLine: { lineStyle: { opacity: 0.12 } } },
  }
  if (type === 'bar') return { ...base, series: [{ type: 'bar', data: values, name: value, barMaxWidth: 38 }] }
  return { ...base, series: [{ type: 'line', data: values, name: value, smooth: true, symbolSize: 7 }] }
}

function UserQueryMessage({ item }: { item: ChatMessage }) {
  const locale = useAppStore((state) => state.locale)
  const en = locale === 'en-US'
  const dataset = DATASETS.find((source) => source.id === item.dataSourceId)
  const time = new Date(item.at).toLocaleString(locale, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).replaceAll('/', '/')
  const copy = async () => {
    await navigator.clipboard.writeText(item.content)
    void message.success(en ? 'Copied' : '已复制')
  }
  return <>
    <div className={`smartQueryBubble ${dataset ? 'hasDataset' : ''}`}>
      {dataset ? <span className="smartQueryMessageDataset"><DataTableIcon size={18} color="var(--ant-color-primary)" /><span>{dataset.name}</span></span> : null}
      <span>{questionText(item.content, locale)}</span>
    </div>
    <div className="smartQueryUserMeta"><span>{time}</span><Button aria-label={en ? 'Copy question' : '复制问题'} type="text" size="small" icon={<Copy size={15} strokeWidth={1.5} />} onClick={() => void copy()} /></div>
  </>
}

function relatedQuestions(question: string) {
  const q = canonicalQuestion(question).toLowerCase()
  let pool: string[]
  if (/利润|profit|亏损/.test(q)) pool = ['Land Rover 总利润最高的两个车型系列是什么？', '有多少车辆属于亏损销售？', '所有已开票车辆的总利润是多少？', '2024 年按制造商和利润区间统计销量']
  else if (/预留|预订|运输|到货/.test(q)) pool = ['2025 年 3 月共发生多少车辆预留？', '有多少库存车辆已超过预留到期日？', '列出仍在运输中的车辆及预计到货日', '当前库存车辆总数是多少？']
  else if (/bmw|5\s*系|3\s*系|g60|x7|销量/.test(q)) pool = ['BMW 5 系最近 6 个月平均销量是多少？', '2025 年 BMW 5 系每月销量是多少？', '2024 年 BMW G60 每月销量是多少？', '系统中有哪些 BMW 车型？', '现金销售的 BMW X7 有多少辆？']
  else pool = ['新车与二手车分别有多少辆？', '按制造商和车型拆分当前库存', '全部车辆的状态分布是什么？', '有多少库存车辆已超过预留到期日？']
  return pool.filter((item) => item !== question).slice(0, 3)
}

function FollowUpQuestions({ question, onSend }: { question: string; onSend: (value: string) => void }) {
  const locale = useAppStore((state) => state.locale)
  const en = locale === 'en-US'
  const questions = relatedQuestions(question)
  return <div className="smartQueryFollowUps"><div>{en ? 'You may also want to ask:' : '您可能还想问：'}</div>{questions.map((item) => <button key={item} onClick={() => onSend(questionText(item, locale))}>{questionText(item, locale)}</button>)}</div>
}

function MessageActions({ content, result, onExport, at }: { content: string; result: MessageResult; onExport: () => void; at: number }) {
  const locale = useAppStore((state) => state.locale)
  const en = locale === 'en-US'
  const copy = async () => { await navigator.clipboard.writeText(content || result.answerText); void message.success(en ? 'Copied' : '已复制') }
  const time = new Date(at).toLocaleString(locale, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).replaceAll('/', '/')
  return <div className="smartQueryMessageActions">
    <Tooltip title={en ? 'Copy' : '复制'}><Button type="text" size="small" icon={<Copy size={15} strokeWidth={1.5} />} onClick={() => void copy()} /></Tooltip>
    <Tooltip title={en ? 'Share' : '分享'}><Button type="text" size="small" icon={<Share2 size={15} strokeWidth={1.5} />} onClick={() => void message.info(en ? 'Share link is ready' : '分享链接已准备')} /></Tooltip>
    <Dropdown trigger={['click']} menu={{ items: [{ key: 'helpful', icon: <LikeOutlined />, label: en ? 'Helpful' : '有帮助' }, { key: 'improve', icon: <DislikeOutlined />, label: en ? 'Needs improvement' : '需要改进' }], onClick: () => void message.success(en ? 'Thanks for your feedback' : '感谢你的反馈') }}><Button type="text" size="small" icon={<ThumbsUp size={15} strokeWidth={1.5} />} /></Dropdown>
    <Tooltip title={en ? 'Export' : '导出'}><Button type="text" size="small" icon={<Download size={15} strokeWidth={1.5} />} disabled={!result.table} onClick={onExport} /></Tooltip>
    <span>{time}</span>
  </div>
}
