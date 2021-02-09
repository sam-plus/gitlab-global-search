import request from '@/utils/request';


const privateToken = '4ERpsjsNGtZeNn6zp5pA';
/**
 * 获取gitlab组
 * @param {*} param0
 */
export async function getGitlabGroup () {
  return request('/api/v4/groups?per_page=100', {
    method: 'GET',
    headers: {
      'PRIVATE-TOKEN': privateToken
    },
  });
}

/**
 * 获取gitlab项目id
 * @param {*} param0
 */
export async function getGitlabProject ({ params }) {
  return request(`/api/v4/groups/${params.groupId}/projects?per_page=100&simple=true`, {
    method: 'GET',
    headers: {
      'PRIVATE-TOKEN': privateToken
    },
  });
}

/**
 * 根据关键词获取记录
 * @param {*} param0
 */
export async function getGitlabCodeRecord ({ params }) {
  return request(`/api/v4/projects/${params.projectId}/search?scope=blobs&search=${params.keyWord}&per_page=100`, {
    method: 'GET',
    headers: {
      'PRIVATE-TOKEN': privateToken
    },
  });
}
