const { Server } = require("socket.io");
const http = require("http");
const express = require("express");

const app = express();

const server = http.createServer(app);
const allowedOrigins = function (origin, callback) {
  callback(null, origin || true);
};

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const userSocketMap = {}; // {userId: count} for online status tracking

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId !== "undefined") {
    // Join a room specific to this user ID
    socket.join(userId);
    
    // Track online status
    userSocketMap[userId] = (userSocketMap[userId] || 0) + 1;
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  }

  // Call signaling events
  socket.on("call-user", ({ to, offer, fromName, fromImage, callType }) => {
    // Emit to all sockets of the 'to' user room
    socket.to(to).emit("incoming-call", { from: userId, offer, fromName, fromImage, callType });
  });

  socket.on("answer-call", ({ to, answer }) => {
    socket.to(to).emit("call-answered", { answer });
    // Notify other tabs of the answerer to stop ringing
    socket.to(userId).emit("stop-ringing");
  });

  socket.on("reject-call", ({ to }) => {
    socket.to(to).emit("call-rejected");
    // Notify other tabs of the rejecter to stop ringing
    socket.to(userId).emit("stop-ringing");
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    socket.to(to).emit("ice-candidate", { candidate });
  });

  socket.on("end-call", ({ to }) => {
    socket.to(to).emit("call-ended");
  });

  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id);
    if (userId !== "undefined") {
      userSocketMap[userId]--;
      if (userSocketMap[userId] <= 0) {
        delete userSocketMap[userId];
      }
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
  });
});

const getReceiverSocketId = (receiverId) => {
  // Since we use rooms now, we don't strictly need this for internal use
  // but keeping it for compatibility if needed. Returns one if available.
  return receiverId; 
};

module.exports = { app, io, server, getReceiverSocketId };

