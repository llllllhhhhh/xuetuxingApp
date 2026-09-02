<template>
  <view class="cashier-page">
    <view class="glow glow-a"></view>
    <view class="glow glow-b"></view>

    <view class="top-card">
      <view class="brand-pill">学徒行收银台</view>
      <view class="pay-title">确认支付</view>
      <view class="amount-line"><text>¥</text>{{ payAmount }}</view>
      <view class="countdown">剩余支付时间 {{ remainText }}</view>
      <view v-if="product" class="order-info">
        <view class="product-name">{{ product.name }}</view>
        <view class="product-desc">{{ product.subtitle || '学习产品与付费服务' }}</view>
      </view>
    </view>

    <view class="method-card">
      <view class="section-title">选择支付方式</view>
      <view
        v-for="method in paymentMethods"
        :key="method.key"
        :class="['method-row', { active: selectedMethod === method.key, disabled: method.disabled }]"
        @click="selectMethod(method)"
      >
        <view :class="['method-icon', method.key]">{{ method.icon }}</view>
        <view class="method-main">
          <view class="method-name">
            {{ method.name }}
            <text v-if="method.badge" class="method-badge">{{ method.badge }}</text>
          </view>
          <view class="method-note">{{ method.note }}</view>
        </view>
        <view class="method-radio">
          <view v-if="selectedMethod === method.key && !method.disabled" class="radio-dot"></view>
        </view>
      </view>
    </view>

    <view class="notice-card">
      <view class="notice-dot"></view>
      <view>
        <b>支付说明</b>
        <text>{{ paymentNotice }}</text>
      </view>
    </view>

    <view class="bottom-pay">
      <view class="bottom-amount">
        <text>本次应付</text>
        <view><small>¥</small><b>{{ payAmount }}</b></view>
      </view>
      <button :disabled="paying || loading" @click="payNow">
        {{ loading ? '加载中...' : paying ? '支付中...' : actionText }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { createStudyOrder, createWechatPayment, fetchMe, getStudyProduct, getWallet, isLoggedIn, payStudyOrderByBalance, syncWechatPayment } from '../../utils/api.js'

const product = ref(null)
const walletBalance = ref(0)
const isWechatMiniProgram = ref(false)
// #ifdef MP-WEIXIN
isWechatMiniProgram.value = true
// #endif
const selectedMethod = ref(isWechatMiniProgram.value ? 'wechat' : 'balance')
const loading = ref(true)
const paying = ref(false)
const remainSeconds = ref(30 * 60)
const idempotencyKey = ref('')
const installmentCount = ref(1)
let timer = null

const payAmount = computed(() => Number(product.value?.price || 0).toFixed(2))
const remainText = computed(() => {
  const minutes = String(Math.floor(remainSeconds.value / 60)).padStart(2, '0')
  const seconds = String(remainSeconds.value % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
})
const actionText = computed(() => {
  const method = paymentMethods.value.find(item => item.key === selectedMethod.value)
  return method?.disabled ? '暂未开通' : '立即支付'
})
const paymentNotice = computed(() => isWechatMiniProgram.value
  ? '微信支付由微信官方收银台完成，支付结果以服务端回调为准。'
  : 'H5 本地预览使用系统余额支付；微信支付请在微信小程序中测试。')

const paymentMethods = computed(() => [
  {
    key: 'wechat',
    name: '微信支付',
    icon: '微',
    badge: isWechatMiniProgram.value ? '官方支付' : '仅小程序',
    note: isWechatMiniProgram.value ? '使用微信官方收银台安全支付' : '请在微信小程序中使用',
    disabled: !isWechatMiniProgram.value,
  },
  {
    key: 'alipay',
    name: '支付宝支付',
    icon: '支',
    badge: '待接入',
    note: '暂未开放，当前请使用余额支付',
    disabled: true,
  },
  {
    key: 'balance',
    name: '余额支付',
    icon: '余',
    note: `可用余额：¥${Number(walletBalance.value || 0).toFixed(2)}`,
    disabled: false,
  },
  {
    key: 'apple',
    name: 'Apple Pay',
    icon: '',
    badge: '待接入',
    note: 'App 支付能力预留',
    disabled: true,
  },
  {
    key: 'mock',
    name: '模拟支付',
    icon: '测',
    badge: '已关闭',
    note: '当前不再使用模拟支付',
    disabled: true,
  },
])

const selectMethod = method => {
  if (method.disabled) {
    uni.showToast({ title: `${method.name}暂未开通`, icon: 'none' })
    return
  }
  selectedMethod.value = method.key
}

const createPaymentAttemptKey = productId => `study-${productId}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`

const requestWechatPayment = params => new Promise((resolve, reject) => {
  uni.requestPayment({
    timeStamp: params.timeStamp,
    nonceStr: params.nonceStr,
    package: params.package,
    signType: params.signType,
    paySign: params.paySign,
    success: resolve,
    fail: reject,
  })
})

const waitForPaidOrder = async orderNo => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const order = await syncWechatPayment(orderNo)
    if (order.payment_status === 'paid') return order
    if (order.payment_status === 'canceled' || order.status === 'canceled') {
      throw new Error('微信订单已关闭，请重新下单')
    }
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  return null
}

const payNow = async () => {
  if (paying.value || loading.value) return
  if (!isLoggedIn()) return uni.navigateTo({ url: '/pages/auth/login' })
  if (!product.value?.id) return uni.showToast({ title: '商品信息加载失败', icon: 'none' })
  if (remainSeconds.value <= 0) return uni.showToast({ title: '支付已超时，请重新进入收银台', icon: 'none' })
  if (selectedMethod.value === 'balance') {
    const wallet = await getWallet().catch(() => null)
    if (wallet) walletBalance.value = Number(wallet.balance || 0)
    if (Number(walletBalance.value || 0) < Number(payAmount.value || 0)) {
      return uni.showToast({ title: '余额不足，请先联系平台充值', icon: 'none' })
    }
  }
  paying.value = true
  try {
    if (!idempotencyKey.value) idempotencyKey.value = createPaymentAttemptKey(product.value.id)
    const order = await createStudyOrder({
      product_id: product.value.id,
      quantity: 1,
      installment_count: installmentCount.value,
      payment_method: selectedMethod.value,
      idempotency_key: idempotencyKey.value,
    })
    if (selectedMethod.value === 'wechat') {
      const params = await createWechatPayment(order.order_no)
      await requestWechatPayment(params)
      const confirmed = await waitForPaidOrder(order.order_no)
      if (!confirmed) {
        uni.showToast({ title: '支付结果确认中，请稍后查看订单', icon: 'none' })
        setTimeout(() => uni.redirectTo({ url: '/pages/study/center' }), 900)
        return
      }
    } else {
      await payStudyOrderByBalance(order)
    }
    fetchMe().catch(() => {})
    uni.showToast({ title: '支付成功' })
    setTimeout(() => uni.redirectTo({ url: '/pages/study/center' }), 650)
  } catch (error) {
    const message = String(error?.errMsg || error?.message || '')
    const canceled = /cancel/i.test(message)
    uni.showToast({ title: canceled ? '已取消支付，可稍后继续' : (error?.message || '支付失败'), icon: 'none' })
  } finally {
    paying.value = false
  }
}

onLoad(async query => {
  const productId = query.product_id || query.id
  installmentCount.value = Math.max(1, Number(query.installment || 1))
  if (!productId) {
    loading.value = false
    uni.showToast({ title: '缺少商品信息', icon: 'none' })
    return
  }
  try {
    const [detail, wallet] = await Promise.all([
      getStudyProduct(productId),
      isLoggedIn() ? getWallet().catch(() => null) : Promise.resolve(null),
    ])
    product.value = detail
    idempotencyKey.value = createPaymentAttemptKey(detail.id)
    walletBalance.value = Number(wallet?.balance || 0)
  } catch (error) {
    uni.showToast({ title: error.message || '收银台加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }

  timer = setInterval(() => {
    remainSeconds.value = Math.max(0, remainSeconds.value - 1)
    if (remainSeconds.value <= 0 && timer) {
      clearInterval(timer)
      timer = null
    }
  }, 1000)
})

onUnload(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.cashier-page{position:relative;min-height:100vh;padding:28rpx 28rpx 180rpx;background:linear-gradient(180deg,#fffaf1 0%,#f3f8f4 48%,#f7faf8 100%);color:#17332e;overflow:hidden}.glow{position:absolute;border-radius:999rpx;filter:blur(6rpx);opacity:.55;pointer-events:none}.glow-a{right:-90rpx;top:30rpx;width:260rpx;height:260rpx;background:radial-gradient(circle,#dbff79,rgba(219,255,121,0))}.glow-b{left:-80rpx;top:420rpx;width:230rpx;height:230rpx;background:radial-gradient(circle,#f7b077,rgba(247,176,119,0))}.top-card,.method-card,.notice-card{position:relative;z-index:1;border:1rpx solid rgba(222,231,226,.9);background:rgba(255,255,255,.86);box-shadow:0 18rpx 48rpx rgba(18,54,48,.08);backdrop-filter:blur(16px)}.top-card{padding:34rpx 30rpx 30rpx;border-radius:36rpx;text-align:center}.brand-pill{display:inline-flex;align-items:center;justify-content:center;padding:10rpx 18rpx;border-radius:999rpx;background:#fff2e8;color:#e97837;font-size:22rpx;font-weight:900}.pay-title{margin-top:26rpx;color:#143d37;font-size:30rpx;font-weight:900}.amount-line{margin-top:16rpx;color:#ef5539;font-size:62rpx;font-weight:900;letter-spacing:-1rpx}.amount-line text{margin-right:6rpx;font-size:34rpx}.countdown{margin-top:6rpx;color:#97a39f;font-size:23rpx}.order-info{margin-top:28rpx;padding:22rpx;border-radius:24rpx;background:#f6f8f7;text-align:left}.product-name{font-size:27rpx;font-weight:900;line-height:1.45}.product-desc{margin-top:8rpx;color:#7b8b87;font-size:21rpx;line-height:1.55}.method-card{margin-top:24rpx;border-radius:30rpx;overflow:hidden}.section-title{padding:28rpx 28rpx 18rpx;font-size:27rpx;font-weight:900}.method-row{display:flex;align-items:center;gap:20rpx;min-height:102rpx;padding:18rpx 28rpx;border-top:1rpx solid #edf2ef;transition:background .2s ease,opacity .2s ease}.method-row.active{background:#f7fbf8}.method-row.disabled{opacity:.48}.method-icon{flex:0 0 48rpx;width:48rpx;height:48rpx;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:22rpx;font-weight:900}.method-icon.wechat{background:#38c46b}.method-icon.alipay{background:#8f99a3}.method-icon.balance,.method-icon.mock{background:#e45f52}.method-icon.apple{background:#a7adb3}.method-main{flex:1;min-width:0}.method-name{display:flex;align-items:center;gap:10rpx;font-size:26rpx;font-weight:900;line-height:1.4}.method-badge{padding:4rpx 9rpx;border-radius:999rpx;background:#eef4f1;color:#7a8b87;font-size:18rpx;font-weight:700}.method-note{margin-top:6rpx;color:#91a09c;font-size:20rpx;line-height:1.45}.method-radio{flex:0 0 38rpx;width:38rpx;height:38rpx;border:3rpx solid #dce3df;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#fff}.method-row.active .method-radio{border-color:#f07a3f}.radio-dot{width:20rpx;height:20rpx;border-radius:50%;background:linear-gradient(135deg,#ff7a35,#ff9f68)}.notice-card{display:flex;gap:16rpx;margin-top:24rpx;padding:22rpx;border-radius:26rpx}.notice-dot{flex:0 0 18rpx;width:18rpx;height:18rpx;margin-top:8rpx;border-radius:50%;background:#14b19e;box-shadow:0 0 0 8rpx rgba(20,177,158,.12)}.notice-card b,.notice-card text{display:block}.notice-card b{font-size:23rpx}.notice-card text{margin-top:7rpx;color:#7d8d89;font-size:20rpx;line-height:1.65}.bottom-pay{position:fixed;left:0;right:0;bottom:0;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:22rpx;padding:20rpx 24rpx calc(20rpx + env(safe-area-inset-bottom));border-top:1rpx solid #e7ecea;background:rgba(255,255,255,.96);box-shadow:0 -14rpx 35rpx rgba(18,54,48,.08)}.bottom-amount{min-width:0}.bottom-amount>text{display:block;color:#7b8b87;font-size:20rpx}.bottom-amount>view{display:flex;align-items:baseline;margin-top:4rpx}.bottom-amount small{color:#ef7140;font-size:24rpx;font-weight:900}.bottom-amount b{color:#ef7140;font-size:42rpx;line-height:1}.bottom-pay button{flex:0 0 310rpx;height:86rpx;margin:0;border:0;border-radius:24rpx;background:linear-gradient(90deg,#ff6f31,#f79d6a);color:#fff;font-size:28rpx;font-weight:900;box-shadow:0 12rpx 26rpx rgba(255,113,49,.25)}.bottom-pay button:disabled{opacity:.58}
@media (max-width:360px){.bottom-pay button{flex-basis:250rpx}.amount-line{font-size:54rpx}.cashier-page{padding-left:22rpx;padding-right:22rpx}}
</style>
