<template>
  <view class="safe-top">
    <view class="topbar">
      <view class="brand">
        <view class="brand-mark">行</view>
        学徒行
      </view>
      <view class="top-actions">
        <view class="icon-btn notice-btn" @click="openAnnouncements">
          <text>🔔</text>
          <view v-if="unreadCount > 0" class="notice-badge">{{ unreadText }}</view>
        </view>
        <view class="icon-btn" @click="openSupport">🎧</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { getAnnouncementUnreadCount, isLoggedIn } from '../utils/api.js'

const unreadCount = ref(0)
let timer = null

const unreadText = computed(() => (unreadCount.value > 9 ? '9+' : String(unreadCount.value)))

const loadUnreadCount = async () => {
  unreadCount.value = await getAnnouncementUnreadCount()
}

const openAnnouncements = async () => {
  await loadUnreadCount()
  uni.navigateTo({ url: '/pages/notice/index' })
}

const openSupport = () => {
  if (!isLoggedIn()) {
    uni.navigateTo({ url: '/pages/auth/login' })
    return
  }
  uni.navigateTo({ url: '/pages/support/chat' })
}

onMounted(() => {
  loadUnreadCount()
  timer = setInterval(loadUnreadCount, 10000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.notice-btn{position:relative}
.notice-badge{position:absolute;right:-6rpx;top:-4rpx;min-width:28rpx;height:28rpx;padding:0 8rpx;border-radius:99rpx;background:linear-gradient(135deg,#ff6e4c,#ff9a57);color:#fff;font-size:18rpx;font-weight:800;line-height:28rpx;text-align:center;box-shadow:0 6rpx 14rpx rgba(255,122,53,.28)}
</style>
