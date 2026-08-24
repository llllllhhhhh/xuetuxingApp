<script>
import { getApiBaseUrl, getPublishedConfig, syncPendingOnboardingProfile, syncRemoteConfig } from './utils/api.js'
import { isOnboardingPage, ONBOARDING_ROUTE, shouldShowOnboarding } from './utils/onboarding.js'

let onboardingGateStarted = false

const openOnboardingIfNeeded = source => {
  if (!shouldShowOnboarding(source) || isOnboardingPage()) return false
  uni.reLaunch({ url: ONBOARDING_ROUTE })
  return true
}

const guardOnboardingEntry = () => {
  if (onboardingGateStarted) return
  onboardingGateStarted = true
  setTimeout(() => {
    openOnboardingIfNeeded(uni.getStorageSync('remoteConfig') || null)
    getPublishedConfig()
      .then(config => openOnboardingIfNeeded(config))
      .catch(() => false)
  }, 0)
}

export default {
  onLaunch() {
    if (uni.getStorageSync('points') === '') uni.setStorageSync('points', 0)
    const apiUrl = getApiBaseUrl()
    uni.setStorageSync('lastResolvedApiUrl', apiUrl)
    console.log('[学徒行] 当前 API 地址：', apiUrl)
    guardOnboardingEntry()
    syncRemoteConfig()
    syncPendingOnboardingProfile().catch(() => false)
  }
}
</script>

<style lang="scss">
@import './styles/theme.scss';
</style>
