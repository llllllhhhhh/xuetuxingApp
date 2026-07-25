<template>
  <view class="page result-page">
    <view class="result-head">
      <text>智能匹配结果</text>
      <b>{{ loading ? '正在计算适合你的路线' : headTitle }}</b>
      <small>{{ loading ? '正在同步已上架旅游项目、库存和积分预算。' : headDesc }}</small>
    </view>

    <view class="content">
      <view class="criteria-card">
        <view class="criteria-title">
          <b>你的偏好</b>
          <text @click="goAdjust">调整</text>
        </view>
        <view class="chips">
          <text v-for="chip in criteriaChips" :key="chip">{{ chip }}</text>
        </view>
      </view>

      <view v-if="loading" class="state-card">
        <view class="state-icon">算</view>
        <b>路线匹配中</b>
        <text>正在按偏好、预算、库存和路线权重综合排序。</text>
      </view>

      <template v-else-if="matches.length">
        <template v-for="(item, index) in matches" :key="item.id || item.name">
          <view v-if="index === 0" class="section-title">最佳匹配</view>
          <view v-else-if="index === 1" class="section-title">相似路线</view>
          <view :class="['match-card', { featured: index === 0 }]">
            <image class="route-cover" :src="item.image || fallbackImage" mode="aspectFill" />
            <view class="route-info">
              <view class="route-top">
                <view>
                  <b>{{ item.name || '旅游路线' }}</b>
                  <text>{{ item.days || '-' }} · {{ item.category || '旅行路线' }} · {{ item.agency || '平台服务方' }}</text>
                </view>
                <view class="match-score">
                  <b>{{ item.matchScore }}%</b>
                  <text>匹配</text>
                </view>
              </view>
              <view class="reason-list">
                <text v-for="reason in item.reasons" :key="reason">{{ reason }}</text>
              </view>
              <view class="route-bottom">
                <view class="price"><b>{{ routePoints(item) }}</b><text>积分</text></view>
                <view :class="['stock', routeStock(item) > 0 ? '' : 'off']">
                  {{ stockText(item) }}
                </view>
              </view>
              <view class="actions">
                <button class="ghost-btn" @click="openRoute(item)">查看详情</button>
                <button class="primary-btn" :disabled="routeStock(item) <= 0" @click="confirmExchange(item)">
                  {{ routeStock(item) > 0 ? '立即兑换' : '已兑完' }}
                </button>
              </view>
            </view>
          </view>
        </template>
      </template>

      <view v-else class="state-card empty">
        <view class="state-icon">定</view>
        <b>暂未找到完全匹配路线</b>
        <text>当前已上架路线里没有同时满足偏好、天数、预算和库存的项目。可以提交人工定制，平台审核后给你专属方案。</text>
        <view class="empty-actions">
          <view class="btn btn-ghost" @click="goAdjust">调整偏好</view>
          <view class="btn btn-primary" @click="goManual">提交人工定制</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
import { exchangeTravelRoute, fetchMe, getInviteDashboard, getPublicRoutes, getTravelMatchSettings, isLoggedIn } from '../../utils/api.js'

const MATCH_STORAGE_KEY = 'customRouteMatchParams'
const MANUAL_STORAGE_KEY = 'customManualPrefill'

const fallbackImage = 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=900'
const loading = ref(false)
const criteria = ref(null)
const matches = ref([])
const points = ref(0)
const submittingRouteId = ref(0)

const matchSettings = ref(null)
const defaultMatchSettings = {
  destinations: [
    { label: '西南秘境', keywords: ['西南', '川西', '四川', '成都', '云南', '贵州', '重庆', '雪山', '秘境', '藏', '高原'], weight: 38, enabled: true },
    { label: '海滨城市', keywords: ['海滨', '海风', '海岸', '青岛', '泉州', '厦门', '三亚', '海岛', '滨海', '海'], weight: 38, enabled: true },
    { label: '西北旷野', keywords: ['西北', '青海', '甘肃', '新疆', '敦煌', '沙漠', '戈壁', '旷野', '祁连'], weight: 38, enabled: true },
    { label: '江南古镇', keywords: ['江南', '古镇', '苏州', '杭州', '乌镇', '水乡', '徽州', '绍兴'], weight: 38, enabled: true },
  ],
  themes: [
    { label: '户外徒步', keywords: ['户外', '徒步', '雪山', '轻徒步', '山', '露营'], weight: 28, enabled: true },
    { label: '人文研学', keywords: ['人文', '研学', '非遗', '文化', '博物', '知行'], weight: 28, enabled: true },
    { label: '美食探索', keywords: ['美食', '小吃', '烟火', '味道', '非遗'], weight: 28, enabled: true },
    { label: '旅拍出片', keywords: ['旅拍', '出片', '摄影', '海风', '雪山', '古镇'], weight: 28, enabled: true },
    { label: '毕业团建', keywords: ['毕业', '团建', '青年', '假日', '同学'], weight: 28, enabled: true },
    { label: '亲子同行', keywords: ['亲子', '家庭', '孩子', '研学'], weight: 28, enabled: true },
  ],
  weights: {
    destination_miss_penalty: -18,
    theme_miss_penalty: -6,
    day_match: 20,
    day_near: 8,
    day_miss_penalty: -8,
    budget_good: 18,
    budget_ok: 13,
    budget_low: 7,
    budget_over_near: 3,
    budget_over_penalty: -22,
    stock_available: 8,
    stock_empty_penalty: -24,
    display_weight_cap: 6,
    min_score: 42,
  },
}

const headTitle = computed(() => matches.value.length ? `为你匹配到 ${matches.value.length} 条路线` : '需要人工深度定制')
const headDesc = computed(() => matches.value.length ? '已按匹配度排序，可进入详情查看评价、库存和兑换说明。' : '可以将当前偏好带入人工定制，由平台审核生成专属方案。')
const criteriaChips = computed(() => {
  const item = criteria.value || {}
  return [
    ...(item.destinations || []),
    item.days,
    ...(item.themes || []),
    item.people,
    `${item.budget || 0} 积分内`,
    item.departure_city ? `从 ${item.departure_city} 出发` : '',
    item.travel_time || '',
    item.accept_group ? '接受拼团' : '不接受拼团',
  ].filter(Boolean)
})

const normalizeText = route => [
  route.name,
  route.category,
  route.days,
  route.agency,
  route.description,
  ...(Array.isArray(route.tags) ? route.tags : []),
].filter(Boolean).join(' ').toLowerCase()

const hitCount = (text, keywords) => keywords.filter(keyword => text.includes(String(keyword).toLowerCase())).length
const routeWeight = route => Number(route?.display_weight ?? route?.displayWeight ?? 0)
const routePoints = route => Math.round(Number(route?.price || 0))
const routeStock = route => Number(route?.stock || 0)
const stockText = route => routeStock(route) > 0 ? `余 ${routeStock(route)} 份` : '库存不足'
const settingsValue = () => matchSettings.value || defaultMatchSettings
const weightValue = (key, fallback) => Number(settingsValue().weights?.[key] ?? fallback)
const termList = key => (Array.isArray(settingsValue()[key]) ? settingsValue()[key] : []).filter(item => item?.enabled !== false)
const findTerm = (key, label) => termList(key).find(item => item.label === label) || { label, keywords: [label], weight: key === 'destinations' ? 38 : 28 }
const parseDays = value => {
  const numbers = String(value || '').match(/\d+/g)?.map(Number) || []
  if (!numbers.length) return [0, 0]
  if (numbers.length === 1) return [numbers[0], numbers[0]]
  return [Math.min(...numbers), Math.max(...numbers)]
}
const dayScore = (routeDays, selectedDays) => {
  const [routeMin, routeMax] = parseDays(routeDays)
  const [selectMin, selectMax] = parseDays(selectedDays)
  if (!routeMin || !selectMin) return { score: 0, reason: '' }
  const overlap = routeMin <= selectMax && selectMin <= routeMax
  if (overlap) return { score: weightValue('day_match', 20), reason: `符合 ${selectedDays}` }
  const routeMid = (routeMin + routeMax) / 2
  const selectMid = (selectMin + selectMax) / 2
  const distance = Math.abs(routeMid - selectMid)
  if (distance <= 1.5) return { score: weightValue('day_near', 8), reason: '天数接近' }
  return { score: weightValue('day_miss_penalty', -8), reason: '' }
}

const budgetScore = route => {
  const budgetLimit = Number(criteria.value?.budget || 0)
  const price = routePoints(route)
  if (!budgetLimit || !price) return { score: 0, reason: '' }
  const ratio = price / budgetLimit
  if (ratio <= 1) {
    if (ratio >= 0.75) return { score: weightValue('budget_good', 18), reason: '预算利用率高' }
    if (ratio >= 0.45) return { score: weightValue('budget_ok', 13), reason: '积分预算内' }
    return { score: weightValue('budget_low', 7), reason: '低于预算' }
  }
  if (ratio <= 1.15) return { score: weightValue('budget_over_near', 3), reason: '略高于预算' }
  return { score: weightValue('budget_over_penalty', -22), reason: '' }
}

const scoreRoute = route => {
  const text = normalizeText(route)
  let score = 0
  const reasons = []
  const selectedDestinations = criteria.value?.destinations || []
  const selectedThemes = criteria.value?.themes || []
  const destinationHitScore = selectedDestinations.reduce((sum, label) => {
    const term = findTerm('destinations', label)
    const hits = hitCount(text, term.keywords || [label])
    return sum + (hits ? Math.min(Number(term.weight || 38), 18 + hits * 8) : 0)
  }, 0)
  const themeHitScore = selectedThemes.reduce((sum, label) => {
    const term = findTerm('themes', label)
    const hits = hitCount(text, term.keywords || [label])
    return sum + (hits ? Math.min(Number(term.weight || 28), 10 + hits * 6) : 0)
  }, 0)
  if (destinationHitScore > 0) {
    score += destinationHitScore
    reasons.push('目的地偏好匹配')
  } else if (selectedDestinations.length) {
    score += weightValue('destination_miss_penalty', -18)
  }
  if (themeHitScore > 0) {
    score += themeHitScore
    reasons.push('旅行主题相近')
  } else if (selectedThemes.length) {
    score += weightValue('theme_miss_penalty', -6)
  }
  const days = dayScore(route.days, criteria.value?.days)
  score += days.score
  if (days.reason) reasons.push(days.reason)
  const budget = budgetScore(route)
  score += budget.score
  if (budget.reason) reasons.push(budget.reason)
  if (routeStock(route) > 0) {
    score += weightValue('stock_available', 8)
    reasons.push('当前有库存')
  } else {
    score += weightValue('stock_empty_penalty', -24)
  }
  score += Math.min(weightValue('display_weight_cap', 6), Math.max(0, routeWeight(route)))
  const directHit = destinationHitScore > 0 || themeHitScore > 0
  return {
    ...route,
    matchRawScore: score,
    matchScore: Math.max(1, Math.min(99, Math.round(score))),
    directHit,
    reasons: (reasons.length ? reasons : ['匹配度较低，仅作备选']).slice(0, 3),
  }
}

const buildMatches = routes => {
  const scored = (Array.isArray(routes) ? routes : [])
    .filter(route => ![false, 0, 'false', '0'].includes(route?.status))
    .map(scoreRoute)
    .sort((a, b) => b.matchRawScore - a.matchRawScore || routeWeight(b) - routeWeight(a) || Number(b.id || 0) - Number(a.id || 0))
  const visible = scored.filter(route => routeStock(route) > 0 && route.directHit && route.matchRawScore >= weightValue('min_score', 42))
  matches.value = visible.slice(0, 8)
}

const load = async () => {
  criteria.value = uni.getStorageSync(MATCH_STORAGE_KEY) || null
  if (!criteria.value) {
    uni.showToast({ title: '请先填写匹配偏好', icon: 'none' })
    setTimeout(() => uni.redirectTo({ url: '/pages/custom/params' }), 500)
    return
  }
  loading.value = true
  try {
    const [routeRows, inviteResult, settingsResult] = await Promise.allSettled([
      getPublicRoutes(),
      isLoggedIn() ? getInviteDashboard() : Promise.resolve(null),
      getTravelMatchSettings(),
    ])
    matchSettings.value = settingsResult.status === 'fulfilled' && settingsResult.value ? settingsResult.value : null
    if (inviteResult.status === 'fulfilled') points.value = Number(inviteResult.value?.points || 0)
    buildMatches(routeRows.status === 'fulfilled' ? routeRows.value : [])
  } catch (error) {
    uni.showToast({ title: error.message || '匹配失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const openRoute = route => {
  if (!route?.id) return
  uni.navigateTo({ url: `/pages/points/route-detail?id=${route.id}` })
}

const confirmExchange = route => {
  if (!isLoggedIn()) {
    uni.showToast({ title: '请先登录后兑换', icon: 'none' })
    setTimeout(() => uni.navigateTo({ url: '/pages/auth/login' }), 500)
    return
  }
  if (Number(route.stock || 0) <= 0) return uni.showToast({ title: '该路线库存不足', icon: 'none' })
  const required = routePoints(route)
  if (points.value < required) return uni.showToast({ title: `积分不足，还差 ${required - points.value} 积分`, icon: 'none' })
  uni.showModal({
    title: '确认兑换',
    content: `确认使用 ${required} 积分兑换「${route.name}」？`,
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

const goAdjust = () => {
  uni.navigateBack({
    fail: () => uni.redirectTo({ url: '/pages/custom/params' }),
  })
}
const goManual = () => {
  const item = criteria.value || {}
  uni.setStorageSync(MANUAL_STORAGE_KEY, {
    destination: (item.destinations || []).join('、'),
    travel_time: item.travel_time || '',
    days: item.days || '',
    budget: item.budget ? `${item.budget} 积分/人以内` : '',
    people_count: item.people || '',
    special_tags: [...(item.themes || []), item.accept_group ? '接受拼团' : '不接受拼团'].filter(Boolean),
    note: item.note || '',
  })
  uni.navigateTo({ url: '/pages/custom/manual?prefill=1' })
}

onLoad(load)
onPullDownRefresh(async () => {
  await load()
  uni.stopPullDownRefresh()
})
</script>

<style scoped>
.result-page{min-height:100vh;background:#f4f7f5;padding-bottom:36rpx;color:#17332e}
.result-head{padding:42rpx 30rpx 34rpx;background:linear-gradient(135deg,#133f39,#13a89b);color:#fff}
.result-head text,.result-head b,.result-head small{display:block}
.result-head text{font-size:24rpx;color:#c9fff5;font-weight:900}
.result-head b{margin-top:14rpx;font-size:42rpx;line-height:1.25}
.result-head small{margin-top:12rpx;color:rgba(255,255,255,.8);font-size:24rpx;line-height:1.65}
.content{padding:24rpx}
.criteria-card,.state-card,.match-card{background:#fff;border:1rpx solid #e0e9e5;border-radius:24rpx;box-shadow:0 12rpx 34rpx rgba(17,54,48,.06)}
.criteria-card{padding:24rpx;margin-bottom:24rpx}
.criteria-title{display:flex;align-items:center;justify-content:space-between;gap:20rpx}
.criteria-title b{font-size:30rpx}
.criteria-title text{color:#0b8f80;font-weight:900}
.chips{display:flex;gap:12rpx;flex-wrap:wrap;margin-top:18rpx}
.chips text{padding:9rpx 15rpx;border-radius:999rpx;background:#edf7f4;color:#167468;font-size:22rpx;font-weight:800}
.section-title{margin:28rpx 0 16rpx;font-size:30rpx;font-weight:900}
.match-card{overflow:hidden;margin-bottom:18rpx}
.match-card.featured{border-color:#86d7cc}
.route-cover{width:100%;height:300rpx;display:block;background:#e8f0ed}
.route-info{padding:24rpx}
.route-top{display:flex;align-items:flex-start;justify-content:space-between;gap:18rpx}
.route-top b,.route-top text{display:block}
.route-top b{font-size:31rpx;line-height:1.35}
.route-top text{margin-top:9rpx;color:#758682;font-size:23rpx;line-height:1.45}
.match-score{width:88rpx;height:88rpx;flex:0 0 88rpx;border-radius:50%;background:#fff7ed;color:#f97316;display:flex;flex-direction:column;align-items:center;justify-content:center}
.match-score b{font-size:27rpx;line-height:1}
.match-score text{margin-top:4rpx;color:#f97316;font-size:18rpx}
.reason-list{display:flex;gap:10rpx;flex-wrap:wrap;margin-top:18rpx}
.reason-list text{padding:8rpx 13rpx;border-radius:999rpx;background:#f1f8f6;color:#278073;font-size:21rpx;font-weight:800}
.route-bottom{display:flex;align-items:center;justify-content:space-between;margin-top:22rpx;padding-top:18rpx;border-top:1rpx solid #edf2ef}
.price b{font-size:40rpx;color:#ff7a35}
.price text{margin-left:6rpx;color:#ff7a35;font-weight:900}
.stock{padding:9rpx 14rpx;border-radius:999rpx;background:#e7f6f2;color:#0b8f80;font-size:22rpx;font-weight:900}
.stock.off{background:#fff0e8;color:#bd5a26}
.actions{display:grid;grid-template-columns:1fr 1fr;gap:14rpx;margin-top:22rpx}
.actions button{height:76rpx;border:0;border-radius:18rpx;font-size:25rpx;font-weight:900}
.ghost-btn{background:#f4f7f5;color:#17332e}
.primary-btn{background:#ff7a35;color:#fff}
.primary-btn:disabled{background:#cfdad6;color:#7b8b87}
.state-card{padding:58rpx 30rpx;text-align:center}
.state-icon{width:92rpx;height:92rpx;margin:0 auto 20rpx;border-radius:28rpx;background:#e7f6f2;color:#0b8f80;display:flex;align-items:center;justify-content:center;font-size:32rpx;font-weight:900}
.state-card b,.state-card text{display:block}
.state-card b{font-size:32rpx}
.state-card text{margin-top:14rpx;color:#6f807b;font-size:24rpx;line-height:1.7}
.empty-actions{display:grid;grid-template-columns:1fr 1fr;gap:14rpx;margin-top:28rpx}
.empty-actions .btn{height:76rpx;margin:0;display:flex;align-items:center;justify-content:center;border-radius:18rpx;font-size:25rpx;font-weight:900}
@media(max-width:360px){.actions,.empty-actions{grid-template-columns:1fr}.route-top{display:block}.match-score{margin-top:18rpx}}
</style>
