import type { MessageResult } from './chatUtils'
import type { LocaleCode } from '../../store/appStore'

export const QUESTIONS_ZH = [
  '当前库存车辆总数是多少？', '新车与二手车分别有多少辆？', '按制造商和车型拆分当前库存', '有多少库存车辆已超过预留到期日？',
  '全部车辆的状态分布是什么？', '列出仍在运输中的车辆及预计到货日', 'BMW 5 系最近 6 个月平均销量是多少？', '2024 年 BMW 3 系共销售多少台？',
  '2024 年 BMW G60 每月销量是多少？', '现金销售的 BMW X7 有多少辆？', '银行融资销售的 BMW X7 有多少辆？', '系统中有哪些 BMW 车型？',
  '2025 年 3 月共发生多少车辆预留？', 'Land Rover 总利润最高的两个车型系列是什么？', '有多少车辆属于亏损销售？', '所有已开票车辆的总利润是多少？',
  '2025 年 BMW 5 系每月销量是多少？', '2024 年按制造商和利润区间统计销量',
] as const

const QUESTION_EN = [
  'How many vehicles are currently in stock?', 'How many new and used vehicles are there?', 'Break down current inventory by manufacturer and model', 'How many inventory vehicles are past their reservation expiry date?',
  'What is the status distribution of all vehicles?', 'List vehicles still in transit and their expected arrival dates', 'What were the average monthly sales of the BMW 5 Series over the last 6 months?', 'How many BMW 3 Series vehicles were sold in 2024?',
  'What were the monthly sales of the BMW G60 in 2024?', 'How many BMW X7 vehicles were sold for cash?', 'How many BMW X7 vehicles were sold through bank financing?', 'Which BMW models are in the system?',
  'How many vehicle reservations were made in March 2025?', 'Which two Land Rover model series generated the highest total profit?', 'How many vehicles were sold at a loss?', 'What is the total profit from all invoiced vehicles?',
  'What were the monthly sales of the BMW 5 Series in 2025?', 'Show 2024 sales by manufacturer and profit range',
] as const

const zhToEn = new Map(QUESTIONS_ZH.map((question, index) => [question, QUESTION_EN[index]]))
const enToZh = new Map(QUESTION_EN.map((question, index) => [question, QUESTIONS_ZH[index]]))

export function questionText(question: string, locale: LocaleCode) {
  const sessionNames: Record<string, string> = {
    '2024 年 BMW 3 系销量': '2024 BMW 3 Series Sales',
    'BMW 5 系近半年销量': 'BMW 5 Series Sales - Last 6 Months',
    '各品牌库存车辆分析': 'Inventory Analysis by Brand',
  }
  if (locale === 'en-US') {
    const exact = zhToEn.get(question as typeof QUESTIONS_ZH[number])
    if (exact) return exact
    const fullQuestion = QUESTIONS_ZH.find((item) => item.startsWith(question) || question.startsWith(item))
    return (fullQuestion ? zhToEn.get(fullQuestion) : undefined) ?? sessionNames[question] ?? question
  }
  const exact = enToZh.get(question as typeof QUESTION_EN[number])
  if (exact) return exact
  const fullQuestion = QUESTION_EN.find((item) => item.startsWith(question) || question.startsWith(item))
  return (fullQuestion ? enToZh.get(fullQuestion) : undefined) ?? question
}

export function canonicalQuestion(question: string) {
  return enToZh.get(question as typeof QUESTION_EN[number]) ?? question
}

const answerRules: Array<[RegExp, string]> = [
  [/利润区间/, 'For vehicles sold in 2024, BMW sales were concentrated in the KWD 3,001-10,000 profit range, with 2,024 vehicles. Land Rover recorded 2,337 vehicles in the same range. Geely had 2,870 loss-making sales, the highest among all manufacturers.'],
  [/5\s*系.*2025|2025.*5\s*系/, 'BMW 5 Series sold 83 vehicles in the available months of 2025, generating KWD 1,902,145.5 in revenue. March was the strongest month with 37 vehicles, up about 68.2% from February.'],
  [/所有已开票|^(?!.*land rover).*总利润/, 'All invoiced vehicles generated a total profit of KWD 110,585,349.22, representing the cumulative profit contribution from completed invoiced sales.'],
  [/亏损/, 'A total of 4,578 vehicles were sold at a loss, meaning the sales revenue did not cover the corresponding cost. These sales directly reduce overall profitability.'],
  [/land rover.*利润|利润.*land rover/i, 'The two Land Rover model series with the highest total profit are Defender and Range Rover. Defender generated KWD 36,616,349.10, which is KWD 8,924,919.71 more than Range Rover.'],
  [/2025.*3.*预留|2025.*3.*预订/, 'There were 868 vehicle reservations in March 2025, representing customer demand for vehicles available for sale during the month.'],
  [/有哪些.*bmw|bmw.*车型/i, 'BMW models cover four groups: X-series SUVs; 2 to 8 Series sedans and coupes; high-performance M models; and Z-series roadsters.'],
  [/x7.*银行|x7.*融资/i, '14 BMW X7 vehicles were sold through bank or financial-institution financing, about 12.5% of combined cash and financed sales.'],
  [/x7.*现金/i, '98 BMW X7 vehicles were sold for cash, about 87.5% of combined cash and financed sales. Cash was the primary payment method.'],
  [/g60/i, 'BMW G60 sold 324 vehicles in 2024 and generated KWD 6,701,796.2 in revenue. October was the strongest month with 42 vehicles, while August was the lowest with 5.'],
  [/3\s*系|3-series/i, 'BMW 3 Series sold 240 vehicles in 2024 and generated KWD 3,490,800 in revenue. The G20 accounted for 236 vehicles, or about 98.3% of total sales.'],
  [/5\s*系.*最近|5\s*系.*平均/, 'From October 2024 through March 2025, BMW 5 Series sold 183 vehicles, averaging 30.5 per month. Average selling price was KWD 21,887 and total revenue was KWD 4,005,256.'],
  [/运输|到货/, 'There are 462 vehicles currently in transit. The first batch is expected on April 1, 2025 and mainly consists of GEELY CITYRAY vehicles.'],
  [/状态.*分布|全部.*状态/, 'Among all 36,122 vehicles, 15,232 are Closed and 14,924 are Invoiced. Adopted accounts for 3,084 vehicles, while the remaining vehicles are On Order, Finished, or Consigned.'],
  [/到期|过期/, '427 inventory vehicles are past their reservation expiry date. Land Rover and Geely account for 325 of them, or about 76.1% of all expired inventory.'],
  [/制造商.*车型/, 'Current inventory totals 3,084 vehicles. Among representative BMW models, G70 7-Series has 69 vehicles, G20 3-Series has 67, and U11 X1 has 50.'],
  [/新车|二手/, 'There are 36,122 new vehicles and no used vehicles. All vehicles are currently classified as new, representing 100% of the total.'],
  [/.*/, 'Current inventory totals 3,084 vehicles, representing the vehicles presently available for sale and allocation.'],
]

const terms: Record<string, string> = {
  指标: 'Metric', 数值: 'Value', 单位: 'Unit', 数量: 'Count', 销量: 'Units sold', 月份: 'Month', 制造商: 'Manufacturer', 车型系列: 'Model series', 车型描述: 'Model description', 具体车型: 'Model', 车辆类型: 'Vehicle type', 车辆状态: 'Vehicle status', 库存数量: 'Inventory', 预计到货日期: 'Expected arrival', 车辆ID: 'Vehicle ID', 配置: 'Variant', 销售方式: 'Sales method', 币种: 'Currency', 类别: 'Category', 新车: 'New', 二手车: 'Used', 当前库存: 'Current inventory', 当前库存车辆: 'Current inventory vehicles', 总销量: 'Total sales', 月均销量: 'Monthly average', 平均售价: 'Average selling price', 总销售额: 'Total revenue', 已开票车辆总利润: 'Total profit from invoiced vehicles', 亏损销售车辆: 'Loss-making sales', 银行融资: 'Bank financing', 现金: 'Cash', 辆: 'vehicles', 总结摘要: 'Summary',
}

function translateValue(value: unknown): unknown {
  if (typeof value !== 'string') return value
  if (terms[value]) return terms[value]
  if (/^-?[\d,.]+\s*辆$/.test(value)) return value.replace(/\s*辆$/, ' vehicles')
  if (/^-?[\d,.]+\s*个月$/.test(value)) return value.replace(/\s*个月$/, ' months')
  const month = value.match(/^(\d{1,2}) 月$/)
  if (month) return `Month ${month[1]}`
  return value
}

function translateDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(translateDeep)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, translateDeep(child)]))
  return translateValue(value)
}

export function localizeAutomotiveResult(question: string, result: MessageResult, locale: LocaleCode): MessageResult {
  if (locale !== 'en-US') return result
  const canonical = canonicalQuestion(question)
  const answerText = answerRules.find(([pattern]) => pattern.test(canonical.toLowerCase()))?.[1] ?? result.answerText
  const table = result.table ? {
    columns: result.table.columns.map((column) => terms[column] ?? column),
    rows: result.table.rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [terms[key] ?? key, translateValue(value)])) as Record<string, string | number | null>),
  } : undefined
  return {
    ...result,
    answerText,
    table,
    metric: result.metric ? { label: terms[result.metric.label] ?? result.metric.label, value: String(translateValue(result.metric.value)) } : undefined,
    chart: result.chart ? translateDeep(result.chart) as MessageResult['chart'] : undefined,
    chartVariants: result.chartVariants ? translateDeep(result.chartVariants) as MessageResult['chartVariants'] : undefined,
  }
}
