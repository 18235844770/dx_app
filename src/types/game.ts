export type ActionType =
  | 'pass' | 'call' | 'raise' | 'knock_bobo'
  | 'fold' | 'ready' | 'rejoin' | 'ping';

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
  userId: string;
  alias: string;
  chips: number;
  avatar?: string;
  status: 'waiting' | 'playing' | 'folded' | 'eliminated';
}

export interface LogItem {
  id: string;
  timestamp: number;
  content: string;
}

export interface TableState {
  tableId: string;
  round: 1 | 2 | 3;
  turnSeat: number;
  lastRaise: number;
  mangoStreak: number;
  countdown: number;
  allowedActions: ActionType[];
  seats: SeatDTO[];
  myCards: string[]; // "**" or real
  logs: LogItem[];
  result?: any; // For settlement
}

