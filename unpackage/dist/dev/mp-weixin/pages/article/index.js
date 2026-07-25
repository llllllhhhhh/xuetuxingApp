"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const articles = common_vendor.ref([]);
    const loading = common_vendor.ref(false);
    const formatTime = (value) => value ? String(value).replace("T", " ").slice(0, 10) : "刚刚更新";
    const load = async () => {
      loading.value = true;
      try {
        articles.value = await utils_api.getArticles();
      } finally {
        loading.value = false;
        common_vendor.index.stopPullDownRefresh();
      }
    };
    const openArticle = (item) => {
      common_vendor.index.navigateTo({ url: `/pages/article/detail?slug=${encodeURIComponent(item.slug || item.id)}` });
    };
    common_vendor.onShow(load);
    common_vendor.onPullDownRefresh(load);
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: loading.value
      }, loading.value ? {} : articles.value.length ? {
        c: common_vendor.f(articles.value, (item, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(item.category || "文章"),
            b: item.pinned
          }, item.pinned ? {} : {}, {
            c: common_vendor.t(item.title),
            d: common_vendor.t(item.summary || "点击查看完整内容"),
            e: common_vendor.t(formatTime(item.published_at || item.updated_at)),
            f: common_vendor.t(item.slug),
            g: item.id,
            h: common_vendor.o(($event) => openArticle(item), item.id)
          });
        })
      } : {}, {
        b: articles.value.length
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-fd1fc04a"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/article/index.js.map
