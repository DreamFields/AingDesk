import type { McpServerListDto } from "@/views/Home/dto";
import { defineStore, storeToRefs } from "pinia";
import { ref } from "vue";


const useChatToolsStore = defineStore("chatTools", () => {
    // 根据模型状态确定当前对话是否可用
    const chatMask = ref({
        status: false,
        notice: ""
    })
    // 提问内容
    const questionContent = ref("")
    // 提问上传文件列表
    const questionFileList = ref<any>([])
    // 提问上传的图片列表
    const questionImageList = ref<any>([])
    // 提问上传的文件缓存
    const questionFilesCache = ref<File[]>([])
    // 提问的文件域
    const questionFilesRef = ref()
    // 提问携带的文件
    const questionFiles = ref<string[]>([])
    // 提问携带的图片
    const questionImages = ref<string[]>([])
    // 开启单次临时对话
    const temp_chat = ref(false)
    // 激活联网搜索
    const netActive = ref(false)
    // 已安装的mcp列表
    const mcpListForChat = ref<McpServerListDto[]>([])
    // 对话时选择的mcp
    const mcpListChoosed = ref<string[]>([])
    // 多模型对话的唯一id
    const compare_id = ref<string>("")
    // 是否启用记忆
    const memoryActive = ref(false)
    return {
        chatMask,
        questionContent,
        questionFileList,
        questionImageList,
        questionFilesCache,
        questionFilesRef,
        questionFiles,
        questionImages,
        temp_chat,
        netActive,
        mcpListForChat,
        mcpListChoosed,
        compare_id,
        memoryActive
    }
})

export function getChatToolsStoreData() {
    return storeToRefs(useChatToolsStore())
}