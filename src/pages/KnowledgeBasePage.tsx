import {
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Modal,
  Pagination,
  Popover,
  Row,
  Select,
  Space,
  Typography,
  message,
  theme,
} from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { MutableRefObject, ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { buildSeed, nowId, readTab, setQuery } from './knowledgeBase/kbModel'
import type { KnowledgeItem, KnowledgeTabKey, LogicTreeItem, MetricItem, RegexItem, SqlExampleItem, TermItem } from './knowledgeBase/kbModel'
import { useTranslation } from 'react-i18next'
import { PageIntro } from '../components/PageIntro'
import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons'
import { UploadPanel } from '../components/UploadPanel'
import * as XLSX from 'xlsx'
import { BookOpen, Code2, GitBranch, Regex, Sigma } from 'lucide-react'
import { useAppStore } from '../store/appStore'

function tabLabel(t: (k: string) => string, k: KnowledgeTabKey) {
  if (k === 'terms') return t('kb.terms')
  if (k === 'metrics') return t('kb.metrics')
  if (k === 'regex') return t('kb.regex')
  if (k === 'logic-tree') return t('kb.logicTree')
  return t('kb.sqlExamples')
}

function uniqTrim(arr: unknown): string[] {
  const raw = Array.isArray(arr) ? arr : []
  const seen = new Set<string>()
  const out: string[] = []
  for (const x of raw) {
    const s = String(x ?? '').trim()
    if (!s) continue
    const key = s.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(s)
  }
  return out
}

function formatRefCount(n: unknown) {
  const v = Number(n ?? 0)
  if (!Number.isFinite(v) || v <= 0) return '0次引用'
  return `${v}次引用`
}

type CardMenuState = {
  openId: string | null
  setOpenId: (id: string | null) => void
  closeTimerRef: MutableRefObject<number | null>
}

const SQL_HL = {
  keyword: '#FB7185',
  string: '#22D3EE',
  number: '#A78BFA',
  ident: 'rgba(226,232,240,0.92)',
}

function sqlHighlightNodes(line: string): ReactNode[] {
  const KW = new Set([
    'SELECT',
    'FROM',
    'WHERE',
    'GROUP',
    'BY',
    'ORDER',
    'LIMIT',
    'AS',
    'JOIN',
    'LEFT',
    'RIGHT',
    'INNER',
    'OUTER',
    'ON',
    'AND',
    'OR',
    'CASE',
    'WHEN',
    'THEN',
    'END',
    'SUM',
    'COUNT',
    'AVG',
    'MIN',
    'MAX',
    'DISTINCT',
    'HAVING',
  ])

  const out: ReactNode[] = []
  const re = /('[^']*'|"[^"]*"|\b[a-zA-Z_][a-zA-Z0-9_]*\b|\d+(?:\.\d+)?)/g
  let last = 0
  let m: RegExpExecArray | null = null
  while ((m = re.exec(line))) {
    const token = m[0]
    if (m.index > last) out.push(line.slice(last, m.index))
    const upper = token.toUpperCase()
    const isString = token.startsWith("'") || token.startsWith('"')
    const isNumber = /^[0-9]/.test(token)
    const isKw = KW.has(upper)
    out.push(
      <span
        key={`${m.index}-${token}`}
        style={{
          color: isKw ? SQL_HL.keyword : isString ? SQL_HL.string : isNumber ? SQL_HL.number : SQL_HL.ident,
          fontWeight: isKw ? 800 : 500,
        }}
      >
        {token}
      </span>,
    )
    last = m.index + token.length
  }
  if (last < line.length) out.push(line.slice(last))
  return out
}

const CARD_MIN_HEIGHT = 132

const SqlCodeWindow = ({ sql, isDark }: { sql: string; isDark: boolean }) => {
  const lines = useMemo(() => String(sql ?? '').split('\n'), [sql])
  const shown = lines.slice(0, 6)
  const hasMore = lines.length > 6
  const bg = isDark ? 'rgba(8, 13, 23, 0.88)' : 'rgba(2, 6, 23, 0.92)'
  const morePillBg = 'rgba(255,255,255,0.06)'

  return (
    <div style={{ height: 124, position: 'relative' }}>
      <div
        style={{
          height: 124,
          borderRadius: 12,
          background: bg,
          overflow: 'hidden',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
          position: 'relative',
        }}
      >
        <div
          style={{
            height: '100%',
            display: 'grid',
            gridTemplateColumns: '30px 1px minmax(0, 1fr)',
            gap: 10,
            padding: 12,
            fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
            fontSize: 12,
            lineHeight: 1.35,
          }}
        >
          <div style={{ color: 'rgba(148,163,184,0.55)', textAlign: 'right', paddingRight: 0, userSelect: 'none' }}>
            {shown.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.10)', height: '100%' }} />
          <div style={{ minWidth: 0 }}>
            {shown.map((ln, i) => (
              <div key={i} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {sqlHighlightNodes(ln)}
              </div>
            ))}
          </div>
        </div>

        {hasMore ? (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 36,
              background: 'linear-gradient(180deg, rgba(2,6,23,0) 0%, rgba(2,6,23,0.92) 100%)',
              pointerEvents: 'none',
            }}
          />
        ) : null}
      </div>
      {hasMore ? (
        <div style={{ position: 'absolute', right: 10, bottom: 10, padding: '2px 8px', borderRadius: 999, background: morePillBg, color: 'rgba(148,163,184,0.92)', fontSize: 11, fontWeight: 700 }}>
          ...
        </div>
      ) : null}
    </div>
  )
}

const LogicTreeMini = ({ isDark, accent }: { isDark: boolean; accent: string }) => {
  const stroke = isDark ? 'rgba(148,163,184,0.28)' : 'rgba(71,85,105,0.22)'
  const node2 = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)'
  return (
    <svg viewBox="0 0 280 78" width="100%" height="78" xmlns="http://www.w3.org/2000/svg">
      <path d="M72 39H130" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <path d="M130 39V22" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <path d="M130 39V56" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <path d="M130 22H196" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <path d="M130 56H196" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <path d="M196 22V12" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <path d="M196 56V66" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <path d="M196 39H236" stroke={stroke} strokeWidth="2" strokeLinecap="round" />

      <circle cx="60" cy="39" r="6.5" fill={accent} opacity="0.92" />
      <circle cx="130" cy="39" r="6.5" fill={accent} opacity="0.92" />
      <circle cx="196" cy="39" r="5.6" fill={accent} opacity="0.78" />

      <rect x="232" y="33" width="16" height="16" rx="4" fill={node2} stroke={accent} strokeWidth="2" />
      <rect x="188" y="6" width="16" height="16" rx="4" fill={node2} stroke={accent} strokeWidth="2" opacity="0.9" />
      <rect x="188" y="56" width="16" height="16" rx="4" fill={node2} stroke={accent} strokeWidth="2" opacity="0.9" />
    </svg>
  )
}

const BaseCard = ({
  id,
  title,
  icon,
  referenceCount,
  children,
  onEdit,
  onDelete,
  onView,
  menu,
  cardHeight,
  contentPaddingTop,
  isDark,
  token,
}: {
  id: string
  title: string
  icon: ReactNode
  referenceCount: number
  children: ReactNode
  onEdit: () => void
  onDelete: () => void
  onView: () => void
  menu: CardMenuState
  cardHeight?: number
  contentPaddingTop?: number
  isDark: boolean
  token: any
}) => {
  const pillBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)'

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => {
        if (menu.closeTimerRef.current) window.clearTimeout(menu.closeTimerRef.current)
        menu.closeTimerRef.current = null
        menu.setOpenId(id)
      }}
      onMouseLeave={() => {
        if (menu.closeTimerRef.current) window.clearTimeout(menu.closeTimerRef.current)
        menu.closeTimerRef.current = window.setTimeout(() => menu.setOpenId(null), 120)
      }}
    >
      <Popover
        open={menu.openId === id}
        placement="bottomRight"
        trigger={[]}
        getPopupContainer={() => document.body}
        autoAdjustOverflow={false}
        arrow={{ pointAtCenter: true }}
        overlayInnerStyle={{ padding: 8 }}
        align={{ offset: [0, 10] }}
        overlayStyle={{ zIndex: 2100 }}
        content={
          <div
            onMouseEnter={() => {
              if (menu.closeTimerRef.current) window.clearTimeout(menu.closeTimerRef.current)
              menu.closeTimerRef.current = null
              menu.setOpenId(id)
            }}
            onMouseLeave={() => {
              if (menu.closeTimerRef.current) window.clearTimeout(menu.closeTimerRef.current)
              menu.closeTimerRef.current = window.setTimeout(() => menu.setOpenId(null), 120)
            }}
          >
            <Space direction="vertical" size={6} style={{ padding: 4 }}>
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={(e) => {
                  e.stopPropagation()
                  menu.setOpenId(null)
                  onEdit()
                }}
              >
                编辑
              </Button>
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => {
                  e.stopPropagation()
                  menu.setOpenId(null)
                  onDelete()
                }}
              >
                删除
              </Button>
            </Space>
          </div>
        }
      >
        <div style={{ position: 'absolute', right: 14, bottom: 14, width: 0, height: 0, pointerEvents: 'none' }} />
      </Popover>

      <Card
        hoverable
        bordered={false}
        onClick={onView}
        className={menu.openId === id ? 'dsCard dsCardActive' : 'dsCard'}
        styles={{ body: { padding: 16, display: 'flex', flexDirection: 'column' } }}
        style={{
          borderRadius: 14,
          background: token.colorBgContainer,
          border: `1px solid ${token.colorBorderSecondary}`,
          height: cardHeight ?? CARD_MIN_HEIGHT,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0 }}>
            <span style={{ lineHeight: 0, display: 'inline-flex', alignItems: 'center', marginTop: 2, flex: 'none' }}>{icon}</span>
            <Typography.Paragraph
              ellipsis={{ rows: 2 }}
              style={{
                margin: 0,
                fontSize: 14,
                lineHeight: 1.35,
                fontWeight: 700,
                color: token.colorPrimary,
                minWidth: 0,
              }}
            >
              {title}
            </Typography.Paragraph>
          </div>
          <span
            style={{
              flex: 'none',
              padding: '4px 10px',
              borderRadius: 999,
              background: pillBg,
              border: 'none',
              color: token.colorTextSecondary,
              fontSize: 11,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <LinkOutlined style={{ fontSize: 12, opacity: 0.9 }} />
              {formatRefCount(referenceCount)}
            </span>
          </span>
        </div>

        <div style={{ flex: 1, minHeight: 0, paddingTop: contentPaddingTop ?? 10 }}>{children}</div>
      </Card>
    </div>
  )
}

function highlightAggregates(text: string) {
  const re = /\b(SUM|COUNT|AVG|MIN|MAX|DISTINCT)\b/gi
  const out: ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null = null
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const token = m[0]
    out.push(
      <span key={`${m.index}-${token}`} style={{ color: SQL_HL.keyword, fontWeight: 800 }}>
        {token}
      </span>,
    )
    last = m.index + token.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

const TermCard = ({
  item,
  onEdit,
  onDelete,
  onView,
  menu,
  isDark,
  token,
}: {
  item: TermItem
  onEdit: () => void
  onDelete: () => void
  onView: () => void
  menu: CardMenuState
  isDark: boolean
  token: any
}) => {
  const tags = item.synonyms.slice(0, 3)
  const rest = Math.max(0, item.synonyms.length - tags.length)
  const tagBg = isDark ? 'rgba(43, 92, 246, 0.14)' : 'rgba(43, 92, 246, 0.10)'
  const tagBorder = isDark ? 'rgba(43, 92, 246, 0.22)' : 'rgba(43, 92, 246, 0.18)'

  return (
    <BaseCard
      id={item.id}
      title={item.term}
      icon={<BookOpen size={18} color={token.colorPrimary} />}
      referenceCount={item.referenceCount}
      onEdit={onEdit}
      onDelete={onDelete}
      onView={onView}
      menu={menu}
      cardHeight={144}
      contentPaddingTop={8}
      isDark={isDark}
      token={token}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {tags.map((s) => (
          <span key={s} style={{ padding: '3px 10px', borderRadius: 10, background: tagBg, border: `1px solid ${tagBorder}`, color: token.colorPrimary, fontSize: 11, fontWeight: 650 }}>
            {s}
          </span>
        ))}
        {rest > 0 ? (
          <span style={{ padding: '3px 10px', borderRadius: 10, background: tagBg, border: `1px solid ${tagBorder}`, color: token.colorTextSecondary, fontSize: 11, fontWeight: 650 }}>
            +{rest}
          </span>
        ) : null}
      </div>
      {item.desc ? (
        <Typography.Paragraph ellipsis={{ rows: 2 }} style={{ marginTop: 8, marginBottom: 0, fontSize: 12, lineHeight: 1.6, color: token.colorTextSecondary }}>
          {item.desc}
        </Typography.Paragraph>
      ) : null}
    </BaseCard>
  )
}

const MetricCard = ({
  item,
  onEdit,
  onDelete,
  onView,
  menu,
  isDark,
  token,
}: {
  item: MetricItem
  onEdit: () => void
  onDelete: () => void
  onView: () => void
  menu: CardMenuState
  isDark: boolean
  token: any
}) => {
  const code = String(item.formula ?? '').trim()
  const primary = token.colorPrimary
  const contentBg = isDark ? 'rgba(8, 13, 23, 0.58)' : token.colorFillTertiary

  return (
    <BaseCard
      id={item.id}
      title={item.name}
      icon={<Sigma size={18} color={primary} />}
      referenceCount={item.referenceCount}
      onEdit={onEdit}
      onDelete={onDelete}
      onView={onView}
      menu={menu}
      cardHeight={192}
      isDark={isDark}
      token={token}
    >
      <div style={{ borderRadius: 12, background: contentBg, border: 'none', padding: 12 }}>
        <Typography.Paragraph
          ellipsis={{ rows: 2 }}
          style={{ margin: 0, fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace', fontSize: 12, lineHeight: 1.7, color: token.colorText }}
        >
          {highlightAggregates(code)}
        </Typography.Paragraph>
      </div>
      {item.definition ? (
        <Typography.Paragraph ellipsis={{ rows: 2 }} style={{ marginTop: 10, marginBottom: 0, fontSize: 12, lineHeight: 1.65, color: token.colorTextSecondary }}>
          {item.definition}
        </Typography.Paragraph>
      ) : null}
    </BaseCard>
  )
}

const RegexCard = ({
  item,
  onEdit,
  onDelete,
  onView,
  menu,
  isDark,
  token,
}: {
  item: RegexItem
  onEdit: () => void
  onDelete: () => void
  onView: () => void
  menu: CardMenuState
  isDark: boolean
  token: any
}) => {
  const green = isDark ? 'rgba(34,197,94,0.95)' : 'rgba(22,163,74,0.95)'
  const innerBg = isDark ? 'rgba(8, 13, 23, 0.58)' : token.colorFillTertiary
  const dashed = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.12)'

  return (
    <BaseCard
      id={item.id}
      title={item.name}
      icon={<KbRegexIcon size={18} color={token.colorPrimary} />}
      referenceCount={item.referenceCount}
      onEdit={onEdit}
      onDelete={onDelete}
      onView={onView}
      menu={menu}
      cardHeight={192}
      isDark={isDark}
      token={token}
    >
      <div style={{ borderRadius: 12, background: innerBg, border: 'none', padding: 12 }}>
        <Typography.Paragraph
          ellipsis={{ rows: 2 }}
          style={{ margin: 0, fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace', fontSize: 12, lineHeight: 1.7, color: green, fontWeight: 750 }}
        >
          /{String(item.pattern ?? '').replace(/^\^|\$$/g, '')}/
        </Typography.Paragraph>

        <div style={{ marginTop: 10, borderTop: `1px dashed ${dashed}` }} />

        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 3px minmax(0, 1fr)', alignItems: 'stretch', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: token.colorTextTertiary, marginBottom: 8 }}>输入样例</div>
            <Typography.Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0, fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace', fontSize: 13, color: token.colorTextSecondary }}>
              {item.exampleIn || '-'}
            </Typography.Paragraph>
          </div>
          <div style={{ width: 3, borderRadius: 999, background: green, opacity: 0.75 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: token.colorTextTertiary, marginBottom: 8 }}>标准输出</div>
            <Typography.Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0, fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace', fontSize: 13, color: green, fontWeight: 750 }}>
              {item.exampleOut || '-'}
            </Typography.Paragraph>
          </div>
        </div>
      </div>
    </BaseCard>
  )
}

const LogicTreeCard = ({
  item,
  onEdit,
  onDelete,
  onView,
  menu,
  isDark,
  token,
}: {
  item: LogicTreeItem
  onEdit: () => void
  onDelete: () => void
  onView: () => void
  menu: CardMenuState
  isDark: boolean
  token: any
}) => {
  const innerBg = isDark ? 'rgba(8, 13, 23, 0.58)' : token.colorFillTertiary

  return (
    <BaseCard
      id={item.id}
      title={item.name}
      icon={<GitBranch size={18} color={token.colorPrimary} />}
      referenceCount={item.referenceCount}
      onEdit={onEdit}
      onDelete={onDelete}
      onView={onView}
      menu={menu}
      cardHeight={192}
      isDark={isDark}
      token={token}
    >
      <div style={{ borderRadius: 12, background: innerBg, border: 'none', padding: 12 }}>
        <LogicTreeMini isDark={isDark} accent={token.colorPrimary} />
      </div>
      {item.scenario ? (
        <Typography.Paragraph ellipsis={{ rows: 2 }} style={{ marginTop: 10, marginBottom: 0, fontSize: 12, lineHeight: 1.65, color: token.colorTextSecondary }}>
          {item.scenario}
        </Typography.Paragraph>
      ) : null}
    </BaseCard>
  )
}

const SqlExampleCard = ({
  item,
  onEdit,
  onDelete,
  onView,
  menu,
  isDark,
  token,
}: {
  item: SqlExampleItem
  onEdit: () => void
  onDelete: () => void
  onView: () => void
  menu: CardMenuState
  isDark: boolean
  token: any
}) => (
  <BaseCard
    id={item.id}
    title={item.question}
    icon={<KbSqlIcon size={18} color={token.colorPrimary} />}
    referenceCount={item.referenceCount}
    onEdit={onEdit}
    onDelete={onDelete}
    onView={onView}
    menu={menu}
    cardHeight={228}
    isDark={isDark}
    token={token}
  >
    <SqlCodeWindow sql={item.sql} isDark={isDark} />
  </BaseCard>
)

const PAGE_SIZE = 8

export default function KnowledgeBasePage() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const themeMode = useAppStore((s) => s.themeMode)
  const isDark = themeMode === 'dark'
  const { token } = theme.useToken()

  const [items, setItems] = useState<KnowledgeItem[]>(() => buildSeed())
  const [keyword, setKeyword] = useState('')

  const [importOpen, setImportOpen] = useState(false)
  const [importFiles, setImportFiles] = useState<File[]>([])

  const [editing, setEditing] = useState<KnowledgeItem | null>(null)
  const [editorMode, setEditorMode] = useState<'view' | 'edit'>('edit')
  const [form] = Form.useForm<Record<string, unknown>>()

  const [deleteTarget, setDeleteTarget] = useState<KnowledgeItem | null>(null)

  const [cardMenuOpenId, setCardMenuOpenId] = useState<string | null>(null)
  const closeCardMenuTimerRef = useRef<number | null>(null)

  const [page, setPage] = useState(1)

  const tab = readTab(location.search)
  const createOpen = new URLSearchParams(location.search).get('action') === 'new'
  const editorOpen = createOpen || !!editing
  const isViewMode = editorMode === 'view' && !createOpen && !!editing

  const intro = useMemo(() => {
    const title = tabLabel(t, tab)
    const descKey = `intro.kb.${tab}.desc`
    const desc = t(descKey)
    return { title, desc }
  }, [t, tab])

  const createLabel = useMemo(() => {
    if (tab === 'terms') return t('actions.newTerm')
    if (tab === 'metrics') return t('actions.newMetric')
    if (tab === 'regex') return t('actions.newRegex')
    if (tab === 'logic-tree') return t('actions.newLogicTree')
    return t('actions.newSqlExample')
  }, [t, tab])

  const importLabel = useMemo(() => {
    if (tab === 'terms') return t('actions.importTerms')
    if (tab === 'metrics') return t('actions.importMetrics')
    if (tab === 'regex') return t('actions.importRegex')
    if (tab === 'logic-tree') return t('actions.importLogicTree')
    return t('actions.importSqlExamples')
  }, [t, tab])

  const modalHint = useMemo(() => {
    if (tab === 'terms') return '统一业务表达，将多种说法映射为标准语义，减少理解偏差。'
    if (tab === 'metrics') return '固化指标定义与计算口径，统一标准计算方式，保证分析口径一致。'
    if (tab === 'regex') return '规范数据格式，通过规则自动纠正格式异常，提升数据一致性与可解析性。'
    if (tab === 'logic-tree') return '沉淀分析方法，将复杂问题按既定路径拆解与推理，提升分析结果的专业性与稳定性。'
    if (tab === 'sql-examples') return '提供标准SQL参考模板，辅助生成更符合业务习惯的查询语句，提升准确性与可用性。'
    return ''
  }, [tab])

  const downloadImportTemplate = () => {
    const template = (() => {
      if (tab === 'terms') return [{ term: 'ARPU', synonyms: ['用户产值', '每用户收入'] }]
      if (tab === 'metrics') return [{ name: '离网率', formula: '离网率 = 离网用户数 / 在网用户数' }]
      if (tab === 'regex') return [{ name: 'employee_id', pattern: '^([a-zA-Z])(\\d{5})$' }]
      if (tab === 'logic-tree') return [{ name: '营销活动复盘', scenario: '适用于活动效果复盘与异常归因。', steps: '1. 明确目标\n2. 指标口径\n3. 拆解维度\n4. 验证路径\n5. 结论输出' }]
      return [{ question: '如何按渠道统计 GMV？', sql: 'SELECT channel, SUM(amount) AS gmv\nFROM orders\nGROUP BY channel;' }]
    })()
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${tab}-template.json`
    a.rel = 'noreferrer'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const openNew = () => {
    setEditorMode('edit')
    setEditing(null)
    navigate({ pathname: '/knowledge-base', search: setQuery(location.search, { tab, action: 'new' }) })
  }

  const openEdit = (it: KnowledgeItem) => {
    setEditorMode('edit')
    setEditing(it)
  }

  const closeEditor = () => {
    if (createOpen) {
      navigate({ pathname: location.pathname, search: setQuery(location.search, { action: null }) }, { replace: true })
    }
    setEditing(null)
    setEditorMode('edit')
    form.resetFields()
  }

  useEffect(() => {
    if (!editorOpen) return

    if (!editing) {
      if (tab === 'terms') form.setFieldsValue({ term: '', synonyms: [] })
      if (tab === 'metrics') form.setFieldsValue({ name: '', formula: '' })
      if (tab === 'regex') form.setFieldsValue({ name: '', pattern: '' })
      if (tab === 'logic-tree') form.setFieldsValue({ name: '', scenario: '', steps: '' })
      if (tab === 'sql-examples') form.setFieldsValue({ question: '', sql: '' })
      return
    }

    if (editing.category === 'terms') form.setFieldsValue({ term: editing.term, synonyms: editing.synonyms })
    if (editing.category === 'metrics') form.setFieldsValue({ name: editing.name, formula: editing.formula })
    if (editing.category === 'regex') form.setFieldsValue({ name: editing.name, pattern: editing.pattern })
    if (editing.category === 'logic-tree') form.setFieldsValue({ name: editing.name, scenario: editing.scenario, steps: editing.steps })
    if (editing.category === 'sql-examples') form.setFieldsValue({ question: editing.question, sql: editing.sql })
  }, [editorOpen, editing, form, tab])

  const visibleItems = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return items
      .filter((it) => it.category === tab)
      .filter((it) => {
        if (!kw) return true
        const parts: string[] = []
        if (it.category === 'terms') parts.push(it.term, ...it.synonyms, it.desc)
        if (it.category === 'metrics') parts.push(it.name, it.definition, it.layer, it.formula)
        if (it.category === 'regex') parts.push(it.name, it.pattern, it.replacement, it.exampleIn, it.exampleOut)
        if (it.category === 'logic-tree') parts.push(it.name, it.scenario, it.steps)
        if (it.category === 'sql-examples') parts.push(it.question, it.sql)
        return parts.join(' ').toLowerCase().includes(kw)
      })
  }, [items, keyword, tab])

  useEffect(() => {
    setPage(1)
  }, [tab, keyword])

  const pagedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return visibleItems.slice(start, start + PAGE_SIZE)
  }, [page, visibleItems])

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(visibleItems.length / PAGE_SIZE))
    if (page > maxPage) setPage(maxPage)
  }, [page, visibleItems.length])

  const onImportFile = async (f: File) => {
    try {
      const updatedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')

      const toItem = (x: any): KnowledgeItem | null => {
        if (tab === 'terms') {
          const term = String(x?.term ?? '').trim()
          const synonyms = uniqTrim(x?.synonyms ?? [])
          const desc = String(x?.desc ?? '').trim()
          const referenceCount = Number(x?.referenceCount ?? x?.references ?? 0) || 0
          if (!term) return null
          return { id: nowId(), category: 'terms', term, synonyms, desc, updatedAt, referenceCount }
        }
        if (tab === 'metrics') {
          const name = String(x?.name ?? '').trim()
          const definition = String(x?.definition ?? '').trim()
          const formula = String(x?.formula ?? '').trim()
          const referenceCount = Number(x?.referenceCount ?? x?.references ?? 0) || 0
          if (!name || !formula) return null
          return { id: nowId(), category: 'metrics', name, definition, layer: 'standard', formula, updatedAt, referenceCount }
        }
        if (tab === 'regex') {
          const name = String(x?.name ?? '').trim()
          const pattern = String(x?.pattern ?? '').trim()
          const replacement = String(x?.replacement ?? '').trim()
          const exampleIn = String(x?.exampleIn ?? '').trim()
          const exampleOut = String(x?.exampleOut ?? '').trim()
          const referenceCount = Number(x?.referenceCount ?? x?.references ?? 0) || 0
          if (!name || !pattern) return null
          return { id: nowId(), category: 'regex', name, pattern, replacement, exampleIn, exampleOut, updatedAt, referenceCount }
        }
        if (tab === 'logic-tree') {
          const name = String(x?.name ?? '').trim()
          const scenario = String(x?.scenario ?? '').trim()
          const steps = String(x?.steps ?? '').trim()
          const referenceCount = Number(x?.referenceCount ?? x?.references ?? 0) || 0
          if (!name || !scenario || !steps) return null
          return { id: nowId(), category: 'logic-tree', name, scenario, steps, updatedAt, referenceCount }
        }
        const question = String(x?.question ?? '').trim()
        const sql = String(x?.sql ?? '').trim()
        const referenceCount = Number(x?.referenceCount ?? x?.references ?? 0) || 0
        if (!question || !sql) return null
        return { id: nowId(), category: 'sql-examples', question, sql, updatedAt, referenceCount }
      }

      const ext = f.name.toLowerCase().split('.').pop() ?? ''

      const buildFromJson = async () => {
        const txt = await f.text()
        const j = JSON.parse(txt)
        if (!Array.isArray(j)) throw new Error('bad')
        return j as any[]
      }

      const buildFromExcel = async () => {
        const ab = await f.arrayBuffer()
        const wb = XLSX.read(ab, { type: 'array' })
        const name = wb.SheetNames[0]
        const sheet = wb.Sheets[name]
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' })
        return rows as any[]
      }

      const pick = (row: Record<string, any>, keys: string[]) => {
        for (const k of keys) {
          const v = row[k]
          if (v === undefined || v === null) continue
          const s = String(v).trim()
          if (s) return s
        }
        return ''
      }

      const normalize = (row: Record<string, any>) => {
        if (tab === 'terms') {
          const term = pick(row, ['term', '术语', '标准术语'])
          const synonymsRaw = pick(row, ['synonyms', '同义词', '同义词/别名', '别名'])
          const desc = pick(row, ['desc', '描述', '说明'])
          const synonyms = synonymsRaw ? synonymsRaw.split(/[,，;；\n\r\t ]+/).filter(Boolean) : []
          return { term, synonyms, desc }
        }
        if (tab === 'metrics') {
          const name = pick(row, ['name', '指标名', '指标'])
          const definition = pick(row, ['definition', '定义', '说明'])
          const formula = pick(row, ['formula', '公式', '计算口径'])
          return { name, definition, formula }
        }
        if (tab === 'regex') {
          const name = pick(row, ['name', '名称'])
          const pattern = pick(row, ['pattern', '正则', '表达式'])
          const replacement = pick(row, ['replacement', '替换'])
          const exampleIn = pick(row, ['exampleIn', '示例输入'])
          const exampleOut = pick(row, ['exampleOut', '示例输出'])
          return { name, pattern, replacement, exampleIn, exampleOut }
        }
        if (tab === 'logic-tree') {
          const name = pick(row, ['name', '名称'])
          const scenario = pick(row, ['scenario', '场景'])
          const steps = pick(row, ['steps', '步骤', '分析路径'])
          return { name, scenario, steps }
        }
        const question = pick(row, ['question', '问题'])
        const sql = pick(row, ['sql', 'SQL'])
        return { question, sql }
      }

      const source = ext === 'json' ? await buildFromJson() : ext === 'xls' || ext === 'xlsx' ? await buildFromExcel() : []
      const next =
        ext === 'json'
          ? (source.map(toItem).filter(Boolean) as KnowledgeItem[])
          : (source.map((x) => toItem(normalize(x))).filter(Boolean) as KnowledgeItem[])

      if (next.length === 0) {
        void message.warning(t('knowledge.importEmpty'))
        return
      }

      setItems((prev) => [...next, ...prev])
      void message.success(t('knowledge.importOk', { count: next.length }))
    } catch {
      void message.error(t('knowledge.importError'))
    }
  }

  const onSave = async () => {
    const v = await form.validateFields()
    const updatedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
    const preservedReferenceCount = editing?.referenceCount ?? 0

    const upsert = (next: KnowledgeItem) => {
      if (!editing) {
        setItems((prev) => [next, ...prev])
        return
      }
      setItems((prev) => prev.map((it) => (it.id === editing.id ? next : it)))
    }

    if (tab === 'terms') {
      const term = String((v as any).term ?? '').trim()
      const synonyms = uniqTrim((v as any).synonyms)
      if (!term) return
      const next: KnowledgeItem = {
        id: editing?.id ?? nowId(),
        category: 'terms',
        term,
        synonyms,
        desc: editing?.category === 'terms' ? editing.desc : '',
        updatedAt,
        referenceCount: preservedReferenceCount,
      }
      upsert(next)
      closeEditor()
      return
    }

    if (tab === 'metrics') {
      const name = String((v as any).name ?? '').trim()
      const formula = String((v as any).formula ?? '').trim()
      if (!name || !formula) return

      const normalized = name.toLowerCase()
      const conflict = items.some((it) => it.category === 'metrics' && it.id !== editing?.id && it.name.toLowerCase() === normalized)
      if (conflict) {
        void message.error('指标名已存在，请保持唯一')
        return
      }

      const next: KnowledgeItem = {
        id: editing?.id ?? nowId(),
        category: 'metrics',
        name,
        definition: editing?.category === 'metrics' ? editing.definition : '',
        layer: 'standard',
        formula,
        updatedAt,
        referenceCount: preservedReferenceCount,
      }
      upsert(next)
      closeEditor()
      return
    }

    if (tab === 'regex') {
      const name = String((v as any).name ?? '').trim()
      const pattern = String((v as any).pattern ?? '').trim()
      if (!name || !pattern) return
      const next: KnowledgeItem = {
        id: editing?.id ?? nowId(),
        category: 'regex',
        name,
        pattern,
        replacement: editing?.category === 'regex' ? editing.replacement : '',
        exampleIn: editing?.category === 'regex' ? editing.exampleIn : '',
        exampleOut: editing?.category === 'regex' ? editing.exampleOut : '',
        updatedAt,
        referenceCount: preservedReferenceCount,
      }
      upsert(next)
      closeEditor()
      return
    }

    if (tab === 'logic-tree') {
      const name = String((v as any).name ?? '').trim()
      const scenario = String((v as any).scenario ?? '').trim()
      const steps = String((v as any).steps ?? '').trim()
      if (!name || !scenario || !steps) return
      const next: KnowledgeItem = {
        id: editing?.id ?? nowId(),
        category: 'logic-tree',
        name,
        scenario,
        steps,
        updatedAt,
        referenceCount: preservedReferenceCount,
      }
      upsert(next)
      closeEditor()
      return
    }

    const question = String((v as any).question ?? '').trim()
    const sql = String((v as any).sql ?? '').trim()
    if (!question || !sql) return
    const next: KnowledgeItem = {
      id: editing?.id ?? nowId(),
      category: 'sql-examples',
      question,
      sql,
      updatedAt,
      referenceCount: preservedReferenceCount,
    }
    upsert(next)
    closeEditor()
  }

  const menu: CardMenuState = useMemo(
    () => ({
      openId: cardMenuOpenId,
      setOpenId: setCardMenuOpenId,
      closeTimerRef: closeCardMenuTimerRef,
    }),
    [cardMenuOpenId],
  )

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageIntro title={intro.title} description={intro.desc} />

      <Card size="small" bordered={false} styles={{ body: { padding: 0 } }} style={{ background: 'transparent' }}>
        <div
          style={{
            height: 56,
            paddingInline: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <Input
            value={keyword}
            placeholder={t('knowledge.filters.keywordPlaceholder')}
            style={{ width: 280 }}
            allowClear
            prefix={<SearchOutlined />}
            onChange={(e) => setKeyword(e.target.value)}
          />

          <Space>
            <Button
              icon={<UploadOutlined />}
              onClick={() => {
                setImportFiles([])
                setImportOpen(true)
              }}
            >
              {importLabel}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openNew}>
              {createLabel}
            </Button>
          </Space>
        </div>

        <div style={{ padding: 16, paddingTop: 8 }}>
          {pagedItems.length === 0 ? (
            <div style={{ padding: '80px 0' }}>
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" />
            </div>
          ) : (
            <Row gutter={[16, 16]} align="top">
              {pagedItems.map((it) => {
                const view = () => {
                  setEditing(it)
                  setEditorMode('view')
                }
                const edit = () => openEdit(it)
                const del = () => setDeleteTarget(it)

                return (
                  <Col key={it.id} xs={24} md={12} xl={8}>
                    {it.category === 'terms' ? (
                      <TermCard item={it} onEdit={edit} onDelete={del} onView={view} menu={menu} isDark={isDark} token={token} />
                    ) : it.category === 'metrics' ? (
                      <MetricCard item={it} onEdit={edit} onDelete={del} onView={view} menu={menu} isDark={isDark} token={token} />
                    ) : it.category === 'regex' ? (
                      <RegexCard item={it} onEdit={edit} onDelete={del} onView={view} menu={menu} isDark={isDark} token={token} />
                    ) : it.category === 'logic-tree' ? (
                      <LogicTreeCard item={it} onEdit={edit} onDelete={del} onView={view} menu={menu} isDark={isDark} token={token} />
                    ) : (
                      <SqlExampleCard item={it} onEdit={edit} onDelete={del} onView={view} menu={menu} isDark={isDark} token={token} />
                    )}
                  </Col>
                )
              })}
            </Row>
          )}

          {visibleItems.length > 0 ? (
            <div style={{ paddingTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
              <Pagination size="small" current={page} pageSize={PAGE_SIZE} total={visibleItems.length} showSizeChanger={false} onChange={(p) => setPage(p)} />
            </div>
          ) : null}
        </div>
      </Card>

      <Modal
        open={importOpen}
        onCancel={() => {
          setImportOpen(false)
          setImportFiles([])
        }}
        title={importLabel}
        okText={t('actions.save')}
        cancelText={t('actions.cancel')}
        onOk={async () => {
          if (importFiles.length === 0) {
            void message.error(t('validation.required'))
            return
          }
          for (const f of importFiles) {
            await onImportFile(f)
          }
          setImportOpen(false)
          setImportFiles([])
        }}
        destroyOnHidden
        width={860}
        centered
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <UploadPanel
            title="点击上传"
            description="支持 .xls / .xlsx / .CSV 格式"
            height={240}
            accept=".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            maxCount={5}
            templateAction={{ label: '下载模板', onClick: downloadImportTemplate }}
            onChange={(info) => {
              const list = (info.fileList ?? []).map((x) => x.originFileObj).filter((x): x is any => x instanceof File) as File[]
              setImportFiles(list)
            }}
          />
        </div>
      </Modal>

      <Modal
        open={editorOpen}
        onCancel={closeEditor}
        title={
          <div style={{ paddingRight: 28, fontWeight: 800, fontSize: 18, lineHeight: 1.35 }}>
            {(() => {
              const obj = tab === 'terms' ? '术语' : tab === 'metrics' ? '指标' : tab === 'regex' ? '规则' : tab === 'logic-tree' ? '分析逻辑树' : 'SQL 示例库'
              const action = isViewMode ? '预览' : editing ? '编辑' : '新建'
              return `${action}${obj}`
            })()}
          </div>
        }
        okText={isViewMode ? t('actions.edit') : t('actions.save')}
        cancelText={t('actions.cancel')}
        onOk={() => {
          if (isViewMode) {
            setEditorMode('edit')
            return
          }
          void onSave()
        }}
        destroyOnHidden
        width={860}
        centered
      >
        <Form form={form} layout="vertical">
          {tab === 'terms' ? (
            <>
              <Form.Item name="term" label="标准术语" rules={[{ required: true, message: t('validation.required') }]}>
                <Input disabled={isViewMode} placeholder="例如：ARPU" />
              </Form.Item>
              <Form.Item name="synonyms" label="同义词" initialValue={[] as string[]} required rules={[{ type: 'array', min: 1, required: true, message: t('validation.required') }]}>
                <Select disabled={isViewMode} mode="tags" tokenSeparators={[',', '，', ' ']} placeholder="例如：用户产值 平均收入 每用户收入" />
              </Form.Item>
            </>
          ) : null}

          {tab === 'metrics' ? (
            <>
              <Form.Item name="name" label="指标名" rules={[{ required: true, message: t('validation.required') }]}>
                <Input disabled={isViewMode} placeholder="例如：离网率" />
              </Form.Item>
              <Form.Item name="formula" label="统一计算公式" rules={[{ required: true, message: t('validation.required') }]}>
                <Input.TextArea disabled={isViewMode} rows={4} placeholder="例如：离网率 = 离网用户数 / 在网用户数" />
              </Form.Item>
            </>
          ) : null}

          {tab === 'regex' ? (
            <>
              <Form.Item name="name" label="字段" rules={[{ required: true, message: t('validation.required') }]}>
                <Input disabled={isViewMode} placeholder="例如：employee_id" />
              </Form.Item>
              <Form.Item name="pattern" label="正则规则" rules={[{ required: true, message: t('validation.required') }]}>
                <Input disabled={isViewMode} placeholder="例如：^([a-zA-Z])(\\d{5})$" />
              </Form.Item>
            </>
          ) : null}

          {tab === 'logic-tree' ? (
            <>
              <Form.Item name="name" label="分析思路" rules={[{ required: true, message: t('validation.required') }]}>
                <Input disabled={isViewMode} placeholder="例如：营销活动复盘" />
              </Form.Item>

              <Form.Item name="steps" label="分析步骤" rules={[{ required: true, message: t('validation.required') }]}>
                <Input.TextArea disabled={isViewMode} rows={6} placeholder="按 1/2/3… 列出分析路径与判断逻辑" />
              </Form.Item>

              <Form.Item name="scenario" label="适用场景" rules={[{ required: true, message: t('validation.required') }]}>
                <Input.TextArea disabled={isViewMode} rows={3} placeholder="说明适用于哪些问题/业务场景" />
              </Form.Item>
            </>
          ) : null}

          {tab === 'sql-examples' ? (
            <>
              <Form.Item name="question" label="问题描述" rules={[{ required: true, message: t('validation.required') }]}>
                <Input.TextArea disabled={isViewMode} rows={3} placeholder="描述业务问题，系统将据此优先匹配示例 SQL" />
              </Form.Item>
              <Form.Item name="sql" label="示例 SQL" rules={[{ required: true, message: t('validation.required') }]}>
                <Input.TextArea disabled={isViewMode} rows={8} placeholder="写下示例 SQL（高频/标准写法）" />
              </Form.Item>
            </>
          ) : null}
        </Form>
        {modalHint ? (
          <Typography.Text type="secondary" style={{ fontSize: 12, lineHeight: 1.7 }}>
            说明：{modalHint}
          </Typography.Text>
        ) : null}
      </Modal>

      <Modal
        open={!!deleteTarget}
        centered
        width={360}
        zIndex={20000}
        getContainer={() => document.body}
        title={
          <div style={{ paddingRight: 28, fontWeight: 800, fontSize: 18, lineHeight: 1.35 }}>
            {deleteTarget
              ? deleteTarget.category === 'terms'
                ? '删除术语'
                : deleteTarget.category === 'metrics'
                  ? '删除指标'
                  : deleteTarget.category === 'regex'
                    ? '删除规则'
                    : deleteTarget.category === 'logic-tree'
                      ? '删除分析逻辑树'
                      : '删除 SQL 示例'
              : '删除'}
          </div>
        }
        okText="删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        onCancel={() => setDeleteTarget(null)}
        onOk={() => {
          if (!deleteTarget) return
          const id = deleteTarget.id
          setDeleteTarget(null)
          setItems((prev) => prev.filter((it) => it.id !== id))
          void message.success(t('knowledge.deleted'))
        }}
      >
        <div style={{ paddingTop: 8, paddingBottom: 18, lineHeight: 1.65, color: 'var(--ant-color-text-secondary)' }}>
          {deleteTarget
            ? deleteTarget.category === 'terms'
              ? `将删除术语“${deleteTarget.term}”。删除后不可恢复。`
              : deleteTarget.category === 'metrics'
                ? `将删除指标“${deleteTarget.name}”。删除后不可恢复。`
                : deleteTarget.category === 'regex'
                  ? `将删除规则“${deleteTarget.name}”。删除后不可恢复。`
                  : deleteTarget.category === 'logic-tree'
                    ? `将删除分析逻辑树“${deleteTarget.name}”。删除后不可恢复。`
                    : `将删除 SQL 示例“${deleteTarget.question}”。删除后不可恢复。`
            : ''}
        </div>
      </Modal>
    </Space>
  )
}
