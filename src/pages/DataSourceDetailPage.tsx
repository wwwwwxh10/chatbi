import { Button, Card, Empty, Space, Typography } from 'antd'
import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useDataSourcesStore } from '../store/dataSourcesStore'
import { DataSourceDetail } from './dataSources/DataSourceDetail'

export default function DataSourceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const items = useDataSourcesStore((s) => s.items)

  const current = useMemo(() => items.find((x) => x.id === id), [id, items])

  if (!current) {
    return (
      <Card>
        <Empty
          description={null}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
        <div style={{ height: 10 }} />
        <Button onClick={() => navigate('/data-sources')}>返回</Button>
      </Card>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
      <div style={{ flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Space size={10} align="center">
          <Button type="text" onClick={() => navigate('/data-sources')} icon={<ArrowLeftOutlined />} />
          <Typography.Title level={5} style={{ margin: 0 }}>
            {current.name}
          </Typography.Title>
        </Space>
        <div />
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <DataSourceDetail dataSource={current} />
      </div>
    </div>
  )
}
