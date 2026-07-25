"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "routes",
  setup(__props) {
    const show = common_vendor.ref(false), editing = common_vendor.ref(null);
    const routes = common_vendor.reactive([{
      name: "川西雪山轻徒步",
      type: "户外",
      days: "5天4夜",
      agency: "山海旅行",
      stock: 42,
      on: true,
      img: "https://images.unsplash.com/photo-1464278533981-50106e6176b1?w=400"
    }, {
      name: "泉州非遗漫游",
      type: "研学",
      days: "3天2夜",
      agency: "知行文旅",
      stock: 28,
      on: true,
      img: "https://images.unsplash.com/photo-1528127269322-539801943592?w=400"
    }, {
      name: "青岛海风毕业季",
      type: "团建",
      days: "3天2夜",
      agency: "青年假日",
      stock: 0,
      on: false,
      img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400"
    }]);
    const edit = (r) => {
      editing.value = r;
      show.value = true;
    };
    const save = () => {
      show.value = false;
      common_vendor.index.showToast({
        title: "路线已保存",
        icon: "success"
      });
    };
    const toast = (title) => common_vendor.index.showToast({
      title,
      icon: "none"
    });
    return (_ctx, _cache) => {
      var _a;
      return common_vendor.e({
        a: common_vendor.o(($event) => show.value = true, "3f"),
        b: common_vendor.f(routes, (r, k0, i0) => {
          return {
            a: r.img,
            b: common_vendor.t(r.name),
            c: common_vendor.t(r.type),
            d: common_vendor.t(r.days),
            e: common_vendor.t(r.agency),
            f: common_vendor.t(r.stock),
            g: common_vendor.o(($event) => edit(r), r.name),
            h: common_vendor.o(($event) => toast("团期库存设置"), r.name),
            i: common_vendor.o(($event) => toast("旅行社绑定配置"), r.name),
            j: r.on ? 1 : "",
            k: common_vendor.o(($event) => r.on = !r.on, r.name),
            l: r.name
          };
        }),
        c: show.value
      }, show.value ? {
        d: common_vendor.t(editing.value ? "编辑" : "新增"),
        e: (_a = editing.value) == null ? void 0 : _a.name,
        f: common_vendor.o(save, "05"),
        g: common_vendor.o(($event) => show.value = false, "35")
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-94a285d9"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/admin/routes.js.map
