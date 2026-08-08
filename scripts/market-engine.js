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
    console.log(`\n[SYNTHETIC MARKET ENGINE] === Cycle Started at ${timestamp} ===`);

    // 2. Process each asset with full order book depth & dynamic trade execution
    for (const asset of assets) {
      const currentPrice = asset.current_price;

      // Event Sentiment & Micro-trend Calculation (Sine Wave + Noise)
      const assetEvents = activeEvents.filter(e => e.target_asset_id === asset.id);
      const eventSentiment = assetEvents.reduce((acc, curr) => acc + parseFloat(curr.impact_score || 0), 0);

      // Micro-wave fluctuation
      const wave = Math.sin(Date.now() / 30000) * 1.5; // Smooth 30s cycle wave
      const noise = (Math.random() - 0.48) * 2; // Subtle random noise (-1 to +1)
      const priceDelta = Math.round(eventSentiment + wave + noise);

      // Target central price (bounded > 5 Coins)
      const centralPrice = Math.max(5, currentPrice + priceDelta);

      // Randomly pick NPCs for market making
      const getRandomAgent = () => agents[Math.floor(Math.random() * agents.length)];

      // Ensure NPCs have holding inventories for selling
      for (const agent of agents) {
        await client.query(
          `INSERT INTO public.market_agent_holdings (agent_id, asset_id, quantity)
           VALUES ($1, $2, 1000)
           ON CONFLICT (agent_id, asset_id) DO UPDATE SET quantity = GREATEST(market_agent_holdings.quantity, 500);`,
          [agent.id, asset.id]
        );
      }

      // A) Create BID Depth (3 Limit Buy Orders below central price)
      for (let offset = 1; offset <= 3; offset++) {
        const bidPrice = Math.max(1, centralPrice - offset);
        const qty = Math.floor(Math.random() * 25) + 5;
        const buyer = getRandomAgent();

        await client.query(
          `INSERT INTO public.orders (agent_id, asset_id, side, order_type, price, quantity, filled_quantity, status)
           VALUES ($1, $2, 'buy', 'limit', $3, $4, 0, 'pending');`,
          [buyer.id, asset.id, bidPrice, qty]
        );
      }

      // B) Create ASK Depth (3 Limit Sell Orders above central price)
      for (let offset = 1; offset <= 3; offset++) {
        const askPrice = centralPrice + offset;
        const qty = Math.floor(Math.random() * 25) + 5;
        const seller = getRandomAgent();

        await client.query(
          `INSERT INTO public.orders (agent_id, asset_id, side, order_type, price, quantity, filled_quantity, status)
           VALUES ($1, $2, 'sell', 'limit', $3, $4, 0, 'pending');`,
          [seller.id, asset.id, askPrice, qty]
        );
      }

      // C) Create 1 Crossing Trade Order at centralPrice to execute trade & move ticker
      const tradeQty = Math.floor(Math.random() * 35) + 10;
      const buyerNPC = getRandomAgent();
      let sellerNPC = getRandomAgent();
      if (sellerNPC.id === buyerNPC.id && agents.length > 1) {
        sellerNPC = agents.find(a => a.id !== buyerNPC.id) || sellerNPC;
      }

      await client.query(
        `INSERT INTO public.orders (agent_id, asset_id, side, order_type, price, quantity, filled_quantity, status)
         VALUES ($1, $2, 'buy', 'limit', $3, $4, 0, 'pending');`,
        [buyerNPC.id, asset.id, centralPrice, tradeQty]
      );

      await client.query(
        `INSERT INTO public.orders (agent_id, asset_id, side, order_type, price, quantity, filled_quantity, status)
         VALUES ($1, $2, 'sell', 'limit', $3, $4, 0, 'pending');`,
        [sellerNPC.id, asset.id, centralPrice, tradeQty]
      );

      console.log(`[SYNTHETIC TRADE] ${asset.symbol}: ${buyerNPC.name} BUY & ${sellerNPC.name} SELL ${tradeQty}x @ ${centralPrice} Coins`);

      // D) Execute Matching Engine in PostgreSQL
      const matchRes = await client.query('SELECT public.match_orders_for_asset($1);', [asset.id]);
      const matches = matchRes.rows[0]?.match_orders_for_asset || 0;

      if (matches > 0) {
        console.log(`[MATCHING ENGINE] Executed ${matches} trade(s) for ${asset.symbol} -> New Price: ${centralPrice} Coins`);
      }
    }

    console.log(`[SYNTHETIC MARKET ENGINE] === Cycle Completed Successfully ===`);
  } catch (err) {
    console.error('[SYNTHETIC MARKET ENGINE ERROR]:', err);
  } finally {
    await client.end();
  }
}

// Continuous Daemon Loop (Every 10 seconds)
const CYCLE_INTERVAL_MS = 10000;
console.log(`[SYNTHETIC MARKET ENGINE DAEMON STARTED] Running cycle every ${CYCLE_INTERVAL_MS / 1000}s...`);

runMarketCycle();
setInterval(runMarketCycle, CYCLE_INTERVAL_MS);
