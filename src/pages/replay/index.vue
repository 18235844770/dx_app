<template>
  <view class="replay-page">
    <scroll-view class="record-list" scroll-y>
      <view
        v-for="record in replayStore.records"
        :key="record.id"
        class="record-card"
        @click="viewDetail(record)"
      >
        <view class="title">{{ record.sceneName || '标准场' }}</view>
        <view class="meta">桌号：{{ record.tableId }}</view>
        <view class="meta">时间：{{ record.startTime }}</view>
        <view class="meta">净输赢：¥{{ record.profit }}</view>
      </view>
      <view class="load-more" v-if="canLoadMore">
        <button @click="loadMore" :disabled="replayStore.loading">
          {{ replayStore.loading ? '加载中...' : '加载更多' }}
        </button>
      </view>
    </scroll-view>

    <view class="detail-panel" v-if="replayStore.detail">
      <view class="detail-header">
        <text>时间线</text>
        <button class="close" @click="replayStore.resetDetail()">关闭</button>
      </view>
      <scroll-view class="timeline" scroll-y>
        <view
          v-for="(event, index) in replayStore.detail?.timeline"
          :key="index"
          class="timeline-item"
        >
          <text class="round">第 {{ event.round }} 圈</text>
          <text class="desc">
            座位 {{ event.seat }} {{ event.action }}
            <text v-if="event.amount">¥{{ event.amount }}</text>
          </text>
          <text class="desc">{{ event.description }}</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed} from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useReplayStore } from '@/store/replay';
import { ReplayRecord } from '@/types/replay';

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
  replayStore.fetchList();
};

const viewDetail = async (record: ReplayRecord) => {
  await replayStore.fetchDetail(record.id);
};
</script>

<style lang="scss" scoped>
.replay-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #0f0f1a;
  color: #fff;
}

.record-list {
  flex: 1;
  padding: 24rpx;
}

.record-card {
  padding: 24rpx;
  border-radius: 16rpx;
  background: rgba(255, 255, 255, 0.06);
  margin-bottom: 16rpx;
}

.title {
  font-size: 32rpx;
  font-weight: 600;
}

.meta {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
}

.detail-panel {
  background: #1a1a2a;
  padding: 24rpx;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.close {
  background: transparent;
  color: #ffaa00;
}

.timeline {
  max-height: 300rpx;
}

.timeline-item {
  padding: 12rpx 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.round {
  font-size: 28rpx;
  font-weight: 600;
}

.desc {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
}
</style>

