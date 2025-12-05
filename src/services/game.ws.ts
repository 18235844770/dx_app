import { useUserStore } from '@/store/user';
import { useTableStore } from '@/store/table';
import { useMatchStore } from '@/store/match';
import { WSMessage, WSAction, TableState, LogItem } from '@/types/game';

const WS_BASE = import.meta.env.VITE_WS_BASE || 'ws://localhost:8080';

class GameWS {
  private socketTask?: UniApp.SocketTask;
  private hbTimer?: number;
  private reconnectTimer?: number;
  private retry = 0;
  private manualClose = false;
  private pendingState: TableState | null = null;
  private rafId: number | null = null;
  private rafUsingTimeout = false;
  private seq = 1;
  private lastLogSeq = 0;
  private lastPongAt = 0;
  private countdownTimer?: number;

  connect(tableId: string) {
    const userStore = useUserStore();
    const token = userStore.token;
    if (!token) {
      uni.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    const matchStore = useMatchStore();
    const expectedTableId = matchStore.tableId;
    if (expectedTableId && String(expectedTableId) !== String(tableId)) {
      uni.showToast({ title: '桌号不匹配，已取消连接', icon: 'none' });
      return;
    }

    this.manualClose = false;
    this.seq = 1;
    this.lastLogSeq = 0;
    this.lastPongAt = Date.now();
    this.clearHeartbeat();
    this.clearFrame();
    this.socketTask?.close({});

    const params = new URLSearchParams();
    params.set('token', token);
    if (matchStore.matchId) params.set('matchId', matchStore.matchId);
    const tableStore = useTableStore();
    if (tableStore.seatId !== null) params.set('seatId', String(tableStore.seatId));

    const url = `${WS_BASE}/ws/table/${tableId}?${params.toString()}`;
    tableStore.setTable(tableId);
    this.socketTask = uni.connectSocket({ url });

    this.socketTask.onOpen(() => {
      tableStore.setConnected(true);
      tableStore.setReconnectExhausted(false);
      this.retry = 0;
      this.startHeartbeat();
      this.send({ type: 'rejoin', data: {} });
    });

    this.socketTask.onMessage((evt) => {
      try {
        const msg = JSON.parse(evt.data as string) as WSMessage;
        this.handleMsg(msg);
      } catch (error) {
        console.error('WS message parse error', error);
      }
    });

    this.socketTask.onClose(() => this.reconnect(tableId));
    this.socketTask.onError(() => this.reconnect(tableId));
  }

  send(payload: WSAction) {
    if (!this.socketTask) {
      uni.showToast({ title: '连接未建立', icon: 'none' });
      return;
    }
    const tableStore = useTableStore();
    const matchStore = useMatchStore();
    const envelope = {
      ...payload,
      seq: this.nextSeq(),
      tableId: tableStore.tableId,
      matchId: matchStore.matchId,
      ts: Date.now()
    };
    this.socketTask.send({ data: JSON.stringify(envelope) });
  }

  private startHeartbeat() {
    this.clearHeartbeat();
    this.hbTimer = setInterval(() => {
      this.send({ type: 'ping', data: {} });
      this.checkPongTimeout();
    }, 10000) as unknown as number;
    this.lastPongAt = Date.now();
  }

  private reconnect(tableId: string) {
    const tableStore = useTableStore();
    tableStore.setConnected(false);
    this.clearHeartbeat();
    if (this.manualClose) return;
    if (this.retry >= 5) {
      uni.showToast({ title: '连接已断开', icon: 'none' });
      tableStore.setReconnectExhausted(true);
      return;
    }
    const delay = Math.min(1000 * 2 ** this.retry, 8000);
    this.retry += 1;
    this.reconnectTimer && clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => this.connect(tableId), delay) as unknown as number;
  }

  private handleMsg(msg: WSMessage) {
    if (msg.type === 'state') {
      this.scheduleState(msg.data as TableState);
      return;
    }
    if (msg.type === 'log') {
      this.appendLog(msg.seq, msg.data as LogItem);
      return;
    }
    if (msg.type === 'error') {
      uni.showToast({ title: msg.data.message || '服务端错误', icon: 'none' });
      // 收到错误，清理挂起动作，避免长时间禁用
      useTableStore().clearPending();
      return;
    }
    if (msg.type === 'pong') {
      this.lastPongAt = Date.now();
      return;
    }
  }

  private scheduleState(state: TableState) {
    const tableStore = useTableStore();
    this.pendingState = state;
    if (this.rafId) return;

    const flush = () => {
      if (this.pendingState) {
        const userStore = useUserStore();
        const uid = userStore.profile?.id;
        if (uid && this.pendingState.seats) {
          const seat = this.pendingState.seats.find((s) => s.userId === uid);
          tableStore.setSeatId(seat?.seatIndex ?? null);
        }
        tableStore.applyState(this.pendingState);
        this.startCountdownTimer();
        tableStore.clearPending();
      }
      this.pendingState = null;
      this.rafId = null;
      this.rafUsingTimeout = false;
    };

    if (typeof requestAnimationFrame === 'function') {
      this.rafId = requestAnimationFrame(() => flush()) as unknown as number;
    } else {
      this.rafUsingTimeout = true;
      this.rafId = setTimeout(flush, 16) as unknown as number;
    }
  }

  private appendLog(seq: number | undefined, log: LogItem) {
    const tableStore = useTableStore();
    if (seq && seq <= tableStore.lastFeedSeq) return;
    if (seq) tableStore.setLastFeedSeq(seq);
    const feed = {
      id: log.id || `feed-${Date.now()}`,
      type: (log as any).type || 'action',
      text: log.content,
      ts: log.timestamp || Date.now(),
      seq
    };
    tableStore.enqueueFeed(feed);
  }

  private clearHeartbeat() {
    if (this.hbTimer) {
      clearInterval(this.hbTimer);
      this.hbTimer = undefined;
    }
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = undefined;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
  }

  private clearFrame() {
    if (this.rafId) {
      if (this.rafUsingTimeout) {
        clearTimeout(this.rafId);
      } else if (typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(this.rafId);
      }
      this.rafId = null;
      this.rafUsingTimeout = false;
    }
    this.pendingState = null;
  }

  close() {
    this.manualClose = true;
    this.clearHeartbeat();
    this.clearFrame();
    this.socketTask?.close({});
    this.socketTask = undefined;
  }

  private nextSeq() {
    return this.seq++;
  }

  private checkPongTimeout() {
    const now = Date.now();
    if (now - this.lastPongAt > 30000) {
      // Pong超时，触发重连
      if (this.socketTask) {
        this.socketTask.close({});
      }
    }
  }

  private startCountdownTimer() {
    const tableStore = useTableStore();
    if (this.countdownTimer) return;
    this.countdownTimer = setInterval(() => {
      const st = tableStore.state;
      if (!st || st.countdown <= 0) return;
      st.countdown = Math.max(0, st.countdown - 1);
      tableStore.applyState({ ...st });
    }, 1000) as unknown as number;
  }
}

export const gameWS = new GameWS();
