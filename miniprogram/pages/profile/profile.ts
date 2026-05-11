import { readOwnCommunityPosts } from '../../utils/community'
import {
  type MeditationRecord,
  readChatHistoryRecords,
  readMeditationHistoryRecords,
} from '../../utils/profile-history'

type ProfileSectionId = 'chat' | 'meditation' | 'community' | 'settings'
type ProfileAction = 'clear-cache' | ''

type ProfileSectionItem = {
  title: string
  meta?: string
  status?: string
  messageId?: string
  themeId?: string
  action?: ProfileAction
}

type ProfileSection = {
  id: ProfileSectionId
  title: string
  subtitle: string
  expanded: boolean
  items: ProfileSectionItem[]
}

type TrendPoint = {
  label: string
  minutes: number
  left: string
  bottom: string
}

type TrendLine = {
  left: string
  bottom: string
  width: string
  rotate: string
}

function buildSettingsItems(): ProfileSectionItem[] {
  const voiceProfile = wx.getStorageSync('voice_profile') || {}
  const storedTrackId = String(wx.getStorageSync('meditation_track_id') || 'forest-breath')

  const themeMap: Record<string, string> = {
    forest: '森林',
    ocean: '海洋',
    universe: '宇宙',
    temple: '古寺',
  }

  const voiceGenderMap: Record<string, string> = {
    male: '男声',
    female: '女声',
  }

  const voiceAgeMap: Record<string, string> = {
    young: '年轻',
    mature: '成熟',
  }

  const trackMap: Record<string, string> = {
    'forest-breath': '森林呼吸',
    'night-stream': '夜溪微光',
    'deep-rest': '深度放松',
  }

  const themeText = themeMap[String(voiceProfile.theme || 'forest')] || '森林'
  const genderText = voiceGenderMap[String(voiceProfile.gender || '')] || '默认语音'
  const ageText = voiceAgeMap[String(voiceProfile.age || '')] || ''
  const voiceText = ageText ? ageText + genderText : genderText
  const trackText = trackMap[storedTrackId] || '森林呼吸'

  return [
    { title: '当前主题：' + themeText, meta: '首页默认主题', status: '已启用' },
    { title: '当前语音：' + voiceText, meta: 'AI聊天播报配置', status: '已启用' },
    { title: '当前音乐：' + trackText, meta: '冥想背景音乐', status: '已启用' },
    {
      title: '清除缓存',
      meta: '清空聊天、冥想、社区和本地设置缓存',
      status: '操作',
      action: 'clear-cache',
    },
  ]
}

function parseMeditationDurationSeconds(record: MeditationRecord) {
  if (typeof record.durationSeconds === 'number' && record.durationSeconds > 0) {
    return record.durationSeconds
  }

  const matchedMinutes = String(record.title || '').match(/(\d+)\s*分钟/)
  if (matchedMinutes) {
    return Number(matchedMinutes[1]) * 60
  }

  return 0
}

function parseMeditationTimestamp(record: MeditationRecord) {
  if (typeof record.createdAt === 'number' && record.createdAt > 0) {
    return record.createdAt
  }

  const matchedId = String(record.id || '').match(/(\d{10,})/)
  if (matchedId) {
    return Number(matchedId[1])
  }

  return Date.now()
}

function formatDurationText(seconds: number) {
  if (seconds <= 0) return '0分钟'

  const totalMinutes = Math.max(1, Math.round(seconds / 60))
  if (totalMinutes < 60) {
    return totalMinutes + '分钟'
  }

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return minutes ? hours + '小时' + minutes + '分钟' : hours + '小时'
}

function buildMeditationTrend(records: MeditationRecord[]) {
  const days: { label: string; key: string; minutes: number }[] = []
  const now = new Date()

  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date(now)
    date.setHours(0, 0, 0, 0)
    date.setDate(now.getDate() - index)
    const month = date.getMonth() + 1
    const day = date.getDate()
    days.push({
      label: `${month}/${day}`,
      key: `${date.getFullYear()}-${month}-${day}`,
      minutes: 0,
    })
  }

  records.forEach((record) => {
    const date = new Date(parseMeditationTimestamp(record))
    const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    const target = days.find((item) => item.key === key)
    if (!target) return
    target.minutes += Math.round(parseMeditationDurationSeconds(record) / 60)
  })

  const maxMinutes = Math.max(...days.map((item) => item.minutes), 1)
  const points: TrendPoint[] = days.map((item, index) => {
    const leftPercent = (index / Math.max(days.length - 1, 1)) * 100
    return {
      label: item.label,
      minutes: item.minutes,
      left: leftPercent + '%',
      bottom: (item.minutes / maxMinutes) * 120 + 'rpx',
    }
  })

  const lines: TrendLine[] = []
  for (let index = 0; index < points.length - 1; index += 1) {
    const startXPercent = (index / Math.max(points.length - 1, 1)) * 100
    const endXPercent = ((index + 1) / Math.max(points.length - 1, 1)) * 100
    const startY = (days[index].minutes / maxMinutes) * 120
    const endY = (days[index + 1].minutes / maxMinutes) * 120
    const widthRpx = (endXPercent - startXPercent) * 5.7
    const deltaY = endY - startY
    const length = Math.sqrt(widthRpx * widthRpx + deltaY * deltaY)
    const angle = (Math.atan2(deltaY, widthRpx) * 180) / Math.PI

    lines.push({
      left: startXPercent + '%',
      bottom: startY + 'rpx',
      width: length + 'rpx',
      rotate: `rotate(${angle}deg)`,
    })
  }

  return { points, lines }
}

Page({
  data: {
    title: '我的',
    sections: [] as ProfileSection[],
    showMeditationStats: false,
    meditationTotalDurationText: '0分钟',
    meditationAverageDurationText: '0分钟',
    meditationTrendPoints: [] as TrendPoint[],
    meditationTrendLines: [] as TrendLine[],
  },

  onShow() {
    this.loadSections()
  },

  loadSections() {
    const chatItems = readChatHistoryRecords().map((item) => ({
      title: item.title,
      meta: item.meta,
      status: item.status,
      messageId: item.messageId,
      themeId: item.themeId,
    }))

    const meditationItems = readMeditationHistoryRecords().map((item) => ({
      title: item.title,
      meta: item.meta,
      status: item.status,
    }))

    const communityItems = readOwnCommunityPosts().map((item) => ({
      title: item.title,
      meta: item.createdAt,
      status: item.auditStatus === 'pending' ? '审核中' : '已发布',
    }))

    const sections: ProfileSection[] = [
      {
        id: 'chat',
        title: '对话记录',
        subtitle: '保存最近的 AI 聊天内容与语音互动',
        expanded: true,
        items: chatItems.length ? chatItems : [{ title: '暂无对话记录', meta: '去 AI 聊天页发送第一条消息', status: '空' }],
      },
      {
        id: 'meditation',
        title: '冥想记录',
        subtitle: '查看最近完成的冥想时长与主题偏好',
        expanded: false,
        items: meditationItems.length
          ? meditationItems
          : [{ title: '暂无冥想记录', meta: '去冥想页完成一次练习', status: '空' }],
      },
      {
        id: 'community',
        title: '社区发表记录',
        subtitle: '汇总你发布过的动态与审核状态',
        expanded: false,
        items: communityItems.length
          ? communityItems
          : [{ title: '暂无社区发表记录', meta: '去社区页发布第一条内容', status: '空' }],
      },
      {
        id: 'settings',
        title: '用户设置',
        subtitle: '主题、语音风格与提醒偏好',
        expanded: false,
        items: buildSettingsItems(),
      },
    ]

    this.setData({ sections })
  },

  toggleSection(e: WechatMiniprogram.CustomEvent) {
    const sectionId = String(e.currentTarget.dataset.sectionId || '') as ProfileSectionId
    if (!sectionId) return

    const nextSections = this.data.sections.map((section) => {
      if (section.id !== sectionId) return section
      return {
        ...section,
        expanded: !section.expanded,
      }
    })

    this.setData({ sections: nextSections })
  },

  openProfileRecord(e: WechatMiniprogram.CustomEvent) {
    const sectionId = String(e.currentTarget.dataset.sectionId || '') as ProfileSectionId
    const action = String(e.currentTarget.dataset.action || '') as ProfileAction

    if (sectionId === 'chat') {
      const messageId = String(e.currentTarget.dataset.messageId || '')
      const themeId = String(e.currentTarget.dataset.themeId || 'forest')
      if (!messageId) return

      wx.navigateTo({
        url: '/pages/feature/feature?feature=ai-chat&theme=' + themeId + '&focusMessageId=' + messageId,
      })
      return
    }

    if (sectionId === 'meditation') {
      this.openMeditationStats()
      return
    }

    if (sectionId === 'settings' && action === 'clear-cache') {
      this.confirmClearCache()
    }
  },

  openMeditationStats() {
    const records = readMeditationHistoryRecords()
    const totalSeconds = records.reduce((sum, item) => sum + parseMeditationDurationSeconds(item), 0)
    const averageSeconds = records.length ? Math.round(totalSeconds / records.length) : 0
    const trend = buildMeditationTrend(records)

    this.setData({
      showMeditationStats: true,
      meditationTotalDurationText: formatDurationText(totalSeconds),
      meditationAverageDurationText: formatDurationText(averageSeconds),
      meditationTrendPoints: trend.points,
      meditationTrendLines: trend.lines,
    })
  },

  closeMeditationStats() {
    this.setData({
      showMeditationStats: false,
    })
  },

  confirmClearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '确认清除本地缓存吗？此操作会移除聊天记录、冥想记录、社区缓存和本地设置。',
      confirmText: '确认清除',
      cancelText: '取消',
      success: (res) => {
        if (!res.confirm) return
        wx.clearStorageSync()
        this.setData({
          showMeditationStats: false,
        })
        this.loadSections()
        wx.showToast({
          title: '缓存已清除',
          icon: 'none',
        })
      },
    })
  },
})
