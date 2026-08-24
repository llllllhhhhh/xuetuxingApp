<template>
  <view v-if="captcha.enabled" class="slider-captcha">
    <view class="captcha-head">
      <view>
        <view class="captcha-title">{{ captcha.title }}</view>
        <view class="captcha-desc">{{ captcha.description }}</view>
      </view>
      <view class="captcha-refresh" @click="loadChallenge">刷新</view>
    </view>
    <view class="captcha-scene">
      <image class="captcha-image" :src="captcha.image" mode="aspectFill" />
      <view :class="['captcha-hole', captcha.shape]" :style="holeStyle"></view>
      <view :class="['captcha-piece', captcha.shape, { ok: verified }]" :style="pieceStyle"></view>
    </view>
    <view
      class="captcha-track"
      @touchstart.stop="startDrag"
      @touchmove.stop.prevent="moveDrag"
      @touchend.stop="endDrag"
      @mousedown.stop="startDrag"
      @mousemove.stop.prevent="moveDrag"
      @mouseup.stop="endDrag"
      @mouseleave.stop="cancelMouseDrag"
    >
      <view class="captcha-progress" :class="{ ok: verified }" :style="{ width: `${dragX + 48}px` }"></view>
      <view class="captcha-knob" :class="{ ok: verified }" :style="{ transform: `translateX(${dragX}px)` }">
        {{ verified ? '✓' : '›' }}
      </view>
      <text>{{ verified ? '验证通过' : '向右拖动滑块' }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { getSliderCaptcha, verifySliderCaptcha } from '../utils/api.js'

const props = defineProps({
  scope: { type: String, default: 'user' },
})
const emit = defineEmits(['verified', 'reset'])

const captcha = reactive({
  enabled: true,
  challenge_id: '',
  title: '拖动滑块完成验证',
  description: '请按住滑块，将缺口拼合后再登录。',
  image: '',
  shape: 'rounded',
  target_x: 160,
  piece_y: 60,
  piece_size: 42,
})
const dragX = ref(0)
const verified = ref(false)
const dragging = ref(false)
const startClientX = ref(0)
const startDragX = ref(0)
const verifying = ref(false)
const maxDrag = 272

const holeStyle = computed(() => ({
  left: `${captcha.target_x}px`,
  top: `${captcha.piece_y}px`,
  width: `${captcha.piece_size}px`,
  height: `${captcha.piece_size}px`,
}))
const pieceStyle = computed(() => ({
  transform: `translateX(${dragX.value}px)`,
  top: `${captcha.piece_y}px`,
  width: `${captcha.piece_size}px`,
  height: `${captcha.piece_size}px`,
  backgroundImage: `url(${captcha.image})`,
  backgroundPosition: `-${captcha.target_x}px -${captcha.piece_y}px`,
}))

const getClientX = event => event.touches?.[0]?.clientX ?? event.changedTouches?.[0]?.clientX ?? event.clientX ?? 0

const resetState = () => {
  dragX.value = 0
  verified.value = false
  dragging.value = false
  emit('reset')
}

const loadChallenge = async () => {
  resetState()
  const result = await getSliderCaptcha()
  Object.assign(captcha, result)
  if (!result.enabled) emit('verified', '__slider_disabled__')
}

const startDrag = event => {
  if (verified.value || verifying.value || !captcha.challenge_id) return
  dragging.value = true
  startClientX.value = getClientX(event)
  startDragX.value = dragX.value
}

const moveDrag = event => {
  if (!dragging.value || verified.value) return
  const delta = getClientX(event) - startClientX.value
  dragX.value = Math.max(0, Math.min(maxDrag, Math.round(startDragX.value + delta)))
}

const endDrag = async () => {
  if (!dragging.value || verified.value) return
  dragging.value = false
  verifying.value = true
  try {
    const result = await verifySliderCaptcha({
      challenge_id: captcha.challenge_id,
      x: dragX.value,
      scope: props.scope,
    })
    verified.value = true
    emit('verified', result.ticket || '')
    uni.showToast({ title: '验证通过', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: error.message || '验证失败，请重试', icon: 'none' })
    await loadChallenge()
  } finally {
    verifying.value = false
  }
}

const cancelMouseDrag = event => {
  if (event.type === 'mouseleave') endDrag()
}

onMounted(loadChallenge)
defineExpose({ loadChallenge, resetState })
</script>

<style scoped>
.slider-captcha{margin:8rpx 0 24rpx;padding:20rpx;border:1rpx solid #dfe9e5;border-radius:26rpx;background:#fff}
.captcha-head{display:flex;justify-content:space-between;gap:18rpx;margin-bottom:16rpx}
.captcha-title{font-size:25rpx;font-weight:900;color:#102c27}
.captcha-desc{margin-top:4rpx;font-size:20rpx;color:#7d8c88}
.captcha-refresh{flex:0 0 auto;color:#0d8f80;font-size:22rpx;font-weight:900}
.captcha-scene{position:relative;width:320px;height:150px;max-width:100%;overflow:hidden;border-radius:18rpx;background:#edf2ef}
.captcha-image{width:320px;height:150px;display:block}
.captcha-hole{position:absolute;border-radius:8px;background:rgba(0,0,0,.32);box-shadow:inset 0 0 0 2px rgba(255,255,255,.56)}
.captcha-piece{position:absolute;left:0;border-radius:8px;background-size:320px 150px;box-shadow:0 8px 18px rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.75)}
.captcha-hole.circle,.captcha-piece.circle{border-radius:999px}
.captcha-hole.square,.captcha-piece.square{border-radius:1px}
.captcha-hole.puzzle,.captcha-piece.puzzle{border-radius:8px;clip-path:polygon(0 0,62% 0,62% 24%,100% 24%,100% 76%,62% 76%,62% 100%,0 100%)}
.captcha-piece.ok{box-shadow:0 0 0 3px rgba(18,165,148,.3)}
.captcha-track{position:relative;width:320px;max-width:100%;height:48px;margin-top:14rpx;border-radius:999px;background:#eef3ef;overflow:hidden;display:flex;align-items:center;justify-content:center;color:#70827d;font-size:23rpx;font-weight:800;user-select:none}
.captcha-progress{position:absolute;left:0;top:0;height:100%;background:#dcefe4}
.captcha-progress.ok{background:#c9ff72}
.captcha-knob{position:absolute;left:0;top:0;width:48px;height:48px;border-radius:50%;background:#173f39;color:#fff;display:grid;place-items:center;font-size:28px;font-weight:900;z-index:2;box-shadow:0 6px 16px rgba(0,0,0,.18)}
.captcha-knob.ok{background:#0d8f80}
.captcha-track text{position:relative;z-index:1}
</style>
