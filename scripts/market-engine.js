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
    console.log(`\n[BELMONT MARKET ENGINE] === Cycle Started at ${timestamp} ===`);

    // 2. Process each asset with Market Making liquidity (Spread placement around current price)
    for (const asset of assets) {
      const currentPrice = asset.current_price;

      // Find events targeting this specific asset
      const assetEvents = activeEvents.filter(e => e.target_asset_id === asset.id);
      const sentimentScore = assetEvents.reduce((acc, curr) => acc + parseFloat(curr.impact_score || 0), 0);

      // Select two random NPCs to provide Bid and Ask liquidity
      const buyerAgent = agents[Math.floor(Math.random() * agents.length)];
      let sellerAgent = agents[Math.floor(Math.random() * agents.length)];

      if (buyerAgent.id === sellerAgent.id && agents.length > 1) {
        sellerAgent = agents.find(a => a.id !== buyerAgent.id) || sellerAgent;
      }

      // Check seller NPC holdings
      const holdingRes = await client.query(
        'SELECT quantity FROM public.market_agent_holdings WHERE agent_id = $1 AND asset_id = $2;',
        [sellerAgent.id, asset.id]
      );
      const sellerQtyAvailable = holdingRes.rows[0]?.quantity || 0;

      // Determine Prices around current price
      const bidPrice = Math.max(1, currentPrice - (sentimentScore < 0 ? 2 : 1));
      const askPrice = currentPrice + (sentimentScore > 0 ? 1 : 2);
      const qty = Math.floor(Math.random() * 8) + 2;

      // Place BUY Limit Order from Buyer NPC
      await client.query(
        `INSERT INTO public.orders (agent_id, asset_id, side, order_type, price, quantity, filled_quantity, status)
         VALUES ($1, $2, 'buy', 'limit', $3, $4, 0, 'pending');`,
        [buyerAgent.id, asset.id, bidPrice, qty]
      );
      console.log(`[MARKET MAKER] ${buyerAgent.name} -> BID ${qty}x ${asset.symbol} @ ${bidPrice} Coins`);

      // Place SELL Limit Order from Seller NPC (if holding > 0)
      if (sellerQtyAvailable >= qty) {
        await client.query(
          `INSERT INTO public.orders (agent_id, asset_id, side, order_type, price, quantity, filled_quantity, status)
           VALUES ($1, $2, 'sell', 'limit', $3, $4, 0, 'pending');`,
          [sellerAgent.id, asset.id, askPrice, qty]
        );
        console.log(`[MARKET MAKER] ${sellerAgent.name} -> ASK ${qty}x ${asset.symbol} @ ${askPrice} Coins`);
      }

      // 3. Trigger PostgreSQL Matching Engine
      const matchRes = await client.query('SELECT public.match_orders_for_asset($1);', [asset.id]);
      const matches = matchRes.rows[0]?.match_orders_for_asset || 0;

      if (matches > 0) {
        console.log(`[MATCHING ENGINE] ${matches} trade(s) executed for ${asset.symbol}`);
      }
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
