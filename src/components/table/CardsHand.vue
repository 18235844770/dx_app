<template>
  <view class="cards-hand" v-if="!useSplit">
    <SvgCard
      v-for="(card, index) in displayCards"
      :key="index"
      :card="card"
      class="hand-card"
    />
  </view>
  <view class="split-hand" v-else>
    <view class="split-row">
      <text class="split-label">头</text>
      <view class="cards-line">
        <SvgCard
          v-for="(card, index) in splitHead"
          :key="'h-' + index"
          :card="card"
          class="hand-card small"
        />
      </view>
    </view>
    <view class="split-row">
      <text class="split-label">尾</text>
      <view class="cards-line">
        <SvgCard
          v-for="(card, index) in splitTail"
          :key="'t-' + index"
          :card="card"
          class="hand-card small"
        />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import SvgCard from './SvgCard.vue';

const props = defineProps<{
  cards: string[];
  split?: { head?: string[]; tail?: string[] };
  showSplit?: boolean;
}>();

const displayCards = computed(() => props.cards || []);
const splitHead = computed(() => props.split?.head || []);
const splitTail = computed(() => props.split?.tail || []);
const useSplit = computed(
  () => props.showSplit && (splitHead.value.length > 0 || splitTail.value.length > 0)
);
</script>

<style lang="scss" scoped>
.cards-hand {
  display: flex;
  justify-content: center;
  gap: 16rpx;
  margin: 32rpx 0;
  min-height: 180rpx;
  align-items: center;
}

.hand-card {
  transform-origin: center bottom;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-20rpx) scale(1.1);
    z-index: 10;
  }
}

.split-hand {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin: 24rpx 0;

  .split-row {
    display: flex;
    align-items: center;
    gap: 12rpx;
  }

  .split-label {
    color: #ffcf4d;
    font-size: 26rpx;
    width: 56rpx;
    text-align: right;
  }

  .cards-line {
    display: flex;
    gap: 8rpx;
  }

  .hand-card.small {
    transform: scale(0.9);
    transform-origin: center;
  }
}
</style>
