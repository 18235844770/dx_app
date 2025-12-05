<template>
  <view class="round-indicator">
    <text>第 {{ roundLabel }} 圈</text>
    <text class="turn" v-if="turnSeat !== undefined">轮到座位 {{ turnSeat }}</text>
  </view>
</template>

<script setup lang="ts">
const props = defineProps<{
  round: number | undefined;
  turnSeat?: number;
}>();

const roundLabel = props.round ?? '-';
</script>

<style lang="scss" scoped>
.round-indicator {
  text-align: center;
  font-size: 32rpx;
  color: #fff;
  margin: 16rpx 0;
}

.turn {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
}
</style>

