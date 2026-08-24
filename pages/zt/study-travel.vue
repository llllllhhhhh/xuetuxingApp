<template>
  <view class="page zt-page">
    <view class="zt-hero">
      <image class="zt-hero-image" :src="heroImage" mode="aspectFill" />
      <view class="zt-hero-shade"></view>

      <view class="zt-brand-row">
        <view class="zt-brand">
          <view class="zt-brand-mark">行</view>
          <view>
            <b>学徒行</b>
            <text>备考成长计划</text>
          </view>
        </view>
        <view class="zt-edition">
          <b>2026</b>
          <text>上岸计划</text>
        </view>
      </view>

      <view class="zt-hero-content">
        <view class="zt-hero-kicker">学习有节奏 · 坚持有回报</view>
        <view class="zt-hero-title">学徒行上岸<br />陪跑计划</view>
        <view class="zt-hero-subtitle">从今天的学习进度，到上岸后的第一场旅行。</view>
        <view class="zt-hero-proof">
          <text>每日签到</text>
          <text>精选服务</text>
          <text>积分旅行</text>
        </view>
        <view class="zt-hero-actions">
          <button class="zt-hero-primary" @click="scrollToLead">
            免费领取方案
            <text>→</text>
          </button>
          <button class="zt-hero-secondary" @click="goStudy">查看服务</button>
        </view>
      </view>
    </view>

    <view class="zt-trust-strip">
      <view v-for="(item, index) in trustItems" :key="item.label">
        <text class="zt-trust-index">0{{ index + 1 }}</text>
        <b>{{ item.value }}</b>
        <text>{{ item.label }}</text>
      </view>
    </view>

    <view class="zt-section zt-intro-section">
      <view class="zt-section-head">
        <text>START FROM TODAY</text>
        <b>先把今天学好，<br />再去看看更大的世界</b>
        <small>备考最难的不是开始，而是让每一天都知道自己为什么继续。</small>
      </view>

      <view class="zt-story-visual">
        <image :src="studyFocusImage" mode="aspectFill" />
        <view class="zt-story-copy">
          <text>DAY BY DAY</text>
          <b>把目标拆小</b>
          <small>签到一次、完成一节课、解决一个问题，都是靠近上岸的一步。</small>
        </view>
      </view>

      <view class="zt-pain-grid">
        <view v-for="(item, index) in painPoints" :key="item.title" class="zt-pain-card">
          <text>{{ item.mark }}</text>
          <b>{{ item.title }}</b>
          <small>{{ item.desc }}</small>
          <view>0{{ index + 1 }}</view>
        </view>
      </view>
    </view>

    <view class="zt-value-band">
      <view class="zt-value-title">
        <text>ONE GROWTH PLAN</text>
        <b>一套真正能走下去的<br />成长闭环</b>
      </view>
      <view class="zt-value-track">
        <view v-for="(item, index) in values" :key="item.title" class="zt-value-item">
          <view class="zt-value-node">{{ index + 1 }}</view>
          <view>
            <text>{{ item.mark }}</text>
            <b>{{ item.title }}</b>
            <small>{{ item.desc }}</small>
          </view>
        </view>
      </view>
      <view class="zt-value-note">不是空泛激励，是每天都能执行、每个阶段都能复盘的真实进度。</view>
      <button class="zt-light-button" @click="goCustom">
        智能匹配我的成长路线
        <text>→</text>
      </button>
    </view>

    <view class="zt-section zt-service-section">
      <view class="zt-section-head">
        <text>LEARNING SERVICE</text>
        <b>按你现在的阶段选，<br />不为用不到的内容买单</b>
        <small>社群、长期规划和资料服务，统一在学习中心查看与购买。</small>
      </view>

      <view class="zt-study-banner" @click="goStudy">
        <image :src="studyServiceImage" mode="aspectFill" />
        <view class="zt-study-banner-shade"></view>
        <view class="zt-study-banner-content">
          <text>学习服务中心</text>
          <b>资料、课程、社群<br />一次选清楚</b>
          <view>进入学习中心 <text>→</text></view>
        </view>
      </view>

      <view class="zt-service-list">
        <view
          v-for="item in plans"
          :key="item.title"
          class="zt-service-card"
          :class="`tone-${item.tone}`"
          @click="goStudy"
        >
          <view class="zt-service-mark">{{ item.mark }}</view>
          <view class="zt-service-main">
            <text>{{ item.badge }}</text>
            <b>{{ item.title }}</b>
            <small>{{ item.desc }}</small>
          </view>
          <view class="zt-service-action">
            <b>{{ item.price }}</b>
            <text>查看 →</text>
          </view>
        </view>
      </view>
    </view>

    <view class="zt-reward-band" @click="goPoints">
      <image class="zt-reward-image" :src="rewardImage" mode="aspectFill" />
      <view class="zt-reward-shade"></view>
      <view class="zt-reward-head">
        <text>POINTS TO JOURNEY</text>
        <view>100 积分起兑</view>
      </view>
      <view class="zt-reward-content">
        <b>把坚持，兑换成<br />一次真正的出发</b>
        <small>签到、购买学习服务、邀请好友都能按平台规则获得积分。</small>
        <view class="zt-route-tags">
          <text>雪山徒步</text>
          <text>海滨假日</text>
          <text>古城研学</text>
        </view>
        <view class="zt-reward-link">去积分兑换中心 <text>→</text></view>
      </view>
    </view>

    <view class="zt-section zt-flow-section">
      <view class="zt-section-head">
        <text>START IN 4 STEPS</text>
        <b>四步开启你的<br />学徒行计划</b>
      </view>
      <view class="zt-flow-grid">
        <view v-for="(item, index) in flows" :key="item.title" class="zt-flow-card">
          <view class="zt-flow-no">0{{ index + 1 }}</view>
          <text>{{ item.label }}</text>
          <b>{{ item.title }}</b>
          <small>{{ item.desc }}</small>
        </view>
      </view>
    </view>

    <view class="zt-belief-band">
      <view class="zt-belief-mark">行</view>
      <text>FOR EVERY SERIOUS DREAM</text>
      <b>不贩卖焦虑，<br />只陪你把目标拆成每一天。</b>
      <view class="zt-belief-rule"></view>
      <small>每日可执行 · 阶段可复盘 · 坚持有奖励</small>
    </view>

    <view id="lead-form" class="zt-section zt-lead-section">
      <view class="zt-lead-topline">
        <view>
          <text>JOIN THE PLAN</text>
          <b>30 秒领取方案</b>
        </view>
        <view class="zt-lead-badge">免费</view>
      </view>
      <text class="zt-lead-desc">留下基础目标，下一步进入智能定制，为你匹配更合适的学习与旅行路线。</text>
      <view class="zt-lead-form">
        <label>
          <text>你的称呼</text>
          <input v-model.trim="form.name" maxlength="20" placeholder="怎么称呼你" />
        </label>
        <label>
          <text>目标院校 / 专业</text>
          <input v-model.trim="form.target" maxlength="50" placeholder="例如：厦门大学 / 新闻传播" />
        </label>
        <label>
          <text>当前备考阶段</text>
          <picker :range="stages" @change="onStageChange">
            <view class="zt-picker" :class="{ selected: stage }">
              <text>{{ stage || '请选择当前阶段' }}</text>
              <text>⌄</text>
            </view>
          </picker>
        </label>
      </view>
      <button class="zt-submit" @click="submitLead">
        免费生成我的方案
        <text>→</text>
      </button>
      <text class="zt-lead-tip">提交后可继续补充目的地、天数和出行偏好。</text>
    </view>

  </view>
</template>

<script setup>
import { ref } from 'vue'

const heroImage = '/static/zt/study-travel-hero-v2.jpg'
const studyFocusImage = '/static/zt/study-focus-v3.jpg'
const studyServiceImage = '/static/zt/study-service-learning-v2.jpg'
const rewardImage = '/static/zt/study-travel-reward-v2.jpg'
const form = ref({ name: '', target: '' })
const stage = ref('')
const stages = ['刚开始了解', '基础学习中', '强化刷题中', '冲刺复试中']

const trustItems = [
  { value: '每日', label: '学习有记录' },
  { value: '3 种', label: '积分获取方式' },
  { value: '全程', label: '顾问持续跟进' },
]

const painPoints = [
  { mark: '稳', title: '节奏容易中断', desc: '把大目标拆成今天能完成的一小步。' },
  { mark: '清', title: '资料课程太乱', desc: '只选择当前阶段真正需要的服务。' },
  { mark: '奖', title: '长期缺少反馈', desc: '让每次坚持都积累成看得见的奖励。' },
]

const values = [
  { mark: 'LEARN', title: '学习有节奏', desc: '签到、计划和学习服务共同推进。' },
  { mark: 'GROW', title: '过程有人跟', desc: '课程、订单和规划问题都能联系顾问。' },
  { mark: 'TRAVEL', title: '坚持有回报', desc: '用积分兑换旅行，也能智能定制路线。' },
]

const plans = [
  { mark: '群', tone: 'mint', badge: '轻量入门', title: '督学社群', desc: '每日打卡 · 答疑提醒 · 阶段复盘', price: '¥9.9 起' },
  { mark: '课', tone: 'coral', badge: '长期进阶', title: '规划套餐', desc: '目标拆解 · 资料组合 · 学习路径', price: '分期可选' },
  { mark: '题', tone: 'yellow', badge: '考前冲刺', title: '精选资料包', desc: '真题解析 · 冲刺清单 · 复试材料', price: '即买即学' },
]

const flows = [
  { label: 'PROFILE', title: '完善目标', desc: '记录院校、专业与当前阶段。' },
  { label: 'SERVICE', title: '选择支持', desc: '按需求选择社群、套餐或资料。' },
  { label: 'CHECK IN', title: '每天积累', desc: '签到、购买和邀请获得积分。' },
  { label: 'JOURNEY', title: '兑换出发', desc: '兑换旅行或智能匹配路线。' },
]

const goStudy = () => uni.navigateTo({ url: '/pages/study/index' })
const goCustom = () => uni.navigateTo({ url: '/pages/custom/params' })
const goPoints = () => uni.navigateTo({ url: '/pages/points/exchange' })
const scrollToLead = () => uni.pageScrollTo({ selector: '#lead-form', duration: 320 })
const onStageChange = event => {
  stage.value = stages[Number(event.detail.value)] || ''
}

const submitLead = () => {
  if (!form.value.name) {
    uni.showToast({ title: '请填写你的称呼', icon: 'none' })
    return
  }
  if (!form.value.target) {
    uni.showToast({ title: '请填写目标院校或专业', icon: 'none' })
    return
  }
  if (!stage.value) {
    uni.showToast({ title: '请选择当前备考阶段', icon: 'none' })
    return
  }

  uni.setStorageSync('ztLeadDraft', {
    ...form.value,
    stage: stage.value,
    createdAt: Date.now(),
  })
  uni.navigateTo({ url: '/pages/custom/params' })
}
</script>

<style scoped>
.zt-page {
  min-height: 100vh;
  padding-bottom: 0;
  overflow: hidden;
  background: #f2f5f1;
  color: #112e28;
  letter-spacing: 0;
}

.zt-hero {
  position: relative;
  height: 410px;
  overflow: hidden;
  border-radius: 0 !important;
  background: #173f38;
}

.zt-hero-image,
.zt-reward-image {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}

.zt-hero-image {
  transform: scale(1.01);
}

.zt-hero-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(10, 28, 24, .12), rgba(10, 28, 24, .24) 32%, rgba(10, 28, 24, .94));
}

.zt-brand-row {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  color: #fff;
}

.zt-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.zt-brand-mark {
  display: flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  background: #ff7440;
  color: #fff;
  font-size: 17px;
  font-weight: 900;
  box-shadow: 0 7px 18px rgba(42, 26, 17, .22);
}

.zt-brand b,
.zt-brand text,
.zt-edition b,
.zt-edition text {
  display: block;
}

.zt-brand b {
  font-size: 16px;
}

.zt-brand text {
  margin-top: 2px;
  color: rgba(255, 255, 255, .72);
  font-size: 10px;
}

.zt-edition {
  padding-left: 13px;
  border-left: 1px solid rgba(255, 255, 255, .44);
  text-align: right;
}

.zt-edition b {
  font-size: 13px;
}

.zt-edition text {
  margin-top: 2px;
  color: rgba(255, 255, 255, .68);
  font-size: 9px;
}

.zt-hero-content {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  padding: 20px 20px 25px;
  color: #fff;
}

.zt-hero-kicker {
  display: inline-block;
  padding: 6px 9px;
  border-left: 3px solid #ff7440;
  background: rgba(17, 56, 49, .54);
  color: #b8eee4;
  font-size: 11px;
  font-weight: 800;
}

.zt-hero-title {
  width: auto;
  margin-top: 12px;
  font-size: 42px;
  font-weight: 900;
  line-height: 1.08;
}

.zt-hero-subtitle {
  margin-top: 10px;
  color: rgba(255, 255, 255, .82);
  font-size: 14px;
  line-height: 1.55;
}

.zt-hero-proof {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 14px;
}

.zt-hero-proof text {
  padding: 5px 9px;
  border: 1px solid rgba(255, 255, 255, .28);
  border-radius: 5px;
  background: rgba(7, 37, 32, .35);
  color: rgba(255, 255, 255, .85);
  font-size: 10px;
}

.zt-hero-actions {
  display: grid;
  grid-template-columns: 1.45fr 1fr;
  gap: 10px;
  margin-top: 17px;
}

.zt-hero-primary,
.zt-hero-secondary,
.zt-light-button,
.zt-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 6px;
  font-weight: 800;
  letter-spacing: 0;
}

.zt-hero-primary::after,
.zt-hero-secondary::after,
.zt-light-button::after,
.zt-submit::after {
  border: 0;
}

.zt-hero-primary,
.zt-hero-secondary {
  height: 48px;
  margin: 0;
  font-size: 14px;
}

.zt-hero-primary {
  gap: 9px;
  background: #ff7440;
  color: #fff;
  box-shadow: 0 12px 24px rgba(255, 91, 34, .25);
}

.zt-hero-primary text,
.zt-light-button text,
.zt-submit text {
  font-size: 18px;
}

.zt-hero-secondary {
  border: 1px solid rgba(255, 255, 255, .54);
  background: rgba(255, 255, 255, .1);
  color: #fff;
}

.zt-trust-strip {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-top: 1px solid #edf1ef;
  border-bottom: 1px solid #dfe6e2;
  background: #fff;
}

.zt-trust-strip > view {
  position: relative;
  min-height: 78px;
  padding: 15px 9px 13px;
  text-align: left;
}

.zt-trust-strip > view + view {
  border-left: 1px solid #e4eae7;
}

.zt-trust-strip b,
.zt-trust-strip > view > text {
  display: block;
}

.zt-trust-index {
  color: #a5b0ac;
  font-size: 8px;
  font-weight: 800;
}

.zt-trust-strip b {
  margin-top: 4px;
  color: #173f38;
  font-size: 18px;
}

.zt-trust-strip > view > text:last-child {
  margin-top: 3px;
  color: #788681;
  font-size: 9px;
}

.zt-section {
  padding: 48px 20px;
}

.zt-section-head > text,
.zt-section-head > b,
.zt-section-head > small {
  display: block;
}

.zt-section-head > text,
.zt-value-title > text {
  color: #138b7d;
  font-size: 10px;
  font-weight: 900;
}

.zt-section-head > b,
.zt-value-title > b {
  margin-top: 9px;
  font-size: 28px;
  line-height: 1.28;
}

.zt-section-head > small {
  margin-top: 11px;
  max-width: 460px;
  color: #71817c;
  font-size: 13px;
  line-height: 1.75;
}

.zt-intro-section {
  background: #f2f5f1;
}

.zt-story-visual {
  position: relative;
  min-height: 250px;
  margin-top: 28px;
  overflow: hidden;
  border-radius: 8px;
  background: #1b3043;
  box-shadow: 0 15px 35px rgba(17, 52, 45, .12);
}

.zt-story-visual image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transform: scale(1.01);
}

.zt-story-copy {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 76px 20px 20px;
  background: linear-gradient(180deg, rgba(18, 36, 49, 0) 0%, rgba(18, 40, 54, .86) 66%, rgba(18, 40, 54, .96) 100%);
  color: #fff;
}

.zt-story-copy text,
.zt-story-copy b,
.zt-story-copy small {
  display: block;
}

.zt-story-copy text {
  color: #ffd36f;
  font-size: 9px;
  font-weight: 900;
}

.zt-story-copy b {
  margin-top: 8px;
  font-size: 19px;
}

.zt-story-copy small {
  margin-top: 9px;
  max-width: 430px;
  color: rgba(255, 255, 255, .88);
  font-size: 10px;
  line-height: 1.65;
}

.zt-pain-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 12px;
}

.zt-pain-card {
  position: relative;
  min-height: 142px;
  padding: 16px;
  overflow: hidden;
  border: 1px solid #dce4e0;
  border-radius: 8px;
  background: #fff;
}

.zt-pain-card:last-child {
  grid-column: 1 / -1;
  min-height: 116px;
}

.zt-pain-card > text {
  display: flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  background: #e1f2ee;
  color: #147d70;
  font-size: 12px;
  font-weight: 900;
}

.zt-pain-card:nth-child(2) > text {
  background: #fff0e8;
  color: #e45f2e;
}

.zt-pain-card:nth-child(3) > text {
  background: #fff5cc;
  color: #9b7614;
}

.zt-pain-card b,
.zt-pain-card small {
  display: block;
  position: relative;
  z-index: 1;
}

.zt-pain-card b {
  margin-top: 13px;
  font-size: 15px;
}

.zt-pain-card small {
  margin-top: 7px;
  color: #76847f;
  font-size: 10px;
  line-height: 1.6;
}

.zt-pain-card > view {
  position: absolute;
  right: 10px;
  bottom: -8px;
  color: #eef2f0;
  font-size: 42px;
  font-weight: 900;
}

.zt-value-band {
  position: relative;
  overflow: hidden;
  padding: 50px 20px;
  background-color: #2c3858;
  background-image:
    linear-gradient(180deg, rgba(35, 47, 76, .62) 0%, rgba(25, 32, 53, .87) 100%),
    url('/static/zt/growth-sunrise-v2.jpg');
  background-position: 38% center;
  background-size: cover;
  box-shadow:
    inset 0 1px rgba(255, 255, 255, .18),
    inset 0 -1px rgba(19, 27, 47, .22);
  color: #fff;
}

.zt-value-title > text {
  color: #ffd36f;
}

.zt-value-title > b {
  display: block;
  color: #fff;
}

.zt-value-track {
  position: relative;
  margin-top: 31px;
}

.zt-value-track::before {
  position: absolute;
  top: 21px;
  bottom: 21px;
  left: 20px;
  width: 1px;
  background: rgba(255, 255, 255, .22);
  content: '';
}

.zt-value-item {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 42px 1fr;
  gap: 15px;
  padding: 12px 0 20px;
}

.zt-value-node {
  display: flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border: 2px solid #ff8c61;
  border-radius: 50%;
  background: #fff;
  color: #263a64;
  font-size: 12px;
  font-weight: 900;
  box-shadow: 0 6px 18px rgba(12, 20, 38, .22);
}

.zt-value-item text,
.zt-value-item b,
.zt-value-item small {
  display: block;
}

.zt-value-item text {
  color: #b8d9ff;
  font-size: 8px;
  font-weight: 900;
}

.zt-value-item b {
  margin-top: 5px;
  font-size: 17px;
}

.zt-value-item small {
  margin-top: 6px;
  color: rgba(255, 255, 255, .65);
  font-size: 11px;
  line-height: 1.6;
}

.zt-value-note {
  padding: 14px;
  border-left: 3px solid #ffd36f;
  background: rgba(18, 25, 45, .4);
  backdrop-filter: blur(6px);
  color: #fff;
  font-size: 11px;
  line-height: 1.65;
}

.zt-light-button {
  width: 100%;
  height: 48px;
  margin-top: 20px;
  gap: 9px;
  background: #fff;
  color: #24365f;
  font-size: 14px;
  box-shadow: 0 8px 24px rgba(14, 23, 43, .16);
}

.zt-service-section {
  background: #fff;
}

.zt-study-banner {
  position: relative;
  height: 210px;
  margin-top: 28px;
  overflow: hidden;
  border-radius: 8px;
}

.zt-study-banner image {
  width: 100%;
  height: 100%;
  object-position: center 48%;
}

.zt-study-banner-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(30, 39, 68, .94) 0%, rgba(39, 52, 91, .72) 48%, rgba(39, 52, 91, .08) 100%);
}

.zt-study-banner-content {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  display: flex;
  width: 68%;
  flex-direction: column;
  justify-content: center;
  padding: 22px;
  color: #fff;
}

.zt-study-banner-content > text {
  color: #ffd36f;
  font-size: 10px;
  font-weight: 900;
}

.zt-study-banner-content > b {
  margin-top: 9px;
  font-size: 22px;
  line-height: 1.35;
}

.zt-study-banner-content > view {
  display: inline-flex;
  width: max-content;
  align-items: center;
  gap: 7px;
  margin-top: 18px;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(255, 255, 255, .62);
  font-size: 11px;
  font-weight: 800;
}

.zt-service-list {
  display: grid;
  gap: 0;
  margin-top: 12px;
  overflow: hidden;
  border: 1px solid #dfe6e3;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 10px 28px rgba(24, 61, 54, .07);
}

.zt-service-card {
  display: grid;
  grid-template-columns: 42px 1fr auto;
  gap: 14px;
  align-items: center;
  min-height: 88px;
  padding: 15px 16px;
  border: 0;
  border-bottom: 1px solid #e7edea;
  border-radius: 0;
  background: #fff;
  box-shadow: none;
}

.zt-service-card:last-child {
  border-bottom: 0;
}

.zt-service-mark {
  display: flex;
  width: 42px;
  height: 42px;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  background: #e2f2ee;
  color: #13796d;
  font-size: 14px;
  font-weight: 900;
}

.tone-coral .zt-service-mark {
  background: #fff0e8;
  color: #e35e2d;
}

.tone-yellow .zt-service-mark {
  background: #fff5cc;
  color: #9a7412;
}

.zt-service-main {
  min-width: 0;
}

.zt-service-main text,
.zt-service-main b,
.zt-service-main small,
.zt-service-action b,
.zt-service-action text {
  display: block;
}

.zt-service-main text {
  color: #159183;
  font-size: 8px;
  font-weight: 900;
}

.zt-service-main b {
  margin-top: 4px;
  font-size: 15px;
}

.zt-service-main small {
  margin-top: 5px;
  overflow: hidden;
  color: #768580;
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.zt-service-action {
  text-align: right;
}

.zt-service-action b {
  color: #e65f2f;
  font-size: 12px;
}

.zt-service-action text {
  margin-top: 8px;
  color: #60726d;
  font-size: 9px;
}

.zt-reward-band {
  position: relative;
  height: 390px;
  overflow: hidden;
  border-radius: 0;
  color: #fff;
}

.zt-reward-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(13, 37, 32, .1), rgba(13, 37, 32, .24) 38%, rgba(13, 37, 32, .91));
}

.zt-reward-head {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
}

.zt-reward-head > text {
  color: rgba(255, 255, 255, .72);
  font-size: 9px;
  font-weight: 900;
}

.zt-reward-head > view {
  padding: 7px 10px;
  border: 1px solid rgba(255, 255, 255, .5);
  border-radius: 5px;
  background: rgba(18, 56, 49, .3);
  font-size: 10px;
  font-weight: 800;
}

.zt-reward-content {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 32px 20px;
}

.zt-reward-content > b,
.zt-reward-content > small {
  display: block;
}

.zt-reward-content > b {
  font-size: 29px;
  line-height: 1.28;
}

.zt-reward-content > small {
  margin-top: 11px;
  max-width: 430px;
  color: rgba(255, 255, 255, .75);
  font-size: 11px;
  line-height: 1.7;
}

.zt-route-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 16px;
}

.zt-route-tags text {
  padding: 6px 9px;
  border-radius: 5px;
  background: rgba(255, 255, 255, .16);
  font-size: 9px;
}

.zt-reward-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 19px;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(255, 255, 255, .62);
  font-size: 12px;
  font-weight: 800;
}

.zt-flow-section {
  background: #f2f5f1;
}

.zt-flow-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 28px;
}

.zt-flow-card {
  min-height: 150px;
  padding: 17px;
  border: 1px solid #dbe4df;
  border-radius: 8px;
  background: #fff;
}

.zt-flow-no,
.zt-flow-card > text,
.zt-flow-card > b,
.zt-flow-card > small {
  display: block;
}

.zt-flow-no {
  color: #ff7440;
  font-size: 17px;
  font-weight: 900;
}

.zt-flow-card > text {
  margin-top: 15px;
  color: #159183;
  font-size: 8px;
  font-weight: 900;
}

.zt-flow-card > b {
  margin-top: 4px;
  font-size: 16px;
}

.zt-flow-card > small {
  margin-top: 7px;
  color: #75847f;
  font-size: 10px;
  line-height: 1.6;
}

.zt-belief-band {
  position: relative;
  padding: 50px 20px;
  overflow: hidden;
  background: #f1ca57;
  color: #143830;
}

.zt-belief-mark {
  position: absolute;
  right: 15px;
  bottom: -31px;
  color: rgba(255, 255, 255, .38);
  font-size: 150px;
  font-weight: 900;
  line-height: 1;
}

.zt-belief-band > text,
.zt-belief-band > b,
.zt-belief-band > small {
  display: block;
  position: relative;
  z-index: 1;
}

.zt-belief-band > text {
  font-size: 9px;
  font-weight: 900;
}

.zt-belief-band > b {
  margin-top: 12px;
  max-width: 440px;
  font-size: 27px;
  line-height: 1.42;
}

.zt-belief-rule {
  position: relative;
  z-index: 1;
  width: 48px;
  height: 3px;
  margin-top: 20px;
  background: #ff7440;
}

.zt-belief-band > small {
  margin-top: 13px;
  font-size: 11px;
}

.zt-lead-section {
  background: #fff;
}

.zt-lead-topline {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.zt-lead-topline text,
.zt-lead-topline b {
  display: block;
}

.zt-lead-topline text {
  color: #159183;
  font-size: 10px;
  font-weight: 900;
}

.zt-lead-topline b {
  margin-top: 7px;
  font-size: 28px;
}

.zt-lead-badge {
  display: flex;
  width: 48px;
  height: 48px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #ff7440;
  color: #fff;
  font-size: 11px;
  font-weight: 900;
  box-shadow: 0 9px 22px rgba(255, 116, 64, .25);
}

.zt-lead-desc {
  display: block;
  margin-top: 12px;
  max-width: 450px;
  color: #71817c;
  font-size: 12px;
  line-height: 1.7;
}

.zt-lead-form {
  display: grid;
  gap: 13px;
  margin-top: 27px;
}

.zt-lead-form label > text {
  display: block;
  margin-bottom: 7px;
  color: #4e625c;
  font-size: 10px;
  font-weight: 800;
}

.zt-lead-form input,
.zt-picker {
  box-sizing: border-box;
  height: 48px;
  border: 1px solid #d5dfdb;
  border-radius: 6px;
  background: #f7f9f8;
  color: #173630;
  font-size: 12px;
}

.zt-lead-form input {
  padding: 0 14px;
}

.zt-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  color: #899692;
}

.zt-picker.selected {
  color: #173630;
}

.zt-submit {
  width: 100%;
  height: 50px;
  margin-top: 16px;
  gap: 9px;
  background: #173f38;
  color: #fff;
  font-size: 14px;
}

.zt-lead-tip {
  display: block;
  margin-top: 12px;
  color: #899692;
  font-size: 9px;
  text-align: center;
}

@media (max-width: 360px) {
  .zt-hero-title {
    font-size: 37px;
  }

  .zt-service-card {
    grid-template-columns: 42px 1fr;
  }

  .zt-service-action {
    grid-column: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    text-align: left;
  }
}

@media (min-width: 768px) {
  .zt-page {
    max-width: 600px;
    margin: 0 auto;
    box-shadow: 0 0 48px rgba(16, 46, 40, .12);
  }

}
</style>
