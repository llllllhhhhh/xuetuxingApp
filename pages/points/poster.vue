<template>
  <view class="poster-page">
    <view class="poster">
      <view class="poster-top"><view class="logo">行</view><b>学徒行</b></view>
      <view class="mount">⛰️</view>
      <view class="poster-title">一起上岸<br /><text>一起去看山河</text></view>
      <view class="poster-sub">扫描二维码注册，审核通过后邀请积分自动到账</view>
      <view class="qr">
        <image v-if="qrUrl" :src="qrUrl" mode="aspectFit" @error="qrFailed = true" />
        <view v-if="qrFailed" class="qr-fallback">二维码加载失败<br />请复制邀请码</view>
      </view>
      <view class="invite-code">我的邀请码 <b>{{ dashboard.invite_code || '--' }}</b></view>
      <view class="poster-tip">好友打开学徒行注册页，点击“扫一扫”识别</view>
    </view>
    <view class="btn-row actions">
      <view class="btn btn-primary" @click="saveQr">保存二维码</view>
      <view class="btn btn-ghost" @click="copyCode">复制邀请码</view>
    </view>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getInviteDashboard, isLoggedIn } from '../../utils/api.js'
import { saveImageToAlbumWithPermission } from '../../utils/permissions.js'

const dashboard = reactive({ invite_code: '', invite_payload: '' })
const qrFailed = ref(false)
const qrUrl = computed(() => dashboard.invite_payload
  ? `https://api.qrserver.com/v1/create-qr-code/?size=480x480&margin=10&data=${encodeURIComponent(dashboard.invite_payload)}`
  : '')

const copyCode = () => dashboard.invite_code && uni.setClipboardData({
  data: dashboard.invite_code,
  success: () => uni.showToast({ title: '邀请码已复制' }),
})

const saveQr = () => {
  if (!qrUrl.value) return
  // #ifdef H5
  uni.showModal({ title: '保存二维码', content: '请长按二维码图片保存，或截图分享给好友。', showCancel: false })
  // #endif
  // #ifndef H5
  uni.downloadFile({
    url: qrUrl.value,
    success: download => {
      if (download.statusCode !== 200) return uni.showToast({ title: '二维码下载失败', icon: 'none' })
      saveImageToAlbumWithPermission({
        filePath: download.tempFilePath,
        success: () => uni.showToast({ title: '二维码已保存', icon: 'success' }),
        fail: () => uni.showToast({ title: '请允许访问相册后重试', icon: 'none' }),
      })
    },
    fail: () => uni.showToast({ title: '二维码下载失败', icon: 'none' }),
  })
  // #endif
}

onLoad(async () => {
  if (!isLoggedIn()) return uni.redirectTo({ url: '/pages/auth/login' })
  try {
    Object.assign(dashboard, await getInviteDashboard())
  } catch (error) {
    uni.showToast({ title: error.message || '邀请码加载失败', icon: 'none' })
  }
})
</script>

<style scoped>
.poster-page{min-height:100vh;background:#102f2b;padding:40rpx 48rpx;box-sizing:border-box}.poster{background:#fff9ef;border-radius:40rpx;min-height:900rpx;padding:42rpx;text-align:center;position:relative;overflow:hidden}.poster:before{content:"";position:absolute;width:500rpx;height:500rpx;border-radius:50%;background:#daf1e9;right:-250rpx;top:80rpx}.poster-top{display:flex;align-items:center;text-align:left;position:relative}.logo{width:54rpx;height:54rpx;background:#ff7a35;color:#fff;border-radius:18rpx 18rpx 18rpx 4rpx;text-align:center;line-height:54rpx;margin-right:12rpx}.mount{font-size:140rpx;margin-top:22rpx;position:relative}.poster-title{font-size:50rpx;font-weight:900;line-height:1.35;position:relative}.poster-title text{color:#12a594}.poster-sub{color:#8a653f;margin:18rpx auto;max-width:520rpx;font-size:23rpx;line-height:1.65}.qr{width:260rpx;height:260rpx;margin:22rpx auto;padding:14rpx;background:#fff;border-radius:18rpx;position:relative;box-shadow:0 12rpx 30rpx rgba(39,68,62,.12)}.qr image{width:100%;height:100%}.qr-fallback{position:absolute;inset:0;display:grid;place-items:center;color:#89938f;font-size:22rpx;line-height:1.7}.invite-code{font-size:23rpx;color:#778684}.invite-code b{color:#173f39;letter-spacing:2rpx}.poster-tip{font-size:20rpx;color:#9a8b76;margin-top:12rpx}.actions{margin-top:30rpx}.actions .btn{flex:1}
</style>
