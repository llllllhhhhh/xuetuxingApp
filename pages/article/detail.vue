<template>
  <view class="page article-detail-page">
    <view class="content">
      <view v-if="loading" class="card empty">正在加载文章...</view>
      <view v-else-if="article" class="article-detail card">
        <view class="article-meta">
          <text class="tag tag-orange">{{ article.category || '文章' }}</text>
          <text v-if="article.pinned" class="tag">置顶</text>
        </view>
        <view class="article-title">{{ article.title }}</view>
        <view class="article-summary">{{ article.summary }}</view>
        <image v-if="article.cover" class="article-cover" :src="article.cover" mode="aspectFill" />
        <view class="article-time">发布于 {{ formatTime(article.published_at || article.updated_at) }}</view>
        <view class="article-content">
          <text v-for="(paragraph, index) in paragraphs" :key="index">{{ paragraph }}</text>
        </view>
      </view>
      <view v-else class="card empty">
        <b>文章不存在或暂未发布</b>
        <text>请返回文章中心查看其它内容。</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getArticleDetail } from '../../utils/api.js'

const article = ref(null)
const loading = ref(false)

const paragraphs = computed(() => String(article.value?.content || '').split(/\n+/).filter(Boolean))
const formatTime = value => (value ? String(value).replace('T', ' ').slice(0, 16) : '刚刚更新')

onLoad(async options => {
  const key = options?.slug || options?.id
  if (!key) return
  loading.value = true
  try {
    article.value = await getArticleDetail(key)
    uni.setNavigationBarTitle({ title: article.value?.title || '文章详情' })
  } catch {
    article.value = null
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.article-detail-page{background:linear-gradient(180deg,#fff8ef,#f4f8f5)}
.article-detail{padding:34rpx 30rpx;border-radius:30rpx}
.article-meta{display:flex;gap:10rpx;flex-wrap:wrap;margin-bottom:18rpx}
.article-title{font-size:42rpx;font-weight:900;color:#17322d;line-height:1.35}
.article-summary{margin-top:16rpx;color:#6d807b;font-size:25rpx;line-height:1.75}
.article-cover{width:100%;height:300rpx;border-radius:24rpx;margin-top:24rpx}
.article-time{margin:24rpx 0;color:#9aa5a2;font-size:22rpx}
.article-content{padding-top:10rpx;border-top:1rpx solid #edf1ef}
.article-content text{display:block;margin-top:24rpx;color:#263b37;font-size:28rpx;line-height:1.9}
.empty{text-align:center;color:#7b8d88;line-height:1.8}.empty b,.empty text{display:block}
</style>
