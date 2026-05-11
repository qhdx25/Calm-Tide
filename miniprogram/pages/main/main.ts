type ThemeId = 'forest' | 'ocean' | 'universe' | 'temple'
type FeatureId = 'meditation' | 'ai-chat' | 'community'

const themeMap: Record<ThemeId, { title: string }> = {
  forest: { title: '森林' },
  ocean: { title: '海洋' },
  universe: { title: '宇宙' },
  temple: { title: '古寺' },
}

const features: Array<{ id: FeatureId; name: string; eyebrow: string; desc: string }> = [
  {
    id: 'meditation',
    name: '冥想',
    eyebrow: '专注模式',
    desc: '从呼吸、放松和安静进入开始，作为疗愈体验的第一步。',
  },
  {
    id: 'ai-chat',
    name: 'AI聊天',
    eyebrow: '陪伴对话',
    desc: '用温和引导和实时对话，帮助用户表达情绪、整理感受。',
  },
  {
    id: 'community',
    name: '社区',
    eyebrow: '共享空间',
    desc: '把动态、话题和陪伴感聚合在一起，形成更温暖的互动空间。',
  },
]

const durationOptions = [
  { value: 10, label: '10分钟' },
  { value: 20, label: '20分钟' },
  { value: 30, label: '30分钟' },
  { value: 60, label: '60分钟' },
]

const SWITCH_DURATION = 260
const BOUNCE_DURATION = 180
const AUDIO_URL = '/assets/music.mp3'
const MAX_VOLUME = 0.5
const FADE_IN_DURATION = 3000
const FADE_IN_STEPS = 30
const MEDITATION_TRACKS = [
  { id: 'soft-star', name: '柔光星尘', src: '/assets/music/soft-star.mp3', playbackRate: 1 },
  { id: 'quiet-night', name: '静夜呼吸', src: '/assets/music/quiet-night.mp3', playbackRate: 1 },
  { id: 'deep-soft', name: '深层柔波', src: '/assets/music/deep-soft.mp3', playbackRate: 1 },
  { id: 'clear-mind', name: '清醒心流', src: '/assets/music/clear-mind.mp3', playbackRate: 1 },
  { id: 'warm-cloud', name: '暖云慢行', src: '/assets/music/warm-cloud.mp3', playbackRate: 1 },
  { id: 'morning-birds', name: '晨鸟微鸣', src: '/assets/music/morning-birds.mp3', playbackRate: 1 },
  { id: 'sea-wave', name: '海浪白噪', src: '/assets/music/sea-wave.mp3', playbackRate: 1 },
]

Page({
  data: {
    themeId: 'forest',
    themeBackground: '/assets/themes/theme-forest.jpg',
    themeTitle: '森林',
    features,
    currentFeatureIndex: 0,
    currentFeatureName: features[0].name,
    featureHeaderVisible: true,
    trackStyle: 'transform: translate3d(0px, 0, 0); transition-duration: 0ms;',
    isPlaying: false,
    showDurationSheet: false,
    selectedDurationMinutes: 20,
    selectedDurationLabel: '20分钟',
    customDurationInput: '',
    remainingSeconds: 20 * 60,
    remainingTimeText: '20:00',
    durationOptions,
    selectedTrackId: MEDITATION_TRACKS[0].id,
    selectedTrackName: MEDITATION_TRACKS[0].name,
    bottomTabs: [
      { id: 'home', label: '主页' },
      { id: 'community', label: '社区' },
      { id: 'profile', label: '我的' },
    ],
    activeBottomTab: 'home',
  },

  touchStartX: 0,
  touchDeltaX: 0,
  touchStartTime: 0,
  viewportWidth: 375,
  isAnimating: false,
  audioContext: null as WechatMiniprogram.InnerAudioContext | null,
  volumeTimer: null as number | null,
  countdownTimer: null as number | null,

  onLoad(query: Record<string, string | undefined>) {
    const theme = (query.theme || 'forest') as ThemeId
    const safeTheme = themeMap[theme] ? theme : 'forest'
    const { windowWidth } = wx.getSystemInfoSync()
    const initialSeconds = this.data.selectedDurationMinutes * 60

    this.viewportWidth = windowWidth

    this.setData({
      themeId: safeTheme,
      themeBackground: `/assets/themes/theme-${safeTheme}.jpg`,
      themeTitle: themeMap[safeTheme].title,
      trackStyle: this.buildTrackStyle(0, 0),
      remainingSeconds: initialSeconds,
      remainingTimeText: this.formatTime(initialSeconds),
    })

    this.setupMeditationAudio()
  },

  onShow() {
    this.loadSelectedMusicTrack()
  },

  onUnload() {
    this.clearVolumeTimer()
    this.clearCountdownTimer()

    if (this.audioContext) {
      this.audioContext.stop()
      this.audioContext.destroy()
      this.audioContext = null
    }
  },

  setupMeditationAudio() {
    wx.setInnerAudioOption({
      obeyMuteSwitch: false,
      mixWithOther: true,
    })

    const audio = wx.createInnerAudioContext()
    const selectedTrack = this.getSelectedMusicTrack()
    audio.loop = true
    audio.src = selectedTrack.src
    audio.playbackRate = selectedTrack.playbackRate
    audio.volume = 0
    audio.autoplay = false
    audio.obeyMuteSwitch = false

    audio.onCanplay(() => {
      if (this.data.currentFeatureIndex === 0 && !this.data.isPlaying) {
        setTimeout(() => {
          this.startMeditationPlayback()
        }, 80)
      }
    })

    audio.onError((err) => {
      console.error('main meditation audio error', err)
      wx.showToast({
        title: `音频播放失败(${err.errCode || 'unknown'})`,
        icon: 'none',
      })
    })

    this.audioContext = audio
    this.loadSelectedMusicTrack()
  },

  getSelectedMusicTrack() {
    const storedTrackId = String(wx.getStorageSync('meditation_track_id') || MEDITATION_TRACKS[0].id)
    return MEDITATION_TRACKS.find((item) => item.id === storedTrackId) || MEDITATION_TRACKS[0]
  },

  loadSelectedMusicTrack() {
    const selectedTrack = this.getSelectedMusicTrack()

    this.setData({
      selectedTrackId: selectedTrack.id,
      selectedTrackName: selectedTrack.name,
    })

    if (!this.audioContext) return

    const shouldContinue = this.data.isPlaying
    this.clearVolumeTimer()
    this.audioContext.stop()
    this.audioContext.src = selectedTrack.src
    this.audioContext.playbackRate = selectedTrack.playbackRate
    this.audioContext.volume = shouldContinue ? MAX_VOLUME : 0

    if (shouldContinue) this.audioContext.play()
  },

  onTouchStart(e: WechatMiniprogram.TouchEvent) {
    if (this.isAnimating || this.data.showDurationSheet) return
    this.touchStartX = e.touches[0].clientX
    this.touchDeltaX = 0
    this.touchStartTime = Date.now()
  },

  onTouchMove(e: WechatMiniprogram.TouchEvent) {
    if (this.isAnimating || this.data.showDurationSheet) return

    const moveX = e.touches[0].clientX
    const rawDeltaX = moveX - this.touchStartX
    const atFirst = this.data.currentFeatureIndex === 0
    const atLast = this.data.currentFeatureIndex === this.data.features.length - 1
    const deltaX = (atFirst && rawDeltaX > 0) || (atLast && rawDeltaX < 0) ? rawDeltaX * 0.35 : rawDeltaX

    this.touchDeltaX = deltaX
    this.setData({
      trackStyle: this.buildTrackStyle(this.getBaseTranslateX() + deltaX, 0),
    })
  },

  onTouchEnd() {
    if (this.isAnimating || this.data.showDurationSheet) return

    const elapsed = Date.now() - this.touchStartTime
    const threshold = this.viewportWidth * 0.18
    const fastSwipe = elapsed < 220 && Math.abs(this.touchDeltaX) > 32
    let nextIndex = this.data.currentFeatureIndex

    if (this.touchDeltaX <= -threshold || (fastSwipe && this.touchDeltaX < 0)) {
      nextIndex += 1
    } else if (this.touchDeltaX >= threshold || (fastSwipe && this.touchDeltaX > 0)) {
      nextIndex -= 1
    }

    if (nextIndex < 0 || nextIndex > this.data.features.length - 1) {
      this.playBounceBack()
      return
    }

    this.animateToIndex(nextIndex)
  },

  buildTrackStyle(translateX: number, duration: number) {
    return `transform: translate3d(${translateX}px, 0, 0); transition-duration: ${duration}ms;`
  },

  getBaseTranslateX() {
    return -this.data.currentFeatureIndex * this.viewportWidth
  },

  animateToIndex(nextIndex: number) {
    const currentFeature = this.data.features[nextIndex]
    const translateX = -nextIndex * this.viewportWidth

    this.isAnimating = true
    this.setData({
      currentFeatureIndex: nextIndex,
      trackStyle: this.buildTrackStyle(translateX, SWITCH_DURATION),
      activeBottomTab: nextIndex === 2 ? 'community' : 'home',
    })

    if (currentFeature.name !== this.data.currentFeatureName) {
      this.setData({ featureHeaderVisible: false })
      setTimeout(() => {
        this.setData({
          currentFeatureName: currentFeature.name,
          featureHeaderVisible: true,
        })
      }, 40)
    }

    if (nextIndex === 0) {
      if (!this.data.isPlaying) {
        this.startMeditationPlayback()
      }
    } else if (this.data.isPlaying) {
      this.pauseMeditationPlayback()
    }

    setTimeout(() => {
      this.isAnimating = false
      this.touchDeltaX = 0
    }, SWITCH_DURATION)
  },

  playBounceBack() {
    this.isAnimating = true
    this.setData({
      trackStyle: this.buildTrackStyle(this.getBaseTranslateX(), BOUNCE_DURATION),
    })

    setTimeout(() => {
      this.isAnimating = false
      this.touchDeltaX = 0
    }, BOUNCE_DURATION)
  },

  startMeditationPlayback() {
    if (!this.audioContext || this.data.currentFeatureIndex !== 0) {
      return
    }

    this.audioContext.play()
    this.setData({ isPlaying: true })
    this.startVolumeRamp()
    this.startCountdown()
  },

  pauseMeditationPlayback() {
    if (this.audioContext) {
      this.audioContext.pause()
    }

    this.clearVolumeTimer()
    this.clearCountdownTimer()
    this.setData({ isPlaying: false })
  },

  toggleMeditationPlayback() {
    if (this.data.currentFeatureIndex !== 0) {
      return
    }

    if (this.data.isPlaying) {
      this.pauseMeditationPlayback()
      return
    }

    this.startMeditationPlayback()
  },

  startVolumeRamp() {
    if (!this.audioContext) {
      return
    }

    this.clearVolumeTimer()
    this.audioContext.volume = 0
    let currentStep = 0
    const stepVolume = MAX_VOLUME / FADE_IN_STEPS
    const stepDuration = FADE_IN_DURATION / FADE_IN_STEPS

    this.volumeTimer = setInterval(() => {
      currentStep += 1

      if (!this.audioContext) {
        this.clearVolumeTimer()
        return
      }

      this.audioContext.volume = Math.min(MAX_VOLUME, stepVolume * currentStep)

      if (currentStep >= FADE_IN_STEPS) {
        this.clearVolumeTimer()
      }
    }, stepDuration) as unknown as number
  },

  startCountdown() {
    this.clearCountdownTimer()

    this.countdownTimer = setInterval(() => {
      if (!this.data.isPlaying) {
        return
      }

      const nextRemaining = Math.max(0, this.data.remainingSeconds - 1)
      this.setData({
        remainingSeconds: nextRemaining,
        remainingTimeText: this.formatTime(nextRemaining),
      })

      if (nextRemaining === 0) {
        this.pauseMeditationPlayback()
      }
    }, 1000) as unknown as number
  },

  clearVolumeTimer() {
    if (this.volumeTimer !== null) {
      clearInterval(this.volumeTimer)
      this.volumeTimer = null
    }
  },

  clearCountdownTimer() {
    if (this.countdownTimer !== null) {
      clearInterval(this.countdownTimer)
      this.countdownTimer = null
    }
  },

  openDurationSheet() {
    if (this.data.currentFeatureIndex !== 0) {
      return
    }

    this.setData({
      showDurationSheet: true,
      customDurationInput: '',
    })
  },

  openMusicSelect() {
    if (this.data.currentFeatureIndex !== 0) {
      return
    }

    wx.navigateTo({
      url: `/pages/music-select/music-select?theme=${this.data.themeId}&trackId=${this.data.selectedTrackId}`,
    })
  },

  closeDurationSheet() {
    this.setData({ showDurationSheet: false })
  },

  selectDuration(e: WechatMiniprogram.CustomEvent) {
    const value = Number(e.currentTarget.dataset.value)
    if (!value) {
      return
    }

    this.applyDuration(value)
  },

  onCustomDurationInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({
      customDurationInput: e.detail.value,
    })
  },

  confirmCustomDuration() {
    const value = Number(this.data.customDurationInput)
    if (!value || value <= 0) {
      wx.showToast({
        title: '请输入有效时长',
        icon: 'none',
      })
      return
    }

    this.applyDuration(value)
  },

  applyDuration(minutes: number) {
    const seconds = minutes * 60
    const matchedOption = durationOptions.find((item) => item.value === minutes)

    this.clearCountdownTimer()

    this.setData({
      selectedDurationMinutes: minutes,
      selectedDurationLabel: matchedOption ? matchedOption.label : `${minutes}分钟`,
      remainingSeconds: seconds,
      remainingTimeText: this.formatTime(seconds),
      showDurationSheet: false,
      customDurationInput: '',
    })

    if (this.data.isPlaying) {
      this.startCountdown()
    }
  },

  openFeature(e: WechatMiniprogram.CustomEvent) {
    const { featureId } = e.currentTarget.dataset
    const safeFeature = this.data.features.find((item) => item.id === featureId)
    if (!safeFeature) return

    wx.navigateTo({
      url: `/pages/feature/feature?theme=${this.data.themeId}&feature=${safeFeature.id}`,
    })
  },

  onBottomTabTap(e: WechatMiniprogram.CustomEvent) {
    const tabId = String(e.currentTarget.dataset.tabId || '')
    if (!tabId) return

    if (tabId === 'profile') {
      wx.navigateTo({
        url: '/pages/profile/profile',
      })
      return
    }

    if (tabId === 'community') {
      if (this.data.currentFeatureIndex !== 2) {
        this.animateToIndex(2)
      }
      return
    }

    if (this.data.currentFeatureIndex !== 0) {
      this.animateToIndex(0)
    }
  },

  formatTime(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  },
})
