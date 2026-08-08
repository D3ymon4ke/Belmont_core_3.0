const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:E08059900pe%40@db.wlqorxvcrfpmvvhxgjiy.supabase.co:5432/postgres';

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

    // 2. Process each asset: place depth and guaranteed crossing trades
    for (const asset of assets) {
      const currentPrice = asset.current_price;

      // Event Sentiment & Sine Wave fluctuation
      const assetEvents = activeEvents.filter(e => e.target_asset_id === asset.id);
      const eventSentiment = assetEvents.reduce((acc, curr) => acc + parseFloat(curr.impact_score || 0), 0);

      const wave = Math.sin(Date.now() / 25000) * 1.5;
      const noise = (Math.random() - 0.48) * 2;
      const priceDelta = Math.round(eventSentiment + wave + noise);

      const centralPrice = Math.max(5, currentPrice + priceDelta);

      // Top up holdings for all NPCs if needed
      for (const agent of agents) {
        await client.query(
          `INSERT INTO public.market_agent_holdings (agent_id, asset_id, quantity)
           VALUES ($1, $2, 1000)
           ON CONFLICT (agent_id, asset_id) DO UPDATE SET quantity = GREATEST(market_agent_holdings.quantity, 500);`,
          [agent.id, asset.id]
        );
      }

      // A) Create Book Depth: 2 Bids below centralPrice and 2 Asks above centralPrice
      const buyer1 = getRandomAgent();
      const seller1 = getRandomAgent();

      await client.query(
        `INSERT INTO public.orders (agent_id, asset_id, side, order_type, price, quantity, filled_quantity, status)
         VALUES ($1, $2, 'buy', 'limit', $3, $4, 0, 'pending');`,
        [buyer1.id, asset.id, Math.max(1, centralPrice - 1), Math.floor(Math.random() * 15) + 5]
      );

      await client.query(
        `INSERT INTO public.orders (agent_id, asset_id, side, order_type, price, quantity, filled_quantity, status)
         VALUES ($1, $2, 'sell', 'limit', $3, $4, 0, 'pending');`,
        [seller1.id, asset.id, centralPrice + 1, Math.floor(Math.random() * 15) + 5]
      );

      // B) Create Guaranteed Match Order at centralPrice
      const buyer2 = getRandomAgent();
      let seller2 = getRandomAgent();
      if (seller2.id === buyer2.id && agents.length > 1) {
        seller2 = agents.find(a => a.id !== buyer2.id) || seller2;
      }
      const tradeQty = Math.floor(Math.random() * 20) + 5;

      await client.query(
        `INSERT INTO public.orders (agent_id, asset_id, side, order_type, price, quantity, filled_quantity, status)
         VALUES ($1, $2, 'buy', 'limit', $3, $4, 0, 'pending');`,
        [buyer2.id, asset.id, centralPrice, tradeQty]
      );

      await client.query(
        `INSERT INTO public.orders (agent_id, asset_id, side, order_type, price, quantity, filled_quantity, status)
         VALUES ($1, $2, 'sell', 'limit', $3, $4, 0, 'pending');`,
        [seller2.id, asset.id, centralPrice, tradeQty]
      );

      // C) Trigger PostgreSQL Matching Engine with explicit ::uuid cast
      const matchRes = await client.query('SELECT public.match_orders_for_asset($1::uuid);', [asset.id]);
      const matches = matchRes.rows[0]?.match_orders_for_asset || 0;

      console.log(`[TRADE] ${asset.symbol}: ${matches} trade(s) executed @ ${centralPrice} Coins`);
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
