const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:E08059900pe%40@db.wlqorxvcrfpmvvhxgjiy.supabase.co:5432/postgres';

async function runMarketCycle() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // 1. Fetch active assets, NPCs and active economic events
    const assetsRes = await client.query('SELECT * FROM public.assets WHERE is_active = TRUE;');
    const agentsRes = await client.query('SELECT * FROM public.market_agents WHERE is_active = TRUE;');
    const eventsRes = await client.query('SELECT * FROM public.economic_events WHERE is_active = TRUE;');

    const assets = assetsRes.rows;
    const agents = agentsRes.rows;
    const activeEvents = eventsRes.rows;

    if (assets.length === 0 || agents.length === 0) {
      return;
    }

    const timestamp = new Date().toISOString();
    console.log(`\n[MARKET ENGINE] === Cycle Started at ${timestamp} ===`);
    console.log(`[EVENTS] ${activeEvents.length} active economic event(s) in progress.`);

    // 2. Process each asset considering active economic sentiment
    for (const asset of assets) {
      const currentPrice = asset.current_price;

      // Find events targeting this specific asset
      const assetEvents = activeEvents.filter(e => e.target_asset_id === asset.id);
      const sentimentScore = assetEvents.reduce((acc, curr) => acc + parseFloat(curr.impact_score || 0), 0);

      const agent = agents[Math.floor(Math.random() * agents.length)];

      let side = Math.random() > 0.5 ? 'buy' : 'sell';
      let priceOffset = 0;
      let qtyMultiplier = 1;

      // Sentiment influence
      if (sentimentScore > 0) {
        // Bullish bias
        side = Math.random() > 0.3 ? 'buy' : 'sell';
        priceOffset = Math.floor(sentimentScore * 3);
        if (agent.personality === 'speculator') qtyMultiplier = 2;
      } else if (sentimentScore < 0) {
        // Bearish bias
        side = Math.random() > 0.3 ? 'sell' : 'buy';
        priceOffset = -Math.floor(Math.abs(sentimentScore) * 3);
      }

      // Personality specific overrides
      if (agent.personality === 'accumulator') {
        if (sentimentScore >= 0) side = 'buy';
      } else if (agent.personality === 'trader') {
        priceOffset += (side === 'buy' ? -1 : 1);
      } else if (agent.personality === 'conservative') {
        priceOffset += (side === 'buy' ? -2 : 2);
      }

      const orderPrice = Math.max(1, currentPrice + priceOffset);
      const orderQty = (Math.floor(Math.random() * 10) + 1) * qtyMultiplier;

      // Insert real order into book
      await client.query(
        `INSERT INTO public.orders (agent_id, asset_id, side, order_type, price, quantity, filled_quantity, status)
         VALUES ($1, $2, $3, 'limit', $4, $5, 0, 'pending');`,
        [agent.id, asset.id, side, orderPrice, orderQty]
      );

      console.log(`[NPC] ${agent.name} (${agent.personality}) -> ${side.toUpperCase()} ${orderQty}x ${asset.symbol} @ ${orderPrice} Coins (Sentiment: ${sentimentScore.toFixed(2)})`);

      // 3. Trigger PostgreSQL Matching Engine
      const matchRes = await client.query('SELECT public.match_orders_for_asset($1);', [asset.id]);
      const matches = matchRes.rows[0]?.match_orders_for_asset || 0;

      if (matches > 0) {
        console.log(`[TRADE] ${matches} match trade(s) executed for ${asset.symbol}`);
      }
    }

    console.log(`[MARKET ENGINE] === Cycle Completed Successfully ===`);
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
