import {
  Button,
  Card,
  Col,
  Dropdown,
  Empty,
  Form,
  Input,
  Modal,
  Pagination,
  Popover,
  Row,
  Select,
  Space,
  Tag,
  Typography,
  message,
  theme,
} from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { buildSeed, nowId, readTab, setQuery } from './knowledgeBase/kbModel'
import type { KnowledgeItem, KnowledgeTabKey } from './knowledgeBase/kbModel'
import { useTranslation } from 'react-i18next'
import { PageIntro } from '../components/PageIntro'
import {
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  PlusOutlined,
  SearchOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import { UploadPanel } from '../components/UploadPanel'
import * as XLSX from 'xlsx'
import { Activity, BookOpen, Code2, FileText, MoveRight } from 'lucide-react'

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

type CardMenuState = {
  openId: string | null
  setOpenId: (id: string | null) => void
}

type TermKnowledgeItem = Extract<KnowledgeItem, { category: 'terms' }>
type MetricKnowledgeItem = Extract<KnowledgeItem, { category: 'metrics' }>
type RegexKnowledgeItem = Extract<KnowledgeItem, { category: 'regex' }>
type LogicTreeKnowledgeItem = Extract<KnowledgeItem, { category: 'logic-tree' }>
type SqlKnowledgeItem = Extract<KnowledgeItem, { category: 'sql-examples' }>

const KNOWLEDGE_PAGE_SIZE = 6
const CARD_ACCENTS = {
  terms: { color: '#5FA2FF', soft: 'rgba(95,162,255,0.14)', border: 'rgba(95,162,255,0.26)' },
  metrics: { color: '#CFA0FF', soft: 'rgba(207,160,255,0.14)', border: 'rgba(207,160,255,0.24)' },
  regex: { color: '#44D45F', soft: 'rgba(68,212,95,0.14)', border: 'rgba(68,212,95,0.24)' },
  'logic-tree': { color: '#47D3EB', soft: 'rgba(71,211,235,0.14)', border: 'rgba(71,211,235,0.24)' },
  'sql-examples': { color: '#F0B43C', soft: 'rgba(240,180,60,0.14)', border: 'rgba(240,180,60,0.24)' },
} as const

const KB_CARD_THEME = {
  cardBg: 'rgba(28, 34, 43, 0.98)',
  cardBorder: 'rgba(87, 97, 112, 0.46)',
  cardShadow: '0 14px 28px rgba(0, 0, 0, 0.16), inset 0 1px 0 rgba(255,255,255,0.02)',
  panelBg: 'rgba(12, 17, 24, 0.96)',
  panelAltBg: 'rgba(17, 23, 31, 0.92)',
  panelBorder: 'rgba(255,255,255,0.04)',
  textPrimary: 'rgba(232, 237, 244, 0.98)',
  bodyText: 'rgba(168, 177, 190, 0.96)',
  mutedText: 'rgba(132, 142, 156, 0.92)',
  badgeBg: 'rgba(52, 58, 68, 0.54)',
  badgeBorder: 'rgba(255,255,255,0.05)',
  neutralTagBg: 'rgba(60, 66, 76, 0.42)',
  neutralTagBorder: 'rgba(255,255,255,0.05)',
} as const

function cardContentPreviewHeight(category: KnowledgeTabKey) {
  if (category === 'terms') return 96
  if (category === 'metrics') return 78
  if (category === 'logic-tree') return 82
  return 0
}

function formatReferenceCount(count: number) {
  if (count >= 10000) {
    const compact = count >= 100000 ? Math.round(count / 10000) : Math.round((count / 10000) * 10) / 10
    return `${compact}万`
  }
  return `${count}`
}

function clampStyle(lines: number) {
  return {
    display: '-webkit-box',
    overflow: 'hidden',
    WebkitBoxOrient: 'vertical' as const,
    WebkitLineClamp: lines,
  }
}

function singleLineEllipsis() {
  return {
    overflow: 'hidden',
    whiteSpace: 'nowrap' as const,
    textOverflow: 'ellipsis',
  }
}

function codeSurfaceStyle(borderColor?: string) {
  return {
    background: KB_CARD_THEME.panelBg,
    borderRadius: 15,
    border: `1px solid ${borderColor ?? KB_CARD_THEME.panelBorder}`,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.025)',
  }
}

function formatReferenceBadge(count: number) {
  return `${formatReferenceCount(count)} 次引用`
}

function normalizeSqlCardTitle(question: string) {
  const text = String(question ?? '').trim().replace(/[？?]\s*$/, '')
  if (!text) return ''
  return text.replace(/^如何/, '').replace(/\s+/g, ' ').trim()
}

const SQL_KEYWORDS = new Set([
  'SELECT',
  'FROM',
  'WHERE',
  'GROUP',
  'BY',
  'ORDER',
  'LIMIT',
  'WITH',
  'AS',
  'AND',
  'OR',
  'ON',
  'JOIN',
  'LEFT',
  'RIGHT',
  'INNER',
  'OUTER',
  'DESC',
  'ASC',
  'DISTINCT',
  'CASE',
  'WHEN',
  'THEN',
  'ELSE',
  'END',
  'CURRENT_DATE',
  'INTERVAL',
])

const SQL_FUNCTIONS = new Set(['SUM', 'COUNT', 'AVG', 'MIN', 'MAX', 'DATE_TRUNC'])

function renderSqlLine(line: string) {
  const parts = String(line ?? '').split(/(\s+|[,();])/)
  return parts.map((part, idx) => {
    if (!part) return null
    const trimmed = part.trim()
    if (!trimmed) return <span key={`${idx}-${part}`}>{part}</span>

    const upper = trimmed.toUpperCase()
    let color = 'rgba(226,232,240,0.96)'
    let fontWeight = 500

    if (SQL_KEYWORDS.has(upper)) {
      color = '#FF7A6B'
      fontWeight = 700
    } else if (SQL_FUNCTIONS.has(upper)) {
      color = '#CDA4FF'
      fontWeight = 700
    } else if (/^'.*'$/.test(trimmed)) {
      color = '#8BC4FF'
    } else if (/^\d+$/.test(trimmed)) {
      color = '#E8C46A'
    } else if (/^[A-Z_]+$/.test(trimmed)) {
      color = '#D2D9E4'
      fontWeight = 600
    }

    return (
      <span key={`${idx}-${part}`} style={{ color, fontWeight }}>
        {part}
      </span>
    )
  })
}

function renderMetricFormula(formula: string, accentColor: string) {
  const parts = String(formula ?? '').split(/(\s+|[()*/+\-=,])/)
  return parts.map((part, idx) => {
    if (!part) return null
    const trimmed = part.trim()
    if (!trimmed) return <span key={`${idx}-${part}`}>{part}</span>

    const upper = trimmed.toUpperCase()
    let color = 'rgba(241,245,249,0.94)'
    let fontWeight = 600

    if (SQL_FUNCTIONS.has(upper)) {
      color = accentColor
      fontWeight = 700
    } else if (/^\d+(\.\d+)?$/.test(trimmed)) {
      color = '#9AC8FF'
    } else if (/^[=/*+\-%]+$/.test(trimmed)) {
      color = 'rgba(170,181,195,0.82)'
      fontWeight = 500
    }

    return (
      <span key={`${idx}-${part}`} style={{ color, fontWeight }}>
        {part}
      </span>
    )
  })
}

const SqlCodeWindow = ({ sql }: { sql: string }) => {
  const previewLineCount = 6
  const lines = useMemo(() => String(sql ?? '').replace(/\r\n/g, '\n').split('\n'), [sql])
  const visibleLines = lines.slice(0, previewLineCount)
  const hiddenCount = Math.max(0, lines.length - previewLineCount)
  const fillerCount = Math.max(0, previewLineCount - visibleLines.length)

  return (
    <div
      style={{
        background: KB_CARD_THEME.panelBg,
        borderRadius: 16,
        overflow: 'hidden',
        border: `1px solid ${KB_CARD_THEME.panelBorder}`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
        minHeight: 270,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          flex: 1,
          minHeight: 0,
          padding: '18px 0 18px',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
          fontSize: 14,
          lineHeight: 1.62,
          background: 'linear-gradient(90deg, rgba(22,28,38,0.88) 0, rgba(22,28,38,0.88) 46px, transparent 46px)',
        }}
      >
        <div style={{ flex: 1, display: 'grid', gridAutoRows: '1.62em', overflow: 'hidden' }}>
          {visibleLines.map((line, idx) => (
            <div
              key={`${idx}-${line}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '30px minmax(0, 1fr)',
                gap: 12,
                paddingInline: 18,
                whiteSpace: 'pre',
              }}
            >
              <span style={{ color: 'rgba(95,108,126,0.82)', textAlign: 'right', userSelect: 'none' }}>{idx + 1}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{line ? renderSqlLine(line) : ' '}</span>
            </div>
          ))}
          {hiddenCount > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '30px minmax(0, 1fr)',
                gap: 12,
                paddingInline: 18,
                whiteSpace: 'pre',
                color: 'rgba(148,163,184,0.56)',
              }}
            >
              <span style={{ textAlign: 'right' }}>…</span>
              <span>…</span>
            </div>
          ) : (
            Array.from({ length: fillerCount }).map((_, idx) => (
              <div
                key={`filler-${idx}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '30px minmax(0, 1fr)',
                  gap: 12,
                  paddingInline: 18,
                  whiteSpace: 'pre',
                }}
              >
                <span style={{ color: 'rgba(100,116,139,0.4)', textAlign: 'right' }}>{visibleLines.length + idx + 1}</span>
                <span>{' '}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

const BaseCard = ({
  id,
  children,
  minHeight,
  onEdit,
  onDelete,
  onView,
  menu,
}: {
  id: string
  children: React.ReactNode
  minHeight?: number
  onEdit: () => void
  onDelete: () => void
  onView: () => void
  menu: CardMenuState
}) => {
  return (
    <div className="kbCardShell" style={{ position: 'relative', width: '100%' }}>
      <Dropdown
        open={menu.openId === id}
        placement="bottomRight"
        trigger={['hover', 'click']}
        mouseEnterDelay={0.08}
        getPopupContainer={() => document.body}
        overlayStyle={{ zIndex: 2100 }}
        onOpenChange={(open) => menu.setOpenId(open ? id : null)}
        menu={{
          items: [
            { key: 'edit', icon: <EditOutlined />, label: '编辑' },
            { key: 'delete', icon: <DeleteOutlined />, danger: true, label: '删除' },
          ],
          onClick: ({ key, domEvent }) => {
            domEvent.stopPropagation()
            menu.setOpenId(null)
            if (key === 'edit') onEdit()
            if (key === 'delete') onDelete()
          },
        }}
      >
        <Button
          type="text"
          size="small"
          className={menu.openId === id ? 'iconOnly kbCardMenuButton kbCardMenuButtonOpen' : 'iconOnly kbCardMenuButton'}
          aria-label="更多操作"
          icon={<MoreOutlined />}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 3,
            color: KB_CARD_THEME.mutedText,
          }}
        />
      </Dropdown>

      <Card
        hoverable
        onClick={onView}
        className={menu.openId === id ? 'dsCard dsCardActive' : 'dsCard'}
        styles={{ body: { padding: '22px 22px 20px', display: 'flex', flexDirection: 'column', gap: 16, height: '100%' } }}
        style={{
          width: '100%',
          height: '100%',
          minHeight,
          borderRadius: 18,
          background: KB_CARD_THEME.cardBg,
          border: `1px solid ${KB_CARD_THEME.cardBorder}`,
          boxShadow: KB_CARD_THEME.cardShadow,
        }}
      >
        {children}
      </Card>
    </div>
  )
}

const ReferenceBadge = ({ count }: { count: number }) => (
  <div
    style={{
      flex: 'none',
      minHeight: 32,
      padding: '6px 16px',
      borderRadius: 999,
      background: KB_CARD_THEME.badgeBg,
      border: `1px solid ${KB_CARD_THEME.badgeBorder}`,
      color: KB_CARD_THEME.mutedText,
      fontSize: 12.5,
      lineHeight: '18px',
      fontWeight: 600,
      whiteSpace: 'nowrap',
      display: 'inline-flex',
      alignItems: 'center',
    }}
  >
    {formatReferenceBadge(count)}
  </div>
)

const AccentHeader = ({
  icon,
  title,
  accentColor,
  referenceCount,
}: {
  icon: React.ReactNode
  title: string
  accentColor: string
  referenceCount: number
}) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, paddingRight: 42 }}>
    <div style={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
      <span
        style={{
          color: accentColor,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 'none',
          lineHeight: 0,
        }}
      >
        {icon}
      </span>
      <Typography.Text
        strong
        style={{
          minWidth: 0,
          display: 'block',
          fontSize: 17,
          lineHeight: '24px',
          color: accentColor,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          ...singleLineEllipsis(),
        }}
      >
        {title}
      </Typography.Text>
    </div>
    <ReferenceBadge count={referenceCount} />
  </div>
)

const TermCard = ({
  item,
  onEdit,
  onDelete,
  onView,
  menu,
}: {
  item: TermKnowledgeItem
  onEdit: () => void
  onDelete: () => void
  onView: () => void
  menu: CardMenuState
}) => {
  const tone = CARD_ACCENTS.terms
  const visibleSynonyms = item.synonyms.slice(0, 2)
  const hiddenSynonyms = item.synonyms.slice(2)

  return (
    <BaseCard
      id={item.id}
      minHeight={262}
      onEdit={onEdit}
      onDelete={onDelete}
      onView={onView}
      menu={menu}
    >
      <AccentHeader
        icon={<BookOpen size={19} strokeWidth={2} />}
        title={item.term}
        accentColor={tone.color}
        referenceCount={item.referenceCount}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, overflow: 'hidden', flexWrap: 'nowrap' }}>
        {visibleSynonyms.map((synonym) => (
          <Tag
            key={synonym}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              height: 30,
              maxWidth: 136,
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              margin: 0,
              background: tone.soft,
              border: `1px solid ${tone.border}`,
              color: tone.color,
              padding: '0 14px',
            }}
          >
            <span style={singleLineEllipsis()}>{synonym}</span>
          </Tag>
        ))}
        {hiddenSynonyms.length > 0 ? (
          <Popover
            trigger={['hover', 'click']}
            content={
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxWidth: 260 }}>
                {hiddenSynonyms.map((synonym) => (
                  <Tag key={synonym} style={{ margin: 0, borderRadius: 999 }}>
                    {synonym}
                  </Tag>
                ))}
              </div>
            }
          >
            <Tag
              style={{
                flex: 'none',
                height: 30,
                borderRadius: 8,
                fontSize: 13,
                margin: 0,
                color: KB_CARD_THEME.mutedText,
                background: KB_CARD_THEME.neutralTagBg,
                border: `1px solid ${KB_CARD_THEME.neutralTagBorder}`,
                padding: '0 14px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              +{hiddenSynonyms.length}
            </Tag>
          </Popover>
        ) : null}
      </div>
      <div style={{ minHeight: cardContentPreviewHeight('terms'), display: 'flex', flexDirection: 'column' }}>
        {item.desc ? (
          <Typography.Paragraph
            style={{ fontSize: 13.5, margin: '6px 0 0', lineHeight: 1.72, color: KB_CARD_THEME.bodyText, ...clampStyle(3) }}
          >
            {item.desc}
          </Typography.Paragraph>
        ) : null}
      </div>
    </BaseCard>
  )
}

const MetricCard = ({
  item,
  onEdit,
  onDelete,
  onView,
  menu,
}: {
  item: MetricKnowledgeItem
  onEdit: () => void
  onDelete: () => void
  onView: () => void
  menu: CardMenuState
}) => {
  const tone = CARD_ACCENTS.metrics
  return (
    <BaseCard
      id={item.id}
      minHeight={320}
      onEdit={onEdit}
      onDelete={onDelete}
      onView={onView}
      menu={menu}
    >
      <AccentHeader
        icon={<Activity size={20} strokeWidth={2} />}
        title={item.name}
        accentColor={tone.color}
        referenceCount={item.referenceCount}
      />
      <div
        style={{
          ...codeSurfaceStyle(tone.border),
          minHeight: 112,
          padding: '20px 22px',
        }}
      >
        <div
          style={{
            fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
            fontSize: 15.5,
            lineHeight: 1.58,
            wordBreak: 'break-word',
            color: KB_CARD_THEME.textPrimary,
            ...clampStyle(3),
          }}
        >
          {renderMetricFormula(item.formula, tone.color)}
        </div>
      </div>
      <div style={{ minHeight: cardContentPreviewHeight('metrics'), display: 'flex', flexDirection: 'column' }}>
        {item.definition ? (
          <Typography.Paragraph
            style={{ fontSize: 13.5, margin: '2px 0 0', lineHeight: 1.72, color: KB_CARD_THEME.bodyText, ...clampStyle(3) }}
          >
            {item.definition}
          </Typography.Paragraph>
        ) : null}
      </div>
    </BaseCard>
  )
}

const RegexCard = ({
  item,
  onEdit,
  onDelete,
  onView,
  menu,
}: {
  item: RegexKnowledgeItem
  onEdit: () => void
  onDelete: () => void
  onView: () => void
  menu: CardMenuState
}) => (
  (() => {
    const tone = CARD_ACCENTS.regex
    return (
      <BaseCard
        id={item.id}
        minHeight={320}
        onEdit={onEdit}
        onDelete={onDelete}
        onView={onView}
        menu={menu}
      >
        <AccentHeader
          icon={<FileText size={20} strokeWidth={2} />}
          title={item.name}
          accentColor={tone.color}
          referenceCount={item.referenceCount}
        />
        <div
          style={{
            ...codeSurfaceStyle(tone.border),
            minHeight: 190,
            padding: '18px 18px 16px',
          }}
        >
          <div
            style={{
              fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
              fontSize: 16,
              lineHeight: 1.5,
              color: tone.color,
              marginBottom: item.exampleIn || item.exampleOut || item.replacement ? 18 : 0,
              textAlign: 'center',
              ...singleLineEllipsis(),
            }}
          >
            {`/${item.pattern}/`}
          </div>
          {(item.exampleIn || item.exampleOut || item.replacement) ? (
            <div
              style={{
                borderTop: `1px dashed rgba(255,255,255,0.12)`,
                paddingTop: 20,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 16,
              }}
            >
              <div
                style={{
                  minWidth: 0,
                  borderRadius: 12,
                  background: KB_CARD_THEME.panelAltBg,
                  padding: '16px 14px 14px',
                }}
              >
                <div style={{ fontSize: 12.5, color: KB_CARD_THEME.mutedText, marginBottom: 10 }}>输入样例</div>
                <div style={{ fontSize: 16, lineHeight: 1.45, color: KB_CARD_THEME.bodyText, fontWeight: 600, ...singleLineEllipsis() }}>
                  {item.exampleIn || '原始值'}
                </div>
              </div>
              <div
                style={{
                  minWidth: 0,
                  borderRadius: 12,
                  background: KB_CARD_THEME.panelAltBg,
                  padding: '16px 14px 14px',
                  boxShadow: `inset 3px 0 0 ${tone.color}`,
                }}
              >
                <div style={{ fontSize: 12.5, color: KB_CARD_THEME.mutedText, marginBottom: 10 }}>标准输出</div>
                <div style={{ fontSize: 16, lineHeight: 1.45, color: tone.color, fontWeight: 700, ...singleLineEllipsis() }}>
                  {item.exampleOut || item.replacement || '规范值'}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </BaseCard>
    )
  })()
)

const LogicTreeIllustration = () => (
  <div
    style={{
      ...codeSurfaceStyle('rgba(71,211,235,0.16)'),
      height: 102,
      overflow: 'hidden',
      padding: '18px 22px',
    }}
  >
    <svg viewBox="0 0 240 104" width="100%" height="100%" preserveAspectRatio="none">
      <rect x="106" y="10" width="30" height="12" rx="2.5" fill="rgba(71,211,235,0.32)" stroke="rgba(71,211,235,0.2)" />
      <path d="M121 22V46M121 46H76M121 46H166M76 46V68M121 46V68M166 46V68" stroke="rgba(215,220,228,0.22)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="76" cy="72" r="4.5" fill="rgba(71,211,235,0.88)" />
      <circle cx="121" cy="72" r="4.5" fill="rgba(71,211,235,0.88)" />
      <circle cx="166" cy="72" r="4.5" fill="rgba(71,211,235,0.88)" />
    </svg>
  </div>
)

const LogicTreeCard = ({
  item,
  onEdit,
  onDelete,
  onView,
  menu,
}: {
  item: LogicTreeKnowledgeItem
  onEdit: () => void
  onDelete: () => void
  onView: () => void
  menu: CardMenuState
}) => (
  (() => {
    const tone = CARD_ACCENTS['logic-tree']
    return (
      <BaseCard
        id={item.id}
        minHeight={308}
        onEdit={onEdit}
        onDelete={onDelete}
        onView={onView}
        menu={menu}
      >
        <AccentHeader
          icon={<MoveRight size={20} strokeWidth={2} />}
          title={item.name}
          accentColor={tone.color}
          referenceCount={item.referenceCount}
        />
        <LogicTreeIllustration />
        <div style={{ minHeight: cardContentPreviewHeight('logic-tree'), display: 'flex', flexDirection: 'column' }}>
          {item.scenario ? (
            <Typography.Paragraph style={{ margin: '2px 0 0', fontSize: 13.5, lineHeight: 1.72, color: KB_CARD_THEME.bodyText, ...clampStyle(3) }}>
              {item.scenario}
            </Typography.Paragraph>
          ) : null}
        </div>
      </BaseCard>
    )
  })()
)

const SqlExampleCard = ({
  item,
  onEdit,
  onDelete,
  onView,
  menu,
}: {
  item: SqlKnowledgeItem
  onEdit: () => void
  onDelete: () => void
  onView: () => void
  menu: CardMenuState
}) => (
  (() => {
    const tone = CARD_ACCENTS['sql-examples']
    return (
      <BaseCard
        id={item.id}
        minHeight={398}
        onEdit={onEdit}
        onDelete={onDelete}
        onView={onView}
        menu={menu}
      >
        <AccentHeader
          icon={<Code2 size={20} strokeWidth={2} />}
          title={normalizeSqlCardTitle(item.question)}
          accentColor={tone.color}
          referenceCount={item.referenceCount}
        />
        <SqlCodeWindow sql={item.sql} />
      </BaseCard>
    )
  })()
)

const renderCardGrid = (
  items: KnowledgeItem[],
  tab: KnowledgeTabKey,
  onView: (r: KnowledgeItem) => void,
  onEdit: (r: KnowledgeItem) => void,
  onDelete: (r: KnowledgeItem) => void,
  menu: CardMenuState
) => {
  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" />
      </div>
    )
  }

  return (
    <Row gutter={[20, 20]} align="top">
      {items.map((item) => {
        const view = () => onView(item)
        const edit = () => onEdit(item)
        const del = () => onDelete(item)

        let content = null
        if (tab === 'terms') content = <TermCard item={item as TermKnowledgeItem} onEdit={edit} onDelete={del} onView={view} menu={menu} />
        else if (tab === 'metrics') content = <MetricCard item={item as MetricKnowledgeItem} onEdit={edit} onDelete={del} onView={view} menu={menu} />
        else if (tab === 'regex') content = <RegexCard item={item as RegexKnowledgeItem} onEdit={edit} onDelete={del} onView={view} menu={menu} />
        else if (tab === 'logic-tree') content = <LogicTreeCard item={item as LogicTreeKnowledgeItem} onEdit={edit} onDelete={del} onView={view} menu={menu} />
        else content = <SqlExampleCard item={item as SqlKnowledgeItem} onEdit={edit} onDelete={del} onView={view} menu={menu} />

        return (
          <Col key={item.id} xs={24} md={12} xl={8}>
            {content}
          </Col>
        )
      })}
    </Row>
  )
}

export default function KnowledgeBasePage() {
  const { t } = useTranslation()
  const { token } = theme.useToken()
  const location = useLocation()
  const navigate = useNavigate()
  const [items, setItems] = useState<KnowledgeItem[]>(() => buildSeed())
  const [keyword, setKeyword] = useState('')

  const [importOpen, setImportOpen] = useState(false)
  const [importFiles, setImportFiles] = useState<File[]>([])

  const [editing, setEditing] = useState<KnowledgeItem | null>(null)
  const [editorMode, setEditorMode] = useState<'view' | 'edit'>('edit')
  const [form] = Form.useForm<Record<string, unknown>>()

  const [deleteTarget, setDeleteTarget] = useState<KnowledgeItem | null>(null)

  const [cardMenuOpenId, setCardMenuOpenId] = useState<string | null>(null)
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
    if (tab === 'metrics') return '固化指标定义与计算口径，统一标准计算方式，保证分析口径一致。。'
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

  const pagedItems = useMemo(() => {
    const start = (page - 1) * KNOWLEDGE_PAGE_SIZE
    return visibleItems.slice(start, start + KNOWLEDGE_PAGE_SIZE)
  }, [page, visibleItems])

  useEffect(() => {
    setPage(1)
  }, [tab, keyword])

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(visibleItems.length / KNOWLEDGE_PAGE_SIZE))
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
          const replacement = pick(row, ['replacement', '替换', 'replacement'])
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
      const term = String(v.term ?? '').trim()
      const synonyms = uniqTrim(v.synonyms)
      if (!term) return
      const next: KnowledgeItem = {
        id: editing?.id ?? nowId(),
        category: 'terms',
        term,
        synonyms,
        desc: '',
        updatedAt,
        referenceCount: preservedReferenceCount,
      }
      upsert(next)
      closeEditor()
      return
    }

    if (tab === 'metrics') {
      const name = String(v.name ?? '').trim()
      const formula = String(v.formula ?? '').trim()
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
        definition: '',
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
      const name = String(v.name ?? '').trim()
      const pattern = String(v.pattern ?? '').trim()
      if (!name || !pattern) return
      const next: KnowledgeItem = {
        id: editing?.id ?? nowId(),
        category: 'regex',
        name,
        pattern,
        replacement: '',
        exampleIn: '',
        exampleOut: '',
        updatedAt,
        referenceCount: preservedReferenceCount,
      }
      upsert(next)
      closeEditor()
      return
    }

    if (tab === 'logic-tree') {
      const name = String(v.name ?? '').trim()
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

    const question = String(v.question ?? '').trim()
    const sql = String(v.sql ?? '').trim()
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

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageIntro title={intro.title} description={intro.desc} />

      <div style={{ width: '100%' }}>
        <div
          style={{
            minHeight: 56,
            paddingBottom: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Input
            value={keyword}
            placeholder={t('knowledge.filters.keywordPlaceholder')}
            style={{ flex: 1, minWidth: 0, maxWidth: 420 }}
            allowClear
            prefix={<SearchOutlined />}
            onChange={(e) => setKeyword(e.target.value)}
          />

          <Space size={10} style={{ flex: 'none' }}>
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

        <div style={{ paddingTop: 16 }}>
          {renderCardGrid(
            pagedItems,
            tab,
            (r) => {
              setEditing(r)
              setEditorMode('view')
            },
            (r) => openEdit(r),
            (r) => setDeleteTarget(r),
            { openId: cardMenuOpenId, setOpenId: setCardMenuOpenId },
            token
          )}
        </div>
        {visibleItems.length > 0 ? (
          <div style={{ paddingTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
            <Pagination
              size="small"
              current={page}
              pageSize={KNOWLEDGE_PAGE_SIZE}
              total={visibleItems.length}
              showSizeChanger={false}
              onChange={(next) => setPage(next)}
            />
          </div>
        ) : null}
      </div>

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
              const list = (info.fileList ?? [])
                .map((x) => x.originFileObj)
                .filter((x): x is any => x instanceof File) as File[]
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
              const obj =
                tab === 'terms'
                  ? '术语'
                  : tab === 'metrics'
                    ? '指标'
                    : tab === 'regex'
                      ? '规则'
                      : tab === 'logic-tree'
                        ? '分析逻辑树'
                        : 'SQL 示例库'
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
              <Form.Item
                name="synonyms"
                label="同义词"
                initialValue={[] as string[]}
                required
                rules={[
                  { type: 'array', min: 1, required: true, message: t('validation.required') },
                ]}
              >
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
              ? (() => {
                  if (deleteTarget.category === 'terms') return '删除术语'
                  if (deleteTarget.category === 'metrics') return '删除指标'
                if (deleteTarget.category === 'regex') return '删除规则'
                  if (deleteTarget.category === 'logic-tree') return '删除分析逻辑树'
                  if (deleteTarget.category === 'sql-examples') return '删除 SQL 示例'
                  return '删除'
                })()
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
            ? (() => {
                if (deleteTarget.category === 'terms') return `将删除术语“${deleteTarget.term}”。删除后不可恢复。`
                if (deleteTarget.category === 'metrics') return `将删除指标“${deleteTarget.name}”。删除后不可恢复。`
                if (deleteTarget.category === 'regex') return `将删除规则“${deleteTarget.name}”。删除后不可恢复。`
                if (deleteTarget.category === 'logic-tree') return `将删除分析逻辑树“${deleteTarget.name}”。删除后不可恢复。`
                if (deleteTarget.category === 'sql-examples') return `将删除 SQL 示例“${deleteTarget.question}”。删除后不可恢复。`
                return '删除后不可恢复。'
              })()
            : ''}
        </div>
      </Modal>
    </Space>
  )
}
