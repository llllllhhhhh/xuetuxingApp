"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "params",
  setup(__props) {
    const fields = common_vendor.reactive([{ label: "目的地偏好", tip: "可多选", opts: ["西南秘境", "海滨城市", "西北旷野", "江南古镇"], selected: ["西南秘境"] }, { label: "出行天数", tip: "单选", opts: ["2-3 天", "4-5 天", "6-7 天", "8 天以上"], selected: ["4-5 天"] }, { label: "旅行主题", tip: "可多选", opts: ["户外徒步", "人文研学", "美食探索", "旅拍出片", "毕业团建"], selected: ["户外徒步", "旅拍出片"] }, { label: "出行人数", tip: "单选", opts: ["1 人", "2 人", "3-5 人", "6 人以上"], selected: ["2 人"] }]);
    const toggle = (f, o) => {
      if (f.tip === "单选")
        f.selected = [o];
      else
        f.selected.includes(o) ? f.selected.splice(f.selected.indexOf(o), 1) : f.selected.push(o);
    };
    const match = () => common_vendor.index.navigateTo({ url: "/pages/travel/index" });
    return (_ctx, _cache) => {
      return {
        a: common_vendor.f(fields, (f, k0, i0) => {
          return {
            a: common_vendor.t(f.label),
            b: common_vendor.t(f.tip),
            c: common_vendor.f(f.opts, (o, k1, i1) => {
              return {
                a: common_vendor.t(o),
                b: o,
                c: f.selected.includes(o) ? 1 : "",
                d: common_vendor.o(($event) => toggle(f, o), o)
              };
            }),
            d: f.label
          };
        }),
        b: common_vendor.o(match, "1c")
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-52436626"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/custom/params.js.map
