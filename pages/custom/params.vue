<template>
  <view class="page match-page">
    <view class="content">
      <view class="hero">
        <view>
          <text>智能定制</text>
          <b>按你的积分和偏好匹配路线</b>
          <small>优先从已上架、可兑换的旅游项目中筛选；没有合适路线时，可一键转人工定制。</small>
        </view>
      </view>

      <view class="form-card">
        <view class="form-section" v-for="field in fields" :key="field.key">
          <view class="section-head">
            <b>{{ field.label }}</b>
            <text>{{ field.multiple ? '可多选' : '单选' }}</text>
          </view>
          <view class="choice-grid">
            <view
              v-for="option in field.options"
              :key="option"
              :class="['choice', { on: field.selected.includes(option) }]"
              @click="toggleOption(field, option)"
            >
              {{ option }}
            </view>
          </view>
        </view>

        <view class="form-section">
          <view class="section-head">
            <b>积分预算</b>
            <text>{{ budget }} 积分/人以内</text>
          </view>
          <slider
            :value="budget"
            min="1000"
            max="10000"
            step="500"
            activeColor="#11998e"
            backgroundColor="#dfe9e5"
            block-color="#11998e"
            @change="onBudgetChange"
          />
          <view class="budget-row">
            <text>1,000</text>
            <text>5,000</text>
            <text>10,000+</text>
          </view>
        </view>

        <view class="input-grid">
          <label>
            <text>出发城市</text>
            <input v-model.trim="extra.departureCity" placeholder="例如：广州 / 济南" />
          </label>
          <label>
            <text>期望时间</text>
            <input v-model.trim="extra.travelTime" placeholder="例如：7 月中旬" />
          </label>
        </view>

        <view class="group-row" @click="extra.acceptGroup = !extra.acceptGroup">
          <view>
            <b>接受平台拼团</b>
            <text>接受拼团时，会优先推荐库存更充足、成团率更高的路线。</text>
          </view>
          <view :class="['switch', { on: extra.acceptGroup }]"><i></i></view>
        </view>

        <view class="form-section last">
          <view class="section-head">
            <b>补充偏好</b>
            <text>选填</text>
          </view>
          <textarea v-model.trim="extra.note" maxlength="300" placeholder="例如：想要旅拍、住宿安静、不要太赶、有人不能吃辣"></textarea>
        </view>
      </view>
    </view>

    <view class="fixed-action">
      <view class="btn btn-green" @click="matchRoutes">一键匹配路线</view>
    </view>
  </view>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getTravelMatchSettings } from '../../utils/api.js'

const MATCH_STORAGE_KEY = 'customRouteMatchParams'

const budget = ref(4000)
const fields = reactive([
  {
    key: 'destinations',
    label: '目的地偏好',
    multiple: true,
    options: ['西南秘境', '海滨城市', '西北旷野', '江南古镇'],
    selected: ['西南秘境'],
  },
  {
    key: 'days',
    label: '出行天数',
    multiple: false,
    options: ['2-3 天', '4-5 天', '6-7 天', '8 天以上'],
    selected: ['4-5 天'],
  },
  {
    key: 'themes',
    label: '旅行主题',
    multiple: true,
    options: ['户外徒步', '人文研学', '美食探索', '旅拍出片', '毕业团建', '亲子同行'],
    selected: ['户外徒步', '旅拍出片'],
  },
  {
    key: 'people',
    label: '出行人数',
    multiple: false,
    options: ['1 人', '2 人', '3-5 人', '6 人以上'],
    selected: ['2 人'],
  },
])

const extra = reactive({
  departureCity: '',
  travelTime: '',
  acceptGroup: true,
  note: '',
})

const toggleOption = (field, option) => {
  if (!field.multiple) {
    field.selected = [option]
    return
  }
  const index = field.selected.indexOf(option)
  if (index >= 0) field.selected.splice(index, 1)
  else field.selected.push(option)
}

const onBudgetChange = event => {
  budget.value = Number(event.detail?.value || budget.value)
}

const selected = key => fields.find(item => item.key === key)?.selected || []

const loadMatchOptions = async () => {
  const settings = await getTravelMatchSettings().catch(() => null)
  if (!settings) return
  const destinations = (settings.destinations || []).filter(item => item.enabled !== false && item.label).map(item => item.label)
  const themes = (settings.themes || []).filter(item => item.enabled !== false && item.label).map(item => item.label)
  const destinationField = fields.find(item => item.key === 'destinations')
  const themeField = fields.find(item => item.key === 'themes')
  if (destinations.length && destinationField) destinationField.options = destinations
  if (themes.length && themeField) themeField.options = themes
}

const restoreParams = () => {
  const saved = uni.getStorageSync(MATCH_STORAGE_KEY)
  if (!saved || typeof saved !== 'object') return
  fields.forEach(field => {
    if (field.key === 'destinations' && Array.isArray(saved.destinations)) field.selected = saved.destinations
    if (field.key === 'days' && saved.days) field.selected = [saved.days]
    if (field.key === 'themes' && Array.isArray(saved.themes)) field.selected = saved.themes
    if (field.key === 'people' && saved.people) field.selected = [saved.people]
  })
  budget.value = Number(saved.budget || budget.value)
  extra.departureCity = saved.departure_city || ''
  extra.travelTime = saved.travel_time || ''
  extra.acceptGroup = saved.accept_group !== false
  extra.note = saved.note || ''
}

const matchRoutes = () => {
  if (!selected('destinations').length) return uni.showToast({ title: '请选择目的地偏好', icon: 'none' })
  if (!selected('days').length) return uni.showToast({ title: '请选择出行天数', icon: 'none' })
  const payload = {
    destinations: selected('destinations'),
    days: selected('days')[0],
    themes: selected('themes'),
    people: selected('people')[0] || '',
    budget: budget.value,
    departure_city: extra.departureCity,
    travel_time: extra.travelTime,
    accept_group: extra.acceptGroup,
    note: extra.note,
    created_at: Date.now(),
  }
  uni.setStorageSync(MATCH_STORAGE_KEY, payload)
  uni.navigateTo({ url: '/pages/custom/match-result' })
}

onLoad(async () => {
  await loadMatchOptions()
  restoreParams()
})
</script>

<style scoped>
.match-page{min-height:100vh;padding-bottom:150rpx;background:#f4f7f5;color:#17332e}
.content{padding:24rpx}
.hero{padding:38rpx 34rpx;border-radius:0;background:linear-gradient(135deg,#133f39,#13a89b);color:#fff;box-shadow:0 18rpx 44rpx rgba(17,79,72,.18)}
.hero text,.hero b,.hero small{display:block}
.hero text{font-size:24rpx;font-weight:900;color:#c9fff5}
.hero b{margin-top:16rpx;font-size:46rpx;line-height:1.24}
.hero small{margin-top:16rpx;font-size:25rpx;line-height:1.7;color:rgba(255,255,255,.8)}
.form-card{margin-top:22rpx;padding:28rpx;border:1rpx solid #e0e9e5;border-radius:26rpx;background:#fff;box-shadow:0 12rpx 34rpx rgba(17,54,48,.06)}
.form-section{padding-bottom:28rpx;margin-bottom:28rpx;border-bottom:1rpx solid #edf2ef}
.form-section.last{padding-bottom:0;margin-bottom:0;border-bottom:0}
.section-head{display:flex;align-items:center;justify-content:space-between;gap:20rpx;margin-bottom:18rpx}
.section-head b{font-size:30rpx}
.section-head text{color:#7b8b87;font-size:23rpx;font-weight:800}
.choice-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14rpx}
.choice{height:78rpx;display:flex;align-items:center;justify-content:center;border:1rpx solid #dce7e3;border-radius:18rpx;background:#f7faf8;color:#657671;font-size:25rpx;font-weight:900}
.choice.on{border-color:#83d5ca;background:#e7f8f5;color:#078a7c;box-shadow:inset 0 0 0 1rpx #83d5ca}
.budget-row{display:flex;justify-content:space-between;color:#7b8b87;font-size:22rpx}
.input-grid{display:grid;grid-template-columns:1fr 1fr;gap:16rpx;margin-bottom:24rpx}
.input-grid label text{display:block;margin-bottom:10rpx;color:#425b55;font-size:24rpx;font-weight:900}
.input-grid input{height:78rpx;box-sizing:border-box;border:1rpx solid #dce7e3;border-radius:18rpx;background:#f8fbfa;padding:0 20rpx;font-size:25rpx}
.group-row{display:flex;align-items:center;justify-content:space-between;gap:18rpx;margin-bottom:28rpx;padding:22rpx;border-radius:20rpx;background:#f6faf8;border:1rpx solid #e1ebe7}
.group-row b,.group-row text{display:block}
.group-row b{font-size:27rpx}
.group-row text{margin-top:8rpx;color:#72837e;font-size:22rpx;line-height:1.5}
.switch{width:88rpx;height:48rpx;flex:0 0 88rpx;border-radius:999rpx;background:#cfdad6;padding:5rpx;box-sizing:border-box}
.switch i{display:block;width:38rpx;height:38rpx;border-radius:50%;background:#fff;transition:.2s}
.switch.on{background:#11998e}
.switch.on i{transform:translateX(40rpx)}
textarea{width:100%;min-height:170rpx;box-sizing:border-box;border:1rpx solid #dce7e3;border-radius:18rpx;background:#f8fbfa;padding:20rpx;font-size:25rpx;line-height:1.6}
.fixed-action{position:fixed;left:0;right:0;bottom:0;z-index:30;padding:18rpx 26rpx calc(18rpx + env(safe-area-inset-bottom));background:rgba(255,255,255,.96);border-top:1rpx solid #e4ece9}
.fixed-action .btn{height:88rpx;margin:0;border-radius:22rpx;display:flex;align-items:center;justify-content:center;font-size:29rpx;font-weight:900}
@media(max-width:360px){.choice-grid,.input-grid{grid-template-columns:1fr}.hero b{font-size:40rpx}}
</style>
