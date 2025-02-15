<script setup>
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
</script>

<template>
  <div>
    <el-config-provider :locale="zhCn">
      <RouterView></RouterView>
    </el-config-provider>
  </div>
</template>

<style scoped></style>
