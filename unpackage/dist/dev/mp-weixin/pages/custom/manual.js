"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "manual",
  setup(__props) {
    const inputs = [{ label: "想去哪里", placeholder: "可填写多个目的地或“还没想好”" }, { label: "出行时间", placeholder: "请选择预计出发日期" }, { label: "旅行天数", placeholder: "例如：5 天 4 夜" }, { label: "人均积分预算", placeholder: "例如：3000-5000 积分" }, { label: "出行人数", placeholder: "请输入人数" }];
    const tags = ["毕业团建", "纪念日", "小众路线", "亲子同行", "摄影旅拍"];
    const selected = common_vendor.ref([]);
    const toggle = (t) => selected.value.includes(t) ? selected.value.splice(selected.value.indexOf(t), 1) : selected.value.push(t);
    const submit = () => common_vendor.index.showModal({ title: "需求提交成功", content: "旅行社将在 48 小时内出具专属方案，请在消息通知中查看。", showCancel: false, success: () => common_vendor.index.redirectTo({ url: "/pages/custom/preview" }) });
    return (_ctx, _cache) => {
      return {
        a: common_vendor.f(inputs, (f, k0, i0) => {
          return {
            a: common_vendor.t(f.label),
            b: f.placeholder,
            c: f.label
          };
        }),
        b: common_vendor.f(tags, (t, k0, i0) => {
          return {
            a: common_vendor.t(t),
            b: t,
            c: selected.value.includes(t) ? 1 : "",
            d: common_vendor.o(($event) => toggle(t), t)
          };
        }),
        c: common_vendor.o(submit, "fb")
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-db488fd4"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/custom/manual.js.map
