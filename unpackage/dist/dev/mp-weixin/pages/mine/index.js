"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
if (!Math) {
  BottomNav();
}
const BottomNav = () => "../../components/BottomNav.js";
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const menus = [
      { name: "学习服务商城", icon: "📚", url: "/pages/study/index" },
      { name: "我的学习中心", icon: "🎯", url: "/pages/study/center" },
      { name: "我的积分", icon: "🪙", url: "/pages/mine/points" },
      { name: "录取通知书认证", icon: "🎓", url: "/pages/mine/graduation" },
      { name: "我的旅行", icon: "🧭", url: "/pages/mine/travel" },
      { name: "上岸权益", icon: "🎓", url: "/pages/mine/travel" },
      { name: "我的订单", icon: "▤", url: "/pages/mine/travel" },
      { name: "收藏路线", icon: "♡", url: "/pages/mine/travel" },
      { name: "文章中心", icon: "文", url: "/pages/article/index", public: true },
      { name: "学习记录", icon: "✓" }
    ];
    const user = common_vendor.ref(utils_api.getCurrentUser());
    const goLogin = () => common_vendor.index.navigateTo({ url: "/pages/auth/login" });
    const guard = (url) => utils_api.isLoggedIn() ? common_vendor.index.navigateTo({ url }) : goLogin();
    const entry = (m) => m.url ? m.public ? common_vendor.index.navigateTo({ url: m.url }) : guard(m.url) : common_vendor.index.showToast({ title: "学习记录功能演示", icon: "none" });
    common_vendor.onShow(async () => {
      user.value = utils_api.getCurrentUser();
      if (utils_api.isLoggedIn()) {
        try {
          user.value = await utils_api.fetchMe();
        } catch {
        }
      }
    });
    return (_ctx, _cache) => {
      var _a, _b, _c, _d, _e;
      return common_vendor.e({
        a: common_vendor.o(goLogin, "bb"),
        b: common_vendor.t((((_a = user.value) == null ? void 0 : _a.nickname) || "徒").slice(0, 1)),
        c: common_vendor.t(((_b = user.value) == null ? void 0 : _b.nickname) || "请先登录"),
        d: common_vendor.t(((_c = user.value) == null ? void 0 : _c.exam_status) || "游客模式"),
        e: common_vendor.t(user.value ? `${user.value.user_no} · ${user.value.phone}` : "登录后同步积分、公告与客服记录"),
        f: common_vendor.t(((_d = user.value) == null ? void 0 : _d.points) || 0),
        g: common_vendor.t(user.value ? "已登录" : "未登录"),
        h: common_vendor.t(((_e = user.value) == null ? void 0 : _e.exam_status) || "游客"),
        i: !user.value
      }, !user.value ? {
        j: common_vendor.o(goLogin, "df")
      } : {}, {
        k: common_vendor.o(($event) => guard("/pages/mine/travel"), "e7"),
        l: common_vendor.f(menus, (m, k0, i0) => {
          return {
            a: common_vendor.t(m.icon),
            b: common_vendor.t(m.name),
            c: m.name,
            d: common_vendor.o(($event) => entry(m), m.name)
          };
        }),
        m: common_vendor.p({
          active: "我的"
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-569e925a"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/mine/index.js.map
