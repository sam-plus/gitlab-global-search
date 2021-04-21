/*
 * @Author: Sam Plus
 * @Date: 2021-02-19 18:38:12
 * @LastEditTime: 2021-04-21 23:04:17
 * @LastEditors: Sam Plus
 * @Description: gitlab全局搜索-多项目搜索, 访问链接可设置keyWord、token以及groups三个参数。例如：
 *   http://127.0.0.1:8000/?keyword=xxx&token=xxx&groups=xx;xx
 * @FilePath: \gitlab-global-search\src\pages\index.tsx
 */
import { PureComponent } from 'react';
import { connect as connectComponent } from 'dva';
import { History, Dispatch, ConnectProps, IndexModelState, Loading } from 'umi';
import { Layout, Typography, Card, Pagination, Row, Col, Spin } from 'antd';
import SearchConditionForm from '@/components/search-condition-form';

import './index.less';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

interface GitlabSearchPageProps extends ConnectProps {
  loading: { global: boolean };
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
  status: string;
}

interface searchHandleType {
  keyword: string;
  selectGroups: Array<any>;
  token: string;
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

    this.state = {
      keyword,
      token,
      currentPage: 1,
      pageSize: 10,
      selectGroups: groups?.split(';') || [],
      status: '',
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
      // 从网页存储中获取组列表
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

        await this.props.dispatch({
          type: 'searchGitlab/save',
          result: { allGroups: res },
        });

        // 把请求到的组列表保存到网页存储中
        localStorage.setItem('gitlabGroups', JSON.stringify(res));
      }
    }
  }

  // 根据组获取所有的项目
  async getAllProjects() {
    const { allProjects } = this.props;

    if (allProjects.length) return;

    // 从网页存储中获取项目列表
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

        // 遍历项目组，获取每个组包含的项目
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

        // 拿到所有组的项目数据后保存数据
        await Promise.all(promiseArr).then(async (values) => {
          await this.props.dispatch({
            type: 'searchGitlab/save',
            result: { allProjects: values.flat(1) },
          });

          // 把请求到的项目列表保存到网页存储中
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
   * @param {*} selectGroups 选择的组
   */
  async getProjectsOfGroups(selectGroups: Array<any>) {
    const { allProjects } = this.props;

    let containProjects: Array<any> = [];

    selectGroups.forEach((group) => {
      const filterProjects = allProjects.filter((project) => {
        // url上带groups参数时，selectGroups = ['group-name'];
        // 从选择框选择groups时，selectGroups = [{id: group-id}]
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
   * 根据关键字逐个搜索项目代码，控制请求并发数为50
   * @param {string} keyword 搜索关键词
   * @param {Array<any>} projects 需要搜索的项目
   */
  async getCodeByKeyWord(keyword: string, projects: Array<any>) {
    if (keyword === '' && !projects.length) return;

    this.showSearchStatus('ing');

    let codeResult: Array<any> = []; // 保存请求结果
    const all: number = projects.length; // 请求总个数
    let countExcuted: number = 0; // 已发起的请求个数

    const next = async () => {
      let current = countExcuted++;
      const project = projects[current];

      if (current >= all) {
        // 请求全部完成
        this.showSearchStatus('end');
        return;
      }

      const codeRecode: Array<any> = await this.props.dispatch({
        type: 'searchGitlab/getGitlabCodeResult',
        params: {
          keyword,
          projectId: project?.id || '',
          token: this.state.token,
        },
      });

      codeResult.push(this.handleSearchResult(project, codeRecode));

      // 保存搜索结果
      await this.props.dispatch({
        type: 'searchGitlab/save',
        result: { codeResult: codeResult.flat(1) },
      });

      // 还有项目没搜索完就继续
      if (current < all) {
        next();
      }
    };

    while (countExcuted < 50) {
      next();
    }

    // projects.forEach(async (project, index) => {
    //   const codeRecode: Array<any> = await this.props.dispatch({
    //     type: 'searchGitlab/getGitlabCodeResult',
    //     params: {
    //       keyword,
    //       projectId: project?.id || '',
    //       token: this.state.token,
    //     },
    //   });

    //   codeResult.push(this.handleSearchResult(project, codeRecode));

    //   // 保存搜索结果
    //   await this.props.dispatch({
    //     type: 'searchGitlab/save',
    //     result: { codeResult: codeResult.flat(1) },
    //   });

    //   (index === projects.length - 1) && this.showSearchStatus('end');
    // });
    // }
  }

  /**
   * 对搜索结果进行处理
   * @param project
   * @param codeRecode
   * @returns
   */
  handleSearchResult(project: any, codeRecode: Array<any>) {
    if (codeRecode.length) {
      let handledCodeRecode = codeRecode.map((code) => {
        // 返回的搜索结果是代码格式，需要根据其换行符判断代码有多少行
        const codeLines = code.data.split(/\n/g).length - 1;

        return {
          ...code,
          codeLines,
          file_path: `${project.path_with_namespace}/blob/${code.ref}/${code.path}`,
        };
      });
      return handledCodeRecode;
    }
    return [];
  }

  /**
   * 页面展示搜索过程
   * @param status
   */
  showSearchStatus(status: 'ing' | 'end') {
    this.setState({
      status: status === 'ing' ? 'Searching...' : 'Search end...',
    });
  }

  /**
   * 点击搜索处理逻辑
   * @param param0
   */
  async searchHandle({ keyword, selectGroups, token }: searchHandleType) {
    let { allProjects: projects } = this.props;

    this.setState(
      {
        token,
        keyword,
        currentPage: 1,
      },
      async () => {
        // 如果当前页面项目列表为空，需要重新获取组和项目信息
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
    const {
      keyword,
      selectGroups,
      token,
      currentPage,
      pageSize,
      status,
    } = this.state;

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
            <Text type="danger">{status}</Text>Showing{' '}
            <Text type="danger">{!global ? codeResult.length : 0}</Text> code
            results for <Text type="danger">{keyword}</Text>
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
              showSizeChanger
              defaultCurrent={1}
              current={currentPage}
              total={codeResult.length}
              onChange={(page, pageSize) =>
                this.changePagination(page, pageSize || 10)
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
