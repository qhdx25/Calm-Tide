type ThemeId = 'forest' | 'ocean' | 'universe' | 'temple'

type MeditationTrack = {
  id: string
  name: string
  subtitle: string
  src: string
  playbackRate: number
}

const themeTitleMap: Record<ThemeId, string> = {
  forest: '森林',
  ocean: '海洋',
  universe: '宇宙',
  temple: '古寺',
}

const tracks: MeditationTrack[] = [
  { id: 'forest-breath', name: '森林呼吸', subtitle: '轻柔白噪音', src: '/assets/music.mp3', playbackRate: 1 },
  { id: 'night-stream', name: '夜溪微光', subtitle: '舒缓环境音', src: '/assets/music.mp3', playbackRate: 0.92 },
  { id: 'deep-rest', name: '深度放松', subtitle: '平稳助眠底噪', src: '/assets/music.mp3', playbackRate: 1.08 },
]

Page({
  data: {
    title: '音乐选择',
    themeBackground: '/assets/themes/theme-forest.jpg',
    themeText: '森林主题',
    selectedTrackId: tracks[0].id,
    tracks,
  },

  onLoad(query: Record<string, string | undefined>) {
    const theme = (query.theme || 'forest') as ThemeId
    const safeTheme = themeTitleMap[theme] ? theme : 'forest'
    const selectedTrackId = String(query.trackId || wx.getStorageSync('meditation_track_id') || tracks[0].id)

    this.setData({
      themeBackground: '/assets/themes/theme-' + safeTheme + '.jpg',
      themeText: themeTitleMap[safeTheme] + '主题',
      selectedTrackId,
    })
  },

  selectTrack(e: WechatMiniprogram.CustomEvent) {
    const trackId = String(e.currentTarget.dataset.trackId || '')
    if (!trackId) return

    wx.setStorageSync('meditation_track_id', trackId)
    this.setData({ selectedTrackId: trackId })

    wx.showToast({
      title: '背景音乐已切换',
      icon: 'none',
    })

    setTimeout(() => {
      wx.navigateBack()
    }, 260)
  },
})
