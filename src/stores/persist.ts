/**
 * 持久化工具：逐字复刻原项目 atomForConfig 的行为，localStorage key 与原项目一字不差。
 *
 * 原行为（src/store/atomForConfig.ts）：
 * - 读：类型不匹配 → 整体用默认值；默认值有而存储缺的字段 → 合并默认值并回写 localStorage
 * - 写：直接整体 JSON 序列化
 * - 兼容非对象值（如 isOpenDarkModeAtom 存裸 boolean）
 */
export function loadPersisted<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return defaultValue

    const stored = JSON.parse(raw) as T

    // 非对象配置（boolean/number/string）：类型一致直接用，不一致回默认值
    if (typeof defaultValue !== 'object' || defaultValue === null) {
      return (typeof stored === typeof defaultValue ? stored : defaultValue) as T
    }
    if (typeof stored !== 'object' || stored === null || Array.isArray(stored)) {
      return defaultValue
    }

    // 对象配置：缺字段合并默认值并回写（多余字段保留，与原行为一致）
    const merged = { ...(defaultValue as Record<string, unknown>), ...(stored as Record<string, unknown>) }
    const defaultKeys = Object.keys(defaultValue as Record<string, unknown>)
    const storedKeys = Object.keys(stored as Record<string, unknown>)
    if (defaultKeys.some((k) => !(k in (stored as Record<string, unknown>)))) {
      localStorage.setItem(key, JSON.stringify(merged))
    }
    void storedKeys
    return merged as T
  } catch {
    return defaultValue
  }
}

export function savePersisted(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}
