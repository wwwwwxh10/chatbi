import { Button, Card, Dropdown, Empty, Segmented, Space, Table, Tag, Typography, theme } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { BarChartOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons'
import { useEffect, useMemo, useState } from 'react'
import { EChart } from '../../components/EChart'
import type { MessageResult } from './chatUtils'

export function ChatResultPanel({
  view,
  onViewChange,
  result,
  onOpenSql,
  onExportCsv,
}: {
  view: 'chart' | 'table'
  onViewChange: (v: 'chart' | 'table') => void
  result?: MessageResult
  onOpenSql: () => void
  onExportCsv: () => void
}) {
  theme.useToken()

  const chartVariants = result?.chartVariants ?? (result?.chart ? { 图表: result.chart } : {})
  const chartKeys = Object.keys(chartVariants)
  const [chartKey, setChartKey] = useState<string>(() => chartKeys[0] ?? '')
  const chartOption = chartKey && chartVariants[chartKey] ? chartVariants[chartKey] : result?.chart

  useEffect(() => {
    setChartKey((prev) => (prev && chartVariants[prev] ? prev : chartKeys[0] ?? ''))
  }, [chartKeys.join('|')])

  const tableColumns: ColumnsType<Record<string, string | number | null>> = useMemo(() => {
    const cols = result?.table?.columns ?? []
    return cols.map((c) => ({ title: c, dataIndex: c, key: c, ellipsis: true }))
  }, [result?.table?.columns])

  return (
    <Card
      size="small"
      title="结果"
      styles={{ body: { height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 } }}
      extra={
        <Space size={8}>
          <Segmented
            size="small"
            value={view}
            options={[
              { label: '图表', value: 'chart' },
              { label: '表格', value: 'table' },
            ]}
            onChange={(v) => onViewChange(v === 'table' ? 'table' : 'chart')}
          />
          <Dropdown
            placement="bottomRight"
            menu={{
              items: chartKeys.map((k) => ({ key: k, label: k })),
              onClick: ({ key }) => setChartKey(String(key)),
            }}
          >
            <Button size="small" icon={<BarChartOutlined />} disabled={view !== 'chart' || chartKeys.length <= 1}>
              {chartKey || '图表'}
            </Button>
          </Dropdown>
          <Button size="small" icon={<EyeOutlined />} disabled={!result?.sql} onClick={onOpenSql}>
            查看 SQL
          </Button>
          <Dropdown
            placement="bottomRight"
            menu={{
              items: [{ key: 'csv', label: '导出 CSV' }],
              onClick: () => onExportCsv(),
            }}
          >
            <Button size="small" icon={<DownloadOutlined />} disabled={!result?.table}>
              导出
            </Button>
          </Dropdown>
        </Space>
      }
    >
      {!result ? (
        <div style={{ flex: 1, minHeight: 0, display: 'grid', placeItems: 'center' }}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" />
        </div>
      ) : (
        <Space direction="vertical" size={10} style={{ width: '100%', flex: 1, minHeight: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              {result.status === 'running' ? (
                <Tag color="processing">分析中</Tag>
              ) : result.status === 'stopped' ? (
                <Tag color="default">已停止</Tag>
              ) : (
                <Tag color="success">分析完毕</Tag>
              )}
            </div>
            {result.tookMs ? (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                用时 {Math.max(1, Math.round(result.tookMs / 1000))} 秒
              </Typography.Text>
            ) : null}
          </div>

          {result.status !== 'done' ? (
            <div style={{ flex: 1, minHeight: 0, display: 'grid', placeItems: 'center' }}>
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={result.status === 'running' ? '分析中…' : '已停止'} />
            </div>
          ) : (
            <>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                概述
              </Typography.Text>

              {view === 'chart' && result.metric ? (
                <div className="llmOutputBox" style={{ padding: 14 }}>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {result.metric.label}
                  </Typography.Text>
                  <div style={{ height: 10 }} />
                  <div style={{ fontSize: 40, fontWeight: 850, lineHeight: 1.05 }}>{result.metric.value}</div>
                </div>
              ) : null}

              {view === 'chart' ? (
                <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                  {chartOption ? (
                    <div className="llmOutputBox" style={{ height: 380, overflow: 'hidden', padding: 0 }}>
                      <EChart option={chartOption} />
                    </div>
                  ) : (
                    <div style={{ flex: 1, minHeight: 0, display: 'grid', placeItems: 'center' }}>
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="llmOutputBox" style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: 0 }}>
                  {result.table ? (
                    <Table
                      size="middle"
                      pagination={{ pageSize: 5 }}
                      columns={tableColumns}
                      dataSource={result.table.rows.map((r, i) => ({ ...r, key: i }))}
                      scroll={{ x: 'max-content', y: 'calc(100% - 56px)' }}
                    />
                  ) : (
                    <div style={{ height: '100%', display: 'grid', placeItems: 'center' }}>
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" />
                    </div>
                  )}
                </div>
              )}

              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                总结
              </Typography.Text>
              <Typography.Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{result.answerText}</Typography.Paragraph>
            </>
          )}
        </Space>
      )}
    </Card>
  )
}
