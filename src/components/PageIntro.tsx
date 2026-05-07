import { Space, Typography, theme } from 'antd'
import type { ReactNode } from 'react'

export function PageIntro({
  title,
  description,
  extra,
}: {
  title: string
  description: string
  extra?: ReactNode
}) {
  const { token } = theme.useToken()

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '6px 0 2px',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <Typography.Title level={4} style={{ margin: 0, color: token.colorText }}>
          {title}
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ margin: '6px 0 0', maxWidth: 880 }}>
          {description}
        </Typography.Paragraph>
      </div>

      {extra ? (
        <Space size={10} align="center">
          {extra}
        </Space>
      ) : null}
    </div>
  )
}
