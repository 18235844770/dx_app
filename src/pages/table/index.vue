<template>
  <view class="table-page">
    <view class="connection-tip" v-if="!connected">网络重连中...</view>
    <view v-if="!state" class="loading">正在同步牌桌...</view>
    <view v-else>
      <RoundIndicator :round="state.round" :turn-seat="state.turnSeat" />
      <Countdown :value="state.countdown || 0" label="操作倒计时" />
      <SeatList :seats="state.seats || []" :my-seat-id="userStore.profile?.id" />
      <CardsHand :cards="state.myCards || []" />
      <LogTicker :logs="state.logs || []" />
    </view>

    <ActionBar
      :allowed="state?.allowedActions || []"
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
import { gameWS } from '@/services/game.ws';
import ActionBar from '@/components/table/ActionBar.vue';
import SeatList from '@/components/table/SeatList.vue';
import CardsHand from '@/components/table/CardsHand.vue';
import BetPanel from '@/components/table/BetPanel.vue';
import RoundIndicator from '@/components/table/RoundIndicator.vue';
import LogTicker from '@/components/table/LogTicker.vue';
import Countdown from '@/components/common/Countdown.vue';

const tableStore = useTableStore();
const userStore = useUserStore();
const tableId = ref('');
const connected = computed(() => tableStore.wsConnected);
const state = computed(() => tableStore.state);
const showBetPanel = ref(false);

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
  gameWS.send({ type, data });
};

onLoad((query) => {
  if (query && query.tableId) {
    tableId.value = query.tableId as string;
    tableStore.tableId = tableId.value;
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
</style>

