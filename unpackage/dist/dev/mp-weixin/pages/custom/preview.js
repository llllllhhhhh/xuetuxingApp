"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "preview",
  setup(__props) {
    const itinerary = ["成都集合—宽窄巷子 Citywalk", "四姑娘山双桥沟—藏式民宿", "墨石公园—鱼子西日落旅拍", "塔公草原—非遗体验", "康定返程—成都解散"];
    const toast = (title) => common_vendor.index.showToast({ title, icon: "none" });
    return (_ctx, _cache) => {
      return {
        a: common_vendor.f(itinerary, (x, i, i0) => {
          return {
            a: common_vendor.t(i + 1),
            b: common_vendor.t(x),
            c: x
          };
        }),
        b: common_vendor.o(($event) => toast("已通知设计师修改"), "b6"),
        c: common_vendor.o(($event) => toast("订单已创建"), "1b")
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-c842e9f9"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/custom/preview.js.map
