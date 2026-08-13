import React from 'react';
import { GameSettings } from '../types';
import { Play, Volume2, VolumeX, Smartphone, Monitor, Compass, RotateCcw } from 'lucide-react';

interface PauseMenuProps {
  settings: GameSettings;
  onSettingsUpdate: (newSettings: GameSettings) => void;
  onResume: () => void;
  onRestartGame?: () => void;
  onExitToMenu: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  settings,
  onSettingsUpdate,
  onResume,
  onRestartGame,
  onExitToMenu,
}) => {
  const handleSettingChange = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    onSettingsUpdate({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-white border-2 border-slate-200 rounded-2xl sm:rounded-3xl max-w-lg w-full p-3.5 sm:p-5 text-slate-900 shadow-2xl flex flex-col gap-3 sm:gap-4 max-h-[80dvh] overflow-y-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-lg shadow-md">
              ⏸
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">GAME PAUSED</h2>
              <p className="text-xs text-slate-500 font-extrabold">Adjust controls, audio & world theme</p>
            </div>
          </div>
          <button
            onClick={onResume}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" /> RESUME
          </button>
        </div>

        {/* ACTIVE CONTROLS CONFIGURATION */}
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-amber-600" /> ACTIVE STEERING CONTROLS
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'BUTTONS', label: '< > BUTTONS' },
                { id: 'STEERING_WHEEL', label: 'STEERING WHEEL' },
                { id: 'ACCELEROMETER', label: 'TILT SENSOR' },
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => handleSettingChange('touchControlMode', mode.id as GameSettings['touchControlMode'])}
                  className={`py-2.5 px-2 rounded-xl border text-xs font-black transition cursor-pointer active:scale-95 ${
                    settings.touchControlMode === mode.id
                      ? 'border-amber-500 bg-amber-500 text-slate-950 shadow-md'
                      : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {/* Steering Sensitivity */}
            <div className="pt-2">
              <div className="flex justify-between items-center text-xs font-black text-slate-700 mb-1">
                <span>STEERING SENSITIVITY</span>
                <span className="font-mono text-amber-600">{Math.round((settings.steeringSensitivity || 1.0) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={settings.steeringSensitivity || 1.0}
                onChange={(e) => handleSettingChange('steeringSensitivity', parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>

          {/* AUDIO VOLUME SLIDERS */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
            <div>
              <div className="flex justify-between items-center text-xs font-black text-slate-700 mb-1">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-amber-600" /> MUSIC VOLUME
                </span>
                <span className="font-mono text-slate-600">{Math.round(settings.musicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.musicVolume}
                onChange={(e) => handleSettingChange('musicVolume', parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-black text-slate-700 mb-1">
                <span className="flex items-center gap-1.5">
                  <VolumeX className="w-4 h-4 text-amber-600" /> SFX & HORN VOLUME
                </span>
                <span className="font-mono text-slate-600">{Math.round(settings.sfxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.sfxVolume}
                onChange={(e) => handleSettingChange('sfxVolume', parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>

          {/* ENVIRONMENT TIME OF DAY */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Monitor className="w-4 h-4 text-amber-600" /> ENVIRONMENT TIME
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['DAY', 'SUNSET', 'NIGHT'] as const).map((tod) => (
                <button
                  key={tod}
                  onClick={() => handleSettingChange('timeOfDay', tod)}
                  className={`py-2 rounded-xl border text-xs font-black transition cursor-pointer active:scale-95 ${
                    settings.timeOfDay === tod
                      ? 'border-amber-500 bg-amber-500 text-slate-950 shadow-md'
                      : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {tod}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BUTTONS */}
        <div className="flex items-center gap-3 pt-2">
          {onRestartGame && (
            <button
              onClick={onRestartGame}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 py-3 rounded-2xl font-black text-xs uppercase tracking-wider border border-slate-300 transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> RESTART CAR
            </button>
          )}
          <button
            onClick={onExitToMenu}
            className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            MAIN MENU
          </button>
          <button
            onClick={onResume}
            className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition active:scale-95 shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
          >
            RESUME
          </button>
        </div>
      </div>
    </div>
  );
};
