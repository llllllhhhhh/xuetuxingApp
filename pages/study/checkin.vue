<template>
  <view class="page checkin-page">
    <view class="hero safe-top">
      <view>
        <text>LEARNING CHECK-IN</text>
        <b>学习签到日历</b>
        <small>{{ currentMonthLabel }} · 累计打卡 {{ profile.checkin_days || 0 }} 天</small>
      </view>
      <view :class="['today-pill', { done: checked }]">{{ checked ? '今日已签到' : '今日待签到' }}</view>
    </view>

    <view class="calendar-card">
      <view class="calendar-head">
        <view>
          <b>{{ currentMonthLabel }}</b>
          <text>橙色日期表示已签到</text>
        </view>
        <button :disabled="checked || checking" @tap="checkIn" @click="checkIn">
          {{ checked ? '已签到' : checking ? '签到中' : '立即签到' }}
        </button>
      </view>

      <view class="calendar-week">
        <text v-for="day in weekdays" :key="day">{{ day }}</text>
      </view>
      <view class="calendar-grid">
        <view
          v-for="day in calendarDays"
          :key="day.key"
          :class="['calendar-day', { muted: !day.inMonth, today: day.isToday, signed: day.signed, selected: day.key === selectedDateKey }]"
          @tap="selectDate(day)"
          @click="selectDate(day)"
        >
          <b>{{ day.day }}</b>
          <text v-if="day.signed">已签</text>
        </view>
      </view>
    </view>

    <view class="selected-card">
      <view>
        <b>{{ selectedDateText }}</b>
        <text>{{ selectedRecord ? selectedRecord.noteText : '当天没有签到记录' }}</text>
      </view>
      <view :class="['selected-state', { signed: !!selectedRecord }]">{{ selectedRecord ? '已签到' : '未签到' }}</view>
      <small v-if="selectedRecord">签到时间：{{ selectedRecord.clockText }}</small>
    </view>

    <view v-if="visibleRecords.length" class="record-card">
      <view class="section-head">
        <b>签到记录</b>
        <text>{{ visibleRecords.length }} 条</text>
      </view>
      <view v-if="!visibleRecords.length" class="empty">暂无签到记录，点击立即签到后会展示在这里。</view>
      <view v-for="item in visibleRecords" :key="item.key" class="record-row">
        <view class="record-dot"></view>
        <view>
          <b>{{ item.dateText }}</b>
          <text>{{ item.noteText }}</text>
        </view>
        <small>{{ item.clockText }}</small>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getLearningCenter, studyCheckIn } from '../../utils/api.js'

const profile = ref({})
const records = ref([])
const checked = ref(false)
const checking = ref(false)
const selectedDateKey = ref('')
const weekdays = ['日', '一', '二', '三', '四', '五', '六']
const now = new Date()

const pad = value => String(value).padStart(2, '0')
const dateKey = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
const parseDate = value => {
  if (!value) return null
  const text = String(value)
  const date = new Date(text.includes('T') || text.includes(' ') ? text : `${text}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}
const formatRecordDate = value => {
  const date = parseDate(value)
  return date ? `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日` : '--'
}
const formatClock = value => {
  const date = parseDate(value)
  return date ? date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '--'
}
const formatKeyDate = key => formatRecordDate(key)

const currentMonthLabel = computed(() => `${now.getFullYear()}年${now.getMonth() + 1}月`)
const visibleRecords = computed(() => {
  const seen = new Set()
  return (Array.isArray(records.value) ? records.value : [])
    .map((item, index) => {
      const rawDate = item.checkin_date || item.checkin_at || item.created_at || ''
      const keyDate = String(rawDate).slice(0, 10)
      if (!keyDate || seen.has(keyDate)) return null
      seen.add(keyDate)
      return {
        key: item.id ? `record-${item.id}` : `record-${keyDate}-${index}`,
        keyDate,
        dateText: formatRecordDate(rawDate),
        clockText: formatClock(item.checkin_at || item.created_at),
        noteText: '今日已完成学习签到',
        sortValue: parseDate(item.checkin_at || rawDate)?.getTime() || 0,
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.sortValue - a.sortValue)
})
const selectedRecord = computed(() => visibleRecords.value.find(item => item.keyDate === selectedDateKey.value) || null)
const selectedDateText = computed(() => formatKeyDate(selectedDateKey.value || dateKey(now)))
const signedDateSet = computed(() => {
  const set = new Set(visibleRecords.value.map(item => item.keyDate))
  if (checked.value) set.add(dateKey(now))
  return set
})
const calendarDays = computed(() => {
  const year = now.getFullYear()
  const month = now.getMonth()
  const first = new Date(year, month, 1)
  const start = new Date(year, month, 1 - first.getDay())
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const key = dateKey(date)
    return {
      key,
      day: date.getDate(),
      inMonth: date.getMonth() === month,
      isToday: key === dateKey(now),
      signed: signedDateSet.value.has(key),
    }
  })
})

const selectDate = day => {
  selectedDateKey.value = day.key
}

const buildTodayRecord = result => ({
  id: result?.record?.id || `local-${dateKey(now)}`,
  checkin_date: dateKey(now),
  checkin_at: result?.record?.checkin_at || new Date().toISOString(),
  checkin_days: result?.checkin_days || profile.value.checkin_days || 1,
  note: '今日已完成学习签到',
})

const load = async () => {
  try {
    const result = await getLearningCenter()
    profile.value = result.profile || {}
    records.value = result.checkin_records || []
    checked.value = !!result.profile?.checked_today
    if (checked.value && !records.value.some(item => String(item.checkin_date || item.checkin_at || '').slice(0, 10) === dateKey(now))) {
      records.value = [buildTodayRecord({ checkin_days: profile.value.checkin_days }), ...records.value]
    }
    selectedDateKey.value = dateKey(now)
  } catch (error) {
    uni.showToast({ title: error.message || '签到记录加载失败', icon: 'none' })
  }
}

const checkIn = async () => {
  if (checked.value || checking.value) return
  checking.value = true
  try {
    const result = await studyCheckIn()
    checked.value = true
    profile.value.checkin_days = result.checkin_days || profile.value.checkin_days || 1
    const record = result.record || buildTodayRecord(result)
    records.value = [record, ...records.value.filter(item => item.checkin_date !== record.checkin_date)]
    selectedDateKey.value = dateKey(now)
    getLearningCenter()
      .then(fresh => {
        profile.value = fresh.profile || profile.value
        records.value = fresh.checkin_records?.length ? fresh.checkin_records : records.value
        checked.value = !!fresh.profile?.checked_today || checked.value
      })
      .catch(() => {})
    uni.showToast({ title: result.message || '签到成功' })
  } catch (error) {
    uni.showToast({ title: error.message || '签到失败', icon: 'none' })
  } finally {
    checking.value = false
  }
}

onLoad(load)
</script>

<style scoped>
.checkin-page{min-height:100vh;background:#f3f6f4;color:#17332e;padding-bottom:40rpx}.hero{padding:38rpx 28rpx 34rpx;background:linear-gradient(145deg,#183e38,#0b7569);color:#fff;display:flex;align-items:flex-end;justify-content:space-between;gap:20rpx}.hero text,.hero b,.hero small{display:block}.hero text{color:#9ee1d7;font-size:18rpx;letter-spacing:2rpx}.hero b{margin-top:10rpx;font-size:42rpx}.hero small{margin-top:10rpx;color:rgba(255,255,255,.72);font-size:22rpx}.today-pill{flex:0 0 auto;padding:12rpx 18rpx;border-radius:999rpx;background:#fff3e9;color:#df6d2f;font-size:22rpx;font-weight:900}.today-pill.done{background:#ff7a35;color:#fff}.calendar-card,.record-card{margin:24rpx;padding:24rpx;border-radius:28rpx;background:#fff;border:1rpx solid #dfe9e5;box-shadow:0 12rpx 36rpx rgba(17,54,48,.08)}.calendar-head,.section-head{display:flex;align-items:center;justify-content:space-between;gap:18rpx;margin-bottom:22rpx}.calendar-head b,.calendar-head text,.section-head b,.section-head text{display:block}.calendar-head b,.section-head b{font-size:30rpx;color:#17332e}.calendar-head text,.section-head text{margin-top:6rpx;font-size:20rpx;color:#7f8f8b}.calendar-head button{border:0;border-radius:999rpx;background:#ff7a35;color:#fff;padding:14rpx 22rpx;font-size:22rpx;font-weight:900}.calendar-head button:disabled{background:#e4ebe8;color:#7f8f8b}.calendar-week,.calendar-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:8rpx}.calendar-week{margin-bottom:10rpx}.calendar-week text{text-align:center;color:#9aa8a4;font-size:19rpx}.calendar-day{height:78rpx;border-radius:18rpx;background:#f4f7f6;color:#425a55;display:flex;flex-direction:column;align-items:center;justify-content:center;border:1rpx solid transparent}.calendar-day b{font-size:24rpx}.calendar-day text{margin-top:2rpx;font-size:16rpx}.calendar-day.muted{opacity:.32}.calendar-day.today{border-color:#ff995f;background:#fff7f1}.calendar-day.signed{background:#ff7a35;color:#fff;box-shadow:0 8rpx 20rpx rgba(255,122,53,.24)}.calendar-day.signed.today{border-color:#ffd8bd;background:linear-gradient(135deg,#ff7a35,#ff9f68)}.empty{padding:46rpx 20rpx;border-radius:22rpx;background:#f8faf9;color:#84938f;text-align:center;font-size:23rpx}.record-row{display:flex;align-items:center;gap:18rpx;padding:22rpx 0;border-bottom:1rpx solid #edf1ef}.record-row:last-child{border-bottom:0}.record-dot{width:18rpx;height:18rpx;border-radius:50%;background:#ff7a35;box-shadow:0 0 0 8rpx #fff0e7;flex:0 0 auto}.record-row>view:nth-child(2){flex:1;min-width:0}.record-row b,.record-row text,.record-row small{display:block}.record-row b{font-size:26rpx;color:#17332e}.record-row text{margin-top:6rpx;color:#7f8f8b;font-size:21rpx}.record-row small{flex:0 0 auto;color:#9aa8a4;font-size:20rpx}
.hero{border-radius:0!important;margin:0!important}.calendar-day{cursor:pointer}.calendar-day.selected{box-shadow:0 0 0 4rpx rgba(23,63,57,.18);border-color:#173f39!important}.calendar-day.signed{background:#ff6b1a!important;color:#fff!important;border-color:#d94f00!important;box-shadow:0 10rpx 24rpx rgba(255,107,26,.34)!important}.calendar-day.signed b{font-size:26rpx;color:#fff}.calendar-day.signed text{color:#fff;background:rgba(255,255,255,.22);padding:2rpx 8rpx;border-radius:999rpx}.calendar-day.signed.today{background:linear-gradient(135deg,#ff5f0f,#ff8a3d)!important;border-color:#b84000!important;box-shadow:0 0 0 3rpx rgba(255,107,26,.22),0 12rpx 28rpx rgba(255,107,26,.38)!important}.calendar-day.today:not(.signed){background:#fff8f3;border-color:#ffb386;color:#c95718}.selected-card{margin:0 24rpx 24rpx;padding:24rpx;border-radius:24rpx;background:#fff;border:1rpx solid #dfe9e5;box-shadow:0 10rpx 30rpx rgba(17,54,48,.06);display:grid;grid-template-columns:1fr auto;gap:12rpx;align-items:center}.selected-card b,.selected-card text,.selected-card small{display:block}.selected-card b{font-size:28rpx;color:#17332e}.selected-card text{margin-top:6rpx;color:#7f8f8b;font-size:22rpx}.selected-card small{grid-column:1/-1;color:#a06a3b;font-size:21rpx}.selected-state{padding:10rpx 18rpx;border-radius:999rpx;background:#eef3f1;color:#7f8f8b;font-size:21rpx;font-weight:900}.selected-state.signed{background:#ff7a35;color:#fff}
</style>
