<script>
import { getApiBaseUrl, syncRemoteConfig } from './utils/api.js'

export default {
  onLaunch() {
    if (uni.getStorageSync('points') === '') uni.setStorageSync('points', 0)
    const apiUrl = getApiBaseUrl()
    uni.setStorageSync('lastResolvedApiUrl', apiUrl)
    console.log('[学徒行] 当前 API 地址：', apiUrl)
    syncRemoteConfig()
  }
}
</script>

<style lang="scss">
@import './styles/theme.scss';
</style>
