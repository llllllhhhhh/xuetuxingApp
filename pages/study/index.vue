<template>
  <view class="page study-page">
    <view v-if="remoteBlocks.length" class="content decor-top">
      <DecorationBlocks :blocks="remoteBlocks" />
    </view>
    <swiper
      v-if="!remoteBlocks.length"
      class="hero-carousel"
      circular
      autoplay
      :interval="4500"
      :duration="500"
      indicator-dots
      indicator-color="rgba(255,255,255,.45)"
      indicator-active-color="#ffffff"
    >
      <swiper-item v-for="slide in slides" :key="slide.type">
        <view class="slide" @click="openSlide(slide)">
          <image class="slide-image" :src="slide.image" mode="aspectFill" />
          <view class="slide-overlay"></view>
          <view class="slide-content">
            <view class="slide-kicker">{{ slide.kicker }}</view>
            <view class="slide-title">{{ slide.title }}</view>
            <view class="slide-desc">{{ slide.desc }}</view>
            <view class="slide-footer">
              <text>{{ slide.note }}</text>
              <view class="slide-button">查看服务 <text>→</text></view>
            </view>
          </view>
        </view>
      </swiper-item>
    </swiper>

    <view v-if="!remoteBlocks.length" class="quick-center" @click="openCenter">
      <view class="quick-icon">学</view>
      <view><b>我的学习中心</b><text>查看已购课程、会员权益和学习进度</text></view>
      <text class="quick-arrow">→</text>
    </view>

    <view class="tab-shell" :class="{ stuck: isTabStuck }">
      <scroll-view class="category-scroll" scroll-x :show-scrollbar="false">
        <view class="category-list">
          <view v-for="item in tabs" :key="item.key" :class="['category-tab',{active:type===item.key}]" @click="type=item.key">{{item.name}}</view>
        </view>
      </scroll-view>
    </view>

    <view class="content">
      <view class="section-head">
        <view><b>{{ currentTitle }}</b><text>为你的当前阶段精选</text></view>
        <text class="count">{{ filtered.length }} 项服务</text>
      </view>

      <view v-if="loading" class="empty-state">正在加载学习服务...</view>

      <view v-for="item in filtered" :key="item.id" class="product-card" @click="open(item)">
        <view class="cover-wrap">
          <image class="cover" :src="item.cover||fallback" mode="aspectFill" />
          <view class="cover-shade"></view>
          <view class="cover-tags">
            <text>{{ typeName(item.product_type) }}</text>
            <text v-if="item.featured" class="recommend">精选推荐</text>
          </view>
          <view v-if="item.trial_minutes" class="trial">可试看 {{ item.trial_minutes }} 分钟</view>
        </view>

        <view class="product-body">
          <view class="product-name">{{ item.name }}</view>
          <view class="product-subtitle">{{ item.subtitle }}</view>
          <view class="benefit-list">
            <text v-for="b in (item.benefits||[]).slice(0,3)" :key="b">✓ {{ b }}</text>
          </view>
          <view class="product-footer">
            <view class="price-box">
              <view><text class="yen">¥</text><text class="price">{{ item.price }}</text><text class="cycle">{{ cycle(item.billing_cycle) }}</text></view>
              <text class="old" v-if="Number(item.original_price)">日常价 ¥{{ item.original_price }}</text>
            </view>
            <view class="detail-button">查看详情 <text>→</text></view>
          </view>
        </view>
      </view>

      <view v-if="!loading&&!filtered.length" class="empty-state">这个分类暂时没有在售服务</view>
      <view class="safe-bottom-space"></view>
    </view>
    <BottomNav active="学习服务商城" />
  </view>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import { onLoad, onPageScroll, onReady } from '@dcloudio/uni-app'
import DecorationBlocks from '../../components/DecorationBlocks.vue'
import BottomNav from '../../components/BottomNav.vue'
import { getDecorationPage, getStudyProducts, isLoggedIn } from '../../utils/api.js'

const products = ref([])
const remoteBlocks = ref([])
const type = ref('all')
const loading = ref(true)
const isTabStuck = ref(false)
const tabStickAt = ref(Number.POSITIVE_INFINITY)
let latestScrollTop = 0
const fallback = 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1000'
const tabs = [
  { key: 'all', name: '全部' },
  { key: 'community', name: '督学社群' },
  { key: 'package', name: '长期套餐' },
  { key: 'material', name: '资料包' },
]
const slides = [
  {
    type: 'community', kicker: '高频陪伴 · 每日督学', title: '备考路上，有人陪你坚持',
    desc: '每日打卡、学长答疑、每周模考', note: '9.9 元/月起',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200',
  },
  {
    type: 'package', kicker: '早鸟计划 · 全程规划', title: '越早规划，上岸越从容',
    desc: '专属档案、阶段课程、一对一规划', note: '支持分期',
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200',
  },
  {
    type: 'material', kicker: '精选资料 · 免费试看', title: '把时间花在真正的考点上',
    desc: '核心笔记、真题解析、冲刺清单', note: '购买后立即解锁',
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200',
  },
]

const filtered = computed(() => type.value === 'all' ? products.value : products.value.filter(item => item.product_type === type.value))
const currentTitle = computed(() => tabs.find(item => item.key === type.value)?.name)
const typeName = value => ({ community: '付费社群', package: '长期规划', material: '精选资料' }[value] || '学习服务')
const cycle = value => ({ month: '/月', year: '/年', once: ' 起' }[value] || '')
const open = item => uni.navigateTo({ url: `/pages/study/detail?id=${item.id}` })
const openSlide = slide => {
  const item = products.value.find(product => product.product_type === slide.type)
  if (item) open(item)
  else type.value = slide.type
}
const openCenter = () => uni.navigateTo({ url: isLoggedIn() ? '/pages/study/center' : '/pages/auth/login' })

const measureTabPosition = () => {
  nextTick(() => {
    const windowInfo = uni.getWindowInfo ? uni.getWindowInfo() : uni.getSystemInfoSync()
    const stickyOffset = Number(windowInfo?.windowTop || 0)
    uni.createSelectorQuery()
      .select('.tab-shell')
      .boundingClientRect(rect => {
        if (!rect) return
        tabStickAt.value = rect.top + latestScrollTop - stickyOffset
        isTabStuck.value = latestScrollTop >= tabStickAt.value
      })
      .exec()
  })
}

onReady(measureTabPosition)
onPageScroll(event => {
  latestScrollTop = Number(event.scrollTop || 0)
  const nextStuck = latestScrollTop >= tabStickAt.value
  if (nextStuck !== isTabStuck.value) isTabStuck.value = nextStuck
})

onLoad(async () => {
  try {
    const [page, list] = await Promise.all([getDecorationPage('study'), getStudyProducts()])
    remoteBlocks.value = page?.blocks || []
    products.value = list
  } catch (error) {
    uni.showToast({ title: error.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.study-page{min-height:100vh;padding-bottom:0;background:#f3f6f4;color:#17332e}.hero{padding:42rpx 32rpx 38rpx;background:linear-gradient(145deg,#183e38 0%,#0b776b 100%);color:#fff;overflow:hidden;position:relative}.hero:after{content:'';position:absolute;width:340rpx;height:340rpx;border:55rpx solid rgba(255,255,255,.045);border-radius:50%;right:-150rpx;top:-145rpx}.hero-kicker{display:flex;align-items:center;gap:12rpx;color:#9be0d3;font-size:21rpx;letter-spacing:2rpx}.hero-kicker text{width:32rpx;height:4rpx;border-radius:4rpx;background:#ff995f}.hero-title{margin:25rpx 0 15rpx;font-size:48rpx;font-weight:900;line-height:1.28;letter-spacing:1rpx}.hero-title text{color:#ffb27d}.hero-desc{font-size:23rpx;color:#c4dfda;letter-spacing:1rpx}.hero-actions{display:flex;align-items:stretch;gap:12rpx;margin-top:34rpx;position:relative;z-index:1}.hero-chip{min-width:112rpx;padding:13rpx 15rpx;border:1rpx solid rgba(255,255,255,.13);border-radius:17rpx;background:rgba(255,255,255,.08)}.hero-chip b,.hero-chip text{display:block}.hero-chip b{font-size:23rpx}.hero-chip text{margin-top:3rpx;color:#bcd9d4;font-size:18rpx}.center-button{margin-left:auto;display:flex;align-items:center;gap:13rpx;padding:0 23rpx;border-radius:18rpx;background:#fff;color:#14594f;font-size:23rpx;font-weight:800;white-space:nowrap}.center-button text{font-size:30rpx}.content{padding:22rpx 24rpx 0}.section-head{display:flex;align-items:flex-end;justify-content:space-between;padding:4rpx 4rpx 20rpx}.section-head b,.section-head text{display:block}.section-head b{font-size:31rpx}.section-head view>text{margin-top:6rpx;color:#899793;font-size:20rpx}.section-head .count{padding-bottom:3rpx;color:#8a9894;font-size:20rpx}.product-card{margin-bottom:28rpx;border:1rpx solid #e6ece9;border-radius:28rpx;background:#fff;overflow:hidden;box-shadow:0 12rpx 32rpx rgba(16,55,49,.055)}.cover-wrap{height:285rpx;position:relative;overflow:hidden}.cover{width:100%;height:100%}.cover-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(14,43,38,.06),rgba(14,43,38,.5))}.cover-tags{position:absolute;left:22rpx;top:21rpx;display:flex;gap:10rpx}.cover-tags text{padding:7rpx 14rpx;border-radius:99rpx;background:rgba(255,255,255,.94);color:#155d52;font-size:19rpx;font-weight:700}.cover-tags .recommend{background:#ff8a4a;color:#fff}.trial{position:absolute;right:20rpx;bottom:18rpx;padding:7rpx 13rpx;border-radius:99rpx;background:rgba(18,48,43,.72);color:#fff;font-size:19rpx}.product-body{padding:27rpx 27rpx 25rpx}.product-name{font-size:34rpx;font-weight:900;line-height:1.4}.product-subtitle{margin-top:9rpx;color:#71827e;font-size:23rpx;line-height:1.6}.benefit-list{display:flex;flex-wrap:wrap;gap:10rpx;margin:22rpx 0 25rpx}.benefit-list text{max-width:100%;padding:9rpx 13rpx;border-radius:11rpx;background:#edf8f5;color:#177c6e;font-size:20rpx;line-height:1.3}.product-footer{display:flex;align-items:center;justify-content:space-between;gap:20rpx;padding-top:21rpx;border-top:1rpx solid #edf1ef}.price-box{min-width:0}.price-box>view{display:flex;align-items:baseline}.yen{color:#f17434;font-size:24rpx;font-weight:900}.price{color:#f17434;font-size:42rpx;font-weight:900;line-height:1}.cycle{margin-left:5rpx;color:#637570;font-size:20rpx}.old{display:block;margin-top:7rpx;color:#9ca8a5;font-size:18rpx}.detail-button{flex:0 0 auto;padding:16rpx 21rpx;border-radius:17rpx;background:#ff7a35;color:#fff;font-size:22rpx;font-weight:700}.detail-button text{margin-left:8rpx}.empty-state{margin:20rpx 0;padding:100rpx 25rpx;border-radius:25rpx;background:#fff;color:#879591;text-align:center;font-size:23rpx}.safe-bottom-space{height:40rpx}
/* 顶部图片轮播：固定高度和完整留白，避免内容挤压或截断 */
.hero-carousel{height:390rpx;margin:0 24rpx 18rpx;border-radius:32rpx;overflow:hidden;box-shadow:0 14rpx 34rpx rgba(20,61,54,.14)}
.slide{width:100%;height:100%;border-radius:32rpx;overflow:hidden;position:relative;background:#173f38}
.slide-image{position:absolute;inset:0;width:100%;height:100%}
.slide-overlay{position:absolute;inset:0;background:linear-gradient(90deg,rgba(12,40,35,.88) 0%,rgba(12,40,35,.62) 58%,rgba(12,40,35,.18) 100%)}
.slide-content{position:absolute;inset:0;padding:34rpx 30rpx 46rpx;display:flex;flex-direction:column;justify-content:flex-end;color:#fff}
.slide-kicker{width:max-content;padding:7rpx 13rpx;border:1rpx solid rgba(255,255,255,.3);border-radius:99rpx;background:rgba(255,255,255,.1);color:#c8e7e1;font-size:19rpx}
.slide-title{max-width:520rpx;margin-top:15rpx;font-size:38rpx;font-weight:900;line-height:1.35;letter-spacing:1rpx}
.slide-desc{margin-top:8rpx;color:#d0e2df;font-size:21rpx;line-height:1.5}
.slide-footer{display:flex;align-items:center;justify-content:space-between;gap:18rpx;margin-top:20rpx}
.slide-footer>text{color:#ffbd91;font-size:21rpx;font-weight:700}
.slide-button{flex:0 0 auto;padding:12rpx 18rpx;border-radius:15rpx;background:#fff;color:#145b50;font-size:20rpx;font-weight:800}
.slide-button text{margin-left:7rpx}
.quick-center{display:flex;align-items:center;gap:15rpx;margin:0 24rpx 18rpx;padding:20rpx 22rpx;border:1rpx solid #e3eae7;border-radius:23rpx;background:#fff;box-shadow:0 8rpx 22rpx rgba(20,57,51,.045)}
.quick-icon{flex:0 0 52rpx;height:52rpx;border-radius:17rpx;background:linear-gradient(135deg,#e1f6ef,#c8eee4);color:#087e6f;display:flex;align-items:center;justify-content:center;font-size:22rpx;font-weight:900}
.quick-center>view:nth-child(2){flex:1;min-width:0}
.quick-center b,.quick-center view text{display:block}
.quick-center b{font-size:24rpx}
.quick-center view text{margin-top:4rpx;color:#84938f;font-size:18rpx;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.quick-arrow{color:#788984;font-size:29rpx}
/* 旧顶部卡片样式保留兼容，当前页面已切换为轮播 */
.study-page{padding-top:18rpx}
.hero{margin:0 24rpx 24rpx;padding:38rpx 30rpx 30rpx;border-radius:32rpx;box-shadow:0 14rpx 34rpx rgba(20,61,54,.12)}
.hero-kicker,.hero-title,.hero-desc{position:relative;z-index:1}
.hero-title view,.hero-title text{display:block}
.hero-actions{display:grid;grid-template-columns:1fr 1fr;align-items:stretch;gap:12rpx;margin-top:30rpx}
.hero-chip{min-width:0;padding:15rpx 17rpx}
.center-button{grid-column:1/-1;min-height:72rpx;margin-left:0;justify-content:center;padding:0 23rpx}
.tab-shell{position:sticky;top:var(--window-top,0px);z-index:30;box-sizing:border-box;width:calc(100% - 48rpx);margin:0 24rpx 18rpx;padding:12rpx;border:1rpx solid #e4ebe8;border-radius:0;background:rgba(255,255,255,.98);box-shadow:0 10rpx 26rpx rgba(21,56,50,.09);backdrop-filter:blur(14rpx);transition:width .28s cubic-bezier(.22,.61,.36,1),margin-left .28s cubic-bezier(.22,.61,.36,1),margin-right .28s cubic-bezier(.22,.61,.36,1),padding-left .28s ease,padding-right .28s ease,box-shadow .28s ease,background-color .28s ease}
.tab-shell.stuck{width:100%;margin-left:0;margin-right:0;padding-left:24rpx;padding-right:24rpx;border-left-color:transparent;border-right-color:transparent;background:rgba(255,255,255,.995);box-shadow:0 12rpx 30rpx rgba(18,52,46,.13)}
.category-scroll{width:100%;height:78rpx;white-space:nowrap}
.category-list{width:100%;height:78rpx;display:flex;align-items:stretch;gap:10rpx}
.category-tab{flex:1;min-width:0;height:78rpx;border:1rpx solid #e5ebe8;border-radius:99rpx;background:#fff;color:#72827e;font-size:23rpx;line-height:76rpx;text-align:center;white-space:nowrap}
.category-tab.active{background:#183f38;border-color:#183f38;color:#fff;font-weight:800;box-shadow:0 8rpx 18rpx rgba(24,63,56,.13)}
@media (max-width:360px){.study-page{padding-top:14rpx}.hero-carousel{height:365rpx;margin-left:18rpx;margin-right:18rpx}.slide-content{padding:28rpx 24rpx 43rpx}.slide-title{font-size:33rpx}.slide-desc{font-size:19rpx}.quick-center{margin-left:18rpx;margin-right:18rpx}.quick-center view text{max-width:360rpx}.tab-shell{width:calc(100% - 36rpx);margin-left:18rpx;margin-right:18rpx;padding:10rpx}.tab-shell.stuck{width:100%;margin-left:0;margin-right:0;padding-left:18rpx;padding-right:18rpx}.category-scroll,.category-list,.category-tab{height:72rpx}.category-tab{font-size:21rpx;line-height:70rpx}.cover-wrap{height:250rpx}.product-body{padding:23rpx}.benefit-list text:nth-child(3){display:none}}
.safe-bottom-space{height:170rpx}
</style>
