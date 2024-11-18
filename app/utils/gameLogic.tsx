export type CellValue = 'black' | 'white' | null;
export type BoardState = CellValue[][];
export type Player = 'black' | 'white';
export const num = 2;

// // 盤面の初期化を行う関数
// export const initializeBoard = (): BoardState => {
//   const board: BoardState = Array(8).fill(null).map(() => Array(8).fill(null));
//   // オセロの初期配置
//   board[3][3] = 'white';
//   board[3][4] = 'black';
//   board[4][3] = 'black';
//   board[4][4] = 'white';
//   return board;
// };

// // 指定された位置に石を置く処理を行う関数
// export const makeMove = (board: BoardState, row: number, col: number, player: Player): BoardState | null => {
//   if (board[row][col] !== null) {
//     return null; // 指定されたマスにすでに石がある場合はnullを返す
//   }

//   let canFlip = false; // 石を裏返せるかどうかのフラグ
//   const directions = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]]; // 8方向を表す配列
//   const newBoard = board.map(row => [...row]); // 盤面のコピーを作成

//   // 各方向に対してループを行う
//   directions.forEach(([dx, dy]) => {
//     // 現在のセルの座標からスタート
//     let x = row + dx;
//     let y = col + dy;
//     let toFlip = []; // 裏返す石を一時的に保存する配列

//     // 次のセルが盤面内にあり、かつ相手の石である間、ループを続ける
//     while (x >= 0 && x < 8 && y >= 0 && y < 8 && board[x][y] === (player === 'black' ? 'white' : 'black')) {
//       toFlip.push([x, y]); // 相手の石の座標をtoFlipに追加
//       x += dx; // 次のセルへ移動（水平方向）
//       y += dy; // 次のセルへ移動（垂直方向）
//     }

//     // もしループの終了時点で、次のセルが盤面内にあり、かつ現在のプレイヤーの石であれば
//     if (x >= 0 && x < 8 && y >= 0 && y < 8 && board[x][y] === player && toFlip.length > 0) {
//       canFlip = true; // 石を裏返すことができる
//       // 裏返す石をすべて現在のプレイヤーの色に変更
//       toFlip.forEach(([fx, fy]) => {
//         newBoard[fx][fy] = player; // 反転可能な石を反転させる
//       });
//     }
//   });

//   if (!canFlip) {
//     return null; // 反転できる石がない場合はnullを返す
//   }

//   newBoard[row][col] = player; // 石を置く
//   return newBoard;
// };

// // 盤面上の黒と白の石の数を数える関数
// export const countStones = (board: BoardState): { black: number, white: number } => {
//   let black = 0, white = 0;
//   board.forEach(row => {
//     row.forEach(cell => {
//       if (cell === 'black') black++;
//       if (cell === 'white') white++;
//     });
//   });
//   return { black, white };
// };

// // ゲームの勝者をチェックする関数
// export const checkWinner = (board: BoardState): Player | 'draw' | null => {
//   const { black, white } = countStones(board);

//   if (black + white === 64 || black === 0 || white === 0) { // 全てのマスが埋まったか、どちらかの石がなくなった場合
//     if (black > white) return 'black';
//     if (white > black) return 'white';
//     return 'draw';
//   }

//   return null; // ゲームがまだ続いている場合はnullを返す
// };

// // 現在のプレイヤーが石を置ける場所があるかどうかをチェックする関数
// export const canMakeMove = (board: BoardState, player: Player): boolean => {
//   for (let row = 0; row < 8; row++) {
//     for (let col = 0; col < 8; col++) {
//       if (makeMove(board, row, col, player)) {
//         return true; // 石を置ける場所がある場合はtrueを返す
//       }
//     }
//   }
//   return false; // 石を置ける場所がない場合はfalseを返す
// };

