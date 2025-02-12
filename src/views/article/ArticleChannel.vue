<script setup lang="ts">
import { Edit, Delete } from '@element-plus/icons-vue';
import { artDelChannelService, articleGetChannelService } from '@/api/article';
import PageContainer from '@/components/PageContainer.vue';
import ChannelEdit from './components/ChannelEdit.vue';
import { ref } from 'vue'
const channelList = ref([])
const loading = ref(true)
const dialog = ref()

const getChannelList = async () => {
  const res = await articleGetChannelService()
  loading.value = false
  channelList.value = res.data.data
}
getChannelList()

const onEditChannel = (row) => {
  dialog.value.open(row)
}

const onDelChannel = async (row) => {
  await ElMessageBox.confirm('你确认要删除该分类吗', '温馨提示', {
    type: 'warning',
    confirmButtonText: '确认',
    cancelButtonText: '取消'
  })
  await artDelChannelService(row.id)
  ElMessage.success('删除成功')
  getChannelList()
}
const onAddChannel = () => {
  dialog.value.open({})
}
const onSuccess = () => {
  getChannelList()
}
</script>

<template>
  <PageContainer title="文章分类">
    <template #extra>
      <el-button type="primary" @click="onAddChannel">
        添加分类
      </el-button>
    </template>
    <el-table v-loading="loading" :data="channelList" style="width: 100%;">
      <el-table-column label="序号" width="100" type="index"></el-table-column>
      <el-table-column prop="cate_name" label="分类名称"></el-table-column>
      <el-table-column prop="cate_alias" label="分类别名"></el-table-column>
      <el-table-column label="操作" width="150">
        <!-- row就是channelList的一项,$index下标 -->
        <template #default="{ row, $index }">
          <el-button plain type="primary" :icon="Edit" circle @click="onEditChannel(row)"></el-button>
          <el-button plain type="danger" :icon="Delete" circle @click="onDelChannel(row, $index)"></el-button>
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="没有数据"></el-empty>
      </template>
    </el-table>
    <ChannelEdit ref="dialog" @success="onSuccess"></ChannelEdit>
  </PageContainer>
</template>

<style lang="scss" scoped></style>