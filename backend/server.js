const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { initializeBoard, initializeBoard2, makeMove, checkWinner, countStones, canMakeMove } = require('./utils/gameLogic');

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
const playersLimit = 4;

io.on('connection', (socket) => {

  socket.on('existroom', () => {
    // 現在のルームのリストをクライアントに送信
    const roomList = Array.from(othelloRooms.keys());
    socket.emit('hasroom', roomList);
  });

  socket.on('createothelloRoom', (roomId) => {
    if (!othelloRooms.has(roomId)) {
      const newBoard = initializeBoard2();
      othelloRooms.set(roomId, {
        board: newBoard,
        currentPlayerIndex: 0,
        players: [],
        isStarted: false
      });
    }
    socket.join(roomId);
    // socket.emit('roomCreated', roomId);
  });

  socket.on('joinothelloRoom', (roomId) => {
    if (othelloRooms.has(roomId)) {
      const room = othelloRooms.get(roomId);

      if (!room.players.includes(socket.id)) {
        const activePlayers = room.players.filter(player => player !== null).length;
        if (activePlayers < playersLimit) {
          const findNull = room.players.indexOf(null)
          if (findNull === -1) {  // nullが見つからなかったら新しく追加
            room.players.push(socket.id);
          } else {  // nullが見つかったらその場所にsocket.idを代入
            room.players[findNull] = socket.id;
          }

          socket.join(roomId);

          socket.emit('joinRoomResponse', {
            success: true,
            board: room.board,
            currentPlayer: room.players[room.currentPlayerIndex],
          });

          const stones = countStones(room.board);

          io.to(roomId).emit('updateGameState', {
            board: room.board,
            currentPlayer: room.players[room.currentPlayerIndex],
            winner: null,
            stones,
            playerCount: room.players.filter(player => player !== null).length

          });

        } else {
          socket.emit('joinRoomResponse', { success: false, isMax: true });
        }
      } else {
      }
    } else {
      socket.emit('joinRoomResponse', { success: false });
    }
  });

  socket.on('checkothelloRoom', roomId => {
    const isExist = othelloRooms.has(roomId)
    if (isExist) {
      const room = othelloRooms.get(roomId)
      if (room.players.length < playersLimit && !room.isStarted) {
        socket.emit("othelloRoomResponse", { success: true, isMax: false })
      } else {
        socket.emit("othelloRoomResponse", { success: false, isMax: true })
      }
    }

  })


  socket.on('makeMove', ({ roomId, row, col }) => {
    const room = othelloRooms.get(roomId);
    if (room.players.length < playersLimit) {
      console.log('dameeeeeeeeeeeeeeeee');
      return;
    }
    if (room) {
      const { board, currentPlayerIndex, players } = room;
      const currentPlayer = players[currentPlayerIndex];

      // プレイヤーが順番かどうか確認
      if (socket.id === currentPlayer) {
        const cp = room.players.indexOf(currentPlayer);
        const BorW = cp % 2 === 0;
        const newBoard = makeMove(board, row, col, BorW ? 'black' : 'white');

        if (newBoard) {
          if (!room.isStarted) {
            room.isStarted = true;
          }

          let nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
          room.board = newBoard;

          const winner = checkWinner(newBoard);
          const stones = countStones(newBoard);

          if (winner) {
            // 勝者が決まった場合、部屋をリセット
            room.board = initializeBoard();
            room.currentPlayerIndex = 0;
            io.to(roomId).emit('updateGameState', {
              board: room.board,
              currentPlayer: players[room.currentPlayerIndex],
              winner: winner || null,
              stones: countStones(room.board),
            });
            return;
          }

          // 次のプレイヤーが石を置けるか確認
          let hasPassed = false;
          while (!canMakeMove(newBoard, nextPlayerIndex % 2 === 0 ? 'black' : 'white')) {
            nextPlayerIndex = (nextPlayerIndex + 1) % players.length;
            hasPassed = true;
            io.to(roomId).emit('playerPassed', { player: currentPlayer });

            // 全員がパスする場合はゲーム終了
            if (nextPlayerIndex === currentPlayerIndex) {
              const winner = checkWinner(newBoard);
              const stones = countStones(newBoard);
              io.to(roomId).emit('updateGameState', {
                board: newBoard,
                currentPlayer: null,
                winner: winner || null,
                stones,
              });
              return;
            }
          }

          // 現在のプレイヤーがnullの場合、同じ色の次のプレイヤーを探す
          if (players[nextPlayerIndex] === null) {
            const currentPlayerColor = nextPlayerIndex % 2 === 0 ? 'black' : 'white';
            let foundNextPlayer = false;

            // 次のプレイヤーを探す
            for (let i = 0; i < players.length; i++) {
              nextPlayerIndex = (nextPlayerIndex + 1) % players.length;
              if (players[nextPlayerIndex] !== null) {
                const playerColor = nextPlayerIndex % 2 === 0 ? 'black' : 'white';
                // 切断したプレイヤーと異なる色のプレイヤーを探す
                if (playerColor === currentPlayerColor) {
                  foundNextPlayer = true;
                  break;
                }
              }
            }

            // 有効な同じ色のプレイヤーが見つからなかった場合、currentPlayerIndexをnullに設定
            if (!foundNextPlayer) {
              room.currentPlayerIndex = null;
            } else {
              room.currentPlayerIndex = nextPlayerIndex;
            }
          } else {
            // プレイヤーがnullでない場合は、次のプレイヤーのインデックスを更新
            room.currentPlayerIndex = nextPlayerIndex;
          }

          // クライアントに更新された状態を送信
          io.to(roomId).emit('updateGameState', {
            board: newBoard,
            currentPlayer: players[room.currentPlayerIndex],
            winner: winner || null,
            stones,
            isStarted: room.isStarted,
          });

        } else {
          socket.emit('invalidMove', { message: 'そこに石は置けないよ！' });
        }
      }
    }
  });

  socket.on('disconnect', () => {
    othelloRooms.forEach((room, roomId) => {
      const playerIndex = room.players.indexOf(socket.id);

      if (playerIndex !== -1) {
        // プレイヤーを切断
        room.players[playerIndex] = null;

        const activePlayers = room.players.filter(player => player !== null).length;
        const stones = countStones(room.board);
        const winner = checkWinner(room.board);

        // ルームが空の場合は削除
        if (activePlayers === 0) {
          othelloRooms.delete(roomId);
        } else {
          // 現在のプレイヤーの色を決定
          const currentPlayerIndex = room.currentPlayerIndex;
          const currentPlayerColor = currentPlayerIndex % 2 === 0 ? 'black' : 'white';

          // 同じ色の次のプレイヤーを探す
          let nextPlayerIndex = currentPlayerIndex;
          let foundNextPlayer = false;

          for (let i = 0; i < room.players.length; i++) {
            nextPlayerIndex = (nextPlayerIndex + 1) % room.players.length;
            if (room.players[nextPlayerIndex] !== null) {
              const playerColor = nextPlayerIndex % 2 === 0 ? 'black' : 'white';
              // 切断したプレイヤーと異なる色のプレイヤーを探す
              if (playerColor === currentPlayerColor) {
                foundNextPlayer = true;
                break;
              }
            }
          }

          // 同じ色の次のプレイヤーが見つかった場合は設定
          if (foundNextPlayer) {
            room.currentPlayerIndex = nextPlayerIndex;
          } else {
            // 有効なプレイヤーが見つからなかった場合はcurrentPlayerIndexをnullに設定
            room.currentPlayerIndex = null;
          }

          // 更新されたゲーム状態を送信
          io.to(roomId).emit('updateGameState', {
            board: room.board,
            currentPlayer: room.players[room.currentPlayerIndex],
            winner: winner || null,
            stones,
            playerCount: room.players.filter(player => player !== null).length,
            isStarted: room.isStarted,
          });
        }
      }
    });
  });

});

server.listen(4000, () => {
  console.log('Server is running on port 4000');
}); 