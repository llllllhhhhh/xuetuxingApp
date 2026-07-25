"use strict";
const common_vendor = require("../common/vendor.js");
const utils_api = require("../utils/api.js");
const _sfc_main = {
  __name: "AppHeader",
  setup(__props) {
    const unreadCount = common_vendor.ref(0);
    let timer = null;
    const unreadText = common_vendor.computed(() => unreadCount.value > 9 ? "9+" : String(unreadCount.value));
    const loadUnreadCount = async () => {
      unreadCount.value = await utils_api.getAnnouncementUnreadCount();
    };
    const openAnnouncements = async () => {
      await loadUnreadCount();
      common_vendor.index.navigateTo({ url: "/pages/notice/index" });
    };
    const openSupport = () => {
      if (!utils_api.isLoggedIn()) {
        common_vendor.index.navigateTo({ url: "/pages/auth/login" });
        return;
      }
      common_vendor.index.navigateTo({ url: "/pages/support/chat" });
    };
    common_vendor.onMounted(() => {
      loadUnreadCount();
      timer = setInterval(loadUnreadCount, 1e4);
    });
    common_vendor.onUnmounted(() => {
      if (timer)
        clearInterval(timer);
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: unreadCount.value > 0
      }, unreadCount.value > 0 ? {
        b: common_vendor.t(unreadText.value)
      } : {}, {
        c: common_vendor.o(openAnnouncements, "f9"),
        d: common_vendor.o(openSupport, "24")
      });
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-a54da7ff"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../.sourcemap/mp-weixin/components/AppHeader.js.map
