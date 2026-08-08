const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:E08059900pe%40@db.wlqorxvcrfpmvvhxgjiy.supabase.co:5432/postgres';

async function runMarketCycle() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // 1. Fetch active assets and NPCs
    const assetsRes = await client.query('SELECT * FROM public.assets WHERE is_active = TRUE;');
    const agentsRes = await client.query('SELECT * FROM public.market_agents WHERE is_active = TRUE;');

    const assets = assetsRes.rows;
    const agents = agentsRes.rows;

    if (assets.length === 0 || agents.length === 0) {
      return;
    }

    const timestamp = new Date().toISOString();
    console.log(`\n[MARKET] === Cycle Started at ${timestamp} ===`);

    // 2. NPCs Strategy Order Placement
    for (const asset of assets) {
      const currentPrice = asset.current_price;
      const agent = agents[Math.floor(Math.random() * agents.length)];

      let side = Math.random() > 0.5 ? 'buy' : 'sell';
      let priceOffset = 0;

      // Apply NPC Personality Logic
      if (agent.personality === 'accumulator') {
        side = 'buy';
        priceOffset = -Math.floor(Math.random() * 3);
      } else if (agent.personality === 'realizer') {
        side = 'sell';
        priceOffset = Math.floor(Math.random() * 3);
      } else if (agent.personality === 'trader') {
        side = Math.random() > 0.4 ? 'buy' : 'sell';
        priceOffset = side === 'buy' ? -1 : 1;
      } else if (agent.personality === 'speculator') {
        priceOffset = (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 5) + 1);
      } else if (agent.personality === 'conservative') {
        priceOffset = side === 'buy' ? -Math.floor(Math.random() * 4) - 1 : Math.floor(Math.random() * 4) + 1;
      }

      const orderPrice = Math.max(1, currentPrice + priceOffset);
      const orderQty = Math.floor(Math.random() * 15) + 1;

      // Insert real order into book
      await client.query(
        `INSERT INTO public.orders (agent_id, asset_id, side, order_type, price, quantity, filled_quantity, status)
         VALUES ($1, $2, $3, 'limit', $4, $5, 0, 'pending');`,
        [agent.id, asset.id, side, orderPrice, orderQty]
      );

      console.log(`[NPC] ${agent.name} submitted ${side.toUpperCase()} ${orderQty}x ${asset.symbol} @ ${orderPrice} Coins`);

      // 3. Trigger PostgreSQL Matching Engine
      const matchRes = await client.query('SELECT public.match_orders_for_asset($1);', [asset.id]);
      const matches = matchRes.rows[0]?.match_orders_for_asset || 0;

      if (matches > 0) {
        console.log(`[TRADE] ${matches} trade(s) executed for ${asset.symbol}`);
      }
    }

    console.log(`[MARKET] === Cycle Completed Successfully ===`);
  } catch (err) {
    console.error('[MARKET ENGINE ERROR]:', err);
  } finally {
    await client.end();
  }
}

// Continuous Daemon Loop (Every 10 seconds)
const CYCLE_INTERVAL_MS = 10000;
console.log(`[BELMONT MARKET ENGINE DAEMON STARTED] Running cycle every ${CYCLE_INTERVAL_MS / 1000}s...`);

runMarketCycle();
setInterval(runMarketCycle, CYCLE_INTERVAL_MS);
