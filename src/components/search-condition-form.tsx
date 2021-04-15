/*
 * @Author: Sam Plus
 * @Date: 2021-02-24 23:11:56
 * @LastEditTime: 2021-02-28 21:11:00
 * @LastEditors: Sam Plus
 * @Description: 搜索输入组件
 * @FilePath: \gitlab-global-search\src\components\search-condition-form.tsx
 */
import React, { useEffect } from 'react';
import { Input, Select, Button, Form, Row, Col } from 'antd';
import { SearchOutlined, InfoCircleOutlined } from '@ant-design/icons';

interface Props {
  allGroups: Array<any>;
  keyword: string;
  selectGroups: Array<string>;
  token: string;
  searchHandle: Function;
}

const SearchConditionForm: React.FunctionComponent<Props> = ({
  allGroups,
  keyword,
  selectGroups,
  token,
  searchHandle,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({
      keyword,
      selectGroups,
      token,
    });
  }, [keyword, selectGroups, token]);

  const onFinish = ({ keyword = '', selectGroups = [], token = '' }) => {
    const groups = selectGroups.map((item) => ({ id: item }));
    searchHandle({ keyword, selectGroups: groups, token });
  };

  const onReset = () => {
    form.resetFields();
  };

  return (
    <Form
      labelCol={{ span: 5 }}
      wrapperCol={{ span: 19 }}
      colon={false}
      name="searchOptions"
      onFinish={onFinish}
      form={form}
      labelAlign="left"
    >
      <Row gutter={48}>
        <Col span={6}>
          <Form.Item
            name="keyword"
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
        </Col>

        <Col span={6}>
          <Form.Item
            name="token"
            label="token"
            rules={[
              {
                required: true,
                message: '请输入access token',
              },
            ]}
            tooltip={{
              title: '可在gitlab中生成access token',
              icon: <InfoCircleOutlined />,
            }}
          >
            <Input placeholder="请输入access token" allowClear />
          </Form.Item>
        </Col>

        <Col span={6}>
          <Form.Item name="selectGroups" label="group">
            <Select
              showSearch
              mode="multiple"
              allowClear
              placeholder="请选择系统group，不选默认全局"
              filterOption={(input, option) =>
                option?.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {allGroups.length &&
                allGroups.map((group) => (
                  <Select.Option key={group.id} value={group.id}>
                    {group.name}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>
        </Col>

        <Col span={6}>
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
        </Col>
      </Row>
    </Form>
  );
};

export default SearchConditionForm;
