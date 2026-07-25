const permissionToast = title => uni.showToast({ title, icon: 'none' })

const openSetting = () => {
  // #ifdef MP-WEIXIN
  uni.openSetting({})
  // #endif
  // #ifdef APP-PLUS
  if (typeof plus !== 'undefined') plus.runtime.openURL('app-settings:')
  // #endif
}

const requestAndroidPermissions = permissions => new Promise(resolve => {
  // #ifdef APP-PLUS
  if (typeof plus === 'undefined' || plus.os.name !== 'Android') return resolve(true)
  plus.android.requestPermissions(
    permissions,
    result => {
      const deniedAlways = result.deniedAlways || []
      const deniedPresent = result.deniedPresent || []
      if (deniedAlways.length || deniedPresent.length) {
        permissionToast('请在系统设置中开启相关权限')
        return resolve(false)
      }
      resolve(true)
    },
    () => {
      permissionToast('权限申请失败')
      resolve(false)
    },
  )
  // #endif
  // #ifndef APP-PLUS
  resolve(true)
  // #endif
})

const requestMiniProgramScope = scope => new Promise(resolve => {
  // #ifdef MP-WEIXIN
  uni.getSetting({
    success: setting => {
      if (setting.authSetting?.[scope]) return resolve(true)
      uni.authorize({
        scope,
        success: () => resolve(true),
        fail: () => {
          permissionToast('请在小程序设置中开启权限')
          resolve(false)
        },
      })
    },
    fail: () => resolve(false),
  })
  // #endif
  // #ifndef MP-WEIXIN
  resolve(true)
  // #endif
})

export const requestCameraPermission = async () => {
  const appOk = await requestAndroidPermissions(['android.permission.CAMERA'])
  if (!appOk) return false
  return requestMiniProgramScope('scope.camera')
}

export const requestAlbumPermission = async () => {
  return requestAndroidPermissions([
    'android.permission.READ_MEDIA_IMAGES',
    'android.permission.READ_MEDIA_VIDEO',
    'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
    'android.permission.READ_EXTERNAL_STORAGE',
  ])
}

export const requestVideoAlbumPermission = async () => {
  return requestAndroidPermissions([
    'android.permission.READ_MEDIA_VIDEO',
    'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
    'android.permission.READ_EXTERNAL_STORAGE',
  ])
}

export const requestSaveAlbumPermission = async () => {
  const appOk = await requestAndroidPermissions([
    'android.permission.READ_MEDIA_IMAGES',
    'android.permission.READ_MEDIA_VIDEO',
    'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
    'android.permission.READ_EXTERNAL_STORAGE',
  ])
  if (!appOk) return false
  return requestMiniProgramScope('scope.writePhotosAlbum')
}

export const requestLocationPermission = async () => {
  const appOk = await requestAndroidPermissions([
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.ACCESS_COARSE_LOCATION',
  ])
  if (!appOk) return false
  return requestMiniProgramScope('scope.userLocation')
}

export const requestNotificationPermission = async () => {
  // Android 13+ 通知权限；低版本会自动通过或忽略。
  return requestAndroidPermissions(['android.permission.POST_NOTIFICATIONS'])
}

export const requestImagePickerPermission = async (sourceType = ['album', 'camera']) => {
  const needAlbum = sourceType.includes('album')
  const needCamera = sourceType.includes('camera')
  if (needAlbum && !(await requestAlbumPermission())) return false
  if (needCamera && !(await requestCameraPermission())) return false
  return true
}

export const requestVideoPickerPermission = async (sourceType = ['album', 'camera']) => {
  const needAlbum = sourceType.includes('album')
  const needCamera = sourceType.includes('camera')
  if (needAlbum && !(await requestVideoAlbumPermission())) return false
  if (needCamera && !(await requestCameraPermission())) return false
  return true
}

export const chooseImageWithPermission = async (options = {}) => {
  const sourceType = options.sourceType || ['album', 'camera']
  const ok = await requestImagePickerPermission(sourceType)
  if (!ok) return null
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      ...options,
      success: result => {
        if (typeof options.success === 'function') options.success(result)
        resolve(result)
      },
      fail: error => {
        if (!String(error?.errMsg || '').includes('cancel')) permissionToast('图片选择失败，请检查相机或相册权限')
        reject(error)
      },
    })
  })
}

export const chooseVideoWithPermission = async (options = {}) => {
  const sourceType = options.sourceType || ['album', 'camera']
  const ok = await requestVideoPickerPermission(sourceType)
  if (!ok) return null
  return new Promise((resolve, reject) => {
    uni.chooseVideo({
      compressed: true,
      maxDuration: 60,
      ...options,
      sourceType,
      success: result => {
        if (typeof options.success === 'function') options.success(result)
        resolve(result)
      },
      fail: error => {
        if (!String(error?.errMsg || '').includes('cancel')) permissionToast('视频选择失败，请检查相机、麦克风或相册权限')
        reject(error)
      },
    })
  })
}

export const saveImageToAlbumWithPermission = async filePathOrOptions => {
  if (!(await requestSaveAlbumPermission())) return false
  const options = typeof filePathOrOptions === 'string' ? { filePath: filePathOrOptions } : (filePathOrOptions || {})
  return new Promise(resolve => {
    uni.saveImageToPhotosAlbum({
      ...options,
      success: () => {
        if (typeof options.success === 'function') options.success()
        else permissionToast('已保存到相册')
        resolve(true)
      },
      fail: () => {
        if (typeof options.fail === 'function') options.fail()
        else permissionToast('保存失败，请允许访问相册')
        resolve(false)
      },
    })
  })
}

export const scanCodeWithPermission = async (options = {}) => {
  if (!(await requestCameraPermission())) return null
  return new Promise((resolve, reject) => {
    uni.scanCode({
      ...options,
      success: result => {
        if (typeof options.success === 'function') options.success(result)
        resolve(result)
      },
      fail: error => {
        if (!String(error?.errMsg || '').includes('cancel')) permissionToast('扫码失败，请检查摄像头权限')
        reject(error)
      },
    })
  })
}

export const getLocationWithPermission = async (options = {}) => {
  if (!(await requestLocationPermission())) return null
  return new Promise((resolve, reject) => {
    uni.getLocation({
      type: 'gcj02',
      ...options,
      success: result => resolve(result),
      fail: error => {
        permissionToast('定位失败，请开启位置权限')
        reject(error)
      },
    })
  })
}

export const showPermissionSettingTip = content => uni.showModal({
  title: '需要权限',
  content,
  confirmText: '去设置',
  success: result => result.confirm && openSetting(),
})
