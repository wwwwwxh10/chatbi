import {
  Button,
  Card,
  Col,
  Divider,
  Dropdown,
  Empty,
  Input,
  InputNumber,
  Modal,
  Radio,
  Row,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
  theme,
  TreeSelect,
} from 'antd'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
 
import { PageIntro } from '../components/PageIntro'
import { useAppStore } from '../store/appStore'
import {
  CloudDownloadOutlined,
  CloudUploadOutlined,
  CommentOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  MoreOutlined,
  PlusOutlined,
  RightOutlined,
} from '@ant-design/icons'
import { TemplateBadge } from '../components/TemplateBadge'
import tplCover1 from '../assets/dashboard-tpl-1.svg'
import tplCover2 from '../assets/dashboard-tpl-2.svg'
import tplCover3 from '../assets/dashboard-tpl-3.svg'
import tplCover4 from '../assets/dashboard-tpl-4.svg'
import { UploadPanel } from '../components/UploadPanel'
import { AppGridIcon } from '../components/icons/AppGridIcon'
import { DataTableIcon } from '../components/icons/DataTableIcon'
import { DatasetPreviewModal } from '../components/DatasetPreviewModal'
import { DashboardIcon } from '../components/icons/DashboardIcon'

type DashboardTemplate = {
  id: string
  title: string
  desc: string
  cover: string
}

type CustomDashboard = {
  id: string
  title: string
  description?: string
  tables: string[]
  updatedAt: string
  published: boolean
  configText?: string
}

function nowText() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ')
}

export default function DashboardPage({ refreshKey }: { refreshKey?: number }) {
  const { t } = useTranslation()
  const { token } = theme.useToken()
  const locale = useAppStore((s) => s.locale)
  const themeMode = useAppStore((s) => s.themeMode)

  const primaryButtonStyle = { borderColor: token.colorPrimary, color: token.colorText }

  const openChatWorkspace = ({ template, dashboardId }: { template?: string; dashboardId?: string }) => {
    const qs = new URLSearchParams()
    if (template) qs.set('template', template)
    if (dashboardId) qs.set('dashboardId', dashboardId)
    window.open(`/dashboard/chat-workspace?${qs.toString()}`, '_blank', 'noopener,noreferrer')
  }

  const dataSources = useMemo(
    () => [
      { id: 'ds-biz', name: '业务库', type: 'PostgreSQL', tables: ['orders', 'order_items', 'users', 'events', 'products', 'sessions'] },
      { id: 'ds-warehouse', name: '数仓', type: 'Hive', tables: ['dwd_orders', 'dwd_users', 'dws_metrics_daily', 'ads_growth_report'] },
    ],
    [],
  )

  const templates: DashboardTemplate[] = useMemo(
    () => [
      {
        id: 'ops-core',
        title: '核心运营指标',
        desc: '适用于日常运营看板与异常定位，覆盖关键 KPI、趋势与分布。',
        cover: tplCover1,
      },
      {
        id: 'channel-growth',
        title: '渠道增长分析',
        desc: '拆解渠道结构变化，观察投放、自然流量与活动带来的增量。',
        cover: tplCover2,
      },
      {
        id: 'retention',
        title: '留存与转化',
        desc: '关注漏斗与留存路径，定位转化瓶颈并输出优化建议。',
        cover: tplCover3,
      },
      {
        id: 'product-insight',
        title: '产品洞察',
        desc: '按功能与人群切片，观察功能使用、偏好与关键行为变化。',
        cover: tplCover4,
      },
    ],
    [refreshKey],
  )

  const [customDashboards, setCustomDashboards] = useState<CustomDashboard[]>(() => [
    {
      id: 'custom-1',
      title: '指标看板',
      description: '覆盖核心指标、趋势与结构分布，用于日常运营监控。',
      tables: ['orders', 'users', 'events', 'products', 'sessions'],
      updatedAt: '2026-04-27 16:12',
      published: true,
      configText: '{\n  "name": "指标看板"\n}',
    },
    {
      id: 'custom-2',
      title: '订单分析',
      description: '按渠道/品类/地域拆解订单与支付，定位波动原因。',
      tables: ['orders', 'order_items', 'products'],
      updatedAt: '2026-04-26 11:08',
      published: true,
      configText: '{\n  "name": "订单分析"\n}',
    },
    {
      id: 'custom-3',
      title: '用户增长',
      description: '关注新增、留存与召回，辅助增长策略评估。',
      tables: ['users', 'events', 'sessions'],
      updatedAt: '2026-04-25 19:42',
      published: false,
      configText: '{\n  "name": "用户增长"\n}',
    },
    {
      id: 'custom-4',
      title: '活动复盘',
      description: '活动期间关键指标对比与人群分层复盘。',
      tables: ['events', 'orders', 'users'],
      updatedAt: '2026-04-24 09:30',
      published: false,
      configText: '{\n  "name": "活动复盘"\n}',
    },
    {
      id: 'custom-5',
      title: '渠道投放监控',
      description: '投放成本、转化与 ROI 监控面板。',
      tables: ['sessions', 'events', 'orders'],
      updatedAt: '2026-04-23 13:05',
      published: true,
      configText: '{\n  "name": "渠道投放监控"\n}',
    },
  ])

  const [createOpen, setCreateOpen] = useState(false)
  const [cfgFile, setCfgFile] = useState<File | null>(null)
  const [cfgText, setCfgText] = useState<string>('')
  const [cfgError, setCfgError] = useState<string>('')
  const [cfgTitle, setCfgTitle] = useState<string>('')
  const [cfgDesc, setCfgDesc] = useState<string>('')
  const [cfgDataSourceId, setCfgDataSourceId] = useState<string>('')
  const [cfgTables, setCfgTables] = useState<string[]>([])
  const [cfgTableSearch, setCfgTableSearch] = useState('')
  const [cfgLayoutMode, setCfgLayoutMode] = useState<'template' | 'free'>('template')
  const [cfgLayoutTemplate, setCfgLayoutTemplate] = useState<'main-sub' | 'three-col' | 'sidebar'>('main-sub')
  const [cfgFreeCols, setCfgFreeCols] = useState<number>(12)
  const [cfgFreeRowHeight, setCfgFreeRowHeight] = useState<number>(88)
  const [cfgFreeGap, setCfgFreeGap] = useState<number>(12)
  const [applying, setApplying] = useState(false)
  const [exampleOpen, setExampleOpen] = useState(false)

  const openCreate = () => {
    setCreateOpen(true)
    setCfgFile(null)
    setCfgText('')
    setCfgError('')
    setCfgTitle('')
    setCfgDesc('')
    setCfgDataSourceId('')
    setCfgTables([])
    setCfgLayoutMode('template')
    setCfgLayoutTemplate('main-sub')
    setCfgFreeCols(12)
    setCfgFreeRowHeight(88)
    setCfgFreeGap(12)
    setApplying(false)
    setExampleOpen(false)
  }

  const closeCreate = () => {
    setCreateOpen(false)
    setCfgFile(null)
    setCfgText('')
    setCfgError('')
    setCfgTitle('')
    setCfgDesc('')
    setCfgDataSourceId('')
    setCfgTables([])
    setCfgLayoutMode('template')
    setCfgLayoutTemplate('main-sub')
    setCfgFreeCols(12)
    setCfgFreeRowHeight(88)
    setCfgFreeGap(12)
    setApplying(false)
    setExampleOpen(false)
  }

  const chartLibraryUrl = '/chart-library.html'

  const [casesOpen, setCasesOpen] = useState(false)
  const [layoutExamplesOpen, setLayoutExamplesOpen] = useState(false)
  const [editing, setEditing] = useState<CustomDashboard | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editConfig, setEditConfig] = useState('')
  const [editTables, setEditTables] = useState<string[]>([])
  const [editDataSourceId, setEditDataSourceId] = useState<string>('')
  const [editTableSearch, setEditTableSearch] = useState('')
  const [editCfgError, setEditCfgError] = useState('')
  const [editCfgSeedKey, setEditCfgSeedKey] = useState<string>('')
  const [editCfgSeedName, setEditCfgSeedName] = useState<string>('')
  const [editLayoutMode, setEditLayoutMode] = useState<'template' | 'free'>('template')
  const [editLayoutTemplate, setEditLayoutTemplate] = useState<'main-sub' | 'three-col' | 'sidebar'>('main-sub')
  const [editFreeCols, setEditFreeCols] = useState<number>(12)
  const [editFreeRowHeight, setEditFreeRowHeight] = useState<number>(88)
  const [editFreeGap, setEditFreeGap] = useState<number>(12)

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewTitle, setPreviewTitle] = useState('')
  const [previewDesc, setPreviewDesc] = useState('')
  const [previewTables, setPreviewTables] = useState<string[]>([])
  const [previewCfgSeedKey, setPreviewCfgSeedKey] = useState<string>('')
  const [previewCfgSeedName, setPreviewCfgSeedName] = useState<string>('')
  const [previewLayoutMode, setPreviewLayoutMode] = useState<'template' | 'free'>('template')
  const [previewLayoutTemplate, setPreviewLayoutTemplate] = useState<'main-sub' | 'three-col' | 'sidebar'>('main-sub')
  const [previewFreeCols, setPreviewFreeCols] = useState<number>(12)
  const [previewFreeRowHeight, setPreviewFreeRowHeight] = useState<number>(88)
  const [previewFreeGap, setPreviewFreeGap] = useState<number>(12)

  const [tablePreviewOpen, setTablePreviewOpen] = useState(false)
  const [tablePreviewTables, setTablePreviewTables] = useState<string[]>([])
  const [tablePreviewActive, setTablePreviewActive] = useState('')
  const [tablePreviewDefaultTab, setTablePreviewDefaultTab] = useState<'preview' | 'fields'>('preview')

  const [deleteDashboardTarget, setDeleteDashboardTarget] = useState<{ id: string; title: string } | null>(null)
  const [deleteBlockedTarget, setDeleteBlockedTarget] = useState<{ title: string } | null>(null)

  const parseLayoutFromConfig = (configText: string) => {
    try {
      const obj = JSON.parse(configText)
      const layout = obj?.layout
      if (!layout || typeof layout !== 'object') return null
      if (layout.mode === 'template') {
        const tpl = (layout.template as any) || 'main-sub'
        return { mode: 'template' as const, template: tpl }
      }
      if (layout.mode === 'free') {
        return {
          mode: 'free' as const,
          cols: Number(layout.cols ?? 12),
          rowHeight: Number(layout.rowHeight ?? 88),
          gap: Number(layout.gap ?? 12),
        }
      }
      return null
    } catch {
      return null
    }
  }

  const pickDataSourceIdForTables = (tables: string[]) => {
    const first = tables[0]
    if (!first) return dataSources[0]?.id ?? ''
    const hit = dataSources.find((ds) => ds.tables.includes(first))
    return hit?.id ?? dataSources[0]?.id ?? ''
  }

  const previewDisplayDataSourceId = useMemo(() => pickDataSourceIdForTables(previewTables), [previewTables, dataSources])

  const openPreviewModal = (payload: { title: string; description: string; tables: string[]; configText: string }) => {
    setPreviewTitle(payload.title)
    setPreviewDesc(payload.description)
    setPreviewTables(payload.tables)
    setPreviewCfgSeedKey(payload.title || String(Date.now()))
    setPreviewCfgSeedName(payload.configText ? (locale === 'zh-CN' ? '已上传配置文件' : 'Uploaded config file') : '')
    const parsed = parseLayoutFromConfig(payload.configText)
    if (parsed?.mode === 'template') {
      setPreviewLayoutMode('template')
      setPreviewLayoutTemplate(parsed.template as any)
    } else if (parsed?.mode === 'free') {
      setPreviewLayoutMode('free')
      setPreviewFreeCols(parsed.cols)
      setPreviewFreeRowHeight(parsed.rowHeight)
      setPreviewFreeGap(parsed.gap)
    } else {
      setPreviewLayoutMode('template')
      setPreviewLayoutTemplate('main-sub')
    }
    setPreviewOpen(true)
  }

  const openTablePreview = (tables: string[], active: string) => {
    setTablePreviewTables(tables)
    setTablePreviewActive(active)
    setTablePreviewDefaultTab('preview')
    setTablePreviewOpen(true)
  }

  const openTableFields = (tables: string[], active: string) => {
    setTablePreviewTables(tables)
    setTablePreviewActive(active)
    setTablePreviewDefaultTab('preview')
    setTablePreviewOpen(true)
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageIntro title={t('intro.dashboard.title')} description={t('intro.dashboard.desc')} />

      <Card
        className="dashboardInspiration"
        styles={{ body: { padding: 14 } }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {t('dashboard.inspirationTitle')}
          </Typography.Title>
          <Button type="link" onClick={() => setCasesOpen(true)} style={{ paddingInline: 0 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {t('dashboard.viewAllCases')}
              <RightOutlined style={{ fontSize: 12, opacity: 0.85 }} />
            </span>
          </Button>
        </div>

        <div className="dashboardInspirationGrid" style={{ marginTop: 12 }}>
          {templates.map((tpl) => (
            <Card
              key={tpl.id}
              hoverable
              className="dashboardCaseCard"
              onClick={() => openChatWorkspace({ template: tpl.id })}
              styles={{ body: { padding: 12 } }}
              cover={
                <div className="dashboardCaseCover">
                  <div className="dashboardTemplateBadge">
                    <TemplateBadge size={28} />
                  </div>
                  <img src={tpl.cover} alt={tpl.title} loading="lazy" />
                </div>
              }
            >
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                <Typography.Text strong>{tpl.title}</Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {tpl.desc}
                </Typography.Text>
              </Space>
            </Card>
          ))}
        </div>
      </Card>

      <Card styles={{ body: { padding: 14 } }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <Typography.Title level={5} style={{ margin: 0 }}>
              {t('dashboard.customSection')}
            </Typography.Title>
          </div>
          <Space>
            <Button
              icon={
                <AppGridIcon
                  size={18}
                  primary={token.colorPrimary}
                  secondary={themeMode === 'dark' ? 'rgba(255,255,255,0.70)' : 'rgba(15,23,42,0.55)'}
                />
              }
              style={primaryButtonStyle}
              href={chartLibraryUrl}
              target="_blank"
              rel="noreferrer"
            >
              {t('dashboard.componentLibrary')}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              {t('dashboard.create')}
            </Button>
          </Space>
        </div>

        <Divider style={{ margin: '12px 0' }} />

        {customDashboards.length === 0 ? (
          <Empty description={t('dashboard.customEmpty')} />
        ) : (
          <Table
            size="middle"
            tableLayout="fixed"
            pagination={{ pageSize: 5 }}
            dataSource={customDashboards.map((d) => ({ ...d, key: d.id }))}
            columns={[
              {
                title: t('dashboard.table.name'),
                dataIndex: 'title',
                key: 'title',
                width: 220,
                ellipsis: true,
                render: (v: string) => (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <DashboardIcon size={16} primaryColor={token.colorPrimary} secondaryColor={token.colorTextSecondary} />
                    <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(v ?? '')}</span>
                  </span>
                ),
              },
              {
                title: t('dashboard.table.publishStatus'),
                dataIndex: 'published',
                key: 'published',
                width: 96,
                render: (v: boolean) =>
                  v ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 6, height: 6, borderRadius: 99, background: token.colorPrimary }} />
                      <span style={{ color: token.colorText }}>{locale === 'zh-CN' ? '已发布' : 'Published'}</span>
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 6, height: 6, borderRadius: 99, background: token.colorTextTertiary }} />
                      <span style={{ color: token.colorTextSecondary }}>{locale === 'zh-CN' ? '已下线' : 'Offline'}</span>
                    </span>
                  ),
              },
              {
                title: t('dashboard.table.tables'),
                dataIndex: 'tables',
                key: 'tables',
                render: (v: string[]) => {
                  const arr = Array.isArray(v) ? v.map((x) => String(x)) : []
                  const tooLong = arr.some((x) => x.length > 12)
                  const shown = tooLong ? [] : arr.slice(0, 3)
                  const rest = arr.length - shown.length
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', overflow: 'hidden', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
                      {shown.map((x) => (
                        <Tag
                          key={x}
                          style={{ maxWidth: 112, overflow: 'hidden', marginInlineEnd: 0, cursor: 'pointer' }}
                          onClick={() => openTablePreview(arr, x)}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, maxWidth: 96 }}>
                            <DataTableIcon size={14} color={token.colorTextSecondary} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x}</span>
                          </span>
                        </Tag>
                      ))}
                      {rest > 0 ? (
                        <Tooltip
                          title={
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {arr.map((x) => (
                                <div
                                  key={x}
                                  onClick={() => openTablePreview(arr, x)}
                                  style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                                >
                                  <DataTableIcon size={14} color={token.colorTextSecondary} />
                                  <span>{x}</span>
                                </div>
                              ))}
                            </div>
                          }
                        >
                          <Tag style={{ flex: 'none', marginInlineEnd: 0 }}>+{rest}</Tag>
                        </Tooltip>
                      ) : null}
                    </div>
                  )
                },
              },
              { title: t('dashboard.table.updatedAt'), dataIndex: 'updatedAt', key: 'updatedAt', width: 160 },
              {
                title: t('knowledge.table.actions'),
                key: 'actions',
                width: 160,
                align: 'right' as const,
                render: (_: unknown, r: CustomDashboard) => (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', columnGap: 6, width: '100%', justifyItems: 'center' }}>
                    <Tooltip title={t('dashboard.customActions.preview')}>
                      <Button
                        type="text"
                        className="iconOnly"
                        icon={<EyeOutlined />}
                        onClick={() => {
                          openPreviewModal({
                            title: r.title,
                            description: r.description ?? '',
                            tables: r.tables ?? [],
                            configText: r.configText ?? '',
                          })
                        }}
                      />
                    </Tooltip>
                    <Tooltip title={t('dashboard.customActions.edit')}>
                      <Button
                        type="text"
                        className="iconOnly"
                        icon={<EditOutlined />}
                        onClick={() => {
                          setEditing(r)
                          setEditTitle(r.title)
                          setEditDesc(r.description ?? '')
                          setEditConfig(r.configText ?? '')
                          setEditTables(r.tables ?? [])
                          setEditDataSourceId(pickDataSourceIdForTables(r.tables ?? []))
                          setEditTableSearch('')
                          setEditCfgError('')
                          setEditCfgSeedKey(String(r.id ?? Date.now()))
                          setEditCfgSeedName(r.configText ? (locale === 'zh-CN' ? '已上传配置文件' : 'Uploaded config file') : '')
                          const parsed = parseLayoutFromConfig(r.configText ?? '')
                          if (parsed?.mode === 'template') {
                            setEditLayoutMode('template')
                            setEditLayoutTemplate(parsed.template as any)
                          } else if (parsed?.mode === 'free') {
                            setEditLayoutMode('free')
                            setEditFreeCols(parsed.cols)
                            setEditFreeRowHeight(parsed.rowHeight)
                            setEditFreeGap(parsed.gap)
                          } else {
                            setEditLayoutMode('template')
                            setEditLayoutTemplate('main-sub')
                            setEditFreeCols(12)
                            setEditFreeRowHeight(88)
                            setEditFreeGap(12)
                          }
                          setEditOpen(true)
                        }}
                      />
                    </Tooltip>
                    <Tooltip title={t('dashboard.startChat')}>
                      <span>
                        <Button
                          type="text"
                          className="iconOnly"
                          icon={<CommentOutlined />}
                          disabled={!r.published}
                          onClick={() => {
                            if (!r.published) return
                            openChatWorkspace({ dashboardId: r.id })
                          }}
                        />
                      </span>
                    </Tooltip>
                    <Dropdown
                      trigger={['click']}
                      placement="bottomRight"
                      menu={{
                        items: [
                          {
                            key: 'publish',
                            label: r.published ? t('dashboard.customActions.unpublish') : t('dashboard.customActions.publish'),
                            icon: r.published ? <CloudDownloadOutlined /> : <CloudUploadOutlined />,
                          },
                          { type: 'divider' as const },
                          {
                            key: 'delete',
                            label: t('dashboard.customActions.delete'),
                            icon: <DeleteOutlined />,
                            danger: true,
                            disabled: false,
                          },
                        ],
                        onClick: ({ key }) => {
                          if (key === 'publish') {
                            setCustomDashboards((prev) => prev.map((x) => (x.id === r.id ? { ...x, published: !x.published, updatedAt: nowText() } : x)))
                            return
                          }
                          if (key === 'delete') {
                            if (r.published) {
                              setDeleteBlockedTarget({ title: r.title })
                              return
                            }
                            setDeleteDashboardTarget({ id: r.id, title: r.title })
                          }
                        },
                      }}
                    >
                      <Button type="text" className="iconOnly" icon={<MoreOutlined />} />
                    </Dropdown>
                  </div>
                ),
              },
            ]}
            scroll={{ x: 'max-content' }}
          />
        )}
      </Card>

      <Modal
        open={createOpen}
        onCancel={closeCreate}
        title={t('dashboard.create')}
        width={920}
        centered
        destroyOnHidden
        footer={
          <Space style={{ width: '100%', justifyContent: 'flex-end' }} size={12}>
            <Button onClick={closeCreate}>{t('actions.cancel')}</Button>
            <Button
              type="primary"
              disabled={
                !cfgTitle.trim() ||
                !cfgDesc.trim() ||
                !cfgFile ||
                !cfgText.trim() ||
                !!cfgError ||
                !cfgDataSourceId ||
                cfgTables.length === 0 ||
                (cfgLayoutMode === 'template'
                  ? !cfgLayoutTemplate
                  : !(cfgFreeCols >= 4 && cfgFreeCols <= 24 && cfgFreeRowHeight >= 60 && cfgFreeRowHeight <= 240 && cfgFreeGap >= 0 && cfgFreeGap <= 32))
              }
              aria-disabled={
                !cfgTitle.trim() ||
                !cfgDesc.trim() ||
                !cfgFile ||
                !cfgText.trim() ||
                !!cfgError ||
                !cfgDataSourceId ||
                cfgTables.length === 0 ||
                (cfgLayoutMode === 'template'
                  ? !cfgLayoutTemplate
                  : !(cfgFreeCols >= 4 && cfgFreeCols <= 24 && cfgFreeRowHeight >= 60 && cfgFreeRowHeight <= 240 && cfgFreeGap >= 0 && cfgFreeGap <= 32))
              }
              loading={applying}
              onClick={async () => {
                setApplying(true)
                await new Promise((r) => setTimeout(r, 650))
                setApplying(false)
                const layout =
                  cfgLayoutMode === 'template'
                    ? { mode: 'template', template: cfgLayoutTemplate }
                    : { mode: 'free', cols: cfgFreeCols, rowHeight: cfgFreeRowHeight, gap: cfgFreeGap }

                let mergedCfgText = cfgText
                try {
                  const obj = JSON.parse(cfgText)
                  if (obj && typeof obj === 'object') {
                    ;(obj as any).layout = layout
                    mergedCfgText = JSON.stringify(obj, null, 2)
                  }
                } catch {
                }

                setCustomDashboards((prev) => [
                  {
                    id: `custom-${Date.now()}`,
                    title: cfgTitle.trim(),
                    description: cfgDesc.trim(),
                    tables: cfgTables.slice(0, 10),
                    updatedAt: nowText(),
                    published: false,
                    configText: mergedCfgText,
                  },
                  ...prev,
                ])
                void message.success(locale === 'zh-CN' ? '已保存' : 'Saved')
                closeCreate()
              }}
            >
              {locale === 'zh-CN' ? '保存' : 'Save'}
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <div>
            <Typography.Text type="secondary">
              <span style={{ color: token.colorError, marginRight: 4 }}>*</span>
              {locale === 'zh-CN' ? '主题' : 'Topic'}
            </Typography.Text>
            <div style={{ height: 8 }} />
            <Input
              value={cfgTitle}
              onChange={(e) => setCfgTitle(e.target.value)}
              placeholder={locale === 'zh-CN' ? '例如：指标看板' : 'e.g. KPI Dashboard'}
            />
          </div>

          <div>
            <Typography.Text type="secondary">
              <span style={{ color: token.colorError, marginRight: 4 }}>*</span>
              {locale === 'zh-CN' ? '描述' : 'Description'}
            </Typography.Text>
            <div style={{ height: 8 }} />
            <Input.TextArea
              value={cfgDesc}
              onChange={(e) => setCfgDesc(e.target.value)}
              autoSize={{ minRows: 3, maxRows: 5 }}
              placeholder={locale === 'zh-CN' ? '补充说明该仪表盘的用途与口径范围' : 'Describe the purpose and scope'}
            />
          </div>

          <div>
            <Typography.Text type="secondary">
              <span style={{ color: token.colorError, marginRight: 4 }}>*</span>
              {locale === 'zh-CN' ? '数据表' : 'Data tables'}
            </Typography.Text>
            <div style={{ height: 8 }} />

            <TreeSelect
              style={{ width: '100%' }}
              dropdownStyle={{ width: 760 }}
              value={cfgDataSourceId ? cfgTables.map((tb) => `${cfgDataSourceId}::${tb}`) : []}
              treeCheckable
              showCheckedStrategy={TreeSelect.SHOW_CHILD}
              maxTagCount="responsive"
              placeholder={locale === 'zh-CN' ? '选择数据表' : 'Select tables'}
              showSearch={false}
              filterTreeNode={false}
              dropdownRender={() => {
                const q = cfgTableSearch.trim().toLowerCase()
                const dsVisible = dataSources.filter((ds) => {
                  if (!q) return true
                  if (ds.name.toLowerCase().includes(q)) return true
                  return ds.tables.some((tb) => tb.toLowerCase().includes(q))
                })
                const activeDs = dataSources.find((x) => x.id === cfgDataSourceId) ?? dsVisible[0] ?? dataSources[0]
                const activeTables = (activeDs?.tables ?? []).filter((tb) => {
                  if (!q) return true
                  return tb.toLowerCase().includes(q) || (activeDs?.name ?? '').toLowerCase().includes(q)
                })

                const selectBox = (checked: boolean) => (
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 3,
                      border: `1px solid ${checked ? token.colorPrimary : token.colorSplit}`,
                      background: checked ? token.colorPrimary : 'transparent',
                      display: 'grid',
                      placeItems: 'center',
                      flex: 'none',
                      color: token.colorTextLightSolid,
                      fontSize: 10,
                      lineHeight: '10px',
                    }}
                  >
                    {checked ? '✓' : null}
                  </span>
                )

                return (
                  <div style={{ padding: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <Input
                        value={cfgTableSearch}
                        onChange={(e) => setCfgTableSearch(e.target.value)}
                        placeholder={locale === 'zh-CN' ? '搜索数据源或数据表' : 'Search data source or table'}
                      />
                      <Space size={8}>
                        <Button
                          size="small"
                          disabled={!activeDs}
                          onClick={() => {
                            if (!activeDs) return
                            if (cfgTables.length) {
                              setCfgDataSourceId(activeDs.id)
                              setCfgTables([])
                              return
                            }
                            const tables = Array.from(new Set(activeTables)).slice(0, 10)
                            setCfgDataSourceId(activeDs.id)
                            setCfgTables(tables)
                            if (activeTables.length > 10) void message.warning(t('dashboard.tablesLimit'))
                          }}
                        >
                          {cfgTables.length ? (locale === 'zh-CN' ? '清空' : 'Clear') : (locale === 'zh-CN' ? '全选' : 'Select all')}
                        </Button>
                      </Space>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 3fr',
                        border: `1px solid ${token.colorSplit}`,
                        borderRadius: 12,
                        overflow: 'hidden',
                        height: 280,
                        background: token.colorBgContainer,
                      }}
                    >
                      <div style={{ overflow: 'auto', padding: 10, borderRight: `1px solid ${token.colorSplit}` }}>
                        <Space direction="vertical" size={6} style={{ width: '100%' }}>
                          {dsVisible.map((ds) => {
                            const active = activeDs?.id === ds.id
                            return (
                              <div
                                key={ds.id}
                                onClick={() => {
                                  if (cfgDataSourceId !== ds.id) {
                                    setCfgDataSourceId(ds.id)
                                    setCfgTables([])
                                  }
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 10,
                                  padding: '8px 10px',
                                  borderRadius: 10,
                                  border: `1px solid ${token.colorSplit}`,
                                  background: token.colorBgContainer,
                                  cursor: 'pointer',
                                }}
                              >
                                {selectBox(active)}
                                <DatabaseOutlined style={{ opacity: 0.75 }} />
                                <div style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ds.name}</div>
                              </div>
                            )
                          })}
                        </Space>
                      </div>

                      <div style={{ overflow: 'auto', padding: 10 }}>
                        {activeDs ? (
                          <Space direction="vertical" size={8} style={{ width: '100%' }}>
                            {activeTables.map((tb) => {
                              const checked = cfgTables.includes(tb)
                              return (
                                <div
                                  key={tb}
                                  onClick={() => {
                                    const next = checked ? cfgTables.filter((x) => x !== tb) : Array.from(new Set([...cfgTables, tb]))
                                    setCfgDataSourceId(activeDs.id)
                                    setCfgTables(next.slice(0, 10))
                                    if (next.length > 10) void message.warning(t('dashboard.tablesLimit'))
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: '8px 10px',
                                    borderRadius: 10,
                                    border: `1px solid ${token.colorSplit}`,
                                    cursor: 'pointer',
                                  }}
                                >
                                  {selectBox(checked)}
                                  <DataTableIcon size={14} color={token.colorTextSecondary} />
                                  <div style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tb}</div>
                                </div>
                              )
                            })}
                            {activeTables.length === 0 ? <Empty description={locale === 'zh-CN' ? '暂无匹配数据表' : 'No tables'} /> : null}
                          </Space>
                        ) : (
                          <Empty description={locale === 'zh-CN' ? '请选择数据源' : 'Select data source'} />
                        )}
                      </div>
                    </div>
                  </div>
                )
              }}
              treeData={dataSources.map((ds) => ({
                value: ds.id,
                key: ds.id,
                title: (
                  <Space size={10}>
                    <DatabaseOutlined style={{ opacity: 0.75 }} />
                    <span>{ds.name}</span>
                  </Space>
                ),
                children: ds.tables.map((tb) => ({
                  value: `${ds.id}::${tb}`,
                  key: `${ds.id}::${tb}`,
                  title: (
                    <Space size={10}>
                      <DataTableIcon size={14} color={token.colorTextSecondary} />
                      <span>{tb}</span>
                    </Space>
                  ),
                })),
              }))}
              onChange={(vals) => {
                const arr = (Array.isArray(vals) ? vals : [vals]).map((x) => String(x)).filter((x) => x.includes('::'))
                if (arr.length === 0) {
                  setCfgDataSourceId('')
                  setCfgTables([])
                  return
                }
                const dsId = String(arr[0].split('::')[0])
                const same = arr.filter((v) => v.startsWith(`${dsId}::`))
                const tables = Array.from(new Set(same.map((v) => String(v.split('::')[1])))).slice(0, 10)
                setCfgDataSourceId(dsId)
                setCfgTables(tables)
                if (same.length > 10) void message.warning(t('dashboard.tablesLimit'))
              }}
            />

          </div>

          <div>
            <Typography.Text type="secondary">
              <span style={{ color: token.colorError, marginRight: 4 }}>*</span>
              {locale === 'zh-CN' ? '页面布局' : 'Layout'}
            </Typography.Text>
            <div style={{ height: 8 }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <Radio.Group
                value={(cfgLayoutMode === 'free' ? 'custom' : cfgLayoutTemplate) as any}
                onChange={(e) => {
                  const v = String(e.target.value)
                  if (v === 'custom') {
                    setCfgLayoutMode('free')
                    return
                  }
                  setCfgLayoutMode('template')
                  setCfgLayoutTemplate(v as any)
                }}
              >
                <Space size={16} wrap>
                  <Radio value="main-sub">主次</Radio>
                  <Radio value="three-col">三列</Radio>
                  <Radio value="sidebar">侧栏</Radio>
                  <Radio value="custom">自定义</Radio>
                </Space>
              </Radio.Group>

              <Button type="link" style={{ paddingInline: 0 }} onClick={() => setLayoutExamplesOpen(true)}>
                布局样式
              </Button>
            </div>

            {cfgLayoutMode === 'free' ? (
              <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
                <div>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {locale === 'zh-CN' ? '列数' : 'Columns'}
                  </Typography.Text>
                  <div style={{ height: 6 }} />
                  <InputNumber min={4} max={24} value={cfgFreeCols} onChange={(v) => setCfgFreeCols(Number(v ?? 12))} style={{ width: '100%' }} />
                </div>
                <div>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {locale === 'zh-CN' ? '行高' : 'Row height'}
                  </Typography.Text>
                  <div style={{ height: 6 }} />
                  <InputNumber min={60} max={240} value={cfgFreeRowHeight} onChange={(v) => setCfgFreeRowHeight(Number(v ?? 88))} style={{ width: '100%' }} />
                </div>
                <div>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {locale === 'zh-CN' ? '间距' : 'Gap'}
                  </Typography.Text>
                  <div style={{ height: 6 }} />
                  <InputNumber min={0} max={32} value={cfgFreeGap} onChange={(v) => setCfgFreeGap(Number(v ?? 12))} style={{ width: '100%' }} />
                </div>
              </div>
            ) : null}
          </div>

          <Space direction="vertical" size={10} style={{ width: '100%' }}>
            <Typography.Text type="secondary">
              <span style={{ color: token.colorError, marginRight: 4 }}>*</span>
              {locale === 'zh-CN' ? '图表配置' : 'Chart config'}
            </Typography.Text>
            <UploadPanel
              title={locale === 'zh-CN' ? '配置文件' : 'Config file'}
              description={locale === 'zh-CN' ? '支持 .json/.yaml/.yml/.txt' : 'Supports .json/.yaml/.yml/.txt'}
              height={220}
              accept=".json,.yaml,.yml,.txt,application/json,text/plain"
              maxCount={1}
              onChange={async (info) => {
                const f = info.file?.originFileObj
                if (!(f instanceof File)) return
                setCfgFile(f)
                setCfgError('')
                try {
                  const txt = await f.text()
                  if (/\.json$/i.test(f.name)) JSON.parse(txt)
                  setCfgText(txt)
                } catch {
                  setCfgText('')
                  setCfgError(t('dashboard.uploadInvalid'))
                }
              }}
            />

            <Button type="link" style={{ paddingInline: 0, alignSelf: 'flex-start' }} onClick={() => setExampleOpen(true)}>
              {t('dashboard.viewConfigExample')}
            </Button>

            {cfgError ? <Typography.Text style={{ color: token.colorError }}>{cfgError}</Typography.Text> : null}
          </Space>
        </Space>
      </Modal>

      <Modal
        open={exampleOpen}
        onCancel={() => setExampleOpen(false)}
        footer={null}
        title={t('dashboard.viewConfigExample')}
        width={860}
        destroyOnHidden
        centered
      >
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {locale === 'zh-CN'
            ? '示例仅用于说明字段结构；实际可按业务扩展图表、指标与筛选器。'
            : 'Example shows the structure only; extend charts, metrics and filters as needed.'}
        </Typography.Text>
        <div style={{ height: 10 }} />
        <Input.TextArea
          value={
            '{\n'
            + '  "name": "指标看板",\n'
            + '  "tables": ["orders", "users"],\n'
            + '  "charts": [\n'
            + '    {"type": "line", "title": "GMV 趋势", "x": "date", "y": "gmv"},\n'
            + '    {"type": "bar", "title": "渠道分布", "x": "channel", "y": "gmv"}\n'
            + '  ],\n'
            + '  "kpis": [\n'
            + '    {"title": "订单金额", "metric": "gmv"},\n'
            + '    {"title": "订单数", "metric": "order_cnt"}\n'
            + '  ]\n'
            + '}'
          }
          readOnly
          autoSize={{ minRows: 14, maxRows: 18 }}
          styles={{ textarea: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' } }}
        />
      </Modal>

      <Modal
        open={layoutExamplesOpen}
        onCancel={() => setLayoutExamplesOpen(false)}
        title={locale === 'zh-CN' ? '布局样例' : 'Layout examples'}
        width={960}
        footer={null}
        destroyOnHidden
        centered
      >
        <Row gutter={[16, 16]}>
          {(
            [
              {
                key: 'main-sub' as const,
                title: locale === 'zh-CN' ? '主次布局' : 'Main/Sub',
                desc: locale === 'zh-CN' ? '主区域 + 侧边区域' : 'Main area + side area',
                img:
                  'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=clean%20wireframe%20dashboard%20layout%2C%20main%20content%20wide%20left%2C%20secondary%20narrow%20right%2C%20minimal%20lines%2C%20white%20background%2C%20blue%20accents%2C%20flat%20ui%2C%20no%20text&image_size=landscape_4_3',
              },
              {
                key: 'three-col' as const,
                title: locale === 'zh-CN' ? '三列布局' : 'Three columns',
                desc: locale === 'zh-CN' ? '三列等宽卡片' : 'Three equal columns',
                img:
                  'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=clean%20wireframe%20dashboard%20layout%2C%20three%20equal%20columns%2C%20cards%20grid%2C%20minimal%20lines%2C%20white%20background%2C%20blue%20accents%2C%20flat%20ui%2C%20no%20text&image_size=landscape_4_3',
              },
              {
                key: 'sidebar' as const,
                title: locale === 'zh-CN' ? '侧栏布局' : 'Sidebar',
                desc: locale === 'zh-CN' ? '左侧导航 + 内容区' : 'Sidebar + content',
                img:
                  'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=clean%20wireframe%20dashboard%20layout%2C%20left%20sidebar%20narrow%2C%20right%20content%20wide%2C%20cards%20and%20charts%2C%20minimal%20lines%2C%20white%20background%2C%20blue%20accents%2C%20flat%20ui%2C%20no%20text&image_size=landscape_4_3',
              },
            ] as const
          ).map((it) => (
            <Col key={it.key} xs={24} md={8}>
              <Card hoverable styles={{ body: { padding: 12 } }}>
                <img src={it.img} alt={it.title} style={{ width: '100%', borderRadius: 12, display: 'block' }} />
                <div style={{ height: 10 }} />
                <Typography.Text strong>{it.title}</Typography.Text>
                <div style={{ height: 4 }} />
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {it.desc}
                </Typography.Text>
              </Card>
            </Col>
          ))}
        </Row>
      </Modal>

      <Modal
        open={casesOpen}
        onCancel={() => setCasesOpen(false)}
        title={t('dashboard.viewAllCases')}
        width={960}
        footer={null}
        destroyOnHidden
        centered
      >
        <Row gutter={[16, 16]}>
          {templates.map((tpl) => (
            <Col key={tpl.id} xs={24} md={12} xl={8}>
              <Card
                hoverable
                className="dashboardCaseCard"
                onClick={() => openChatWorkspace({ template: tpl.id })}
                cover={
                  <div className="dashboardCaseCover">
                    <div className="dashboardTemplateBadge">
                      <TemplateBadge size={28} />
                    </div>
                    <img src={tpl.cover} alt={tpl.title} loading="lazy" />
                  </div>
                }
              >
                <Space direction="vertical" size={6} style={{ width: '100%' }}>
                  <Typography.Text strong>{tpl.title}</Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {tpl.desc}
                  </Typography.Text>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Modal>

      <Modal
        open={editOpen}
        onCancel={() => {
          setEditOpen(false)
          setEditing(null)
        }}
        title={t('dashboard.customActions.edit')}
        cancelText={t('actions.cancel')}
        okText={t('actions.save')}
        destroyOnHidden
        centered
        width={920}
        onOk={() => {
          if (!editing) return
          const layout =
            editLayoutMode === 'template'
              ? { mode: 'template', template: editLayoutTemplate }
              : { mode: 'free', cols: editFreeCols, rowHeight: editFreeRowHeight, gap: editFreeGap }

          let mergedCfgText = editConfig
          try {
            const obj = JSON.parse(editConfig)
            if (obj && typeof obj === 'object') {
              ;(obj as any).layout = layout
              mergedCfgText = JSON.stringify(obj, null, 2)
            }
          } catch {
          }

          setCustomDashboards((prev) =>
            prev.map((x) =>
              x.id === editing.id
                ? {
                    ...x,
                    title: editTitle.trim() || x.title,
                    description: editDesc.trim(),
                    tables: editTables.slice(0, 10),
                    configText: mergedCfgText,
                    updatedAt: nowText(),
                  }
                : x,
            ),
          )
          setEditOpen(false)
          setEditing(null)
        }}
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <div>
            <Typography.Text type="secondary">
              <span style={{ color: token.colorError, marginRight: 4 }}>*</span>
              {locale === 'zh-CN' ? '主题' : 'Topic'}
            </Typography.Text>
            <div style={{ height: 8 }} />
            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
          </div>

          <div>
            <Typography.Text type="secondary">
              <span style={{ color: token.colorError, marginRight: 4 }}>*</span>
              {locale === 'zh-CN' ? '描述' : 'Description'}
            </Typography.Text>
            <div style={{ height: 8 }} />
            <Input.TextArea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              autoSize={{ minRows: 3, maxRows: 5 }}
              placeholder={locale === 'zh-CN' ? '补充说明该仪表盘的用途与口径范围' : 'Describe the purpose and scope'}
            />
          </div>

          <div>
            <Typography.Text type="secondary">
              <span style={{ color: token.colorError, marginRight: 4 }}>*</span>
              {locale === 'zh-CN' ? '数据表' : 'Data tables'}
            </Typography.Text>
            <div style={{ height: 8 }} />

            <TreeSelect
              style={{ width: '100%' }}
              dropdownStyle={{ width: 760 }}
              value={editDataSourceId ? editTables.map((tb) => `${editDataSourceId}::${tb}`) : []}
              treeCheckable
              showCheckedStrategy={TreeSelect.SHOW_CHILD}
              maxTagCount="responsive"
              placeholder={locale === 'zh-CN' ? '选择数据表' : 'Select tables'}
              showSearch={false}
              filterTreeNode={false}
              dropdownRender={() => {
                const q = editTableSearch.trim().toLowerCase()
                const dsVisible = dataSources.filter((ds) => {
                  if (!q) return true
                  if (ds.name.toLowerCase().includes(q)) return true
                  return ds.tables.some((tb) => tb.toLowerCase().includes(q))
                })
                const activeDs = dataSources.find((x) => x.id === editDataSourceId) ?? dsVisible[0] ?? dataSources[0]
                const activeTables = (activeDs?.tables ?? []).filter((tb) => {
                  if (!q) return true
                  return tb.toLowerCase().includes(q) || (activeDs?.name ?? '').toLowerCase().includes(q)
                })

                const selectBox = (checked: boolean) => (
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 3,
                      border: `1px solid ${checked ? token.colorPrimary : token.colorSplit}`,
                      background: checked ? token.colorPrimary : 'transparent',
                      display: 'grid',
                      placeItems: 'center',
                      flex: 'none',
                      color: token.colorTextLightSolid,
                      fontSize: 10,
                      lineHeight: '10px',
                    }}
                  >
                    {checked ? '✓' : null}
                  </span>
                )

                return (
                  <div style={{ padding: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <Input
                        value={editTableSearch}
                        onChange={(e) => setEditTableSearch(e.target.value)}
                        placeholder={locale === 'zh-CN' ? '搜索数据源或数据表' : 'Search data source or table'}
                      />
                      <Space size={8}>
                        <Button
                          size="small"
                          disabled={!activeDs}
                          onClick={() => {
                            if (!activeDs) return
                            if (editTables.length) {
                              setEditDataSourceId(activeDs.id)
                              setEditTables([])
                              return
                            }
                            const tables = Array.from(new Set(activeTables)).slice(0, 10)
                            setEditDataSourceId(activeDs.id)
                            setEditTables(tables)
                            if (activeTables.length > 10) void message.warning(t('dashboard.tablesLimit'))
                          }}
                        >
                          {editTables.length ? (locale === 'zh-CN' ? '清空' : 'Clear') : (locale === 'zh-CN' ? '全选' : 'Select all')}
                        </Button>
                      </Space>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 3fr',
                        border: `1px solid ${token.colorSplit}`,
                        borderRadius: 12,
                        overflow: 'hidden',
                        height: 280,
                        background: token.colorBgContainer,
                      }}
                    >
                      <div style={{ overflow: 'auto', padding: 10, borderRight: `1px solid ${token.colorSplit}` }}>
                        <Space direction="vertical" size={6} style={{ width: '100%' }}>
                          {dsVisible.map((ds) => {
                            const active = activeDs?.id === ds.id
                            return (
                              <div
                                key={ds.id}
                                onClick={() => {
                                  if (editDataSourceId !== ds.id) {
                                    setEditDataSourceId(ds.id)
                                    setEditTables([])
                                  }
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 10,
                                  padding: '8px 10px',
                                  borderRadius: 10,
                                  border: `1px solid ${token.colorSplit}`,
                                  background: token.colorBgContainer,
                                  cursor: 'pointer',
                                }}
                              >
                                {selectBox(active)}
                                <DatabaseOutlined style={{ opacity: 0.75 }} />
                                <div style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ds.name}</div>
                              </div>
                            )
                          })}
                        </Space>
                      </div>

                      <div style={{ overflow: 'auto', padding: 10 }}>
                        <Space direction="vertical" size={6} style={{ width: '100%' }}>
                          {activeTables.map((tb) => {
                            const checked = editTables.includes(tb)
                            return (
                              <div
                                key={tb}
                                onClick={() => {
                                  if (!activeDs) return
                                  setEditDataSourceId(activeDs.id)
                                  setEditTables((prev) => {
                                    const next = checked ? prev.filter((x) => x !== tb) : [...prev, tb]
                                    const sliced = next.slice(0, 10)
                                    if (next.length > 10) void message.warning(t('dashboard.tablesLimit'))
                                    return sliced
                                  })
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 10,
                                  padding: '8px 10px',
                                  borderRadius: 10,
                                  border: `1px solid ${token.colorSplit}`,
                                  background: token.colorBgContainer,
                                  cursor: 'pointer',
                                }}
                              >
                                {selectBox(checked)}
                                <DataTableIcon size={14} color={token.colorTextSecondary} />
                                <div style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tb}</div>
                              </div>
                            )
                          })}
                        </Space>
                      </div>
                    </div>
                  </div>
                )
              }}
              treeData={dataSources.map((ds) => ({
                title: ds.name,
                value: ds.id,
                selectable: false,
                children: ds.tables.map((tb) => ({
                  title: (
                    <Space size={8}>
                      <DataTableIcon size={14} color={token.colorTextSecondary} />
                      <span>{tb}</span>
                    </Space>
                  ),
                  value: `${ds.id}::${tb}`,
                })),
              }))}
              onChange={(vals) => {
                const arr = (Array.isArray(vals) ? vals : [vals]).map((x) => String(x)).filter((x) => x.includes('::'))
                if (arr.length === 0) {
                  setEditDataSourceId('')
                  setEditTables([])
                  return
                }
                const dsId = String(arr[0].split('::')[0])
                const same = arr.filter((v) => v.startsWith(`${dsId}::`))
                const tables = Array.from(new Set(same.map((v) => String(v.split('::')[1])))).slice(0, 10)
                setEditDataSourceId(dsId)
                setEditTables(tables)
                if (same.length > 10) void message.warning(t('dashboard.tablesLimit'))
              }}
            />
          </div>

          <div>
            <Typography.Text type="secondary">
              <span style={{ color: token.colorError, marginRight: 4 }}>*</span>
              {locale === 'zh-CN' ? '页面布局' : 'Layout'}
            </Typography.Text>
            <div style={{ height: 8 }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <Radio.Group
                value={(editLayoutMode === 'free' ? 'custom' : editLayoutTemplate) as any}
                onChange={(e) => {
                  const v = String(e.target.value)
                  if (v === 'custom') {
                    setEditLayoutMode('free')
                    return
                  }
                  setEditLayoutMode('template')
                  setEditLayoutTemplate(v as any)
                }}
              >
                <Space size={16} wrap>
                  <Radio value="main-sub">主次</Radio>
                  <Radio value="three-col">三列</Radio>
                  <Radio value="sidebar">侧栏</Radio>
                  <Radio value="custom">自定义</Radio>
                </Space>
              </Radio.Group>

              <Button type="link" style={{ paddingInline: 0 }} onClick={() => setLayoutExamplesOpen(true)}>
                布局样式
              </Button>
            </div>

            {editLayoutMode === 'free' ? (
              <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
                <div>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {locale === 'zh-CN' ? '列数' : 'Columns'}
                  </Typography.Text>
                  <div style={{ height: 6 }} />
                  <InputNumber min={4} max={24} value={editFreeCols} onChange={(v) => setEditFreeCols(Number(v ?? 12))} style={{ width: '100%' }} />
                </div>
                <div>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {locale === 'zh-CN' ? '行高' : 'Row height'}
                  </Typography.Text>
                  <div style={{ height: 6 }} />
                  <InputNumber min={60} max={240} value={editFreeRowHeight} onChange={(v) => setEditFreeRowHeight(Number(v ?? 88))} style={{ width: '100%' }} />
                </div>
                <div>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {locale === 'zh-CN' ? '间距' : 'Gap'}
                  </Typography.Text>
                  <div style={{ height: 6 }} />
                  <InputNumber min={0} max={32} value={editFreeGap} onChange={(v) => setEditFreeGap(Number(v ?? 12))} style={{ width: '100%' }} />
                </div>
              </div>
            ) : null}
          </div>

          <div>
            <Typography.Text type="secondary">
              <span style={{ color: token.colorError, marginRight: 4 }}>*</span>
              {locale === 'zh-CN' ? '图表配置' : 'Chart config'}
            </Typography.Text>
            <div style={{ height: 8 }} />

            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <UploadPanel
                title={locale === 'zh-CN' ? '配置文件' : 'Config file'}
                description={locale === 'zh-CN' ? '支持 .json/.yaml/.yml/.txt' : 'Supports .json/.yaml/.yml/.txt'}
                height={220}
                accept=".json,.yaml,.yml,.txt,application/json,text/plain"
                maxCount={1}
                seedFileName={editCfgSeedName}
                seedKey={editCfgSeedKey}
                onChange={async (info) => {
                  const f = info.file?.originFileObj
                  if (!(f instanceof File)) return
                  setEditCfgError('')
                  try {
                    const txt = await f.text()
                    if (/\.json$/i.test(f.name)) JSON.parse(txt)
                    setEditConfig(txt)
                  } catch {
                    setEditConfig('')
                    setEditCfgError(t('dashboard.uploadInvalid'))
                  }
                }}
              />

              {editCfgError ? (
                <Typography.Text style={{ color: token.colorError, fontSize: 12, display: 'block', marginTop: 8 }}>{editCfgError}</Typography.Text>
              ) : null}

              <Button type="link" style={{ paddingInline: 0, alignSelf: 'flex-start' }} onClick={() => setExampleOpen(true)}>
                {t('dashboard.viewConfigExample')}
              </Button>
            </div>

            </div>
          </div>
        </Space>
      </Modal>

      <Modal
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        title={t('dashboard.customActions.preview')}
        footer={
          <Space style={{ width: '100%', justifyContent: 'flex-end' }} size={12}>
            <Button onClick={() => setPreviewOpen(false)}>{t('actions.cancel')}</Button>
          </Space>
        }
        destroyOnHidden
        centered
        width={920}
        zIndex={1200}
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <div>
            <Typography.Text type="secondary">
              <span style={{ color: token.colorError, marginRight: 4 }}>*</span>
              {locale === 'zh-CN' ? '主题' : 'Topic'}
            </Typography.Text>
            <div style={{ height: 8 }} />
            <Input value={previewTitle} disabled />
          </div>

          <div>
            <Typography.Text type="secondary">
              <span style={{ color: token.colorError, marginRight: 4 }}>*</span>
              {locale === 'zh-CN' ? '描述' : 'Description'}
            </Typography.Text>
            <div style={{ height: 8 }} />
            <Input.TextArea value={previewDesc} disabled autoSize={{ minRows: 3, maxRows: 5 }} />
          </div>

          <div>
            <Typography.Text type="secondary">
              <span style={{ color: token.colorError, marginRight: 4 }}>*</span>
              {locale === 'zh-CN' ? '数据表' : 'Data tables'}
            </Typography.Text>
            <div style={{ height: 8 }} />

            <TreeSelect
              style={{ width: '100%' }}
              dropdownStyle={{ width: 760 }}
              open={false}
              onDropdownVisibleChange={() => {}}
              value={previewDisplayDataSourceId ? previewTables.map((tb) => `${previewDisplayDataSourceId}::${tb}`) : []}
              treeCheckable
              showCheckedStrategy={TreeSelect.SHOW_CHILD}
              maxTagCount="responsive"
              placeholder={locale === 'zh-CN' ? '选择数据表' : 'Select tables'}
              showSearch={false}
              filterTreeNode={false}
              allowClear={false}
              tagRender={(p) => {
                const raw = String(p.value ?? '')
                const tb = raw.includes('::') ? raw.split('::')[1] : ''
                return (
                  <Tag
                    style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, marginInlineEnd: 4 }}
                    closable={false}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    onClick={() => {
                      if (tb) openTableFields(previewTables, tb)
                    }}
                  >
                    <DataTableIcon size={14} color={token.colorTextSecondary} />
                    <span>{tb || String(p.label ?? '')}</span>
                  </Tag>
                )
              }}
              treeData={dataSources.map((ds) => ({
                title: ds.name,
                value: ds.id,
                selectable: false,
                children: ds.tables.map((tb) => ({
                  title: (
                    <Space size={8}>
                      <DataTableIcon size={14} color={token.colorTextSecondary} />
                      <span>{tb}</span>
                    </Space>
                  ),
                  value: `${ds.id}::${tb}`,
                })),
              }))}
              onChange={() => {}}
            />
          </div>

          <div>
            <Typography.Text type="secondary">
              <span style={{ color: token.colorError, marginRight: 4 }}>*</span>
              {locale === 'zh-CN' ? '页面布局' : 'Layout'}
            </Typography.Text>
            <div style={{ height: 8 }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <Radio.Group value={(previewLayoutMode === 'free' ? 'custom' : previewLayoutTemplate) as any} disabled>
                <Space size={16} wrap>
                  <Radio value="main-sub">主次</Radio>
                  <Radio value="three-col">三列</Radio>
                  <Radio value="sidebar">侧栏</Radio>
                  <Radio value="custom">自定义</Radio>
                </Space>
              </Radio.Group>

              <Button type="link" style={{ paddingInline: 0 }} onClick={() => setLayoutExamplesOpen(true)}>
                布局样式
              </Button>
            </div>

            {previewLayoutMode === 'free' ? (
              <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
                <div>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {locale === 'zh-CN' ? '列数' : 'Columns'}
                  </Typography.Text>
                  <div style={{ height: 6 }} />
                  <InputNumber value={previewFreeCols} disabled style={{ width: '100%' }} />
                </div>
                <div>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {locale === 'zh-CN' ? '行高' : 'Row height'}
                  </Typography.Text>
                  <div style={{ height: 6 }} />
                  <InputNumber value={previewFreeRowHeight} disabled style={{ width: '100%' }} />
                </div>
                <div>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {locale === 'zh-CN' ? '间距' : 'Gap'}
                  </Typography.Text>
                  <div style={{ height: 6 }} />
                  <InputNumber value={previewFreeGap} disabled style={{ width: '100%' }} />
                </div>
              </div>
            ) : null}
          </div>

          <div>
            <Typography.Text type="secondary">
              <span style={{ color: token.colorError, marginRight: 4 }}>*</span>
              {locale === 'zh-CN' ? '图表配置' : 'Chart config'}
            </Typography.Text>
            <div style={{ height: 8 }} />

            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              <UploadPanel
                title={locale === 'zh-CN' ? '配置文件' : 'Config file'}
                description={locale === 'zh-CN' ? '支持 .json/.yaml/.yml/.txt' : 'Supports .json/.yaml/.yml/.txt'}
                height={220}
                accept=".json,.yaml,.yml,.txt,application/json,text/plain"
                maxCount={1}
                seedFileName={previewCfgSeedName}
                seedKey={previewCfgSeedKey}
                disabled
              />
              <Button type="link" style={{ paddingInline: 0, alignSelf: 'flex-start' }} onClick={() => setExampleOpen(true)}>
                {t('dashboard.viewConfigExample')}
              </Button>
            </Space>
          </div>

        </Space>
      </Modal>

      <DatasetPreviewModal
        open={tablePreviewOpen}
        onClose={() => setTablePreviewOpen(false)}
        tables={tablePreviewTables}
        initialActive={tablePreviewActive}
        defaultTab={tablePreviewDefaultTab}
        zIndex={2000}
      />

      <Modal
        open={!!deleteBlockedTarget}
        centered
        width={360}
        zIndex={20000}
        getContainer={() => document.body}
        title={<div style={{ paddingRight: 28, fontWeight: 800, fontSize: 18, lineHeight: 1.35 }}>{locale === 'zh-CN' ? '暂不可删除' : 'Cannot delete'}</div>}
        okText={locale === 'zh-CN' ? '知道了' : 'OK'}
        cancelButtonProps={{ style: { display: 'none' } }}
        onOk={() => setDeleteBlockedTarget(null)}
        onCancel={() => setDeleteBlockedTarget(null)}
      >
        <div style={{ paddingTop: 8, paddingBottom: 18, lineHeight: 1.65, color: token.colorTextSecondary }}>
          {deleteBlockedTarget
            ? locale === 'zh-CN'
              ? `仪表盘“${deleteBlockedTarget.title}”当前已发布，请先下线后再删除。`
              : `Dashboard "${deleteBlockedTarget.title}" is published. Unpublish it before deleting.`
            : ''}
        </div>
      </Modal>

      <Modal
        open={!!deleteDashboardTarget}
        centered
        width={360}
        zIndex={20000}
        getContainer={() => document.body}
        title={<div style={{ paddingRight: 28, fontWeight: 800, fontSize: 18, lineHeight: 1.35 }}>{locale === 'zh-CN' ? '确认删除仪表盘' : 'Delete dashboard'}</div>}
        okText={locale === 'zh-CN' ? '删除' : 'Delete'}
        cancelText={locale === 'zh-CN' ? '取消' : 'Cancel'}
        okButtonProps={{ danger: true }}
        onCancel={() => setDeleteDashboardTarget(null)}
        onOk={() => {
          if (!deleteDashboardTarget) return
          const id = deleteDashboardTarget.id
          setDeleteDashboardTarget(null)
          setCustomDashboards((prev) => prev.filter((x) => x.id !== id))
        }}
      >
        <div style={{ paddingTop: 8, paddingBottom: 18, lineHeight: 1.65, color: token.colorTextSecondary }}>
          {deleteDashboardTarget
            ? locale === 'zh-CN'
              ? `将删除仪表盘“${deleteDashboardTarget.title}”。删除后不可恢复。`
              : `Delete dashboard "${deleteDashboardTarget.title}". This action cannot be undone.`
            : ''}
        </div>
      </Modal>
    </Space>
  )
}
