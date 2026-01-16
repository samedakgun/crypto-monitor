const WebSocket = require('ws');

console.log('🔌 Connecting to ws://localhost:4000/ws...');
const ws = new WebSocket('ws://localhost:4000/ws');

ws.on('open', () => {
  console.log('✅ Connected to WebSocket server!\n');

  // Send subscribe message
  const subscribeMsg = {
    type: 'subscribe',
    symbol: 'BTCUSDT',
    channels: ['trade', 'kline', 'depth'],
    interval: '1m'
  };

  console.log('📤 Sending subscribe message:', JSON.stringify(subscribeMsg, null, 2));
  ws.send(JSON.stringify(subscribeMsg));
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());

  if (message.type === 'connected') {
    console.log('🎉', message.data.message);
  } else if (message.type === 'trade') {
    const trade = message.data;
    console.log(`💰 TRADE: ${trade.symbol} | Price: $${trade.price.toFixed(2)} | Qty: ${trade.quantity.toFixed(4)} | ${trade.isBuyerMaker ? 'SELL' : 'BUY'}`);
  } else if (message.type === 'kline') {
    const kline = message.data;
    console.log(`📊 KLINE: ${kline.symbol} ${kline.interval} | O: ${kline.open} | H: ${kline.high} | L: ${kline.low} | C: ${kline.close} | V: ${kline.volume.toFixed(2)}`);
  } else if (message.type === 'depth') {
    const depth = message.data;
    console.log(`📖 DEPTH: ${depth.symbol} | Best Bid: ${depth.bids[0].price} | Best Ask: ${depth.asks[0].price}`);
  } else if (message.type === 'footprint') {
    const fp = message.data;
    console.log(`🦶 FOOTPRINT: CVD: ${fp.footprint.cumulativeDelta.toFixed(2)} | Price Levels: ${fp.footprint.cells.length}`);
  } else if (message.type === 'error') {
    console.error('❌ ERROR:', message.error);
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
});

ws.on('close', () => {
  console.log('❌ Disconnected from WebSocket server');
  process.exit(0);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Closing connection...');
  ws.close();
});
