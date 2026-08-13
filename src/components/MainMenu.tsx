import React, { useState } from 'react';
import { Play, Car, Award, Settings, DollarSign, Compass, Gauge, Zap, Fuel, Sparkles, Navigation } from 'lucide-react';
import { CarData } from '../types';

interface MainMenuProps {
  onStartGame: () => void;
  onOpenShop: () => void;
  onOpenMissions: () => void;
  onOpenSettings: () => void;
  onOpenOrderPicker: () => void;
  money: number;
  totalDeliveries: number;
  selectedCar: CarData;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  onOpenShop,
  onOpenMissions,
  onOpenSettings,
  onOpenOrderPicker,
  money,
  totalDeliveries,
  selectedCar,
}) => {
  const [showPreGameQuestionModal, setShowPreGameQuestionModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState<'EXPRESS' | 'RUSH' | 'NIGHT'>('EXPRESS');

  const handleConfirmStart = () => {
    setShowPreGameQuestionModal(false);
    onStartGame();
  };

  return (
    <div className="absolute inset-0 z-35 flex flex-col justify-between p-2 sm:p-3 bg-slate-100/95 backdrop-blur-md select-none font-sans text-slate-900 overflow-hidden h-full w-full">
      
      {/* TOP HEADER BAR */}
      <div className="flex items-center justify-between w-full max-w-lg mx-auto shrink-0 mb-2">
        <div className="flex items-center gap-2 bg-white border-2 border-slate-200 rounded-xl sm:rounded-2xl px-3 py-1.5 sm:py-2 shadow-md">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 font-extrabold uppercase block tracking-wider leading-none">
              Driver Balance
            </span>
            <span className="font-mono font-black text-amber-600 text-xs sm:text-base">${money}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border-2 border-slate-200 rounded-xl sm:rounded-2xl px-2.5 py-1.5 sm:py-2 shadow-md">
            <Award className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
            <div>
              <span className="text-[9px] text-slate-500 font-extrabold uppercase block tracking-wider leading-none">
                Deliveries
              </span>
              <span className="font-mono font-black text-slate-900 text-xs sm:text-base">{totalDeliveries}</span>
            </div>
          </div>

          <button
            onClick={onOpenSettings}
            className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white border-2 border-slate-200 text-slate-700 hover:text-amber-600 hover:border-amber-400 active:scale-95 transition shadow-md cursor-pointer"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* CENTER HERO & CAR SHOWCASE */}
      <div className="flex flex-col items-center justify-center text-center space-y-2.5 sm:space-y-3 max-w-lg mx-auto w-full my-auto py-2 shrink-0">
        {/* Title branding */}
        <div className="space-y-0.5">
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 text-[9px] sm:text-[10px] font-black tracking-widest uppercase">
            3D OPEN WORLD DELIVERY SIMULATOR
          </span>
          <h1 className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-900">
            PIZZA EXPRESS <span className="text-amber-500">3D</span>
          </h1>
        </div>

        {/* Selected Car Specs Card */}
        <div className="w-full bg-white border-2 border-slate-200 rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-xl space-y-2 text-left">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Active Vehicle
              </span>
              <h3 className="text-sm sm:text-base font-black text-slate-900">{selectedCar.name}</h3>
            </div>
            <button
              onClick={onOpenShop}
              className="px-2.5 py-1 rounded-lg sm:rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black transition flex items-center gap-1 cursor-pointer shadow-sm"
            >
              <Car className="w-3.5 h-3.5 text-slate-950" /> GARAGE
            </button>
          </div>

          {/* Car Stat Meters */}
          <div className="grid grid-cols-3 gap-1.5 text-[11px] font-extrabold text-slate-700">
            <div className="bg-slate-50 border border-slate-200 p-1.5 sm:p-2 rounded-xl">
              <span className="text-[9px] text-slate-500 block font-bold flex items-center gap-0.5">
                <Gauge className="w-3 h-3 text-amber-600" /> Speed
              </span>
              <span className="font-mono text-xs sm:text-sm font-black text-slate-900">{selectedCar.topSpeed} km/h</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-1.5 sm:p-2 rounded-xl">
              <span className="text-[9px] text-slate-500 block font-bold flex items-center gap-0.5">
                <Zap className="w-3 h-3 text-amber-600" /> Accel
              </span>
              <span className="font-mono text-xs sm:text-sm font-black text-slate-900">{(selectedCar.acceleration * 10).toFixed(0)}/10</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-1.5 sm:p-2 rounded-xl">
              <span className="text-[9px] text-slate-500 block font-bold flex items-center gap-0.5">
                <Fuel className="w-3 h-3 text-sky-600" /> Tank
              </span>
              <span className="font-mono text-xs sm:text-sm font-black text-slate-900">{selectedCar.fuelCapacity} L</span>
            </div>
          </div>
        </div>

        {/* PRIMARY START GAME CTA WITH PRE-GAME SETUP */}
        <button
          onClick={() => setShowPreGameQuestionModal(true)}
          className="w-full py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm sm:text-base tracking-wider shadow-xl hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 border-2 border-amber-300 uppercase cursor-pointer"
        >
          <Play className="w-5 h-5 fill-slate-950 stroke-none" />
          START DRIVING CITY
        </button>
      </div>

      {/* BOTTOM NAVIGATION BAR */}
      <div className="w-full max-w-lg mx-auto grid grid-cols-3 gap-2 shrink-0 mt-2">
        <button
          onClick={onOpenOrderPicker}
          className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white border-2 border-slate-200 hover:border-amber-400 text-slate-800 hover:text-amber-700 active:scale-95 transition shadow-md flex flex-col items-center gap-0.5 cursor-pointer"
        >
          <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
          <span className="text-[10px] sm:text-[11px] font-black uppercase">SELECT ROUTE</span>
        </button>

        <button
          onClick={onOpenShop}
          className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white border-2 border-slate-200 hover:border-amber-400 text-slate-800 hover:text-amber-700 active:scale-95 transition shadow-md flex flex-col items-center gap-0.5 cursor-pointer"
        >
          <Car className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
          <span className="text-[10px] sm:text-[11px] font-black uppercase">GARAGE</span>
        </button>

        <button
          onClick={onOpenMissions}
          className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white border-2 border-slate-200 hover:border-emerald-400 text-slate-800 hover:text-emerald-700 active:scale-95 transition shadow-md flex flex-col items-center gap-0.5 cursor-pointer"
        >
          <Award className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
          <span className="text-[10px] sm:text-[11px] font-black uppercase">MISSIONS</span>
        </button>
      </div>

      {/* PRE-GAME QUESTION / SETUP MODAL BEFORE GAME START */}
      {showPreGameQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in select-none">
          <div className="bg-white border-2 border-slate-200 rounded-2xl sm:rounded-3xl max-w-md w-full p-3.5 sm:p-5 text-slate-900 shadow-2xl space-y-3 sm:space-y-4 max-h-[80dvh] overflow-y-auto">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-2.5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-lg font-black uppercase text-slate-900">PRE-GAME SETUP</h3>
                <p className="text-[10px] sm:text-xs text-slate-500 font-extrabold">Configure delivery shift before starting</p>
              </div>
            </div>

            <div className="space-y-2 sm:space-y-2.5">
              <label className="text-[10px] sm:text-xs font-black text-slate-700 uppercase tracking-wider block">
                SELECT DELIVERY SHIFT TYPE:
              </label>

              {[
                { id: 'EXPRESS', name: 'EXPRESS DAY SHIFT', desc: 'Standard speed & clear daylight city roads' },
                { id: 'RUSH', name: 'SUNSET RUSH HOUR', desc: 'High tips & sunset lighting conditions' },
                { id: 'NIGHT', name: 'NIGHT SPECIALIST', desc: 'Max bonus cash & night neon atmosphere' },
              ].map((shift) => (
                <button
                  key={shift.id}
                  onClick={() => setSelectedShift(shift.id as 'EXPRESS' | 'RUSH' | 'NIGHT')}
                  className={`w-full p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border-2 text-left transition cursor-pointer active:scale-95 ${
                    selectedShift === shift.id
                      ? 'border-amber-500 bg-amber-50 text-slate-900 shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-black text-xs uppercase text-slate-900">{shift.name}</div>
                  <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 mt-0.5">{shift.desc}</div>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 sm:gap-3 pt-1">
              <button
                onClick={() => setShowPreGameQuestionModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-black text-xs uppercase tracking-wider border border-slate-300 transition active:scale-95 cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={handleConfirmStart}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Play className="w-4 h-4 fill-slate-950" /> DRIVE NOW
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
