export type ActionType =
  | 'pass' | 'call' | 'raise' | 'knock_bobo'
  | 'fold' | 'ready' | 'rejoin' | 'ping';

export type Phase = 'waiting' | 'playing' | 'settling' | 'ended';

export interface WSMessage {
  type: 'state' | 'error' | 'pong' | 'log';
  seq: number;
  data: any;
}

export interface WSAction {
  type: ActionType;
  data: any;
}

export interface SeatDTO {
  seatIndex: number;
  userId: number;
  alias: string;
  chips: number;
  avatar?: string;
  status: 'waiting' | 'playing' | 'folded' | 'eliminated';
  bet?: number;
  split?: { head?: string[]; tail?: string[] };
}

export interface LogItem {
  id: string;
  timestamp: number;
  content: string;
}

export type FeedType = 'system' | 'action' | 'warning' | 'result';

export interface FeedItem {
  id: string;
  type: FeedType;
  text: string;
  ts: number;
  seq?: number;
}

export interface TableState {
  tableId: string;
  phase: Phase;
  round: number;
  turnSeat: number;
  lastRaise: number;
  mangoStreak: number;
  countdown: number;
  allowedActions: ActionType[];
  seats: SeatDTO[];
  myCards: string[]; // "**" or real
  logs: LogItem[];
  result?: any; // For settlement
  pot?: number;
}
