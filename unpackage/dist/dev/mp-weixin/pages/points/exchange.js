"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "exchange",
  setup(__props) {
    const confirm = () => {
      common_vendor.index.setStorageSync("points", 0);
      common_vendor.index.redirectTo({ url: "/pages/taishan/detail" });
    };
    const back = () => common_vendor.index.navigateBack();
    return (_ctx, _cache) => {
      return {
        a: common_vendor.o(confirm, "12"),
        b: common_vendor.o(back, "9a")
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-3eb9bbc3"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/points/exchange.js.map
