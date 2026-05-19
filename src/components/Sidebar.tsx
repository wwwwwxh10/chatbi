import { Button, Layout, Menu, theme } from 'antd'
import type { MenuProps } from 'antd'
import {
  BookOpen,
  BookOpenText,
  Braces,
  ChartNoAxesCombined,
  ChevronsLeft,
  ChevronsRight,
  Database,
  GitBranch,
  Sigma,
  TextCursorInput,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../store/appStore'
import { useSystemStore } from '../store/systemStore'
import { useEffect, useMemo, useState } from 'react'
import { AppLogoMark } from './logo/AppLogoMark'
import { AppLogoWordmark } from './logo/AppLogoWordmark'

export type KnowledgeTabKey =
  | 'terms'
  | 'metrics'
  | 'regex'
  | 'logic-tree'
  | 'sql-examples'

function readKnowledgeTab(search: string): KnowledgeTabKey {
  const p = new URLSearchParams(search)
  const raw = p.get('tab')?.trim() ?? ''
  switch (raw) {
    case 'terms':
    case 'metrics':
    case 'regex':
    case 'logic-tree':
    case 'sql-examples':
      return raw
    default:
      return 'terms'
  }
}

function buildKnowledgeUrl(tab: KnowledgeTabKey) {
  const p = new URLSearchParams({ tab })
  return `/knowledge-base?${p.toString()}`
}

export function Sidebar({
  collapsed,
  onCollapsedChange,
}: {
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
}) {
  const { t } = useTranslation()
  const { token } = theme.useToken()
  const location = useLocation()
  const navigate = useNavigate()
  const themeMode = useAppStore((s) => s.themeMode)
  const systemName = useSystemStore((s) => s.systemName)
  const logoDataUrl = useSystemStore((s) => s.logoDataUrl)
  const showBrand = location.pathname.startsWith('/dashboard/studio')

  const knowledgeTab = readKnowledgeTab(location.search)
  const selectedKey = (() => {
    if (location.pathname.startsWith('/knowledge-base')) return `kb:${knowledgeTab}`
    if (location.pathname.startsWith('/data-sources')) return 'data-sources'
    if (location.pathname.startsWith('/dashboard')) return 'dashboard'
    return ''
  })()

  const forcedOpenKey = useMemo(() => {
    if (location.pathname.startsWith('/knowledge-base')) return 'knowledge'
    return ''
  }, [location.pathname])

  const [openKeys, setOpenKeys] = useState<string[]>(forcedOpenKey ? [forcedOpenKey] : ['knowledge'])

  useEffect(() => {
    if (collapsed) {
      setOpenKeys([])
      return
    }
    if (!forcedOpenKey) {
      setOpenKeys((prev) => (prev.length ? prev : ['knowledge']))
      return
    }
    setOpenKeys((prev) => (prev.includes(forcedOpenKey) ? prev : [forcedOpenKey]))
  }, [collapsed, forcedOpenKey])

  const items: MenuProps['items'] = [
    {
      key: 'dashboard',
      icon: <ChartNoAxesCombined size={16} />,
      label: t('nav.dashboard'),
    },
    {
      key: 'knowledge',
      icon: <BookOpenText size={16} />,
      label: t('nav.knowledgeBase'),
      children: [
        { key: 'kb:terms', icon: <BookOpen size={16} />, label: t('kb.terms') },
        { key: 'kb:metrics', icon: <Sigma size={16} />, label: t('kb.metrics') },
        { key: 'kb:regex', icon: <TextCursorInput size={16} />, label: t('kb.regex') },
        { key: 'kb:logic-tree', icon: <GitBranch size={16} />, label: t('kb.logicTree') },
        { key: 'kb:sql-examples', icon: <Braces size={16} />, label: t('kb.sqlExamples') },
      ],
    },
    {
      key: 'data-sources',
      icon: <Database size={16} />,
      label: t('nav.dataSources'),
    },
  ]

  const onClick: MenuProps['onClick'] = (e) => {
    if (e.key === 'dashboard') navigate('/dashboard')
    if (e.key === 'data-sources') navigate('/data-sources')

    if (e.key.startsWith('kb:')) {
      const tab = e.key.replace(/^kb:/, '') as KnowledgeTabKey
      navigate(buildKnowledgeUrl(tab))
    }

    if (e.key === 'knowledge') navigate(buildKnowledgeUrl('terms'))

  }

  return (
    <Layout.Sider
      collapsed={collapsed}
      trigger={null}
      width={260}
      collapsedWidth={72}
      style={{
        background: themeMode === 'dark' ? token.colorBgLayout : '#FFFFFF',
        borderRight: `1px solid ${token.colorSplit}`,
        position: 'relative',
        transition: 'width 180ms ease, background 180ms ease',
      }}
    >
      {showBrand ? (
        <div style={{ padding: collapsed ? '12px 10px' : '0 16px', display: 'flex', alignItems: 'center' }}>
          <Button
            type="text"
            onClick={() => navigate('/dashboard')}
            style={{
              width: '100%',
              height: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 10,
              paddingInline: 0,
              borderRadius: 0,
            }}
          >
            {logoDataUrl ? (
              <img
                src={logoDataUrl}
                alt={systemName}
                style={{ width: 32, height: 32, aspectRatio: '1 / 1', objectFit: 'contain', borderRadius: 12, flex: 'none' }}
              />
            ) : systemName === 'ChatBI' ? (
              collapsed ? (
                <AppLogoMark size={32} />
              ) : (
                <AppLogoWordmark size={36} fontSize={24} />
              )
            ) : (
              <AppLogoMark size={32} />
            )}
            {collapsed || (!logoDataUrl && systemName === 'ChatBI') ? null : (
              <span style={{ fontSize: 18, fontWeight: 700, color: token.colorText, letterSpacing: 0.2 }}>{systemName}</span>
            )}
          </Button>
        </div>
      ) : null}
      <div className="siderCollapseArea">
        <Button
          type="text"
          onClick={() => onCollapsedChange(!collapsed)}
          icon={collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
          className="siderCollapseButton"
        />
      </div>

      <div style={{ padding: 8 }}>
        <Menu
          mode="inline"
          items={items}
          onClick={onClick}
          selectedKeys={selectedKey ? [selectedKey] : []}
          openKeys={collapsed ? undefined : openKeys}
          inlineCollapsed={collapsed}
          triggerSubMenuAction={collapsed ? 'hover' : 'hover'}
          onOpenChange={(keys) => {
            if (collapsed) return
            const next = Array.from(new Set([...(keys as string[]), 'knowledge']))
            setOpenKeys(next)
          }}
          style={{ border: 0, background: 'transparent' }}
          theme={themeMode === 'dark' ? 'dark' : 'light'}
          inlineIndent={14}
        />
      </div>
    </Layout.Sider>
  )
}
