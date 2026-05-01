export interface VinDecodeResult {
  raw: string
  wmi: string
  vds: string
  vis: string
  manufacturer: string
  brand: string
  country: string
  year: number | null
  plant: string
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  matchedVehicle?: {
    id: string
    model: string
    brandName: string
    engine?: string | null
    fuelType: string
    bodyType?: string | null
    year: number
  }
}

// WMI prefix → brand mapping for Chinese manufacturers
const WMI_MAP: Record<string, { brand: string; manufacturer: string; country: string }> = {
  // BYD
  'LFV': { brand: 'BYD', manufacturer: 'BYD Auto Industry Co.', country: 'China' },
  'L9B': { brand: 'BYD', manufacturer: 'BYD Auto Co. Ltd (Shenzhen)', country: 'China' },
  'LGX': { brand: 'BYD / Great Wall', manufacturer: 'Multiple (see full VIN)', country: 'China' },
  // Geely
  'L8X': { brand: 'Geely', manufacturer: 'Zhejiang Geely Holding', country: 'China' },
  'LB3': { brand: 'Geely', manufacturer: 'Geely Automobile Holdings', country: 'China' },
  'L6T': { brand: 'Changan / Geely', manufacturer: 'See VDS for confirmation', country: 'China' },
  // Great Wall / Haval
  'LS5': { brand: 'Great Wall / Haval', manufacturer: 'Great Wall Motor Co.', country: 'China' },
  'LHG': { brand: 'Great Wall / Haval', manufacturer: 'Great Wall Motor Baoding', country: 'China' },
  // Changan
  'LZM': { brand: 'Changan', manufacturer: 'Chongqing Changan Automobile', country: 'China' },
  'L6TC': { brand: 'Changan', manufacturer: 'Chongqing Changan Automobile', country: 'China' },
  // Chery
  'LSV': { brand: 'Chery', manufacturer: 'Chery Automobile Co. Ltd', country: 'China' },
  'L8XA': { brand: 'Chery', manufacturer: 'Chery Automobile (Wuhu)', country: 'China' },
  // SAIC / MG / Roewe
  'LSJ': { brand: 'MG / SAIC', manufacturer: 'SAIC Motor Co. Ltd', country: 'China' },
  'LDC': { brand: 'Roewe / MG', manufacturer: 'SAIC-GM-Wuling', country: 'China' },
  'LSC': { brand: 'MG', manufacturer: 'SAIC Motor Passenger Vehicle', country: 'China' },
  // GAC
  'LGH': { brand: 'GAC / Trumpchi / Aion', manufacturer: 'Guangzhou Automobile Group', country: 'China' },
  // Dongfeng
  'LFP': { brand: 'Dongfeng', manufacturer: 'Dongfeng Motor Co.', country: 'China' },
  'LDY': { brand: 'Dongfeng', manufacturer: 'Dongfeng Liuzhou Motor', country: 'China' },
  // BAIC
  'LV5': { brand: 'BAIC', manufacturer: 'BAIC Motor Co.', country: 'China' },
  'L4B': { brand: 'BAIC BluePark', manufacturer: 'BAIC BJEV (Electric)', country: 'China' },
  // JAC
  'LSY': { brand: 'JAC', manufacturer: 'Anhui Jianghuai Automobile', country: 'China' },
  // Wuling / Baojun
  'LSG': { brand: 'Wuling', manufacturer: 'SGMW (SAIC-GM-Wuling)', country: 'China' },
  'LE4': { brand: 'Baojun', manufacturer: 'Baojun (SGMW)', country: 'China' },
}

// VIN year encoding (position 10)
const YEAR_MAP: Record<string, number> = {
  'A': 1980, 'B': 1981, 'C': 1982, 'D': 1983, 'E': 1984, 'F': 1985,
  'G': 1986, 'H': 1987, 'J': 1988, 'K': 1989, 'L': 1990, 'M': 1991,
  'N': 1992, 'P': 1993, 'R': 1994, 'S': 1995, 'T': 1996, 'V': 1997,
  'W': 1998, 'X': 1999, 'Y': 2000, '1': 2001, '2': 2002, '3': 2003,
  '4': 2004, '5': 2005, '6': 2006, '7': 2007, '8': 2008, '9': 2009,
  'A2': 2010, 'B2': 2011, 'C2': 2012, 'D2': 2013, 'E2': 2014, 'F2': 2015,
  'G2': 2016, 'H2': 2017, 'J2': 2018, 'K2': 2019, 'L2': 2020, 'M2': 2021,
  'N2': 2022, 'P2': 2023, 'R2': 2024, 'S2': 2025, 'T2': 2026,
}

export function decodeVin(vin: string): VinDecodeResult {
  const raw = vin.trim().toUpperCase()
  const wmi = raw.substring(0, 3)
  const vds = raw.substring(3, 9)
  const vis = raw.substring(9, 17)
  const yearChar = raw[9] || ''

  // Try 4-char WMI first, then 3-char
  const info = WMI_MAP[raw.substring(0, 4)] || WMI_MAP[wmi] || {
    brand: 'Unknown',
    manufacturer: 'Unrecognised WMI prefix',
    country: raw[0] === 'L' ? 'China' : 'Unknown',
  }

  const year = YEAR_MAP[yearChar] || null

  const confidence: 'HIGH' | 'MEDIUM' | 'LOW' =
    info.brand !== 'Unknown' && year ? 'HIGH'
    : info.brand !== 'Unknown' ? 'MEDIUM'
    : raw[0] === 'L' ? 'LOW'
    : 'LOW'

  return { raw, wmi, vds, vis, manufacturer: info.manufacturer, brand: info.brand, country: info.country, year, plant: vis[0] || '', confidence }
}

export function isValidVin(vin: string): boolean {
  const v = vin.trim().toUpperCase()
  return v.length >= 11 && v.length <= 17 && /^[A-HJ-NPR-Z0-9]+$/.test(v)
}

export function isChassisCode(input: string): boolean {
  return /^[A-Z0-9\-_]{4,20}$/.test(input.trim().toUpperCase()) && !isValidVin(input)
}
