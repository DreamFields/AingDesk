import { post } from "@/api"
import { getAgentStoreData } from "../store"
import { sendLog } from "@/views/Home/controller"
import { message, useDialog } from "@/utils/naive-tools"
import type { AgentItemDto } from "@/views/Home/dto"
import i18n from "@/lang";

import { createNewComu } from "@/views/Sider/controller"

/********* 临时引入start *********/
import { } from "@/views/Home/controller"
/********* 临时引入end *********/

const $t = i18n.global.t



/***
 * @description 获取智能体列表
 */
export async function getAgentList() {
    const { agentList } = getAgentStoreData()
    try {
        const res = await post("/agent/get_agent_list")
        agentList.value = res.message
    } catch (error) {
        sendLog(error as Error)
    }
}

/**
 * @description 创建智能体
 */
export async function createAgent() {
    const { createAgentFormData, createAgentShow } = getAgentStoreData()
    try {
        await post("/agent/create_agent", createAgentFormData.value)
        createAgentShow.value = false
        message.success($t("智能体创建成功"))
        getAgentList()
    } catch (error) {
        sendLog(error as Error)
    }
}

/**
 * @description 修改智能体
 */
export async function modifyAgent() {
    const { createAgentFormData, createAgentShow } = getAgentStoreData()
    try {
        await post("/agent/modify_agent", createAgentFormData.value)
        message.success($t("智能体修改成功"))
        createAgentShow.value = false
        getAgentList()
    } catch (error) {
        sendLog(error as Error)
    }
}

/***
 * @description 选择智能体进行对话
 */
export async function chooseAgentForChat(agent: AgentItemDto) {
    const { currentAgent, chatForAgent, agentShow, currentChatAgent } = getAgentStoreData()
    currentChatAgent.value = agent
    currentAgent.value = agent
    chatForAgent.value = true

    // 打开对话
    await createNewComu()
    agentShow.value = false
}



/**
 * @description 打开智能体弹窗
 */
export function openAgent() {
    const { agentShow } = getAgentStoreData()
    agentShow.value = true
}

/**
 * @description 关闭智能体弹窗
 */
export function closeAgent() {
    const { agentShow } = getAgentStoreData()
    agentShow.value = false 
}

/**
 * @description 获取指定一条智能体的消息
 */
export async function getAgentInfo() {
    await post("/agent/get_agent_info")
}

/**
 * @description 删除智能体
 */
export async function removeAgent(agent: AgentItemDto) {
    const {delAgentShow,agentForDel} = getAgentStoreData()
    delAgentShow.value = true
    agentForDel.value = agent
}

/**
 * @description 取消删除agent
 */
export function cancelDelAgent() {
    const {delAgentShow} = getAgentStoreData()
    delAgentShow.value = false
}

/**
 * @description 确认删除agent
 */
export async function confirmDelAgent() {
    const {agentForDel} = getAgentStoreData() 
    try {
        await post("/agent/remove_agent", { agent_name: agentForDel.value!.agent_name })
        message.success($t("智能体删除成功"))
        getAgentList()
        cancelDelAgent()
    } catch (error) {
        sendLog(error as Error)
    }
}




/**
 * @description 智能体操作回调
 */
export function handleAgentOperation(key: string, agent: AgentItemDto) {
    const { createAgentShow, createAgentFormData, isEditAgent } = getAgentStoreData()
    if (key == "edit") {
        createAgentShow.value = true
        createAgentFormData.value = agent
        isEditAgent.value = true
    } else {
        removeAgent(agent)
    }
}   