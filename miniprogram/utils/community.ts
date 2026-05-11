export type ThemeId = 'forest' | 'ocean' | 'universe' | 'temple'

export type CommunityComment = {
  id: string
  author: string
  content: string
  createdAt: string
  status: 'approved' | 'pending'
}

export type CommunityPost = {
  id: string
  author: string
  title: string
  content: string
  coverImage: string
  images: string[]
  likeCount: number
  commentCount: number
  liked: boolean
  createdAt: string
  auditStatus?: 'pending' | 'approved'
  comments: CommunityComment[]
}

function storageKey(themeId: ThemeId) {
  return `community_posts_${themeId}`
}

function createDefaultComments(): CommunityComment[] {
  return [
    {
      id: 'comment-seed-1',
      author: '林间旅人',
      content: '这个场景很适合睡前放空，画面和氛围都很稳。',
      createdAt: '刚刚',
      status: 'approved',
    },
    {
      id: 'comment-seed-2',
      author: '晚风',
      content: '我今天也是在这张主题里慢慢冷静下来的。',
      createdAt: '2分钟前',
      status: 'approved',
    },
  ]
}

function createDefaultPosts(themeId: ThemeId, background: string, themeText: string): CommunityPost[] {
  const baseComments = createDefaultComments()
  return [
    {
      id: `${themeId}-post-1`,
      author: '慢慢来的人',
      title: `${themeText}夜色里，我把今天的疲惫说了出来`,
      content:
        '刚做完十分钟呼吸练习，情绪没有立刻消失，但身体已经先慢了下来。把这段风景留在这里，提醒自己今天也认真休息过。',
      coverImage: background,
      images: [background],
      likeCount: 28,
      commentCount: baseComments.length,
      liked: false,
      createdAt: '3分钟前',
      auditStatus: 'approved',
      comments: baseComments,
    },
    {
      id: `${themeId}-post-2`,
      author: '今晚先睡觉',
      title: '记录一个情绪终于落地的瞬间',
      content:
        '今天在通勤路上很烦躁，回来后没有做别的，只盯着主题背景发了一会儿呆。后来发现呼吸真的慢下来了，整个人也没那么紧了。',
      coverImage: background,
      images: [background],
      likeCount: 16,
      commentCount: 1,
      liked: false,
      createdAt: '12分钟前',
      auditStatus: 'approved',
      comments: [
        {
          id: 'comment-seed-3',
          author: '山雾',
          content: '这种“什么都不做”的恢复方式很有效。',
          createdAt: '8分钟前',
          status: 'approved',
        },
      ],
    },
    {
      id: `${themeId}-post-3`,
      author: '晨光',
      title: '把今天想说的话留在评论区',
      content:
        '如果你也刚从很满的一天里退出来，可以在这里写一句话。哪怕只是“我现在有点累”，也算是给自己一个落点。',
      coverImage: background,
      images: [background],
      likeCount: 33,
      commentCount: 0,
      liked: false,
      createdAt: '21分钟前',
      auditStatus: 'approved',
      comments: [],
    },
    {
      id: `${themeId}-post-4`,
      author: '小岛',
      title: '今天的主题卡片像在替我守住安静',
      content:
        '社交信息太多的时候，我就会切回这个页面。没有人催我，没有人要我立刻回应，先坐一会儿也可以。',
      coverImage: background,
      images: [background],
      likeCount: 9,
      commentCount: 0,
      liked: false,
      createdAt: '35分钟前',
      auditStatus: 'approved',
      comments: [],
    },
    {
      id: `${themeId}-post-5`,
      author: '晚安信号',
      title: '想把这份平静继续传下去',
      content:
        '如果你刚好刷到这里，希望你也记得给自己留一点缓冲。先呼吸，先坐下，再决定接下来要做什么。',
      coverImage: background,
      images: [background],
      likeCount: 41,
      commentCount: 2,
      liked: false,
      createdAt: '48分钟前',
      auditStatus: 'approved',
      comments: [
        {
          id: 'comment-seed-4',
          author: '浮云',
          content: '谢谢你，刚好看到这句话。',
          createdAt: '30分钟前',
          status: 'approved',
        },
        {
          id: 'comment-seed-5',
          author: '夜航',
          content: '今天确实需要一点缓冲。',
          createdAt: '26分钟前',
          status: 'approved',
        },
      ],
    },
  ]
}

function normalizePosts(posts: CommunityPost[]): CommunityPost[] {
  return posts.map((post) => ({
    ...post,
    images: post.images || [],
    comments: post.comments || [],
    commentCount: typeof post.commentCount === 'number' ? post.commentCount : (post.comments || []).length,
    likeCount: typeof post.likeCount === 'number' ? post.likeCount : 0,
    liked: Boolean(post.liked),
    auditStatus: post.auditStatus || 'approved',
  }))
}

export function readCommunityPosts(themeId: ThemeId, background: string, themeText: string): CommunityPost[] {
  const stored = wx.getStorageSync(storageKey(themeId))
  if (Array.isArray(stored) && stored.length > 0) {
    return normalizePosts(stored as CommunityPost[])
  }

  const defaultPosts = createDefaultPosts(themeId, background, themeText)
  writeCommunityPosts(themeId, defaultPosts)
  return defaultPosts
}

export function writeCommunityPosts(themeId: ThemeId, posts: CommunityPost[]) {
  wx.setStorageSync(storageKey(themeId), posts)
}

export function findCommunityPost(themeId: ThemeId, postId: string, background: string, themeText: string) {
  return readCommunityPosts(themeId, background, themeText).find((post) => post.id === postId) || null
}

export function toggleCommunityPostLike(
  themeId: ThemeId,
  postId: string,
  background: string,
  themeText: string,
) {
  const posts = readCommunityPosts(themeId, background, themeText)
  const nextPosts = posts.map((post) => {
    if (post.id !== postId) return post
    const nextLiked = !post.liked
    return {
      ...post,
      liked: nextLiked,
      likeCount: Math.max(0, post.likeCount + (nextLiked ? 1 : -1)),
    }
  })
  writeCommunityPosts(themeId, nextPosts)
  return nextPosts.find((post) => post.id === postId) || null
}

export function addCommunityComment(
  themeId: ThemeId,
  postId: string,
  content: string,
  background: string,
  themeText: string,
) {
  const posts = readCommunityPosts(themeId, background, themeText)
  const comment: CommunityComment = {
    id: `comment-${Date.now()}`,
    author: '我',
    content,
    createdAt: '刚刚',
    status: 'pending',
  }

  const nextPosts = posts.map((post) => {
    if (post.id !== postId) return post
    return {
      ...post,
      comments: [comment, ...post.comments],
      commentCount: post.commentCount + 1,
    }
  })

  writeCommunityPosts(themeId, nextPosts)
  return nextPosts.find((post) => post.id === postId) || null
}

export function addCommunityPost(themeId: ThemeId, post: CommunityPost, background: string, themeText: string) {
  const posts = readCommunityPosts(themeId, background, themeText)
  const nextPosts = [post, ...posts]
  writeCommunityPosts(themeId, nextPosts)
  return nextPosts
}

export function readOwnCommunityPosts() {
  const themes: ThemeId[] = ['forest', 'ocean', 'universe', 'temple']
  const allPosts = themes.flatMap((themeId) => {
    const background = `/assets/themes/theme-${themeId}.jpg`
    const themeText = `${themeId}主题`
    return readCommunityPosts(themeId, background, themeText)
      .filter((post) => post.author === '我')
      .map((post) => ({
        ...post,
        themeId,
      }))
  })

  return allPosts.sort((a, b) => {
    const left = Number(String(a.id).split('-').pop() || 0)
    const right = Number(String(b.id).split('-').pop() || 0)
    return right - left
  })
}
