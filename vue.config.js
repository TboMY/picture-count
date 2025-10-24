// vue.config.js
module.exports = {
  publicPath: './',          // ← 关键！使用相对路径
  outputDir: 'dist',
  transpileDependencies: ['element-ui'],
  pwa: {
    disable: true
  }
}