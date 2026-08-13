import React from 'react';
import { GameSettings } from '../types';
import { Volume2, VolumeX, Smartphone, Monitor, X } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
  settings: GameSettings;
  onSettingsUpdate: (newSettings: GameSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  settings,
  onSettingsUpdate,
}) => {
  const handleChange = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    onSettingsUpdate({
      ...settings,
      [key]: value,
    });
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
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
            <Monitor className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">GAME SETTINGS</h2>
            <p className="text-xs text-slate-500 font-extrabold">Configure audio, controls & world theme</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Audio Sliders */}
          <div className="space-y-4 bg-slate-50 border-2 border-slate-200 rounded-2xl p-4">
            <div>
              <div className="flex justify-between items-center text-xs font-black text-slate-700 mb-1.5">
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
                onChange={(e) => handleChange('musicVolume', parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-black text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <VolumeX className="w-4 h-4 text-amber-600" /> SFX & ENGINE SOUNDS
                </span>
                <span className="font-mono text-slate-600">{Math.round(settings.sfxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.sfxVolume}
                onChange={(e) => handleChange('sfxVolume', parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>

          {/* Touch Control Selector */}
          <div>
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2 mb-2">
              <Smartphone className="w-4 h-4 text-amber-600" /> MOBILE CONTROLS STYLE
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['STEERING_WHEEL', 'BUTTONS', 'ACCELEROMETER'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleChange('touchControlMode', mode)}
                  className={`py-2.5 rounded-xl border-2 text-xs font-black transition cursor-pointer active:scale-95 ${
                    settings.touchControlMode === mode
                      ? 'border-amber-500 bg-amber-50 text-slate-900 shadow-md'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {mode.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Time of Day */}
          <div>
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2 mb-2">
              <Monitor className="w-4 h-4 text-amber-600" /> TIME OF DAY ENVIRONMENT
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['DAY', 'SUNSET', 'NIGHT'] as const).map((tod) => (
                <button
                  key={tod}
                  onClick={() => handleChange('timeOfDay', tod)}
                  className={`py-2.5 rounded-xl border-2 text-xs font-black transition cursor-pointer active:scale-95 ${
                    settings.timeOfDay === tod
                      ? 'border-amber-500 bg-amber-50 text-slate-900 shadow-md'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tod}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
