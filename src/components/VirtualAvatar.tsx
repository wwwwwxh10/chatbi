import { Avatar, theme } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { useState, type CSSProperties } from 'react'
import { VIRTUAL_AVATAR_URL } from '../assets/virtualAvatar'

export function VirtualAvatar({ size, style }: { size: number; style?: CSSProperties }) {
  const { token } = theme.useToken()
  const [broken, setBroken] = useState(false)

  return (
    <Avatar
      src={broken ? undefined : VIRTUAL_AVATAR_URL}
      size={size}
      shape="circle"
      icon={broken ? <UserOutlined style={{ color: token.colorTextTertiary }} /> : undefined}
      onError={() => {
        setBroken(true)
        return false
      }}
      style={{
        background: broken ? '#F0F0F0' : token.colorFillTertiary,
        backgroundColor: broken ? '#F0F0F0' : token.colorFillTertiary,
        border: `1px solid ${token.colorSplit}`,
        ...style,
      }}
    />
  )
}
