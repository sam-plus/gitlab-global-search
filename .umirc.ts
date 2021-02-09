import { defineConfig } from 'umi';

export default defineConfig({
  nodeModulesTransform: {
    type: 'none',
  },
  routes: [{ path: '/', component: '@/pages/index' }],
  fastRefresh: {},
  proxy: {
    '/api/v4': {
      target: 'http://gitfe.mucfc.com',
      changeOrigin: true,
    },
  },
});
