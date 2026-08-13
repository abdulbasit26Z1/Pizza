import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { CarData, CarTelemetry, GameSettings, GameState, Mission, PizzaOrder, POILocation, VehicleUpgrades } from './types';
import { StorageManager, INITIAL_CARS } from './lib/storage';
import { PizzaDeliveryEngine } from './game/threeEngine';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { MainMenu } from './components/MainMenu';
import { PizzaShopModal } from './components/PizzaShopModal';
import { GasStationModal } from './components/GasStationModal';
import { GarageShopModal } from './components/GarageShopModal';
import { MissionsModal } from './components/MissionsModal';
import { SettingsModal } from './components/SettingsModal';
import { PauseMenu } from './components/PauseMenu';
import { PlayStoreExporterModal } from './components/PlayStoreExporterModal';
import { soundEngine } from './lib/audio';
import { Play, RotateCcw, Home, Bell } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [money, setMoney] = useState<number>(() => StorageManager.getMoney());
  const [selectedCarId, setSelectedCarId] = useState<string>(() => StorageManager.getSelectedCarId());
  const [unlockedCars, setUnlockedCars] = useState<string[]>(() => StorageManager.getUnlockedCars());
  const [upgrades, setUpgrades] = useState<VehicleUpgrades>(() => StorageManager.getUpgrades());
  const [stats, setStats] = useState(() => StorageManager.getStats());
  const [settings, setSettings] = useState<GameSettings>(() => StorageManager.getSettings());
  const [missions, setMissions] = useState<Mission[]>(() => StorageManager.getMissions());

  // In-Game Dynamic State
  const [telemetry, setTelemetry] = useState<CarTelemetry>({
    speed: 0,
    fuel: 45,
    maxFuel: 45,
    tireHealth: 100,
    engineHealth: 100,
    isTireBurst: false,
    gear: 'D',
    x: 0,
    z: 0,
    rotationY: 0,
  });

  const [activeOrder, setActiveOrder] = useState<PizzaOrder | null>(null);
  const [toastAlert, setToastAlert] = useState<{ msg: string; type: 'info' | 'warning' | 'success' | 'danger' } | null>(null);

  // Modals & Interaction Bays
  const [showPizzaShopModal, setShowPizzaShopModal] = useState(false);
  const [showGasStationModal, setShowGasStationModal] = useState(false);
  const [showGarageModal, setShowGarageModal] = useState(false);
  const [showMissionsModal, setShowMissionsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPlayStoreExporterModal, setShowPlayStoreExporterModal] = useState(false);

  const engineRef = useRef<PizzaDeliveryEngine | null>(null);

  const selectedCarData: CarData =
    INITIAL_CARS.find((c) => c.id === selectedCarId) || INITIAL_CARS[0];

  useEffect(() => {
    soundEngine.setVolumes(settings.musicVolume, settings.sfxVolume);
  }, [settings]);

  // Alert toast helper
  const triggerToast = (msg: string, type: 'info' | 'warning' | 'success' | 'danger' = 'info') => {
    setToastAlert({ msg, type });
    setTimeout(() => {
      setToastAlert(null);
    }, 3500);
  };

  // Engine Callbacks
  const handleTelemetryUpdate = useCallback((tel: CarTelemetry) => {
    setTelemetry(tel);
  }, []);

  const handleOrderUpdate = useCallback((order: PizzaOrder | null) => {
    setActiveOrder(order);
  }, []);

  const handleAlert = useCallback((message: string, type: 'info' | 'warning' | 'success' | 'danger') => {
    triggerToast(message, type);
  }, []);

  const handleEnterPOI = useCallback((poi: POILocation) => {
    if (poi.type === 'PIZZA_SHOP') {
      setShowPizzaShopModal(true);
    } else if (poi.type === 'GAS_STATION') {
      setShowGasStationModal(true);
    } else if (poi.type === 'REPAIR_SHOP') {
      setShowGarageModal(true);
    }
  }, []);

  const handleDeliveryComplete = useCallback((reward: number, tip: number) => {
    const totalEarned = reward + tip;
    const newMoney = StorageManager.addMoney(totalEarned);
    setMoney(newMoney);

    const curStats = StorageManager.getStats();
    const updatedStats = {
      ...curStats,
      totalDeliveries: curStats.totalDeliveries + 1,
      highestTip: Math.max(curStats.highestTip, tip),
    };
    StorageManager.saveStats(updatedStats);
    setStats(updatedStats);

    StorageManager.updateMissionProgress('deliveries', 1);
    if (tip >= 50) {
      StorageManager.updateMissionProgress('tip', tip);
    }
    setMissions(StorageManager.getMissions());
  }, []);

  const handleMissionFail = useCallback((reason: string) => {
    triggerToast(`Delivery failed: ${reason}`, 'danger');
  }, []);

  const engineCallbacks = useMemo(
    () => ({
      onTelemetryUpdate: handleTelemetryUpdate,
      onOrderUpdate: handleOrderUpdate,
      onAlert: handleAlert,
      onEnterPOI: handleEnterPOI,
      onDeliveryComplete: handleDeliveryComplete,
      onMissionFail: handleMissionFail,
    }),
    [
      handleTelemetryUpdate,
      handleOrderUpdate,
      handleAlert,
      handleEnterPOI,
      handleDeliveryComplete,
      handleMissionFail,
    ]
  );

  // Actions
  const handleStartGame = () => {
    setGameState('DRIVING');
    if (engineRef.current) {
      engineRef.current.start();
    }
  };

  const handlePauseGame = () => {
    if (gameState === 'DRIVING') {
      setGameState('PAUSED');
      if (engineRef.current) {
        engineRef.current.pause();
      }
    }
  };

  const handleResumeGame = () => {
    if (gameState === 'PAUSED') {
      setGameState('DRIVING');
      if (engineRef.current) {
        engineRef.current.resume();
      }
    }
  };

  const handleReturnToMenu = () => {
    setGameState('MENU');
    if (engineRef.current) {
      engineRef.current.stop();
    }
  };

  const handleAcceptOrder = (
    order: PizzaOrder,
    customSettings?: {
      timeOfDay?: 'DAY' | 'SUNSET' | 'NIGHT';
      touchControlMode?: 'STEERING_WHEEL' | 'BUTTONS' | 'ACCELEROMETER';
    }
  ) => {
    setShowPizzaShopModal(false);

    if (customSettings) {
      const updatedSettings = {
        ...settings,
        ...(customSettings.timeOfDay && { timeOfDay: customSettings.timeOfDay }),
        ...(customSettings.touchControlMode && { touchControlMode: customSettings.touchControlMode }),
      };
      setSettings(updatedSettings);
      StorageManager.saveSettings(updatedSettings);

      if (customSettings.timeOfDay && engineRef.current) {
        engineRef.current.setTimeOfDay(customSettings.timeOfDay);
      }
    }

    if (engineRef.current) {
      engineRef.current.setActiveOrder(order);
    }

    if (gameState !== 'DRIVING') {
      setGameState('DRIVING');
      engineRef.current?.start();
    }
  };

  const handleRefuel = (cost: number, liters: number) => {
    if (money >= cost) {
      const newMoney = money - cost;
      StorageManager.setMoney(newMoney);
      setMoney(newMoney);

      if (engineRef.current) {
        engineRef.current.refuelCar(liters);
      }

      StorageManager.updateMissionProgress('gas', 1);
      setMissions(StorageManager.getMissions());
      triggerToast(`Refueled +${liters}L of gas! -$${cost}`, 'success');
    }
  };

  const handleQuickRefuel = () => {
    handleRefuel(30, 20);
  };

  const handleQuickRepair = () => {
    if (money >= 40) {
      const newMoney = money - 40;
      StorageManager.setMoney(newMoney);
      setMoney(newMoney);

      if (engineRef.current) {
        engineRef.current.repairCar();
      }
      triggerToast('Vehicle repaired! -$40', 'success');
    } else {
      triggerToast('Not enough cash to repair!', 'danger');
    }
  };

  const handleSelectCar = (carId: string) => {
    setSelectedCarId(carId);
    StorageManager.setSelectedCarId(carId);
    triggerToast('New vehicle equipped!', 'success');
  };

  const handleBuyCar = (car: CarData) => {
    if (money >= car.price) {
      const newMoney = money - car.price;
      StorageManager.setMoney(newMoney);
      setMoney(newMoney);

      StorageManager.unlockCar(car.id);
      setUnlockedCars(StorageManager.getUnlockedCars());

      handleSelectCar(car.id);
    }
  };

  const handleUpgradeStat = (stat: keyof VehicleUpgrades, cost: number) => {
    if (money >= cost) {
      const newMoney = money - cost;
      StorageManager.setMoney(newMoney);
      setMoney(newMoney);

      const updatedUpgrades = {
        ...upgrades,
        [stat]: upgrades[stat] + 1,
      };
      StorageManager.saveUpgrades(updatedUpgrades);
      setUpgrades(updatedUpgrades);
      triggerToast(`Upgraded ${stat}!`, 'success');
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-100 font-sans select-none">
      {/* 3D WebGL Canvas Layer */}
      <GameCanvas
        carData={selectedCarData}
        timeOfDay={settings.timeOfDay}
        gameState={gameState}
        callbacks={engineCallbacks}
        engineRef={engineRef}
      />

      {/* TOAST ALERT OVERLAY */}
      {toastAlert && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-bounce">
          <div
            className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider shadow-2xl flex items-center gap-2 border ${
              toastAlert.type === 'danger'
                ? 'bg-rose-600 border-rose-400 text-white'
                : toastAlert.type === 'success'
                ? 'bg-emerald-600 border-emerald-400 text-white'
                : 'bg-amber-500 border-amber-300 text-slate-950'
            }`}
          >
            <Bell className="w-4 h-4" /> {toastAlert.msg}
          </div>
        </div>
      )}

      {/* MAIN MENU */}
      {gameState === 'MENU' && (
        <MainMenu
          onStartGame={handleStartGame}
          onOpenShop={() => setShowGarageModal(true)}
          onOpenMissions={() => setShowMissionsModal(true)}
          onOpenSettings={() => setShowSettingsModal(true)}
          onOpenOrderPicker={() => setShowPizzaShopModal(true)}
          money={money}
          totalDeliveries={stats.totalDeliveries}
          selectedCar={selectedCarData}
        />
      )}

      {/* IN-GAME HUD */}
      {gameState === 'DRIVING' && (
        <HUD
          telemetry={telemetry}
          activeOrder={activeOrder}
          poiLocations={[]}
          money={money}
          timeOfDay={settings.timeOfDay}
          touchControlMode={settings.touchControlMode}
          isHeadlightsOn={engineRef.current?.getIsHeadlightsOn() || false}
          onPause={handlePauseGame}
          onGearChange={(gear) => engineRef.current?.setGear(gear)}
          onHonk={() => engineRef.current?.honk()}
          onToggleCamera={() => engineRef.current?.toggleCamera()}
          onToggleHeadlights={() => engineRef.current?.toggleHeadlights()}
          onRefuelQuick={handleQuickRefuel}
          onRepairQuick={handleQuickRepair}
          onOpenOrderPicker={() => setShowPizzaShopModal(true)}
          onTriggerPOI={() => engineRef.current?.triggerCurrentPOI()}
          onThrottleStart={() => engineRef.current?.setTouchThrottle(1)}
          onThrottleEnd={() => engineRef.current?.setTouchThrottle(0)}
          onBrakeStart={() => engineRef.current?.setTouchBrake(1)}
          onBrakeEnd={() => engineRef.current?.setTouchBrake(0)}
          onSteerChange={(val) => engineRef.current?.setTouchSteer(val)}
        />
      )}

      {/* PAUSE SCREEN */}
      {gameState === 'PAUSED' && (
        <PauseMenu
          settings={settings}
          onSettingsUpdate={(newSettings) => {
            setSettings(newSettings);
            StorageManager.saveSettings(newSettings);
            if (engineRef.current) {
              engineRef.current.setTimeOfDay(newSettings.timeOfDay);
            }
          }}
          onResume={handleResumeGame}
          onRestartGame={() => {
            handleResumeGame();
            if (engineRef.current) {
              engineRef.current.resetCarPosition();
            }
          }}
          onExitToMenu={handleReturnToMenu}
        />
      )}

      {/* MODALS */}
      {showPizzaShopModal && (
        <PizzaShopModal
          onAcceptOrder={handleAcceptOrder}
          onClose={() => setShowPizzaShopModal(false)}
          currentSettings={settings}
        />
      )}

      {showGasStationModal && (
        <GasStationModal
          currentFuel={telemetry.fuel}
          maxFuel={telemetry.maxFuel}
          money={money}
          onRefuel={handleRefuel}
          onClose={() => setShowGasStationModal(false)}
        />
      )}

      {showGarageModal && (
        <GarageShopModal
          unlockedCars={unlockedCars}
          selectedCarId={selectedCarId}
          upgrades={upgrades}
          money={money}
          onSelectCar={handleSelectCar}
          onBuyCar={handleBuyCar}
          onUpgradeStat={handleUpgradeStat}
          onClose={() => setShowGarageModal(false)}
        />
      )}

      {showMissionsModal && (
        <MissionsModal
          onClose={() => setShowMissionsModal(false)}
          missions={missions}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
          settings={settings}
          onSettingsUpdate={setSettings}
        />
      )}

      {showPlayStoreExporterModal && (
        <PlayStoreExporterModal onClose={() => setShowPlayStoreExporterModal(false)} />
      )}
    </div>
  );
}
