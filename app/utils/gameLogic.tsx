export type CellValue = 'black' | 'white' | null;
export type BoardState = CellValue[][];
export type Player = 'black' | 'white';
export const num = 4;

export type ChatMessage = {
  playerId: string;
  message: string;
};

export type allPlayer = {
  id: string;
  contribution: number;
  percent: number;
};

