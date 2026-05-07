import { Button, Card, Empty, Input, List, Segmented, Space, Table, Tag, Typography, message, theme } from 'antd'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageIntro } from '../components/PageIntro'
import { DataSourcePicker } from '../components/DataSourcePicker'
import { buildMockResult, nowId, storageKey } from './chat/chatUtils'
import { EChart } from '../components/EChart'
import { VirtualAvatar } from '../components/VirtualAvatar'

type ChatRole = 'user' | 'assistant'

type ChatMessage = {
  id: string
  role: ChatRole
  content: string
  at: number
}

type QueryResult = {
  answerText: string
  table?: { columns: string[]; rows: Array<Record<string, string | number | null>> }
}

function buildMockAnswer(question: string): QueryResult {
  const normalized = question.trim().slice(0, 80)
  return {
    answerText: `已收到问题：“${normalized || '（空）'}”。示例分析：主要波动来自渠道结构变化与新增活动叠加。建议你进一步拆分到渠道/城市/品类验证。`,
    table: {
      columns: ['维度', '本周', '上周', '环比'],
      rows: [
        { '维度': '全站', '本周': 193240, '上周': 195380, '环比': '-1.1%' },
        { '维度': '自然流量', '本周': 78210, '上周': 76120, '环比': '+2.7%' },
        { '维度': '广告投放', '本周': 59200, '上周': 64800, '环比': '-8.6%' },
        { '维度': '活动', '本周': 55830, '上周': 54460, '环比': '+2.5%' },
      ],
    },
  }
}

function readParams(search: string) {
  const p = new URLSearchParams(search)
  return {
    template: p.get('template')?.trim() ?? '',
    dashboardId: p.get('dashboardId')?.trim() ?? '',
  }
}

export default function DashboardChatPage() {
  const { t } = useTranslation()
  const { token } = theme.useToken()
  const location = useLocation()
  const navigate = useNavigate()

  const { template: templateId, dashboardId } = readParams(location.search)
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: nowId(),
      role: 'assistant',
      content: t('dashboard.chatHint'),
      at: Date.now(),
    },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [pendingTimer, setPendingTimer] = useState<number | null>(null)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [view, setView] = useState<'table' | 'chart'>('table')
  const [dataSourceId, setDataSourceId] = useState<string | undefined>(undefined)
  const [conversationId] = useState<string>(() => nowId())

  const chartOption = useMemo(() => {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')
    return buildMockResult(String(lastUser?.content ?? '')).chart ?? null
  }, [messages])

  const tableColumns = result?.table
    ? result.table.columns.map((c) => ({ title: c, dataIndex: c, key: c }))
    : []

  const onSend = async () => {
    if (sending) return
    const q = input.trim()
    if (!q) return

    const userMsg: ChatMessage = { id: nowId(), role: 'user', content: q, at: Date.now() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setSending(true)

    const startedAt = Date.now()
    const tId = window.setTimeout(() => {
      const r0 = buildMockAnswer(q)
      setResult(r0)
      setView('table')
      const took = Math.max(1, Math.round((Date.now() - startedAt) / 1000))
      const botMsg: ChatMessage = { id: nowId(), role: 'assistant', content: `分析完毕（用时${took}秒）\n${r0.answerText}`, at: Date.now() }
      setMessages((prev) => [...prev, botMsg])
      setSending(false)
      setPendingTimer(null)
    }, 1200)
    setPendingTimer(tId)
  }

  const stop = () => {
    if (!sending) return
    if (pendingTimer) window.clearTimeout(pendingTimer)
    setPendingTimer(null)
    setSending(false)
    setMessages((prev) => [...prev, { id: nowId(), role: 'assistant', content: '已停止', at: Date.now() }])
  }

  const desc = templateId
    ? `${t('dashboard.chatHint')}（Template: ${templateId}）`
    : dashboardId
      ? `${t('dashboard.chatHint')}（Dashboard: ${dashboardId}）`
      : t('dashboard.chatHint')

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageIntro
        title={t('dashboard.chat')}
        description={desc}
        extra={
          <Button onClick={() => navigate('/dashboard')}>
            {t('notFound.back')}
          </Button>
        }
      />

      <Card title={t('dashboard.chat')} size="small" bodyStyle={{ padding: 0 }}>
        <div style={{ height: 360, overflow: 'auto', padding: 12 }}>
          <List
            dataSource={messages}
            renderItem={(m) => (
              <List.Item style={{ border: 0, padding: '8px 0' }}>
                <div
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  {m.role === 'assistant' ? <VirtualAvatar size={28} style={{ flex: 'none', marginRight: 10 }} /> : null}
                  <div
                    style={{
                      maxWidth: 520,
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: m.role === 'user' ? token.colorPrimary : token.colorFillTertiary,
                      color: m.role === 'user' ? token.colorTextLightSolid : token.colorText,
                      border: `1px solid ${m.role === 'user' ? token.colorPrimary : token.colorSplit}`,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {m.content}
                  </div>
                </div>
              </List.Item>
            )}
          />
        </div>
        <div style={{ padding: 12, borderTop: `1px solid ${token.colorSplit}` }}>
          <Space direction="vertical" size={10} style={{ width: '100%' }}>
            <DataSourcePicker value={dataSourceId} onChange={setDataSourceId} placeholder="选择数据源（可搜索）" />
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value={input}
                placeholder={t('dashboard.chatPlaceholder')}
                onChange={(e) => setInput(e.target.value)}
                onPressEnter={onSend}
                disabled={sending}
              />
              {sending ? (
                <Button type="primary" danger onClick={stop}>
                  停止
                </Button>
              ) : (
                <Button type="primary" onClick={() => void onSend()}>
                  {t('dashboard.send')}
                </Button>
              )}
            </Space.Compact>
          </Space>
        </div>
      </Card>

      <Card title={t('dashboard.result')} size="small">
        {!result ? (
          <Empty description={t('dashboard.resultEmpty')} />
        ) : (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <div>
              {sending ? <Tag color="processing">分析中</Tag> : <Tag color="success">分析完毕</Tag>}
            </div>
            <Typography.Paragraph style={{ margin: 0 }}>{result.answerText}</Typography.Paragraph>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <Segmented
                value={view}
                options={[{ label: '表格', value: 'table' }, { label: '图表', value: 'chart' }]}
                onChange={(v) => setView(v === 'chart' ? 'chart' : 'table')}
              />
              <Button
                type="primary"
                onClick={() => {
                  try {
                    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')
                    const lastUser = [...messages].reverse().find((m) => m.role === 'user')
                    const base = buildMockResult(String(lastUser?.content ?? ''))
                    const assistantId = String(lastAssistant?.id ?? nowId())
                    const payload = { ...base, answerText: result.answerText, table: result.table }
                    const conv = {
                      id: conversationId,
                      title: '开始对话',
                      dataSourceId,
                      messages,
                      resultsByAssistantId: { [assistantId]: payload },
                      activeAssistantId: assistantId,
                    }
                    sessionStorage.setItem(storageKey(conversationId), JSON.stringify(conv))
                  } catch {
                  }
                  void message.success('已进入对话详情')
                  navigate(`/chat/${conversationId}`)
                }}
              >
                进入详情
              </Button>
            </div>
            {view === 'chart' ? (
              <div style={{ height: 320 }}>
                {chartOption ? <EChart option={chartOption} /> : <Empty description={t('dashboard.resultEmpty')} />}
              </div>
            ) : result.table ? (
              <Table
                size="middle"
                columns={tableColumns}
                dataSource={result.table.rows.map((r, idx) => ({ ...r, key: idx }))}
                pagination={{ pageSize: 5 }}
                scroll={{ x: 'max-content' }}
              />
            ) : null}
          </Space>
        )}
      </Card>
    </Space>
  )
}
