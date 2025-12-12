<template>
  <view class="action-bar">
    <button
      v-for="action in visibleActions"
      :key="action.type"
      :disabled="!can(action.type)"
      :class="{ highlight: props.highlight === action.type }"
      @click="$emit(action.event)"
    >
      {{ action.label }}
    </button>
  </view>
</template>

<script setup lang="ts">
import { ActionType } from '@/types/game';
import { computed } from 'vue';

const props = defineProps<{
  allowed: ActionType[];
  highlight?: ActionType | null;
  pending?: string[];
}>();

defineEmits(['fold', 'pass', 'call', 'raise', 'knock', 'ready']);

const isPending = (a: ActionType) => (props.pending || []).includes(a);
const can = (a: ActionType) => props.allowed.includes(a) && !isPending(a);

const baseActions = [
  { type: 'fold', label: '弃牌', event: 'fold' },
  { type: 'pass', label: '过牌', event: 'pass' },
  { type: 'call', label: '跟注', event: 'call' },
  { type: 'raise', label: '加注', event: 'raise' },
  { type: 'knock_bobo', label: '敲', event: 'knock' },
  { type: 'ready', label: '准备', event: 'ready' }
] as const;

const visibleActions = computed(() =>
  baseActions.filter((a) => {
    if (a.type === 'knock_bobo') return props.allowed.includes('knock_bobo');
    return true;
  })
);
</script>

<style lang="scss" scoped>
.action-bar {
  display: flex;
  justify-content: space-around;
  padding: 16rpx;
  background: rgba(15, 15, 26, 0.9);
  position: fixed;
  bottom: 0;
  width: 100%;
}

button {
  flex: 1;
  margin: 0 8rpx;
  height: 88rpx;
  border-radius: 16rpx;
  background: #ffaa00;
  color: #0f0f1a;
  font-size: 26rpx;
}

button:disabled {
  opacity: 0.4;
}

.highlight {
  background: linear-gradient(90deg, #ffcf4d, #ff8c37);
  box-shadow: 0 4rpx 16rpx rgba(255, 140, 55, 0.35);
}
</style>
