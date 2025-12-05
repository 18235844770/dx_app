<template>
  <view class="scene-card" @click="$emit('join', scene)" :class="{ disabled }">
    <view class="header">
      <text class="name">{{ scene.name }}</text>
      <text class="base">底注 ¥{{ scene.basePi }}</text>
    </view>
    <view class="body">
      <view class="stat">
        <text class="label">最低买入</text>
        <text class="value">¥{{ scene.minIn }}</text>
      </view>
      <view class="stat">
        <text class="label">席位数</text>
        <text class="value">{{ scene.seatCount }}</text>
      </view>
    </view>
    <button class="join-btn" :disabled="disabled">
      {{ disabled ? '匹配中...' : '立即进入' }}
    </button>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { SceneConfig } from '@/types/hall';

const props = defineProps<{
  scene: SceneConfig;
  loading?: boolean;
}>();

defineEmits(['join']);

const disabled = computed(() => !!props.loading);
</script>

<style lang="scss" scoped>
.scene-card {
  margin: 24rpx;
  padding: 32rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.scene-card.disabled {
  opacity: 0.5;
}

.header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.name {
  font-size: 36rpx;
  font-weight: 600;
}

.base {
  font-size: 26rpx;
  opacity: 0.8;
}

.body {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.stat .label {
  display: block;
  font-size: 24rpx;
  opacity: 0.7;
}

.stat .value {
  font-size: 32rpx;
  font-weight: 600;
}

.join-btn {
  width: 100%;
  height: 88rpx;
  border-radius: 20rpx;
  background: linear-gradient(90deg, #ffcb52 0%, #ff7b02 100%);
  color: #0f0f1a;
  font-size: 30rpx;
}

.join-btn:disabled {
  opacity: 0.6;
}
</style>

