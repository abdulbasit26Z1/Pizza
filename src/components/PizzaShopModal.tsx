import React, { useState } from 'react';
import { DifficultyLevel, GameSettings, PizzaOrder, PizzaType } from '../types';
import { MapPin, CheckCircle2, Compass, Sun, Sunset, Moon, Sliders, ShoppingBag, Gauge, X, Flame } from 'lucide-react';

interface PizzaShopModalProps {
  onAcceptOrder: (
    order: PizzaOrder,
    customSettings?: {
      timeOfDay: 'DAY' | 'SUNSET' | 'NIGHT';
      touchControlMode: 'STEERING_WHEEL' | 'BUTTONS' | 'ACCELEROMETER';
    }
  ) => void;
  onClose: () => void;
  currentSettings: GameSettings;
}

export const PizzaShopModal: React.FC<PizzaShopModalProps> = ({
  onAcceptOrder,
  onClose,
  currentSettings,
}) => {
  const sampleAddresses = [
    { name: '42 Maple Street, Sector 3', dist: 140, x: -110, z: -80, area: 'Suburban North' },
    { name: '788 Skyline Boulevard, Highrise 12', dist: 220, x: 130, z: 120, area: 'Financial District' },
    { name: '15 Ocean View Avenue', dist: 180, x: -120, z: 110, area: 'Coastal Bay' },
    { name: '302 Cyber Mall Plaza', dist: 260, x: 140, z: -100, area: 'Downtown Core' },
  ];

  const pizzaTypes: { type: PizzaType; desc: string; price: number }[] = [
    { type: 'Pepperoni Feast', desc: 'Double crispy pepperoni & melted mozzarella.', price: 18 },
    { type: 'Supreme Delight', desc: 'Loaded with bell peppers, olives & Italian sausage.', price: 22 },
    { type: 'Mega Cheese Burst', desc: 'Triple cheese stuffed crust with parmesan blend.', price: 24 },
    { type: 'Spicy Volcano', desc: 'Jalapeños, hot chili flakes & spicy buffalo sauce.', price: 20 },
  ];

  const difficulties: { diff: DifficultyLevel; label: string; timer: number; bonus: number }[] = [
    { diff: 'EASY', label: 'Easy Cruise', timer: 120, bonus: 1.0 },
    { diff: 'MEDIUM', label: 'Standard Rush', timer: 90, bonus: 1.3 },
    { diff: 'HARD', label: 'Fast Express', timer: 65, bonus: 1.8 },
    { diff: 'RUSH_EXPRESS', label: 'Insane Rush', timer: 45, bonus: 2.5 },
  ];

  const [selectedAddrIdx, setSelectedAddrIdx] = useState(0);
  const [selectedType, setSelectedType] = useState<PizzaType>('Pepperoni Feast');
  const [selectedDiff, setSelectedDiff] = useState<DifficultyLevel>('MEDIUM');
  const [selectedTime, setSelectedTime] = useState<'DAY' | 'SUNSET' | 'NIGHT'>(currentSettings.timeOfDay || 'DAY');
  const [selectedControls, setSelectedControls] = useState<'STEERING_WHEEL' | 'BUTTONS' | 'ACCELEROMETER'>(
    currentSettings.touchControlMode || 'BUTTONS'
  );

  const [activeTab, setActiveTab] = useState<'ROUTES' | 'CUSTOMIZE'>('ROUTES');

  const currentAddr = sampleAddresses[selectedAddrIdx];
  const currentPizza = pizzaTypes.find((p) => p.type === selectedType) || pizzaTypes[0];
  const currentDiffObj = difficulties.find((d) => d.diff === selectedDiff) || difficulties[1];

  const calculatedReward = Math.round((currentAddr.dist * 0.8 + 40) * currentDiffObj.bonus);

  const handleDispatch = () => {
    const newOrder: PizzaOrder = {
      id: `order_${Date.now()}`,
      customerName: `Customer #${Math.floor(Math.random() * 900 + 100)}`,
      addressName: currentAddr.name,
      distanceMeters: currentAddr.dist,
      rewardMoney: calculatedReward,
      timeLimitSeconds: currentDiffObj.timer,
      remainingSeconds: currentDiffObj.timer,
      targetX: currentAddr.x,
      targetZ: currentAddr.z,
      difficulty: selectedDiff,
      pizzaType: selectedType,
      status: 'DELIVERING',
    };

    onAcceptOrder(newOrder, {
      timeOfDay: selectedTime,
      touchControlMode: selectedControls,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-white border-2 border-slate-200 rounded-2xl sm:rounded-3xl max-w-xl w-full p-3.5 sm:p-5 text-slate-900 shadow-2xl relative flex flex-col gap-3 sm:gap-4 max-h-[80dvh] overflow-y-auto">
        
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
            <Compass className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">
              DELIVERY DISPATCH HUB
            </h2>
            <p className="text-xs text-slate-500 font-extrabold">
              Select delivery destination & click launch immediately
            </p>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex bg-slate-100 border border-slate-200 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('ROUTES')}
            className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'ROUTES'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-4 h-4" /> 1. Select Route & Item
          </button>
          <button
            onClick={() => setActiveTab('CUSTOMIZE')}
            className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'CUSTOMIZE'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" /> 2. Controls & Lighting
          </button>
        </div>

        {/* TAB 1: ROUTES & PIZZA SELECTION */}
        {activeTab === 'ROUTES' && (
          <div className="space-y-4 animate-fade-in">
            {/* DESTINATION ADDRESSES */}
            <div>
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-600" /> Choose Customer Destination
              </label>
              <div className="grid grid-cols-1 gap-2">
                {sampleAddresses.map((addr, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedAddrIdx(idx)}
                    className={`p-3 rounded-2xl border-2 text-left transition flex items-center justify-between cursor-pointer active:scale-95 ${
                      selectedAddrIdx === idx
                        ? 'bg-amber-50 border-amber-500 text-slate-900 font-black shadow-md'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className={`p-2 rounded-xl ${selectedAddrIdx === idx ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 text-slate-700'}`}>
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-slate-900">{addr.name}</div>
                        <div className="text-[10px] text-slate-500 font-extrabold uppercase">{addr.area}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono text-xs font-black text-amber-600 block">{addr.dist}m</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* PIZZA ITEM SELECTION */}
            <div>
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-rose-600" /> Select Pizza Recipe
              </label>
              <div className="grid grid-cols-2 gap-2">
                {pizzaTypes.map((p) => (
                  <button
                    key={p.type}
                    onClick={() => setSelectedType(p.type)}
                    className={`p-3 rounded-2xl border-2 text-left flex flex-col justify-between gap-1 transition cursor-pointer active:scale-95 ${
                      selectedType === p.type
                        ? 'bg-amber-50 border-amber-500 text-slate-900 font-black shadow-md'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900">{p.type}</span>
                      <span className="text-xs font-mono font-black text-amber-600">${p.price}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-semibold truncate">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* DIFFICULTY PRESET CHIPS */}
            <div>
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-emerald-600" /> Timer Difficulty & Multiplier
              </label>
              <div className="grid grid-cols-4 gap-2">
                {difficulties.map((d) => (
                  <button
                    key={d.diff}
                    onClick={() => setSelectedDiff(d.diff)}
                    className={`py-2 px-1 rounded-xl border-2 text-center transition cursor-pointer flex flex-col items-center justify-center active:scale-95 ${
                      selectedDiff === d.diff
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-black shadow-md'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase">{d.diff.replace('_', ' ')}</span>
                    <span className="text-xs font-mono font-black text-emerald-600">{d.bonus}x</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ENVIRONMENT & CONTROLS */}
        {activeTab === 'CUSTOMIZE' && (
          <div className="space-y-4 animate-fade-in">
            {/* TIME OF DAY */}
            <div>
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-600" /> Open World Lighting / Time
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSelectedTime('DAY')}
                  className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                    selectedTime === 'DAY'
                      ? 'bg-amber-50 border-amber-500 text-slate-950 font-black shadow-md'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Sun className="w-5 h-5 text-amber-600" />
                  <span className="text-xs uppercase font-black">Daylight</span>
                </button>
                <button
                  onClick={() => setSelectedTime('SUNSET')}
                  className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                    selectedTime === 'SUNSET'
                      ? 'bg-orange-50 border-orange-500 text-slate-950 font-black shadow-md'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Sunset className="w-5 h-5 text-orange-600" />
                  <span className="text-xs uppercase font-black">Sunset</span>
                </button>
                <button
                  onClick={() => setSelectedTime('NIGHT')}
                  className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                    selectedTime === 'NIGHT'
                      ? 'bg-indigo-50 border-indigo-500 text-slate-950 font-black shadow-md'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Moon className="w-5 h-5 text-indigo-600" />
                  <span className="text-xs uppercase font-black">Night</span>
                </button>
              </div>
            </div>

            {/* TOUCH CONTROLS */}
            <div>
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-purple-600" /> Driving Steering Controls
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedControls('BUTTONS')}
                  className={`w-full p-3 rounded-2xl border-2 text-left flex items-center justify-between transition cursor-pointer active:scale-95 ${
                    selectedControls === 'BUTTONS'
                      ? 'bg-purple-50 border-purple-500 text-purple-950 font-black shadow-md'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div>
                    <div className="text-xs font-black text-slate-900">&lt; &gt; Buttons & Pedals</div>
                    <div className="text-[10px] text-slate-500">Classic on-screen buttons</div>
                  </div>
                </button>
                <button
                  onClick={() => setSelectedControls('STEERING_WHEEL')}
                  className={`w-full p-3 rounded-2xl border-2 text-left flex items-center justify-between transition cursor-pointer active:scale-95 ${
                    selectedControls === 'STEERING_WHEEL'
                      ? 'bg-purple-50 border-purple-500 text-purple-950 font-black shadow-md'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div>
                    <div className="text-xs font-black text-slate-900">Virtual Steering Wheel</div>
                    <div className="text-[10px] text-slate-500">Rotatable steering wheel control</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUMMARY CARRIER & DISPATCH ACTION BUTTON */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
          <div className="flex items-center justify-between text-xs font-black text-slate-800">
            <span className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-600" /> {currentPizza.type} ({currentDiffObj.timer}s limit)
            </span>
            <span className="text-amber-600 font-mono text-sm">+${calculatedReward}</span>
          </div>

          <button
            onClick={handleDispatch}
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" /> DISPATCH ORDER NOW (${calculatedReward})
          </button>
        </div>

      </div>
    </div>
  );
};
