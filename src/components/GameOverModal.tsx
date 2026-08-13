import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Home, Trophy, Gauge, CircleDollarSign } from 'lucide-react';

interface GameOverModalProps {
  score: number;
  distance: number;
  orbsCollected: number;
  highScore: number;
  isNewHighScore: boolean;
  onRetry: () => void;
  onHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  distance,
  orbsCollected,
  highScore,
  isNewHighScore,
  onRetry,
  onHome,
}) => {
  useEffect(() => {
    if (isNewHighScore) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#ef4444', '#10b981', '#3b82f6'],
      });
    }
  }, [isNewHighScore]);

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 select-none">
      <div className="bg-white border-2 border-slate-200 rounded-2xl sm:rounded-3xl w-full max-w-md p-3.5 sm:p-6 text-center shadow-2xl space-y-3 sm:space-y-5 max-h-[80dvh] overflow-y-auto">
        {/* Title */}
        <div>
          <h2 className="text-2xl font-black text-rose-600 tracking-tight uppercase">
            DELIVERY SESSION ENDED
          </h2>
          <p className="text-xs text-slate-500 font-extrabold mt-1 uppercase tracking-widest">
            Run Telemetry Results
          </p>
        </div>

        {/* New High Score Banner */}
        {isNewHighScore && (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-center gap-2 text-amber-900 text-xs font-black animate-bounce">
            <Trophy className="w-5 h-5 text-amber-600" /> NEW RECORD SCORE!
          </div>
        )}

        {/* Score Card */}
        <div className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-4">
          <div>
            <span className="text-xs text-slate-500 font-black uppercase tracking-wider block">
              TOTAL SCORE
            </span>
            <span className="text-4xl font-mono font-black text-amber-600">
              {score.toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-slate-500 text-xs font-bold mb-1">
                <Gauge className="w-3.5 h-3.5 text-rose-500" /> DISTANCE
              </div>
              <span className="font-mono font-black text-slate-900">{distance}m</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-slate-500 text-xs font-bold mb-1">
                <CircleDollarSign className="w-3.5 h-3.5 text-amber-500" /> TIPS
              </div>
              <span className="font-mono font-black text-slate-900">+${orbsCollected}</span>
            </div>
          </div>
        </div>

        {/* Best Score */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-2 font-mono font-bold">
          <span>BEST RECORD</span>
          <span className="text-slate-900 font-black">{highScore.toLocaleString()} PTS</span>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            id="btn-gameover-home"
            onClick={onHome}
            className="flex-1 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs uppercase tracking-wider border border-slate-300 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Home className="w-4 h-4" /> MAIN MENU
          </button>
          <button
            id="btn-gameover-retry"
            onClick={onRetry}
            className="flex-1 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> RETRY DRIVE
          </button>
        </div>
      </div>
    </div>
  );
};
