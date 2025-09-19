const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

let trades = [];
let tradeId = 1;

// BTC price simulation (random)
let btcPrice = 27000;

setInterval(() => {
  const change = (Math.random() - 0.5) * 100; // ছোটখাটো পরিবর্তন
  btcPrice = Math.max(10000, btcPrice + change);
}, 3000);

// 👉 Get current BTC price
app.get("/api/price", (req, res) => {
  res.json({ price: btcPrice });
});

// 👉 Open trade
app.post("/api/trades/open", (req, res) => {
  const { direction, entryPrice } = req.body;
  if (!direction || !entryPrice) {
    return res.status(400).json({ message: "Direction & entryPrice required" });
  }

  const newTrade = {
    id: tradeId++,
    direction,
    entryPrice,
    isOpen: true,
  };

  trades.push(newTrade);

  res.json({
    message: "Trade opened successfully",
    trade: newTrade,
  });
});

// 👉 Close trade
app.post("/api/trades/close", (req, res) => {
  const { tradeId, closePrice } = req.body;
  const trade = trades.find((t) => t.id === tradeId && t.isOpen);

  if (!trade) {
    return res.status(400).json({ message: "Trade not found or already closed" });
  }

  let pnl = 0;
  if (trade.direction === "long") {
    pnl = closePrice - trade.entryPrice;
  } else if (trade.direction === "short") {
    pnl = trade.entryPrice - closePrice;
  }

  trade.isOpen = false;
  trade.closePrice = closePrice;
  trade.pnl = pnl;

  res.json({
    message: `Trade closed. Final PnL: ${pnl.toFixed(2)}`,
    trade,
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
