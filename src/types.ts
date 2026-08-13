export type GameState = 'MENU' | 'DRIVING' | 'GARAGE' | 'PIZZA_SHOP' | 'PAUSED' | 'GAMEOVER';

export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD' | 'RUSH_EXPRESS';

export type PizzaType = 'Pepperoni Feast' | 'Supreme Delight' | 'Mega Cheese Burst' | 'Spicy Volcano';

export interface CarData {
  id: string;
  name: string;
  description: string;
  price: number;
  unlocked: boolean;
  topSpeed: number;        // km/h
  acceleration: number;    // force rate
  handling: number;        // turn agility
  fuelCapacity: number;    // liters
  tireDurability: number;  // strength
  primaryColor: string;
  accentColor: string;
  modelStyle: 'hatchback' | 'sedan' | 'delivery_van' | 'supercar';
}

export interface VehicleUpgrades {
  speedLevel: number;
  accelLevel: number;
  fuelTankLevel: number;
  tireLevel: number;
}

export interface CarTelemetry {
  speed: number;           // current speed km/h
  fuel: number;            // current liters
  maxFuel: number;
  tireHealth: number;      // 0 - 100%
  engineHealth: number;    // 0 - 100%
  isTireBurst: boolean;
  gear: 'D' | 'R' | 'P';
  x: number;
  z: number;
  rotationY: number;
  currentPoi?: POILocation | null;
}

export interface OrderCheckpoint {
  id: string;
  name: string;
  x: number;
  z: number;
  completed: boolean;
}

export interface PizzaOrder {
  id: string;
  customerName: string;
  addressName: string;
  distanceMeters: number;
  rewardMoney: number;
  timeLimitSeconds: number;
  remainingSeconds: number;
  targetX: number;
  targetZ: number;
  difficulty: DifficultyLevel;
  pizzaType: PizzaType;
  status: 'AVAILABLE' | 'DELIVERING' | 'COMPLETED' | 'FAILED';
  checkpoints?: OrderCheckpoint[];
  currentCheckpointIndex?: number;
}

export interface POILocation {
  id: string;
  name: string;
  type: 'PIZZA_SHOP' | 'GAS_STATION' | 'REPAIR_SHOP' | 'CUSTOMER';
  x: number;
  z: number;
  color: string;
}

export interface GameStats {
  money: number;
  totalDeliveries: number;
  distanceDrivenKm: number;
  highestTip: number;
  tiresBurstCount: number;
  gasRefueledCount: number;
  repairsCount: number;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  reward: number;
  target: number;
  progress: number;
  completed: boolean;
}

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  vibration: boolean;
  timeOfDay: 'DAY' | 'SUNSET' | 'NIGHT';
  touchControlMode: 'STEERING_WHEEL' | 'BUTTONS' | 'ACCELEROMETER';
  steeringSensitivity: number;
}

export interface AndroidPackageConfig {
  appName: string;
  packageId: string;
  versionName: string;
  versionCode: number;
  primaryThemeColor: string;
  backgroundColor: string;
}

