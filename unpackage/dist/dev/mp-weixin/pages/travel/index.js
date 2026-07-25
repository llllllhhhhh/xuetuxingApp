"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
if (!Math) {
  (AppHeader + BottomNav)();
}
const AppHeader = () => "../../components/AppHeader.js";
const BottomNav = () => "../../components/BottomNav.js";
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const filters = ["目的地", "主题", "天数", "积分"];
    const routes = common_vendor.ref([]);
    const favorites = common_vendor.ref(new Set(common_vendor.index.getStorageSync("favoriteRoutes") || []));
    const targets = common_vendor.ref(new Set(common_vendor.index.getStorageSync("targetRoutes") || []));
    let refreshTimer = null;
    const loadRoutes = async (showError = false) => {
      const remote = await utils_api.getPublicRoutes();
      routes.value = remote.filter((r) => r.status !== false).map((r) => ({ id: r.id, name: r.name, days: r.days, points: `${Number(r.price)} 积分`, theme: `${r.category} · ${r.agency}`, img: r.image }));
      if (showError && remote.__fromCache)
        common_vendor.index.showToast({ title: "后端连接失败，当前显示缓存数据", icon: "none" });
    };
    const startAutoRefresh = () => {
      clearInterval(refreshTimer);
      loadRoutes();
      refreshTimer = setInterval(() => loadRoutes(), 3e3);
    };
    const stopAutoRefresh = () => {
      clearInterval(refreshTimer);
      refreshTimer = null;
    };
    common_vendor.onMounted(startAutoRefresh);
    common_vendor.onShow(startAutoRefresh);
    common_vendor.onHide(stopAutoRefresh);
    common_vendor.onUnmounted(stopAutoRefresh);
    common_vendor.onPullDownRefresh(async () => {
      await loadRoutes(true);
      common_vendor.index.stopPullDownRefresh();
    });
    const persist = (key, setRef) => common_vendor.index.setStorageSync(key, [...setRef.value]);
    const toggleFavorite = (r) => {
      const next = new Set(favorites.value);
      const adding = !next.has(r.name);
      adding ? next.add(r.name) : next.delete(r.name);
      favorites.value = next;
      persist("favoriteRoutes", favorites);
      utils_api.trackPreference({ type: "route", key: r.id || r.name, name: r.name, action: adding ? "favorite_add" : "favorite_remove", score: adding ? 3 : -3 });
      common_vendor.index.showToast({ title: adding ? "已收藏这段旅程" : "已取消收藏", icon: "none" });
    };
    const toggleTarget = (r) => {
      const next = new Set(targets.value);
      const adding = !next.has(r.name);
      adding ? next.add(r.name) : next.delete(r.name);
      targets.value = next;
      persist("targetRoutes", targets);
      utils_api.trackPreference({ type: "route", key: r.id || r.name, name: r.name, action: adding ? "target_add" : "target_remove", score: adding ? 5 : -5 });
      common_vendor.index.showToast({ title: adding ? "已加入上岸心愿" : "已移出上岸心愿", icon: "none" });
    };
    const openRoute = (r) => {
      utils_api.trackPreference({ type: "route", key: r.id || r.name, name: r.name, action: "view", score: 1 });
      go("/pages/custom/detail");
    };
    const go = (url) => common_vendor.index.navigateTo({ url });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.f(filters, (f, i, i0) => {
          return {
            a: common_vendor.t(f),
            b: f,
            c: i === 0 ? 1 : ""
          };
        }),
        b: common_vendor.o(($event) => go("/pages/custom/params"), "e8"),
        c: routes.value.length
      }, routes.value.length ? {
        d: common_vendor.f(routes.value, (r, i, i0) => {
          return {
            a: r.img,
            b: common_vendor.t(favorites.value.has(r.name) ? "♥" : "♡"),
            c: favorites.value.has(r.name) ? 1 : "",
            d: common_vendor.o(($event) => toggleFavorite(r), r.id || r.name),
            e: (i % 2 ? 260 : 330) + "rpx",
            f: common_vendor.t(r.name),
            g: common_vendor.t(r.days),
            h: common_vendor.t(r.points),
            i: common_vendor.t(r.theme),
            j: common_vendor.t(targets.value.has(r.name) ? "✓ 已加入上岸心愿" : "＋ 设为上岸目标"),
            k: targets.value.has(r.name) ? 1 : "",
            l: common_vendor.o(($event) => toggleTarget(r), r.id || r.name),
            m: r.id || r.name,
            n: common_vendor.o(($event) => openRoute(r), r.id || r.name)
          };
        })
      } : {}, {
        e: common_vendor.p({
          active: "旅行"
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-c85e4709"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/travel/index.js.map
