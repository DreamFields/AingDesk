// 聊天头像
import userImage from "@/assets/images/user.png"
import codellama from "@/assets/images/codellama.png"
import deepseek from "@/assets/images/deepseek.png"
import gemma from "@/assets/images/gemma.png"
import llama from "@/assets/images/llama.png"
import llava from "@/assets/images/llava.png"
import mistral from "@/assets/images/mistral.png"
import mxbai from "@/assets/images/mxbai.png"
import phi4 from "@/assets/images/phi4.png"
import qwen from "@/assets/images/qwen.png"
import starcoder from "@/assets/images/starcoder.png"
import tinyllama from "@/assets/images/tinyllama.png"
import AingDesk from "@/assets/images/logo.png"

import { sendChat } from "@/views/ChatTools/controller"

import { message } from "@/utils/naive-tools"
import { useClipboard } from "@vueuse/core"
import i18n from "@/lang"
import type { MultipeQuestionDto } from "@/views/Home/dto"
import { getHeaderStoreData } from "@/views/Header/store"
import { getChatContentStoreData } from "@/views/ChatContent/store"
import { getChatToolsStoreData } from "@/views/ChatTools/store"
import { getAnswerStoreData } from "../store"
import { getThirdPartyApiStoreData } from "@/views/ThirdPartyApi/store"




export const logos: any = {
    codellama,
    deepseek,
    gemma,
    llama,
    llava,
    mistral,
    mxbai,
    phi4,
    qwen,
    starcoder,
    tinyllama,
}

export { AingDesk }
const $t = i18n.global.t

/**
 * @description 复制回答内容
 */
const { copy } = useClipboard({ source: "", legacy: true })
export async function copyContent(text: string) {
    await copy(text.replace(/<div class="thought-placeholder">(.*?)<\/div>/gs, ""))
    message.success($t("复制成功"))
}

/**
 * @description 根据模型确定对应的图标
 */
export const answerLogo = (model: string, supplierName?: string) => {
    // Aurod 供应商使用默认图标
    if (supplierName === 'aurod') {
        return AingDesk
    }
    
    let logo = null
    Object.keys(logos).forEach(item => {
        {
            if (model && model.includes(item)) {
                logo = logos[item]
            }
        }
    })

    if (logo) {
        return logo
    } else {
        return AingDesk
    }
}

/**
 * @description 重新回答
 */
export function answerAgain(question: MultipeQuestionDto, id: string) {
    const { multipleModelList } = getHeaderStoreData()
    const { currentModel, } = getHeaderStoreData()
    const { currentSupplierName } = getThirdPartyApiStoreData()
    const { isInChat, chatHistory, } = getChatContentStoreData()
    if (isInChat.value) {
        message.warning($t("当前正在回答，请稍后"))
    } else {
        isInChat.value = true
        // 拼接完整key  
        // 此处暂时的方案是追加一个重新回答的记录，后续根据情况决定是否优化
        const chatKey = {
            content: question.content.replace(/^\d+--/, ''),
            files: question.files,
            images: question.images
        }
        chatHistory.value.set(chatKey, { content: "", stat: { model: currentModel.value }, search_result: [] })
        if (multipleModelList.value.length) {
            const modelList = [...multipleModelList.value, { model: currentModel.value, supplierName: currentSupplierName.value }]
            sendChat({
                user_content: chatKey.content,
                images: chatKey.images?.join(","),
                doc_files: chatKey.files?.join(","),
                regenerate_id: id
            }, modelList)
        } else {
            sendChat({
                user_content: chatKey.content,
                images: chatKey.images?.join(","),
                doc_files: chatKey.files?.join(","),
                regenerate_id: id
            })
        }
    }
}

// 目前不确定AI返回的latex公式是否正确，参考Latex和Katex的规范，先全面使用$$...$$代替
/**
 * @description 替换数学公式中的分隔符为$$
 */
export function replaceLatexMathDelimiters(text: string) {
    // 替换块级公式：\[...\] → $$...$$
    text = text.replace(/\\\[/g, '$$').replace(/\\\]/g, '$$');
    // 替换行内公式：\(...\) → $$...$$
    text = text.replace(/\\\(/g, '$$').replace(/\\\)/g, '$$');
    // 替换公式环境：\begin{xxx}...\end{xxx} → $$...$$
    text = text.replace(/\\begin\{(\w+)\}/g, '$$').replace(/\\end\{(\w+)\}/g, '$$');

    return text;
}


/**
 * @description 跳转到对应目标页
 */
export function jumpThroughLink(link: string) {
    window.open(link)
}


