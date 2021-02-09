import React, { PureComponent, useEffect } from 'react';
import { connect } from 'dva';
import {
  Typography,
  Divider,
  Input,
  Select,
  Button,
  Form,
  Card,
  Pagination,
  Row,
  Col,
} from 'antd';
import { SearchOutlined, InfoCircleOutlined } from '@ant-design/icons';

/**
 * 访问链接，可指定组groups范围和关键字keyWord搜索
 * http://127.0.0.1:8000/?keyWord=ApolloClient&groups=mdp-fma-framework;taro-unicom-fe
 */

const { Title } = Typography;
const { Option } = Select;

const SearchConditionForm = ({
  allGroups,
  keyWord,
  selectGroups,
  searchHandle,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({
      searchKeyWord: keyWord,
      selectGroups: selectGroups,
    });
  }, [keyWord, selectGroups]);

  const onFinish = ({ searchKeyWord, selectGroups }) => {
    const groups = selectGroups.map((item) => ({ id: item }));
    searchHandle({ searchKeyWord, selectGroups: groups });
  };

  const onReset = () => {
    form.resetFields();
  };

  return (
    <Form layout="inline" name="searchOptions" onFinish={onFinish} form={form}>
      <Form.Item
        name="searchKeyWord"
        label="关键字"
        rules={[
          {
            required: true,
            message: '请输入搜索关键字',
          },
        ]}
      >
        <Input placeholder="请输入搜索关键字" allowClear />
      </Form.Item>

      {/* <Form.Item name="accessToken" label="token" tooltip={{ title: '可在gitlab中生成个人token，更高权限token请向王思申请', icon: <InfoCircleOutlined /> }}>
        <Input placeholder="请输入accessToken" allowClear />
      </Form.Item> */}

      <Form.Item name="selectGroups" label="group">
        <Select
          style={{ width: 300 }}
          showSearch
          mode="multiple"
          allowClear
          placeholder="请选择系统group，不选默认权限范围内所有"
          filterOption={(input, option) =>
            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
        >
          {allGroups.length > 0 &&
            allGroups.map((group) => (
              <Option key={group.id} value={group.id}>
                {group.name}
              </Option>
            ))}
        </Select>
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          style={{ marginRight: 20 }}
          icon={<SearchOutlined />}
        >
          搜索
        </Button>
        <Button htmlType="button" onClick={onReset}>
          重置
        </Button>
      </Form.Item>
    </Form>
  );
};

@connect(({ searchGitlab }) => ({
  ...searchGitlab,
}))
class GitlabSearchPage extends PureComponent {
  constructor() {
    super();
    this.state = {
      currentPage: 1,
      pageSize: 10,
    };
  }

  async componentDidMount() {
    // 获取gitlab所有的组和项目
    await this.getAllGroups();
    await this.getAllProjects();

    // 如果url有keyWord关键字和指定groups范围，保存到状态中
    const { keyWord, groups } = this.props.history.location.query || '';

    let projects = [];
    if (groups) {
      await this.props.dispatch({
        type: 'searchGitlab/save',
        result: { selectGroups: groups.split(';') },
      });

      projects = await this.getProjectsOfGroups(groups.split(';'));
    } else {
      projects = this.props.allProjects;
    }

    if (keyWord) {
      await this.props.dispatch({
        type: 'searchGitlab/save',
        result: { keyWord },
      });

      await this.getCodeByKeyWord(keyWord, projects);
    }
  }

  // 获取所有gitlab组
  async getAllGroups() {
    const { allGroups } = this.props;

    if (allGroups.length === 0) {
      const gitlabGroups =
        JSON.parse(localStorage.getItem('gitlabGroups')) || [];

      if (gitlabGroups.length !== 0) {
        await this.props.dispatch({
          type: 'searchGitlab/save',
          result: { allGroups: gitlabGroups },
        });
      } else {
        const res = await this.props.dispatch({
          type: 'searchGitlab/getGitlabGroup',
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
      JSON.parse(localStorage.getItem('gitlabProjects')) || [];

    if (gitlabProjects.length !== 0) {
      await this.props.dispatch({
        type: 'searchGitlab/save',
        result: { allProjects: gitlabProjects },
      });
    } else {
      const { allGroups = [] } = this.props;

      if (allGroups.length > 0) {
        let promiseArr = [];

        allGroups.forEach(async (group) => {
          const everyGetProject = new Promise(async (resolve) => {
            const res = await this.props.dispatch({
              type: 'searchGitlab/getGitlabProject',
              params: {
                groupId: group.id,
              },
            });

            resolve(res);
          });

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

  // 获取组包含的项目
  async getProjectsOfGroups(groups) {
    const { allProjects } = this.props;

    let containProjects = [];

    groups.forEach((group) => {
      const filterProjects = allProjects.filter((project) => {
        return (
          project.namespace.id === group.id ||
          project.namespace.name === group.id
        );
      });
      containProjects = containProjects.concat(filterProjects);
    });

    return containProjects;
  }

  // 根据关键字搜索项目代码
  async getCodeByKeyWord(keyWord, projects) {
    if (keyWord === '' && !projects.length) return;

    let codeRecords = [];

    // 根据关键字逐个项目搜索
    projects.forEach(async (project) => {
      const codeRecode = await this.props.dispatch({
        type: 'searchGitlab/getGitlabCodeRecord',
        params: {
          keyWord,
          projectId: (project && project.id) || '',
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
        codeRecords.push(handledCodeRecode);
      }

      await this.props.dispatch({
        type: 'searchGitlab/save',
        result: { codeRecords: codeRecords.flat(1) },
      });
      console.log('搜索结果：', this.props.codeRecords);
    });
  }

  async searchHandle({ searchKeyWord, selectGroups }) {
    let { allProjects: projects } = this.props;

    if (selectGroups && selectGroups.length) {
      projects = await this.getProjectsOfGroups(selectGroups);
    }

    await this.getCodeByKeyWord(searchKeyWord, projects);

    this.setState({
      currentPage: 1,
    });
  }

  changePagination(page, pageSize) {
    this.setState({
      currentPage: page,
      pageSize,
    });
  }

  render() {
    console.log('render');
    const { allGroups, keyWord, selectGroups, codeRecords } = this.props;

    const { currentPage, pageSize } = this.state;

    const showCodeRecords = codeRecords.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize,
    );

    return (
      <>
        <Title level={4}>gitlab全局搜索</Title>

        <SearchConditionForm
          allGroups={allGroups}
          keyWord={keyWord}
          selectGroups={selectGroups}
          searchHandle={(params) => this.searchHandle(params)}
        />

        <Divider />

        {showCodeRecords &&
          showCodeRecords.map((code, index) => (
            <Card
              type="inner"
              title={code.file_path}
              style={{ width: '70%', marginBottom: 30 }}
              key={index}
              bodyStyle={{ padding: '0' }}
            >
              <Row wrap={false}>
                <Col
                  flex="40px"
                  style={{
                    backgroundColor: '#fafafa',
                    borderRight: '1px solid #f0f0f0',
                    paddingTop: 16,
                  }}
                >
                  {[...Array(code.codeLines)].map((_, line) => (
                    <div style={{ textAlign: 'right', paddingRight: 5 }}>{`${
                      line + code.startline
                    }`}</div>
                  ))}
                </Col>
                <Col flex="auto" style={{ paddingTop: 16, paddingLeft: 10 }}>
                  <pre
                    style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                  >
                    {code.data}
                  </pre>
                </Col>
              </Row>
            </Card>
          ))}

        {codeRecords.length > 10 && (
          <Pagination
            showQuickJumper
            defaultCurrent={1}
            current={currentPage}
            total={codeRecords.length}
            onChange={(page, pageSize) => this.changePagination(page, pageSize)}
          />
        )}
      </>
    );
  }
}

export default GitlabSearchPage;
