"use strict";
const common_vendor = require("../common/vendor.js");
const _sfc_main = {
  __name: "BottomNav",
  props: { active: { type: String, default: "首页" } },
  setup(__props) {
    const items = [{ name: "首页", icon: "⌂", url: "/pages/index/index" }, { name: "题库", icon: "✎" }, { name: "资料", icon: "▤" }, { name: "旅行", icon: "⌁", url: "/pages/travel/index" }, { name: "我的", icon: "◉", url: "/pages/mine/index" }];
    const go = (i) => i.url ? common_vendor.index.reLaunch({ url: i.url }) : common_vendor.index.showToast({ title: `${i.name}模块演示入口`, icon: "none" });
    return (_ctx, _cache) => {
      return {
        a: common_vendor.f(items, (i, k0, i0) => {
          return {
            a: common_vendor.t(i.icon),
            b: common_vendor.t(i.name),
            c: i.name,
            d: __props.active === i.name ? 1 : "",
            e: common_vendor.o(($event) => go(i), i.name)
          };
        })
      };
    };
  }
};
wx.createComponent(_sfc_main);
//# sourceMappingURL=../../.sourcemap/mp-weixin/components/BottomNav.js.map
