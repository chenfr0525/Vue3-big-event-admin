<script setup>
import { ref } from 'vue'
import { Delete, Edit } from '@element-plus/icons-vue';
import ChannelSelect from './components/ChannelSelect.vue';
import { artGetListService, artDeleteService } from '@/api/article';
import { formatTime } from '@/utils/format';
import ArticleEdit from './components/ArticleEdit.vue';
import { ElMessage } from 'element-plus';
const articleList = ref([])//文章列表
const total = ref(0)//文章总条数
const loading = ref(false)//loading状态
//定义请求参数对象
const params = ref({
  pagenum: 1,
  pagesize: 5,
  cate_id: '',
  state: ''
})

const getArticleList = async () => {
  loading.value = true
  const res = await artGetListService(params.value)
  articleList.value = res.data.data
  total.value = res.data.total
  loading.value = false
}

getArticleList()

//处理分页
const onSizeChange = size => {
  // console.log('当前每页条数数：', size);
  params.value.pagenum = 1
  params.value.pagesize = size
  //刷新数据
  getArticleList()
}
const onCurrentChange = page => {
  // console.log('页码变化了', page);
  params.value.pagenum = page
  //刷新数据
  getArticleList()
}

//搜索=>按照最新的条件重新检索，从第一页进行展示
const onSearch = () => {
  params.value.pagenum = 1//重置页面
  getArticleList()
}

//重置
const onReset = () => {
  params.value.pagenum = 1
  params.value.cate_id = ''
  params.value.state = ''
  getArticleList()
}

//添加文章
const articleEditRef = ref()
const onAddArticle = () => {
  articleEditRef.value.open({})
}

//编辑
const onEditArticle = (row) => {
  articleEditRef.value.open(row)
}
//删除
const onDeleteArticle = async (row) => {
  await ElMessageBox.confirm('你确认删除该文章信息吗？', '温馨提示', {
    type: 'warning',
    confirmButtonText: '确认',
    cancelButtonText: '取消'
  })
  await artDeleteService(row.id)
  ElMessage.success('删除成功！')
  getArticleList()
}

//添加或者编辑 成功的回调
const onSuccess = (type) => {
  if (type === 'add') {
    //如果是添加，最好是渲染最后一页
    const lastPage = Math.ceil((total.value + 1) / params.value.pagesize)
    //更新成最大页码数再渲染
    params.value.pagenum = lastPage
    getArticleList()
  } else {
    //如果是编辑，直接渲染当前这页
    getArticleList()
  }
}
</script>

<template>
  <page-container title="文章管理">
    <template #extra>
      <el-button type="primary" @click="onAddArticle">
        发布文章
      </el-button>
    </template>
    <!-- 表单区域 -->
    <el-form inline>
      <el-form-item label="文章分类:">
        <!-- Vue3 => v-model :modelValue 和 @update：modelValue 的简写 -->
        <ChannelSelect width="150px" v-model="params.cate_id"></ChannelSelect>
      </el-form-item>
      <el-form-item label="发布状态:">
        <el-select v-model="params.state" style="width: 150px;">
          <el-option label="已发布" value="已发布"></el-option>
          <el-option label="草稿" value="草稿"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="onSearch" type="primary">搜索</el-button>
        <el-button @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 表格区域 -->
    <el-table :data="articleList" v-loading="loading">
      <el-table-column label="文章标题" prop="title">
        <template #default="{ row }">
          <el-link type="primary" :underline="false">{{ row.title }}</el-link>
        </template>
      </el-table-column>
      <el-table-column label="分类" prop="cate_name"></el-table-column>
      <el-table-column label="发表时间" prop="pub_date">
        <template #default="{ row }">
          {{ formatTime(row.pub_date) }}
        </template>
      </el-table-column>
      <el-table-column label="状态" prop="state"></el-table-column>
      <el-table-column label="操作">
        <!-- 利用作用域插槽row可以获取当前行的数据 -->
        <template #default="{ row }">
          <el-button circle plain type="primary" :icon="Edit" @click="onEditArticle(row)"></el-button>
          <el-button circle plain type="danger" :icon="Delete" @click="onDeleteArticle(row)"></el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页区域 -->
    <el-pagination v-model:current-page="params.pagenum" v-model:page-size="params.pagesize" :page-sizes="[2, 3, 5, 10]"
      :background="true" layout="jumper,total, sizes, prev, pager, next" :total="total" @size-change="onSizeChange"
      @current-change="onCurrentChange" style="margin-top:20px ;" />
    <!-- 抽屉 -->
    <ArticleEdit ref="articleEditRef" @success="onSuccess"></ArticleEdit>
  </page-container>
</template>

<style lang="scss" scoped></style>