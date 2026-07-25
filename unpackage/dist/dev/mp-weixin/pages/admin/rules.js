"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "rules",
  setup(__props) {
    const rules = [{
      name: "兑换所需积分",
      tip: "达到该积分后开放兑换按钮",
      value: 100,
      unit: "分"
    }, {
      name: "单人年度兑换上限",
      tip: "按自然年统计",
      value: 1,
      unit: "次"
    }, {
      name: "月度兑换名额",
      tip: "所有用户共享库存",
      value: 50,
      unit: "份"
    }];
    const save = () => common_vendor.index.showToast({
      title: "配置已保存",
      icon: "success"
    });
    return (_ctx, _cache) => {
      return {
        a: common_vendor.f(rules, (r, k0, i0) => {
          return {
            a: common_vendor.t(r.name),
            b: common_vendor.t(r.tip),
            c: r.value,
            d: common_vendor.t(r.unit),
            e: r.name
          };
        }),
        b: common_vendor.o(save, "a1")
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-0e9c7d0f"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/admin/rules.js.map
