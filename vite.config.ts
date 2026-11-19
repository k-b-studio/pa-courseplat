import { realpathSync } from 'node:fs';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { searchForWorkspaceRoot } from 'vite';
import { defineConfig } from 'vitest/config';

// node_modules may be a symlink to a folder outside OneDrive (DECISIONS.md, tooling); the dev server
// must be allowed to serve packages (fonts, Svelte runtime) from wherever it really lives.
const packagesDir = (() => {
	try {
		return realpathSync('node_modules');
	} catch {
		return 'node_modules';
	}
})();

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: { fs: { allow: [searchForWorkspaceRoot(process.cwd()), packagesDir] } },
	test: {
		include: ['tests/unit/**/*.test.ts'],
		environment: 'node'
	}
});
