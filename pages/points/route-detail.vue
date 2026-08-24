<template>
  <view class="page detail-page">
    <view v-if="loading" class="empty">
      <view>...</view>
      <b>路线加载中</b>
      <text>正在同步旅游详情</text>
    </view>

    <template v-else-if="route">
      <view class="hero">
        <image :src="route.image || fallbackImage" mode="aspectFill" />
        <view class="hero-shade"></view>
        <view :class="['stock', routeAvailable(route) ? '' : 'off']">{{ stockText(route) }}</view>
      </view>

      <view class="content">
        <view class="summary-card">
          <view class="summary-top">
            <view>
              <view class="route-name">{{ route.name }}</view>
              <view class="route-meta">{{ route.days || '-' }} · {{ route.category || '旅行路线' }} · {{ route.agency || '平台合作服务方' }}</view>
            </view>
          </view>
          <view class="price"><text>{{ routePoints(route) }}</text> 积分</view>
        </view>

        <view class="detail-grid">
          <view><text>行程天数</text><b>{{ route.days || '-' }}</b></view>
          <view><text>路线分类</text><b>{{ route.category || '旅行路线' }}</b></view>
          <view><text>服务方</text><b>{{ route.agency || '平台合作服务方' }}</b></view>
          <view><text>剩余库存</text><b>{{ Number(route.stock || 0) }} 份</b></view>
        </view>

        <view class="section-card">
          <view class="section-title">路线介绍</view>
          <view class="description">{{ route.description || '暂无详细介绍，后续由平台补充路线亮点、适合人群与服务内容。' }}</view>
        </view>

        <view class="notice-card">
          <b>兑换说明</b>
          <text>兑换成功后会在“我的旅行”生成订单，后续可继续签署合同、查看履约进度。</text>
        </view>

        <view class="section-card review-card">
          <view class="review-head">
            <view>
              <view class="section-title">路线评价</view>
              <text>{{ reviews.count ? `${reviews.count} 条评价 · 平均 ${reviews.averageRating} 分` : '兑换用户可评价这条路线' }}</text>
            </view>
            <view class="score">{{ reviews.averageRating || '-' }}</view>
          </view>

          <view v-if="reviews.eligibility?.can_review" class="review-form">
            <view class="star-picker">
              <text
                v-for="star in starList"
                :key="star"
                :class="{ active: star <= reviewForm.rating }"
                @click="reviewForm.rating = star"
              >★</text>
            </view>
            <textarea v-model.trim="reviewForm.content" maxlength="1200" placeholder="分享路线体验、服务感受或适合人群"></textarea>
            <view class="review-images">
              <view v-for="(image, index) in reviewForm.images" :key="image" class="review-image-thumb">
                <image :src="reviewImageUrl(image)" mode="aspectFill" @click="previewReviewImages(reviewForm.images, index)" />
                <text @click.stop="removeReviewImage(index)">×</text>
              </view>
              <view v-if="reviewForm.images.length < 6" class="upload-tile" @click="chooseReviewImages">
                <b>{{ reviews.uploading ? '上传中' : '+' }}</b>
                <small>图片</small>
              </view>
            </view>
            <button class="review-submit" :disabled="reviews.submitting || reviews.uploading" @click="submitReview">
              {{ reviews.submitting ? '提交中...' : '发布评价' }}
            </button>
          </view>
          <view v-else class="review-tip">{{ reviewTipText }}</view>

          <view v-if="reviews.items.length" class="review-list">
            <view v-for="item in reviews.items" :key="item.id" class="review-item">
              <view class="review-user">
                <b>{{ item.user_name || '兑换用户' }}</b>
                <text>{{ formatReviewTime(item.created_at) }}</text>
              </view>
              <view class="review-stars">{{ starText(item.rating) }}</view>
              <view v-if="item.content" class="review-content">{{ item.content }}</view>
              <view v-if="item.images?.length" class="review-gallery">
                <image
                  v-for="(image, index) in item.images"
                  :key="image"
                  :src="reviewImageUrl(image)"
                  mode="aspectFill"
                  @click="previewReviewImages(item.images, index)"
                />
              </view>
            </view>
          </view>
          <view v-else class="empty-reviews">暂无评价，兑换体验后可以发布第一条。</view>
        </view>
      </view>

      <view class="bottom-bar">
        <view class="balance">
          <text>当前可用</text>
          <b>{{ dashboard.points }} 积分</b>
        </view>
        <button :disabled="!canExchange(route)" @click="confirmExchange(route)">{{ exchangeText(route) }}</button>
      </view>
    </template>

    <view v-else class="empty">
      <view>🧭</view>
      <b>路线不存在</b>
      <text>该路线可能已下架，请返回重新选择</text>
    </view>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
import {
  exchangeTravelRoute,
  fetchMe,
  getInviteDashboard,
  getPublicRoutes,
  getTravelRouteReviewEligibility,
  getTravelRouteReviews,
  isLoggedIn,
  resolveAssetThumbUrl,
  resolveAssetUrl,
  submitTravelRouteReview,
  uploadTravelRouteReviewImage,
} from '../../utils/api.js'

const routeId = ref(0)
const route = ref(null)
const loading = ref(false)
const submitting = ref(false)
const fallbackImage = 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=900'
const dashboard = reactive({
  points: 0,
})
const reviews = reactive({
  loading: false,
  count: 0,
  averageRating: 0,
  items: [],
  eligibility: null,
  uploading: false,
  submitting: false,
})
const reviewForm = reactive({
  order_id: 0,
  rating: 5,
  content: '',
  images: [],
})
const starList = [1, 2, 3, 4, 5]

const routePoints = item => Math.round(Number(item?.price || 0))
const routeAvailable = item => Number(item?.stock || 0) > 0
const stockText = item => routeAvailable(item) ? `余 ${Number(item.stock)} 份` : '库存不足'
const canExchange = item => routeAvailable(item) && dashboard.points >= routePoints(item) && !submitting.value
const exchangeText = item => {
  if (submitting.value) return '兑换中...'
  if (!routeAvailable(item)) return '已兑完'
  const missing = routePoints(item) - dashboard.points
  return missing > 0 ? `差 ${missing} 积分` : '立即兑换'
}
const routeWeight = item => Number(item?.display_weight ?? item?.displayWeight ?? 0)
const visibleRoutes = list => (Array.isArray(list) ? list : [])
  .filter(item => ![false, 0, 'false', '0'].includes(item?.status))
  .sort((a, b) => routeWeight(b) - routeWeight(a) || Number(b.id || 0) - Number(a.id || 0))

const reviewTipText = computed(() => {
  if (reviews.loading) return '评价加载中...'
  if (reviews.eligibility?.reason === 'already_reviewed') return '你已评价过当前兑换订单。'
  if (reviews.eligibility?.reason === 'not_exchanged') return '兑换这条路线后即可发布评价。'
  if (reviews.eligibility?.reason === 'trip_not_completed') return '行程完成后即可发布评价。'
  return '登录并兑换后即可发布评价。'
})
const starText = rating => '★★★★★'.slice(0, Math.max(1, Math.min(5, Number(rating || 0))))
const reviewImageUrl = url => resolveAssetThumbUrl(url) || resolveAssetUrl(url)
const formatReviewTime = value => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
}

const resetReviewForm = () => {
  reviewForm.order_id = Number(reviews.eligibility?.eligible_order_id || 0)
  reviewForm.rating = 5
  reviewForm.content = ''
  reviewForm.images = []
}

const loadReviews = async id => {
  if (!id) return
  reviews.loading = true
  try {
    const [reviewResult, eligibilityResult] = await Promise.allSettled([
      getTravelRouteReviews(id),
      getTravelRouteReviewEligibility(id),
    ])
    if (reviewResult.status === 'fulfilled') {
      reviews.count = Number(reviewResult.value?.count || 0)
      reviews.averageRating = Number(reviewResult.value?.average_rating || 0)
      reviews.items = Array.isArray(reviewResult.value?.items) ? reviewResult.value.items : []
    }
    if (eligibilityResult.status === 'fulfilled') {
      reviews.eligibility = eligibilityResult.value
      resetReviewForm()
    } else {
      reviews.eligibility = null
    }
  } finally {
    reviews.loading = false
  }
}

const load = async () => {
  if (!isLoggedIn()) {
    uni.showModal({
      title: '请先登录',
      content: '登录后才能查看并兑换路线。',
      success: result => result.confirm && uni.navigateTo({ url: '/pages/auth/login' }),
    })
    return
  }
  loading.value = true
  try {
    const [invite, routeList] = await Promise.all([getInviteDashboard(), getPublicRoutes()])
    dashboard.points = Number(invite?.points || 0)
    route.value = visibleRoutes(routeList).find(item => Number(item.id) === Number(routeId.value)) || null
    if (route.value?.name) uni.setNavigationBarTitle({ title: route.value.name })
    await loadReviews(routeId.value)
  } catch (error) {
    uni.showToast({ title: error.message || '路线详情加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const confirmExchange = item => {
  if (!routeAvailable(item)) return uni.showToast({ title: '该路线库存不足', icon: 'none' })
  const required = routePoints(item)
  if (dashboard.points < required) return uni.showToast({ title: `积分不足，还差 ${required - dashboard.points} 积分`, icon: 'none' })
  uni.showModal({
    title: '确认兑换',
    content: `确认使用 ${required} 积分兑换「${item.name}」？兑换成功后将在“我的旅行”中生成订单。`,
    success: result => {
      if (result.confirm) submitExchange(item)
    },
  })
}

const submitExchange = async item => {
  if (submitting.value) return
  submitting.value = true
  try {
    await exchangeTravelRoute(item.id)
    await fetchMe().catch(() => null)
    uni.showToast({ title: '兑换成功', icon: 'success' })
    setTimeout(() => uni.redirectTo({ url: '/pages/mine/travel' }), 500)
  } catch (error) {
    uni.showToast({ title: error.message || '兑换失败', icon: 'none' })
    await load()
  } finally {
    submitting.value = false
  }
}

const chooseReviewImages = () => {
  if (reviews.uploading) return
  const remain = 6 - reviewForm.images.length
  if (remain <= 0) return
  uni.chooseImage({
    count: remain,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async result => {
      const paths = result.tempFilePaths || []
      if (!paths.length) return
      reviews.uploading = true
      try {
        for (const filePath of paths) {
          const uploaded = await uploadTravelRouteReviewImage(routeId.value, filePath)
          if (uploaded?.url && reviewForm.images.length < 6) reviewForm.images.push(uploaded.url)
        }
      } catch (error) {
        uni.showToast({ title: error.message || '图片上传失败', icon: 'none' })
      } finally {
        reviews.uploading = false
      }
    },
  })
}

const removeReviewImage = index => {
  reviewForm.images.splice(index, 1)
}

const previewReviewImages = (images, index = 0) => {
  const urls = (images || []).map(resolveAssetUrl).filter(Boolean)
  if (!urls.length) return
  uni.previewImage({ urls, current: urls[index] || urls[0] })
}

const submitReview = async () => {
  if (!reviews.eligibility?.can_review) return uni.showToast({ title: reviewTipText.value, icon: 'none' })
  if (!reviewForm.content && !reviewForm.images.length) return uni.showToast({ title: '请填写评价内容或上传图片', icon: 'none' })
  if (reviews.submitting || reviews.uploading) return
  reviews.submitting = true
  try {
    await submitTravelRouteReview(routeId.value, {
      order_id: Number(reviewForm.order_id || reviews.eligibility.eligible_order_id || 0),
      rating: reviewForm.rating,
      content: reviewForm.content,
      images: reviewForm.images,
    })
    uni.showToast({ title: '评价已发布', icon: 'success' })
    await loadReviews(routeId.value)
  } catch (error) {
    uni.showToast({ title: error.message || '评价提交失败', icon: 'none' })
  } finally {
    reviews.submitting = false
  }
}

onLoad(query => {
  routeId.value = Number(query.id || 0)
  load()
})

onPullDownRefresh(async () => {
  await load()
  uni.stopPullDownRefresh()
})
</script>

<style scoped>
.detail-page{min-height:100vh;padding-bottom:150rpx;background:#f3f6f4;color:#17332e}
.hero{position:relative;height:430rpx;overflow:hidden;background:#eef4f2;border-radius:0}
.hero image{width:100%;height:100%;display:block}
.hero-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(14,42,37,.04),rgba(14,42,37,.52))}
.stock{position:absolute;left:28rpx;bottom:30rpx;color:#0b8f7e;background:rgba(230,247,243,.94);border-radius:999rpx;padding:10rpx 18rpx;font-size:22rpx;font-weight:900}
.stock.off{color:#b85a22;background:rgba(255,240,231,.96)}
.content{position:relative;z-index:2;margin-top:0;padding:0 24rpx 44rpx}
.summary-card{margin:0 -24rpx;padding:30rpx 24rpx;background:#fff;border:0;border-bottom:1rpx solid #e4ece9;border-radius:0;box-shadow:none}
.section-card,.notice-card{background:#fff;border:1rpx solid #e4ece9;border-radius:24rpx;box-shadow:0 14rpx 36rpx rgba(18,54,48,.07)}
.route-name{font-size:42rpx;font-weight:900;line-height:1.3}
.route-meta{margin-top:12rpx;color:#667773;font-size:25rpx;line-height:1.5}
.price{margin-top:28rpx;padding-top:22rpx;border-top:1rpx solid #edf2f0;color:#ff7a35;font-weight:900}
.price text{font-size:58rpx}
.detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:16rpx;margin-top:22rpx}
.detail-grid view{background:#fff;border:1rpx solid #e4ece9;border-radius:18rpx;padding:20rpx;box-shadow:0 10rpx 26rpx rgba(18,54,48,.045)}
.detail-grid text,.detail-grid b{display:block}
.detail-grid text{font-size:22rpx;color:#7c8b87}
.detail-grid b{margin-top:8rpx;font-size:25rpx;color:#173f38;line-height:1.35}
.section-card,.notice-card{margin-top:22rpx;padding:26rpx}
.section-title{font-size:30rpx;font-weight:900}
.description{margin-top:14rpx;color:#5f716d;font-size:25rpx;line-height:1.85;white-space:pre-wrap}
.notice-card b,.notice-card text{display:block}
.notice-card b{font-size:28rpx}
.notice-card text{margin-top:10rpx;color:#657672;font-size:24rpx;line-height:1.7}
.review-head{display:flex;align-items:center;justify-content:space-between;gap:20rpx}
.review-head text{display:block;margin-top:8rpx;color:#7b8c87;font-size:23rpx}
.score{width:82rpx;height:82rpx;display:grid;place-items:center;border-radius:50%;background:#fff7ed;color:#f97316;font-size:30rpx;font-weight:900}
.review-form{margin-top:24rpx;padding:22rpx;border:1rpx solid #e4ece9;border-radius:20rpx;background:#f8fbfa}
.star-picker{display:flex;gap:10rpx;margin-bottom:18rpx}
.star-picker text{font-size:42rpx;color:#d1ddd9;line-height:1}
.star-picker text.active{color:#ff9f2f}
.review-form textarea{width:100%;min-height:150rpx;box-sizing:border-box;border:1rpx solid #dfe9e6;border-radius:18rpx;background:#fff;padding:20rpx;color:#17332e;font-size:25rpx;line-height:1.6}
.review-images,.review-gallery{display:flex;flex-wrap:wrap;gap:14rpx;margin-top:18rpx}
.review-image-thumb,.upload-tile{position:relative;width:132rpx;height:132rpx;border-radius:16rpx;overflow:hidden;background:#eef4f2}
.review-image-thumb image,.review-gallery image{width:100%;height:100%;display:block}
.review-image-thumb text{position:absolute;right:6rpx;top:6rpx;width:34rpx;height:34rpx;display:grid;place-items:center;border-radius:50%;background:rgba(0,0,0,.55);color:#fff;font-size:24rpx}
.upload-tile{display:flex;flex-direction:column;align-items:center;justify-content:center;border:1rpx dashed #b9c9c4;color:#3e625b}
.upload-tile b,.upload-tile small{display:block;text-align:center}
.upload-tile b{font-size:42rpx;line-height:1}
.upload-tile small{margin-top:8rpx;font-size:22rpx}
.review-submit{height:78rpx;margin:20rpx 0 0;border:0;border-radius:18rpx;background:#173f38;color:#fff;font-size:26rpx;font-weight:900}
.review-submit:disabled{background:#ccd7d3;color:#7d8c88}
.review-tip{margin-top:20rpx;padding:18rpx;border-radius:16rpx;background:#f6f8f7;color:#6c7d78;font-size:24rpx;line-height:1.6}
.review-list{margin-top:22rpx}
.review-item{padding:24rpx 0;border-top:1rpx solid #edf2f0}
.review-user{display:flex;align-items:center;justify-content:space-between;gap:16rpx}
.review-user b{font-size:26rpx}
.review-user text{color:#8b9b97;font-size:22rpx}
.review-stars{margin-top:10rpx;color:#ff9f2f;font-size:25rpx;letter-spacing:0}
.review-content{margin-top:12rpx;color:#4f625d;font-size:25rpx;line-height:1.75;white-space:pre-wrap}
.review-gallery image{width:142rpx;height:142rpx;border-radius:16rpx;background:#eef4f2}
.empty-reviews{margin-top:20rpx;padding:34rpx;border-radius:18rpx;background:#f8fbfa;color:#7b8c87;text-align:center;font-size:24rpx}
.empty{text-align:center;background:#fff;border-radius:24rpx;margin:24rpx;padding:90rpx 24rpx}
.empty view{font-size:64rpx}
.empty b,.empty text{display:block;margin-top:16rpx}
.empty text{color:#778684;font-size:24rpx}
.bottom-bar{position:fixed;left:0;right:0;bottom:0;z-index:20;display:flex;align-items:center;justify-content:space-between;gap:22rpx;padding:18rpx 26rpx calc(18rpx + env(safe-area-inset-bottom));border-top:1rpx solid #e6eeeb;background:rgba(255,255,255,.97);box-shadow:0 -10rpx 30rpx rgba(14,44,39,.08)}
.balance text,.balance b{display:block}
.balance text{color:#7c8d89;font-size:20rpx}
.balance b{margin-top:4rpx;font-size:28rpx}
.bottom-bar button{flex:0 0 280rpx;height:82rpx;margin:0;border:0;border-radius:18rpx;background:linear-gradient(135deg,#ff7a35,#ff985b);color:#fff;font-size:27rpx;font-weight:900;box-shadow:0 9rpx 20rpx rgba(255,122,53,.22)}
.bottom-bar button:disabled{background:#ccd7d3;color:#7d8c88;box-shadow:none}
@media(max-width:360px){.detail-grid{grid-template-columns:1fr}.bottom-bar button{flex-basis:235rpx}.route-name{font-size:37rpx}}
</style>
