"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const _sfc_main = {
  __name: "login",
  setup(__props) {
    const tab = common_vendor.ref("login");
    const form = common_vendor.reactive({ phone: "", nickname: "", password: "", inviteCode: "" });
    const apiUrl = common_vendor.ref(utils_api.getApiBaseUrl());
    const checking = common_vendor.ref(false);
    const diagnosticOk = common_vendor.ref(false);
    const parseInviteCode = (value) => {
      const text = decodeURIComponent(String(value || "").trim());
      if (!text)
        return "";
      if (text.startsWith("XTXINVITE:"))
        return text.slice("XTXINVITE:".length).trim();
      const match = text.match(/[?&](?:invite_code|inviteCode)=([^&#]+)/i);
      return match ? decodeURIComponent(match[1]) : text;
    };
    const applyInviteCode = (value) => {
      const code = parseInviteCode(value);
      if (!code)
        return false;
      form.inviteCode = code;
      tab.value = "register";
      common_vendor.index.setStorageSync("pendingInviteCode", code);
      return true;
    };
    const scanInvite = () => {
      common_vendor.index.scanCode({
        scanType: ["qrCode"],
        success: (result) => {
          if (applyInviteCode(result.result))
            common_vendor.index.showToast({ title: "邀请码识别成功", icon: "success" });
          else
            common_vendor.index.showToast({ title: "未识别到有效邀请码", icon: "none" });
        },
        fail: (error) => {
          if (!String((error == null ? void 0 : error.errMsg) || "").includes("cancel")) {
            common_vendor.index.showToast({ title: "扫码失败，请手动填写邀请码", icon: "none" });
          }
        }
      });
    };
    common_vendor.onLoad((options) => {
      const code = (options == null ? void 0 : options.invite_code) || (options == null ? void 0 : options.inviteCode) || (options == null ? void 0 : options.scene) || common_vendor.index.getStorageSync("pendingInviteCode");
      if (code)
        applyInviteCode(code);
    });
    const checkApi = async () => {
      if (checking.value)
        return;
      checking.value = true;
      const result = await utils_api.testApiConnection();
      checking.value = false;
      diagnosticOk.value = result.ok;
      apiUrl.value = result.apiBaseUrl;
      common_vendor.index.showModal({
        title: result.ok ? "连接正常" : "连接失败",
        content: `请求地址：${result.healthUrl}
状态：${result.statusCode || "未到达服务器"}
耗时：${result.elapsed}ms
结果：${result.message}`,
        showCancel: false
      });
    };
    const backOrHome = () => {
      const pages = getCurrentPages();
      if (pages.length > 1)
        common_vendor.index.navigateBack();
      else
        common_vendor.index.reLaunch({ url: "/pages/mine/index" });
    };
    const openArticle = (slug) => {
      common_vendor.index.navigateTo({ url: `/pages/article/detail?slug=${slug}` });
    };
    const submit = async () => {
      if (!form.phone || !form.password || tab.value === "register" && !form.nickname) {
        common_vendor.index.showToast({ title: "请填写完整信息", icon: "none" });
        return;
      }
      if (!/^1\d{10}$/.test(form.phone)) {
        common_vendor.index.showToast({ title: "请输入正确的 11 位手机号", icon: "none" });
        return;
      }
      if (form.password.length < 6) {
        common_vendor.index.showToast({ title: "密码至少需要 6 位", icon: "none" });
        return;
      }
      if (tab.value === "register" && form.nickname.length > 60) {
        common_vendor.index.showToast({ title: "昵称不能超过 60 个字符", icon: "none" });
        return;
      }
      try {
        if (tab.value === "login") {
          await utils_api.loginUser({ account: form.phone, password: form.password });
          common_vendor.index.showToast({ title: "登录成功", icon: "success" });
          setTimeout(backOrHome, 500);
          return;
        }
        const result = await utils_api.registerUser({
          phone: form.phone,
          nickname: form.nickname,
          password: form.password,
          invite_code: form.inviteCode,
          device_id: utils_api.getInviteDeviceId()
        });
        common_vendor.index.showToast({ title: result.message || "注册申请已提交", icon: "none", duration: 2200 });
        if (result.invitation_bound)
          common_vendor.index.removeStorageSync("pendingInviteCode");
        tab.value = "login";
        form.password = "";
      } catch (error) {
        common_vendor.index.showToast({ title: error.message || "操作失败", icon: "none" });
      }
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: tab.value === "login" ? 1 : "",
        b: common_vendor.o(($event) => tab.value = "login", "be"),
        c: tab.value === "register" ? 1 : "",
        d: common_vendor.o(($event) => tab.value = "register", "1b"),
        e: form.phone,
        f: common_vendor.o(common_vendor.m(($event) => form.phone = $event.detail.value, {
          trim: true
        }), "0c"),
        g: tab.value === "register"
      }, tab.value === "register" ? {
        h: form.nickname,
        i: common_vendor.o(common_vendor.m(($event) => form.nickname = $event.detail.value, {
          trim: true
        }), "50")
      } : {}, {
        j: tab.value === "register"
      }, tab.value === "register" ? common_vendor.e({
        k: common_vendor.o(scanInvite, "77"),
        l: form.inviteCode,
        m: common_vendor.o(common_vendor.m(($event) => form.inviteCode = $event.detail.value, {
          trim: true
        }), "83"),
        n: form.inviteCode
      }, form.inviteCode ? {
        o: common_vendor.t(form.inviteCode)
      } : {}) : {}, {
        p: form.password,
        q: common_vendor.o(common_vendor.m(($event) => form.password = $event.detail.value, {
          trim: true
        }), "0d"),
        r: tab.value === "register"
      }, tab.value === "register" ? {} : {}, {
        s: tab.value === "register"
      }, tab.value === "register" ? {
        t: common_vendor.o(($event) => openArticle("user-agreement"), "54"),
        v: common_vendor.o(($event) => openArticle("privacy-policy"), "a0")
      } : {}, {
        w: common_vendor.t(tab.value === "login" ? "立即登录" : "提交注册申请"),
        x: common_vendor.o(submit, "c4"),
        y: common_vendor.n({
          ok: diagnosticOk.value
        }),
        z: common_vendor.t(apiUrl.value),
        A: common_vendor.t(checking.value ? "检测中..." : "检测公网连接"),
        B: common_vendor.o(checkApi, "8c")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-2cc9f8c3"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/auth/login.js.map
