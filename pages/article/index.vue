<template>
  <view class="page article-page">
    <view class="content">
      <DecorationBlocks v-if="remoteBlocks.length" :blocks="remoteBlocks" :articles="articles" />
      <view v-else class="article-hero">
        <view class="article-hero__badge">文章中心</view>
        <view class="article-hero__title">协议规则、平台说明和帮助内容</view>
        <view class="article-hero__sub">后台发布后会同步展示在这里，适合放用户协议、隐私政策、积分规则等内容。</view>
      </view>

      <view v-if="loading" class="empty card">正在加载文章...</view>
      <view v-else-if="articles.length" class="article-list">
        <view v-for="item in articles" :key="item.id" class="article-card" @click="openArticle(item)">
          <view class="article-top">
            <view class="article-tags">
              <text class="tag tag-orange">{{ item.category || '文章' }}</text>
              <text v-if="item.pinned" class="tag">置顶</text>
            </view>
            <text class="article-arrow">→</text>
          </view>
          <view class="article-title">{{ item.title }}</view>
          <view class="article-summary">{{ item.summary || '点击查看完整内容' }}</view>
          <view class="article-foot">
            <text>{{ formatTime(item.published_at || item.updated_at) }}</text>
            <text>{{ item.slug }}</text>
          </view>
        </view>
      </view>
      <view v-else class="empty card">
        <b>暂无文章</b>
        <text>管理员发布文章后会展示在这里。</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import DecorationBlocks from '../../components/DecorationBlocks.vue'
import { getArticles, getDecorationPage } from '../../utils/api.js'

const articles = ref([])
const remoteBlocks = ref([])
const loading = ref(false)

const formatTime = value => (value ? String(value).replace('T', ' ').slice(0, 10) : '刚刚更新')

const load = async () => {
  loading.value = true
  try {
    const [page, list] = await Promise.all([getDecorationPage('articles'), getArticles()])
    remoteBlocks.value = page?.blocks || []
    articles.value = list
  } finally {
    loading.value = false
    uni.stopPullDownRefresh()
  }
}

const openArticle = item => {
  uni.navigateTo({ url: `/pages/article/detail?slug=${encodeURIComponent(item.slug || item.id)}` })
}

onShow(load)
onPullDownRefresh(load)
</script>

<style scoped>
.article-page{background:linear-gradient(180deg,#fff8ef,#f4f8f5)}.article-hero{padding:34rpx 30rpx;border-radius:32rpx;background:linear-gradient(145deg,#173d37,#239483);color:#fff;margin-bottom:24rpx;box-shadow:0 16rpx 38rpx rgba(24,78,69,.18)}.article-hero__badge{display:inline-block;padding:8rpx 18rpx;border-radius:99rpx;background:rgba(255,255,255,.16);font-size:22rpx;margin-bottom:16rpx}.article-hero__title{font-size:36rpx;font-weight:900;line-height:1.4}.article-hero__sub{margin-top:14rpx;font-size:24rpx;color:rgba(255,255,255,.82);line-height:1.7}.article-list{display:flex;flex-direction:column;gap:18rpx}.article-card{background:#fff;border-radius:28rpx;padding:28rpx;box-shadow:0 10rpx 28rpx rgba(18,51,45,.06);border:2rpx solid transparent}.article-card:active{transform:scale(.99)}.article-top,.article-foot{display:flex;align-items:center;justify-content:space-between}.article-tags{display:flex;gap:10rpx;flex-wrap:wrap}.article-arrow{font-size:48rpx;color:#9aa8a4}.article-title{margin:18rpx 0 14rpx;font-size:32rpx;font-weight:900;color:#17322d;line-height:1.45}.article-summary{font-size:25rpx;color:#6d807b;line-height:1.75}.article-foot{margin-top:22rpx;color:#8a9793;font-size:22rpx}.empty{text-align:center;color:#7b8d88;line-height:1.8}.empty b,.empty text{display:block}
</style>
