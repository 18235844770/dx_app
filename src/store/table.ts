import { defineStore } from 'pinia';
import { TableState, LogItem, FeedItem } from '@/types/game';

const FEED_LIMIT = 50;
const feedBuffer: FeedItem[] = [];
let flushTimer: number | null = null;

export const useTableStore = defineStore('table', {
  state: () => ({
    tableId: '',
    wsConnected: false,
    state: null as TableState | null,
    seatId: null as number | null,
    feed: [] as FeedItem[],
    lastFeedSeq: 0,
    pendingActions: new Set<string>(),
    reconnectExhausted: false
  }),
  actions: {
    setTable(id: string) {
      this.tableId = id;
    },
    setConnected(val: boolean) {
      this.wsConnected = val;
    },
    setSeatId(seatId: number | null) {
      this.seatId = seatId;
    },
    setLastFeedSeq(seq: number) {
      this.lastFeedSeq = seq;
    },
    addPending(action: string) {
      this.pendingActions.add(action);
    },
    clearPending(action?: string) {
      if (action) {
        this.pendingActions.delete(action);
      } else {
        this.pendingActions.clear();
      }
    },
    setReconnectExhausted(val: boolean) {
      this.reconnectExhausted = val;
    },
    applyState(s: TableState) {
      if (!this.tableId) {
        this.tableId = s.tableId;
      }
      this.state = s;
      // 服务端状态到达后，认为此前提交的动作已处理
      this.pendingActions.clear();
    },
    appendLog(log: LogItem) {
      if (!this.state) return;
      const logs = this.state.logs || [];
      this.state = {
        ...this.state,
        logs: [...logs, log].slice(-50)
      };
    },
    enqueueFeed(item: FeedItem) {
      feedBuffer.push(item);
      if (flushTimer) return;
      flushTimer = setTimeout(() => {
        flushTimer = null;
        if (feedBuffer.length === 0) return;
        const next = feedBuffer.splice(0, feedBuffer.length);
        const merged = [...this.feed, ...next].slice(-FEED_LIMIT);
        this.feed = merged;
      }, 50) as unknown as number;
    },
    reset() {
      this.tableId = '';
      this.wsConnected = false;
      this.state = null;
      this.seatId = null;
      this.feed = [];
      this.lastFeedSeq = 0;
      this.pendingActions.clear();
      this.reconnectExhausted = false;
      feedBuffer.splice(0, feedBuffer.length);
      if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
      }
    }
  }
});
