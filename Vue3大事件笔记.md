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

# 文章分类页面 - [element-plus 表格]

## el-table表格loading效果

1. 定义变量，v-loading绑定

```jsx
const loading = ref(false)

<el-table v-loading="loading">
```

1. 发送请求前开启，请求结束关闭

```jsx
const getChannelList = async () => {
  loading.value = true
  const res = await artGetChannelsService()
  channelList.value = res.data.data
  loading.value = false
}
```

## 文章分类添加编辑 [element-plus 弹层]

### 点击显示弹层

1. 准备弹层

```jsx
const dialogVisible = ref(false)

<el-dialog v-model="dialogVisible" title="添加弹层" width="30%">
  <div>我是内容部分</div>
  <template #footer>
    <span class="dialog-footer">
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary"> 确认 </el-button>
    </span>
  </template>
</el-dialog>
```

1. 点击事件

```jsx
<template #extra><el-button type="primary" @click="onAddChannel">添加分类</el-button></template>

const onAddChannel = () => {
  dialogVisible.value = true
}
```

### 封装弹层组件 ChannelEdit

添加 和 编辑，可以共用一个弹层，所以可以将弹层封装成一个组件

组件对外暴露一个方法 open,  基于 open 的参数，初始化表单数据，并判断区分是添加 还是 编辑

1. open({ })                   =>  添加操作，添加表单初始化无数据
2. open({ id: xx,  ...  })  =>  编辑操作，编辑表单初始化需回显

具体实现：

1. 封装组件 `article/components/ChannelEdit.vue`

```jsx
<script setup>
import { ref } from 'vue'
const dialogVisible = ref(false)

const open = async (row) => {
  dialogVisible.value = true
  console.log(row)
}

defineExpose({
  open
})
</script>

<template>
  <el-dialog v-model="dialogVisible" title="添加弹层" width="30%">
    <div>我是内容部分</div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary"> 确认 </el-button>
      </span>
    </template>
  </el-dialog>
</template>
```

1. 通过 ref 绑定

```jsx
const dialog = ref()

<!-- 弹窗 -->
<channel-edit ref="dialog"></channel-edit>
```

1. 点击调用方法显示弹窗

```jsx
const onAddChannel = () => {
  dialog.value.open({})
}
const onEditChannel = (row) => {
  dialog.value.open(row)
}
```



### 准备弹层表单

1. 准备数据 和 校验规则

```jsx
const formModel = ref({
  cate_name: '',
  cate_alias: ''
})
const rules = {
  cate_name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    {
      pattern: /^\S{1,10}$/,
      message: '分类名必须是1-10位的非空字符',
      trigger: 'blur'
    }
  ],
  cate_alias: [
    { required: true, message: '请输入分类别名', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z0-9]{1,15}$/,
      message: '分类别名必须是1-15位的字母数字',
      trigger: 'blur'
    }
  ]
}
```

1. 准备表单

```jsx
<el-form
  :model="formModel"
  :rules="rules"
  label-width="100px"
  style="padding-right: 30px"
>
  <el-form-item label="分类名称" prop="cate_name">
    <el-input
      v-model="formModel.cate_name"
      minlength="1"
      maxlength="10"
    ></el-input>
  </el-form-item>
  <el-form-item label="分类别名" prop="cate_alias">
    <el-input
      v-model="formModel.cate_alias"
      minlength="1"
      maxlength="15"
    ></el-input>
  </el-form-item>
</el-form>
```

1. 编辑需要回显，表单数据需要初始化

```jsx
const open = async (row) => {
  dialogVisible.value = true
  formModel.value = { ...row }
}
```

1. 基于传过来的表单数据，进行标题控制，有 id 的是编辑

```jsx
:title="formModel.id ? '编辑分类' : '添加分类'"
```



### 确认提交

1. `api/article.js  `  封装请求 API

```jsx
// 添加文章分类
export const artAddChannelService = (data) => request.post('/my/cate/add', data)
// 编辑文章分类
export const artEditChannelService = (data) =>
  request.put('/my/cate/info', data)
```

1. 页面中校验，判断，提交请求

```jsx
<el-form ref="formRef">
```

```jsx
const formRef = ref()
const onSubmit = async () => {
  await formRef.value.validate()
  formModel.value.id
    ? await artEditChannelService(formModel.value)
    : await artAddChannelService(formModel.value)
  ElMessage({
    type: 'success',
    message: formModel.value.id ? '编辑成功' : '添加成功'
  })
  dialogVisible.value = false
}
```

1. 通知父组件进行回显

```jsx
const emit = defineEmits(['success'])

const onSubmit = async () => {
  ...
  emit('success')
}
```

1. 父组件监听 success 事件，进行调用回显

```jsx
<channel-edit ref="dialog" @success="onSuccess"></channel-edit>

const onSuccess = () => {
  getChannelList()
}
```

# 文章管理页面 - [element-plus 强化]

## 文章列表渲染

### 基本架子搭建（表格）

- el-table表格
  - el-table-column->label标签名字 （prop数据名）或者（插槽，可获得给行的数据信息）

~~~html
<el-table :data="articleList" style="width: 100%">
  <el-table-column label="文章标题" width="400">
    <template #default="{ row }">
      <el-link type="primary" :underline="false">{{ row.title }}</el-link>
    </template>
  </el-table-column>
  <el-table-column label="分类" prop="cate_name"></el-table-column>
  <el-table-column label="发表时间" prop="pub_date"> </el-table-column>
  <el-table-column label="状态" prop="state"></el-table-column>
 </el-table-column>
~~~

### 中英国际化处理

默认是英文的，由于这里不涉及切换， 所以在 App.vue 中直接导入设置成中文即可，

```jsx
<script setup>
import zh from 'element-plus/es/locale/lang/zh-cn.mjs'
</script>

<template>
  <!-- 国际化处理 -->
  <el-config-provider :locale="zh">
    <router-view />
  </el-config-provider>
</template>
```

### 文章分类选择

为了便于维护，直接拆分成一个小组件 ChannelSelect.vue

1. 新建 article/components/ChannelSelect.vue

```jsx
<template>
  <el-select>
    <el-option label="新闻" value="新闻"></el-option>
    <el-option label="体育" value="体育"></el-option>
  </el-select>
</template>
```

1. 页面中导入渲染

```vue
import ChannelSelect from './components/ChannelSelect.vue'

<el-form-item label="文章分类：">
  <channel-select></channel-select>
</el-form-item>
```

1. 调用接口，动态渲染下拉分类，设计成 v-model 的使用方式

```jsx
<script setup>
import { artGetChannelsService } from '@/api/article'
import { ref } from 'vue'

defineProps({
  modelValue: {
    type: [Number, String]
  }
})

const emit = defineEmits(['update:modelValue'])
const channelList = ref([])
const getChannelList = async () => {
  const res = await artGetChannelsService()
  channelList.value = res.data.data
}
getChannelList()
</script>
<template>
  <el-select
    :modelValue="modelValue"
    @update:modelValue="emit('update:modelValue', $event)"
  >
    <el-option
      v-for="channel in channelList"
      :key="channel.id"
      :label="channel.cate_name"
      :value="channel.id"
    ></el-option>
  </el-select>
</template>
```

1. 父组件定义参数绑定

```jsx
const params = ref({
  pagenum: 1,
  pagesize: 5,
  cate_id: '',
  state: ''
})

<channel-select v-model="params.cate_id"></channel-select>
```

1. 发布状态，也绑定一下，便于将来提交表单

```jsx
<el-select v-model="params.state">
  <el-option label="已发布" value="已发布"></el-option>
  <el-option label="草稿" value="草稿"></el-option>
</el-select>
```

### 分页渲染 [element-plus 分页]

1. 分页组件

```jsx
<el-pagination
  v-model:current-page="params.pagenum"
  v-model:page-size="params.pagesize"
  :page-sizes="[2, 3, 4, 5, 10]"
  layout="jumper, total, sizes, prev, pager, next"
  background
  :total="total"
  @size-change="onSizeChange"
  @current-change="onCurrentChange"
  style="margin-top: 20px; justify-content: flex-end"
/>
```

1. 提供分页修改逻辑

```jsx
const onSizeChange = (size) => {
  params.value.pagenum = 1
  params.value.pagesize = size
  getArticleList()
}
const onCurrentChange = (page) => {
  params.value.pagenum = page
  getArticleList()
}
```

### 搜索和设置

1. 注册事件

```jsx
<el-form-item>
  <el-button @click="onSearch" type="primary">搜索</el-button>
  <el-button @click="onReset">重置</el-button>
</el-form-item>
```

1. 绑定处理

```jsx
const onSearch = () => {
  params.value.pagenum = 1
  getArticleList()
}

const onReset = () => {
  params.value.pagenum = 1
  params.value.cate_id = ''
  params.value.state = ''
  getArticleList()
}
```

## 文章发布&修改[element-plus - 抽屉]

### 封装抽屉容器

添加 和 编辑，可以共用一个抽屉，所以可以将抽屉封装成一个组件

组件对外暴露一个方法 open,  基于 open 的参数，初始化表单数据，并判断区分是添加 还是 编辑

1. open({ })                   =>  添加操作，添加表单初始化无数据
2. open({ id: xx,  ...  })  =>  编辑操作，编辑表单初始化需回显

具体实现：

1. 封装组件 `article/components/ArticleEdit.vue`

```jsx
<script setup>
import { ref } from 'vue'
const visibleDrawer = ref(false)

const open = (row) => {
  visibleDrawer.value = true
  console.log(row)
}

defineExpose({
  open
})
</script>

<template>
  <!-- 抽屉 -->
  <el-drawer v-model="visibleDrawer" title="大标题" direction="rtl" size="50%">
    <span>Hi there!</span>
  </el-drawer>
</template>
```

1. 通过 ref 绑定

```jsx
const articleEditRef = ref()

<!-- 弹窗 -->
<article-edit ref="articleEditRef"></article-edit>
```

1. 点击调用方法显示弹窗

```jsx
// 编辑新增逻辑
const onAddArticle = () => {
  articleEditRef.value.open({})
}
const onEditArticle = (row) => {
  articleEditRef.value.open(row)
}
```

### 上传文件 [element-plus - 文件预览]

1. 关闭自动上传，准备结构

```jsx
import { Plus } from '@element-plus/icons-vue'

<el-upload
  class="avatar-uploader"
  :auto-upload="false"
  :show-file-list="false"
  :on-change="onUploadFile"
>
  <img v-if="imgUrl" :src="imgUrl" class="avatar" />
  <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
</el-upload>
```

1. 准备数据 和 选择图片的处理逻辑

```jsx
const imgUrl = ref('')
const onUploadFile = (uploadFile) => {
  imgUrl.value = URL.createObjectURL(uploadFile.raw)
  formModel.value.cover_img = uploadFile.raw
}
```

### 富文本编辑器 [ vue-quill ]

官网地址：https://vueup.github.io/vue-quill/

1. 安装包

```js
pnpm add @vueup/vue-quill@latest
```

1. 注册成局部组件

```jsx
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
```

1. 页面中使用绑定

```jsx
<div class="editor">
  <quill-editor
    theme="snow"
    v-model:content="formModel.content"
    contentType="html"
  >
  </quill-editor>
</div>
```

1. 样式美化

```jsx
.editor {
  width: 100%;
  :deep(.ql-editor) {
    min-height: 200px;
  }
}
```

