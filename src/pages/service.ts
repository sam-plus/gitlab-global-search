import request from '@/utils/request';

type params = {
  groupId?: number;
  projectId?: number;
  keyword?: string;
  token: string;
};

/**
 * 获取gitlab组
 * @param {params} params
 * @param {string} params.token gitlab accessToken
 */
export async function getGitlabGroup({ params }: { params: params }) {
  return request('/api/v4/groups?per_page=100', {
    method: 'GET',
    headers: {
      'PRIVATE-TOKEN': params.token,
    },
  });
}

/**
 * 获取gitlab组下的项目
 * @param {params} params
 * @param {string} params.groupId gitlab 组id
 * @param {string} params.token gitlab accessToken
 */
export async function getGitlabProject({ params }: { params: params }) {
  return request(
    `/api/v4/groups/${params.groupId}/projects?per_page=100&simple=true`,
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
 * @param {string} params.projectId gitlab 项目id
 * @param {string} params.keyword gitlab 搜索关键字
 * @param {string} params.token gitlab accessToken
 */
export async function getGitlabCodeResult({ params }: { params: params }) {
  return request(
    `/api/v4/projects/${params.projectId}/search?scope=blobs&search=${params.keyword}&per_page=100`,
    {
      method: 'GET',
      headers: {
        'PRIVATE-TOKEN': params.token,
      },
    },
  );
}
