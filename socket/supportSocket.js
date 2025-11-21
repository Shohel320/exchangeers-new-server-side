// socket/supportSocket.js
const jwt = require("jsonwebtoken");
const Support = require("../models/userSupport");

function supportSocket(io, JWT_SECRET) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    // ✅ Admin (no token)
    if (!token || token === "no-token") {
      socket.user = { role: "admin" };
      return next();
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = { id: decoded.id, role: "user" };
      next();
    } catch (err) {
      console.warn("⚠️ Invalid token, treating as admin");
      socket.user = { role: "admin" };
      next();
    }
  });

  io.on("connection", (socket) => {
    console.log(`✅ Socket connected: ${socket.id} user: ${socket.user?.id || socket.user?.role}`);

    // ✅ User/Admin sends message
    socket.on("send_message", async (data) => {
      try {
        const { text, userId } = data;
        if (!text) return;

        // 🔹 যদি ইউজার হয়
        if (socket.user?.role === "user" && socket.user.id) {
          const uid = socket.user.id;
          let ticket = await Support.findOne({ userId: uid });
          if (!ticket) ticket = new Support({ userId: uid, messages: [] });

          ticket.messages.push({ sender: "user", text });
          ticket.status = "pending";
          await ticket.save();

          io.emit("receive_message", {
            userId: uid,
            sender: "user",
            text,
            createdAt: new Date(),
          });
        }
        // 🔹 যদি এডমিন হয়
        else if (socket.user?.role === "admin" && userId) {
          let ticket = await Support.findOne({ userId });
          if (!ticket) ticket = new Support({ userId, messages: [] });

          ticket.messages.push({ sender: "admin", text });
          ticket.status = "answered";
          await ticket.save();

          io.emit("receive_message", {
            userId,
            sender: "admin",
            text,
            createdAt: new Date(),
          });
        }
      } catch (err) {
        console.error("❌ send_message error:", err.message);
      }
    });

    socket.on("disconnect", () => {
      console.log(`⚠️ Socket disconnected: ${socket.id}`);
    });
  });
}

module.exports = supportSocket;
