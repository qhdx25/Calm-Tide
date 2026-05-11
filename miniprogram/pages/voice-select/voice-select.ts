type ThemeId = 'forest' | 'ocean' | 'universe' | 'temple'
type GenderOption = 'male' | 'female' | ''
type AgeOption = 'young' | 'mature' | ''

const themeTitleMap: Record<ThemeId, string> = {
  forest: '森林',
  ocean: '海洋',
  universe: '宇宙',
  temple: '古寺',
}

Page({
  data: {
    themeId: 'forest',
    themeTitle: '森林',
    gender: '' as GenderOption,
    age: '' as AgeOption,
    isSubmitting: false,
    genderOptions: [
      { id: 'male', label: '男' },
      { id: 'female', label: '女' },
    ],
    ageOptions: [
      { id: 'young', label: '年轻' },
      { id: 'mature', label: '成熟' },
    ],
  },

  onLoad(query: Record<string, string | undefined>) {
    const theme = (query.theme || 'forest') as ThemeId
    const safeTheme = themeTitleMap[theme] ? theme : 'forest'
    this.setData({
      themeId: safeTheme,
      themeTitle: themeTitleMap[safeTheme],
    })
  },

  onSelectGender(e: WechatMiniprogram.CustomEvent) {
    const { value } = e.currentTarget.dataset
    if (!value) return
    this.setData({ gender: value as GenderOption })
  },

  onSelectAge(e: WechatMiniprogram.CustomEvent) {
    const { value } = e.currentTarget.dataset
    if (!value) return
    this.setData({ age: value as AgeOption })
  },

  onConfirm() {
    const { gender, age, themeId, isSubmitting } = this.data
    if (!gender || !age || isSubmitting) return

    this.setData({ isSubmitting: true })

    wx.setStorageSync('voice_profile', {
      theme: themeId,
      gender,
      age,
    })

    setTimeout(() => {
      wx.redirectTo({
        url: `/pages/main/main?theme=${themeId}`,
        complete: () => {
          this.setData({ isSubmitting: false })
        },
      })
    }, 160)
  },
})
