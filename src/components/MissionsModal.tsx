import React from 'react';
import { Mission } from '../types';
import { Award, CheckCircle2, X } from 'lucide-react';

interface MissionsModalProps {
  onClose: () => void;
  missions: Mission[];
}

export const MissionsModal: React.FC<MissionsModalProps> = ({ onClose, missions }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-white border-2 border-slate-200 rounded-2xl sm:rounded-3xl max-w-lg w-full p-3.5 sm:p-5 text-slate-900 shadow-2xl relative flex flex-col gap-3 sm:gap-4 max-h-[80dvh] overflow-y-auto">
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 p-2 rounded-full text-slate-500 hover:text-slate-900 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* HEADER */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
            <Award className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">
              DRIVER MISSIONS & ACHIEVEMENTS
            </h2>
            <p className="text-xs text-slate-500 font-extrabold">
              Complete delivery challenges to earn bonus cash ($)
            </p>
          </div>
        </div>

        {/* MISSIONS LIST */}
        <div className="space-y-3">
          {missions.map((mission) => {
            const isCompleted = mission.progress >= mission.target;
            const progressPercent = Math.min(
              100,
              Math.round((mission.progress / mission.target) * 100)
            );

            return (
              <div
                key={mission.id}
                className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 flex flex-col gap-2 transition hover:border-slate-300"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-black text-sm text-slate-900">{mission.title}</h3>
                    <p className="text-xs text-slate-500 font-semibold">{mission.description}</p>
                  </div>
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <span className="text-xs font-mono font-black text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-xl shrink-0">
                      +${mission.reward}
                    </span>
                  )}
                </div>

                {/* PROGRESS BAR */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-600 font-mono">
                    <span>PROGRESS</span>
                    <span>
                      {mission.progress} / {mission.target}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden border border-slate-300">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isCompleted ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
