export interface SceneApiModel {
  ID: number;
  Name: string;
  SeatCount: number;
  MinIn: number;
  MaxIn: number;
  BasePi: number;
  MinUnitPi: number;
  MangoEnabled: boolean;
  BoboEnabled: boolean;
  DistanceThresholdM: number;
  Status: string;
  RakeRuleID: number;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface SceneConfig {
  id: number;
  name: string;
  seatCount: number;
  minIn: number;
  maxIn: number;
  basePi: number;
  minUnitPi: number;
  mangoEnabled: boolean;
  boboEnabled: boolean;
  distanceThresholdM: number;
  rakeRuleId: number;
  createdAt: string;
  updatedAt?: string;
  status?: string;
  banner?: string;
  description?: string;
}

export interface ScenesResponse {
  scenes: SceneApiModel[];
  onlineCount?: number;
  updatedAt?: string;
}

