<template>
  <view class="page">
    <AppHeader />
    <view class="content">
      <template v-if="remoteBlocks.length">
        <DecorationBlocks :blocks="remoteBlocks" :routes="routes" :fallback-video-url="fallbackVideoUrl" />
      </template>

      <template v-else>
        <view class="search">⌕<input placeholder="搜索目的地 / 旅行主题" /></view>
        <scroll-view scroll-x class="filter">
          <view v-for="(item, index) in filters" :key="item" class="filter-item" :class="{ on: index === 0 }">{{ item }}⌄</view>
        </scroll-view>
        <view class="smart" @click="go('/pages/custom/params')">
          <view>
            <view class="tag">AI 智能匹配</view>
            <view class="smart-title">一键生成专属路线</view>
            <view class="sub">30 秒匹配你的积分预算与偏好</view>
          </view>
        </view>
        <view class="title-row">
          <view class="section-title">为你推荐</view>
          <text class="sub">仅展示已上架路线</text>
        </view>
        <view v-if="routes.length" class="waterfall">
          <view class="route-card" v-for="(route, index) in routes" :key="route.id || route.name" @click="openRoute(route)">
            <view class="route-img" :style="{ height: (index % 2 ? 260 : 330) + 'rpx' }">
              <image :src="route.image" mode="aspectFill" />
              <view class="fav" :class="{ on: favorites.has(route.name) }" @click.stop="toggleFavorite(route)">{{ favorites.has(route.name) ? '♥' : '♡' }}</view>
            </view>
            <view class="route-body">
              <view class="route-name">{{ route.name }}</view>
              <view><text class="tag">{{ route.days }}</text><text class="tag tag-orange">{{ Number(route.price) }} 积分</text></view>
              <view class="sub">{{ route.category }} · {{ route.agency }}</view>
              <view class="target" :class="{ on: targets.has(route.name) }" @click.stop="toggleTarget(route)">
                {{ targets.has(route.name) ? '✓ 已加入上岸心愿' : '＋ 设为上岸目标' }}
              </view>
            </view>
          </view>
        </view>
        <view v-else class="empty-routes">
          <view>🧭</view>
          <b>路线正在更新中</b>
          <text>当前暂无已上架路线，稍后再来看看吧</text>
        </view>
        <view class="section-title">上岸学长旅行种草</view>
        <view class="video-card" :class="{ playing: fallbackVideoPlaying, active: fallbackVideoActive }">
          <video
            v-if="fallbackVideoUrl"
            id="fallback-travel-video"
            :key="fallbackVideoKey"
            class="video-player"
            :src="fallbackVideoUrl"
            poster="https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=900"
            :controls="fallbackVideoActive"
            :autoplay="fallbackVideoActive"
            :show-center-play-btn="false"
            object-fit="contain"
            direction="0"
            play-btn-position="bottom"
            @play="fallbackVideoPlaying = true"
            @pause="fallbackVideoPlaying = false"
            @fullscreenchange="handleFallbackFullscreenChange"
            @ended="resetFallbackVideo"
          />
          <view v-if="!fallbackVideoActive" class="video-cover" @click.stop="startFallbackVideo">
            <image src="https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=900" mode="aspectFill" />
            <view class="play"></view>
          </view>
          <view class="video-txt">考试结束后的第一站，去看山河辽阔</view>
        </view>
      </template>
    </view>
    <BottomNav active="旅行" />
  </view>
</template>

<script setup>
import { computed, getCurrentInstance, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { onHide, onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import AppHeader from '../../components/AppHeader.vue'
import BottomNav from '../../components/BottomNav.vue'
import DecorationBlocks from '../../components/DecorationBlocks.vue'
import { getDecorationPage, getPublicRoutes, trackPreference } from '../../utils/api.js'

const filters = ['目的地', '主题', '天数', '积分']
const routes = ref([])
const remoteBlocks = ref([])
const favorites = ref(new Set(uni.getStorageSync('favoriteRoutes') || []))
const targets = ref(new Set(uni.getStorageSync('targetRoutes') || []))
const fallbackVideoUrl = 'https://xuetuxing.obs.cn-north-4.myhuaweicloud.com:443/%E5%B1%8F%E5%B9%95%E5%BD%95%E5%88%B6%202026-07-01%20172705.mp4?AccessKeyId=HSTAW50PUUP554C5BUKS&Expires=1782930629&x-obs-security-token=hQpjbi1ub3J0aC00AQAABRVIU1RBVzUwUFVVUDU1NEM1QlVLUzDZH2Y5P6PrqBPnQG861X5IZGzcswTQbYmO7O2PQs_S_eMiYTc6V3z1oXwWBCoot6JquSNeBlAS3etIKy8xxpyy8JYcxYXgBLdIb4J71VY7T7R5qFHiv2Dfz_sQ_IWwElD6WghoWZHuQFupxicziT0pTwCuIVgthFnvaD4CK8rPkn-3bTcnvxpgQvqtPSeymCRiOAKuZZIKHS5lQfRE3crmwI667zI52YH1I6bW9jt4i5rl5u_ZHYnzsKI2EM1PhJZsalTpxRB61PZPeSYL6pHmJxOkYmxBl9PkDSmohk0ZGImsLjq-XZ5IDmaS7mJ2auWQvL4mJGwA_SEYGaVW-X86JeP92VlhvaHUvDrE3Xz5iHt2OhopUJxkZJNsYfL-NESrtNubDTVqq4FHfPdB5A9UUI4ULGEqCII1ihAaVa0qLlq6PY5Uh31MXLkVxcIbO1OXKHXYOcY5VJu4YI_dpRS9nxatorIiCky6rSJSHulkS33fsGjj8JAJpWfqsbv5yCvOQQPQx5oRzrSLUs8lN2rv1fgd1YXyHoUy7gXyg_0h28zW0_onkVg-WIBxFY_-NHGC2p42AttVBuYxjQ%3D%3D&Signature=hnR5JCgcctetB2idAf9lybJJQaA%3D'
const fallbackVideoResetSeed = ref(0)
const fallbackVideoActive = ref(false)
const fallbackVideoPlaying = ref(false)
const fallbackVideoKey = computed(() => `fallback-video-${fallbackVideoResetSeed.value}`)
const currentInstance = getCurrentInstance()
let videoVisibilityTimer = null
const fallbackVideoFullscreen = ref(false)
const fullscreenScrollTop = ref(0)
const playNativeFallbackVideo = () => {
  if (typeof document === 'undefined') return
  const holder = document.getElementById('fallback-travel-video')
  const video = holder?.tagName === 'VIDEO' ? holder : holder?.querySelector?.('video')
  if (video && typeof video.play === 'function') {
    const result = video.play()
    if (result && typeof result.catch === 'function') result.catch(() => {})
  }
}
const stopNativeFallbackVideo = () => {
  if (typeof document === 'undefined') return
  const holder = document.getElementById('fallback-travel-video')
  const video = holder?.tagName === 'VIDEO' ? holder : holder?.querySelector?.('video')
  if (video && typeof video.pause === 'function') {
    video.pause()
    try { video.currentTime = 0 } catch {}
  }
}
const playFallbackVideo = () => {
  const play = () => {
    playNativeFallbackVideo()
    const context = uni.createVideoContext('fallback-travel-video', currentInstance?.proxy)
    if (context && typeof context.play === 'function') context.play()
  }
  play()
  nextTick(() => setTimeout(play, 30))
}
const startFallbackVideo = () => {
  playFallbackVideo()
  fallbackVideoActive.value = true
  fallbackVideoPlaying.value = true
}
const resetFallbackVideo = () => {
  stopNativeFallbackVideo()
  fallbackVideoActive.value = false
  fallbackVideoPlaying.value = false
  fallbackVideoResetSeed.value += 1
}
const isFallbackVideoVisible = () => {
  if (typeof document === 'undefined') return true
  const element = document.getElementById('fallback-travel-video')
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
const handleFallbackFullscreenChange = event => {
  const fullscreen = !!(event?.detail?.fullScreen ?? event?.detail?.fullscreen ?? isNativeFullscreen())
  if (fullscreen) fullscreenScrollTop.value = getScrollTop()
  if (fallbackVideoFullscreen.value && !fullscreen) restoreScrollTop()
  fallbackVideoFullscreen.value = fullscreen
}
const handleNativeFullscreenChange = () => {
  const fullscreen = isNativeFullscreen()
  if (fullscreen) fullscreenScrollTop.value = getScrollTop()
  if (fallbackVideoFullscreen.value && !fullscreen) restoreScrollTop()
  fallbackVideoFullscreen.value = fullscreen
  scheduleVideoVisibilityCheck()
}
const checkVideoVisibility = () => {
  if (fallbackVideoFullscreen.value || isNativeFullscreen()) return
  if (fallbackVideoActive.value && !isFallbackVideoVisible()) resetFallbackVideo()
}
const scheduleVideoVisibilityCheck = () => {
  clearTimeout(videoVisibilityTimer)
  videoVisibilityTimer = setTimeout(checkVideoVisibility, 80)
}
let refreshTimer = null
const routeWeight = route => Number(route?.display_weight ?? route?.displayWeight ?? 0)
const routeIsOnShelf = route => ![false, 0, 'false', '0'].includes(route?.status)
const visibleRoutes = list => (Array.isArray(list) ? list : [])
  .filter(routeIsOnShelf)
  .sort((a, b) => routeWeight(b) - routeWeight(a) || Number(b.id || 0) - Number(a.id || 0))

const load = async (showError = false) => {
  try {
    const [page, remoteRoutes] = await Promise.all([getDecorationPage('travel'), getPublicRoutes()])
    remoteBlocks.value = page?.blocks || []
    routes.value = visibleRoutes(remoteRoutes)
    if (showError && remoteRoutes.__fromCache) uni.showToast({ title: '后端连接失败，当前显示缓存数据', icon: 'none' })
  } catch (error) {
    if (showError) uni.showToast({ title: error.message || '旅行数据加载失败', icon: 'none' })
  }
}
const startAutoRefresh = () => {
  clearInterval(refreshTimer)
  load()
  refreshTimer = setInterval(load, 3000)
}
const stopAutoRefresh = () => {
  clearInterval(refreshTimer)
  refreshTimer = null
}
const persist = (key, setRef) => uni.setStorageSync(key, [...setRef.value])
const toggleFavorite = route => {
  const next = new Set(favorites.value)
  const adding = !next.has(route.name)
  adding ? next.add(route.name) : next.delete(route.name)
  favorites.value = next
  persist('favoriteRoutes', favorites)
  trackPreference({ type: 'route', key: route.id || route.name, name: route.name, action: adding ? 'favorite_add' : 'favorite_remove', score: adding ? 3 : -3 })
  uni.showToast({ title: adding ? '已收藏这段旅程' : '已取消收藏', icon: 'none' })
}
const toggleTarget = route => {
  const next = new Set(targets.value)
  const adding = !next.has(route.name)
  adding ? next.add(route.name) : next.delete(route.name)
  targets.value = next
  persist('targetRoutes', targets)
  trackPreference({ type: 'route', key: route.id || route.name, name: route.name, action: adding ? 'target_add' : 'target_remove', score: adding ? 5 : -5 })
  uni.showToast({ title: adding ? '已加入上岸心愿' : '已移出上岸心愿', icon: 'none' })
}
const openRoute = route => {
  trackPreference({ type: 'route', key: route.id || route.name, name: route.name, action: 'view', score: 1 })
  go(`/pages/points/route-detail?id=${route.id}`)
}
const go = url => uni.navigateTo({ url })

onMounted(() => {
  startAutoRefresh()
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
  await load(true)
  uni.stopPullDownRefresh()
})
</script>

<style scoped>
.search{height:86rpx;background:#fff;border-radius:24rpx;display:flex;align-items:center;padding:0 24rpx;font-size:40rpx;color:#8a9694}.search input{font-size:26rpx;flex:1;margin-left:14rpx}.filter{white-space:nowrap;margin:22rpx 0}.filter-item{display:inline-block;padding:16rpx 28rpx;background:#fff;border-radius:99rpx;margin-right:14rpx}.filter-item.on{background:#172c2a;color:white}.smart{display:flex;align-items:center;padding:30rpx;background:linear-gradient(135deg,#dff5ef,#f1fbf8);border-radius:28rpx}.smart-title{font-size:36rpx;font-weight:900;margin:4rpx 0 8rpx}.waterfall{columns:2;column-gap:18rpx}.route-card{break-inside:avoid;background:#fff;border-radius:25rpx;overflow:hidden;margin-bottom:18rpx}.route-img{position:relative}.route-img image{width:100%;height:100%}.fav{position:absolute;right:14rpx;top:14rpx;width:58rpx;height:58rpx;border-radius:50%;background:rgba(255,255,255,.92);text-align:center;line-height:55rpx;font-size:38rpx;color:#52615e;transition:.2s}.fav.on{color:#f04452;background:#fff0f1;transform:scale(1.08)}.route-body{padding:18rpx}.route-name{font-size:28rpx;font-weight:850;margin-bottom:14rpx}.target{color:#ff7a35;font-size:22rpx;margin-top:15rpx;font-weight:700}.target.on{display:inline-flex;background:#e7f6f2;color:#078b7b;padding:9rpx 14rpx;border-radius:99rpx}.empty-routes{text-align:center;background:#fff;padding:80rpx 20rpx;border-radius:28rpx}.empty-routes view{font-size:70rpx}.empty-routes b,.empty-routes text{display:block;margin-top:15rpx}.empty-routes text{font-size:23rpx;color:#778684}.video-card{height:360rpx;border-radius:28rpx;overflow:hidden;position:relative;background:#173f38}.video-card:after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(9,35,31,0),rgba(9,35,31,.58));pointer-events:none}.video-card.active:after{display:none}.video-card image,.video-player{width:100%;height:100%;display:block}.video-cover{position:absolute;z-index:2;inset:0}.video-cover image{width:100%;height:100%;display:block}.play{position:absolute;z-index:2;left:50%;top:50%;transform:translate(-50%,-50%);width:82rpx;height:82rpx;border-radius:50%;background:rgba(255,255,255,.9);color:#ff7a35;display:flex;align-items:center;justify-content:center;font-size:0}.play:before{content:'';position:absolute;left:50%;top:50%;width:0;height:0;border-top:15rpx solid transparent;border-bottom:15rpx solid transparent;border-left:24rpx solid #ff7a35;transform:translate(-33%,-50%)}.video-txt{position:absolute;z-index:1;left:24rpx;right:24rpx;bottom:24rpx;color:#fff;font-weight:800;pointer-events:none}.video-card.playing .video-txt,.video-card.active .video-txt{opacity:0;visibility:hidden}.video-card.active :deep(.uni-video-cover-play-button){display:none!important}.video-player :deep(video){object-fit:contain!important}
</style>
