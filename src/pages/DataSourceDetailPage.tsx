import { Button, Card, Drawer, Empty, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDataSourcesStore } from '../store/dataSourcesStore'
import { DataSourceDetail } from './dataSources/DataSourceDetail'

export default function DataSourceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const items = useDataSourcesStore((s) => s.items)
  const [drawerHeight, setDrawerHeight] = useState(560)

  const current = useMemo(() => items.find((x) => x.id === id), [id, items])

  useEffect(() => {
    const compute = () => {
      const desired = window.innerHeight - 56
      setDrawerHeight(Math.max(480, Math.min(720, desired)))
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [])

  return (
    <Drawer
      open
      onClose={() => navigate('/data-sources')}
      placement="bottom"
      height={drawerHeight}
      title={<Typography.Text style={{ fontWeight: 750 }}>{current?.name ?? '数据源'}</Typography.Text>}
      destroyOnClose
      mask
      maskClosable
      keyboard
      getContainer={() => document.body}
      styles={{ mask: { background: 'rgba(0,0,0,0.28)' }, body: { padding: 12, height: '100%', minHeight: 0 } }}
    >
      {current ? (
        <div style={{ height: '100%', minHeight: 0, overflow: 'hidden' }}>
          <DataSourceDetail dataSource={current} />
        </div>
      ) : (
        <Card>
          <Empty description={null} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          <div style={{ height: 10 }} />
          <Button onClick={() => navigate('/data-sources')}>返回</Button>
        </Card>
      )}
    </Drawer>
  )
}
