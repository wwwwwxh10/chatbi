import { Button, Space, theme } from 'antd'
import { DownloadOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ChatMessage, MessageResult } from './chatUtils'
import { VirtualAvatar } from '../../components/VirtualAvatar'

export function ChatThread({
  messages,
  activeAssistantId,
  resultsByAssistantId,
  onSelectAssistant,
  onOpenSql,
  onRetry,
  onExport,
  listRef,
}: {
  messages: ChatMessage[]
  activeAssistantId?: string
  resultsByAssistantId: Record<string, MessageResult>
  onSelectAssistant: (assistantId: string) => void
  onOpenSql: () => void
  onRetry: (assistantId: string) => void
  onExport: () => void
  listRef: React.RefObject<HTMLDivElement | null>
}) {
  const { token } = theme.useToken()

  return (
    <div ref={listRef} style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 12 }}>
      <Space direction="vertical" size={10} style={{ width: '100%' }}>
        {messages.map((m) => {
          const isActive = m.role === 'assistant' && m.id === activeAssistantId
          const payload = m.role === 'assistant' ? resultsByAssistantId[m.id] : undefined
          return (
            <div key={m.id} style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {m.role === 'assistant' ? <VirtualAvatar size={32} style={{ flex: 'none', marginRight: 10 }} /> : null}
                <div
                  role={m.role === 'assistant' ? 'button' : undefined}
                  tabIndex={m.role === 'assistant' ? 0 : undefined}
                  onClick={m.role === 'assistant' ? () => onSelectAssistant(m.id) : undefined}
                  style={{
                    maxWidth: 420,
                    padding: '10px 12px',
                    borderRadius: 12,
                    background: m.role === 'user' ? token.colorPrimary : token.colorFillTertiary,
                    color: m.role === 'user' ? token.colorTextLightSolid : token.colorText,
                    border: `1px solid ${m.role === 'user' ? token.colorPrimary : isActive ? token.colorPrimary : token.colorSplit}`,
                    whiteSpace: 'pre-wrap',
                    cursor: m.role === 'assistant' ? 'pointer' : 'default',
                  }}
                >
                  {m.content}
                </div>
              </div>
              {m.role === 'assistant' ? (
                <div style={{ display: 'flex', justifyContent: 'flex-start', paddingLeft: 2, marginTop: 6 }}>
                  <Space size={6}>
                    <Button type="text" size="small" icon={<EyeOutlined />} disabled={!payload?.sql} onClick={onOpenSql}>
                      SQL
                    </Button>
                    <Button type="text" size="small" icon={<ReloadOutlined />} onClick={() => onRetry(m.id)}>
                      重试
                    </Button>
                    <Button type="text" size="small" icon={<DownloadOutlined />} disabled={!payload?.table} onClick={onExport}>
                      导出
                    </Button>
                  </Space>
                </div>
              ) : null}
            </div>
          )
        })}
      </Space>
    </div>
  )
}
