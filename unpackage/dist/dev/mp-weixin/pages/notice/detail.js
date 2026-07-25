"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const _sfc_main = {
  __name: "detail",
  setup(__props) {
    const loading = common_vendor.ref(true);
    const detail = common_vendor.ref(null);
    const formatTime = (value) => {
      if (!value)
        return "刚刚发布";
      return String(value).replace("T", " ").slice(0, 16);
    };
    common_vendor.onLoad(async (options) => {
      const id = Number((options == null ? void 0 : options.id) || 0);
      if (!id) {
        loading.value = false;
        return;
      }
      try {
        detail.value = await utils_api.getAnnouncementDetail(id);
        utils_api.markAnnouncementRead(id);
      } catch {
        detail.value = null;
      } finally {
        loading.value = false;
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: loading.value
      }, loading.value ? {} : detail.value ? common_vendor.e({
        c: detail.value.pinned
      }, detail.value.pinned ? {} : {}, {
        d: common_vendor.t(detail.value.tag || "平台公告"),
        e: common_vendor.t(formatTime(detail.value.published_at || detail.value.created_at)),
        f: common_vendor.t(detail.value.title),
        g: common_vendor.t(detail.value.summary),
        h: common_vendor.t(detail.value.content)
      }) : {}, {
        b: detail.value
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-0f737f11"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/notice/detail.js.map
