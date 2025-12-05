import { useUserStore } from '@/store/user';
import { useTableStore } from '@/store/table';
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

  connect(tableId: string) {
    const userStore = useUserStore();
    const token = userStore.token;
    if (!token) {
      uni.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    this.manualClose = false;
    this.clearHeartbeat();
    this.clearFrame();
    this.socketTask?.close({});

    const url = `${WS_BASE}/ws/table/${tableId}?token=${token}`;
    this.socketTask = uni.connectSocket({ url });

    this.socketTask.onOpen(() => {
      const tableStore = useTableStore();
      tableStore.wsConnected = true;
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
    this.socketTask.send({ data: JSON.stringify(payload) });
  }

  private startHeartbeat() {
    this.clearHeartbeat();
    this.hbTimer = setInterval(() => {
      this.send({ type: 'ping', data: {} });
    }, 10000) as unknown as number;
  }

  private reconnect(tableId: string) {
    const tableStore = useTableStore();
    tableStore.wsConnected = false;
    this.clearHeartbeat();
    if (this.manualClose) return;
    if (this.retry >= 5) {
      uni.showToast({ title: '连接已断开', icon: 'none' });
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
      this.appendLog(msg.data as LogItem);
      return;
    }
    if (msg.type === 'error') {
      uni.showToast({ title: msg.data.message || '服务端错误', icon: 'none' });
      return;
    }
    if (msg.type === 'pong') {
      return;
    }
  }

  private scheduleState(state: TableState) {
    const tableStore = useTableStore();
    this.pendingState = state;
    if (this.rafId) return;

    const flush = () => {
      if (this.pendingState) {
        tableStore.applyState(this.pendingState);
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

  private appendLog(log: LogItem) {
    const tableStore = useTableStore();
    if (tableStore.state) {
      tableStore.appendLog(log);
    }
  }

  private clearHeartbeat() {
    if (this.hbTimer) {
      clearInterval(this.hbTimer);
      this.hbTimer = undefined;
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
}

export const gameWS = new GameWS();

