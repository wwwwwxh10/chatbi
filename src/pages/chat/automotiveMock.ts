import type { EChartsOption } from 'echarts'
import type { MessageResult, ResultTable } from './chatUtils'
import type { LocaleCode } from '../../store/appStore'
import { canonicalQuestion, localizeAutomotiveResult } from './smartQueryLocale'

const grid = { left: 20, right: 24, top: 40, bottom: 32, containLabel: true }
const bar = (labels: string[], values: number[], name: string, horizontal = false): EChartsOption => ({
  grid, tooltip: { trigger: 'axis' },
  xAxis: horizontal ? { type: 'value' } : { type: 'category', data: labels, axisTick: { show: false }, axisLabel: { hideOverlap: true } },
  yAxis: horizontal ? { type: 'category', data: labels, axisTick: { show: false } } : { type: 'value', splitLine: { lineStyle: { opacity: 0.12 } } },
  series: [{ name, type: 'bar', data: values, barMaxWidth: 38 }],
})
const donut = (items: Array<{ name: string; value: number }>): EChartsOption => ({ tooltip: { trigger: 'item' }, legend: { bottom: 0 }, series: [{ type: 'pie', radius: ['48%', '70%'], center: ['50%', '45%'], label: { formatter: '{b}: {c}' }, data: items }] })
const combo = (labels: string[], units: number[], revenue: number[]): EChartsOption => ({
  grid, tooltip: { trigger: 'axis' }, legend: { data: ['销量', '销售额'] }, xAxis: { type: 'category', data: labels, axisTick: { show: false } },
  yAxis: [{ type: 'value', name: '辆' }, { type: 'value', name: 'KWD', splitLine: { show: false } }],
  series: [{ name: '销量', type: 'bar', data: units, barMaxWidth: 34 }, { name: '销售额', type: 'line', yAxisIndex: 1, smooth: true, data: revenue }],
})
const table = (rows: ResultTable['rows']): ResultTable => ({ columns: Object.keys(rows[0] ?? {}), rows })
const done = (answerText: string, sql: string, rows: ResultTable['rows'], options: { metric?: MessageResult['metric']; chart?: EChartsOption; variants?: Record<string, EChartsOption>; includeTableWithMetric?: boolean } = {}): MessageResult => ({ status: 'done', answerText, sql, table: options.metric && !options.includeTableWithMetric ? undefined : table(rows), metric: options.metric, chart: options.chart, chartVariants: options.variants })

function buildAutomotiveMockResultZh(question: string): MessageResult {
  const q = question.toLowerCase().replaceAll('－', '-').replaceAll('—', '-')

  if (/利润区间|profit range/.test(q)) {
    const rows = [
      ['BMW', 1, 41, 775, 914, 1110, 138], ['Geely', 2870, 1299, 253, 0, 0, 0], ['GWM', 0, 319, 254, 92, 3, 0], ['Haval', 21, 192, 316, 15, 0, 0],
      ['Land Rover', 17, 83, 79, 957, 1380, 355], ['Mini', 0, 0, 19, 97, 5, 0], ['Rolls Royce', 0, 2, 0, 0, 0, 42], ['McLaren', 0, 3, 1, 0, 2, 0],
    ].map(([制造商, 亏损, 零至1000, 一千至3000, 三千至5000, 五千至10000, 超过10000]) => ({ 制造商, 亏损, '0-1,000': 零至1000, '1,001-3,000': 一千至3000, '3,001-5,000': 三千至5000, '5,001-10,000': 五千至10000, '超过10,000': 超过10000 }))
    return done('2024 年已销售车辆中，BMW 的销量主要集中在单车利润 3,001-10,000 KWD 区间，共 2,024 辆；Land Rover 在该区间共有 2,337 辆。Geely 的销售结构明显不同，亏损销售达到 2,870 辆，是各制造商中亏损车辆最多的品牌。', "SELECT manufacturer_desc, CASE WHEN profit < 0 THEN 'Loss' WHEN profit <= 1000 THEN '0-1,000' WHEN profit <= 3000 THEN '1,001-3,000' WHEN profit <= 5000 THEN '3,001-5,000' WHEN profit <= 10000 THEN '5,001-10,000' ELSE 'Over 10,000' END AS profit_range, COUNT(vehicle_id) AS units_sold FROM vehicle_sales WHERE order_invoice_date >= '2024-01-01' AND order_invoice_date < '2025-01-01' GROUP BY manufacturer_desc, profit_range;", rows)
  }
  if (/5\s*系|5 series/.test(q) && /2025|月度/.test(q)) {
    const rows = [{ 月份: '2025-01', 销量: 24, 销售额_KWD: 567677 }, { 月份: '2025-02', 销量: 22, 销售额_KWD: 511637 }, { 月份: '2025-03', 销量: 37, 销售额_KWD: 822831.5 }]
    const option = combo(rows.map(r => r.月份), rows.map(r => r.销量), rows.map(r => r.销售额_KWD))
    return done('2025 年 BMW 5 系已有月份共售出 83 辆，实现销售额 1,902,145.5 KWD。1 月售出 24 辆、销售额 567,677 KWD；2 月售出 22 辆、销售额 511,637 KWD；3 月售出 37 辆、销售额 822,831.5 KWD。3 月销量较 2 月增长约 68.2%，销量和销售额均为当前最高。', "SELECT TO_CHAR(order_invoice_date,'YYYY-MM') AS month, COUNT(vehicle_id) AS units_sold, SUM(selling_price) AS revenue_kwd FROM vehicle_sales WHERE manufacturer_desc='BMW' AND model_analysis_code='5-Series' AND order_invoice_date >= '2025-01-01' AND order_invoice_date < '2026-01-01' GROUP BY month ORDER BY month;", rows, { chart: option, variants: { combo: option } })
  }
  if (/总利润|total profit|all invoiced|所有已开票/.test(q) && !/land rover|路虎/.test(q)) return done('所有已开票车辆产生的总利润为 110,585,349.22 KWD，反映已完成销售开票车辆带来的累计利润贡献。', 'SELECT SUM(profit) AS total_profit_kwd FROM vehicle_sales WHERE invoice_flag = TRUE;', [{ 指标: '已开票车辆总利润', 数值: '110,585,349.22', 币种: 'KWD' }], { metric: { label: '已开票车辆总利润', value: '110,585,349.22 KWD' } })
  if (/亏损|sold at a loss|profit\s*<\s*0/.test(q)) return done('共有 4,578 辆车辆属于亏损销售，即车辆的销售收入未能覆盖对应成本。这部分车辆会直接拉低整体利润，需要重点关注其品牌和车型分布。', 'SELECT COUNT(vehicle_id) AS loss_making_sales FROM vehicle_sales WHERE profit < 0;', [{ 指标: '亏损销售车辆', 数量: 4578 }], { metric: { label: '亏损销售车辆', value: '4,578 辆' } })
  if (/land rover|路虎/.test(q) && /利润|profit/.test(q)) {
    const rows = [{ 车型系列: 'Defender', 总利润_KWD: 36616349.10 }, { 车型系列: 'Range Rover', 总利润_KWD: 27691429.39 }]; const option = bar(rows.map(r => r.车型系列), rows.map(r => r.总利润_KWD), '总利润')
    return done('Land Rover 总利润金额最高的两个车型系列是 Defender 和 Range Rover。Defender 累计利润为 36,616,349.10 KWD，Range Rover 为 27,691,429.39 KWD；Defender 比 Range Rover 高 8,924,919.71 KWD，是利润贡献最高的系列。', "SELECT model_analysis_code, SUM(profit) AS total_profit_kwd FROM vehicle_sales WHERE manufacturer_desc='Land Rover' GROUP BY model_analysis_code ORDER BY total_profit_kwd DESC FETCH FIRST 2 ROWS ONLY;", rows, { chart: option, variants: { bar: option } })
  }
  if (/预留|预订|reservation/.test(q) && /2025|3月|march/.test(q)) return done('2025 年 3 月共发生 868 辆车辆预留，反映当月客户对在售车辆的预订规模。', "SELECT COUNT(vehicle_id) AS reservations FROM vehicle_reservations WHERE reservation_date >= '2025-03-01' AND reservation_date < '2025-04-01';", [{ 月份: '2025-03', 预留数量: 868 }], { metric: { label: '2025 年 3 月车辆预留', value: '868 辆' } })
  if (/شنو|أنواع|有哪些.*bmw|bmw.*车型|bmw models|types of bmw/.test(q)) {
    const rows = [{ 类别: 'X 系列（SUV）', 车型系列: 'X1、X2、X3、X4、X5、X6、X7、XM' }, { 类别: '轿车及轿跑', 车型系列: '2 Series Coupe；3-Series；4 Series Coupe / Gran Coupe / Convertible；5 Series Saloon / Gran Turismo / Touring；6-Series；7 Series Saloon；8 Series Coupe / Gran Coupe' }, { 类别: 'M 系列', 车型系列: 'M Series Saloon、M Series Coupe' }, { 类别: 'Z 系列（Roadster）', 车型系列: 'Z4/3 Roadster、Z-Series' }]
    return done('BMW 车型覆盖四类：X 系列 SUV 包括 X1、X2、X3、X4、X5、X6、X7、XM；轿车及轿跑覆盖 2 至 8 系的 Coupe、Gran Coupe、Convertible、Saloon、Touring 等版本；高性能 M 系列包括 Saloon 和 Coupe；Roadster 包括 Z4/3 与 Z-Series。', "SELECT DISTINCT model_analysis_code FROM vehicle_sales WHERE manufacturer_desc='BMW' ORDER BY model_analysis_code;", rows)
  }
  if (/x7/.test(q) && /银行|融资|bank|financ/.test(q)) return done('通过银行或金融机构融资方式售出的 BMW X7 共 14 辆，融资销售约占现金与融资合计销量的 12.5%。', "SELECT COUNT(vehicle_id) AS units_sold FROM vehicle_sales WHERE manufacturer_desc='BMW' AND model_analysis_code='X7' AND invoice_flag=TRUE AND account_type='Bank Financing';", [{ 销售方式: '银行融资', 销量: 14 }], { metric: { label: 'BMW X7 银行融资销量', value: '14 辆' } })
  if (/x7/.test(q) && /现金|cash/.test(q)) return done('通过现金方式售出的 BMW X7 共 98 辆，现金销售约占现金与融资合计销量的 87.5%，是主要成交方式。', "SELECT COUNT(vehicle_id) AS units_sold FROM vehicle_sales WHERE manufacturer_desc='BMW' AND model_analysis_code='X7' AND invoice_flag=TRUE AND account_type='Cash';", [{ 销售方式: '现金', 销量: 98 }], { metric: { label: 'BMW X7 现金销量', value: '98 辆' } })
  if (/g60/.test(q)) {
    const units = [18, 7, 36, 36, 38, 30, 40, 5, 17, 42, 27, 28], revenue = [384613.5, 150501.5, 769894, 716617, 776076, 622229, 833108, 104110.5, 364677.5, 877956.7, 557838.5, 544174], labels = Array.from({ length: 12 }, (_, i) => `${i + 1} 月`)
    const rows = labels.map((月份, i) => ({ 月份, 销量: units[i], 销售额_KWD: revenue[i] })), option = combo(labels, units, revenue)
    return done('2024 年 BMW G60 共售出 324 辆，实现销售额 6,701,796.2 KWD。10 月销量最高，为 42 辆、销售额 877,956.7 KWD；8 月销量最低，仅 5 辆、销售额 104,110.5 KWD。全年月度销量波动明显，7 月和 10 月形成两个相对高点。', "SELECT TO_CHAR(order_invoice_date,'YYYY-MM') AS month, COUNT(vehicle_id) AS units_sold, SUM(selling_price) AS revenue_kwd FROM vehicle_sales WHERE manufacturer_desc='BMW' AND model_desc='G60 520i Sedan' AND order_invoice_date >= '2024-01-01' AND order_invoice_date < '2025-01-01' GROUP BY month ORDER BY month;", rows, { chart: option, variants: { combo: option } })
  }
  if (/3\s*系|3 series|3-series/.test(q)) {
    const rows = [{ 具体车型: 'G20 3系轿车', 销量: 236, 销售额_KWD: 3347416 }, { 具体车型: 'G80 M3 轿车', 销量: 4, 销售额_KWD: 143384 }], option = bar(rows.map(r => r.具体车型), rows.map(r => r.销量), '销量')
    return done('2024 年 BMW 3 系共售出 240 辆，实现销售额 3,490,800 KWD。其中 G20 3 系轿车售出 236 辆、销售额 3,347,416 KWD；G80 M3 轿车售出 4 辆、销售额 143,384 KWD。G20 占总销量约 98.3%，是该车系销售的绝对主体。', "SELECT model_desc, COUNT(vehicle_id) AS units_sold, SUM(selling_price) AS revenue_kwd FROM vehicle_sales WHERE manufacturer_desc='BMW' AND model_analysis_code='3-Series' AND order_invoice_date >= '2024-01-01' AND order_invoice_date < '2025-01-01' GROUP BY model_desc;", rows, { chart: option, variants: { bar: option } })
  }
  if (/5\s*系|5 series|5-series/.test(q) && /近|最近|last|平均|average|6/.test(q)) {
    const rows = [{ 指标: '总销量', 数值: '183', 单位: '辆' }, { 指标: '月均销量', 数值: '30.5', 单位: '辆' }, { 指标: '平均售价', 数值: '21,887', 单位: 'KWD' }, { 指标: '总销售额', 数值: '4,005,256', 单位: 'KWD' }]
    return done('按 2024 年 10 月至 2025 年 3 月这 6 个完整月份统计，BMW 5 系共售出 183 辆，月均销量为 30.5 辆；平均售价为 21,887 KWD，总销售额为 4,005,256 KWD。该结果同时反映了所选周期内的销售规模、平均月度节奏和成交价格水平。', "SELECT COUNT(vehicle_id) AS units_sold, COUNT(vehicle_id)/6 AS avg_monthly_sales, AVG(selling_price) AS avg_price_kwd, SUM(selling_price) AS revenue_kwd FROM vehicle_sales WHERE manufacturer_desc='BMW' AND model_analysis_code='5-Series' AND order_invoice_date >= '2024-10-01' AND order_invoice_date < '2025-04-01';", rows)
  }
  if (/运输|在途|到货|in transit|estimated.*receipt/.test(q)) {
    const rows = Array.from({ length: 12 }, (_, i) => ({ 预计到货日期: i < 8 ? '2025-04-01' : '2025-04-08', 车辆ID: 163335 + i, 制造商: 'GEELY', 车型: 'CITYRAY', 配置: 'GEELY CITYRAY GF' }))
    return done('当前共有 462 辆车辆处于运输流程中。首批车辆预计于 2025 年 4 月 1 日到货，主要为 GEELY CITYRAY；到货明细已按预计日期从早到晚排列。', "SELECT estimated_date_received, vehicle_id, manufacturer_desc, model_desc, variant_desc FROM vehicle_delivery WHERE vehicle_status='C' ORDER BY estimated_date_received ASC;", rows)
  }
  if (/状态|status/.test(q) && /总数|分布|count|all vehicles/.test(q)) {
    const rows = [{ 车辆状态: 'Closed', 数量: 15232 }, { 车辆状态: 'Invoiced', 数量: 14924 }, { 车辆状态: 'Adopted', 数量: 3084 }, { 车辆状态: 'On Order', 数量: 1620 }, { 车辆状态: 'Finished', 数量: 800 }, { 车辆状态: 'Consigned', 数量: 462 }], option = bar(rows.map(r => r.车辆状态), rows.map(r => r.数量), '车辆数', true)
    return done('全部 36,122 辆车辆中，Closed 为 15,232 辆，Invoiced 为 14,924 辆，两类合计约占 83.5%；Adopted 为 3,084 辆，属于当前可用库存；其余包括 On Order 1,620 辆、Finished 800 辆和 Consigned 462 辆。', 'SELECT vehicle_status_desc, COUNT(vehicle_id) AS vehicle_count FROM vehicles GROUP BY vehicle_status_desc ORDER BY vehicle_count DESC;', rows, { chart: option, variants: { bar: option } })
  }
  if (/到期|过期|expiration|expired|extended period/.test(q)) {
    const rows = [{ 制造商: 'Land Rover', 数量: 174 }, { 制造商: 'Geely', 数量: 151 }, { 制造商: 'BMW', 数量: 49 }, { 制造商: 'Haval', 数量: 35 }, { 制造商: 'GWM', 数量: 17 }, { 制造商: 'Mini', 数量: 1 }], option = bar(rows.map(r => r.制造商), rows.map(r => r.数量), '超期库存', true)
    return done('当前有 427 辆库存车辆已超过预留到期日。其中 Land Rover 174 辆、Geely 151 辆，两者合计 325 辆，占全部超期库存约 76.1%；BMW 49 辆、Haval 35 辆、GWM 17 辆、Mini 1 辆。超期库存主要集中在 Land Rover 和 Geely。', "SELECT manufacturer_desc, COUNT(vehicle_id) AS expired_stock FROM vehicle_inventory WHERE vehicle_status='A' AND reservation_exp_date < DATE '2026-10-12' GROUP BY manufacturer_desc ORDER BY expired_stock DESC;", rows, { metric: { label: '超过预留到期日', value: '427 辆' }, chart: option, variants: { bar: option } })
  }
  if (/制造商.*车型|品牌.*车型|breakdown.*model|按.*车型.*库存/.test(q)) {
    const rows = [{ 制造商: 'BMW', 车型系列: '2 Series Coupe', 车型描述: 'G42 - 2 Series Coupe', 库存数量: 10 }, { 制造商: 'BMW', 车型系列: '2 Series Coupe', 车型描述: 'G87 M2 Coupé', 库存数量: 6 }, { 制造商: 'BMW', 车型系列: '2-Series', 车型描述: 'F74 2 Series GranCoupe', 库存数量: 17 }, { 制造商: 'BMW', 车型系列: '3-Series', 车型描述: 'G20 3-Series 4 Door', 库存数量: 67 }, { 制造商: 'BMW', 车型系列: '3-Series', 车型描述: 'G80 M3 4-Door', 库存数量: 6 }, { 制造商: 'BMW', 车型系列: '5-Series', 车型描述: 'G60 520i Sedan', 库存数量: 35 }, { 制造商: 'BMW', 车型系列: '7-Series', 车型描述: 'G70 7-Series', 库存数量: 69 }, { 制造商: 'BMW', 车型系列: 'X1', 车型描述: 'U11 X1 xDrive 20i SAV', 库存数量: 50 }]
    return done('当前库存合计 3,084 辆。BMW 代表性车型中，G70 7-Series 库存 69 辆，G20 3-Series 4 Door 库存 67 辆，U11 X1 xDrive 20i SAV 库存 50 辆，是当前展示车型中库存较高的几款。', "SELECT manufacturer_desc, model_analysis_code, model_desc, COUNT(vehicle_id) AS stock_count FROM vehicle_inventory WHERE vehicle_status='A' GROUP BY manufacturer_desc, model_analysis_code, model_desc ORDER BY manufacturer_desc, model_analysis_code;", rows)
  }
  if (/新车|二手|new.*used|used.*new/.test(q)) {
    const rows = [{ 车辆类型: '新车（N）', 数量: 36122 }, { 车辆类型: '二手车', 数量: 0 }], option = donut([{ name: '新车', value: 36122 }, { name: '二手车', value: 0 }])
    return done('共有 36,122 辆新车，二手车数量为 0。当前车辆全部归类为新车，新车占比为 100%。', 'SELECT new_used, COUNT(vehicle_id) AS vehicle_count FROM vehicles GROUP BY new_used;', rows, { chart: option, variants: { pie: option } })
  }
  return done('当前库存车辆总数为 3,084 辆，代表目前可供销售和调配的在库车辆规模。', "SELECT COUNT(vehicle_id) AS current_stock FROM vehicle_inventory WHERE vehicle_status='A';", [{ 车辆状态: '当前库存', 库存数量: 3084 }], { metric: { label: '当前库存车辆', value: '3,084 辆' } })
}

export function buildAutomotiveMockResult(question: string, locale: LocaleCode = 'zh-CN'): MessageResult {
  const canonical = canonicalQuestion(question)
  return localizeAutomotiveResult(canonical, buildAutomotiveMockResultZh(canonical), locale)
}
