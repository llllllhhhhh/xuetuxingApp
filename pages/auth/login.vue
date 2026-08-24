<template>
  <view class="auth-page">
    <view class="decor decor-a"></view>
    <view class="decor decor-b"></view>
    <view class="decor decor-c"></view>

    <view class="hero">
      <view class="brand-row">
        <view class="logo">行</view>
        <view>
          <view class="brand">学徒行</view>
          <view class="brand-sub">备考成长 · 旅行权益 · 校园服务</view>
        </view>
      </view>
      <view class="hero-art">
        <view class="bubble bubble-1">上岸</view>
        <view class="bubble bubble-2">积分</view>
        <view class="face">☺</view>
        <view class="star star-1">✦</view>
        <view class="star star-2">✹</view>
      </view>
      <!-- #ifdef MP-WEIXIN -->
      <view class="hero-title">欢迎来到学徒行</view>
      <!-- #endif -->
      <!-- #ifndef MP-WEIXIN -->
      <view class="hero-title">{{ tab === 'login' ? '欢迎回来' : '加入学徒行' }}</view>
      <!-- #endif -->
      <view class="hero-desc">
        <!-- #ifdef MP-WEIXIN -->
        微信一键登录后，同步积分、旅行、学习权益和客服记录。
        <!-- #endif -->
        <!-- #ifndef MP-WEIXIN -->
        {{ tab === 'login' ? '登录后同步消息、客服记录、收藏路线与积分权益。' : '注册提交后需管理员审核，通过后即可登录使用。' }}
        <!-- #endif -->
      </view>
    </view>

    <view class="auth-card">
      <!-- #ifdef MP-WEIXIN -->
      <view class="mini-login-card">
        <view class="mini-login-head">
          <view class="mini-wechat-mark">微</view>
          <view>
            <b>微信一键登录</b>
            <text>选择微信认证手机号后直接登录</text>
          </view>
        </view>
        <view class="mini-benefits">
          <text>积分与签到</text>
          <text>学习与旅行权益</text>
          <text>订单与客服记录</text>
        </view>
        <view class="agreement" @click="agreed = !agreed">
          <view :class="['check', { on: agreed }]">✓</view>
          <view>
            我已阅读并同意
            <text @click.stop="openArticle('user-agreement')">《用户协议》</text>
            和
            <text @click.stop="openArticle('privacy-policy')">《隐私政策》</text>
          </view>
        </view>
        <button
          class="wechat-login-btn"
          open-type="getPhoneNumber"
          :loading="wechatLoading"
          :disabled="wechatLoading || !agreed"
          @getphonenumber="wechatLogin"
        >
          {{ wechatLoading ? '正在登录...' : '选择微信手机号登录' }}
        </button>
        <view v-if="form.inviteCode" class="mini-invite-tip">已识别好友邀请，首次登录后自动绑定</view>
      </view>
      <!-- #endif -->

      <!-- #ifndef MP-WEIXIN -->
      <view class="mode-switch">
        <view :class="['mode-item', { active: tab === 'login' }]" @click="switchTab('login')">登录</view>
        <view :class="['mode-item', { active: tab === 'register' }]" @click="switchTab('register')">注册</view>
      </view>

      <view class="form">
        <view class="field">
          <view class="prefix">+86</view>
          <input v-model.trim="form.phone" class="input" type="number" maxlength="11" placeholder="请输入你的手机号" />
        </view>

        <view v-if="tab === 'register'" class="field">
          <view class="prefix icon">昵</view>
          <input v-model.trim="form.nickname" class="input" placeholder="给自己取一个昵称" />
        </view>

        <view class="field">
          <view class="prefix icon">密</view>
          <input v-model.trim="form.password" class="input" password maxlength="50" placeholder="请输入密码，至少 6 位" />
        </view>

        <view v-if="tab === 'register'" class="invite-box">
          <view class="invite-head">
            <view>
              <b>好友邀请码</b>
              <text>扫码好友海报，注册后好友可获得积分</text>
            </view>
            <view class="scan-btn" @click="scanInvite">扫一扫</view>
          </view>
          <input v-model.trim="form.inviteCode" class="invite-input" maxlength="64" placeholder="可选：填写或扫码识别邀请码" />
          <view v-if="form.inviteCode" class="invite-bound">✓ 已绑定邀请码：{{ form.inviteCode }}</view>
        </view>

        <view class="agreement" @click="agreed = !agreed">
          <view :class="['check', { on: agreed }]">✓</view>
          <view>
            我已阅读并同意
            <text @click.stop="openArticle('user-agreement')">《用户协议》</text>
            和
            <text @click.stop="openArticle('privacy-policy')">《隐私政策》</text>
          </view>
        </view>

        <view class="submit-btn" @click="submit">
          <view class="btn-art">{{ tab === 'login' ? '✓' : '+' }}</view>
          <text>{{ tab === 'login' ? '立即登录' : '提交注册申请' }}</text>
        </view>

        <view class="quick-tip">
          {{ tab === 'login' ? '还没有账号？切换到注册，审核通过后即可登录。' : '已有账号？切换到登录继续使用你的权益。' }}
        </view>
      </view>
      <!-- #endif -->
    </view>

    <!-- #ifndef MP-WEIXIN -->
    <view v-if="showSlider" class="slider-mask" @click.self="closeSlider">
      <view class="slider-panel">
        <view class="slider-panel-head">
          <view>
            <b>登录安全验证</b>
            <text>完成滑块后将自动登录</text>
          </view>
          <view class="slider-close" @click="closeSlider">×</view>
        </view>
        <SliderCaptcha
          ref="sliderRef"
          scope="user"
          @verified="handleSliderVerified"
          @reset="sliderTicket = ''"
        />
      </view>
    </view>
    <!-- #endif -->

    <view class="api-diagnostic">
      <view class="api-status">
        <text :class="['api-dot', { ok: diagnosticOk }]"></text>
        <b>API 连接诊断</b>
      </view>
      <text class="api-url">{{ apiUrl }}</text>
      <view class="api-test" @click="checkApi">{{ checking ? '检测中...' : '检测公网连接' }}</view>
    </view>
  </view>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getApiBaseUrl, getInviteDeviceId, loginUser, loginWechatMini, registerUser, testApiConnection } from '../../utils/api.js'
import { scanCodeWithPermission } from '../../utils/permissions.js'
import SliderCaptcha from '../../components/SliderCaptcha.vue'

const tab = ref('login')
const agreed = ref(true)
const form = reactive({ phone: '', nickname: '', password: '', inviteCode: '' })
const apiUrl = ref(getApiBaseUrl())
const checking = ref(false)
const diagnosticOk = ref(false)
const sliderTicket = ref('')
const sliderRef = ref(null)
const showSlider = ref(false)
const wechatLoading = ref(false)

const switchTab = value => {
  tab.value = value
  sliderTicket.value = ''
  showSlider.value = false
}

const closeSlider = () => {
  showSlider.value = false
  sliderTicket.value = ''
}

const handleSliderVerified = ticket => {
  sliderTicket.value = ticket
  showSlider.value = false
  submit()
}

const parseInviteCode = value => {
  const text = decodeURIComponent(String(value || '').trim())
  if (!text) return ''
  if (text.startsWith('XTXINVITE:')) return text.slice('XTXINVITE:'.length).trim()
  const match = text.match(/[?&](?:invite_code|inviteCode)=([^&#]+)/i)
  return match ? decodeURIComponent(match[1]) : text
}

const applyInviteCode = value => {
  const code = parseInviteCode(value)
  if (!code) return false
  form.inviteCode = code
  // #ifdef MP-WEIXIN
  uni.setStorageSync('pendingInviteCode', code)
  return true
  // #endif
  tab.value = 'register'
  uni.setStorageSync('pendingInviteCode', code)
  return true
}

const getWechatLoginCode = () => new Promise((resolve, reject) => {
  uni.login({
    provider: 'weixin',
    success: result => result.code ? resolve(result.code) : reject(new Error('未获取到微信登录凭证')),
    fail: error => reject(new Error(error.errMsg || '微信登录失败')),
  })
})

const showPhoneAuthorizationError = detail => {
  const errMsg = String(detail?.errMsg || '').trim()
  let message = '微信没有返回认证手机号凭证，请稍后重试。'
  if (/deny|cancel/i.test(errMsg)) {
    message = '你取消了手机号授权，需要选择微信认证手机号后才能登录。'
  } else if (/permission|auth deny|access denied|not authorized/i.test(errMsg)) {
    message = '当前小程序没有手机号接口权限，请先在微信公众平台完成主体认证并开通手机号快速验证能力。'
  } else if (/frequency|frequent|too many/i.test(errMsg)) {
    message = '手机号授权调用过于频繁，请稍后再试。'
  } else if (/getPhoneNumber:ok/i.test(errMsg)) {
    message = '微信授权成功但没有返回手机号 code，请升级微信客户端后重新进入小程序。'
  }
  console.error('[wechat-phone-login] getPhoneNumber failed', detail || {})
  uni.showModal({
    title: '手机号授权失败',
    content: `${message}\n\n微信返回：${errMsg || '无错误信息'}`,
    showCancel: false,
  })
}

const wechatLogin = async event => {
  if (wechatLoading.value) return
  if (!agreed.value) {
    uni.showToast({ title: '请先同意用户协议和隐私政策', icon: 'none' })
    return
  }
  const phoneCode = event?.detail?.code
  if (!phoneCode) {
    showPhoneAuthorizationError(event?.detail)
    return
  }
  wechatLoading.value = true
  try {
    const code = await getWechatLoginCode()
    await loginWechatMini({
      code,
      phone_code: phoneCode,
      invite_code: form.inviteCode || uni.getStorageSync('pendingInviteCode') || '',
      device_id: getInviteDeviceId(),
    })
    uni.removeStorageSync('pendingInviteCode')
    uni.showToast({ title: '登录成功', icon: 'success' })
    setTimeout(backOrHome, 500)
  } catch (error) {
    uni.showToast({ title: error.message || '微信登录失败', icon: 'none' })
  } finally {
    wechatLoading.value = false
  }
}

const scanInvite = () => {
  scanCodeWithPermission({
    scanType: ['qrCode'],
    success: result => {
      if (applyInviteCode(result.result)) uni.showToast({ title: '邀请码识别成功', icon: 'success' })
      else uni.showToast({ title: '未识别到有效邀请码', icon: 'none' })
    },
    fail: error => {
      if (!String(error?.errMsg || '').includes('cancel')) {
        uni.showToast({ title: '扫码失败，请手动填写邀请码', icon: 'none' })
      }
    },
  })
}

onLoad(options => {
  const code = options?.invite_code || options?.inviteCode || options?.scene || uni.getStorageSync('pendingInviteCode')
  if (code) applyInviteCode(code)
})

const checkApi = async () => {
  if (checking.value) return
  checking.value = true
  const result = await testApiConnection()
  checking.value = false
  diagnosticOk.value = result.ok
  apiUrl.value = result.apiBaseUrl
  uni.showModal({
    title: result.ok ? '连接正常' : '连接失败',
    content: `请求地址：${result.healthUrl}\n状态：${result.statusCode || '未到达服务器'}\n耗时：${result.elapsed}ms\n结果：${result.message}`,
    showCancel: false,
  })
}

const backOrHome = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack()
  else uni.reLaunch({ url: '/pages/mine/index' })
}

const openArticle = slug => {
  uni.navigateTo({ url: `/pages/article/detail?slug=${slug}` })
}

const submit = async () => {
  if (!agreed.value) {
    uni.showToast({ title: '请先同意用户协议和隐私政策', icon: 'none' })
    return
  }
  if (!form.phone || !form.password || (tab.value === 'register' && !form.nickname)) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' })
    return
  }
  if (!/^1\d{10}$/.test(form.phone)) {
    uni.showToast({ title: '请输入正确的 11 位手机号', icon: 'none' })
    return
  }
  if (form.password.length < 6) {
    uni.showToast({ title: '密码至少需要 6 位', icon: 'none' })
    return
  }
  if (tab.value === 'register' && form.nickname.length > 60) {
    uni.showToast({ title: '昵称不能超过 60 个字符', icon: 'none' })
    return
  }
  try {
    if (tab.value === 'login') {
      if (!sliderTicket.value) {
        showSlider.value = true
        return
      }
      await loginUser({ account: form.phone, password: form.password, slider_ticket: sliderTicket.value })
      uni.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(backOrHome, 500)
      return
    }

    const result = await registerUser({
      phone: form.phone,
      nickname: form.nickname,
      password: form.password,
      invite_code: form.inviteCode,
      device_id: getInviteDeviceId(),
    })
    uni.showToast({ title: result.message || '注册申请已提交', icon: 'none', duration: 2200 })
    if (result.invitation_bound) uni.removeStorageSync('pendingInviteCode')
    tab.value = 'login'
    form.password = ''
  } catch (error) {
    sliderTicket.value = ''
    showSlider.value = false
    uni.showToast({ title: error.message || '操作失败', icon: 'none' })
  }
}
</script>

<style scoped>
.auth-page{
  min-height:100vh;
  position:relative;
  overflow:hidden;
  padding:28rpx 34rpx 46rpx;
  background:
    radial-gradient(circle at 82% 8%, rgba(192,255,111,.32), transparent 210rpx),
    radial-gradient(circle at 12% 16%, rgba(255,142,76,.18), transparent 260rpx),
    linear-gradient(180deg,#fffaf1 0%,#eef8f4 52%,#f8fbf9 100%);
  color:#102c27;
}
.decor{position:absolute;border-radius:999rpx;filter:blur(2rpx);opacity:.8;pointer-events:none}
.decor-a{width:220rpx;height:220rpx;right:-88rpx;top:100rpx;background:rgba(22,63,57,.12)}
.decor-b{width:110rpx;height:110rpx;left:-42rpx;top:420rpx;background:rgba(255,122,53,.18)}
.decor-c{width:150rpx;height:150rpx;right:40rpx;bottom:180rpx;background:rgba(18,165,148,.12)}
.hero{
  position:relative;
  z-index:1;
  min-height:410rpx;
  padding:34rpx 34rpx 40rpx;
  border-radius:42rpx;
  overflow:hidden;
  background:linear-gradient(145deg,#173a35 0%,#205149 58%,#2d6a60 100%);
  box-shadow:0 22rpx 60rpx rgba(14,55,49,.18);
  color:#fff;
}
.hero:after{
  content:'';
  position:absolute;
  width:310rpx;
  height:310rpx;
  right:-100rpx;
  top:-70rpx;
  border:44rpx solid rgba(255,255,255,.028);
  border-radius:50%;
}
.brand-row{position:relative;z-index:2;display:flex;align-items:center;gap:18rpx}
.logo{width:78rpx;height:78rpx;border-radius:24rpx 24rpx 24rpx 8rpx;background:linear-gradient(135deg,#ff7a35,#ffb166);display:grid;place-items:center;font-size:36rpx;font-weight:900}
.brand{font-size:30rpx;font-weight:900}.brand-sub{margin-top:6rpx;color:rgba(255,255,255,.66);font-size:21rpx}
.hero-art{position:absolute;right:18rpx;top:104rpx;width:230rpx;height:200rpx;z-index:1;opacity:.96;pointer-events:none}
.bubble{position:absolute;border-radius:999rpx;padding:10rpx 18rpx;font-size:22rpx;font-weight:900;box-shadow:0 10rpx 26rpx rgba(0,0,0,.12)}
.bubble-1{right:72rpx;top:0;background:#c8ff69;color:#173f39;transform:rotate(-8deg)}
.bubble-2{right:0;bottom:34rpx;background:#fff2d8;color:#ec7135;transform:rotate(8deg)}
.face{position:absolute;right:76rpx;top:62rpx;width:112rpx;height:112rpx;border-radius:50%;background:#ffe96b;color:#142b28;display:grid;place-items:center;font-size:60rpx;font-weight:900;box-shadow:0 12rpx 30rpx rgba(0,0,0,.16)}
.star{position:absolute;color:#fff;font-size:40rpx}.star-1{left:22rpx;top:20rpx;color:#b6d5ff}.star-2{left:6rpx;bottom:34rpx;color:#e7d6ff}
.hero-title{position:relative;z-index:2;margin-top:92rpx;max-width:390rpx;font-size:54rpx;font-weight:900;letter-spacing:1rpx}
.hero-desc{position:relative;z-index:2;margin-top:16rpx;max-width:410rpx;color:rgba(255,255,255,.68);font-size:25rpx;line-height:1.55}
.auth-card{
  position:relative;
  z-index:3;
  margin-top:-38rpx;
  padding:22rpx;
  border-radius:38rpx;
  background:rgba(255,255,255,.92);
  box-shadow:0 22rpx 60rpx rgba(18,55,49,.12);
  backdrop-filter:blur(18rpx);
}
.mini-login-card{padding:20rpx 10rpx 12rpx}
.mini-login-head{display:flex;align-items:center;gap:20rpx;padding:12rpx 8rpx 24rpx}
.mini-login-head>view:last-child{flex:1;min-width:0}
.mini-login-head b,.mini-login-head text{display:block}
.mini-login-head b{font-size:34rpx;color:#102c27}
.mini-login-head text{margin-top:8rpx;color:#7d8c88;font-size:23rpx}
.mini-wechat-mark{width:82rpx;height:82rpx;display:grid;place-items:center;border-radius:24rpx;background:#07c160;color:#fff;font-size:31rpx;font-weight:900;box-shadow:0 12rpx 28rpx rgba(7,193,96,.2)}
.mini-benefits{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10rpx;margin-bottom:26rpx}
.mini-benefits text{min-width:0;padding:16rpx 8rpx;border-radius:18rpx;background:#f2f7f4;color:#55706a;text-align:center;font-size:20rpx;line-height:1.35}
.wechat-login-btn{height:94rpx;margin:0;border:0;border-radius:999rpx;background:#07c160;color:#fff;font-size:30rpx;font-weight:900;line-height:94rpx;box-shadow:0 16rpx 34rpx rgba(7,193,96,.22)}
.wechat-login-btn:after{border:0}
.wechat-login-btn[disabled]{background:#91dcb4;color:rgba(255,255,255,.9)}
.mini-invite-tip{margin-top:18rpx;color:#0d8f80;text-align:center;font-size:22rpx;font-weight:800}
.mode-switch{display:flex;padding:8rpx;border-radius:30rpx;background:#eef3ef}
.mode-item{flex:1;height:78rpx;display:grid;place-items:center;border-radius:25rpx;color:#7c8d88;font-size:29rpx;font-weight:900;transition:.22s}
.mode-item.active{background:#fff;color:#102c27;box-shadow:0 10rpx 26rpx rgba(21,55,49,.1)}
.form{padding:26rpx 8rpx 10rpx}
.field{height:92rpx;margin-bottom:22rpx;display:flex;align-items:center;overflow:hidden;border-radius:999rpx;background:#f3f6f4;border:1rpx solid #e5ece8}
.prefix{width:108rpx;height:100%;display:grid;place-items:center;border-right:1rpx solid #e0e8e4;color:#173f39;font-size:27rpx;font-weight:900}
.prefix.icon{font-size:25rpx;color:#0d8f80}
.input{flex:1;min-width:0;height:100%;padding:0 28rpx;color:#102c27;font-size:28rpx}
.invite-box{margin-bottom:22rpx;padding:22rpx;border-radius:28rpx;background:#f8fbf9;border:1rpx solid #e2ece7}
.invite-head{display:flex;align-items:center;justify-content:space-between;gap:18rpx}
.invite-head>view:first-child{flex:1;min-width:0}
.invite-head b,.invite-head text{display:block}.invite-head b{font-size:26rpx}.invite-head text{margin-top:6rpx;color:#83928e;font-size:21rpx}
.scan-btn{flex:0 0 auto;min-width:118rpx;padding:14rpx 18rpx;border-radius:999rpx;background:#173f39;color:#fff;text-align:center;font-size:23rpx;font-weight:900}
.invite-input{height:74rpx;margin-top:18rpx;padding:0 22rpx;border-radius:20rpx;background:#fff;border:1rpx solid #dfe9e5;font-size:24rpx}
.invite-bound{margin-top:12rpx;color:#0d8f80;font-size:22rpx;font-weight:800}
.agreement{display:flex;gap:12rpx;align-items:flex-start;margin:6rpx 0 28rpx;color:#7d8c88;font-size:22rpx;line-height:1.65}
.agreement>view:last-child{flex:1;min-width:0}
.agreement text{color:#0d8f80;font-weight:900}
.check{width:30rpx;height:30rpx;margin-top:4rpx;display:grid;place-items:center;border-radius:8rpx;background:#dfe7e4;color:transparent;font-size:20rpx;font-weight:900}
.check.on{background:#102c27;color:#fff}
.submit-btn{height:92rpx;position:relative;display:flex;align-items:center;justify-content:center;gap:16rpx;padding:0 34rpx;border-radius:999rpx;background:linear-gradient(135deg,#c9ff72,#92ef72);color:#132d28;font-size:30rpx;font-weight:900;box-shadow:0 18rpx 38rpx rgba(120,214,88,.26);overflow:hidden}
.submit-btn:active{transform:scale(.985)}
.btn-art{position:static;width:48rpx;height:48rpx;flex:0 0 48rpx;border-radius:50%;background:#fff;display:grid;place-items:center;color:#173f39;font-size:24rpx;font-weight:900;box-shadow:0 8rpx 20rpx rgba(0,0,0,.1)}
.submit-btn text{position:relative;z-index:1}
.quick-tip{margin-top:22rpx;text-align:center;color:#9aa7a3;font-size:22rpx}
.api-diagnostic{position:relative;z-index:2;margin-top:24rpx;padding:24rpx;border:1rpx solid #dce7e3;border-radius:28rpx;background:rgba(255,255,255,.78)}
.api-status{display:flex;align-items:center;gap:10rpx}.api-status b{font-size:24rpx}
.api-dot{width:14rpx;height:14rpx;border-radius:50%;background:#aab5b2}.api-dot.ok{background:#12a594;box-shadow:0 0 0 7rpx rgba(18,165,148,.12)}
.api-url{display:block;margin:14rpx 0;color:#657873;font-size:20rpx;line-height:1.5;word-break:break-all}
.api-test{padding:18rpx;border-radius:19rpx;background:#173f39;color:#fff;text-align:center;font-size:23rpx;font-weight:900}
.slider-mask{position:fixed;left:0;right:0;top:0;bottom:0;z-index:99;display:flex;align-items:center;justify-content:center;padding:30rpx;background:rgba(16,35,39,.52);backdrop-filter:blur(8rpx)}
.slider-panel{width:100%;max-width:720rpx;padding:24rpx;border:1rpx solid #e1e7e4;border-radius:28rpx;background:#fff;box-shadow:0 30rpx 80rpx rgba(16,44,39,.22)}
.slider-panel-head{display:flex;align-items:center;justify-content:space-between;gap:20rpx;margin-bottom:18rpx}
.slider-panel-head b,.slider-panel-head text{display:block}
.slider-panel-head b{color:#102c27;font-size:30rpx;font-weight:900}
.slider-panel-head text{margin-top:6rpx;color:#7d8c88;font-size:22rpx}
.slider-close{display:grid;width:52rpx;height:52rpx;place-items:center;border-radius:50%;background:#f2f5f3;color:#52635f;font-size:32rpx;font-weight:800}
</style>
