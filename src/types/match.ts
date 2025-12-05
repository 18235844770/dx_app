export type MatchQueueStatus = 'queued' | 'matched' | 'idle';

export interface MatchStatus {
  status: MatchQueueStatus;
  sceneId: number;
  queueId?: string;
  tableId?: number;
  matchId?: number;
  joinedAt?: string;
}

export interface JoinMatchPayload {
  sceneId: number;
  buyIn: number;
  gpsLat?: number;
  gpsLng?: number;
}

export interface JoinMatchResponse {
  queueId: string;
  status: MatchQueueStatus;
  sceneId?: number;
}
