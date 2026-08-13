import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CarData, CarTelemetry, PizzaOrder, POILocation } from '../types';
import { soundEngine } from '../lib/audio';

export interface GameEngineCallbacks {
  onTelemetryUpdate: (telemetry: CarTelemetry) => void;
  onOrderUpdate: (order: PizzaOrder | null) => void;
  onAlert: (message: string, type: 'info' | 'warning' | 'success' | 'danger') => void;
  onEnterPOI: (poi: POILocation) => void;
  onDeliveryComplete: (reward: number, tip: number, rating: number) => void;
  onMissionFail: (reason: string) => void;
}

interface BuildingObstacle {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  height: number;
  name?: string;
  isSoft?: boolean;
}

export class PizzaDeliveryEngine {
  private container: HTMLElement;
  private callbacks: GameEngineCallbacks;

  // Three.js Core
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;

  // Camera Settings
  private cameraMode: '3RD_PERSON' | 'HOOD' = '3RD_PERSON';

  // Game Status
  private isRunning = false;
  private isPaused = false;
  private carData: CarData;

  // Car Physics State
  private x = 0;
  private z = 0;
  private speed = 0; // km/h
  private velocityX = 0;
  private velocityZ = 0;
  private rotationY = 0; // angle in radians
  private steerAngle = 0; // angle in radians
  private maxSteerAngle = 0.52; // ~30 deg
  private currentGear: 'D' | 'R' | 'P' = 'D';

  // Inputs
  private throttleInput = 0; // 0 to 1
  private brakeInput = 0; // 0 to 1
  private steerInput = 0; // -1 (left) to 1 (right)
  private isHandbrake = false;

  // Vehicle Mechanics
  private fuel = 45;
  private maxFuel = 45;
  private tireHealth = 100; // 0 - 100%
  private engineHealth = 100; // 0 - 100%
  private isTireBurst = false;
  private lastCrashTime = 0;

  // Car Meshes
  private carGroup: THREE.Group;
  private carBodyMesh: THREE.Mesh | null = null;
  private steeringWheelGroup: THREE.Group | null = null;
  private wheels: THREE.Mesh[] = [];
  private headlightLights: THREE.SpotLight[] = [];
  private headlightLensMeshes: THREE.Mesh[] = [];
  private taillightMeshes: THREE.Mesh[] = [];
  private leftBlinkerMeshes: THREE.Mesh[] = [];
  private rightBlinkerMeshes: THREE.Mesh[] = [];
  private reverseLightMeshes: THREE.Mesh[] = [];
  private glbCarMesh: THREE.Object3D | null = null;
  private isHeadlightsOn = false;
  private isHazardOn = false;

  // Open World Map & Building Obstacles
  private mapSize = 420; // 420x420 meters
  private obstacles: BuildingObstacle[] = [];
  private poiLocations: POILocation[] = [];
  private poiMarkers: Map<string, THREE.Group> = new Map();

  // Active Order State
  private activeOrder: PizzaOrder | null = null;
  private activeTargetMarker: THREE.Group | null = null;

  // Time of Day
  private timeOfDay: 'DAY' | 'SUNSET' | 'NIGHT' = 'DAY';
  private dirLight: THREE.DirectionalLight | null = null;
  private ambientLight: THREE.AmbientLight | null = null;

  // Particles & Animations
  private smokeParticles: THREE.Points | null = null;
  private sparkGroup: THREE.Group | null = null;
  private animatedBlinkers: THREE.Mesh[] = [];

  constructor(container: HTMLElement, carData: CarData, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.carData = carData;
    this.callbacks = callbacks;

    this.maxFuel = carData.fuelCapacity;
    this.fuel = this.maxFuel;

    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.0032);

    const width = container.clientWidth || window.innerWidth || 800;
    const height = container.clientHeight || window.innerHeight || 600;

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      width / height,
      0.1,
      650
    );

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);
    this.clock = new THREE.Clock();

    // Setup World & Physics
    this.setupLighting();
    this.buildCityWorld();

    // Build Detailed Vehicle Mesh
    this.carGroup = this.buildDetailedCarMesh(carData);
    this.scene.add(this.carGroup);

    // Load External GLB Car Model if available
    this.loadExternalGLBCar('https://raw.githubusercontent.com/youlekong/threejs.github.io/main/car.glb');

    // Particles
    this.smokeParticles = this.createSmokeParticles();
    this.scene.add(this.smokeParticles);

    this.sparkGroup = new THREE.Group();
    this.scene.add(this.sparkGroup);

    // Spawn at Pizza Shop HQ (0, 0)
    this.resetCarPosition(0, 0, 0);

    // Initial render frame
    this.renderFrame();

    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  // --- ENVIRONMENT & LIGHTING ---

  private setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xfffaed, 1.4);
    this.dirLight.position.set(120, 160, 90);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 450;
    const d = 160;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;

    this.scene.add(this.dirLight);
  }

  public setTimeOfDay(time: 'DAY' | 'SUNSET' | 'NIGHT') {
    this.timeOfDay = time;
    if (!this.scene || !this.dirLight || !this.ambientLight) return;

    if (time === 'DAY') {
      this.scene.background = new THREE.Color(0x87ceeb);
      this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.003);
      this.dirLight.color.setHex(0xfffaed);
      this.dirLight.intensity = 1.4;
      this.ambientLight.intensity = 0.75;
      this.headlightLights.forEach((l) => (l.intensity = 0));
    } else if (time === 'SUNSET') {
      this.scene.background = new THREE.Color(0xfdba74);
      this.scene.fog = new THREE.FogExp2(0xfdba74, 0.004);
      this.dirLight.color.setHex(0xf97316);
      this.dirLight.intensity = 1.0;
      this.ambientLight.intensity = 0.5;
      this.headlightLights.forEach((l) => (l.intensity = 2.0));
    } else {
      // NIGHT
      this.scene.background = new THREE.Color(0x0a0a18);
      this.scene.fog = new THREE.FogExp2(0x0a0a18, 0.0055);
      this.dirLight.color.setHex(0x38bdf8);
      this.dirLight.intensity = 0.25;
      this.ambientLight.intensity = 0.2;
      this.headlightLights.forEach((l) => (l.intensity = 4.0));
    }
  }

  // --- CITY WORLD GENERATION & DETAILED BUILDINGS ---

  private buildCityWorld() {
    this.obstacles = [];

    // 1. Asphalt Ground Base
    const groundGeo = new THREE.PlaneGeometry(this.mapSize, this.mapSize);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1e2229,
      roughness: 0.85,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 2. Road Network Grid & Markings
    const blockSize = 55;
    const roadWidth = 15;
    const halfMap = this.mapSize / 2;

    const markingsGroup = new THREE.Group();
    this.scene.add(markingsGroup);

    const yellowMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });

    for (let pos = -halfMap + blockSize / 2; pos <= halfMap - blockSize / 2; pos += blockSize) {
      // Double Yellow Center Lines North-South
      const lineXGeo = new THREE.PlaneGeometry(0.35, this.mapSize);
      const lineX1 = new THREE.Mesh(lineXGeo, yellowMat);
      lineX1.rotation.x = -Math.PI / 2;
      lineX1.position.set(pos - 0.25, 0.02, 0);
      markingsGroup.add(lineX1);

      const lineX2 = new THREE.Mesh(lineXGeo, yellowMat);
      lineX2.rotation.x = -Math.PI / 2;
      lineX2.position.set(pos + 0.25, 0.02, 0);
      markingsGroup.add(lineX2);

      // Double Yellow Center Lines East-West
      const lineZGeo = new THREE.PlaneGeometry(this.mapSize, 0.35);
      const lineZ1 = new THREE.Mesh(lineZGeo, yellowMat);
      lineZ1.rotation.x = -Math.PI / 2;
      lineZ1.position.set(0, 0.02, pos - 0.25);
      markingsGroup.add(lineZ1);

      const lineZ2 = new THREE.Mesh(lineZGeo, yellowMat);
      lineZ2.rotation.x = -Math.PI / 2;
      lineZ2.position.set(0, 0.02, pos + 0.25);
      markingsGroup.add(lineZ2);

      // Zebra Crosswalk Stripes at Intersections
      for (let zPos = -halfMap + blockSize / 2; zPos <= halfMap - blockSize / 2; zPos += blockSize) {
        for (let i = -5; i <= 5; i += 1.8) {
          const stripeGeo = new THREE.PlaneGeometry(0.8, 4);
          const stripe = new THREE.Mesh(stripeGeo, whiteMat);
          stripe.rotation.x = -Math.PI / 2;
          stripe.position.set(pos + i, 0.03, zPos - roadWidth / 2 - 2);
          markingsGroup.add(stripe);
        }
      }
    }

    // 3. City Blocks with Detailed Buildings & Collision Obstacles
    const shopNames = [
      '24/7 EXPRESS',
      'BURGER KING',
      'CYBER CAFE',
      'ELECTRONICS',
      'METRO BANK',
      'GRAND HOTEL',
      'PHARMACY',
      'BAKERY 88',
    ];

    let shopIdx = 0;

    for (let x = -halfMap + blockSize / 2; x < halfMap; x += blockSize) {
      for (let z = -halfMap + blockSize / 2; z < halfMap; z += blockSize) {
        // Pizza HQ at Center Plaza (0, 0)
        if (Math.abs(x) < 30 && Math.abs(z) < 30) continue;

        // Central Park Block at (0, 110)
        if (Math.abs(x) < 30 && Math.abs(z - 110) < 30) {
          this.buildCentralParkBlock(x, z, blockSize - roadWidth);
          continue;
        }

        // Sidewalk Base with Raised Curb
        const sideWidth = blockSize - roadWidth;
        const sideGeo = new THREE.BoxGeometry(sideWidth, 0.35, sideWidth);
        const sideMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.85 });
        const sidewalk = new THREE.Mesh(sideGeo, sideMat);
        sidewalk.position.set(x, 0.175, z);
        sidewalk.receiveShadow = true;
        this.scene.add(sidewalk);

        // Building Dimensions
        const bWidth = sideWidth - 6;
        const bHeight = 22 + (Math.sin(x * 0.1 + z * 0.2) * 0.5 + 0.5) * 48;
        const buildingType = (Math.abs(Math.floor(x + z)) % 3);

        if (buildingType === 0) {
          // Glass Modern Skyscraper
          this.buildGlassSkyscraper(x, z, bWidth, bHeight);
        } else if (buildingType === 1) {
          // Commercial Storefront Building with Neon Signs
          const name = shopNames[shopIdx % shopNames.length];
          shopIdx++;
          this.buildCommercialShop(x, z, bWidth, bHeight, name);
        } else {
          // Residential Apartment Block with Balconies
          this.buildApartmentBlock(x, z, bWidth, bHeight);
        }

        // Register Solid Building Obstacle for Car Collisions
        this.obstacles.push({
          minX: x - bWidth / 2 - 0.5,
          maxX: x + bWidth / 2 + 0.5,
          minZ: z - bWidth / 2 - 0.5,
          maxZ: z + bWidth / 2 + 0.5,
          height: bHeight,
          name: 'City Building',
        });

        // Add Street Level Details (Trees, Street Lights, Hydrants, Parked Cars)
        this.add3DTree(x - (bWidth / 2 + 2), 0.35, z - (bWidth / 2 + 2));
        this.add3DTree(x + (bWidth / 2 + 2), 0.35, z + (bWidth / 2 + 2));

        this.addStreetLight(x - (bWidth / 2 + 3), z);
        this.addStreetLight(x + (bWidth / 2 + 3), z);

        // Add Fire Hydrant
        this.addFireHydrant(x - (bWidth / 2 + 2.5), z + 8);

        // Add Parked Car as Road Obstacle
        if (Math.random() > 0.45) {
          this.addParkedCarObstacle(x - (sideWidth / 2 + 1.2), z - 6, Math.PI / 2);
        }
      }
    }

    // 4. Landmarks: Pizza HQ, Gas Stations, Garage Shops
    this.buildPizzaHQLandmark();
    this.buildGasStationLandmark(-120, -110, 'Shell Gas Station North');
    this.buildGasStationLandmark(120, 110, 'Express Fuel South');
    this.buildGarageShopLandmark(-110, 120, 'Auto Repair & Tires');
    this.buildGarageShopLandmark(130, -90, 'Custom Motors Garage');

    // 5. Points of Interest (POIs)
    this.poiLocations = [
      { id: 'pizza_hq', name: 'Pizza Shop HQ', type: 'PIZZA_SHOP', x: 0, z: 0, color: '#ef4444' },
      { id: 'gas_1', name: 'Shell Gas Station North', type: 'GAS_STATION', x: -120, z: -110, color: '#0284c7' },
      { id: 'gas_2', name: 'Express Fuel South', type: 'GAS_STATION', x: 120, z: 110, color: '#0284c7' },
      { id: 'repair_1', name: 'Auto Repair West', type: 'REPAIR_SHOP', x: -110, z: 120, color: '#f59e0b' },
      { id: 'repair_2', name: 'Custom Motors East', type: 'REPAIR_SHOP', x: 130, z: -90, color: '#f59e0b' },
    ];

    // POI Beams & Rings
    this.poiLocations.forEach((poi) => {
      const ringGroup = new THREE.Group();

      const ringGeo = new THREE.CylinderGeometry(8, 8, 0.25, 32);
      const ringMat = new THREE.MeshStandardMaterial({
        color: poi.color,
        emissive: poi.color,
        emissiveIntensity: 0.9,
        transparent: true,
        opacity: 0.65,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.y = 0.12;
      ringGroup.add(ring);

      const beamGeo = new THREE.CylinderGeometry(0.6, 0.6, 35, 16);
      const beamMat = new THREE.MeshBasicMaterial({
        color: poi.color,
        transparent: true,
        opacity: 0.35,
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.y = 17.5;
      ringGroup.add(beam);

      ringGroup.position.set(poi.x, 0, poi.z);
      this.scene.add(ringGroup);
      this.poiMarkers.set(poi.id, ringGroup);
    });
  }

  // --- DETAILED BUILDING ARCHITECTURES ---

  private buildGlassSkyscraper(x: number, z: number, w: number, h: number) {
    const group = new THREE.Group();

    // Base Podium
    const baseGeo = new THREE.BoxGeometry(w, 5, w);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.set(0, 2.5, 0);
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Glass Main Tower
    const towerGeo = new THREE.BoxGeometry(w - 2, h - 5, w - 2);
    const towerMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      metalness: 0.8,
      roughness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(0, (h - 5) / 2 + 5, 0);
    tower.castShadow = true;
    tower.receiveShadow = true;
    group.add(tower);

    // Horizontal Floor Sills
    const floorCount = Math.floor(h / 4);
    const sillMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9 });
    for (let i = 1; i < floorCount; i++) {
      const sillGeo = new THREE.BoxGeometry(w - 1.8, 0.3, w - 1.8);
      const sill = new THREE.Mesh(sillGeo, sillMat);
      sill.position.set(0, i * 4 + 4, 0);
      group.add(sill);
    }

    // Roof Antenna & Warning Light
    const antGeo = new THREE.CylinderGeometry(0.15, 0.3, 8, 8);
    const antMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9 });
    const ant = new THREE.Mesh(antGeo, antMat);
    ant.position.set(0, h + 4, 0);
    group.add(ant);

    const redLightGeo = new THREE.SphereGeometry(0.35, 8, 8);
    const redLightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const redLight = new THREE.Mesh(redLightGeo, redLightMat);
    redLight.position.set(0, h + 8, 0);
    group.add(redLight);
    this.animatedBlinkers.push(redLight);

    group.position.set(x, 0, z);
    this.scene.add(group);
  }

  private buildCommercialShop(x: number, z: number, w: number, h: number, name: string) {
    const group = new THREE.Group();

    // Brick / Concrete Body
    const bodyGeo = new THREE.BoxGeometry(w, h, w);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, h / 2, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Front Storefront Glass Display Window
    const winGeo = new THREE.PlaneGeometry(w - 4, 3.5);
    const winMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfef08a,
      emissiveIntensity: 0.6,
    });
    const win = new THREE.Mesh(winGeo, winMat);
    win.position.set(0, 2.2, w / 2 + 0.05);
    group.add(win);

    // Striped Awning
    const awnGeo = new THREE.BoxGeometry(w - 2, 0.4, 2.5);
    const awnMat = new THREE.MeshStandardMaterial({ color: 0x2563eb });
    const awn = new THREE.Mesh(awnGeo, awnMat);
    awn.position.set(0, 4.2, w / 2 + 1.2);
    group.add(awn);

    // Neon Signboard Box Above Entrance
    const signGeo = new THREE.BoxGeometry(w - 6, 1.2, 0.4);
    const signMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.8,
    });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 5.8, w / 2 + 0.25);
    group.add(sign);

    group.position.set(x, 0, z);
    this.scene.add(group);
  }

  private buildApartmentBlock(x: number, z: number, w: number, h: number) {
    const group = new THREE.Group();

    const bodyGeo = new THREE.BoxGeometry(w, h, w);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.8 }); // Terracotta brick
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, h / 2, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Balconies along front face
    const floors = Math.floor(h / 5);
    const balMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7 });

    for (let f = 1; f < floors; f++) {
      const balGeo = new THREE.BoxGeometry(4, 0.3, 1.5);
      const balLeft = new THREE.Mesh(balGeo, balMat);
      balLeft.position.set(-w / 4, f * 5, w / 2 + 0.75);
      group.add(balLeft);

      const balRight = new THREE.Mesh(balGeo, balMat);
      balRight.position.set(w / 4, f * 5, w / 2 + 0.75);
      group.add(balRight);

      // Window AC Unit
      const acGeo = new THREE.BoxGeometry(1.2, 0.8, 0.8);
      const acMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0 });
      const ac = new THREE.Mesh(acGeo, acMat);
      ac.position.set(0, f * 5 + 1.2, w / 2 + 0.4);
      group.add(ac);
    }

    // Rooftop Wooden Water Tower
    const wtLegGeo = new THREE.CylinderGeometry(0.1, 0.1, 3, 6);
    const wtMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
    const leg1 = new THREE.Mesh(wtLegGeo, wtMat);
    leg1.position.set(0, h + 1.5, 0);
    group.add(leg1);

    const wtBodyGeo = new THREE.CylinderGeometry(2, 2, 3, 12);
    const wtBody = new THREE.Mesh(wtBodyGeo, wtMat);
    wtBody.position.set(0, h + 4.5, 0);
    group.add(wtBody);

    group.position.set(x, 0, z);
    this.scene.add(group);
  }

  // --- LANDMARKS: PIZZA HQ, GAS STATIONS, GARAGES ---

  private buildPizzaHQLandmark() {
    const group = new THREE.Group();

    // Main Brick Building
    const bGeo = new THREE.BoxGeometry(24, 11, 24);
    const bMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.6 });
    const building = new THREE.Mesh(bGeo, bMat);
    building.position.set(0, 5.5, -12);
    building.castShadow = true;
    building.receiveShadow = true;
    group.add(building);

    // Awning
    const awnGeo = new THREE.BoxGeometry(22, 0.6, 5);
    const awnMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
    const awning = new THREE.Mesh(awnGeo, awnMat);
    awning.position.set(0, 4.5, 0.5);
    group.add(awning);

    // Glowing Neon Pizza Slice Sign
    const sliceGeo = new THREE.ConeGeometry(4.5, 1.2, 3);
    const sliceMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.9,
    });
    const pizzaSlice = new THREE.Mesh(sliceGeo, sliceMat);
    pizzaSlice.rotation.x = Math.PI / 2;
    pizzaSlice.position.set(0, 14, -12);
    group.add(pizzaSlice);

    this.scene.add(group);

    // Solid Obstacle
    this.obstacles.push({
      minX: -12.5,
      maxX: 12.5,
      minZ: -24.5,
      maxZ: 0.5,
      height: 14,
      name: 'Pizza Shop HQ',
    });
  }

  private buildGasStationLandmark(x: number, z: number, name: string) {
    const group = new THREE.Group();

    // Canopy Roof
    const roofGeo = new THREE.BoxGeometry(22, 0.8, 16);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 6, 0);
    roof.castShadow = true;
    group.add(roof);

    // Shell Yellow Edge Trim
    const trimGeo = new THREE.BoxGeometry(22.4, 0.4, 16.4);
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xeab308, emissive: 0xca8a04, emissiveIntensity: 0.5 });
    const trim = new THREE.Mesh(trimGeo, trimMat);
    trim.position.set(0, 6.4, 0);
    group.add(trim);

    // 4 Support Pillars
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 });
    const pPositions = [
      { px: -9, pz: -6 },
      { px: 9, pz: -6 },
      { px: -9, pz: 6 },
      { px: 9, pz: 6 },
    ];

    pPositions.forEach((p) => {
      const pGeo = new THREE.CylinderGeometry(0.5, 0.5, 6, 12);
      const pillar = new THREE.Mesh(pGeo, pillarMat);
      pillar.position.set(p.px, 3, p.pz);
      pillar.castShadow = true;
      group.add(pillar);

      // Add Obstacle for each pillar
      this.obstacles.push({
        minX: x + p.px - 0.7,
        maxX: x + p.px + 0.7,
        minZ: z + p.pz - 0.7,
        maxZ: z + p.pz + 0.7,
        height: 6,
        name: 'Gas Station Pillar',
      });
    });

    // Fuel Pumps Island
    const islandGeo = new THREE.BoxGeometry(10, 0.3, 3);
    const islandMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });
    const island = new THREE.Mesh(islandGeo, islandMat);
    island.position.set(0, 0.15, 0);
    group.add(island);

    // 2 Gas Pumps
    const pumpGeo = new THREE.BoxGeometry(1.4, 2.5, 1.2);
    const pumpMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });

    const pump1 = new THREE.Mesh(pumpGeo, pumpMat);
    pump1.position.set(-3, 1.5, 0);
    group.add(pump1);

    const pump2 = new THREE.Mesh(pumpGeo, pumpMat);
    pump2.position.set(3, 1.5, 0);
    group.add(pump2);

    // Solid Obstacle for Gas Pumps
    this.obstacles.push({
      minX: x - 5.5,
      maxX: x + 5.5,
      minZ: z - 2,
      maxZ: z + 2,
      height: 3,
      name,
    });

    group.position.set(x, 0, z);
    this.scene.add(group);
  }

  private buildGarageShopLandmark(x: number, z: number, name: string) {
    const group = new THREE.Group();

    // Workshop Building
    const bGeo = new THREE.BoxGeometry(20, 8, 18);
    const bMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
    const building = new THREE.Mesh(bGeo, bMat);
    building.position.set(0, 4, 0);
    building.castShadow = true;
    building.receiveShadow = true;
    group.add(building);

    // Roll-up Shutters
    const shutterGeo = new THREE.PlaneGeometry(6, 5);
    const shutterMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    const shutter1 = new THREE.Mesh(shutterGeo, shutterMat);
    shutter1.position.set(-4.5, 2.5, 9.05);
    group.add(shutter1);

    const shutter2 = new THREE.Mesh(shutterGeo, shutterMat);
    shutter2.position.set(4.5, 2.5, 9.05);
    group.add(shutter2);

    // Neon Garage Sign
    const signGeo = new THREE.BoxGeometry(12, 1.2, 0.4);
    const signMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.8,
    });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 6.5, 9.2);
    group.add(sign);

    group.position.set(x, 0, z);
    this.scene.add(group);

    this.obstacles.push({
      minX: x - 10.5,
      maxX: x + 10.5,
      minZ: z - 9.5,
      maxZ: z + 9.5,
      height: 8,
      name,
    });
  }

  private buildCentralParkBlock(x: number, z: number, size: number) {
    const lawnGeo = new THREE.BoxGeometry(size, 0.35, size);
    const lawnMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 });
    const lawn = new THREE.Mesh(lawnGeo, lawnMat);
    lawn.position.set(x, 0.175, z);
    lawn.receiveShadow = true;
    this.scene.add(lawn);

    // Central Water Fountain
    const fountGeo = new THREE.CylinderGeometry(6, 6, 1.2, 24);
    const fountMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1 });
    const fountain = new THREE.Mesh(fountGeo, fountMat);
    fountain.position.set(x, 0.7, z);
    this.scene.add(fountain);

    this.obstacles.push({
      minX: x - 6.5,
      maxX: x + 6.5,
      minZ: z - 6.5,
      maxZ: z + 6.5,
      height: 1.5,
      name: 'Park Fountain',
    });

    const offset = size / 2 - 4;
    this.add3DTree(x - offset, 0.35, z - offset);
    this.add3DTree(x + offset, 0.35, z - offset);
    this.add3DTree(x - offset, 0.35, z + offset);
    this.add3DTree(x + offset, 0.35, z + offset);
  }

  // --- STREET LEVEL OBSTACLES & PROPS ---

  private add3DTree(x: number, y: number, z: number) {
    const group = new THREE.Group();

    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.45, 3.5, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1.75;
    trunk.castShadow = true;
    group.add(trunk);

    const folMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.8 });
    const fol1 = new THREE.Mesh(new THREE.ConeGeometry(2.5, 3.5, 8), folMat);
    fol1.position.y = 4.2;
    fol1.castShadow = true;
    group.add(fol1);

    const fol2 = new THREE.Mesh(new THREE.ConeGeometry(1.8, 2.8, 8), folMat);
    fol2.position.y = 5.8;
    fol2.castShadow = true;
    group.add(fol2);

    group.position.set(x, y, z);
    this.scene.add(group);

    this.obstacles.push({
      minX: x - 0.5,
      maxX: x + 0.5,
      minZ: z - 0.5,
      maxZ: z + 0.5,
      height: 4,
      name: 'Tree Trunk',
    });
  }

  private addStreetLight(x: number, z: number) {
    const group = new THREE.Group();

    const poleGeo = new THREE.CylinderGeometry(0.12, 0.15, 7.5, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 3.75;
    group.add(pole);

    const lampGeo = new THREE.SphereGeometry(0.45, 12, 12);
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const lamp = new THREE.Mesh(lampGeo, lampMat);
    lamp.position.set(0, 7.2, 0.8);
    group.add(lamp);

    group.position.set(x, 0, z);
    this.scene.add(group);

    this.obstacles.push({
      minX: x - 0.3,
      maxX: x + 0.3,
      minZ: z - 0.3,
      maxZ: z + 0.3,
      height: 7,
      name: 'Street Light Pole',
    });
  }

  private addFireHydrant(x: number, z: number) {
    const group = new THREE.Group();

    const hydGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.9, 10);
    const hydMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.6 });
    const hyd = new THREE.Mesh(hydGeo, hydMat);
    hyd.position.y = 0.45;
    group.add(hyd);

    group.position.set(x, 0.35, z);
    this.scene.add(group);

    this.obstacles.push({
      minX: x - 0.3,
      maxX: x + 0.3,
      minZ: z - 0.3,
      maxZ: z + 0.3,
      height: 0.9,
      name: 'Fire Hydrant',
    });
  }

  private addParkedCarObstacle(x: number, z: number, rotation: number) {
    const group = new THREE.Group();

    const pColors = [0xd97706, 0x2563eb, 0x475569, 0xd97706, 0x059669];
    const color = pColors[Math.floor(Math.abs(x + z) % pColors.length)];

    const chassisGeo = new THREE.BoxGeometry(2.0, 0.6, 4.2);
    const chassisMat = new THREE.MeshStandardMaterial({ color, metalness: 0.6, roughness: 0.3 });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.position.y = 0.5;
    chassis.castShadow = true;
    group.add(chassis);

    const cabinGeo = new THREE.BoxGeometry(1.8, 0.8, 2.2);
    const cabinMat = new THREE.MeshPhysicalMaterial({ color: 0x0f172a, transmission: 0.8 });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 1.2, -0.2);
    group.add(cabin);

    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    this.scene.add(group);

    // Parked Car Obstacle Box
    const width = 2.2;
    const length = 4.4;

    this.obstacles.push({
      minX: x - width / 2,
      maxX: x + width / 2,
      minZ: z - length / 2,
      maxZ: z + length / 2,
      height: 1.8,
      name: 'Parked Car',
    });
  }

  // --- PROCEDURAL HIGH-DETAIL CAR MESH GENERATOR ---

  private buildDetailedCarMesh(car: CarData): THREE.Group {
    const group = new THREE.Group();

    const pColor = new THREE.Color(car.primaryColor);
    const aColor = new THREE.Color(car.accentColor);

    const bodyMat = new THREE.MeshStandardMaterial({
      color: pColor,
      metalness: 0.8,
      roughness: 0.15,
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: aColor,
      metalness: 0.6,
      roughness: 0.2,
    });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      transmission: 0.92,
      opacity: 1,
      transparent: true,
      roughness: 0.05,
    });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.95, roughness: 0.05 });
    const brakeMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.95, roughness: 0.05 });

    const style = car.modelStyle || 'hatchback';

    if (style === 'supercar') {
      // --- SUPERCAR HIGH-DETAIL BODYWORK ---
      // Lower Aerodynamic Chassis Splitter
      const chassisGeo = new THREE.BoxGeometry(2.3, 0.4, 4.8);
      const chassis = new THREE.Mesh(chassisGeo, accentMat);
      chassis.position.y = 0.35;
      chassis.castShadow = true;
      group.add(chassis);

      // Low Wedge Body
      const bodyGeo = new THREE.BoxGeometry(2.2, 0.75, 4.5);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.8;
      body.castShadow = true;
      group.add(body);
      this.carBodyMesh = body;

      // Front Hood Air Scoop
      const scoopGeo = new THREE.BoxGeometry(1.2, 0.15, 1.2);
      const scoop = new THREE.Mesh(scoopGeo, accentMat);
      scoop.position.set(0, 1.2, 1.2);
      group.add(scoop);

      // Cockpit Glass Roof
      const cabinGeo = new THREE.BoxGeometry(1.8, 0.75, 2.2);
      const cabin = new THREE.Mesh(cabinGeo, glassMat);
      cabin.position.set(0, 1.45, -0.3);
      cabin.castShadow = true;
      group.add(cabin);

      // Massive Carbon GT Rear Wing Spoiler
      const wingBoardGeo = new THREE.BoxGeometry(2.4, 0.1, 0.6);
      const wingBoard = new THREE.Mesh(wingBoardGeo, accentMat);
      wingBoard.position.set(0, 1.85, -2.2);

      const strutGeo = new THREE.BoxGeometry(0.1, 0.6, 0.2);
      const strutL = new THREE.Mesh(strutGeo, chromeMat);
      strutL.position.set(-0.7, 1.5, -2.2);
      const strutR = strutL.clone();
      strutR.position.x = 0.7;

      group.add(wingBoard);
      group.add(strutL);
      group.add(strutR);

      // Quad Chrome Exhaust Pipes
      for (let i = -0.6; i <= 0.6; i += 0.4) {
        const exGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.3, 10);
        exGeo.rotateX(Math.PI / 2);
        const ex = new THREE.Mesh(exGeo, chromeMat);
        ex.position.set(i, 0.5, -2.42);
        group.add(ex);
      }
    } else if (style === 'delivery_van') {
      // --- HEAVY PIZZA EXPRESS VAN ---
      const chassisGeo = new THREE.BoxGeometry(2.3, 0.6, 5.0);
      const chassis = new THREE.Mesh(chassisGeo, accentMat);
      chassis.position.y = 0.5;
      chassis.castShadow = true;
      group.add(chassis);

      // Front Cab
      const cabGeo = new THREE.BoxGeometry(2.2, 1.4, 1.8);
      const cab = new THREE.Mesh(cabGeo, bodyMat);
      cab.position.set(0, 1.4, 1.4);
      cab.castShadow = true;
      group.add(cab);

      // Rear Cargo Box
      const cargoGeo = new THREE.BoxGeometry(2.3, 2.0, 3.2);
      const cargo = new THREE.Mesh(cargoGeo, bodyMat);
      cargo.position.set(0, 1.7, -1.0);
      cargo.castShadow = true;
      group.add(cargo);
      this.carBodyMesh = cargo;

      // Pizza Delivery Decal Panel
      const decalGeo = new THREE.PlaneGeometry(3.0, 1.4);
      const decalMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0xef4444,
        emissiveIntensity: 0.3,
      });
      const decalLeft = new THREE.Mesh(decalGeo, decalMat);
      decalLeft.rotation.y = -Math.PI / 2;
      decalLeft.position.set(-1.16, 1.7, -1.0);
      group.add(decalLeft);

      const decalRight = decalLeft.clone();
      decalRight.rotation.y = Math.PI / 2;
      decalRight.position.x = 1.16;
      group.add(decalRight);
    } else if (style === 'sedan') {
      // --- METRO SEDAN BODYWORK ---
      const chassisGeo = new THREE.BoxGeometry(2.2, 0.5, 4.6);
      const chassis = new THREE.Mesh(chassisGeo, accentMat);
      chassis.position.y = 0.45;
      chassis.castShadow = true;
      group.add(chassis);

      const bodyGeo = new THREE.BoxGeometry(2.1, 0.8, 4.3);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.9;
      body.castShadow = true;
      group.add(body);
      this.carBodyMesh = body;

      const cabinGeo = new THREE.BoxGeometry(1.85, 0.85, 2.4);
      const cabin = new THREE.Mesh(cabinGeo, glassMat);
      cabin.position.set(0, 1.55, -0.2);
      cabin.castShadow = true;
      group.add(cabin);
    } else {
      // --- SPEEDY HATCHBACK BODYWORK ---
      const chassisGeo = new THREE.BoxGeometry(2.1, 0.5, 4.2);
      const chassis = new THREE.Mesh(chassisGeo, accentMat);
      chassis.position.y = 0.45;
      chassis.castShadow = true;
      group.add(chassis);

      const bodyGeo = new THREE.BoxGeometry(2.0, 0.85, 3.9);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.95;
      body.castShadow = true;
      group.add(body);
      this.carBodyMesh = body;

      const cabinGeo = new THREE.BoxGeometry(1.8, 0.85, 2.2);
      const cabin = new THREE.Mesh(cabinGeo, glassMat);
      cabin.position.set(0, 1.55, -0.1);
      cabin.castShadow = true;
      group.add(cabin);
    }

    // --- INTERIOR CABIN & ROTATING STEERING WHEEL ---
    const dashMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const dashBoard = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 0.6), dashMat);
    dashBoard.position.set(0, 1.15, 0.5);
    group.add(dashBoard);

    // Driver Seat
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const driverSeat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.6, 0.55), seatMat);
    driverSeat.position.set(-0.45, 1.0, -0.3);
    group.add(driverSeat);

    // Steering Column & Wheel
    const stGroup = new THREE.Group();
    stGroup.position.set(-0.45, 1.25, 0.3);

    const stWheelGeo = new THREE.TorusGeometry(0.2, 0.035, 10, 24);
    const stWheelMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5, roughness: 0.3 });
    const stWheelMesh = new THREE.Mesh(stWheelGeo, stWheelMat);
    stGroup.add(stWheelMesh);

    // Center Hub & Spokes
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 12), chromeMat);
    hub.rotateX(Math.PI / 2);
    stGroup.add(hub);

    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.32, 0.02), chromeMat);
    stGroup.add(spoke);

    group.add(stGroup);
    this.steeringWheelGroup = stGroup;

    // --- SHARED DETAILS: PIZZA LIGHT BOX, MIRRORS, LIGHTS, WHEELS ---

    // Illuminated Pizza Delivery Light Box Topper
    const boxGeo = new THREE.BoxGeometry(1.4, 0.6, 1.4);
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 0.6,
    });
    const pizzaBox = new THREE.Mesh(boxGeo, boxMat);
    pizzaBox.position.set(0, 2.2, -0.2);
    pizzaBox.castShadow = true;
    group.add(pizzaBox);

    // Front Grille & Emblem
    const grilleGeo = new THREE.BoxGeometry(1.6, 0.35, 0.1);
    const grilleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.1 });
    const grille = new THREE.Mesh(grilleGeo, grilleMat);
    grille.position.set(0, 0.85, 2.12);
    group.add(grille);

    // Side Mirrors
    const mirrorGeo = new THREE.BoxGeometry(0.35, 0.2, 0.2);
    const mirrorLeft = new THREE.Mesh(mirrorGeo, bodyMat);
    mirrorLeft.position.set(-1.08, 1.4, 0.4);
    group.add(mirrorLeft);

    const mirrorRight = mirrorLeft.clone();
    mirrorRight.position.x = 1.08;
    group.add(mirrorRight);

    // LED Headlights Lenses
    const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const hlLeft = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.22, 0.1), hlMat);
    hlLeft.position.set(-0.75, 0.85, 2.12);
    group.add(hlLeft);

    const hlRight = hlLeft.clone();
    hlRight.position.x = 0.75;
    group.add(hlRight);

    this.headlightLensMeshes = [hlLeft, hlRight];

    // TURN SIGNAL BLINKERS (AMBER CORNER LIGHTS)
    const blinkerMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.1,
    });

    const frontLeftBlinker = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.1), blinkerMat);
    frontLeftBlinker.position.set(-1.0, 0.85, 2.12);
    group.add(frontLeftBlinker);

    const rearLeftBlinker = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.1), blinkerMat);
    rearLeftBlinker.position.set(-1.0, 0.85, -2.12);
    group.add(rearLeftBlinker);

    this.leftBlinkerMeshes = [frontLeftBlinker, rearLeftBlinker];

    const frontRightBlinker = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.1), blinkerMat.clone());
    frontRightBlinker.position.set(1.0, 0.85, 2.12);
    group.add(frontRightBlinker);

    const rearRightBlinker = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.1), blinkerMat.clone());
    rearRightBlinker.position.set(1.0, 0.85, -2.12);
    group.add(rearRightBlinker);

    this.rightBlinkerMeshes = [frontRightBlinker, rearRightBlinker];

    // Taillights
    const tlMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 0.4,
    });
    const tlLeft = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.22, 0.1), tlMat);
    tlLeft.position.set(-0.75, 0.85, -2.12);
    group.add(tlLeft);

    const tlRight = tlLeft.clone();
    tlRight.position.x = 0.75;
    group.add(tlRight);

    this.taillightMeshes = [tlLeft, tlRight];

    // REVERSE LIGHTS (WHITE LEDS)
    const revMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.1,
    });
    const revLeft = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.1), revMat);
    revLeft.position.set(-0.3, 0.85, -2.12);
    group.add(revLeft);

    const revRight = revLeft.clone();
    revRight.position.x = 0.3;
    group.add(revRight);

    this.reverseLightMeshes = [revLeft, revRight];

    // Headlight Spotlights
    const spotLeft = new THREE.SpotLight(0xffffff, 0, 90, Math.PI / 5, 0.4);
    spotLeft.position.set(-0.75, 0.85, 2.12);
    spotLeft.target.position.set(-0.75, 0, 25);
    group.add(spotLeft);
    group.add(spotLeft.target);

    const spotRight = new THREE.SpotLight(0xffffff, 0, 90, Math.PI / 5, 0.4);
    spotRight.position.set(0.75, 0.85, 2.12);
    spotRight.target.position.set(0.75, 0, 25);
    group.add(spotRight);
    group.add(spotRight.target);

    this.headlightLights = [spotLeft, spotRight];

    // Wheels with Alloy Rims and Calipers
    this.wheels = [];
    const wheelPositions = [
      { x: -1.15, y: 0.42, z: 1.35 },  // Front Left
      { x: 1.15, y: 0.42, z: 1.35 },   // Front Right
      { x: -1.15, y: 0.42, z: -1.35 }, // Rear Left
      { x: 1.15, y: 0.42, z: -1.35 },  // Rear Right
    ];

    const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.4, 20);
    wheelGeo.rotateZ(Math.PI / 2);

    wheelPositions.forEach((pos) => {
      const wMesh = new THREE.Mesh(wheelGeo, tireMat);
      wMesh.position.set(pos.x, pos.y, pos.z);
      wMesh.castShadow = true;

      // Alloy Rim
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.41, 12), rimMat);
      rim.rotateZ(Math.PI / 2);
      wMesh.add(rim);

      // Red Brake Caliper
      const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.2, 0.2), brakeMat);
      caliper.position.set(0, 0.1, 0);
      wMesh.add(caliper);

      group.add(wMesh);
      this.wheels.push(wMesh);
    });

    return group;
  }

  // --- SMOKE & CRASH SPARK PARTICLES ---

  private createSmokeParticles(): THREE.Points {
    const count = 60;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = 0;
      pos[i * 3 + 1] = -100;
      pos[i * 3 + 2] = 0;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x64748b,
      size: 0.7,
      transparent: true,
      opacity: 0.5,
    });

    return new THREE.Points(geo, mat);
  }

  private triggerCrashSparks(x: number, z: number) {
    if (!this.sparkGroup) return;

    for (let i = 0; i < 8; i++) {
      const sparkGeo = new THREE.SphereGeometry(0.15, 6, 6);
      const sparkMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      const spark = new THREE.Mesh(sparkGeo, sparkMat);
      spark.position.set(x + (Math.random() - 0.5) * 2, 0.8 + Math.random(), z + (Math.random() - 0.5) * 2);
      this.sparkGroup.add(spark);

      setTimeout(() => {
        if (this.sparkGroup) this.sparkGroup.remove(spark);
      }, 300);
    }
  }

  // --- CONTROLS & INPUT HANDLERS ---

  private handleKeyDown = (e: KeyboardEvent) => {
    if (!this.isRunning || this.isPaused) return;

    if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
      this.throttleInput = 1;
    }
    if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
      this.brakeInput = 1;
    }
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
      this.steerInput = 1;
    }
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
      this.steerInput = -1;
    }
    if (e.key === ' ') {
      this.isHandbrake = true;
    }
    if (e.key === 'h' || e.key === 'H') {
      soundEngine.playHorn();
    }
    if (e.key === 'e' || e.key === 'E') {
      this.triggerCurrentPOI();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
      this.throttleInput = 0;
    }
    if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
      this.brakeInput = 0;
    }
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
      if (this.steerInput === 1) this.steerInput = 0;
    }
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
      if (this.steerInput === -1) this.steerInput = 0;
    }
    if (e.key === ' ') {
      this.isHandbrake = false;
    }
  };

  public setTouchThrottle(val: number) {
    this.throttleInput = Math.max(0, Math.min(1, val));
  }

  public setTouchBrake(val: number) {
    this.brakeInput = Math.max(0, Math.min(1, val));
  }

  public setTouchSteer(val: number) {
    this.steerInput = Math.max(-1, Math.min(1, -val));
  }

  public setGear(gear: 'D' | 'R' | 'P') {
    this.currentGear = gear;
    this.callbacks.onAlert(`Gear switched to ${gear}`, 'info');
  }

  public toggleCamera() {
    this.cameraMode = this.cameraMode === '3RD_PERSON' ? 'HOOD' : '3RD_PERSON';
  }

  public toggleHeadlights(): boolean {
    this.isHeadlightsOn = !this.isHeadlightsOn;
    this.updateHeadlightsState();
    return this.isHeadlightsOn;
  }

  public getIsHeadlightsOn(): boolean {
    return this.isHeadlightsOn;
  }

  private updateHeadlightsState() {
    const active = this.isHeadlightsOn || this.timeOfDay === 'NIGHT' || this.timeOfDay === 'SUNSET';
    this.headlightLights.forEach((light) => {
      light.intensity = active ? (this.timeOfDay === 'NIGHT' ? 4.5 : 2.5) : 0;
    });
    this.headlightLensMeshes.forEach((mesh) => {
      if (mesh.material) {
        (mesh.material as THREE.MeshBasicMaterial).color.setHex(active ? 0xffffff : 0x64748b);
      }
    });
  }

  private loadExternalGLBCar(url: string) {
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        const glbScene = gltf.scene;
        glbScene.scale.set(1.15, 1.15, 1.15);
        glbScene.position.set(0, 0, 0);

        glbScene.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        if (this.carGroup) {
          if (this.glbCarMesh) {
            this.carGroup.remove(this.glbCarMesh);
          }
          this.glbCarMesh = glbScene;
          this.carGroup.add(glbScene);

          if (this.carBodyMesh) {
            this.carBodyMesh.visible = false;
          }
        }
      },
      undefined,
      (err) => {
        console.warn('GLB Car model load notice (procedural active):', err);
      }
    );
  }

  public honk() {
    soundEngine.playHorn();
  }

  public refuelCar(liters: number) {
    this.fuel = Math.min(this.maxFuel, this.fuel + liters);
    soundEngine.playRefuel();
  }

  public repairCar() {
    this.tireHealth = 100;
    this.engineHealth = 100;
    this.isTireBurst = false;
    soundEngine.playCashRegister();
  }

  public setActiveOrder(order: PizzaOrder) {
    this.activeOrder = order;

    // Generate 2 Checkpoints along route to final delivery point
    const cp1X = Math.round(this.x + (order.targetX - this.x) * 0.35);
    const cp1Z = Math.round(this.z + (order.targetZ - this.z) * 0.35);
    const cp2X = Math.round(this.x + (order.targetX - this.x) * 0.70);
    const cp2Z = Math.round(this.z + (order.targetZ - this.z) * 0.70);

    this.activeOrder.checkpoints = [
      { id: 'cp1', name: 'Checkpoint 1/2', x: cp1X, z: cp1Z, completed: false },
      { id: 'cp2', name: 'Checkpoint 2/2', x: cp2X, z: cp2Z, completed: false },
      { id: 'final', name: 'Customer House', x: order.targetX, z: order.targetZ, completed: false },
    ];
    this.activeOrder.currentCheckpointIndex = 0;

    this.renderTargetMarker();

    this.callbacks.onOrderUpdate(this.activeOrder);
    this.callbacks.onAlert(`Order Started! Drive through Checkpoint 1 to deliver to ${order.addressName}`, 'info');
  }

  private renderTargetMarker() {
    if (this.activeTargetMarker) {
      this.scene.remove(this.activeTargetMarker);
      this.activeTargetMarker = null;
    }

    if (!this.activeOrder || !this.activeOrder.checkpoints) return;
    const currIdx = this.activeOrder.currentCheckpointIndex || 0;
    const targetCp = this.activeOrder.checkpoints[currIdx];
    if (!targetCp) return;

    const group = new THREE.Group();
    const isFinal = currIdx === this.activeOrder.checkpoints.length - 1;
    const ringColor = isFinal ? 0x22c55e : 0x38bdf8;

    const ringGeo = new THREE.CylinderGeometry(5.5, 5.5, 0.3, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: ringColor,
      emissive: ringColor,
      emissiveIntensity: 0.9,
      transparent: true,
      opacity: 0.75,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.15;
    group.add(ring);

    // Glowing vertical light pillar
    const pillarGeo = new THREE.CylinderGeometry(0.5, 0.5, 25, 16);
    const pillarMat = new THREE.MeshBasicMaterial({
      color: ringColor,
      transparent: true,
      opacity: 0.35,
    });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.y = 12.5;
    group.add(pillar);

    const arrowGeo = new THREE.ConeGeometry(2, 4, 4);
    const arrowMat = new THREE.MeshBasicMaterial({ color: ringColor });
    const arrow = new THREE.Mesh(arrowGeo, arrowMat);
    arrow.rotation.x = Math.PI;
    arrow.position.y = 10;
    group.add(arrow);

    group.position.set(targetCp.x, 0, targetCp.z);
    this.scene.add(group);
    this.activeTargetMarker = group;
  }

  // --- GAME LOOP ---

  private animating = false;
  private animFrameId: number | null = null;
  private activePoiInsideId: string | null = null;

  public start() {
    this.isRunning = true;
    this.isPaused = false;
    this.clock.start();
    soundEngine.startMusic();
    if (!this.animating) {
      this.animating = true;
      this.animate();
    }
  }

  public pause() {
    this.isPaused = true;
    soundEngine.stopMusic();
  }

  public resume() {
    this.isPaused = false;
    this.clock.getDelta();
    soundEngine.startMusic();
    if (!this.animating) {
      this.animating = true;
      this.animate();
    }
  }

  public stop() {
    this.isRunning = false;
    this.animating = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    soundEngine.stopMusic();
  }

  public renderFrame() {
    this.updateCamera();
    this.renderer.render(this.scene, this.camera);
  }

  private resetCarPosition(x: number, y: number, z: number) {
    this.x = x;
    this.z = z;
    this.speed = 0;
    this.velocityX = 0;
    this.velocityZ = 0;
    this.rotationY = 0;
    this.carGroup.position.set(x, y, z);
    this.carGroup.rotation.y = 0;

    const dist = 9.0;
    const height = 4.2;
    this.camera.position.set(x - Math.sin(this.rotationY) * dist, height, z - Math.cos(this.rotationY) * dist);
    this.camera.lookAt(x, 1.4, z);
  }

  private animate = () => {
    if (!this.isRunning || this.isPaused) {
      this.animating = false;
      return;
    }

    this.animFrameId = requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);

    this.updateCarPhysics(delta);
    this.updateCamera();
    this.updateOrderTimer(delta);
    this.checkPOIInteractions();

    this.renderer.render(this.scene, this.camera);
  };

  // --- REAL 3D PHYSICS ENGINE WITH BUILDING COLLISION DETECTION ---

  private updateCarPhysics(delta: number) {
    // 1. Steering & Wheel Rotation
    const steerSpeed = 3.5;
    const targetSteer = this.steerInput * this.maxSteerAngle * this.carData.handling;
    this.steerAngle += (targetSteer - this.steerAngle) * delta * steerSpeed;

    const speedMS = this.speed / 3.6;

    // Wheel Steering & Spinning Animations
    this.wheels.forEach((w, idx) => {
      // Front wheels steer on Y-axis
      if (idx < 2) {
        w.rotation.y = this.steerAngle;
      }
      // All wheels spin forward/backward on X-axis
      w.rotation.x += (speedMS * delta) / 0.42;
    });

    // Rotating Steering Wheel in Cockpit
    if (this.steeringWheelGroup) {
      this.steeringWheelGroup.rotation.z = -this.steerAngle * 3.5;
    }

    // Turn Signals / Blinkers Flashing Animation
    const blinkPhase = Math.floor(Date.now() / 250) % 2 === 0;

    this.leftBlinkerMeshes.forEach((m) => {
      if (m.material) {
        const isBlinking = (this.steerAngle < -0.12 || this.isHazardOn) && blinkPhase;
        (m.material as THREE.MeshStandardMaterial).emissiveIntensity = isBlinking ? 3.5 : 0.1;
      }
    });

    this.rightBlinkerMeshes.forEach((m) => {
      if (m.material) {
        const isBlinking = (this.steerAngle > 0.12 || this.isHazardOn) && blinkPhase;
        (m.material as THREE.MeshStandardMaterial).emissiveIntensity = isBlinking ? 3.5 : 0.1;
      }
    });

    // Reverse Lights
    this.reverseLightMeshes.forEach((m) => {
      if (m.material) {
        (m.material as THREE.MeshStandardMaterial).emissiveIntensity = this.currentGear === 'R' ? 3.0 : 0.1;
      }
    });

    // Car Body Lean/Roll & Pitch
    if (this.carBodyMesh) {
      const targetRoll = -this.steerAngle * Math.min(1.0, Math.abs(this.speed) / 50) * 0.16;
      this.carBodyMesh.rotation.z += (targetRoll - this.carBodyMesh.rotation.z) * delta * 7.0;

      const targetPitch = (this.throttleInput * 0.03) - (this.brakeInput * 0.06);
      this.carBodyMesh.rotation.x += (targetPitch - this.carBodyMesh.rotation.x) * delta * 6.0;
    }

    // 2. Fuel & Out of Fuel Check
    if (this.speed > 1) {
      const fuelDrain = delta * (0.08 + (this.speed / 100) * 0.12);
      this.fuel = Math.max(0, this.fuel - fuelDrain);

      if (this.fuel === 0 && Math.random() < 0.02) {
        this.callbacks.onAlert('OUT OF FUEL! Drive to Gas Station to refuel.', 'danger');
      }
    }

    // 3. Tire Health & Handbrake Drifting
    if (this.isHandbrake && this.speed > 30) {
      this.tireHealth = Math.max(0, this.tireHealth - delta * 15);
      soundEngine.playTireScreech();

      if (this.tireHealth === 0 && !this.isTireBurst) {
        this.isTireBurst = true;
        soundEngine.playTireBurst();
        this.callbacks.onAlert('TIRE BURST! Repair at Service Station.', 'danger');
      }
    }

    // 4. Acceleration & Speed
    const effectiveTopSpeed = this.isTireBurst
      ? this.carData.topSpeed * 0.4
      : (this.fuel === 0 ? 15 : this.carData.topSpeed) * (this.engineHealth / 100);

    const accelForce = 28 * this.carData.acceleration;
    const brakeForce = 42;
    const dragCoeff = 0.988;

    if (this.currentGear === 'P') {
      this.speed *= 0.85;
    } else if (this.currentGear === 'D') {
      if (this.throttleInput > 0 && this.fuel > 0) {
        this.speed += this.throttleInput * accelForce * delta;
      }
      if (this.brakeInput > 0) {
        this.speed -= this.brakeInput * brakeForce * delta;
      }
    } else if (this.currentGear === 'R') {
      if (this.throttleInput > 0 && this.fuel > 0) {
        this.speed -= this.throttleInput * (accelForce * 0.7) * delta;
      }
      if (this.brakeInput > 0) {
        this.speed += this.brakeInput * brakeForce * delta;
      }
    }

    // Taillight Glow
    this.taillightMeshes.forEach((m) => {
      if (m.material) {
        (m.material as THREE.MeshStandardMaterial).emissiveIntensity = this.brakeInput > 0 ? 3.5 : 0.4;
      }
    });

    if (this.isHandbrake) {
      this.speed *= 0.92;
    }

    this.speed = Math.max(-35, Math.min(effectiveTopSpeed, this.speed));
    this.speed *= dragCoeff;

    const currentSpeedMS = this.speed / 3.6;

    // Turn vehicle
    if (Math.abs(currentSpeedMS) > 0.2) {
      const turnFactor = (currentSpeedMS > 0 ? 1 : -1) * (this.steerAngle / 1.8);
      this.rotationY += turnFactor * delta;
    }

    this.velocityX = Math.sin(this.rotationY) * currentSpeedMS;
    this.velocityZ = Math.cos(this.rotationY) * currentSpeedMS;

    // Calculate potential new position
    let nextX = this.x + this.velocityX * delta;
    let nextZ = this.z + this.velocityZ * delta;

    // --- REAL BUILDING & OBSTACLE COLLISION PHYSICS ---
    const carWidth = 2.2;
    const carLength = 4.6;
    const carRadius = 1.3;

    let crashed = false;

    for (const obs of this.obstacles) {
      // Axis-Aligned Bounding Box Collision Check
      if (
        nextX + carRadius > obs.minX &&
        nextX - carRadius < obs.maxX &&
        nextZ + carRadius > obs.minZ &&
        nextZ - carRadius < obs.maxZ
      ) {
        crashed = true;

        // Calculate Overlap depths
        const overlapXLeft = nextX + carRadius - obs.minX;
        const overlapXRight = obs.maxX - (nextX - carRadius);
        const overlapZTop = nextZ + carRadius - obs.minZ;
        const overlapZBottom = obs.maxZ - (nextZ - carRadius);

        const minOverlapX = Math.min(overlapXLeft, overlapXRight);
        const minOverlapZ = Math.min(overlapZTop, overlapZBottom);

        // Resolve collision along the axis of minimum penetration
        if (minOverlapX < minOverlapZ) {
          if (overlapXLeft < overlapXRight) {
            nextX = obs.minX - carRadius;
          } else {
            nextX = obs.maxX + carRadius;
          }
        } else {
          if (overlapZTop < overlapZBottom) {
            nextZ = obs.minZ - carRadius;
          } else {
            nextZ = obs.maxZ + carRadius;
          }
        }

        // Handle impact damage & bounce physics
        const impactSpeed = Math.abs(this.speed);
        this.speed *= -0.3; // Bounce back!

        const now = Date.now();
        if (impactSpeed > 14 && now - this.lastCrashTime > 700) {
          this.lastCrashTime = now;
          soundEngine.playCrash();

          const dmg = Math.round(impactSpeed * 0.35);
          this.engineHealth = Math.max(0, this.engineHealth - dmg);

          this.triggerCrashSparks(this.x, this.z);
          this.callbacks.onAlert(`CRASH! Engine damaged (-${dmg}%) on ${obs.name || 'Building'}`, 'danger');
        }
        break;
      }
    }

    // Endless Map Wrapping
    const halfMap = this.mapSize / 2 - 2;
    if (nextX > halfMap) nextX -= this.mapSize;
    if (nextX < -halfMap) nextX += this.mapSize;
    if (nextZ > halfMap) nextZ -= this.mapSize;
    if (nextZ < -halfMap) nextZ += this.mapSize;
    this.x = nextX;
    this.z = nextZ;

    // Update Car Group
    this.carGroup.position.set(this.x, 0, this.z);
    this.carGroup.rotation.y = this.rotationY;

    if (this.steeringWheelGroup) {
      this.steeringWheelGroup.rotation.z = -this.steerAngle * 3.5;
    }

    if (this.carBodyMesh) {
      const bodyRoll = -this.steerAngle * (this.speed / 100) * 0.15;
      this.carBodyMesh.rotation.z = bodyRoll;
    }

    const wheelRot = (speedMS * delta) / 0.4;
    this.wheels.forEach((w) => (w.rotation.x += wheelRot));

    if (this.activeTargetMarker) {
      this.activeTargetMarker.rotation.y += delta * 2;
    }

    // Telemetry Callback
    this.callbacks.onTelemetryUpdate({
      speed: Math.abs(Math.round(this.speed)),
      fuel: Math.round(this.fuel),
      maxFuel: this.maxFuel,
      tireHealth: Math.round(this.tireHealth),
      engineHealth: Math.round(this.engineHealth),
      isTireBurst: this.isTireBurst,
      gear: this.currentGear,
      x: Math.round(this.x),
      z: Math.round(this.z),
      rotationY: this.rotationY,
      currentPoi: this.currentNearbyPoi,
    });
  }

  // --- CAMERA SYSTEM ---

  private updateCamera() {
    if (this.cameraMode === '3RD_PERSON') {
      const dist = 9.0;
      const height = 4.2;

      const targetX = this.x - Math.sin(this.rotationY) * dist;
      const targetZ = this.z - Math.cos(this.rotationY) * dist;

      this.camera.position.x += (targetX - this.camera.position.x) * 0.1;
      this.camera.position.y += (height - this.camera.position.y) * 0.1;
      this.camera.position.z += (targetZ - this.camera.position.z) * 0.1;

      this.camera.lookAt(this.x, 1.4, this.z);
    } else {
      const hoodX = this.x + Math.sin(this.rotationY) * 0.8;
      const hoodZ = this.z + Math.cos(this.rotationY) * 0.8;

      this.camera.position.set(hoodX, 1.3, hoodZ);

      const lookX = hoodX + Math.sin(this.rotationY) * 20;
      const lookZ = hoodZ + Math.cos(this.rotationY) * 20;

      this.camera.lookAt(lookX, 1.2, lookZ);
    }
  }

  // --- TIMER & DELIVERIES ---

  private updateOrderTimer(delta: number) {
    if (!this.activeOrder || this.activeOrder.status !== 'DELIVERING') return;

    this.activeOrder.remainingSeconds -= delta;

    if (this.activeOrder.remainingSeconds <= 0) {
      this.activeOrder.status = 'FAILED';
      this.callbacks.onAlert('ORDER EXPIRED! Delivery was too slow.', 'danger');
      this.callbacks.onMissionFail('Time expired!');
      this.activeOrder = null;
      if (this.activeTargetMarker) {
        this.scene.remove(this.activeTargetMarker);
        this.activeTargetMarker = null;
      }
      this.callbacks.onOrderUpdate(null);
      return;
    }

    if (!this.activeOrder.checkpoints) return;

    const currIdx = this.activeOrder.currentCheckpointIndex || 0;
    const targetCp = this.activeOrder.checkpoints[currIdx];

    if (targetCp) {
      const distToCp = Math.hypot(this.x - targetCp.x, this.z - targetCp.z);

      if (distToCp < 10) {
        targetCp.completed = true;

        if (currIdx < this.activeOrder.checkpoints.length - 1) {
          // Cleared intermediate checkpoint!
          soundEngine.playCheckpointPass();
          this.activeOrder.remainingSeconds += 15; // Bonus 15 seconds!
          this.activeOrder.currentCheckpointIndex = currIdx + 1;
          this.callbacks.onAlert(`CHECKPOINT ${currIdx + 1} CLEARED! +15s Bonus Time`, 'success');
          this.renderTargetMarker();
          this.callbacks.onOrderUpdate(this.activeOrder);
        } else {
          // Reached Final Customer Destination!
          soundEngine.playDeliveryComplete();

          const timeBonusTip = Math.floor(this.activeOrder.remainingSeconds * 1.5);
          const reward = this.activeOrder.rewardMoney;
          const totalTip = Math.max(10, timeBonusTip);

          this.activeOrder.status = 'COMPLETED';
          this.callbacks.onAlert(`HOT PIZZA DELIVERED! +$${reward} (Tip: +$${totalTip})`, 'success');

          this.callbacks.onDeliveryComplete(reward, totalTip, 5);

          this.activeOrder = null;
          if (this.activeTargetMarker) {
            this.scene.remove(this.activeTargetMarker);
            this.activeTargetMarker = null;
          }
          this.callbacks.onOrderUpdate(null);
        }
      }
    }
  }

  // --- INTERACTION BAYS / POIS ---

  private currentNearbyPoi: POILocation | null = null;

  private checkPOIInteractions() {
    let foundPoi: POILocation | null = null;
    this.poiLocations.forEach((poi) => {
      const dist = Math.hypot(this.x - poi.x, this.z - poi.z);
      if (dist < 14) {
        foundPoi = poi;
      }
    });

    this.currentNearbyPoi = foundPoi;
  }

  public triggerCurrentPOI() {
    if (this.currentNearbyPoi) {
      this.callbacks.onEnterPOI(this.currentNearbyPoi);
    }
  }

  private onWindowResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth || window.innerWidth || 800;
    const height = this.container.clientHeight || window.innerHeight || 600;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public destroy() {
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.stop();
    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
