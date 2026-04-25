import {
  type CommunityPost,
  type ThemeId,
  addCommunityPost,
} from '../../utils/community'
import { formatHistoryTime } from '../../utils/profile-history'

const themeTitleMap: Record<ThemeId, string> = {
  forest: '森林',
  ocean: '海洋',
  universe: '宇宙',
  temple: '古寺',
}

Page({
  data: {
    title: '发布内容',
    themeId: 'forest' as ThemeId,
    themeBackground: '/assets/themes/theme-forest.jpg',
    textValue: '',
    imageList: [] as string[],
    canPublish: false,
  },

  onLoad(query: Record<string, string | undefined>) {
    const theme = (query.theme || 'forest') as ThemeId
    const safeTheme = themeTitleMap[theme] ? theme : 'forest'
    this.setData({
      themeId: safeTheme,
      themeBackground: '/assets/themes/theme-' + safeTheme + '.jpg',
    })
  },

  onTextInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    const textValue = e.detail.value.slice(0, 500)
    this.setData({
      textValue,
      canPublish: this.canPublish(textValue, this.data.imageList),
    })
  },

  chooseImages() {
    const remainCount = 9 - this.data.imageList.length
    if (remainCount <= 0) return

    wx.chooseImage({
      count: remainCount,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const nextImageList = this.data.imageList.concat(res.tempFilePaths).slice(0, 9)
        this.setData({
          imageList: nextImageList,
          canPublish: this.canPublish(this.data.textValue, nextImageList),
        })
      },
    })
  },

  removeImage(e: WechatMiniprogram.CustomEvent) {
    const index = Number(e.currentTarget.dataset.index || 0)
    const nextImageList = this.data.imageList.filter((_, currentIndex) => currentIndex !== index)
    this.setData({
      imageList: nextImageList,
      canPublish: this.canPublish(this.data.textValue, nextImageList),
    })
  },

  publishPost() {
    if (!this.data.canPublish) return

    const content = String(this.data.textValue || '').trim()
    const images = this.data.imageList.slice(0, 9)
    const themeText = themeTitleMap[this.data.themeId] + '主题'
    const title = content ? content.slice(0, 22) : '新的社区动态'
    const post: CommunityPost = {
      id: 'publish-' + Date.now(),
      author: '我',
      title,
      content,
      coverImage: images[0] || this.data.themeBackground,
      images: images.length ? images : [this.data.themeBackground],
      likeCount: 0,
      commentCount: 0,
      liked: false,
      createdAt: formatHistoryTime(),
      auditStatus: 'pending',
      comments: [],
    }

    addCommunityPost(this.data.themeId, post, this.data.themeBackground, themeText)

    wx.showToast({
      title: '发布成功，审核中',
      icon: 'none',
    })

    setTimeout(() => {
      wx.navigateBack()
    }, 600)
  },

  canPublish(textValue: string, imageList: string[]) {
    return Boolean(String(textValue || '').trim() || imageList.length)
  },
})
