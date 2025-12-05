import { defineStore } from 'pinia';
import { SceneApiModel, SceneConfig } from '@/types/hall';
import * as hallApi from '@/services/hall.api';

interface HallState {
  scenes: SceneConfig[];
  onlineCount: number;
  gps: { lat: number; lng: number } | null;
}

const normalizeScene = (scene: SceneApiModel): SceneConfig => ({
  id: scene.ID,
  name: scene.Name,
  seatCount: scene.SeatCount,
  minIn: scene.MinIn,
  maxIn: scene.MaxIn,
  basePi: scene.BasePi,
  minUnitPi: scene.MinUnitPi,
  mangoEnabled: scene.MangoEnabled,
  boboEnabled: scene.BoboEnabled,
  distanceThresholdM: scene.DistanceThresholdM,
  rakeRuleId: scene.RakeRuleID,
  createdAt: scene.CreatedAt,
  updatedAt: scene.UpdatedAt,
  status: scene.Status
});

const normalizeScenes = (scenes: SceneApiModel[] = []) => scenes.map(normalizeScene);

export const useHallStore = defineStore('hall', {
  state: (): HallState => ({
    scenes: [],
    onlineCount: 0,
    gps: null
  }),
  actions: {
    async loadState(this: HallState) {
      const res = await hallApi.getScenes();
      const scenes = normalizeScenes(res?.scenes ?? []);
      this.scenes = scenes;
      this.onlineCount =
        res?.onlineCount ?? scenes.reduce((total, item) => total + (item.seatCount || 0), 0);
    },
    setGPS(this: HallState, lat: number | null, lng: number | null) {
        if (lat !== null && lng !== null) {
            this.gps = { lat, lng };
        } else {
            this.gps = null;
        }
    }
  }
});

