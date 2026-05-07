import { Select, Space, Tag, Typography } from 'antd'
import { useMemo } from 'react'
import { DataSourceTypeIcon } from './DataSourceTypeIcon'
import { useDataSourcesStore } from '../store/dataSourcesStore'

type DataSourceStatus = 'ok' | 'error' | 'unknown'

function statusTag(status: DataSourceStatus) {
  if (status === 'ok') return <Tag color="success">正常</Tag>
  if (status === 'error') return <Tag color="error">异常</Tag>
  return <Tag color="default">未知</Tag>
}

export function DataSourcePicker({
  value,
  onChange,
  placeholder = '选择数据源',
  allowClear = true,
  size,
}: {
  value?: string
  onChange?: (v: string | undefined) => void
  placeholder?: string
  allowClear?: boolean
  size?: 'small' | 'middle' | 'large'
}) {
  const items = useDataSourcesStore((s) => s.items)

  const options = useMemo(
    () =>
      items.map((ds) => ({
        value: ds.id,
        label: (
          <Space size={10} style={{ minWidth: 0 }}>
            <span style={{ width: 22, height: 22, display: 'grid', placeItems: 'center' }}>
              <DataSourceTypeIcon type={ds.type} size={18} />
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <Typography.Text style={{ display: 'block' }} ellipsis>
                {ds.name}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }} ellipsis>
                {String(ds.type).toUpperCase()}
              </Typography.Text>
            </div>
            <span style={{ flex: 'none' }}>{statusTag(ds.status as DataSourceStatus)}</span>
          </Space>
        ),
        title: `${ds.name} ${ds.type} ${ds.status}`,
      })),
    [items],
  )

  return (
    <Select
      value={value}
      allowClear={allowClear}
      showSearch
      placeholder={placeholder}
      options={options}
      size={size}
      filterOption={(input, opt) => String((opt as any)?.title ?? '').toLowerCase().includes(input.trim().toLowerCase())}
      onChange={(v) => onChange?.(v ? String(v) : undefined)}
      style={{ width: '100%' }}
    />
  )
}

