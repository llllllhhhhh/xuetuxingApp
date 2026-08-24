<template>
  <view class="page">
    <view class="content">
      <view class="status-card">
        <view class="title-row">
          <view class="tag tag-orange">旅行权益</view>
          <text class="sub">{{ orders.length ? `${orders.length} 个订单` : '等待解锁' }}</text>
        </view>
        <view class="status-title">我的旅行与合同</view>
        <view class="progress"><view class="progress-in" :style="{ width: progressWidth }" /></view>
        <view class="title-row sub"><text>合同签署进度 {{ signedCount }}/{{ orders.length || 1 }}</text><text>平台审核后生效</text></view>
      </view>

      <view class="tabs">
        <view v-for="(item, index) in tabs" :key="item" class="tab" :class="{ on: tab === index }" @click="tab = index">{{ item }}</view>
      </view>

      <view v-if="loading" class="empty"><view>...</view><b>订单加载中</b><text>正在同步你的旅行订单</text></view>

      <template v-else>
        <view v-if="tab === 0">
          <view v-if="pendingOrders.length">
            <view class="order card" v-for="order in pendingOrders" :key="order.id">
              <image :src="orderCoverImage(order)" mode="aspectFill" />
              <view class="order-main">
                <view class="tag tag-orange">{{ order.order_type }}</view>
                <b>{{ order.title }}</b>
                <text class="sub">{{ order.travel_date || '待确认日期' }} · {{ order.amount_text || '权益订单' }}</text>
                <view :class="['contract-state', contractClass(order)]">{{ contractText(order) }}</view>
                <view class="actions">
                  <view class="order-action" @click="openContract(order)">{{ contractActionText(order) }}</view>
                  <view v-if="order.contract_status === TRAVEL_CONTRACT_STATUS.APPROVED" class="order-action" @click="openFulfillment(order)">出行履约 →</view>
                  <view v-if="canCancelOrder(order)" class="order-action danger" @click="requestCancelOrder(order)">取消订单</view>
                </view>
              </view>
            </view>
          </view>
          <view v-else class="empty"><view>暂无</view><b>暂无待出行订单</b><text>旅行订单会在这里展示合同签署进度</text></view>
        </view>

        <view v-if="tab === 1">
          <view v-if="doneOrders.length">
            <view class="order card" v-for="order in doneOrders" :key="order.id">
              <image :src="orderCoverImage(order)" mode="aspectFill" />
              <view class="order-main">
                <view class="tag">{{ fulfillmentText(order) }}</view>
                <b>{{ order.title }}</b>
                <text class="sub">{{ order.travel_date || '已完成' }} · {{ order.amount_text || '权益订单' }}</text>
                <view :class="['contract-state', contractClass(order)]">{{ contractText(order) }}</view>
              </view>
            </view>
          </view>
          <view v-else class="empty"><view>暂无</view><b>还没有已完成的旅行</b><text>旅程结束后可生成旅行电子纪念内容</text></view>
        </view>

        <view v-if="tab === 2">
          <view class="order card" v-for="item in favs" :key="item.name" @click="go('/pages/custom/detail')">
            <image :src="item.img" mode="aspectFill" />
            <view class="order-main">
              <view class="tag">收藏路线</view>
              <b>{{ item.name }}</b>
              <text class="sub">{{ item.desc }}</text>
              <view class="order-action">查看路线 →</view>
            </view>
          </view>
        </view>
      </template>

      <view class="identity-demo card">
        <view class="card-title">合同签署说明</view>
        <view class="state"><b>待签署</b><text>确认出行信息后在线手写签名</text></view>
        <view class="state"><b>平台审核</b><text>审核通过后合同正式生效</text></view>
      </view>
    </view>

    <view v-if="contractVisible" class="contract-mask" @click.self="closeContract">
      <view class="contract-panel">
        <button class="close-btn" @click="closeContract">×</button>
        <view class="contract-head">
          <view>
            <text>旅行服务合同</text>
            <b>{{ selectedOrder?.title }}</b>
          </view>
        </view>

        <view class="contract-summary">
          <text>订单号：{{ selectedOrder?.order_no }}</text>
          <text>出行日期：{{ form.travel_date || selectedOrder?.travel_date || '待确认' }}</text>
          <text>服务方：{{ selectedOrder?.agency || '学徒行平台合作服务方' }}</text>
        </view>

        <view class="contract-history">
          <b>合同历史</b>
          <text v-for="item in contractHistory" :key="item.label">{{ item.label }}：{{ item.value }}</text>
        </view>

        <view :class="['date-section', { invalid: fieldErrors.travel_date }]">
          <b>选择出行日期</b>
          <text v-if="!readonlyContract" class="date-hint">可选择今天起 {{ contractTemplate.travel_date_days }} 天内的日期</text>
          <view v-if="!readonlyContract" class="date-options">
            <view
              v-for="item in travelDateOptions"
              :key="item"
              :class="['date-option', { on: form.travel_date === item }]"
              @click="selectTravelDate(item)"
            >
              {{ item }}
            </view>
          </view>
          <text v-else>{{ form.travel_date || '待确认' }}</text>
        </view>

        <view class="contract-terms contract-content">
          <b>合同内容</b>
          <text>{{ contractContent }}</text>
        </view>

        <view class="form-grid">
          <label :class="{ invalid: fieldErrors.signer_name }"><text>签署人姓名</text><input v-model.trim="form.signer_name" :disabled="readonlyContract" placeholder="请输入真实姓名" @input="clearContractError" /></label>
          <label :class="{ invalid: fieldErrors.signer_phone }"><text>联系电话</text><input v-model.trim="form.signer_phone" :disabled="readonlyContract" placeholder="请输入手机号" @input="clearContractError" /></label>
          <label :class="{ invalid: fieldErrors.id_no }"><text>证件号码</text><input v-model.trim="form.id_no" :disabled="readonlyContract" placeholder="请输入证件号码" @input="clearContractError" /></label>
        </view>

        <view v-if="!readonlyContract" class="contract-terms">
          <b>签署确认</b>
          <text>本人已确认订单信息、出行日期、服务内容与平台规则，同意以电子签名方式签署本旅行服务合同。提交后合同进入平台审核，审核通过后生效。</text>
        </view>

        <view v-if="readonlyContract && contractSignatureImage(selectedOrder)" class="signature-preview">
          <b>已提交签名</b>
          <image :src="contractSignatureImage(selectedOrder)" mode="aspectFit" />
        </view>

        <view v-else class="signature-box">
          <view class="signature-title"><b>手写签名</b><text @click="clearSignature">清空</text></view>
          <view class="signature-pad-wrap">
            <canvas
              id="contractSignaturePad"
              canvas-id="contractSignaturePad"
              class="signature-canvas"
              @touchstart.stop.prevent="startSign"
              @touchmove.stop.prevent="moveSign"
              @touchend.stop.prevent="endSign"
              @touchcancel.stop.prevent="endSign"
              @mousedown="startSign"
              @mousemove="moveSign"
              @mouseup="endSign"
              @mouseleave="endSign"
            ></canvas>
            <image v-if="signaturePreviewSvg" class="signature-preview-layer" :src="signaturePreviewSvg" mode="scaleToFill" />
          </view>
        </view>

        <view v-if="selectedOrder?.contract_status === TRAVEL_CONTRACT_STATUS.REJECTED" class="reject-box">驳回原因：{{ selectedOrder.contract_reject_reason || '请重新签署后提交审核' }}</view>
        <view v-if="contractError" class="contract-error">{{ contractError }}</view>

        <button v-if="!readonlyContract" class="submit-btn" :disabled="submitting" @click="submitContract">{{ submitting ? '提交中...' : '提交平台审核' }}</button>
        <view v-else class="contract-locked">当前合同状态：{{ contractText(selectedOrder) }}</view>
      </view>
    </view>

    <view v-if="fulfillmentVisible" class="contract-mask" @click.self="closeFulfillment">
      <view class="contract-panel">
        <button class="close-btn" @click="closeFulfillment">×</button>
        <view v-if="selectedOrder?.contract_status === TRAVEL_CONTRACT_STATUS.APPROVED" class="fulfillment-section">
          <view class="section-title">
            <b>出行履约</b>
            <text>{{ fulfillmentText(selectedOrder) }}</text>
          </view>

          <view class="fulfillment-flow">
            <text :class="stepClass(1)"><b>1</b>填写接送信息</text>
            <text :class="stepClass(2)"><b>2</b>平台安排接送</text>
            <text :class="stepClass(3)"><b>3</b>确认并生成核销码</text>
            <text :class="stepClass(4)"><b>4</b>出行核销</text>
          </view>

          <view class="fulfillment-status-card">
            <b>{{ fulfillmentStepTitle }}</b>
            <text>{{ fulfillmentStepDesc }}</text>
            <text class="status-tip">{{ fulfillmentQrTip }}</text>
          </view>

          <view v-if="canEditPickupInfo" class="pickup-form">
            <label :class="{ invalid: pickupFieldErrors.pickup_address }"><text>接送地址</text><input v-model.trim="pickupForm.pickup_address" placeholder="请输入接送地址" @input="clearPickupError" /></label>
            <label :class="{ invalid: pickupFieldErrors.pickup_detail }"><text>详细门牌 / 集合点</text><input v-model.trim="pickupForm.pickup_detail" placeholder="例如：东门保安亭 / 3 栋楼下" @input="clearPickupError" /></label>
            <view class="form-row">
              <label :class="{ invalid: pickupFieldErrors.traveler_count }"><text>出行人数</text><input v-model.number="pickupForm.traveler_count" type="number" min="1" @input="clearPickupError" /></label>
              <label :class="{ invalid: pickupFieldErrors.luggage_count }"><text>行李数量</text><input v-model.number="pickupForm.luggage_count" type="number" min="0" @input="clearPickupError" /></label>
            </view>
            <label :class="{ invalid: pickupFieldErrors.emergency_contact }"><text>紧急联系人</text><input v-model.trim="pickupForm.emergency_contact" placeholder="请输入联系人" @input="clearPickupError" /></label>
            <label :class="{ invalid: pickupFieldErrors.emergency_phone }"><text>紧急联系电话</text><input v-model.trim="pickupForm.emergency_phone" placeholder="请输入联系电话" @input="clearPickupError" /></label>
            <label><text>备注</text><input v-model.trim="pickupForm.pickup_note" placeholder="老人、小孩、晕车等特殊情况" /></label>
            <view v-if="pickupError" class="contract-error">{{ pickupError }}</view>
            <button class="submit-btn" :disabled="submittingPickup" @tap.stop="submitPickupInfo" @click.stop="submitPickupInfo">{{ submittingPickup ? '提交中...' : '提交接送信息' }}</button>
          </view>

          <view v-else class="pickup-card">
            <b>接送信息已提交</b>
            <text>地址：{{ selectedOrder.pickup_address || '-' }}</text>
            <text>详细：{{ selectedOrder.pickup_detail || '-' }}</text>
            <text>人数：{{ selectedOrder.traveler_count || 1 }} 人 · 行李 {{ selectedOrder.luggage_count || 0 }} 件</text>
            <text>紧急联系人：{{ selectedOrder.emergency_contact || '-' }} {{ selectedOrder.emergency_phone || '' }}</text>
            <text v-if="selectedOrder.pickup_note">备注：{{ selectedOrder.pickup_note }}</text>
          </view>

          <view v-if="hasPickupSchedule" class="pickup-card">
            <b>平台接送安排</b>
            <text>接送时间：{{ selectedOrder.pickup_time || '-' }}</text>
            <text>接送地点：{{ selectedOrder.pickup_location || '-' }}</text>
            <text>司机/接待：{{ selectedOrder.driver_name || '-' }} {{ selectedOrder.driver_phone || '' }}</text>
            <text>车牌号：{{ selectedOrder.vehicle_no || '-' }}</text>
            <text v-if="selectedOrder.pickup_notice">说明：{{ selectedOrder.pickup_notice }}</text>
            <button v-if="selectedOrder.fulfillment_status === TRAVEL_FULFILLMENT_STATUS.PICKUP_CONFIRMED" class="submit-btn" :disabled="confirmingPickup" @click="confirmPickup">{{ confirmingPickup ? '确认中...' : '确认接送安排并生成核销码' }}</button>
          </view>

          <view v-else-if="hasPickupInfo" class="pickup-card pending-card">
            <b>等待平台安排接送</b>
            <text>平台还没有填写接送时间、地点、车辆和联系人，所以这里暂时没有“确认接送安排”按钮。</text>
            <text>管理后台保存接送安排后，这里会出现“确认接送安排并生成核销码”按钮。</text>
          </view>

          <view v-if="hasQrToken" class="qr-card">
            <b>出行核销二维码</b>
            <image class="qr-image" :src="checkinQrUrl" mode="aspectFit" />
            <view class="qr-box" @click="copyCheckinToken">{{ selectedOrder.qr_token }}</view>
            <text v-if="selectedOrder.qr_expires_at">有效期至：{{ formatDateTime(selectedOrder.qr_expires_at) }}</text>
            <text>出行当天由工作人员扫码核销；扫码失败时可手动输入下方核销码。请勿提前转发给他人。</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, nextTick, reactive, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { cancelTravelOrder, confirmTravelPickup, getCurrentUser, getMyTravelOrders, getTravelContractTemplate, isLoggedIn, signTravelContract, submitTravelPickupInfo } from '../../utils/api.js'
import {
  TRAVEL_CONTRACT_STATUS,
  TRAVEL_FULFILLMENT_STATUS,
  isTravelFinished,
  isTravelLockedForPickupEdit,
  travelContractStatusName,
  travelFulfillmentStatusName,
} from '../../utils/orderStatus.js'

const tab = ref(0)
const loading = ref(false)
const submitting = ref(false)
const submittingPickup = ref(false)
const confirmingPickup = ref(false)
const contractVisible = ref(false)
const fulfillmentVisible = ref(false)
const orders = ref([])
const selectedOrder = ref(null)
const hasSignature = ref(false)
const signing = ref(false)
const lastPoint = ref(null)
const contractError = ref('')
const pickupError = ref('')
const tabs = ['待出行订单', '历史订单', '收藏路线']
const form = reactive({ signer_name: '', signer_phone: '', id_no: '', travel_date: '' })
const pickupForm = reactive({
  pickup_address: '',
  pickup_detail: '',
  traveler_count: 1,
  emergency_contact: '',
  emergency_phone: '',
  luggage_count: 0,
  pickup_note: '',
})
const contractTemplate = reactive({
  title: '旅行服务合同',
  content: '',
  travel_date_days: 30,
  travel_date_options: [],
})
const contractTemplateLoaded = ref(false)
const signatureStrokes = ref([])
const signatureSize = reactive({ width: 1, height: 1 })
const signatureRect = reactive({ left: 0, top: 0, width: 1, height: 1 })
let activeStroke = null

const favs = [
  { name: '川西雪山轻徒步', desc: '5天4夜 · 3680 积分', img: 'https://images.unsplash.com/photo-1464278533981-50106e6176b1?w=500' },
  { name: '大理治愈计划', desc: '4天3夜 · 2580 积分', img: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=500' },
]

const pendingOrders = computed(() => orders.value.filter(order => !isTravelFinished(order.fulfillment_status)))
const doneOrders = computed(() => orders.value.filter(order => isTravelFinished(order.fulfillment_status)))
const signedCount = computed(() => orders.value.filter(order => order.contract_status === TRAVEL_CONTRACT_STATUS.APPROVED).length)
const progressWidth = computed(() => `${Math.round((signedCount.value / Math.max(orders.value.length, 1)) * 100)}%`)
const readonlyContract = computed(() => [TRAVEL_CONTRACT_STATUS.PENDING, TRAVEL_CONTRACT_STATUS.APPROVED].includes(selectedOrder.value?.contract_status))
const hasPickupInfo = computed(() => !!selectedOrder.value?.pickup_address)
const hasPickupSchedule = computed(() => !!selectedOrder.value?.pickup_time)
const hasQrToken = computed(() => !!selectedOrder.value?.qr_token)
const userCancellableStatuses = new Set([
  TRAVEL_FULFILLMENT_STATUS.CONTRACT_PENDING,
  TRAVEL_FULFILLMENT_STATUS.CONTRACT_REVIEWING,
  TRAVEL_FULFILLMENT_STATUS.CONTRACT_REJECTED,
  TRAVEL_FULFILLMENT_STATUS.INFO_PENDING,
  TRAVEL_FULFILLMENT_STATUS.INFO_SUBMITTED,
])
const canCancelOrder = order => userCancellableStatuses.has(order?.fulfillment_status)
const formatDateTime = value => value ? String(value).replace('T', ' ').slice(0, 16) : '-'
const checkinPayload = computed(() => selectedOrder.value?.qr_token ? `xuetuxing-checkin://${selectedOrder.value.qr_token}` : '')
const checkinQrUrl = computed(() => checkinPayload.value
  ? `https://api.qrserver.com/v1/create-qr-code/?size=420x420&margin=12&data=${encodeURIComponent(checkinPayload.value)}`
  : '')
const canEditPickupInfo = computed(() => selectedOrder.value?.contract_status === TRAVEL_CONTRACT_STATUS.APPROVED && !isTravelLockedForPickupEdit(selectedOrder.value?.fulfillment_status))
const fulfillmentStepIndex = computed(() => {
  const status = selectedOrder.value?.fulfillment_status
  if ([TRAVEL_FULFILLMENT_STATUS.CHECKED_IN, TRAVEL_FULFILLMENT_STATUS.IN_TRIP, TRAVEL_FULFILLMENT_STATUS.COMPLETED].includes(status)) return 4
  if ([TRAVEL_FULFILLMENT_STATUS.PICKUP_CONFIRMED, TRAVEL_FULFILLMENT_STATUS.USER_CONFIRMED, TRAVEL_FULFILLMENT_STATUS.QR_ISSUED].includes(status) || hasQrToken.value) return 3
  if ([TRAVEL_FULFILLMENT_STATUS.INFO_SUBMITTED, TRAVEL_FULFILLMENT_STATUS.EXCEPTION].includes(status) || hasPickupInfo.value) return 2
  return 1
})
const stepClass = step => ({ on: fulfillmentStepIndex.value > step, current: fulfillmentStepIndex.value === step })
const fulfillmentStepTitle = computed(() => ({
  1: '当前步骤：填写接送信息',
  2: '当前步骤：平台安排接送',
  3: '当前步骤：确认接送安排',
  4: '当前步骤：出行核销',
})[fulfillmentStepIndex.value] || '当前步骤：填写接送信息')
const fulfillmentStepDesc = computed(() => ({
  1: '请先提交接送地址、人数、行李和紧急联系人。',
  2: '你的接送信息已提交，平台正在安排接送时间、地点、车辆和联系人。安排完成后会在下方显示。',
  3: '平台已给出接送安排，请确认无误。确认后系统会生成出行核销码。',
  4: '出行当天工作人员会使用核销码验证，核销后进入出行或完成状态。',
})[fulfillmentStepIndex.value] || '请先提交接送地址、人数、行李和紧急联系人。')
const fulfillmentQrTip = computed(() => hasQrToken.value
  ? '核销码已生成，在下方展示。'
  : '二维码/核销码会在平台安排接送后出现确认按钮，由你点击确认时生成。')
const travelDateOptions = computed(() => {
  const items = Array.isArray(contractTemplate.travel_date_options) ? contractTemplate.travel_date_options : []
  const current = selectedOrder.value?.travel_date || ''
  return [...new Set([current, ...items].filter(Boolean))]
})
const fieldErrors = computed(() => ({
  signer_name: !!contractError.value && !form.signer_name,
  signer_phone: !!contractError.value && !form.signer_phone,
  id_no: !!contractError.value && !form.id_no,
  travel_date: !!contractError.value && !form.travel_date,
}))
const pickupFieldErrors = computed(() => ({
  pickup_address: !!pickupError.value && !pickupForm.pickup_address,
  pickup_detail: !!pickupError.value && !pickupForm.pickup_detail,
  traveler_count: !!pickupError.value && Number(pickupForm.traveler_count || 0) < 1,
  luggage_count: !!pickupError.value && Number(pickupForm.luggage_count || 0) < 0,
  emergency_contact: !!pickupError.value && !pickupForm.emergency_contact,
  emergency_phone: !!pickupError.value && !pickupForm.emergency_phone,
}))
const formatTime = value => value ? new Date(value).toLocaleString('zh-CN') : ''
const contractHistory = computed(() => {
  const order = selectedOrder.value
  if (!order) return []
  return [
    { label: '订单创建', value: formatTime(order.created_at) || '-' },
    { label: '签署时间', value: formatTime(order.contract_signed_at) || '未签署' },
    { label: '审核时间', value: formatTime(order.contract_reviewed_at) || '未审核' },
    { label: '当前状态', value: contractText(order) },
    ...(order.contract_reject_reason ? [{ label: '驳回原因', value: order.contract_reject_reason }] : []),
  ]
})
const contractContent = computed(() => {
  const order = selectedOrder.value || {}
  const content = order.contract_template_content || contractTemplate.content || '本人已确认订单信息、出行日期、服务内容与平台规则，同意以电子签名方式签署本旅行服务合同。'
  const map = {
    order_no: order.order_no || '',
    title: order.title || '',
    agency: order.agency || '学徒行平台合作服务方',
    travel_date: form.travel_date || order.travel_date || '待确认',
    signer_name: form.signer_name || order.contract_signer_name || '待填写',
    signer_phone: form.signer_phone || order.contract_signer_phone || '待填写',
    id_no: form.id_no || order.contract_id_no || '待填写',
    amount_text: order.amount_text || '',
  }
  return Object.keys(map).reduce((text, key) => text.replaceAll(`{${key}}`, map[key]), content)
})

const signaturePreviewSvg = computed(() => {
  if (!signatureStrokes.value.length) return ''
  return getCanvasDataUrl()
})

const go = url => uni.navigateTo({ url })
const toast = title => uni.showToast({ title, icon: 'none' })
const goLogin = () => uni.navigateTo({ url: '/pages/auth/login' })
const setPickupError = message => {
  pickupError.value = message
  toast(message)
}
const copyCheckinToken = () => {
  const token = selectedOrder.value?.qr_token || ''
  if (!token) return
  if (typeof document !== 'undefined') {
    const input = document.createElement('textarea')
    input.value = token
    input.setAttribute('readonly', 'readonly')
    input.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;z-index:-1;'
    document.body.appendChild(input)
    input.focus()
    input.select()
    input.setSelectionRange?.(0, token.length)
    try {
      if (document.execCommand('copy')) {
        toast('核销码已复制')
        document.body.removeChild(input)
        return
      }
    } catch {}
    document.body.removeChild(input)
  }
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(token)
      .then(() => toast('核销码已复制'))
      .catch(() => {
        uni.setClipboardData({
          data: token,
          success: () => toast('核销码已复制'),
          fail: () => toast('复制失败，请长按手动复制'),
        })
      })
    return
  }
  uni.setClipboardData({
    data: token,
    success: () => toast('核销码已复制'),
    fail: () => toast('复制失败，请长按手动复制'),
  })
}
const clearContractError = () => {
  contractError.value = ''
}
const clearPickupError = () => {
  pickupError.value = ''
}
const selectTravelDate = value => {
  form.travel_date = value
  clearContractError()
}
const orderImage = order => order.order_type === '人工定制'
  ? 'https://images.unsplash.com/photo-1464278533981-50106e6176b1?w=500'
  : 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=500'
const orderCoverImage = order => order?.cover || order?.image || orderImage(order)
const contractText = order => order?.contract_status_text || travelContractStatusName(order?.contract_status)
const contractClass = order => order.contract_status || TRAVEL_CONTRACT_STATUS.UNSIGNED
const contractActionText = order => order.contract_status === TRAVEL_CONTRACT_STATUS.APPROVED ? '查看合同 →' : order.contract_status === TRAVEL_CONTRACT_STATUS.PENDING ? '查看签名 →' : '签署合同 →'
const fulfillmentText = order => order?.fulfillment_status_text || travelFulfillmentStatusName(order?.fulfillment_status)

const contractSignatureImage = order => order?.contract_signature_image || order?.contract_signature_url || order?.contract_signature_data || ''

const loadOrders = async () => {
  if (!isLoggedIn()) {
    orders.value = []
    return
  }
  loading.value = true
  try {
    orders.value = await getMyTravelOrders()
  } catch (error) {
    toast(error.message || '旅行订单加载失败')
  } finally {
    loading.value = false
  }
}

const loadContractTemplate = async () => {
  if (contractTemplateLoaded.value) return
  try {
    const template = await getTravelContractTemplate()
    contractTemplate.title = template.title || '旅行服务合同'
    contractTemplate.content = template.content || contractTemplate.content
    contractTemplate.travel_date_days = Number(template.travel_date_days ?? 30)
    contractTemplate.travel_date_options = Array.isArray(template.travel_date_options) ? template.travel_date_options : []
    contractTemplateLoaded.value = true
  } catch (error) {
    toast(error.message || '合同模板加载失败')
  }
}

const initSignature = () => {
  return syncSignatureSize()
}

const getSignaturePad = () => {
  if (typeof document === 'undefined') return null
  return document.getElementById('contractSignaturePad')
}

const applySignatureRect = rect => {
  if (!rect) return
  const width = Math.max(1, Math.round(rect.width || 0))
  const height = Math.max(1, Math.round(rect.height || 0))
  signatureRect.left = Number(rect.left || 0)
  signatureRect.top = Number(rect.top || 0)
  signatureRect.width = width
  signatureRect.height = height
  signatureSize.width = width
  signatureSize.height = height
  const pad = getSignaturePad()
  if (pad && 'width' in pad && 'height' in pad) {
    pad.width = width
    pad.height = height
  }
}

const syncSignatureSize = () => {
  let synced = false
  const pad = getSignaturePad()
  const rect = pad?.getBoundingClientRect?.()
  if (rect) {
    applySignatureRect(rect)
    synced = true
  }
  if (typeof uni !== 'undefined' && uni.createSelectorQuery) {
    uni.createSelectorQuery()
      .select('#contractSignaturePad')
      .boundingClientRect(result => applySignatureRect(result))
      .exec()
  }
  return synced || (signatureSize.width > 1 && signatureSize.height > 1)
}

const clearSignature = () => {
  signatureStrokes.value = []
  activeStroke = null
  hasSignature.value = false
  lastPoint.value = null
  drawSignature()
}

function drawSignature() {
  if (typeof uni === 'undefined' || !uni.createCanvasContext) return
  const ctx = uni.createCanvasContext('contractSignaturePad')
  ctx.clearRect(0, 0, signatureSize.width, signatureSize.height)
  ctx.setStrokeStyle('#173f38')
  ctx.setLineWidth(3)
  ctx.setLineCap('round')
  ctx.setLineJoin('round')
  signatureStrokes.value.forEach(stroke => {
    if (!stroke.points.length) return
    ctx.beginPath()
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
    stroke.points.slice(1).forEach(point => ctx.lineTo(point.x, point.y))
    if (stroke.points.length === 1) {
      ctx.lineTo(stroke.points[0].x + 0.1, stroke.points[0].y + 0.1)
    }
    ctx.stroke()
  })
  ctx.draw()
}

const openContract = async order => {
  const user = getCurrentUser()
  selectedOrder.value = order
  form.signer_name = order.contract_signer_name || user?.nickname || ''
  form.signer_phone = order.contract_signer_phone || user?.phone || ''
  form.id_no = order.contract_id_no || ''
  form.travel_date = order.travel_date || ''
  contractError.value = ''
  hasSignature.value = false
  contractVisible.value = true
  await loadContractTemplate()
  if (!form.travel_date && travelDateOptions.value.length) form.travel_date = travelDateOptions.value[0]
  nextTick(() => {
    initSignature()
    setTimeout(syncSignatureSize, 80)
    clearSignature()
  })
}

const closeContract = () => {
  contractVisible.value = false
  selectedOrder.value = null
  contractError.value = ''
}

const fillPickupForm = order => {
  pickupForm.pickup_address = order.pickup_address || ''
  pickupForm.pickup_detail = order.pickup_detail || ''
  pickupForm.traveler_count = order.traveler_count || 1
  pickupForm.emergency_contact = order.emergency_contact || ''
  pickupForm.emergency_phone = order.emergency_phone || ''
  pickupForm.luggage_count = order.luggage_count || 0
  pickupForm.pickup_note = order.pickup_note || ''
}

const openFulfillment = order => {
  selectedOrder.value = order
  fillPickupForm(order)
  pickupError.value = ''
  fulfillmentVisible.value = true
}

const closeFulfillment = () => {
  fulfillmentVisible.value = false
  selectedOrder.value = null
  pickupError.value = ''
}

const mergeSavedOrder = saved => {
  const index = orders.value.findIndex(order => order.id === saved.id)
  if (index >= 0) orders.value.splice(index, 1, saved)
  selectedOrder.value = saved
}

const eventPoint = event => {
  syncSignatureSize()
  const source = event?.touches?.[0]
    || event?.changedTouches?.[0]
    || event?.detail?.touches?.[0]
    || event?.detail?.changedTouches?.[0]
    || event?.detail
    || event
    || {}
  const touch = source
  const clampPoint = (x, y) => ({
    x: Math.max(0, Math.min(signatureSize.width, Number(x) || 0)),
    y: Math.max(0, Math.min(signatureSize.height, Number(y) || 0)),
  })
  if (touch.x !== undefined && touch.y !== undefined) {
    return clampPoint(touch.x, touch.y)
  }
  if (touch.offsetX !== undefined && touch.offsetY !== undefined) {
    return clampPoint(touch.offsetX, touch.offsetY)
  }
  const pad = getSignaturePad()
  const rect = pad?.getBoundingClientRect?.() || signatureRect
  if (rect) {
    if (touch.clientX !== undefined && touch.clientY !== undefined) {
      return clampPoint(touch.clientX - rect.left, touch.clientY - rect.top)
    }
    if (touch.pageX !== undefined && touch.pageY !== undefined) {
      const scrollX = typeof window === 'undefined' ? 0 : (window.scrollX || window.pageXOffset || 0)
      const scrollY = typeof window === 'undefined' ? 0 : (window.scrollY || window.pageYOffset || 0)
      return clampPoint(touch.pageX - scrollX - rect.left, touch.pageY - scrollY - rect.top)
    }
    if (event.clientX !== undefined && event.clientY !== undefined) {
      return clampPoint(event.clientX - rect.left, event.clientY - rect.top)
    }
    if (event.pageX !== undefined && event.pageY !== undefined) {
      const scrollX = typeof window === 'undefined' ? 0 : (window.scrollX || window.pageXOffset || 0)
      const scrollY = typeof window === 'undefined' ? 0 : (window.scrollY || window.pageYOffset || 0)
      return clampPoint(event.pageX - scrollX - rect.left, event.pageY - scrollY - rect.top)
    }
  }
  return clampPoint(touch.x ?? event.detail?.x ?? 0, touch.y ?? event.detail?.y ?? 0)
}

const startSign = event => {
  event?.preventDefault?.()
  if (!initSignature() && (signatureSize.width <= 1 || signatureSize.height <= 1)) {
    setTimeout(syncSignatureSize, 50)
    return
  }
  signing.value = true
  lastPoint.value = eventPoint(event)
  activeStroke = { id: Date.now() + Math.random(), points: [lastPoint.value] }
  signatureStrokes.value = [...signatureStrokes.value, activeStroke]
  hasSignature.value = true
  drawSignature()
}

const moveSign = event => {
  event?.preventDefault?.()
  if (!signing.value || !lastPoint.value || !activeStroke) return
  const point = eventPoint(event)
  activeStroke.points = [...activeStroke.points, point]
  signatureStrokes.value = signatureStrokes.value.map(stroke => stroke.id === activeStroke.id ? activeStroke : stroke)
  lastPoint.value = point
  hasSignature.value = true
  drawSignature()
}

const endSign = () => {
  signing.value = false
  lastPoint.value = null
  activeStroke = null
}

const readTempFileAsDataUrl = tempFilePath => new Promise(resolve => {
  if (!tempFilePath) return resolve('')
  if (String(tempFilePath).startsWith('data:image/')) return resolve(tempFilePath)
  const fs = uni.getFileSystemManager?.()
  if (!fs?.readFile) return resolve('')
  fs.readFile({
    filePath: tempFilePath,
    encoding: 'base64',
    success: result => resolve(`data:image/png;base64,${result.data}`),
    fail: () => resolve(''),
  })
})

const getCanvasDataUrl = () => {
  if (!signatureStrokes.value.length) return ''
  const polylines = signatureStrokes.value.map(stroke => {
    const points = stroke.points.map(point => `${point.x},${point.y}`).join(' ')
    return `<polyline points="${points}" fill="none" stroke="#173f38" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`
  }).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${signatureSize.width}" height="${signatureSize.height}" viewBox="0 0 ${signatureSize.width} ${signatureSize.height}">${polylines}</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

const canvasToSignatureData = () => new Promise(resolve => {
  if (!signatureStrokes.value.length) return resolve('')
  if (typeof uni === 'undefined' || !uni.canvasToTempFilePath) return resolve(getCanvasDataUrl())
  drawSignature()
  setTimeout(() => {
    uni.canvasToTempFilePath({
      canvasId: 'contractSignaturePad',
      fileType: 'png',
      success: async result => resolve(await readTempFileAsDataUrl(result.tempFilePath)),
      fail: () => resolve(getCanvasDataUrl()),
    })
  }, 80)
})

const submitContract = async () => {
  if (!selectedOrder.value) return
  if (readonlyContract.value) return
  if (!form.travel_date) {
    contractError.value = '请选择出行日期'
    return
  }
  if (!form.signer_name || !form.signer_phone || !form.id_no) {
    contractError.value = '请先填写签署人姓名、联系电话和证件号码'
    return
  }
  if (!hasSignature.value) {
    contractError.value = '请先在手写签名区域完成签名'
    return
  }
  contractError.value = ''
  submitting.value = true
  try {
    const signature = await canvasToSignatureData()
    const saved = await signTravelContract(selectedOrder.value.id, {
      signer_name: form.signer_name,
      signer_phone: form.signer_phone,
      id_no: form.id_no,
      travel_date: form.travel_date,
      signature_data: signature,
    })
    const index = orders.value.findIndex(order => order.id === saved.id)
    if (index >= 0) orders.value.splice(index, 1, saved)
    toast('合同已提交平台审核')
    closeContract()
  } catch (error) {
    toast(error.message || '合同提交失败')
  } finally {
    submitting.value = false
  }
}

const submitPickupInfo = async () => {
  if (!selectedOrder.value || submittingPickup.value) return
  if (!isLoggedIn()) {
    setPickupError('请先登录后再提交接送信息')
    orders.value = []
    closeFulfillment()
    setTimeout(goLogin, 500)
    return
  }
  if (!pickupForm.pickup_address) {
    setPickupError('请填写接送地址')
    return
  }
  if (!pickupForm.pickup_detail) {
    setPickupError('请填写详细门牌或集合点')
    return
  }
  if (Number(pickupForm.traveler_count || 0) < 1) {
    setPickupError('出行人数至少 1 人')
    return
  }
  if (Number(pickupForm.luggage_count || 0) < 0) {
    setPickupError('行李数量不能小于 0')
    return
  }
  if (!pickupForm.emergency_contact) {
    setPickupError('请填写紧急联系人')
    return
  }
  if (!pickupForm.emergency_phone) {
    setPickupError('请填写紧急联系电话')
    return
  }
  if (!/^1\d{10}$/.test(String(pickupForm.emergency_phone))) {
    setPickupError('请输入 11 位手机号')
    return
  }
  pickupError.value = ''
  submittingPickup.value = true
  try {
    const saved = await submitTravelPickupInfo(selectedOrder.value.id, {
      pickup_address: pickupForm.pickup_address,
      pickup_detail: pickupForm.pickup_detail,
      traveler_count: Number(pickupForm.traveler_count || 1),
      emergency_contact: pickupForm.emergency_contact,
      emergency_phone: pickupForm.emergency_phone,
      luggage_count: Number(pickupForm.luggage_count || 0),
      pickup_note: pickupForm.pickup_note,
    })
    mergeSavedOrder(saved)
    toast('接送信息已提交')
    await loadOrders()
  } catch (error) {
    const message = error.message || '接送信息提交失败'
    setPickupError(message)
    if (message.includes('请先登录') || message.includes('Not authenticated') || message.includes('401')) {
      orders.value = []
      closeFulfillment()
      setTimeout(goLogin, 500)
    }
  } finally {
    submittingPickup.value = false
  }
}

const confirmPickup = async () => {
  if (!selectedOrder.value || confirmingPickup.value) return
  confirmingPickup.value = true
  try {
    const saved = await confirmTravelPickup(selectedOrder.value.id)
    mergeSavedOrder(saved)
    toast('已确认接送安排')
  } catch (error) {
    toast(error.message || '确认失败')
  } finally {
    confirmingPickup.value = false
  }
}

const requestCancelOrder = order => {
  uni.showModal({
    title: '取消旅行订单',
    content: '取消后将原路退回本次兑换积分并恢复路线库存。确认继续吗？',
    confirmText: '确认取消',
    confirmColor: '#c34a32',
    success: async result => {
      if (!result.confirm) return
      try {
        const saved = await cancelTravelOrder(order.id, '用户主动取消')
        mergeSavedOrder(saved)
        await loadOrders()
        toast('订单已取消，积分已退回')
      } catch (error) {
        toast(error.message || '订单取消失败')
      }
    },
  })
}

onLoad(loadOrders)
onShow(loadOrders)
</script>

<style scoped>
.status-card{background:linear-gradient(145deg,#fff4e8,#e6f6f2);padding:30rpx;border-radius:30rpx;margin-bottom:24rpx}.status-title{font-size:36rpx;font-weight:900;margin:25rpx 0}.status-card .progress{margin-bottom:12rpx}.order{display:flex;gap:22rpx}.order image{width:190rpx;height:190rpx;border-radius:20rpx}.order-main{flex:1;display:flex;flex-direction:column;align-items:flex-start;gap:10rpx;min-width:0}.order-main b{line-height:1.35}.actions{display:flex;gap:16rpx;flex-wrap:wrap}.order-action{color:#ff7a35;font-size:24rpx;font-weight:800}.order-action.danger{color:#c34a32}.contract-state{padding:7rpx 14rpx;border-radius:999rpx;font-size:21rpx;font-weight:800}.contract-state.unsigned{background:#f0f4f2;color:#65736f}.contract-state.pending{background:#fff4e5;color:#b96d1d}.contract-state.approved{background:#e3f7ef;color:#0a8a78}.contract-state.rejected{background:#ffeeeb;color:#c34a32}.empty{text-align:center;padding:100rpx 20rpx}.empty view{font-size:64rpx}.empty b,.empty text{display:block;margin-top:18rpx}.empty text{color:#778684}.identity-demo{margin-top:35rpx}.state{display:flex;justify-content:space-between;gap:20rpx;padding:18rpx 0;border-bottom:1rpx solid #e7ebe7}.state text{font-size:23rpx;color:#778684;text-align:right}.contract-mask{position:fixed;inset:0;z-index:1000;background:rgba(16,39,36,.48);display:flex;align-items:flex-end}.contract-panel{position:relative;width:100%;max-height:88vh;overflow:auto;background:#fff;border-radius:34rpx 34rpx 0 0;padding:30rpx 28rpx calc(34rpx + env(safe-area-inset-bottom));box-shadow:0 -18rpx 60rpx rgba(12,39,35,.2)}.contract-head{display:flex;align-items:flex-start;justify-content:space-between;gap:20rpx;margin-bottom:22rpx;padding-right:92rpx}.contract-head text,.contract-head b{display:block}.contract-head text{color:#12a594;font-size:22rpx;font-weight:900}.contract-head b{margin-top:8rpx;font-size:34rpx;line-height:1.35}.close-btn{position:sticky;top:0;float:right;z-index:5;width:62rpx;height:62rpx;margin:0 0 -62rpx auto;padding:0;border:0;border-radius:18rpx;background:#f2f5f3;color:#173f38;font-size:38rpx;line-height:1;display:flex;align-items:center;justify-content:center;box-shadow:0 8rpx 24rpx rgba(16,39,36,.08)}.close-btn:after,.submit-btn:after{border:0}.contract-summary,.contract-history,.date-section{display:grid;gap:10rpx;margin-bottom:22rpx;padding:22rpx;border-radius:22rpx;background:#f6faf8;color:#5b6d68;font-size:23rpx}.contract-history b,.date-section b{color:#173f38;font-size:25rpx}.date-options{display:flex;gap:12rpx;flex-wrap:wrap}.date-option{padding:13rpx 18rpx;border-radius:999rpx;background:#fff;border:1rpx solid #dfe9e5;color:#526560;font-weight:800}.date-option.on{background:#173f38;border-color:#173f38;color:#fff}.date-section input{height:76rpx;border:1rpx solid #dfe9e5;border-radius:18rpx;padding:0 20rpx;background:#fff;font-size:25rpx;box-sizing:border-box}.date-section.invalid input{border-color:#ff5c3d;background:#fff8f6}.form-grid label,.form-grid uni-label{display:block;margin-bottom:18rpx}.form-grid text{display:block;margin-bottom:9rpx;color:#173f38;font-size:23rpx;font-weight:900}.form-grid input,.form-grid uni-input{height:78rpx;border:1rpx solid #dfe9e5;border-radius:18rpx;padding:0 20rpx;background:#fbfdfc;font-size:25rpx;box-sizing:border-box}.form-grid input:disabled{color:#5b6d68;background:#f6faf8}.form-grid label.invalid input,.form-grid uni-label.invalid uni-input{border-color:#ff5c3d;background:#fff8f6}.contract-terms{padding:22rpx;border-radius:22rpx;background:#fff7ec;color:#8a6944;margin-bottom:22rpx}.contract-terms b,.contract-terms text{display:block}.contract-terms b{color:#9c5d1b;margin-bottom:8rpx}.contract-terms text{font-size:22rpx;line-height:1.7}.contract-content{background:#fbfdfc;color:#526560;border:1rpx solid #e1ebe7}.contract-content b{color:#173f38}.contract-content text{white-space:pre-wrap}.signature-box{border:1rpx solid #dfe9e5;border-radius:22rpx;overflow:hidden;margin-bottom:18rpx}.signature-title{height:70rpx;padding:0 20rpx;display:flex;align-items:center;justify-content:space-between;background:#f7faf8}.signature-title b{font-size:24rpx}.signature-title text{color:#ff7a35;font-weight:900}.signature-canvas{position:relative;width:100%;height:260rpx;background:#fff;display:block;overflow:hidden;touch-action:none;cursor:crosshair}.signature-svg{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;pointer-events:none}.signature-stroke{fill:none;stroke:#173f38;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}.signature-preview{padding:22rpx;border:1rpx solid #dfe9e5;border-radius:22rpx;margin-bottom:18rpx;background:#fbfdfc}.signature-preview b{display:block;margin-bottom:12rpx;color:#173f38}.signature-preview image{width:100%;height:220rpx;background:#fff;border:1rpx dashed #d7e2de;border-radius:16rpx}.reject-box,.contract-error{padding:18rpx 20rpx;margin-bottom:18rpx;border-radius:18rpx;background:#fff0ed;color:#b94732;font-size:23rpx;line-height:1.6}.contract-error{font-weight:900;border:1rpx solid #ffd2c8}.submit-btn{width:100%;height:88rpx;margin:0;border:0;border-radius:24rpx;background:linear-gradient(135deg,#ff7a35,#ff985b);color:#fff;font-size:28rpx;font-weight:900;line-height:88rpx;display:flex;align-items:center;justify-content:center;text-align:center}.submit-btn:disabled{opacity:.55}.contract-locked{padding:20rpx;border-radius:18rpx;background:#f3f7f5;color:#5b6d68;text-align:center;font-weight:900;font-size:24rpx}.fulfillment-section{margin-top:24rpx;padding-top:24rpx;border-top:1rpx solid #e7ebe7}.section-title{display:flex;align-items:center;justify-content:space-between;gap:16rpx;margin-bottom:18rpx}.section-title b{font-size:30rpx;color:#173f38}.section-title text{padding:8rpx 14rpx;border-radius:999rpx;background:#e3f7ef;color:#0a8a78;font-size:22rpx;font-weight:900}.fulfillment-flow{display:grid;grid-template-columns:1fr 1fr;gap:12rpx;margin-bottom:18rpx}.fulfillment-flow text{padding:14rpx 16rpx;border-radius:16rpx;background:#f2f5f3;color:#7b8a86;font-size:22rpx;font-weight:800}.fulfillment-flow text.on{background:#173f38;color:#fff}.pickup-form,.pickup-card,.qr-card{display:grid;gap:12rpx;margin-bottom:18rpx;padding:22rpx;border-radius:22rpx;background:#f6faf8;color:#526560;font-size:23rpx}.pickup-form label{display:block}.pickup-form text{display:block;margin-bottom:8rpx;color:#173f38;font-size:23rpx;font-weight:900}.pickup-form input{width:100%;height:76rpx;border:1rpx solid #dfe9e5;border-radius:18rpx;padding:0 20rpx;background:#fff;font-size:25rpx;box-sizing:border-box}.pickup-form label.invalid input{border-color:#ff5c3d;background:#fff8f6}.form-row{display:grid;grid-template-columns:1fr 1fr;gap:14rpx}.pickup-card b,.qr-card b{color:#173f38;font-size:25rpx}.pickup-card text,.qr-card text{display:block;line-height:1.6}.qr-box{padding:22rpx;border-radius:18rpx;background:#173f38;color:#fff;font-size:24rpx;font-weight:900;word-break:break-all;text-align:center;letter-spacing:1rpx}
@media (max-width:360px){.order image{width:160rpx;height:160rpx}.contract-head b{font-size:30rpx}}
.fulfillment-flow text{display:flex;align-items:center;gap:8rpx}
.fulfillment-flow text b{display:inline-flex;align-items:center;justify-content:center;width:34rpx;height:34rpx;border-radius:999rpx;background:rgba(255,255,255,.22);font-size:20rpx}
.fulfillment-flow text.current{background:#dff4ef;color:#0a7f72;border:2rpx solid #12a594}
.fulfillment-flow text.current b{background:#12a594;color:#fff}
.fulfillment-flow text.on{background:#173f38;color:#fff}
.fulfillment-status-card{display:grid;gap:10rpx;margin-bottom:18rpx;padding:22rpx;border-radius:22rpx;background:#fff7ec;color:#7a654f;border:1rpx solid #ffe0bd;font-size:23rpx;line-height:1.55}
.fulfillment-status-card b{color:#9c5d1b;font-size:26rpx}
.fulfillment-status-card .status-tip{color:#0a7f72;font-weight:900}
.pending-card{background:#fff7ec;border:1rpx solid #ffe0bd;color:#7a654f}
.pending-card b{color:#9c5d1b}
.qr-image{width:320rpx;height:320rpx;margin:8rpx auto 12rpx;padding:18rpx;border-radius:22rpx;background:#fff;border:1rpx solid #dfe9e5;box-sizing:border-box}
.qr-box{cursor:pointer;position:relative}
.qr-box:after{content:"点击复制";display:block;margin-top:8rpx;font-size:20rpx;font-weight:700;letter-spacing:0;color:rgba(255,255,255,.72)}
.contract-mask{height:100vh;height:100dvh;overflow:hidden}
.contract-panel{height:88vh;height:88dvh;box-sizing:border-box;-webkit-overflow-scrolling:touch}
.close-btn{position:absolute;top:22rpx;right:24rpx;float:none;margin:0;z-index:20}
.signature-pad-wrap{position:relative;width:100%;height:260rpx;background:#fff;overflow:hidden}
.signature-canvas{position:absolute;inset:0;width:100%;height:260rpx;z-index:1;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.signature-preview-layer{position:absolute;left:0;top:0;width:100%;height:260rpx;z-index:2;pointer-events:none}
</style>

