<template>
  <el-container style="height: 100%;" v-loading="isScanning">
    <!-- 顶部标题 -->
    <el-header style="height: auto">
      <Title/>
      <TopGroups
          @analyze="analyze"
      />
    </el-header>

    <!-- 主内容区 -->
    <el-main>
      <!-- 未选择文件夹 -->
      <div v-if="!folderPath" class="empty">
        <i class="el-icon-document" style="font-size: 100px; color: #909399;"></i>
        <p style="margin-top: 20px; color: #606266; font-size: 20px">请选择文件夹</p>
      </div>

      <div v-else>
        <!-- 按文件夹分组的详细列表 -->
        <el-card shadow="never" style="width: 100%">
          <div slot="header">
            <span>按文件夹统计结果</span>
            <el-button type="primary" style="float: right;" size="mini" @click="exportResults">导出结果</el-button>
          </div>
          <el-table :data="tableData" border stripe style="width: 100%" table-layout="fixed" :height="600">
            <el-table-column type="index" label="序号" width="60px" align="center">
              <template slot-scope="scope">
                  <span :class="{ 'total-row': scope.row.folderPath === '合计' }">
                    {{ scope.$index + 1 }}
                  </span>
              </template>
            </el-table-column>
            <el-table-column prop="folderPath" min-width="400px" label="图像路径" align="center" show-overflow-tooltip>
              <template slot-scope="scope">
                  <span :class="{ 'total-row': scope.row.folderPath === '合计' }">
<!--                    {{ scope.row.folderPath === '合计' ? '合计' : '..\\' + scope.row.folderPath }}-->
                    {{ scope.row.folderPath }}
                  </span>
              </template>
            </el-table-column>
            <el-table-column prop="a4" label="A4页" min-width="150px" align="center">
              <template slot-scope="scope">
                  <span :class="{ 'total-row': scope.row.folderPath === '合计' }">
                    {{ scope.row.a4 }}
                  </span>
              </template>
            </el-table-column>
            <el-table-column prop="a3" label="A3页" min-width="150px" align="center">
              <template slot-scope="scope">
                  <span :class="{ 'total-row': scope.row.folderPath === '合计' }">
                    {{ scope.row.a3 }}
                  </span>
              </template>
            </el-table-column>
            <el-table-column prop="a2" label="A2页" min-width="150px" align="center">
              <template slot-scope="scope">
                  <span :class="{ 'total-row': scope.row.folderPath === '合计' }">
                    {{ scope.row.a2 }}
                  </span>
              </template>
            </el-table-column>
            <el-table-column prop="a1" label="A1页" min-width="150px" align="center">
              <template slot-scope="scope">
                  <span :class="{ 'total-row': scope.row.folderPath === '合计' }">
                    {{ scope.row.a1 }}
                  </span>
              </template>
            </el-table-column>
            <el-table-column prop="a0" label="A0页" min-width="150px" align="center">
              <template slot-scope="scope">
                  <span :class="{ 'total-row': scope.row.folderPath === '合计' }">
                    {{ scope.row.a0 }}
                  </span>
              </template>
            </el-table-column>
            <el-table-column prop="totalA4Equivalent" label="折算A4页" min-width="150px" align="center">
              <template slot-scope="scope">
                  <span :class="{ 'total-row': scope.row.folderPath === '合计' }">
                    {{ scope.row.totalA4Equivalent }}
                  </span>
              </template>
            </el-table-column>
            <el-table-column prop="totalImages" label="图像数量" min-width="150px" align="center">
              <template slot-scope="scope">
                  <span :class="{ 'total-row': scope.row.folderPath === '合计' }">
                    {{ scope.row.totalImages }}
                  </span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>
    </el-main>
  </el-container>
</template>

<script>
import Title from './components/Title.vue'
import TopGroups from './components/TopGroups.vue'

export default {
  name: 'App',
  components: { TopGroups, Title },

  data () {
    return {
      folderPath: '',
      isScanning: false,
      scanProgress: 0,
      currentFile: '',
      scanStatus: '',
      tableData: [],
      totalFiles: 0,
      processedFiles: 0
    }
  },
  computed: {
    totalImages () {
      const totalRow = this.tableData.find(folder => folder.folderPath === '合计')
      return totalRow ? totalRow.totalImages : 0
    },
    totalA4Equivalent () {
      const totalRow = this.tableData.find(folder => folder.folderPath === '合计')
      return totalRow ? totalRow.totalA4Equivalent.toFixed(2) : '0.00'
    },
    folderCount () {
      const set = new Set()
      for (let i = 0; i < this.tableData.length - 1; i++) {
        set.add(this.tableData[i].folderPath)
      }
      return set.size
    },
    totalFolders () {
      return this.tableData.filter(folder => folder.folderPath !== '合计').length
    }
  },
  methods: {
    async analyze ( form ) {
      const { folderPath } = form

      this.folderPath = folderPath
      this.isScanning = true
      this.scanProgress = 0
      this.currentFile = ''
      this.tableData = []
      this.processedFiles = 0
      this.totalFiles = 0

      try {
        // 设置进度监听
        window.electronAPI.onScanProgress(( progressData ) => {
          this.processedFiles = progressData.processed
          this.totalFiles = progressData.total
          this.currentFile = progressData.currentFile
          this.scanProgress = Math.round((progressData.processed / progressData.total) * 100)
        })

        // 开始分析
        const result = await window.electronAPI.analyzeImages(folderPath, form)
        this.tableData = result

        const totalRow = result.find(folder => folder.folderPath === '合计')
        this.$message.success(
            `扫描完成！共处理 ${ totalRow ? totalRow.totalImages : 0 } 个文件，${ result.length - 1 } 个文件夹`)

      } catch (error) {
        console.error('分析失败:', error)
        this.$message.error('分析失败: ' + error.message)
      } finally {
        this.isScanning = false
        this.scanStatus = 'success'
        // 清理进度监听
        window.electronAPI.removeScanProgressListener()
      }
    },
    async exportResults () {
      if (this.tableData.length === 0) {
        this.$message.warning('暂无数据可导出!')
        return
      }
      try {
        const resp = await window.electronAPI.exportResults(this.tableData)
        if (resp.success) {
          this.$message.success(resp.message, { duration: 3000 })
        } else {
          this.$message.error(resp.message, { duration: 3000 })
        }
      } catch (e) {
        this.$message.error(e)
      }
    },
    getStatusType ( paperType ) {
      switch (paperType) {
        case 'Error':
          return 'danger'
        case 'Unknown':
          return 'warning'
        default:
          return 'success'
      }
    },
    getStatusText ( paperType ) {
      switch (paperType) {
        case 'Error':
          return '错误'
        case 'Unknown':
          return '需确认'
        default:
          return '已识别'
      }
    }
  }
}
</script>

<style>

body, html {
  margin: 0;
  padding: 0;
  height: 100%;
  background-color: #f5f7fa;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f5f7fa;
}

.empty {
  padding-top: 100px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
}

.stat-label {
  color: #606266;
  margin-top: 4px;
}

.has-dpi {
  color: #67C23A;
  font-weight: bold;
}

.total-row {
  font-weight: bold;
  color: #409EFF;
}
</style>