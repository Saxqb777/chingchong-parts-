import crypto from 'crypto'

const BASE = process.env.VINAPI_BASE || 'http://api.17vin.com:8080'
const USER = process.env.VINAPI_USER || ''
const PASS = process.env.VINAPI_PASS || ''

const md5    = (s: string) => crypto.createHash('md5').update(s).digest('hex')
const token  = (path: string) => md5(md5(USER) + md5(PASS) + path)

// Supported EPCs on port 8080 (discovered via probe)
export const SUPPORTED_EPCS = ['byd', 'geely', 'greatwall', 'changan', 'chery', 'wuling']

// WMI prefix → primary EPC to try first
const WMI_EPC: Record<string, string> = {
  // BYD
  'LFV': 'byd', 'L9B': 'byd', 'LGX': 'byd', 'LDC': 'byd', 'BYD': 'byd',
  // Geely / Lynk & Co / Zeekr
  'L8X': 'geely', 'LB3': 'geely', 'L6T': 'geely', 'LKL': 'geely',
  // Great Wall / Haval / Tank
  'LHG': 'greatwall', 'LS5': 'greatwall', 'LGL': 'greatwall',
  // Changan / Deepal
  'LZM': 'changan', 'LFP': 'changan', 'L6TC': 'changan',
  // Chery / Omoda / Jaecoo
  'LSV': 'chery', 'LVV': 'chery',
  // MG / SAIC / Roewe
  'LSJ': 'geely', 'LSA': 'geely',
  // Wuling / Baojun
  'L6A': 'wuling', 'LZW': 'wuling',
}

function epcFromVin(vin: string): string {
  const wmi = vin.substring(0, 3)
  const wmi4 = vin.substring(0, 4)
  return WMI_EPC[wmi4] || WMI_EPC[wmi] || 'byd'
}

// Chinese keyword → category inference
const CAT_RULES: Array<{ zh: string[]; cat: string; catZh: string }> = [
  { zh: ['发动机','缸体','活塞','气门','凸轮','曲轴','正时','火花塞','喷油','机油'], cat: 'Engine',        catZh: '发动机'   },
  { zh: ['制动','刹车','卡钳','制动盘','刹车片','制动片','制动泵'],                 cat: 'Brakes',        catZh: '制动系统' },
  { zh: ['减振','弹簧','摆臂','拉杆','球头','轴承','悬挂','支柱','减震'],           cat: 'Suspension',    catZh: '悬挂系统' },
  { zh: ['传感器','继电器','线束','电机','电池','蓄电池','发电机','起动机','开关'],   cat: 'Electrical',    catZh: '电气系统' },
  { zh: ['散热','水泵','节温','冷却','冷凝','膨胀壶'],                             cat: 'Cooling',       catZh: '冷却系统' },
  { zh: ['变速','离合','传动轴','差速','换挡'],                                    cat: 'Transmission',  catZh: '变速箱'   },
  { zh: ['保险杠','叶子板','车门','引擎盖','前盖','后盖','翼子板','缓冲','门板'],    cat: 'Body & Exterior',catZh: '车身外饰' },
  { zh: ['转向','方向盘','助力','齿条','拉杆'],                                    cat: 'Steering',      catZh: '转向系统' },
  { zh: ['排气','消声','催化','尾管','排放'],                                      cat: 'Exhaust',       catZh: '排气系统' },
  { zh: ['大灯','尾灯','雾灯','转向灯','灯具','灯泡','灯罩','前照'],               cat: 'Lights',        catZh: '灯光系统' },
  { zh: ['座椅','内饰','仪表','中控','顶棚','地毯','安全带','气囊'],               cat: 'Interior',      catZh: '内饰'     },
  { zh: ['雨刮','雨刷','刮水','风挡','玻璃'],                                      cat: 'Wipers & Glass',catZh: '雨刮玻璃' },
  { zh: ['空调','压缩机','蒸发','暖风','出风口'],                                  cat: 'HVAC',          catZh: '空调系统' },
]

function inferCategory(nameZh: string): { cat: string; catZh: string } {
  for (const rule of CAT_RULES) {
    if (rule.zh.some(kw => nameZh.includes(kw))) {
      return { cat: rule.cat, catZh: rule.catZh }
    }
  }
  return { cat: 'General', catZh: '通用' }
}

export interface ApiPart {
  name:      string
  nameZh:    string
  oemNumber: string
  category:  string
  categoryZh:string
  matched:   boolean
}

export interface VinLookupResult {
  epc:       string
  brandName: string
  parts:     ApiPart[]
}

const EPC_BRAND: Record<string, string> = {
  byd:       'BYD',
  geely:     'Geely',
  greatwall: 'Great Wall',
  changan:   'Changan',
  chery:     'Chery',
  wuling:    'Wuling',
}

// Parse the @-delimited data string returned by the API
function parseData(data: string): ApiPart[] {
  if (!data || typeof data !== 'string') return []
  return data.split('@')
    .map(s => s.trim())
    .filter(Boolean)
    .map(item => {
      const segs = item.split('_')
      // BYD-style: OEM_nameZh_flag  (e.g. "5A-5308111_前舱缓冲块_M")
      if (segs.length >= 2 && /^[A-Z0-9][A-Z0-9\-]+$/.test(segs[0])) {
        const nameZh = segs[1] || ''
        const { cat, catZh } = inferCategory(nameZh)
        return {
          oemNumber: segs[0],
          nameZh,
          name:      nameZh,      // use Chinese as primary; English translation not available
          category:  cat,
          categoryZh:catZh,
          matched:   segs[2] === 'M',
        }
      }
      // Name-only style (Changan): just Chinese name, no OEM
      const { cat, catZh } = inferCategory(item)
      return {
        oemNumber: '',
        nameZh:    item,
        name:      item,
        category:  cat,
        categoryZh:catZh,
        matched:   false,
      }
    })
    .filter(p => p.oemNumber || p.nameZh)
}

async function callEpc(epc: string, vin: string): Promise<ApiPart[] | null> {
  const path  = `/${epc}?action=all_std_part_name&vin=${vin}&is_vin_filter_open=0`
  const tok   = token(path)
  const url   = `${BASE}/${epc}?action=all_std_part_name&vin=${encodeURIComponent(vin)}&is_vin_filter_open=0&user=${USER}&token=${tok}`

  try {
    const res  = await fetch(url, { cache: 'no-store' })
    const json = await res.json() as { code: number; data: string; msg: string }
    // code=1 = success with data
    if (json.code === 1 && json.data) {
      const parts = parseData(json.data)
      if (parts.length > 0) return parts
    }
  } catch { /* network error */ }
  return null
}

// Main export: try WMI-mapped EPC first, then fall back to all others
export async function lookupVin(vin: string): Promise<VinLookupResult | null> {
  const primary = epcFromVin(vin)
  const order   = [primary, ...SUPPORTED_EPCS.filter(e => e !== primary)]

  for (const epc of order) {
    const parts = await callEpc(epc, vin)
    if (parts && parts.length > 0) {
      return { epc, brandName: EPC_BRAND[epc] || epc, parts }
    }
  }
  return null
}
