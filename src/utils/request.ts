/*
 * @Author: Sam Plus
 * @Date: 2021-02-19 18:38:12
 * @LastEditors: Sam Plus
 * @LastEditTime: 2021-04-21 22:17:17
 * @Description: 封装请求方法
 * @FilePath: \gitlab-global-search\src\utils\request.ts
 */
import { extend } from 'umi-request';

export const request = extend({
  credentials: 'include',
  getResponse: true,
});
