<template>
  <scroll-view class="log-ticker" scroll-y>
    <view
      v-for="item in feed"
      :key="item.id"
      class="log-item"
      :data-type="item.type"
    >
      <text class="tag" :class="item.type">{{ label(item.type) }}</text>
      <text class="text">{{ item.text }}</text>
    </view>
  </scroll-view>
</template>

<script setup lang="ts">
import type { FeedItem, FeedType } from '@/types/game';

defineProps<{
  feed: FeedItem[];
}>();

const label = (t: FeedType) => {
  switch (t) {
    case 'system': return '系统';
    case 'warning': return '警告';
    case 'result': return '结果';
    case 'action':
    default: return '动作';
  }
};
</script>

<style lang="scss" scoped>
.log-ticker {
  max-height: 200rpx;
  margin: 24rpx;
  padding: 16rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16rpx;
}

.log-item {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 12rpx;
  display: flex;
  align-items: center;
}

.tag {
  display: inline-block;
  padding: 4rpx 8rpx;
  border-radius: 8rpx;
  margin-right: 8rpx;
  font-size: 20rpx;
  color: #0f0f1a;
}

.tag.action { background: #ffcf4d; }
.tag.system { background: #5ed0ff; }
.tag.warning { background: #ff8360; }
.tag.result { background: #7ae68f; }

.text { color: #fff; }
</style>
