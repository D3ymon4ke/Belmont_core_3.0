const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:E08059900pe%40@db.wlqorxvcrfpmvvhxgjiy.supabase.co:5432/postgres';

// Persistent trend and phase momentum for multi-level order book & organic waves
const assetTrends = {};

async function runMarketCycle() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // 1. Fetch active assets, NPCs and economic events
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
    console.log(`\n[BELMONT MARKET ENGINE] === Cycle Started at ${timestamp} ===`);

    const getRandomAgent = () => agents[Math.floor(Math.random() * agents.length)];

    // 2. Process each asset with multi-level depth order book & continuous decimal precision
    for (const asset of assets) {
      const currentPrice = parseFloat(asset.current_price) || 100.0;

      // Initialize trend momentum state
      if (!assetTrends[asset.symbol]) {
        assetTrends[asset.symbol] = {
          direction: Math.random() > 0.5 ? 1 : -1,
          stepsLeft: Math.floor(Math.random() * 8) + 4,
          phase: Math.random() * Math.PI * 2,
        };
      }

      const trend = assetTrends[asset.symbol];
      trend.stepsLeft -= 1;
      trend.phase += 0.25;

      // Event Sentiment & Micro-wave Fluctuation
      const assetEvents = activeEvents.filter(e => e.target_asset_id === asset.id);
      const eventSentiment = assetEvents.reduce((acc, curr) => acc + parseFloat(curr.impact_score || 0), 0);

      // Continuous organic decimal price delta (e.g. +0.45, -0.30, +0.85, -0.60)
      const sineDelta = Math.sin(trend.phase) * 0.8;
      const trendDelta = trend.direction * (Math.random() * 0.7 + 0.1);
      const priceDelta = Number((trendDelta + sineDelta + (eventSentiment * 0.25)).toFixed(2));

      let centralPrice = Number((Math.max(5.0, currentPrice + priceDelta)).toFixed(2));

      // Re-evaluate trend direction when step count expires
      if (trend.stepsLeft <= 0) {
        trend.direction = Math.random() > 0.45 ? 1 : -1;
        trend.stepsLeft = Math.floor(Math.random() * 8) + 4;
      }

      // Top up holdings for all NPCs if needed
      for (const agent of agents) {
        await client.query(
          `INSERT INTO public.market_agent_holdings (agent_id, asset_id, quantity)
           VALUES ($1, $2, 1000)
           ON CONFLICT (agent_id, asset_id) DO UPDATE SET quantity = GREATEST(market_agent_holdings.quantity, 500);`,
          [agent.id, asset.id]
        );
      }

      // A) Create Multi-Level Order Book Depth (4 levels of Bids below, 4 levels of Asks above with decimal precision)
      for (let level = 1; level <= 4; level++) {
        const bidPrice = Number((Math.max(1, centralPrice - (level * 0.50))).toFixed(2));
        const askPrice = Number((centralPrice + (level * 0.50)).toFixed(2));

        const buyer = getRandomAgent();
        const seller = getRandomAgent();

        await client.query(
          `INSERT INTO public.orders (agent_id, asset_id, side, order_type, price, quantity, filled_quantity, status)
           VALUES ($1, $2, 'buy', 'limit', $3, $4, 0, 'pending');`,
          [buyer.id, asset.id, bidPrice, Math.floor(Math.random() * 15) + 5]
        );

        await client.query(
          `INSERT INTO public.orders (agent_id, asset_id, side, order_type, price, quantity, filled_quantity, status)
           VALUES ($1, $2, 'sell', 'limit', $3, $4, 0, 'pending');`,
          [seller.id, asset.id, askPrice, Math.floor(Math.random() * 15) + 5]
        );
      }

      // B) Create Match Orders at centralPrice to execute trade and record new price
      const buyerMatch = getRandomAgent();
      let sellerMatch = getRandomAgent();
      if (sellerMatch.id === buyerMatch.id && agents.length > 1) {
        sellerMatch = agents.find(a => a.id !== buyerMatch.id) || sellerMatch;
      }
      const tradeQty = Math.floor(Math.random() * 20) + 5;

      await client.query(
        `INSERT INTO public.orders (agent_id, asset_id, side, order_type, price, quantity, filled_quantity, status)
         VALUES ($1, $2, 'buy', 'limit', $3, $4, 0, 'pending');`,
        [buyerMatch.id, asset.id, centralPrice, tradeQty]
      );

      await client.query(
        `INSERT INTO public.orders (agent_id, asset_id, side, order_type, price, quantity, filled_quantity, status)
         VALUES ($1, $2, 'sell', 'limit', $3, $4, 0, 'pending');`,
        [sellerMatch.id, asset.id, centralPrice, tradeQty]
      );

      // C) Trigger PostgreSQL Matching Engine
      const matchRes = await client.query('SELECT public.match_orders_for_asset($1::uuid);', [asset.id]);
      const matches = matchRes.rows[0]?.match_orders_for_asset || 0;

      console.log(`[TRADE] ${asset.symbol}: ${matches} trade(s) executed @ ${centralPrice} Coins (Delta: ${priceDelta > 0 ? '+' : ''}${priceDelta})`);
    }

    console.log(`[BELMONT MARKET ENGINE] === Cycle Completed Successfully ===`);
  } catch (err) {
    console.error('[BELMONT MARKET ENGINE ERROR]:', err);
  } finally {
    await client.end();
  }
}

// Continuous Daemon Loop (Every 10 seconds)
const CYCLE_INTERVAL_MS = 10000;
console.log(`[BELMONT MARKET ENGINE DAEMON STARTED] Running cycle every ${CYCLE_INTERVAL_MS / 1000}s...`);

runMarketCycle();
setInterval(runMarketCycle, CYCLE_INTERVAL_MS);
