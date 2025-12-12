<template>
  <view class="seat-list">
    <SeatItem
      v-for="seat in decoratedSeats"
      :key="seat.seatIndex"
      :seat="seat"
    />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import SeatItem from './SeatItem.vue';
import { SeatDTO } from '@/types/game';

const props = defineProps<{
  seats: SeatDTO[];
  mySeatId?: number | string;
}>();

const decoratedSeats = computed(() =>
  props.seats.map((seat) => ({
    ...seat,
    isMe: seat.userId === props.mySeatId
  }))
);
</script>

<style lang="scss" scoped>
.seat-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  padding: 32rpx;
  row-gap: 32rpx;
}
</style>
