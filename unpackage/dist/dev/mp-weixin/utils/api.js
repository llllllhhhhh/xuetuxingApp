"use strict";
const common_vendor = require("../common/vendor.js");
const API_URLS = {
  local: "http://127.0.0.1:8000/api/v1",
  lan: "http://192.168.0.212:8000/api/v1",
  production: "http://113.44.149.128/api/v1"
};
const WS_URLS = {
  production: "ws://113.44.149.128:8000/api/v1"
};
const TOKEN_KEY = "userToken";
const USER_KEY = "userProfile";
const getApiBaseUrl = () => {
  return API_URLS.production;
};
const testApiConnection = () => new Promise((resolve) => {
  const apiBaseUrl = getApiBaseUrl();
  const healthUrl = `${apiBaseUrl.replace(/\/api\/v1$/, "")}/health`;
  const startedAt = Date.now();
  common_vendor.index.request({
    url: healthUrl,
    method: "GET",
    timeout: 1e4,
    success: (response) => {
      var _a;
      return resolve({
        ok: response.statusCode >= 200 && response.statusCode < 300,
        apiBaseUrl,
        healthUrl,
        statusCode: response.statusCode,
        elapsed: Date.now() - startedAt,
        message: ((_a = response.data) == null ? void 0 : _a.status) === "ok" ? "后端连接正常" : "服务器已响应"
      });
    },
    fail: (error) => resolve({
      ok: false,
      apiBaseUrl,
      healthUrl,
      statusCode: 0,
      elapsed: Date.now() - startedAt,
      message: error.errMsg || "网络请求失败"
    })
  });
});
const getWebSocketBaseUrl = () => {
  return WS_URLS.production;
};
const getAssetBaseUrl = () => getApiBaseUrl().replace(/\/api\/v1$/, "");
const getUserToken = () => common_vendor.index.getStorageSync(TOKEN_KEY) || "";
const getCurrentUser = () => common_vendor.index.getStorageSync(USER_KEY) || null;
const isLoggedIn = () => !!getUserToken();
const saveUserSession = (payload) => {
  common_vendor.index.setStorageSync(TOKEN_KEY, payload.token);
  common_vendor.index.setStorageSync(USER_KEY, payload.user);
  common_vendor.index.setStorageSync("preferenceUser", { id: payload.user.user_no, name: payload.user.nickname });
};
const formatApiError = (data, statusCode) => {
  const detail = data == null ? void 0 : data.detail;
  if (typeof detail === "string")
    return detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => {
      const field = Array.isArray(item == null ? void 0 : item.loc) ? item.loc[item.loc.length - 1] : "";
      if (field === "password")
        return "密码至少需要 6 位";
      if (field === "phone")
        return "请输入正确的手机号";
      if (field === "nickname")
        return "请填写正确的昵称";
      if (field === "account")
        return "请输入正确的登录账号";
      return (item == null ? void 0 : item.msg) || "提交内容格式不正确";
    }).join("；");
  }
  if (detail && typeof detail === "object")
    return detail.message || detail.msg || JSON.stringify(detail);
  if (typeof (data == null ? void 0 : data.message) === "string")
    return data.message;
  return `请求失败（HTTP ${statusCode}）`;
};
const request = (path, options = {}) => new Promise((resolve, reject) => {
  const headers = { ...options.headers || {} };
  if (!options.skipAuth && getUserToken())
    headers.Authorization = `Bearer ${getUserToken()}`;
  common_vendor.index.request({
    url: `${getApiBaseUrl()}${path}`,
    method: options.method || "GET",
    data: options.data,
    header: headers,
    timeout: 8e3,
    success: (result) => result.statusCode >= 200 && result.statusCode < 300 ? resolve(result.data) : reject(new Error(formatApiError(result.data, result.statusCode))),
    fail: (error) => reject(new Error(`无法连接服务器 ${getApiBaseUrl()}：${error.errMsg || "网络请求失败"}`))
  });
});
const resolveAssetUrl = (url) => {
  if (!url)
    return "";
  return /^https?:\/\//.test(url) ? url : `${getAssetBaseUrl()}${url}`;
};
async function registerUser(payload) {
  return request("/auth/register", { method: "POST", data: payload, skipAuth: true });
}
const getInviteDashboard = () => request("/auth/invite/dashboard");
const getGraduationCertification = () => request("/verification/graduation");
const submitGraduationCertification = (form, filePath) => new Promise((resolve, reject) => {
  common_vendor.index.uploadFile({
    url: `${getApiBaseUrl()}/verification/graduation`,
    filePath,
    name: "file",
    formData: {
      real_name: form.realName,
      school_name: form.schoolName,
      major_name: form.majorName,
      graduation_date: form.graduationDate,
      certificate_no: form.certificateNo
    },
    header: getUserToken() ? { Authorization: `Bearer ${getUserToken()}` } : {},
    timeout: 3e4,
    success: (result) => {
      let data = {};
      try {
        data = JSON.parse(result.data || "{}");
      } catch {
        return reject(new Error("服务器返回格式错误"));
      }
      if (result.statusCode >= 200 && result.statusCode < 300)
        resolve(data);
      else
        reject(new Error(formatApiError(data, result.statusCode)));
    },
    fail: (error) => reject(new Error(error.errMsg || "毕业证上传失败"))
  });
});
const getInviteDeviceId = () => {
  let deviceId = common_vendor.index.getStorageSync("inviteDeviceId");
  if (deviceId)
    return deviceId;
  const system = common_vendor.index.getSystemInfoSync ? common_vendor.index.getSystemInfoSync() : {};
  deviceId = system.deviceId || `${system.platform || "unknown"}-${system.model || "device"}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  common_vendor.index.setStorageSync("inviteDeviceId", deviceId);
  return deviceId;
};
async function loginUser(payload) {
  const result = await request("/auth/login", { method: "POST", data: payload, skipAuth: true });
  saveUserSession(result);
  return result;
}
async function fetchMe() {
  const result = await request("/auth/me");
  const stored = getCurrentUser();
  common_vendor.index.setStorageSync(USER_KEY, { ...stored, ...result });
  common_vendor.index.setStorageSync("preferenceUser", { id: result.user_no, name: result.nickname });
  return result;
}
async function getPublishedConfig() {
  try {
    const result = await request("/public/config", { skipAuth: true });
    if (result.content)
      common_vendor.index.setStorageSync("remoteConfig", result.content);
    return result.content || null;
  } catch {
    return common_vendor.index.getStorageSync("remoteConfig") || null;
  }
}
async function getPublicRoutes() {
  try {
    const routes = await request(`/public/routes?_t=${Date.now()}`, { skipAuth: true });
    common_vendor.index.setStorageSync("remoteRoutes", routes);
    common_vendor.index.setStorageSync("routesSynced", true);
    common_vendor.index.setStorageSync("routesLastSyncAt", Date.now());
    return routes;
  } catch {
    const cached = common_vendor.index.getStorageSync("remoteRoutes") || [];
    Object.defineProperty(cached, "__fromCache", { value: true, configurable: true });
    return cached;
  }
}
async function getAnnouncements() {
  try {
    const announcements = await request(`/public/announcements?_t=${Date.now()}`, { skipAuth: true });
    common_vendor.index.setStorageSync("platformAnnouncements", announcements);
    return announcements;
  } catch {
    return common_vendor.index.getStorageSync("platformAnnouncements") || [];
  }
}
function getAnnouncementReadIds() {
  return common_vendor.index.getStorageSync("announcementReadIds") || [];
}
function markAnnouncementRead(id) {
  const ids = new Set(getAnnouncementReadIds());
  ids.add(Number(id));
  common_vendor.index.setStorageSync("announcementReadIds", Array.from(ids));
}
async function getAnnouncementDetail(id) {
  return request(`/public/announcements/${id}`, { skipAuth: true });
}
async function getArticles(category = "") {
  const query = category ? `?category=${encodeURIComponent(category)}&_t=${Date.now()}` : `?_t=${Date.now()}`;
  try {
    const articles = await request(`/public/articles${query}`, { skipAuth: true });
    common_vendor.index.setStorageSync("contentArticles", articles);
    return articles;
  } catch {
    return common_vendor.index.getStorageSync("contentArticles") || [];
  }
}
async function getArticleDetail(slugOrId) {
  return request(`/public/articles/${encodeURIComponent(slugOrId)}`, { skipAuth: true });
}
async function getAnnouncementUnreadCount() {
  const announcements = await getAnnouncements();
  const readIds = new Set(getAnnouncementReadIds());
  return announcements.filter((item) => !readIds.has(Number(item.id))).length;
}
function getPreferenceUser() {
  const user = getCurrentUser();
  if (user == null ? void 0 : user.user_no)
    return { id: user.user_no, name: user.nickname };
  let guest = common_vendor.index.getStorageSync("preferenceUser");
  if (!(guest == null ? void 0 : guest.id)) {
    guest = { id: `G${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`, name: "游客同学" };
    common_vendor.index.setStorageSync("preferenceUser", guest);
  }
  return guest;
}
async function trackPreference({ type, key, name, action, score }) {
  const user = getPreferenceUser();
  try {
    return await request("/public/preferences/events", {
      method: "POST",
      data: { user_id: user.id, user_name: user.name, preference_type: type, target_key: String(key), target_name: name, action, score },
      skipAuth: true
    });
  } catch {
    return null;
  }
}
async function createSupportConversation() {
  const user = getCurrentUser();
  if (!(user == null ? void 0 : user.user_no))
    throw new Error("请先登录");
  return request("/support/conversations", { method: "POST", data: { user_id: user.user_no, user_name: user.nickname } });
}
async function getSupportMessages(conversationId) {
  return request(`/support/conversations/${conversationId}/messages`);
}
function uploadSupportImage(conversationId, filePath) {
  return new Promise((resolve, reject) => {
    common_vendor.index.uploadFile({
      url: `${getApiBaseUrl()}/support/upload`,
      filePath,
      name: "file",
      formData: { conversation_id: conversationId, role: "user" },
      header: getUserToken() ? { Authorization: `Bearer ${getUserToken()}` } : {},
      success: (result) => {
        try {
          const data = JSON.parse(result.data);
          if (result.statusCode >= 200 && result.statusCode < 300)
            resolve(data);
          else
            reject(new Error(data.detail || `HTTP ${result.statusCode}`));
        } catch (error) {
          reject(error);
        }
      },
      fail: reject
    });
  });
}
const syncRemoteConfig = () => Promise.allSettled([getPublishedConfig(), getPublicRoutes(), getAnnouncements()]);
const getStudyProducts = (type) => request(`/public/study/products${type ? `?product_type=${type}` : ""}`, { skipAuth: true });
const getStudyProduct = (id) => request(`/public/study/products/${id}`, { skipAuth: true });
const createStudyOrder = (payload) => request("/commerce/orders", { method: "POST", data: payload });
const mockPayStudyOrder = (id) => request(`/commerce/orders/${id}/pay/mock`, { method: "POST" });
const getStudyPaymentParams = (id) => request(`/commerce/orders/${id}/payment`);
const getMyStudyOrders = () => request("/commerce/orders");
const getLearningCenter = () => request("/commerce/me/learning-center");
const studyCheckIn = () => request("/commerce/me/check-in", { method: "POST" });
exports.createStudyOrder = createStudyOrder;
exports.createSupportConversation = createSupportConversation;
exports.fetchMe = fetchMe;
exports.getAnnouncementDetail = getAnnouncementDetail;
exports.getAnnouncementReadIds = getAnnouncementReadIds;
exports.getAnnouncementUnreadCount = getAnnouncementUnreadCount;
exports.getAnnouncements = getAnnouncements;
exports.getApiBaseUrl = getApiBaseUrl;
exports.getArticleDetail = getArticleDetail;
exports.getArticles = getArticles;
exports.getCurrentUser = getCurrentUser;
exports.getGraduationCertification = getGraduationCertification;
exports.getInviteDashboard = getInviteDashboard;
exports.getInviteDeviceId = getInviteDeviceId;
exports.getLearningCenter = getLearningCenter;
exports.getMyStudyOrders = getMyStudyOrders;
exports.getPublicRoutes = getPublicRoutes;
exports.getPublishedConfig = getPublishedConfig;
exports.getStudyPaymentParams = getStudyPaymentParams;
exports.getStudyProduct = getStudyProduct;
exports.getStudyProducts = getStudyProducts;
exports.getSupportMessages = getSupportMessages;
exports.getWebSocketBaseUrl = getWebSocketBaseUrl;
exports.isLoggedIn = isLoggedIn;
exports.loginUser = loginUser;
exports.markAnnouncementRead = markAnnouncementRead;
exports.mockPayStudyOrder = mockPayStudyOrder;
exports.registerUser = registerUser;
exports.resolveAssetUrl = resolveAssetUrl;
exports.studyCheckIn = studyCheckIn;
exports.submitGraduationCertification = submitGraduationCertification;
exports.syncRemoteConfig = syncRemoteConfig;
exports.testApiConnection = testApiConnection;
exports.trackPreference = trackPreference;
exports.uploadSupportImage = uploadSupportImage;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/api.js.map
