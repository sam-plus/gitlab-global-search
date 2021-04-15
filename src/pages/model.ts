import { Effect, Reducer } from 'umi';
import * as api from './service';

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
    *getGitlabGroup({ params }, { call, put }) {
      const allGroups = yield call(api.getGitlabGroup, { params });
      if (allGroups) {
        yield put({ type: 'save', result: { allGroups } });
        return allGroups;
      }
      return [];
    },
    *getGitlabProject({ params }, { call }) {
      const projects = yield call(api.getGitlabProject, { params }) || [];
      return projects;
    },
    *getGitlabCodeResult({ params }, { call }) {
      const codeResult = yield call(api.getGitlabCodeResult, { params }) || [];
      return codeResult;
    },
  },
  reducers: {
    save(state, { result }: any) {
      return { ...state, ...result };
    },
  },
};

export default gitlabData;
