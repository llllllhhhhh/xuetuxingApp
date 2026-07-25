<template>
  <view class="page">
    <view class="content">
      <view class="notice-hero">
        <view class="notice-hero__badge">平台公告中心</view>
        <view class="notice-hero__title">最新动态、活动提醒、出行通知都在这里</view>
        <view class="notice-hero__sub">公告按发布时间实时同步，已读内容会自动消除铃铛角标。</view>
      </view>

      <view v-if="loading" class="card empty-state">公告加载中…</view>

      <view v-else-if="announcements.length" class="notice-list">
        <view
          v-for="item in announcements"
          :key="item.id"
          class="notice-card"
          :class="{ unread: !isRead(item.id), pinned: item.pinned }"
          @click="openDetail(item)"
        >
          <view class="notice-top">
            <view class="notice-tags">
              <text v-if="item.pinned" class="tag tag-orange">置顶</text>
              <text class="tag">{{ item.tag || '平台公告' }}</text>
            </view>
            <text v-if="!isRead(item.id)" class="notice-dot"></text>
          </view>
          <view class="notice-title">{{ item.title }}</view>
          <view class="notice-summary">{{ item.summary }}</view>
          <view class="notice-foot">
            <text>{{ formatTime(item.published_at || item.created_at) }}</text>
            <text>查看详情 ›</text>
          </view>
        </view>
      </view>

      <view v-else class="card empty-state">
        <view class="empty-title">当前还没有已发布公告</view>
        <view class="sub">管理端发布后，这里会自动展示最新内容。</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getAnnouncements, getAnnouncementReadIds, markAnnouncementRead } from '../../utils/api.js'

const loading = ref(true)
const announcements = ref([])
const readIds = ref([])

const loadData = async () => {
  loading.value = true
  readIds.value = getAnnouncementReadIds()
  announcements.value = await getAnnouncements()
  loading.value = false
}

const isRead = id => readIds.value.includes(Number(id))

const openDetail = item => {
  markAnnouncementRead(item.id)
  readIds.value = getAnnouncementReadIds()
  uni.navigateTo({ url: `/pages/notice/detail?id=${item.id}` })
}

const formatTime = value => {
  if (!value) return '刚刚发布'
  return String(value).replace('T', ' ').slice(0, 16)
}

onShow(loadData)
</script>

<style scoped>
.notice-hero{padding:34rpx 30rpx;border-radius:32rpx;background:linear-gradient(145deg,#173d37,#239483);color:#fff;margin-bottom:24rpx;box-shadow:0 16rpx 38rpx rgba(24,78,69,.18)}
.notice-hero__badge{display:inline-block;padding:8rpx 18rpx;border-radius:99rpx;background:rgba(255,255,255,.16);font-size:22rpx;margin-bottom:16rpx}
.notice-hero__title{font-size:36rpx;font-weight:900;line-height:1.4}
.notice-hero__sub{margin-top:14rpx;font-size:24rpx;color:rgba(255,255,255,.82);line-height:1.7}
.notice-list{display:flex;flex-direction:column;gap:18rpx}
.notice-card{background:#fff;border-radius:28rpx;padding:28rpx;box-shadow:0 10rpx 28rpx rgba(18,51,45,.06);border:2rpx solid transparent}
.notice-card.unread{border-color:#ffe2cb;box-shadow:0 14rpx 32rpx rgba(255,122,53,.08)}
.notice-card.pinned{background:linear-gradient(180deg,#fffaf5,#ffffff 42%)}
.notice-top,.notice-foot{display:flex;align-items:center;justify-content:space-between}
.notice-tags{display:flex;flex-wrap:wrap;gap:10rpx}
.notice-dot{width:16rpx;height:16rpx;border-radius:50%;background:#ff7a35;box-shadow:0 0 0 10rpx rgba(255,122,53,.12)}
.notice-title{margin:18rpx 0 14rpx;font-size:32rpx;font-weight:900;color:#17322d;line-height:1.45}
.notice-summary{font-size:25rpx;color:#6d807b;line-height:1.75}
.notice-foot{margin-top:22rpx;color:#8a9793;font-size:22rpx}
.empty-state{text-align:center;padding:60rpx 30rpx}
.empty-title{font-size:30rpx;font-weight:800;margin-bottom:10rpx}
</style>
