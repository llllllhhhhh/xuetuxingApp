"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const _sfc_main = {
  __name: "detail",
  setup(__props) {
    const article = common_vendor.ref(null);
    const loading = common_vendor.ref(false);
    const paragraphs = common_vendor.computed(() => {
      var _a;
      return String(((_a = article.value) == null ? void 0 : _a.content) || "").split(/\n+/).filter(Boolean);
    });
    const formatTime = (value) => value ? String(value).replace("T", " ").slice(0, 16) : "刚刚更新";
    common_vendor.onLoad(async (options) => {
      var _a;
      const key = (options == null ? void 0 : options.slug) || (options == null ? void 0 : options.id);
      if (!key)
        return;
      loading.value = true;
      try {
        article.value = await utils_api.getArticleDetail(key);
        common_vendor.index.setNavigationBarTitle({ title: ((_a = article.value) == null ? void 0 : _a.title) || "文章详情" });
      } catch {
        article.value = null;
      } finally {
        loading.value = false;
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: loading.value
      }, loading.value ? {} : article.value ? common_vendor.e({
        c: common_vendor.t(article.value.category || "文章"),
        d: article.value.pinned
      }, article.value.pinned ? {} : {}, {
        e: common_vendor.t(article.value.title),
        f: common_vendor.t(article.value.summary),
        g: article.value.cover
      }, article.value.cover ? {
        h: article.value.cover
      } : {}, {
        i: common_vendor.t(formatTime(article.value.published_at || article.value.updated_at)),
        j: common_vendor.f(paragraphs.value, (paragraph, index, i0) => {
          return {
            a: common_vendor.t(paragraph),
            b: index
          };
        })
      }) : {}, {
        b: article.value
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-a5ebea5b"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/article/detail.js.map
