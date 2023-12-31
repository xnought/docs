import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/kit/vite";
// vercel?

/**
 * @type {import('@sveltejs/kit').Config}
 */
const config = {
	extensions: [".svelte", ".md"],
	preprocess: [vitePreprocess()],
	kit: {
		adapter: adapter({
			pages: "dist",
			out: "dist",
		}),
	},
};

export default config;
