const { createServer } = require("http");
const { Server } = require("socket.io");

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

let waitingUsers = [];

io.on("connection", (socket) => {
  socket.on("find-stranger", () => {
    if (socket.room) {
      socket.to(socket.room).emit("stranger-disconnected");
      socket.leave(socket.room);
      socket.room = null;
    }
    if (waitingUsers.length > 0) {
      const strangerSocket = waitingUsers.shift();
      const roomId = `${socket.id}#${strangerSocket.id}`;
      socket.join(roomId);
      strangerSocket.join(roomId);
      socket.room = roomId;
      strangerSocket.room = roomId;
      socket.emit("matched", { isInitiator: true });
      strangerSocket.emit("matched", { isInitiator: false });
    } else {
      waitingUsers.push(socket);
    }
  });

  socket.on("send-message", (data) => {
    if (socket.room) {
      socket.to(socket.room).emit("receive-message", data);
    }
  });

  socket.on("disconnect", () => {
    waitingUsers = waitingUsers.filter((u) => u.id !== socket.id);
    if (socket.room) socket.to(socket.room).emit("stranger-disconnected");
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Signaling server running on port ${PORT}`);
});
