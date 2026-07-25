<template>
  <view class="x-tabbar-wrap">
    <view class="x-tabbar">
      <view
        v-for="item in items"
        :key="item.name"
        :class="['x-tabbar-item', { active: active === item.name }]"
        @click="go(item)"
      >
        <view class="normal-icon">{{ item.icon }}</view>
        <view class="tab-label">{{ item.label || item.name }}</view>
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({ active: { type: String, default: '首页' } })

const items = [
  { name: '首页', label: '首页', icon: '⌂', url: '/pages/index/index' },
  { name: '学习中心', label: '中心', icon: '◒', url: '/pages/study/center' },
  { name: '学习服务商城', label: '商城', icon: '▣', url: '/pages/study/index' },
  { name: '旅行', label: '旅行', icon: '⌁', url: '/pages/travel/index' },
  { name: '我的', label: '我的', icon: '◉', url: '/pages/mine/index' },
]

const go = item => {
  if (!item.url) return uni.showToast({ title: `${item.name}模块演示入口`, icon: 'none' })
  uni.reLaunch({ url: item.url })
}
</script>

<style scoped>
.x-tabbar-wrap{
  position:fixed;
  left:0;
  right:0;
  bottom:0;
  z-index:50;
  padding:0 18rpx 0;
  pointer-events:none;
}
.x-tabbar{
  position:relative;
  min-height:112rpx;
  padding:12rpx 12rpx calc(10rpx + env(safe-area-inset-bottom));
  border:1rpx solid rgba(229,235,232,.86);
  border-bottom:0;
  border-radius:36rpx 36rpx 0 0;
  background:rgba(255,255,255,.94);
  box-shadow:0 -12rpx 40rpx rgba(22,63,57,.11);
  backdrop-filter:blur(18px);
  display:flex;
  align-items:center;
  pointer-events:auto;
}
.x-tabbar-item{
  position:relative;
  flex:1;
  min-width:0;
  height:92rpx;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  color:#a0aaa7;
  font-size:18rpx;
  line-height:1;
  transition:color .18s ease, transform .18s ease;
}
.x-tabbar-item.active{
  color:#123f39;
  font-weight:800;
}
.normal-icon{
  height:42rpx;
  min-width:42rpx;
  display:flex;
  align-items:center;
  justify-content:center;
  border-radius:16rpx;
  font-size:34rpx;
  font-weight:900;
  color:currentColor;
}
.x-tabbar-item.active .normal-icon{
  color:#123f39;
  background:#eef8f5;
  box-shadow:0 8rpx 18rpx rgba(18,63,57,.08);
}
.tab-label{
  width:100%;
  margin-top:8rpx;
  text-align:center;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
@media (max-width:360px){
  .x-tabbar-wrap{padding-left:12rpx;padding-right:12rpx}
  .tab-label{font-size:16rpx}
}
</style>
