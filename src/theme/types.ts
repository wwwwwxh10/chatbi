export type ThemeId = 'business' | 'vibrant' | 'fresh'

export type Theme = {
  id: ThemeId
  name: string
  palette: string[]
  ui: {
    bg0: string
    bg1: string
    surface0: string
    surface1: string
    border0: string
    text0: string
    text1: string
    text2: string
    ring: string
    shadow0: string
  }
  chart: {
    axisLabel: string
    axisLine: string
    splitLine: string
    tooltipBg: string
    tooltipText: string
  }
}

