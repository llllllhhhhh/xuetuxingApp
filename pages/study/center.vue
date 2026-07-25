<template>
  <view class="page center-page">
    <view class="profile safe-top">
      <view class="profile-head">
        <view>
          <view class="eyebrow">MY LEARNING CENTER</view>
          <view class="title">我的学习中心</view>
        </view>
        <view class="profile-mark">学</view>
      </view>

      <view class="profile-grid">
        <view class="profile-stat"><text>目标考试</text><b>{{ data.profile?.target_exam || '待设置' }}</b></view>
        <view class="profile-stat"><text>当前阶段</text><b>{{ data.profile?.current_stage || '基础阶段' }}</b></view>
        <view class="profile-stat"><text>累计打卡</text><b>{{ data.profile?.checkin_days || 0 }}<small> 天</small></b></view>
      </view>

      <view :class="['checkin-button', { done: checked }]" @click="checkIn">
        <view class="check-icon">{{ checked ? '✓' : '今' }}</view>
        <view>
          <b>{{ checked ? '今天已完成打卡' : '完成今日学习打卡' }}</b>
          <text>{{ checked ? '保持节奏，明天继续' : '记录你的每一次坚持' }}</text>
        </view>
        <text class="check-arrow">→</text>
      </view>
    </view>

    <view class="content">
      <view class="section-title">
        <view><b>已购服务</b><text>课程、资料和会员权益</text></view>
        <text class="count">{{ data.entitlements?.length || 0 }} 项</text>
      </view>

      <view v-if="loading" class="loading-card">正在同步你的学习权益...</view>

      <view v-for="right in data.entitlements" :key="right.id" class="right-card">
        <view class="right-head">
          <view class="right-icon">{{ typeIcon(right.product_type) }}</view>
          <view class="right-title"><text>{{ typeName(right.product_type) }}</text><b>{{ right.product_name }}</b></view>
          <text class="active">生效中</text>
        </view>

        <view class="right-meta">
          <text>{{ right.expires_at ? `有效期至 ${formatDate(right.expires_at)}` : '长期有效' }}</text>
          <text>进度 {{ right.progress || 0 }}%</text>
        </view>
        <view class="progress"><view :style="{ width: `${right.progress || 0}%` }"></view></view>

        <view class="lesson-list">
          <view v-for="lesson in right.product?.contents || []" :key="lesson.id" class="lesson">
            <view class="lesson-type">{{ lessonIcon(lesson.content_type) }}</view>
            <view class="lesson-info"><b>{{ lesson.title }}</b><text>{{ lesson.summary }}</text></view>
            <text class="lesson-action">去学习</text>
          </view>
        </view>
      </view>

      <view v-if="!loading && !data.entitlements?.length" class="empty-card">
        <view class="empty-icon">📚</view>
        <b>还没有已购服务</b>
        <text>选择适合你的督学社群或长期套餐，让备考更有节奏。</text>
        <view class="shop-button" @click="goShop">浏览学习服务 <text>→</text></view>
      </view>

      <view class="order-card">
        <view class="order-header" @click="showOrders">
          <view class="order-icon">单</view>
          <view><b>我的学习订单</b><text>查看购买记录、支付状态与商户客服</text></view>
          <text class="order-arrow">{{ ordersVisible ? '⌃' : '→' }}</text>
        </view>
        <view v-if="ordersVisible" class="orders">
          <view v-if="!orders.length" class="no-orders">暂无学习订单</view>
          <view v-for="order in orders" :key="order.id" class="order-row">
            <view class="order-info">
              <b>{{ orderTitle(order) }}</b>
              <text>{{ order.order_no }}</text>
              <small>{{ formatTime(order.created_at) }}</small>
            </view>
            <view class="order-amount">
              <b>¥{{ orderAmount(order) }}</b>
              <text :class="order.payment_status">{{ order.payment_status_text || paymentStatusName(order.payment_status) }}</text>
            </view>
            <view v-if="order.payment_status === COMMERCE_PAYMENT_STATUS.PAID" class="merchant-chat" @click.stop="contactMerchant(order)">联系商户</view>
          </view>
        </view>
      </view>
      <view class="safe-bottom-space"></view>
    </view>
    <BottomNav active="学习中心" />
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import BottomNav from '../../components/BottomNav.vue'
import { createStudyOrderSupportConversation, getLearningCenter, getMyStudyOrders, studyCheckIn } from '../../utils/api.js'
import { COMMERCE_PAYMENT_STATUS, paymentStatusName } from '../../utils/orderStatus.js'

const data = ref({ profile: {}, entitlements: [] })
const loading = ref(true)
const checked = ref(false)
const ordersVisible = ref(false)
const orders = ref([])

const typeName = value => ({ community: '督学社群', package: '长期套餐', material: '资料包' }[value] || '学习服务')
const typeIcon = value => ({ community: '群', package: '课', material: '料' }[value] || '学')
const lessonIcon = value => ({ lesson: '课', material: '料', test: '测', live: '播', service: '服' }[value] || '学')
const formatDate = value => new Date(value).toLocaleDateString()
const formatTime = value => new Date(value).toLocaleDateString()
const orderTitle = order => order.product_name || (order.items || []).map(item => item.product_name).join('、') || '学习服务订单'
const orderAmount = order => Number(order.amount ?? order.payable_amount ?? 0).toFixed(2)

const load = async () => {
  try {
    data.value = await getLearningCenter()
  } catch (error) {
    uni.showToast({ title: error.message || '学习中心加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const checkIn = async () => {
  if (checked.value) return uni.showToast({ title: '今天已经打卡', icon: 'none' })
  try {
    const result = await studyCheckIn()
    checked.value = true
    data.value.profile.checkin_days = result.checkin_days
    uni.showToast({ title: result.message || '打卡成功' })
  } catch (error) {
    uni.showToast({ title: error.message || '打卡失败', icon: 'none' })
  }
}

const goShop = () => uni.navigateTo({ url: '/pages/study/index' })
const showOrders = async () => {
  ordersVisible.value = !ordersVisible.value
  if (ordersVisible.value && !orders.value.length) {
    try {
      orders.value = await getMyStudyOrders()
    } catch (error) {
      uni.showToast({ title: error.message || '订单加载失败', icon: 'none' })
    }
  }
}

const contactMerchant = async order => {
  try {
    const session = await createStudyOrderSupportConversation(order)
    uni.navigateTo({ url: `/pages/support/chat?conversation_id=${encodeURIComponent(session.id)}` })
  } catch (error) {
    uni.showToast({ title: error.message || '商户客服连接失败', icon: 'none' })
  }
}

onLoad(load)
</script>

<style scoped>
.center-page{min-height:100vh;padding-bottom:0;background:#f3f6f4;color:#17332e}.profile{padding:40rpx 28rpx 35rpx;background:linear-gradient(145deg,#183e38,#0a7367);color:#fff;position:relative;overflow:hidden}.profile:after{content:'';position:absolute;width:300rpx;height:300rpx;border:48rpx solid rgba(255,255,255,.04);border-radius:50%;right:-140rpx;top:-110rpx}.profile-head{display:flex;align-items:center;justify-content:space-between;position:relative;z-index:1}.eyebrow{color:#8fd9cd;font-size:18rpx;letter-spacing:2rpx}.title{margin-top:9rpx;font-size:42rpx;font-weight:900}.profile-mark{width:70rpx;height:70rpx;border-radius:23rpx 23rpx 23rpx 7rpx;background:linear-gradient(135deg,#ff7b38,#ffad75);display:flex;align-items:center;justify-content:center;font-size:32rpx;font-weight:900;box-shadow:0 12rpx 25rpx rgba(0,0,0,.14)}.profile-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10rpx;margin-top:28rpx;position:relative;z-index:1}.profile-stat{min-width:0;padding:18rpx 12rpx;border:1rpx solid rgba(255,255,255,.1);border-radius:18rpx;background:rgba(255,255,255,.08);text-align:center}.profile-stat text,.profile-stat b{display:block}.profile-stat text{color:#b9d8d2;font-size:18rpx}.profile-stat b{margin-top:8rpx;font-size:24rpx;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.profile-stat small{font-size:17rpx}.checkin-button{display:flex;align-items:center;gap:15rpx;margin-top:17rpx;padding:17rpx 20rpx;border-radius:20rpx;background:#ff8749;position:relative;z-index:1;box-shadow:0 10rpx 24rpx rgba(255,122,53,.2)}.checkin-button.done{background:rgba(255,255,255,.12);box-shadow:none}.check-icon{flex:0 0 48rpx;height:48rpx;border-radius:15rpx;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:21rpx;font-weight:900}.checkin-button>view:nth-child(2){flex:1}.checkin-button b,.checkin-button text{display:block}.checkin-button b{font-size:23rpx}.checkin-button view text{margin-top:3rpx;color:rgba(255,255,255,.75);font-size:18rpx}.check-arrow{font-size:29rpx}.content{padding:27rpx 24rpx 0}.section-title{display:flex;align-items:flex-end;justify-content:space-between;padding:2rpx 4rpx 20rpx}.section-title b,.section-title view>text{display:block}.section-title b{font-size:31rpx}.section-title view>text{margin-top:5rpx;color:#8a9895;font-size:19rpx}.section-title .count{color:#82918d;font-size:20rpx}.loading-card,.empty-card,.right-card,.order-card{border:1rpx solid #e5ebe8;border-radius:27rpx;background:#fff;box-shadow:0 12rpx 34rpx rgba(17,54,48,.05)}.loading-card{padding:80rpx 25rpx;color:#879591;text-align:center}.right-card{margin-bottom:24rpx;padding:26rpx}.right-head{display:flex;align-items:center;gap:15rpx}.right-icon{flex:0 0 58rpx;height:58rpx;border-radius:18rpx;background:linear-gradient(135deg,#e2f6f0,#ccefe6);color:#087d6e;display:flex;align-items:center;justify-content:center;font-size:23rpx;font-weight:900}.right-title{flex:1;min-width:0}.right-title text,.right-title b{display:block}.right-title text{color:#0b8a79;font-size:19rpx}.right-title b{margin-top:5rpx;font-size:27rpx;line-height:1.35}.active{flex:0 0 auto;padding:7rpx 12rpx;border-radius:99rpx;background:#e2f6f0;color:#087d6e;font-size:18rpx}.right-meta{display:flex;justify-content:space-between;margin:24rpx 0 11rpx;color:#83928e;font-size:19rpx}.progress{height:8rpx;border-radius:10rpx;background:#eaf0ee;overflow:hidden}.progress view{height:100%;border-radius:10rpx;background:linear-gradient(90deg,#14a692,#4ac7b5)}.lesson-list{margin-top:20rpx;border-top:1rpx solid #edf1ef}.lesson{display:flex;align-items:center;gap:13rpx;min-width:0;padding:18rpx 0;border-bottom:1rpx solid #edf1ef}.lesson:last-child{padding-bottom:0;border-bottom:0}.lesson-type{flex:0 0 43rpx;height:43rpx;border-radius:13rpx;background:#f0f5f3;color:#627b75;display:flex;align-items:center;justify-content:center;font-size:18rpx;font-weight:800}.lesson-info{flex:1;min-width:0}.lesson-info b,.lesson-info text{display:block}.lesson-info b{font-size:22rpx}.lesson-info text{margin-top:4rpx;color:#8a9794;font-size:18rpx;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.lesson-action{flex:0 0 auto;color:#0b8a79;font-size:19rpx}.empty-card{padding:52rpx 34rpx;text-align:center}.empty-icon{font-size:58rpx}.empty-card b,.empty-card>text{display:block}.empty-card b{margin:17rpx 0 10rpx;font-size:28rpx}.empty-card>text{color:#768783;font-size:21rpx;line-height:1.7}.shop-button{display:inline-flex;align-items:center;gap:12rpx;margin-top:24rpx;padding:15rpx 24rpx;border-radius:18rpx;background:#ff7a35;color:#fff;font-size:22rpx;font-weight:700}.order-card{margin-top:24rpx;overflow:hidden}.order-header{display:flex;align-items:center;gap:15rpx;padding:24rpx}.order-icon{flex:0 0 52rpx;height:52rpx;border-radius:16rpx;background:#fff1e7;color:#e66f32;display:flex;align-items:center;justify-content:center;font-size:21rpx;font-weight:900}.order-header>view:nth-child(2){flex:1}.order-header b,.order-header view text{display:block}.order-header b{font-size:25rpx}.order-header view text{margin-top:5rpx;color:#889692;font-size:18rpx}.order-arrow{color:#788985;font-size:27rpx}.orders{border-top:1rpx solid #edf1ef}.no-orders{padding:36rpx;color:#8a9894;text-align:center;font-size:21rpx}.order-row{display:flex;align-items:center;justify-content:space-between;gap:15rpx;padding:21rpx 24rpx;border-bottom:1rpx solid #edf1ef}.order-row:last-child{border-bottom:0}.order-info{flex:1;min-width:0}.order-info b,.order-info text,.order-info small,.order-amount b,.order-amount text{display:block}.order-info b{font-size:22rpx}.order-info text{margin-top:6rpx;color:#899692;font-size:17rpx;word-break:break-all}.order-info small{margin-top:4rpx;color:#a0aaa8;font-size:16rpx}.order-amount{flex:0 0 auto;text-align:right}.order-amount b{font-size:23rpx}.order-amount text{margin-top:7rpx;color:#b57920;font-size:18rpx}.order-amount text.paid{color:#09816f}.merchant-chat{flex:0 0 auto;padding:12rpx 18rpx;border-radius:999rpx;background:#fff2e8;color:#e86f32;font-size:19rpx;font-weight:800;border:1rpx solid #ffd7bf}.safe-bottom-space{height:45rpx}
.safe-bottom-space{height:170rpx}
</style>
