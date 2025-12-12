import { useUserStore } from '@/store/user';
import { useTableStore } from '@/store/table';
import { useMatchStore } from '@/store/match';
import { WSMessage, WSAction, TableState, LogItem } from '@/types/game';

const WS_BASE = import.meta.env.VITE_WS_BASE || 'ws://81.68.235.105:9081';
const log = (...args: any[]) => console.log('[牌桌WS]', ...args);

class GameWS {
  private socketTask?: UniApp.SocketTask | WebSocket;
  private hbTimer?: number;
  private reconnectTimer?: number;
  private retry = 0;
  private manualClose = false;
  private pendingState: TableState | null = null;
  private rafId: number | null = null;
  private rafUsingTimeout = false;
  private seq = 1;
  private lastPongAt = 0;
  private countdownTimer?: number;
  private currentTableId: string | null = null;
  private globalBound = false;

  private bindGlobalHandlers() {
    if (this.globalBound) return;
    this.globalBound = true;
    const tableStore = useTableStore();

    uni.onSocketOpen(() => {
      const tableId = this.currentTableId;
      if (!tableId) return;
      log('连接打开[global]');
      tableStore.setConnected(true);
      tableStore.setReconnectExhausted(false);
      this.retry = 0;
      this.startHeartbeat();
      this.send({ type: 'rejoin', data: {} });
    });

    uni.onSocketMessage((event: any) => {
      const tableId = this.currentTableId;
      if (!tableId) return;
      try {
        const data = (event?.data ?? event)?.data ?? event?.data ?? event;
        const msg = JSON.parse(data as string) as WSMessage;
        log('收到消息[global]', msg.type, { seq: (msg as any).seq });
        this.handleMsg(msg);
        tableStore.setConnected(true);
      } catch (error) {
        console.error('WS message parse error', error);
      }
    });

    uni.onSocketClose(() => {
      const tableId = this.currentTableId;
      if (!tableId) return;
      log('连接关闭[global]，触发重连');
      this.reconnect(tableId);
    });

    uni.onSocketError((err: any) => {
      const tableId = this.currentTableId;
      if (!tableId) return;
      log('连接异常[global]，触发重连', err);
      this.reconnect(tableId);
    });
  }

  connect(tableId: string) {
    this.currentTableId = tableId;
    this.bindGlobalHandlers();
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
    this.lastPongAt = Date.now();
    this.clearHeartbeat();
    this.clearFrame();
    this.safeCloseSocket();

    const params = new URLSearchParams();
    params.set('token', token);
    if (matchStore.matchId) params.set('matchId', matchStore.matchId);
    const tableStore = useTableStore();
    if (tableStore.seatId !== null) params.set('seatId', String(tableStore.seatId));

    const url = `${WS_BASE}/ws/table/${tableId}?${params.toString()}`;
    tableStore.setTable(tableId);
    log('开始连接', { tableId, url });
    const created = uni.connectSocket({ url }) as
      | UniApp.SocketTask
      | WebSocket
      | Promise<UniApp.SocketTask | WebSocket>;
    const handleTask = (task: UniApp.SocketTask | WebSocket | undefined) => {
      if (!task) return;
      this.socketTask = task;
      log('拿到 socket 对象', { readyState: (task as any).readyState });
      // 全局回调已提前绑定
      const onOpen = () => {
        log('连接打开');
        tableStore.setConnected(true);
        tableStore.setReconnectExhausted(false);
        this.retry = 0;
        this.startHeartbeat();
        this.send({ type: 'rejoin', data: {} });
      };
    const onMessage = (evt: any) => {
      try {
        const data = (evt?.data ?? evt)?.data ?? evt.data ?? evt;
        const msg = JSON.parse(data as string) as WSMessage;
        log('收到消息', msg.type, { seq: (msg as any).seq });
        this.handleMsg(msg);
        // 任意消息到达都视为已连通，防止 onOpen 未触发时 UI 卡断开
        useTableStore().setConnected(true);
      } catch (error) {
        console.error('WS message parse error', error);
      }
    };
      const onClose = () => {
        log('连接关闭，触发重连');
        this.reconnect(tableId);
      };
      const onError = (err: any) => {
        log('连接异常，触发重连', err);
        this.reconnect(tableId);
      };

      if (typeof (task as any).onOpen === 'function') {
        (task as any).onOpen(onOpen);
        (task as any).onMessage(onMessage);
        (task as any).onClose(onClose);
        (task as any).onError(onError);
      } else if ('onopen' in (task as any) || typeof (task as any).onopen === 'function') {
        (task as any).onopen = onOpen;
        (task as any).onmessage = onMessage;
        (task as any).onclose = onClose;
        (task as any).onerror = onError;
      } else if (typeof (task as any).addEventListener === 'function') {
        (task as any).addEventListener('open', onOpen);
        (task as any).addEventListener('message', onMessage);
        (task as any).addEventListener('close', onClose);
        (task as any).addEventListener('error', onError);
      } else {
        console.warn('Unknown socket task type, cannot attach handlers');
      }

      // If the socket is already open (e.g., promise resolves after open), trigger onOpen manually
      const readyState = (task as any).readyState;
      const OPEN = (task as any).OPEN ?? 1;
      if (readyState === OPEN) {
        onOpen();
      }
    };

    // uni.connectSocket may return SocketTask or Promise<SocketTask> depending on platform
    if ((created as any)?.then) {
      log('connectSocket 返回 Promise');
      (created as Promise<UniApp.SocketTask | WebSocket>)
        .then((task) => handleTask(task))
        .catch((err) => {
          console.error('connectSocket failed', err);
          uni.showToast({ title: '连接异常', icon: 'none' });
        });
    } else {
      log('connectSocket 返回 SocketTask');
      handleTask(created as UniApp.SocketTask | WebSocket);
    }

    // 兜底：部分端 promise 未回调或 onOpen 不触发时，做一次就绪探测
    setTimeout(() => {
      const task = this.socketTask as any;
      const rs = task?.readyState;
      const OPEN = task?.OPEN ?? 1;
      log('兜底探测 readyState', rs);
      if (rs === OPEN && typeof (task as any)?.onOpen === 'function') {
        (task as any).onOpen(() => {});
      }
    }, 2000);
  }

  send(payload: WSAction) {
    const socket = this.socketTask;
    if (!socket) {
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
    log('发送', payload.type, { seq: envelope.seq });
    const data = JSON.stringify(envelope);
    const isBrowserSocket = typeof WebSocket !== 'undefined' && socket instanceof WebSocket;
    const sender = (socket as any).send;
    if (isBrowserSocket) {
      (socket as WebSocket).send(data);
    } else if (typeof sender === 'function') {
      // 小程序/APP SocketTask 形态
      sender.call(socket, { data });
    } else {
      // 兜底：若 socketTask 无 send 方法，使用全局 API
      uni.sendSocketMessage({ data });
    }
  }

  private startHeartbeat() {
    this.clearHeartbeat();
    log('启动心跳');
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
    log('计划重连', { retry: this.retry, delay });
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
    this.pendingState = normalizeState(state);
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
    log('手动关闭连接');
    this.safeCloseSocket();
  }

  private nextSeq() {
    return this.seq++;
  }

  private checkPongTimeout() {
    const now = Date.now();
    if (now - this.lastPongAt > 30000) {
      // Pong timeout -> force reconnect
      log('心跳超时，强制重连');
      this.safeCloseSocket();
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

  private safeCloseSocket() {
    const task = this.socketTask as any;
    if (task && typeof task.close === 'function') {
      const readyState = (task as any).readyState;
      const OPEN = (task as any).OPEN ?? 1;
      // 仅在已打开或未定义 readyState 时尝试关闭
      if (readyState === undefined || readyState === OPEN) {
        log('尝试安全关闭 socket', { readyState });
        try {
          // 小程序 SocketTask 支持 close({})
          task.close({});
        } catch {
          try {
            task.close();
          } catch {
            // noop
          }
        }
      }
    }
    this.socketTask = undefined;
    // 标记断开，等待重连
    useTableStore().setConnected(false);
  }
}

export const gameWS = new GameWS();

function normalizeState(raw: TableState): TableState {
  const seats = (raw.seats || []).map((s) => ({
    ...s,
    seatIndex: Number(s.seatIndex),
    userId: typeof s.userId === 'string' ? Number(s.userId) : s.userId,
    chips: Number(s.chips || 0)
  }));
  return {
    ...raw,
    seats,
    logs: raw.logs || [],
    tableId: String(raw.tableId)
  };
}
