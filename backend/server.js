const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { initializeBoard, makeMove, checkWinner, countStones } = require('./utils/gameLogic');

const app = express();
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000'
  }
});

const othelloRooms = new Map();

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('existroom', () => {
    // 現在のルームのリストをクライアントに送信
    const roomList = Array.from(othelloRooms.keys());
    socket.emit('hasroom', roomList);
    console.log(roomList);
  });

  socket.on('createothelloRoom', (roomId) => {
    if (!othelloRooms.has(roomId)) {
      // ゲームの状態を初期化してルームに保存
      const newBoard = initializeBoard();
      othelloRooms.set(roomId, {
        board: newBoard,
        currentPlayerIndex: 0,  // 0番目のプレイヤーからスタート
        players: [],
      });
      console.log(`Room ${roomId} created with board:`, newBoard);
    }
    socket.join(roomId);
    // socket.emit('roomCreated', roomId);
  });

  socket.on('joinothelloRoom', (roomId) => {
    if (othelloRooms.has(roomId)) {
      const room = othelloRooms.get(roomId);

      // プレイヤーがすでに部屋にいないか確認
      if (!room.players.includes(socket.id)) {
        console.log(room.players.length + ':' + room.players)
        if (room.players.length < 4) {  // 最大5プレイヤー (仮に2から5に変更)
          room.players.push(socket.id);  // プレイヤーを追加
          socket.join(roomId);

          // 現在のルームの状態を送信 (board を含む)
          socket.emit('joinRoomResponse', {
            success: true,
            board: room.board,  // ルームの盤面を送信
            currentPlayer: room.players[room.currentPlayerIndex],  // 現在のプレイヤーのID
          });

          console.log(`User ${socket.id} joined room: ${roomId}`);
        } else {
          socket.emit('joinRoomResponse', { success: false, isMax: true });
        }
      } else {
        console.log(`Player ${socket.id} is already in room ${roomId}`);
        console.log(room.players.length + ':' + room.players)
      }
    } else {
      socket.emit('joinRoomResponse', { success: false });
    }
  });

  socket.on('checkothelloRoom', roomId => {
    const isExist = othelloRooms.has(roomId)
    if (isExist) {
      const room = othelloRooms.get(roomId)
      if (room.players.length < 2) {
        socket.emit("othelloRoomResponse", { success: true, isMax: false })
      } else {
        socket.emit("othelloRoomResponse", { success: false, isMax: true })
      }
    }

  })


  socket.on('makeMove', ({ roomId, row, col }) => {
    const room = othelloRooms.get(roomId);
    if (room) {
      const { board, currentPlayerIndex, players } = room;
      const currentPlayer = players[currentPlayerIndex];

      // プレイヤーが順番かどうか確認
      if (socket.id === currentPlayer) {
        const cp = room.players.indexOf(currentPlayer);
        const BorW = cp / 2 === 0
        const newBoard = makeMove(board, row, col, BorW ? 'black' : 'white');

        if (newBoard) {
          // 石を置けた場合、次のプレイヤーへ変更
          const nextPlayerIndex = (currentPlayerIndex + 1) % players.length // 次のプレイヤーのインデックス
          room.board = newBoard;
          room.currentPlayerIndex = nextPlayerIndex;

          const winner = checkWinner(newBoard);
          const stones = countStones(newBoard);

          // クライアントに更新された状態を送信
          io.to(roomId).emit('updateGameState', {
            board: newBoard,
            currentPlayer: players[nextPlayerIndex],  // 次のプレイヤーのID
            winner: winner || null,
            stones
          });


          if (winner) {
            // 勝者が決まった場合、部屋をリセット
            room.board = initializeBoard();
            room.currentPlayerIndex = 0;  // 0番目のプレイヤーからスタート
          }
        }
      } else {
        socket.emit('invalidMove', { message: 'Not your turn!' });
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    othelloRooms.forEach((room, roomId) => {
      const playerIndex = room.players.indexOf(socket.id);
      console.log("A room" + room.players)

      if (playerIndex !== -1) {
        // Remove the player from the room
        room.players.splice(playerIndex, 1);
        console.log(`Player ${socket.id} removed from room ${roomId}`);
        console.log(room.players)

        // If no players are left in the room, delete the room
        if (room.players.length === 0) {
          othelloRooms.delete(roomId);
          console.log(`Room ${roomId} has been deleted because it's empty`);
        }
      }
    });
  });
});

server.listen(4000, () => {
  console.log('Server is running on port 4000');
});
