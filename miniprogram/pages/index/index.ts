Component({
  data: {
    isNavigating: false,
    selectedThemeId: 'forest',
    selectedThemeTitle: '森林',
    themes: [
      {
        id: 'forest',
        eyebrow: '绿意安定',
        title: '森林',
        desc: '薄雾、山丘与安静树影',
      },
      {
        id: 'ocean',
        eyebrow: '蓝色潮汐',
        title: '海洋',
        desc: '月光海浪与柔和海风',
      },
      {
        id: 'universe',
        eyebrow: '星河漫游',
        title: '宇宙',
        desc: '星尘、行星与深空漂浮感',
      },
      {
        id: 'temple',
        eyebrow: '古寺静心',
        title: '古寺',
        desc: '暖色黄昏与远山寂静',
      },
    ],
  },
  methods: {
    onSelectTheme(e: WechatMiniprogram.CustomEvent) {
      if (this.data.isNavigating) {
        return
      }

      const { themeId } = e.currentTarget.dataset
      const selectedTheme = this.data.themes.find((item) => item.id === themeId)

      if (!selectedTheme) {
        return
      }

      this.setData({
        isNavigating: true,
        selectedThemeId: selectedTheme.id,
        selectedThemeTitle: selectedTheme.title,
      })

      setTimeout(() => {
        wx.navigateTo({
          url: `/pages/voice-select/voice-select?theme=${selectedTheme.id}`,
          complete: () => {
            this.setData({ isNavigating: false })
          },
        })
      }, 180)
    },
  },
})
