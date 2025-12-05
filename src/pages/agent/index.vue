<template>
  <view class="agent-page">
    <view class="card" v-if="agentStore.dashboard">
      <view class="invite">
        <text>邀请码：{{ agentStore.dashboard.inviteCode }}</text>
        <button size="mini" @click="copyCode">复制</button>
      </view>
      <view class="stats">
        <view class="stat">
          <text class="label">累计邀请</text>
          <text class="value">{{ agentStore.dashboard.totalInvited }}</text>
        </view>
        <view class="stat">
          <text class="label">活跃人数</text>
          <text class="value">{{ agentStore.dashboard.activeInvited }}</text>
        </view>
        <view class="stat">
          <text class="label">总收益</text>
          <text class="value">¥{{ agentStore.dashboard.totalProfit }}</text>
        </view>
        <view class="stat">
          <text class="label">今日收益</text>
          <text class="value">¥{{ agentStore.dashboard.todayProfit }}</text>
        </view>
      </view>
    </view>

    <view class="card">
      <view class="card-title">邀请列表</view>
      <scroll-view class="list" scroll-y>
        <view
          v-for="invitee in agentStore.invitees"
          :key="invitee.userId"
          class="list-item"
        >
          <view>
            <text class="source">{{ invitee.nickname || invitee.phone }}</text>
            <text class="date">注册：{{ invitee.registeredAt }}</text>
          </view>
          <text class="amount">{{ invitee.status }}</text>
        </view>
        <view class="load" v-if="agentStore.inviteeHasMore">
          <button
            @click="agentStore.loadMoreInvitees()"
            :disabled="agentStore.inviteeLoading"
          >
            {{ agentStore.inviteeLoading ? '加载中...' : '加载更多' }}
          </button>
        </view>
      </scroll-view>
    </view>

    <view class="card">
      <view class="card-title">分润明细</view>
      <scroll-view class="list" scroll-y>
        <view
          v-for="item in agentStore.profits"
          :key="item.id"
          class="list-item"
        >
          <view>
            <text class="source">来源：{{ item.sourceUser }}</text>
            <text class="date">{{ item.date }}</text>
          </view>
          <text class="amount">+¥{{ item.amount }}</text>
        </view>
        <view class="load" v-if="agentStore.profitHasMore">
          <button
            @click="agentStore.loadMoreProfits()"
            :disabled="agentStore.profitLoading"
          >
            {{ agentStore.profitLoading ? '加载中...' : '加载更多' }}
          </button>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { useAgentStore } from '@/store/agent';

const agentStore = useAgentStore();

onShow(() => {
  agentStore.loadDashboard();
  if (!agentStore.invitees.length) {
    agentStore.loadMoreInvitees();
  }
  if (!agentStore.profits.length) {
    agentStore.loadMoreProfits();
  }
});

const copyCode = () => {
  if (!agentStore.dashboard) return;
  uni.setClipboardData({
    data: agentStore.dashboard.inviteCode,
    success: () => uni.showToast({ title: '已复制', icon: 'none' })
  });
};
</script>

<style lang="scss" scoped>
.agent-page {
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
}

.invite {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
}

.value {
  font-size: 32rpx;
  font-weight: 600;
}

.card-title {
  font-size: 32rpx;
  margin-bottom: 16rpx;
}

.list {
  max-height: 400rpx;
}

.list-item {
  display: flex;
  justify-content: space-between;
  padding: 20rpx 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.source {
  display: block;
  font-size: 28rpx;
}

.date {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
}

.amount {
  font-size: 30rpx;
  color: #31d0aa;
}

.load {
  text-align: center;
  margin-top: 16rpx;
}
</style>

