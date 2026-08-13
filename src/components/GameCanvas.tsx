import React, { useEffect, useRef } from 'react';
import { PizzaDeliveryEngine, GameEngineCallbacks } from '../game/threeEngine';
import { CarData, GameState } from '../types';

interface GameCanvasProps {
  carData: CarData;
  timeOfDay: 'DAY' | 'SUNSET' | 'NIGHT';
  gameState: GameState;
  callbacks: GameEngineCallbacks;
  engineRef: React.MutableRefObject<PizzaDeliveryEngine | null>;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  carData,
  timeOfDay,
  gameState,
  callbacks,
  engineRef,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const callbacksRef = useRef(callbacks);

  // Keep callbacks ref updated without triggering engine destruction
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  // Proxied callbacks object that remains reference-equal
  const proxiedCallbacks = useRef<GameEngineCallbacks>({
    onTelemetryUpdate: (tel) => callbacksRef.current.onTelemetryUpdate?.(tel),
    onOrderUpdate: (order) => callbacksRef.current.onOrderUpdate?.(order),
    onAlert: (msg, type) => callbacksRef.current.onAlert?.(msg, type),
    onEnterPOI: (poi) => callbacksRef.current.onEnterPOI?.(poi),
    onDeliveryComplete: (reward, tip) => callbacksRef.current.onDeliveryComplete?.(reward, tip),
    onMissionFail: (reason) => callbacksRef.current.onMissionFail?.(reason),
  }).current;

  useEffect(() => {
    if (!mountRef.current) return;

    // Initialize Pizza Delivery Engine
    const engine = new PizzaDeliveryEngine(mountRef.current, carData, proxiedCallbacks);
    engine.setTimeOfDay(timeOfDay);
    engine.renderFrame();

    engineRef.current = engine;

    if (gameState === 'DRIVING') {
      engine.start();
    }

    // ResizeObserver for reliable canvas sizing across container layout shifts
    const resizeObserver = new ResizeObserver(() => {
      if (engineRef.current) {
        engineRef.current.onWindowResize();
        engineRef.current.renderFrame();
      }
    });
    resizeObserver.observe(mountRef.current);

    return () => {
      resizeObserver.disconnect();
      engine.destroy();
      engineRef.current = null;
    };
  }, [carData, engineRef]);

  // Synchronize engine start/pause with gameState changes
  useEffect(() => {
    if (engineRef.current) {
      if (gameState === 'DRIVING') {
        engineRef.current.start();
      } else if (gameState === 'PAUSED' || gameState === 'MENU') {
        engineRef.current.pause();
      }
    }
  }, [gameState]);

  // Update Time of Day dynamically
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setTimeOfDay(timeOfDay);
    }
  }, [timeOfDay, engineRef]);

  return <div ref={mountRef} className="w-full h-full absolute inset-0 bg-slate-950" />;
};
