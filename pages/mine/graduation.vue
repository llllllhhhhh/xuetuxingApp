<template>
  <view class="page verification-page">
    <view class="content">
      <view class="verify-hero">
        <view class="verify-icon">🎓</view>
        <view>
          <view class="verify-title">学生证认证</view>
          <view class="verify-desc">上传学生证后由平台人工审核，认证资料仅用于学生身份核验。</view>
        </view>
      </view>

      <view v-if="record" class="status-card" :class="record.status">
        <view class="status-head">
          <view>
            <text class="status-label">{{ statusText }}</text>
            <b>{{ record.school_name }}</b>
          </view>
          <view class="status-icon">{{ statusIcon }}</view>
        </view>
        <view class="status-info">
          <text>{{ record.real_name }} · {{ record.major_name || '未填写专业' }}</text>
          <text>提交时间：{{ formatTime(record.updated_at) }}</text>
          <text v-if="record.reviewed_at">审核时间：{{ formatTime(record.reviewed_at) }}</text>
        </view>
        <view v-if="record.status === 'rejected'" class="reject-reason">
          驳回原因：{{ record.reject_reason }}
        </view>
        <image class="submitted-image" :src="resolveAssetUrl(record.certificate_image)" mode="aspectFill" @click="previewRemote" />
      </view>

      <view v-if="canSubmit" class="card form-card">
        <view class="card-title">{{ record?.status === 'rejected' ? '重新提交认证' : '填写认证资料' }}</view>
        <view class="form-item">
          <view class="label">真实姓名</view>
          <input v-model.trim="form.realName" class="input" maxlength="60" placeholder="请输入学生证上的姓名" />
        </view>
        <view class="form-item">
          <view class="label">录取院校</view>
          <input v-model.trim="form.schoolName" class="input" maxlength="120" placeholder="请输入录取院校全称" />
        </view>
        <view class="form-item">
          <view class="label">录取专业</view>
          <input v-model.trim="form.majorName" class="input" maxlength="120" placeholder="请输入录取专业" />
        </view>
        <view class="form-item">
          <view class="label">学生证号（选填）</view>
          <input v-model.trim="form.certificateNo" class="input" maxlength="80" placeholder="请输入学生证号" />
        </view>

        <view class="form-item">
          <view class="label">学生证照片</view>
          <view v-if="!imagePath" class="upload-box" @click="chooseCertificate">
            <view class="upload-plus">＋</view>
            <b>点击上传学生证</b>
            <text>请保证姓名、学校、学生证号清晰可见</text>
            <text>支持 JPG / PNG / WEBP，最大 8MB</text>
          </view>
          <view v-else class="image-preview">
            <image :src="imagePath" mode="aspectFill" @click="previewLocal" />
            <view class="change-image" @click="chooseCertificate">重新选择</view>
          </view>
        </view>

        <label class="privacy-row" @click="agreed = !agreed">
          <view class="check" :class="{ on: agreed }">{{ agreed ? '✓' : '' }}</view>
          <text>我确认资料真实有效，并同意平台用于学生身份审核</text>
        </label>
        <view class="btn btn-green submit-btn" :class="{ disabled: submitting }" @click="submit">
          {{ submitting ? '正在上传...' : '提交认证审核' }}
        </view>
      </view>

      <view class="notice privacy-notice">证件属于敏感信息，请勿上传他人证件或经过篡改的图片。审核完成后可在此页面查看结果。</view>
    </view>

    <view v-if="showImagePicker" class="picker-mask" @click="closeImagePicker">
      <view class="picker-sheet" @click.stop>
        <view class="picker-handle"></view>
        <view class="picker-head">
          <b>上传学生证照片</b>
          <text>请选择拍照或从相册上传清晰图片</text>
        </view>
        <view class="picker-options">
          <view class="picker-option" @click="selectImageSource('camera')">
            <view class="option-icon">拍</view>
            <view>
              <b>拍照上传</b>
              <text>打开相机拍摄学生证</text>
            </view>
          </view>
          <view class="picker-option" @click="selectImageSource('album')">
            <view class="option-icon album">图</view>
            <view>
              <b>从相册选择</b>
              <text>选择已有学生证照片</text>
            </view>
          </view>
        </view>
        <view class="picker-cancel" @click="closeImagePicker">取消</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import {
  getGraduationCertification,
  isLoggedIn,
  resolveAssetUrl,
  submitGraduationCertification,
} from '../../utils/api.js'
import { chooseImageWithPermission } from '../../utils/permissions.js'

const record = ref(null)
const imagePath = ref('')
const agreed = ref(false)
const submitting = ref(false)
const showImagePicker = ref(false)
const form = reactive({
  realName: '',
  schoolName: '',
  majorName: '',
  certificateNo: '',
})

const canSubmit = computed(() => !record.value || record.value.status === 'rejected')
const statusText = computed(() => ({
  pending: '认证审核中',
  approved: '学生证已认证',
  rejected: '认证未通过',
}[record.value?.status] || '未认证'))
const statusIcon = computed(() => ({ pending: '⌛', approved: '✓', rejected: '!' }[record.value?.status] || ''))
const formatTime = value => value ? new Date(value).toLocaleString('zh-CN') : '--'

const fillRejectedRecord = item => {
  if (!item || item.status !== 'rejected') return
  form.realName = item.real_name
  form.schoolName = item.school_name
  form.majorName = item.major_name
  form.certificateNo = item.certificate_no
}

const load = async () => {
  if (!isLoggedIn()) return uni.redirectTo({ url: '/pages/auth/login' })
  try {
    record.value = await getGraduationCertification()
    fillRejectedRecord(record.value)
  } catch (error) {
    uni.showToast({ title: error.message || '认证状态加载失败', icon: 'none' })
  }
}

const openImagePicker = sourceType => chooseImageWithPermission({
  count: 1,
  sizeType: ['compressed'],
  sourceType: [sourceType],
  success: result => { imagePath.value = result.tempFilePaths[0] },
})
const chooseCertificate = () => {
  showImagePicker.value = true
  return
  /*
  uni.showActionSheet({
    itemList: ['拍照上传', '从相册选择'],
    success: result => openImagePicker(result.tapIndex === 0 ? 'camera' : 'album'),
  })
  */
}
const closeImagePicker = () => { showImagePicker.value = false }
const selectImageSource = sourceType => {
  closeImagePicker()
  openImagePicker(sourceType)
}
const previewLocal = () => uni.previewImage({ current: imagePath.value, urls: [imagePath.value] })
const previewRemote = () => {
  const url = resolveAssetUrl(record.value?.certificate_image)
  if (url) uni.previewImage({ current: url, urls: [url] })
}

const submit = async () => {
  if (submitting.value) return
  if (!form.realName || !form.schoolName) {
    return uni.showToast({ title: '请填写姓名和录取院校', icon: 'none' })
  }
  if (!imagePath.value) return uni.showToast({ title: '请上传学生证照片', icon: 'none' })
  if (!agreed.value) return uni.showToast({ title: '请先确认资料真实性和隐私说明', icon: 'none' })
  submitting.value = true
  try {
    record.value = await submitGraduationCertification(form, imagePath.value)
    imagePath.value = ''
    agreed.value = false
    uni.showModal({ title: '提交成功', content: '学生证认证已进入人工审核，请留意认证状态。', showCancel: false })
  } catch (error) {
    uni.showToast({ title: error.message || '学生证认证提交失败', icon: 'none', duration: 2500 })
  } finally {
    submitting.value = false
  }
}

onShow(load)
</script>

<style scoped>
.verification-page{background:linear-gradient(180deg,#f2faf7,#f7f7f4)}.verify-hero{display:flex;align-items:center;gap:24rpx;background:linear-gradient(135deg,#153e38,#0e9586);color:#fff;padding:34rpx;border-radius:30rpx;margin-bottom:22rpx}.verify-icon{width:90rpx;height:90rpx;border-radius:28rpx;background:rgba(255,255,255,.14);display:grid;place-items:center;font-size:48rpx}.verify-title{font-size:36rpx;font-weight:900}.verify-desc{font-size:22rpx;line-height:1.65;opacity:.8;margin-top:8rpx}.status-card{padding:30rpx;border-radius:28rpx;margin-bottom:22rpx;background:#fff}.status-card.pending{border:2rpx solid #f3d695;background:#fffbef}.status-card.approved{border:2rpx solid #9bdccb;background:#eefaf6}.status-card.rejected{border:2rpx solid #efb3ad;background:#fff3f2}.status-head{display:flex;justify-content:space-between;align-items:center}.status-head text,.status-head b{display:block}.status-label{font-size:23rpx;color:#667a75;margin-bottom:8rpx}.status-head b{font-size:32rpx}.status-icon{width:66rpx;height:66rpx;border-radius:50%;background:#fff;display:grid;place-items:center;font-weight:900;color:#0e9586}.status-info{margin-top:20rpx}.status-info text{display:block;font-size:22rpx;color:#71817d;margin-top:8rpx}.reject-reason{margin-top:18rpx;background:#fff;padding:18rpx;border-radius:16rpx;color:#c8544b;font-size:23rpx;line-height:1.6}.submitted-image{width:100%;height:250rpx;border-radius:20rpx;margin-top:22rpx}.form-card{padding:30rpx}.picker-input{display:flex;align-items:center;color:#667873}.upload-box{height:310rpx;border:3rpx dashed #b8d7d0;border-radius:24rpx;background:#f4faf8;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#58736d}.upload-box b{font-size:27rpx;margin-bottom:12rpx}.upload-box text{font-size:21rpx;color:#82938f;margin-top:7rpx}.upload-plus{font-size:56rpx;color:#12a594;margin-bottom:10rpx}.image-preview{position:relative}.image-preview image{width:100%;height:360rpx;border-radius:22rpx}.change-image{position:absolute;right:18rpx;bottom:18rpx;background:rgba(16,50,45,.78);color:#fff;padding:12rpx 20rpx;border-radius:18rpx;font-size:22rpx}.privacy-row{display:flex;align-items:flex-start;gap:14rpx;margin:8rpx 0 28rpx;color:#687b76;font-size:22rpx;line-height:1.55}.check{width:34rpx;height:34rpx;flex:0 0 34rpx;border:2rpx solid #aac0ba;border-radius:9rpx;display:grid;place-items:center}.check.on{background:#12a594;border-color:#12a594;color:#fff}.submit-btn.disabled{opacity:.55}.privacy-notice{margin-top:20rpx;line-height:1.7}.picker-mask{position:fixed;left:0;right:0;top:0;bottom:0;z-index:999;background:rgba(15,31,29,.34);display:flex;align-items:flex-end;justify-content:center}.picker-sheet{width:100%;max-width:760rpx;padding:18rpx 24rpx calc(24rpx + env(safe-area-inset-bottom));border-radius:34rpx 34rpx 0 0;background:#f8fbfa;box-shadow:0 -22rpx 60rpx rgba(16,45,40,.18)}.picker-handle{width:76rpx;height:8rpx;border-radius:999rpx;background:#d5e0dd;margin:0 auto 20rpx}.picker-head{padding:0 6rpx 18rpx}.picker-head b{display:block;font-size:31rpx;color:#122f2a}.picker-head text{display:block;margin-top:8rpx;font-size:22rpx;color:#7d8e89}.picker-options{display:grid;gap:14rpx}.picker-option{display:flex;align-items:center;gap:18rpx;padding:22rpx;border:1rpx solid #e0ebe7;border-radius:24rpx;background:#fff;box-shadow:0 8rpx 22rpx rgba(17,54,48,.05)}.option-icon{width:72rpx;height:72rpx;border-radius:22rpx;background:#e8f8f4;color:#079685;display:flex;align-items:center;justify-content:center;font-size:24rpx;font-weight:900}.option-icon.album{background:#fff3e8;color:#d97424}.picker-option b{display:block;font-size:27rpx;color:#14332e}.picker-option text{display:block;margin-top:6rpx;font-size:21rpx;color:#83928e}.picker-cancel{height:82rpx;margin-top:16rpx;border-radius:24rpx;background:#fff;color:#667873;display:flex;align-items:center;justify-content:center;font-size:27rpx;font-weight:800}
</style>
