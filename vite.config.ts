import { defineConfig, loadEnv } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
import { fileURLToPath, URL } from "node:url";
import uniRouter from "unplugin-uni-router/vite";
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");
	const proxyTarget = "http://localhost:9081";
	console.log(proxyTarget, 'proxyTarget')
	return {
		base: "./",
		plugins: [uni(), uniRouter()],
		resolve: {
			alias: {
				"@": fileURLToPath(new URL("./src", import.meta.url)),
				"#": fileURLToPath(new URL("./types", import.meta.url)),
			},
		},
		server: {
			proxy: {
				"/API": {
					target: proxyTarget,
					changeOrigin: true,
					rewrite: (path) => path.replace(/^\/API/, ""),
				},
			},
		},
	};
});
