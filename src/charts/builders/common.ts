import type { EChartsOption } from 'echarts'

export function commonTitle(text: string, subtext: string): EChartsOption {
  return {
    title: {
      text,
      subtext,
      left: 8,
      top: 8,
    },
  }
}

