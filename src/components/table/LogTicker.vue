<template>
  <scroll-view class="log-ticker" scroll-y>
    <view
      v-for="log in logs"
      :key="log.id"
      class="log-item"
    >
      {{ log.content }}
    </view>
  </scroll-view>
</template>

<script setup lang="ts">
import { LogItem } from '@/types/game';

defineProps<{
  logs: LogItem[];
}>();
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
}
</style>

