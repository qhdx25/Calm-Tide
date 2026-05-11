type ThemeId = 'forest' | 'ocean' | 'universe' | 'temple'

type MeditationTrack = {
  id: string
  name: string
  subtitle: string
  src: string
  playbackRate: number
  duration: string
  mood: string
  accent: string
}

const themeTitleMap: Record<ThemeId, string> = {
  forest: '森林',
  ocean: '海洋',
  universe: '宇宙',
  temple: '古寺',
}

const tracks: MeditationTrack[] = [
  { id: 'soft-star', name: '柔光星尘', subtitle: '柔和背景旋律，适合进入冥想', src: '/assets/music/soft-star.mp3', playbackRate: 1, duration: '20分钟', mood: '平静', accent: 'green' },
  { id: 'quiet-night', name: '静夜呼吸', subtitle: '轻缓铺底音乐，适合放松', src: '/assets/music/quiet-night.mp3', playbackRate: 1, duration: '25分钟', mood: '放松', accent: 'blue' },
  { id: 'deep-soft', name: '深层柔波', subtitle: '低起伏氛围，适合舒缓紧绷', src: '/assets/music/deep-soft.mp3', playbackRate: 1, duration: '30分钟', mood: '睡眠', accent: 'indigo' },
  { id: 'clear-mind', name: '清醒心流', subtitle: '明亮但不打扰的背景音乐', src: '/assets/music/clear-mind.mp3', playbackRate: 1, duration: '18分钟', mood: '专注', accent: 'gold' },
  { id: 'warm-cloud', name: '暖云慢行', subtitle: '温暖、轻柔、适合安定情绪', src: '/assets/music/warm-cloud.mp3', playbackRate: 1, duration: '22分钟', mood: '舒缓', accent: 'rain' },
  { id: 'morning-birds', name: '晨鸟微鸣', subtitle: '清晨鸟鸣自然声，适合轻柔唤醒', src: '/assets/music/morning-birds.mp3', playbackRate: 1, duration: '15分钟', mood: '自然', accent: 'green' },
  { id: 'sea-wave', name: '海浪白噪', subtitle: '海浪起伏声，适合安定呼吸节奏', src: '/assets/music/sea-wave.mp3', playbackRate: 1, duration: '10分钟', mood: '海浪', accent: 'ocean' },
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
