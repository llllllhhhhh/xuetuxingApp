"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "anti",
  setup(__props) {
    const rows = common_vendor.reactive([{ id: "U20260482", phone: "176****8032", time: "06-21 14:20", device: "iOS · A83F", bad: false }, { id: "U20260117", phone: "139****2177", time: "06-21 14:18", device: "Android · 2B19", bad: true }, { id: "U20260329", phone: "188****6201", time: "06-21 13:52", device: "iOS · C472", bad: false }, { id: "U20260204", phone: "177****9920", time: "06-21 13:50", device: "Android · 2B19", bad: true }]);
    const freeze = (r) => {
      r.bad = false;
      common_vendor.index.showToast({ title: "账号已冻结", icon: "none" });
    };
    return (_ctx, _cache) => {
      return {
        a: common_vendor.f(rows, (r, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(r.id),
            b: common_vendor.t(r.phone),
            c: common_vendor.t(r.time),
            d: common_vendor.t(r.device),
            e: common_vendor.t(r.bad ? "异常待审" : "已发放 +1"),
            f: common_vendor.n(r.bad ? "orange" : "green"),
            g: r.bad
          }, r.bad ? {
            h: common_vendor.o(($event) => freeze(r), r.phone)
          } : {}, {
            i: r.phone
          });
        })
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-b63eede6"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/admin/anti.js.map
