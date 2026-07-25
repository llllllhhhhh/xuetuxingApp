"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const _sfc_main = {
  __name: "poster",
  setup(__props) {
    const dashboard = common_vendor.reactive({ invite_code: "", invite_payload: "" });
    const qrFailed = common_vendor.ref(false);
    const qrUrl = common_vendor.computed(() => dashboard.invite_payload ? `https://api.qrserver.com/v1/create-qr-code/?size=480x480&margin=10&data=${encodeURIComponent(dashboard.invite_payload)}` : "");
    const copyCode = () => dashboard.invite_code && common_vendor.index.setClipboardData({
      data: dashboard.invite_code,
      success: () => common_vendor.index.showToast({ title: "邀请码已复制" })
    });
    const saveQr = () => {
      if (!qrUrl.value)
        return;
      common_vendor.index.downloadFile({
        url: qrUrl.value,
        success: (download) => {
          if (download.statusCode !== 200)
            return common_vendor.index.showToast({ title: "二维码下载失败", icon: "none" });
          common_vendor.index.saveImageToPhotosAlbum({
            filePath: download.tempFilePath,
            success: () => common_vendor.index.showToast({ title: "二维码已保存", icon: "success" }),
            fail: () => common_vendor.index.showToast({ title: "请允许访问相册后重试", icon: "none" })
          });
        },
        fail: () => common_vendor.index.showToast({ title: "二维码下载失败", icon: "none" })
      });
    };
    common_vendor.onLoad(async () => {
      if (!utils_api.isLoggedIn())
        return common_vendor.index.redirectTo({ url: "/pages/auth/login" });
      try {
        Object.assign(dashboard, await utils_api.getInviteDashboard());
      } catch (error) {
        common_vendor.index.showToast({ title: error.message || "邀请码加载失败", icon: "none" });
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: qrUrl.value
      }, qrUrl.value ? {
        b: qrUrl.value,
        c: common_vendor.o(($event) => qrFailed.value = true, "97")
      } : {}, {
        d: qrFailed.value
      }, qrFailed.value ? {} : {}, {
        e: common_vendor.t(dashboard.invite_code || "--"),
        f: common_vendor.o(saveQr, "37"),
        g: common_vendor.o(copyCode, "10")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-421cd236"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/points/poster.js.map
