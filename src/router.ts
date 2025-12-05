import routes from "uni-router-routes"; //由unplugin-uni-router/vite根据pages.json生成
import { createRouter } from "uniapp-router-next";

const router = createRouter({
	routes: [
		...routes,
		// 通配符，一般用于匹配不到路径跳转404页面
		{
			path: "*",
			redirect: () => {
				// 可返回{ name: '404' }，{ path: '/pages/404/404' }， '/pages/404/404'
				return { name: "404" };
			},
		},
	],
	//@ts-ignore
	platform: process.env.UNI_PLATFORM,
	h5: {},
});

// 可以查看打印信息，感觉就跟写 vue 普通项目无差
router.beforeEach((_to, _form, next) => {
	//   console.log(to, form, "beforeEach");
	next(); // 这个一定要写，不要就跳转不了了哈
});
export default router;
