<template>
  <view class="page">
    <AppHeader />
    <view class="content">
      <template v-if="remoteBlocks.length">
        <view v-for="block in remoteBlocks" :key="block.id" class="remote-block">
          <view v-if="block.type === 'banner'" class="hero" :style="bannerStyle(block)">
            <image :src="block.image" mode="aspectFill" />
            <view class="hero-mask">
              <view class="tag tag-orange">{{ block.badge || '精选推荐' }}</view>
              <view class="hero-title">{{ block.title }}</view>
              <view class="hero-desc">{{ block.subtitle }}</view>
            </view>
          </view>

          <view v-else-if="block.type === 'activity'" class="activity" :style="cardStyle(block, '#fff5e9')" @click="go('/pages/points/activity')">
            <view class="activity-icon">🎁</view>
            <view class="activity-main">
              <view class="title-row"><text class="activity-title">{{ block.title }}</text><text class="orange">{{ currentPoints }}/{{ exchangeScore }}</text></view>
              <view class="progress"><view class="progress-in" :style="{ width: pointsProgress + '%' }" /></view>
              <view class="sub activity-sub">邀请好友审核通过，积分自动到账</view>
            </view>
            <view class="activity-btn">{{ block.button || '立即查看' }}</view>
          </view>

          <view v-else-if="block.type === 'grid'" class="dynamic-section" :style="cardStyle(block)">
            <view class="section-title">{{ block.title }}</view>
            <view class="grid" :style="{ gridTemplateColumns: `repeat(${block.columns || 3},1fr)` }">
              <view v-for="(item, index) in homeGridItems(block)" :key="item.text || index" class="grid-item" @click="entry({ name: item.text, url: item.link || urlMap[index] || '' })">
                <view class="grid-icon">{{ item.icon || iconMap[index % iconMap.length] }}</view>
                <view class="grid-name">{{ item.text }}</view>
              </view>
            </view>
          </view>

          <view v-else-if="block.type === 'study'" class="dynamic-section" :style="cardStyle(block)">
            <view class="section-title">{{ block.title }}</view>
            <view class="card">
              <view class="title-row"><view><view class="card-title">{{ block.title }} 🔥</view><view class="sub">{{ block.subtitle }}</view></view><view class="big green">{{ block.progress || 0 }}%</view></view>
              <view class="progress study-progress"><view class="progress-in" :style="{ width: (block.progress || 0) + '%' }" /></view>
              <view class="divider" />
              <view class="task"><text>✓ 英语真题训练</text><text class="green">已完成</text></view>
              <view class="task"><text>○ 专业课知识点复习</text><text class="orange">去完成 ›</text></view>
            </view>
          </view>

          <view v-else-if="block.type === 'smart'" class="smart-block" :style="smartStyle(block)" @click="go(block.link || '/pages/custom/params')">
            <view v-if="smartIcon(block)" class="smart-icon" :style="{ color: block.iconColor || block.textColor || '' }">{{ smartIcon(block) }}</view>
            <view class="smart-main">
              <view class="tag" :style="{ color: block.labelColor || block.textColor || '' }">{{ block.label || 'AI 智能匹配' }}</view>
              <view class="smart-title" :style="{ color: block.titleColor || '' }">{{ block.title }}</view>
              <view class="sub" :style="{ color: block.textColor || '' }">{{ block.subtitle }}</view>
            </view>
          </view>

          <view v-else-if="block.type === 'routes'" class="dynamic-section" :style="cardStyle(block)">
            <view class="title-row"><view class="section-title" :style="{ color: block.titleColor || '' }">{{ block.title }}</view><text class="sub" :style="{ color: block.textColor || '' }">{{ block.subtitle }}</text></view>
            <scroll-view v-if="limitedRoutes(block).length" scroll-x class="route-scroll">
              <view v-for="route in limitedRoutes(block)" :key="route.id || route.name" class="home-route" @click="openRoute(route)">
                <image :src="route.image" mode="aspectFill" />
                <view class="home-route-body"><b>{{ route.name }}</b><text>{{ route.days }} · {{ Number(route.price) }} 积分</text></view>
              </view>
            </scroll-view>
            <view v-else class="empty-list">暂无上架路线</view>
          </view>

          <view v-else-if="block.type === 'schools'" class="dynamic-section list-section" :style="cardStyle(block)">
            <view class="title-row"><view class="section-title" :style="{ color: block.titleColor || '' }">{{ block.title }}</view><text class="sub" :style="{ color: block.textColor || '' }">{{ block.subtitle }}</text></view>
            <view v-for="school in limitedSchools(block)" :key="school.id || school.name" class="home-list-item" @click="go('/pages/schools/index')">
              <image v-if="school.logo" class="home-list-logo" :src="school.logo" mode="aspectFill" />
              <view v-else class="home-list-avatar">{{ firstChar(school) }}</view>
              <view class="home-list-main"><b>{{ school.name }}</b><text>已入驻 · 可展示站点服务</text></view>
              <text class="home-list-arrow">→</text>
            </view>
            <view v-if="!limitedSchools(block).length" class="empty-list">暂无已入驻学校</view>
          </view>

          <view v-else-if="block.type === 'articles'" class="dynamic-section list-section" :style="cardStyle(block)">
            <view class="title-row"><view class="section-title" :style="{ color: block.titleColor || '' }">{{ block.title }}</view><text class="sub" :style="{ color: block.textColor || '' }">{{ block.subtitle }}</text></view>
            <view v-for="article in limitedArticles(block)" :key="article.id || article.slug" class="home-list-item" @click="openArticle(article)">
              <view class="home-list-avatar">文</view>
              <view class="home-list-main"><b>{{ article.title }}</b><text>{{ article.category || '平台文章' }} · 已发布</text></view>
              <text class="home-list-arrow">→</text>
            </view>
            <view v-if="!limitedArticles(block).length" class="empty-list">暂无已发布文章</view>
          </view>

          <view v-else-if="block.type === 'video'" class="dynamic-section" :class="{ 'video-playing': isVideoPlaying(block), 'video-section-active': isVideoActive(block) }" :style="cardStyle(block)">
            <view class="section-title">{{ block.title }}</view>
            <view class="video-card" :class="{ 'video-active': isVideoActive(block) }" :style="videoStyle(block)">
              <video
                v-if="videoSource(block)"
                :id="videoElementId(block)"
                :key="videoKey(block)"
                class="video-player"
                :src="videoSource(block)"
                :poster="block.image"
                :controls="isVideoActive(block)"
                :autoplay="isVideoActive(block)"
                :show-center-play-btn="false"
                object-fit="contain"
                direction="0"
                play-btn-position="bottom"
                @play="setVideoPlaying(block, true)"
                @pause="setVideoPlaying(block, false)"
                @fullscreenchange="handleVideoFullscreenChange"
                @ended="resetVideo(block)"
              />
              <view v-if="!isVideoActive(block)" class="video-cover" @click.stop="startVideo(block)">
                <image :src="block.image" mode="aspectFill" />
                <view class="play"></view>
              </view>
              <view class="video-txt">{{ block.subtitle }}</view>
            </view>
          </view>

          <view v-else-if="block.type === 'spacer'" class="spacer-block" :style="{ height: spacerHeight(block) }"></view>

          <view v-else class="notice-block" :style="cardStyle(block)" @click="openNotice(block)"><b :style="{ color: block.titleColor || '' }">{{ noticeTitle(block) }}</b><text :style="{ color: block.textColor || '' }">{{ noticeSubtitle(block) }}</text></view>
        </view>
      </template>

      <template v-else>
        <swiper class="hero" circular autoplay interval="4200" indicator-dots indicator-active-color="#ff7a35">
          <swiper-item v-for="s in slides" :key="s.title"><view class="hero"><image :src="s.img" mode="aspectFill" /><view class="hero-mask"><view class="tag tag-orange">{{ s.kicker }}</view><view class="hero-title">{{ s.title }}</view><view class="hero-desc">{{ s.desc }}</view></view></view></swiper-item>
        </swiper>
        <view class="activity" @click="go('/pages/points/activity')"><view class="activity-icon">🎁</view><view class="activity-main"><view class="title-row"><text class="activity-title">邀好友赚积分，免费泰山经典游</text><text class="orange">{{ currentPoints }}/{{ exchangeScore }}</text></view><view class="progress"><view class="progress-in" :style="{ width: pointsProgress + '%' }" /></view></view><view class="activity-btn">立即邀请</view></view>
        <view class="section-title">学 · 游一站式服务</view><view class="grid"><view v-for="(g, i) in fallbackGrids" :key="g.name" class="grid-item" @click="entry(g)"><view class="grid-icon">{{ iconMap[i] }}</view><view class="grid-name">{{ g.name }}</view></view></view>
        <view class="section-title">今日上岸计划</view><view class="card"><view class="card-title">连续打卡 7 天 🔥</view><view class="sub">今天再完成 2 项，离目标更近一步</view></view>
      </template>
    </view>
    <BottomNav active="首页" />
    <view v-if="showPop" class="mask" @click.self="closePop">
      <view class="popup"><view class="pop-visual"><text>⛰️</text><view>100 积分 · 泰山见</view></view><view class="pop-body"><view class="pop-title">邀友攒分免费游泰山</view><view class="pop-text">好友扫描专属二维码注册并通过管理员审核后，邀请积分自动到账；满 100 分可兑换 2 天 1 夜泰山全包游。</view><view class="btn btn-primary" @click="invite">立即邀请</view><view class="later" @click="closePop">稍后再说</view></view></view>
    </view>
  </view>
</template>

<script setup>
import { computed, getCurrentInstance, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { onHide, onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import AppHeader from '../../components/AppHeader.vue'
import BottomNav from '../../components/BottomNav.vue'
import { getAnnouncements, getArticles, getInviteDashboard, getPublishedConfig, getPublicRoutes, getSchoolSites, isLoggedIn, trackPreference } from '../../utils/api.js'

const showPop = ref(false)
const remoteBlocks = ref([])
const remoteRoutes = ref([])
const remoteArticles = ref([])
const remoteSchools = ref([])
const remoteAnnouncements = ref([])
const routesLoaded = ref(false)
const currentPoints = ref(Number(uni.getStorageSync('points') || 0))
const exchangeScore = ref(100)
const videoResetSeeds = ref({})
const videoActive = ref({})
const videoPlaying = ref({})
const currentInstance = getCurrentInstance()
let videoVisibilityTimer = null
const videoFullscreen = ref(false)
const fullscreenScrollTop = ref(0)
const iconMap = ['📝', '📚', '🧭', '🎁', '🪙', '🎓', '🗺️', '✨']
const urlMap = ['/pages/study/index', '/pages/study/index', '/pages/travel/index', '/pages/points/activity', '/pages/mine/points', '/pages/study/center']
const fallbackGrids = [
  { name: '备考刷题', url: '/pages/study/index' },
  { name: '资料商城', url: '/pages/study/index' },
  { name: '定制旅行', url: '/pages/travel/index' },
  { name: '邀请有礼', url: '/pages/points/activity' },
  { name: '我的积分', url: '/pages/mine/points' },
  { name: '上岸权益', url: '/pages/study/center' },
]
const slides = [{ kicker: '上岸限定', title: '备考上岸，全包定制长线旅行', desc: '用一次远行，奖励认真生活的自己', img: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200' }]

const routeWeight = route => Number(route?.display_weight ?? route?.displayWeight ?? 0)
const routeIsOnShelf = route => ![false, 0, 'false', '0'].includes(route?.status)
const visibleRoutes = list => (Array.isArray(list) ? list : [])
  .filter(routeIsOnShelf)
  .sort((a, b) => routeWeight(b) - routeWeight(a) || Number(b.id || 0) - Number(a.id || 0))
const schoolWeight = item => Number(item?.display_weight ?? item?.displayWeight ?? 0)
const schoolIsVisible = item => item?.review_status === 'approved' && ![false, 0, 'false', '0'].includes(item?.status)
const visibleSchools = list => (Array.isArray(list) ? list : [])
  .filter(schoolIsVisible)
  .sort((a, b) => schoolWeight(b) - schoolWeight(a) || Number(a.sort_order || 0) - Number(b.sort_order || 0) || Number(b.id || 0) - Number(a.id || 0))
const articleIsPublished = item => ![false, 0, 'false', '0'].includes(item?.status)
const articleSort = (a, b) => Number(!!b.pinned) - Number(!!a.pinned)
  || Number(a.sort_order || 0) - Number(b.sort_order || 0)
  || Number(b.id || 0) - Number(a.id || 0)
const visibleArticles = list => (Array.isArray(list) ? list : []).filter(articleIsPublished).sort(articleSort)
const announcementIsPublished = item => ![false, 0, 'false', '0'].includes(item?.status)
const announcementSort = (a, b) => Number(!!b.pinned) - Number(!!a.pinned)
  || Number(Date.parse(b.published_at || b.updated_at || b.created_at || 0)) - Number(Date.parse(a.published_at || a.updated_at || a.created_at || 0))
  || Number(b.id || 0) - Number(a.id || 0)
const visibleAnnouncements = list => (Array.isArray(list) ? list : []).filter(announcementIsPublished).sort(announcementSort)
const blockAnnouncementId = block => Number(block?.announcementId || block?.announcement_id || 0)

const displayRoutes = computed(() => (routesLoaded.value ? remoteRoutes.value : []))
const pointsProgress = computed(() => Math.min(100, Math.round(currentPoints.value / Math.max(1, exchangeScore.value) * 100)))
const limitedRoutes = block => displayRoutes.value.slice(0, Number(block?.limit || 12))
const limitedSchools = block => remoteSchools.value.slice(0, Number(block?.limit || 5))
const limitedArticles = block => {
  const ids = Array.isArray(block?.articleIds) ? block.articleIds.map(Number).filter(Boolean) : []
  const source = ids.length
    ? ids.map(id => remoteArticles.value.find(article => Number(article.id) === id)).filter(Boolean)
    : remoteArticles.value
  return source.slice(0, Number(block?.limit || 5))
}
const noticeAnnouncement = block => {
  const id = blockAnnouncementId(block)
  return id ? remoteAnnouncements.value.find(item => Number(item.id) === id) : null
}
const noticeTitle = block => noticeAnnouncement(block)?.title || block?.title
const noticeSubtitle = block => noticeAnnouncement(block)?.summary || block?.subtitle
const shadowMap = {
  none: 'none',
  soft: '0 10rpx 28rpx rgba(17,47,42,.055)',
  strong: '0 18rpx 42rpx rgba(17,47,42,.12)',
}
const cardStyle = (block, fallback = '#fff') => ({
  background: block?.background || fallback,
  borderRadius: `${Number(block?.radius || 28)}rpx`,
  padding: `${Number(block?.padding || 28)}rpx`,
  boxShadow: shadowMap[block?.shadow] || undefined,
})
const bannerStyle = block => ({
  borderRadius: `${Number(block?.radius || 30)}rpx`,
  height: `${Number(block?.height || 330)}rpx`,
  boxShadow: shadowMap[block?.shadow] || undefined,
})
const smartStyle = block => {
  const style = cardStyle(block, '#dff5ef')
  if (block?.image) {
    style.backgroundImage = `url('${block.image}')`
    style.backgroundSize = 'cover'
    style.backgroundPosition = 'center'
  }
  return style
}
const videoStyle = block => ({
  height: `${Number(block?.video_height || 330)}rpx`,
  borderRadius: `${Number(block?.radius || 24)}rpx`,
})
const spacerHeight = block => `${Number(block?.height || 40)}rpx`
const homeGridItems = block => {
  const list = Array.isArray(block?.gridItems) ? block.gridItems : block?.items || []
  return list.map((item, index) => typeof item === 'string'
    ? { icon: iconMap[index % iconMap.length], text: item, link: urlMap[index] || '' }
    : { icon: item.icon || iconMap[index % iconMap.length], text: item.text || item.name || '入口', link: item.link || urlMap[index] || '' })
}

let refreshTimer = null
const loadHome = async () => {
  const [config, routes, invite] = await Promise.all([
    getPublishedConfig(),
    getPublicRoutes(),
    isLoggedIn() ? getInviteDashboard().catch(() => null) : Promise.resolve(null),
  ])
  const home = config?.pages?.find(page => page.id === 'home')
  const blocks = Array.isArray(home?.blocks) ? home.blocks.filter(block => block.visible !== false) : []
  remoteBlocks.value = blocks
  remoteRoutes.value = visibleRoutes(routes)
  routesLoaded.value = true

  const needsArticles = blocks.some(block => block.type === 'articles')
  const needsSchools = blocks.some(block => block.type === 'schools')
  const needsAnnouncements = blocks.some(block => block.type === 'notice' && blockAnnouncementId(block))
  const [articles, schools, announcements] = await Promise.all([
    needsArticles ? getArticles().catch(() => []) : Promise.resolve([]),
    needsSchools ? getSchoolSites().catch(() => []) : Promise.resolve([]),
    needsAnnouncements ? getAnnouncements().catch(() => []) : Promise.resolve([]),
  ])
  remoteArticles.value = visibleArticles(articles)
  remoteSchools.value = visibleSchools(schools)
  remoteAnnouncements.value = visibleAnnouncements(announcements)

  if (invite) {
    currentPoints.value = invite.points
    exchangeScore.value = invite.exchange_score
    uni.setStorageSync('points', invite.points)
  }
}
const startAutoRefresh = () => {
  clearInterval(refreshTimer)
  loadHome()
  refreshTimer = setInterval(loadHome, 3000)
}
const stopAutoRefresh = () => {
  clearInterval(refreshTimer)
  refreshTimer = null
}
const smartIcon = block => block && Object.prototype.hasOwnProperty.call(block, 'icon') ? String(block.icon || '').trim() : '✦'
const firstChar = item => String(item?.short_name || item?.name || '校').slice(0, 1)
const go = url => {
  if (!url) return
  uni.navigateTo({ url })
}
const closePop = () => {
  showPop.value = false
  uni.setStorageSync('welcomeSeen', true)
}
const entry = g => {
  if (['备考刷题', '资料商城'].includes(g.name)) {
    trackPreference({ type: 'study', key: g.name === '备考刷题' ? 'exam_questions' : 'materials', name: g.name, action: 'entry_click', score: 2 })
  }
  g.url ? go(g.url) : uni.showToast({ title: `${g.name}功能演示`, icon: 'none' })
}
const openRoute = route => {
  trackPreference({ type: 'route', key: route.id || route.name, name: route.name, action: 'view', score: 1 })
  go('/pages/custom/detail')
}
const openArticle = article => {
  const key = article?.slug || article?.id
  if (!key) return
  go(`/pages/article/detail?slug=${encodeURIComponent(key)}`)
}
const openNotice = block => {
  const id = blockAnnouncementId(block)
  if (id) {
    go(`/pages/notice/detail?id=${id}`)
    return
  }
  go(block?.link || '')
}
const videoSource = block => String(block?.video_url || block?.videoUrl || block?.url || '').trim()
const videoId = block => String(block?.id || block?.name || block?.title || videoSource(block))
const videoElementId = block => {
  const raw = videoId(block) || videoSource(block) || 'video'
  let hash = 0
  for (let i = 0; i < raw.length; i += 1) hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0
  return `home-video-${Math.abs(hash)}`
}
const videoKey = block => `${videoId(block)}-${videoResetSeeds.value[videoId(block)] || 0}`
const isVideoActive = block => !!videoActive.value[videoId(block)]
const isVideoPlaying = block => !!videoPlaying.value[videoId(block)]
const playNativeVideo = elementId => {
  if (typeof document === 'undefined') return
  const holder = document.getElementById(elementId)
  const video = holder?.tagName === 'VIDEO' ? holder : holder?.querySelector?.('video')
  if (video && typeof video.play === 'function') {
    const result = video.play()
    if (result && typeof result.catch === 'function') result.catch(() => {})
  }
}
const stopNativeVideo = elementId => {
  if (typeof document === 'undefined') return
  const holder = document.getElementById(elementId)
  const video = holder?.tagName === 'VIDEO' ? holder : holder?.querySelector?.('video')
  if (video && typeof video.pause === 'function') {
    video.pause()
    try { video.currentTime = 0 } catch {}
  }
}
const playVideoElement = elementId => {
  const play = () => {
    playNativeVideo(elementId)
    const context = uni.createVideoContext(elementId, currentInstance?.proxy)
    if (context && typeof context.play === 'function') context.play()
  }
  play()
  nextTick(() => setTimeout(play, 30))
}
const startVideo = block => {
  if (!videoSource(block)) return
  const elementId = videoElementId(block)
  playVideoElement(elementId)
  const id = videoId(block)
  videoActive.value = { ...videoActive.value, [id]: true }
  videoPlaying.value = { ...videoPlaying.value, [id]: true }
}
const setVideoPlaying = (block, playing) => {
  const id = videoId(block)
  if (playing) videoActive.value = { ...videoActive.value, [id]: true }
  videoPlaying.value = { ...videoPlaying.value, [id]: playing }
}
const resetVideo = block => {
  const id = videoId(block)
  stopNativeVideo(videoElementId(block))
  videoActive.value = { ...videoActive.value, [id]: false }
  videoPlaying.value = { ...videoPlaying.value, [id]: false }
  videoResetSeeds.value = { ...videoResetSeeds.value, [id]: (videoResetSeeds.value[id] || 0) + 1 }
}
const isElementVisible = elementId => {
  if (typeof document === 'undefined') return true
  const element = document.getElementById(elementId)
  if (!element) return true
  const rect = element.getBoundingClientRect()
  const height = window.innerHeight || document.documentElement.clientHeight
  const width = window.innerWidth || document.documentElement.clientWidth
  return rect.bottom > 0 && rect.right > 0 && rect.top < height && rect.left < width
}
const isNativeFullscreen = () => typeof document !== 'undefined' && !!(
  document.fullscreenElement ||
  document.webkitFullscreenElement ||
  document.mozFullScreenElement ||
  document.msFullscreenElement
)
const getScrollTop = () => typeof window === 'undefined'
  ? 0
  : (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0)
const restoreScrollTop = () => {
  if (typeof window === 'undefined') return
  const top = fullscreenScrollTop.value
  ;[0, 60, 180].forEach(delay => setTimeout(() => window.scrollTo(0, top), delay))
}
const handleVideoFullscreenChange = event => {
  const fullscreen = !!(event?.detail?.fullScreen ?? event?.detail?.fullscreen ?? isNativeFullscreen())
  if (fullscreen) fullscreenScrollTop.value = getScrollTop()
  if (videoFullscreen.value && !fullscreen) restoreScrollTop()
  videoFullscreen.value = fullscreen
}
const handleNativeFullscreenChange = () => {
  const fullscreen = isNativeFullscreen()
  if (fullscreen) fullscreenScrollTop.value = getScrollTop()
  if (videoFullscreen.value && !fullscreen) restoreScrollTop()
  videoFullscreen.value = fullscreen
  scheduleVideoVisibilityCheck()
}
const checkVideoVisibility = () => {
  if (videoFullscreen.value || isNativeFullscreen()) return
  remoteBlocks.value.forEach(block => {
    if (block.type === 'video' && isVideoActive(block) && !isElementVisible(videoElementId(block))) resetVideo(block)
  })
}
const scheduleVideoVisibilityCheck = () => {
  clearTimeout(videoVisibilityTimer)
  videoVisibilityTimer = setTimeout(checkVideoVisibility, 80)
}
const invite = () => {
  closePop()
  go('/pages/points/activity')
}

onMounted(() => {
  if (!uni.getStorageSync('welcomeSeen')) setTimeout(() => showPop.value = true, 400)
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', scheduleVideoVisibilityCheck, { passive: true })
    window.addEventListener('resize', scheduleVideoVisibilityCheck)
    document.addEventListener('fullscreenchange', handleNativeFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleNativeFullscreenChange)
  }
})
onShow(startAutoRefresh)
onHide(stopAutoRefresh)
onUnmounted(() => {
  stopAutoRefresh()
  clearTimeout(videoVisibilityTimer)
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', scheduleVideoVisibilityCheck)
    window.removeEventListener('resize', scheduleVideoVisibilityCheck)
    document.removeEventListener('fullscreenchange', handleNativeFullscreenChange)
    document.removeEventListener('webkitfullscreenchange', handleNativeFullscreenChange)
  }
})
onPullDownRefresh(async () => {
  await loadHome()
  uni.stopPullDownRefresh()
})
</script>
<style scoped>
.remote-block{margin:0 0 20rpx}.remote-block:last-child{margin-bottom:8rpx}.remote-block>.hero{margin:0}.remote-block .card{margin-bottom:0}.remote-block+.remote-block>.dynamic-section{padding-top:2rpx}.dynamic-section .section-title{margin:0 0 16rpx}.video-playing .video-txt,.video-active .video-txt{opacity:0;visibility:hidden}.activity{display:flex;align-items:center;gap:18rpx;padding:25rpx 24rpx;border:2rpx solid #ffe0c7;border-radius:26rpx;box-shadow:0 8rpx 26rpx rgba(28,66,59,.05)}.activity-icon{font-size:44rpx}.activity-main{flex:1}.activity-title{font-size:25rpx;font-weight:800}.activity-btn{background:#ff7a35;color:#fff;padding:14rpx;border-radius:15rpx;font-size:22rpx}.activity-sub{margin-top:9rpx}.remote-block .grid{gap:14rpx}.remote-block .grid-item{padding:22rpx 8rpx;border-radius:22rpx}.task{display:flex;justify-content:space-between;padding:14rpx 0}.study-progress{margin-top:22rpx}.smart-block{display:flex;align-items:center;padding:28rpx;border-radius:26rpx;box-shadow:0 8rpx 26rpx rgba(18,165,148,.07)}.smart-icon{font-size:55rpx;color:#12a594;margin-right:22rpx}.smart-main{flex:1}.smart-title{font-size:34rpx;font-weight:900;margin:6rpx 0}.smart-arrow{width:65rpx;height:65rpx;border-radius:50%;background:#12a594;color:#fff;display:flex;align-items:center;justify-content:center;font-size:38rpx}.route-scroll{white-space:nowrap;padding:2rpx 0 8rpx}.home-route{display:inline-block;width:300rpx;background:#fff;border-radius:22rpx;overflow:hidden;margin-right:16rpx;vertical-align:top;box-shadow:0 8rpx 24rpx rgba(28,66,59,.06)}.home-route:last-child{margin-right:0}.home-route image{width:100%;height:190rpx}.home-route-body{padding:17rpx 18rpx 19rpx}.home-route-body b,.home-route-body text{display:block;white-space:normal}.home-route-body text{font-size:22rpx;color:#778684;margin-top:7rpx}.list-section{background:#fff;border-radius:26rpx;padding:26rpx 24rpx;box-shadow:0 8rpx 24rpx rgba(28,66,59,.05)}.list-section .section-title{margin:0}.home-list-item{display:flex;align-items:center;gap:18rpx;padding:20rpx 0;border-bottom:1rpx solid #edf1ef}.home-list-item:last-child{border-bottom:0}.home-list-avatar,.home-list-logo{width:76rpx;height:76rpx;border-radius:22rpx;flex-shrink:0}.home-list-avatar{background:#eaf7f3;color:#173f38;display:flex;align-items:center;justify-content:center;font-weight:900}.home-list-main{flex:1;min-width:0}.home-list-main b,.home-list-main text{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.home-list-main b{font-size:26rpx;color:#172c2a}.home-list-main text{margin-top:6rpx;color:#82918d;font-size:21rpx}.home-list-arrow{color:#9aa8a4;font-size:30rpx}.empty-list{text-align:center;color:#879591;padding:30rpx}.video-card{height:330rpx;border-radius:26rpx;overflow:hidden;position:relative;box-shadow:0 10rpx 28rpx rgba(17,47,42,.09);background:#173f38}.video-card:after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(9,35,31,0),rgba(9,35,31,.58));pointer-events:none}.video-active:after{display:none}.video-card image,.video-player{width:100%;height:100%;display:block}.video-cover{position:absolute;z-index:2;inset:0}.video-cover image{width:100%;height:100%;display:block}.play{position:absolute;z-index:2;left:50%;top:50%;transform:translate(-50%,-50%);width:78rpx;height:78rpx;border-radius:50%;background:rgba(255,255,255,.9);color:#ff7a35;display:flex;align-items:center;justify-content:center;font-size:0}.play:before{content:'';position:absolute;left:50%;top:50%;width:0;height:0;border-top:14rpx solid transparent;border-bottom:14rpx solid transparent;border-left:22rpx solid #ff7a35;transform:translate(-33%,-50%)}.video-txt{position:absolute;z-index:1;left:24rpx;right:24rpx;bottom:24rpx;color:#fff;font-weight:800;pointer-events:none}.notice-block{text-align:center;padding:22rpx 20rpx 26rpx;color:#778684}.notice-block b,.notice-block text{display:block}.notice-block text{font-size:22rpx;margin-top:7rpx}.spacer-block{background:transparent}.mask{position:fixed;inset:0;background:rgba(9,28,25,.6);z-index:80;display:flex;align-items:center;justify-content:center;padding:48rpx}.popup{width:100%;background:#fff;border-radius:38rpx;overflow:hidden}.pop-visual{height:230rpx;background:linear-gradient(160deg,#0b655d,#20a999);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-size:28rpx}.pop-visual text{font-size:92rpx}.pop-body{padding:38rpx}.pop-title{text-align:center;font-size:38rpx;font-weight:900}.pop-text{color:#778684;line-height:1.8;margin:20rpx 0 30rpx}.later{text-align:center;color:#899491;padding:24rpx}
.video-active :deep(.uni-video-cover-play-button){display:none!important}
.video-player :deep(video){object-fit:contain!important}
</style>
