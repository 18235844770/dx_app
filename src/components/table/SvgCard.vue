<template>
  <view class="svg-card" :class="[cardSuit, displayRank, { hidden: !visible }]">
    <view v-if="visible" class="card-face">
      <!-- Top Left Corner -->
      <view class="corner top-left">
        <text class="rank">{{ displayRank }}</text>
        <view class="suit-icon-wrapper">
          <svg
            class="suit-icon"
            viewBox="0 0 24 24"
            width="100%"
            height="100%"
            v-if="currentSuitPath"
          >
            <path :d="currentSuitPath" fill="currentColor" />
          </svg>
          <text v-else class="suit-text">{{ suitSymbol }}</text>
        </view>
      </view>

      <!-- Center Content -->
      <view class="center-suit" v-if="!isChexuan">
        <svg
          class="suit-large-icon"
          viewBox="0 0 24 24"
          width="100%"
          height="100%"
          v-if="currentSuitPath"
        >
          <path :d="currentSuitPath" fill="currentColor" />
        </svg>
        <text v-else class="suit-large">{{ suitSymbol }}</text>
      </view>
      <view class="center-label" v-else>
        <text class="chexuan-label">{{ cardLabel }}</text>
      </view>

      <!-- Bottom Right Corner -->
      <view class="corner bottom-right">
        <text class="rank">{{ displayRank }}</text>
        <view class="suit-icon-wrapper">
          <svg
            class="suit-icon"
            viewBox="0 0 24 24"
            width="100%"
            height="100%"
            v-if="currentSuitPath"
          >
            <path :d="currentSuitPath" fill="currentColor" />
          </svg>
          <text v-else class="suit-text">{{ suitSymbol }}</text>
        </view>
      </view>
    </view>
    
    <!-- Card Back -->
    <view v-else class="card-back">
      <view class="pattern"></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  card: string; // e.g. "As", "Td", "2c" or "**"
}>();

// Refined paths for 24x24 viewBox
const FINAL_PATHS: Record<string, string> = {
  s: "M12,20C10.5,18.5 7,14 7,9C7,6.2 9.2,4 12,4C14.8,4 17,6.2 17,9C17,14 13.5,18.5 12,20M11,20H13V22H11V20Z", // Spade with stem
  h: "M12,21.35L10.55,20.03C5.4,15.36 2,12.28 2,8.5C2,5.42 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.09C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.42 22,8.5C22,12.28 18.6,15.36 13.45,20.04L12,21.35Z", // Heart
  d: "M12,2L22,12L12,22L2,12Z", // Diamond
  c: "M19,10C19,8.3 17.7,7 16,7C15.7,7 15.5,7 15.2,7.1C14.8,4.8 12.6,3 10,3C7.4,3 5.2,4.8 4.8,7.1C4.5,7 4.3,7 4,7C2.3,7 1,8.3 1,10C1,11.5 2.1,12.7 3.5,12.9C3.1,13.5 3,14.2 3,15C3,17.2 4.8,19 7,19H9V21H11V19H13V21H15V19H17C19.2,19 21,17.2 21,15C21,14.2 20.9,13.5 20.5,12.9C21.9,12.7 23,11.5 23,10M16,9C16.6,9 17,9.4 17,10C17,10.6 16.6,11 16,11C15.4,11 15,10.6 15,10C15,9.4 15.4,9 16,9M10,5C11.1,5 12,5.9 12,7C12,8.1 11.1,9 10,9C8.9,9 8,8.1 8,7C8,5.9 8.9,5 10,5M4,10C4,9.4 4.4,9 5,9C5.6,9 6,9.4 6,10C6,10.6 5.6,11 5,11C4.4,11 4,10.6 4,10M17,17H7C5.9,17 5,16.1 5,15C5,13.9 5.9,13 7,13H17C18.1,13 19,13.9 19,15C19,16.1 18.1,17 17,17Z" // Club
};

const visible = computed(() => props.card && props.card !== "**");
const parsed = computed(() => {
  if (!visible.value)
    return { rank: "", suit: "", isChexuan: false, label: "", cxSuit: "" };
  const code = (props.card || "").toUpperCase();
  const suit = code.slice(-1);
  const standardSuits = ["S", "H", "D", "C"];
  if (standardSuits.includes(suit) && code.length >= 2) {
    return {
      rank: code.slice(0, code.length - 1),
      suit: suit.toLowerCase(),
      isChexuan: false,
      label: code.slice(0, code.length - 1),
      cxSuit: "",
    };
  }
  // Chexuan logic
  let cxSuit = "special";
  let label = code;
  if (code.startsWith("R")) {
    cxSuit = "chexuan-red";
    label = code.slice(1);
  } else if (code.startsWith("B")) {
    cxSuit = code === "BK" ? "chexuan-special" : "chexuan-black";
    label = code.slice(1);
  }
  if (!label) {
    label = code;
  }
  return { rank: label, suit: "", isChexuan: true, label, cxSuit };
});

const cardSuit = computed(() => parsed.value.suit || parsed.value.cxSuit);
const isChexuan = computed(() => parsed.value.isChexuan);
const cardLabel = computed(() => parsed.value.label);
const rank = computed(() => parsed.value.rank);

const displayRank = computed(() => {
  const r = rank.value;
  if (r === "T") return "10";
  return r;
});

const currentSuitPath = computed(() => {
    if (isChexuan.value) return "";
    return FINAL_PATHS[cardSuit.value] || "";
});

const suitSymbol = computed(() => {
  if (isChexuan.value) {
    if (parsed.value.cxSuit === "chexuan-red") return "红";
    if (parsed.value.cxSuit === "chexuan-black") return "黑";
    return "王";
  }
  // Fallback for text if SVG fails
  switch (cardSuit.value) {
    case "s": return "♠";
    case "h": return "♥";
    case "d": return "♦";
    case "c": return "♣";
    default: return "";
  }
});
</script>

<style lang="scss" scoped>
.svg-card {
  width: 120rpx;
  height: 168rpx;
  background: #fff;
  border-radius: 12rpx;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);

  &.h,
  &.d,
  &.red {
    color: #e74c3c;
  }
  &.s,
  &.c,
  &.black {
    color: #2c3e50;
  }
  &.special {
    color: #8e44ad;
  }
  &.chexuan-red {
    color: #e74c3c;
  }
  &.chexuan-black {
    color: #1f2937;
  }
  &.chexuan-special {
    color: #8e44ad;
  }
}

.card-face {
  width: 100%;
  height: 100%;
  position: relative;
  padding: 8rpx;
  box-sizing: border-box;
}

.corner {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;

  &.top-left {
    top: 8rpx;
    left: 8rpx;
  }

  &.bottom-right {
    bottom: 8rpx;
    right: 8rpx;
    transform: rotate(180deg);
  }

  .rank {
    font-size: 28rpx;
    font-weight: bold;
    font-family: "Courier New", Courier, monospace;
    margin-bottom: 2rpx;
  }

  .suit-icon-wrapper {
    width: 24rpx;
    height: 24rpx;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .suit-icon {
    width: 24rpx;
    height: 24rpx;
  }
  
  .suit-text {
    font-size: 24rpx;
  }
}

.center-suit {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 64rpx;
  height: 64rpx;
  display: flex;
  justify-content: center;
  align-items: center;

  .suit-large-icon {
    width: 64rpx;
    height: 64rpx;
    opacity: 0.2; /* Watermark style */
  }

  .suit-large {
    font-size: 64rpx;
    opacity: 0.2;
  }
}

.center-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  .chexuan-label {
    font-size: 38rpx;
    font-weight: bold;
    color: #1f2937;
  }
}

.card-back {
  width: 100%;
  height: 100%;
  background: #2c3e50;
  display: flex;
  align-items: center;
  justify-content: center;

  .pattern {
    width: 90%;
    height: 90%;
    border: 2rpx dashed rgba(255, 255, 255, 0.3);
    border-radius: 8rpx;
    background-image: repeating-linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.1) 0,
      rgba(255, 255, 255, 0.1) 10rpx,
      transparent 10rpx,
      transparent 20rpx
    );
  }
}
</style>
