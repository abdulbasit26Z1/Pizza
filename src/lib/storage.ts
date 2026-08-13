import { CarData, GameSettings, GameStats, Mission, VehicleUpgrades } from '../types';

const STORAGE_KEYS = {
  MONEY: 'pizza_driver_money_v2',
  STATS: 'pizza_driver_stats_v2',
  UPGRADES: 'pizza_driver_upgrades_v2',
  UNLOCKED_CARS: 'pizza_driver_unlocked_cars_v2',
  SELECTED_CAR: 'pizza_driver_selected_car_v2',
  SETTINGS: 'pizza_driver_settings_v2',
  MISSIONS: 'pizza_driver_missions_v2',
};

export const INITIAL_CARS: CarData[] = [
  {
    id: 'pizza_hatch',
    name: 'Speedy Hatch 1.4',
    description: 'Compact delivery hatchback with nimble turning in city traffic.',
    price: 0,
    unlocked: true,
    topSpeed: 120,
    acceleration: 1.2,
    handling: 1.4,
    fuelCapacity: 45,
    tireDurability: 100,
    primaryColor: '#ef4444', // Red
    accentColor: '#fef08a',  // Cheese yellow
    modelStyle: 'hatchback',
  },
  {
    id: 'urban_sedan',
    name: 'Metro Cruiser Sedan',
    description: 'Comfortable mid-size sedan with extra fuel tank capacity.',
    price: 250,
    unlocked: false,
    topSpeed: 145,
    acceleration: 1.5,
    handling: 1.2,
    fuelCapacity: 60,
    tireDurability: 120,
    primaryColor: '#0284c7', // Blue
    accentColor: '#ffffff',
    modelStyle: 'sedan',
  },
  {
    id: 'express_van',
    name: 'Pizza Express Van',
    description: 'Heavy duty pizza van with reinforced tires and massive hot oven space.',
    price: 600,
    unlocked: false,
    topSpeed: 135,
    acceleration: 1.8,
    handling: 1.0,
    fuelCapacity: 80,
    tireDurability: 160,
    primaryColor: '#16a34a', // Green
    accentColor: '#facc15',
    modelStyle: 'delivery_van',
  },
  {
    id: 'hyper_gt',
    name: 'Apex Pizza Hyper GT',
    description: 'Modified V8 supercar built for sub-2 minute VIP express orders.',
    price: 1200,
    unlocked: false,
    topSpeed: 190,
    acceleration: 2.5,
    handling: 1.8,
    fuelCapacity: 50,
    tireDurability: 110,
    primaryColor: '#a855f7', // Purple
    accentColor: '#00f0ff',
    modelStyle: 'supercar',
  },
];

export const INITIAL_UPGRADES: VehicleUpgrades = {
  speedLevel: 1,
  accelLevel: 1,
  fuelTankLevel: 1,
  tireLevel: 1,
};

export const INITIAL_STATS: GameStats = {
  money: 150, // Starter cash
  totalDeliveries: 0,
  distanceDrivenKm: 0,
  highestTip: 0,
  tiresBurstCount: 0,
  gasRefueledCount: 0,
  repairsCount: 0,
};

export const INITIAL_SETTINGS: GameSettings = {
  musicVolume: 0.6,
  sfxVolume: 0.8,
  vibration: true,
  timeOfDay: 'DAY',
  touchControlMode: 'STEERING_WHEEL',
  steeringSensitivity: 1.0,
};

export const INITIAL_MISSIONS: Mission[] = [
  {
    id: 'm_deliv_5',
    title: 'First Shift Veteran',
    description: 'Complete 5 hot pizza deliveries.',
    reward: 150,
    target: 5,
    progress: 0,
    completed: false,
  },
  {
    id: 'm_dist_10',
    title: 'City Cruiser',
    description: 'Drive a total distance of 10 KM across the city.',
    reward: 200,
    target: 10,
    progress: 0,
    completed: false,
  },
  {
    id: 'm_gas_3',
    title: 'Fuel Collector',
    description: 'Refuel your car at the Gas Station 3 times.',
    reward: 120,
    target: 3,
    progress: 0,
    completed: false,
  },
  {
    id: 'm_tip_50',
    title: '5 Star Driver',
    description: 'Earn a single delivery tip over $50.',
    reward: 250,
    target: 50,
    progress: 0,
    completed: false,
  },
];

export class StorageManager {
  static getMoney(): number {
    const data = localStorage.getItem(STORAGE_KEYS.MONEY);
    return data ? parseInt(data, 10) : 150;
  }

  static setMoney(amount: number): void {
    localStorage.setItem(STORAGE_KEYS.MONEY, amount.toString());
  }

  static addMoney(amount: number): number {
    const current = this.getMoney();
    const updated = current + amount;
    this.setMoney(updated);
    return updated;
  }

  static getStats(): GameStats {
    const data = localStorage.getItem(STORAGE_KEYS.STATS);
    return data ? { ...INITIAL_STATS, ...JSON.parse(data) } : INITIAL_STATS;
  }

  static saveStats(stats: GameStats): void {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  }

  static getUpgrades(): VehicleUpgrades {
    const data = localStorage.getItem(STORAGE_KEYS.UPGRADES);
    return data ? { ...INITIAL_UPGRADES, ...JSON.parse(data) } : INITIAL_UPGRADES;
  }

  static saveUpgrades(upgrades: VehicleUpgrades): void {
    localStorage.setItem(STORAGE_KEYS.UPGRADES, JSON.stringify(upgrades));
  }

  static getUnlockedCars(): string[] {
    const data = localStorage.getItem(STORAGE_KEYS.UNLOCKED_CARS);
    return data ? JSON.parse(data) : ['pizza_hatch'];
  }

  static unlockCar(carId: string): void {
    const current = this.getUnlockedCars();
    if (!current.includes(carId)) {
      current.push(carId);
      localStorage.setItem(STORAGE_KEYS.UNLOCKED_CARS, JSON.stringify(current));
    }
  }

  static getSelectedCarId(): string {
    return localStorage.getItem(STORAGE_KEYS.SELECTED_CAR) || 'pizza_hatch';
  }

  static setSelectedCarId(carId: string): void {
    localStorage.setItem(STORAGE_KEYS.SELECTED_CAR, carId);
  }

  static getSettings(): GameSettings {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? { ...INITIAL_SETTINGS, ...JSON.parse(data) } : INITIAL_SETTINGS;
  }

  static saveSettings(settings: GameSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  static getMissions(): Mission[] {
    const data = localStorage.getItem(STORAGE_KEYS.MISSIONS);
    return data ? JSON.parse(data) : INITIAL_MISSIONS;
  }

  static saveMissions(missions: Mission[]): void {
    localStorage.setItem(STORAGE_KEYS.MISSIONS, JSON.stringify(missions));
  }

  static updateMissionProgress(metric: 'deliveries' | 'distance' | 'gas' | 'tip', value: number): Mission[] {
    const missions = this.getMissions();
    let rewardsEarned = 0;

    missions.forEach((mission) => {
      if (mission.completed) return;

      if (metric === 'deliveries' && mission.id === 'm_deliv_5') {
        mission.progress += value;
      } else if (metric === 'distance' && mission.id === 'm_dist_10') {
        mission.progress += value;
      } else if (metric === 'gas' && mission.id === 'm_gas_3') {
        mission.progress += value;
      } else if (metric === 'tip' && mission.id === 'm_tip_50') {
        mission.progress = Math.max(mission.progress, value);
      }

      if (mission.progress >= mission.target) {
        mission.completed = true;
        rewardsEarned += mission.reward;
      }
    });

    this.saveMissions(missions);
    if (rewardsEarned > 0) {
      this.addMoney(rewardsEarned);
    }
    return missions;
  }
}

