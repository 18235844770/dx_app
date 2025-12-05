<template>
  <view class="countdown">
    <view class="circle">
      <text>{{ seconds }}</text>
    </view>
    <text class="label">{{ label }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  value: number;
  label?: string;
}>();

const seconds = computed(() => Math.max(0, props.value));
const label = computed(() => props.label || '倒计时');
</script>

<style lang="scss" scoped>
.countdown {
  text-align: center;
  color: #fff;
}

.circle {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  border: 6rpx solid #ffaa00;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  margin: 0 auto 12rpx;
}

.label {
  font-size: 24rpx;
  opacity: 0.7;
}
</style>

