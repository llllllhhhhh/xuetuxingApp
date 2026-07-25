<template>
  <view class="page">
    <view class="profile safe-top">
      <view class="top-actions mine-actions">
        <view class="icon-btn" @click="goLogin">⚙</view>
      </view>

      <view class="user" :class="{ tappable: !user }" @click="openProfile">
        <view class="user-avatar">{{ avatarText }}</view>
        <view class="user-info">
          <view class="user-name">
            {{ user?.nickname || '请先登录' }}
            <text>{{ currentIdentity }}</text>
          </view>
          <view class="sub">
            {{ user ? `${user.user_no || ''} · ${user.phone || ''}` : '登录后同步积分、公告与客服记录' }}
          </view>
        </view>
      </view>

      <view class="asset">
        <view><b>{{ user?.points || 0 }}</b><text>可用积分</text></view>
        <view><b>¥{{ money(user?.balance) }}</b><text>账户余额</text></view>
        <view><b>{{ currentIdentity }}</b><text>当前身份</text></view>
      </view>
    </view>

    <view class="content">
      <DecorationBlocks v-if="remoteBlocks.length" :blocks="remoteBlocks" />

      <view class="benefit" @click="guard('/pages/mine/travel')">
        <view>
          <view class="tag tag-orange">上岸权益</view>
          <view class="benefit-title">认真备考，世界等你出发</view>
          <view class="sub">完成目标可解锁全包定制旅行</view>
        </view>
        <text>›</text>
      </view>

      <view class="menu card">
        <view v-for="m in menus" :key="m.name" class="menu-item" @click="entry(m)">
          <view class="menu-icon">{{ m.icon }}</view>
          <text>{{ m.name }}</text>
          <text class="arrow">›</text>
        </view>
      </view>

      <view class="notice">客服服务时间 09:00-21:00 · 聊天历史和图片消息会自动同步</view>
    </view>

    <BottomNav active="我的" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import BottomNav from '../../components/BottomNav.vue'
import DecorationBlocks from '../../components/DecorationBlocks.vue'
import { clearUserSession, fetchMe, getCurrentUser, getDecorationPage, isLoggedIn } from '../../utils/api.js'

const menus = [
  { name: '学习服务商城', icon: '📚', url: '/pages/study/index', public: true },
  { name: '我的学习中心', icon: '🎓', url: '/pages/study/center' },
  { name: '我的积分', icon: '📄', url: '/pages/mine/points' },
  { name: '录取通知书认证', icon: '🏅', url: '/pages/mine/graduation' },
  { name: '我的旅行', icon: '🧳', url: '/pages/mine/travel' },
  { name: '上岸权益', icon: '🏆', url: '/pages/mine/travel' },
  { name: '我的订单', icon: '▦', url: '/pages/mine/travel' },
  { name: '收藏路线', icon: '♥', url: '/pages/mine/travel' },
  { name: '入驻学校', icon: '校', url: '/pages/schools/index', public: true },
  { name: '文章中心', icon: '文', url: '/pages/article/index', public: true },
  { name: '学习记录', icon: '✓' },
]

const user = ref(isLoggedIn() ? getCurrentUser() : null)
const remoteBlocks = ref([])

const avatarText = computed(() => String(user.value?.nickname || '徒').slice(0, 1))
const currentIdentity = computed(() => {
  if (!user.value) return '游客'
  return user.value.exam_status || '学员'
})
const money = value => Number(value || 0).toFixed(2)

const goLogin = () => uni.navigateTo({ url: '/pages/auth/login' })
const openProfile = () => {
  if (!user.value) {
    goLogin()
    return
  }
  uni.navigateTo({ url: '/pages/mine/profile' })
}
const guard = url => (isLoggedIn() ? uni.navigateTo({ url }) : goLogin())
const entry = m => {
  if (m.url) {
    if (m.public) uni.navigateTo({ url: m.url })
    else guard(m.url)
    return
  }
  uni.showToast({ title: '学习记录功能演示', icon: 'none' })
}

onShow(async () => {
  if (!isLoggedIn()) {
    user.value = null
  } else {
    user.value = getCurrentUser()
  }

  getDecorationPage('mine')
    .then(page => { remoteBlocks.value = page?.blocks || [] })
    .catch(() => {})

  if (isLoggedIn()) {
    try {
      user.value = await fetchMe()
    } catch {
      clearUserSession()
      user.value = null
      uni.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
    }
  }
})
</script>

<style scoped>
.profile{background:linear-gradient(160deg,#fff8ef,#eaf7f3);padding:30rpx}
.mine-actions{justify-content:flex-end}
.user{display:flex;align-items:center;margin:25rpx 0 38rpx;border-radius:30rpx;transition:.18s}
.user.tappable{cursor:pointer}
.user.tappable:active{transform:scale(.985);background:rgba(255,255,255,.42)}
.user-avatar{width:110rpx;height:110rpx;border-radius:40rpx;background:linear-gradient(135deg,#ff7a35,#ffc08c);color:#fff;font-size:48rpx;display:flex;align-items:center;justify-content:center;margin-right:20rpx;flex:0 0 110rpx}
.user-info{flex:1;min-width:0}
.user-name{font-size:36rpx;font-weight:900;display:flex;align-items:center;gap:12rpx;flex-wrap:wrap}
.user-name text{font-size:20rpx;color:#12a594;background:#dff6f1;padding:6rpx 12rpx;border-radius:99rpx}
.asset{display:flex;background:#fff;border-radius:25rpx;padding:25rpx}
.asset view{flex:1;text-align:center;border-right:1rpx solid #e7ebe7}
.asset view:last-child{border:0}
.asset b,.asset text{display:block}
.asset b{font-size:30rpx}
.asset text{font-size:21rpx;color:#778684}
.benefit{background:#163f39;color:#fff;padding:30rpx;border-radius:28rpx;display:flex;align-items:center;justify-content:space-between}
.benefit-title{font-size:30rpx;font-weight:800;margin:8rpx 0}
.benefit>text{font-size:50rpx}
.menu-item{display:flex;align-items:center;padding:24rpx 0;border-bottom:1rpx solid #e7ebe7}
.menu-icon{width:65rpx;font-size:35rpx}
.menu-item>text:nth-child(2){flex:1}
.arrow{color:#a5afad;font-size:40rpx}
</style>
