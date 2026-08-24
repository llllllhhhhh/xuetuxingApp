<template>
  <view class="onboarding-page">
    <view v-if="loading" class="loading-screen">
      <view class="brand-mark">行</view>
      <text>正在准备你的专属体验</text>
    </view>

    <template v-else>
      <view class="safe-top"></view>
      <view class="topbar">
        <view class="back-button" :class="{ hidden: stepIndex === 0 }" @click="previousStep">‹</view>
        <view class="progress-shell">
          <view class="progress-track"><view :style="{ width: `${progress}%` }"></view></view>
          <text>{{ stepIndex + 1 }} / {{ config.steps.length }}</text>
        </view>
        <view v-if="config.allowSkip" class="skip-button" @click="skip">跳过</view>
        <view v-else class="top-spacer"></view>
      </view>

      <scroll-view class="page-scroll" scroll-y>
        <view class="hero-media">
          <image :src="config.heroImage" mode="aspectFill"></image>
          <view class="hero-shade"></view>
          <view class="hero-copy">
            <text>{{ config.eyebrow }}</text>
            <b>{{ config.title }}</b>
            <p>{{ config.description }}</p>
          </view>
        </view>

        <view class="question-section">
          <view class="step-label">第 {{ stepIndex + 1 }} 步</view>
          <view class="question-title">{{ currentStep.title }}</view>
          <view class="question-description">{{ currentStep.description }}</view>

          <view class="option-list" :class="{ compact: currentStep.type === 'multiple' }">
            <view
              v-for="option in currentStep.options"
              :key="option"
              :class="['option-item', { selected: isSelected(option) }]"
              @click="toggleOption(option)"
            >
              <view class="option-copy">
                <text>{{ option }}</text>
              </view>
              <view class="select-mark">{{ isSelected(option) ? '✓' : '' }}</view>
            </view>
          </view>

          <view v-if="currentStep.type === 'multiple'" class="selection-count">
            已选择 {{ selectedCount }} / {{ currentStep.max }} 项
          </view>
          <view class="content-safe-space"></view>
        </view>
      </scroll-view>

      <view class="action-bar safe-bottom">
        <button class="continue-button" :disabled="!canContinue || submitting" @click="continueFlow">
          {{ submitting ? '正在保存...' : actionText }}
        </button>
      </view>
    </template>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { completeLearningOnboarding, getPublishedConfig, isLoggedIn } from '../../utils/api.js'
import {
  completeOnboardingLocally,
  getOnboardingDraft,
  markOnboardingSynced,
  normalizeOnboarding,
  isOnboardingCompleted,
  saveOnboardingDraft,
} from '../../utils/onboarding.js'

const loading = ref(true)
const submitting = ref(false)
const stepIndex = ref(0)
const config = ref(normalizeOnboarding())
const answers = reactive({})

const currentStep = computed(() => config.value.steps[stepIndex.value] || { options: [] })
const progress = computed(() => Math.round(((stepIndex.value + 1) / config.value.steps.length) * 100))
const selectedCount = computed(() => {
  const value = answers[currentStep.value.key]
  return Array.isArray(value) ? value.length : (value ? 1 : 0)
})
const canContinue = computed(() => !currentStep.value.required || selectedCount.value > 0)
const actionText = computed(() => stepIndex.value === config.value.steps.length - 1
  ? config.value.completionText
  : '下一步')

const goHome = () => uni.reLaunch({ url: '/pages/index/index' })

const load = async () => {
  const remote = await getPublishedConfig()
  config.value = normalizeOnboarding(remote?.onboarding)
  if (!config.value.enabled || isOnboardingCompleted(config.value.version)) {
    goHome()
    return
  }
  Object.assign(answers, getOnboardingDraft(config.value.version))
  loading.value = false
}

const isSelected = option => {
  const value = answers[currentStep.value.key]
  return Array.isArray(value) ? value.includes(option) : value === option
}

const toggleOption = option => {
  const step = currentStep.value
  if (step.type !== 'multiple') {
    answers[step.key] = option
    saveOnboardingDraft(config.value.version, { ...answers })
    return
  }
  const selected = Array.isArray(answers[step.key]) ? [...answers[step.key]] : []
  const index = selected.indexOf(option)
  if (index >= 0) selected.splice(index, 1)
  else if (selected.length >= Number(step.max || 1)) {
    uni.showToast({ title: `最多选择 ${step.max} 项`, icon: 'none' })
    return
  } else selected.push(option)
  answers[step.key] = selected
  saveOnboardingDraft(config.value.version, { ...answers })
}

const previousStep = () => {
  if (stepIndex.value > 0) stepIndex.value -= 1
}

const finish = async (skipped = false) => {
  submitting.value = true
  const result = completeOnboardingLocally({
    version: config.value.version,
    answers: { ...answers },
    skipped,
  })
  if (!skipped && isLoggedIn()) {
    try {
      await completeLearningOnboarding({ version: result.version, answers: result.answers })
      markOnboardingSynced(result.version)
    } catch {
      // Local completion remains authoritative; App.vue retries the profile sync later.
    }
  }
  goHome()
}

const continueFlow = () => {
  if (!canContinue.value || submitting.value) return
  if (stepIndex.value < config.value.steps.length - 1) {
    stepIndex.value += 1
    return
  }
  finish(false)
}

const skip = () => {
  uni.showModal({
    title: '跳过个性化设置？',
    content: '你仍可正常使用，之后可在学习中心补充学习目标。',
    confirmText: '确认跳过',
    success: result => result.confirm && finish(true),
  })
}

onLoad(load)
</script>

<style scoped>
.onboarding-page{height:100vh;background:#f4f7f5;color:#172c28;overflow:hidden}.loading-screen{height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22rpx;color:#6d7d79;font-size:23rpx}.brand-mark{width:92rpx;height:92rpx;border-radius:16rpx;background:#173f38;color:#fff;display:flex;align-items:center;justify-content:center;font-size:42rpx;font-weight:900;box-shadow:0 16rpx 34rpx rgba(23,63,56,.18)}.safe-top{height:var(--status-bar-height)}.topbar{height:96rpx;padding:0 26rpx;display:flex;align-items:center;gap:20rpx;background:#fff;border-bottom:1rpx solid #e4ebe8}.back-button,.skip-button,.top-spacer{flex:0 0 64rpx}.back-button{height:64rpx;display:flex;align-items:center;justify-content:center;font-size:56rpx;line-height:1;color:#263b36}.back-button.hidden{visibility:hidden}.skip-button{color:#657873;font-size:22rpx;text-align:right}.progress-shell{flex:1;display:flex;align-items:center;gap:16rpx}.progress-shell text{flex:0 0 auto;color:#6f807c;font-size:19rpx;font-weight:700}.progress-track{height:8rpx;flex:1;background:#e2e9e6;overflow:hidden}.progress-track view{height:100%;background:#0c927f;transition:width .25s ease}.page-scroll{height:calc(100vh - var(--status-bar-height) - 96rpx - 132rpx)}.hero-media{height:310rpx;position:relative;background:#173f38;overflow:hidden}.hero-media image{width:100%;height:100%}.hero-shade{position:absolute;inset:0;background:rgba(12,43,37,.52)}.hero-copy{position:absolute;left:34rpx;right:34rpx;bottom:30rpx;color:#fff}.hero-copy text,.hero-copy b,.hero-copy p{display:block}.hero-copy text{color:#aee0d6;font-size:19rpx;font-weight:800}.hero-copy b{margin-top:9rpx;font-size:36rpx;line-height:1.3}.hero-copy p{margin:10rpx 0 0;max-width:620rpx;color:rgba(255,255,255,.8);font-size:20rpx;line-height:1.55}.question-section{padding:34rpx 28rpx 0}.step-label{color:#0b8a78;font-size:20rpx;font-weight:800}.question-title{margin-top:9rpx;font-size:38rpx;line-height:1.35;font-weight:900}.question-description{margin-top:10rpx;color:#71817d;font-size:21rpx;line-height:1.6}.option-list{display:grid;gap:16rpx;margin-top:29rpx}.option-list.compact{grid-template-columns:repeat(2,minmax(0,1fr));gap:14rpx}.option-item{min-height:92rpx;padding:19rpx 21rpx;display:flex;align-items:center;gap:16rpx;border:2rpx solid #dfe7e4;background:#fff;box-shadow:0 8rpx 24rpx rgba(18,54,48,.045)}.option-item.selected{border-color:#0b927f;background:#edf8f5;box-shadow:0 8rpx 24rpx rgba(11,146,127,.09)}.option-copy{flex:1;min-width:0}.option-copy text{font-size:25rpx;line-height:1.35;font-weight:700;word-break:break-word}.option-item.selected .option-copy text{color:#087c6c}.select-mark{flex:0 0 34rpx;height:34rpx;border:2rpx solid #ccd7d3;display:flex;align-items:center;justify-content:center;color:#fff;font-size:20rpx;font-weight:900}.option-item.selected .select-mark{border-color:#0b927f;background:#0b927f}.option-list.compact .option-item{min-height:86rpx}.option-list.compact .option-copy text{font-size:23rpx}.selection-count{margin-top:18rpx;color:#768681;font-size:20rpx;text-align:right}.content-safe-space{height:36rpx}.action-bar{height:132rpx;padding:18rpx 28rpx;background:#fff;border-top:1rpx solid #e2e9e6}.continue-button{height:86rpx!important;margin:0!important;border:0!important;border-radius:8rpx!important;background:#f0783a!important;color:#fff!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:27rpx!important;font-weight:900!important;line-height:1!important;box-shadow:0 12rpx 28rpx rgba(240,120,58,.2)!important}.continue-button:after{border:0!important}.continue-button[disabled]{background:#cfd7d4!important;color:#fff!important;box-shadow:none!important;opacity:1!important}@media(min-width:700px){.onboarding-page{max-width:750px;margin:0 auto;box-shadow:0 0 45px rgba(19,54,48,.13)}}
</style>
