"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const _sfc_main = {
  __name: "activity",
  setup(__props) {
    const open = common_vendor.ref(false);
    const dashboard = common_vendor.reactive({
      invite_code: "",
      invite_payload: "",
      points: 0,
      invite_score: 1,
      exchange_score: 100,
      enabled: true,
      invited_count: 0,
      granted_count: 0,
      records: []
    });
    const progress = common_vendor.computed(() => Math.min(100, Math.round(dashboard.points / Math.max(1, dashboard.exchange_score) * 100)));
    const remaining = common_vendor.computed(() => Math.max(0, dashboard.exchange_score - dashboard.points));
    const load = async () => {
      if (!utils_api.isLoggedIn()) {
        common_vendor.index.showModal({
          title: "请先登录",
          content: "登录后才能生成专属邀请码和查看积分到账记录。",
          success: (result) => result.confirm && common_vendor.index.navigateTo({ url: "/pages/auth/login" })
        });
        return;
      }
      try {
        Object.assign(dashboard, await utils_api.getInviteDashboard());
        common_vendor.index.setStorageSync("points", dashboard.points);
      } catch (error) {
        common_vendor.index.showToast({ title: error.message || "邀请数据加载失败", icon: "none" });
      }
    };
    const parseCode = (value) => {
      const text = String(value || "").trim();
      return text.startsWith("XTXINVITE:") ? text.slice(10) : text;
    };
    const scanForRegister = () => common_vendor.index.scanCode({
      scanType: ["qrCode"],
      success: (result) => {
        const code = parseCode(result.result);
        if (!code)
          return common_vendor.index.showToast({ title: "二维码内容无效", icon: "none" });
        common_vendor.index.setStorageSync("pendingInviteCode", code);
        common_vendor.index.navigateTo({ url: `/pages/auth/login?invite_code=${encodeURIComponent(code)}` });
      }
    });
    const copyInvite = () => {
      if (!dashboard.invite_code)
        return;
      common_vendor.index.setClipboardData({ data: dashboard.invite_code, success: () => common_vendor.index.showToast({ title: "邀请码已复制" }) });
    };
    const shareCard = () => {
      if (!dashboard.invite_payload)
        return;
      common_vendor.index.setClipboardData({
        data: `学徒行邀请口令：${dashboard.invite_payload}
打开学徒行，在注册页点击“扫一扫”即可绑定。`,
        success: () => common_vendor.index.showToast({ title: "邀请口令已复制" })
      });
    };
    const goPoster = () => dashboard.invite_code ? common_vendor.index.navigateTo({ url: "/pages/points/poster" }) : common_vendor.index.showToast({ title: "邀请码加载中", icon: "none" });
    const exchange = () => remaining.value ? goPoster() : common_vendor.index.navigateTo({ url: "/pages/points/exchange" });
    const maskPhone = (phone) => String(phone || "").replace(/^(\d{3})\d+(\d{4})$/, "$1****$2");
    const formatTime = (value) => value ? String(value).replace("T", " ").slice(0, 16) : "";
    const statusText = (status, granted) => granted ? "审核通过，积分已到账" : status === "rejected" ? "注册未通过" : "等待管理员审核";
    common_vendor.onShow(load);
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(dashboard.points),
        b: progress.value + "%",
        c: common_vendor.t(dashboard.granted_count),
        d: common_vendor.t(remaining.value ? `还差 ${remaining.value} 积分兑换泰山游` : "已满足兑换条件"),
        e: common_vendor.t(dashboard.invite_score),
        f: common_vendor.o(shareCard, "cd"),
        g: common_vendor.o(goPoster, "b6"),
        h: common_vendor.o(copyInvite, "a2"),
        i: common_vendor.t(dashboard.invite_code || "--"),
        j: common_vendor.o(copyInvite, "53"),
        k: common_vendor.t(dashboard.invited_count),
        l: !dashboard.records.length
      }, !dashboard.records.length ? {} : {}, {
        m: common_vendor.f(dashboard.records, (item, k0, i0) => {
          return {
            a: common_vendor.t((item.nickname || "友")[0]),
            b: common_vendor.t(item.nickname),
            c: common_vendor.t(maskPhone(item.phone)),
            d: common_vendor.t(statusText(item.status, item.score_granted)),
            e: common_vendor.t(formatTime(item.created_at)),
            f: common_vendor.t(item.score_granted ? `+${item.score}` : "待审核"),
            g: common_vendor.n(item.score_granted ? "money" : "pending-score"),
            h: item.phone
          };
        }),
        n: common_vendor.o(scanForRegister, "e0"),
        o: common_vendor.t(open.value ? "⌃" : "⌄"),
        p: open.value
      }, open.value ? {} : {}, {
        q: common_vendor.o(($event) => open.value = !open.value, "0c"),
        r: common_vendor.t(remaining.value ? "继续邀请好友" : "立即兑换泰山游"),
        s: common_vendor.n(remaining.value ? "btn-disabled" : "btn-primary"),
        t: common_vendor.o(exchange, "90")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-ac47fd51"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/points/activity.js.map
