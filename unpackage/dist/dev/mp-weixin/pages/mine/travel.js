"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "travel",
  setup(__props) {
    const tab = common_vendor.ref(0);
    const tabs = ["待出行订单", "已完成订单", "收藏路线"];
    const favs = [{ name: "川西雪山轻徒步", desc: "5天4夜 · 3680 积分", img: "https://images.unsplash.com/photo-1464278533981-50106e6176b1?w=500" }, { name: "大理治愈计划", desc: "4天3夜 · 2580 积分", img: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=500" }];
    const go = (url) => common_vendor.index.navigateTo({ url });
    const toast = (title) => common_vendor.index.showToast({ title, icon: "none" });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(($event) => toast("上岸后即可预约任意全包路线"), "42"),
        b: common_vendor.f(tabs, (t, i, i0) => {
          return {
            a: common_vendor.t(t),
            b: t,
            c: tab.value === i ? 1 : "",
            d: common_vendor.o(($event) => tab.value = i, t)
          };
        }),
        c: tab.value === 0
      }, tab.value === 0 ? {
        d: common_vendor.o(($event) => go("/pages/taishan/detail"), "b8")
      } : {}, {
        e: tab.value === 1
      }, tab.value === 1 ? {} : {}, {
        f: tab.value === 2
      }, tab.value === 2 ? {
        g: common_vendor.f(favs, (x, k0, i0) => {
          return {
            a: x.img,
            b: common_vendor.t(x.name),
            c: common_vendor.t(x.desc),
            d: x.name,
            e: common_vendor.o(($event) => go("/pages/custom/detail"), x.name)
          };
        })
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-4b257026"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/mine/travel.js.map
