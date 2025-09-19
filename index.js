require("dotenv").config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const tradeRoutes = require('./routes/tradeRoutes');
const authRoutes = require('./routes/authRoutes');
const depositRoute = require('./routes/depositRoute')
const Trade = require('./models/Trade'); // নিশ্চিত করুন Trade model ইমপোর্ট করেছেন
const { subscribeToPair } = require('./Services/PriceBridge'); // এখানে আপনার subscribe ফাংশন আছে
const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/deposit', depositRoute);


async function startServer() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/crypto_trading', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');

    // ওপেন ট্রেড খুঁজে বের করা
    const openTrades = await Trade.find({ status: 'OPEN' });

    openTrades.forEach((trade) => {
      subscribeToPair(trade.pair);
    });

    console.log(`🔄 Resubscribed to ${openTrades.length} open trades`);

    app.listen(5000, () => console.log('🚀 Server running on port 5000'));
  } catch (err) {
    console.error('❌ DB Connection Failed:', err);
  }
}

startServer();
