"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const _sfc_main = {
  __name: "graduation",
  setup(__props) {
    const record = common_vendor.ref(null);
    const imagePath = common_vendor.ref("");
    const agreed = common_vendor.ref(false);
    const submitting = common_vendor.ref(false);
    const form = common_vendor.reactive({
      realName: "",
      schoolName: "",
      majorName: "",
      graduationDate: "",
      certificateNo: ""
    });
    const canSubmit = common_vendor.computed(() => !record.value || record.value.status === "rejected");
    const statusText = common_vendor.computed(() => {
      var _a;
      return {
        pending: "认证审核中",
        approved: "录取通知书已认证",
        rejected: "认证未通过"
      }[(_a = record.value) == null ? void 0 : _a.status] || "未认证";
    });
    const statusIcon = common_vendor.computed(() => {
      var _a;
      return { pending: "⌛", approved: "✓", rejected: "!" }[(_a = record.value) == null ? void 0 : _a.status] || "";
    });
    const formatTime = (value) => value ? new Date(value).toLocaleString("zh-CN") : "--";
    const fillRejectedRecord = (item) => {
      if (!item || item.status !== "rejected")
        return;
      form.realName = item.real_name;
      form.schoolName = item.school_name;
      form.majorName = item.major_name;
      form.graduationDate = item.graduation_date;
      form.certificateNo = item.certificate_no;
    };
    const load = async () => {
      if (!utils_api.isLoggedIn())
        return common_vendor.index.redirectTo({ url: "/pages/auth/login" });
      try {
        record.value = await utils_api.getGraduationCertification();
        fillRejectedRecord(record.value);
      } catch (error) {
        common_vendor.index.showToast({ title: error.message || "认证状态加载失败", icon: "none" });
      }
    };
    const chooseCertificate = () => common_vendor.index.chooseImage({
      count: 1,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
      success: (result) => {
        imagePath.value = result.tempFilePaths[0];
      }
    });
    const previewLocal = () => common_vendor.index.previewImage({ current: imagePath.value, urls: [imagePath.value] });
    const previewRemote = () => {
      var _a;
      const url = utils_api.resolveAssetUrl((_a = record.value) == null ? void 0 : _a.certificate_image);
      if (url)
        common_vendor.index.previewImage({ current: url, urls: [url] });
    };
    const submit = async () => {
      if (submitting.value)
        return;
      if (!form.realName || !form.schoolName || !form.graduationDate) {
        return common_vendor.index.showToast({ title: "请填写姓名、录取院校和通知书日期", icon: "none" });
      }
      if (!imagePath.value)
        return common_vendor.index.showToast({ title: "请上传录取通知书照片", icon: "none" });
      if (!agreed.value)
        return common_vendor.index.showToast({ title: "请先确认资料真实性和隐私说明", icon: "none" });
      submitting.value = true;
      try {
        record.value = await utils_api.submitGraduationCertification(form, imagePath.value);
        imagePath.value = "";
        agreed.value = false;
        common_vendor.index.showModal({ title: "提交成功", content: "录取通知书已进入人工审核，请留意认证状态。", showCancel: false });
      } catch (error) {
        common_vendor.index.showToast({ title: error.message || "录取通知书提交失败", icon: "none", duration: 2500 });
      } finally {
        submitting.value = false;
      }
    };
    common_vendor.onShow(load);
    return (_ctx, _cache) => {
      var _a;
      return common_vendor.e({
        a: record.value
      }, record.value ? common_vendor.e({
        b: common_vendor.t(statusText.value),
        c: common_vendor.t(record.value.school_name),
        d: common_vendor.t(statusIcon.value),
        e: common_vendor.t(record.value.real_name),
        f: common_vendor.t(record.value.major_name || "未填写专业"),
        g: common_vendor.t(formatTime(record.value.updated_at)),
        h: record.value.reviewed_at
      }, record.value.reviewed_at ? {
        i: common_vendor.t(formatTime(record.value.reviewed_at))
      } : {}, {
        j: record.value.status === "rejected"
      }, record.value.status === "rejected" ? {
        k: common_vendor.t(record.value.reject_reason)
      } : {}, {
        l: common_vendor.unref(utils_api.resolveAssetUrl)(record.value.certificate_image),
        m: common_vendor.o(previewRemote, "83"),
        n: common_vendor.n(record.value.status)
      }) : {}, {
        o: canSubmit.value
      }, canSubmit.value ? common_vendor.e({
        p: common_vendor.t(((_a = record.value) == null ? void 0 : _a.status) === "rejected" ? "重新提交认证" : "填写认证资料"),
        q: form.realName,
        r: common_vendor.o(common_vendor.m(($event) => form.realName = $event.detail.value, {
          trim: true
        }), "4f"),
        s: form.schoolName,
        t: common_vendor.o(common_vendor.m(($event) => form.schoolName = $event.detail.value, {
          trim: true
        }), "1b"),
        v: form.majorName,
        w: common_vendor.o(common_vendor.m(($event) => form.majorName = $event.detail.value, {
          trim: true
        }), "d3"),
        x: common_vendor.t(form.graduationDate || "请选择通知书日期"),
        y: form.graduationDate,
        z: common_vendor.o(($event) => form.graduationDate = $event.detail.value, "ef"),
        A: form.certificateNo,
        B: common_vendor.o(common_vendor.m(($event) => form.certificateNo = $event.detail.value, {
          trim: true
        }), "a7"),
        C: !imagePath.value
      }, !imagePath.value ? {
        D: common_vendor.o(chooseCertificate, "fd")
      } : {
        E: imagePath.value,
        F: common_vendor.o(previewLocal, "13"),
        G: common_vendor.o(chooseCertificate, "03")
      }, {
        H: common_vendor.t(agreed.value ? "✓" : ""),
        I: agreed.value ? 1 : "",
        J: common_vendor.o(($event) => agreed.value = !agreed.value, "3f"),
        K: common_vendor.t(submitting.value ? "正在上传..." : "提交认证审核"),
        L: submitting.value ? 1 : "",
        M: common_vendor.o(submit, "24")
      }) : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-a9b2051e"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/mine/graduation.js.map
