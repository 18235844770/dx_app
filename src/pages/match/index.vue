<template>
  <view class="match-page">
    <view class="card">
      <text class="title">
        {{ statusText }}
      </text>
      <text class="scene">场次：{{ sceneName }}</text>
      <text class="queue">队列号：{{ matchStore.queueId || '-' }}</text>
      <text class="eta" v-if="matchStore.estimatedTime">
        预计等待 {{ matchStore.estimatedTime }} 秒
      </text>
      <text class="elapsed">已等待 {{ elapsedSeconds }} 秒</text>
    </view>
    <view class="tips">
      <text>请保持网络通畅，离开页面将自动取消匹配。</text>
    </view>
    <button class="cancel-btn" @click="onCancel">取消匹配</button>
  </view>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref } from 'vue';
import { useMatchStore } from '@/store/match';
import { useHallStore } from '@/store/hall';
import * as matchApi from '@/services/match.api';

const matchStore = useMatchStore();
const hallStore = useHallStore();
let pollTimer: number | null = null;
let elapsedTimer: number | null = null;
const elapsedSeconds = ref(0);

const statusText = computed(() => {
  if (matchStore.status === 'matched') return '匹配成功，即将进入牌桌...';
  if (matchStore.status === 'idle') return '暂未在队列，请重新进入';
  return '正在为你寻找对手';
});

const sceneName = computed(() => {
  const scene = hallStore.scenes.find((s) => s.id === matchStore.sceneId);
  return scene?.name || '标准场';
});

onMounted(() => {
  if (!matchStore.queueId || !matchStore.sceneId) {
    uni.switchTab({ url: '/pages/hall/index' });
    return;
  }
  startPolling();
  elapsedTimer = setInterval(() => {
    if (!matchStore.startedAt) return;
    elapsedSeconds.value = Math.floor((Date.now() - matchStore.startedAt) / 1000);
  }, 1000) as unknown as number;
});

onUnmounted(() => {
  clearTimers();
});

const startPolling = () => {
  if (!matchStore.sceneId) {
    uni.showToast({ title: '匹配参数缺失', icon: 'none' });
    uni.navigateBack();
    return;
  }
  pollTimer = setInterval(async () => {
    if (!matchStore.sceneId) return;
    try {
      const st = await matchApi.status(matchStore.sceneId);
      matchStore.updateFromServer(st);
      if (st.status === 'matched' && st.tableId) {
        clearTimers();
        uni.redirectTo({ url: `/pages/table/index?tableId=${st.tableId}` });
      }
      if (st.status === 'idle') {
        uni.showToast({ title: '匹配已取消', icon: 'none' });
        clearTimers();
        matchStore.reset();
        uni.navigateBack();
      }
    } catch (error) {
      console.error(error);
    }
  }, 1500) as unknown as number;
};

const clearTimers = () => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  if (elapsedTimer) {
    clearInterval(elapsedTimer);
    elapsedTimer = null;
  }
};

const onCancel = async () => {
  if (!matchStore.sceneId) {
    matchStore.reset();
    uni.navigateBack();
    return;
  }
  try {
    await matchApi.cancel(matchStore.sceneId);
  } finally {
    matchStore.reset();
    clearTimers();
    uni.navigateBack();
  }
};
</script>

<style lang="scss" scoped>
.match-page {
  min-height: 100vh;
  background: #0f0f1a;
  color: #fff;
  padding: 80rpx 32rpx;
}

.card {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 24rpx;
  padding: 48rpx;
  text-align: center;
}

.title {
  font-size: 36rpx;
  font-weight: 600;
}

.scene {
  display: block;
  margin-top: 16rpx;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

.queue,
.eta,
.elapsed {
  display: block;
  margin-top: 20rpx;
  color: rgba(255, 255, 255, 0.7);
}

.tips {
  margin: 32rpx 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
}

.cancel-btn {
  width: 100%;
  height: 96rpx;
  border-radius: 16rpx;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}
</style>

