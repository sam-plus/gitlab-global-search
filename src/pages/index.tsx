/*
 * @Author: Sam Plus
 * @Date: 2021-02-19 18:38:12
 * @LastEditTime: 2021-03-02 21:44:24
 * @LastEditors: Sam Plus
 * @Description: gitlab全局搜索-多项目搜索, 访问链接可设置keyWord、token以及groups三个参数。例如：
 *   http://127.0.0.1:8000/?keyword=const&token=fqYw--u3AbqFcLV6vQws&groups=tools;test
 * @FilePath: \gitlab-global-search\src\pages\index.tsx
 */
import React, { PureComponent } from 'react';
import { connect as connectComponent } from 'dva';
import { History, Dispatch, ConnectProps, IndexModelState, Loading } from 'umi';
import { Layout, Typography, Card, Pagination, Row, Col, Spin } from 'antd';
import SearchConditionForm from '@/components/search-condition-form';

import './index.less';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

interface GitlabSearchPageProps extends ConnectProps {
  loading: boolean;
  history: History;
  dispatch: Dispatch;
  searchGitlab: IndexModelState;
  allGroups: Array<any>;
  allProjects: Array<any>;
  codeResult: Array<any>;
}

interface GitlabSearchPageState {
  keyword: string;
  token: string;
  currentPage: number;
  pageSize: number;
  selectGroups: Array<string>;
}

interface searchHandleType {
  searchKeyWord: string;
  selectGroups: Array<any>;
  accessToken: string;
}

// Typescript 不建议把表达式函数作为装饰符来使用，重写connect
const connect = (mapStateToProps: any) => {
  return (target: any) => connectComponent(mapStateToProps)(target) as any;
};

@connect(
  ({
    searchGitlab,
    loading,
  }: {
    searchGitlab: IndexModelState;
    loading: Loading;
  }) => ({
    ...searchGitlab,
    loading,
  }),
)
class GitlabSearchPage extends PureComponent<
  GitlabSearchPageProps,
  GitlabSearchPageState
> {
  constructor(props: GitlabSearchPageProps) {
    super(props);

    const {
      keyword = '',
      groups,
      token = '',
    }: any = this.props.history.location.query;

    const selectGroups = groups?.split(';') || [];

    this.state = {
      keyword,
      token,
      currentPage: 1,
      pageSize: 10,
      selectGroups,
    };
  }

  async componentDidMount() {
    // 获取gitlab所有的组和项目
    await this.getAllGroups();
    await this.getAllProjects();

    const { keyword, selectGroups } = this.state;

    let projects = [];
    if (selectGroups.length) {
      projects = await this.getProjectsOfGroups(selectGroups);
    } else {
      projects = this.props.allProjects;
    }

    if (keyword) {
      await this.getCodeByKeyWord(keyword, projects);
    }
  }

  // 获取所有gitlab组
  async getAllGroups() {
    const { allGroups } = this.props;

    if (!allGroups.length) {
      const gitlabGroups = JSON.parse(
        localStorage.getItem('gitlabGroups') || '[]',
      );

      if (gitlabGroups.length) {
        await this.props.dispatch({
          type: 'searchGitlab/save',
          result: { allGroups: gitlabGroups },
        });
      } else {
        const res = await this.props.dispatch({
          type: 'searchGitlab/getGitlabGroup',
          params: {
            token: this.state.token,
          },
        });
        localStorage.setItem('gitlabGroups', JSON.stringify(res));
      }
    }
  }

  // 根据组获取所有的项目
  async getAllProjects() {
    const { allProjects } = this.props;

    if (allProjects.length) return;

    const gitlabProjects =
      JSON.parse(localStorage.getItem('gitlabProjects') || '[]') || [];

    if (gitlabProjects.length) {
      await this.props.dispatch({
        type: 'searchGitlab/save',
        result: { allProjects: gitlabProjects },
      });
    } else {
      const { allGroups = [] } = this.props;

      if (allGroups.length) {
        let promiseArr: Array<Promise<object>> = [];

        allGroups.forEach(async (group) => {
          const everyGetProject: Promise<object> = new Promise(
            async (resolve) => {
              const res = await this.props.dispatch({
                type: 'searchGitlab/getGitlabProject',
                params: {
                  groupId: group.id,
                  token: this.state.token,
                },
              });

              resolve(res);
            },
          );

          promiseArr.push(everyGetProject);
        });

        await Promise.all(promiseArr).then(async (values) => {
          await this.props.dispatch({
            type: 'searchGitlab/save',
            result: { allProjects: values.flat(1) },
          });

          localStorage.setItem(
            'gitlabProjects',
            JSON.stringify(values.flat(1)),
          );
        });
      }
    }
  }

  /**
   * 获取组包含的项目
   * @param {*} groups
   */
  async getProjectsOfGroups(groups: Array<any>) {
    const { allProjects } = this.props;

    let containProjects: Array<any> = [];

    groups.forEach((group) => {
      const filterProjects = allProjects.filter((project) => {
        return (
          project.namespace.id === group.id ||
          project.namespace.name === group.id ||
          project.namespace.id === group ||
          project.namespace.name === group
        );
      });
      containProjects = containProjects.concat(filterProjects);
    });

    return containProjects;
  }

  /**
   * 根据关键字搜索项目代码
   * @param {string} keyword 搜索关键词
   * @param {Array<any>} projects 需要搜索的项目
   */
  async getCodeByKeyWord(keyword: string, projects: Array<any>) {
    if (keyword === '' && !projects.length) return;

    let codeResult: Array<any> = [];

    // 根据关键字逐个项目搜索
    projects.forEach(async (project) => {
      const codeRecode: Array<any> = await this.props.dispatch({
        type: 'searchGitlab/getGitlabCodeResult',
        params: {
          keyword,
          projectId: project?.id || '',
          token: this.state.token,
        },
      });

      if (codeRecode.length) {
        let handledCodeRecode = codeRecode.map((code) => {
          const codeLines = code.data.split(/\n/g).length - 1;

          return {
            ...code,
            codeLines,
            file_path: `${project.path_with_namespace}/blob/${code.ref}/${code.path}`,
          };
        });

        codeResult.push(handledCodeRecode);
      }

      await this.props.dispatch({
        type: 'searchGitlab/save',
        result: { codeResult: codeResult.flat(1) },
      });
    });
  }

  async searchHandle({ keyword, selectGroups, token }: searchHandleType) {
    let { allProjects: projects } = this.props;

    this.setState(
      {
        token,
        keyword,
        currentPage: 1,
      },
      async () => {
        if (!projects.length) {
          await this.getAllGroups();
          await this.getAllProjects();
          projects = this.props.allProjects;
        }

        if (selectGroups?.length) {
          projects = await this.getProjectsOfGroups(selectGroups);
        }

        await this.getCodeByKeyWord(keyword, projects);
      },
    );
  }

  /**
   * @description: 切换分页
   * @param {number} page
   * @param {number} pageSize
   * @return {*}
   */
  changePagination(page: number, pageSize: number) {
    this.setState({
      currentPage: page,
      pageSize,
    });
  }

  render() {
    const { keyword, selectGroups, token, currentPage, pageSize } = this.state;
    const {
      allGroups,
      codeResult,
      loading: { global },
    } = this.props;

    const showcodeResult = codeResult.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize,
    );

    return (
      <Layout className="layout">
        <Header className="layout-header">
          <SearchConditionForm
            allGroups={allGroups}
            keyword={keyword}
            selectGroups={selectGroups}
            token={token}
            searchHandle={(params: searchHandleType) =>
              this.searchHandle(params)
            }
          />
        </Header>

        <Content className="layout-content">
          <Title level={4}>
            Showing <Text type="danger">{!global ? codeResult.length : 0}</Text>{' '}
            code results for <Text type="danger">{keyword}</Text>
          </Title>

          <Spin spinning={global} />

          {!global &&
            showcodeResult?.map((code, index) => (
              <Card
                type="inner"
                title={code.file_path}
                className="content-code"
                key={index}
                bodyStyle={{ padding: '0' }}
              >
                <Row wrap={false}>
                  <Col flex="40px" className="content-code__line-number-border">
                    {[...Array(code.codeLines)].map((_, line) => (
                      <div
                        className="content-code__line-number-border__number"
                        key={line}
                      >{`${line + code.startline}`}</div>
                    ))}
                  </Col>

                  <Col
                    flex="auto"
                    className="content-code__line-number-border__code"
                  >
                    <pre>{code.data}</pre>
                  </Col>
                </Row>
              </Card>
            ))}

          {codeResult.length > 10 && (
            <Pagination
              showQuickJumper
              defaultCurrent={1}
              current={currentPage}
              total={codeResult.length}
              onChange={(page, pageSize) =>
                this.changePagination(page, pageSize)
              }
            />
          )}
        </Content>

        <Footer className="layout-footer">
          Gitlab Global Search Created by Sam Plus
        </Footer>
      </Layout>
    );
  }
}

export default GitlabSearchPage;
