<template>
  <view class="profile-page">
    <view class="card">
      <image
        class="avatar"
        :src="userStore.profile?.avatar || defaultAvatar"
        mode="aspectFill"
      />
      <view class="info">
        <text class="name">{{ userStore.profile?.nickname || '匿名玩家' }}</text>
        <text class="phone">{{ userStore.profile?.phone || '--' }}</text>
      </view>
    </view>

    <view class="card balance-card">
      <text class="label">账户余额</text>
      <text class="value">¥{{ walletStore.info?.balanceAvailable ?? 0 }}</text>
      <button class="btn" @click="walletStore.loadInfo()">刷新</button>
    </view>

    <view class="card actions">
      <button class="btn" @click="goAgent">代理中心</button>
      <button class="btn danger" @click="onLogout">退出登录</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/user';
import { useWalletStore } from '@/store/wallet';

const userStore = useUserStore();
const walletStore = useWalletStore();
const defaultAvatar = 'https://dummyimage.com/200x200/2a2a44/ffffff&text=U';

onShow(() => {
  if (userStore.token && !userStore.profile) {
    userStore.loadProfile();
  }
  walletStore.loadInfo();
});

const goAgent = () => {
  uni.navigateTo({ url: '/pages/agent/index' });
};

const onLogout = () => {
  uni.showModal({
    title: '确定退出当前账号？',
    success: ({ confirm }) => {
      if (confirm) userStore.logout();
    }
  });
};
</script>

<style lang="scss" scoped>
.profile-page {
  min-height: 100vh;
  background: #0f0f1a;
  color: #fff;
  padding: 24rpx;
}

.card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  display: flex;
  align-items: center;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  margin-right: 24rpx;
}

.info {
  flex: 1;
}

.name {
  font-size: 32rpx;
  font-weight: 600;
}

.phone {
  display: block;
  color: rgba(255, 255, 255, 0.7);
}

.balance-card {
  flex-direction: column;
  align-items: flex-start;
  gap: 16rpx;
}

.label {
  font-size: 26rpx;
  opacity: 0.8;
}

.value {
  font-size: 48rpx;
  font-weight: 600;
}

.btn {
  margin-top: 16rpx;
  width: 100%;
  height: 88rpx;
  border-radius: 16rpx;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.btn.danger {
  background: rgba(255, 77, 79, 0.2);
  color: #ff4d4f;
}

.actions {
  flex-direction: column;
  align-items: stretch;
}
</style>

