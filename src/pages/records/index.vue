<template>
  <view class="records-page">
    <view
      v-for="record in replayStore.records"
      :key="record.id"
      class="record-row"
    >
      <view class="left">
        <text class="scene">{{ record.sceneName || '标准场' }}</text>
        <text class="time">{{ record.startTime }}</text>
      </view>
      <view class="right" :class="{ win: record.profit >= 0 }">
        ¥{{ record.profit }}
      </view>
    </view>
    <button class="load-more" @click="loadMore" :disabled="replayStore.loading || !canLoadMore">
      {{ replayStore.loading ? '加载中...' : canLoadMore ? '加载更多' : '没有更多了' }}
    </button>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { computed } from 'vue';
import { useReplayStore } from '@/store/replay';

const replayStore = useReplayStore();

const canLoadMore = computed(
  () => replayStore.records.length < replayStore.total
);

onShow(() => {
  if (!replayStore.records.length) {
    replayStore.fetchList(true);
  }
});

const loadMore = () => {
  if (!canLoadMore.value) return;
  replayStore.fetchList();
};
</script>

<style lang="scss" scoped>
.records-page {
  min-height: 100vh;
  padding: 24rpx;
  background: #0f0f1a;
  color: #fff;
}

.record-row {
  display: flex;
  justify-content: space-between;
  padding: 24rpx 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.scene {
  font-size: 28rpx;
}

.time {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
}

.right {
  font-size: 32rpx;
}

.right.win {
  color: #31d0aa;
}

.load-more {
  margin-top: 24rpx;
  width: 100%;
  height: 88rpx;
  border-radius: 16rpx;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}
</style>

