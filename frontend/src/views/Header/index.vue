<template>
    <div class="header-wrapper" v-if="!activeKnowledge || (siderWidth == 0 && knowledgeSiderWidth == 0)">
        <div class="comunication-tit flex justify-between items-center">
            <div class="flex items-center">
                <i class="i-common:expand w-18 h-18 mr-10 cursor-pointer" v-if="isFold" @click="doExpand"></i>
            </div>

            <div class="flex items-center gap-10">
                <!-- 选择模型 -->
                <ChooseModel v-model="currentModel" v-model:supplier="currentSupplierName"
                    @addModelChoose="addModelChoose" />
                
                <!-- 当前模型消耗 -->
                <n-tag v-if="currentSupplierName === 'aurod' && currentModel" type="info" size="large">
                    <template #icon>
                        <i class="i-common:flash w-16 h-16 mr-5"></i>
                    </template>
                    消耗: {{ formatModelCost(currentModel) }}
                </n-tag>
            </div>
        </div>
        <div class="right-tools">
            <!-- Aurod 积分显示 -->
            <n-tag v-if="currentSupplierName === 'aurod' && aurodCredits !== null" type="warning" size="large">
                <template #icon>
                    <i class="i-common:coin w-16 h-16 mr-5"></i>
                </template>
                剩余积分: {{ formatCredits(aurodCredits) }}
            </n-tag>
            
            <n-button type="success" @click="shareShow = true">
                <template #icon><i class="i-common:share w-16 h-16"></i></template>
                {{ $t("分享") }}
            </n-button>
        </div>
    </div>


</template>

<script lang="tsx" setup>
import ChooseModel from "./components/ChooseModel.vue";
import { get_model_list, } from "@/views/Settings/controller"
import { doExpand } from "@/views/Header/controller"
import { useI18n } from "vue-i18n";
import { getHeaderStoreData } from "./store";
import { getSiderStoreData } from "../Sider/store";
import { getKnowledgeStoreData } from "../KnowleadgeStore/store";
import { getThirdPartyApiStoreData } from "../ThirdPartyApi/store";
import { getChatToolsStoreData } from "../ChatTools/store";
import { getChatContentStoreData } from "../ChatContent/store";
import { getRandomStringFromSet } from "@/utils/tools";
import { post } from "@/api";
import { watch } from "vue";

const { t: $t } = useI18n()

const { shareShow, currentModel, multipleModelList, aurodCredits, aurodCreditPlans } = getHeaderStoreData()
const { isFold, siderWidth, } = getSiderStoreData()
const { activeKnowledge, knowledgeSiderWidth, } = getKnowledgeStoreData()
const { currentSupplierName } = getThirdPartyApiStoreData()
const { compare_id } = getChatToolsStoreData()
const { isInChat } = getChatContentStoreData()

/**
 * @description 获取模型列表
 */
get_model_list()

/**
 * @description 添加模型选择器
 */
function addModelChoose() {
    multipleModelList.value.push({
        model: "",
        supplierName: ""
    })
    compare_id.value = getRandomStringFromSet(16)
}

/**
 * @description 格式化积分显示
 */
function formatCredits(credits: number): string {
    if (credits >= 10000) {
        const wan = Math.floor(credits / 10000)
        const remainder = credits % 10000
        if (remainder > 0) {
            return `${wan}万${remainder}积分`
        }
        return `${wan}万积分`
    }
    return `${credits}积分`
}

// 模型积分消耗配置
const MODEL_COST_CONFIG: Record<string, number> = {
    'claude-sonnet-4-6-thinking': 100000,
    'claude-sonnet-4-6': 100000,
    'claude-opus-4-6': 1000000,
    'gemini-3.1-pro-preview': 100000,
    'gemini-3.1-pro-preview-thinking': 100000,
}

/**
 * @description 格式化模型积分消耗
 */
function formatModelCost(model: string): string {
    const cost = MODEL_COST_CONFIG[model] || 1
    if (cost >= 10000) {
        const wan = Math.floor(cost / 10000)
        const remainder = cost % 10000
        if (remainder > 0) {
            return `${wan}万${remainder}积分/次`
        }
        return `${wan}万积分/次`
    }
    return `${cost}积分/次`
}

/**
 * @description 获取 Aurod 积分
 */
async function fetchAurodCredits() {
    if (currentSupplierName.value !== 'aurod') {
        aurodCredits.value = null
        aurodCreditPlans.value = []
        return
    }
    
    try {
        const result = await post('/aurod/get_credits')
        if (result.success) {
            aurodCredits.value = result.credits ?? null
            aurodCreditPlans.value = result.plans || []
        }
    } catch (error) {
        console.error('获取 Aurod 积分失败:', error)
    }
}

// 监听供应商变化，获取积分
watch(currentSupplierName, (newVal) => {
    if (newVal === 'aurod') {
        fetchAurodCredits()
    } else {
        aurodCredits.value = null
        aurodCreditPlans.value = []
    }
}, { immediate: true })

// 监听聊天结束，更新积分
watch(isInChat, (newVal, oldVal) => {
    // 当 isInChat 从 true 变为 false 时，表示聊天结束
    if (oldVal === true && newVal === false && currentSupplierName.value === 'aurod') {
        // 延迟 500ms 再刷新积分，确保后端已更新
        setTimeout(() => {
            fetchAurodCredits()
        }, 500)
    }
})


</script>

<style lang="scss" scoped>
@use "@/assets/base.scss";

.header-wrapper {
    height: 65px;
    display: flex;
    align-items: center;
    justify-content: space-between;



    .right-tools {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        // min-width: 360px;
    }
}

.model-list-drop {
    max-height: 300px;
}
</style>