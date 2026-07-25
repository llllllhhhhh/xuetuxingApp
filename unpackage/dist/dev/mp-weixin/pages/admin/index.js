"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const stats = [{ name: "邀请注册转化率", num: "23.8%", trend: "↑ 3.2%", up: true }, { name: "积分发放总量", num: "12,860", trend: "今日 +328", up: true }, { name: "泰山游兑换订单", num: "386", trend: "待审核 8", up: false }, { name: "路线浏览量", num: "88.6k", trend: "↑ 12.6%", up: true }, { name: "定制需求订单", num: "1,209", trend: "本月 +168", up: true }];
    const menus = [{ name: "积分规则配置", desc: "有效期、兑换限额", icon: "⚙", url: "/pages/admin/rules" }, { name: "邀请关系与防刷", desc: "异常设备与账号", icon: "🛡", url: "/pages/admin/anti" }, { name: "旅行路线管理", desc: "上下架、库存、旅行社", icon: "🧭", url: "/pages/admin/routes" }, { name: "订单审核", desc: "兑换与定制订单", icon: "✓", url: "/pages/admin/orders" }];
    const bars = [42, 65, 54, 78, 68, 91, 82];
    const go = (url) => common_vendor.index.navigateTo({ url });
    return (_ctx, _cache) => {
      return {
        a: common_vendor.f(stats, (s, k0, i0) => {
          return {
            a: common_vendor.t(s.name),
            b: common_vendor.t(s.num),
            c: common_vendor.t(s.trend),
            d: common_vendor.n(s.up ? "green" : "orange"),
            e: s.name
          };
        }),
        b: common_vendor.f(menus, (m, k0, i0) => {
          return {
            a: common_vendor.t(m.icon),
            b: common_vendor.t(m.name),
            c: common_vendor.t(m.desc),
            d: m.name,
            e: common_vendor.o(($event) => go(m.url), m.name)
          };
        }),
        c: common_vendor.f(bars, (n, i, i0) => {
          return {
            a: n + "%",
            b: common_vendor.t(i + 15),
            c: i
          };
        })
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-9a704506"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/admin/index.js.map
