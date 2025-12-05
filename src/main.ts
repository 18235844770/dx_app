import { createSSRApp } from "vue";
import App from "./App.vue";
import { createPinia } from "pinia";
import { createUnistorage } from "pinia-plugin-unistorage";
import router from "./router";
export function createApp() {
	const app = createSSRApp(App);
	const pinia = createPinia();
	pinia.use(createUnistorage());
	app.use(pinia);
	app.use(router);
	return {
		app,
	};
}
