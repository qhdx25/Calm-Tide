Component({
  data: {
    isNavigating: false,
    selectedThemeId: 'forest',
    selectedThemeTitle: 'Forest',
    themes: [
      {
        id: 'forest',
        eyebrow: 'GREEN CALM',
        title: 'Forest',
        desc: 'Misty hills and quiet trees',
      },
      {
        id: 'ocean',
        eyebrow: 'BLUE TIDE',
        title: 'Ocean',
        desc: 'Moonlit waves and salt breeze',
      },
      {
        id: 'universe',
        eyebrow: 'STAR FIELD',
        title: 'Universe',
        desc: 'Planets, dust, and deep space',
      },
      {
        id: 'temple',
        eyebrow: 'ANCIENT STILL',
        title: 'Temple',
        desc: 'Warm dusk and mountain silence',
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
