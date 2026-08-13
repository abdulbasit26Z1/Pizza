import React, { useState } from 'react';
import { Fuel, X, CheckCircle } from 'lucide-react';

interface GasStationModalProps {
  currentFuel: number;
  maxFuel: number;
  money: number;
  onRefuel: (cost: number, liters: number) => void;
  onClose: () => void;
}

export const GasStationModal: React.FC<GasStationModalProps> = ({
  currentFuel,
  maxFuel,
  money,
  onRefuel,
  onClose,
}) => {
  const pricePerLiter = 1.8; // $1.8 per liter
  const neededLiters = Math.max(0, Math.round(maxFuel - currentFuel));
  const fullTankCost = Math.round(neededLiters * pricePerLiter);

  const [selectedLiters, setSelectedLiters] = useState(neededLiters);

  const calculatedCost = Math.round(selectedLiters * pricePerLiter);

  const handleRefuelAction = () => {
    if (money < calculatedCost) return;
    onRefuel(calculatedCost, selectedLiters);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-white border-2 border-slate-200 rounded-2xl sm:rounded-3xl max-w-md w-full p-3.5 sm:p-5 text-slate-900 shadow-2xl relative flex flex-col gap-3 sm:gap-4 max-h-[80dvh] overflow-y-auto">
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 p-2 rounded-full text-slate-500 hover:text-slate-900 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* HEADER */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500 text-slate-950 flex items-center justify-center font-black">
            <Fuel className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">SHELL GAS STATION</h2>
            <p className="text-xs text-slate-500 font-extrabold">Refuel your delivery vehicle gas tank</p>
          </div>
        </div>

        {/* CURRENT FUEL METER */}
        <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-700">
            <span>Fuel Level</span>
            <span className="text-sky-600 font-mono font-black">
              {Math.round(currentFuel)} / {maxFuel} Liters
            </span>
          </div>
          <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden border border-slate-300">
            <div
              className="bg-sky-500 h-full transition-all duration-300"
              style={{ width: `${(currentFuel / maxFuel) * 100}%` }}
            />
          </div>
        </div>

        {/* REFUEL SLIDER */}
        <div>
          <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
            <span>Add Fuel (Liters):</span>
            <span className="text-amber-600 font-mono font-black">{selectedLiters} L</span>
          </div>
          <input
            type="range"
            min={1}
            max={neededLiters || 1}
            value={selectedLiters}
            onChange={(e) => setSelectedLiters(parseInt(e.target.value, 10))}
            className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
          />
        </div>

        {/* REFUEL BUTTONS */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setSelectedLiters(Math.min(20, neededLiters))}
            className="p-3 rounded-2xl border-2 border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-black text-slate-800 transition cursor-pointer active:scale-95"
          >
            +20 Liters (${Math.round(20 * pricePerLiter)})
          </button>
          <button
            onClick={() => setSelectedLiters(neededLiters)}
            className="p-3 rounded-2xl border-2 border-sky-300 bg-sky-50 hover:bg-sky-100 text-xs font-black text-sky-900 transition cursor-pointer active:scale-95"
          >
            Full Tank (${fullTankCost})
          </button>
        </div>

        {/* ACTION BUTTON */}
        <button
          onClick={handleRefuelAction}
          disabled={money < calculatedCost || selectedLiters === 0}
          className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer ${
            money < calculatedCost || selectedLiters === 0
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-sky-500 hover:bg-sky-400 text-slate-950'
          }`}
        >
          <CheckCircle className="w-5 h-5" /> REFUEL NOW (${calculatedCost})
        </button>
      </div>
    </div>
  );
};
