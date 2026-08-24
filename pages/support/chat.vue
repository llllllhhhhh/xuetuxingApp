<template>
  <view class="support-page">
    <view class="service-head">
      <view class="service-avatar">行</view>
      <view class="service-info">
        <b>学徒行在线客服</b>
        <text><i :class="{ online: adminOnline }"></i>{{ adminOnline ? '客服当前在线' : '客服暂时离线，消息会保留历史记录' }}</text>
      </view>
      <view class="service-time">09:00-21:00</view>
    </view>

    <scroll-view scroll-y class="message-scroll" :class="{ expanded: morePanelVisible }" :scroll-into-view="scrollTarget">
      <view class="welcome-card">
        <b>你好，有问题都可以在这里问我</b>
        <text>路线定制、积分兑换、订单预约都可以咨询。图片消息和聊天记录会实时保存。</text>
      </view>

      <view v-for="m in messages" :id="`message-${m.id}`" :key="m.id" class="message-row" :class="messageSideClass(m)">
        <view v-if="!isUserMessage(m)" class="chat-avatar" :class="supportRoleClass(m)">{{ supportRoleAvatar(m) }}</view>
        <view class="message-main">
          <view v-if="!isUserMessage(m)" class="sender-label" :class="supportRoleClass(m)">{{ supportRoleName(m) }}</view>
          <view class="bubble" :class="{ 'order-bubble': m.message_type === 'order_card' }">
            <template v-if="m.message_type === 'image'">
              <view class="image-wrap">
                <image :src="getImageUrl(m)" class="chat-image" mode="widthFix" lazy-load="true" @click="previewChatImage(m)" @error="handleImageError(m)" />
                <image v-if="m.remote_url && !m.remote_ready" :src="resolveAssetUrl(m.remote_thumb_url || m.remote_url)" class="remote-preload-image" mode="widthFix" @load="markRemoteReady(m)" />
                <view v-if="m.uploading" class="image-progress-mask">
                  <view class="image-progress-circle" :style="getProgressStyle(m.upload_progress)"><view></view></view>
                </view>
                <view v-if="m.upload_error" class="image-error" @click="retryImage(m)">上传失败，点我重试</view>
                <view v-if="m.image_load_failed" class="image-error">图片加载失败</view>
              </view>
              <text v-if="m.content">{{ m.content }}</text>
            </template>

            <template v-else-if="m.message_type === 'order_card'">
              <view class="chat-order-card" @click="openOrderCard(m)">
                <image v-if="parseOrderCard(m).image" :src="parseOrderCard(m).image" mode="aspectFill" />
                <view v-else class="order-card-fallback">{{ parseOrderCard(m).badge }}</view>
                <view class="chat-order-info">
                  <b>{{ parseOrderCard(m).title }}</b>
                  <text>{{ parseOrderCard(m).orderNo }}</text>
                  <small>{{ parseOrderCard(m).statusText }}</small>
                </view>
              </view>
            </template>

            <template v-else>{{ m.content }}</template>
          </view>
          <text>{{ formatTime(m.created_at) }}</text>
        </view>
        <view v-if="isUserMessage(m)" class="chat-avatar user">{{ (user?.nickname || '我').slice(0, 1) }}</view>
      </view>

      <view v-if="adminTyping" class="typing">客服正在输入 <text>...</text></view>
      <view id="message-bottom" class="message-bottom"></view>
    </scroll-view>

    <view class="bottom-dock" :class="{ expanded: morePanelVisible }">
      <scroll-view scroll-x class="quick-scroll">
        <view class="quick-list">
          <view v-for="q in quickQuestions" :key="q" @click="sendQuick(q)">{{ q }}</view>
        </view>
      </scroll-view>
      <view class="composer safe-bottom">
        <view class="tool-btn" :class="{ active: morePanelVisible }" @tap.stop.prevent="toggleMorePanel">＋</view>
        <textarea v-model="content" :disabled="conversation?.status === 'closed'" fixed maxlength="2000" cursor-spacing="20" placeholder="请输入你想咨询的问题..." @focus="closeMorePanel" @confirm="sendMessage" />
        <view class="send-btn" :class="{ disabled: !content.trim() || !connected }" @click="sendMessage">发送</view>
      </view>
      <view v-if="morePanelVisible" class="more-panel">
        <view class="more-grid">
          <view class="more-item" @tap.stop.prevent="pickImageFromAlbum"><view>图</view><text>图库</text></view>
          <view class="more-item" @tap.stop.prevent="pickImageFromCamera"><view>拍</view><text>拍照</text></view>
          <view class="more-item" @tap.stop.prevent="chooseOrderToSend"><view>单</view><text>订单</text></view>
        </view>
      </view>
    </view>

    <view v-if="orderPickerVisible" class="order-picker-mask" @click="closeOrderPicker">
      <view class="order-picker" @click.stop>
        <view class="picker-bar"></view>
        <view class="picker-head">
          <view>
            <b>选择要咨询的订单</b>
            <text>发送后客服可按订单号帮你查询进度</text>
          </view>
          <view class="picker-close" @click="closeOrderPicker">×</view>
        </view>
        <scroll-view scroll-y class="order-picker-scroll">
          <view v-for="order in orderPickerList" :key="order.key" class="support-order-card" @click="sendSelectedOrder(order)">
            <view class="order-card-top">
              <view :class="['order-type-mark', order.tone]">{{ order.badge }}</view>
              <view class="order-card-main">
                <b>{{ order.title }}</b>
                <text>{{ order.orderNo }}</text>
              </view>
              <view :class="['order-status', order.tone]">{{ order.statusText }}</view>
            </view>
            <view class="order-card-meta">
              <view><text>{{ order.metaLabelA }}</text><b>{{ order.metaValueA }}</b></view>
              <view><text>{{ order.metaLabelB }}</text><b>{{ order.metaValueB }}</b></view>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { nextTick, ref } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import {
  cacheImageUrl,
  createSupportConversation,
  getCachedImagePath,
  getCurrentUser,
  getMyStudyOrders,
  getMyTravelOrders,
  getSupportMessages,
  getUploadSettings,
  getUserToken,
  getWebSocketBaseUrl,
  isLoggedIn,
  resolveAssetThumbUrl,
  resolveAssetUrl,
  uploadSupportImage,
} from '../../utils/api.js'
import {
  COMMERCE_PAYMENT_STATUS,
  TRAVEL_FULFILLMENT_STATUS,
  paymentStatusName,
  travelContractStatusName,
  travelFulfillmentStatusName,
} from '../../utils/orderStatus.js'
import { chooseImageWithPermission } from '../../utils/permissions.js'

const conversation = ref(null)
const messages = ref([])
const content = ref('')
const connected = ref(false)
const adminOnline = ref(false)
const adminTyping = ref(false)
const scrollTarget = ref('message-bottom')
const user = ref(getCurrentUser())
const morePanelVisible = ref(false)
const orderPickerVisible = ref(false)
const orderPickerList = ref([])
const orderImageMap = ref({})
const imagePicking = ref(false)
const quickQuestions = ['积分怎么兑换？', '旅行怎么预约？', '想人工定制路线', '查询订单进度']

let reconnectTimer = null
let heartbeatTimer = null
let manualClose = false
let connecting = false
let socketTask = null
let uploadSettingCache = null
let morePanelReadyAt = 0

const scrollBottom = () => nextTick(() => {
  scrollTarget.value = ''
  setTimeout(() => { scrollTarget.value = 'message-bottom' }, 20)
})
const formatTime = value => (value ? new Date(value).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '')
const closeMorePanel = () => { morePanelVisible.value = false }
const closeOrderPicker = () => { orderPickerVisible.value = false }
const toggleMorePanel = () => {
  if (conversation.value?.status === 'closed') return
  const nextVisible = !morePanelVisible.value
  morePanelVisible.value = nextVisible
  morePanelReadyAt = nextVisible ? Date.now() + 250 : 0
  scrollBottom()
}
const getProgressStyle = value => {
  const percent = Math.max(8, Math.round(Math.max(0, Math.min(1, Number(value || 0))) * 100))
  return `background: conic-gradient(#ffffff ${percent}%, rgba(255,255,255,.26) 0);`
}
const sendSocket = data => socketTask?.send({ data: JSON.stringify(data) })

const hydrateMessageImage = message => {
  if (!message || message.message_type !== 'image' || message.local_preview) return message
  const remoteUrl = message.image_thumb_url || message.remote_thumb_url || resolveAssetThumbUrl(message.remote_url || message.image_url)
  const cached = getCachedImagePath(remoteUrl)
  if (cached) message.cached_image_url = cached
  cacheImageUrl(remoteUrl, cachedPath => { message.cached_image_url = cachedPath })
  return message
}
const hydrateMessageImages = list => (list || []).map(item => hydrateMessageImage(item))

const normalizeSenderRole = message => String(message?.sender_role || '').toLowerCase()
const isUserMessage = message => normalizeSenderRole(message) === 'user'
const isMerchantMessage = message => ['merchant', 'school', 'store'].includes(normalizeSenderRole(message))
const isAdminMessage = message => ['admin', 'platform', 'staff', 'service'].includes(normalizeSenderRole(message))
const messageSideClass = message => (isUserMessage(message) ? 'user' : 'service')
const supportRoleClass = message => (isMerchantMessage(message) ? 'merchant' : isAdminMessage(message) ? 'admin' : 'service')
const supportRoleName = message => {
  if (isMerchantMessage(message)) return '商家客服'
  if (isAdminMessage(message)) return '平台客服'
  return '客服'
}
const supportRoleAvatar = message => {
  if (isMerchantMessage(message)) return '商'
  if (isAdminMessage(message)) return '平'
  return '客'
}
const parseOrderCard = message => {
  try {
    const data = message?.extra && Object.keys(message.extra).length
      ? message.extra
      : (typeof message?.content === 'string' ? JSON.parse(message.content) : (message?.content || {}))
    const result = {
      type: data.type || 'study',
      badge: data.badge || (data.type === 'travel' ? '旅' : '学'),
      title: data.title || '订单',
      orderNo: data.orderNo || data.order_no || '-',
      statusText: data.statusText || '待处理',
      image: data.image || '',
      rawId: data.rawId || data.id || '',
      metaLabelA: data.metaLabelA || '',
      metaValueA: data.metaValueA || '',
      metaLabelB: data.metaLabelB || '',
      metaValueB: data.metaValueB || '',
      detailUrl: data.detailUrl || '',
    }
    if (!result.image && result.orderNo && orderImageMap.value[result.orderNo]) result.image = orderImageMap.value[result.orderNo]
    return result
  } catch {
    return { type: 'study', badge: '单', title: '订单信息', orderNo: '-', statusText: '待处理', image: '', rawId: '', detailUrl: '' }
  }
}
const openOrderCard = message => {
  const order = parseOrderCard(message)
  if (order.detailUrl) {
    uni.navigateTo({ url: order.detailUrl })
    return
  }
  uni.showToast({ title: `订单号：${order.orderNo}`, icon: 'none' })
}

const getImageUrl = message => {
  if (message.image_load_failed) return ''
  if (message.thumb_failed) return message.local_preview ? message.image_url : resolveAssetUrl(message.image_url || message.remote_url)
  if (message.cached_image_url) return message.cached_image_url
  if (message.remote_ready && (message.remote_thumb_url || message.remote_url)) return resolveAssetUrl(message.remote_thumb_url || resolveAssetThumbUrl(message.remote_url))
  return message.local_preview ? message.image_url : resolveAssetUrl(message.image_thumb_url || resolveAssetThumbUrl(message.image_url))
}
const getFullImageUrl = message => {
  if (!message || message.image_load_failed) return ''
  return message.local_preview ? message.image_url : resolveAssetUrl(message.remote_url || message.image_url || message.image_thumb_url)
}
const previewChatImage = message => {
  const current = getFullImageUrl(message)
  if (!current) return
  const urls = messages.value.filter(item => item.message_type === 'image' && !item.image_load_failed).map(item => getFullImageUrl(item)).filter(Boolean)
  uni.previewImage({ current, urls: urls.length ? urls : [current] })
}
const handleImageError = message => {
  if (!message) return
  message.cached_image_url = ''
  if (!message.thumb_failed && !message.local_preview) {
    message.thumb_failed = true
    return
  }
  message.image_load_failed = true
}
const markRemoteReady = message => {
  if (!message?.remote_url) return
  cacheImageUrl(message.remote_thumb_url || message.remote_url, cachedPath => { message.cached_image_url = cachedPath })
  message.image_url = message.remote_url
  message.local_preview = false
  message.remote_ready = true
  message.uploading = false
}

const scheduleReconnect = () => {
  clearTimeout(reconnectTimer)
  if (!manualClose) reconnectTimer = setTimeout(connect, 2000)
}
const handleOpen = () => {
  connecting = false
  connected.value = true
  clearInterval(heartbeatTimer)
  heartbeatTimer = setInterval(() => sendSocket({ type: 'ping' }), 25000)
}
const mergePendingImageMessage = serverMessage => {
  const pending = messages.value.find(m => m.message_type === 'image'
    && m.sender_role === 'user'
    && !m.upload_error
    && !m.server_id
    && (m.local_pending
      || (m.remote_url && m.remote_url === serverMessage.image_url)
      || (m.image_url && m.image_url === serverMessage.image_url)
      || (m.image_thumb_url && m.image_thumb_url === serverMessage.image_thumb_url)))
  if (!pending) return false
  pending.server_id = serverMessage.id
  pending.remote_url = serverMessage.image_url
  pending.remote_thumb_url = serverMessage.image_thumb_url || resolveAssetThumbUrl(serverMessage.image_url)
  pending.image_thumb_url = serverMessage.image_thumb_url || ''
  pending.content = serverMessage.content || ''
  pending.created_at = serverMessage.created_at
  pending.uploading = false
  pending.local_pending = false
  pending.upload_progress = 1
  scrollBottom()
  return true
}
const handleMessage = event => {
  let data
  try { data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data } catch { return }
  if (data.type === 'message') {
    if (data.message?.message_type === 'image' && data.message?.sender_role === 'user' && mergePendingImageMessage(data.message)) return
    if (!messages.value.some(m => m.id === data.message.id || m.server_id === data.message.id)) messages.value.push(hydrateMessageImage(data.message))
    scrollBottom()
  } else if (data.type === 'typing' && data.role === 'admin') {
    adminTyping.value = data.typing
  } else if (data.type === 'presence' && data.role === 'admin') {
    adminOnline.value = data.online
  } else if (data.type === 'status' && data.status === 'closed') {
    conversation.value.status = 'closed'
    uni.showToast({ title: '本次客服会话已结束', icon: 'none' })
  }
}
const handleClose = () => {
  connecting = false
  connected.value = false
  socketTask = null
  clearInterval(heartbeatTimer)
  scheduleReconnect()
}
const connect = () => {
  if (!conversation.value || manualClose || connecting || connected.value) return
  connecting = true
  const url = `${getWebSocketBaseUrl()}/support/ws/${conversation.value.id}?role=user&token=${encodeURIComponent(getUserToken())}`
  socketTask = uni.connectSocket({ url, timeout: 10000, fail: handleClose })
  if (!socketTask) {
    handleClose()
    return
  }
  socketTask.onOpen(handleOpen)
  socketTask.onMessage(handleMessage)
  socketTask.onClose(handleClose)
  socketTask.onError(handleClose)
}

const sendMessage = () => {
  const text = content.value.trim()
  if (!text || !connected.value || conversation.value?.status === 'closed') return
  socketTask.send({
    data: JSON.stringify({ type: 'message', content: text }),
    success: () => { content.value = '' },
    fail: () => uni.showToast({ title: '消息发送失败', icon: 'none' }),
  })
}
const sendOrderCardPayload = order => {
  if (!order || !connected.value || conversation.value?.status === 'closed') return false
  const payload = {
    type: order.type,
    badge: order.badge,
    title: order.title,
    orderNo: order.orderNo,
    statusText: order.statusText,
    image: order.image || '',
    rawId: order.rawId || '',
    metaLabelA: order.metaLabelA || '',
    metaValueA: order.metaValueA || '',
    metaLabelB: order.metaLabelB || '',
    metaValueB: order.metaValueB || '',
    detailUrl: order.detailUrl || '',
  }
  socketTask?.send({
    data: JSON.stringify({ type: 'message', message_type: 'order_card', content: payload.title || payload.orderNo || '[订单卡片]', extra: payload }),
    fail: () => uni.showToast({ title: '订单发送失败', icon: 'none' }),
  })
  return true
}
const sendQuick = q => {
  closeMorePanel()
  content.value = q
  sendMessage()
}

const getMaxImageMb = async () => {
  if (!uploadSettingCache) uploadSettingCache = await getUploadSettings().catch(() => ({ max_image_mb: 8, max_image_bytes: 8 * 1024 * 1024 }))
  return uploadSettingCache
}
const uploadPickedImage = async (filePath, fileMeta = {}) => {
  if (!conversation.value) return
  if (!connected.value) {
    uni.showToast({ title: '客服连接中，请稍后再发图', icon: 'none' })
    return
  }
  const uploadSetting = await getMaxImageMb()
  if (fileMeta?.size && fileMeta.size > uploadSetting.max_image_bytes) {
    uni.showToast({ title: `图片不能超过 ${uploadSetting.max_image_mb}MB`, icon: 'none' })
    return
  }
  const tempId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const localMessage = {
    id: tempId,
    sender_role: 'user',
    sender_name: user.value?.nickname || 'me',
    content: '',
    message_type: 'image',
    image_url: filePath,
    created_at: new Date().toISOString(),
    local_preview: true,
    local_pending: true,
    uploading: true,
    upload_progress: 0,
    remote_url: '',
    remote_thumb_url: '',
    image_thumb_url: '',
    remote_ready: false,
    upload_error: false,
    file_path: filePath,
  }
  messages.value.push(localMessage)
  scrollBottom()
  try {
    const result = await uploadSupportImage(conversation.value.id, filePath, progress => { localMessage.upload_progress = progress })
    localMessage.upload_progress = 0.98
    localMessage.remote_url = result.url
    localMessage.remote_thumb_url = result.thumb_url || result.url
    localMessage.image_thumb_url = result.thumb_url || ''
    localMessage.uploading = false
    cacheImageUrl(result.thumb_url || result.url, cachedPath => { localMessage.cached_image_url = cachedPath })
    socketTask?.send({
      data: JSON.stringify({ type: 'message', message_type: 'image', image_url: result.url, image_thumb_url: result.thumb_url || result.url, content: '' }),
      fail: () => {
        localMessage.local_pending = false
        localMessage.upload_error = true
        uni.showToast({ title: '图片消息发送失败', icon: 'none' })
      },
    })
  } catch (error) {
    localMessage.local_pending = false
    localMessage.uploading = false
    localMessage.upload_error = true
    uni.showToast({ title: error.message || '图片上传失败', icon: 'none' })
  }
}
const retryImage = message => {
  if (!message?.file_path || message.uploading) return
  messages.value = messages.value.filter(item => item.id !== message.id)
  uploadPickedImage(message.file_path)
}
const pickImage = async (sourceType = ['album']) => {
  if (!conversation.value || imagePicking.value) return
  if (Date.now() < morePanelReadyAt) return
  imagePicking.value = true
  closeMorePanel()
  try {
    const result = await chooseImageWithPermission({ count: 1, sourceType })
    const filePath = result?.tempFilePaths?.[0]
    if (filePath) await uploadPickedImage(filePath, result.tempFiles?.[0])
  } catch (error) {
    if (!String(error?.errMsg || '').includes('cancel')) uni.showToast({ title: error.message || '图片选择失败', icon: 'none' })
  } finally {
    imagePicking.value = false
  }
}
const pickImageFromAlbum = () => pickImage(['album'])
const pickImageFromCamera = () => pickImage(['camera'])

const formatMoney = value => {
  const number = Number(value)
  if (!Number.isFinite(number)) return value || '-'
  return `¥${number.toFixed(2)}`
}
const studyStatusText = status => paymentStatusName(String(status || '').toLowerCase())
const studyProductTypeText = type => ({
  package: '课程套餐',
  course: '课程',
  service: '学习服务',
  vip: '会员服务',
  exam: '考试规划',
  consult: '咨询服务',
  material: '学习资料',
}[String(type || '').toLowerCase()] || type || '学习服务')
const normalizeSupportOrder = (order, type) => {
  if (type === 'travel') {
    const fulfillmentText = order.fulfillment_status_text || travelFulfillmentStatusName(order.fulfillment_status)
    const orderNo = order.order_no || String(order.id || '-')
    return {
      key: `travel-${orderNo}`,
      rawId: order.id || '',
      type: 'travel',
      badge: '旅',
      tone: order.fulfillment_status === TRAVEL_FULFILLMENT_STATUS.COMPLETED ? 'done' : order.fulfillment_status === TRAVEL_FULFILLMENT_STATUS.EXCEPTION ? 'warn' : 'travel',
      title: order.title || '旅行订单',
      orderNo,
      image: order.image || order.cover || '',
      statusText: fulfillmentText,
      metaLabelA: '出行日期',
      metaValueA: order.travel_date || '-',
      metaLabelB: '合同',
      metaValueB: order.contract_status_text || travelContractStatusName(order.contract_status),
      detailUrl: '/pages/mine/travel',
      created_at: order.created_at,
    }
  }
  const orderNo = order.order_no || String(order.id || '-')
  const paid = order.payment_status === COMMERCE_PAYMENT_STATUS.PAID || order.status === COMMERCE_PAYMENT_STATUS.PAID
  const statusText = studyStatusText(order.payment_status || order.status)
  const productTypeText = studyProductTypeText(order.product_type)
  return {
    key: `study-${orderNo}`,
    rawId: order.id || '',
    type: 'study',
    badge: '学',
    tone: paid ? 'done' : 'study',
    title: order.product_name || '学习服务订单',
    orderNo,
    image: order.cover || order.product_cover || order.image || '',
    statusText,
    metaLabelA: '订单金额',
    metaValueA: formatMoney(order.payable_amount ?? order.amount ?? order.total_amount),
    metaLabelB: '服务类型',
    metaValueB: productTypeText,
    detailUrl: '',
    created_at: order.created_at,
  }
}
const chooseOrderToSend = async () => {
  if (!conversation.value) return
  if (!connected.value) {
    uni.showToast({ title: '客服连接中，请稍后再发订单', icon: 'none' })
    return
  }
  closeMorePanel()
  uni.showLoading({ title: '读取订单...' })
  try {
    const [studyResult, travelResult] = await Promise.allSettled([getMyStudyOrders(), getMyTravelOrders()])
    const orders = [
      ...((studyResult.status === 'fulfilled' ? studyResult.value : []) || []).map(item => normalizeSupportOrder(item, 'study')),
      ...((travelResult.status === 'fulfilled' ? travelResult.value : []) || []).map(item => normalizeSupportOrder(item, 'travel')),
    ].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    orderImageMap.value = Object.fromEntries(orders.filter(item => item.image).map(item => [item.orderNo, item.image]))
    uni.hideLoading()
    if (!orders.length) {
      uni.showToast({ title: '暂无可发送的订单', icon: 'none' })
      return
    }
    orderPickerList.value = orders.slice(0, 10)
    orderPickerVisible.value = true
  } catch (error) {
    uni.hideLoading()
    uni.showToast({ title: error.message || '订单读取失败', icon: 'none' })
  }
}
const sendSelectedOrder = order => {
  if (!order) return
  if (sendOrderCardPayload(order)) {
    closeOrderPicker()
    scrollBottom()
  }
}

onLoad(async options => {
  if (!isLoggedIn()) {
    uni.redirectTo({ url: '/pages/auth/login' })
    return
  }
  user.value = getCurrentUser()
  try {
    conversation.value = options?.conversation_id ? { id: options.conversation_id, status: 'open' } : await createSupportConversation()
    adminOnline.value = !!conversation.value.admin_online
    messages.value = hydrateMessageImages(await getSupportMessages(conversation.value.id))
    scrollBottom()
    connect()
  } catch (error) {
    uni.showToast({ title: error.message || '客服系统连接失败', icon: 'none' })
  }
})

onUnload(() => {
  manualClose = true
  clearTimeout(reconnectTimer)
  clearInterval(heartbeatTimer)
  socketTask?.close({})
  socketTask = null
})
</script>

<style scoped>
.support-page{position:fixed;inset:0;height:100vh;height:100dvh;background:#f3f6f5;overflow:hidden}.service-head{position:fixed;z-index:10;left:0;right:0;top:var(--window-top,0px);height:120rpx;box-sizing:border-box;background:#163f39;color:#fff;padding:20rpx 28rpx;display:flex;align-items:center;gap:18rpx}.service-avatar,.chat-avatar{width:72rpx;height:72rpx;border-radius:24rpx 24rpx 24rpx 7rpx;background:linear-gradient(135deg,#ff7a35,#ffad72);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900}.service-info{min-width:0;flex:1}.service-head b,.service-head text{display:block;white-space:nowrap}.service-head b{font-size:28rpx;overflow:hidden;text-overflow:ellipsis}.service-head text{font-size:20rpx;color:#b8d0cb;margin-top:7rpx}.service-head text i{display:inline-block;width:12rpx;height:12rpx;border-radius:50%;background:#8a9996;margin-right:8rpx}.service-head text i.online{background:#42d39a;box-shadow:0 0 0 5rpx rgba(66,211,154,.15)}.service-time{flex:0 0 auto;margin-left:auto;font-size:20rpx;color:#a9c5bf}.message-scroll{position:fixed;left:0;right:0;top:calc(var(--window-top,0px) + 120rpx);bottom:calc(var(--window-bottom,0px) + 190rpx);height:calc(100vh - var(--window-top,0px) - var(--window-bottom,0px) - 310rpx);height:calc(100dvh - var(--window-top,0px) - var(--window-bottom,0px) - 310rpx);padding:24rpx;box-sizing:border-box}.message-scroll.expanded{bottom:calc(var(--window-bottom,0px) + 430rpx);height:calc(100vh - var(--window-top,0px) - var(--window-bottom,0px) - 550rpx);height:calc(100dvh - var(--window-top,0px) - var(--window-bottom,0px) - 550rpx)}.welcome-card{background:#e5f4f0;border:1rpx solid #cfe9e2;border-radius:24rpx;padding:25rpx;margin-bottom:30rpx}.welcome-card b,.welcome-card text{display:block}.welcome-card text{font-size:23rpx;color:#58716c;line-height:1.65;margin-top:8rpx}.message-row{display:flex;align-items:flex-start;gap:13rpx;margin:24rpx 0}.message-row.user{justify-content:flex-end}.message-row.service{justify-content:flex-start}.chat-avatar{width:58rpx;height:58rpx;border-radius:18rpx 18rpx 18rpx 5rpx;font-size:23rpx;flex:0 0 58rpx}.chat-avatar.user{background:#dceee9;color:#087d6e;border-radius:18rpx 18rpx 5rpx 18rpx}.chat-avatar.merchant{background:#fff0dd;color:#c87326}.chat-avatar.admin{background:#ff8950;color:#fff}.chat-avatar.service{background:#e5f4f0;color:#176b60}.message-main{max-width:70%}.sender-label{margin:0 0 8rpx 2rpx;color:#879691;font-size:20rpx}.sender-label.merchant{color:#c87326}.sender-label.admin{color:#0b8a7b}.bubble{background:#fff;padding:20rpx 23rpx;border-radius:6rpx 22rpx 22rpx 22rpx;line-height:1.6;box-shadow:0 5rpx 18rpx rgba(22,63,57,.05);word-break:break-all}.user .bubble{background:#ff8a4c;color:#fff;border-radius:22rpx 6rpx 22rpx 22rpx}.bubble text{display:block;margin-top:12rpx}.message-main>text{display:block;font-size:18rpx;color:#9aa5a2;margin-top:7rpx}.user .message-main>text{text-align:right}.typing{font-size:21rpx;color:#84938f;margin:20rpx 75rpx}.typing text{color:#12a594;letter-spacing:5rpx}.message-bottom{height:30rpx}.bottom-dock{position:fixed;z-index:12;left:0;right:0;bottom:var(--window-bottom,0px);background:#fff;box-shadow:0 -6rpx 24rpx rgba(20,55,49,.07);max-height:190rpx;overflow:hidden}.bottom-dock.expanded{max-height:430rpx}.quick-scroll{height:76rpx;background:#fff;white-space:nowrap;border-top:1rpx solid #e4e9e7}.quick-list{display:flex;gap:14rpx;padding:12rpx 22rpx}.quick-list view{display:inline-block;border:1rpx solid #d9e5e1;color:#46635d;border-radius:99rpx;padding:10rpx 20rpx;font-size:21rpx}.composer{height:114rpx;box-sizing:border-box;background:#fff;display:flex;align-items:center;gap:15rpx;padding:16rpx 22rpx;border-top:1rpx solid #e6ebe9}.tool-btn{width:72rpx;height:72rpx;border-radius:20rpx;background:#eef7f4;color:#0a9381;text-align:center;line-height:72rpx;font-weight:700}.tool-btn.active{background:#dff1ed;color:#066f64;transform:rotate(45deg)}.composer textarea{flex:1;height:72rpx;min-height:72rpx;background:#f3f6f5;border-radius:20rpx;padding:16rpx 20rpx;font-size:25rpx;box-sizing:border-box}.send-btn{height:68rpx;line-height:68rpx;background:#12a594;color:#fff;border-radius:20rpx;padding:0 25rpx;font-weight:700}.send-btn.disabled{opacity:.45}.more-panel{height:240rpx;background:#fff;border-top:1rpx solid #edf2ef;padding:24rpx 28rpx calc(24rpx + env(safe-area-inset-bottom));box-sizing:border-box}.more-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18rpx}.more-item{display:flex;flex-direction:column;align-items:center;gap:12rpx;color:#47635e;font-size:21rpx}.more-item view{width:82rpx;height:82rpx;border-radius:24rpx;background:#f1f6f4;border:1rpx solid #e1ebe7;display:flex;align-items:center;justify-content:center;color:#0b8a7b;font-size:32rpx;font-weight:900}.image-wrap{position:relative;display:inline-block;max-width:320rpx}.chat-image{max-width:320rpx;border-radius:18rpx;display:block}.remote-preload-image{position:absolute;width:1px;height:1px;left:-9999px;top:-9999px;opacity:0;pointer-events:none}.image-progress-mask{position:absolute;inset:0;border-radius:18rpx;background:rgba(8,34,30,.34);display:flex;align-items:center;justify-content:center}.image-progress-circle{width:52rpx;height:52rpx;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 8rpx 22rpx rgba(0,0,0,.16);animation:support-upload-spin .78s linear infinite}.image-progress-circle view{width:34rpx;height:34rpx;border-radius:50%;background:rgba(8,34,30,.58)}.image-error{position:absolute;left:0;right:0;bottom:0;padding:10rpx;border-radius:0 0 18rpx 18rpx;background:rgba(220,73,54,.88);color:#fff;text-align:center;font-size:20rpx}@keyframes support-upload-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}.order-picker-mask{position:fixed;z-index:30;left:0;right:0;top:0;bottom:0;background:rgba(11,31,28,.34);display:flex;align-items:flex-end}.order-picker{width:100%;max-height:72vh;background:#fff;border-radius:34rpx 34rpx 0 0;padding:14rpx 24rpx calc(24rpx + env(safe-area-inset-bottom));box-sizing:border-box;box-shadow:0 -18rpx 55rpx rgba(18,54,48,.18)}.picker-bar{width:76rpx;height:8rpx;margin:0 auto 20rpx;border-radius:99rpx;background:#dbe5e1}.picker-head{display:flex;align-items:center;justify-content:space-between;gap:18rpx;padding:0 4rpx 20rpx}.picker-head b,.picker-head text{display:block}.picker-head b{font-size:30rpx;color:#17332e}.picker-head text{margin-top:6rpx;color:#81918d;font-size:20rpx}.picker-close{flex:0 0 58rpx;width:58rpx;height:58rpx;border-radius:20rpx;background:#f2f6f4;color:#49625d;text-align:center;line-height:54rpx;font-size:40rpx;font-weight:500}.order-picker-scroll{max-height:54vh}.support-order-card{padding:22rpx;margin-bottom:18rpx;border:1rpx solid #e4ece9;border-radius:24rpx;background:#fbfdfc;box-shadow:0 10rpx 28rpx rgba(18,54,48,.05)}.order-card-top{display:flex;align-items:center;gap:16rpx}.order-type-mark{flex:0 0 58rpx;width:58rpx;height:58rpx;border-radius:18rpx;display:flex;align-items:center;justify-content:center;color:#fff;font-size:24rpx;font-weight:900}.order-type-mark.travel{background:linear-gradient(135deg,#13a38f,#59c7b8)}.order-type-mark.study{background:linear-gradient(135deg,#ff7a35,#ffae74)}.order-type-mark.done{background:linear-gradient(135deg,#5d7f78,#93aaa4)}.order-type-mark.warn{background:linear-gradient(135deg,#e45f52,#ff9b73)}.order-card-main{flex:1;min-width:0}.order-card-main b,.order-card-main text{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.order-card-main b{font-size:25rpx;color:#17332e}.order-card-main text{margin-top:5rpx;color:#8b9a96;font-size:19rpx}.order-status{flex:0 0 auto;padding:7rpx 13rpx;border-radius:999rpx;background:#eef7f4;color:#0b8a7b;font-size:19rpx;font-weight:800}.order-status.study{background:#fff2e9;color:#e66f32}.order-status.done{background:#eef3f1;color:#5d756f}.order-status.warn{background:#fff0ec;color:#df5c4d}.order-card-meta{display:grid;grid-template-columns:1fr 1fr;gap:14rpx;margin-top:20rpx}.order-card-meta view{min-width:0;padding:14rpx;border-radius:18rpx;background:#f3f7f5}.order-card-meta text,.order-card-meta b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.order-card-meta text{color:#879691;font-size:18rpx}.order-card-meta b{margin-top:5rpx;color:#26443e;font-size:21rpx}.order-bubble{background:#fff!important;color:#17332e!important;border:1rpx solid #e2ece8;box-shadow:0 8rpx 22rpx rgba(17,61,55,.06)}.chat-order-card{width:420rpx;display:flex;align-items:center;gap:18rpx;color:#17332e}.chat-order-card image,.order-card-fallback{flex:0 0 96rpx;width:96rpx;height:96rpx;border-radius:20rpx}.chat-order-card image{background:#edf3f0}.order-card-fallback{display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#ff8a4c,#ffc18f);color:#fff;font-size:36rpx;font-weight:900}.chat-order-info{flex:1;min-width:0;text-align:left}.chat-order-info b,.chat-order-info text,.chat-order-info small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.chat-order-info b{font-size:24rpx;color:#17332e}.chat-order-info text{margin-top:6rpx;color:#7d8d89;font-size:19rpx}.chat-order-info small{margin-top:10rpx;color:#0b8a79;font-size:20rpx;font-weight:900}.user .chat-order-card{color:#17332e}
</style>




