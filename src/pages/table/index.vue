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
      <RoundIndicator :round="state.round" :turn-seat="state.turnSeat" />
      <Countdown :value="state.countdown || 0" label="操作倒计时" />
      <SeatList :seats="state.seats || []" :my-seat-id="userStore.profile?.id" />
      <CardsHand :cards="state.myCards || []" />
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
import { computed, ref } from 'vue';
import { useTableStore } from '@/store/table';
import { useUserStore } from '@/store/user';
import { useMatchStore } from '@/store/match';
import { gameWS } from '@/services/game.ws';
import type { ActionType, Phase } from '@/types/game';
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
const reconnectExhausted = computed(() => tableStore.reconnectExhausted);
const showBetPanel = ref(false);
const allowedActions = computed<ActionType[]>(() => state.value?.allowedActions || []);
const pendingActions = computed(() => Array.from(tableStore.pendingActions));
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
    return '第二圈可敲波波（拖动/点按敲击按钮）';
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

const sendAction = (type: string, data: any = {}) => {
  if (!allowedActions.value.includes(type as ActionType)) {
    return;
  }
  tableStore.addPending(type);
  gameWS.send({ type, data });
};

const manualReconnect = () => {
  if (tableStore.tableId) {
    gameWS.connect(tableStore.tableId);
  }
};

onLoad((query) => {
  if (query && query.tableId) {
    tableId.value = query.tableId as string;
    if (matchStore.tableId && matchStore.tableId !== tableId.value) {
      uni.showToast({ title: '桌号不匹配', icon: 'none' });
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
</style>
