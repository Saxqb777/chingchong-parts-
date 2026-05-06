/**
 * Run this locally to discover what 17vin API endpoints are available.
 * Usage: node scripts/probe-api.mjs
 */
import crypto from 'crypto'
import http from 'http'

const USER = 'sinospares'
const PASS = 'y76tgr54ed'
const BASE     = 'http://api.17vin.com:8080'
const EPC_BASE = 'http://api.17vin.com:3001'

const md5 = s => crypto.createHash('md5').update(s).digest('hex')
const token = path => md5(md5(USER) + md5(PASS) + path)

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, { timeout: 10000 }, res => {
      let d = ''
      res.on('data', c => d += c)
      res.on('end', () => {
        try { resolve(JSON.parse(d)) } catch { resolve(d) }
      })
    }).on('error', reject).on('timeout', () => reject(new Error('timeout')))
  })
}

function makeUrl(base, path, extra = '') {
  const tok = token(path)
  return `${base}${path}&user=${USER}&token=${tok}${extra}`
}

async function probe(label, base, path, extra = '') {
  const url = makeUrl(base, path, extra)
  console.log(`\n── ${label}`)
  console.log(`   ${url}`)
  try {
    const res = await get(url)
    console.log(`   ✓`, JSON.stringify(res).slice(0, 300))
    return res
  } catch (e) {
    console.log(`   ✗ ${e.message}`)
    return null
  }
}

console.log('=== 17vin API Probe ===\n')

// 1. Verify credentials
await probe('Auth check',        BASE,     '/?action=myapicount')

// 2. Port 3001 — try brand/EPC listing endpoints
await probe('Brand list (3001)', EPC_BASE, '/?action=get_brand_list')
await probe('EPC list (3001)',   EPC_BASE, '/?action=get_epc_list')
await probe('All brands',        EPC_BASE, '/?action=brand_list')
await probe('Manufacturer list', EPC_BASE, '/?action=manufacturer_list')
await probe('Root listing',      EPC_BASE, '/?action=list')

// 3. Try EPC lookup with a known Chinese VIN
const testVin = 'LGXCE4GB2M1234567'
await probe(`EPC for VIN ${testVin}`, EPC_BASE, `/?action=get_epc&vin=${testVin}`)
await probe(`EPC alt format`,         EPC_BASE, `/?vin=${testVin}&action=epc`)

// 4. Port 8080 — try listing without EPC
await probe('Action list (8080)',  BASE, '/?action=get_epc_list')
await probe('All EPCs (8080)',     BASE, '/?action=all_epc')
await probe('Brand list (8080)',   BASE, '/?action=get_brand_list')

// 5. Try common EPC codes directly
for (const epc of ['haval', 'byd', 'geely', 'changan', 'chery', 'mg', 'gac', 'greatwall', 'great_wall']) {
  const path = `/${epc}?action=get_model_list`
  await probe(`Model list for epc=${epc}`, BASE, path)
}

console.log('\n=== Done. Paste this output back to Claude. ===')
