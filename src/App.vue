<template>
  <div id="app">
    <el-container style="height: 100vh;">
      <el-header>
        <h2>🖼️ Picture Count (Win7 Compatible)</h2>
      </el-header>
      <el-main>
        <el-card>
          <el-button type="primary" @click="showMessage">
            测试按钮（Win7 安全）
          </el-button>
          <p style="margin-top: 20px;">✅ Vue 2 + Element UI + Electron 11</p>
        </el-card>
      </el-main>
    </el-container>
  </div>
</template>

<script>
export default {
  name: 'App',
  methods: {
    showMessage () {
      this.$message.success('Hello from Windows 7!')
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>