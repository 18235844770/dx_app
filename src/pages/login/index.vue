<template>
  <view class="login-page">
    <view class="logo">打旋牌</view>
    <view class="intro">短信验证登录 / 新用户自动注册</view>

    <view class="form">
      <view class="form-item">
        <input
          v-model="phone"
          type="number"
          maxlength="11"
          class="input"
          placeholder="请输入手机号"
        />
      </view>

      <view class="form-item code-row">
        <input
          v-model="code"
          type="number"
          maxlength="6"
          class="input"
          placeholder="验证码"
        />
        <button
          class="code-btn"
          :disabled="countdown > 0 || !isPhoneValid"
          @click="sendCode"
        >
          {{ countdown > 0 ? `${countdown}s` : "获取验证码" }}
        </button>
      </view>

      <view class="form-item">
        <input
          v-model="inviteCode"
          type="text"
          maxlength="10"
          class="input"
          placeholder="邀请码（可选）"
        />
      </view>

      <button class="submit-btn" :disabled="!canSubmit" @click="handleLogin">
        {{ loading ? "登录中..." : "进入大厅" }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { useUserStore } from '@/store/user';
import { sendLoginCode } from '@/services/user.api';

const userStore = useUserStore();

const phone = ref('');
const code = ref('');
const countdown = ref(0);
const inviteCode = ref('');
const loading = ref(false);
let timer: number | null = null;

const isPhoneValid = computed(() => /^1\d{10}$/.test(phone.value));
const canSubmit = computed(
  () => isPhoneValid.value && code.value.length >= 4 && !loading.value
);

const sendCode = async () => {
  if (countdown.value > 0) return;
  if (!isPhoneValid.value) {
    uni.showToast({ title: '请输入正确手机号', icon: 'none' });
    return;
  }
  try {
    await sendLoginCode(phone.value);
    countdown.value = 60;
    timer = setInterval(() => {
      countdown.value -= 1;
      if (countdown.value <= 0 && timer) {
        clearInterval(timer);
        timer = null;
      }
    }, 1000) as unknown as number;
  } catch (error) {
    console.error(error);
  }
};

const handleLogin = async () => {
  if (!canSubmit.value) return;
  loading.value = true;
  try {
    await userStore.login(
      phone.value,
      code.value,
      inviteCode.value.trim() || undefined
    );
    uni.switchTab({ url: '/pages/hall/index' });
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  padding: 120rpx 48rpx 48rpx;
  background: #0f0f1a;
  color: #fff;
}

.logo {
  font-size: 64rpx;
  font-weight: 600;
  text-align: center;
  margin-bottom: 20rpx;
}

.intro {
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 80rpx;
}

.form {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 24rpx;
  padding: 40rpx 32rpx;
}

.form-item {
  margin-bottom: 32rpx;
}

.input {
  width: 100%;
  height: 96rpx;
  border-radius: 16rpx;
  padding: 0 32rpx;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.code-row {
  display: flex;
  align-items: center;

  .code-btn {
    margin-left: 16rpx;
    width: 220rpx;
    height: 96rpx;
    border-radius: 16rpx;
    background: #ffaa00;
    color: #0f0f1a;
  }

  .code-btn:disabled {
    background: rgba(255, 255, 255, 0.2);
    color: rgba(15, 15, 26, 0.4);
  }
}

.submit-btn {
  width: 100%;
  height: 96rpx;
  border-radius: 16rpx;
  background: linear-gradient(90deg, #ffcb52 0%, #ff7b02 100%);
  color: #0f0f1a;
  font-size: 32rpx;
}

.submit-btn:disabled {
  opacity: 0.6;
}
</style>

