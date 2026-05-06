import crypto from 'crypto'

const BASE     = process.env.VINAPI_BASE     || 'http://api.17vin.com:8080'
const EPC_BASE = process.env.VINAPI_EPC_BASE || 'http://api.17vin.com:3001'
const USER     = process.env.VINAPI_USER     || ''
const PASS     = process.env.VINAPI_PASS     || ''

const md5 = (s: string) => crypto.createHash('md5').update(s).digest('hex')

function makeToken(path: string): string {
  // MD5(MD5(user) + MD5(pass) + path)
  return md5(md5(USER) + md5(PASS) + path)
}

export interface EpcInfo {
  epc: string
  brandName: string
  brandNameZh?: string
}

export interface ApiPart {
  name: string
  nameZh: string
  oemNumber: string
  category: string
  categoryZh: string
  position?: string
  altNumbers?: string
}

export interface VinApiResult {
  epc: string
  brandName: string
  parts: ApiPart[]
  raw: unknown
}

// Step 1: Get EPC code for a VIN from port 3001
export async function getEpc(vin: string): Promise<EpcInfo | null> {
  const path = `/?action=get_epc&vin=${vin}&user=${USER}`
  const token = makeToken(path)
  const url = `${EPC_BASE}/?action=get_epc&vin=${encodeURIComponent(vin)}&user=${USER}&token=${token}`

  try {
    const res = await fetch(url, { next: { revalidate: 0 } })
    const json = await res.json() as { code: number; data: { epc?: string; brand_name?: string; brand_name_zh?: string } | string; msg: string }
    if (json.code !== 0 || !json.data || typeof json.data === 'string') return null
    return {
      epc: json.data.epc || '',
      brandName: json.data.brand_name || '',
      brandNameZh: json.data.brand_name_zh,
    }
  } catch {
    return null
  }
}

// Step 2: Get all standard part names for a VIN
export async function getPartsByVin(epc: string, vin: string): Promise<VinApiResult | null> {
  const path = `/${epc}?action=all_std_part_name&vin=${vin}`
  const token = makeToken(path)
  const url = `${BASE}/${epc}?action=all_std_part_name&vin=${encodeURIComponent(vin)}&user=${USER}&token=${token}&is_vin_filter_open=1`

  try {
    const res = await fetch(url, { next: { revalidate: 0 } })
    const json = await res.json() as {
      code: number
      msg: string
      data: Array<{
        std_part_name?: string
        part_name?: string
        part_name_zh?: string
        std_part_name_zh?: string
        oem_number?: string
        part_number?: string
        category?: string
        category_zh?: string
        group_name?: string
        group_name_zh?: string
        position?: string
        alt_numbers?: string
        alt_oem?: string
      }>
    }

    if (json.code !== 0 || !Array.isArray(json.data)) return null

    const parts: ApiPart[] = json.data.map(item => ({
      name:        item.std_part_name    || item.part_name    || 'Unknown Part',
      nameZh:      item.std_part_name_zh || item.part_name_zh || '',
      oemNumber:   item.oem_number       || item.part_number  || '',
      category:    item.group_name       || item.category     || 'General',
      categoryZh:  item.group_name_zh    || item.category_zh  || '',
      position:    item.position,
      altNumbers:  item.alt_numbers      || item.alt_oem,
    })).filter(p => p.oemNumber)

    return { epc, brandName: '', parts, raw: json.data }
  } catch {
    return null
  }
}

// Combined: EPC lookup then parts fetch
export async function lookupVin(vin: string): Promise<VinApiResult | null> {
  const epcInfo = await getEpc(vin)
  if (!epcInfo?.epc) return null

  const result = await getPartsByVin(epcInfo.epc, vin)
  if (!result) return null

  result.brandName = epcInfo.brandName
  return result
}
