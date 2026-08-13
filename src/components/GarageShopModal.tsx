import React, { useState } from 'react';
import { CarData, VehicleUpgrades } from '../types';
import { INITIAL_CARS } from '../lib/storage';
import { Car, Wrench, Zap, Lock, Fuel, Disc, X, Check, DollarSign } from 'lucide-react';

interface GarageShopModalProps {
  unlockedCars: string[];
  selectedCarId: string;
  upgrades: VehicleUpgrades;
  money: number;
  onSelectCar: (carId: string) => void;
  onBuyCar: (car: CarData) => void;
  onUpgradeStat: (stat: keyof VehicleUpgrades, cost: number) => void;
  onClose: () => void;
}

export const GarageShopModal: React.FC<GarageShopModalProps> = ({
  unlockedCars,
  selectedCarId,
  upgrades,
  money,
  onSelectCar,
  onBuyCar,
  onUpgradeStat,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'CARS' | 'TUNING'>('CARS');

  const statUpgradeCosts = {
    speedLevel: upgrades.speedLevel * 120,
    accelLevel: upgrades.accelLevel * 100,
    fuelTankLevel: upgrades.fuelTankLevel * 80,
    tireLevel: upgrades.tireLevel * 90,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-white border-2 border-slate-200 rounded-2xl sm:rounded-3xl max-w-2xl w-full p-3.5 sm:p-5 text-slate-900 shadow-2xl relative flex flex-col gap-3 sm:gap-4 max-h-[80dvh] overflow-y-auto">
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 p-2 rounded-full text-slate-500 hover:text-slate-900 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
              <Car className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">Custom Motors Garage</h2>
              <p className="text-xs text-slate-500 font-extrabold">Buy 3D delivery vehicles & upgrade parts</p>
            </div>
          </div>
          <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-2 font-black text-amber-600 text-lg font-mono">
            ${money}
          </div>
        </div>

        {/* TAB TOGGLE */}
        <div className="flex bg-slate-100 border border-slate-200 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('CARS')}
            className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'CARS'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Vehicle Showroom
          </button>
          <button
            onClick={() => setActiveTab('TUNING')}
            className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'TUNING'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Engine & Part Upgrades
          </button>
        </div>

        {/* SHOWROOM TAB */}
        {activeTab === 'CARS' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {INITIAL_CARS.map((car) => {
              const isUnlocked = unlockedCars.includes(car.id);
              const isSelected = selectedCarId === car.id;

              return (
                <div
                  key={car.id}
                  className={`border-2 rounded-2xl p-4 flex flex-col justify-between transition relative ${
                    isSelected
                      ? 'bg-amber-50 border-amber-500 shadow-md'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span
                        className="w-4 h-4 rounded-full border border-slate-300 shadow-sm"
                        style={{ backgroundColor: car.primaryColor }}
                      />
                      {isSelected ? (
                        <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                          EQUIPPED
                        </span>
                      ) : isUnlocked ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-300">
                          UNLOCKED
                        </span>
                      ) : (
                        <span className="text-slate-500 flex items-center gap-1 text-[10px] font-black">
                          <Lock className="w-3 h-3" /> LOCKED
                        </span>
                      )}
                    </div>
                    <h3 className="font-black text-sm text-slate-900">{car.name}</h3>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 font-semibold">{car.description}</p>

                    <div className="mt-3 space-y-1 text-[11px] text-slate-700 font-mono font-bold">
                      <div className="flex justify-between">
                        <span>Top Speed:</span> <span>{car.topSpeed} KM/H</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fuel Capacity:</span> <span>{car.fuelCapacity} L</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200">
                    {isSelected ? (
                      <button disabled className="w-full py-2.5 bg-amber-200 text-amber-950 rounded-xl font-black text-xs cursor-default">
                        Active Vehicle
                      </button>
                    ) : isUnlocked ? (
                      <button
                        onClick={() => onSelectCar(car.id)}
                        className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs transition shadow-sm cursor-pointer"
                      >
                        Select Car
                      </button>
                    ) : (
                      <button
                        onClick={() => onBuyCar(car)}
                        disabled={money < car.price}
                        className={`w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition ${
                          money >= car.price
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md cursor-pointer'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        Buy for ${car.price}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TUNING TAB */}
        {activeTab === 'TUNING' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Speed Upgrade */}
            <div className="bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-amber-600" />
                  <h4 className="font-black text-xs uppercase text-slate-900">Engine Tuning</h4>
                </div>
                <p className="text-[11px] text-slate-500 font-semibold mb-3">Increases maximum top speed capacity.</p>
                <div className="text-xs font-mono font-black text-slate-800 mb-2">Level: {upgrades.speedLevel}</div>
              </div>
              <button
                onClick={() => onUpgradeStat('speedLevel', statUpgradeCosts.speedLevel)}
                disabled={money < statUpgradeCosts.speedLevel}
                className={`w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition ${
                  money >= statUpgradeCosts.speedLevel
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                Upgrade (${statUpgradeCosts.speedLevel})
              </button>
            </div>

            {/* Acceleration Upgrade */}
            <div className="bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Wrench className="w-5 h-5 text-amber-600" />
                  <h4 className="font-black text-xs uppercase text-slate-900">Acceleration Boost</h4>
                </div>
                <p className="text-[11px] text-slate-500 font-semibold mb-3">Quick torque acceleration from standstill.</p>
                <div className="text-xs font-mono font-black text-slate-800 mb-2">Level: {upgrades.accelLevel}</div>
              </div>
              <button
                onClick={() => onUpgradeStat('accelLevel', statUpgradeCosts.accelLevel)}
                disabled={money < statUpgradeCosts.accelLevel}
                className={`w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition ${
                  money >= statUpgradeCosts.accelLevel
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                Upgrade (${statUpgradeCosts.accelLevel})
              </button>
            </div>

            {/* Fuel Tank Upgrade */}
            <div className="bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Fuel className="w-5 h-5 text-sky-600" />
                  <h4 className="font-black text-xs uppercase text-slate-900">Fuel Tank Extension</h4>
                </div>
                <p className="text-[11px] text-slate-500 font-semibold mb-3">Extends total fuel capacity.</p>
                <div className="text-xs font-mono font-black text-slate-800 mb-2">Level: {upgrades.fuelTankLevel}</div>
              </div>
              <button
                onClick={() => onUpgradeStat('fuelTankLevel', statUpgradeCosts.fuelTankLevel)}
                disabled={money < statUpgradeCosts.fuelTankLevel}
                className={`w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition ${
                  money >= statUpgradeCosts.fuelTankLevel
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                Upgrade (${statUpgradeCosts.fuelTankLevel})
              </button>
            </div>

            {/* Tire Grip Upgrade */}
            <div className="bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Disc className="w-5 h-5 text-amber-600" />
                  <h4 className="font-black text-xs uppercase text-slate-900">Heavy Duty Tires</h4>
                </div>
                <p className="text-[11px] text-slate-500 font-semibold mb-3">Increases tire durability & drift control.</p>
                <div className="text-xs font-mono font-black text-slate-800 mb-2">Level: {upgrades.tireLevel}</div>
              </div>
              <button
                onClick={() => onUpgradeStat('tireLevel', statUpgradeCosts.tireLevel)}
                disabled={money < statUpgradeCosts.tireLevel}
                className={`w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition ${
                  money >= statUpgradeCosts.tireLevel
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                Upgrade (${statUpgradeCosts.tireLevel})
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
