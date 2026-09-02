<template>
  <view class="orders-page">
    <view class="summary-band">
      <view class="summary-mark">单</view>
      <view class="summary-copy">
        <text>MY ORDERS</text>
        <b>我的学习订单</b>
        <small>购买记录、支付状态与售后服务</small>
      </view>
      <view class="summary-count"><b>{{ orders.length }}</b><text>笔订单</text></view>
    </view>

    <scroll-view class="status-tabs" scroll-x :show-scrollbar="false">
      <view class="status-track">
        <view
          v-for="item in tabs"
          :key="item.key"
          :class="['status-tab', { active: activeTab === item.key }]"
          @tap="activeTab = item.key"
        >
          {{ item.label }} <text>{{ item.count }}</text>
        </view>
      </view>
    </scroll-view>

    <view v-if="loading" class="state-view">
      <view class="state-icon">...</view>
      <b>正在同步订单</b>
      <text>请稍候</text>
    </view>

    <view v-else-if="filteredOrders.length" class="order-list">
      <view v-for="order in filteredOrders" :key="`${order.source}-${order.id}`" class="order-item">
        <view class="order-top">
          <view class="product-main">
            <view class="product-type">{{ typeIcon(order.product_type) }}</view>
            <view>
              <b>{{ orderTitle(order) }}</b>
              <text>{{ order.order_no }}</text>
            </view>
          </view>
          <view :class="['status-pill', displayStatus(order).tone]">{{ displayStatus(order).text }}</view>
        </view>

        <view class="order-meta">
          <view><text>下单时间</text><b>{{ formatDate(order.created_at) }}</b></view>
          <view><text>支付方式</text><b>{{ paymentMethodName(order.payment_method) }}</b></view>
          <view class="amount"><text>实付金额</text><b>¥{{ orderAmount(order) }}</b></view>
        </view>

        <view v-if="order.refund_no" class="refund-line">
          <text>退款单号</text><b>{{ order.refund_no }}</b>
        </view>

        <view class="order-actions">
          <view
            v-if="order.payment_status === COMMERCE_PAYMENT_STATUS.PAID"
            class="action-button"
            @tap="contactMerchant(order)"
          >
            联系商户
          </view>
          <view v-else class="status-note">{{ actionHint(order) }}</view>
        </view>
      </view>
    </view>

    <view v-else class="state-view empty">
      <view class="state-icon">单</view>
      <b>{{ activeTab === 'all' ? '还没有学习订单' : '当前分类暂无订单' }}</b>
      <text>购买学习服务后，订单会展示在这里。</text>
      <view class="shop-button" @tap="goShop">浏览学习服务</view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import { createStudyOrderSupportConversation, getMyStudyOrders } from '../../utils/api.js'
import { COMMERCE_PAYMENT_STATUS, paymentStatusName } from '../../utils/orderStatus.js'

const loading = ref(true)
const orders = ref([])
const activeTab = ref('all')

const pendingCount = computed(() => orders.value.filter(item => item.payment_status === COMMERCE_PAYMENT_STATUS.PENDING).length)
const paidCount = computed(() => orders.value.filter(item => item.payment_status === COMMERCE_PAYMENT_STATUS.PAID && !item.refund_status).length)
const refundCount = computed(() => orders.value.filter(item => item.payment_status === COMMERCE_PAYMENT_STATUS.REFUNDED || item.refund_status).length)
const tabs = computed(() => [
  { key: 'all', label: '全部', count: orders.value.length },
  { key: 'pending', label: '待支付', count: pendingCount.value },
  { key: 'paid', label: '已支付', count: paidCount.value },
  { key: 'refund', label: '退款', count: refundCount.value },
])
const filteredOrders = computed(() => {
  if (activeTab.value === 'pending') return orders.value.filter(item => item.payment_status === COMMERCE_PAYMENT_STATUS.PENDING)
  if (activeTab.value === 'paid') return orders.value.filter(item => item.payment_status === COMMERCE_PAYMENT_STATUS.PAID && !item.refund_status)
  if (activeTab.value === 'refund') return orders.value.filter(item => item.payment_status === COMMERCE_PAYMENT_STATUS.REFUNDED || item.refund_status)
  return orders.value
})

const loadOrders = async (silent = false) => {
  if (!silent) loading.value = true
  try {
    orders.value = await getMyStudyOrders()
  } catch (error) {
    uni.showToast({ title: error.message || '订单加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const orderTitle = order => order.product_name || (order.items || []).map(item => item.product_name).filter(Boolean).join('、') || '学习服务订单'
const orderAmount = order => Number(order.amount ?? order.payable_amount ?? order.total_amount ?? 0).toFixed(2)
const formatDate = value => value ? String(value).replace('T', ' ').slice(0, 16) : '-'
const typeIcon = value => ({ community: '群', package: '课', material: '资' }[value] || '学')
const paymentMethodName = value => ({ wechat: '微信支付', balance: '账户余额', mock: '开发模拟' }[value] || value || '-')
const displayStatus = order => {
  if (order.refund_status === 'processing') return { text: '退款处理中', tone: 'processing' }
  if (order.refund_status === 'abnormal') return { text: '退款异常', tone: 'danger' }
  if (order.payment_status === COMMERCE_PAYMENT_STATUS.PAID) return { text: '已支付', tone: 'success' }
  if (order.payment_status === COMMERCE_PAYMENT_STATUS.REFUNDED) return { text: '已退款', tone: 'muted' }
  if (order.payment_status === COMMERCE_PAYMENT_STATUS.CANCELED) return { text: '已取消', tone: 'muted' }
  return { text: paymentStatusName(order.payment_status), tone: 'pending' }
}
const actionHint = order => {
  if (order.refund_status === 'processing') return '退款结果同步中'
  if (order.payment_status === COMMERCE_PAYMENT_STATUS.REFUNDED) return '款项已原路退回'
  if (order.payment_status === COMMERCE_PAYMENT_STATUS.PENDING) return '等待完成支付'
  return '订单已关闭'
}

const contactMerchant = async order => {
  try {
    const session = await createStudyOrderSupportConversation(order)
    uni.navigateTo({ url: `/pages/support/chat?conversation_id=${encodeURIComponent(session.id)}` })
  } catch (error) {
    uni.showToast({ title: error.message || '商户客服连接失败', icon: 'none' })
  }
}
const goShop = () => uni.navigateTo({ url: '/pages/study/index' })

onShow(() => loadOrders())
onPullDownRefresh(async () => {
  await loadOrders(true)
  uni.stopPullDownRefresh()
})
</script>

<style scoped>
.orders-page{min-height:100vh;padding:24rpx 24rpx 80rpx;background:#f3f6f4;color:#17332e;box-sizing:border-box}.summary-band{display:flex;align-items:center;gap:20rpx;padding:30rpx 28rpx;background:#173f38;color:#fff}.summary-mark{flex:0 0 62rpx;height:62rpx;display:flex;align-items:center;justify-content:center;border-radius:18rpx;background:#ff8749;font-size:24rpx;font-weight:900}.summary-copy{flex:1;min-width:0}.summary-copy text,.summary-copy b,.summary-copy small{display:block}.summary-copy text{color:#8dd8cb;font-size:18rpx}.summary-copy b{margin-top:5rpx;font-size:31rpx}.summary-copy small{margin-top:5rpx;color:rgba(255,255,255,.68);font-size:19rpx}.summary-count{text-align:right}.summary-count b,.summary-count text{display:block}.summary-count b{font-size:38rpx}.summary-count text{color:rgba(255,255,255,.65);font-size:18rpx}.status-tabs{margin:20rpx 0}.status-track{display:flex;width:max-content;gap:12rpx}.status-tab{height:62rpx;padding:0 23rpx;display:flex;align-items:center;gap:9rpx;border:1rpx solid #dfe7e3;border-radius:18rpx;background:#fff;color:#71817d;font-size:21rpx;font-weight:800;box-sizing:border-box}.status-tab text{font-size:17rpx}.status-tab.active{border-color:#173f38;background:#173f38;color:#fff}.order-list{display:flex;flex-direction:column;gap:18rpx}.order-item{padding:25rpx;border:1rpx solid #e1e8e5;border-radius:24rpx;background:#fff;box-shadow:0 11rpx 28rpx rgba(18,54,48,.05)}.order-top,.product-main,.order-actions,.refund-line{display:flex;align-items:center}.order-top{justify-content:space-between;gap:18rpx}.product-main{min-width:0;gap:15rpx}.product-main>view:last-child{min-width:0}.product-type{flex:0 0 50rpx;height:50rpx;display:flex;align-items:center;justify-content:center;border-radius:15rpx;background:#fff1e7;color:#e46d30;font-size:20rpx;font-weight:900}.product-main b,.product-main text{display:block}.product-main b{font-size:25rpx;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.product-main text{margin-top:5rpx;color:#94a09d;font-size:17rpx;word-break:break-all}.status-pill{flex:0 0 auto;padding:8rpx 13rpx;border-radius:99rpx;font-size:18rpx;font-weight:800}.status-pill.success{background:#e3f7f1;color:#087d6e}.status-pill.pending,.status-pill.processing{background:#fff0df;color:#ad6800}.status-pill.muted{background:#eef1f0;color:#778580}.status-pill.danger{background:#ffe9e7;color:#c44b42}.order-meta{display:grid;grid-template-columns:1.2fr 1fr .9fr;gap:12rpx;margin-top:23rpx;padding:19rpx 0;border-top:1rpx solid #edf1ef;border-bottom:1rpx solid #edf1ef}.order-meta text,.order-meta b{display:block}.order-meta text{color:#8c9995;font-size:17rpx}.order-meta b{margin-top:6rpx;font-size:19rpx}.order-meta .amount{text-align:right}.order-meta .amount b{color:#e46832;font-size:25rpx}.refund-line{justify-content:space-between;gap:15rpx;padding-top:16rpx;color:#8a9793;font-size:17rpx}.refund-line b{color:#5d6e69;word-break:break-all;text-align:right}.order-actions{justify-content:flex-end;margin-top:19rpx}.action-button,.shop-button{display:flex;align-items:center;justify-content:center;background:#ff7a35;color:#fff;font-weight:800}.action-button{height:60rpx;padding:0 23rpx;border-radius:99rpx;font-size:20rpx}.status-note{color:#899691;font-size:18rpx}.state-view{padding:100rpx 30rpx;text-align:center}.state-view .state-icon{width:72rpx;height:72rpx;margin:0 auto;display:flex;align-items:center;justify-content:center;border-radius:22rpx;background:#fff0e5;color:#e66d31;font-size:23rpx;font-weight:900}.state-view b,.state-view text{display:block}.state-view b{margin-top:20rpx;font-size:28rpx}.state-view text{margin-top:10rpx;color:#81908c;font-size:21rpx}.shop-button{width:240rpx;height:70rpx;margin:25rpx auto 0;border-radius:18rpx;font-size:22rpx}@media(max-width:360px){.orders-page{padding-left:18rpx;padding-right:18rpx}.summary-count{display:none}.order-meta{grid-template-columns:1fr 1fr}.order-meta .amount{grid-column:1/-1;text-align:left}}
</style>
