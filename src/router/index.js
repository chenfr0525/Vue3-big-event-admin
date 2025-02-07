import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path:'/login',
      component:()=>import('@/views/login/LoginPage.vue')//登录页
    },
    {
      path:'/',
      component:()=>import('@/views/layout/LayoutContainer.vue'),
      redirect:'/article/manage',
      children:[
        {
          path:'/article/manage',
          component:()=>import('@/views/article/ArticleManage.vue')
        },
        {
          path:'/article/channel',
          component:()=>import('@/views/article/ArticleChannel.vue')
        },
        {
          path:'/article/profile',
          component:()=>import('@/views/user/UserProfile.vue')
        },
        {
          path:'/article/avatar',
          component:()=>import('@/views/user/UserAvatar.vue')
        },
        {
          path:'/article/password',
          component:()=>import('@/views/user/UserPassword.vue')
        }
      ]
    }
  ],
})

export default router
