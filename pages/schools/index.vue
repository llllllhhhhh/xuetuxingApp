<template>
  <view class="site-page">
    <view class="site-head safe-top">
      <view class="back" @click="back">‹</view>
      <view class="title">站点</view>
      <view class="capsule"><text>•••</text><i></i><text>—</text><i></i><text>◎</text></view>
    </view>

    <view class="search-bar">
      <text>⌕</text>
      <input v-model.trim="keyword" confirm-type="search" placeholder="搜索你想找的站点" @confirm="search">
      <button @click="search">搜索</button>
    </view>

    <scroll-view scroll-y class="site-scroll" refresher-enabled :refresher-triggered="refreshing" @refresherrefresh="refresh">
      <view class="panel">
        <DecorationBlocks v-if="remoteBlocks.length" :blocks="remoteBlocks" :schools="schools" />

        <view class="section-title">当前站点</view>
        <view v-if="currentSchool" class="current-site">
          <text>📍</text>
          <view>{{ currentSchool.name }}</view>
        </view>
        <view v-else class="empty-current">暂无当前站点</view>

        <view class="section-title other-title">其他站点</view>
        <view v-if="loading" class="empty-card">正在加载入驻学校...</view>
        <view v-else-if="schools.length" class="school-list">
          <view v-for="item in schools" :key="item.id" class="school-card" @click="chooseSchool(item)">
            <view class="logo-wrap">
              <image v-if="item.logo" :src="item.logo" mode="aspectFill" />
              <view v-else class="logo-fallback">{{ firstChar(item) }}</view>
            </view>
            <view class="school-main">
              <view class="school-name">{{ item.name }}</view>
              <view class="tag-row">
                <text>{{ item.city || '未设置城市' }}</text>
                <text>{{ item.district || '未设置区域' }}</text>
              </view>
              <view class="joined">已入驻</view>
            </view>
            <view class="arrow">→</view>
          </view>
        </view>
        <view v-else class="empty-card">没有找到相关学校</view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import DecorationBlocks from '../../components/DecorationBlocks.vue'
import { getDecorationPage, getSchoolSites } from '../../utils/api.js'

const keyword = ref('')
const schools = ref([])
const remoteBlocks = ref([])
const loading = ref(false)
const refreshing = ref(false)

const currentSchool = computed(() => schools.value.find(item => item.current) || schools.value[0])
const firstChar = item => (item.short_name || item.name || '校').slice(0, 1)
const schoolWeight = item => Number(item?.display_weight ?? item?.displayWeight ?? 0)
const schoolIsVisible = item => item?.review_status === 'approved' && ![false, 0, 'false', '0'].includes(item?.status)
const visibleSchools = list => (Array.isArray(list) ? list : [])
  .filter(schoolIsVisible)
  .sort((a, b) => schoolWeight(b) - schoolWeight(a) || Number(a.sort_order || 0) - Number(b.sort_order || 0) || Number(b.id || 0) - Number(a.id || 0))

const load = async () => {
  loading.value = true
  try {
    const [page, list] = await Promise.all([getDecorationPage('schools'), getSchoolSites(keyword.value)])
    remoteBlocks.value = page?.blocks || []
    schools.value = visibleSchools(list)
  } finally {
    loading.value = false
    refreshing.value = false
  }
}
const search = () => load()
const refresh = async () => {
  refreshing.value = true
  await load()
}
const back = () => uni.navigateBack()
const chooseSchool = item => uni.showToast({ title: `${item.short_name || item.name} 已入驻`, icon: 'none' })

onShow(load)
</script>

<style scoped>
.site-page{min-height:100vh;background:#f6f7f4;color:#17231f;box-sizing:border-box}.site-head{height:108rpx;padding:18rpx 28rpx 0;display:flex;align-items:center;justify-content:space-between;background:#f6f7f4;box-sizing:border-box}.back{font-size:58rpx;line-height:1;color:#111;margin-top:-4rpx}.title{font-size:30rpx;font-weight:500;letter-spacing:2rpx}.capsule{height:58rpx;min-width:176rpx;border:1rpx solid #dfe4e1;border-radius:999rpx;background:#fff;display:flex;align-items:center;justify-content:center;gap:18rpx;font-weight:900;box-shadow:0 6rpx 18rpx rgba(0,0,0,.04)}.capsule i{height:34rpx;width:1rpx;background:#d7deda}.capsule text{font-size:26rpx}.search-bar{margin:18rpx 26rpx 24rpx;height:66rpx;border:2rpx solid #1e2926;border-radius:25rpx;background:#fff;display:flex;align-items:center;padding-left:22rpx;overflow:hidden;box-sizing:border-box}.search-bar text{font-size:42rpx;margin-right:18rpx;color:#17342e}.search-bar input{flex:1;font-size:28rpx;color:#17231f}.search-bar button{width:104rpx;height:52rpx;line-height:52rpx;border:0;border-radius:18rpx;background:#c8ff58;color:#14221d;font-weight:900;font-size:28rpx;margin-right:8rpx;padding:0}.site-scroll{height:calc(100vh - 216rpx)}.panel{background:#fff;border-radius:0;padding:30rpx 26rpx 46rpx;min-height:100%;box-sizing:border-box}.section-title{font-size:31rpx;font-weight:900;margin-bottom:22rpx}.other-title{margin-top:34rpx}.current-site{height:68rpx;border-radius:26rpx;background:#f7f7f7;display:flex;align-items:center;padding:0 24rpx;font-size:28rpx}.current-site text{margin-right:14rpx}.current-site view{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.empty-current{height:68rpx;border-radius:26rpx;background:#f7f7f7;color:#87918d;display:flex;align-items:center;padding:0 24rpx}.school-list{display:flex;flex-direction:column;gap:26rpx}.school-card{display:flex;align-items:center;min-height:128rpx;background:#fff;border-radius:30rpx;padding:24rpx 24rpx 24rpx 22rpx;box-shadow:0 10rpx 34rpx rgba(20,38,34,.07);box-sizing:border-box}.logo-wrap{width:96rpx;height:96rpx;margin-right:24rpx;display:flex;align-items:center;justify-content:center;flex-shrink:0}.logo-wrap image{width:82rpx;height:82rpx;border-radius:50%;background:#f3f5f4}.logo-fallback{width:82rpx;height:82rpx;border-radius:50%;background:#eef8f5;border:2rpx solid #cfe8e1;color:#174139;display:flex;align-items:center;justify-content:center;font-size:34rpx;font-weight:900}.school-main{flex:1;min-width:0}.school-name{font-size:29rpx;line-height:1.35;color:#15231f;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tag-row{display:flex;gap:12rpx;margin:12rpx 0 10rpx}.tag-row text{height:31rpx;line-height:31rpx;padding:0 18rpx;border:1rpx solid #cfd8d4;border-radius:6rpx;color:#50625d;font-size:23rpx;background:#fff}.joined{display:inline-flex;height:34rpx;line-height:34rpx;padding:0 18rpx;border-radius:6rpx;background:#c8ff58;color:#244000;font-size:23rpx}.arrow{width:38rpx;height:38rpx;border-radius:50%;background:#f0f1f0;color:#9ba4a1;display:flex;align-items:center;justify-content:center;font-size:26rpx;margin-left:16rpx;flex-shrink:0}.empty-card{padding:42rpx 20rpx;background:#f8faf8;border-radius:26rpx;text-align:center;color:#81908c}
</style>
