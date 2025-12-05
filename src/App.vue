<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { useUserStore } from '@/store/user';

const userStore = useUserStore();

onLaunch(() => {
  if (userStore.token) {
    userStore.loadProfile().catch(() => {
      userStore.logout();
    });
  } else {
    uni.reLaunch({ url: '/pages/login/index' });
  }
});
onShow(() => {
  console.log("App Show");
});
onHide(() => {
  console.log("App Hide");
});
</script>
<style lang="scss">
@import "uni.scss";
/* Global styles */
</style>
