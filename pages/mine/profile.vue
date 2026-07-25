<template>
  <view class="profile-page">
    <view class="hero">
      <view class="avatar">{{ avatarText }}</view>
      <view class="info">
        <view class="name">{{ user?.nickname || '学徒行用户' }}</view>
        <view class="meta">{{ user?.user_no || '未生成编号' }}</view>
      </view>
      <view class="status">{{ identity }}</view>
    </view>

    <view class="card">
      <view class="row">
        <text>手机号</text>
        <b>{{ user?.phone || '-' }}</b>
      </view>
      <view class="row">
        <text>账号状态</text>
        <b>{{ user ? '已登录' : '未登录' }}</b>
      </view>
      <view class="row">
        <text>当前身份</text>
        <b>{{ identity }}</b>
      </view>
      <view class="row">
        <text>可用积分</text>
        <b>{{ user?.points || 0 }}</b>
      </view>
      <view class="row">
        <text>注册时间</text>
        <b>{{ formatTime(user?.created_at) }}</b>
      </view>
    </view>

    <view class="card actions">
      <view class="action" @click="go('/pages/mine/points')">
        <view><b>我的积分</b><text>查看积分获取与消耗记录</text></view>
        <text class="arrow">›</text>
      </view>
      <view class="action" @click="go('/pages/mine/graduation')">
        <view><b>录取通知书认证</b><text>上传认证材料，解锁上岸权益</text></view>
        <text class="arrow">›</text>
      </view>
      <view class="action" @click="go('/pages/support/chat')">
        <view><b>联系客服</b><text>咨询积分、订单和旅行权益</text></view>
        <text class="arrow">›</text>
      </view>
    </view>

    <view class="logout-card">
      <view class="logout-btn" @click="logout">退出登录</view>
      <view class="logout-tip">退出后不会删除账号数据，再次登录可继续同步权益。</view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { clearUserSession, fetchMe, getCurrentUser, isLoggedIn } from '../../utils/api.js'

const user = ref(getCurrentUser())
const avatarText = computed(() => String(user.value?.nickname || '徒').slice(0, 1))
const identity = computed(() => user.value?.exam_status || '学员')

const formatTime = value => {
  if (!value) return '-'
  return String(value).replace('T', ' ').slice(0, 16)
}

const go = url => uni.navigateTo({ url })

const logout = () => {
  uni.showModal({
    title: '确认退出登录？',
    content: '退出后将清除本机登录状态，但不会影响账号数据。',
    confirmText: '退出',
    confirmColor: '#d85d5d',
    success: result => {
      if (!result.confirm) return
      clearUserSession()
      uni.showToast({ title: '已退出登录', icon: 'success' })
      setTimeout(() => uni.reLaunch({ url: '/pages/mine/index' }), 450)
    },
  })
}

onShow(async () => {
  if (!isLoggedIn()) {
    uni.redirectTo({ url: '/pages/auth/login' })
    return
  }
  user.value = getCurrentUser()
  try {
    user.value = await fetchMe()
  } catch {}
})
</script>

<style scoped>
.profile-page{min-height:100vh;padding:28rpx;background:linear-gradient(180deg,#fff8ef,#f2f8f5 46%,#f7faf8);color:#14332e}
.hero{display:flex;align-items:center;gap:20rpx;padding:34rpx 28rpx;border-radius:34rpx;background:linear-gradient(135deg,#173f39,#1f665b);color:#fff;box-shadow:0 20rpx 48rpx rgba(17,61,55,.14)}
.avatar{width:112rpx;height:112rpx;flex:0 0 112rpx;border-radius:38rpx;background:linear-gradient(135deg,#ff7a35,#ffc08c);display:flex;align-items:center;justify-content:center;font-size:48rpx;font-weight:900}
.info{flex:1;min-width:0}.name{font-size:36rpx;font-weight:900}.meta{margin-top:8rpx;color:rgba(255,255,255,.68);font-size:22rpx;word-break:break-all}
.status{flex:0 0 auto;padding:8rpx 16rpx;border-radius:999rpx;background:#dff6f1;color:#0a8f7f;font-size:22rpx;font-weight:900}
.card{margin-top:24rpx;padding:8rpx 26rpx;border-radius:30rpx;background:#fff;box-shadow:0 14rpx 38rpx rgba(17,54,48,.06)}
.row{display:flex;align-items:center;justify-content:space-between;gap:20rpx;min-height:82rpx;border-bottom:1rpx solid #edf1ef}
.row:last-child{border-bottom:0}.row text{color:#7f8f8a;font-size:24rpx}.row b{max-width:420rpx;text-align:right;font-size:25rpx;word-break:break-all}
.actions{padding:0 26rpx}.action{display:flex;align-items:center;justify-content:space-between;gap:20rpx;padding:25rpx 0;border-bottom:1rpx solid #edf1ef}
.action:last-child{border-bottom:0}.action b,.action text{display:block}.action b{font-size:27rpx}.action view text{margin-top:7rpx;color:#879591;font-size:21rpx}.arrow{color:#a6b1ae;font-size:44rpx}
.logout-card{margin-top:26rpx;padding:24rpx 0 40rpx;text-align:center}.logout-btn{height:88rpx;display:flex;align-items:center;justify-content:center;border-radius:24rpx;background:#fff1ef;color:#d85d5d;font-size:28rpx;font-weight:900;border:1rpx solid #ffd7d0}
.logout-tip{margin-top:16rpx;color:#99a5a1;font-size:21rpx;line-height:1.6}
</style>
