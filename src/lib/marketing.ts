import { formatPrice } from './utils';

export type Platform = 'instagram' | 'x' | 'whatsapp' | 'facebook';
export type PostType = 'deal' | 'spotlight' | 'educational' | 'newstock' | 'pricewatch';

interface WatchData {
  brand: string;
  model: string;
  reference?: string;
  marketPrice: number;
  listingPrice?: number;
  discount?: number;
  savings?: number;
  condition?: string;
  source?: string;
  url?: string;
  previousPrice?: number | null;
  price30dAgo?: number | null;
}

// --- Platform-specific formatters ---

function platformHashtags(brand: string): string {
  const clean = brand.replace(/\s+/g, '');
  return `#${clean} #watches #luxury #watchdeals #secondmarkwatchco #preowned #watchcollector #horology`;
}

function platformEmoji(platform: Platform): Record<string, string> {
  if (platform === 'x') {
    return { fire: '', watch: '', money: '', arrow: '', check: '', star: '', chart: '' };
  }
  return { fire: '🔥', watch: '⌚', money: '💰', arrow: '➡️', check: '✅', star: '⭐', chart: '📊' };
}

// --- Templates ---

function dealPost(watch: WatchData, platform: Platform): string {
  const e = platformEmoji(platform);
  const saving = watch.savings ? formatPrice(watch.savings) : '';
  const disc = watch.discount ? `${watch.discount.toFixed(0)}%` : '';
  const price = watch.listingPrice ? formatPrice(watch.listingPrice) : formatPrice(watch.marketPrice);

  const templates: Record<Platform, string> = {
    instagram: [
      `${e.fire} DEAL ALERT ${e.fire}`,
      ``,
      `${watch.brand} ${watch.model}`,
      watch.condition ? `Condition: ${watch.condition}` : '',
      ``,
      `${e.money} ${price}${disc ? ` (${disc} below market)` : ''}`,
      saving ? `You save: ${saving}` : '',
      `Market value: ${formatPrice(watch.marketPrice)}`,
      ``,
      `${e.arrow} DM us to secure this piece`,
      ``,
      platformHashtags(watch.brand),
    ].filter(Boolean).join('\n'),

    x: [
      `DEAL: ${watch.brand} ${watch.model}`,
      `${price}${disc ? ` — ${disc} below market` : ''}`,
      saving ? `Save ${saving}` : '',
      ``,
      `DM for details`,
      ``,
      `#watches #${watch.brand.replace(/\s+/g, '')} #watchdeals`,
    ].filter(Boolean).join('\n'),

    whatsapp: [
      `*${e.fire} Deal Alert*`,
      ``,
      `*${watch.brand} ${watch.model}*`,
      watch.reference ? `Ref: ${watch.reference}` : '',
      watch.condition ? `Condition: ${watch.condition}` : '',
      ``,
      `*Price: ${price}*${disc ? ` _(${disc} below market)_` : ''}`,
      saving ? `_You save: ${saving}_` : '',
      `Market value: ${formatPrice(watch.marketPrice)}`,
      ``,
      `${e.arrow} Reply to this message to enquire`,
    ].filter(Boolean).join('\n'),

    facebook: [
      `${e.fire} Deal Alert — ${watch.brand} ${watch.model}`,
      ``,
      `${e.money} ${price}${disc ? ` (${disc} below market value)` : ''}`,
      saving ? `That's a saving of ${saving}!` : '',
      ``,
      watch.condition ? `Condition: ${watch.condition}` : '',
      `Market value: ${formatPrice(watch.marketPrice)}`,
      ``,
      `${e.check} Authenticated | ${e.check} Verified seller`,
      ``,
      `Comment "INFO" or DM us for details.`,
      ``,
      platformHashtags(watch.brand),
    ].filter(Boolean).join('\n'),
  };

  return templates[platform];
}

function spotlightPost(watch: WatchData, platform: Platform): string {
  const e = platformEmoji(platform);

  const templates: Record<Platform, string> = {
    instagram: [
      `${e.watch} SPOTLIGHT: ${watch.brand} ${watch.model}`,
      ``,
      `One of the most sought-after pieces in the ${watch.brand} lineup.`,
      ``,
      `${e.chart} Current market value: ${formatPrice(watch.marketPrice)}`,
      watch.price30dAgo ? `30-day trend: ${watch.price30dAgo > watch.marketPrice ? 'Dropping — great time to buy' : 'Rising — don\'t sleep on this one'}` : '',
      ``,
      `We source these regularly. DM us for availability and pricing.`,
      ``,
      platformHashtags(watch.brand),
    ].filter(Boolean).join('\n'),

    x: [
      `${watch.brand} ${watch.model} — currently at ${formatPrice(watch.marketPrice)} on the pre-owned market.`,
      ``,
      watch.price30dAgo && watch.price30dAgo > watch.marketPrice
        ? `Prices have been dropping. Good window to buy.`
        : `Market is holding steady on this ref.`,
      ``,
      `We can source one for you. DM.`,
    ].filter(Boolean).join('\n'),

    whatsapp: [
      `${e.watch} *Watch Spotlight*`,
      ``,
      `*${watch.brand} ${watch.model}*`,
      watch.reference ? `Ref: ${watch.reference}` : '',
      ``,
      `Current market value: *${formatPrice(watch.marketPrice)}*`,
      watch.price30dAgo ? `30-day trend: ${watch.price30dAgo > watch.marketPrice ? '_Prices dropping_' : '_Prices rising_'}` : '',
      ``,
      `We can source this for you at the best price.`,
      `Reply to enquire ${e.arrow}`,
    ].filter(Boolean).join('\n'),

    facebook: [
      `${e.star} Watch Spotlight: ${watch.brand} ${watch.model}`,
      ``,
      `Market value: ${formatPrice(watch.marketPrice)}`,
      watch.price30dAgo && watch.price30dAgo > watch.marketPrice
        ? `${e.chart} Prices have dipped recently — solid buying window.`
        : `${e.chart} Market is strong on this reference.`,
      ``,
      `Looking for one? We source pre-owned luxury watches at the best prices.`,
      `Comment or DM for a quote.`,
      ``,
      platformHashtags(watch.brand),
    ].filter(Boolean).join('\n'),
  };

  return templates[platform];
}

function educationalPost(watch: WatchData, platform: Platform): string {
  const e = platformEmoji(platform);

  const templates: Record<Platform, string> = {
    instagram: [
      `${e.watch} DID YOU KNOW?`,
      ``,
      `The ${watch.brand} ${watch.model} is one of the most popular references in the ${watch.brand} catalog.`,
      ``,
      `${e.chart} Current pre-owned market: ${formatPrice(watch.marketPrice)}`,
      ``,
      `Why it's a smart buy:`,
      `${e.check} Strong resale value`,
      `${e.check} Iconic design that holds up`,
      `${e.check} Pre-owned means no waitlist`,
      ``,
      `Want to learn more? Drop a comment or DM us.`,
      ``,
      `#watcheducation #watchinvesting ${platformHashtags(watch.brand)}`,
    ].filter(Boolean).join('\n'),

    x: [
      `${watch.brand} ${watch.model} — a quick breakdown:`,
      ``,
      `Pre-owned market: ${formatPrice(watch.marketPrice)}`,
      `Strong resale ✓`,
      `No waitlist ✓`,
      `Iconic design ✓`,
      ``,
      `Thread on why this is one of the smartest buys in the ${watch.brand} range 🧵`,
    ].filter(Boolean).join('\n'),

    whatsapp: [
      `${e.watch} *Watch Facts*`,
      ``,
      `*${watch.brand} ${watch.model}*`,
      ``,
      `Current market: *${formatPrice(watch.marketPrice)}*`,
      ``,
      `Why people love this one:`,
      `${e.check} Strong resale value`,
      `${e.check} Timeless design`,
      `${e.check} No waitlist when you buy pre-owned`,
      ``,
      `Interested? We can find you the best deal.`,
    ].filter(Boolean).join('\n'),

    facebook: [
      `${e.watch} Watch Education: ${watch.brand} ${watch.model}`,
      ``,
      `Here's why this is one of the smartest pre-owned watches you can buy right now:`,
      ``,
      `${e.check} Current value: ${formatPrice(watch.marketPrice)}`,
      `${e.check} Strong resale — holds value well`,
      `${e.check} No waitlist — buy pre-owned and wear it today`,
      `${e.check} Iconic design that never goes out of style`,
      ``,
      `We specialize in sourcing these at the best prices. DM us.`,
      ``,
      platformHashtags(watch.brand),
    ].filter(Boolean).join('\n'),
  };

  return templates[platform];
}

function newStockPost(watch: WatchData, platform: Platform): string {
  const e = platformEmoji(platform);

  const templates: Record<Platform, string> = {
    instagram: [
      `${e.star} JUST IN ${e.star}`,
      ``,
      `${watch.brand} ${watch.model}`,
      watch.reference ? `Ref. ${watch.reference}` : '',
      watch.condition ? `Condition: ${watch.condition}` : '',
      ``,
      `${e.money} ${formatPrice(watch.marketPrice)}`,
      ``,
      `These don't last long. DM us to secure it.`,
      ``,
      platformHashtags(watch.brand),
    ].filter(Boolean).join('\n'),

    x: [
      `Just landed: ${watch.brand} ${watch.model}`,
      `${formatPrice(watch.marketPrice)}`,
      watch.condition ? `${watch.condition} condition` : '',
      ``,
      `DM before it's gone.`,
    ].filter(Boolean).join('\n'),

    whatsapp: [
      `${e.star} *Just In*`,
      ``,
      `*${watch.brand} ${watch.model}*`,
      watch.reference ? `Ref: ${watch.reference}` : '',
      watch.condition ? `Condition: ${watch.condition}` : '',
      ``,
      `Price: *${formatPrice(watch.marketPrice)}*`,
      ``,
      `First come, first served. Reply to reserve.`,
    ].filter(Boolean).join('\n'),

    facebook: [
      `${e.star} New Arrival: ${watch.brand} ${watch.model}`,
      ``,
      watch.reference ? `Reference: ${watch.reference}` : '',
      watch.condition ? `Condition: ${watch.condition}` : '',
      `Price: ${formatPrice(watch.marketPrice)}`,
      ``,
      `Just added to our collection. Comment "INTERESTED" or send us a message.`,
      ``,
      platformHashtags(watch.brand),
    ].filter(Boolean).join('\n'),
  };

  return templates[platform];
}

function priceWatchPost(watch: WatchData, platform: Platform): string {
  const e = platformEmoji(platform);
  const trend30 = watch.price30dAgo
    ? ((watch.marketPrice - watch.price30dAgo) / watch.price30dAgo * 100).toFixed(1)
    : null;
  const direction = trend30 ? (parseFloat(trend30) > 0 ? 'up' : parseFloat(trend30) < 0 ? 'down' : 'flat') : null;

  const templates: Record<Platform, string> = {
    instagram: [
      `${e.chart} MARKET UPDATE`,
      ``,
      `${watch.brand} ${watch.model}`,
      `Current market: ${formatPrice(watch.marketPrice)}`,
      trend30 ? `30-day change: ${parseFloat(trend30) >= 0 ? '+' : ''}${trend30}% ${direction === 'down' ? '(buying opportunity?)' : ''}` : '',
      ``,
      direction === 'down' ? `Prices are softening — could be a smart time to buy.` : `Market is strong. Expect to pay a premium.`,
      ``,
      `Follow us for weekly market updates.`,
      ``,
      `#watchmarket #pricewatch ${platformHashtags(watch.brand)}`,
    ].filter(Boolean).join('\n'),

    x: [
      `${watch.brand} ${watch.model} market update:`,
      `${formatPrice(watch.marketPrice)}`,
      trend30 ? `30d: ${parseFloat(trend30) >= 0 ? '+' : ''}${trend30}%` : '',
      direction === 'down' ? `Buying window opening up.` : `Holding firm.`,
    ].filter(Boolean).join('\n'),

    whatsapp: [
      `${e.chart} *Market Update*`,
      ``,
      `*${watch.brand} ${watch.model}*`,
      `Current: *${formatPrice(watch.marketPrice)}*`,
      trend30 ? `30-day: ${parseFloat(trend30) >= 0 ? '+' : ''}${trend30}%` : '',
      ``,
      direction === 'down' ? `_Prices dropping — good time to buy._` : `_Market holding steady._`,
    ].filter(Boolean).join('\n'),

    facebook: [
      `${e.chart} Weekly Market Watch: ${watch.brand} ${watch.model}`,
      ``,
      `Current market value: ${formatPrice(watch.marketPrice)}`,
      trend30 ? `30-day trend: ${parseFloat(trend30) >= 0 ? '+' : ''}${trend30}%` : '',
      ``,
      direction === 'down'
        ? `The market is cooling on this reference. Could be a good entry point for buyers.`
        : `Strong demand continues. If you've been waiting, prices may keep climbing.`,
      ``,
      `Follow Second Mark Watch Co. for weekly price updates on the most popular luxury watches.`,
      ``,
      platformHashtags(watch.brand),
    ].filter(Boolean).join('\n'),
  };

  return templates[platform];
}

// --- Main generator ---

export function generatePost(watch: WatchData, platform: Platform, type: PostType): string {
  switch (type) {
    case 'deal': return dealPost(watch, platform);
    case 'spotlight': return spotlightPost(watch, platform);
    case 'educational': return educationalPost(watch, platform);
    case 'newstock': return newStockPost(watch, platform);
    case 'pricewatch': return priceWatchPost(watch, platform);
    default: return dealPost(watch, platform);
  }
}

export const POST_TYPE_LABELS: Record<PostType, string> = {
  deal: 'Deal Alert',
  spotlight: 'Watch Spotlight',
  educational: 'Educational / Did You Know',
  newstock: 'New Arrival',
  pricewatch: 'Market Price Update',
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: 'Instagram',
  x: 'X (Twitter)',
  whatsapp: 'WhatsApp',
  facebook: 'Facebook',
};

export function getContentIdeas(watches: WatchData[]): { title: string; description: string; type: PostType; watchIndex: number }[] {
  const ideas: { title: string; description: string; type: PostType; watchIndex: number }[] = [];

  watches.forEach((w, i) => {
    // Deals
    if (w.discount && w.discount >= 10) {
      ideas.push({
        title: `${w.brand} ${w.model} — ${w.discount.toFixed(0)}% Below Market`,
        description: `Great deal at ${formatPrice(w.listingPrice || w.marketPrice)}. Market value is ${formatPrice(w.marketPrice)}.`,
        type: 'deal',
        watchIndex: i,
      });
    }

    // Price drops
    if (w.price30dAgo && w.marketPrice < w.price30dAgo * 0.95) {
      const drop = ((w.price30dAgo - w.marketPrice) / w.price30dAgo * 100).toFixed(0);
      ideas.push({
        title: `${w.brand} ${w.model} — Price Down ${drop}% This Month`,
        description: `Was ${formatPrice(w.price30dAgo)}, now ${formatPrice(w.marketPrice)}. Good buying window.`,
        type: 'pricewatch',
        watchIndex: i,
      });
    }

    // Rising prices
    if (w.price30dAgo && w.marketPrice > w.price30dAgo * 1.05) {
      const rise = ((w.marketPrice - w.price30dAgo) / w.price30dAgo * 100).toFixed(0);
      ideas.push({
        title: `${w.brand} ${w.model} — Up ${rise}% This Month`,
        description: `Was ${formatPrice(w.price30dAgo)}, now ${formatPrice(w.marketPrice)}. Demand is hot.`,
        type: 'pricewatch',
        watchIndex: i,
      });
    }
  });

  // Always add some evergreen ideas
  if (watches.length > 0) {
    const randomWatch = watches[Math.floor(Math.random() * watches.length)];
    const idx = watches.indexOf(randomWatch);
    ideas.push({
      title: `Spotlight: ${randomWatch.brand} ${randomWatch.model}`,
      description: `Feature this popular piece. Market value: ${formatPrice(randomWatch.marketPrice)}.`,
      type: 'spotlight',
      watchIndex: idx,
    });
    ideas.push({
      title: `Why Buy Pre-Owned ${randomWatch.brand}?`,
      description: `Educational post about the value proposition of buying pre-owned.`,
      type: 'educational',
      watchIndex: idx,
    });
  }

  return ideas;
}
