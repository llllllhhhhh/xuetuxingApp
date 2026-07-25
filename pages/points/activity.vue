<template>
  <view class="page">
    <view class="content">
      <DecorationBlocks v-if="remoteBlocks.length" :blocks="remoteBlocks" />
      <view class="points-hero">
        <view class="sub light">当前可用积分</view>
        <view><text class="score">{{ dashboard.points }}</text><text> 积分</text></view>
        <view class="progress white">
          <view class="progress-in" :style="{ width: progress + '%' }" />
        </view>
        <view class="hero-tip">
          已成功邀请 {{ dashboard.granted_count }} 人 ·
          {{ remaining ? `还差 ${remaining} 积分可兑换` : '已满足兑换条件' }}
        </view>
        <view class="mini">每位好友审核通过奖励 {{ dashboard.invite_score }} 积分</view>
      </view>

      <view class="section-title">分享给好友</view>
      <view class="share-grid">
        <view class="share" @click="shareCard"><view>💬</view><text>分享邀请口令</text></view>
        <view class="share" @click="goPoster"><view>🖼️</view><text>专属二维码</text></view>
        <view class="share" @click="copyInvite"><view>🔗</view><text>复制邀请码</text></view>
      </view>

      <view class="invite-code-card">
        <view><text>我的邀请码</text><b>{{ dashboard.invite_code || '--' }}</b></view>
        <view class="copy-btn" @click="copyInvite">复制</view>
      </view>

      <view class="card">
        <view class="title-row"><view class="card-title">邀请记录</view><text class="sub">{{ dashboard.invited_count }} 人</text></view>
        <view v-if="!dashboard.records.length" class="empty">还没有邀请记录，分享二维码邀请第一位好友吧</view>
        <view class="list-item" v-for="item in dashboard.records" :key="item.phone">
          <view class="avatar">{{ (item.nickname || '友')[0] }}</view>
          <view class="list-main">
            <view class="list-title">{{ item.nickname }} <text class="sub">{{ maskPhone(item.phone) }}</text></view>
            <view class="sub">{{ statusText(item.status, item.score_granted) }} · {{ formatTime(item.created_at) }}</view>
          </view>
          <view :class="item.score_granted ? 'money' : 'pending-score'">{{ item.score_granted ? `+${item.score}` : '待审核' }}</view>
        </view>
      </view>

      <view class="scan-entry" @click="scanForRegister">
        <view class="scan-icon">▣</view>
        <view><b>我是受邀好友</b><text>扫描邀请二维码，自动带入邀请码注册</text></view>
        <text>›</text>
      </view>

      <view class="rules" @click="open = !open">
        <view class="title-row"><b>积分与防刷规则</b><text>{{ open ? '⌃' : '⌄' }}</text></view>
        <view v-if="open" class="rule-text">
          1. 好友扫码后必须使用未注册手机号提交申请。<br />
          2. 管理员审核通过后，邀请积分才会自动到账。<br />
          3. 同一手机号只能绑定一次邀请关系，不能邀请自己。<br />
          4. 异常设备、批量注册或被冻结的邀请不发放积分。
        </view>
      </view>
    </view>
    <view class="fixed-action">
      <view class="btn" :class="remaining ? 'btn-disabled' : 'btn-primary'" @click="exchange">
        {{ remaining ? '继续邀请好友' : '立即兑换' }}
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import DecorationBlocks from '../../components/DecorationBlocks.vue'
import { getDecorationPage, getInviteDashboard, isLoggedIn } from '../../utils/api.js'
import { scanCodeWithPermission } from '../../utils/permissions.js'

const open = ref(false)
const remoteBlocks = ref([])
const dashboard = reactive({
  invite_code: '',
  invite_payload: '',
  points: 0,
  invite_score: 1,
  exchange_score: 100,
  enabled: true,
  invited_count: 0,
  granted_count: 0,
  records: [],
})
const progress = computed(() => Math.min(100, Math.round(dashboard.points / Math.max(1, dashboard.exchange_score) * 100)))
const remaining = computed(() => Math.max(0, dashboard.exchange_score - dashboard.points))

const load = async () => {
  if (!isLoggedIn()) {
    uni.showModal({
      title: '请先登录',
      content: '登录后才能生成专属邀请码和查看积分到账记录。',
      success: result => result.confirm && uni.navigateTo({ url: '/pages/auth/login' }),
    })
    return
  }
  try {
    const [page, invite] = await Promise.all([getDecorationPage('points'), getInviteDashboard()])
    remoteBlocks.value = page?.blocks || []
    Object.assign(dashboard, invite)
    uni.setStorageSync('points', dashboard.points)
  } catch (error) {
    uni.showToast({ title: error.message || '邀请数据加载失败', icon: 'none' })
  }
}

const parseCode = value => {
  const text = String(value || '').trim()
  return text.startsWith('XTXINVITE:') ? text.slice(10) : text
}
const scanForRegister = () => scanCodeWithPermission({
  scanType: ['qrCode'],
  success: result => {
    const code = parseCode(result.result)
    if (!code) return uni.showToast({ title: '二维码内容无效', icon: 'none' })
    uni.setStorageSync('pendingInviteCode', code)
    uni.navigateTo({ url: `/pages/auth/login?invite_code=${encodeURIComponent(code)}` })
  },
})
const copyInvite = () => {
  if (!dashboard.invite_code) return
  uni.setClipboardData({ data: dashboard.invite_code, success: () => uni.showToast({ title: '邀请码已复制' }) })
}
const shareCard = () => {
  if (!dashboard.invite_payload) return
  uni.setClipboardData({
    data: `学徒行邀请口令：${dashboard.invite_payload}\n打开学徒行，在注册页点击“扫一扫”即可绑定。`,
    success: () => uni.showToast({ title: '邀请口令已复制' }),
  })
}
const goPoster = () => dashboard.invite_code
  ? uni.navigateTo({ url: '/pages/points/poster' })
  : uni.showToast({ title: '邀请码加载中', icon: 'none' })
const exchange = () => remaining.value ? goPoster() : uni.navigateTo({ url: '/pages/points/exchange' })
const maskPhone = phone => String(phone || '').replace(/^(\d{3})\d+(\d{4})$/, '$1****$2')
const formatTime = value => value ? String(value).replace('T', ' ').slice(0, 16) : ''
const statusText = (status, granted) => granted ? '审核通过，积分已到账' : status === 'rejected' ? '注册未通过' : '等待管理员审核'

onShow(load)
</script>

<style scoped>
.points-hero{padding:38rpx;border-radius:34rpx;color:#fff;background:linear-gradient(135deg,#123d37,#12a594);box-shadow:0 18rpx 40rpx rgba(18,165,148,.24)}
.light{color:rgba(255,255,255,.75)}.score{font-size:84rpx;font-weight:900}.white{background:rgba(255,255,255,.25);margin-top:24rpx}
.hero-tip{margin-top:18rpx}.mini{font-size:21rpx;opacity:.72;margin-top:12rpx}
.share-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14rpx;margin-bottom:20rpx}.share{background:#fff;border-radius:24rpx;text-align:center;padding:26rpx 8rpx}.share view{font-size:48rpx;margin-bottom:10rpx}.share text{font-size:23rpx}
.invite-code-card{display:flex;align-items:center;justify-content:space-between;background:#fff5e9;border:1rpx solid #ffe0c6;border-radius:24rpx;padding:24rpx 28rpx;margin-bottom:24rpx}.invite-code-card text,.invite-code-card b{display:block}.invite-code-card text{font-size:21rpx;color:#8d796b}.invite-code-card b{font-size:32rpx;margin-top:7rpx;letter-spacing:2rpx}.copy-btn{color:#ef7130;font-size:24rpx;font-weight:700}
.empty{text-align:center;color:#87938f;font-size:24rpx;padding:42rpx 10rpx}.pending-score{font-size:22rpx;color:#b1803e;background:#fff5df;padding:7rpx 12rpx;border-radius:14rpx}
.scan-entry{display:flex;align-items:center;gap:20rpx;background:#eaf7f3;border-radius:24rpx;padding:26rpx;margin:22rpx 0}.scan-entry>view:nth-child(2){flex:1}.scan-entry b,.scan-entry text{display:block}.scan-entry text{font-size:22rpx;color:#71837e;margin-top:7rpx}.scan-icon{width:72rpx;height:72rpx;border-radius:20rpx;background:#123d37;color:#fff;display:grid;place-items:center;font-size:38rpx}
.rules{background:#fff;padding:28rpx;border-radius:24rpx}.rule-text{color:#778684;font-size:24rpx;line-height:1.9;margin-top:20rpx}
</style>
