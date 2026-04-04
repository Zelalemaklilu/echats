export type CellValue = null | "X" | "O";

export interface TicTacToeState {
  board: CellValue[];
  currentTurn: "X" | "O";
  winner: null | "X" | "O" | "draw";
  startedBy: string;
  playerX: string;
  playerO: string;
}

const WINNING = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

export function createGame(startedBy: string, playerX: string, playerO: string): TicTacToeState {
  return { board: new Array(9).fill(null), currentTurn: "X", winner: null, startedBy, playerX, playerO };
}

export function makeMove(state: TicTacToeState, index: number): TicTacToeState {
  if (state.board[index] || state.winner) return state;
  const board = [...state.board];
  board[index] = state.currentTurn;
  let winner: TicTacToeState["winner"] = null;
  for (const [a, b, c] of WINNING) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) { winner = board[a] as "X" | "O"; break; }
  }
  if (!winner && board.every(Boolean)) winner = "draw";
  return { ...state, board, currentTurn: state.currentTurn === "X" ? "O" : "X", winner };
}

export function serializeGame(state: TicTacToeState): string {
  return btoa(JSON.stringify(state));
}

export function deserializeGame(str: string): TicTacToeState | null {
  try { return JSON.parse(atob(str)); } catch { return null; }
}
