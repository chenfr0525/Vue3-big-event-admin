<script setup>
import { useUserStore } from './stores';
const userStore = useUserStore()
</script>

<template>
  <div>
    <hr>
    <RouterView></RouterView>

    <hr>
    <hr>
    我是App
    <el-button>点击</el-button>
    <el-button>退出</el-button>
    <hr>
    <p>{{ userStore.token }}</p>
    <el-button @click="userStore.setToken('Ruby')">登录</el-button>
    <el-button @click="userStore.removeToken()">退出</el-button>
  </div>
</template>

<style scoped></style>
