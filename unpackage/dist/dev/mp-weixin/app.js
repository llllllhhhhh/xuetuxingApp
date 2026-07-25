"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
const utils_api = require("./utils/api.js");
if (!Math) {
  "./pages/index/index.js";
  "./pages/travel/index.js";
  "./pages/points/activity.js";
  "./pages/points/poster.js";
  "./pages/points/exchange.js";
  "./pages/taishan/detail.js";
  "./pages/taishan/success.js";
  "./pages/custom/detail.js";
  "./pages/custom/params.js";
  "./pages/custom/manual.js";
  "./pages/custom/preview.js";
  "./pages/mine/index.js";
  "./pages/mine/points.js";
  "./pages/mine/travel.js";
  "./pages/mine/graduation.js";
  "./pages/notice/index.js";
  "./pages/notice/detail.js";
  "./pages/article/index.js";
  "./pages/article/detail.js";
  "./pages/support/chat.js";
  "./pages/auth/login.js";
  "./pages/study/index.js";
  "./pages/study/detail.js";
  "./pages/study/center.js";
  "./pages/admin/index.js";
  "./pages/admin/rules.js";
  "./pages/admin/anti.js";
  "./pages/admin/routes.js";
  "./pages/admin/orders.js";
}
const _sfc_main = {
  onLaunch() {
    if (common_vendor.index.getStorageSync("points") === "")
      common_vendor.index.setStorageSync("points", 0);
    const apiUrl = utils_api.getApiBaseUrl();
    common_vendor.index.setStorageSync("lastResolvedApiUrl", apiUrl);
    common_vendor.index.__f__("log", "at App.vue:9", "[学徒行] 当前 API 地址：", apiUrl);
    utils_api.syncRemoteConfig();
  }
};
function createApp() {
  const app = common_vendor.createSSRApp(_sfc_main);
  return { app };
}
createApp().app.mount("#app");
exports.createApp = createApp;
//# sourceMappingURL=../.sourcemap/mp-weixin/app.js.map
