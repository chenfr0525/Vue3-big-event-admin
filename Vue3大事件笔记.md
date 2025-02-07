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

