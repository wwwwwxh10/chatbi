import { Button, Card, Form, Input, Space, Typography, message, theme } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useSystemStore } from '../store/systemStore'
import { useAuthStore } from '../store/authStore'
import { AppLogoWordmark } from '../components/logo/AppLogoWordmark'

export default function LoginPage() {
  const navigate = useNavigate()
  const { token } = theme.useToken()
  const systemName = useSystemStore((s) => s.systemName)
  const login = useAuthStore((s) => s.login)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: token.colorBgLayout }}>
      <div
        style={{
          flex: 1,
          minWidth: 360,
          background: 'linear-gradient(135deg, rgba(43, 92, 246, 0.22) 0%, rgba(16, 24, 39, 0.85) 52%, rgba(11, 14, 20, 1) 100%)',
          padding: 36,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
          {systemName === 'ChatBI' ? (
            <AppLogoWordmark showMark={false} fontSize={30} />
          ) : (
            <Typography.Title level={4} style={{ margin: 0, color: 'rgba(255,255,255,0.92)' }}>
              {systemName}
            </Typography.Title>
          )}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.70)', maxWidth: 520, lineHeight: 1.7 }}>
          <div style={{ fontSize: 40, fontWeight: 860, marginBottom: 12, letterSpacing: 2 }}>超级数据分析师</div>
          <div style={{ fontSize: 22, letterSpacing: 1 }}>让企业从看懂数据到用好数据</div>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>版权所有 © 科大讯飞股份有限公司</div>
      </div>

      <div style={{ flex: 1, minWidth: 420, display: 'grid', placeItems: 'center', padding: 24, background: token.colorBgLayout }}>
        <Card style={{ width: 440 }} styles={{ body: { padding: 22 } }}>
          <Space direction="vertical" size={14} style={{ width: '100%' }}>
            <div>
              <Typography.Title level={3} style={{ margin: 0 }}>
                欢迎回来
              </Typography.Title>
            </div>

              <Form
              layout="vertical"
              initialValues={{ username: 'admin', password: 'admin123' }}
              onFinish={(v: any) => {
                const u = String(v?.username ?? '').trim()
                const p = String(v?.password ?? '').trim()
                if (u !== 'admin' || p !== 'admin123') {
                  void message.error('账号或密码错误')
                  return
                }
                login()
                navigate('/dashboard', { replace: true })
              }}
            >
              <Form.Item name="username" label="账号" rules={[{ required: true, message: '请输入账号' }]}>
                <Input placeholder="admin" autoComplete="username" size="large" />
              </Form.Item>
              <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
                <Input.Password placeholder="admin123" autoComplete="current-password" size="large" />
              </Form.Item>
              <Button type="primary" htmlType="submit" block size="large">
                登录
              </Button>
            </Form>
          </Space>
        </Card>
      </div>
    </div>
  )
}
