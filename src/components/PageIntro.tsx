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
      <div style={{ minWidth: 0, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <Typography.Title level={4} style={{ margin: 0, color: token.colorText }}>
            {title}
          </Typography.Title>
          <div
            style={{
              width: 42,
              height: 2,
              borderRadius: 999,
              background: `linear-gradient(90deg, ${token.colorPrimary} 0%, ${token.colorPrimaryBg} 52%, transparent 92%)`,
              opacity: 0.82,
              boxShadow: `0 0 12px ${token.colorPrimaryBg}`,
              marginTop: 6,
            }}
          />
          <Typography.Paragraph type="secondary" style={{ margin: '6px 0 0', maxWidth: 880 }}>
            {description}
          </Typography.Paragraph>
        </div>
      </div>

      {extra ? (
        <Space size={10} align="center">
          {extra}
        </Space>
      ) : null}
    </div>
  )
}
