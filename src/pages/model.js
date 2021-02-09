import * as api from './service';

export default {
  namespace: 'searchGitlab',
  state: {
    allGroups: [], // gitlab所有的组
    allProjects: [], // gitlab所有的项目
    codeRecords: [], // gitlab搜索结果
    keyWord: '', // 搜索关键字
    selectGroups: [], // 搜索的组
  },
  effects: {
    *getGitlabGroup ({ params }, { call, put }) {
      const allGroups = yield call(api.getGitlabGroup, { params });
      if (allGroups) {
        yield put({ type: 'save', result: { allGroups } });
        return allGroups;
      }
      return [];
    },
    *getGitlabProject ({ params }, { call, put }) {
      const projects = yield call(api.getGitlabProject, { params }) || [];
      return projects;
    },
    *getGitlabCodeRecord ({ params }, { call, put }) {
      const codeRecords = yield call(api.getGitlabCodeRecord, { params }) || [];
      return codeRecords;
    },
  },
  reducers: {
    save (state, { result }) {
      return { ...state, ...result };
    }
  }
}