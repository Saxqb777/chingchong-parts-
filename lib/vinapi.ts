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

// Chinese part name → English translation (keyword-based, longest match first)
const ZH_EN: Array<[string, string]> = [
  // Engine
  ['发动机总成', 'Engine Assembly'], ['发动机', 'Engine'], ['缸体', 'Engine Block'],
  ['活塞环', 'Piston Ring'], ['活塞', 'Piston'], ['气门弹簧', 'Valve Spring'],
  ['气门', 'Valve'], ['凸轮轴', 'Camshaft'], ['曲轴', 'Crankshaft'],
  ['正时链条', 'Timing Chain'], ['正时皮带', 'Timing Belt'], ['正时', 'Timing'],
  ['火花塞', 'Spark Plug'], ['喷油嘴', 'Fuel Injector'], ['喷油', 'Fuel Injection'],
  ['机油泵', 'Oil Pump'], ['机油滤清器', 'Oil Filter'], ['机油盖', 'Oil Cap'],
  ['机油', 'Engine Oil'], ['进气歧管', 'Intake Manifold'], ['排气歧管', 'Exhaust Manifold'],
  // Brakes
  ['刹车盘', 'Brake Disc'], ['刹车片', 'Brake Pad'], ['刹车', 'Brake'],
  ['制动盘', 'Brake Disc'], ['制动片', 'Brake Pad'], ['制动泵', 'Brake Pump'],
  ['制动钳', 'Brake Caliper'], ['制动', 'Brake'], ['卡钳', 'Caliper'],
  ['手刹线', 'Handbrake Cable'], ['手刹', 'Handbrake'],
  // Suspension
  ['减振器', 'Shock Absorber'], ['减震器', 'Shock Absorber'],
  ['弹簧', 'Coil Spring'], ['摆臂', 'Control Arm'], ['球头', 'Ball Joint'],
  ['横拉杆', 'Tie Rod'], ['纵拉杆', 'Trailing Arm'], ['拉杆', 'Tie Rod'],
  ['轴承', 'Bearing'], ['衬套', 'Bushing'], ['支柱', 'Strut'],
  ['稳定杆', 'Sway Bar'], ['下摆臂', 'Lower Control Arm'],
  // Steering
  ['方向盘', 'Steering Wheel'], ['转向柱', 'Steering Column'],
  ['转向泵', 'Power Steering Pump'], ['转向机', 'Steering Rack'],
  ['助力泵', 'Power Steering Pump'], ['齿条', 'Steering Rack'],
  // Cooling
  ['散热器', 'Radiator'], ['水泵', 'Water Pump'], ['节温器', 'Thermostat'],
  ['冷凝器', 'AC Condenser'], ['膨胀壶', 'Coolant Reservoir'],
  ['冷却液', 'Coolant'], ['风扇', 'Cooling Fan'],
  // Transmission
  ['变速箱', 'Gearbox'], ['变速器', 'Transmission'], ['离合器', 'Clutch'],
  ['传动轴', 'Drive Shaft'], ['差速器', 'Differential'], ['换挡', 'Gear Shift'],
  ['半轴', 'Axle Shaft'], ['等速万向节', 'CV Joint'], ['万向节', 'Universal Joint'],
  // Electrical
  ['蓄电池', 'Battery'], ['电池', 'Battery'], ['发电机', 'Alternator'],
  ['起动机', 'Starter Motor'], ['继电器', 'Relay'], ['保险丝', 'Fuse'],
  ['线束', 'Wiring Harness'], ['传感器', 'Sensor'], ['开关', 'Switch'],
  ['电机', 'Motor'], ['灯泡', 'Bulb'],
  // Lights
  ['前大灯', 'Headlight'], ['后大灯', 'Rear Light'], ['大灯', 'Headlight'],
  ['尾灯', 'Tail Light'], ['雾灯', 'Fog Light'], ['转向灯', 'Turn Signal'],
  ['刹车灯', 'Brake Light'], ['灯罩', 'Lamp Cover'], ['灯具', 'Light Assembly'],
  // Body & Exterior
  ['前保险杠', 'Front Bumper'], ['后保险杠', 'Rear Bumper'], ['保险杠', 'Bumper'],
  ['前舱盖', 'Hood'], ['引擎盖', 'Hood'], ['前盖', 'Hood'],
  ['翼子板', 'Fender'], ['叶子板', 'Fender'],
  ['车门', 'Door'], ['门板', 'Door Panel'], ['门铰链', 'Door Hinge'],
  ['后备箱盖', 'Trunk Lid'], ['行李箱', 'Trunk'],
  ['缓冲块', 'Bump Stop'], ['缓冲', 'Buffer'],
  // Fuel system
  ['油箱', 'Fuel Tank'], ['燃油泵', 'Fuel Pump'], ['燃油滤清器', 'Fuel Filter'],
  ['碳罐', 'Charcoal Canister'],
  // Exhaust
  ['排气管', 'Exhaust Pipe'], ['消声器', 'Muffler'], ['催化器', 'Catalytic Converter'],
  ['尾管', 'Exhaust Tip'], ['排气', 'Exhaust'],
  // Interior
  ['座椅', 'Seat'], ['安全带', 'Seat Belt'], ['气囊', 'Airbag'],
  ['仪表盘', 'Dashboard'], ['中控台', 'Center Console'], ['顶棚', 'Headliner'],
  ['地毯', 'Floor Mat'], ['方向盘', 'Steering Wheel'],
  // HVAC
  ['空调压缩机', 'AC Compressor'], ['压缩机', 'Compressor'],
  ['蒸发器', 'Evaporator'], ['暖风机', 'Heater Core'], ['出风口', 'Air Vent'],
  ['空调', 'Air Conditioning'],
  // Wipers & Glass
  ['雨刮器', 'Wiper'], ['雨刷', 'Wiper Blade'], ['刮水器', 'Wiper'],
  ['风挡玻璃', 'Windshield'], ['挡风玻璃', 'Windshield'],
  ['后视镜', 'Side Mirror'], ['后视', 'Rear View'],
  // Wheels & Tyres
  ['轮毂', 'Wheel Hub'], ['轮胎', 'Tyre'], ['轮毂螺母', 'Wheel Nut'],
  // Filters
  ['空气滤清器', 'Air Filter'], ['空气滤芯', 'Air Filter'],
  ['滤清器', 'Filter'], ['滤芯', 'Filter'],
  // Gaskets & Seals
  ['缸盖垫', 'Head Gasket'], ['油封', 'Oil Seal'], ['密封圈', 'O-Ring'],
  ['垫片', 'Gasket'], ['密封', 'Seal'],
]

function translateZh(nameZh: string): string {
  if (!nameZh) return nameZh
  for (const [zh, en] of ZH_EN) {
    if (nameZh.includes(zh)) return en
  }
  return nameZh
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
          name:      translateZh(nameZh),
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
        name:      translateZh(item),
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
