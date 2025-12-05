<template>
  <view class="bet-panel" v-if="visible">
    <view class="panel">
      <text class="title">加注金额</text>
      <input
        class="input"
        v-model.number="localAmount"
        type="number"
        :min="min"
        :max="max"
      />
      <view class="slider">
        <slider
          :value="localAmount"
          :min="min"
          :max="max"
          :step="step"
          @change="onSliderChange"
        />
      </view>
      <view class="actions">
        <button class="cancel" @click="$emit('cancel')">取消</button>
        <button class="confirm" @click="confirm">确认</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  visible: boolean;
  min: number;
  max: number;
  step?: number;
}>();

const emit = defineEmits<{
  (e: 'confirm', amount: number): void;
  (e: 'cancel'): void;
}>();

const localAmount = ref(props.min);

watch(
  () => props.visible,
  (val) => {
    if (val) {
      localAmount.value = props.min;
    }
  }
);

const onSliderChange = (event: any) => {
  localAmount.value = Number(event.detail.value);
};

const confirm = () => {
  emit('confirm', Math.max(props.min, localAmount.value));
};
</script>

<style lang="scss" scoped>
.bet-panel {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 32rpx;
}

.panel {
  width: 100%;
  background: #1f1f2d;
  border-radius: 24rpx 24rpx 0 0;
  padding: 32rpx;
  color: #fff;
}

.title {
  font-size: 32rpx;
  font-weight: 600;
}

.input {
  width: 100%;
  height: 88rpx;
  margin-top: 24rpx;
  border-radius: 16rpx;
  background: rgba(255, 255, 255, 0.1);
  padding: 0 24rpx;
  color: #fff;
}

.slider {
  margin: 32rpx 0;
}

.actions {
  display: flex;
  gap: 24rpx;
}

.cancel,
.confirm {
  flex: 1;
  height: 88rpx;
  border-radius: 16rpx;
}

.cancel {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.confirm {
  background: linear-gradient(90deg, #ffcb52, #ff7b02);
  color: #0f0f1a;
}
</style>

