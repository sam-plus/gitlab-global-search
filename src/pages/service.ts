/*
 * @Author: Sam Plus
 * @Date: 2021-02-19 18:38:12
 * @LastEditors: Sam Plus
 * @LastEditTime: 2021-04-21 22:22:54
 * @Description: 封装请求的接口
 * @FilePath: \gitlab-global-search\src\pages\service.ts
 */
import { request } from '@/utils/request';

type params = {
  groupId?: number;
  projectId?: number;
  keyword?: string;
  token: string;
};

/**
 * 获取gitlab组
 * @param {params} params
 * @param {number} nextPage 查询结果的第几页
 * @param {string} params.token gitlab accessToken
 */
export async function getGitlabGroup({
  params,
  nextPage,
}: {
  params: params;
  nextPage: number;
}) {
  return request(`/api/v4/groups?per_page=100&page=${nextPage}`, {
    method: 'GET',
    headers: {
      'PRIVATE-TOKEN': params.token,
    },
  });
}

/**
 * 获取gitlab组下的项目
 * @param {params} params
 * @param {number} nextPage 查询结果的第几页
 * @param {string} params.groupId gitlab 组 id
 * @param {string} params.token gitlab accessToken
 */
export async function getGitlabProject({
  params,
  nextPage,
}: {
  params: params;
  nextPage: number;
}) {
  return request(
    `/api/v4/groups/${params.groupId}/projects?per_page=100&simple=true&page=${nextPage}`,
    {
      method: 'GET',
      headers: {
        'PRIVATE-TOKEN': params.token,
      },
    },
  );
}

/**
 * 根据关键词获取代码记录
 * @param {params} params
 * @param {number} nextPage 查询结果的第几页
 * @param {string} params.projectId gitlab 项目id
 * @param {string} params.keyword gitlab 搜索关键字
 * @param {string} params.token gitlab accessToken
 */
export async function getGitlabCodeResult({
  params,
  nextPage,
}: {
  params: params;
  nextPage: number;
}) {
  return request(
    `/api/v4/projects/${params.projectId}/search?scope=blobs&search=${params.keyword}&per_page=100&page=${nextPage}`,
    {
      method: 'GET',
      headers: {
        'PRIVATE-TOKEN': params.token,
      },
    },
  );
}
