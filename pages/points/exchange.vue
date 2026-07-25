<template>
  <view class="page">
    <view class="content">
      <view class="exchange-head">
        <view>
          <view class="sub light">当前可用积分</view>
          <view><text class="score">{{ dashboard.points }}</text><text> 积分</text></view>
        </view>
        <view class="head-badge">选择路线兑换</view>
      </view>

      <view class="title-row">
        <view class="section-title">可兑换路线</view>
        <text class="sub">展示当前已上架旅游场地</text>
      </view>

      <view v-if="loading" class="empty">
        <view>...</view>
        <b>路线加载中</b>
        <text>正在同步管理后台已上架路线</text>
      </view>

      <template v-else>
        <view v-if="routes.length" class="route-list">
          <view v-for="route in routes" :key="route.id" class="route-card" @click="openRouteDetail(route)">
            <image :src="route.image || fallbackImage" mode="aspectFill" />
            <view class="route-main">
              <view class="title-row route-title">
                <b>{{ route.name }}</b>
                <text :class="['stock', routeAvailable(route) ? '' : 'off']">{{ stockText(route) }}</text>
              </view>
              <view class="sub">{{ route.days }} · {{ route.category || '旅行路线' }} · {{ route.agency || '平台合作服务方' }}</view>
              <view v-if="route.description" class="desc">{{ route.description }}</view>
              <view class="route-foot">
                <view class="price"><text>{{ routePoints(route) }}</text> 积分</view>
                <view
                  class="btn small-btn"
                  :class="canExchange(route) ? 'btn-primary' : 'btn-disabled'"
                  @click.stop="confirmExchange(route)"
                >
                  {{ exchangeText(route) }}
                </view>
              </view>
            </view>
          </view>
        </view>
        <view v-else class="empty">
          <view>🧭</view>
          <b>暂无可兑换路线</b>
          <text>管理后台上架路线后，这里会自动展示</text>
        </view>
      </template>
    </view>

  </view>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import { exchangeTravelRoute, fetchMe, getInviteDashboard, getPublicRoutes, isLoggedIn } from '../../utils/api.js'

const loading = ref(false)
const submittingRouteId = ref(0)
const routes = ref([])
const fallbackImage = 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=900'
const dashboard = reactive({
  points: 0,
  exchange_score: 100,
})

const routePoints = route => Math.round(Number(route?.price || 0))
const routeAvailable = route => Number(route?.stock || 0) > 0
const canExchange = route => routeAvailable(route) && dashboard.points >= routePoints(route) && submittingRouteId.value !== route.id
const stockText = route => routeAvailable(route) ? `余 ${Number(route.stock)} 份` : '库存不足'
const exchangeText = route => {
  if (submittingRouteId.value === route.id) return '兑换中...'
  if (!routeAvailable(route)) return '已兑完'
  const missing = routePoints(route) - dashboard.points
  return missing > 0 ? `差 ${missing} 积分` : '立即兑换'
}
const openRouteDetail = route => {
  uni.navigateTo({ url: `/pages/points/route-detail?id=${route.id}` })
}
const routeWeight = route => Number(route?.display_weight ?? route?.displayWeight ?? 0)
const visibleRoutes = list => (Array.isArray(list) ? list : [])
  .filter(route => ![false, 0, 'false', '0'].includes(route?.status))
  .sort((a, b) => routeWeight(b) - routeWeight(a) || Number(b.id || 0) - Number(a.id || 0))

const load = async () => {
  if (!isLoggedIn()) {
    uni.showModal({
      title: '请先登录',
      content: '登录后才能使用积分兑换路线。',
      success: result => result.confirm && uni.navigateTo({ url: '/pages/auth/login' }),
    })
    return
  }
  loading.value = true
  try {
    const [invite, routeList] = await Promise.all([getInviteDashboard(), getPublicRoutes()])
    dashboard.points = Number(invite?.points || 0)
    dashboard.exchange_score = Number(invite?.exchange_score || 100)
    routes.value = visibleRoutes(routeList)
  } catch (error) {
    uni.showToast({ title: error.message || '兑换数据加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const confirmExchange = route => {
  if (!routeAvailable(route)) return uni.showToast({ title: '该路线库存不足', icon: 'none' })
  const required = routePoints(route)
  if (dashboard.points < required) return uni.showToast({ title: `积分不足，还差 ${required - dashboard.points} 积分`, icon: 'none' })
  uni.showModal({
    title: '确认兑换',
    content: `确认使用 ${required} 积分兑换「${route.name}」？兑换成功后将在“我的旅行”中生成订单。`,
    success: result => {
      if (result.confirm) submitExchange(route)
    },
  })
}

const submitExchange = async route => {
  if (submittingRouteId.value) return
  submittingRouteId.value = route.id
  try {
    await exchangeTravelRoute(route.id)
    await fetchMe().catch(() => null)
    uni.showToast({ title: '兑换成功', icon: 'success' })
    setTimeout(() => uni.redirectTo({ url: '/pages/mine/travel' }), 500)
  } catch (error) {
    uni.showToast({ title: error.message || '兑换失败', icon: 'none' })
    await load()
  } finally {
    submittingRouteId.value = 0
  }
}

onShow(load)
onPullDownRefresh(async () => {
  await load()
  uni.stopPullDownRefresh()
})
</script>

<style scoped>
.exchange-head{display:flex;align-items:flex-start;justify-content:space-between;gap:24rpx;padding:38rpx;border-radius:34rpx;color:#fff;background:linear-gradient(135deg,#173f38,#13a795);box-shadow:0 18rpx 40rpx rgba(18,165,148,.22);margin-bottom:26rpx}.light{color:rgba(255,255,255,.75)}.score{font-size:76rpx;font-weight:900}.head-badge{flex:none;margin-top:10rpx;padding:11rpx 18rpx;border-radius:999rpx;background:rgba(255,255,255,.18);font-size:22rpx;font-weight:800}.route-list{display:grid;gap:22rpx}.route-card{background:#fff;border-radius:28rpx;overflow:hidden;box-shadow:0 12rpx 34rpx rgba(21,44,40,.07)}.route-card image{width:100%;height:260rpx;display:block}.route-main{padding:24rpx}.route-title{align-items:flex-start;gap:16rpx}.route-title b{font-size:31rpx;line-height:1.35;flex:1}.stock{flex:none;color:#0b8f7e;background:#e6f7f3;border-radius:999rpx;padding:8rpx 14rpx;font-size:21rpx;font-weight:800}.stock.off{color:#b85a22;background:#fff0e7}.desc{margin-top:16rpx;color:#667773;font-size:24rpx;line-height:1.65;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.route-foot{display:flex;align-items:center;justify-content:space-between;gap:20rpx;margin-top:22rpx}.price{color:#ff7a35;font-weight:900}.price text{font-size:42rpx}.small-btn{width:210rpx;height:72rpx;display:flex;align-items:center;justify-content:center;font-size:25rpx;padding:0}.empty{text-align:center;background:#fff;border-radius:28rpx;padding:90rpx 24rpx}.empty view{font-size:64rpx}.empty b,.empty text{display:block;margin-top:16rpx}.empty text{color:#778684;font-size:24rpx}
</style>
