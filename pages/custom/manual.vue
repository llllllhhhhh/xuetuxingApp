<template>
  <view class="page custom-page">
    <view class="hero-card">
      <view class="hero-kicker">人工深度定制</view>
      <view class="hero-title">告诉我们你想去哪</view>
      <view class="hero-desc">提交后进入管理后台审核，审核通过后会生成专属旅行方案。</view>
    </view>

    <view class="content">
      <view class="card form-card">
        <view class="card-title">定制需求</view>
        <view class="sub intro">目的地、预算、人数越清楚，平台给出的方案越精准。</view>

        <view class="form-item">
          <view class="label">想去哪里 <text>*</text></view>
          <input class="input" v-model.trim="form.destination" placeholder="例如：川西、云南、泰山，或还没想好" />
        </view>
        <view class="form-item">
          <view class="label">出行时间</view>
          <input class="input" v-model.trim="form.travel_time" placeholder="例如：7 月中旬 / 考后第一周" />
        </view>
        <view class="form-item">
          <view class="label">旅行天数</view>
          <input class="input" v-model.trim="form.days" placeholder="例如：3 天 2 夜 / 5 天" />
        </view>
        <view class="form-item">
          <view class="label">积分预算</view>
          <input class="input" v-model.trim="form.budget" placeholder="例如：3000-5000 积分 / 暂不确定" />
        </view>
        <view class="form-item">
          <view class="label">出行人数</view>
          <input class="input" v-model.trim="form.people_count" placeholder="例如：2 人 / 毕业团建 12 人" />
        </view>

        <view class="form-item">
          <view class="label">特殊需求</view>
          <view class="choices">
            <view
              v-for="tag in tags"
              :key="tag"
              class="choice"
              :class="{ on: form.special_tags.includes(tag) }"
              @click="toggle(tag)"
            >
              {{ tag }}
            </view>
          </view>
        </view>

        <view class="form-item">
          <view class="label">补充说明</view>
          <textarea
            class="input textarea"
            v-model.trim="form.note"
            placeholder="例如：想看日出、住宿要安静、有人不能吃辣、希望安排旅拍……"
          ></textarea>
        </view>
      </view>
    </view>

    <view class="fixed-action">
      <view class="btn btn-primary" :class="{ disabled: submitting }" @click="submit">
        {{ submitting ? '提交中...' : '提交定制需求' }}
      </view>
    </view>
  </view>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { isLoggedIn, submitCustomTravelRequest } from '../../utils/api.js'

const MANUAL_STORAGE_KEY = 'customManualPrefill'
const submitting = ref(false)
const tags = reactive(['毕业团建', '纪念日', '小众路线', '亲子同行', '摄影旅拍', '非遗体验'])
const form = reactive({
  destination: '',
  travel_time: '',
  days: '',
  budget: '',
  people_count: '',
  special_tags: [],
  note: '',
})

const toggle = tag => {
  const index = form.special_tags.indexOf(tag)
  if (index >= 0) form.special_tags.splice(index, 1)
  else form.special_tags.push(tag)
}

const applyPrefill = preset => {
  if (!preset || typeof preset !== 'object') return
  form.destination = preset.destination || form.destination
  form.travel_time = preset.travel_time || form.travel_time
  form.days = preset.days || form.days
  form.budget = preset.budget || form.budget
  form.people_count = preset.people_count || form.people_count
  form.note = preset.note || form.note
  const incomingTags = Array.isArray(preset.special_tags) ? preset.special_tags : []
  incomingTags.forEach(tag => {
    if (tag && !form.special_tags.includes(tag)) form.special_tags.push(tag)
    if (tag && !tags.includes(tag)) tags.push(tag)
  })
}

const submit = async () => {
  if (!isLoggedIn()) {
    uni.showToast({ title: '请先登录后提交', icon: 'none' })
    setTimeout(() => uni.navigateTo({ url: '/pages/auth/login' }), 500)
    return
  }
  if (!form.destination) {
    uni.showToast({ title: '请填写想去哪里', icon: 'none' })
    return
  }
  if (submitting.value) return
  submitting.value = true
  try {
    const saved = await submitCustomTravelRequest({ ...form })
    uni.showModal({
      title: '需求提交成功',
      content: '平台会在后台审核并生成专属方案，通过后可在方案页查看。',
      showCancel: false,
      success: () => uni.redirectTo({ url: `/pages/custom/preview?id=${saved.id}` }),
    })
  } catch (error) {
    uni.showToast({ title: error.message || '提交失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

onLoad(query => {
  if (query?.prefill) applyPrefill(uni.getStorageSync(MANUAL_STORAGE_KEY))
})
</script>

<style scoped>
.custom-page {
  padding-bottom: 150rpx;
}

.hero-card {
  margin: 24rpx 28rpx 0;
  padding: 38rpx 34rpx;
  border-radius: 34rpx;
  color: #fff;
  background: linear-gradient(135deg, #173f38, #2f746b);
  box-shadow: 0 22rpx 46rpx rgba(23, 63, 56, .22);
}

.hero-kicker {
  display: inline-flex;
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  color: #173f38;
  background: #fff4eb;
  font-size: 24rpx;
  font-weight: 900;
}

.hero-title {
  margin-top: 26rpx;
  font-size: 44rpx;
  font-weight: 900;
}

.hero-desc {
  margin-top: 14rpx;
  color: rgba(255,255,255,.76);
  line-height: 1.7;
}

.intro {
  line-height: 1.7;
  margin: -8rpx 0 30rpx;
}

.label text {
  color: #f07b3f;
}

.choices {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.choice {
  padding: 16rpx 24rpx;
  border-radius: 999rpx;
  background: #f4f7f5;
  color: #5c6b68;
  font-weight: 800;
  border: 1rpx solid #e3ebe7;
}

.choice.on {
  color: #173f38;
  background: #dff5ef;
  border-color: #9edbd0;
}

.textarea {
  min-height: 190rpx;
  padding-top: 22rpx;
}

.btn.disabled {
  opacity: .7;
  pointer-events: none;
}
</style>
