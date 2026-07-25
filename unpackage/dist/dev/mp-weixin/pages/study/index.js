"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const fallback = "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1000";
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const products = common_vendor.ref([]);
    const type = common_vendor.ref("all");
    const loading = common_vendor.ref(true);
    const isTabStuck = common_vendor.ref(false);
    const tabStickAt = common_vendor.ref(Number.POSITIVE_INFINITY);
    let latestScrollTop = 0;
    const tabs = [
      { key: "all", name: "全部" },
      { key: "community", name: "督学社群" },
      { key: "package", name: "长期套餐" },
      { key: "material", name: "资料包" }
    ];
    const slides = [
      {
        type: "community",
        kicker: "高频陪伴 · 每日督学",
        title: "备考路上，有人陪你坚持",
        desc: "每日打卡、学长答疑、每周模考",
        note: "9.9 元/月起",
        image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200"
      },
      {
        type: "package",
        kicker: "早鸟计划 · 全程规划",
        title: "越早规划，上岸越从容",
        desc: "专属档案、阶段课程、一对一规划",
        note: "支持分期",
        image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200"
      },
      {
        type: "material",
        kicker: "精选资料 · 免费试看",
        title: "把时间花在真正的考点上",
        desc: "核心笔记、真题解析、冲刺清单",
        note: "购买后立即解锁",
        image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200"
      }
    ];
    const filtered = common_vendor.computed(() => type.value === "all" ? products.value : products.value.filter((item) => item.product_type === type.value));
    const currentTitle = common_vendor.computed(() => {
      var _a;
      return (_a = tabs.find((item) => item.key === type.value)) == null ? void 0 : _a.name;
    });
    const typeName = (value) => ({ community: "付费社群", package: "长期规划", material: "精选资料" })[value] || "学习服务";
    const cycle = (value) => ({ month: "/月", year: "/年", once: " 起" })[value] || "";
    const open = (item) => common_vendor.index.navigateTo({ url: `/pages/study/detail?id=${item.id}` });
    const openSlide = (slide) => {
      const item = products.value.find((product) => product.product_type === slide.type);
      if (item)
        open(item);
      else
        type.value = slide.type;
    };
    const openCenter = () => common_vendor.index.navigateTo({ url: utils_api.isLoggedIn() ? "/pages/study/center" : "/pages/auth/login" });
    const measureTabPosition = () => {
      common_vendor.nextTick$1(() => {
        const windowInfo = common_vendor.index.getWindowInfo ? common_vendor.index.getWindowInfo() : common_vendor.index.getSystemInfoSync();
        const stickyOffset = Number((windowInfo == null ? void 0 : windowInfo.windowTop) || 0);
        common_vendor.index.createSelectorQuery().select(".tab-shell").boundingClientRect((rect) => {
          if (!rect)
            return;
          tabStickAt.value = rect.top + latestScrollTop - stickyOffset;
          isTabStuck.value = latestScrollTop >= tabStickAt.value;
        }).exec();
      });
    };
    common_vendor.onReady(measureTabPosition);
    common_vendor.onPageScroll((event) => {
      latestScrollTop = Number(event.scrollTop || 0);
      const nextStuck = latestScrollTop >= tabStickAt.value;
      if (nextStuck !== isTabStuck.value)
        isTabStuck.value = nextStuck;
    });
    common_vendor.onLoad(async () => {
      try {
        products.value = await utils_api.getStudyProducts();
      } catch (error) {
        common_vendor.index.showToast({ title: error.message || "加载失败", icon: "none" });
      } finally {
        loading.value = false;
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.f(slides, (slide, k0, i0) => {
          return {
            a: slide.image,
            b: common_vendor.t(slide.kicker),
            c: common_vendor.t(slide.title),
            d: common_vendor.t(slide.desc),
            e: common_vendor.t(slide.note),
            f: common_vendor.o(($event) => openSlide(slide), slide.type),
            g: slide.type
          };
        }),
        b: common_vendor.o(openCenter, "bd"),
        c: common_vendor.f(tabs, (item, k0, i0) => {
          return {
            a: common_vendor.t(item.name),
            b: item.key,
            c: common_vendor.n({
              active: type.value === item.key
            }),
            d: common_vendor.o(($event) => type.value = item.key, item.key)
          };
        }),
        d: isTabStuck.value ? 1 : "",
        e: common_vendor.t(currentTitle.value),
        f: common_vendor.t(filtered.value.length),
        g: loading.value
      }, loading.value ? {} : {}, {
        h: common_vendor.f(filtered.value, (item, k0, i0) => {
          return common_vendor.e({
            a: item.cover || fallback,
            b: common_vendor.t(typeName(item.product_type)),
            c: item.featured
          }, item.featured ? {} : {}, {
            d: item.trial_minutes
          }, item.trial_minutes ? {
            e: common_vendor.t(item.trial_minutes)
          } : {}, {
            f: common_vendor.t(item.name),
            g: common_vendor.t(item.subtitle),
            h: common_vendor.f((item.benefits || []).slice(0, 3), (b, k1, i1) => {
              return {
                a: common_vendor.t(b),
                b
              };
            }),
            i: common_vendor.t(item.price),
            j: common_vendor.t(cycle(item.billing_cycle)),
            k: Number(item.original_price)
          }, Number(item.original_price) ? {
            l: common_vendor.t(item.original_price)
          } : {}, {
            m: item.id,
            n: common_vendor.o(($event) => open(item), item.id)
          });
        }),
        i: !loading.value && !filtered.value.length
      }, !loading.value && !filtered.value.length ? {} : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-ffedcc8e"]]);
_sfc_main.__runtimeHooks = 1;
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/study/index.js.map
