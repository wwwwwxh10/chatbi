import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider, Empty, theme as antdTheme } from 'antd'
import enUS from 'antd/locale/en_US'
import zhCN from 'antd/locale/zh_CN'
import { useEffect, useMemo } from 'react'
import App from './App'
import { useAppStore } from './store/appStore'
import i18n from './i18n'

export default function RootApp() {
  const themeMode = useAppStore((s) => s.themeMode)
  const locale = useAppStore((s) => s.locale)

  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dataset.mode = themeMode
    void i18n.changeLanguage(locale)
  }, [locale, themeMode])

  const algorithm = themeMode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm
  const antdLocale = locale === 'en-US' ? enUS : zhCN

  const theme = useMemo(
    () => ({
      cssVar: true,
      token: {
        colorPrimary: '#2B5CF6',
        colorInfo: '#2B5CF6',
        borderRadius: 10,
        controlHeight: 34,
        fontSize: 15,
        ...(themeMode === 'dark'
          ? {
              colorBgLayout: '#0B0E14',
              colorBgContainer: '#141821',
              colorBgElevated: '#1B2230',
              colorBorder: 'rgba(255, 255, 255, 0.10)',
              colorSplit: 'rgba(255, 255, 255, 0.10)',
              colorText: '#E6EDF7',
              colorTextSecondary: '#A7B0BD',
              colorTextTertiary: '#9AA3AF',
              colorFillSecondary: 'rgba(255, 255, 255, 0.08)',
              colorFillTertiary: 'rgba(255, 255, 255, 0.05)',
            }
          : {
              colorBgLayout: '#FFFFFF',
              colorBgContainer: '#FFFFFF',
              colorBgElevated: '#F7F8FA',
              colorBorder: '#E5E7EB',
              colorSplit: '#E5E7EB',
              colorText: '#1F2430',
              colorTextSecondary: '#6B7280',
              colorTextTertiary: '#9CA3AF',
              colorFillSecondary: '#F3F4F6',
              colorFillTertiary: '#F7F8FA',
            }),
      },
      algorithm,
    }),
    [algorithm, themeMode],
  )

  const emptyNode = useMemo(() => {
    const desc = locale === 'en-US' ? 'No data' : '暂无数据'
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={desc} style={{ margin: 0 }} />
  }, [locale])

  return (
    <ConfigProvider
      theme={theme}
      locale={antdLocale}
      renderEmpty={(componentName) => {
        if (componentName === 'Table' || componentName === 'List') {
          return <div style={{ paddingBlock: 28 }}>{emptyNode}</div>
        }
        return emptyNode
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  )
}
