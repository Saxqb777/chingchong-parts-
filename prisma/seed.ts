import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Chinese car parts database...')

  // ── BRANDS ──────────────────────────────────────────────────────────────
  const brands = await Promise.all([
    prisma.brand.upsert({ where: { name: 'BYD' }, update: {}, create: { name: 'BYD', nameZh: '比亚迪', founded: 2003, description: 'Build Your Dreams — largest EV manufacturer globally' } }),
    prisma.brand.upsert({ where: { name: 'Geely' }, update: {}, create: { name: 'Geely', nameZh: '吉利', founded: 1986, description: 'Zhejiang Geely Holding Group, owns Volvo and Lotus' } }),
    prisma.brand.upsert({ where: { name: 'Haval' }, update: {}, create: { name: 'Haval', nameZh: '哈弗', founded: 2013, description: "Great Wall Motor's SUV brand — China's #1 SUV" } }),
    prisma.brand.upsert({ where: { name: 'Changan' }, update: {}, create: { name: 'Changan', nameZh: '长安', founded: 1862, description: 'Changan Automobile, one of China\'s oldest manufacturers' } }),
    prisma.brand.upsert({ where: { name: 'Chery' }, update: {}, create: { name: 'Chery', nameZh: '奇瑞', founded: 1997, description: 'Chery Automobile, major Chinese export brand' } }),
    prisma.brand.upsert({ where: { name: 'MG' }, update: {}, create: { name: 'MG', nameZh: '名爵', founded: 1924, description: 'MG Motor — British heritage, Chinese SAIC ownership' } }),
    prisma.brand.upsert({ where: { name: 'GAC Aion' }, update: {}, create: { name: 'GAC Aion', nameZh: '广汽埃安', founded: 2017, description: 'GAC Group EV sub-brand, premium electric vehicles' } }),
    prisma.brand.upsert({ where: { name: 'Great Wall' }, update: {}, create: { name: 'Great Wall', nameZh: '长城', founded: 1984, description: 'Great Wall Motor — trucks, SUVs, and Tank series' } }),
  ])

  const [byd, geely, haval, changan, chery, mg, gac, gw] = brands

  // ── PART CATEGORIES ──────────────────────────────────────────────────────
  const cats = await Promise.all([
    prisma.partCategory.upsert({ where: { name: 'Engine' }, update: {}, create: { name: 'Engine', nameZh: '发动机', icon: 'zap' } }),
    prisma.partCategory.upsert({ where: { name: 'Brakes' }, update: {}, create: { name: 'Brakes', nameZh: '制动系统', icon: 'disc' } }),
    prisma.partCategory.upsert({ where: { name: 'Suspension' }, update: {}, create: { name: 'Suspension', nameZh: '悬挂系统', icon: 'activity' } }),
    prisma.partCategory.upsert({ where: { name: 'Electrical' }, update: {}, create: { name: 'Electrical', nameZh: '电气系统', icon: 'cpu' } }),
    prisma.partCategory.upsert({ where: { name: 'Cooling' }, update: {}, create: { name: 'Cooling', nameZh: '冷却系统', icon: 'thermometer' } }),
    prisma.partCategory.upsert({ where: { name: 'Transmission' }, update: {}, create: { name: 'Transmission', nameZh: '变速箱', icon: 'settings' } }),
    prisma.partCategory.upsert({ where: { name: 'Body & Exterior' }, update: {}, create: { name: 'Body & Exterior', nameZh: '车身外饰', icon: 'box' } }),
    prisma.partCategory.upsert({ where: { name: 'Steering' }, update: {}, create: { name: 'Steering', nameZh: '转向系统', icon: 'navigation' } }),
    prisma.partCategory.upsert({ where: { name: 'Fuel System' }, update: {}, create: { name: 'Fuel System', nameZh: '燃油系统', icon: 'droplets' } }),
    prisma.partCategory.upsert({ where: { name: 'Exhaust' }, update: {}, create: { name: 'Exhaust', nameZh: '排气系统', icon: 'wind' } }),
  ])

  const [catEngine, catBrakes, catSusp, catElec, catCool, catTrans, catBody, catSteer, catFuel, catExhaust] = cats

  // ── VEHICLES ─────────────────────────────────────────────────────────────
  const vehicles = await Promise.all([
    // BYD
    prisma.vehicle.create({ data: { brandId: byd.id, model: 'Han EV', modelZh: '汉EV', year: 2021, yearEnd: 2024, engine: 'Electric', fuelType: 'Electric', bodyType: 'Sedan', vinPrefix: 'LGXCE4GB', chassisCode: 'BYD-HAN-EV' } }),
    prisma.vehicle.create({ data: { brandId: byd.id, model: 'Atto 3', modelZh: '元PLUS', year: 2022, yearEnd: 2024, engine: 'Electric', fuelType: 'Electric', bodyType: 'SUV', vinPrefix: 'LGXCE4HB', chassisCode: 'BYD-ATTO3' } }),
    prisma.vehicle.create({ data: { brandId: byd.id, model: 'Song Plus DM-i', modelZh: '宋Plus DM-i', year: 2021, yearEnd: 2024, engine: '1.5L DM-i Hybrid', fuelType: 'Hybrid', bodyType: 'SUV', vinPrefix: 'LGXCE4FB', chassisCode: 'BYD-SONG-DM' } }),
    // Geely
    prisma.vehicle.create({ data: { brandId: geely.id, model: 'Coolray', modelZh: '缤越', year: 2019, yearEnd: 2024, engine: '1.5T', displacement: '1498cc', fuelType: 'Petrol', bodyType: 'SUV', vinPrefix: 'L6T6D5AB', chassisCode: 'GEELY-SX11' } }),
    prisma.vehicle.create({ data: { brandId: geely.id, model: 'Emgrand', modelZh: '帝豪', year: 2018, yearEnd: 2024, engine: '1.5L', displacement: '1498cc', fuelType: 'Petrol', bodyType: 'Sedan', vinPrefix: 'L6T6A5AB', chassisCode: 'GEELY-EC7' } }),
    // Haval
    prisma.vehicle.create({ data: { brandId: haval.id, model: 'H6', modelZh: '哈弗H6', year: 2020, yearEnd: 2024, engine: '1.5T / 2.0T', displacement: '1500cc', fuelType: 'Petrol', bodyType: 'SUV', vinPrefix: 'LGX', chassisCode: 'GWM-H6-3GEN' } }),
    prisma.vehicle.create({ data: { brandId: haval.id, model: 'Jolion', modelZh: '哈弗初恋', year: 2021, yearEnd: 2024, engine: '1.5T', displacement: '1498cc', fuelType: 'Petrol', bodyType: 'SUV', vinPrefix: 'LGX', chassisCode: 'GWM-JOLION' } }),
    // Changan
    prisma.vehicle.create({ data: { brandId: changan.id, model: 'CS75 Plus', modelZh: '长安CS75 Plus', year: 2019, yearEnd: 2024, engine: '1.5T / 2.0T', displacement: '1498cc', fuelType: 'Petrol', bodyType: 'SUV', vinPrefix: 'L6TCB', chassisCode: 'CA-CS75P' } }),
    prisma.vehicle.create({ data: { brandId: changan.id, model: 'Alsvin', modelZh: '逸动', year: 2020, yearEnd: 2024, engine: '1.4T', displacement: '1398cc', fuelType: 'Petrol', bodyType: 'Sedan', vinPrefix: 'L6T6B', chassisCode: 'CA-ALSVIN' } }),
    // Chery
    prisma.vehicle.create({ data: { brandId: chery.id, model: 'Tiggo 8 Pro', modelZh: '瑞虎8 Pro', year: 2020, yearEnd: 2024, engine: '1.6T / 2.0T', displacement: '1598cc', fuelType: 'Petrol', bodyType: 'SUV', vinPrefix: 'L8XAE4HB', chassisCode: 'CHERY-T19' } }),
    prisma.vehicle.create({ data: { brandId: chery.id, model: 'Arrizo 6', modelZh: '艾瑞泽6', year: 2019, yearEnd: 2024, engine: '1.5T', displacement: '1498cc', fuelType: 'Petrol', bodyType: 'Sedan', vinPrefix: 'L8XA', chassisCode: 'CHERY-A19' } }),
    // MG
    prisma.vehicle.create({ data: { brandId: mg.id, model: 'MG ZS', modelZh: 'MG ZS', year: 2018, yearEnd: 2024, engine: '1.5L / 1.3T', displacement: '1490cc', fuelType: 'Petrol', bodyType: 'SUV', vinPrefix: 'LSJA24U', chassisCode: 'MG-ZS-EZS' } }),
    prisma.vehicle.create({ data: { brandId: mg.id, model: 'MG5', modelZh: 'MG5', year: 2020, yearEnd: 2024, engine: '1.5T', displacement: '1498cc', fuelType: 'Petrol', bodyType: 'Sedan', vinPrefix: 'LSJC24U', chassisCode: 'MG-5' } }),
    // GAC Aion
    prisma.vehicle.create({ data: { brandId: gac.id, model: 'Aion S', modelZh: '埃安S', year: 2021, yearEnd: 2024, engine: 'Electric', fuelType: 'Electric', bodyType: 'Sedan', vinPrefix: 'LHGGD4FB', chassisCode: 'GAC-AION-S' } }),
    // Great Wall
    prisma.vehicle.create({ data: { brandId: gw.id, model: 'Poer (Pickup)', modelZh: '炮', year: 2020, yearEnd: 2024, engine: '2.0T Diesel', displacement: '1996cc', fuelType: 'Diesel', bodyType: 'Pickup', vinPrefix: 'LGX', chassisCode: 'GWM-POER' } }),
  ])

  const [bydHan, bydAtto3, bydSong, geelyCoolray, geelyEmgrand, havalH6, havalJolion, cs75, alsvin, tiggo8, arrizo6, mgZS, mg5, aionS, poer] = vehicles

  // ── PARTS ────────────────────────────────────────────────────────────────
  // Helper to create parts quickly
  const p = (vehicleId: string, categoryId: string, data: object) =>
    prisma.part.create({ data: { vehicleId, categoryId, ...data } as Parameters<typeof prisma.part.create>[0]['data'] })

  await Promise.all([
    // ── BYD Han EV ──
    p(bydHan.id, catElec.id, { name: 'High Voltage Battery Pack', nameZh: '高压电池组', oemNumber: 'BYD-HAN-BAT-001', altNumbers: 'BYDHEV2021BP', description: 'Main traction battery 77.6kWh blade battery pack', position: 'Underfloor' }),
    p(bydHan.id, catElec.id, { name: 'Front Drive Motor', nameZh: '前驱电机', oemNumber: 'BYD-HAN-MTR-F01', altNumbers: 'BYDHEV2021MF', description: '163kW permanent magnet synchronous motor', position: 'Front axle' }),
    p(bydHan.id, catElec.id, { name: 'OBC On-Board Charger', nameZh: '车载充电机', oemNumber: 'BYD-HAN-OBC-001', description: '7kW AC on-board charger module', position: 'Engine bay' }),
    p(bydHan.id, catBrakes.id, { name: 'Front Brake Disc', nameZh: '前刹车盘', oemNumber: 'BYD-HAN-BDF-001', altNumbers: 'BD345X32', description: 'Ventilated disc 345mm, front axle', position: 'Front left/right', material: 'Cast iron' }),
    p(bydHan.id, catBrakes.id, { name: 'Rear Brake Caliper Assembly', nameZh: '后卡钳总成', oemNumber: 'BYD-HAN-BRC-R01', description: 'EPB integrated rear caliper with electric parking', position: 'Rear left/right' }),
    p(bydHan.id, catBrakes.id, { name: 'Brake Master Cylinder', nameZh: '制动主缸', oemNumber: 'BYD-HAN-BMC-001', description: 'iBooster integrated brake master cylinder', position: 'Engine bay' }),
    p(bydHan.id, catSusp.id, { name: 'Front Strut Assembly', nameZh: '前减振器总成', oemNumber: 'BYD-HAN-FSA-001', altNumbers: 'SACHS2021HAN', description: 'MacPherson strut complete assembly, front', position: 'Front left/right' }),
    p(bydHan.id, catSusp.id, { name: 'Rear Multilink Control Arm', nameZh: '后多连杆摆臂', oemNumber: 'BYD-HAN-RCA-001', description: 'Five-link rear suspension upper control arm', position: 'Rear' }),
    p(bydHan.id, catBody.id, { name: 'Front Bumper Assembly', nameZh: '前保险杠总成', oemNumber: 'BYD-HAN-FBA-001', description: 'Complete front bumper with grille and sensors', position: 'Front' }),
    p(bydHan.id, catSteer.id, { name: 'EPS Steering Rack', nameZh: '电动转向机', oemNumber: 'BYD-HAN-EPS-001', description: 'Electric power steering rack and pinion assembly' }),

    // ── BYD Atto 3 ──
    p(bydAtto3.id, catElec.id, { name: 'Blade Battery Pack 60.48kWh', nameZh: '刀片电池60.48kWh', oemNumber: 'BYD-ATTO-BAT-001', altNumbers: 'BYDATTO3BP60', description: 'LFP blade battery, 60.48kWh standard range', position: 'Underfloor' }),
    p(bydAtto3.id, catElec.id, { name: 'Drive Motor Assembly 150kW', nameZh: '驱动电机150kW', oemNumber: 'BYD-ATTO-MTR-001', description: '150kW PMSM motor with reduction gearbox', position: 'Front axle' }),
    p(bydAtto3.id, catBrakes.id, { name: 'Front Brake Disc 330mm', nameZh: '前刹车盘330mm', oemNumber: 'BYD-ATTO-BDF-001', altNumbers: 'BD330X28', description: 'Ventilated front disc 330mm diameter', position: 'Front', material: 'Cast iron' }),
    p(bydAtto3.id, catSusp.id, { name: 'Front Lower Control Arm', nameZh: '前下摆臂', oemNumber: 'BYD-ATTO-FCA-001', description: 'Aluminium front lower control arm with ball joint', position: 'Front left/right', material: 'Aluminium alloy' }),
    p(bydAtto3.id, catBody.id, { name: 'Rear Hatch Tailgate', nameZh: '后尾门总成', oemNumber: 'BYD-ATTO-TG-001', description: 'Complete tailgate with glass and hinges', position: 'Rear' }),
    p(bydAtto3.id, catCool.id, { name: 'Battery Thermal Management Module', nameZh: '电池热管理模块', oemNumber: 'BYD-ATTO-BTM-001', description: 'HVAC-integrated battery cooling/heating module' }),

    // ── BYD Song Plus DM-i ──
    p(bydSong.id, catEngine.id, { name: '1.5L Atkinson Engine Assembly', nameZh: '1.5L阿特金森发动机总成', oemNumber: 'BYD-SONG-ENG-001', altNumbers: 'BYD15ATK001', description: '81kW naturally aspirated 1.5L Atkinson cycle engine' }),
    p(bydSong.id, catEngine.id, { name: 'Engine Oil Filter', nameZh: '机油滤清器', oemNumber: 'BYD-SONG-OFL-001', altNumbers: 'E11HD84', description: 'OEM oil filter for 1.5L DM-i engine', notes: 'Replace every 10,000km' }),
    p(bydSong.id, catEngine.id, { name: 'Spark Plug Set (4pcs)', nameZh: '火花塞套装', oemNumber: 'BYD-SONG-SPK-004', altNumbers: 'NGK LFR6AIX', description: 'Iridium spark plugs, set of 4' }),
    p(bydSong.id, catElec.id, { name: 'EHS Electric Hybrid System', nameZh: 'EHS电混系统', oemNumber: 'BYD-SONG-EHS-001', description: '132kW EHS with DHT integrated motor and gearbox' }),
    p(bydSong.id, catBrakes.id, { name: 'Front Brake Pad Set', nameZh: '前刹车片套装', oemNumber: 'BYD-SONG-BPF-001', altNumbers: 'AKE8031', description: 'OEM front brake pads, ceramic compound', position: 'Front axle' }),
    p(bydSong.id, catCool.id, { name: 'Radiator Assembly', nameZh: '散热器总成', oemNumber: 'BYD-SONG-RAD-001', description: 'Engine coolant radiator with mounting bracket', material: 'Aluminium' }),

    // ── Geely Coolray (SX11) ──
    p(geelyCoolray.id, catEngine.id, { name: '1.5TD Engine Assembly JLH-3G15TD', nameZh: '1.5TD发动机总成', oemNumber: 'JLH-3G15TD-ASM', altNumbers: 'GEELY15T001', description: '130kW turbocharged 1.5L engine, JLH-3G15TD code' }),
    p(geelyCoolray.id, catEngine.id, { name: 'Timing Chain Kit', nameZh: '正时链条套装', oemNumber: 'GEELY-SX11-TCK-001', altNumbers: 'INA559003830', description: 'Complete timing chain, guides, and tensioner kit' }),
    p(geelyCoolray.id, catEngine.id, { name: 'Oil Filter Housing Assembly', nameZh: '机油滤清器座总成', oemNumber: 'GEELY-SX11-OFH-001', altNumbers: '1106014500', description: 'Filter housing with oil pressure sensor port', notes: 'Common leak point, replace O-rings' }),
    p(geelyCoolray.id, catEngine.id, { name: 'Air Filter Element', nameZh: '空气滤清器', oemNumber: 'GEELY-SX11-AF-001', altNumbers: '1109111500', description: 'Panel air filter for 1.5T engine' }),
    p(geelyCoolray.id, catTrans.id, { name: 'DCT Dual Clutch Gearbox 7DCT', nameZh: '7速双离合变速箱', oemNumber: 'GEELY-SX11-DCT-001', altNumbers: 'DPS6-GEE001', description: '7-speed wet DCT transmission assembly', notes: 'Flush fluid every 40,000km' }),
    p(geelyCoolray.id, catBrakes.id, { name: 'Front Brake Disc 300mm', nameZh: '前刹车盘300mm', oemNumber: 'GEELY-SX11-BDF-001', altNumbers: 'BD300X25GEE', description: 'Ventilated front disc 300mm', position: 'Front', material: 'Grey cast iron' }),
    p(geelyCoolray.id, catBrakes.id, { name: 'Rear Brake Drum', nameZh: '后刹车鼓', oemNumber: 'GEELY-SX11-BDR-001', altNumbers: 'BD228GEELY', description: 'Rear drum brake 228mm diameter', position: 'Rear' }),
    p(geelyCoolray.id, catSusp.id, { name: 'Front Strut Shock Absorber', nameZh: '前减振器', oemNumber: 'GEELY-SX11-FSA-001', altNumbers: 'KYB349190', description: 'MacPherson front shock absorber', position: 'Front' }),
    p(geelyCoolray.id, catSusp.id, { name: 'Rear Shock Absorber', nameZh: '后减振器', oemNumber: 'GEELY-SX11-RSA-001', altNumbers: 'KYB349191', description: 'Torsion beam rear shock absorber', position: 'Rear' }),
    p(geelyCoolray.id, catCool.id, { name: 'Thermostat Assembly', nameZh: '节温器总成', oemNumber: 'GEELY-SX11-TH-001', altNumbers: '1301113500', description: '88°C opening thermostat with housing' }),
    p(geelyCoolray.id, catElec.id, { name: 'Alternator 90A', nameZh: '发电机90A', oemNumber: 'GEELY-SX11-ALT-001', altNumbers: 'VALEO437510', description: '90A alternator for 1.5T engine' }),

    // ── Geely Emgrand ──
    p(geelyEmgrand.id, catEngine.id, { name: '1.5L Engine Assembly JL4G15', nameZh: '1.5L发动机总成JL4G15', oemNumber: 'JL4G15-ASM-001', altNumbers: 'GEELY15NA001', description: '82kW naturally aspirated engine, JL4G15 code' }),
    p(geelyEmgrand.id, catEngine.id, { name: 'Camshaft Timing Belt Kit', nameZh: '凸轮轴正时皮带套装', oemNumber: 'GEELY-EC7-TBK-001', altNumbers: '1025010500KIT', description: 'Belt, tensioner, and idler kit. Replace every 60,000km' }),
    p(geelyEmgrand.id, catBrakes.id, { name: 'Front Brake Pad Set', nameZh: '前刹车片', oemNumber: 'GEELY-EC7-BPF-001', altNumbers: 'TRW GDB3519', description: 'Semi-metallic front brake pads' }),
    p(geelyEmgrand.id, catSusp.id, { name: 'Front Stabiliser Bar Link', nameZh: '前稳定杆连接杆', oemNumber: 'GEELY-EC7-SBL-001', altNumbers: '1014017000', description: 'Anti-roll bar drop link, front' }),
    p(geelyEmgrand.id, catSteer.id, { name: 'EPS Motor and ECU Assembly', nameZh: 'EPS电机ECU总成', oemNumber: 'GEELY-EC7-EPS-001', altNumbers: 'JTEKT001GEE', description: 'Column-type EPS motor with control unit' }),

    // ── Haval H6 ──
    p(havalH6.id, catEngine.id, { name: '1.5T GW4B15A Engine Assembly', nameZh: '1.5T GW4B15A发动机总成', oemNumber: 'GW4B15A-ASM', altNumbers: 'GWM15T001', description: '110kW turbocharged engine, GW4B15A code', notes: 'Third gen H6, 2021+' }),
    p(havalH6.id, catEngine.id, { name: '2.0T GW4C20 Engine Assembly', nameZh: '2.0T GW4C20发动机总成', oemNumber: 'GW4C20-ASM', altNumbers: 'GWM20T001', description: '145kW 2.0T engine for top trims' }),
    p(havalH6.id, catEngine.id, { name: 'Oil Filter Spin-On', nameZh: '机油滤清器', oemNumber: 'GWM-H6-OFL-001', altNumbers: '2805100XKZ16A', description: 'Spin-on oil filter for GW4B15A/GW4C20' }),
    p(havalH6.id, catEngine.id, { name: 'Air Mass Sensor MAF', nameZh: '空气流量传感器', oemNumber: 'GWM-H6-MAF-001', altNumbers: 'BOSCH0280218243', description: 'Hot-wire MAF sensor for 1.5T/2.0T', notes: 'Common fault causing P0101' }),
    p(havalH6.id, catTrans.id, { name: '7DCT Transmission Assembly', nameZh: '7速双离合变速箱总成', oemNumber: 'GWM-H6-DCT-001', altNumbers: 'GETRAG7DCT300GW', description: 'GETRAG/GW 7-speed wet DCT' }),
    p(havalH6.id, catBrakes.id, { name: 'Front Brake Disc 330mm', nameZh: '前刹车盘330mm', oemNumber: 'GWM-H6-BDF-001', altNumbers: 'BD330X28GWM', description: 'Vented front disc 330mm', material: 'Cast iron' }),
    p(havalH6.id, catBrakes.id, { name: 'Rear Brake Disc 320mm', nameZh: '后刹车盘320mm', oemNumber: 'GWM-H6-BDR-001', altNumbers: 'BD320X14GWM', description: 'Solid rear disc 320mm', material: 'Cast iron' }),
    p(havalH6.id, catSusp.id, { name: 'Front Coil Spring', nameZh: '前弹簧', oemNumber: 'GWM-H6-FCS-001', altNumbers: '2905010XKZ16A', description: 'Front MacPherson coil spring', position: 'Front' }),
    p(havalH6.id, catSusp.id, { name: 'Rear Shock Absorber', nameZh: '后减振器', oemNumber: 'GWM-H6-RSA-001', altNumbers: 'KYB341826', description: 'Rear multi-link shock absorber', position: 'Rear left/right' }),
    p(havalH6.id, catCool.id, { name: 'Coolant Radiator', nameZh: '冷却液散热器', oemNumber: 'GWM-H6-RAD-001', altNumbers: '1301100XKZ16A', description: 'Engine coolant radiator, aluminium core', material: 'Aluminium' }),
    p(havalH6.id, catElec.id, { name: 'Alternator 140A', nameZh: '发电机140A', oemNumber: 'GWM-H6-ALT-001', altNumbers: 'DENSO1022114800', description: '140A alternator, serpentine belt driven' }),
    p(havalH6.id, catBody.id, { name: 'Front Bumper Cover', nameZh: '前保险杠面罩', oemNumber: 'GWM-H6-FBC-001', altNumbers: '2803101XKZ16A', description: 'Front bumper fascia with PDC holes' }),

    // ── Haval Jolion ──
    p(havalJolion.id, catEngine.id, { name: '1.5T GW4B15B Engine Assembly', nameZh: '1.5T GW4B15B发动机总成', oemNumber: 'GW4B15B-ASM', altNumbers: 'GWM-JOL-ENG001', description: '110kW 1.5T DHT hybrid-compatible engine' }),
    p(havalJolion.id, catTrans.id, { name: 'DHT Hybrid Transmission', nameZh: 'DHT混动变速箱', oemNumber: 'GWM-JOL-DHT-001', description: 'GW DHT Pro hybrid transmission with integrated motor' }),
    p(havalJolion.id, catBrakes.id, { name: 'Front Brake Caliper Left', nameZh: '前刹车卡钳左', oemNumber: 'GWM-JOL-BCL-001', description: 'Single-piston sliding front caliper, left', position: 'Front left' }),
    p(havalJolion.id, catBrakes.id, { name: 'Front Brake Caliper Right', nameZh: '前刹车卡钳右', oemNumber: 'GWM-JOL-BCR-001', description: 'Single-piston sliding front caliper, right', position: 'Front right' }),
    p(havalJolion.id, catSusp.id, { name: 'Front Lower Control Arm Left', nameZh: '前下摆臂左', oemNumber: 'GWM-JOL-FLCA-L', altNumbers: '2904210XJZ16A', description: 'Front lower control arm with bushing, left', position: 'Front left' }),

    // ── Changan CS75 Plus ──
    p(cs75.id, catEngine.id, { name: 'BPCA 1.5T Engine Assembly', nameZh: '1.5T蓝鲸发动机总成', oemNumber: 'BPCA-15T-ASM', altNumbers: 'CA-BLUE-WHALE15', description: '138kW Blue Whale 1.5T engine, BPCA code' }),
    p(cs75.id, catEngine.id, { name: 'SQRM 2.0T Engine Assembly', nameZh: '2.0T蓝鲸发动机总成', oemNumber: 'SQRM-20T-ASM', altNumbers: 'CA-BLUE-WHALE20', description: '171kW Blue Whale 2.0T for top trims' }),
    p(cs75.id, catEngine.id, { name: 'Engine Oil Filter 1.5T', nameZh: '机油滤清器1.5T', oemNumber: 'CA-CS75-OFL-001', altNumbers: 'SF-CH10001CA', description: 'Cartridge oil filter, 1.5T Blue Whale', notes: 'Requires filter housing socket tool' }),
    p(cs75.id, catTrans.id, { name: '8AT Automatic Gearbox', nameZh: '8速自动变速箱', oemNumber: 'CA-CS75-8AT-001', altNumbers: 'AISIN8AT-CA75P', description: 'Aisin 8-speed automatic transmission' }),
    p(cs75.id, catBrakes.id, { name: 'Front Brake Pad Set', nameZh: '前刹车片套装', oemNumber: 'CA-CS75-BPF-001', description: 'OEM ceramic front brake pads, 4 pieces' }),
    p(cs75.id, catBrakes.id, { name: 'Rear Brake Disc', nameZh: '后刹车盘', oemNumber: 'CA-CS75-BDR-001', description: 'Solid rear disc 280mm', material: 'Cast iron' }),
    p(cs75.id, catSusp.id, { name: 'Front Shock Absorber', nameZh: '前减振器', oemNumber: 'CA-CS75-FSA-001', altNumbers: 'SACHS290838', description: 'Gas-pressure front strut shock', position: 'Front' }),
    p(cs75.id, catCool.id, { name: 'Water Pump Assembly', nameZh: '水泵总成', oemNumber: 'CA-CS75-WP-001', altNumbers: 'GMB GWC-89A', description: 'Mechanical water pump with gasket' }),
    p(cs75.id, catElec.id, { name: 'Throttle Body Assembly', nameZh: '节气门总成', oemNumber: 'CA-CS75-TB-001', altNumbers: 'BOSCH0280750554', description: 'Electronic throttle body 60mm bore', notes: 'Clean every 40,000km' }),

    // ── Changan Alsvin ──
    p(alsvin.id, catEngine.id, { name: '1.4T Engine SQRB', nameZh: '1.4T发动机SQRB', oemNumber: 'SQRB-14T-ASM', description: '116kW 1.4T turbocharged engine, Alsvin/Eado' }),
    p(alsvin.id, catEngine.id, { name: 'Timing Chain Kit 1.4T', nameZh: '正时链条套装1.4T', oemNumber: 'CA-ALS-TCK-001', description: 'Chain, tensioner, guide rails, complete kit' }),
    p(alsvin.id, catBrakes.id, { name: 'Front Disc Brake Set', nameZh: '前碟刹套装', oemNumber: 'CA-ALS-FBK-001', description: 'Front disc 280mm + brake pads', position: 'Front axle' }),
    p(alsvin.id, catSusp.id, { name: 'Front Wheel Bearing Hub', nameZh: '前轮毂轴承', oemNumber: 'CA-ALS-FWB-001', altNumbers: 'SKF VKBA3920', description: 'Front wheel bearing hub unit, sealed', position: 'Front left/right' }),
    p(alsvin.id, catSteer.id, { name: 'Power Steering Rack', nameZh: '电动转向机总成', oemNumber: 'CA-ALS-PSR-001', description: 'Electric power steering rack, complete assembly' }),

    // ── Chery Tiggo 8 Pro ──
    p(tiggo8.id, catEngine.id, { name: 'ACTECO 1.6T Engine Assembly', nameZh: '1.6T发动机总成', oemNumber: 'SQRE4T16C-ASM', altNumbers: 'CHERY16T001', description: '145kW ACTECO 1.6T TGDI engine, T19 platform' }),
    p(tiggo8.id, catEngine.id, { name: 'ACTECO 2.0T Engine Assembly', nameZh: '2.0T发动机总成', oemNumber: 'SQRF4J20-ASM', altNumbers: 'CHERY20T001', description: '187kW ACTECO 2.0T for Pro Max trim' }),
    p(tiggo8.id, catEngine.id, { name: 'Serpentine Belt', nameZh: '发动机多楔带', oemNumber: 'CHERY-T19-SB-001', altNumbers: 'GATES6PK1750', description: '6-rib serpentine drive belt 1.6T/2.0T', notes: 'Inspect at 60,000km, replace at 100,000km' }),
    p(tiggo8.id, catTrans.id, { name: '7DCT Transmission Assembly', nameZh: '7速双离合变速箱', oemNumber: 'CHERY-T19-DCT-001', altNumbers: 'GETRAG7HDT450', description: 'GETRAG 7-speed wet DCT, Tiggo 8 Pro' }),
    p(tiggo8.id, catBrakes.id, { name: 'Front Brake Disc 340mm', nameZh: '前刹车盘340mm', oemNumber: 'CHERY-T19-BDF-001', altNumbers: 'BD340X30CHR', description: 'Ventilated front disc 340mm', material: 'Cast iron' }),
    p(tiggo8.id, catBrakes.id, { name: 'Rear Brake Disc 320mm', nameZh: '后刹车盘320mm', oemNumber: 'CHERY-T19-BDR-001', description: 'Solid rear disc 320mm', material: 'Cast iron' }),
    p(tiggo8.id, catSusp.id, { name: 'Front Coilover Spring', nameZh: '前减振弹簧一体', oemNumber: 'CHERY-T19-FCO-001', description: 'Front coilover assembly, sport tuned', position: 'Front' }),
    p(tiggo8.id, catSusp.id, { name: 'Rear Lateral Link', nameZh: '后横拉杆', oemNumber: 'CHERY-T19-RLL-001', description: 'Rear multi-link lateral arm', position: 'Rear' }),
    p(tiggo8.id, catCool.id, { name: 'Intercooler Assembly', nameZh: '中冷器总成', oemNumber: 'CHERY-T19-IC-001', description: 'Front-mounted intercooler for 1.6T/2.0T' }),
    p(tiggo8.id, catElec.id, { name: 'Alternator 120A', nameZh: '发电机120A', oemNumber: 'CHERY-T19-ALT-001', altNumbers: 'VALEO437601', description: '120A alternator, T19 platform' }),
    p(tiggo8.id, catBody.id, { name: 'Front Door Assembly Left', nameZh: '左前车门总成', oemNumber: 'CHERY-T19-FDL-001', description: 'Complete front left door shell with hinges' }),

    // ── Chery Arrizo 6 ──
    p(arrizo6.id, catEngine.id, { name: 'ACTECO 1.5T Engine Assembly', nameZh: '1.5T发动机总成', oemNumber: 'SQRE4T15C-ASM', altNumbers: 'CHERY15T001', description: '108kW 1.5T ACTECO engine, Arrizo 6 sedan' }),
    p(arrizo6.id, catEngine.id, { name: 'Fuel Injectors Set (4pcs)', nameZh: '喷油嘴套装4支', oemNumber: 'CHERY-A19-FI-004', altNumbers: 'BOSCH0445110XXX', description: 'Direct injection fuel injectors, set of 4' }),
    p(arrizo6.id, catBrakes.id, { name: 'Rear Drum Brake Kit', nameZh: '后鼓刹套装', oemNumber: 'CHERY-A19-RDK-001', description: 'Rear drum, shoes, cylinders, spring kit' }),
    p(arrizo6.id, catSusp.id, { name: 'Rear Torsion Beam Assembly', nameZh: '后扭力梁总成', oemNumber: 'CHERY-A19-RTB-001', description: 'Complete rear torsion beam axle assembly' }),

    // ── MG ZS ──
    p(mgZS.id, catEngine.id, { name: '1.5L Engine 15S4U Assembly', nameZh: '1.5L发动机15S4U总成', oemNumber: 'MG-ZS-ENG15-001', altNumbers: 'SAIC15NA001', description: '82kW naturally aspirated 1.5L VTI engine' }),
    p(mgZS.id, catEngine.id, { name: '1.3T Engine 13PTD Assembly', nameZh: '1.3T发动机13PTD总成', oemNumber: 'MG-ZS-ENG13T-001', altNumbers: 'SAIC13T001', description: '102kW 1.3T turbocharged engine, top trim' }),
    p(mgZS.id, catEngine.id, { name: 'Oil Filter 1.5L', nameZh: '机油滤清器1.5L', oemNumber: 'MG-ZS-OFL-001', altNumbers: 'MANN W7-14', description: 'Spin-on oil filter for 1.5L engine' }),
    p(mgZS.id, catEngine.id, { name: 'Air Filter 1.5L', nameZh: '空气滤清器1.5L', oemNumber: 'MG-ZS-AF-001', altNumbers: 'MANN C27009', description: 'Rectangular panel air filter' }),
    p(mgZS.id, catBrakes.id, { name: 'Front Brake Disc 280mm', nameZh: '前刹车盘280mm', oemNumber: 'MG-ZS-BDF-001', altNumbers: 'BD280X22MG', description: 'Ventilated front disc 280mm', material: 'Cast iron' }),
    p(mgZS.id, catBrakes.id, { name: 'Rear Brake Drum 230mm', nameZh: '后刹车鼓230mm', oemNumber: 'MG-ZS-BDR-001', description: 'Rear drum brake 230mm diameter' }),
    p(mgZS.id, catSusp.id, { name: 'Front Strut Mount', nameZh: '前减振器上支座', oemNumber: 'MG-ZS-FSM-001', altNumbers: '30000834', description: 'MacPherson strut top mount bearing', position: 'Front' }),
    p(mgZS.id, catSusp.id, { name: 'Front Lower Ball Joint', nameZh: '前下球头', oemNumber: 'MG-ZS-FBJ-001', altNumbers: '30009765', description: 'Front lower control arm ball joint', position: 'Front left/right' }),
    p(mgZS.id, catTrans.id, { name: 'CVT Transmission Assembly', nameZh: 'CVT无级变速箱', oemNumber: 'MG-ZS-CVT-001', altNumbers: 'AISIN CVT-MG001', description: 'Aisin continuous variable transmission, 1.5L' }),
    p(mgZS.id, catElec.id, { name: 'Starter Motor', nameZh: '起动机', oemNumber: 'MG-ZS-STM-001', altNumbers: 'DENSO281001000MG', description: '1.2kW starter motor, petrol models' }),
    p(mgZS.id, catCool.id, { name: 'Water Pump & Thermostat Kit', nameZh: '水泵节温器套装', oemNumber: 'MG-ZS-WPT-001', description: 'Water pump and 88°C thermostat combo kit' }),
    p(mgZS.id, catBody.id, { name: 'Front Grille Assembly', nameZh: '前格栅总成', oemNumber: 'MG-ZS-FG-001', altNumbers: '30036491', description: 'Front grille with MG badge' }),

    // ── MG5 ──
    p(mg5.id, catEngine.id, { name: '1.5T Engine 15E4D Assembly', nameZh: '1.5T发动机15E4D', oemNumber: 'MG5-ENG15T-001', altNumbers: 'SAIC15TF001', description: '115kW 1.5T turbocharged engine, MG5 sedan' }),
    p(mg5.id, catBrakes.id, { name: 'Front Brake Pad Set', nameZh: '前刹车片套装', oemNumber: 'MG5-BPF-001', description: 'OEM front brake pads, 4pcs' }),
    p(mg5.id, catSusp.id, { name: 'Front Shock Absorber', nameZh: '前减振器', oemNumber: 'MG5-FSA-001', altNumbers: 'KYB3410MG5', description: 'Front MacPherson strut, gas filled', position: 'Front' }),
    p(mg5.id, catSteer.id, { name: 'Steering Rack Assembly', nameZh: '转向机总成', oemNumber: 'MG5-SR-001', description: 'Electric power steering rack, MG5' }),

    // ── GAC Aion S ──
    p(aionS.id, catElec.id, { name: '70kWh NMC Battery Pack', nameZh: '70kWh三元锂电池组', oemNumber: 'GAC-AS-BAT-001', altNumbers: 'CATL-AIONS-70', description: '70kWh NMC battery by CATL, long range version', position: 'Underfloor' }),
    p(aionS.id, catElec.id, { name: 'Drive Motor 135kW', nameZh: '驱动电机135kW', oemNumber: 'GAC-AS-MTR-001', description: '135kW permanent magnet motor', position: 'Front axle' }),
    p(aionS.id, catElec.id, { name: 'PDU Power Distribution Unit', nameZh: '高压配电盒', oemNumber: 'GAC-AS-PDU-001', description: 'High-voltage power distribution unit', position: 'Engine bay' }),
    p(aionS.id, catBrakes.id, { name: 'Front Brake Caliper Assembly', nameZh: '前卡钳总成', oemNumber: 'GAC-AS-BCA-F01', description: 'Brembo-spec 2-piston front caliper', position: 'Front' }),
    p(aionS.id, catSusp.id, { name: 'Rear Multi-Link Control Arm Set', nameZh: '后多连杆摆臂套装', oemNumber: 'GAC-AS-RMCA-001', description: 'Full rear multi-link arm set, 5 links', position: 'Rear' }),
    p(aionS.id, catCool.id, { name: 'Battery Liquid Cooling Plate', nameZh: '电池液冷板', oemNumber: 'GAC-AS-BCP-001', description: 'Serpentine coolant plate for battery pack', material: 'Aluminium alloy' }),

    // ── Great Wall Poer Pickup ──
    p(poer.id, catEngine.id, { name: '2.0T Diesel GW4D20 Engine', nameZh: '2.0T柴油GW4D20发动机', oemNumber: 'GW4D20-ASM', altNumbers: 'GWM-POER-DSL001', description: '120kW turbocharged diesel, Euro 5/6' }),
    p(poer.id, catEngine.id, { name: 'Diesel Fuel Filter', nameZh: '柴油滤清器', oemNumber: 'GWM-POER-DFF-001', altNumbers: '1117100XEC08A', description: 'Primary fuel filter with water separator', notes: 'Drain water separator every 5,000km' }),
    p(poer.id, catEngine.id, { name: 'Turbocharger Assembly GT1749V', nameZh: '涡轮增压器总成', oemNumber: 'GWM-POER-TC-001', altNumbers: 'GARRETT853227-5005S', description: 'Variable geometry turbocharger, GW4D20' }),
    p(poer.id, catTrans.id, { name: '6-Speed Manual Gearbox', nameZh: '6速手动变速箱', oemNumber: 'GWM-POER-6MT-001', description: '6MT transmission for Poer 4WD' }),
    p(poer.id, catTrans.id, { name: 'Rear Differential Assembly', nameZh: '后差速器总成', oemNumber: 'GWM-POER-RDA-001', description: 'Rear locking differential for 4WD system' }),
    p(poer.id, catBrakes.id, { name: 'Rear Disc Brake Conversion Kit', nameZh: '后盘刹改装套装', oemNumber: 'GWM-POER-RDK-001', description: 'Disc conversion for rear drum-equipped variants' }),
    p(poer.id, catSusp.id, { name: 'Front Leaf Spring', nameZh: '前钢板弹簧', oemNumber: 'GWM-POER-FLS-001', description: 'Front semi-elliptical leaf spring pack', position: 'Front' }),
    p(poer.id, catSusp.id, { name: 'Rear Leaf Spring Assembly', nameZh: '后钢板弹簧总成', oemNumber: 'GWM-POER-RLS-001', description: 'Rear progressive leaf spring, 4-leaf pack', position: 'Rear' }),
    p(poer.id, catBody.id, { name: 'Rear Load Bed Liner', nameZh: '后货床衬垫', oemNumber: 'GWM-POER-BL-001', description: 'Polyethylene load bed liner, drop-in fit' }),
    p(poer.id, catExhaust.id, { name: 'DPF Diesel Particulate Filter', nameZh: '柴油颗粒捕集器', oemNumber: 'GWM-POER-DPF-001', altNumbers: 'CORDIERITE-GW4D20', description: 'Euro 6 DPF, requires forced regen at 150,000km' }),
  ])

  console.log('✅ Seed complete — brands, vehicles and parts loaded.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
