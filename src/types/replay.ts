export interface ReplayRecord {
  id: number;
  tableId: number;
  startTime: string;
  profit: number;
  mangoStreak: number;
  fee: number;
  sceneName?: string;
}

export interface ReplayTimelineEvent {
  round: number;
  action: string;
  seat: string;
  amount?: number;
  description?: string;
}

export interface ReplayDetail {
  timeline: ReplayTimelineEvent[];
  summary?: string;
}

