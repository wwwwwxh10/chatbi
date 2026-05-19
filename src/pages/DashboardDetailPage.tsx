import { Button, Card, Space, Tag, Tooltip, Typography, theme } from 'antd'
import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeftOutlined, CommentOutlined } from '@ant-design/icons'
import { DataTableIcon } from '../components/icons/DataTableIcon'
import { openAppPath } from '../utils/appNavigation'

function readQuery(search: string) {
  const p = new URLSearchParams(search)
  const title = p.get('title')?.trim() ?? ''
  const tablesRaw = p.get('tables')?.trim() ?? ''
  const tables = tablesRaw ? tablesRaw.split(',').map((x) => x.trim()).filter(Boolean) : []
  return { title, tables }
}

export default function DashboardDetailPage() {
  const { token } = theme.useToken()
  const navigate = useNavigate()
  const location = useLocation()
  const { title, tables } = useMemo(() => readQuery(location.search), [location.search])
  const shown = tables.slice(0, 3)
  const rest = tables.length - shown.length

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Space size={10} align="center">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard')} />
          <Typography.Title level={5} style={{ margin: 0 }}>
            {title || '仪表盘'}
          </Typography.Title>
          <Space size={6} wrap>
            {shown.map((x) => (
              <Tag key={x}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <DataTableIcon size={14} color={token.colorTextSecondary} />
                  <span>{x}</span>
                </span>
              </Tag>
            ))}
            {rest > 0 ? (
              <Tooltip title={tables.slice(3).join(', ')}>
                <Tag>+{rest}</Tag>
              </Tooltip>
            ) : null}
          </Space>
        </Space>

        <Button
          type="primary"
          icon={<CommentOutlined />}
          onClick={() => {
            const qs = new URLSearchParams()
            if (title) qs.set('title', title)
            if (tables.length) qs.set('tables', tables.join(','))
            const s = qs.toString()
            openAppPath(`/dashboard/chat-workspace${s ? `?${s}` : ''}`)
          }}
        >
          开始对话
        </Button>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 12 }}>
        <Card style={{ gridColumn: 'span 8', height: '100%' }} styles={{ body: { height: '100%' } }}>
          <div style={{ height: '100%', borderRadius: 14, background: token.colorFillTertiary }} />
        </Card>
        <Card style={{ gridColumn: 'span 4', height: '100%' }} styles={{ body: { height: '100%' } }}>
          <div style={{ height: '100%', borderRadius: 14, background: token.colorFillTertiary }} />
        </Card>
      </div>
    </div>
  )
}
