/*
 * @Author: Sam Plus
 * @Date: 2021-02-19 18:38:12
 * @LastEditors: Sam Plus
 * @LastEditTime: 2021-04-21 21:45:24
 * @Description: 处理请求到的数据
 * @FilePath: \gitlab-global-search\src\pages\model.ts
 */
import { Effect, Reducer } from 'umi';
import {
  getGitlabGroup,
  getGitlabProject,
  getGitlabCodeResult,
} from './service';

export interface IndexModelState {
  keyword: string;
  allGroups: Array<any>;
  allProjects: Array<any>;
  codeResult: Array<any>;
  selectGroups: Array<any>;
}

export interface IndexModelType {
  namespace: 'searchGitlab';
  state: IndexModelState;
  effects: {
    getGitlabGroup: Effect;
    getGitlabProject: Effect;
    getGitlabCodeResult: Effect;
  };
  reducers: {
    save: Reducer<IndexModelState>;
  };
}

const gitlabData: IndexModelType = {
  namespace: 'searchGitlab',
  state: {
    keyword: '', // 搜索关键字
    allGroups: [], // gitlab所有的组
    allProjects: [], // gitlab所有的项目
    codeResult: [], // gitlab代码搜索结果
    selectGroups: [], // 搜索的组
  },
  effects: {
    *getGitlabGroup({ params }, { call }) {
      let nextPage: number = 1;
      let allGroups: Array<unknown> = [];

      // 需要根据返回的response header判断是否需要继续查找下一页
      while (nextPage) {
        const { data, response } = yield call(getGitlabGroup, {
          params,
          nextPage,
        });

        nextPage = response.headers.get('x-next-page');
        allGroups = allGroups.concat(data || []);

        if (!nextPage) {
          return allGroups;
        }
      }
    },
    *getGitlabProject({ params }, { call }) {
      let nextPage: number = 1;
      let projects: Array<unknown> = [];

      // 需要根据返回的response header判断是否需要继续查找下一页
      while (nextPage) {
        const { data, response } = yield call(getGitlabProject, {
          params,
          nextPage,
        });

        nextPage = response.headers.get('x-next-page');
        projects = projects.concat(data || []);

        if (!nextPage) {
          return projects;
        }
      }
    },
    *getGitlabCodeResult({ params }, { call }) {
      let nextPage: number = 1;
      let codeResult: Array<unknown> = [];

      // 需要根据返回的response header判断是否需要继续查找下一页
      while (nextPage) {
        const { data, response } = yield call(getGitlabCodeResult, {
          params,
          nextPage,
        });

        nextPage = response.headers.get('x-next-page');
        codeResult = codeResult.concat(data || []);

        if (!nextPage) {
          return codeResult;
        }
      }
    },
  },
  reducers: {
    save(state, { result }: any) {
      return { ...state, ...result };
    },
  },
};

export default gitlabData;
