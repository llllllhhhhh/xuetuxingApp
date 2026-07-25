"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "detail",
  setup(__props) {
    const selected = common_vendor.ref(0);
    const dates = [{ month: "7月", day: "06", stock: "余 12" }, { month: "7月", day: "13", stock: "余 8" }, { month: "7月", day: "20", stock: "余 21" }, { month: "7月", day: "27", stock: "余 16" }];
    const submit = () => common_vendor.index.navigateTo({ url: "/pages/taishan/success" });
    return (_ctx, _cache) => {
      return {
        a: common_vendor.f(dates, (d, i, i0) => {
          return {
            a: common_vendor.t(d.month),
            b: common_vendor.t(d.day),
            c: common_vendor.t(d.stock),
            d: d.day,
            e: selected.value === i ? 1 : "",
            f: common_vendor.o(($event) => selected.value = i, d.day)
          };
        }),
        b: common_vendor.o(submit, "aa")
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-28bb3b24"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/taishan/detail.js.map
