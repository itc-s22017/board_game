const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { initializeBoard, initializeBoard2, makeMove, checkWinner, countStones, canMakeMove, judge, initializeCard } = require('./utils/gameLogic');

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
const shinkeiRooms = new Map();

const getGameRooms = game => {
  switch (game) {
    case 'othello':
      return othelloRooms;
    case 'shinkei':
      return shinkeiRooms;
    default:
      return null;
  }
}

const playersLimit = 2;

io.on('connection', (socket) => {

  socket.on('existroom', game => {
    const GAME = getGameRooms(game);
    const roomList = Array.from(GAME.keys());
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
  });

  socket.on('joinRoom', (roomId, game) => {
    const GAME = getGameRooms(game);
    if (GAME.has(roomId)) {
      const room = GAME.get(roomId);

      if (!room.players.includes(socket.id)) {
        const activePlayers = room.players.filter(player => player !== null).length;

        if (activePlayers < playersLimit) {
          const findNull = room.players.indexOf(null);
          if (findNull === -1) {
            room.players.push(socket.id);
          } else {
            room.players[findNull] = socket.id;
          }
          socket.join(roomId);

          // ---------------------- Othelloの処理 ----------------------
          if (game === 'othello') {
            socket.emit('joinOthelloResponse', {
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
              playerCount: room.players.filter(player => player !== null).length,
            });
          }

          // ---------------------- Shinkeiの処理 ----------------------
          else if (game === 'shinkei') {
            // ここに神経衰弱の処理を追加
            socket.emit('joinShinkeiResponse', {
              success: true,
              cards: room.cards, // 神経衰弱のカードデータ
              currentPlayer: room.players[room.currentPlayerIndex],
            });

            io.to(roomId).emit('updateShinkeiGameState', {
              cards: room.cards,
              currentPlayer: room.players[room.currentPlayerIndex],
              playerCount: room.players.filter(player => player !== null).length,
              isStarted: room.isStarted,
              winner: room.winner,
              flippedCardIndex: room.flippedCardIndex
            });
          }
        } else {
          socket.emit('joinRoomResponse', { success: false, isMax: true });
        }
      }
    } else {
      socket.emit('joinRoomResponse', { success: false });
    }
  });

  socket.on('checkRoom', (roomId, game) => {
    const GAME = getGameRooms(game);
    const isExist = GAME.has(roomId)
    if (isExist) {
      const room = GAME.get(roomId)
      if (room.players.filter(player => player !== null).length < playersLimit && !room.isStarted) {
        socket.emit("RoomResponse", { success: true, isMax: false })
      } else {
        socket.emit("RoomResponse", { success: false, isMax: true })
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
    // ----------------------Othello----------------------------
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

          judge.forEach(([a, b]) => {
            const playersLeft = room.players[a] === null && room.players[b] === null
            if (playersLeft) {
              room.board = initializeBoard();
              room.currentPlayerIndex = 0;
              io.to(roomId).emit('updateGameState', {
                board: room.board,
                currentPlayer: room.players[room.currentPlayerIndex],
                winner: null,
                stones: countStones(room.board),
              });
              io.to(roomId).emit('reset')
              return;
            }
          })
        }
      }
    });

    // ---------------------------Shinkei----------------------------
    shinkeiRooms.forEach((room, roomId) => {
      const playerIndex = room.players.indexOf(socket.id);

      if (playerIndex !== -1) {
        // プレイヤーを切断
        room.players[playerIndex] = null;

        const activePlayers = room.players.filter(player => player !== null).length;

        // ルームが空の場合は削除
        if (activePlayers === 0) {
          shinkeiRooms.delete(roomId);
        } else {
          // 他のロジックが必要であればここに追加
          // 例: 残りのプレイヤーに状態を通知する
          io.to(roomId).emit('updateShinkeiGameState', {
            cards: room.cards,
            playerCount: room.players.filter(player => player !== null).length,
            currentPlayer: room.players[room.currentPlayerIndex],
            isStarted: room.isStarted,
          });
        }
      }
    });
  });
  // --------------------------Shinkei---------------------------------
  socket.on('createshinkeiRoom', (roomId) => {
    if (!shinkeiRooms.has(roomId)) {
      const newCard = initializeCard();
      shinkeiRooms.set(roomId, {
        cards: newCard,
        currentPlayerIndex: 0,
        players: [],
        winner: null,
        isStarted: false,
        flippedCardIndex: []
      });
    }
    socket.join(roomId);
  });

  socket.on('flipCard', (index, roomId) => {
    const room = shinkeiRooms.get(roomId);
    if (!room || room.players.length < playersLimit) {
      console.log('Not enough players or room does not exist.');
      return;
    }

    const { currentPlayerIndex, players } = room;
    const currentPlayer = players[currentPlayerIndex];

    if (socket.id === currentPlayer) {
      if (!room.isStarted) {
        room.isStarted = true;
      }

      if (room.flippedCardIndex.length === 2) {
        const firstCard = room.cards[room.flippedCardIndex[0]];
        const secondCard = room.cards[room.flippedCardIndex[1]];
        if (firstCard.num === secondCard.num) {
          console.log("HIH")
          firstCard.isMatched = true;
          secondCard.isMatched = true;
        }
        room.flippedCardIndex = [];
      }

      room.flippedCardIndex.push(index);

      io.to(roomId).emit('updateShinkeiGameState', {
        cards: room.cards,
        playerCount: room.players.filter((player) => player !== null).length,
        currentPlayer: room.players[room.currentPlayerIndex],
        isStarted: room.isStarted,
        flippedCardIndex: room.flippedCardIndex,
        winner:null
      });

      // Check if the game is over (all cards matched)
      // const allMatched = room.cards.every((card) => card.isMatched);
      // if (allMatched) {
      //   room.winner = currentPlayer; // Assuming currentPlayer wins; adjust logic as needed
      //   io.to(roomId).emit('gameOver', { winner: room.winner });
      // }
    }
  });
});



server.listen(4000, () => {
  console.log('Server is running on port 4000');
}); 