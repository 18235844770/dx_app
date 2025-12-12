// WebSocket 适配器与聊天连接管理
// 该文件抽象出浏览器端与 uni-app 端的 WebSocket 实现差异，提供统一的聊天连接控制器

// 统一的事件回调类型定义，保持与原生事件签名兼容
type SocketEventHandler = ((event: any) => void) | null

interface SocketAdapter {
  readonly readyState: number
  onopen: SocketEventHandler
  onclose: SocketEventHandler
  onerror: SocketEventHandler
  onmessage: SocketEventHandler
  send(data: string): void
  close(code?: number, reason?: string): void
}

class BrowserSocketAdapter implements SocketAdapter {
  private socket: WebSocket

  constructor(url: string) {
    // 在 H5 环境下直接实例化原生 WebSocket
    this.socket = new WebSocket(url)
  }

  get readyState() {
    return this.socket.readyState
  }

  get onopen() {
    return (this.socket.onopen ?? null) as SocketEventHandler
  }

  set onopen(handler: SocketEventHandler) {
    this.socket.onopen = handler as any
  }

  get onclose() {
    return (this.socket.onclose ?? null) as SocketEventHandler
  }

  set onclose(handler: SocketEventHandler) {
    this.socket.onclose = handler as any
  }

  get onerror() {
    return (this.socket.onerror ?? null) as SocketEventHandler
  }

  set onerror(handler: SocketEventHandler) {
    this.socket.onerror = handler as any
  }

  get onmessage() {
    return (this.socket.onmessage ?? null) as SocketEventHandler
  }

  set onmessage(handler: SocketEventHandler) {
    this.socket.onmessage = handler as any
  }

  send(data: string) {
    // 原生 send 不需要额外包装
    this.socket.send(data)
  }

  close(code?: number, reason?: string) {
    this.socket.close(code, reason)
  }
}

class UniSocketAdapter implements SocketAdapter {
  private socketTask: any
  private _onopen: SocketEventHandler = null
  private _onclose: SocketEventHandler = null
  private _onerror: SocketEventHandler = null
  private _onmessage: SocketEventHandler = null
  private _readyState = 0

  constructor(url: string) {
    // 在非 H5 平台（小程序、App）中使用 uni.connectSocket
    this.socketTask = uni.connectSocket({ url })
    this.bindEvents()
  }

  private bindEvents() {
    // 将 uni 原生回调转换为标准化事件
    uni.onSocketOpen((event: any) => {
      this._readyState = 1
      this._onopen?.(event)
    })
    uni.onSocketClose((event: any) => {
      this._readyState = 3
      this._onclose?.(event)
    })
    uni.onSocketError((event: any) => {
      this._onerror?.(event)
    })
    uni.onSocketMessage((event: any) => {
      const normalized = { data: event?.data }
      this._onmessage?.(normalized)
    })
  }

  get readyState() {
    return this._readyState
  }

  get onopen() {
    return this._onopen
  }

  set onopen(handler: SocketEventHandler) {
    this._onopen = handler
  }

  get onclose() {
    return this._onclose
  }

  set onclose(handler: SocketEventHandler) {
    this._onclose = handler
  }

  get onerror() {
    return this._onerror
  }

  set onerror(handler: SocketEventHandler) {
    this._onerror = handler
  }

  get onmessage() {
    return this._onmessage
  }

  set onmessage(handler: SocketEventHandler) {
    this._onmessage = handler
  }

  send(data: string) {
    // uni API 需要传入对象结构
    uni.sendSocketMessage({ data })
  }

  close(code?: number, reason?: string) {
    this._readyState = 2
    const options: Record<string, any> = {}
    if (code !== undefined) options.code = code
    if (reason !== undefined) options.reason = reason
    uni.closeSocket(options)
  }
}

const createSocketAdapter = (url: string): SocketAdapter => {
  if (typeof WebSocket === 'function') {
    console.log('[WS][adapter] use native WebSocket')
    return new BrowserSocketAdapter(url)
  }
  console.log('[WS][adapter] WebSocket unavailable, fallback to UniSocketAdapter')
  return new UniSocketAdapter(url)
}

const WS_HOST = 'cashmoo.cn/loans/ws/chat'
const WS_CANDIDATES = [
  `wss://${WS_HOST}`,
  `wss://${WS_HOST}`
]

export interface ChatSocketManagerOptions {
  onMessage: (event: any) => void
  onReadyStateChange?: (ready: boolean) => void
  onOpen?: () => void
  onClose?: (event: any) => void
  onError?: (event: any) => void
  heartbeatInterval?: number
  reconnectDelay?: number
}

export interface ChatSocketController {
  connect(): void
  send(data: string): void
  close(): void
  destroy(): void
  isReady(): boolean
}

class ChatSocketManager implements ChatSocketController {
  private ws: SocketAdapter | null = null
  private wsReady = false
  private heartTimer: ReturnType<typeof setInterval> | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private connectWatchdog: ReturnType<typeof setTimeout> | null = null
  private manualClose = false
  private wsAttemptIndex = 0
  private readonly heartbeatInterval: number
  private readonly reconnectDelay: number

  constructor(private readonly options: ChatSocketManagerOptions) {
    // 允许通过 options 调整心跳、重连间隔
    this.heartbeatInterval = options.heartbeatInterval ?? 25000
    this.reconnectDelay = options.reconnectDelay ?? 3000
  }

  connect() {
    // 创建或重建连接，包含降级与看门狗逻辑
    console.log('[WS][init] begin, attempt=', this.wsAttemptIndex)
    this.manualClose = false
    this.setReady(false)
    if (this.ws) {
      try { this.ws.close() } catch {}
    }

    const url = this.buildWsUrl()
    try {
      console.log('[WS][initUrl] url=' + url)
      this.ws = createSocketAdapter(url)
    } catch (error) {
      console.error('[WS][init] construct failed', error)
      this.tryFallback()
      return
    }

    this.attachEvents()
    this.startConnectWatchdog()
  }

  send(data: string) {
    // 发送前不做额外校验，由上层确保 ready
    try {
      this.ws?.send(data)
    } catch (error) {
      console.error('[WS][send] failed', error)
      throw error
    }
  }

  close() {
    // 主动关闭连接时清理所有定时器并重置状态
    console.log('[WS][close] manual close called')
    this.clearHeartbeat()
    this.clearWatchdog()
    this.clearReconnectTimer()
    this.setReady(false)
    if (this.ws) {
      try { this.ws.close() } catch {}
      this.ws = null
    }
  }

  destroy() {
    // destroy 会阻止后续的自动重连
    console.log('[WS][destroy] teardown socket manager')
    this.manualClose = true
    this.close()
  }

  isReady() {
    return this.wsReady
  }

  private attachEvents() {
    if (!this.ws) return
    this.ws.onopen = () => {
      // 建连成功后启动心跳并通知上层
      console.log('[WS][onopen] success readyState=', this.ws?.readyState)
      this.setReady(true)
      this.clearWatchdog()
      this.startHeartbeat()
      this.options.onOpen?.()
    }

    this.ws.onerror = (error: any) => {
      // 连接出错时尝试降级协议
      console.error('[WS][onerror] err=', error)
      this.clearWatchdog()
      this.options.onError?.(error)
      if (this.wsAttemptIndex === 0 && WS_CANDIDATES.length > 1) {
        console.log('[WS][onerror] try downgrade to ws')
        this.wsAttemptIndex = 1
        this.connect()
      }
    }

    this.ws.onclose = (event: any) => {
      // 被动关闭后进入重连流程
      console.log('[WS][onclose] code=', event.code, 'reason=', event.reason)
      this.setReady(false)
      this.clearWatchdog()
      this.options.onClose?.(event)
      this.scheduleReconnect()
    }

    this.ws.onmessage = (event: any) => {
      // 统一将消息交给业务层处理
      this.options.onMessage(event)
    }
  }

  private startHeartbeat() {
    // 定时发送 ping，保持长连接活跃
    console.log('[WS][heartbeat] start')
    if (this.heartTimer) clearInterval(this.heartTimer)
    this.heartTimer = setInterval(() => {
      if (this.ws && this.wsReady) {
        const ping = { type: 'ping', ts: Date.now() }
        console.log('[WS][heartbeat] send', ping)
        try {
          this.ws.send(JSON.stringify(ping))
        } catch (error) {
          console.warn('[WS][heartbeat] send ping failed', error)
        }
      } else {
        console.log('[WS][heartbeat] skip (wsReady=', this.wsReady, ')')
      }
    }, this.heartbeatInterval)
  }

  private scheduleReconnect() {
    if (this.manualClose) {
      // 手动关闭时不再触发自动重连
      console.log('[WS][reconnect] manualClose = true, skip')
      return
    }
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    console.log('[WS][reconnect] will attempt in', this.reconnectDelay, 'ms')
    this.reconnectTimer = setTimeout(() => {
      console.log('[WS][reconnect] executing reconnect now')
      this.connect()
    }, this.reconnectDelay)
  }

  private tryFallback() {
    if (this.wsAttemptIndex === 0 && WS_CANDIDATES.length > 1) {
      // 第一次失败时尝试切换候选地址
      this.wsAttemptIndex = 1
      this.connect()
    } else {
      this.scheduleReconnect()
    }
  }

  private startConnectWatchdog() {
    if (this.connectWatchdog) clearTimeout(this.connectWatchdog)
    this.connectWatchdog = setTimeout(() => {
      if (!this.wsReady) {
        // 超时未 onopen 视为失败，降级或重连
        console.warn('[WS][watchdog] no onopen within 5s, readyState=', this.ws?.readyState)
        if (this.wsAttemptIndex === 0 && WS_CANDIDATES.length > 1) {
          console.log('[WS][watchdog] downgrade to ws')
          this.wsAttemptIndex = 1
          this.connect()
        } else {
          this.scheduleReconnect()
        }
      }
    }, 5000)
  }

  private buildWsUrl() {
    // 将 token、用户类型作为查询参数追加到候选地址
    const token = encodeURIComponent(uni.getStorageSync('token') || '')
    const base = WS_CANDIDATES[this.wsAttemptIndex] ?? WS_CANDIDATES[0]
    const url = `${base}?token=${token}&userType=1`
    console.log('[WS][buildWsUrl] attempt=', this.wsAttemptIndex, 'url=', url)
    return url
  }

  private setReady(next: boolean) {
    // 仅在状态发生变化时通知外部
    if (this.wsReady === next) return
    this.wsReady = next
    this.options.onReadyStateChange?.(next)
  }

  private clearHeartbeat() {
    if (this.heartTimer) {
      clearInterval(this.heartTimer)
      this.heartTimer = null
    }
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private clearWatchdog() {
    if (this.connectWatchdog) {
      clearTimeout(this.connectWatchdog)
      this.connectWatchdog = null
    }
  }
}

export const createChatSocketManager = (options: ChatSocketManagerOptions): ChatSocketController => {
  return new ChatSocketManager(options)
}
