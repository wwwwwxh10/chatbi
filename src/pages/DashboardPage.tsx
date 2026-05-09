import {
  Button,
  Card,
  Checkbox,
  Col,
  Divider,
  Dropdown,
  Empty,
  Input,
  InputNumber,
  Modal,
  Select,
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
  InfoCircleOutlined,
  MoreOutlined,
  PlusOutlined,
  RightOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { TemplateBadge } from '../components/TemplateBadge'
import tplCover1 from '../assets/dashboard-tpl-1.svg'
import tplCover2 from '../assets/dashboard-tpl-2.svg'
import tplCover3 from '../assets/dashboard-tpl-3.svg'
import tplCover4 from '../assets/dashboard-tpl-4.svg'
import themePreviewObsidian from '../assets/47058d91-9e13-474a-b055-75bfa40469e4.png'
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

type DashboardAppearance = {
  language: 'zh-CN' | 'en-US'
  timeZone: string
  theme: 'obsidian' | 'cyber'
  chartPalette: 'tech' | 'aurora' | 'neon'
}

function nowText() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ')
}

export default function DashboardPage({ refreshKey }: { refreshKey?: number }) {
  const { t } = useTranslation()
  const { token } = theme.useToken()
  const locale = useAppStore((s) => s.locale)
  const themeMode = useAppStore((s) => s.themeMode)

  const isDark = themeMode === 'dark'

  const primaryButtonStyle = { borderColor: token.colorPrimary, color: token.colorText }

  const CHART_PALETTES = useMemo(
    () =>
      ({
        tech: {
          name: locale === 'zh-CN' ? '科技蓝紫' : 'Tech Blue/Purple',
          desc: locale === 'zh-CN' ? '科技感强，适合 BI/AI 场景' : 'Techy, great for BI/AI',
          colors: ['#6AA6FF', '#7C3AED', '#22D3EE', '#A855F7', '#38BDF8', '#34D399', '#F472B6', '#93C5FD', '#14B8A6', '#C4B5FD'],
        },
        aurora: {
          name: locale === 'zh-CN' ? '极光青绿' : 'Aurora Cyan/Green',
          desc: locale === 'zh-CN' ? '清新通透，适合增长/运营' : 'Fresh, great for growth/ops',
          colors: ['#2DD4BF', '#22D3EE', '#34D399', '#4ADE80', '#10B981', '#38BDF8', '#A7F3D0', '#86EFAC', '#5EEAD4', '#84CC16'],
        },
        neon: {
          name: locale === 'zh-CN' ? '霓虹琥珀' : 'Neon Amber',
          desc: locale === 'zh-CN' ? '高对比醒目，适合活动/告警' : 'High-contrast, great for alerts',
          colors: ['#F97316', '#F59E0B', '#F43F5E', '#FB7185', '#F472B6', '#A855F7', '#FDBA74', '#FDE047', '#C084FC', '#60A5FA'],
        },
      }) as const,
    [locale],
  )

  const THEME_SYSTEMS = useMemo(
    () =>
      ({
        obsidian: {
          name: locale === 'zh-CN' ? '曜石蓝黑' : 'Obsidian Blue/Black',
          desc: locale === 'zh-CN' ? '沉稳克制，适合通用看板' : 'Calm and balanced',
          accents: ['#0B1220', '#111827', '#1F2937', '#60A5FA', '#93C5FD'],
        },
        cyber: {
          name: locale === 'zh-CN' ? '赛博蓝紫' : 'Cyber Blue/Purple',
          desc: locale === 'zh-CN' ? '冷色霓虹，适合科技感主题' : 'Neon-cool, futuristic',
          accents: ['#6AA6FF', '#7C3AED', '#22D3EE', '#A855F7', '#38BDF8'],
        },
      }) as const,
    [locale],
  )

  const MiniSwatch = ({ hex }: { hex: string }) => (
    <div
      style={{
        width: 18,
        height: 18,
        borderRadius: 4,
        background: hex,
        border: `1px solid ${token.colorSplit}`,
        boxShadow: isDark ? 'none' : '0 1px 0 rgba(0,0,0,0.04)',
      }}
    />
  )

  const ThemeStylePicker = ({
    value,
    onChange,
    disabled,
  }: {
    value: DashboardAppearance['theme']
    onChange: (v: DashboardAppearance['theme']) => void
    disabled?: boolean
  }) => {
    const items = (
      [
        {
          key: 'obsidian' as const,
          label: THEME_SYSTEMS.obsidian.name,
          tone: isDark
            ? 'linear-gradient(135deg, rgba(15,23,42,0.42) 0%, rgba(2,6,23,0.22) 55%, rgba(2,6,23,0.10) 100%)'
            : 'linear-gradient(135deg, rgba(59,130,246,0.16) 0%, rgba(15,23,42,0.06) 55%, rgba(2,6,23,0.04) 100%)',
          band: isDark ? 'rgba(59,130,246,0.34)' : 'rgba(59,130,246,0.40)',
        },
        {
          key: 'cyber' as const,
          label: THEME_SYSTEMS.cyber.name,
          tone: isDark
            ? 'linear-gradient(135deg, rgba(30,41,59,0.36) 0%, rgba(2,6,23,0.20) 55%, rgba(2,6,23,0.10) 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.20) 0%, rgba(148,163,184,0.14) 55%, rgba(255,255,255,0.08) 100%)',
          band: isDark ? 'rgba(148,163,184,0.40)' : 'rgba(148,163,184,0.58)',
        },
      ] as const
    ).map((it) => ({
      ...it,
      selected: value === it.key,
    }))

    const previewHeight = 120

    return (
      <Row gutter={[12, 12]}>
        {items.map((it) => (
          <Col xs={24} md={12} xl={6} key={it.key}>
            <div
              onClick={() => {
                if (disabled) return
                onChange(it.key)
              }}
              style={{
                borderRadius: 14,
                border: `2px solid ${it.selected ? token.colorPrimary : token.colorSplit}`,
                background: it.key === 'cyber' ? 'linear-gradient(180deg, #0F1420 0%, #0B1020 100%)' : token.colorBgContainer,
                cursor: disabled ? 'default' : 'pointer',
                opacity: disabled ? 0.92 : 1,
                padding: 8,
              }}
            >
              <div
                style={{
                  position: 'relative',
                  height: previewHeight,
                  borderRadius: 10,
                  overflow: 'hidden',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                <img
                  src={themePreviewObsidian}
                  alt="dashboard"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', opacity: isDark ? 0.92 : 0.98 }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      it.key === 'obsidian'
                        ? 'transparent'
                        : 'radial-gradient(900px 220px at 40% 40%, rgba(34,211,238,0.50) 0%, rgba(34,211,238,0.00) 55%),\n                           radial-gradient(760px 280px at 70% 65%, rgba(168,85,247,0.30) 0%, rgba(168,85,247,0.00) 62%),\n                           linear-gradient(135deg, rgba(56,189,248,0.18) 0%, rgba(99,102,241,0.32) 45%, rgba(168,85,247,0.22) 100%)',
                    mixBlendMode: it.key === 'obsidian' ? 'normal' : 'overlay',
                    opacity: it.key === 'obsidian' ? 1 : 1,
                  }}
                />

              </div>

              <div style={{ height: 6 }} />
              <Typography.Text strong style={{ display: 'block', lineHeight: 1.3 }}>
                {it.label}
              </Typography.Text>
              <div style={{ height: 3 }} />
              <Typography.Text type="secondary" style={{ fontSize: 12, lineHeight: 1.3 }}>
                <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{THEME_SYSTEMS[it.key].desc}</span>
              </Typography.Text>
            </div>
          </Col>
        ))}
      </Row>
    )
  }

  const ChartPalettePicker = ({
    value,
    onChange,
    disabled,
  }: {
    value: DashboardAppearance['chartPalette']
    onChange: (v: DashboardAppearance['chartPalette']) => void
    disabled?: boolean
  }) => {
    return (
      <Select
        value={value}
        onChange={(v) => onChange(v)}
        disabled={disabled}
        style={{ width: '100%' }}
        optionLabelProp="label"
        options={(Object.keys(CHART_PALETTES) as Array<DashboardAppearance['chartPalette']>).map((k) => {
          const meta = CHART_PALETTES[k]
          return {
            value: k,
            label: (
              <Space size={10} style={{ display: 'flex' }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {meta.colors.slice(0, 7).map((hex) => (
                    <MiniSwatch key={hex} hex={hex} />
                  ))}
                </div>
                <span style={{ marginInlineStart: 2 }}>{meta.name}</span>
              </Space>
            ),
          }
        })}
      />
    )
  }

  const LayoutWireframe = ({ kind }: { kind: 'main-sub' | 'three-col' | 'sidebar' }) => {
    const fill = 'rgba(255,255,255,0.06)'
    const fill2 = 'rgba(255,255,255,0.045)'
    const rxOuter = 6
    const rx = 4

    const Block = ({ x, y, w, h, strong }: { x: number; y: number; w: number; h: number; strong?: boolean }) => (
      <rect x={x} y={y} width={w} height={h} rx={rx} fill={strong ? fill : fill2} />
    )

    if (kind === 'main-sub') {
      return (
        <svg
          viewBox="0 0 160 110"
          width="100%"
          height={120}
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block', borderRadius: rxOuter, background: 'rgba(255,255,255,0.02)' }}
        >
          <Block x={8} y={8} w={33} h={20} strong />
          <Block x={45} y={8} w={33} h={20} strong />
          <Block x={82} y={8} w={33} h={20} strong />
          <Block x={119} y={8} w={33} h={20} strong />

          <Block x={8} y={32} w={70} h={33} />
          <Block x={82} y={32} w={70} h={33} />

          <Block x={8} y={69} w={70} h={33} />
          <Block x={82} y={69} w={70} h={33} />
        </svg>
      )
    }
    if (kind === 'three-col') {
      return (
        <svg
          viewBox="0 0 160 110"
          width="100%"
          height={120}
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block', borderRadius: rxOuter, background: 'rgba(255,255,255,0.02)' }}
        >
          <Block x={8} y={8} w={45} h={45} />
          <Block x={8} y={57} w={45} h={45} />

          <Block x={57} y={8} w={45} h={45} />
          <Block x={57} y={57} w={45} h={45} />

          <Block x={106} y={8} w={45} h={45} />
          <Block x={106} y={57} w={45} h={45} />
        </svg>
      )
    }
    return (
      <svg
        viewBox="0 0 160 110"
        width="100%"
        height={120}
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', borderRadius: rxOuter, background: 'rgba(255,255,255,0.02)' }}
      >
        <Block x={8} y={8} w={34} h={45} />
        <Block x={8} y={57} w={34} h={45} />

        <Block x={46} y={8} w={68} h={62} strong />
        <Block x={46} y={74} w={32} h={28} />
        <Block x={82} y={74} w={32} h={28} />

        <Block x={118} y={8} w={34} h={45} />
        <Block x={118} y={57} w={34} h={45} />
      </svg>
    )
  }

  const CustomGridPreview = () => {
    return (
      <div
        style={{
          height: 120,
          borderRadius: 10,
          background: 'rgba(255,255,255,0.02)',
          border: `1px dashed ${token.colorTextTertiary}`,
          display: 'grid',
          placeItems: 'center',
          color: token.colorTextTertiary,
        }}
      >
        <svg width="34" height="34" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 7h16M4 12h16M4 17h16M7 4v16M12 4v16M17 4v16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.9" />
        </svg>
      </div>
    )
  }

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
  const [cfgFreeRowHeight, setCfgFreeRowHeight] = useState<number>(100)
  const [cfgFreeGap, setCfgFreeGap] = useState<number>(16)
  const [cfgLanguage, setCfgLanguage] = useState<DashboardAppearance['language']>(locale === 'zh-CN' ? 'zh-CN' : 'en-US')
  const [cfgTimeZone, setCfgTimeZone] = useState<string>('Asia/Shanghai')
  const [cfgThemeSystem, setCfgThemeSystem] = useState<DashboardAppearance['theme']>('obsidian')
  const [cfgChartPalette, setCfgChartPalette] = useState<DashboardAppearance['chartPalette']>('tech')
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
    setCfgFreeRowHeight(100)
    setCfgFreeGap(16)
    setCfgLanguage(locale === 'zh-CN' ? 'zh-CN' : 'en-US')
    setCfgTimeZone('Asia/Shanghai')
    setCfgThemeSystem('obsidian')
    setCfgChartPalette('tech')
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
    setCfgFreeRowHeight(100)
    setCfgFreeGap(16)
    setCfgLanguage(locale === 'zh-CN' ? 'zh-CN' : 'en-US')
    setCfgTimeZone('Asia/Shanghai')
    setCfgThemeSystem('obsidian')
    setCfgChartPalette('tech')
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
  const [editFreeRowHeight, setEditFreeRowHeight] = useState<number>(100)
  const [editFreeGap, setEditFreeGap] = useState<number>(16)
  const [editLanguage, setEditLanguage] = useState<DashboardAppearance['language']>(locale === 'zh-CN' ? 'zh-CN' : 'en-US')
  const [editTimeZone, setEditTimeZone] = useState<string>('Asia/Shanghai')
  const [editThemeSystem, setEditThemeSystem] = useState<DashboardAppearance['theme']>('obsidian')
  const [editChartPalette, setEditChartPalette] = useState<DashboardAppearance['chartPalette']>('tech')

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewTargetId, setPreviewTargetId] = useState<string>('')
  const [previewTitle, setPreviewTitle] = useState('')
  const [previewDesc, setPreviewDesc] = useState('')
  const [previewTables, setPreviewTables] = useState<string[]>([])
  const [previewDataSourceId, setPreviewDataSourceId] = useState<string>('')
  const [previewTableSearch, setPreviewTableSearch] = useState('')
  const [previewCfgSeedKey, setPreviewCfgSeedKey] = useState<string>('')
  const [previewCfgSeedName, setPreviewCfgSeedName] = useState<string>('')
  const [previewLayoutMode, setPreviewLayoutMode] = useState<'template' | 'free'>('template')
  const [previewLayoutTemplate, setPreviewLayoutTemplate] = useState<'main-sub' | 'three-col' | 'sidebar'>('main-sub')
  const [previewFreeCols, setPreviewFreeCols] = useState<number>(12)
  const [previewFreeRowHeight, setPreviewFreeRowHeight] = useState<number>(100)
  const [previewFreeGap, setPreviewFreeGap] = useState<number>(16)
  const [previewLanguage, setPreviewLanguage] = useState<DashboardAppearance['language']>(locale === 'zh-CN' ? 'zh-CN' : 'en-US')
  const [previewTimeZone, setPreviewTimeZone] = useState<string>('Asia/Shanghai')
  const [previewThemeSystem, setPreviewThemeSystem] = useState<DashboardAppearance['theme']>('obsidian')
  const [previewChartPalette, setPreviewChartPalette] = useState<DashboardAppearance['chartPalette']>('tech')

  const [tablePreviewOpen, setTablePreviewOpen] = useState(false)
  const [tablePreviewTables, setTablePreviewTables] = useState<string[]>([])
  const [tablePreviewActive, setTablePreviewActive] = useState('')
  const [tablePreviewDefaultTab, setTablePreviewDefaultTab] = useState<'preview' | 'fields'>('preview')

  const [deleteDashboardTarget, setDeleteDashboardTarget] = useState<{ id: string; title: string } | null>(null)
  const [deleteBlockedTarget, setDeleteBlockedTarget] = useState<{ title: string } | null>(null)
  const [publishTarget, setPublishTarget] = useState<{ id: string; nextPublished: boolean } | null>(null)

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
          rowHeight: Number(layout.rowHeight ?? 100),
          gap: Number(layout.gap ?? 16),
        }
      }
      return null
    } catch {
      return null
    }
  }

  const parseAppearanceFromConfig = (configText: string): DashboardAppearance | null => {
    try {
      const obj = JSON.parse(configText)
      const a = obj?.appearance
      if (!a || typeof a !== 'object') return null
      const language = a.language === 'en-US' ? 'en-US' : 'zh-CN'
      const timeZone = typeof a.timeZone === 'string' && a.timeZone ? a.timeZone : 'Asia/Shanghai'
      const theme = a.theme === 'cyber' ? 'cyber' : 'obsidian'
      const chartPalette = a.chartPalette === 'aurora' ? 'aurora' : a.chartPalette === 'neon' ? 'neon' : 'tech'
      return { language, timeZone, theme, chartPalette }
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

  const previewDisplayDataSourceId = useMemo(
    () => previewDataSourceId || pickDataSourceIdForTables(previewTables),
    [previewDataSourceId, previewTables, dataSources],
  )

  const openEditModal = (r: CustomDashboard) => {
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
    const appearance = parseAppearanceFromConfig(r.configText ?? '')
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
      setEditFreeRowHeight(100)
      setEditFreeGap(16)
    }
    if (appearance) {
      setEditLanguage(appearance.language)
      setEditTimeZone(appearance.timeZone)
      setEditThemeSystem(appearance.theme)
      setEditChartPalette(appearance.chartPalette)
    } else {
      setEditLanguage(locale === 'zh-CN' ? 'zh-CN' : 'en-US')
      setEditTimeZone('Asia/Shanghai')
      setEditThemeSystem('obsidian')
      setEditChartPalette('tech')
    }
    setEditOpen(true)
  }

  const openPreviewModal = (payload: { id: string; title: string; description: string; tables: string[]; configText: string }) => {
    setPreviewTargetId(payload.id)
    setPreviewTitle(payload.title)
    setPreviewDesc(payload.description)
    setPreviewTables(payload.tables)
    setPreviewDataSourceId(pickDataSourceIdForTables(payload.tables))
    setPreviewTableSearch('')
    setPreviewCfgSeedKey(payload.title || String(Date.now()))
    setPreviewCfgSeedName(payload.configText ? (locale === 'zh-CN' ? '已上传配置文件' : 'Uploaded config file') : '')
    const parsed = parseLayoutFromConfig(payload.configText)
    const appearance = parseAppearanceFromConfig(payload.configText)
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
    if (appearance) {
      setPreviewLanguage(appearance.language)
      setPreviewTimeZone(appearance.timeZone)
      setPreviewThemeSystem(appearance.theme)
      setPreviewChartPalette(appearance.chartPalette)
    } else {
      setPreviewLanguage(locale === 'zh-CN' ? 'zh-CN' : 'en-US')
      setPreviewTimeZone('Asia/Shanghai')
      setPreviewThemeSystem('obsidian')
      setPreviewChartPalette('tech')
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
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('dashboard.customEmpty')} />
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
                width: 120,
                className: 'actionCol',
                onHeaderCell: () => ({ className: 'actionCol' }),
                onCell: () => ({ className: 'actionCol', style: { width: 120, minWidth: 120, maxWidth: 120 } }),
                align: 'center' as const,
                render: (_: unknown, r: CustomDashboard) => (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', columnGap: 2, width: '100%', justifyItems: 'center' }}>
                    <Tooltip title={t('dashboard.customActions.preview')}>
                      <Button
                        type="text"
                        className="iconOnly"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => {
                          openPreviewModal({
                            id: r.id,
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
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => {
                          openEditModal(r)
                        }}
                      />
                    </Tooltip>
                    <Dropdown
                      trigger={['click']}
                      placement="bottomRight"
                      menu={{
                        items: [
                          {
                            key: 'chat',
                            label: t('dashboard.startChat'),
                            icon: <CommentOutlined />,
                            disabled: !r.published,
                          },
                          { type: 'divider' as const },
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
                            disabled: r.published,
                          },
                        ],
                        onClick: ({ key }) => {
                          if (key === 'chat') {
                            if (!r.published) return
                            openChatWorkspace({ dashboardId: r.id })
                            return
                          }
                          if (key === 'publish') {
                            setPublishTarget({ id: r.id, nextPublished: !r.published })
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
                      <Button type="text" className="iconOnly" size="small" icon={<MoreOutlined />} />
                    </Dropdown>
                  </div>
                ),
              },
            ]}
          />
        )}
      </Card>

      <Modal
        open={createOpen}
        onCancel={closeCreate}
        title={<div style={{ paddingRight: 28, fontWeight: 800, fontSize: 18, lineHeight: 1.35 }}>{locale === 'zh-CN' ? '新建仪表盘' : 'Create dashboard'}</div>}
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
                  : !(cfgFreeCols >= 4 && cfgFreeCols <= 24 && cfgFreeRowHeight >= 50 && cfgFreeRowHeight <= 300 && cfgFreeGap >= 8 && cfgFreeGap <= 32))
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
                  : !(cfgFreeCols >= 4 && cfgFreeCols <= 24 && cfgFreeRowHeight >= 50 && cfgFreeRowHeight <= 300 && cfgFreeGap >= 8 && cfgFreeGap <= 32))
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

                const appearance: DashboardAppearance = {
                  language: cfgLanguage,
                  timeZone: cfgTimeZone,
                  theme: cfgThemeSystem,
                  chartPalette: cfgChartPalette,
                }

                let mergedCfgText = cfgText
                try {
                  const obj = JSON.parse(cfgText)
                  if (obj && typeof obj === 'object') {
                    ;(obj as any).layout = layout
                    ;(obj as any).appearance = appearance
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
              {locale === 'zh-CN' ? '数据' : 'Data'}
              <Tooltip
                placement="top"
                title={
                  <div style={{ maxWidth: 520, lineHeight: 1.7 }}>
                    为获得最佳 AI 体验，单业务主题建议关联同一数据库不超过 10 张表，若需跨库关联或表数过多，建议采用宽表化、拆分主题或视图汇聚
                  </div>
                }
              >
                <span style={{ marginInlineStart: 8, display: 'inline-flex', alignItems: 'center' }}>
                  <InfoCircleOutlined style={{ fontSize: 12, color: token.colorTextTertiary }} />
                </span>
              </Tooltip>
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
              showSearch
              filterTreeNode={false}
              onSearch={(v) => setCfgTableSearch(String(v ?? ''))}
              searchValue={cfgTableSearch}
              allowClear
              suffixIcon={<SearchOutlined />}
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

                return (
                  <div style={{ padding: 10 }}>
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
                            const lower = String(q)
                            const fullCandidate = ds.tables.filter((tb) => {
                              if (!lower) return true
                              if (ds.name.toLowerCase().includes(lower)) return true
                              return tb.toLowerCase().includes(lower)
                            })
                            const limited = Array.from(new Set(fullCandidate)).slice(0, 10)
                            const selectedCount = active ? cfgTables.filter((tb) => limited.includes(tb)).length : 0
                            const allChecked = active && limited.length > 0 && selectedCount === limited.length
                            const indeterminate = active && selectedCount > 0 && !allChecked
                            return (
                              <div
                                key={ds.id}
                                onClick={() => {
                                  if (cfgDataSourceId !== ds.id) {
                                    setCfgDataSourceId(ds.id)
                                    setCfgTables([])
                                  }
                                }}
                                onMouseEnter={(e) => {
                                  ;(e.currentTarget as HTMLDivElement).style.background = token.colorFillQuaternary
                                }}
                                onMouseLeave={(e) => {
                                  ;(e.currentTarget as HTMLDivElement).style.background = active ? token.colorFillQuaternary : 'transparent'
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 10,
                                  padding: '6px 8px',
                                  borderRadius: 10,
                                  background: active ? token.colorFillQuaternary : 'transparent',
                                  cursor: 'pointer',
                                }}
                              >
                                <Checkbox
                                  checked={allChecked}
                                  indeterminate={indeterminate}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={() => {
                                    setCfgDataSourceId(ds.id)
                                    if (active && selectedCount > 0) {
                                      setCfgTables([])
                                      return
                                    }
                                    setCfgTables(limited)
                                    if (fullCandidate.length > 10) void message.warning(t('dashboard.tablesLimit'))
                                  }}
                                />
                                <DatabaseOutlined style={{ opacity: 0.75 }} />
                                <div style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ds.name}</div>
                              </div>
                            )
                          })}
                        </Space>
                      </div>

                      <div style={{ overflow: 'auto', padding: 10 }}>
                        {activeDs ? (
                          <Space direction="vertical" size={6} style={{ width: '100%' }}>
                            {activeTables.map((tb) => {
                              const checked = cfgTables.includes(tb)
                              return (
                                <Checkbox
                                  key={tb}
                                  checked={checked}
                                  style={{ width: '100%', fontSize: 14, padding: '6px 8px', borderRadius: 10 }}
                                  onChange={() => {
                                    const next = checked ? cfgTables.filter((x) => x !== tb) : Array.from(new Set([...cfgTables, tb]))
                                    setCfgDataSourceId(activeDs.id)
                                    setCfgTables(next.slice(0, 10))
                                    if (next.length > 10) void message.warning(t('dashboard.tablesLimit'))
                                  }}
                                >
                                  <Space size={10}>
                                    <DataTableIcon size={14} color={token.colorTextSecondary} />
                                    <span style={{ fontSize: 14 }}>{tb}</span>
                                  </Space>
                                </Checkbox>
                              )
                            })}
                            {activeTables.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={locale === 'zh-CN' ? '暂无匹配数据表' : 'No tables'} /> : null}
                          </Space>
                        ) : (
                          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={locale === 'zh-CN' ? '请选择数据源' : 'Select data source'} />
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
            <Row gutter={[16, 12]}>
              <Col xs={24} md={12}>
                <Typography.Text type="secondary">
                  <span style={{ color: token.colorError, marginRight: 4 }}>*</span>
                  {locale === 'zh-CN' ? '语言' : 'Language'}
                </Typography.Text>
                <div style={{ height: 8 }} />
                <Select
                  value={cfgLanguage}
                  onChange={(v) => setCfgLanguage(v)}
                  style={{ width: '100%' }}
                  options={[{ label: '简体中文', value: 'zh-CN' }, { label: 'English', value: 'en-US' }]}
                />
              </Col>
              <Col xs={24} md={12}>
                <Typography.Text type="secondary">
                  <span style={{ color: token.colorError, marginRight: 4 }}>*</span>
                  {locale === 'zh-CN' ? '时区' : 'Time zone'}
                </Typography.Text>
                <div style={{ height: 8 }} />
                <Select
                  value={cfgTimeZone}
                  onChange={(v) => setCfgTimeZone(String(v))}
                  style={{ width: '100%' }}
                  options={[
                    { label: 'Asia/Shanghai (UTC+8)', value: 'Asia/Shanghai' },
                    { label: 'UTC', value: 'UTC' },
                    { label: 'America/Los_Angeles', value: 'America/Los_Angeles' },
                    { label: 'Europe/London', value: 'Europe/London' },
                  ]}
                  showSearch
                />
              </Col>
            </Row>
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
              {locale === 'zh-CN' ? '主题风格' : 'Theme style'}
            </Typography.Text>
            <div style={{ height: 8 }} />
            <ThemeStylePicker value={cfgThemeSystem} onChange={(v) => setCfgThemeSystem(v)} />
          </div>

          <div>
            <Typography.Text type="secondary">
              <span style={{ color: token.colorError, marginRight: 4 }}>*</span>
              {locale === 'zh-CN' ? '页面布局' : 'Layout'}
            </Typography.Text>
            <div style={{ height: 8 }} />
            <Row gutter={[12, 12]}>
              {(
                [
                  {
                    key: 'main-sub' as const,
                    title: locale === 'zh-CN' ? '主次布局' : 'Main/Sub',
                    desc: locale === 'zh-CN' ? '主次分明/主体突出' : 'Main emphasis / clear hierarchy',
                  },
                  {
                    key: 'three-col' as const,
                    title: locale === 'zh-CN' ? '三列布局' : 'Three columns',
                    desc: locale === 'zh-CN' ? '等分并列 / 横向对比' : 'Equal columns / side-by-side',
                  },
                  {
                    key: 'sidebar' as const,
                    title: locale === 'zh-CN' ? '侧栏布局' : 'Sidebar',
                    desc: locale === 'zh-CN' ? '主辅分区/侧边辅助' : 'Primary & secondary zones',
                  },
                ] as const
              ).map((it) => {
                const selected = cfgLayoutMode === 'template' && cfgLayoutTemplate === it.key
                return (
                  <Col key={it.key} xs={24} md={12} xl={6}>
                    <Card
                      hoverable
                      onClick={() => {
                        setCfgLayoutMode('template')
                        setCfgLayoutTemplate(it.key)
                      }}
                      styles={{ body: { padding: 8 } }}
                      style={{
                        border: selected ? `2px solid ${token.colorPrimary}` : `1px solid ${token.colorSplit}`,
                      }}
                    >
                      <LayoutWireframe kind={it.key} />
                      <div style={{ height: 6 }} />
                      <Typography.Text strong style={{ display: 'block', lineHeight: 1.3 }}>
                        {it.title}
                      </Typography.Text>
                      <div style={{ height: 3 }} />
                      <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12, lineHeight: 1.3 }}>
                        {it.desc}
                      </Typography.Text>
                    </Card>
                  </Col>
                )
              })}

              {(() => {
                const selected = cfgLayoutMode === 'free'
                return (
                  <Col xs={24} md={12} xl={6}>
                    <Card
                      hoverable
                      onClick={() => setCfgLayoutMode('free')}
                      styles={{ body: { padding: 8 } }}
                      style={{
                        border: selected ? `2px solid ${token.colorPrimary}` : `1px solid ${token.colorSplit}`,
                      }}
                    >
                      <CustomGridPreview />
                      <div style={{ height: 6 }} />
                      <Typography.Text strong style={{ display: 'block', lineHeight: 1.3 }}>
                        {locale === 'zh-CN' ? '自定义栅格' : 'Custom Grid'}
                      </Typography.Text>
                      <div style={{ height: 3 }} />
                      <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12, lineHeight: 1.3 }}>
                        {locale === 'zh-CN' ? '自由定义列数、行高与间距' : 'Customize columns, row height and gap'}
                      </Typography.Text>
                    </Card>
                  </Col>
                )
              })()}
            </Row>

            {cfgLayoutMode === 'free' ? (
              <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
                <div>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {locale === 'zh-CN' ? '列数' : 'Columns'}
                      <Tooltip placement="top" title={<div style={{ maxWidth: 320, lineHeight: 1.6 }}>默认12列，可调4~24列；定义每个图表的宽度，按列数计算</div>}>
                        <InfoCircleOutlined style={{ fontSize: 12, color: token.colorTextTertiary }} />
                      </Tooltip>
                    </span>
                  </Typography.Text>
                  <div style={{ height: 6 }} />
                  <InputNumber min={4} max={24} value={cfgFreeCols} onChange={(v) => setCfgFreeCols(Number(v ?? 12))} style={{ width: '100%' }} />
                </div>
                <div>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {locale === 'zh-CN' ? '行高' : 'Row height'}
                      <Tooltip placement="top" title={<div style={{ maxWidth: 320, lineHeight: 1.6 }}>默认100px/行，可调50~300px/行；定义每个图表的高度，按行数计算</div>}>
                        <InfoCircleOutlined style={{ fontSize: 12, color: token.colorTextTertiary }} />
                      </Tooltip>
                    </span>
                  </Typography.Text>
                  <div style={{ height: 6 }} />
                  <InputNumber min={50} max={300} value={cfgFreeRowHeight} onChange={(v) => setCfgFreeRowHeight(Number(v ?? 100))} style={{ width: '100%' }} />
                </div>
                <div>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {locale === 'zh-CN' ? '间距' : 'Gap'}
                      <Tooltip placement="top" title={<div style={{ maxWidth: 320, lineHeight: 1.6 }}>默认16px，可调8~32px；定义图表之间的间距。</div>}>
                        <InfoCircleOutlined style={{ fontSize: 12, color: token.colorTextTertiary }} />
                      </Tooltip>
                    </span>
                  </Typography.Text>
                  <div style={{ height: 6 }} />
                  <InputNumber min={8} max={32} value={cfgFreeGap} onChange={(v) => setCfgFreeGap(Number(v ?? 16))} style={{ width: '100%' }} />
                </div>
              </div>
            ) : null}
          </div>

          <div>
            <Typography.Text type="secondary">
              <span style={{ color: token.colorError, marginRight: 4 }}>*</span>
              {locale === 'zh-CN' ? '图表色系' : 'Chart palette'}
            </Typography.Text>
            <div style={{ height: 8 }} />
            <ChartPalettePicker value={cfgChartPalette} onChange={(v) => setCfgChartPalette(v)} />
          </div>

          <Space direction="vertical" size={10} style={{ width: '100%' }}>
            <Typography.Text type="secondary">
              <span style={{ color: token.colorError, marginRight: 4 }}>*</span>
              {locale === 'zh-CN' ? '图表配置' : 'Chart config'}
            </Typography.Text>
            <UploadPanel
              title={locale === 'zh-CN' ? '点击上传' : 'Click to upload'}
              description={locale === 'zh-CN' ? '支持 JSON / YAML / XML 格式' : 'Supports JSON / YAML / XML'}
              height={220}
              accept=".json,.yaml,.yml,.xml,application/json,application/xml,text/xml"
              maxCount={1}
              helperAction={{ label: t('dashboard.viewConfigExample'), onClick: () => setExampleOpen(true) }}
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
        {(() => {
          const LayoutWireframe = ({ kind }: { kind: 'main-sub' | 'three-col' | 'sidebar' }) => {
            const fill = 'rgba(255,255,255,0.06)'
            const fill2 = 'rgba(255,255,255,0.045)'
            const rxOuter = 6
            const rx = 4

            const Block = ({ x, y, w, h, strong }: { x: number; y: number; w: number; h: number; strong?: boolean }) => (
              <rect x={x} y={y} width={w} height={h} rx={rx} fill={strong ? fill : fill2} />
            )

            if (kind === 'main-sub') {
              return (
                <svg
                  viewBox="0 0 160 110"
                  width="100%"
                  height={120}
                  preserveAspectRatio="xMidYMid meet"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ display: 'block', borderRadius: rxOuter, background: 'rgba(255,255,255,0.02)' }}
                >
                  <Block x={8} y={8} w={33} h={20} strong />
                  <Block x={45} y={8} w={33} h={20} strong />
                  <Block x={82} y={8} w={33} h={20} strong />
                  <Block x={119} y={8} w={33} h={20} strong />

                  <Block x={8} y={32} w={70} h={33} />
                  <Block x={82} y={32} w={70} h={33} />

                  <Block x={8} y={69} w={70} h={33} />
                  <Block x={82} y={69} w={70} h={33} />
                </svg>
              )
            }
            if (kind === 'three-col') {
              return (
                <svg
                  viewBox="0 0 160 110"
                  width="100%"
                  height={120}
                  preserveAspectRatio="xMidYMid meet"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ display: 'block', borderRadius: rxOuter, background: 'rgba(255,255,255,0.02)' }}
                >
                  <Block x={8} y={8} w={45} h={45} />
                  <Block x={8} y={57} w={45} h={45} />

                  <Block x={57} y={8} w={45} h={45} />
                  <Block x={57} y={57} w={45} h={45} />

                  <Block x={106} y={8} w={45} h={45} />
                  <Block x={106} y={57} w={45} h={45} />
                </svg>
              )
            }
            return (
              <svg
                viewBox="0 0 160 110"
                width="100%"
                height={120}
                preserveAspectRatio="xMidYMid meet"
                xmlns="http://www.w3.org/2000/svg"
                style={{ display: 'block', borderRadius: rxOuter, background: 'rgba(255,255,255,0.02)' }}
              >
                <Block x={8} y={8} w={34} h={45} />
                <Block x={8} y={57} w={34} h={45} />

                <Block x={46} y={8} w={68} h={62} strong />
                <Block x={46} y={74} w={32} h={28} />
                <Block x={82} y={74} w={32} h={28} />

                <Block x={118} y={8} w={34} h={45} />
                <Block x={118} y={57} w={34} h={45} />
              </svg>
            )
          }
          return (
            <Row gutter={[12, 12]}>
              {(
                [
                  {
                    key: 'main-sub' as const,
                    title: locale === 'zh-CN' ? '主次布局' : 'Main/Sub',
                    desc: locale === 'zh-CN' ? '主次分明/主体突出' : 'Main emphasis / clear hierarchy',
                  },
                  {
                    key: 'three-col' as const,
                    title: locale === 'zh-CN' ? '三列布局' : 'Three columns',
                    desc: locale === 'zh-CN' ? '等分并列 / 横向对比' : 'Equal columns / side-by-side',
                  },
                  {
                    key: 'sidebar' as const,
                    title: locale === 'zh-CN' ? '侧栏布局' : 'Sidebar',
                    desc: locale === 'zh-CN' ? '主辅分区/侧边辅助' : 'Primary & secondary zones',
                  },
                ] as const
              ).map((it) => (
                <Col key={it.key} xs={24} md={8}>
                  <Card hoverable styles={{ body: { padding: 8 } }}>
                    <LayoutWireframe kind={it.key} />
                    <div style={{ height: 6 }} />
                    <Typography.Text strong style={{ display: 'block', lineHeight: 1.3 }}>
                      {it.title}
                    </Typography.Text>
                    <div style={{ height: 3 }} />
                    <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12, lineHeight: 1.3 }}>
                      {it.desc}
                    </Typography.Text>
                  </Card>
                </Col>
              ))}
            </Row>
          )
        })()}
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
        <Row gutter={[12, 12]}>
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
        title={<div style={{ paddingRight: 28, fontWeight: 800, fontSize: 18, lineHeight: 1.35 }}>{locale === 'zh-CN' ? '编辑仪表盘' : 'Edit dashboard'}</div>}
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

          const appearance: DashboardAppearance = {
            language: editLanguage,
            timeZone: editTimeZone,
            theme: editThemeSystem,
            chartPalette: editChartPalette,
          }

          let mergedCfgText = editConfig
          try {
            const obj = JSON.parse(editConfig)
            if (obj && typeof obj === 'object') {
              ;(obj as any).layout = layout
              ;(obj as any).appearance = appearance
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
              {locale === 'zh-CN' ? '数据' : 'Data'}
              <Tooltip
                placement="top"
                title={
                  <div style={{ maxWidth: 520, lineHeight: 1.7 }}>
                    为获得最佳 AI 体验，单业务主题建议关联同一数据库不超过 10 张表，若需跨库关联或表数过多，建议采用宽表化、拆分主题或视图汇聚
                  </div>
                }
              >
                <span style={{ marginInlineStart: 8, display: 'inline-flex', alignItems: 'center' }}>
                  <InfoCircleOutlined style={{ fontSize: 12, color: token.colorTextTertiary }} />
                </span>
              </Tooltip>
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
              showSearch
              filterTreeNode={false}
              onSearch={(v) => setEditTableSearch(String(v ?? ''))}
              searchValue={editTableSearch}
              allowClear
              suffixIcon={<SearchOutlined />}
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

                return (
                  <div style={{ padding: 10 }}>
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
                            const lower = String(q)
                            const fullCandidate = ds.tables.filter((tb) => {
                              if (!lower) return true
                              if (ds.name.toLowerCase().includes(lower)) return true
                              return tb.toLowerCase().includes(lower)
                            })
                            const limited = Array.from(new Set(fullCandidate)).slice(0, 10)
                            const selectedCount = active ? editTables.filter((tb) => limited.includes(tb)).length : 0
                            const allChecked = active && limited.length > 0 && selectedCount === limited.length
                            const indeterminate = active && selectedCount > 0 && !allChecked
                            return (
                              <div
                                key={ds.id}
                                onClick={() => {
                                  if (editDataSourceId !== ds.id) {
                                    setEditDataSourceId(ds.id)
                                    setEditTables([])
                                  }
                                }}
                                onMouseEnter={(e) => {
                                  ;(e.currentTarget as HTMLDivElement).style.background = token.colorFillQuaternary
                                }}
                                onMouseLeave={(e) => {
                                  ;(e.currentTarget as HTMLDivElement).style.background = active ? token.colorFillQuaternary : 'transparent'
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 10,
                                  padding: '6px 8px',
                                  borderRadius: 10,
                                  background: active ? token.colorFillQuaternary : 'transparent',
                                  cursor: 'pointer',
                                }}
                              >
                                <Checkbox
                                  checked={allChecked}
                                  indeterminate={indeterminate}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={() => {
                                    setEditDataSourceId(ds.id)
                                    if (active && selectedCount > 0) {
                                      setEditTables([])
                                      return
                                    }
                                    setEditTables(limited)
                                    if (fullCandidate.length > 10) void message.warning(t('dashboard.tablesLimit'))
                                  }}
                                />
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
                              <Checkbox
                                key={tb}
                                checked={checked}
                                style={{ width: '100%', fontSize: 14, padding: '6px 8px', borderRadius: 10 }}
                                onChange={() => {
                                  if (!activeDs) return
                                  setEditDataSourceId(activeDs.id)
                                  setEditTables((prev) => {
                                    const next = checked ? prev.filter((x) => x !== tb) : [...prev, tb]
                                    const sliced = next.slice(0, 10)
                                    if (next.length > 10) void message.warning(t('dashboard.tablesLimit'))
                                    return sliced
                                  })
                                }}
                              >
                                <Space size={10}>
                                  <DataTableIcon size={14} color={token.colorTextSecondary} />
                                  <span style={{ fontSize: 14 }}>{tb}</span>
                                </Space>
                              </Checkbox>
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
            <Row gutter={[16, 12]}>
              <Col xs={24} md={12}>
                <Typography.Text type="secondary">
                  <span style={{ color: token.colorError, marginRight: 4 }}>*</span>
                  {locale === 'zh-CN' ? '语言' : 'Language'}
                </Typography.Text>
                <div style={{ height: 8 }} />
                <Select
                  value={editLanguage}
                  onChange={(v) => setEditLanguage(v)}
                  style={{ width: '100%' }}
                  options={[{ label: '简体中文', value: 'zh-CN' }, { label: 'English', value: 'en-US' }]}
                />
              </Col>
              <Col xs={24} md={12}>
                <Typography.Text type="secondary">
                  <span style={{ color: token.colorError, marginRight: 4 }}>*</span>
                  {locale === 'zh-CN' ? '时区' : 'Time zone'}
                </Typography.Text>
                <div style={{ height: 8 }} />
                <Select
                  value={editTimeZone}
                  onChange={(v) => setEditTimeZone(String(v))}
                  style={{ width: '100%' }}
                  options={[
                    { label: 'Asia/Shanghai (UTC+8)', value: 'Asia/Shanghai' },
                    { label: 'UTC', value: 'UTC' },
                    { label: 'America/Los_Angeles', value: 'America/Los_Angeles' },
                    { label: 'Europe/London', value: 'Europe/London' },
                  ]}
                  showSearch
                />
              </Col>
            </Row>
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
              {locale === 'zh-CN' ? '主题风格' : 'Theme style'}
            </Typography.Text>
            <div style={{ height: 8 }} />
            <ThemeStylePicker value={editThemeSystem} onChange={(v) => setEditThemeSystem(v)} />
          </div>

          <div>
            <Typography.Text type="secondary">
              <span style={{ color: token.colorError, marginRight: 4 }}>*</span>
              {locale === 'zh-CN' ? '页面布局' : 'Layout'}
            </Typography.Text>
            <div style={{ height: 8 }} />
            <Row gutter={[12, 12]}>
              {(
                [
                  {
                    key: 'main-sub' as const,
                    title: locale === 'zh-CN' ? '主次布局' : 'Main/Sub',
                    desc: locale === 'zh-CN' ? '主次分明/主体突出' : 'Main emphasis / clear hierarchy',
                  },
                  {
                    key: 'three-col' as const,
                    title: locale === 'zh-CN' ? '三列布局' : 'Three columns',
                    desc: locale === 'zh-CN' ? '等分并列 / 横向对比' : 'Equal columns / side-by-side',
                  },
                  {
                    key: 'sidebar' as const,
                    title: locale === 'zh-CN' ? '侧栏布局' : 'Sidebar',
                    desc: locale === 'zh-CN' ? '主辅分区/侧边辅助' : 'Primary & secondary zones',
                  },
                ] as const
              ).map((it) => {
                const selected = editLayoutMode === 'template' && editLayoutTemplate === it.key
                return (
                  <Col key={it.key} xs={24} md={12} xl={6}>
                    <Card
                      hoverable
                      onClick={() => {
                        setEditLayoutMode('template')
                        setEditLayoutTemplate(it.key)
                      }}
                      styles={{ body: { padding: 8 } }}
                      style={{
                        border: selected ? `2px solid ${token.colorPrimary}` : `1px solid ${token.colorSplit}`,
                      }}
                    >
                      <LayoutWireframe kind={it.key} />
                      <div style={{ height: 6 }} />
                      <Typography.Text strong style={{ display: 'block', lineHeight: 1.3 }}>
                        {it.title}
                      </Typography.Text>
                      <div style={{ height: 3 }} />
                      <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12, lineHeight: 1.3 }}>
                        {it.desc}
                      </Typography.Text>
                    </Card>
                  </Col>
                )
              })}

              {(() => {
                const selected = editLayoutMode === 'free'
                return (
                  <Col xs={24} md={12} xl={6}>
                    <Card
                      hoverable
                      onClick={() => setEditLayoutMode('free')}
                      styles={{ body: { padding: 8 } }}
                      style={{
                        border: selected ? `2px solid ${token.colorPrimary}` : `1px solid ${token.colorSplit}`,
                      }}
                    >
                      <CustomGridPreview />
                      <div style={{ height: 8 }} />
                      <Typography.Text strong style={{ display: 'block', lineHeight: 1.3 }}>
                        {locale === 'zh-CN' ? '自定义栅格' : 'Custom Grid'}
                      </Typography.Text>
                      <div style={{ height: 3 }} />
                      <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12, lineHeight: 1.3 }}>
                        {locale === 'zh-CN' ? '自由定义列数、行高与间距' : 'Customize columns, row height and gap'}
                      </Typography.Text>
                    </Card>
                  </Col>
                )
              })()}
            </Row>

            {editLayoutMode === 'free' ? (
              <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
                <div>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {locale === 'zh-CN' ? '列数' : 'Columns'}
                      <Tooltip placement="top" title={<div style={{ maxWidth: 320, lineHeight: 1.6 }}>默认12列，可调4~24列；定义每个图表的宽度，按列数计算</div>}>
                        <InfoCircleOutlined style={{ fontSize: 12, color: token.colorTextTertiary }} />
                      </Tooltip>
                    </span>
                  </Typography.Text>
                  <div style={{ height: 6 }} />
                  <InputNumber min={4} max={24} value={editFreeCols} onChange={(v) => setEditFreeCols(Number(v ?? 12))} style={{ width: '100%' }} />
                </div>
                <div>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {locale === 'zh-CN' ? '行高' : 'Row height'}
                      <Tooltip placement="top" title={<div style={{ maxWidth: 320, lineHeight: 1.6 }}>默认100px/行，可调50~300px/行；定义每个图表的高度，按行数计算</div>}>
                        <InfoCircleOutlined style={{ fontSize: 12, color: token.colorTextTertiary }} />
                      </Tooltip>
                    </span>
                  </Typography.Text>
                  <div style={{ height: 6 }} />
                  <InputNumber min={50} max={300} value={editFreeRowHeight} onChange={(v) => setEditFreeRowHeight(Number(v ?? 100))} style={{ width: '100%' }} />
                </div>
                <div>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {locale === 'zh-CN' ? '间距' : 'Gap'}
                      <Tooltip placement="top" title={<div style={{ maxWidth: 320, lineHeight: 1.6 }}>默认16px，可调8~32px；定义图表之间的间距。</div>}>
                        <InfoCircleOutlined style={{ fontSize: 12, color: token.colorTextTertiary }} />
                      </Tooltip>
                    </span>
                  </Typography.Text>
                  <div style={{ height: 6 }} />
                  <InputNumber min={8} max={32} value={editFreeGap} onChange={(v) => setEditFreeGap(Number(v ?? 16))} style={{ width: '100%' }} />
                </div>
              </div>
            ) : null}
          </div>

          <div>
            <Typography.Text type="secondary">
              <span style={{ color: token.colorError, marginRight: 4 }}>*</span>
              {locale === 'zh-CN' ? '图表色系' : 'Chart palette'}
            </Typography.Text>
            <div style={{ height: 8 }} />
            <ChartPalettePicker value={editChartPalette} onChange={(v) => setEditChartPalette(v)} />
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
                title={locale === 'zh-CN' ? '点击上传' : 'Click to upload'}
                description={locale === 'zh-CN' ? '支持 JSON / YAML / XML 格式' : 'Supports JSON / YAML / XML'}
                height={220}
                accept=".json,.yaml,.yml,.xml,application/json,application/xml,text/xml"
                maxCount={1}
                seedFileName={editCfgSeedName}
                seedKey={editCfgSeedKey}
                helperAction={{ label: t('dashboard.viewConfigExample'), onClick: () => setExampleOpen(true) }}
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
            </div>

            </div>
          </div>
        </Space>
      </Modal>

      <Modal
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        title={<div style={{ paddingRight: 28, fontWeight: 800, fontSize: 18, lineHeight: 1.35 }}>{locale === 'zh-CN' ? '预览仪表盘' : 'Preview dashboard'}</div>}
        footer={
          <Space style={{ width: '100%', justifyContent: 'flex-end' }} size={12}>
            <Button onClick={() => setPreviewOpen(false)}>{t('actions.cancel')}</Button>
            <Button
              type="primary"
              onClick={() => {
                const id = previewTargetId
                setPreviewOpen(false)
                const target = customDashboards.find((x) => x.id === id)
                if (target) openEditModal(target)
              }}
            >
              {locale === 'zh-CN' ? '编辑' : 'Edit'}
            </Button>
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
            <Row gutter={[16, 12]}>
              <Col xs={24} md={12}>
                <Typography.Text type="secondary">
                  <span style={{ color: token.colorError, marginRight: 4 }}>*</span>
                  {locale === 'zh-CN' ? '语言' : 'Language'}
                </Typography.Text>
                <div style={{ height: 8 }} />
                <Select
                  value={previewLanguage}
                  disabled
                  style={{ width: '100%' }}
                  options={[{ label: '简体中文', value: 'zh-CN' }, { label: 'English', value: 'en-US' }]}
                />
              </Col>
              <Col xs={24} md={12}>
                <Typography.Text type="secondary">
                  <span style={{ color: token.colorError, marginRight: 4 }}>*</span>
                  {locale === 'zh-CN' ? '时区' : 'Time zone'}
                </Typography.Text>
                <div style={{ height: 8 }} />
                <Select
                  value={previewTimeZone}
                  disabled
                  style={{ width: '100%' }}
                  options={[
                    { label: 'Asia/Shanghai (UTC+8)', value: 'Asia/Shanghai' },
                    { label: 'UTC', value: 'UTC' },
                    { label: 'America/Los_Angeles', value: 'America/Los_Angeles' },
                    { label: 'Europe/London', value: 'Europe/London' },
                  ]}
                />
              </Col>
            </Row>
          </div>

          <div>
            <Typography.Text type="secondary">
              <span style={{ color: token.colorError, marginRight: 4 }}>*</span>
              {locale === 'zh-CN' ? '主题风格' : 'Theme style'}
            </Typography.Text>
            <div style={{ height: 8 }} />
            <ThemeStylePicker value={previewThemeSystem} onChange={() => {}} disabled />
          </div>

          <div>
            <Typography.Text type="secondary">
              <span style={{ color: token.colorError, marginRight: 4 }}>*</span>
              {locale === 'zh-CN' ? '页面布局' : 'Layout'}
            </Typography.Text>
            <div style={{ height: 8 }} />
            <Row gutter={[12, 12]}>
              {(
                [
                  {
                    key: 'main-sub' as const,
                    title: locale === 'zh-CN' ? '主次布局' : 'Main/Sub',
                    desc: locale === 'zh-CN' ? '主次分明/主体突出' : 'Main emphasis / clear hierarchy',
                  },
                  {
                    key: 'three-col' as const,
                    title: locale === 'zh-CN' ? '三列布局' : 'Three columns',
                    desc: locale === 'zh-CN' ? '等分并列 / 横向对比' : 'Equal columns / side-by-side',
                  },
                  {
                    key: 'sidebar' as const,
                    title: locale === 'zh-CN' ? '侧栏布局' : 'Sidebar',
                    desc: locale === 'zh-CN' ? '主辅分区/侧边辅助' : 'Primary & secondary zones',
                  },
                ] as const
              ).map((it) => {
                const selected = previewLayoutMode === 'template' && previewLayoutTemplate === it.key
                return (
                  <Col key={it.key} xs={24} md={12} xl={6}>
                    <Card
                      styles={{ body: { padding: 8 } }}
                      style={{
                        border: selected ? `2px solid ${token.colorPrimary}` : `1px solid ${token.colorSplit}`,
                        cursor: 'default',
                      }}
                    >
                      <LayoutWireframe kind={it.key} />
                      <div style={{ height: 6 }} />
                      <Typography.Text strong style={{ display: 'block', lineHeight: 1.3 }}>
                        {it.title}
                      </Typography.Text>
                      <div style={{ height: 3 }} />
                      <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12, lineHeight: 1.3 }}>
                        {it.desc}
                      </Typography.Text>
                    </Card>
                  </Col>
                )
              })}

              {(() => {
                const selected = previewLayoutMode === 'free'
                return (
                  <Col xs={24} md={12} xl={6}>
                    <Card
                      styles={{ body: { padding: 8 } }}
                      style={{
                        border: selected ? `2px solid ${token.colorPrimary}` : `1px solid ${token.colorSplit}`,
                        cursor: 'default',
                      }}
                    >
                      <CustomGridPreview />
                      <div style={{ height: 6 }} />
                      <Typography.Text strong style={{ display: 'block', lineHeight: 1.3 }}>
                        {locale === 'zh-CN' ? '自定义栅格' : 'Custom Grid'}
                      </Typography.Text>
                      <div style={{ height: 3 }} />
                      <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12, lineHeight: 1.3 }}>
                        {locale === 'zh-CN' ? '自由定义列数、行高与间距' : 'Customize columns, row height and gap'}
                      </Typography.Text>
                    </Card>
                  </Col>
                )
              })()}
            </Row>

            {previewLayoutMode === 'free' ? (
              <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
                <div>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {locale === 'zh-CN' ? '列数' : 'Columns'}
                      <Tooltip
                        placement="top"
                        title={
                          <div style={{ maxWidth: 320, lineHeight: 1.6 }}>默认12列，可调4~24列；定义每个图表的宽度，按列数计算</div>
                        }
                      >
                        <InfoCircleOutlined style={{ fontSize: 12, color: token.colorTextTertiary }} />
                      </Tooltip>
                    </span>
                  </Typography.Text>
                  <div style={{ height: 6 }} />
                  <InputNumber value={previewFreeCols} disabled style={{ width: '100%' }} />
                </div>
                <div>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {locale === 'zh-CN' ? '行高' : 'Row height'}
                      <Tooltip
                        placement="top"
                        title={
                          <div style={{ maxWidth: 320, lineHeight: 1.6 }}>默认100px/行，可调50~300px/行；定义每个图表的高度，按行数计算</div>
                        }
                      >
                        <InfoCircleOutlined style={{ fontSize: 12, color: token.colorTextTertiary }} />
                      </Tooltip>
                    </span>
                  </Typography.Text>
                  <div style={{ height: 6 }} />
                  <InputNumber value={previewFreeRowHeight} disabled style={{ width: '100%' }} />
                </div>
                <div>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {locale === 'zh-CN' ? '间距' : 'Gap'}
                      <Tooltip
                        placement="top"
                        title={
                          <div style={{ maxWidth: 320, lineHeight: 1.6 }}>默认16px，可调8~32px；定义图表之间的间距。</div>
                        }
                      >
                        <InfoCircleOutlined style={{ fontSize: 12, color: token.colorTextTertiary }} />
                      </Tooltip>
                    </span>
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
              {locale === 'zh-CN' ? '数据' : 'Data'}
              <Tooltip
                placement="top"
                title={
                  <div style={{ maxWidth: 520, lineHeight: 1.7 }}>
                    为获得最佳 AI 体验，单业务主题建议关联同一数据库不超过 10 张表，若需跨库关联或表数过多，建议采用宽表化、拆分主题或视图汇聚
                  </div>
                }
              >
                <span style={{ marginInlineStart: 8, display: 'inline-flex', alignItems: 'center' }}>
                  <InfoCircleOutlined style={{ fontSize: 12, color: token.colorTextTertiary }} />
                </span>
              </Tooltip>
            </Typography.Text>
            <div style={{ height: 8 }} />

            <TreeSelect
              style={{ width: '100%' }}
              dropdownStyle={{ width: 760 }}
              value={previewDisplayDataSourceId ? previewTables.map((tb) => `${previewDisplayDataSourceId}::${tb}`) : []}
              treeCheckable
              showCheckedStrategy={TreeSelect.SHOW_CHILD}
              maxTagCount="responsive"
              placeholder={locale === 'zh-CN' ? '选择数据表' : 'Select tables'}
              showSearch
              filterTreeNode={false}
              onSearch={(v) => setPreviewTableSearch(String(v ?? ''))}
              searchValue={previewTableSearch}
              allowClear
              suffixIcon={<SearchOutlined />}
              dropdownRender={() => {
                const q = previewTableSearch.trim().toLowerCase()
                const dsVisible = dataSources.filter((ds) => {
                  if (!q) return true
                  if (ds.name.toLowerCase().includes(q)) return true
                  return ds.tables.some((tb) => tb.toLowerCase().includes(q))
                })
                const activeDs = dataSources.find((x) => x.id === previewDataSourceId) ?? dsVisible[0] ?? dataSources[0]
                const activeTables = (activeDs?.tables ?? []).filter((tb) => {
                  if (!q) return true
                  return tb.toLowerCase().includes(q) || (activeDs?.name ?? '').toLowerCase().includes(q)
                })

                return (
                  <div style={{ padding: 10 }}>
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
                            const lower = String(q)
                            const fullCandidate = ds.tables.filter((tb) => {
                              if (!lower) return true
                              if (ds.name.toLowerCase().includes(lower)) return true
                              return tb.toLowerCase().includes(lower)
                            })
                            const limited = Array.from(new Set(fullCandidate)).slice(0, 10)
                            const selectedCount = active ? previewTables.filter((tb) => limited.includes(tb)).length : 0
                            const allChecked = active && limited.length > 0 && selectedCount === limited.length
                            const indeterminate = active && selectedCount > 0 && !allChecked
                            return (
                              <div
                                key={ds.id}
                                onClick={() => {
                                  if (previewDataSourceId !== ds.id) {
                                    setPreviewDataSourceId(ds.id)
                                    setPreviewTables([])
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
                                <Checkbox
                                  checked={allChecked}
                                  indeterminate={indeterminate}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={() => {
                                    setPreviewDataSourceId(ds.id)
                                    if (active && selectedCount > 0) {
                                      setPreviewTables([])
                                      return
                                    }
                                    setPreviewTables(limited)
                                    if (fullCandidate.length > 10) void message.warning(t('dashboard.tablesLimit'))
                                  }}
                                />
                                <DatabaseOutlined style={{ opacity: 0.75 }} />
                                <div style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ds.name}</div>
                              </div>
                            )
                          })}
                        </Space>
                      </div>

                      <div style={{ overflow: 'auto', padding: 10 }}>
                        <Space direction="vertical" size={10} style={{ width: '100%' }}>
                          {activeTables.map((tb) => {
                            const checked = previewTables.includes(tb)
                            return (
                              <Checkbox
                                key={tb}
                                checked={checked}
                                style={{ width: '100%', fontSize: 14 }}
                                onChange={() => {
                                  if (!activeDs) return
                                  setPreviewDataSourceId(activeDs.id)
                                  setPreviewTables((prev) => {
                                    const next = checked ? prev.filter((x) => x !== tb) : [...prev, tb]
                                    const sliced = next.slice(0, 10)
                                    if (next.length > 10) void message.warning(t('dashboard.tablesLimit'))
                                    return sliced
                                  })
                                }}
                              >
                                <Space size={10}>
                                  <DataTableIcon size={14} color={token.colorTextSecondary} />
                                  <span style={{ fontSize: 14 }}>{tb}</span>
                                </Space>
                              </Checkbox>
                            )
                          })}
                        </Space>
                      </div>
                    </div>
                  </div>
                )
              }}
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
              onChange={(values) => {
                const arr = (Array.isArray(values) ? values : []).map((v) => String(v))
                if (arr.length === 0) {
                  setPreviewTables([])
                  return
                }
                const first = arr[0]
                const dsId = first.includes('::') ? first.split('::')[0] : ''
                const tables = arr.map((v) => (v.includes('::') ? v.split('::')[1] : '')).filter(Boolean).slice(0, 10)
                if (dsId) setPreviewDataSourceId(dsId)
                setPreviewTables(tables)
              }}
            />
          </div>

          <div>
            <Typography.Text type="secondary">
              <span style={{ color: token.colorError, marginRight: 4 }}>*</span>
              {locale === 'zh-CN' ? '图表色系' : 'Chart palette'}
            </Typography.Text>
            <div style={{ height: 8 }} />
            <ChartPalettePicker value={previewChartPalette} onChange={() => {}} disabled />
          </div>

          <div>
            <Typography.Text type="secondary">
              <span style={{ color: token.colorError, marginRight: 4 }}>*</span>
              {locale === 'zh-CN' ? '图表配置' : 'Chart config'}
            </Typography.Text>
            <div style={{ height: 8 }} />

            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              <UploadPanel
                title={locale === 'zh-CN' ? '点击上传' : 'Click to upload'}
                description={locale === 'zh-CN' ? '支持 JSON / YAML / XML 格式' : 'Supports JSON / YAML / XML'}
                height={220}
                accept=".json,.yaml,.yml,.xml,application/json,application/xml,text/xml"
                maxCount={1}
                seedFileName={previewCfgSeedName}
                seedKey={previewCfgSeedKey}
                helperAction={{ label: t('dashboard.viewConfigExample'), onClick: () => setExampleOpen(true) }}
                disabled
              />
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
        open={!!publishTarget}
        centered
        width={360}
        zIndex={20000}
        getContainer={() => document.body}
        title={
          <div style={{ paddingRight: 28, fontWeight: 800, fontSize: 18, lineHeight: 1.35 }}>
            {publishTarget ? (publishTarget.nextPublished ? '发布仪表盘' : '下线仪表盘') : ''}
          </div>
        }
        okText={publishTarget?.nextPublished ? '发布' : '下线'}
        cancelText="取消"
        okButtonProps={publishTarget?.nextPublished ? undefined : { danger: true }}
        onCancel={() => setPublishTarget(null)}
        onOk={() => {
          if (!publishTarget) return
          const { id, nextPublished } = publishTarget
          setPublishTarget(null)
          setCustomDashboards((prev) => prev.map((x) => (x.id === id ? { ...x, published: nextPublished, updatedAt: nowText() } : x)))
        }}
      >
        <div style={{ paddingTop: 8, paddingBottom: 18, lineHeight: 1.65, color: token.colorTextSecondary }}>
          {publishTarget?.nextPublished
            ? '确认发布仪表盘？发布后数据将对外可见，并支持基于该仪表盘进行智能问数分析。'
            : '确认下线仪表盘？下线后仪表盘将不可访问，用户无法继续分析该仪表盘数据。'}
        </div>
      </Modal>

      <Modal
        open={!!deleteDashboardTarget}
        centered
        width={360}
        zIndex={20000}
        getContainer={() => document.body}
        title={<div style={{ paddingRight: 28, fontWeight: 800, fontSize: 18, lineHeight: 1.35 }}>{locale === 'zh-CN' ? '删除仪表盘' : 'Delete dashboard'}</div>}
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
