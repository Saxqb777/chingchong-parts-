/**
 * Targeted probe for a specific VIN — finds the correct EPC format.
 * Usage: node scripts/probe-vin.mjs LGXCE4CB2R2001416
 */
import crypto from 'crypto'
import http from 'http'

const USER = 'sinospares'
const PASS = 'y76tgr54ed'
const BASE = 'http://api.17vin.com:8080'
const VIN  = process.argv[2] || 'LGXCE4CB2R2001416'

const md5   = s => crypto.createHash('md5').update(s).digest('hex')
const token = path => md5(md5(USER) + md5(PASS) + path)

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, { timeout: 12000 }, res => {
      let d = ''
      res.on('data', c => d += c)
      res.on('end', () => { try { resolve(JSON.parse(d)) } catch { resolve(d) } })
    }).on('error', reject).on('timeout', () => reject(new Error('timeout')))
  })
}

async function probe(label, path) {
  const tok = token(path)
  const url = `${BASE}${path}&user=${USER}&token=${tok}`
  process.stdout.write(`\n── ${label}\n   ${url}\n   `)
  try {
    const res = await get(url)
    const str = JSON.stringify(res)
    const isSuccess = res?.code === 0 || (Array.isArray(res?.data) && res.data.length > 0)
    if (isSuccess) {
      console.log('✅ SUCCESS:', str.slice(0, 600))
    } else {
      console.log(`code=${res?.code}: ${str.slice(0, 100)}`)
    }
    return res
  } catch(e) {
    console.log('✗', e.message)
    return null
  }
}

console.log(`=== Probing VIN: ${VIN} ===`)

// No EPC path
await probe('No EPC', `/?action=all_std_part_name&vin=${VIN}`)

// EPC as query param
for (const epc of ['byd','geely','haval','greatwall','great_wall','changan','chery','mg','gac','saic','lgx','l6t','lsj']) {
  await probe(`epc param: ${epc}`, `/?action=all_std_part_name&vin=${VIN}&epc=${epc}`)
}

// EPC in path — brand name guesses
for (const epc of ['byd','BYD','geely','haval','greatwall','great_wall','changan','chery','mg','gac','saic','wuling','hongqi','nio','xpeng','lgx','l6t','lsj','lhg','lfv']) {
  await probe(`/${epc}`, `/${epc}?action=all_std_part_name&vin=${VIN}`)
}

// Numeric EPC IDs
for (const id of [1,2,3,4,5,6,7,8,9,10,15,20,30,50,100]) {
  await probe(`/${id}`, `/${id}?action=all_std_part_name&vin=${VIN}`)
}

console.log('\n=== Done. Paste output back to Claude. ===')
