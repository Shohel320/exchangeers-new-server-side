require("dotenv").config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const tradeRoutes = require('./routes/tradeRoutes');
const authRoutes = require('./routes/authRoutes');
const depositRoute = require('./routes/depositRoute');
const agentRoute = require('./routes/agentRoute');
const withdrawRoute = require('./routes/withdrawRoute');
const transferRoute = require('./routes/transfer');
const walletRoute = require('./routes/walletTransfer');
const adminOrder = require('./routes/adminOrder');
const stopLoss = require('./routes/stopLossRoute');
const userHistory = require('./routes/userTradeHistoryRoute');
const Trade = require('./models/Trade');
const Admin = require('./routes/adminRoute');
const Notice = require('./routes/noticeRoute');
const UserSupport = require('./routes/userSupportRoute');
const AdminSupportRoute = require('./routes/adminSupportRoute');
const SupportSocket = require('./socket/supportSocket');
const { subscribeToPair } = require('./Services/PriceBridge');
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use('/api/auth', authRoutes);
app.use('/api/support/admin', AdminSupportRoute);
app.use('/api/support/user', UserSupport);
app.use('/api/notice', Notice);
app.use('/api/admin', Admin);
app.use('/api/trade', userHistory);
app.use('/api/stoploss', stopLoss);
app.use('/api/trade', adminOrder);
app.use('/api/wtransfer', withdrawRoute);
app.use('/api/wallet', walletRoute);
app.use('/api/transfer', transferRoute);
app.use('/api/trades', tradeRoutes);
app.use('/api/deposit', depositRoute);
app.use('/api/agent', agentRoute);

// JWT Secret ENV থেকে
const JWT_SECRET = process.env.JWT_SECRET;

async function startServer() {
  try {
    // ⭐ ENV থেকে MongoDB URL নেওয়া
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB Connected');

    // সমস্ত ওপেন ট্রেডে সাবস্ক্রাইব করা
    const openTrades = await Trade.find({ status: 'OPEN' });

    openTrades.forEach((trade) => {
      subscribeToPair(trade.pair);
    });

    const server = http.createServer(app);
    const io = new Server(server, {
      cors: { origin: "*" },
    });

    // SOCKET
    io.on("connection", (socket) => {
      const role = socket.handshake.query.role || "unknown";
      const userId = socket.handshake.query.userId;

      console.log(`✅ Socket connected: ${socket.id} role: ${role} user: ${userId}`);

      // User/Admin message send
      socket.on("send_message", async (data) => {
        const { userId, sender, text } = data;
        if (!userId || !text) return;

        // DB save
        let ticket = await Support.findOne({ userId });
        if (!ticket) ticket = new Support({ userId, messages: [] });

        ticket.messages.push({ sender, text });
        ticket.status = "pending";
        await ticket.save();

        // Emit message
        io.emit("receive_message", {
          userId,
          sender,
          text,
          createdAt: new Date(),
        });
      });

      socket.on("disconnect", () => {
        console.log(`⚠️ Socket disconnected: ${socket.id}`);
      });
    });

    server.listen(5000, () => console.log("🚀 Server running on port 5000"));

  } catch (err) {
    console.error('❌ DB Connection Failed:', err);
  }
}

startServer();
