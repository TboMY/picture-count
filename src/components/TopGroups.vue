<script>
import { DEFAULT_DPI, MISTAKE, PAPER_LEN, PAPER_OPTIONS } from '../constant'
import { throttle } from '../utils'

export default {
  name: 'TopGroups',
  computed: {
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
        this.$message.error('请输入图片文件夹路径')
        return
      }

      // if (!this.defaultDpi) {
      //   this.$message.error('固定DPI值必填,请设置固定DPI值')
      //   return
      // }

      if (!this.len.a4 || !this.len.a3 || !this.len.a2 || !this.len.a1 || !this.len.a0) {
        this.$message.error('请设置A4-A0长度值')
        return
      }

      // 判断大小顺序是否正确
      if (!(this.len.a4 < this.len.a3 && this.len.a3 < this.len.a2 && this.len.a2 < this.len.a1 && this.len.a1 <
          this.len.a0)) {
        this.$message.error('请确保A4-A0长度值递增')
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
    this.throttleSelectFolder = throttle(this.selectFolder,1000)
  }
}
</script>

<template>
  <div class="top-container">
    <!-- 第一行：文件夹选择和DPI设置 -->
    <div class="form-row">
      <!-- 文件夹选择 -->
      <div class="form-item">
        <label class="form-label">图片文件夹:</label>
        <el-input
            v-model="input"
            placeholder="请输入文件夹路径"
            size="small"
            style="width: 200px"
        />
        <el-button
            type="primary"
            @click="throttleSelectFolder"
            size="small"
        >选择文件夹
        </el-button>
      </div>

      <!-- 默认DPI设置 -->
      <div class="form-item">
        <label class="form-label">默认DPI:</label>
        <el-input-number
            v-model.number="defaultDpi"
            placeholder="默认DPI值"
            :min="DEFAULT_DPI.min"
            :max="DEFAULT_DPI.max"
            :step="DEFAULT_DPI.step"
            :precision="0"
            controls-position="right"
            size="small"
            style="width: 120px"
        />
      </div>

      <!-- 误差范围 -->
      <div class="form-item">
        <label class="form-label">误差范围(mm):</label>
        <el-input-number
            v-model.number="mistake"
            placeholder="误差范围"
            :precision="MISTAKE.precision"
            :min="MISTAKE.min"
            :max="MISTAKE.max"
            :step="MISTAKE.step"
            controls-position="right"
            size="small"
            style="width: 120px"/>
      </div>

      <el-button type="primary" size="small" @click="throttleSubmit"> 开 始</el-button>
    </div>

    <!-- 第二行：A4-A0长度设置 -->
    <div class="form-row">

      <div class="form-item">
        <label class="form-label">A4长度(mm):</label>
        <el-input-number
            v-model.number="len.a4"
            placeholder="A4长度"
            :precision="PAPER_OPTIONS.precision"
            :min="PAPER_OPTIONS.min"
            :max="PAPER_OPTIONS.max"
            :step="PAPER_OPTIONS.step"
            controls-position="right"
            size="small"
            style="width: 120px"/>
      </div>

      <div class="form-item">
        <label class="form-label">A3长度(mm):</label>
        <el-input-number
            v-model.number="len.a3"
            placeholder="A3长度"
            :precision="PAPER_OPTIONS.precision"
            :min="PAPER_OPTIONS.min"
            :max="PAPER_OPTIONS.max"
            :step="PAPER_OPTIONS.step"
            controls-position="right"
            size="small"
            style="width: 120px"/>
      </div>

      <div class="form-item">
        <label class="form-label">A2长度(mm):</label>
        <el-input-number
            v-model.number="len.a2"
            placeholder="A2长度"
            :precision="PAPER_OPTIONS.precision"
            :min="PAPER_OPTIONS.min"
            :max="PAPER_OPTIONS.max"
            :step="PAPER_OPTIONS.step"
            controls-position="right"
            size="small"
            style="width: 120px"/>
      </div>

      <div class="form-item">
        <label class="form-label">A1长度(mm):</label>
        <el-input-number
            v-model.number="len.a1"
            placeholder="A1长度"
            :precision="PAPER_OPTIONS.precision"
            :min="PAPER_OPTIONS.min"
            :max="PAPER_OPTIONS.max"
            :step="PAPER_OPTIONS.step"
            controls-position="right"
            size="small"
            style="width: 120px"/>
      </div>

      <div class="form-item">
        <label class="form-label">A0长度(mm):</label>
        <el-input-number
            v-model.number="len.a0"
            placeholder="A0长度"
            :precision="PAPER_OPTIONS.precision"
            :min="PAPER_OPTIONS.min"
            :max="PAPER_OPTIONS.max"
            :step="PAPER_OPTIONS.step"
            controls-position="right"
            size="small"
            style="width: 120px"/>
      </div>
    </div>
  </div>
</template>

<style scoped>
.top-container {
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: nowrap;
  justify-content: flex-start;
  overflow-x: auto;
  min-width: 0;
}

.form-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.form-label {
  font-size: 14px;
  color: #495057;
  font-weight: 500;
  width: 100px;
  box-sizing: border-box;
  padding-right: 10px;
  white-space: nowrap;
  text-align: right;
  flex-shrink: 0;
}

</style>