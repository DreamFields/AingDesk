export default {
    // 语言选择本地存储
    get language() {
        return localStorage.getItem("language") as string
    },
    set language(lang: string) {
        localStorage.setItem("language", lang)
    },

    // 暗黑模式本地存储
    get themeMode() {
        return localStorage.getItem("themeMode") as string
    },

    set themeMode(mode: string) {
        localStorage.setItem("themeMode", mode)
    },

    // 欢迎窗口关闭
    get welcomeEnd() {
        return localStorage.getItem("welcomeEnd") as string
    },

    set welcomeEnd(end: string) {
        localStorage.setItem("welcomeEnd", end as string)
    },

    // 新手指引
    get welcomeGuide(): boolean {
        if (localStorage.getItem("welcomeGuide") == null) {
            return true
        } else {
            return localStorage.getItem("welcomeGuide") == "true" ? true : false
        }
    },

    set welcomeGuide(guide: string) {
        localStorage.setItem("welcomeGuide", guide as string)
    },

    // 搜索引擎
    get searchEngine() {
        return localStorage.getItem("searchEngine") as string
    },

    set searchEngine(engine: string) {
        localStorage.setItem("searchEngine", engine)
    },

    // 界面字体缩放比例（百分比）
    get fontScale(): number {
        const scale = Number(localStorage.getItem("fontScale"))
        if (Number.isNaN(scale) || scale <= 0) {
            return 100
        }
        return scale
    },

    set fontScale(scale: number) {
        localStorage.setItem("fontScale", String(scale))
    },

    // 对话字体缩放比例（百分比）
    get chatFontScale(): number {
        const scale = Number(localStorage.getItem("chatFontScale"))
        if (Number.isNaN(scale) || scale <= 0) {
            return 100
        }
        return scale
    },

    set chatFontScale(scale: number) {
        localStorage.setItem("chatFontScale", String(scale))
    }
}