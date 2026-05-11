const CLOUD_IMAGE_FILE_ID = 'cloud://cloudbase-d4g76knyn75980384.636c-cloudbase-d4g76knyn75980384-1429293424/star-action/正面形象.jpg'

Page({
  data: {
    cloudFileId: CLOUD_IMAGE_FILE_ID,
    tempImageUrl: '',
    statusType: 'idle',
    statusText: '准备测试',
    debugText: '点击按钮，或进入页面后自动测试。',
  },

  onLoad() {
    this.testCloudImage()
  },

  testCloudImage() {
    if (!wx.cloud) {
      this.setData({
        tempImageUrl: '',
        statusType: 'error',
        statusText: '当前环境没有 wx.cloud',
        debugText: '请确认 app.ts 已初始化云开发，并在微信开发者工具中启用云开发。',
      })
      return
    }

    this.setData({
      tempImageUrl: '',
      statusType: 'loading',
      statusText: '正在获取临时 URL...',
      debugText: 'wx.cloud.getTempFileURL 请求中。',
    })

    wx.cloud.getTempFileURL({
      fileList: [CLOUD_IMAGE_FILE_ID],
      success: (res) => {
        const file = res.fileList && res.fileList[0]
        const tempFileURL = file && file.tempFileURL ? file.tempFileURL : ''

        this.setData({
          tempImageUrl: tempFileURL,
          statusType: tempFileURL ? 'success' : 'error',
          statusText: tempFileURL ? '已拿到临时 URL，等待图片加载' : '没有拿到临时 URL',
          debugText: JSON.stringify(res.fileList || res, null, 2),
        })
      },
      fail: (err) => {
        this.setData({
          tempImageUrl: '',
          statusType: 'error',
          statusText: '获取临时 URL 失败',
          debugText: JSON.stringify(err, null, 2),
        })
      },
    })
  },

  onImageLoad() {
    this.setData({
      statusType: 'success',
      statusText: '图片已成功显示',
    })
  },

  onImageError(e) {
    this.setData({
      statusType: 'error',
      statusText: '临时 URL 已拿到，但 image 加载失败',
      debugText: JSON.stringify((e && e.detail) || e, null, 2),
    })
  },
})
