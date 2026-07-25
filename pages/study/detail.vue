<template>
  <view v-if="item" class="page detail-page">
    <view class="visual">
      <image class="hero-img" :src="item.cover||fallback" mode="aspectFill" />
      <view class="visual-shade"></view>
      <view class="visual-label">{{ typeName(item.product_type) }}</view>
    </view>

    <view class="main">
      <view class="summary-card">
        <view class="summary-top">
          <text class="cycle-badge">{{ cycleName(item.billing_cycle) }}</text>
          <text class="sales">{{ item.sales }} 人已加入</text>
        </view>
        <view class="title">{{ item.name }}</view>
        <view class="subtitle">{{ item.subtitle }}</view>
        <view class="price-line">
          <view><text class="yen">¥</text><b>{{ item.price }}</b><text class="cycle-small">{{ cycleShort(item.billing_cycle) }}</text></view>
          <del v-if="Number(item.original_price)">原价 ¥{{ item.original_price }}</del>
        </view>
      </view>

      <view class="section-card">
        <view class="section-heading"><view class="heading-icon orange">礼</view><view><b>你将获得</b><text>购买后立即解锁以下权益</text></view></view>
        <view class="benefit-grid">
          <view v-for="(benefit,index) in item.benefits" :key="benefit" class="benefit-item">
            <text>{{ String(index + 1).padStart(2,'0') }}</text><b>{{ benefit }}</b>
          </view>
        </view>
      </view>

      <view class="section-card">
        <view class="section-heading"><view class="heading-icon green">介</view><view><b>服务介绍</b><text>适合人群与服务方式</text></view></view>
        <view class="description">{{ item.description || '暂无详细介绍' }}</view>
      </view>

      <view class="section-card">
        <view class="section-heading"><view class="heading-icon blue">学</view><view><b>课程与资料</b><text>带“试看”的内容可免费体验</text></view></view>
        <view class="content-list">
          <view v-for="(content,index) in item.contents" :key="content.id" class="content-row">
            <view class="content-order">{{ index + 1 }}</view>
            <view class="content-info"><b>{{ content.title }}</b><text>{{ content.summary }}</text></view>
            <view :class="['content-state',content.locked?'locked':'preview']">{{ content.locked ? '待解锁' : `${content.duration_minutes}分钟` }}</view>
          </view>
        </view>
      </view>

      <view v-if="item.installment_enabled" class="installment-card">
        <view><b>分期购买</b><text>降低一次性付款压力</text></view>
        <picker :range="installments" @change="installment=installments[$event.detail.value]">
          <view class="installment-picker">{{ installment }} 期 <text>每期 ¥{{ perInstallment }}</text>⌄</view>
        </picker>
      </view>

      <view class="purchase-note">支付成功后，课程、资料或社群权益将自动发放到“我的学习中心”。</view>
      <view v-if="isLoggedIn()" class="wallet-note">当前余额：¥{{ walletBalance }}</view>
    </view>

    <view class="bottom-bar">
      <view class="pay-amount"><text>{{ installment > 1 ? `第1期 / 共${installment}期` : '本次应付' }}</text><view><small>¥</small><b>{{ perInstallment }}</b></view></view>
      <button :disabled="paying" @click="buy">{{ paying ? '正在进入' : '去收银台' }}</button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getStudyProduct, getWallet, isLoggedIn } from '../../utils/api.js'

const item = ref(null)
const paying = ref(false)
const installment = ref(1)
const walletBalance = ref('0.00')
const fallback = 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1000'
const installments = computed(() => {
  const max = item.value?.installment_count || 1
  return [1, 3, 6, 12, 24].filter(value => value <= max)
})
const perInstallment = computed(() => item.value ? (Number(item.value.price) / installment.value).toFixed(2) : '0.00')
const typeName = value => ({ community: '督学社群', package: '长期备考套餐', material: '付费资料包' }[value] || '学习服务')
const cycleName = value => ({ month: '月度会员', year: '年度会员', once: '一次性购买' }[value] || '')
const cycleShort = value => ({ month: '/月', year: '/年', once: '起' }[value] || '')

const buy = async () => {
  if (!isLoggedIn()) return uni.navigateTo({ url: '/pages/auth/login' })
  if (!item.value?.id) return
  paying.value = true
  setTimeout(() => {
    paying.value = false
    uni.navigateTo({ url: `/pages/payment/cashier?product_id=${item.value.id}&installment=${installment.value}` })
  }, 120)
}

onLoad(async query => {
  try {
    item.value = await getStudyProduct(query.id)
    if (isLoggedIn()) {
      const wallet = await getWallet().catch(() => null)
      walletBalance.value = Number(wallet?.balance || 0).toFixed(2)
    }
  } catch (error) {
    uni.showToast({ title: error.message || '商品不存在', icon: 'none' })
  }
})
</script>

<style scoped>
.detail-page{min-height:100vh;padding-bottom:170rpx;background:#f3f6f4;color:#17332e}.visual{height:385rpx;position:relative;overflow:hidden}.hero-img{width:100%;height:100%}.visual-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(13,42,37,.05),rgba(13,42,37,.58))}.visual-label{position:absolute;left:28rpx;bottom:45rpx;padding:8rpx 16rpx;border:1rpx solid rgba(255,255,255,.45);border-radius:99rpx;background:rgba(255,255,255,.16);color:#fff;font-size:21rpx;backdrop-filter:blur(8px)}.main{margin-top:-28rpx;padding:0 24rpx 45rpx;position:relative;z-index:2}.summary-card,.section-card,.installment-card{border:1rpx solid #e5ebe8;border-radius:27rpx;background:#fff;box-shadow:0 12rpx 34rpx rgba(18,54,48,.055)}.summary-card{padding:28rpx 28rpx 27rpx}.summary-top{display:flex;align-items:center;justify-content:space-between}.cycle-badge{padding:7rpx 13rpx;border-radius:99rpx;background:#e4f6f1;color:#087d6e;font-size:20rpx;font-weight:700}.sales{color:#899793;font-size:20rpx}.title{margin:19rpx 0 9rpx;font-size:40rpx;font-weight:900;line-height:1.35}.subtitle{color:#70817d;font-size:24rpx;line-height:1.65}.price-line{display:flex;align-items:flex-end;justify-content:space-between;margin-top:25rpx;padding-top:20rpx;border-top:1rpx solid #edf1ef}.price-line>view{display:flex;align-items:baseline}.price-line .yen{color:#f17535;font-size:25rpx;font-weight:900}.price-line b{color:#f17535;font-size:45rpx;line-height:1}.cycle-small{margin-left:6rpx;color:#61736f;font-size:20rpx}.price-line del{color:#9ba7a4;font-size:19rpx}.section-card{margin-top:22rpx;padding:28rpx}.section-heading{display:flex;align-items:center;gap:15rpx;margin-bottom:23rpx}.heading-icon{width:52rpx;height:52rpx;border-radius:16rpx;display:flex;align-items:center;justify-content:center;font-size:22rpx;font-weight:900}.heading-icon.orange{background:#fff0e5;color:#e57031}.heading-icon.green{background:#e5f6f1;color:#087f70}.heading-icon.blue{background:#eaf0fb;color:#4d71ad}.section-heading b,.section-heading text{display:block}.section-heading b{font-size:29rpx}.section-heading text{margin-top:4rpx;color:#8b9895;font-size:19rpx}.benefit-grid{display:grid;grid-template-columns:1fr 1fr;gap:12rpx}.benefit-item{min-height:92rpx;padding:17rpx;border-radius:16rpx;background:#f5f8f7;display:flex;align-items:flex-start;gap:11rpx}.benefit-item text{color:#12a594;font-size:18rpx;font-weight:900}.benefit-item b{font-size:22rpx;line-height:1.5}.description{color:#5f716d;font-size:23rpx;line-height:1.9;white-space:pre-wrap}.content-list{margin:0 -5rpx}.content-row{display:flex;align-items:center;gap:15rpx;min-width:0;padding:20rpx 5rpx;border-bottom:1rpx solid #edf1ef}.content-row:last-child{border-bottom:0}.content-order{flex:0 0 46rpx;height:46rpx;border-radius:14rpx;background:#f0f5f3;color:#5e7771;display:flex;align-items:center;justify-content:center;font-size:20rpx;font-weight:800}.content-info{flex:1;min-width:0}.content-info b,.content-info text{display:block}.content-info b{font-size:23rpx;line-height:1.4}.content-info text{margin-top:5rpx;color:#889692;font-size:19rpx;line-height:1.4}.content-state{flex:0 0 auto;padding:7rpx 11rpx;border-radius:99rpx;font-size:18rpx}.content-state.locked{background:#f0f2f1;color:#87938f}.content-state.preview{background:#e3f6f0;color:#087e70}.installment-card{display:flex;align-items:center;justify-content:space-between;gap:20rpx;margin-top:22rpx;padding:24rpx 26rpx}.installment-card b,.installment-card>view>text{display:block}.installment-card b{font-size:26rpx}.installment-card>view>text{margin-top:5rpx;color:#899793;font-size:19rpx}.installment-picker{padding:14rpx 17rpx;border-radius:15rpx;background:#fff4e8;color:#9b5c18;font-size:22rpx}.installment-picker text{margin:0 8rpx}.purchase-note{padding:25rpx 15rpx 0;color:#879590;font-size:20rpx;line-height:1.7;text-align:center}.wallet-note{margin:14rpx auto 0;padding:12rpx 18rpx;width:max-content;max-width:100%;border-radius:999rpx;background:#e7f6f1;color:#087d6e;font-size:21rpx;font-weight:800}.bottom-bar{position:fixed;left:0;right:0;bottom:0;z-index:20;display:flex;align-items:center;justify-content:space-between;gap:20rpx;padding:17rpx 25rpx calc(17rpx + env(safe-area-inset-bottom));border-top:1rpx solid #e7ecea;background:rgba(255,255,255,.97);box-shadow:0 -10rpx 30rpx rgba(14,44,39,.08)}.pay-amount{min-width:0}.pay-amount>text{display:block;color:#7c8d89;font-size:18rpx}.pay-amount>view{display:flex;align-items:baseline;margin-top:3rpx}.pay-amount small{color:#f17434;font-size:23rpx;font-weight:800}.pay-amount b{color:#f17434;font-size:38rpx}.bottom-bar button{flex:0 0 280rpx;height:82rpx;margin:0;border:0;border-radius:22rpx;background:linear-gradient(135deg,#ff7a35,#ff985b);color:#fff;font-size:26rpx;font-weight:800;box-shadow:0 9rpx 20rpx rgba(255,122,53,.22)}.bottom-bar button:disabled{opacity:.55}
@media (max-width:360px){.benefit-grid{grid-template-columns:1fr}.bottom-bar button{flex-basis:235rpx}.title{font-size:36rpx}.section-card{padding:24rpx}}
</style>
