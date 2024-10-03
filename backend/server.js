const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors({
  origin: 'http://localhost:3000', // Allow requests from this origin
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000'
  }
});

const rooms = new Map(); // ルームの状態を管理するための簡易的なデータ構造
const othelloRooms = new Map();


io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('existroom', () => {
    // 現在のルームのリストをクライアントに送信
    const roomList = Array.from(othelloRooms.keys());
    socket.emit('hasroom', roomList);
    console.log(rooms)
  });

  socket.on('createothelloRoom', (roomId) => {
    if (!othelloRooms.has(roomId)) {
      othelloRooms.set(roomId, new Set()); // 新しいルームを作成
    }
      othelloRooms.get(roomId).add(socket.id); // ルームにユーザーを追加
      socket.join(roomId);
      socket.emit('roomCreated', roomId);
      console.log(othelloRooms)
      console.log("User created room:", roomId);
  });

  socket.on('joinothelloRoom', (roomId) => {
    console.log(`Received joinothelloRoom event with roomId: ${roomId}`);
    if (othelloRooms.has(roomId)) {
      if (othelloRooms.get(roomId).size < 4) {
        othelloRooms.get(roomId).add(socket.id);
        socket.join(roomId); 
        socket.emit('joinRoomResponse', { success: true, isMax: false });
        console.log("User joined room:", roomId);
      } else { 
        socket.emit('joinRoomResponse', { success: false, isMax: true });
      }
    } else {
      socket.emit('joinRoomResponse', { success: false, isMax: null });
    }
  });
  
  

  // メッセージの送信
  socket.on('sendMessage', (roomId, message) => {
    if (othelloRooms.has(roomId)) {
      io.to(roomId).emit('receiveMessage', { id: socket.id, message });
      console.log(`Message sent to roomId:${roomId}, socket.id:${socket.id}, message:${message}`);
    } else {
      console.log(`Room ${roomId} does not exist`);
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    othelloRooms.forEach((clients, roomId) => {
      clients.delete(socket.id);
      if (clients.size === 0) {
        othelloRooms.delete(roomId); // ルームに誰もいなくなった場合、ルームを削除
      }
    });
  });
});

server.listen(4000, () => {
  console.log('Server is running on port 4000');
});
