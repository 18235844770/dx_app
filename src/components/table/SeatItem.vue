<template>
  <view class="seat-item" :class="[{ me: seat.isMe }, seat.status]">
    <image class="avatar" :src="seat.avatar || defaultAvatar" mode="aspectFill" />
    <view class="alias">{{ seat.alias }}</view>
    <view class="chips">筹 {{ seat.chips }}</view>
    <view class="bet-info" v-if="seat.bet && seat.bet > 0">
      <view class="bet-chip">筹 {{ seat.bet }}</view>
    </view>
    <view class="status" v-if="seat.status === 'folded'">已弃牌</view>
    <view class="status" v-else-if="seat.status === 'waiting'">等待中</view>
  </view>
</template>

<script setup lang="ts">
import { SeatDTO } from '@/types/game';

defineProps<{
  seat: SeatDTO & { isMe?: boolean };
}>();

const defaultAvatar = 'https://dummyimage.com/100x100/1c1c2b/ffffff&text=P';
</script>

<style lang="scss" scoped>
.seat-item {
  width: 160rpx;
  text-align: center;
  color: #fff;
}

.seat-item.me {
  border: 2rpx solid #ffaa00;
  border-radius: 24rpx;
  padding: 8rpx;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  margin: 0 auto 8rpx;
}

.alias {
  font-size: 24rpx;
}

.chips {
  font-size: 24rpx;
  opacity: 0.8;
}

.bet-info {
  margin-top: 8rpx;

  .bet-chip {
    display: inline-block;
    background: #e6b800;
    color: #1a1a1a;
    font-size: 22rpx;
    font-weight: bold;
    padding: 4rpx 12rpx;
    border-radius: 20rpx;
  }
}

.status {
  margin-top: 8rpx;
  font-size: 20rpx;
  color: #ff7b02;
}
</style>
