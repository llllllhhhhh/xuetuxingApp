<template>
  <view v-if="blocks && blocks.length" class="decorate-blocks">
    <view v-for="block in blocks" :key="block.id" class="decorate-block">
      <view v-if="block.type === 'banner'" class="decor-banner" :style="bannerStyle(block)" @click="bannerHotZones(block).length ? null : go(block.link)">
        <swiper
          v-if="bannerImages(block).length > 1"
          class="decor-banner-swiper"
          circular
          autoplay
          interval="3500"
          duration="500"
        >
          <swiper-item v-for="(url, index) in bannerImages(block)" :key="index">
            <image :src="url" mode="aspectFill" />
          </swiper-item>
        </swiper>
        <image v-else :src="bannerImages(block)[0] || block.image" mode="aspectFill" />
        <view class="decor-banner-mask">
          <text class="decor-badge">{{ block.badge || '精选推荐' }}</text>
          <view class="decor-title" :style="{ color: block.titleColor || '' }">{{ block.title }}</view>
          <view class="decor-subtitle" :style="{ color: block.textColor || '' }">{{ block.subtitle }}</view>
        </view>
        <view
          v-for="(zone, index) in bannerHotZones(block)"
          :key="index"
          class="decor-hotzone"
          :style="hotZoneStyle(zone)"
          @click.stop="go(zone.link || block.link)"
        />
      </view>

      <view v-else-if="block.type === 'activity'" class="decor-activity" :class="{ dark: isDark(block.background) }" :style="cardStyle(block, '#fff5e9')" @click="go(block.link || '/pages/points/activity')">
        <view class="decor-activity-main">
          <view class="decor-card-title" :style="{ color: block.titleColor || '' }">{{ block.title }}</view>
          <view class="decor-subtitle" :style="{ color: block.textColor || '' }">{{ block.subtitle }}</view>
          <view class="decor-progress"><view :style="{ width: progressWidth(block) }" /></view>
        </view>
        <view class="decor-button" :style="buttonStyle(block)">{{ block.button || '立即查看' }}</view>
      </view>

      <view v-else-if="block.type === 'grid'" class="decor-card" :style="cardStyle(block)">
        <view class="decor-section-title" :style="{ color: block.titleColor || '' }">{{ block.title }}</view>
        <view class="decor-grid" :style="{ gridTemplateColumns: gridColumns(block) }">
          <view v-for="(item, index) in gridItems(block)" :key="index" class="decor-grid-item" @click="openGrid(item, index)">
            <view>{{ item.icon || icons[index % icons.length] }}</view>
            <text>{{ item.text }}</text>
          </view>
        </view>
      </view>

      <view v-else-if="block.type === 'study'" class="decor-card" :style="cardStyle(block)" @click="go(block.link || '/pages/study/index')">
        <view class="decor-card-title" :style="{ color: block.titleColor || '' }">{{ block.title }} 🔥</view>
        <view class="decor-subtitle" :style="{ color: block.textColor || '' }">{{ block.subtitle }}</view>
        <view class="decor-progress"><view :style="{ width: progressWidth(block) }" /></view>
      </view>

      <view v-else-if="block.type === 'smart'" class="decor-smart" :class="{ 'has-bg-image': !!block.image }" :style="smartStyle(block)" @click="go(block.link || '/pages/custom/params')">
        <view v-if="smartIcon(block)" class="decor-smart-icon" :style="{ color: block.iconColor || block.textColor || '' }">{{ smartIcon(block) }}</view>
        <view class="decor-smart-main">
          <text :style="{ color: block.labelColor || block.textColor || '' }">{{ block.label || 'AI 智能匹配' }}</text>
          <view :style="{ color: block.titleColor || '' }">{{ block.title }}</view>
          <text :style="{ color: block.textColor || '' }">{{ block.subtitle }}</text>
        </view>
      </view>

      <view v-else-if="block.type === 'routes'" class="decor-card" :style="cardStyle(block)">
        <view class="decor-title-row">
          <view class="decor-section-title" :style="{ color: block.titleColor || '' }">{{ block.title }}</view>
          <text>{{ block.subtitle }}</text>
        </view>
        <scroll-view scroll-x class="decor-route-scroll">
          <view v-for="route in limitedRoutes(block)" :key="route.id || route.name" class="decor-route-card" @click="openRoute(route)">
            <image :src="route.image || route.img" mode="aspectFill" />
            <view><b>{{ route.name }}</b><text>{{ route.days }} · {{ Number(route.price || 0) }} 积分</text></view>
          </view>
        </scroll-view>
        <view v-if="!routeItems.length" class="decor-empty">暂无上架路线</view>
      </view>

      <view v-else-if="block.type === 'schools'" class="decor-card" :style="cardStyle(block)">
        <view class="decor-title-row">
          <view class="decor-section-title" :style="{ color: block.titleColor || '' }">{{ block.title }}</view>
          <text>{{ block.subtitle }}</text>
        </view>
        <view v-for="school in schoolItems.slice(0, Number(block.limit || 5))" :key="school.id || school.name" class="decor-list-item" @click="go('/pages/schools/index')">
          <image v-if="school.logo" :src="school.logo" mode="aspectFill" />
          <view v-else class="decor-list-avatar">{{ firstChar(school) }}</view>
          <view><b>{{ school.name }}</b><text>{{ school.city || '' }} {{ school.district || '' }}</text></view>
          <text>→</text>
        </view>
      </view>

      <view v-else-if="block.type === 'articles'" class="decor-card" :style="cardStyle(block)">
        <view class="decor-title-row">
          <view class="decor-section-title" :style="{ color: block.titleColor || '' }">{{ block.title }}</view>
          <text>{{ block.subtitle }}</text>
        </view>
        <view v-for="article in limitedArticles(block)" :key="article.id || article.slug" class="decor-list-item" @click="openArticle(article)">
          <view class="decor-list-avatar">文</view>
          <view><b>{{ article.title }}</b><text>{{ article.category || '平台文章' }}</text></view>
          <text>→</text>
        </view>
        <view v-if="!limitedArticles(block).length" class="decor-empty">暂无已发布文章</view>
      </view>

      <view v-else-if="block.type === 'video'" class="decor-card" :class="{ 'decor-video-playing': isVideoPlaying(block), 'decor-video-section-active': isVideoActive(block) }" :style="cardStyle(block)">
        <view class="decor-title-row">
          <view class="decor-section-title" :style="{ color: block.titleColor || '' }">{{ block.title }}</view>
          <text v-if="videoSource(block)">OBS 视频</text>
        </view>
        <view class="decor-video" :class="{ 'decor-video-active': isVideoActive(block) }" :style="videoStyle(block)">
          <video
            v-if="videoSource(block)"
            :id="videoElementId(block)"
            :key="videoKey(block)"
            class="decor-video-player"
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
          <view v-if="!isVideoActive(block)" class="decor-video-cover" @click.stop="startVideo(block)">
            <image :src="block.image" mode="aspectFill" />
            <view class="decor-play"></view>
          </view>
          <view class="decor-video-text">{{ block.subtitle }}</view>
        </view>
      </view>

      <view v-else-if="block.type === 'spacer'" class="decor-spacer" :style="{ height: spacerHeight(block) }"></view>

      <view v-else class="decor-notice" :style="cardStyle(block)" @click="openNotice(block)">
        <b :style="{ color: block.titleColor || '' }">{{ noticeTitle(block) }}</b>
        <text :style="{ color: block.textColor || '' }">{{ noticeSubtitle(block) }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, getCurrentInstance, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { getAnnouncements, getArticles } from '../utils/api.js'
const props = defineProps({
  blocks: { type: Array, default: () => [] },
  routes: { type: Array, default: () => [] },
  schools: { type: Array, default: () => [] },
  articles: { type: Array, default: () => [] },
  announcements: { type: Array, default: () => [] },
  fallbackVideoUrl: { type: String, default: '' },
})

const icons = ['📑', '📚', '🧭', '🎁', '💎', '🏆']
const gridUrls = ['/pages/study/index', '/pages/study/index', '/pages/travel/index', '/pages/points/activity', '/pages/mine/points', '/pages/study/center']
const remoteArticles = ref([])
const remoteAnnouncements = ref([])
const videoResetSeeds = ref({})
const videoActive = ref({})
const videoPlaying = ref({})
const currentInstance = getCurrentInstance()
let videoVisibilityTimer = null
const videoFullscreen = ref(false)
const fullscreenScrollTop = ref(0)
const routeWeight = route => Number(route?.display_weight ?? route?.displayWeight ?? 0)
const routeIsOnShelf = route => ![false, 0, 'false', '0'].includes(route?.status)
const routeItems = computed(() => (props.routes || [])
  .filter(routeIsOnShelf)
  .sort((a, b) => routeWeight(b) - routeWeight(a) || Number(b.id || 0) - Number(a.id || 0)))
const schoolWeight = item => Number(item?.display_weight ?? item?.displayWeight ?? 0)
const schoolIsVisible = item => item?.review_status === 'approved' && ![false, 0, 'false', '0'].includes(item?.status)
const schoolItems = computed(() => (props.schools || [])
  .filter(schoolIsVisible)
  .sort((a, b) => schoolWeight(b) - schoolWeight(a) || Number(a.sort_order || 0) - Number(b.sort_order || 0) || Number(b.id || 0) - Number(a.id || 0)))
const articleIsPublished = item => ![false, 0, 'false', '0'].includes(item?.status)
const articleSort = (a, b) => Number(!!b.pinned) - Number(!!a.pinned)
  || Number(a.sort_order || 0) - Number(b.sort_order || 0)
  || Number(b.id || 0) - Number(a.id || 0)
const hasArticleBlock = computed(() => (props.blocks || []).some(block => block.type === 'articles'))
const sourceArticles = computed(() => props.articles.length ? props.articles : remoteArticles.value)
const articleItems = computed(() => sourceArticles.value.filter(articleIsPublished).sort(articleSort))
const blockAnnouncementId = block => Number(block?.announcementId || block?.announcement_id || 0)
const announcementIsPublished = item => ![false, 0, 'false', '0'].includes(item?.status)
const announcementSort = (a, b) => Number(!!b.pinned) - Number(!!a.pinned)
  || Number(Date.parse(b.published_at || b.updated_at || b.created_at || 0)) - Number(Date.parse(a.published_at || a.updated_at || a.created_at || 0))
  || Number(b.id || 0) - Number(a.id || 0)
const hasNoticeAnnouncementBlock = computed(() => (props.blocks || []).some(block => block.type === 'notice' && blockAnnouncementId(block)))
const sourceAnnouncements = computed(() => props.announcements.length ? props.announcements : remoteAnnouncements.value)
const announcementItems = computed(() => sourceAnnouncements.value.filter(announcementIsPublished).sort(announcementSort))
const loadArticleFallback = async () => {
  if (!hasArticleBlock.value || props.articles.length) return
  try {
    remoteArticles.value = await getArticles()
  } catch {
    remoteArticles.value = []
  }
}
watch([hasArticleBlock, () => props.articles.length], loadArticleFallback, { immediate: true })
const loadAnnouncementFallback = async () => {
  if (!hasNoticeAnnouncementBlock.value || props.announcements.length) return
  try {
    remoteAnnouncements.value = await getAnnouncements()
  } catch {
    remoteAnnouncements.value = []
  }
}
watch([hasNoticeAnnouncementBlock, () => props.announcements.length], loadAnnouncementFallback, { immediate: true })
const isDark = color => ['#153e38', '#172c2a', '#132f2b'].includes(String(color || '').toLowerCase())
const progressWidth = block => `${Math.max(0, Math.min(100, Number(block?.progress || 0)))}%`
const gridColumns = block => `repeat(${Number(block?.columns || 3)}, 1fr)`
const spacerHeight = block => `${Number(block?.height || 40)}rpx`
const firstChar = item => String(item?.short_name || item?.name || '校').slice(0, 1)
const videoSource = block => String(block?.video_url || block?.videoUrl || block?.url || props.fallbackVideoUrl || '').trim()
const videoId = block => String(block?.id || block?.name || block?.title || videoSource(block))
const videoElementId = block => {
  const raw = videoId(block) || videoSource(block) || 'video'
  let hash = 0
  for (let i = 0; i < raw.length; i += 1) hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0
  return `decor-video-${Math.abs(hash)}`
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
  ;(props.blocks || []).forEach(block => {
    if (block.type === 'video' && isVideoActive(block) && !isElementVisible(videoElementId(block))) resetVideo(block)
  })
}
const scheduleVideoVisibilityCheck = () => {
  clearTimeout(videoVisibilityTimer)
  videoVisibilityTimer = setTimeout(checkVideoVisibility, 80)
}
onMounted(() => {
  if (typeof window === 'undefined') return
  window.addEventListener('scroll', scheduleVideoVisibilityCheck, { passive: true })
  window.addEventListener('resize', scheduleVideoVisibilityCheck)
  document.addEventListener('fullscreenchange', handleNativeFullscreenChange)
  document.addEventListener('webkitfullscreenchange', handleNativeFullscreenChange)
})
onUnmounted(() => {
  clearTimeout(videoVisibilityTimer)
  if (typeof window === 'undefined') return
  window.removeEventListener('scroll', scheduleVideoVisibilityCheck)
  window.removeEventListener('resize', scheduleVideoVisibilityCheck)
  document.removeEventListener('fullscreenchange', handleNativeFullscreenChange)
  document.removeEventListener('webkitfullscreenchange', handleNativeFullscreenChange)
})
const smartIcon = block => block && Object.prototype.hasOwnProperty.call(block, 'icon') ? String(block.icon || '').trim() : '✦'
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
const smartStyle = block => {
  const style = cardStyle(block, '#dff5ef')
  if (block?.image) {
    style.backgroundImage = `url('${block.image}')`
    style.backgroundSize = 'cover'
    style.backgroundPosition = 'center'
  }
  return style
}
const buttonStyle = block => ({
  background: block?.buttonColor || '#ff7a35',
})
const bannerStyle = block => ({
  borderRadius: `${Number(block?.radius || 30)}rpx`,
  height: `${Number(block?.height || 330)}rpx`,
  boxShadow: shadowMap[block?.shadow] || undefined,
})
const bannerImages = block => {
  const list = Array.isArray(block?.images) ? block.images.filter(Boolean) : []
  return list.length ? list : (block?.image ? [block.image] : [])
}
const bannerHotZones = block => Array.isArray(block?.hotZones)
  ? block.hotZones.filter(zone => zone && Number(zone.w) > 0 && Number(zone.h) > 0)
  : []
const hotZoneStyle = zone => ({
  left: `${Math.max(0, Math.min(100, Number(zone.x || 0)))}%`,
  top: `${Math.max(0, Math.min(100, Number(zone.y || 0)))}%`,
  width: `${Math.max(1, Math.min(100, Number(zone.w || 100)))}%`,
  height: `${Math.max(1, Math.min(100, Number(zone.h || 100)))}%`,
})
const videoStyle = block => ({
  height: `${Number(block?.video_height || 330)}rpx`,
  borderRadius: `${Number(block?.radius || 24)}rpx`,
})
const gridItems = block => {
  const list = Array.isArray(block?.gridItems) ? block.gridItems : block?.items || []
  return list.map((item, index) => typeof item === 'string'
    ? { icon: icons[index % icons.length], text: item, link: gridUrls[index] || '' }
    : { icon: item.icon || icons[index % icons.length], text: item.text || item.name || '入口', link: item.link || gridUrls[index] || '' })
}
const limitedRoutes = block => routeItems.value.slice(0, Number(block?.limit || 12))
const limitedArticles = block => {
  const ids = Array.isArray(block?.articleIds) ? block.articleIds.map(Number).filter(Boolean) : []
  const source = ids.length
    ? ids.map(id => articleItems.value.find(article => Number(article.id) === id)).filter(Boolean)
    : articleItems.value
  return source.slice(0, Number(block?.limit || 5))
}
const noticeAnnouncement = block => {
  const id = blockAnnouncementId(block)
  return id ? announcementItems.value.find(item => Number(item.id) === id) : null
}
const noticeTitle = block => noticeAnnouncement(block)?.title || block?.title
const noticeSubtitle = block => noticeAnnouncement(block)?.summary || block?.subtitle
const go = url => {
  if (!url) return
  uni.navigateTo({ url })
}
const openNotice = block => {
  const id = blockAnnouncementId(block)
  if (id) {
    go(`/pages/notice/detail?id=${id}`)
    return
  }
  go(block?.link || '')
}
const openArticle = article => {
  const key = article?.slug || article?.id
  if (!key) return
  go(`/pages/article/detail?slug=${encodeURIComponent(key)}`)
}
const openRoute = route => {
  if (!route?.id) return
  go(`/pages/points/route-detail?id=${route.id}`)
}
const openGrid = (item, index) => go(item?.link || gridUrls[index] || '')
</script>

<style scoped>
.decorate-block{margin-bottom:22rpx}.decor-banner{height:330rpx;border-radius:30rpx;overflow:hidden;position:relative;background:#173f38}.decor-banner image{width:100%;height:100%}.decor-banner-mask{position:absolute;inset:0;padding:42rpx 34rpx;color:#fff;background:linear-gradient(90deg,rgba(12,40,35,.82),rgba(12,40,35,.18))}.decor-badge{display:inline-block;padding:8rpx 16rpx;border-radius:99rpx;background:#fff2e7;color:#ff7a35;font-size:21rpx;font-weight:800}.decor-title{margin-top:20rpx;font-size:42rpx;font-weight:900;line-height:1.25}.decor-subtitle{margin-top:10rpx;color:#78908a;font-size:23rpx;line-height:1.55}.decor-banner .decor-subtitle{color:rgba(255,255,255,.78)}.decor-activity,.decor-smart,.decor-card,.decor-notice{border-radius:28rpx;background:#fff;padding:28rpx;box-shadow:0 10rpx 28rpx rgba(17,47,42,.055)}.decor-activity{display:flex;align-items:center;gap:20rpx}.decor-activity.dark{color:#fff}.decor-activity.dark .decor-subtitle{color:rgba(255,255,255,.72)}.decor-activity-main{flex:1}.decor-card-title{font-size:31rpx;font-weight:900;color:#173f38}.decor-progress{height:10rpx;border-radius:99rpx;background:#e9efed;overflow:hidden;margin-top:18rpx}.decor-progress view{height:100%;border-radius:99rpx;background:linear-gradient(90deg,#ff7a35,#ffc08c)}.decor-button{padding:16rpx 20rpx;border-radius:18rpx;background:#ff7a35;color:#fff;font-size:22rpx;font-weight:800}.decor-section-title{font-size:31rpx;font-weight:900;color:#173f38;margin-bottom:18rpx}.decor-grid{display:grid;gap:14rpx}.decor-grid-item{text-align:center;padding:22rpx 8rpx;border-radius:22rpx;background:#f6f8f7}.decor-grid-item view{font-size:42rpx}.decor-grid-item text{display:block;margin-top:8rpx;font-size:23rpx;color:#243d37}.decor-smart{display:flex;align-items:center;gap:22rpx}.decor-smart-icon{font-size:56rpx;color:#12a594}.decor-smart-main{flex:1}.decor-smart-main view{font-size:35rpx;font-weight:900;color:#173f38}.decor-smart-main text{display:block;color:#657a75;font-size:22rpx}.decor-smart-arrow{width:64rpx;height:64rpx;border-radius:50%;background:#12a594;color:#fff;display:flex;align-items:center;justify-content:center;font-size:38rpx}.decor-title-row{display:flex;align-items:flex-end;justify-content:space-between;gap:18rpx}.decor-title-row text{font-size:21rpx;color:#84928f}.decor-video-playing .decor-video-text,.decor-video-active .decor-video-text{opacity:0;visibility:hidden}.decor-route-scroll{white-space:nowrap}.decor-route-card{display:inline-block;width:310rpx;margin-right:18rpx;border-radius:24rpx;overflow:hidden;background:#fff;border:1rpx solid #edf1ef;vertical-align:top}.decor-route-card image{width:100%;height:190rpx}.decor-route-card view{padding:16rpx}.decor-route-card b,.decor-route-card text{display:block;white-space:normal}.decor-route-card text{margin-top:8rpx;color:#71807c;font-size:22rpx}.decor-list-item{display:flex;align-items:center;gap:18rpx;padding:20rpx 0;border-bottom:1rpx solid #edf1ef}.decor-list-item:last-child{border-bottom:0}.decor-list-item image,.decor-list-avatar{width:76rpx;height:76rpx;border-radius:22rpx;background:#eaf7f3;color:#173f38;display:flex;align-items:center;justify-content:center;font-weight:900}.decor-list-item view:nth-child(2){flex:1}.decor-list-item b,.decor-list-item text{display:block}.decor-list-item b{font-size:26rpx}.decor-list-item text{color:#82918d;font-size:21rpx;margin-top:5rpx}.decor-video{height:330rpx;border-radius:24rpx;overflow:hidden;position:relative;background:#173f38}.decor-video:after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(9,35,31,0),rgba(9,35,31,.58));pointer-events:none}.decor-video-active:after{display:none}.decor-video image,.decor-video-player{width:100%;height:100%;display:block}.decor-play{position:absolute;z-index:2;left:50%;top:50%;transform:translate(-50%,-50%);width:78rpx;height:78rpx;border-radius:50%;background:rgba(255,255,255,.92);color:#ff7a35;display:flex;align-items:center;justify-content:center;font-size:0}.decor-play:before{content:'';position:absolute;left:50%;top:50%;width:0;height:0;border-top:14rpx solid transparent;border-bottom:14rpx solid transparent;border-left:22rpx solid #ff7a35;transform:translate(-33%,-50%)}.decor-video-text{position:absolute;z-index:1;left:24rpx;right:24rpx;bottom:24rpx;color:#fff;font-weight:800;text-shadow:0 4rpx 12rpx rgba(0,0,0,.35);pointer-events:none}.decor-notice{text-align:center}.decor-notice b,.decor-notice text{display:block}.decor-notice text{margin-top:10rpx;color:#71807c;font-size:23rpx}.decor-empty{text-align:center;color:#879591;padding:30rpx}.decor-spacer{border-radius:18rpx}
</style>

<style scoped>
.decor-banner-swiper{width:100%;height:100%}.decor-banner-swiper image{width:100%;height:100%}
.decor-video-cover{position:absolute;z-index:2;inset:0}.decor-video-cover image{width:100%;height:100%;display:block}
.decor-video-player :deep(video){object-fit:contain!important}
.decor-video-active :deep(.uni-video-cover-play-button){display:none!important}
.decor-hotzone{position:absolute;z-index:5}
</style>
