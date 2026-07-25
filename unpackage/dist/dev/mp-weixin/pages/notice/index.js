"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const loading = common_vendor.ref(true);
    const announcements = common_vendor.ref([]);
    const readIds = common_vendor.ref([]);
    const loadData = async () => {
      loading.value = true;
      readIds.value = utils_api.getAnnouncementReadIds();
      announcements.value = await utils_api.getAnnouncements();
      loading.value = false;
    };
    const isRead = (id) => readIds.value.includes(Number(id));
    const openDetail = (item) => {
      utils_api.markAnnouncementRead(item.id);
      readIds.value = utils_api.getAnnouncementReadIds();
      common_vendor.index.navigateTo({ url: `/pages/notice/detail?id=${item.id}` });
    };
    const formatTime = (value) => {
      if (!value)
        return "刚刚发布";
      return String(value).replace("T", " ").slice(0, 16);
    };
    common_vendor.onShow(loadData);
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: loading.value
      }, loading.value ? {} : announcements.value.length ? {
        c: common_vendor.f(announcements.value, (item, k0, i0) => {
          return common_vendor.e({
            a: item.pinned
          }, item.pinned ? {} : {}, {
            b: common_vendor.t(item.tag || "平台公告"),
            c: !isRead(item.id)
          }, !isRead(item.id) ? {} : {}, {
            d: common_vendor.t(item.title),
            e: common_vendor.t(item.summary),
            f: common_vendor.t(formatTime(item.published_at || item.created_at)),
            g: item.id,
            h: !isRead(item.id) ? 1 : "",
            i: item.pinned ? 1 : "",
            j: common_vendor.o(($event) => openDetail(item), item.id)
          });
        })
      } : {}, {
        b: announcements.value.length
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-a41149ed"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/notice/index.js.map
