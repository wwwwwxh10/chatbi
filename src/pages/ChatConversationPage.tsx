import { Button, Card, Drawer, Input, Space, Typography, message, theme } from 'antd'
import { HistoryOutlined, SendOutlined, StopOutlined } from '@ant-design/icons'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DataSourcePicker } from '../components/DataSourcePicker'
import { ChatResultPanel } from './chat/ChatResultPanel'
import { ChatThread } from './chat/ChatThread'
import { buildMockResult, downloadText, nowId, seedConversation, storageKey, toCsv, type ConversationState } from './chat/chatUtils'

export default function ChatConversationPage() {
  const { token } = theme.useToken()
  const { conversationId } = useParams()
  const navigate = useNavigate()

  const cid = String(conversationId ?? '').trim() || 'demo'

  const [state, setState] = useState<ConversationState>(() => {
    try {
      const raw = sessionStorage.getItem(storageKey(cid))
      if (raw) return JSON.parse(raw) as ConversationState
    } catch {
    }
    return {
      id: cid,
      title: '开始对话',
      messages: [{ id: nowId(), role: 'assistant', content: '你好，我是智能问数。你可以继续追问。', at: Date.now() }],
      resultsByAssistantId: {},
      activeAssistantId: undefined,
    }
  })

  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [pendingAssistantId, setPendingAssistantId] = useState<string | null>(null)
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const [sqlOpen, setSqlOpen] = useState(false)
  const listRef = useRef<HTMLDivElement | null>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey(cid), JSON.stringify(state))
    } catch {
    }
  }, [cid, state])

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [state.messages.length, sending])

  const activeResult = state.activeAssistantId ? state.resultsByAssistantId[state.activeAssistantId] : undefined

  const exportCsv = () => {
    const t0 = activeResult?.table
    if (!t0) {
      void message.warning('当前没有可导出的表格结果')
      return
    }
    const csv = toCsv(t0.columns, t0.rows)
    downloadText(`chatbi-${cid}.csv`, csv, 'text/csv;charset=utf-8')
  }

  const onSend = async () => {
    if (sending) return
    const q = input.trim()
    if (!q) return
    setSending(true)
    setInput('')

    const userMsg = { id: nowId(), role: 'user' as const, content: q, at: Date.now() }
    const assistantId = nowId()
    setPendingAssistantId(assistantId)
    const botMsg = { id: assistantId, role: 'assistant' as const, content: '分析中…', at: Date.now() }
    const startedAt = Date.now()

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMsg, botMsg],
      resultsByAssistantId: {
        ...prev.resultsByAssistantId,
        [assistantId]: { status: 'running', answerText: '分析中…' },
      },
      activeAssistantId: assistantId,
    }))

    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      const result = buildMockResult(q)
      const tookMs = Date.now() - startedAt
      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((m) => (m.id === assistantId ? { ...m, content: result.answerText, at: Date.now() } : m)),
        resultsByAssistantId: { ...prev.resultsByAssistantId, [assistantId]: { ...result, status: 'done', tookMs } },
        activeAssistantId: assistantId,
      }))
      setView(result.chart ? 'chart' : 'table')
      setSending(false)
      setPendingAssistantId(null)
      timerRef.current = null
    }, 5000)
  }

  const stop = () => {
    if (!sending) return
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = null
    const aid = pendingAssistantId
    setPendingAssistantId(null)
    setSending(false)
    if (!aid) return
    setState((prev) => ({
      ...prev,
      messages: prev.messages.map((m) => (m.id === aid ? { ...m, content: '已停止', at: Date.now() } : m)),
      resultsByAssistantId: {
        ...prev.resultsByAssistantId,
        [aid]: { status: 'stopped', answerText: '已停止' },
      },
      activeAssistantId: aid,
    }))
  }

  const retryAt = async (assistantId: string) => {
    const idx = state.messages.findIndex((m) => m.id === assistantId)
    if (idx < 0) return
    const user = [...state.messages].slice(0, idx).reverse().find((m) => m.role === 'user')
    const q = String(user?.content ?? '').trim()
    if (!q) return
    setSending(true)
    setState((prev) => ({
      ...prev,
      messages: prev.messages.map((m) => (m.id === assistantId ? { ...m, content: '分析中…', at: Date.now() } : m)),
      resultsByAssistantId: { ...prev.resultsByAssistantId, [assistantId]: { status: 'running', answerText: '分析中…' } },
      activeAssistantId: assistantId,
    }))
    await new Promise((r) => setTimeout(r, 5000))
    const next = buildMockResult(q)
    setState((prev) => ({
      ...prev,
      messages: prev.messages.map((m) => (m.id === assistantId ? { ...m, content: next.answerText, at: Date.now() } : m)),
      resultsByAssistantId: { ...prev.resultsByAssistantId, [assistantId]: next },
      activeAssistantId: assistantId,
    }))
    setSending(false)
    void message.success('已重新生成')
  }

  const mockAll = () => {
    const next = seedConversation(cid)
    setState(next)
    setView('chart')
    void message.success('已注入 Mock 对话数据')
  }

  const clearAll = () => {
    setState({
      id: cid,
      title: '开始对话',
      dataSourceId: state.dataSourceId,
      messages: [{ id: nowId(), role: 'assistant', content: '你好，我是智能问数。你可以继续追问。', at: Date.now() }],
      resultsByAssistantId: {},
      activeAssistantId: undefined,
    })
    setView('chart')
  }

  return (
    <Space direction="vertical" size={12} style={{ width: '100%', minHeight: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            开始对话
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            完整对话交互 · 图表/表格切换 · 查看 SQL · 导出
          </Typography.Text>
        </div>
        <Space size={8} wrap={false}>
          <Button icon={<HistoryOutlined />} onClick={mockAll}>
            Mock 对话数据
          </Button>
          <Button danger onClick={clearAll}>
            清空并重来
          </Button>
          <Button onClick={() => navigate('/dashboard')}>返回仪表盘</Button>
        </Space>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '480px minmax(0, 1fr)',
          gap: 12,
          height: 'calc(100vh - 56px - 16px - 64px)',
          minHeight: 520,
        }}
      >
        <Card
          size="small"
          styles={{ body: { padding: 0, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 } }}
          title="对话"
        >
          <ChatThread
            messages={state.messages}
            activeAssistantId={state.activeAssistantId}
            resultsByAssistantId={state.resultsByAssistantId}
            listRef={listRef}
            onSelectAssistant={(assistantId) => setState((p) => ({ ...p, activeAssistantId: assistantId }))}
            onOpenSql={() => setSqlOpen(true)}
            onRetry={(assistantId) => void retryAt(assistantId)}
            onExport={exportCsv}
          />

          <div style={{ borderTop: `1px solid ${token.colorSplit}`, padding: 12 }}>
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              <DataSourcePicker
                value={state.dataSourceId}
                onChange={(v) => setState((p) => ({ ...p, dataSourceId: v }))}
                placeholder="选择数据源（可搜索）"
                size="middle"
              />
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <Input.TextArea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  autoSize={{ minRows: 2, maxRows: 6 }}
                  placeholder="输入问题，按 Enter 发送，Shift+Enter 换行"
                  disabled={sending}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      void onSend()
                    }
                  }}
                />
                {sending ? (
                  <Button type="primary" danger icon={<StopOutlined />} onClick={stop}>
                    停止
                  </Button>
                ) : (
                  <Button type="primary" icon={<SendOutlined />} onClick={() => void onSend()}>
                    发送
                  </Button>
                )}
              </div>
            </Space>
          </div>
        </Card>

        <ChatResultPanel view={view} onViewChange={setView} result={activeResult} onOpenSql={() => setSqlOpen(true)} onExportCsv={exportCsv} />
      </div>

      <Drawer open={sqlOpen} onClose={() => setSqlOpen(false)} title="SQL" width={720} destroyOnClose>
        {activeResult?.sql ? (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Typography.Text type="secondary">只读（可复制）</Typography.Text>
            <Typography.Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              <Typography.Text code style={{ whiteSpace: 'pre-wrap' }}>
                {activeResult.sql}
              </Typography.Text>
            </Typography.Paragraph>
            <Button
              onClick={async () => {
                await navigator.clipboard.writeText(activeResult.sql ?? '')
                void message.success('已复制')
              }}
            >
              复制
            </Button>
          </Space>
        ) : (
          <div style={{ padding: 24 }}>
            <Typography.Text type="secondary">暂无 SQL</Typography.Text>
          </div>
        )}
      </Drawer>
    </Space>
  )
}
