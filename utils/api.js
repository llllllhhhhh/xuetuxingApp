import { COMMERCE_PAYMENT_STATUS, paymentStatusName } from './orderStatus.js'
import { getPendingOnboardingSync, markOnboardingSynced } from './onboarding.js'

const API_ENV_KEY = 'apiEnvironment'
const API_OVERRIDE_KEY = 'apiBaseUrl'
const API_URLS = {
  local: 'http://127.0.0.1:8000/api/v1',
  lan: 'http://192.168.76.206:8000/api/v1',
  production: 'https://goxuetuxing.com/api/v1',
}
const WS_URLS = {
  production: 'wss://goxuetuxing.com/api/v1',
}
const TOKEN_KEY = 'userToken'
const USER_KEY = 'userProfile'

const getWechatEnvVersion = () => {
  // #ifdef MP-WEIXIN
  try {
    return uni.getAccountInfoSync?.().miniProgram?.envVersion || 'release'
  } catch (_) {
    return 'release'
  }
  // #endif
  return 'release'
}

const detectApiBaseUrl = () => {
  // H5：本机调试走同源代理，避免图片资源被浏览器 CORS 拦截；局域网页面走同一台局域网主机；线上页面走同域 Nginx。
  // #ifdef H5
  if (typeof window !== 'undefined') {
    const { protocol, hostname, host } = window.location
    if (hostname === 'localhost' || hostname === '127.0.0.1') return API_URLS.local
    if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname)) {
      return `http://${hostname}:8000/api/v1`
    }
    return `${protocol}//${host}/api/v1`
  }
  // #endif

  // App 安装包始终使用公网服务器，避免打包工具环境变量差异导致误连局域网。
  // #ifdef APP-PLUS
  return API_URLS.production
  // #endif

  // 微信小程序正式版固定使用线上服务器；开发版由 getApiBaseUrl 处理本地覆盖。
  // #ifdef MP-WEIXIN
  return API_URLS.production
  // #endif

  // 其他小程序：开发构建使用局域网，发行构建使用公网服务器。
  const productionBuild = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production'
  return productionBuild ? API_URLS.production : API_URLS.lan
}

export const getApiEnvironment = () => uni.getStorageSync(API_ENV_KEY) || 'auto'
export const setApiEnvironment = environment => {
  const next = ['auto', 'local', 'lan', 'production'].includes(environment) ? environment : 'auto'
  uni.setStorageSync(API_ENV_KEY, next)
  uni.removeStorageSync(API_OVERRIDE_KEY)
  return getApiBaseUrl()
}
export const setCustomApiBaseUrl = url => {
  const normalized = String(url || '').replace(/\/$/, '')
  if (normalized) uni.setStorageSync(API_OVERRIDE_KEY, normalized)
  else uni.removeStorageSync(API_OVERRIDE_KEY)
  uni.setStorageSync(API_ENV_KEY, 'auto')
  return getApiBaseUrl()
}
export const getApiBaseUrl = () => {
  // 微信小程序正式版不接受缓存覆盖；开发版允许连接同一局域网内的本地后端。
  // #ifdef MP-WEIXIN
  if (getWechatEnvVersion() !== 'release') {
    return uni.getStorageSync(API_OVERRIDE_KEY) || API_URLS.lan
  }
  return API_URLS.production
  // #endif

  // 原生 App 无条件使用公网 API，避免升级安装后遗留的本地环境缓存干扰。
  // #ifdef APP-PLUS
  return API_URLS.production
  // #endif
  const environment = getApiEnvironment()
  if (environment !== 'auto') return API_URLS[environment]
  return uni.getStorageSync(API_OVERRIDE_KEY) || detectApiBaseUrl()
}
export const testApiConnection = () => new Promise(resolve => {
  const apiBaseUrl = getApiBaseUrl()
  const healthUrl = `${apiBaseUrl.replace(/\/api\/v1$/, '')}/health`
  const startedAt = Date.now()
  uni.request({
    url: healthUrl,
    method: 'GET',
    timeout: 10000,
    success: response => resolve({
      ok: response.statusCode >= 200 && response.statusCode < 300,
      apiBaseUrl,
      healthUrl,
      statusCode: response.statusCode,
      elapsed: Date.now() - startedAt,
      message: response.data?.status === 'ok' ? '后端连接正常' : '服务器已响应',
    }),
    fail: error => resolve({
      ok: false,
      apiBaseUrl,
      healthUrl,
      statusCode: 0,
      elapsed: Date.now() - startedAt,
      message: error.errMsg || '网络请求失败',
    }),
  })
})
export const getWebSocketBaseUrl = () => {
  // #ifdef MP-WEIXIN
  const miniApiBaseUrl = getApiBaseUrl()
  return miniApiBaseUrl === API_URLS.production
    ? WS_URLS.production
    : miniApiBaseUrl.replace(/^http/, 'ws')
  // #endif
  // #ifdef APP-PLUS
  return WS_URLS.production
  // #endif
  const apiBaseUrl = getApiBaseUrl()
  if (apiBaseUrl.startsWith('/')) {
    // #ifdef H5
    if (typeof window !== 'undefined') {
      return `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}${apiBaseUrl}`
    }
    // #endif
  }
  return apiBaseUrl.replace(/^http/, 'ws')
}
export const getAssetBaseUrl = () => getApiBaseUrl().replace(/\/api\/v1$/, '')

export const getUserToken = () => uni.getStorageSync(TOKEN_KEY) || ''
export const getCurrentUser = () => uni.getStorageSync(USER_KEY) || null
export const isLoggedIn = () => !!getUserToken()

export const saveUserSession = payload => {
  uni.setStorageSync(TOKEN_KEY, payload.token)
  uni.setStorageSync(USER_KEY, payload.user)
  uni.setStorageSync('preferenceUser', { id: payload.user.user_no, name: payload.user.nickname })
}

export const clearUserSession = () => {
  uni.removeStorageSync(TOKEN_KEY)
  uni.removeStorageSync(USER_KEY)
}

const formatApiError = (data, statusCode) => {
  const detail = data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map(item => {
      const field = Array.isArray(item?.loc) ? item.loc[item.loc.length - 1] : ''
      if (field === 'password') return '密码至少需要 6 位'
      if (field === 'phone') return '请输入正确的手机号'
      if (field === 'nickname') return '请填写正确的昵称'
      if (field === 'account') return '请输入正确的登录账号'
      return item?.msg || '提交内容格式不正确'
    }).join('；')
  }
  if (detail && typeof detail === 'object') return detail.message || detail.msg || JSON.stringify(detail)
  if (typeof data?.message === 'string') return data.message
  return `请求失败（HTTP ${statusCode}）`
}

const request = (path, options = {}) => new Promise((resolve, reject) => {
  const headers = { ...(options.headers || {}) }
  if (!options.skipAuth && getUserToken()) headers.Authorization = `Bearer ${getUserToken()}`
  uni.request({
    url: `${getApiBaseUrl()}${path}`,
    method: options.method || 'GET',
    data: options.data,
    header: headers,
    timeout: 8000,
    success: result => {
      if (result.statusCode >= 200 && result.statusCode < 300) {
        resolve(result.data)
        return
      }
      if (result.statusCode === 401) clearUserSession()
      reject(new Error(formatApiError(result.data, result.statusCode)))
    },
    fail: error => reject(new Error(`无法连接服务器 ${getApiBaseUrl()}：${error.errMsg || '网络请求失败'}`)),
  })
})

export const resolveAssetUrl = url => {
  if (!url) return ''
  const raw = String(url)
  if (raw.startsWith('/uploads/')) return `${getAssetBaseUrl()}/api/v1/public/assets/object/${raw.replace(/^\/uploads\//, '')}`
  const apiAssetMatch = raw.match(/^https?:\/\/[^/]+(\/api\/v1\/public\/assets\/.+)$/)
  if (apiAssetMatch) return `${getAssetBaseUrl()}${apiAssetMatch[1]}`
  const obsMatch = raw.match(/^https?:\/\/[^/]*obs[^/]*\/(.+)$/)
  if (obsMatch) return `${getAssetBaseUrl()}/api/v1/public/assets/object/${obsMatch[1]}`
  return /^https?:\/\//.test(raw) ? raw : `${getAssetBaseUrl()}${raw}`
}

export const resolveAssetThumbUrl = url => {
  const resolved = resolveAssetUrl(url)
  return resolved
    .replace(/\/api\/v1\/public\/assets\/(\d+)\/file(\?.*)?$/, '/api/v1/public/assets/$1/thumb$2')
    .replace(/\/api\/v1\/public\/assets\/object\/(.+)$/, '/api/v1/public/assets/object-thumb/$1')
}

const IMAGE_CACHE_KEY = 'supportImageCacheV1'
const IMAGE_CACHE_LIMIT = 60
const imageCacheInFlight = new Set()

const getImageCacheMap = () => uni.getStorageSync(IMAGE_CACHE_KEY) || {}
const setImageCacheMap = map => uni.setStorageSync(IMAGE_CACHE_KEY, map)

const pruneImageCache = map => {
  const entries = Object.entries(map).sort((a, b) => Number(b[1]?.used_at || 0) - Number(a[1]?.used_at || 0))
  const keep = Object.fromEntries(entries.slice(0, IMAGE_CACHE_LIMIT))
  entries.slice(IMAGE_CACHE_LIMIT).forEach(([, item]) => {
    if (item?.path && uni.removeSavedFile) uni.removeSavedFile({ filePath: item.path })
  })
  return keep
}

export const getCachedImagePath = url => {
  const remoteUrl = resolveAssetUrl(url)
  if (!remoteUrl) return ''
  const map = getImageCacheMap()
  const item = map[remoteUrl]
  if (!item?.path) return ''
  item.used_at = Date.now()
  map[remoteUrl] = item
  setImageCacheMap(map)
  return item.path
}

export const cacheImageUrl = (url, onReady) => {
  const remoteUrl = resolveAssetUrl(url)
  if (!remoteUrl || !/^https?:\/\//.test(remoteUrl) || !uni.downloadFile) return remoteUrl
  const cached = getCachedImagePath(remoteUrl)
  if (cached) {
    if (typeof onReady === 'function') onReady(cached)
    return cached
  }
  if (imageCacheInFlight.has(remoteUrl)) return remoteUrl
  imageCacheInFlight.add(remoteUrl)
  setTimeout(() => {
    uni.downloadFile({
      url: remoteUrl,
      success: downloadResult => {
        if (downloadResult.statusCode && (downloadResult.statusCode < 200 || downloadResult.statusCode >= 300)) return
        const tempFilePath = downloadResult.tempFilePath
        if (!tempFilePath) return
        if (!uni.saveFile) {
          if (typeof onReady === 'function') onReady(tempFilePath)
          return
        }
        uni.saveFile({
          tempFilePath,
          success: saveResult => {
            const map = getImageCacheMap()
            map[remoteUrl] = { path: saveResult.savedFilePath, used_at: Date.now() }
            setImageCacheMap(pruneImageCache(map))
            if (typeof onReady === 'function') onReady(saveResult.savedFilePath)
          },
        })
      },
      complete: () => imageCacheInFlight.delete(remoteUrl),
    })
  }, 800)
  return remoteUrl
}

export async function registerUser(payload) {
  return request('/auth/register', { method: 'POST', data: payload, skipAuth: true })
}

export const getInviteDashboard = () => request('/auth/invite/dashboard')

export const getGraduationCertification = () => request('/verification/graduation')

export const submitGraduationCertification = (form, filePath) => new Promise((resolve, reject) => {
  uni.uploadFile({
    url: `${getApiBaseUrl()}/verification/graduation`,
    filePath,
    name: 'file',
    formData: {
      real_name: form.realName,
      school_name: form.schoolName,
      major_name: form.majorName,
      certificate_no: form.certificateNo,
    },
    header: getUserToken() ? { Authorization: `Bearer ${getUserToken()}` } : {},
    timeout: 30000,
    success: result => {
      let data = {}
      try {
        data = JSON.parse(result.data || '{}')
      } catch {
        return reject(new Error('服务器返回格式错误'))
      }
      if (result.statusCode >= 200 && result.statusCode < 300) resolve(data)
      else reject(new Error(formatApiError(data, result.statusCode)))
    },
    fail: error => reject(new Error(error.errMsg || '学生证上传失败')),
  })
})

export const getInviteDeviceId = () => {
  let deviceId = uni.getStorageSync('inviteDeviceId')
  if (deviceId) return deviceId
  const system = uni.getSystemInfoSync ? uni.getSystemInfoSync() : {}
  deviceId = system.deviceId || `${system.platform || 'unknown'}-${system.model || 'device'}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  uni.setStorageSync('inviteDeviceId', deviceId)
  return deviceId
}

export async function loginUser(payload) {
  const result = await request('/auth/login', { method: 'POST', data: payload, skipAuth: true })
  saveUserSession(result)
  await syncPendingOnboardingProfile().catch(() => false)
  return result
}

export async function loginWechatMini(payload) {
  const result = await request('/auth/wechat-mini/login', { method: 'POST', data: payload, skipAuth: true })
  saveUserSession(result)
  await syncPendingOnboardingProfile().catch(() => false)
  return result
}

export async function getSliderCaptcha() {
  return request(`/auth/slider-captcha?_t=${Date.now()}`, { skipAuth: true })
}

export async function verifySliderCaptcha(payload) {
  return request('/auth/slider-captcha/verify', { method: 'POST', data: payload, skipAuth: true })
}

export async function fetchMe() {
  const result = await request('/auth/me')
  const stored = getCurrentUser()
  uni.setStorageSync(USER_KEY, { ...stored, ...result })
  uni.setStorageSync('preferenceUser', { id: result.user_no, name: result.nickname })
  return result
}

export async function getPublishedConfig() {
  try {
    const result = await request(`/public/config?fresh=1&_t=${Date.now()}`, { skipAuth: true })
    if (result.content) {
      uni.setStorageSync('remoteConfig', result.content)
      uni.setStorageSync('remoteConfigVersion', result.version || Date.now())
    }
    return result.content || null
  } catch {
    return uni.getStorageSync('remoteConfig') || null
  }
}

export async function getDecorationPage(pageId) {
  const config = await getPublishedConfig()
  const page = config?.pages?.find(item => item.id === pageId)
  if (!page || page.status === 'draft') return null
  return { ...page, blocks: (page.blocks || []).filter(block => block.visible !== false) }
}

export async function getPublicRoutes() {
  try {
    const routes = await request(`/public/routes?_t=${Date.now()}`, { skipAuth: true })
    uni.setStorageSync('remoteRoutes', routes)
    uni.setStorageSync('routesSynced', true)
    uni.setStorageSync('routesLastSyncAt', Date.now())
    return routes
  } catch {
    const cached = uni.getStorageSync('remoteRoutes') || []
    Object.defineProperty(cached, '__fromCache', { value: true, configurable: true })
    return cached
  }
}

export async function getTravelMatchSettings() {
  try {
    const settings = await request(`/public/travel-match/settings?_t=${Date.now()}`, { skipAuth: true })
    uni.setStorageSync('travelMatchSettings', settings)
    return settings
  } catch {
    return uni.getStorageSync('travelMatchSettings') || null
  }
}

function normalizeAnnouncementList(value) {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.items)) return value.items
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value?.list)) return value.list
  if (Array.isArray(value?.records)) return value.records
  return []
}

export async function getAnnouncements() {
  try {
    const result = await request(`/public/announcements?_t=${Date.now()}`, { skipAuth: true })
    const announcements = normalizeAnnouncementList(result)
    uni.setStorageSync('platformAnnouncements', announcements)
    return announcements
  } catch {
    const announcements = normalizeAnnouncementList(uni.getStorageSync('platformAnnouncements'))
    uni.setStorageSync('platformAnnouncements', announcements)
    return announcements
  }
}

export function getAnnouncementReadIds() {
  const ids = uni.getStorageSync('announcementReadIds')
  return Array.isArray(ids) ? ids : []
}

export function markAnnouncementRead(id) {
  const ids = new Set(getAnnouncementReadIds())
  ids.add(Number(id))
  uni.setStorageSync('announcementReadIds', Array.from(ids))
}

export async function getAnnouncementDetail(id) {
  return request(`/public/announcements/${id}`, { skipAuth: true })
}

export async function getArticles(category = '') {
  const query = category ? `?category=${encodeURIComponent(category)}&_t=${Date.now()}` : `?_t=${Date.now()}`
  try {
    const articles = await request(`/public/articles${query}`, { skipAuth: true })
    uni.setStorageSync('contentArticles', articles)
    return articles
  } catch {
    return uni.getStorageSync('contentArticles') || []
  }
}

export async function getArticleDetail(slugOrId) {
  return request(`/public/articles/${encodeURIComponent(slugOrId)}`, { skipAuth: true })
}

export async function getSchoolSites(keyword = '') {
  const query = keyword ? `?keyword=${encodeURIComponent(keyword)}&_t=${Date.now()}` : `?_t=${Date.now()}`
  try {
    const schools = await request(`/public/schools${query}`, { skipAuth: true })
    uni.setStorageSync('schoolSites', schools)
    return schools
  } catch {
    return uni.getStorageSync('schoolSites') || []
  }
}

export async function getAnnouncementUnreadCount() {
  const announcements = normalizeAnnouncementList(await getAnnouncements())
  const readIds = new Set(getAnnouncementReadIds())
  return announcements.filter(item => !readIds.has(Number(item.id))).length
}

export function getPreferenceUser() {
  const user = getCurrentUser()
  if (user?.user_no) return { id: user.user_no, name: user.nickname }
  let guest = uni.getStorageSync('preferenceUser')
  if (!guest?.id) {
    guest = { id: `G${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`, name: '游客同学' }
    uni.setStorageSync('preferenceUser', guest)
  }
  return guest
}

export async function trackPreference({ type, key, name, action, score }) {
  const user = getPreferenceUser()
  try {
    // Logged-in users send their token so the server attributes the event to
    // str(user.id) (consistent with onboarding events). Anonymous guests keep
    // the guest id and are rate-limited server-side.
    return await request('/public/preferences/events', {
      method: 'POST',
      data: { user_id: user.id, user_name: user.name, preference_type: type, target_key: String(key), target_name: name, action, score },
    })
  } catch {
    return null
  }
}

export async function createSupportConversation() {
  const user = getCurrentUser()
  if (!user?.user_no) throw new Error('请先登录')
  return request('/support/conversations', { method: 'POST', data: { user_id: user.user_no, user_name: user.nickname } })
}

export async function getSupportMessages(conversationId) {
  return request(`/support/conversations/${conversationId}/messages`)
}

export async function createStudyOrderSupportConversation(order) {
  const user = getCurrentUser()
  if (!user?.user_no) throw new Error('请先登录')
  const isStandardOrder = order?.source === 'standard'
  return request('/support/order-conversations', {
    method: 'POST',
    data: {
      user_id: user.user_no,
      user_name: user.nickname,
      order_id: isStandardOrder ? 0 : (order?.id || 0),
      order_no: order?.order_no || ''
    }
  })
}

export async function getUploadSettings() {
  return request('/public/upload/settings', { skipAuth: true })
}

export function uploadSupportImage(conversationId, filePath, onProgress) {
  return new Promise((resolve, reject) => {
    if (typeof onProgress === 'function') onProgress(0)
    const uploadTask = uni.uploadFile({
      url: `${getApiBaseUrl()}/support/upload`,
      filePath,
      name: 'file',
      formData: { conversation_id: conversationId, role: 'user' },
      header: getUserToken() ? { Authorization: `Bearer ${getUserToken()}` } : {},
      success: result => {
        try {
          const data = JSON.parse(result.data)
          if (result.statusCode >= 200 && result.statusCode < 300) {
            if (typeof onProgress === 'function') onProgress(1)
            resolve(data)
          }
          else reject(new Error(data.detail || `HTTP ${result.statusCode}`))
        } catch (error) {
          reject(error)
        }
      },
      fail: reject,
    })
    uploadTask?.onProgressUpdate?.(event => {
      const progress = Math.max(0, Math.min(1, Number(event.progress || 0) / 100))
      if (typeof onProgress === 'function') onProgress(progress)
    })
  })
}

export const syncRemoteConfig = () => Promise.allSettled([getPublishedConfig(), getPublicRoutes(), getAnnouncements()])

export const getStudyProducts = type => request(`/public/study/products${type ? `?product_type=${type}` : ''}`, { skipAuth: true })
export const getStudyProduct = id => request(`/public/study/products/${id}`, { skipAuth: true })
const createIdempotencyKey = prefix => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
export const getWallet = () => request('/commerce/wallet')
export const createStandardOrder = payload => request('/commerce/standard-orders', {
  method: 'POST',
  data: {
    ...payload,
    payment_method: payload.payment_method || 'balance',
    idempotency_key: payload.idempotency_key || createIdempotencyKey('study'),
  },
})
export const payStandardOrderByBalance = orderNo => request(`/commerce/standard-orders/${orderNo}/pay/balance`, { method: 'POST' })
export const createWechatPayment = orderNo => request(`/commerce/standard-orders/${orderNo}/pay/wechat`, { method: 'POST' })
export const getStandardOrder = orderNo => request(`/commerce/standard-orders/${orderNo}`)
export const createStudyOrder = payload => createStandardOrder({
  items: [{
    product_id: payload.product_id,
    quantity: payload.quantity || 1,
    installment_count: payload.installment_count || 1,
  }],
  payment_method: payload.payment_method || 'balance',
  idempotency_key: payload.idempotency_key || createIdempotencyKey(`study-${payload.product_id}`),
})
export const payStudyOrderByBalance = order => payStandardOrderByBalance(order.order_no)
const normalizeStandardOrder = order => ({
  ...order,
  source: 'standard',
  product_name: order.product_name || (order.items || []).map(item => item.product_name).filter(Boolean).join('、') || '学习服务订单',
  product_type: order.product_type || order.items?.[0]?.product_type || 'package',
  amount: order.amount ?? order.payable_amount ?? order.total_amount ?? 0,
})
const normalizeLegacyStudyOrder = order => ({
  ...order,
  source: 'legacy',
  items: order.items || [{
    id: order.product_id,
    product_id: order.product_id,
    product_name: order.product_name,
    product_type: order.product_type,
    quantity: 1,
    total_amount: order.amount,
  }],
  payable_amount: order.payable_amount ?? order.amount ?? 0,
  total_amount: order.total_amount ?? order.amount ?? 0,
  status: order.status || (order.payment_status === COMMERCE_PAYMENT_STATUS.PAID ? COMMERCE_PAYMENT_STATUS.PAID : COMMERCE_PAYMENT_STATUS.PENDING),
  payment_status_text: order.payment_status_text || paymentStatusName(order.payment_status),
})
export const getMyStudyOrders = async () => {
  const [standardResult, legacyResult] = await Promise.allSettled([
    request('/commerce/standard-orders'),
    request('/commerce/orders'),
  ])
  const standardOrders = standardResult.status === 'fulfilled'
    ? (standardResult.value || []).map(normalizeStandardOrder)
    : []
  const legacyOrders = legacyResult.status === 'fulfilled'
    ? (legacyResult.value || []).map(normalizeLegacyStudyOrder)
    : []
  const dedup = new Map()
  ;[...standardOrders, ...legacyOrders].forEach(order => {
    const key = order.order_no || `${order.source}-${order.id}`
    if (!dedup.has(key)) dedup.set(key, order)
  })
  const orders = [...dedup.values()].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
  if (!orders.length) {
    const firstError = standardResult.status === 'rejected' ? standardResult.reason : legacyResult.reason
    if (standardResult.status === 'rejected' && legacyResult.status === 'rejected') throw firstError
  }
  return orders
}
export const getLearningCenter = () => request('/commerce/me/learning-center')
export const studyCheckIn = () => request('/commerce/me/check-in', { method: 'POST' })
export const updateLearningProfile = data => request('/commerce/me/learning-profile', { method: 'PUT', data })
export const completeLearningOnboarding = data => request('/commerce/me/onboarding', { method: 'PUT', data })
export async function syncPendingOnboardingProfile() {
  const pending = getPendingOnboardingSync()
  if (!pending || !isLoggedIn()) return false
  const result = await completeLearningOnboarding({
    version: Number(pending.version),
    answers: pending.answers || {},
  })
  markOnboardingSynced(result.version || pending.version)
  return true
}
export const submitCustomTravelRequest = data => request('/custom-travel/requests', { method: 'POST', data })
export const getMyCustomTravelRequests = () => request('/custom-travel/requests')
export const getCustomTravelRequest = id => request(`/custom-travel/requests/${id}`)
export const getMyTravelOrders = () => request('/travel/orders')
export const getTravelContractTemplate = () => request('/travel/contract-template')
export const signTravelContract = (orderId, data) => request(`/travel/orders/${orderId}/contract/sign`, { method: 'POST', data })
export const submitTravelPickupInfo = (orderId, data) => request(`/travel/orders/${orderId}/pickup-info`, { method: 'PUT', data })
export const confirmTravelPickup = orderId => request(`/travel/orders/${orderId}/pickup/confirm`, { method: 'PATCH' })
export const cancelTravelOrder = (orderId, reason) => request(`/travel/orders/${orderId}/cancel`, { method: 'PATCH', data: { reason } })

const exchangeIdempotencyKey = routeId => {
  const userId = getCurrentUser()?.id || 'anonymous'
  const storageKey = `travelExchangeIdempotency:${userId}:${routeId}`
  const cached = uni.getStorageSync(storageKey)
  if (cached?.key && Date.now() - Number(cached.createdAt || 0) < 10 * 60 * 1000) {
    return { storageKey, key: cached.key }
  }
  const random = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`
  const key = `travel-${userId}-${routeId}-${random}`
  uni.setStorageSync(storageKey, { key, createdAt: Date.now() })
  return { storageKey, key }
}

export const exchangeTravelRoute = async (routeId, data = {}) => {
  const pending = exchangeIdempotencyKey(routeId)
  const result = await request(`/travel/routes/${routeId}/exchange`, {
    method: 'POST',
    data,
    headers: { 'Idempotency-Key': pending.key },
  })
  uni.removeStorageSync(pending.storageKey)
  return result
}
export const getTravelRouteReviews = routeId => request(`/public/routes/${routeId}/reviews?_t=${Date.now()}`, { skipAuth: true })
export const getTravelRouteReviewEligibility = routeId => request(`/travel/routes/${routeId}/review-eligibility`)
export const submitTravelRouteReview = (routeId, data) => request(`/travel/routes/${routeId}/reviews`, { method: 'POST', data })
export const uploadTravelRouteReviewImage = (routeId, filePath, onProgress) => new Promise((resolve, reject) => {
  if (typeof onProgress === 'function') onProgress(0)
  const uploadTask = uni.uploadFile({
    url: `${getApiBaseUrl()}/travel/routes/${routeId}/reviews/upload`,
    filePath,
    name: 'file',
    header: getUserToken() ? { Authorization: `Bearer ${getUserToken()}` } : {},
    success: result => {
      let data = {}
      try {
        data = JSON.parse(result.data || '{}')
      } catch {
        return reject(new Error('服务器返回格式错误'))
      }
      if (result.statusCode >= 200 && result.statusCode < 300) resolve(data)
      else reject(new Error(formatApiError(data, result.statusCode)))
    },
    fail: error => reject(new Error(error.errMsg || '图片上传失败')),
  })
  uploadTask?.onProgressUpdate?.(event => {
    const progress = Math.max(0, Math.min(1, Number(event.progress || 0) / 100))
    if (typeof onProgress === 'function') onProgress(progress)
  })
})
