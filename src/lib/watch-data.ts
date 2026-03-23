// Watch reference data — $500-$7,000 price range across all brands
// Real scraping sources can be plugged in to replace this seed data.

export interface WatchReference {
  brand: string;
  model: string;
  reference: string;
  marketPrice: number;
  imageUrl?: string;
}

export const WATCH_DATABASE: WatchReference[] = [
  // Omega
  { brand: 'Omega', model: 'Speedmaster Moonwatch (Pre-Owned)', reference: '311.30.42.30.01.005', marketPrice: 4800 },
  { brand: 'Omega', model: 'Seamaster 300M (Black)', reference: '210.30.42.20.01.001', marketPrice: 4500 },
  { brand: 'Omega', model: 'Seamaster 300M (Blue)', reference: '210.30.42.20.03.001', marketPrice: 4700 },
  { brand: 'Omega', model: 'Aqua Terra 150M (Blue)', reference: '220.10.41.21.03.001', marketPrice: 4200 },
  { brand: 'Omega', model: 'Aqua Terra 150M (Green)', reference: '220.10.41.21.10.001', marketPrice: 4400 },
  { brand: 'Omega', model: 'Seamaster Planet Ocean 600M', reference: '215.30.44.21.01.001', marketPrice: 5200 },
  { brand: 'Omega', model: 'Constellation 41mm', reference: '131.10.41.21.03.001', marketPrice: 4800 },
  { brand: 'Omega', model: 'De Ville Prestige', reference: '424.10.40.20.03.001', marketPrice: 2800 },
  { brand: 'Omega', model: 'Speedmaster Racing', reference: '329.30.44.51.01.002', marketPrice: 5500 },

  // Tudor
  { brand: 'Tudor', model: 'Black Bay 58', reference: '79030N', marketPrice: 3600 },
  { brand: 'Tudor', model: 'Black Bay 58 (Blue)', reference: '79030B', marketPrice: 3400 },
  { brand: 'Tudor', model: 'Black Bay 58 (925 Silver)', reference: '79010SG', marketPrice: 3900 },
  { brand: 'Tudor', model: 'Black Bay Chrono', reference: '79360N', marketPrice: 4500 },
  { brand: 'Tudor', model: 'Black Bay GMT', reference: '79830RB', marketPrice: 3800 },
  { brand: 'Tudor', model: 'Pelagos 39', reference: '25407N', marketPrice: 4200 },
  { brand: 'Tudor', model: 'Ranger', reference: '79950', marketPrice: 2600 },
  { brand: 'Tudor', model: 'Black Bay 41', reference: '79540', marketPrice: 2400 },
  { brand: 'Tudor', model: 'Royal 41mm', reference: '28600', marketPrice: 1800 },
  { brand: 'Tudor', model: 'Black Bay Pro', reference: '79470', marketPrice: 3200 },

  // Cartier
  { brand: 'Cartier', model: 'Tank Must (Large)', reference: 'WSTA0065', marketPrice: 3000 },
  { brand: 'Cartier', model: 'Santos Medium', reference: 'WSSA0029', marketPrice: 6500 },
  { brand: 'Cartier', model: 'Tank Must (Small)', reference: 'WSTA0042', marketPrice: 2600 },
  { brand: 'Cartier', model: 'Santos-Dumont Large', reference: 'WSSA0022', marketPrice: 4200 },

  // IWC
  { brand: 'IWC', model: 'Pilot Mark XX', reference: 'IW328203', marketPrice: 3900 },
  { brand: 'IWC', model: 'Pilot Automatic 36', reference: 'IW324008', marketPrice: 3400 },
  { brand: 'IWC', model: 'Portugieser Auto 40', reference: 'IW358303', marketPrice: 6800 },

  // Breitling
  { brand: 'Breitling', model: 'Superocean Heritage 42', reference: 'AB2030121B1S1', marketPrice: 3800 },
  { brand: 'Breitling', model: 'Navitimer B01 Chrono 43', reference: 'AB0138211B1A1', marketPrice: 6800 },
  { brand: 'Breitling', model: 'Avenger Chrono 44', reference: 'A13317101B1A1', marketPrice: 4800 },
  { brand: 'Breitling', model: 'Superocean Auto 42', reference: 'A17375E71G1S1', marketPrice: 3200 },
  { brand: 'Breitling', model: 'Chronomat Auto 36', reference: 'A10380101A2A1', marketPrice: 4200 },

  // TAG Heuer
  { brand: 'TAG Heuer', model: 'Carrera Chrono', reference: 'CBS2210.FC6534', marketPrice: 4800 },
  { brand: 'TAG Heuer', model: 'Monaco', reference: 'CBL2111.FC6453', marketPrice: 5400 },
  { brand: 'TAG Heuer', model: 'Aquaracer Professional 300', reference: 'WBP201A.FT6197', marketPrice: 2400 },
  { brand: 'TAG Heuer', model: 'Carrera Day-Date 41', reference: 'WBN2012.BA0640', marketPrice: 2200 },
  { brand: 'TAG Heuer', model: 'Formula 1 Chrono', reference: 'CAZ2010.BA0876', marketPrice: 1400 },

  // Longines
  { brand: 'Longines', model: 'Spirit Zulu Time', reference: 'L3.812.4.63.6', marketPrice: 2600 },
  { brand: 'Longines', model: 'HydroConquest 41mm', reference: 'L3.781.4.96.9', marketPrice: 1200 },
  { brand: 'Longines', model: 'Spirit 40mm', reference: 'L3.810.4.93.6', marketPrice: 1800 },
  { brand: 'Longines', model: 'Master Collection Moonphase', reference: 'L2.909.4.78.3', marketPrice: 2200 },
  { brand: 'Longines', model: 'Legend Diver', reference: 'L3.774.4.90.2', marketPrice: 2000 },

  // Oris
  { brand: 'Oris', model: 'Aquis Date 41.5mm', reference: '01-733-7766-4150', marketPrice: 1600 },
  { brand: 'Oris', model: 'Big Crown Pointer Date', reference: '01-754-7741-4065', marketPrice: 1400 },
  { brand: 'Oris', model: 'Divers Sixty-Five', reference: '01-733-7707-4064', marketPrice: 1800 },
  { brand: 'Oris', model: 'ProPilot X Calibre 400', reference: '01-400-7778-7153', marketPrice: 3200 },
  { brand: 'Oris', model: 'Aquis Date Upcycle 41.5mm', reference: '01-733-7766-4150-UP', marketPrice: 1800 },

  // Hamilton
  { brand: 'Hamilton', model: 'Khaki Field Mechanical', reference: 'H69439931', marketPrice: 500 },
  { brand: 'Hamilton', model: 'Khaki Aviation Pilot Auto', reference: 'H64715135', marketPrice: 800 },
  { brand: 'Hamilton', model: 'Intra-Matic Auto Chrono', reference: 'H38416711', marketPrice: 1800 },
  { brand: 'Hamilton', model: 'Jazzmaster Open Heart', reference: 'H32215890', marketPrice: 900 },
  { brand: 'Hamilton', model: 'Khaki Field Auto 38mm', reference: 'H70455533', marketPrice: 600 },
  { brand: 'Hamilton', model: 'Ventura Auto', reference: 'H24515591', marketPrice: 1000 },

  // Tissot
  { brand: 'Tissot', model: 'PRX Powermatic 80', reference: 'T137.407.11.041.00', marketPrice: 600 },
  { brand: 'Tissot', model: 'PRX Chrono', reference: 'T137.427.11.011.00', marketPrice: 1200 },
  { brand: 'Tissot', model: 'Gentleman Powermatic 80', reference: 'T127.407.16.031.01', marketPrice: 550 },
  { brand: 'Tissot', model: 'Seastar 1000 Powermatic 80', reference: 'T120.407.11.041.03', marketPrice: 700 },
  { brand: 'Tissot', model: 'PRX 40 205 (Green)', reference: 'T137.407.11.091.01', marketPrice: 600 },

  // Seiko
  { brand: 'Seiko', model: 'Presage Sharp Edged', reference: 'SPB167J1', marketPrice: 800 },
  { brand: 'Seiko', model: 'Prospex Alpinist', reference: 'SPB117J1', marketPrice: 600 },
  { brand: 'Seiko', model: 'Prospex Turtle', reference: 'SRPE93K1', marketPrice: 500 },
  { brand: 'Seiko', model: 'Presage Cocktail Time', reference: 'SRPB41J1', marketPrice: 550 },
  { brand: 'Seiko', model: 'Prospex Samurai', reference: 'SRPD23K1', marketPrice: 500 },

  // Grand Seiko
  { brand: 'Grand Seiko', model: 'Heritage GMT', reference: 'SBGM221', marketPrice: 3500 },
  { brand: 'Grand Seiko', model: 'Snowflake', reference: 'SBGA211', marketPrice: 4800 },
  { brand: 'Grand Seiko', model: 'Elegance', reference: 'SBGK005', marketPrice: 3200 },
  { brand: 'Grand Seiko', model: 'Heritage Automatic', reference: 'SBGR261', marketPrice: 2800 },

  // Sinn
  { brand: 'Sinn', model: '556 I', reference: '556.010', marketPrice: 1400 },
  { brand: 'Sinn', model: '104 St Sa A', reference: '104.011', marketPrice: 1800 },
  { brand: 'Sinn', model: 'U50', reference: '1050.010', marketPrice: 2800 },
  { brand: 'Sinn', model: '356 Pilot Chrono', reference: '356.022', marketPrice: 2200 },

  // Nomos
  { brand: 'Nomos', model: 'Tangente 35', reference: '139', marketPrice: 1600 },
  { brand: 'Nomos', model: 'Club Campus 36', reference: '708', marketPrice: 1200 },
  { brand: 'Nomos', model: 'Orion 33', reference: '324', marketPrice: 1800 },
  { brand: 'Nomos', model: 'Ahoi Atlantik', reference: '552', marketPrice: 3200 },

  // Zenith
  { brand: 'Zenith', model: 'Defy Skyline', reference: '03.9300.3620/51.I001', marketPrice: 6200 },
  { brand: 'Zenith', model: 'Pilot Type 20 Chrono', reference: '29.2430.4069/21.C800', marketPrice: 5400 },

  // Panerai
  { brand: 'Panerai', model: 'Luminor Marina 44mm', reference: 'PAM01312', marketPrice: 4800 },
  { brand: 'Panerai', model: 'Luminor Due 38mm', reference: 'PAM00926', marketPrice: 5200 },
  { brand: 'Panerai', model: 'Luminor Base Logo', reference: 'PAM00774', marketPrice: 3800 },

  // Hublot
  { brand: 'Hublot', model: 'Classic Fusion 42mm (Pre-Owned)', reference: '542.NX.1171.RX', marketPrice: 5800 },

  // Chopard
  { brand: 'Chopard', model: 'L.U.C XP (Pre-Owned)', reference: '168592-3001', marketPrice: 6500 },

  // Bell & Ross
  { brand: 'Bell & Ross', model: 'BR 05 (Blue)', reference: 'BR05A-BLU-ST/SST', marketPrice: 3400 },
  { brand: 'Bell & Ross', model: 'BR V2-92 Steel', reference: 'BRV292-BL-ST/SST', marketPrice: 2600 },

  // Rado
  { brand: 'Rado', model: 'Captain Cook Auto', reference: 'R32505203', marketPrice: 1600 },
  { brand: 'Rado', model: 'DiaStar Original', reference: 'R12160303', marketPrice: 1800 },

  // Frederique Constant
  { brand: 'Frederique Constant', model: 'Slimline Moonphase', reference: 'FC-705S4S6', marketPrice: 1400 },
  { brand: 'Frederique Constant', model: 'Classics Index Auto', reference: 'FC-303S5B6', marketPrice: 800 },

  // Junghans
  { brand: 'Junghans', model: 'Max Bill Automatic', reference: '027/3501.04', marketPrice: 1000 },
  { brand: 'Junghans', model: 'Meister Pilot Chrono', reference: '027/3684.44', marketPrice: 1600 },

  // Mido
  { brand: 'Mido', model: 'Ocean Star 200', reference: 'M026.430.11.041.00', marketPrice: 800 },
  { brand: 'Mido', model: 'Baroncelli Heritage', reference: 'M027.407.16.010.00', marketPrice: 700 },

  // Certina
  { brand: 'Certina', model: 'DS Action Diver', reference: 'C032.407.11.051.00', marketPrice: 600 },

  // Glashutte Original
  { brand: 'Glashutte Original', model: 'Senator Excellence (Pre-Owned)', reference: '1-36-01-01-02-70', marketPrice: 6800 },

  // Maurice Lacroix
  { brand: 'Maurice Lacroix', model: 'Aikon Automatic', reference: 'AI6008-SS002-430-1', marketPrice: 1400 },

  // Baume & Mercier
  { brand: 'Baume & Mercier', model: 'Riviera Auto', reference: 'M0A10620', marketPrice: 2800 },
];

export const PRICE_MIN = 500;
export const PRICE_MAX = 50000;

// Simulated listing sources
const LISTING_SOURCES = ['Chrono24', 'eBay', 'WatchBox', 'Crown & Caliber', 'Hodinkee Shop', "Bob's Watches"];
const CONDITIONS = ['Unworn', 'Very Good', 'Good', 'Fair', 'New (Sealed)'];
const SELLERS = ['LuxWatch_NYC', 'TimeVault_CH', 'PrecisionWatches', 'WristReality', 'ChronoDealer_EU', 'AuthenticTimeCo', 'WatchCapital', 'DialTrade', 'SwissCollector', 'TempusFugit'];

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function getSourceUrl(source: string, brand: string, model: string, reference: string): string {
  const query = encodeURIComponent(`${brand} ${model} ${reference}`);
  const searchTerm = encodeURIComponent(`${brand} ${model}`);
  switch (source) {
    case 'Chrono24':
      return `https://www.chrono24.com/search/index.htm?query=${query}&dosearch=true`;
    case 'eBay':
      return `https://www.ebay.com/sch/i.html?_nkw=${query}&_sacat=31387`;
    case 'WatchBox':
      return `https://www.thewatchbox.com/search/?q=${searchTerm}`;
    case 'Crown & Caliber':
      return `https://www.crownandcaliber.com/search?q=${searchTerm}`;
    case 'Hodinkee Shop':
      return `https://shop.hodinkee.com/search?type=product&q=${searchTerm}`;
    case "Bob's Watches":
      return `https://www.bobswatches.com/search?q=${searchTerm}`;
    default:
      return `https://www.chrono24.com/search/index.htm?query=${query}&dosearch=true`;
  }
}

export function generateListings(watch: WatchReference, count: number = 3) {
  const listings = [];
  for (let i = 0; i < count; i++) {
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

    let price = Math.round(watch.marketPrice * priceMult / 50) * 50;
    if (price < 100) price = 100;

    const source = LISTING_SOURCES[randomBetween(0, LISTING_SOURCES.length - 1)];
    const daysAgo = randomBetween(0, 30);

    listings.push({
      source,
      title: `${watch.brand} ${watch.model} Ref. ${watch.reference}`,
      price,
      url: getSourceUrl(source, watch.brand, watch.model, watch.reference),
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
    price = Math.round(price * (1 + change) / 50) * 50;
    if (price < 100) price = 100;

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
      price: Math.round(marketPrice * priceMult / 50) * 50,
      source: Math.random() > 0.5 ? 'eBay' : 'Chrono24',
      soldDate: new Date(Date.now() - daysAgo * 86400000),
      condition: CONDITIONS[randomBetween(0, CONDITIONS.length - 1)],
    });
  }
  return records;
}
