/*
 * @Author: Sam Plus
 * @Date: 2021-02-19 18:38:10
 * @LastEditors: Sam Plus
 * @LastEditTime: 2021-04-15 20:39:18
 * @Description: Do not edit
 * @FilePath: \gitlab-global-search\.umirc.ts
 */
import { defineConfig } from 'umi';

export default defineConfig({
  nodeModulesTransform: {
    type: 'none',
  },
  routes: [{ path: '/', component: '@/pages/index', title: 'gitlab 全局搜索' }],
  fastRefresh: {},
  proxy: {
    '/api/v4': {
      target: 'https://gitlab.com/',
      changeOrigin: true,
    },
  },
});
