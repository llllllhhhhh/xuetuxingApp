<template>
  <view class="page">
    <view class="content">
      <view v-if="loading" class="card empty-state">公告加载中…</view>

      <view v-else-if="detail" class="detail-card">
        <view class="detail-top">
          <view class="detail-tags">
            <text v-if="detail.pinned" class="tag tag-orange">置顶公告</text>
            <text class="tag">{{ detail.tag || '平台公告' }}</text>
          </view>
          <text class="detail-time">{{ formatTime(detail.published_at || detail.created_at) }}</text>
        </view>

        <view class="detail-title">{{ detail.title }}</view>
        <view class="detail-summary">{{ detail.summary }}</view>
        <view class="detail-divider"></view>
        <view class="detail-content">{{ detail.content }}</view>
      </view>

      <view v-else class="card empty-state">
        <view class="empty-title">该公告不存在或已下线</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getAnnouncementDetail, markAnnouncementRead } from '../../utils/api.js'

const loading = ref(true)
const detail = ref(null)

const formatTime = value => {
  if (!value) return '刚刚发布'
  return String(value).replace('T', ' ').slice(0, 16)
}

onLoad(async options => {
  const id = Number(options?.id || 0)
  if (!id) {
    loading.value = false
    return
  }
  try {
    detail.value = await getAnnouncementDetail(id)
    markAnnouncementRead(id)
  } catch {
    detail.value = null
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.detail-card{background:#fff;border-radius:32rpx;padding:34rpx 30rpx 40rpx;box-shadow:0 12rpx 32rpx rgba(18,51,45,.07)}
.detail-top,.detail-tags{display:flex;align-items:center}
.detail-top{justify-content:space-between;gap:20rpx}
.detail-tags{flex-wrap:wrap;gap:10rpx}
.detail-time{font-size:22rpx;color:#8a9793}
.detail-title{margin:22rpx 0 16rpx;font-size:40rpx;font-weight:900;color:#15312c;line-height:1.4}
.detail-summary{font-size:26rpx;color:#6b7f7a;line-height:1.8}
.detail-divider{height:1rpx;background:#e7ece9;margin:26rpx 0}
.detail-content{white-space:pre-wrap;font-size:28rpx;color:#223d38;line-height:1.95}
.empty-state{text-align:center;padding:60rpx 30rpx}
.empty-title{font-size:30rpx;font-weight:800}
</style>
