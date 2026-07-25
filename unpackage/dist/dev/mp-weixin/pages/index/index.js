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
    const showPop = common_vendor.ref(false), remoteBlocks = common_vendor.ref([]), remoteRoutes = common_vendor.ref([]), routesLoaded = common_vendor.ref(false), currentPoints = common_vendor.ref(Number(common_vendor.index.getStorageSync("points") || 0)), exchangeScore = common_vendor.ref(100);
    const iconMap = ["📝", "📚", "🧭", "🎁", "🪙", "🎓", "🗺️", "✨"];
    const urlMap = ["/pages/study/index", "/pages/study/index", "/pages/travel/index", "/pages/points/activity", "/pages/mine/points", "/pages/study/center"];
    const fallbackGrids = [{ name: "备考刷题", url: "/pages/study/index" }, { name: "资料商城", url: "/pages/study/index" }, { name: "定制旅行", url: "/pages/travel/index" }, { name: "邀请有礼", url: "/pages/points/activity" }, { name: "我的积分", url: "/pages/mine/points" }, { name: "上岸权益", url: "/pages/study/center" }];
    const slides = [{ kicker: "上岸限定", title: "备考上岸，全包定制长线旅行", desc: "用一次远行，奖励认真生活的自己", img: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200" }];
    const displayRoutes = common_vendor.computed(() => routesLoaded.value ? remoteRoutes.value : []);
    const pointsProgress = common_vendor.computed(() => Math.min(100, Math.round(currentPoints.value / Math.max(1, exchangeScore.value) * 100)));
    let refreshTimer = null;
    const loadHome = async () => {
      var _a;
      const tasks = [utils_api.getPublishedConfig(), utils_api.getPublicRoutes()];
      if (utils_api.isLoggedIn())
        tasks.push(utils_api.getInviteDashboard().catch(() => null));
      const [config, routes, invite2] = await Promise.all(tasks);
      const home = (_a = config == null ? void 0 : config.pages) == null ? void 0 : _a.find((p) => p.id === "home");
      if (home)
        remoteBlocks.value = home.blocks.filter((b) => b.visible);
      remoteRoutes.value = routes;
      routesLoaded.value = true;
      if (invite2) {
        currentPoints.value = invite2.points;
        exchangeScore.value = invite2.exchange_score;
        common_vendor.index.setStorageSync("points", invite2.points);
      }
    };
    const startAutoRefresh = () => {
      clearInterval(refreshTimer);
      loadHome();
      refreshTimer = setInterval(loadHome, 3e3);
    };
    const stopAutoRefresh = () => {
      clearInterval(refreshTimer);
      refreshTimer = null;
    };
    common_vendor.onMounted(() => {
      if (!common_vendor.index.getStorageSync("welcomeSeen"))
        setTimeout(() => showPop.value = true, 400);
    });
    common_vendor.onShow(startAutoRefresh);
    common_vendor.onHide(stopAutoRefresh);
    common_vendor.onUnmounted(stopAutoRefresh);
    common_vendor.onPullDownRefresh(async () => {
      await loadHome();
      common_vendor.index.stopPullDownRefresh();
    });
    const go = (url) => common_vendor.index.navigateTo({ url });
    const closePop = () => {
      showPop.value = false;
      common_vendor.index.setStorageSync("welcomeSeen", true);
    };
    const entry = (g) => {
      if (["备考刷题", "资料商城"].includes(g.name))
        utils_api.trackPreference({ type: "study", key: g.name === "备考刷题" ? "exam_questions" : "materials", name: g.name, action: "entry_click", score: 2 });
      g.url ? go(g.url) : common_vendor.index.showToast({ title: `${g.name}功能演示`, icon: "none" });
    };
    const openRoute = (route) => {
      utils_api.trackPreference({ type: "route", key: route.id || route.name, name: route.name, action: "view", score: 1 });
      go("/pages/custom/detail");
    };
    const invite = () => {
      closePop();
      go("/pages/points/activity");
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: remoteBlocks.value.length
      }, remoteBlocks.value.length ? {
        b: common_vendor.f(remoteBlocks.value, (block, k0, i0) => {
          return common_vendor.e({
            a: block.type === "banner"
          }, block.type === "banner" ? {
            b: block.image,
            c: common_vendor.t(block.badge || "精选推荐"),
            d: common_vendor.t(block.title),
            e: common_vendor.t(block.subtitle)
          } : block.type === "activity" ? {
            g: common_vendor.t(block.title),
            h: common_vendor.t(currentPoints.value),
            i: common_vendor.t(exchangeScore.value),
            j: pointsProgress.value + "%",
            k: common_vendor.t(block.button || "立即查看"),
            l: block.background || "#fff5e9",
            m: common_vendor.o(($event) => go("/pages/points/activity"), block.id)
          } : block.type === "grid" ? {
            o: common_vendor.t(block.title),
            p: common_vendor.f(block.items, (name, i, i1) => {
              return {
                a: common_vendor.t(iconMap[i % iconMap.length]),
                b: common_vendor.t(name),
                c: name,
                d: common_vendor.o(($event) => entry({
                  name,
                  url: urlMap[i] || ""
                }), name)
              };
            }),
            q: `repeat(${block.columns || 3},1fr)`
          } : block.type === "study" ? {
            s: common_vendor.t(block.title),
            t: common_vendor.t(block.title),
            v: common_vendor.t(block.subtitle),
            w: common_vendor.t(block.progress || 0),
            x: (block.progress || 0) + "%"
          } : block.type === "smart" ? {
            z: common_vendor.t(block.title),
            A: common_vendor.t(block.subtitle),
            B: block.background || "#dff5ef",
            C: common_vendor.o(($event) => go("/pages/custom/params"), block.id)
          } : block.type === "routes" && displayRoutes.value.length ? {
            E: common_vendor.t(block.title),
            F: common_vendor.t(block.subtitle),
            G: common_vendor.f(displayRoutes.value, (route, k1, i1) => {
              return {
                a: route.image,
                b: common_vendor.t(route.name),
                c: common_vendor.t(route.days),
                d: common_vendor.t(Number(route.price)),
                e: route.id || route.name,
                f: common_vendor.o(($event) => openRoute(route), route.id || route.name)
              };
            })
          } : block.type === "video" ? {
            I: common_vendor.t(block.title),
            J: block.image,
            K: common_vendor.t(block.subtitle)
          } : {
            L: common_vendor.t(block.title),
            M: common_vendor.t(block.subtitle)
          }, {
            f: block.type === "activity",
            n: block.type === "grid",
            r: block.type === "study",
            y: block.type === "smart",
            D: block.type === "routes" && displayRoutes.value.length,
            H: block.type === "video",
            N: block.id
          });
        })
      } : {
        c: common_vendor.f(slides, (s, k0, i0) => {
          return {
            a: s.img,
            b: common_vendor.t(s.kicker),
            c: common_vendor.t(s.title),
            d: common_vendor.t(s.desc),
            e: s.title
          };
        }),
        d: common_vendor.t(currentPoints.value),
        e: common_vendor.t(exchangeScore.value),
        f: pointsProgress.value + "%",
        g: common_vendor.o(($event) => go("/pages/points/activity"), "41"),
        h: common_vendor.f(fallbackGrids, (g, i, i0) => {
          return {
            a: common_vendor.t(iconMap[i]),
            b: common_vendor.t(g.name),
            c: g.name,
            d: common_vendor.o(($event) => entry(g), g.name)
          };
        })
      }, {
        i: common_vendor.p({
          active: "首页"
        }),
        j: showPop.value
      }, showPop.value ? {
        k: common_vendor.o(invite, "b7"),
        l: common_vendor.o(closePop, "5d"),
        m: common_vendor.o(closePop, "19")
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-1cf27b2a"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
