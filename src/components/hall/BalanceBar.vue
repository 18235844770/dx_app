<template>
  <view class="balance-bar">
    <view class="label">
      <text class="title">账户余额</text>
      <text class="value">{{ balanceText }}</text>
    </view>
    <view class="actions">
      <button class="refresh" @click="refresh" :loading="loading" :disabled="loading">
        刷新
      </button>
      <button class="recharge" @click="recharge">充值</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useWalletStore } from '@/store/wallet';

const walletStore = useWalletStore();
const loading = ref(false);

const balanceText = computed(() => {
  const balance = walletStore.info?.balanceAvailable ?? 0;
  return `¥ ${balance.toFixed(2)}`;
});

const refresh = async () => {
  loading.value = true;
  try {
    await walletStore.loadInfo();
  } finally {
    loading.value = false;
  }
};

const recharge = () => {
  uni.navigateTo({ url: '/pages/profile/index' });
};
</script>

<style lang="scss" scoped>
.balance-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 32rpx;
  margin: 24rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.title {
  font-size: 26rpx;
  opacity: 0.7;
}

.value {
  font-size: 40rpx;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 16rpx;
}

.refresh,
.recharge {
  width: 140rpx;
  height: 64rpx;
  border-radius: 32rpx;
  font-size: 24rpx;
  color: #0f0f1a;
}

.refresh {
  background: #ffcb52;
}

.recharge {
  background: #ffaa00;
}
</style>

