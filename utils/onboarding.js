export const ONBOARDING_COMPLETED_VERSION_KEY = 'onboardingCompletedVersion'
export const ONBOARDING_RESULT_KEY = 'onboardingResult'
export const ONBOARDING_PENDING_SYNC_KEY = 'onboardingPendingSync'
export const ONBOARDING_ROUTE = '/pages/onboarding/index'

export const DEFAULT_ONBOARDING = {
  enabled: true,
  version: 3,
  eyebrow: '个性化学习向导',
  title: '先认识你，再推荐更合适的内容',
  description: '用 4 个简单问题建立学习画像，后续课程、资料和顾问服务会更贴近你的目标。',
  completionText: '完成并开启学徒行',
  allowSkip: false,
  heroImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200',
  steps: [
    {
      key: 'stage',
      type: 'single',
      required: true,
      title: '你目前处于哪个学习阶段？',
      description: '我们会据此安排学习节奏与内容难度',
      options: ['大一在读', '大二在读', '大三在读', '大四在读', '已毕业，准备考试', '在职备考'],
    },
    {
      key: 'target',
      type: 'single',
      required: true,
      title: '你的目标考试时间是？',
      description: '目标时间用于生成阶段计划，之后可在学习中心修改',
      options: ['2026 年 12 月', '2027 年 12 月', '2028 年 12 月', '暂未确定'],
    },
    {
      key: 'schoolMajorStatus',
      type: 'single',
      required: true,
      title: '院校和专业确认了吗？',
      description: '我们会根据确认进度推荐择校、择专业或备考内容',
      options: ['只确认了专业', '只确认了院校', '院校和专业都确认了', '都还没有确认'],
    },
    {
      key: 'interests',
      type: 'multiple',
      required: true,
      max: 3,
      title: '你重点关注哪些学科？',
      description: '最多选择 3 项，用于优化学习内容和服务推荐',
      options: ['考研数学', '计算机', '人工智能', '电子信息', '电气工程', '机械工程', '经管', '法学', '教育学', '医药化工', '其他专业'],
    },
  ],
}

const clone = value => JSON.parse(JSON.stringify(value))

export const normalizeOnboarding = source => {
  const base = clone(DEFAULT_ONBOARDING)
  if (!source || typeof source !== 'object') return base
  const sourceSteps = Array.isArray(source.steps) ? source.steps : []
  const sourceStepMap = new Map(sourceSteps.map(step => [step?.key, step]))
  const steps = base.steps.map(defaultStep => {
    const step = sourceStepMap.get(defaultStep.key) || {}
    const options = Array.isArray(step.options)
      ? step.options.map(option => String(option || '').trim()).filter(Boolean)
      : []
    return {
      ...defaultStep,
      ...step,
      key: defaultStep.key,
      type: defaultStep.type,
      options: options.length >= 2 ? options : defaultStep.options,
      max: defaultStep.type === 'multiple'
        ? Math.max(1, Math.min(10, Number(step.max || defaultStep.max || 1)))
        : undefined,
    }
  })
  return {
    ...base,
    ...source,
    enabled: source.enabled !== false,
    version: Math.max(1, Number(source.version || 1)),
    steps,
  }
}

export const isOnboardingCompleted = version => (
  Number(uni.getStorageSync(ONBOARDING_COMPLETED_VERSION_KEY) || 0) >= Number(version || 1)
)

export const shouldShowOnboarding = source => {
  const config = normalizeOnboarding(source?.onboarding || source)
  return Boolean(config.enabled && !isOnboardingCompleted(config.version))
}

export const isOnboardingPage = () => {
  if (typeof getCurrentPages !== 'function') return false
  const pages = getCurrentPages()
  const current = pages[pages.length - 1]
  const route = current?.route ? `/${current.route}` : ''
  return route === ONBOARDING_ROUTE
}

export const getOnboardingDraft = version => {
  const value = uni.getStorageSync(`onboardingDraft:${version}`)
  return value && typeof value === 'object' ? value : {}
}

export const saveOnboardingDraft = (version, answers) => {
  uni.setStorageSync(`onboardingDraft:${version}`, answers)
}

export const completeOnboardingLocally = ({ version, answers, skipped = false }) => {
  const result = {
    version: Number(version),
    answers: answers || {},
    skipped: Boolean(skipped),
    completedAt: new Date().toISOString(),
  }
  uni.setStorageSync(ONBOARDING_COMPLETED_VERSION_KEY, result.version)
  uni.setStorageSync(ONBOARDING_RESULT_KEY, result)
  uni.removeStorageSync(`onboardingDraft:${result.version}`)
  if (!result.skipped) uni.setStorageSync(ONBOARDING_PENDING_SYNC_KEY, result)
  return result
}

export const getPendingOnboardingSync = () => {
  const value = uni.getStorageSync(ONBOARDING_PENDING_SYNC_KEY)
  return value && typeof value === 'object' && Number(value.version) > 0 ? value : null
}

export const markOnboardingSynced = version => {
  const pending = getPendingOnboardingSync()
  if (pending && Number(pending.version) <= Number(version)) {
    uni.removeStorageSync(ONBOARDING_PENDING_SYNC_KEY)
  }
}
