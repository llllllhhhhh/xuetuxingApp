<template>
  <view class="page preview-page">
    <view class="scheme-head">
      <view :class="['status-badge', statusClass]">{{ statusText }}</view>
      <view class="big">{{ titleText }}</view>
      <view class="sub light">{{ request?.request_no || '专属定制方案' }} · {{ request?.people_count || '人数待确认' }}</view>
      <view class="price">{{ priceText }} <text v-if="request?.status === 'approved'">/ 预估</text></view>
    </view>

    <view class="content">
      <view v-if="loading" class="card state-card">
        <view class="state-icon">行</view>
        <view class="card-title">正在读取方案</view>
        <view class="sub">请稍等，正在同步后台审核结果。</view>
      </view>

      <template v-else-if="request">
        <view class="card">
          <view class="card-title">你的需求</view>
          <view class="info-grid">
            <view><text>目的地</text><b>{{ request.destination || '-' }}</b></view>
            <view><text>出行时间</text><b>{{ request.travel_time || '-' }}</b></view>
            <view><text>天数</text><b>{{ request.days || '-' }}</b></view>
            <view><text>预算</text><b>{{ request.budget || '-' }}</b></view>
          </view>
          <view v-if="request.special_tags && request.special_tags.length" class="tag-row">
            <text v-for="tag in request.special_tags" :key="tag">{{ tag }}</text>
          </view>
          <view v-if="request.note" class="scheme-note">{{ request.note }}</view>
        </view>

        <view v-if="request.status === 'pending'" class="card state-card">
          <view class="state-icon pending">审</view>
          <view class="card-title">方案审核中</view>
          <view class="sub">管理后台会根据你的需求补充方案内容，通过后这里会自动展示完整方案。</view>
        </view>

        <view v-else-if="request.status === 'rejected'" class="card state-card">
          <view class="state-icon rejected">驳</view>
          <view class="card-title">需求暂未通过</view>
          <view class="scheme-note">{{ request.reject_reason || '当前需求暂时无法匹配合适方案，请调整后重新提交。' }}</view>
          <view class="btn btn-primary inline-btn" @click="goManual">重新提交需求</view>
        </view>

        <template v-else>
          <view class="card">
            <view class="card-title">设计师的方案说明</view>
            <view class="scheme-note">{{ request.plan_summary }}</view>
          </view>

          <view class="section-title">完整行程</view>
          <view class="timeline">
            <view class="timeline-item" v-for="(item, index) in itinerary" :key="`${index}-${item}`">
              <b>Day {{ index + 1 }}</b>
              <view>{{ item }}</view>
            </view>
          </view>

          <view class="card">
            <view class="title-row">
              <view>
                <view class="card-title">方案包含</view>
                <view class="sub">以后台审核通过内容为准</view>
              </view>
              <view class="big orange">{{ request.plan_price || '待报价' }}</view>
            </view>
            <view class="include-list">
              <view v-for="item in includes" :key="item">✓ {{ item }}</view>
            </view>
          </view>

          <view v-if="request.plan_tips" class="notice">{{ request.plan_tips }}</view>
        </template>
      </template>

      <view v-else class="card state-card">
        <view class="state-icon rejected">!</view>
        <view class="card-title">暂无方案</view>
        <view class="sub">还没有提交过人工深度定制需求。</view>
        <view class="btn btn-primary inline-btn" @click="goManual">去提交需求</view>
      </view>
    </view>

    <view class="fixed-action">
      <view class="btn-row">
        <view class="btn btn-ghost" @click="goManual">修改需求</view>
        <view class="btn btn-primary" :class="{ disabled: request?.status !== 'approved' }" @click="confirmPlan">确认方案</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { getCustomTravelRequest, getMyCustomTravelRequests, isLoggedIn } from '../../utils/api.js'

const loading = ref(true)
const request = ref(null)
const statusTextMap = {
  pending: '待后台审核',
  approved: '方案已生成',
  rejected: '已驳回',
}

const statusText = computed(() => statusTextMap[request.value?.status] || '人工定制')
const statusClass = computed(() => request.value?.status || 'pending')
const titleText = computed(() => {
  if (request.value?.status === 'approved') return request.value?.plan_title || '专属定制方案'
  if (request.value?.destination) return `${request.value.destination} 定制需求`
  return '人工深度定制'
})
const priceText = computed(() => {
  if (request.value?.status === 'approved') return request.value?.plan_price || '待报价'
  return request.value?.budget || '等待方案'
})
const itinerary = computed(() => request.value?.plan_itinerary?.length
  ? request.value.plan_itinerary
  : ['后台审核通过后展示每日行程安排'])
const includes = computed(() => request.value?.plan_includes?.length
  ? request.value.plan_includes
  : ['交通 / 住宿 / 门票 / 领队等，以方案为准'])

const toast = title => uni.showToast({ title, icon: 'none' })
const goManual = () => uni.redirectTo({ url: '/pages/custom/manual' })
const confirmPlan = () => {
  if (request.value?.status !== 'approved') return toast('方案审核通过后才能确认')
  toast('方案已确认，后续可接入订单支付')
}

const load = async id => {
  if (!isLoggedIn()) {
    uni.redirectTo({ url: '/pages/auth/login' })
    return
  }
  loading.value = true
  try {
    request.value = id
      ? await getCustomTravelRequest(id)
      : (await getMyCustomTravelRequests())[0] || null
  } catch (error) {
    toast(error.message || '方案读取失败')
  } finally {
    loading.value = false
  }
}

onLoad(query => load(query?.id))
</script>

<style scoped>
.preview-page {
  padding-bottom: 150rpx;
}

.scheme-head {
  background: linear-gradient(135deg, #153c37, #2d7068);
  padding: 48rpx 32rpx;
  color: #fff;
}

.light {
  color: #bdd1cd;
  margin-top: 12rpx;
}

.price {
  font-size: 48rpx;
  color: #ffb26f;
  font-weight: 900;
  margin-top: 30rpx;
}

.price text {
  font-size: 24rpx;
  color: #fff;
}

.status-badge {
  display: inline-flex;
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  font-weight: 900;
  color: #173f38;
  background: #fff4eb;
  margin-bottom: 22rpx;
}

.status-badge.approved {
  background: #dff5ef;
}

.status-badge.rejected {
  background: #ffe8df;
  color: #b3471f;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.info-grid view {
  padding: 20rpx;
  border-radius: 22rpx;
  background: #f4f7f5;
}

.info-grid text,
.info-grid b {
  display: block;
}

.info-grid text {
  color: #788581;
  font-size: 24rpx;
  margin-bottom: 8rpx;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 20rpx;
}

.tag-row text {
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: #e7f6f2;
  color: #0f766b;
  font-size: 24rpx;
  font-weight: 800;
}

.scheme-note {
  line-height: 1.8;
  color: #40524e;
  margin-top: 18rpx;
}

.state-card {
  text-align: center;
}

.state-icon {
  width: 86rpx;
  height: 86rpx;
  border-radius: 28rpx;
  margin: 0 auto 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #173f38;
  background: #e7f6f2;
  font-weight: 900;
}

.state-icon.pending {
  background: #fff4e8;
  color: #d86b32;
}

.state-icon.rejected {
  background: #ffe8df;
  color: #b3471f;
}

.inline-btn {
  width: 260rpx;
  margin: 26rpx auto 0;
}

.include-list {
  margin-top: 22rpx;
}

.include-list view {
  padding: 14rpx 0;
  border-top: 1rpx solid #edf2ef;
  color: #40524e;
}

.btn.disabled {
  opacity: .55;
}
</style>
