"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const fallback = "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1000";
const _sfc_main = {
  __name: "detail",
  setup(__props) {
    const item = common_vendor.ref(null);
    const paying = common_vendor.ref(false);
    const installment = common_vendor.ref(1);
    const installments = common_vendor.computed(() => {
      var _a;
      const max = ((_a = item.value) == null ? void 0 : _a.installment_count) || 1;
      return [1, 3, 6, 12, 24].filter((value) => value <= max);
    });
    const perInstallment = common_vendor.computed(() => item.value ? (Number(item.value.price) / installment.value).toFixed(2) : "0.00");
    const typeName = (value) => ({ community: "督学社群", package: "长期备考套餐", material: "付费资料包" })[value] || "学习服务";
    const cycleName = (value) => ({ month: "月度会员", year: "年度会员", once: "一次性购买" })[value] || "";
    const cycleShort = (value) => ({ month: "/月", year: "/年", once: "起" })[value] || "";
    const buy = async () => {
      if (!utils_api.isLoggedIn())
        return common_vendor.index.navigateTo({ url: "/pages/auth/login" });
      paying.value = true;
      try {
        const order = await utils_api.createStudyOrder({ product_id: item.value.id, payment_method: "wechat", installment_count: installment.value });
        const params = await utils_api.getStudyPaymentParams(order.id);
        if (params.configured) {
          common_vendor.index.showModal({ title: "微信支付", content: "商户参数已配置，请接入服务商签名后调用 uni.requestPayment", showCancel: false });
        } else {
          await utils_api.mockPayStudyOrder(order.id);
          common_vendor.index.showToast({ title: "开发环境支付成功" });
          setTimeout(() => common_vendor.index.redirectTo({ url: "/pages/study/center" }), 800);
        }
      } catch (error) {
        common_vendor.index.showToast({ title: error.message || "购买失败", icon: "none" });
      } finally {
        paying.value = false;
      }
    };
    common_vendor.onLoad(async (query) => {
      try {
        item.value = await utils_api.getStudyProduct(query.id);
      } catch (error) {
        common_vendor.index.showToast({ title: error.message || "商品不存在", icon: "none" });
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: item.value
      }, item.value ? common_vendor.e({
        b: item.value.cover || fallback,
        c: common_vendor.t(typeName(item.value.product_type)),
        d: common_vendor.t(cycleName(item.value.billing_cycle)),
        e: common_vendor.t(item.value.sales),
        f: common_vendor.t(item.value.name),
        g: common_vendor.t(item.value.subtitle),
        h: common_vendor.t(item.value.price),
        i: common_vendor.t(cycleShort(item.value.billing_cycle)),
        j: Number(item.value.original_price)
      }, Number(item.value.original_price) ? {
        k: common_vendor.t(item.value.original_price)
      } : {}, {
        l: common_vendor.f(item.value.benefits, (benefit, index, i0) => {
          return {
            a: common_vendor.t(String(index + 1).padStart(2, "0")),
            b: common_vendor.t(benefit),
            c: benefit
          };
        }),
        m: common_vendor.t(item.value.description || "暂无详细介绍"),
        n: common_vendor.f(item.value.contents, (content, index, i0) => {
          return {
            a: common_vendor.t(index + 1),
            b: common_vendor.t(content.title),
            c: common_vendor.t(content.summary),
            d: common_vendor.t(content.locked ? "待解锁" : `${content.duration_minutes}分钟`),
            e: common_vendor.n(content.locked ? "locked" : "preview"),
            f: content.id
          };
        }),
        o: item.value.installment_enabled
      }, item.value.installment_enabled ? {
        p: common_vendor.t(installment.value),
        q: common_vendor.t(perInstallment.value),
        r: installments.value,
        s: common_vendor.o(($event) => installment.value = installments.value[$event.detail.value], "fa")
      } : {}, {
        t: common_vendor.t(installment.value > 1 ? `第1期 / 共${installment.value}期` : "本次应付"),
        v: common_vendor.t(perInstallment.value),
        w: common_vendor.t(paying.value ? "正在处理" : "立即购买"),
        x: paying.value,
        y: common_vendor.o(buy, "73")
      }) : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-e821dc47"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/study/detail.js.map
