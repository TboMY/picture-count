<script>
import { DEFAULT_DPI, MISTAKE, PAPER_LEN, PAPER_OPTIONS, thanZeroName } from '../constant'
import { throttle } from '../utils'

export default {
  name: 'TopGroups',
  computed: {
     thanZeroName(){
      return thanZeroName
    },
    MISTAKE () {
      return MISTAKE
    },
    PAPER_OPTIONS () {
      return PAPER_OPTIONS
    },
    DEFAULT_DPI () {
      return DEFAULT_DPI
    }
  },
  data () {
    return {
      input: '',
      defaultDpi: DEFAULT_DPI.value,
      len: { ...PAPER_LEN },
      mistake: 1
    }
  },
  emits: [ 'analyze' ],
  methods: {
    async selectFolder () {
      // 调用 Electron 主进程选择文件夹
      let folder = await window.electronAPI.selectFolder()
      if (folder) {
        console.log(folder)
        folder = folder.trim()
        this.input = folder
      }
    },
    submit () {
      // 校验
      if (!this.input) {
        this.$message.error('请输入图片文件夹路径!')
        return
      }

      // if (!this.defaultDpi) {
      //   this.$message.error('固定DPI值必填,请设置固定DPI值')
      //   return
      // }

      if (!this.len.a4 || !this.len.a3 || !this.len.a2 || !this.len.a1 || !this.len.a0) {
        this.$message.error('请设置A4-A0长度值!')
        return
      }

      // 判断大小顺序是否正确
      if (!(this.len.a4 < this.len.a3 && this.len.a3 < this.len.a2 && this.len.a2 < this.len.a1 && this.len.a1 <
          this.len.a0)) {
        this.$message.error('请确保A4-A0长度值递增!')
        return
      }

      const params = {
        folderPath: this.input.trim(),
        defaultDpi: this.defaultDpi,
        len: { ...this.len },
        mistake: this.mistake
      }

      this.$emit('analyze', params)

      // console.log('默认DPI:', this.defaultDpi)
    }

  },
  created () {
    this.throttleSubmit = throttle(this.submit, 1000)
    this.throttleSelectFolder = throttle(this.selectFolder, 1000)
  }
}
</script>

<template>
  <div class="top-container">
    <!-- 顶部区域改为 3x3 grid：第一行 文件夹/DPI/误差；第二行 A4/A3/A2；第三行 A1/A0/A0⁺ -->
    <div class="top-grid">
      <!-- 行1：文件夹选择 -->
      <div class="grid-item">
        <label class="form-label">图片文件夹:</label>
        <div class="folder-group">
          <el-input
              v-model="input"
              placeholder="请输入文件夹路径"
              size="small"
              style="width: 120px"
              class="folder-group-item"
          />
          <el-button
              type="primary"
              @click="throttleSelectFolder"
              size="small"
              style="flex: 0 1 auto"
          >选择文件夹
          </el-button>
        </div>
      </div>

      <!-- 行1：默认DPI -->
      <div class="grid-item">
        <label class="form-label">默认DPI:</label>
        <el-input-number
            v-model.number="defaultDpi"
            placeholder="默认DPI值"
            :min="DEFAULT_DPI.min"
            :max="DEFAULT_DPI.max"
            :step="DEFAULT_DPI.step"
            :precision="0"
            size="small"
            style="min-width: var(--number-control-width)"/>
      </div>

      <!-- 行1：误差范围 -->
      <div class="grid-item">
        <label class="form-label">误差范围(mm):</label>
        <el-input-number
            v-model.number="mistake"
            placeholder="误差范围"
            :precision="MISTAKE.precision"
            :min="MISTAKE.min"
            :max="MISTAKE.max"
            :step="MISTAKE.step"
            size="small"
            style="min-width: var(--number-control-width)"/>
      </div>

      <!-- 行2：A4 -->
      <div class="grid-item">
        <label class="form-label">A4最长边长度(mm):</label>
        <el-input-number
            v-model.number="len.a4"
            placeholder="A4最长边长度"
            :precision="PAPER_OPTIONS.precision"
            :min="PAPER_OPTIONS.min"
            :max="PAPER_OPTIONS.max"
            :step="PAPER_OPTIONS.step"
            size="small"
            style="min-width: var(--number-control-width)"/>
      </div>

      <!-- 行2：A3 -->
      <div class="grid-item">
        <label class="form-label">A3最长边长度(mm):</label>
        <el-input-number
            v-model.number="len.a3"
            placeholder="A3最长边长度"
            :precision="PAPER_OPTIONS.precision"
            :min="PAPER_OPTIONS.min"
            :max="PAPER_OPTIONS.max"
            :step="PAPER_OPTIONS.step"
            size="small"
            style="min-width: var(--number-control-width)"/>
      </div>

      <!-- 行2：A2 -->
      <div class="grid-item">
        <label class="form-label">A2最长边长度(mm):</label>
        <el-input-number
            v-model.number="len.a2"
            placeholder="A2最长边长度"
            :precision="PAPER_OPTIONS.precision"
            :min="PAPER_OPTIONS.min"
            :max="PAPER_OPTIONS.max"
            :step="PAPER_OPTIONS.step"
            size="small"
            style="min-width: var(--number-control-width)"/>
      </div>

      <!-- 行3：A1 -->
      <div class="grid-item">
        <label class="form-label">A1最长边长度(mm):</label>
        <el-input-number
            v-model.number="len.a1"
            placeholder="A1最长边长度"
            :precision="PAPER_OPTIONS.precision"
            :min="PAPER_OPTIONS.min"
            :max="PAPER_OPTIONS.max"
            :step="PAPER_OPTIONS.step"
            size="small"
            style="min-width: var(--number-control-width)"/>
      </div>

      <!-- 行3：A0 -->
      <div class="grid-item">
        <label class="form-label">A0最长边长度(mm):</label>
        <el-input-number
            v-model.number="len.a0"
            placeholder="A0最长边长度"
            :precision="PAPER_OPTIONS.precision"
            :min="PAPER_OPTIONS.min"
            :max="PAPER_OPTIONS.max"
            :step="PAPER_OPTIONS.step"
            size="small"
            style="min-width: var(--number-control-width)"/>
      </div>

      <!-- 行3：A0⁺ 纯展示,不会有任何结果,不参与计算-->
      <div class="grid-item">
        <label class="form-label">A0⁺最长边长度(mm):</label>
        <el-input-number
            v-model.number="len[thanZeroName]"
            placeholder="A0⁺最长边长度"
            :precision="PAPER_OPTIONS.precision"
            :min="PAPER_OPTIONS.min"
            :step="PAPER_OPTIONS.step"
            size="small"
            style="width: var(--number-control-width);"/>
      </div>
    </div>

    <el-button type="primary" size="small" @click="throttleSubmit"> 开 始</el-button>
  </div>
</template>

<style scoped>
.top-container {
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 30px;
  --grid-item-label-control-gap: 10px;
  --input-button-gap: 10px;
  --number-control-width: 120px;
}

/* 顶部三行三列网格布局 */
.top-grid {
  //padding-right: 60px;
  display: grid;
  grid-template-columns: repeat(3, minmax(300px, 1fr));
  grid-auto-rows: minmax(32px, auto);
  gap: 12px 40px;
  flex: 1 1 auto;
  overflow-x: auto;
  overflow-y: hidden;
}

.grid-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.top-container .grid-item :deep(.el-input-number){
  flex: 1 0 auto;
}

.folder-group {
  box-sizing: border-box;
  width: var(--number-control-width);
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  flex: 1 0 auto;
}

.top-container .folder-group :deep(.folder-group-item){
  flex: 1 1 auto;
}


.form-label {
  font-size: 13px;
  color: #495057;
  font-weight: 500;
  width: 120px;
  box-sizing: border-box;
  //padding-right: 10px;
  white-space: nowrap;
  text-align: right;
  flex: 0 0 auto;
}

</style>