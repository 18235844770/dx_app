<template>
  <view class="hall-page">
    <AppHeader />
    <BalanceBar />

    <view class="status-bar">
      <text>今日在线：{{ hallStore.onlineCount }}</text>
      <text>可选牌桌：{{ hallStore.scenes.length }}</text>
    </view>

    <view class="matching-banner" v-if="isMatching">
      <text class="matching-text">匹配进行中，正在为你寻找对手…</text>
      <button
        class="cancel-match-btn"
        @click.stop="onCancelMatch"
        :loading="canceling"
        :disabled="canceling"
      >
        {{ canceling ? '取消中…' : '退出匹配' }}
      </button>
    </view>

    <view class="scene-list">
      <SceneCard
        v-for="scene in hallStore.scenes"
        :key="scene.id"
        :scene="scene"
        :loading="loadingSceneId === scene.id"
        @join="onJoin"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import AppHeader from '@/components/common/AppHeader.vue';
import BalanceBar from '@/components/hall/BalanceBar.vue';
import SceneCard from '@/components/hall/SceneCard.vue';
import { useHallStore } from '@/store/hall';
import { useMatchStore } from '@/store/match';
import { useWalletStore } from '@/store/wallet';
import { useUserStore } from '@/store/user';
import { SceneConfig } from '@/types/hall';
import * as matchApi from '@/services/match.api';

type ApiError = {
  code?: number;
  msg?: string;
};

const hallStore = useHallStore();
const matchStore = useMatchStore();
const walletStore = useWalletStore();
const userStore = useUserStore();
const loadingSceneId = ref<number | null>(null);
const canceling = ref(false);
const isMatching = computed(() => matchStore.status === 'queued');

const resolveMatchError = (error: unknown) => {
  const err = (error ?? {}) as ApiError;
  const code = typeof err.code === 'number' ? err.code : undefined;
  const defaultMsg = err.msg;

  if (!code) {
    return { code: undefined, message: defaultMsg || '进入匹配失败，请稍后重试' };
  }

  const messageMap: Record<number, string> = {
    401: '登录状态已失效，请重新登录',
    404: '场次不存在或已下线',
    409: '你已在匹配队列中',
    429: '排队人数较多，请稍后再试',
    500: '服务异常，请稍后重试'
  };

  if (code === 400) {
    return { code, message: defaultMsg || '买入金额不合法' };
  }

  return {
    code,
    message: messageMap[code] || defaultMsg || '进入匹配失败，请稍后重试'
  };
};

onShow(async () => {
  hallStore.loadState();
  walletStore.loadInfo();
});

const onJoin = async (scene: SceneConfig) => {
  if (loadingSceneId.value) return;
  const userId = userStore.profile?.id;
  if (!userId) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    uni.navigateTo({ url: '/pages/login/index' });
    return;
  }
  loadingSceneId.value = scene.id;
  try {
    const res = await matchApi.joinQueue({
      sceneId: scene.id,
      buyIn: scene.minIn,
      gpsLat: hallStore.gps?.lat,
      gpsLng: hallStore.gps?.lng
    });
    if (res.status === 'queued' && res.queueId) {
      matchStore.start(scene.id, res.queueId);
      uni.navigateTo({ url: '/pages/match/index' });
    } else {
      uni.showToast({ title: '匹配状态异常，请稍后再试', icon: 'none' });
    }
  } catch (e) {
    const { code, message } = resolveMatchError(e);
    uni.showToast({ title: message, icon: 'none' });
    if (code === 401) {
      setTimeout(() => {
        uni.navigateTo({ url: '/pages/login/index' });
      }, 300);
    }
    console.error(e);
  } finally {
    loadingSceneId.value = null;
  }
};

const onCancelMatch = async () => {
  if (canceling.value || !matchStore.sceneId) {
    if (!matchStore.sceneId) matchStore.reset();
    return;
  }
  canceling.value = true;
  try {
    await matchApi.cancel(matchStore.sceneId);
    uni.showToast({ title: '已退出匹配', icon: 'none' });
    matchStore.reset();
  } catch (e) {
    const { code, message } = resolveMatchError(e);
    uni.showToast({ title: message, icon: 'none' });
    if (code === 401) {
      setTimeout(() => {
        uni.navigateTo({ url: '/pages/login/index' });
      }, 300);
    }
  } finally {
    canceling.value = false;
  }
};
</script>

<style lang="scss" scoped>
.hall-page {
  min-height: 100vh;
  background: #0f0f1a;
  color: #fff;
  padding-top: 40rpx;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  padding: 0 32rpx;
  color: rgba(255, 255, 255, 0.7);
}

.matching-banner {
  margin: 24rpx;
  padding: 24rpx 32rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16rpx;
}

.matching-text {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.85);
}

.cancel-match-btn {
  min-width: 180rpx;
  height: 64rpx;
  border-radius: 32rpx;
  font-size: 26rpx;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.scene-list {
  margin-top: 24rpx;
}
</style>

