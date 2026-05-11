import {
  type CommunityPost,
  type ThemeId,
  readCommunityPosts,
} from '../../utils/community'
import {
  appendChatHistoryRecord,
  appendMeditationHistoryRecord,
  formatHistoryTime,
  readAiChatMessages,
  writeAiChatMessages,
} from '../../utils/profile-history'

type FeatureId = 'meditation' | 'ai-chat' | 'community'
type VoiceGender = 'male' | 'female' | ''
type VoiceAge = 'young' | 'mature' | ''

type ChatMessage = {
  id: string
  role: 'ai' | 'user'
  text: string
  kind?: 'text' | 'voice'
  durationSeconds?: number
  statusText?: string
  voiceDurationSeconds?: number
  audioFilePath?: string
}

type StarActionId = 'idle' | 'standby' | 'listening' | 'happy' | 'playful' | 'yawn' | 'sleep'
type StarActionMediaType = 'image' | 'video'
type StarMood = 'idle' | 'blink' | 'yawn'

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

const featureMap: Record<FeatureId, { title: string; subtitle: string; button: string }> = {
  meditation: {
    title: '冥想空间',
    subtitle: '跟随呼吸节奏，在你选中的主题风景里慢慢安静下来。',
    button: '开始本次冥想',
  },
  'ai-chat': {
    title: 'AI聊天',
    subtitle: '按住右下角麦克风，说出你的感受。',
    button: '开始对话',
  },
  community: {
    title: '社区',
    subtitle: '看看大家的分享，也把自己的治愈时刻留在这里。',
    button: '浏览动态',
  },
}

const durationOptions = [
  { value: 10, label: '10分钟' },
  { value: 20, label: '20分钟' },
  { value: 30, label: '30分钟' },
  { value: 60, label: '60分钟' },
]

const AUDIO_URL = '/assets/music.mp3'
const MAX_VOLUME = 0.5
const FADE_IN_DURATION = 3000
const FADE_IN_STEPS = 30
const CANCEL_THRESHOLD = 80
const COMMUNITY_PAGE_SIZE = 3
const MEDITATION_TRACKS: MeditationTrack[] = [
  { id: 'soft-star', name: '柔光星尘', subtitle: '柔和背景旋律', src: '/assets/music/soft-star.mp3', playbackRate: 1 },
  { id: 'quiet-night', name: '静夜呼吸', subtitle: '轻缓铺底音乐', src: '/assets/music/quiet-night.mp3', playbackRate: 1 },
  { id: 'deep-soft', name: '深层柔波', subtitle: '低起伏氛围', src: '/assets/music/deep-soft.mp3', playbackRate: 1 },
  { id: 'clear-mind', name: '清醒心流', subtitle: '明亮背景音乐', src: '/assets/music/clear-mind.mp3', playbackRate: 1 },
  { id: 'warm-cloud', name: '暖云慢行', subtitle: '温暖轻柔音乐', src: '/assets/music/warm-cloud.mp3', playbackRate: 1 },
  { id: 'morning-birds', name: '晨鸟微鸣', subtitle: '清晨鸟鸣自然声', src: '/assets/music/morning-birds.mp3', playbackRate: 1 },
  { id: 'sea-wave', name: '海浪白噪', subtitle: '海浪起伏声', src: '/assets/music/sea-wave.mp3', playbackRate: 1 },
]
const DEFAULT_TRACK = MEDITATION_TRACKS[0]
const STAR_IDLE_FILE_ID = 'cloud://cloudbase-d4g76knyn75980384.636c-cloudbase-d4g76knyn75980384-1429293424/star-action/正面形象.jpg'
const STAR_ACTIONS: Record<StarActionId, { label: string; fileId: string; src: string; mediaType: StarActionMediaType }> = {
  idle: {
    label: '待机中',
    fileId: STAR_IDLE_FILE_ID,
    src: '',
    mediaType: 'image',
  },
  standby: {
    label: '待机动作',
    fileId: 'cloud://cloudbase-d4g76knyn75980384.636c-cloudbase-d4g76knyn75980384-1429293424/star-action/待机动作.mp4',
    src: '',
    mediaType: 'video',
  },
  listening: {
    label: '认真倾听',
    fileId: 'cloud://cloudbase-d4g76knyn75980384.636c-cloudbase-d4g76knyn75980384-1429293424/star-action/认真倾听.mp4',
    src: '',
    mediaType: 'video',
  },
  happy: {
    label: '愉悦回应',
    fileId: 'cloud://cloudbase-d4g76knyn75980384.636c-cloudbase-d4g76knyn75980384-1429293424/star-action/愉悦.mp4',
    src: '',
    mediaType: 'video',
  },
  playful: {
    label: '俏皮互动',
    fileId: 'cloud://cloudbase-d4g76knyn75980384.636c-cloudbase-d4g76knyn75980384-1429293424/star-action/俏皮.mp4',
    src: '',
    mediaType: 'video',
  },
  yawn: {
    label: '轻轻打哈欠',
    fileId: 'cloud://cloudbase-d4g76knyn75980384.636c-cloudbase-d4g76knyn75980384-1429293424/star-action/打哈欠.mp4',
    src: '',
    mediaType: 'video',
  },
  sleep: {
    label: '想睡觉了',
    fileId: 'cloud://cloudbase-d4g76knyn75980384.636c-cloudbase-d4g76knyn75980384-1429293424/star-action/睡觉.mp4',
    src: '',
    mediaType: 'video',
  },
}
Page({
  data: {
    navTitle: '功能页',
    themeId: 'forest' as ThemeId,
    themeBackground: '/assets/themes/theme-forest.jpg',
    themeText: '森林主题',
    featureTitle: '冥想空间',
    featureSubtitle: '跟随呼吸节奏，在你选中的主题风景里慢慢安静下来。',
    featureButton: '开始本次冥想',
    isMeditation: false,
    isAiChat: false,
    isCommunity: false,
    isPlaying: false,
    showDurationSheet: false,
    selectedDurationMinutes: 20,
    selectedDurationLabel: '20分钟',
    selectedTrackId: DEFAULT_TRACK.id,
    selectedTrackName: DEFAULT_TRACK.name,
    customDurationInput: '',
    remainingSeconds: 20 * 60,
    remainingTimeText: '20:00',
    durationOptions,
    chatMessages: [] as ChatMessage[],
    starMood: 'idle' as StarMood,
    starHeaderImageSrc: '',
    starIdleImageSrc: STAR_IDLE_FILE_ID,
    starActionId: 'idle' as StarActionId,
    starActionLabel: '待机中',
    starActionSrc: STAR_IDLE_FILE_ID,
    starActionMediaType: 'image' as StarActionMediaType,
    starActionIsImage: true,
    starActionIsVideo: false,
    starActionToken: 'idle',
    voiceProfileLabel: '默认语音',
    showRecordModal: false,
    isRecording: false,
    isRecordCancelled: false,
    recordHint: '长按开始录音',
    waveHeights: [22, 34, 18, 40, 26, 32],
    recordPermissionGranted: false,
    playingMessageId: '',
    playbackProgress: 0,
    playbackCurrentSeconds: 0,
    showMessageMenu: false,
    selectedMessageId: '',
    selectedMessageKind: '',
    textInputValue: '',
    chatScrollIntoView: '',
    communityPosts: [] as CommunityPost[],
    communityVisiblePosts: [] as CommunityPost[],
    communityPage: 1,
    communityHasMore: true,
    communityRefreshing: false,
    communityLoadingMore: false,
    communityLoadMessage: '',
  },

  audioContext: null as WechatMiniprogram.InnerAudioContext | null,
  messageAudioContext: null as WechatMiniprogram.InnerAudioContext | null,
  recorderManager: null as WechatMiniprogram.RecorderManager | null,
  volumeTimer: null as number | null,
  countdownTimer: null as number | null,
  waveTimer: null as number | null,
  playbackTimer: null as number | null,
  starActionResetTimer: null as number | null,
  starMoodTimer: null as number | null,
  starMoodResetTimer: null as number | null,
  playbackDurationSeconds: 0,
  recordStartY: 0,
  pendingRecordCancel: false,
  micLongPressTriggered: false,
  hasMeditationAutoStarted: false,
  meditationHistorySaved: false,

  onLoad(query: Record<string, string | undefined>) {
    const rawTheme = (query.theme || 'forest') as ThemeId
    const rawFeature = (query.feature || 'meditation') as FeatureId
    const theme = themeTitleMap[rawTheme] ? rawTheme : 'forest'
    const feature = featureMap[rawFeature] ? rawFeature : 'meditation'
    const focusMessageId = String(query.focusMessageId || '')
    const initialSeconds = this.data.selectedDurationMinutes * 60

    this.setData({
      navTitle: featureMap[feature].title,
      themeId: theme,
      themeBackground: '/assets/themes/theme-' + theme + '.jpg',
      themeText: themeTitleMap[theme] + '主题',
      featureTitle: featureMap[feature].title,
      featureSubtitle: featureMap[feature].subtitle,
      featureButton: featureMap[feature].button,
      isMeditation: feature === 'meditation',
      isAiChat: feature === 'ai-chat',
      isCommunity: feature === 'community',
      remainingSeconds: initialSeconds,
      remainingTimeText: this.formatTime(initialSeconds),
      chatScrollIntoView: focusMessageId ? 'chat-' + focusMessageId : '',
    })

    this.loadMeditationTrack()

    if (feature === 'meditation') {
      this.setupMeditationAudio()
    } else if (feature === 'ai-chat') {
      this.setupAiChat()
      this.startStarMoodLoop()
    } else {
      this.reloadCommunityFeed()
    }
  },

  onShow() {
    this.loadMeditationTrack()

    if (this.data.isMeditation && this.audioContext) {
      this.syncMeditationTrackSource()
    }

    if (this.data.isCommunity) {
      this.reloadCommunityFeed()
    }
  },

  onUnload() {
    this.saveMeditationHistoryIfNeeded()
    this.clearVolumeTimer()
    this.clearCountdownTimer()
    this.clearWaveTimer()
    this.clearPlaybackTimer()
    this.clearStarActionResetTimer()
    this.clearStarMoodTimers()

    if (this.audioContext) {
      this.audioContext.stop()
      this.audioContext.destroy()
      this.audioContext = null
    }

    if (this.messageAudioContext) {
      this.messageAudioContext.stop()
      this.messageAudioContext.destroy()
      this.messageAudioContext = null
    }
  },

  setupMeditationAudio() {
    wx.setInnerAudioOption({
      obeyMuteSwitch: false,
      mixWithOther: true,
    })

    const audio = wx.createInnerAudioContext()
    const selectedTrack = this.getSelectedTrack()
    audio.loop = true
    audio.src = selectedTrack.src
    audio.playbackRate = selectedTrack.playbackRate
    audio.volume = 0
    audio.autoplay = false
    audio.obeyMuteSwitch = false

    audio.onCanplay(() => {
      if (!this.hasMeditationAutoStarted && !this.data.isPlaying) {
        this.hasMeditationAutoStarted = true
        this.startMeditationPlayback(true)
      }
    })

    audio.onError(() => {
      wx.showToast({
        title: '音频播放失败',
        icon: 'none',
      })
    })

    this.audioContext = audio
    this.syncMeditationTrackSource()
  },

  getSelectedTrack() {
    const matchedTrack = MEDITATION_TRACKS.find((item) => item.id === this.data.selectedTrackId)
    return matchedTrack || DEFAULT_TRACK
  },

  loadMeditationTrack() {
    const storedTrackId = String(wx.getStorageSync('meditation_track_id') || DEFAULT_TRACK.id)
    const matchedTrack = MEDITATION_TRACKS.find((item) => item.id === storedTrackId) || DEFAULT_TRACK
    this.setData({
      selectedTrackId: matchedTrack.id,
      selectedTrackName: matchedTrack.name,
    })
  },

  syncMeditationTrackSource() {
    if (!this.audioContext) return

    const nextTrack = this.getSelectedTrack()
    const shouldContinue = this.data.isPlaying
    this.clearVolumeTimer()
    this.audioContext.stop()
    this.audioContext.src = nextTrack.src
    this.audioContext.playbackRate = nextTrack.playbackRate
    this.audioContext.volume = MAX_VOLUME

    if (shouldContinue) {
      this.audioContext.play()
    }
  },

  openMusicSelect() {
    wx.navigateTo({
      url: `/pages/music-select/music-select?theme=${this.data.themeId}&trackId=${this.data.selectedTrackId}`,
    })
  },

  openCloudTest() {
    wx.navigateTo({
      url: '/pages/cloud-test/cloud-test',
    })
  },

  startStarMoodLoop() {
    this.clearStarMoodTimers()
    const moods: StarMood[] = ['blink', 'blink', 'yawn']
    let moodIndex = 0

    this.starMoodTimer = setInterval(() => {
      const mood = moods[moodIndex % moods.length]
      moodIndex += 1
      this.playStarMood(mood)
    }, 3600) as unknown as number
  },

  playStarMood(mood: StarMood) {
    this.setData({ starMood: mood })
    if (this.starMoodResetTimer !== null) {
      clearTimeout(this.starMoodResetTimer)
    }

    const duration = mood === 'yawn' ? 1600 : 760
    this.starMoodResetTimer = setTimeout(() => {
      this.setData({ starMood: 'idle' })
      this.starMoodResetTimer = null
    }, duration) as unknown as number
  },

  onStarTap() {
    if (!this.data.isAiChat) return

    if (this.starMoodResetTimer !== null) {
      clearTimeout(this.starMoodResetTimer)
      this.starMoodResetTimer = null
    }

    this.setData({ starMood: 'idle' })
    setTimeout(() => {
      this.playStarMood('blink')
    }, 20)
  },

  clearStarMoodTimers() {
    if (this.starMoodTimer !== null) {
      clearInterval(this.starMoodTimer)
      this.starMoodTimer = null
    }

    if (this.starMoodResetTimer !== null) {
      clearTimeout(this.starMoodResetTimer)
      this.starMoodResetTimer = null
    }
  },


  loadStarActionSources() {
    if (!wx.cloud) {
      const currentAction = STAR_ACTIONS[(this.data.starActionId || 'idle') as StarActionId] || STAR_ACTIONS.idle
      this.setData({
        starActionSrc: currentAction.fileId || currentAction.src,
        starIdleImageSrc: STAR_IDLE_FILE_ID,
        starActionLabel: currentAction.label,
        starActionMediaType: currentAction.mediaType,
        starActionIsImage: currentAction.mediaType === 'image',
        starActionIsVideo: currentAction.mediaType === 'video',
        starActionToken: (this.data.starActionId || 'idle') + '-fallback',
      })
      return
    }

    const fileList = Object.values(STAR_ACTIONS).map((item) => item.fileId)
    wx.cloud.getTempFileURL({
      fileList,
      success: (res) => {
        const urlMap: Record<string, string> = {}
        res.fileList.forEach((item) => {
          if ('fileID' in item && 'tempFileURL' in item) {
            urlMap[item.fileID] = item.tempFileURL || ''
          }
        })

        Object.keys(STAR_ACTIONS).forEach((key) => {
          const actionKey = key as StarActionId
          STAR_ACTIONS[actionKey].src = urlMap[STAR_ACTIONS[actionKey].fileId] || STAR_ACTIONS[actionKey].fileId
        })

        const currentAction = STAR_ACTIONS[(this.data.starActionId || 'idle') as StarActionId] || STAR_ACTIONS.idle
        this.setData({
          starActionSrc: currentAction.src,
          starIdleImageSrc: STAR_ACTIONS.idle.src || STAR_IDLE_FILE_ID,
          starActionLabel: currentAction.label,
          starActionMediaType: currentAction.mediaType,
          starActionIsImage: currentAction.mediaType === 'image',
          starActionIsVideo: currentAction.mediaType === 'video',
          starActionToken: (this.data.starActionId || 'idle') + '-' + Date.now(),
        })
      },
      fail: () => {
        const currentAction = STAR_ACTIONS[(this.data.starActionId || 'idle') as StarActionId] || STAR_ACTIONS.idle
        this.setData({
          starActionSrc: currentAction.fileId,
          starIdleImageSrc: STAR_IDLE_FILE_ID,
          starActionLabel: currentAction.label,
          starActionMediaType: currentAction.mediaType,
          starActionIsImage: currentAction.mediaType === 'image',
          starActionIsVideo: currentAction.mediaType === 'video',
          starActionToken: (this.data.starActionId || 'idle') + '-failed',
        })
      },
    })
  },

  loadStarHeaderImage() {
    if (!wx.cloud) {
      this.setData({
        starHeaderImageSrc: STAR_IDLE_FILE_ID,
      })
      return
    }

    wx.cloud.getTempFileURL({
      fileList: [STAR_IDLE_FILE_ID],
      success: (res) => {
        const firstFile = res.fileList[0]
        if (firstFile && 'tempFileURL' in firstFile && firstFile.tempFileURL) {
          this.setData({
            starHeaderImageSrc: firstFile.tempFileURL,
          })
          return
        }

        this.setData({
          starHeaderImageSrc: STAR_IDLE_FILE_ID,
        })
      },
      fail: () => {
        this.setData({
          starHeaderImageSrc: STAR_IDLE_FILE_ID,
        })
      },
    })
  },

  setupAiChat() {
    const voiceProfile = wx.getStorageSync('voice_profile') || {}
    const gender = (voiceProfile.gender || '') as VoiceGender
    const age = (voiceProfile.age || '') as VoiceAge
    const voiceProfileLabel = this.formatVoiceProfileLabel(gender, age)

    const storedMessages = readAiChatMessages()
    const initialMessages = storedMessages.length
      ? storedMessages
      : [
          {
            id: 'ai-welcome',
            role: 'ai',
            kind: 'text',
            voiceDurationSeconds: 6,
            text: '你好，我已经切换为' + voiceProfileLabel + '。按住右下角麦克风，说说你现在的状态。',
          },
        ]

    this.setData({
      voiceProfileLabel,
      chatMessages: initialMessages as ChatMessage[],
    })

    const recorder = wx.getRecorderManager()
    recorder.onStop((res) => {
      const durationSeconds = Math.max(1, Math.round(res.duration / 1000))

      if (this.pendingRecordCancel) {
        this.pendingRecordCancel = false
        this.hideRecordModal('录音已取消')
        return
      }

      const transcriptText = this.buildTranscriptText(durationSeconds)
      const now = Date.now()
      const userMessage: ChatMessage = {
        id: 'user-' + now,
        role: 'user',
        kind: 'voice',
        text: transcriptText,
        durationSeconds,
        voiceDurationSeconds: durationSeconds,
        statusText: '已转文字',
        audioFilePath: res.tempFilePath,
      }
      const aiMessage: ChatMessage = {
        id: 'ai-' + (now + 1),
        role: 'ai',
        kind: 'text',
        voiceDurationSeconds: 8,
        text: voiceProfileLabel + '回应：先慢慢吸气4拍，停留2拍，再呼气6拍。你的正式 AI 语音回复后续会接入。',
      }
      this.setData({
        chatMessages: this.data.chatMessages.concat(userMessage, aiMessage),
      })
      writeAiChatMessages(this.data.chatMessages.concat(userMessage, aiMessage))
      appendChatHistoryRecord({
        id: userMessage.id,
        title: '语音对话：' + transcriptText,
        meta: formatHistoryTime(),
        status: '已同步',
        messageId: userMessage.id,
        themeId: this.data.themeId,
      })

      this.hideRecordModal('已发送语音')
    })

    recorder.onError(() => {
      this.hideRecordModal('录音失败')
    })

    this.recorderManager = recorder
  },

  reloadCommunityFeed() {
    const allPosts = readCommunityPosts(this.data.themeId, this.data.themeBackground, this.data.themeText)
    const visiblePosts = allPosts.slice(0, COMMUNITY_PAGE_SIZE)
    this.setData({
      communityPosts: allPosts,
      communityVisiblePosts: visiblePosts,
      communityPage: 1,
      communityHasMore: allPosts.length > visiblePosts.length,
      communityRefreshing: false,
      communityLoadingMore: false,
      communityLoadMessage: allPosts.length > visiblePosts.length ? '' : '没有更多内容了',
    })
  },

  onCommunityRefresh() {
    if (this.data.communityRefreshing) return
    this.setData({
      communityRefreshing: true,
      communityLoadMessage: '',
    })

    setTimeout(() => {
      this.reloadCommunityFeed()
    }, 800)
  },

  onCommunityScrollToLower() {
    if (this.data.communityLoadingMore || this.data.communityRefreshing) return

    if (!this.data.communityHasMore) {
      this.setData({ communityLoadMessage: '没有更多内容了' })
      return
    }

    this.setData({
      communityLoadingMore: true,
      communityLoadMessage: '正在加载更多内容...',
    })

    setTimeout(() => {
      const nextPage = this.data.communityPage + 1
      const visiblePosts = this.data.communityPosts.slice(0, nextPage * COMMUNITY_PAGE_SIZE)
      const hasMore = this.data.communityPosts.length > visiblePosts.length

      this.setData({
        communityVisiblePosts: visiblePosts,
        communityPage: nextPage,
        communityHasMore: hasMore,
        communityLoadingMore: false,
        communityLoadMessage: hasMore ? '' : '没有更多内容了',
      })
    }, 800)
  },

  openCommunityDetail(e: WechatMiniprogram.CustomEvent) {
    const postId = String(e.currentTarget.dataset.postId || '')
    if (!postId) return

    wx.navigateTo({
      url: `/pages/community-detail/community-detail?theme=${this.data.themeId}&postId=${postId}`,
    })
  },

  openCommunityPublish() {
    wx.navigateTo({
      url: `/pages/community-publish/community-publish?theme=${this.data.themeId}`,
    })
  },

  buildTranscriptText(durationSeconds: number) {
    if (durationSeconds <= 2) return '我现在有点累，想先慢慢静下来。'
    if (durationSeconds <= 4) return '我刚刚有点紧张，想先调整一下呼吸。'
    if (durationSeconds <= 6) return '我希望先把情绪说出来，再慢慢让自己平静下来。'
    return '我现在有一些复杂的情绪，想让你陪我一起慢慢梳理。'
  },

  buildAiTextReply(userText: string) {
    const previewText = userText.length > 18 ? userText.slice(0, 18) + '…' : userText
    return this.data.voiceProfileLabel + '回应：我收到你说的“' + previewText + '”。先试着放慢呼吸，把注意力收回到当下。'
  },

  formatVoiceProfileLabel(gender: VoiceGender, age: VoiceAge) {
    const genderText = gender === 'female' ? '女声' : gender === 'male' ? '男声' : '默认语音'
    const ageText = age === 'young' ? '年轻' : age === 'mature' ? '成熟' : ''
    return ageText ? ageText + genderText : genderText
  },

  setStarAction(actionId: StarActionId) {
    const nextAction = STAR_ACTIONS[actionId] || STAR_ACTIONS.idle
    this.clearStarActionResetTimer()
    this.setData({
      starActionId: actionId,
      starActionLabel: nextAction.label,
      starActionSrc: nextAction.src || nextAction.fileId,
      starActionMediaType: nextAction.mediaType,
      starActionIsImage: nextAction.mediaType === 'image',
      starActionIsVideo: nextAction.mediaType === 'video',
      starActionToken: actionId + '-' + Date.now(),
    })
    if (actionId !== 'idle') {
      this.starActionResetTimer = setTimeout(() => {
        if (this.data.starActionId === actionId) {
          this.setStarAction('idle')
        }
      }, 2400) as unknown as number
    }
  },

  resolveStarAction(text: string): StarActionId {
    const normalizedText = String(text || '').toLowerCase()
    if (!normalizedText) return 'idle'

    const sleepyKeywords = ['困', '睡', '晚安', '累', '疲惫', '打哈欠', '想睡']
    if (sleepyKeywords.some((keyword) => normalizedText.includes(keyword))) {
      return normalizedText.includes('打哈欠') ? 'yawn' : 'sleep'
    }

    const happyKeywords = ['开心', '高兴', '愉快', '快乐', '治愈', '放松', '轻松', '满意']
    if (happyKeywords.some((keyword) => normalizedText.includes(keyword))) {
      return 'happy'
    }

    const playfulKeywords = ['俏皮', '逗', '玩', '可爱', '撒娇', '调皮']
    if (playfulKeywords.some((keyword) => normalizedText.includes(keyword))) {
      return 'playful'
    }

    const listeningKeywords = ['听我说', '倾诉', '烦', '难过', '焦虑', '紧张', '心烦', '压力', '不知道']
    if (listeningKeywords.some((keyword) => normalizedText.includes(keyword))) {
      return 'listening'
    }

    const standbyKeywords = ['在吗', '你好', '嗨', '说话', '想聊', '陪我', 'hello', 'hi', 'help']
    if (standbyKeywords.some((keyword) => normalizedText.includes(keyword))) {
      return 'standby'
    }

    return 'standby'
  },

  startMeditationPlayback(useFadeIn = false) {
    if (!this.audioContext) return
    this.audioContext.play()
    this.setData({ isPlaying: true })

    if (useFadeIn) {
      this.startVolumeRamp()
    } else {
      this.clearVolumeTimer()
      this.audioContext.volume = MAX_VOLUME
    }

    this.startCountdown()
  },

  pauseMeditationPlayback() {
    if (this.audioContext) {
      this.audioContext.pause()
    }
    this.clearVolumeTimer()
    this.clearCountdownTimer()
    this.setData({ isPlaying: false })
    this.saveMeditationHistoryIfNeeded()
  },

  toggleMeditationPlayback() {
    if (!this.data.isMeditation) return
    if (this.data.isPlaying) {
      this.pauseMeditationPlayback()
      return
    }
    this.startMeditationPlayback(false)
  },

  startVolumeRamp() {
    if (!this.audioContext) return
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
      if (!this.data.isPlaying) return
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
    this.setData({
      showDurationSheet: true,
      customDurationInput: '',
    })
  },

  closeDurationSheet() {
    this.setData({ showDurationSheet: false })
  },

  selectDuration(e: WechatMiniprogram.CustomEvent) {
    const value = Number(e.currentTarget.dataset.value || 0)
    if (!value) return
    this.applyDuration(value)
  },

  onCustomDurationInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ customDurationInput: e.detail.value })
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
    this.meditationHistorySaved = false
    this.setData({
      selectedDurationMinutes: minutes,
      selectedDurationLabel: matchedOption ? matchedOption.label : minutes + '分钟',
      remainingSeconds: seconds,
      remainingTimeText: this.formatTime(seconds),
      showDurationSheet: false,
      customDurationInput: '',
    })
    if (this.data.isPlaying) {
      this.startCountdown()
    }
  },

  onMicTap() {
    if (!this.data.isAiChat) return
    if (this.micLongPressTriggered) {
      this.micLongPressTriggered = false
      return
    }
    this.ensureRecordPermission(true)
  },

  onChatTextInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ textInputValue: e.detail.value })
  },

  submitTextMessage() {
    if (!this.data.isAiChat) return
    const text = String(this.data.textInputValue || '').trim()
    if (!text) return

    const now = Date.now()
    const userMessage: ChatMessage = {
      id: 'user-text-' + now,
      role: 'user',
      kind: 'text',
      text,
    }
    const aiMessage: ChatMessage = {
      id: 'ai-text-' + (now + 1),
      role: 'ai',
      kind: 'text',
      voiceDurationSeconds: 7,
      text: this.buildAiTextReply(text),
    }
    this.setData({
      chatMessages: this.data.chatMessages.concat(userMessage, aiMessage),
      textInputValue: '',
    })
    writeAiChatMessages(this.data.chatMessages.concat(userMessage, aiMessage))
    appendChatHistoryRecord({
      id: userMessage.id,
      title: '文字对话：' + text,
      meta: formatHistoryTime(),
      status: '已同步',
      messageId: userMessage.id,
      themeId: this.data.themeId,
    })
  },

  saveMeditationHistoryIfNeeded() {
    if (!this.data.isMeditation || this.meditationHistorySaved) return

    const elapsedSeconds = this.data.selectedDurationMinutes * 60 - this.data.remainingSeconds
    if (elapsedSeconds <= 0) return

    this.meditationHistorySaved = true
    appendMeditationHistoryRecord({
      id: 'meditation-' + Date.now(),
      title: this.data.themeText + ' · ' + this.data.selectedDurationLabel + ' · ' + this.data.selectedTrackName,
      meta: formatHistoryTime(),
      status: elapsedSeconds >= this.data.selectedDurationMinutes * 60 ? '已完成' : '进行过',
      durationSeconds: elapsedSeconds,
      createdAt: Date.now(),
    })
  },

  onMicTouchStart(e: WechatMiniprogram.TouchEvent) {
    if (!this.data.isAiChat) return
    this.recordStartY = e.touches[0].clientY
    this.micLongPressTriggered = false
  },

  onMicLongPress() {
    if (!this.data.isAiChat) return
    this.micLongPressTriggered = true
    this.ensureRecordPermission(false, () => {
      this.startVoiceRecording()
    })
  },

  onMicTouchMove(e: WechatMiniprogram.TouchEvent) {
    if (!this.data.isRecording) return
    const currentY = e.touches[0].clientY
    const moveDistance = this.recordStartY - currentY
    const shouldCancel = moveDistance > CANCEL_THRESHOLD
    this.pendingRecordCancel = shouldCancel
    this.setData({
      isRecordCancelled: shouldCancel,
      recordHint: shouldCancel ? '松开手指，取消录音' : '正在录音，说完后松开发送',
    })
  },

  onMicTouchEnd() {
    if (!this.data.isRecording || !this.recorderManager) return
    this.recorderManager.stop()
  },

  ensureRecordPermission(openModalAfterGrant: boolean, callback?: () => void) {
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.record']) {
          this.setData({ recordPermissionGranted: true })
          if (openModalAfterGrant) {
            this.showRecordModal('长按开始录音')
          }
          if (callback) callback()
          return
        }

        wx.authorize({
          scope: 'scope.record',
          success: () => {
            this.setData({ recordPermissionGranted: true })
            this.showRecordModal('长按开始录音')
            if (callback) callback()
          },
          fail: () => {
            wx.showModal({
              title: '需要录音权限',
              content: '请在接下来的设置页面开启“麦克风/录音”权限，开启后才能长按发送语音。',
              confirmText: '去开启',
              cancelText: '取消',
              success: (modalRes) => {
                if (!modalRes.confirm) return
                wx.openSetting({
                  success: (settingRes) => {
                    if (settingRes.authSetting['scope.record']) {
                      this.setData({ recordPermissionGranted: true })
                      this.showRecordModal('长按开始录音')
                      if (callback) callback()
                    }
                  },
                })
              },
            })
          },
        })
      },
    })
  },

  startVoiceRecording() {
    if (!this.recorderManager) return
    this.pendingRecordCancel = false
    this.showRecordModal('正在录音，说完后松开发送')
    this.setData({
      isRecording: true,
      isRecordCancelled: false,
    })
    this.recorderManager.start({
      duration: 60000,
      sampleRate: 16000,
      numberOfChannels: 1,
      encodeBitRate: 96000,
      format: 'aac',
    })
  },

  showRecordModal(hint: string) {
    this.setData({
      showRecordModal: true,
      recordHint: hint,
    })
    this.startWaveAnimation()
  },

  hideRecordModal(toastText?: string) {
    this.setData({
      showRecordModal: false,
      isRecording: false,
      isRecordCancelled: false,
      recordHint: '长按开始录音',
    })
    this.clearWaveTimer()
    if (toastText) {
      wx.showToast({
        title: toastText,
        icon: 'none',
      })
    }
  },

  closeRecordModal() {
    if (this.data.isRecording) return
    this.hideRecordModal()
  },

  startWaveAnimation() {
    this.clearWaveTimer()
    this.waveTimer = setInterval(() => {
      const nextWaveHeights = [0, 1, 2, 3, 4, 5].map(() => 18 + Math.round(Math.random() * 28))
      this.setData({ waveHeights: nextWaveHeights })
    }, 180) as unknown as number
  },

  clearWaveTimer() {
    if (this.waveTimer !== null) {
      clearInterval(this.waveTimer)
      this.waveTimer = null
    }
  },

  clearStarActionResetTimer() {
    if (this.starActionResetTimer !== null) {
      clearTimeout(this.starActionResetTimer)
      this.starActionResetTimer = null
    }
  },

  toggleMessageVoicePlayback(e: WechatMiniprogram.CustomEvent) {
    const messageId = String(e.currentTarget.dataset.messageId || '')
    const durationSeconds = Number(e.currentTarget.dataset.durationSeconds || 0)
    if (!messageId) return

    const targetMessage = this.data.chatMessages.find((item) => item.id === messageId)
    if (!targetMessage) return

    if (this.data.playingMessageId === messageId) {
      this.stopMessagePlayback()
      return
    }

    this.stopMessagePlayback()

    if (targetMessage.role === 'user' && targetMessage.audioFilePath) {
      this.startRecordedVoicePlayback(targetMessage, durationSeconds)
      return
    }

    this.startMockVoicePlayback(messageId, durationSeconds)
  },

  startRecordedVoicePlayback(message: ChatMessage, durationSeconds: number) {
    if (!message.audioFilePath) return

    wx.setInnerAudioOption({
      obeyMuteSwitch: false,
      mixWithOther: true,
    })

    const audio = wx.createInnerAudioContext()
    audio.autoplay = false
    audio.obeyMuteSwitch = false
    audio.src = message.audioFilePath
    this.playbackDurationSeconds = durationSeconds > 0 ? durationSeconds : message.voiceDurationSeconds || message.durationSeconds || 1

    this.setData({
      playingMessageId: message.id,
      playbackProgress: 0,
      playbackCurrentSeconds: 0,
    })

    audio.onTimeUpdate(() => {
      const fallbackDuration = this.playbackDurationSeconds || message.voiceDurationSeconds || message.durationSeconds || 1
      const actualDuration = audio.duration && audio.duration > 0 ? audio.duration : fallbackDuration
      const current = Math.min(actualDuration, audio.currentTime || 0)
      const progress = Math.min(100, Math.round((current / actualDuration) * 100))
      this.setData({
        playbackCurrentSeconds: Math.floor(current),
        playbackProgress: progress,
      })
    })

    audio.onEnded(() => {
      this.stopMessagePlayback()
    })

    audio.onStop(() => {
      this.stopMessagePlayback()
    })

    audio.onError(() => {
      wx.showToast({
        title: '语音播放失败',
        icon: 'none',
      })
      this.stopMessagePlayback()
    })

    this.messageAudioContext = audio
    audio.play()
  },

  startMockVoicePlayback(messageId: string, durationSeconds: number) {
    this.clearPlaybackTimer()
    this.playbackDurationSeconds = durationSeconds > 0 ? durationSeconds : 6
    this.setData({
      playingMessageId: messageId,
      playbackProgress: 0,
      playbackCurrentSeconds: 0,
    })

    this.playbackTimer = setInterval(() => {
      const nextSeconds = this.data.playbackCurrentSeconds + 1
      const progress = Math.min(100, Math.round((nextSeconds / this.playbackDurationSeconds) * 100))
      if (nextSeconds >= this.playbackDurationSeconds) {
        this.stopMessagePlayback()
        return
      }
      this.setData({
        playbackCurrentSeconds: nextSeconds,
        playbackProgress: progress,
      })
    }, 1000) as unknown as number
  },

  stopMessagePlayback() {
    this.clearPlaybackTimer()
    if (this.messageAudioContext) {
      const currentAudio = this.messageAudioContext
      this.messageAudioContext = null
      currentAudio.stop()
      currentAudio.destroy()
    }
    this.setData({
      playingMessageId: '',
      playbackProgress: 0,
      playbackCurrentSeconds: 0,
    })
  },

  clearPlaybackTimer() {
    if (this.playbackTimer !== null) {
      clearInterval(this.playbackTimer)
      this.playbackTimer = null
    }
  },

  onMessageLongPress(e: WechatMiniprogram.CustomEvent) {
    const messageId = String(e.currentTarget.dataset.messageId || '')
    const messageKind = String(e.currentTarget.dataset.messageKind || '')
    if (!messageId) return
    this.setData({
      showMessageMenu: true,
      selectedMessageId: messageId,
      selectedMessageKind: messageKind,
    })
  },

  closeMessageMenu() {
    this.setData({
      showMessageMenu: false,
      selectedMessageId: '',
      selectedMessageKind: '',
    })
  },

  copySelectedMessage() {
    const message = this.data.chatMessages.find((item) => item.id === this.data.selectedMessageId)
    if (!message || message.kind === 'voice') {
      this.closeMessageMenu()
      return
    }
    wx.setClipboardData({
      data: message.text,
      success: () => {
        this.closeMessageMenu()
      },
    })
  },

  deleteSelectedMessage() {
    const messageId = this.data.selectedMessageId
    if (!messageId) return
    const shouldResetPlayback = this.data.playingMessageId === messageId
    const nextMessages = this.data.chatMessages.filter((item) => item.id !== messageId)
    if (shouldResetPlayback) {
      this.stopMessagePlayback()
    }
    this.setData({
      chatMessages: nextMessages,
    })
    writeAiChatMessages(nextMessages)
    this.closeMessageMenu()
  },

  onPrimaryAction() {
    if (this.data.isCommunity) {
      this.openCommunityPublish()
      return
    }
    wx.showToast({
      title: '功能建设中',
      icon: 'none',
    })
  },

  formatTime(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0')
  },
})
