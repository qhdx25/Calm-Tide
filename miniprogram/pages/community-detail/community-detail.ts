import {
  type CommunityPost,
  type ThemeId,
  addCommunityComment,
  findCommunityPost,
  toggleCommunityPostLike,
} from '../../utils/community'

const themeTitleMap: Record<ThemeId, string> = {
  forest: '森林',
  ocean: '海洋',
  universe: '宇宙',
  temple: '古寺',
}

Page({
  data: {
    title: '内容详情',
    themeId: 'forest' as ThemeId,
    themeBackground: '/assets/themes/theme-forest.jpg',
    themeText: '森林主题',
    post: null as CommunityPost | null,
    showCommentInput: false,
    commentInputValue: '',
  },

  onLoad(query: Record<string, string | undefined>) {
    const theme = (query.theme || 'forest') as ThemeId
    const safeTheme = themeTitleMap[theme] ? theme : 'forest'
    const themeBackground = '/assets/themes/theme-' + safeTheme + '.jpg'
    const themeText = themeTitleMap[safeTheme] + '主题'
    const postId = String(query.postId || '')

    this.setData({
      themeId: safeTheme,
      themeBackground,
      themeText,
    })

    if (postId) {
      this.loadPost(postId)
    }
  },

  loadPost(postId: string) {
    const post = findCommunityPost(this.data.themeId, postId, this.data.themeBackground, this.data.themeText)
    if (!post) {
      wx.showToast({
        title: '内容不存在',
        icon: 'none',
      })
      return
    }

    this.setData({ post })
  },

  toggleLike() {
    const post = this.data.post
    if (!post) return
    const nextPost = toggleCommunityPostLike(this.data.themeId, post.id, this.data.themeBackground, this.data.themeText)
    if (nextPost) {
      this.setData({ post: nextPost })
    }
  },

  openCommentInput() {
    this.setData({
      showCommentInput: true,
      commentInputValue: '',
    })
  },

  closeCommentInput() {
    this.setData({
      showCommentInput: false,
      commentInputValue: '',
    })
  },

  onCommentInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ commentInputValue: e.detail.value })
  },

  submitComment() {
    const post = this.data.post
    const content = String(this.data.commentInputValue || '').trim()
    if (!post || !content) return

    const nextPost = addCommunityComment(
      this.data.themeId,
      post.id,
      content,
      this.data.themeBackground,
      this.data.themeText,
    )

    if (nextPost) {
      this.setData({
        post: nextPost,
        showCommentInput: false,
        commentInputValue: '',
      })
    }
  },
})
