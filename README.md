<!--
 * @Author: Sam Plus
 * @Date: 2021-02-19 18:38:10
 * @LastEditors: Sam Plus
 * @LastEditTime: 2021-04-15 20:40:53
 * @Description: Do not edit
 * @FilePath: \gitlab-global-search\README.md
-->
# gitlab 全局搜索

gitlab社区版只能进行单项目搜索。但在实际工作中，全局（多项目）搜索也非常需要，比如：
 - 即将下线的接口在业务项目中使用情况排查
 - 某依赖包不同版本在项目中的占比
 

### 实现说明
  通过研究gitlab 提供的api文档，发现可以通过遍历调用api的方式实现全局多项目搜索。获取搜索结果的步骤为：
  1、获取gitlab仓库的group；
  2、根据group id 获取包含的project；
  3、根据project id使用关键词搜索项目内容。

  设计要点说明：
  - 项目使用Umi + Dva + Ant-Design 实现。
  - 搜索条件为keyword、token以及group，keyword为搜索关键字，token为gitlab仓库账户生成的access token，group定义了搜索的项目组范围。这三个参数可在url上当作参数输入，关键字和token必填，group为空搜索范围默认全局。
  - 获取项目以及搜索项目内容都是并发请求，为了避免并发量过大导致浏览器崩溃，做了最大并发数量50控制。
  - 把首次请求到的所有group和project信息存储到页面中，提高下次搜索速度。
  - 开发模式中，通过配置[umi的proxy](https://umijs.org/config#proxy)解决跨域问题（如果是访问私有gitlab仓库，需要改下.umirc.ts中的设置）。如果要部署到生产环境，需要配置ng或者修改gitlab配置文件解决跨域。
  - 页面设计参照了github和gitlab搜索界面，并增加了分页以及loading效果。

### 下载安装
首先得有 node，并确保 node 版本是 10.13 或以上。

下载项目
```
git clone https://github.com/sam-plus/gitlab-global-search.git
```

在项目中安装依赖，推荐使用yarn安装

```
yarn
```

### 启动项目
```
yarn start
```
在浏览器里打开 http://localhost:8000/?keyword=xxx&token=xxx&groups=xx;xx)，能看到以下界面，

![image](https://raw.githubusercontent.com/sam-plus/static-sources/master/IMG/gitlab-global-search-page.png)

token需要在gitlab seting中生成

### 待优化事项
搜索的项目分支为默认分支（一般是master）。暂不支持搜索所有分支，以及设定分支。
获取的组、项目以及代码结果数量都为最大值100。如果超出100，需要翻页。
搜索结果可能需要导出，目前没有导出功能。 





