import {
  Button,
  Card,
  Dropdown,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { buildSeed, nowId, readTab, setQuery } from './knowledgeBase/kbModel'
import type { KnowledgeItem, KnowledgeTabKey } from './knowledgeBase/kbModel'
import { useTranslation } from 'react-i18next'
import { PageIntro } from '../components/PageIntro'
import { DeleteOutlined, EditOutlined, EyeOutlined, MoreOutlined, PlusOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons'
import { UploadPanel } from '../components/UploadPanel'
import * as XLSX from 'xlsx'

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

export default function KnowledgeBasePage() {
  const { t } = useTranslation()
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

  const renderActions = (_: unknown, r: KnowledgeItem) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', columnGap: 2, width: '100%', justifyItems: 'center' }}>
      <Button
        type="text"
        className="iconOnly"
        size="small"
        icon={<EyeOutlined />}
        onClick={() => {
          setEditing(r)
          setEditorMode('view')
        }}
      />
      <Button
        type="text"
        className="iconOnly"
        size="small"
        icon={<EditOutlined />}
        onClick={() => {
          openEdit(r)
        }}
      />
      <Dropdown
        trigger={['click']}
        placement="bottomRight"
        menu={{
          items: [{ key: 'delete', label: t('actions.delete'), icon: <DeleteOutlined />, danger: true }],
          onClick: () => setDeleteTarget(r),
        }}
      >
        <Button type="text" className="iconOnly" size="small" icon={<MoreOutlined />} />
      </Dropdown>
    </div>
  )

  const ACTION_COL_WIDTH_DEFAULT = 180
  const ACTION_COL_WIDTH_NARROW = 140

  const columns = useMemo(() => {
    const actionColWidth = tab === 'terms' ? ACTION_COL_WIDTH_NARROW : ACTION_COL_WIDTH_DEFAULT
    const actionColClassName = tab === 'terms' ? 'actionCol actionColNarrow' : 'actionCol'
    if (tab === 'terms') {
      return [
        {
          title: '标准术语',
          dataIndex: 'term',
          key: 'term',
          width: 240,
          ellipsis: true,
          render: (v: unknown) => <Typography.Text ellipsis>{String(v ?? '')}</Typography.Text>,
        },
        {
          title: '同义词',
          dataIndex: 'synonyms',
          key: 'synonyms',
          width: 260,
          render: (v: unknown) => {
            const arr = uniqTrim(v)
            const shown = arr.slice(0, 3)
            const rest = arr.length - shown.length
            return (
              <Space size={6} wrap>
                {shown.map((x) => (
                  <Tag key={x}>{x}</Tag>
                ))}
                {rest > 0 ? <Tag>+{rest}</Tag> : null}
              </Space>
            )
          },
        },
        { title: t('knowledge.table.updatedAt'), dataIndex: 'updatedAt', key: 'updatedAt', width: 180 },
        {
          title: t('knowledge.table.actions'),
          key: 'actions',
          width: actionColWidth,
          className: actionColClassName,
          onHeaderCell: () => ({ className: actionColClassName }),
          onCell: () => ({ className: actionColClassName, style: { width: actionColWidth, minWidth: actionColWidth, maxWidth: actionColWidth } }),
          align: 'center' as const,
          render: renderActions,
        },
      ]
    }

    if (tab === 'metrics') {
      return [
        {
          title: '指标名',
          dataIndex: 'name',
          key: 'name',
          width: 180,
          ellipsis: true,
          render: (v: unknown) => <Typography.Text ellipsis>{String(v ?? '')}</Typography.Text>,
        },
        { title: '计算公式', dataIndex: 'formula', key: 'formula', ellipsis: true },
        { title: t('knowledge.table.updatedAt'), dataIndex: 'updatedAt', key: 'updatedAt', width: 180 },
        {
          title: t('knowledge.table.actions'),
          key: 'actions',
          width: actionColWidth,
          className: actionColClassName,
          onHeaderCell: () => ({ className: actionColClassName }),
          onCell: () => ({ className: actionColClassName, style: { width: actionColWidth, minWidth: actionColWidth, maxWidth: actionColWidth } }),
          align: 'center' as const,
          render: renderActions,
        },
      ]
    }

    if (tab === 'regex') {
      return [
        { title: '字段', dataIndex: 'name', key: 'name', width: 180, ellipsis: true },
        { title: '正则规则', dataIndex: 'pattern', key: 'pattern', ellipsis: true },
        { title: t('knowledge.table.updatedAt'), dataIndex: 'updatedAt', key: 'updatedAt', width: 180 },
        {
          title: t('knowledge.table.actions'),
          key: 'actions',
          width: actionColWidth,
          className: actionColClassName,
          onHeaderCell: () => ({ className: actionColClassName }),
          onCell: () => ({ className: actionColClassName, style: { width: actionColWidth, minWidth: actionColWidth, maxWidth: actionColWidth } }),
          align: 'center' as const,
          render: renderActions,
        },
      ]
    }

    if (tab === 'logic-tree') {
      return [
        { title: '分析主题', dataIndex: 'name', key: 'name', width: 220, ellipsis: true },
        { title: '分析思路', dataIndex: 'steps', key: 'steps', ellipsis: true },
        { title: '适应场景', dataIndex: 'scenario', key: 'scenario', width: 220, ellipsis: true },
        { title: t('knowledge.table.updatedAt'), dataIndex: 'updatedAt', key: 'updatedAt', width: 180 },
        {
          title: t('knowledge.table.actions'),
          key: 'actions',
          width: actionColWidth,
          className: actionColClassName,
          onHeaderCell: () => ({ className: actionColClassName }),
          onCell: () => ({ className: actionColClassName, style: { width: actionColWidth, minWidth: actionColWidth, maxWidth: actionColWidth } }),
          align: 'center' as const,
          render: renderActions,
        },
      ]
    }

    return [
      { title: '问题描述', dataIndex: 'question', key: 'question', width: 260, ellipsis: true },
      {
        title: '示例 SQL',
        dataIndex: 'sql',
        key: 'sql',
        ellipsis: true,
        render: (v: unknown) => (
          <Typography.Text ellipsis={{ tooltip: String(v ?? '') }} style={{ display: 'inline-block', maxWidth: '100%', verticalAlign: 'middle' }}>
            {String(v ?? '')}
          </Typography.Text>
        ),
      },
      { title: t('knowledge.table.updatedAt'), dataIndex: 'updatedAt', key: 'updatedAt', width: 160 },
      {
        title: t('knowledge.table.actions'),
        key: 'actions',
        width: actionColWidth,
        className: actionColClassName,
        onHeaderCell: () => ({ className: actionColClassName }),
        onCell: () => ({ className: actionColClassName, style: { width: actionColWidth, minWidth: actionColWidth, maxWidth: actionColWidth } }),
        align: 'center' as const,
        render: renderActions,
      },
    ]
  }, [items, keyword, tab, t])

  const onImportFile = async (f: File) => {
    try {
      const updatedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')

      const toItem = (x: any): KnowledgeItem | null => {
        if (tab === 'terms') {
          const term = String(x?.term ?? '').trim()
          const synonyms = uniqTrim(x?.synonyms ?? [])
          const desc = String(x?.desc ?? '').trim()
          if (!term) return null
          return { id: nowId(), category: 'terms', term, synonyms, desc, updatedAt }
        }
        if (tab === 'metrics') {
          const name = String(x?.name ?? '').trim()
          const definition = String(x?.definition ?? '').trim()
          const formula = String(x?.formula ?? '').trim()
          if (!name || !formula) return null
          return { id: nowId(), category: 'metrics', name, definition, layer: 'standard', formula, updatedAt }
        }
        if (tab === 'regex') {
          const name = String(x?.name ?? '').trim()
          const pattern = String(x?.pattern ?? '').trim()
          const replacement = String(x?.replacement ?? '').trim()
          const exampleIn = String(x?.exampleIn ?? '').trim()
          const exampleOut = String(x?.exampleOut ?? '').trim()
          if (!name || !pattern) return null
          return { id: nowId(), category: 'regex', name, pattern, replacement, exampleIn, exampleOut, updatedAt }
        }
        if (tab === 'logic-tree') {
          const name = String(x?.name ?? '').trim()
          const scenario = String(x?.scenario ?? '').trim()
          const steps = String(x?.steps ?? '').trim()
          if (!name || !scenario || !steps) return null
          return { id: nowId(), category: 'logic-tree', name, scenario, steps, updatedAt }
        }
        const question = String(x?.question ?? '').trim()
        const sql = String(x?.sql ?? '').trim()
        if (!question || !sql) return null
        return { id: nowId(), category: 'sql-examples', question, sql, updatedAt }
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
    }
    upsert(next)
    closeEditor()
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageIntro title={intro.title} description={intro.desc} />

      <Card size="small" styles={{ body: { padding: 0 } }}>
        <div
          style={{
            height: 56,
            paddingInline: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            borderBottom: '1px solid var(--ant-color-split)',
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

        <div style={{ padding: 16, paddingTop: 16 }}>
          <Table
            size="middle"
            columns={columns as any}
            dataSource={visibleItems.map((it) => ({ ...it, key: it.id }))}
            pagination={{ pageSize: 5 }}
            tableLayout="fixed"
          />
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
