"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "success",
  setup(__props) {
    const go = () => common_vendor.index.redirectTo({ url: "/pages/mine/travel" });
    const home = () => common_vendor.index.reLaunch({ url: "/pages/index/index" });
    return (_ctx, _cache) => {
      return {
        a: common_vendor.o(go, "6c"),
        b: common_vendor.o(home, "ef")
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-edfdb973"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/taishan/success.js.map
