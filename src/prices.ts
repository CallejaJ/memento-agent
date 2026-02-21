const COINS: Record<string, string> = {
  bitcoin: 'bitcoin', btc: 'bitcoin',
  ethereum: 'ethereum', eth: 'ethereum',
  bnb: 'binancecoin',
  solana: 'solana', sol: 'solana',
  cardano: 'cardano', ada: 'cardano',
  xrp: 'ripple', ripple: 'ripple',
  usdt: 'tether', tether: 'tether',
  usdc: 'usd-coin',
};

const PRICE_KEYWORDS = ['precio', 'vale', 'valor', 'cotiza', 'price', 'worth', 'cost', 'cuanto', 'cuánto'];

export function shouldFetchPrice(text: string): boolean {
  const lower = text.toLowerCase();
  return PRICE_KEYWORDS.some((k) => lower.includes(k)) &&
    Object.keys(COINS).some((c) => lower.includes(c));
}

export async function fetchPriceContext(text: string): Promise<string> {
  const lower = text.toLowerCase();
  const coinIds = [...new Set(
    Object.entries(COINS)
      .filter(([name]) => lower.includes(name))
      .map(([, id]) => id)
  )];

  if (coinIds.length === 0) return '';

  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=' + coinIds.join(',') + '&vs_currencies=usd,eur&include_24hr_change=true'
    );
    const data = await res.json() as Record<string, { usd: number; eur: number; usd_24h_change: number }>;

    const lines = coinIds.map((id) => {
      const d = data[id];
      if (!d) return null;
      const change = d.usd_24h_change?.toFixed(2) ?? '0';
      const arrow = Number(change) >= 0 ? 'subio' : 'bajo';
      return id + ': $' + d.usd.toLocaleString() + ' / ' + d.eur.toLocaleString() + 'EUR (' + arrow + ' ' + Math.abs(Number(change)) + '% en 24h)';
    }).filter(Boolean);

    return '\n\nPrecios actuales en tiempo real:\n' + lines.join('\n');
  } catch {
    return '';
  }
}
