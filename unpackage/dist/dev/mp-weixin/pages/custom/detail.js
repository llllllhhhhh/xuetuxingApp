"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const _sfc_main = {
  __name: "detail",
  setup(__props) {
    const routeName = "川西雪山轻徒步", routeId = 1, favorited = common_vendor.ref((common_vendor.index.getStorageSync("favoriteRoutes") || []).includes(routeName)), targeted = common_vendor.ref((common_vendor.index.getStorageSync("targetRoutes") || []).includes(routeName));
    const toggleStored = (key, state) => {
      const set = new Set(common_vendor.index.getStorageSync(key) || []);
      state.value ? set.delete(routeName) : set.add(routeName);
      state.value = !state.value;
      common_vendor.index.setStorageSync(key, [...set]);
    };
    const toggleFavorite = () => {
      toggleStored("favoriteRoutes", favorited);
      utils_api.trackPreference({ type: "route", key: routeId, name: routeName, action: favorited.value ? "favorite_add" : "favorite_remove", score: favorited.value ? 3 : -3 });
      common_vendor.index.showToast({ title: favorited.value ? "已收藏这段旅程" : "已取消收藏", icon: "none" });
    };
    const toggleTarget = () => {
      toggleStored("targetRoutes", targeted);
      utils_api.trackPreference({ type: "route", key: routeId, name: routeName, action: targeted.value ? "target_add" : "target_remove", score: targeted.value ? 5 : -5 });
      common_vendor.index.showToast({ title: targeted.value ? "已加入上岸心愿" : "已移出上岸心愿", icon: "none" });
    };
    const days = [{ day: "Day 1", title: "成都集合 · 青春碰面", desc: "入住市区酒店，领队见面会，自由探索成都夜色。", img: "https://images.unsplash.com/photo-1528127269322-539801943592?w=900" }, { day: "Day 2", title: "四姑娘山 · 双桥沟", desc: "穿越雪山、森林与海子，傍晚入住藏式民宿。", img: "https://images.unsplash.com/photo-1464278533981-50106e6176b1?w=900" }, { day: "Day 3-5", title: "墨石公园 · 鱼子西 · 返程", desc: "日落旅拍、非遗体验，在群山环抱中告别。", img: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=900" }];
    const go = (url) => common_vendor.index.navigateTo({ url });
    return (_ctx, _cache) => {
      return {
        a: common_vendor.t(favorited.value ? "♥ 已收藏路线" : "♡ 收藏路线"),
        b: favorited.value ? 1 : "",
        c: common_vendor.o(toggleFavorite, "53"),
        d: common_vendor.t(targeted.value ? "✓ 已加入上岸心愿" : "🎓 设为上岸目标"),
        e: targeted.value ? 1 : "",
        f: common_vendor.o(toggleTarget, "22"),
        g: common_vendor.f(days, (d, k0, i0) => {
          return {
            a: common_vendor.t(d.day),
            b: common_vendor.t(d.title),
            c: common_vendor.t(d.desc),
            d: d.img,
            e: d.day
          };
        }),
        h: common_vendor.o(($event) => go("/pages/custom/params"), "9d"),
        i: common_vendor.o(($event) => go("/pages/custom/manual"), "ad")
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-dd9ac9d4"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/custom/detail.js.map
