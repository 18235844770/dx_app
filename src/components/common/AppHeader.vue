<template>
  <view class="app-header">
    <view class="profile" @click="goProfile">
      <image
        class="avatar"
        :src="userStore.profile?.avatar || defaultAvatar"
        mode="aspectFill"
      />
      <view class="info">
        <text class="nickname">{{ userStore.profile?.nickname || '匿名玩家' }}</text>
        <text class="uid">ID: {{ userStore.profile?.id || '-' }}</text>
      </view>
    </view>
    <button class="logout" @click="onLogout">退出</button>
  </view>
</template>

<script setup lang="ts">
import { useUserStore } from '@/store/user';

const userStore = useUserStore();
const defaultAvatar = 'https://dummyimage.com/200x200/2a2a44/ffffff&text=A';

const goProfile = () => {
  uni.switchTab({ url: '/pages/profile/index' });
};

const onLogout = () => {
  uni.showModal({
    title: '确定退出登录?',
    success: ({ confirm }) => {
      if (confirm) {
        userStore.logout();
      }
    }
  });
};
</script>

<style lang="scss" scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 32rpx;
}

.profile {
  display: flex;
  align-items: center;
}

.avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  margin-right: 24rpx;
}

.info {
  display: flex;
  flex-direction: column;
  color: #fff;
}

.nickname {
  font-size: 32rpx;
  font-weight: 600;
}

.uid {
  font-size: 24rpx;
  opacity: 0.7;
}

.logout {
  width: 140rpx;
  height: 64rpx;
  line-height: 64rpx;
  border-radius: 32rpx;
  font-size: 26rpx;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}
</style>

