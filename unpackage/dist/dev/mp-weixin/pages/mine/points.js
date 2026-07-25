"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const _sfc_main = {
  __name: "points",
  setup(__props) {
    const data = common_vendor.reactive({ points: 0, granted_count: 0, records: [] });
    const pendingCount = common_vendor.computed(() => data.records.filter((item) => !item.score_granted && item.status === "pending").length);
    const formatTime = (value) => value ? String(value).replace("T", " ").slice(0, 16) : "";
    const maskPhone = (phone) => String(phone || "").replace(/^(\d{3})\d+(\d{4})$/, "$1****$2");
    const statusText = (item) => item.score_granted ? "积分已到账" : item.status === "rejected" ? "未通过审核" : "等待审核";
    const goInvite = () => common_vendor.index.navigateTo({ url: "/pages/points/activity" });
    common_vendor.onShow(async () => {
      if (!utils_api.isLoggedIn())
        return common_vendor.index.redirectTo({ url: "/pages/auth/login" });
      try {
        Object.assign(data, await utils_api.getInviteDashboard());
      } catch (error) {
        common_vendor.index.showToast({ title: error.message || "积分记录加载失败", icon: "none" });
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(data.points),
        b: common_vendor.t(data.granted_count),
        c: common_vendor.t(pendingCount.value),
        d: common_vendor.o(goInvite, "88"),
        e: !data.records.length
      }, !data.records.length ? {} : {}, {
        f: common_vendor.f(data.records, (item, k0, i0) => {
          return {
            a: common_vendor.t((item.nickname || "友")[0]),
            b: common_vendor.t(item.nickname),
            c: common_vendor.t(formatTime(item.created_at)),
            d: common_vendor.t(statusText(item)),
            e: common_vendor.t(item.score_granted ? `+${item.score}` : "--"),
            f: common_vendor.n(item.score_granted ? "money" : "pending"),
            g: item.phone
          };
        }),
        g: common_vendor.f(data.records, (item, k0, i0) => {
          return {
            a: common_vendor.t(maskPhone(item.phone)),
            b: common_vendor.t(formatTime(item.created_at).slice(5)),
            c: common_vendor.t(item.score_granted ? `有效 +${item.score}` : "待审核"),
            d: common_vendor.n(item.score_granted ? "green" : "orange"),
            e: `row-${item.phone}`
          };
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-f2dca3ba"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/mine/points.js.map
