import { Avatar, theme } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { useState, type CSSProperties } from 'react'
import { VIRTUAL_AVATAR_URL } from '../assets/virtualAvatar'

export function VirtualAvatar({ size, style, transparent = false, srcUrl = VIRTUAL_AVATAR_URL }: { size: number; style?: CSSProperties; transparent?: boolean; srcUrl?: string }) {
  const { token } = theme.useToken()
  const [broken, setBroken] = useState(false)

  return (
    <Avatar
      src={broken ? undefined : srcUrl}
      size={size}
      shape="circle"
      icon={broken ? <UserOutlined style={{ color: token.colorTextTertiary }} /> : undefined}
      onError={() => {
        setBroken(true)
        return false
      }}
      style={{
        background: transparent ? 'transparent' : broken ? '#F0F0F0' : token.colorFillTertiary,
        backgroundColor: transparent ? 'transparent' : broken ? '#F0F0F0' : token.colorFillTertiary,
        border: transparent ? 0 : `1px solid ${token.colorSplit}`,
        ...style,
      }}
    />
  )
}
