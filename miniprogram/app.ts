// app.ts
App<IAppOption>({
  globalData: {},
  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({
        env: 'cloudbase-d4g76knyn75980384',
        traceUser: true,
      })
    }

    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    wx.login({
      success: (res) => {
        console.log(res.code)
      },
    })
  },
})
