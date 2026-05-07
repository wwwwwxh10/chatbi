import { Button, Card, Empty, Space, Typography, theme } from 'antd'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { EChart } from '../components/EChart'
import type { EChartsOption } from 'echarts'

const STORAGE_KEY = 'chatbi-dashboard-preview'

function buildPreviewOption(): EChartsOption {
  return {
    grid: { left: 44, right: 18, top: 28, bottom: 28 },
    xAxis: {
      type: 'category',
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      axisLine: { lineStyle: { opacity: 0.35 } },
      axisLabel: { opacity: 0.7 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { opacity: 0.12 } },
      axisLabel: { opacity: 0.7 },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        data: [120, 132, 101, 134, 90, 230, 210],
        lineStyle: { width: 3 },
        areaStyle: { opacity: 0.12 },
      },
    ],
    tooltip: { trigger: 'axis' },
  }
}

export default function DashboardPreviewPage() {
  const { t } = useTranslation()
  const { token } = theme.useToken()
  const navigate = useNavigate()

  const preview = useMemo(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as { title?: string; description?: string; tables?: string[]; configText?: string }
      return {
        title: String(parsed?.title ?? ''),
        description: String(parsed?.description ?? ''),
        tables: Array.isArray(parsed?.tables) ? parsed.tables.map((x) => String(x)) : [],
        configText: String(parsed?.configText ?? ''),
      }
    } catch {
      return null
    }
  }, [])

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            查看{preview?.title ? ` ${preview.title}` : ''}
          </Typography.Title>
        </div>
        <Button onClick={() => navigate('/dashboard')}>{t('notFound.back')}</Button>
      </div>

      {!preview?.configText ? (
        <Card>
          <Empty description={t('dashboard.previewEmpty')} />
        </Card>
      ) : (
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Card>
            <div style={{ height: 360 }}>
              <EChart option={buildPreviewOption()} />
            </div>
          </Card>

          <Card title="主题">
            <Typography.Text>{preview.title || '-'}</Typography.Text>
          </Card>

          <Card title="描述">
            <Typography.Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>{preview.description || '-'}</Typography.Paragraph>
          </Card>

          <Card title="数据表">
            {preview.tables.length ? (
              <Typography.Paragraph style={{ marginBottom: 0 }}>{preview.tables.join('、')}</Typography.Paragraph>
            ) : (
              <Typography.Text type="secondary">-</Typography.Text>
            )}
          </Card>

          <Card title="配置文件">
            <Typography.Paragraph
              style={{
                marginBottom: 0,
                maxHeight: 260,
                overflow: 'auto',
                padding: 12,
                borderRadius: 10,
                background: token.colorFillTertiary,
                border: `1px solid ${token.colorSplit}`,
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                fontSize: 12,
                whiteSpace: 'pre-wrap',
              }}
            >
              {preview.configText.slice(0, 4000)}
            </Typography.Paragraph>
          </Card>
        </Space>
      )}
    </Space>
  )
}
