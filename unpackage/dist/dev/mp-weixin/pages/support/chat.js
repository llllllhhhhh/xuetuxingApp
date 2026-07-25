"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const _sfc_main = {
  __name: "chat",
  setup(__props) {
    const conversation = common_vendor.ref(null);
    const messages = common_vendor.ref([]);
    const content = common_vendor.ref("");
    const connected = common_vendor.ref(false);
    const adminOnline = common_vendor.ref(false);
    const adminTyping = common_vendor.ref(false);
    const scrollTarget = common_vendor.ref("message-bottom");
    const user = common_vendor.ref(utils_api.getCurrentUser());
    const quickQuestions = ["积分怎么兑换？", "泰山游怎么预约？", "想人工定制路线", "查询订单进度"];
    let reconnectTimer = null;
    let heartbeatTimer = null;
    let manualClose = false;
    let connecting = false;
    let socketTask = null;
    const scrollBottom = () => common_vendor.nextTick$1(() => {
      scrollTarget.value = "";
      setTimeout(() => {
        scrollTarget.value = "message-bottom";
      }, 20);
    });
    const formatTime = (value) => value ? new Date(value).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }) : "";
    const sendSocket = (data) => socketTask == null ? void 0 : socketTask.send({ data: JSON.stringify(data) });
    const scheduleReconnect = () => {
      clearTimeout(reconnectTimer);
      if (!manualClose)
        reconnectTimer = setTimeout(connect, 2e3);
    };
    const handleOpen = () => {
      connecting = false;
      connected.value = true;
      clearInterval(heartbeatTimer);
      heartbeatTimer = setInterval(() => sendSocket({ type: "ping" }), 25e3);
    };
    const handleMessage = (event) => {
      let data;
      try {
        data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }
      if (data.type === "message") {
        if (!messages.value.some((m) => m.id === data.message.id))
          messages.value.push(data.message);
        scrollBottom();
      } else if (data.type === "typing" && data.role === "admin") {
        adminTyping.value = data.typing;
      } else if (data.type === "presence" && data.role === "admin") {
        adminOnline.value = data.online;
      } else if (data.type === "status" && data.status === "closed") {
        conversation.value.status = "closed";
        common_vendor.index.showToast({ title: "本次客服会话已结束", icon: "none" });
      }
    };
    const handleClose = () => {
      connecting = false;
      connected.value = false;
      socketTask = null;
      clearInterval(heartbeatTimer);
      scheduleReconnect();
    };
    const connect = () => {
      if (!conversation.value || manualClose || connecting || connected.value)
        return;
      connecting = true;
      const url = `${utils_api.getWebSocketBaseUrl()}/support/ws/${conversation.value.id}?user_id=${encodeURIComponent(user.value.user_no)}`;
      common_vendor.index.__f__("log", "at pages/support/chat.vue:112", "[学徒行客服] WebSocket 地址：", url);
      socketTask = common_vendor.index.connectSocket({
        url,
        timeout: 1e4,
        fail: (error) => {
          common_vendor.index.__f__("error", "at pages/support/chat.vue:117", "[学徒行客服] WebSocket 创建失败：", error);
          handleClose();
        }
      });
      if (!socketTask) {
        handleClose();
        return;
      }
      socketTask.onOpen(handleOpen);
      socketTask.onMessage(handleMessage);
      socketTask.onClose(handleClose);
      socketTask.onError((error) => {
        common_vendor.index.__f__("error", "at pages/support/chat.vue:129", "[学徒行客服] WebSocket 连接失败：", error);
        handleClose();
      });
    };
    const sendMessage = () => {
      var _a;
      const text = content.value.trim();
      if (!text || !connected.value || ((_a = conversation.value) == null ? void 0 : _a.status) === "closed")
        return;
      socketTask.send({
        data: JSON.stringify({ type: "message", content: text }),
        success: () => {
          content.value = "";
        },
        fail: () => common_vendor.index.showToast({ title: "消息发送失败", icon: "none" })
      });
    };
    const sendQuick = (q) => {
      content.value = q;
      sendMessage();
    };
    const pickImage = () => {
      if (!conversation.value)
        return;
      common_vendor.index.chooseImage({
        count: 1,
        success: async ({ tempFilePaths }) => {
          try {
            const result = await utils_api.uploadSupportImage(conversation.value.id, tempFilePaths[0]);
            socketTask == null ? void 0 : socketTask.send({
              data: JSON.stringify({ type: "message", message_type: "image", image_url: result.url, content: "" })
            });
          } catch (error) {
            common_vendor.index.showToast({ title: error.message || "图片上传失败", icon: "none" });
          }
        }
      });
    };
    common_vendor.onLoad(async () => {
      if (!utils_api.isLoggedIn()) {
        common_vendor.index.redirectTo({ url: "/pages/auth/login" });
        return;
      }
      user.value = utils_api.getCurrentUser();
      try {
        conversation.value = await utils_api.createSupportConversation();
        adminOnline.value = !!conversation.value.admin_online;
        messages.value = await utils_api.getSupportMessages(conversation.value.id);
        scrollBottom();
        connect();
      } catch (error) {
        common_vendor.index.showToast({ title: error.message || "客服系统连接失败", icon: "none" });
      }
    });
    common_vendor.onUnload(() => {
      manualClose = true;
      clearTimeout(reconnectTimer);
      clearInterval(heartbeatTimer);
      socketTask == null ? void 0 : socketTask.close({});
      socketTask = null;
    });
    return (_ctx, _cache) => {
      var _a;
      return common_vendor.e({
        a: adminOnline.value ? 1 : "",
        b: common_vendor.t(adminOnline.value ? "客服当前在线" : "客服暂时离线，消息会保留历史记录"),
        c: common_vendor.f(messages.value, (m, k0, i0) => {
          var _a2;
          return common_vendor.e({
            a: m.sender_role === "admin"
          }, m.sender_role === "admin" ? {} : {}, {
            b: m.message_type === "image"
          }, m.message_type === "image" ? common_vendor.e({
            c: common_vendor.unref(utils_api.resolveAssetUrl)(m.image_url),
            d: m.content
          }, m.content ? {
            e: common_vendor.t(m.content)
          } : {}) : {
            f: common_vendor.t(m.content)
          }, {
            g: common_vendor.t(formatTime(m.created_at)),
            h: m.sender_role === "user"
          }, m.sender_role === "user" ? {
            i: common_vendor.t((((_a2 = user.value) == null ? void 0 : _a2.nickname) || "我").slice(0, 1))
          } : {}, {
            j: `message-${m.id}`,
            k: m.id,
            l: common_vendor.n(m.sender_role)
          });
        }),
        d: adminTyping.value
      }, adminTyping.value ? {} : {}, {
        e: scrollTarget.value,
        f: common_vendor.f(quickQuestions, (q, k0, i0) => {
          return {
            a: common_vendor.t(q),
            b: q,
            c: common_vendor.o(($event) => sendQuick(q), q)
          };
        }),
        g: common_vendor.o(pickImage, "19"),
        h: ((_a = conversation.value) == null ? void 0 : _a.status) === "closed",
        i: common_vendor.o(sendMessage, "eb"),
        j: content.value,
        k: common_vendor.o(($event) => content.value = $event.detail.value, "0e"),
        l: !content.value.trim() || !connected.value ? 1 : "",
        m: common_vendor.o(sendMessage, "ce")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-08438d9f"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/support/chat.js.map
