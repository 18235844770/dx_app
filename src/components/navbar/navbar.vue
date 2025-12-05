<template>
	<view class="navbar-placeholder" v-if="placeholder"></view>
	<view class="navbar" :class="{ light: theme === 'light' }" :style="{ background: background }">
		<slot name="custom">
			<view class="navbar-box">
				<view class="navbar-left">
					<!-- light主题替换为白色 -->
					<image :src="theme === 'light' ? backLightIcon : backIcon" class="back-icon" @click="back"></image>
				</view>
				<slot name="center">
					<view class="navbar-center" v-if="title" :style="{ color: theme === 'light' ? '#fff' : '#333' }">{{ title }}</view>
				</slot>
			</view>
		</slot>
	</view>
	
</template>
<script setup>
import { ref } from "vue";
import backLightIcon from "@/static/images/icon/back_light.png";
import backIcon from "@/static/images/icon/back.png";
const props = defineProps({
	title: {
		type: String,
		default: "",
	},
	// 主题
	theme: {
		type: String,
		default: "dark",
	},
	// 是否显示占位
	placeholder: {
		type: Boolean,
		default: false,
	},
	// 背景色
	background: {
		type: String,
		default: "#fff",
	},
	// 是否直接返回
	directBack: {
		type: Boolean,
		default: true,
	},
});
const statusBarHeight = ref(0);
const navbarHeight = ref(0);
const systemInfo = uni.getSystemInfoSync();
statusBarHeight.value = systemInfo.statusBarHeight;
navbarHeight.value = 44 + statusBarHeight.value;
const emit = defineEmits(["back"]);
const back = () => {
	if (props.directBack) {
		uni.navigateBack({ delta: 1 });
	} else {
		emit("back");
	}
};
const home = () => {
	uni.switchTab({
		url: "/pages/tabbar/home/index",
	});
};
</script>
<style lang="scss" scoped>
.navbar-placeholder {
	height: v-bind("`${navbarHeight}px`");
}
.navbar {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	z-index: 100;
	padding-top: v-bind("`${statusBarHeight}px`");
	&-box {
		position: relative;
		display: flex;
		align-items: center;
		height: 44px;
		padding: 0 16rpx;
	}
	&-left {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: space-between;
		.back-icon {
			width: 48rpx;
			height: 48rpx;
		}
	}
	&-center {
		position: absolute;
		max-width: 30%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		left: 50%;
		transform: translateX(-50%);
		font-size: 36rpx;
	}
}
</style>
