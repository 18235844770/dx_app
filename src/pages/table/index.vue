<template>
  <view class="table-page">
    <view class="connection-tip" v-if="!connected">
      <text v-if="!reconnectExhausted">连接中断，正在重连...</text>
      <text v-else>连接已断开，请手动重连</text>
      <button v-if="reconnectExhausted" size="mini" @click="manualReconnect">手动重连</button>
    </view>
    <view v-if="!state" class="loading">正在同步牌桌...</view>
    <view v-else>
      <view class="phase">阶段：{{ phaseLabel }}</view>
      <view class="hint" v-if="hintText">{{ hintText }}</view>
      <view class="last-action" v-if="lastActionFeed">
        {{ lastActionFeed }}
      </view>
      <view class="mango-indicator" v-if="state.mangoStreak && state.mangoStreak > 0">
        <text>忙 × {{ state.mangoStreak }}</text>
      </view>
      <view class="pot-container" v-if="state.pot !== undefined && state.phase === 'playing'">
        <text class="pot-label">当前底池</text>
        <text class="pot-amount">¥ {{ state.pot }}</text>
      </view>
      <RoundIndicator :round="state.round" :turn-seat="state.turnSeat" />
      <Countdown :value="state.countdown || 0" label="操作倒计时" />
      <SeatList :seats="state.seats || []" :my-seat-id="userStore.profile?.id" />

      <view class="result-overlay" v-if="showResultOverlay">
        <view class="result-title">本局结算</view>
        <view class="result-meta" v-if="state.mangoStreak">
          <text>忙气：{{ state.mangoStreak }}</text>
        </view>
      <view class="result-list">
        <view v-for="item in resultEntries" :key="item.key" class="result-row">
          <image class="avatar" :src="item.avatar || defaultAvatar" mode="aspectFill" />
          <view class="result-info">
            <view class="name-line">
              <text class="alias">{{ item.alias }}</text>
              <text class="win-type" v-if="item.winType">{{ item.winType }}</text>
            </view>
            <view class="split-line" v-if="item.head?.length || item.tail?.length">
              <text class="split-label">头</text>
              <text class="split-cards">{{ item.head?.join(' ') || '-' }}</text>
              <text class="split-label">尾</text>
              <text class="split-cards">{{ item.tail?.join(' ') || '-' }}</text>
            </view>
          </view>
          <view class="net" :class="{ win: item.netPoints > 0 }">
            {{ item.netPoints > 0 ? '+' : '' }}{{ item.netPoints }}
          </view>
        </view>
      </view>
        <button size="mini" @click="closeResult">继续</button>
      </view>

      <CardsHand :cards="myCardsDisplay" :split="mySplit" :showSplit="state.phase === 'ended'" />
      <LogTicker :feed="feed" />
    </view>

    <ActionBar
      :allowed="allowedActions"
      :highlight="highlightAction"
      :pending="pendingActions"
      @fold="sendAction('fold')"
      @pass="sendAction('pass')"
      @call="sendAction('call')"
      @knock="sendAction('knock_bobo')"
      @ready="sendAction('ready')"
      @raise="openBetPanel"
    />

    <view class="leave-wrap">
      <button class="leave-btn" size="mini" @click="leaveTable">离开对局</button>
    </view>

    <BetPanel
      :visible="showBetPanel"
      :min="betMin"
      :max="betMax"
      :step="betStep"
      @confirm="confirmRaise"
      @cancel="showBetPanel = false"
    />
  </view>
</template>

<script setup lang="ts">
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { computed, ref, watch } from 'vue';
import { useTableStore } from '@/store/table';
import { useUserStore } from '@/store/user';
import { useMatchStore } from '@/store/match';
import { gameWS } from '@/services/game.ws';
import type { ActionType, Phase, SeatDTO } from '@/types/game';
import ActionBar from '@/components/table/ActionBar.vue';
import SeatList from '@/components/table/SeatList.vue';
import CardsHand from '@/components/table/CardsHand.vue';
import BetPanel from '@/components/table/BetPanel.vue';
import RoundIndicator from '@/components/table/RoundIndicator.vue';
import LogTicker from '@/components/table/LogTicker.vue';
import Countdown from '@/components/common/Countdown.vue';

const tableStore = useTableStore();
const userStore = useUserStore();
const matchStore = useMatchStore();
const tableId = ref('');
const connected = computed(() => tableStore.wsConnected);
const state = computed(() => tableStore.state);
const feed = computed(() => tableStore.feed);
// 将最近一条动作作为提示
const lastActionFeed = computed(() => {
  const actions = feed.value.filter((f) => f.type === 'action');
  return actions.length ? actions[actions.length - 1].text : '';
});
const reconnectExhausted = computed(() => tableStore.reconnectExhausted);
const showBetPanel = ref(false);
const allowedActions = computed<ActionType[]>(() => state.value?.allowedActions || []);
const pendingActions = computed<string[]>(() => Array.from(tableStore.pendingActions) as string[]);
const defaultAvatar = 'https://dummyimage.com/100x100/1c1c2b/ffffff&text=P';

const phaseLabel = computed(() => {
  const phase: Phase | undefined = state.value?.phase;
  switch (phase) {
    case 'waiting': return '等待开始';
    case 'playing': return '进行中';
    case 'settling': return '结算中';
    case 'ended': return '已结束';
    default: return '--';
  }
});

const hintText = computed(() => {
  const round = state.value?.round;
  if (state.value?.phase === 'waiting') return '等待所有玩家准备';
  if (state.value?.phase === 'settling') return '结算中，请稍候';
  if (state.value?.phase === 'ended') return '本局已结束';
  if (round === 2 && allowedActions.value.includes('knock_bobo')) {
    return '第二圈可敲波波（拖动/点击敲击按钮）';
  }
  if (round === 3) {
    return '第三圈禁止发照，仅可比牌或弃牌';
  }
  return '';
});

const highlightAction = computed<ActionType | null>(() => {
  if (state.value?.round === 2 && allowedActions.value.includes('knock_bobo')) {
    return 'knock_bobo';
  }
  return null;
});

const betMin = computed(() => state.value?.lastRaise ?? 0);
const betMax = computed(() => {
  const mySeat = state.value?.seats.find((seat) => seat.userId === userStore.profile?.id);
  const chips = mySeat?.chips ?? 0;
  return Math.max(chips, betMin.value || 0);
});
const betStep = computed(() => Math.max(1, Math.floor((betMax.value - betMin.value) / 10)));

const openBetPanel = () => {
  if (!state.value) return;
  if (betMax.value <= betMin.value) {
    uni.showToast({ title: '筹码不足，无法加注', icon: 'none' });
    return;
  }
  showBetPanel.value = true;
};

const confirmRaise = (amount: number) => {
  showBetPanel.value = false;
  sendAction('raise', { amount });
};

const sendAction = (type: ActionType, data: any = {}) => {
  if (!allowedActions.value.includes(type as ActionType)) {
    return;
  }
  tableStore.addPending(type);
  gameWS.send({ type, data });
};

const mySplit = computed(() => {
  if (!state.value) return undefined;
  const me = state.value.seats?.find((s) => s.userId === userStore.profile?.id);
  return me?.split;
});

const myCardsDisplay = computed(() => {
  if (!state.value) return [];
  if (state.value.myCards && state.value.myCards.length > 0) {
    return state.value.myCards;
  }
  const me = state.value.seats?.find((s) => s.userId === userStore.profile?.id);
  const head = me?.split?.head || [];
  const tail = me?.split?.tail || [];
  return [...head, ...tail];
});

type ResultEntry = {
  userId: number;
  alias: string;
  avatar?: string;
  netPoints: number;
  winType?: string;
  head?: string[];
  tail?: string[];
  key: string;
};

const normalizeResultList = (payload: any): any[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.players)) return payload.players;
  return [];
};

const resultEntries = computed<ResultEntry[]>(() => {
  const st = state.value;
  if (!st || st.phase !== 'ended') return [];
  const rawList = normalizeResultList(st.result);
  if (!rawList.length) return [];
  const seats: SeatDTO[] = st.seats || [];
  return rawList
    .map((item: any) => {
      const meta = item.meta ?? item.Meta ?? {};
      const userId = Number(item.userId ?? item.UserID ?? meta.userId);
      if (!Number.isFinite(userId)) return null;
      const seat = seats.find((s) => s.userId === userId);
      const netPoints = Number(item.netPoints ?? item.NetPoints ?? meta.netPoints ?? 0);
      const winType = (item.winType ?? item.WinType ?? meta.winType) as string | undefined;
      return {
        userId,
        alias: seat?.alias || `玩家${userId}`,
        avatar: seat?.avatar,
        netPoints: Number.isFinite(netPoints) ? netPoints : 0,
        winType,
        head: seat?.split?.head,
        tail: seat?.split?.tail,
        key: `${userId}-${netPoints}-${winType || ''}`
      } as ResultEntry;
    })
    .filter(Boolean) as ResultEntry[];
});

const resultSignature = computed(() => JSON.stringify(resultEntries.value.map((r) => [r.userId, r.netPoints])));
const dismissedResultSig = ref<string | null>(null);
const showResultOverlay = computed(
  () => state.value?.phase === 'ended' && resultEntries.value.length > 0 && dismissedResultSig.value !== resultSignature.value
);

const closeResult = () => {
  dismissedResultSig.value = resultSignature.value;
};

watch(
  () => state.value?.phase,
  (p) => {
    if (p !== 'ended') {
      dismissedResultSig.value = null;
    }
  }
);

const manualReconnect = () => {
  if (tableStore.tableId) {
    gameWS.connect(tableStore.tableId);
  }
};

const leaveTable = () => {
  gameWS.close();
  tableStore.reset();
  matchStore.$reset?.();
  uni.showToast({ title: '已离开对局', icon: 'none' });
  // 回到匹配或大厅页，如果没有上一页则跳转首页
  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack({ delta: 1 });
  } else {
    uni.switchTab({ url: '/pages/index/index' });
  }
};

onLoad((query) => {
  if (query && query.tableId) {
    tableId.value = query.tableId as string;
    if (matchStore.tableId && matchStore.tableId !== tableId.value) {
      uni.showToast({ title: '桌号不匹配，已取消连接', icon: 'none' });
      uni.navigateBack();
      return;
    }
    tableStore.setTable(tableId.value);
    gameWS.connect(tableId.value);
  } else {
    uni.showToast({ title: '缺少桌号参数', icon: 'none' });
    uni.navigateBack();
  }
});

onUnload(() => {
  gameWS.close();
  tableStore.reset();
});
</script>

<style lang="scss" scoped>
.table-page {
  min-height: 100vh;
  padding-bottom: 140rpx;
  background: radial-gradient(circle at top, #212139, #0b0b13);
}

.connection-tip {
  text-align: center;
  padding: 16rpx;
  background: rgba(255, 0, 0, 0.2);
  color: #fff;
}

.loading {
  text-align: center;
  padding: 120rpx 0;
  color: #fff;
}

.phase {
  color: #fff;
  padding: 12rpx 24rpx;
  font-size: 28rpx;
}

.hint {
  color: #ffcf4d;
  padding: 0 24rpx 12rpx;
  font-size: 26rpx;
}

.mango-indicator {
  margin: 0 24rpx 12rpx;
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  background: rgba(255, 207, 77, 0.16);
  color: #ffd166;
  border: 1rpx solid rgba(255, 207, 77, 0.3);
  border-radius: 16rpx;
  padding: 8rpx 14rpx;
  font-size: 24rpx;
}

.pot-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 16rpx 0;

  .pot-label {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.6);
  }

  .pot-amount {
    font-size: 40rpx;
    font-weight: bold;
    color: #ffd700;
  }
}

.last-action {
  padding: 0 24rpx 8rpx;
  color: rgba(255, 255, 255, 0.85);
  font-size: 24rpx;
}

.result-overlay {
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.88);
  padding: 40rpx;
  border-radius: 16rpx;
  text-align: center;
  z-index: 100;
  border: 2rpx solid #ffd700;
  width: 86%;
  box-sizing: border-box;

  .result-title {
    color: #fff;
    font-size: 32rpx;
    margin-bottom: 12rpx;
  }

  .result-meta {
    color: #ffd166;
    font-size: 24rpx;
    margin-bottom: 12rpx;
  }

  .result-list {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
    margin: 12rpx 0 16rpx;
    max-height: 400rpx;
    overflow: auto;
  }

  .result-row {
    display: grid;
    grid-template-columns: 80rpx 1fr 120rpx;
    align-items: center;
    gap: 12rpx;
    background: rgba(255, 255, 255, 0.05);
    padding: 12rpx;
    border-radius: 12rpx;
  }

  .avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
  }

  .result-info {
    text-align: left;
    color: #fff;
    font-size: 24rpx;
  }

  .name-line {
    display: flex;
    align-items: center;
    gap: 8rpx;
    margin-bottom: 6rpx;
  }

  .alias {
    font-weight: 600;
  }

  .win-type {
    font-size: 22rpx;
    color: #ffd166;
    padding: 2rpx 8rpx;
    border: 1rpx solid rgba(255, 209, 102, 0.4);
    border-radius: 10rpx;
  }

  .split-line {
    display: flex;
    align-items: center;
    gap: 6rpx;
    color: rgba(255, 255, 255, 0.8);
  }

  .split-label {
    color: #ffd166;
  }

  .split-cards {
    font-family: 'Courier New', Courier, monospace;
  }

.net {
  font-size: 34rpx;
  font-weight: bold;
  color: #ff4d4d;

    &.win {
      color: #00e676;
    }
  }
}

.leave-wrap {
  position: fixed;
  right: 16rpx;
  bottom: 180rpx;
}

.leave-btn {
  background: rgba(255, 99, 71, 0.9);
  color: #fff;
  border-radius: 16rpx;
  padding: 12rpx 18rpx;
}
</style>
