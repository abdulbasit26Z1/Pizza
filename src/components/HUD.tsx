import React, { useState, useRef } from 'react';
import { CarTelemetry, PizzaOrder, POILocation } from '../types';
import { Fuel, AlertTriangle, Disc, Navigation, Camera, Volume2, Pause, Compass, MapPin, Sun, Lightbulb } from 'lucide-react';

interface HUDProps {
  telemetry: CarTelemetry;
  activeOrder: PizzaOrder | null;
  poiLocations: POILocation[];
  money: number;
  timeOfDay: string;
  touchControlMode?: 'STEERING_WHEEL' | 'BUTTONS' | 'ACCELEROMETER';
  isHeadlightsOn?: boolean;
  onPause: () => void;
  onGearChange: (gear: 'D' | 'R' | 'P') => void;
  onHonk: () => void;
  onToggleCamera: () => void;
  onToggleHeadlights?: () => void;
  onRefuelQuick: () => void;
  onRepairQuick: () => void;
  onOpenOrderPicker?: () => void;
  onTriggerPOI?: () => void;
  // Touch controls handlers
  onThrottleStart: () => void;
  onThrottleEnd: () => void;
  onBrakeStart: () => void;
  onBrakeEnd: () => void;
  onSteerChange: (val: number) => void;
}

export const HUD: React.FC<HUDProps> = ({
  telemetry,
  activeOrder,
  poiLocations,
  money,
  timeOfDay,
  touchControlMode = 'BUTTONS',
  isHeadlightsOn = false,
  onPause,
  onGearChange,
  onHonk,
  onToggleCamera,
  onToggleHeadlights,
  onRefuelQuick,
  onRepairQuick,
  onOpenOrderPicker,
  onTriggerPOI,
  onThrottleStart,
  onThrottleEnd,
  onBrakeStart,
  onBrakeEnd,
  onSteerChange,
}) => {
  const [steerVal, setSteerVal] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  const fuelPct = Math.round((telemetry.fuel / telemetry.maxFuel) * 100);

  // Active checkpoint calculations
  const currCpIdx = activeOrder?.currentCheckpointIndex || 0;
  const currentTargetCp = activeOrder?.checkpoints?.[currCpIdx];
  const targetX = currentTargetCp ? currentTargetCp.x : activeOrder?.targetX || 0;
  const targetZ = currentTargetCp ? currentTargetCp.z : activeOrder?.targetZ || 0;

  const distanceToTarget = Math.round(Math.hypot(telemetry.x - targetX, telemetry.z - targetZ));

  // Compass direction angle calculation
  const dx = targetX - telemetry.x;
  const dz = targetZ - telemetry.z;
  const targetAngleRad = Math.atan2(dx, dz);
  const diffAngleDeg = Math.round(((targetAngleRad - telemetry.rotationY) * 180) / Math.PI) % 360;

  // Arrow symbol based on relative direction angle
  let directionSymbol = '^';
  if (diffAngleDeg > 45 && diffAngleDeg <= 135) directionSymbol = '>';
  else if (diffAngleDeg < -45 && diffAngleDeg >= -135) directionSymbol = '<';
  else if (Math.abs(diffAngleDeg) > 135) directionSymbol = 'v';

  // Keyboard shortcut for E key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'e' || e.key === 'E') && telemetry.currentPoi && onTriggerPOI) {
        onTriggerPOI();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [telemetry.currentPoi, onTriggerPOI]);

  // Virtual Steering Wheel Drag / Touch Handler
  const handleWheelPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const clickX = e.clientX;
    const deltaX = clickX - centerX;
    const maxOffset = rect.width / 2;
    const clampVal = Math.max(-1, Math.min(1, deltaX / (maxOffset * 0.75)));
    setSteerVal(clampVal);
    onSteerChange(clampVal);
  };

  const resetWheelPointer = () => {
    setSteerVal(0);
    onSteerChange(0);
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2.5 sm:p-3 select-none touch-none">
      {/* TOP HUD BAR */}
      <div className="flex items-start justify-between w-full pointer-events-auto gap-2">
        {/* Money & Status Badge */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-white/20 rounded-xl px-2.5 py-1.5 flex items-center gap-2.5 text-white shadow-lg">
          <div className="flex items-center gap-1">
            <span className="text-amber-400 font-black text-[10px] uppercase tracking-wider">CASH</span>
            <span className="text-base sm:text-lg font-black text-amber-400 font-mono">${money}</span>
          </div>
          <div className="h-4 w-px bg-white/20" />
          <div className="flex items-center gap-1 text-[10px] font-extrabold text-slate-200 uppercase tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {timeOfDay}
          </div>
        </div>

        {/* ACTIVE CHECKPOINT & ROUTE CARD WITH SMOOTH NAVIGATION ARROW */}
        {activeOrder ? (
          <div className="bg-slate-900/80 backdrop-blur-md border-2 border-amber-400/60 rounded-2xl p-3 text-white max-w-[280px] sm:max-w-[320px] w-full shadow-2xl flex items-center gap-3">
            {/* Smooth Rotating Navigation Arrow Icon */}
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center shrink-0 shadow-inner">
              <div 
                className="w-8 h-8 flex items-center justify-center text-amber-400 transition-transform duration-200 ease-out font-black text-xl"
                style={{ transform: `rotate(${diffAngleDeg}deg)` }}
              >
                ▲
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider truncate">
                  {currentTargetCp ? targetCpName(currentTargetCp, currCpIdx, activeOrder.checkpoints?.length || 1) : activeOrder.pizzaType}
                </span>
                <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-mono shrink-0 shadow-sm">
                  {Math.max(0, Math.round(activeOrder.remainingSeconds))}s
                </span>
              </div>
              <div className="text-xs font-black truncate text-white mb-1">
                {activeOrder.addressName}
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1 font-black text-emerald-400 font-mono">
                  {distanceToTarget}m away
                </span>
                <span className="font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-400/30">+${activeOrder.rewardMoney}</span>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={onOpenOrderPicker}
            className="bg-slate-900/50 hover:bg-slate-900/70 backdrop-blur-md border border-amber-400/50 rounded-xl px-3 py-1.5 text-amber-300 text-[11px] font-black flex items-center gap-1.5 shadow-lg cursor-pointer transition active:scale-95"
          >
            <Navigation className="w-3.5 h-3.5 text-amber-400" />
            <span>SELECT DELIVERY ROUTE</span>
          </button>
        )}

        {/* MINI MAP & TOP BUTTONS */}
        <div className="flex items-center gap-1.5">
          {/* MINI MAP COMPASS PREVIEW */}
          <div className="hidden sm:flex bg-slate-900/40 backdrop-blur-md border border-white/20 rounded-xl p-1.5 items-center justify-center w-9 h-9 relative shadow-md">
            <Compass className="w-5 h-5 text-amber-400 animate-pulse" />
            <span className="absolute text-[9px] font-black text-white font-mono">{directionSymbol}</span>
          </div>

          {onToggleHeadlights && (
            <button
              onClick={onToggleHeadlights}
              className={`p-2 rounded-xl border transition active:scale-95 shadow-md cursor-pointer ${
                isHeadlightsOn
                  ? 'bg-amber-500/80 border-amber-300 text-slate-950'
                  : 'bg-slate-900/40 hover:bg-slate-900/60 backdrop-blur-md border-white/20 text-white'
              }`}
              title="Toggle Headlights"
            >
              <Lightbulb className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onToggleCamera}
            className="bg-slate-900/40 hover:bg-slate-900/60 backdrop-blur-md text-white p-2 rounded-xl border border-white/20 transition active:scale-95 shadow-md cursor-pointer"
            title="Camera Mode"
          >
            <Camera className="w-4 h-4" />
          </button>

          <button
            onClick={onPause}
            className="bg-slate-900/40 hover:bg-slate-900/60 backdrop-blur-md text-white p-2 rounded-xl border border-white/20 transition active:scale-95 shadow-md cursor-pointer"
            title="Pause Menu"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MID POI INTERACTION PROMPT & WARNING OVERLAYS */}
      <div className="flex flex-col items-center gap-1.5 pointer-events-auto">
        {telemetry.currentPoi && (
          <button
            onClick={onTriggerPOI}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl border border-amber-300 shadow-xl flex items-center gap-1.5 animate-bounce cursor-pointer active:scale-95 transition"
          >
            <span className="text-[11px] font-black uppercase tracking-wider">
              {telemetry.currentPoi.type === 'PIZZA_SHOP' ? 'ENTER PIZZA HQ (PRESS [E] OR TAP)' :
               telemetry.currentPoi.type === 'GAS_STATION' ? 'ENTER GAS STATION (PRESS [E] OR TAP)' :
               'ENTER REPAIR GARAGE (PRESS [E] OR TAP)'}
            </span>
          </button>
        )}

        {fuelPct <= 15 && (
          <div className="bg-rose-950/80 backdrop-blur-md text-rose-200 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-rose-500/50 shadow-md animate-pulse">
            <Fuel className="w-3.5 h-3.5 text-rose-400" /> LOW FUEL ({fuelPct}%)!
            <button
              onClick={onRefuelQuick}
              className="bg-rose-600 text-white px-2 py-0.5 rounded-lg font-black hover:bg-rose-700 ml-1 shadow-sm cursor-pointer"
            >
              REFUEL ($30)
            </button>
          </div>
        )}

        {telemetry.isTireBurst && (
          <div className="bg-amber-950/80 backdrop-blur-md text-amber-200 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-amber-500/50 shadow-md animate-bounce">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> TIRE BURST!
            <button
              onClick={onRepairQuick}
              className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded-lg font-black hover:bg-amber-400 ml-1 shadow-sm cursor-pointer"
            >
              REPAIR ($40)
            </button>
          </div>
        )}
      </div>

      {/* BOTTOM CONTROL & TELEMETRY DASHBOARD */}
      <div className="flex items-end justify-between w-full pointer-events-auto gap-2">
        {/* LEFT STEERING & GEAR CONTROLS */}
        <div className="flex flex-col items-center gap-1.5">
          {/* GEAR SHIFTER BUTTONS */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-white/20 rounded-xl p-0.5 flex items-center gap-1 shadow-md">
            {(['D', 'R', 'P'] as const).map((gear) => (
              <button
                key={gear}
                onClick={() => onGearChange(gear)}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg font-black text-xs transition active:scale-95 cursor-pointer ${
                  telemetry.gear === gear
                    ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
                    : 'bg-white/10 text-slate-300 hover:text-white'
                }`}
              >
                {gear}
              </button>
            ))}
          </div>

          {/* ACTIVE STEERING TYPE CONTROL */}
          {touchControlMode === 'STEERING_WHEEL' ? (
            /* VIRTUAL STEERING WHEEL CONTROL */
            <div className="flex items-center gap-1.5">
              <div
                ref={wheelRef}
                onPointerDown={handleWheelPointer}
                onPointerMove={(e) => {
                  if (e.buttons > 0) handleWheelPointer(e);
                }}
                onPointerUp={resetWheelPointer}
                onPointerCancel={resetWheelPointer}
                onPointerLeave={resetWheelPointer}
                style={{ transform: `rotate(${steerVal * 65}deg)` }}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white/40 bg-slate-900/50 backdrop-blur-md flex items-center justify-center relative touch-none select-none shadow-xl cursor-pointer transition-transform duration-75"
              >
                {/* Steering Wheel Center Cap & Spokes */}
                <div className="w-7 h-7 rounded-full bg-amber-500 border-2 border-white/60 flex items-center justify-center shadow-inner">
                  <span className="text-[9px] font-black text-slate-950 font-mono">3D</span>
                </div>
                <div className="absolute w-full h-1 bg-white/40 top-1/2 -translate-y-1/2" />
                <div className="absolute h-full w-1 bg-white/40 left-1/2 -translate-x-1/2" />
              </div>

              <button
                onClick={onHonk}
                className="w-8 h-8 bg-amber-500/30 hover:bg-amber-500/50 border border-amber-400/40 text-amber-300 rounded-xl font-black text-[9px] flex items-center justify-center transition active:scale-90 shadow-sm cursor-pointer"
              >
                HORN
              </button>
            </div>
          ) : touchControlMode === 'ACCELEROMETER' ? (
            /* TILT SENSOR DISPLAY & SENSITIVITY ZONES */
            <div className="flex items-center gap-1.5">
              <button
                onMouseDown={() => onSteerChange(-1)}
                onMouseUp={() => onSteerChange(0)}
                onTouchStart={() => onSteerChange(-1)}
                onTouchEnd={() => onSteerChange(0)}
                className="w-12 h-12 bg-slate-900/40 active:bg-amber-500/80 backdrop-blur-md text-white border border-white/20 rounded-xl font-black text-lg flex items-center justify-center shadow-md cursor-pointer"
              >
                &lt;
              </button>
              <div className="px-2 py-1 bg-slate-900/40 backdrop-blur-md border border-white/20 rounded-xl text-[9px] font-black text-amber-400 uppercase tracking-wider text-center">
                TILT
              </div>
              <button
                onMouseDown={() => onSteerChange(1)}
                onMouseUp={() => onSteerChange(0)}
                onTouchStart={() => onSteerChange(1)}
                onTouchEnd={() => onSteerChange(0)}
                className="w-12 h-12 bg-slate-900/40 active:bg-amber-500/80 backdrop-blur-md text-white border border-white/20 rounded-xl font-black text-lg flex items-center justify-center shadow-md cursor-pointer"
              >
                &gt;
              </button>
            </div>
          ) : (
            /* STANDARD BUTTONS MODE (< > BUTTONS) */
            <div className="flex items-center gap-1.5">
              <button
                onMouseDown={() => {
                  setSteerVal(-1);
                  onSteerChange(-1);
                }}
                onMouseUp={() => {
                  setSteerVal(0);
                  onSteerChange(0);
                }}
                onTouchStart={() => {
                  setSteerVal(-1);
                  onSteerChange(-1);
                }}
                onTouchEnd={() => {
                  setSteerVal(0);
                  onSteerChange(0);
                }}
                className="w-11 h-11 sm:w-12 sm:h-12 bg-slate-900/40 active:bg-amber-500/80 text-white active:text-slate-950 border border-white/20 active:border-amber-300 rounded-xl font-black text-xl flex items-center justify-center transition shadow-lg active:scale-95 cursor-pointer backdrop-blur-md"
              >
                &lt;
              </button>
              <button
                onClick={onHonk}
                className="w-8 h-8 sm:w-9 sm:h-9 bg-amber-500/30 hover:bg-amber-500/50 border border-amber-400/40 text-amber-300 rounded-xl font-black text-[9px] flex flex-col items-center justify-center transition active:scale-90 shadow-sm cursor-pointer backdrop-blur-md"
              >
                <span>HORN</span>
              </button>
              <button
                onMouseDown={() => {
                  setSteerVal(1);
                  onSteerChange(1);
                }}
                onMouseUp={() => {
                  setSteerVal(0);
                  onSteerChange(0);
                }}
                onTouchStart={() => {
                  setSteerVal(1);
                  onSteerChange(1);
                }}
                onTouchEnd={() => {
                  setSteerVal(0);
                  onSteerChange(0);
                }}
                className="w-11 h-11 sm:w-12 sm:h-12 bg-slate-900/40 active:bg-amber-500/80 text-white active:text-slate-950 border border-white/20 active:border-amber-300 rounded-xl font-black text-xl flex items-center justify-center transition shadow-lg active:scale-95 cursor-pointer backdrop-blur-md"
              >
                &gt;
              </button>
            </div>
          )}
        </div>

        {/* CENTER SPEEDOMETER & GAUGES */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-white/20 rounded-2xl p-2 sm:p-2.5 flex flex-col items-center gap-1.5 shadow-xl min-w-[140px] sm:min-w-[160px]">
          {/* ANALOG SPEEDOMETER GAUGE WITH ROTATING NEEDLE */}
          <div className="relative w-24 h-14 sm:w-28 sm:h-16 flex items-end justify-center overflow-hidden">
            {/* Gauge Arc Background */}
            <div className="absolute top-0 w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white/20 border-t-amber-400 border-r-amber-400/80 box-border -rotate-45" />
            
            {/* Speedometer Tick Marks */}
            <div className="absolute top-1 w-full flex justify-between px-2 text-[8px] font-mono text-slate-400 font-bold">
              <span>0</span>
              <span>90</span>
              <span>180</span>
            </div>

            {/* Rotating Needle */}
            {(() => {
              const maxSpeed = 180;
              const speedClamped = Math.max(0, Math.min(maxSpeed, telemetry.speed));
              // Map speed 0..180 to angle -90deg..+90deg
              const needleDeg = -90 + (speedClamped / maxSpeed) * 180;
              return (
                <div 
                  className="absolute bottom-0 left-1/2 w-1 h-10 sm:h-12 bg-amber-400 origin-bottom rounded-full transition-transform duration-100 ease-out shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                  style={{ transform: `translateX(-50%) rotate(${needleDeg}deg)` }}
                >
                  <div className="absolute -top-1 -left-1 w-3 h-3 rounded-full bg-amber-300 border border-slate-950 shadow" />
                </div>
              );
            })()}

            {/* Digital Speed Value Overlay */}
            <div className="absolute bottom-0 flex flex-col items-center z-10">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono leading-none">
                {telemetry.speed}
              </span>
              <span className="text-[7px] sm:text-[8px] font-black tracking-widest text-amber-400 uppercase">
                KM/H
              </span>
            </div>
          </div>

          {/* GAUGES (FUEL & TIRES) */}
          <div className="w-full space-y-1 pt-0.5">
            {/* FUEL BAR */}
            <div className="flex items-center gap-1 text-[10px] font-extrabold text-slate-200">
              <Fuel className="w-3 h-3 text-sky-400 shrink-0" />
              <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden border border-white/10">
                <div
                  className={`h-full transition-all duration-300 ${
                    fuelPct < 20 ? 'bg-rose-500' : 'bg-sky-400'
                  }`}
                  style={{ width: `${fuelPct}%` }}
                />
              </div>
              <span className="text-[9px] w-6 text-right font-mono font-bold text-slate-300">{fuelPct}%</span>
            </div>

            {/* TIRE HEALTH BAR */}
            <div className="flex items-center gap-1 text-[10px] font-extrabold text-slate-200">
              <Disc className="w-3 h-3 text-amber-400 shrink-0" />
              <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden border border-white/10">
                <div
                  className={`h-full transition-all duration-300 ${
                    telemetry.isTireBurst
                      ? 'bg-rose-600'
                      : telemetry.tireHealth < 30
                      ? 'bg-amber-500'
                      : 'bg-emerald-400'
                  }`}
                  style={{ width: `${telemetry.tireHealth}%` }}
                />
              </div>
              <span className="text-[9px] w-6 text-right font-mono font-bold text-slate-300">{telemetry.tireHealth}%</span>
            </div>
          </div>
        </div>

        {/* RIGHT SMALL GLASS TRANSLUCENT PEDALS (THROTTLE & BRAKE) */}
        <div className="flex items-end gap-1.5">
          {/* COMPACT TRANSLUCENT BRAKE PEDAL */}
          <button
            onMouseDown={onBrakeStart}
            onMouseUp={onBrakeEnd}
            onTouchStart={onBrakeStart}
            onTouchEnd={onBrakeEnd}
            className="w-11 sm:w-13 h-20 sm:h-22 bg-slate-900/40 active:bg-rose-600/80 backdrop-blur-md text-white border border-white/20 active:border-rose-400 rounded-2xl font-black text-[10px] flex flex-col items-center justify-between py-2 shadow-xl active:scale-95 cursor-pointer relative overflow-hidden transition"
          >
            {/* Rubber Traction Grooves */}
            <div className="w-full flex flex-col gap-1 items-center opacity-50">
              <div className="w-3/4 h-0.5 bg-white rounded-full" />
              <div className="w-3/4 h-0.5 bg-white rounded-full" />
              <div className="w-3/4 h-0.5 bg-white rounded-full" />
            </div>
            <span className="font-black text-[9px] tracking-wider uppercase">BRAKE</span>
          </button>

          {/* COMPACT TRANSLUCENT GAS / THROTTLE PEDAL */}
          <button
            onMouseDown={onThrottleStart}
            onMouseUp={onThrottleEnd}
            onTouchStart={onThrottleStart}
            onTouchEnd={onThrottleEnd}
            className="w-12 sm:w-14 h-24 sm:h-26 bg-slate-900/40 active:bg-emerald-600/80 backdrop-blur-md text-white border border-white/20 active:border-emerald-400 rounded-2xl font-black text-[10px] flex flex-col items-center justify-between py-2.5 shadow-xl active:scale-95 cursor-pointer relative overflow-hidden transition"
          >
            {/* Vertical Traction Slots */}
            <div className="w-full flex justify-center gap-1 opacity-50 h-8 pt-1">
              <div className="w-1 h-full bg-white rounded-full" />
              <div className="w-1 h-full bg-white rounded-full" />
              <div className="w-1 h-full bg-white rounded-full" />
            </div>
            <span className="font-black text-[10px] tracking-wider uppercase">GAS</span>
          </button>
        </div>
      </div>
    </div>
  );
};

function targetCpName(cp: { name: string }, idx: number, total: number): string {
  if (idx === total - 1) return 'FINAL DESTINATION';
  return `CHECKPOINT ${idx + 1} OF ${total - 1}`;
}
