# Vue3大事件笔记

## 创建项目

1. 使用pnpm创建，安装方式：npm install -g pnpm
2. 创建项目：pnpm create vue

## Router

1. createRouter 创建路由实例

2. 配置history模式

   1. history模式：createWebHistory 地址栏不带#
   2. hash模式： createWebHashHistory 地址栏带#

3. 获取router（在Vue3 compositionAPI中）

   首先需要导入，import {useRouter,useRoute} from 'vue-router'

   1. 获取路由对象router useRouter ：const router = useRouter()
   2. 获取路由参数route useRoute : const route = useRoute()

4. vite 中的环境变量 import.meta.env.BASE_URL 就是vite.config.js中的base配置项


## 按需引入Element Plus

1. 安装pnpm add element-plus
2. 配置按需导入：https://element-plus.org/zh-CN/guide/quickstart.html

### 自动按需

1. 安装插件

   ~~~
   pnpm add -D unplugin-vue-components unplugin-auto-import
   ~~~

2. 然后把下列代码插入到你的 `Vite` 或 `Webpack` 的配置文件中

   ~~~javascript
   ...
   import AutoImport from 'unplugin-auto-import/vite'
   import Components from 'unplugin-vue-components/vite'
   import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

   // https://vitejs.dev/config/
   export default defineConfig({
     plugins: [
       ...
       AutoImport({
         resolvers: [ElementPlusResolver()]
       }),
       Components({
         resolvers: [ElementPlusResolver()]
       })
     ]
   })
   ~~~

3. 直接使用

4. 默认components下的文件也会被自动注册

## Pinia构建仓库和持久化

官方文档：https://prazdevs.github.io/pinia-plugin-persistedstate/zh/

1. 安装插件 pinia-plugin-persistedstate

   ~~~
   pnpm add pinia-plugin-persistedstate -D
   ~~~

2. 使用 main.js

   ~~~javascript
   import persist from 'pinia-plugin-persistedstate'
   ...
   app.use(createPinia().use(persist))
   ~~~

3. 配置 stores/user.js

   ~~~javascript
   import { defineStore } from 'pinia'
   import { ref } from 'vue'

   // 用户模块
   export const useUserStore = defineStore(
     'big-user',
     () => {
       const token = ref('') // 定义 token
       const setToken = (t) => (token.value = t) // 设置 token

       return { token, setToken }
     },
     {
       persist: true // 持久化
     }
   )
   ~~~

## Pinia - 配置仓库统一管理

1. pinia独立维护
   1. 现在：初始化代码在 main.js 中，仓库代码在 stores 中，代码分散职能不单一
   2. 优化：由 stores 统一维护，在 stores/index.js 中完成 pinia 初始化，交付 main.js 使用
2. 仓库统一导出
   1. 现在：使用一个仓库 import { useUserStore } from `./stores/user.js` 不同仓库路径不一
   2. 优化：由 stores/index.js 统一导出，导入路径统一 `./stores`，而且仓库维护在 stores/modules 中

## 数据交互 - 请求工具设计

### 创建axios实例

使用axios来请求后端接口，一般都会对axios进行一些配置（比如配置基础地址等）

一般项目开发中，都会对axios进行基本的二次封装，单独封装到一个模块中，便于使用

1. 安装axios：pnpm add axios

2. 新建 `utils/request.js` 封装 axios 模块

   利用 axios.create 创建一个自定义的 axios 来使用

   http://www.axios-js.com/zh-cn/docs/#axios-create-config

   ~~~javascript
   import axios from 'axios'

   const baseURL = 'http://big-event-vue-api-t.itheima.net'

   const instance = axios.create({
     // TODO 1. 基础地址，超时时间
   })

   instance.interceptors.request.use(
     (config) => {
       // TODO 2. 携带token
       return config
     },
     (err) => Promise.reject(err)
   )

   instance.interceptors.response.use(
     (res) => {
       // TODO 3. 处理业务失败
       // TODO 4. 摘取核心响应数据
       return res
     },
     (err) => {
       // TODO 5. 处理401错误
       return Promise.reject(err)
     }
   )

   export default instance
   ~~~

### 完成axios基本配置

~~~javascript
import { useUserStore } from '@/stores/user'
import axios from 'axios'
import router from '@/router'
import { ElMessage } from 'element-plus'

const baseURL = 'http://big-event-vue-api-t.itheima.net'

const instance = axios.create({
  baseURL,
  timeout: 100000
})

instance.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = userStore.token
    }
    return config
  },
  (err) => Promise.reject(err)
)

instance.interceptors.response.use(
  (res) => {
    if (res.data.code === 0) {
      return res
    }
    ElMessage({ message: res.data.message || '服务异常', type: 'error' })
    return Promise.reject(res.data)
  },
  (err) => {
    ElMessage({ message: err.response.data.message || '服务异常', type: 'error' })
    console.log(err)
    if (err.response?.status === 401) {
      router.push('/login')
    }
    return Promise.reject(err)
  }
)

export default instance
export { baseURL }
~~~

## 首页整体路由设计

###  实现目标

- 完成整体路由规划【搞清楚要做几个页面，它们分别在哪个路由下面，怎么跳转的.....】
- 通过观察,  点击左侧导航,  右侧区域在切换,  那右侧区域内容一直在变,  那这个地方就是一个路由的出口
- 我们需要搭建嵌套路由

目标：

- 把项目中所有用到的组件及路由表, 约定下来

### 约定路由规则

| path             | 文件                             | 功能      | 组件名          | 路由级别 |
| ---------------- | -------------------------------- | --------- | --------------- | -------- |
| /login           | views/login/LoginPage.vue        | 登录&注册 | LoginPage       | 一级路由 |
| /                | views/layout/LayoutContainer.vue | 布局架子  | LayoutContainer | 一级路由 |
| /article/manage  | views/article/ArticleManage.vue  | 文章管理  | ArticleManage   | 二级路由 |
| /article/channel | views/article/ArticleChannel.vue | 频道管理  | ArticleChannel  | 二级路由 |
| /user/profile    | views/user/UserProfile.vue       | 个人详情  | UserProfile     | 二级路由 |
| /user/avatar     | views/user/UserAvatar.vue        | 更换头像  | UserAvatar      | 二级路由 |
| /user/password   | views/user/UserPassword.vue      | 重置密码  | UserPassword    | 二级路由 |

# 登录注册页面 [element-plus 表单 & 表单校验]

## 注册登录 静态结构 & 基本切换

1. 安装 element-plus 图标库pnpm i @element-plus/icons-vue
2. 静态结构准备

## 注册功能

### 实现注册校验

【需求】注册页面基本校验

1. 用户名非空，长度校验5-10位
2. 密码非空，长度校验6-15位
3. 再次输入密码，非空，长度校验6-15位

【进阶】再次输入密码需要自定义校验规则，和密码框值一致（可选）

注意：

1. model 属性绑定 form 数据对象

```jsx
const formModel = ref({
  username: '',
  password: '',
  repassword: ''
})

<el-form :model="formModel" >
```

1. v-model 绑定 form 数据对象的子属性

```jsx
<el-input
  v-model="formModel.username"
  :prefix-icon="User"
  placeholder="请输入用户名"
></el-input>
... 
(其他两个也要绑定)
```

1. rules 配置校验规则

```jsx
<el-form :rules="rules" >
    
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 5, max: 10, message: '用户名必须是5-10位的字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    {
      pattern: /^\S{6,15}$/,
      message: '密码必须是6-15位的非空字符',
      trigger: 'blur'
    }
  ],
  repassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      pattern: /^\S{6,15}$/,
      message: '密码必须是6-15的非空字符',
      trigger: 'blur'
    },
    {
      validator: (rule, value, callback) => {
        if (value !== formModel.value.password) {
          callback(new Error('两次输入密码不一致!'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}
```

1. prop 绑定校验规则

```jsx
<el-form-item prop="username">
  <el-input
    v-model="formModel.username"
    :prefix-icon="User"
    placeholder="请输入用户名"
  ></el-input>
</el-form-item>
... 
(其他两个也要绑定prop)
```

### 注册前的预校验

需求：点击注册按钮，注册之前，需要先校验

1. 通过 ref 获取到 表单组件

```jsx
const form = ref()

<el-form ref="form">
```

1. 注册之前进行校验

```jsx
<el-button
  @click="register"
  class="button"
  type="primary"
  auto-insert-space
>
  注册
</el-button>

const register = async () => {
  await form.value.validate()
  console.log('开始注册请求')
}
```

### 封装 api 实现注册功能

需求：封装注册api，进行注册，注册成功切换到登录

1. 新建 api/user.js 封装

```jsx
import request from '@/utils/request'

export const userRegisterService = ({ username, password, repassword }) =>
  request.post('/api/reg', { username, password, repassword })
```

1. 页面中调用

```jsx
const register = async () => {
  await form.value.validate()
  await userRegisterService(formModel.value)
  ElMessage.success('注册成功')
  // 切换到登录
  isRegister.value = false
}
```

1. eslintrc 中声明全局变量名,  解决 ElMessage 报错问题

```jsx
module.exports = {
  ...
  globals: {
    ElMessage: 'readonly',
    ElMessageBox: 'readonly',
    ElLoading: 'readonly'
  }
}
```

## 登录功能

### 实现登录校验

【需求说明】给输入框添加表单校验

1. 用户名不能为空，用户名必须是5-10位的字符，失去焦点 和 修改内容时触发校验
2. 密码不能为空，密码必须是6-15位的字符，失去焦点 和 修改内容时触发校验

操作步骤：

1. model 属性绑定 form 数据对象，直接绑定之前提供好的数据对象即可

```jsx
<el-form :model="formModel" >
```

1. rules 配置校验规则，共用注册的规则即可

```jsx
<el-form :rules="rules" >
```

1. v-model 绑定 form 数据对象的子属性

```jsx
<el-input
  v-model="formModel.username"
  :prefix-icon="User"
  placeholder="请输入用户名"
></el-input>

<el-input
  v-model="formModel.password"
  name="password"
  :prefix-icon="Lock"
  type="password"
  placeholder="请输入密码"
></el-input>
```

1. prop 绑定校验规则

```jsx
<el-form-item prop="username">
  <el-input
    v-model="formModel.username"
    :prefix-icon="User"
    placeholder="请输入用户名"
  ></el-input>
</el-form-item>
... 
```

1. 切换的时候重置

```jsx
watch(isRegister, () => {
  formModel.value = {
    username: '',
    password: '',
    repassword: ''
  }
})
```

### 登录前的预校验 & 登录成功

【需求说明1】登录之前的预校验

- 登录请求之前，需要对用户的输入内容，进行校验
- 校验通过才发送请求

【需求说明2】**登录功能**

1. 封装登录API，点击按钮发送登录请求
2. 登录成功存储token，存入pinia 和 持久化本地storage
3. 跳转到首页，给提示

【测试账号】

- 登录的测试账号:  shuaipeng
- 登录测试密码:  123456

PS: 每天账号会重置，如果被重置了，可以去注册页，注册一个新号

实现步骤：

1. 注册事件，进行登录前的预校验 (获取到组件调用方法)

```jsx
<el-form ref="form">
    
const login = async () => {
  await form.value.validate()
  console.log('开始登录')
}
```

1. 封装接口 API

```jsx
export const userLoginService = ({ username, password }) =>
  request.post('api/login', { username, password })
```

1. 调用方法将 token 存入 pinia 并 自动持久化本地

```jsx
const userStore = useUserStore()
const router = useRouter()
const login = async () => {
  await form.value.validate()
  const res = await userLoginService(formModel.value)
  userStore.setToken(res.data.token)
  ElMessage.success('登录成功')
  router.push('/')
}
```

# 首页 layout 架子 [element-plus 菜单]

## 基本架子拆解

### 登录访问拦截

需求：只有登录页，可以未授权的时候访问，其他所有页面，都需要先登录再访问

~~~javascript
// 登录访问拦截
router.beforeEach((to) => {
  const userStore = useUserStore()
  if (!userStore.token && to.path !== '/login') return '/login'
})
~~~

### 用户基本信息获取&渲染

1. api/user.js封装接口

   ~~~javascript
   export const userGetInfoService = () => request.get('/my/userinfo')
   ~~~

2. stores/modules/user.js 定义数据

   ~~~javascript
   const user = ref({})
   const getUser = async () => {
     const res = await userGetInfoService() // 请求获取数据
     user.value = res.data.data
   }
   ~~~

3. `layout/LayoutContainer`页面中调用

   ~~~javascript
   import { useUserStore } from '@/stores'
   const userStore = useUserStore()
   onMounted(() => {
     userStore.getUser()
   })
   ~~~

4. 动态渲染

   ~~~javascript
   <div>
     黑马程序员：<strong>{{ userStore.user.nickname || userStore.user.username }}</strong>
   </div>

   <el-avatar :src="userStore.user.user_pic || avatar" />
   ~~~

   ​