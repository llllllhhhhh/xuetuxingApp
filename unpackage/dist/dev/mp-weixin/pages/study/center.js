"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const _sfc_main = {
  __name: "center",
  setup(__props) {
    const data = common_vendor.ref({ profile: {}, entitlements: [] });
    const loading = common_vendor.ref(true);
    const checked = common_vendor.ref(false);
    const ordersVisible = common_vendor.ref(false);
    const orders = common_vendor.ref([]);
    const typeName = (value) => ({ community: "督学社群", package: "长期套餐", material: "资料包" })[value] || "学习服务";
    const typeIcon = (value) => ({ community: "群", package: "课", material: "料" })[value] || "学";
    const lessonIcon = (value) => ({ lesson: "课", material: "料", test: "测", live: "播", service: "服" })[value] || "学";
    const formatDate = (value) => new Date(value).toLocaleDateString();
    const formatTime = (value) => new Date(value).toLocaleDateString();
    const load = async () => {
      var _a;
      try {
        data.value = await utils_api.getLearningCenter();
        const last = (_a = data.value.profile) == null ? void 0 : _a.last_checkin_at;
        checked.value = Boolean(last && new Date(last).toDateString() === (/* @__PURE__ */ new Date()).toDateString());
      } catch (error) {
        common_vendor.index.showToast({ title: error.message || "加载失败", icon: "none" });
      } finally {
        loading.value = false;
      }
    };
    const checkIn = async () => {
      if (checked.value)
        return common_vendor.index.showToast({ title: "今天已经打卡", icon: "none" });
      try {
        const result = await utils_api.studyCheckIn();
        checked.value = true;
        data.value.profile.checkin_days = result.checkin_days;
        common_vendor.index.showToast({ title: result.message });
      } catch (error) {
        common_vendor.index.showToast({ title: error.message || "打卡失败", icon: "none" });
      }
    };
    const goShop = () => common_vendor.index.navigateTo({ url: "/pages/study/index" });
    const showOrders = async () => {
      ordersVisible.value = !ordersVisible.value;
      if (ordersVisible.value && !orders.value.length) {
        try {
          orders.value = await utils_api.getMyStudyOrders();
        } catch (error) {
          common_vendor.index.showToast({ title: error.message || "订单加载失败", icon: "none" });
        }
      }
    };
    common_vendor.onLoad(load);
    return (_ctx, _cache) => {
      var _a, _b, _c, _d, _e, _f;
      return common_vendor.e({
        a: common_vendor.t(((_a = data.value.profile) == null ? void 0 : _a.target_exam) || "待设置"),
        b: common_vendor.t(((_b = data.value.profile) == null ? void 0 : _b.current_stage) || "基础阶段"),
        c: common_vendor.t(((_c = data.value.profile) == null ? void 0 : _c.checkin_days) || 0),
        d: common_vendor.t(checked.value ? "✓" : "今"),
        e: common_vendor.t(checked.value ? "今天已完成打卡" : "完成今日学习打卡"),
        f: common_vendor.t(checked.value ? "保持节奏，明天继续" : "记录你的每一次坚持"),
        g: common_vendor.n({
          done: checked.value
        }),
        h: common_vendor.o(checkIn, "22"),
        i: common_vendor.t(((_d = data.value.entitlements) == null ? void 0 : _d.length) || 0),
        j: loading.value
      }, loading.value ? {} : {}, {
        k: common_vendor.f(data.value.entitlements, (right, k0, i0) => {
          var _a2;
          return {
            a: common_vendor.t(typeIcon(right.product_type)),
            b: common_vendor.t(typeName(right.product_type)),
            c: common_vendor.t(right.product_name),
            d: common_vendor.t(right.expires_at ? `有效期至 ${formatDate(right.expires_at)}` : "长期有效"),
            e: common_vendor.t(right.progress || 0),
            f: `${right.progress || 0}%`,
            g: common_vendor.f(((_a2 = right.product) == null ? void 0 : _a2.contents) || [], (lesson, k1, i1) => {
              return {
                a: common_vendor.t(lessonIcon(lesson.content_type)),
                b: common_vendor.t(lesson.title),
                c: common_vendor.t(lesson.summary),
                d: lesson.id
              };
            }),
            h: right.id
          };
        }),
        l: !loading.value && !((_e = data.value.entitlements) == null ? void 0 : _e.length)
      }, !loading.value && !((_f = data.value.entitlements) == null ? void 0 : _f.length) ? {
        m: common_vendor.o(goShop, "1f")
      } : {}, {
        n: common_vendor.t(ordersVisible.value ? "⌃" : "→"),
        o: common_vendor.o(showOrders, "2b"),
        p: ordersVisible.value
      }, ordersVisible.value ? common_vendor.e({
        q: !orders.value.length
      }, !orders.value.length ? {} : {}, {
        r: common_vendor.f(orders.value, (order, k0, i0) => {
          return {
            a: common_vendor.t(order.product_name),
            b: common_vendor.t(order.order_no),
            c: common_vendor.t(formatTime(order.created_at)),
            d: common_vendor.t(order.amount),
            e: common_vendor.t(order.payment_status === "paid" ? "已支付" : "待支付"),
            f: common_vendor.n(order.payment_status),
            g: order.id
          };
        })
      }) : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-a534512f"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/study/center.js.map
