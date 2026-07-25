<template>
  <view class="page">
    <view class="content">
      <view class="points-board">
        <view><text>可用积分</text><b>{{ data.points }}</b></view>
        <view><text>成功邀请</text><b>{{ data.granted_count }}</b></view>
        <view><text>待审核好友</text><b class="orange">{{ pendingCount }}</b></view>
      </view>
      <view class="tabs">
        <view class="tab on">积分获取记录</view>
        <view class="tab" @click="goInvite">继续邀请</view>
      </view>
      <view class="card">
        <view v-if="!data.records.length" class="empty">暂无积分记录</view>
        <view class="list-item" v-for="item in data.records" :key="item.phone">
          <view class="avatar">{{ (item.nickname || '友')[0] }}</view>
          <view class="list-main">
            <view class="list-title">邀请 {{ item.nickname }} 注册</view>
            <view class="sub">{{ formatTime(item.created_at) }} · {{ statusText(item) }}</view>
          </view>
          <view :class="item.score_granted ? 'money' : 'pending'">{{ item.score_granted ? `+${item.score}` : '--' }}</view>
        </view>
      </view>
      <view class="section-title">全部邀请好友台账</view>
      <view class="card ledger">
        <view class="table-row table-head"><text>好友</text><text>注册时间</text><text>状态</text></view>
        <view class="table-row" v-for="item in data.records" :key="`row-${item.phone}`">
          <text>{{ maskPhone(item.phone) }}</text>
          <text>{{ formatTime(item.created_at).slice(5) }}</text>
          <text :class="item.score_granted ? 'green' : 'orange'">{{ item.score_granted ? `有效 +${item.score}` : '待审核' }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, reactive } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getInviteDashboard, isLoggedIn } from '../../utils/api.js'

const data = reactive({ points: 0, granted_count: 0, records: [] })
const pendingCount = computed(() => data.records.filter(item => !item.score_granted && item.status === 'pending').length)
const formatTime = value => value ? String(value).replace('T', ' ').slice(0, 16) : ''
const maskPhone = phone => String(phone || '').replace(/^(\d{3})\d+(\d{4})$/, '$1****$2')
const statusText = item => item.score_granted ? '积分已到账' : item.status === 'rejected' ? '未通过审核' : '等待审核'
const goInvite = () => uni.navigateTo({ url: '/pages/points/activity' })

onShow(async () => {
  if (!isLoggedIn()) return uni.redirectTo({ url: '/pages/auth/login' })
  try {
    Object.assign(data, await getInviteDashboard())
  } catch (error) {
    uni.showToast({ title: error.message || '积分记录加载失败', icon: 'none' })
  }
})
</script>

<style scoped>
.points-board{display:flex;background:linear-gradient(135deg,#153e38,#0e8f81);color:#fff;padding:35rpx 20rpx;border-radius:30rpx;margin-bottom:24rpx}.points-board view{flex:1;text-align:center}.points-board text,.points-board b{display:block}.points-board text{font-size:21rpx;opacity:.75}.points-board b{font-size:46rpx;margin-top:10rpx}.empty{text-align:center;color:#87938f;padding:50rpx 0}.pending{color:#a58b68}.ledger{overflow:hidden}.table-row{grid-template-columns:1.15fr 1fr .9fr}
</style>
