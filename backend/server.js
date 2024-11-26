const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const {
  initializeBoard, initializeBoard2, makeMove,
  checkWinner, countStones, canMakeMove,
  judge, initializeCard, images, checkShinkeiWinner,
  createRandomNumber, calculateHitAndBlow
} = require('./utils/gameLogic');

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
const hitandblowRooms = new Map();

const getGameRooms = game => {
  switch (game) {
    case 'othello':
      return othelloRooms;
    case 'shinkei':
      return shinkeiRooms;
    case 'hitandblow':
      return hitandblowRooms;
    default:
      return null;
  }
}

const playersLimit = 4;

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
      console.log(room)
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
            socket.emit('joinShinkeiResponse', {
              success: true,
              cards: room.cards,
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
            io.to(roomId).emit('updatePlayers', room.players);
            // ---------------- hit&blowの処理 -------------------------
          } else if (game === 'hitandblow') {
            const isIncludes = room.players.indexOf(socket.id);
            // const team = isIncludes % 2 === 0 ? room.blue : room.red;
            socket.emit('joinHitAndBlowResponse', {
              success: true,
              currentPlayer: room.players[room.currentPlayerIndex],
            });
            console.log('room:' + room.players[room.currentPlayerIndex])

            if (isIncludes % 2 === 0) {
              io.to(room.players[0]).emit('updateHitAndBlowGameState', {
                currentPlayer: room.players[room.currentPlayerIndex],
                playerCount: room.players.filter(player => player !== null).length,
                isStarted: room.isStarted,
                winner: room.winner,
                number: room.blue,
                team: 'blue'
              });
              io.to(room.players[2]).emit('updateHitAndBlowGameState', {
                currentPlayer: room.players[room.currentPlayerIndex],
                playerCount: room.players.filter(player => player !== null).length,
                isStarted: room.isStarted,
                winner: room.winner,
                number: room.blue,
                team: 'blue'
              });
            } else {
              io.to(room.players[1]).emit('updateHitAndBlowGameState', {
                currentPlayer: room.players[room.currentPlayerIndex],
                playerCount: room.players.filter(player => player !== null).length,
                isStarted: room.isStarted,
                winner: room.winner,
                number: room.red,
                team: 'red'
              });
              io.to(room.players[3]).emit('updateHitAndBlowGameState', {
                currentPlayer: room.players[room.currentPlayerIndex],
                playerCount: room.players.filter(player => player !== null).length,
                isStarted: room.isStarted,
                winner: room.winner,
                number: room.red,
                team: 'red'
              });
            }
            io.to(roomId).emit('updatePlayerCount', {
              playerCount: room.players.filter(player => player !== null).length
            });
            io.to(roomId).emit('updatePlayers', room.players);
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

      if (socket.id === currentPlayer) {
        const cp = room.players.indexOf(currentPlayer);
        const BorW = cp % 2 === 0;
        const newBoard = makeMove(board, row, col, BorW ? 'black' : 'white');

        if (newBoard) {
          if (!room.isStarted) {
            room.isStarted = true;
          }

          const nextPlayerIndex = room.currentPlayerIndex + 1
          room.currentPlayerIndex = nextPlayerIndex % playersLimit
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
        room.players = room.players.map(player => player === room.players[playerIndex] ? null : player);


        if (room.isStarted) {
          const isEvenTeam = playerIndex % 2 === 0;
          const partnerIndex = isEvenTeam ? (playerIndex === 0 ? 2 : 0) : (playerIndex === 1 ? 3 : 1);

          const partnerPlayer = room.players[partnerIndex];

          if (partnerPlayer !== null) {
            room.players[playerIndex] = partnerPlayer;
            room.flippedCardIndex = []
            console.log('room players: ' + room.players);
          } else {
            console.log('room players: ' + room.players);
            console.log('２人いなくなったよお')
          }
        } else {
          room.players[playerIndex] = null;
          room.flippedCardIndex = []
        }
        const activePlayers = room.players.filter(player => player !== null).length;
        const stones = countStones(room.board);
        const winner = checkWinner(room.board);

        // ルームが空の場合は削除
        if (activePlayers === 0) {
          othelloRooms.delete(roomId);
        } else {
          io.to(roomId).emit('updateGameState', {
            board: room.board,
            currentPlayer: room.players[room.currentPlayerIndex],
            winner: winner || null,
            stones,
            playerCount: room.players.filter(player => player !== null).length,
            isStarted: room.isStarted,
            flippedCardIndex: room.flippedCardIndex
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
        room.players = room.players.map(player => player === room.players[playerIndex] ? null : player);


        if (room.isStarted) {
          const isEvenTeam = playerIndex % 2 === 0;
          const partnerIndex = isEvenTeam ? (playerIndex === 0 ? 2 : 0) : (playerIndex === 1 ? 3 : 1);

          const partnerPlayer = room.players[partnerIndex];

          if (partnerPlayer !== null) {
            room.players[playerIndex] = partnerPlayer;
            console.log('room players: ' + room.players);
          } else {
            console.log('room players: ' + room.players);
            console.log('２人いなくなったよお')
          }
        } else {
          room.players[playerIndex] = null;
        }

        judge.forEach(([a, b]) => {
          const playersLeft = room.players[a] === null && room.players[b] === null
          if (playersLeft) {
            io.to(roomId).emit('reset')
            return;
          }
        })
        
        io.to(roomId).emit('updatePlayers', room.players);
        const activePlayers = room.players.filter(player => player !== null).length;

        // ルームが空の場合は削除
        if (activePlayers === 0) {
          shinkeiRooms.delete(roomId);
        } else {
          io.to(roomId).emit('updateShinkeiGameState', {
            cards: room.cards,
            playerCount: room.players.filter(player => player !== null).length,
            currentPlayer: room.players[room.currentPlayerIndex],
            isStarted: room.isStarted,
            flippedCardIndex: room.flippedCardIndex
          });
        }
      }
    });

    // ---------------------Hit&Blow----------------------------------
    hitandblowRooms.forEach((room, roomId) => {
      const playerIndex = room.players.indexOf(socket.id);

      if (playerIndex !== -1) {
        room.players = room.players.map(player => player === room.players[playerIndex] ? null : player);


        if (room.isStarted) {
          const isEvenTeam = playerIndex % 2 === 0;
          const partnerIndex = isEvenTeam ? (playerIndex === 0 ? 2 : 0) : (playerIndex === 1 ? 3 : 1);

          const partnerPlayer = room.players[partnerIndex];

          if (partnerPlayer !== null) {
            room.players[playerIndex] = partnerPlayer;
            console.log('room players: ' + room.players);
          } else {
            console.log('room players: ' + room.players);
            console.log('２人いなくなったよお')
          }
        } else {
          room.players[playerIndex] = null;
        }

        judge.forEach(([a, b]) => {
          const playersLeft = room.players[a] === null && room.players[b] === null
          if (playersLeft) {
            io.to(roomId).emit('reset')
            return;
          }
        })
        io.to(roomId).emit('updatePlayers', room.players);

        const activePlayers = room.players.filter(player => player !== null).length;

        if (activePlayers === 0) {
          hitandblowRooms.delete(roomId);
        } else {
          io.to(roomId).emit('updateHitAndBlowGameState', {
            currentPlayer: room.players[room.currentPlayerIndex],
            playerCount: room.players.filter(player => player !== null).length,
            isStarted: room.isStarted,
            winner: room.winner,
            guesses: {
              teamA: room.guesses.teamA,
              teamB: room.guesses.teamB,
            },
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
        flippedCardIndex: [],
        red: 0,
        blue: 0
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

      if (room.flippedCardIndex.length === 1) {
        room.flippedCardIndex.push(index);
        const firstCard = room.cards[room.flippedCardIndex[0]];
        const secondCard = room.cards[room.flippedCardIndex[1]];

        if (firstCard.num === secondCard.num) {
          firstCard.isMatched = true;
          secondCard.isMatched = true;
          currentPlayerIndex % 2 === 0 ? room.red += 1 : room.blue += 1
        }

        if (checkShinkeiWinner(room)) {
          const winner = room.red > room.blue ? 'red' : room.red < room.blue ? 'blue' : 'draw';
          room.cards = initializeCard();
          room.currentPlayerIndex = 0;
          room.flippedCardIndex = [];

          io.to(roomId).emit('updateShinkeiGameState', {
            cards: room.cards,
            currentPlayer: room.players[room.currentPlayerIndex],
            winner: winner || null,
            flippedCardIndex: room.flippedCardIndex
          });
          return;
        }
        const nextPlayerIndex = room.currentPlayerIndex + 1
        room.currentPlayerIndex = nextPlayerIndex % playersLimit

        // room.currentPlayerIndex += 1
        io.to(roomId).emit('updateShinkeiGameState', {
          cards: room.cards,
          playerCount: room.players.filter((player) => player !== null).length,
          currentPlayer: room.players[room.currentPlayerIndex],
          isStarted: room.isStarted,
          flippedCardIndex: room.flippedCardIndex,
          winner: null
        });
        console.log(`index:${room.flippedCardIndex.length}`)
        room.flippedCardIndex = [];

      } else {

        room.flippedCardIndex.push(index);
        io.to(roomId).emit('updateShinkeiGameState', {
          cards: room.cards,
          playerCount: room.players.filter((player) => player !== null).length,
          currentPlayer: room.players[room.currentPlayerIndex],
          isStarted: room.isStarted,
          flippedCardIndex: room.flippedCardIndex,
          winner: null
        });
        console.log(`index:${room.flippedCardIndex.length}`)
      }

      // Check if the game is over (all cards matched)
      // const allMatched = room.cards.every((card) => card.isMatched);
      // if (allMatched) {
      //   room.winner = currentPlayer; // Assuming currentPlayer wins; adjust logic as needed
      //   io.to(roomId).emit('gameOver', { winner: room.winner });
      // }
    }
  });

  socket.on('createhitandblowRoom', roomId => {
    if (!hitandblowRooms.has(roomId)) {
      const red = createRandomNumber();
      const blue = createRandomNumber();
      hitandblowRooms.set(roomId, {
        currentPlayerIndex: 0,
        players: [],
        guesses: {
          teamA: [],
          teamB: [],
        },
        winner: null,
        isStarted: false,
        red,
        blue,
      });
    }
    socket.join(roomId);
  })

  socket.on('makeGuess', (roomId, guess) => {
    const room = hitandblowRooms.get(roomId);
    const { currentPlayerIndex, players, red, blue, guesses } = room;
    if (!room || room.players.length < playersLimit || socket.id !== players[currentPlayerIndex]) {
      console.log('Not enough players or room does not exist.');
      return;
    }
    const isTeamA = players.indexOf(socket.id) % 2 !== 0 // true => teamA
    if (!room.isStarted) {
      room.isStarted = true;
    }
    const correctAnswer = isTeamA ? blue : red
    const { hit, blow } = calculateHitAndBlow(guess, correctAnswer);
    if (!isTeamA) {
      guesses.teamA.push({ guess, hit, blow })
    } else {
      guesses.teamB.push({ guess, hit, blow })
    }
    room.currentPlayerIndex = (currentPlayerIndex + 1) % room.players.length;

    if (hit === 3 & blow === 0) {
      const red = createRandomNumber();
      const blue = createRandomNumber();
      room.winner = isTeamA ? 'red' : 'blue';
      room.isStarted = false;
      room.currentPlayerIndex = 0;
      room.guesses.teamA = [];
      room.guesses.teamB = [];
      room.red = red;
      room.blue = blue;
      // io.to(roomId).emit('updateHitAndBlowGameState', {
      //   currentPlayer: room.players[room.currentPlayerIndex],
      //   playerCount: room.players.filter(player => player !== null).length,
      //   isStarted: room.isStarted,
      //   winner: room.winner,
      //   red: room.red,
      //   blue: room.blue,
      //   guesses: {
      //     teamA: guesses.teamA,
      //     teamB: guesses.teamB,
      //   },
      // });
      players.forEach((player, index) => {
        if (player !== null) {
          const isPlayerTeamA = index % 2 !== 0;
          const teamData = isPlayerTeamA
            ? room.red
            : room.blue

          io.to(player).emit('updateHitAndBlowGameState', {
            currentPlayer: room.players[room.currentPlayerIndex],
            playerCount: room.players.filter((player) => player !== null).length,
            isStarted: room.isStarted,
            winner: room.winner,
            number:teamData,
            guesses: {
              teamA: guesses.teamA,
              teamB: guesses.teamB,
            },
          });
        }
      });
      room.winner = null
    } else {
      io.to(roomId).emit('updateHitAndBlowGameState', {
        currentPlayer: room.players[room.currentPlayerIndex],
        playerCount: room.players.filter(player => player !== null).length,
        isStarted: room.isStarted,
        winner: room.winner,
        guesses: {
          teamA: guesses.teamA,
          teamB: guesses.teamB,
        },
      });
    }
  })
});



server.listen(4000, () => {
  console.log('Server is running on port 4000');
}); 