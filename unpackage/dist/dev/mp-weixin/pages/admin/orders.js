"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "orders",
  setup(__props) {
    const tab = common_vendor.ref(0), selected = common_vendor.ref([]);
    const tabs = ["待审核", "已通过", "已驳回"];
    const orders = common_vendor.ref([{ id: "TS20260621008", title: "泰山经典游 2天1夜", type: "积分兑换", time: "06-21 14:32", user: "林晓雨", date: "2026-07-06", agency: "齐鲁文旅", status: 0 }, { id: "DZ20260621016", title: "川西雪山深度定制", type: "人工定制", time: "06-21 13:08", user: "陈泽宇", date: "2026-08-12", agency: "", status: 0 }, { id: "TS20260620071", title: "泰山经典游 2天1夜", type: "积分兑换", time: "06-20 18:43", user: "周然", date: "2026-07-13", agency: "齐鲁文旅", status: 0 }]);
    const filtered = common_vendor.computed(() => orders.value.filter((o) => o.status === tab.value));
    const select = (id) => selected.value.includes(id) ? selected.value.splice(selected.value.indexOf(id), 1) : selected.value.push(id);
    const review = (o, a) => {
      o.status = a === "通过" ? 1 : 2;
      common_vendor.index.showToast({ title: `已${a}`, icon: "success" });
    };
    const toast = (title) => common_vendor.index.showToast({ title, icon: "none" });
    return (_ctx, _cache) => {
      return {
        a: common_vendor.f(tabs, (t, i, i0) => {
          return {
            a: common_vendor.t(t),
            b: t,
            c: tab.value === i ? 1 : "",
            d: common_vendor.o(($event) => tab.value = i, t)
          };
        }),
        b: common_vendor.t(selected.value.length),
        c: common_vendor.o(($event) => toast("游客名单已导出"), "39"),
        d: common_vendor.o(($event) => toast("已打开旅行社分配"), "e4"),
        e: common_vendor.f(filtered.value, (o, k0, i0) => {
          return {
            a: selected.value.includes(o.id),
            b: common_vendor.o(($event) => select(o.id), o.id),
            c: common_vendor.t(o.title),
            d: common_vendor.t(o.id),
            e: common_vendor.t(o.time),
            f: common_vendor.t(o.type),
            g: o.type === "积分兑换" ? 1 : "",
            h: common_vendor.t(o.user),
            i: common_vendor.t(o.date),
            j: common_vendor.t(o.agency || "待分配"),
            k: common_vendor.o(($event) => review(o, "驳回"), o.id),
            l: common_vendor.o(($event) => review(o, "通过"), o.id),
            m: o.id
          };
        })
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-5268d37f"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/admin/orders.js.map
