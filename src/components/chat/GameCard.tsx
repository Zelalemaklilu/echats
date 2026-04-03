// @ts-nocheck
import { useState } from "react";
import { RotateCcw, Trophy } from "lucide-react";
import { makeMove, serializeGame, deserializeGame, createGame, type TicTacToeState } from "@/lib/gameService";
import { chatStore } from "@/lib/chatStore";
import { toast } from "sonner";

interface GameCardProps {
  encodedState: string;
  chatId: string;
  currentUserId: string;
  onSendMove: (text: string) => void;
  isOwn: boolean;
}

export const GameCard = ({ encodedState, chatId, currentUserId, onSendMove, isOwn }: GameCardProps) => {
  const [state, setState] = useState<TicTacToeState | null>(() => deserializeGame(encodedState));

  if (!state) return <div className="px-3 py-2 bg-muted rounded-2xl text-[12px] text-muted-foreground">Game data corrupted</div>;

  const mySymbol = state.playerX === currentUserId ? "X" : "O";
  const isMyTurn = state.currentTurn === mySymbol;

  const handleCellClick = (index: number) => {
    if (!isMyTurn || state.winner || state.board[index]) { toast("Not your turn!"); return; }
    const newState = makeMove(state, index);
    setState(newState);
    onSendMove(`[game:ttt:${serializeGame(newState)}]`);
  };

  const handleNewGame = () => {
    const newState = createGame(currentUserId, currentUserId, state.playerX === currentUserId ? state.playerO : state.playerX);
    onSendMove(`[game:ttt:${serializeGame(newState)}]`);
  };

  const SYMBOLS: Record<string, string> = { X: "✕", O: "○" };

  return (
    <div className="bg-card rounded-2xl border border-border/50 overflow-hidden w-[200px]">
      <div className="bg-primary/10 px-3 py-2 flex items-center justify-between">
        <span className="text-[12px] font-bold text-foreground">Tic-Tac-Toe</span>
        {state.winner ? (
          <div className="flex items-center gap-1">
            <Trophy className="h-3.5 w-3.5 text-yellow-400" />
            <span className="text-[11px] text-yellow-400 font-bold">
              {state.winner === "draw" ? "Draw!" : `${state.winner === mySymbol ? "You" : "They"} won!`}
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-muted-foreground">{isMyTurn ? "Your turn" : "Their turn"}</span>
        )}
      </div>

      <div className="p-3">
        <div className="grid grid-cols-3 gap-1.5">
          {state.board.map((cell, i) => (
            <button
              key={i}
              onClick={() => handleCellClick(i)}
              className={`aspect-square rounded-xl flex items-center justify-center text-[20px] font-bold transition-colors ${
                cell ? "bg-muted cursor-default" :
                isMyTurn && !state.winner ? "bg-muted/40 hover:bg-muted active:bg-muted/60 cursor-pointer" :
                "bg-muted/20 cursor-default"
              } ${cell === "X" ? "text-primary" : cell === "O" ? "text-orange-400" : ""}`}
              data-testid={`game-cell-${i}`}
            >
              {cell ? SYMBOLS[cell] : ""}
            </button>
          ))}
        </div>

        {state.winner && isOwn && (
          <button onClick={handleNewGame} className="mt-2.5 w-full py-2 rounded-xl bg-primary/10 text-primary text-[12px] font-semibold flex items-center justify-center gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" /> Play Again
          </button>
        )}
      </div>
    </div>
  );
};
