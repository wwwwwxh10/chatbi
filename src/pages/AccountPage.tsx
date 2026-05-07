import { Button, Card, Form, Input, Modal, Space, Tabs, Typography, message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { PageIntro } from '../components/PageIntro'

export default function AccountPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [form] = Form.useForm<{ oldPassword: string; newPassword: string; confirmPassword: string }>()

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageIntro title={t('header.user')} description={t('account.desc')} />

      <Card styles={{ body: { padding: 14 } }}>
        <Tabs
          items={[
            {
              key: 'password',
              label: t('header.changePassword'),
              children: (
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={async () => {
                    await new Promise((r) => setTimeout(r, 450))
                    void message.success(t('account.passwordUpdated'))
                    form.resetFields()
                  }}
                >
                  <Form.Item name="oldPassword" label={t('account.oldPassword')} rules={[{ required: true, message: t('validation.required') }]}>
                    <Input.Password placeholder="******" />
                  </Form.Item>
                  <Form.Item name="newPassword" label={t('account.newPassword')} rules={[{ required: true, message: t('validation.required') }]}>
                    <Input.Password placeholder="******" />
                  </Form.Item>
                  <Form.Item
                    name="confirmPassword"
                    label={t('account.confirmPassword')}
                    rules={[
                      { required: true, message: t('validation.required') },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('newPassword') === value) return Promise.resolve()
                          return Promise.reject(new Error(t('account.passwordMismatch')))
                        },
                      }),
                    ]}
                  >
                    <Input.Password placeholder="******" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit">
                    {t('actions.save')}
                  </Button>
                </Form>
              ),
            },
            {
              key: 'logout',
              label: t('header.logout'),
              children: (
                <Space direction="vertical" size={10} style={{ width: '100%' }}>
                  <Typography.Text type="secondary">{t('account.logoutHint')}</Typography.Text>
                  <Button
                    danger
                    onClick={() => {
                      Modal.confirm({
                        title: t('account.logoutConfirmTitle'),
                        okText: t('header.logout'),
                        cancelText: t('actions.cancel'),
                        okButtonProps: { danger: true },
                        onOk: () => navigate('/dashboard'),
                      })
                    }}
                  >
                    {t('header.logout')}
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </Space>
  )
}

