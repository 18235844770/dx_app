<template>
  <view class="cards-hand">
    <view
      v-for="(card, index) in displayCards"
      :key="index"
      class="card"
      :class="{ hidden: card === '**' }"
    >
      {{ card === '**' ? '背面' : card }}
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  cards: string[];
}>();

const displayCards = computed(() => props.cards || []);
</script>

<style lang="scss" scoped>
.cards-hand {
  display: flex;
  justify-content: center;
  gap: 24rpx;
  margin: 32rpx 0;
}

.card {
  width: 120rpx;
  height: 180rpx;
  border-radius: 12rpx;
  background: #fff;
  color: #0f0f1a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.card.hidden {
  background: #2f2f48;
  color: rgba(255, 255, 255, 0.7);
}
</style>

