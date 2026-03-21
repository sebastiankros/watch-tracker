// Comprehensive luxury watch reference data with realistic market prices
// This serves as the base data layer. Real scraping sources can be plugged in.

export interface WatchReference {
  brand: string;
  model: string;
  reference: string;
  marketPrice: number;
  imageUrl?: string;
}

export const WATCH_DATABASE: WatchReference[] = [
  // Rolex
  { brand: 'Rolex', model: 'Submariner Date', reference: '126610LN', marketPrice: 14500 },
  { brand: 'Rolex', model: 'Submariner Date (Hulk)', reference: '116610LV', marketPrice: 19800 },
  { brand: 'Rolex', model: 'Submariner No Date', reference: '124060', marketPrice: 12200 },
  { brand: 'Rolex', model: 'GMT-Master II (Pepsi)', reference: '126710BLRO', marketPrice: 19500 },
  { brand: 'Rolex', model: 'GMT-Master II (Batman)', reference: '126710BLNR', marketPrice: 17800 },
  { brand: 'Rolex', model: 'GMT-Master II (Rootbeer)', reference: '126711CHNR', marketPrice: 21500 },
  { brand: 'Rolex', model: 'Daytona (White Dial)', reference: '116500LN', marketPrice: 28500 },
  { brand: 'Rolex', model: 'Daytona (Black Dial)', reference: '116500LN-BLK', marketPrice: 26000 },
  { brand: 'Rolex', model: 'Daytona (Panda)', reference: '126500LN', marketPrice: 31000 },
  { brand: 'Rolex', model: 'Datejust 41 (Blue)', reference: '126334', marketPrice: 12800 },
  { brand: 'Rolex', model: 'Datejust 41 (Wimbledon)', reference: '126334-WIMB', marketPrice: 13500 },
  { brand: 'Rolex', model: 'Datejust 36 (Green Palm)', reference: '126234-PALM', marketPrice: 12000 },
  { brand: 'Rolex', model: 'Explorer I', reference: '124270', marketPrice: 9800 },
  { brand: 'Rolex', model: 'Explorer II (White)', reference: '226570', marketPrice: 11200 },
  { brand: 'Rolex', model: 'Explorer II (Black)', reference: '226570-BLK', marketPrice: 10800 },
  { brand: 'Rolex', model: 'Sea-Dweller', reference: '126600', marketPrice: 14200 },
  { brand: 'Rolex', model: 'Deepsea (D-Blue)', reference: '136660', marketPrice: 16500 },
  { brand: 'Rolex', model: 'Sky-Dweller (Blue)', reference: '326934', marketPrice: 24500 },
  { brand: 'Rolex', model: 'Yacht-Master 42 (Titanium)', reference: '226627', marketPrice: 22000 },
  { brand: 'Rolex', model: 'Air-King', reference: '126900', marketPrice: 9500 },
  { brand: 'Rolex', model: 'OP 41 (Tiffany Blue)', reference: '124300-TIFF', marketPrice: 32000 },
  { brand: 'Rolex', model: 'OP 36 (Green)', reference: '126000-GRN', marketPrice: 8200 },
  { brand: 'Rolex', model: 'Day-Date 40 (Green)', reference: '228235', marketPrice: 42000 },

  // Audemars Piguet
  { brand: 'Audemars Piguet', model: 'Royal Oak 41 (Blue)', reference: '15510ST.OO.1320ST.06', marketPrice: 38000 },
  { brand: 'Audemars Piguet', model: 'Royal Oak 41 (Black)', reference: '15510ST.OO.1320ST.03', marketPrice: 35000 },
  { brand: 'Audemars Piguet', model: 'Royal Oak 37 (Blue)', reference: '15550ST.OO.1356ST.04', marketPrice: 29000 },
  { brand: 'Audemars Piguet', model: 'Royal Oak Chrono (Blue)', reference: '26240ST.OO.1320ST.01', marketPrice: 52000 },
  { brand: 'Audemars Piguet', model: 'Royal Oak Offshore Chrono', reference: '26470ST.OO.A101CR.01', marketPrice: 28000 },
  { brand: 'Audemars Piguet', model: 'Royal Oak Offshore Diver', reference: '15710ST.OO.A002CA.01', marketPrice: 23000 },
  { brand: 'Audemars Piguet', model: 'Code 11.59 Chrono', reference: '26393OR.OO.A002KB.02', marketPrice: 32000 },

  // Patek Philippe
  { brand: 'Patek Philippe', model: 'Nautilus (Blue)', reference: '5811/1G-001', marketPrice: 125000 },
  { brand: 'Patek Philippe', model: 'Nautilus (Green)', reference: '5711/1A-014', marketPrice: 185000 },
  { brand: 'Patek Philippe', model: 'Nautilus Chrono', reference: '5980/1A-001', marketPrice: 95000 },
  { brand: 'Patek Philippe', model: 'Aquanaut', reference: '5167A-001', marketPrice: 48000 },
  { brand: 'Patek Philippe', model: 'Aquanaut Travel Time', reference: '5164A-001', marketPrice: 58000 },
  { brand: 'Patek Philippe', model: 'Calatrava', reference: '5227G-010', marketPrice: 35000 },
  { brand: 'Patek Philippe', model: 'Annual Calendar', reference: '5205R-010', marketPrice: 42000 },
  { brand: 'Patek Philippe', model: 'World Time', reference: '5231J-001', marketPrice: 55000 },

  // Omega
  { brand: 'Omega', model: 'Speedmaster Moonwatch', reference: '310.30.42.50.01.001', marketPrice: 6200 },
  { brand: 'Omega', model: 'Speedmaster \'57', reference: '332.10.41.51.01.001', marketPrice: 7800 },
  { brand: 'Omega', model: 'Seamaster 300M (Black)', reference: '210.30.42.20.01.001', marketPrice: 4800 },
  { brand: 'Omega', model: 'Seamaster 300M (Blue)', reference: '210.30.42.20.03.001', marketPrice: 5100 },
  { brand: 'Omega', model: 'Planet Ocean 600M', reference: '215.30.44.21.01.001', marketPrice: 5500 },
  { brand: 'Omega', model: 'Aqua Terra 150M', reference: '220.10.41.21.03.001', marketPrice: 4500 },
  { brand: 'Omega', model: 'Seamaster Ultra Deep', reference: '215.30.46.21.01.001', marketPrice: 10200 },
  { brand: 'Omega', model: 'Constellation 41mm', reference: '131.10.41.21.03.001', marketPrice: 5200 },

  // Tudor
  { brand: 'Tudor', model: 'Black Bay 58', reference: '79030N', marketPrice: 3800 },
  { brand: 'Tudor', model: 'Black Bay 58 (Blue)', reference: '79030B', marketPrice: 3600 },
  { brand: 'Tudor', model: 'Black Bay 58 (925)', reference: '79010SG', marketPrice: 4200 },
  { brand: 'Tudor', model: 'Black Bay Chrono', reference: '79360N', marketPrice: 4800 },
  { brand: 'Tudor', model: 'Black Bay GMT', reference: '79830RB', marketPrice: 4100 },
  { brand: 'Tudor', model: 'Pelagos 39', reference: '25407N', marketPrice: 4500 },
  { brand: 'Tudor', model: 'Ranger', reference: '79950', marketPrice: 2800 },

  // IWC
  { brand: 'IWC', model: 'Portugieser Chrono', reference: 'IW371605', marketPrice: 7500 },
  { brand: 'IWC', model: 'Pilot Mark XX', reference: 'IW328203', marketPrice: 4200 },
  { brand: 'IWC', model: 'Big Pilot 43', reference: 'IW329303', marketPrice: 8200 },
  { brand: 'IWC', model: 'Pilot Chrono Top Gun', reference: 'IW389101', marketPrice: 7800 },
  { brand: 'IWC', model: 'Aquatimer Chrono', reference: 'IW376804', marketPrice: 5800 },

  // Cartier
  { brand: 'Cartier', model: 'Santos Medium', reference: 'WSSA0029', marketPrice: 7200 },
  { brand: 'Cartier', model: 'Santos Large', reference: 'WSSA0018', marketPrice: 8500 },
  { brand: 'Cartier', model: 'Tank Must', reference: 'WSTA0065', marketPrice: 3200 },
  { brand: 'Cartier', model: 'Tank Française Medium', reference: 'WSTA0065-MED', marketPrice: 5800 },
  { brand: 'Cartier', model: 'Ballon Bleu 40mm', reference: 'WSBB0060', marketPrice: 6200 },

  // Jaeger-LeCoultre
  { brand: 'Jaeger-LeCoultre', model: 'Reverso Classic Medium', reference: 'Q2548520', marketPrice: 7800 },
  { brand: 'Jaeger-LeCoultre', model: 'Master Ultra Thin Moon', reference: 'Q1368420', marketPrice: 9500 },
  { brand: 'Jaeger-LeCoultre', model: 'Polaris Chrono', reference: 'Q9028471', marketPrice: 8800 },

  // Panerai
  { brand: 'Panerai', model: 'Luminor Marina', reference: 'PAM01312', marketPrice: 5200 },
  { brand: 'Panerai', model: 'Submersible', reference: 'PAM00973', marketPrice: 8500 },
  { brand: 'Panerai', model: 'Luminor Due 42mm', reference: 'PAM01046', marketPrice: 6800 },

  // Breitling
  { brand: 'Breitling', model: 'Navitimer B01 Chrono', reference: 'AB0138211B1A1', marketPrice: 7200 },
  { brand: 'Breitling', model: 'Superocean Heritage', reference: 'AB2030121B1S1', marketPrice: 4200 },
  { brand: 'Breitling', model: 'Chronomat B01 42', reference: 'AB0134101K1A1', marketPrice: 6800 },
  { brand: 'Breitling', model: 'Avenger Chrono 44', reference: 'A13317101B1A1', marketPrice: 5200 },

  // Grand Seiko
  { brand: 'Grand Seiko', model: 'Snowflake', reference: 'SBGA211', marketPrice: 5200 },
  { brand: 'Grand Seiko', model: 'White Birch', reference: 'SLGH005', marketPrice: 8800 },
  { brand: 'Grand Seiko', model: 'Heritage GMT', reference: 'SBGM221', marketPrice: 3800 },
  { brand: 'Grand Seiko', model: 'Spring Drive Chrono', reference: 'SBGC201', marketPrice: 7500 },

  // Vacheron Constantin
  { brand: 'Vacheron Constantin', model: 'Overseas 41mm (Blue)', reference: '4500V/110A-B128', marketPrice: 28000 },
  { brand: 'Vacheron Constantin', model: 'Overseas Chrono', reference: '5500V/110A-B481', marketPrice: 35000 },
  { brand: 'Vacheron Constantin', model: 'Patrimony', reference: '81180/000R-9159', marketPrice: 22000 },
  { brand: 'Vacheron Constantin', model: 'Fiftysi× (Blue)', reference: '4600E/000A-B487', marketPrice: 25000 },

  // A. Lange & Söhne
  { brand: 'A. Lange & Söhne', model: 'Lange 1', reference: '191.032', marketPrice: 32000 },
  { brand: 'A. Lange & Söhne', model: 'Saxonia Thin', reference: '211.032', marketPrice: 18000 },
  { brand: 'A. Lange & Söhne', model: 'Odysseus', reference: '363.068', marketPrice: 55000 },

  // Zenith
  { brand: 'Zenith', model: 'Chronomaster Sport', reference: '03.3100.3600/69.M3100', marketPrice: 8200 },
  { brand: 'Zenith', model: 'Defy Skyline', reference: '03.9300.3620/51.I001', marketPrice: 6500 },
  { brand: 'Zenith', model: 'Pilot Type 20 Chrono', reference: '29.2430.4069/21.C800', marketPrice: 5800 },

  // Hublot
  { brand: 'Hublot', model: 'Big Bang Unico', reference: '421.NM.1170.RX', marketPrice: 16000 },
  { brand: 'Hublot', model: 'Classic Fusion 42mm', reference: '542.NX.1171.RX', marketPrice: 6500 },
  { brand: 'Hublot', model: 'Spirit of Big Bang', reference: '641.NX.0173.LR', marketPrice: 14000 },

  // TAG Heuer
  { brand: 'TAG Heuer', model: 'Carrera Chrono', reference: 'CBS2210.FC6534', marketPrice: 5200 },
  { brand: 'TAG Heuer', model: 'Monaco', reference: 'CBL2111.FC6453', marketPrice: 5800 },
  { brand: 'TAG Heuer', model: 'Aquaracer Professional 300', reference: 'WBP201A.FT6197', marketPrice: 2800 },

  // Chopard
  { brand: 'Chopard', model: 'Alpine Eagle 41', reference: '298600-3001', marketPrice: 11500 },
  { brand: 'Chopard', model: 'Alpine Eagle XL Chrono', reference: '298609-3001', marketPrice: 14500 },
];

// Simulated listing sources
const LISTING_SOURCES = ['Chrono24', 'eBay', 'WatchBox', 'Crown & Caliber', 'Hodinkee Shop', 'Bob\'s Watches'];
const CONDITIONS = ['Unworn', 'Very Good', 'Good', 'Fair', 'New (Sealed)'];
const SELLERS = ['LuxWatch_NYC', 'TimeVault_CH', 'PrecisionWatches', 'WristReality', 'ChronoDealer_EU', 'AuthenticTimeCo', 'WatchCapital', 'DialTrade', 'SwissCollector', 'TempusFugit'];

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

export function generateListings(watch: WatchReference, count: number = 3) {
  const listings = [];
  for (let i = 0; i < count; i++) {
    // Most listings are near market, some are deals, some overpriced
    const discountRange = Math.random();
    let priceMult: number;
    if (discountRange < 0.15) {
      priceMult = randomFloat(0.78, 0.90); // Great deal
    } else if (discountRange < 0.35) {
      priceMult = randomFloat(0.90, 0.95); // Good deal
    } else if (discountRange < 0.65) {
      priceMult = randomFloat(0.95, 1.05); // Near market
    } else {
      priceMult = randomFloat(1.05, 1.15); // Overpriced
    }

    const price = Math.round(watch.marketPrice * priceMult / 100) * 100;
    const source = LISTING_SOURCES[randomBetween(0, LISTING_SOURCES.length - 1)];
    const daysAgo = randomBetween(0, 30);

    listings.push({
      source,
      title: `${watch.brand} ${watch.model} Ref. ${watch.reference}`,
      price,
      url: `https://${source.toLowerCase().replace(/[^a-z0-9]/g, '')}.com/listing/${watch.reference.toLowerCase()}-${randomBetween(10000, 99999)}`,
      seller: SELLERS[randomBetween(0, SELLERS.length - 1)],
      condition: CONDITIONS[randomBetween(0, CONDITIONS.length - 1)],
      listedDate: new Date(Date.now() - daysAgo * 86400000),
    });
  }
  return listings;
}

export function generatePriceHistory(marketPrice: number, days: number = 90) {
  const history = [];
  let price = marketPrice * randomFloat(0.92, 1.08);
  const sources = ['WatchCharts', 'Chrono24 Avg', 'eBay Sold Avg', 'WatchSignal'];

  for (let i = days; i >= 0; i--) {
    const change = randomFloat(-0.02, 0.02);
    price = Math.round(price * (1 + change) / 100) * 100;
    if (price < 1000) price = 1000;

    if (i % 3 === 0 || i === 0) {
      history.push({
        price,
        source: sources[randomBetween(0, sources.length - 1)],
        date: new Date(Date.now() - i * 86400000),
      });
    }
  }
  return history;
}

export function generateSoldRecords(reference: string, marketPrice: number, count: number = 5) {
  const records = [];
  for (let i = 0; i < count; i++) {
    const priceMult = randomFloat(0.88, 1.08);
    const daysAgo = randomBetween(1, 60);
    records.push({
      reference,
      price: Math.round(marketPrice * priceMult / 100) * 100,
      source: Math.random() > 0.5 ? 'eBay' : 'Chrono24',
      soldDate: new Date(Date.now() - daysAgo * 86400000),
      condition: CONDITIONS[randomBetween(0, CONDITIONS.length - 1)],
    });
  }
  return records;
}
