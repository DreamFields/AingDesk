<template>
    <div class="search-tools-wrapper" v-if="!activeKnowledge">
        <div class="chat-mask" v-if="chatMask.status">
            <span>{{ chatMask.notice }}</span>
        </div>
        <div class="search-tools ">
            <div class="tools">
                <!-- 上传的文件列表 -->
                <Filelist />
                <n-input :placeholder="$t('请输入对话内容')" class="input-token" type="textarea"
                    v-model:value="questionContent" :autosize="{
                        minRows: 3,
                        maxRows: 15
                    }" @keydown.enter="sendChartToModelForKeyBoard" />

                <div class="send-tools">
                    <!-- 无记忆对话 -->
                    <n-tooltip trigger="hover">
                        <template #trigger>
                            <n-button class="h-40" ghost :type="temp_chat ? 'primary' : 'default'" @click="useTempChat"
                                :focusable="false">
                                {{ $t("无记忆") }}
                                <template #icon>
                                    <i class="i-tdesign:brush"></i>
                                </template>
                            </n-button>
                        </template>
                        {{ $t(" 能提升单次回复质量，但大模型将没有上下文记忆") }}
                    </n-tooltip>
                    <!-- 文件上传 -->
                    <div>
                        <input type="file" style="display: none;" ref="questionFilesRef" @change="filesChange"
                            :accept="acceptFileType">
                        <n-tooltip trigger="hover">
                            <template #trigger>
                                <n-button @click="chooseQuestionFiles" class="h-40">
                                    <template #icon>
                                        <i class="i-tdesign:attach"></i>
                                    </template>
                                    {{ $t("上传附件") }}
                                </n-button>
                            </template>
                            {{ $t("支持上传文件、图片(最大不超过20MB), 支持PDF、DOC、TXT等格式") }}
                        </n-tooltip>
                    </div>
                    <!-- 对话时选择知识库 -->
                    <n-popover trigger="click">
                        <template #trigger>
                            <n-button :type="activeKnowledgeForChat.length ? 'primary' : 'default'" ghost
                                style="height: 40px;" icon-placement="left" :focusable="false">
                                <template #icon>
                                    <i class="i-tdesign:folder"></i>
                                </template>
                                {{ $t("知识库") }}
                            </n-button>
                        </template>
                        <KnowledgeChoosePanel />
                    </n-popover>
                    <!-- 选择tools工具 -->
                    <n-popover trigger="click">
                        <template #trigger>
                            <n-button :type="mcpListChoosed.length ? 'primary' : 'default'" ghost
                                style="height: 40px;" icon-placement="left" :focusable="false">
                                <template #icon>
                                    <i class="i-typcn:spanner-outline"></i>
                                </template>
                                {{ $t("工具") }}
                            </n-button>
                        </template>
                        <ToolsChoosePanel />
                    </n-popover>
                    <!-- 联网搜索 -->
                    <n-button class="h-40" ghost :type="netActive ? 'primary' : 'default'" @click="useSearchEngine"
                        :focusable="false">
                        <template #icon>
                            <i class="i-proicons:globe"></i>
                        </template>
                        {{ $t("联网搜索") }}
                    </n-button>
                    <!-- 创作记忆 -->
                    <n-tooltip trigger="hover">
                        <template #trigger>
                            <n-button class="h-40" ghost :type="memoryActive ? 'primary' : 'default'" @click="toggleMemory"
                                :focusable="false">
                                <template #icon>
                                    <i class="i-tdesign:lightbulb"></i>
                                </template>
                                {{ $t("记忆") }}
                            </n-button>
                        </template>
                        {{ $t("启用后，AI 将自动记住对话中的角色、情节等信息，实现跨轮次记忆") }}
                    </n-tooltip>
                    <n-button class="send-btn" type="primary" v-if="!isInChat" @click="sendChatToModel"
                        :disabled="questionContent.trim() ? false : true">{{ $t("发送") }}</n-button>
                    <n-button class="send-btn" type="error" v-else @click="stopGenerate">{{ $t("停止生成") }}</n-button>
                </div>
            </div>
        </div>
    </div>
</template>


<script setup lang="ts">
import Filelist from "@/views/ChatTools/components/FileList.vue";
import { getChatToolsStoreData } from "./store";
import { getKnowledgeStoreData } from "../KnowleadgeStore/store";
import { getSoftSettingsStoreData } from "../SoftSettings/store";
import { getChatContentStoreData } from "../ChatContent/store";
import KnowledgeChoosePanel from "@/views/KnowleadgeStore/components/KnowledgeChoosePanel.vue";
import ToolsChoosePanel from "./components/ToolsChoosePanel.vue";
import { eventBUS } from "@/views/Home/utils/tools";
import { useI18n } from "vue-i18n";

import {
    stopGenerate,
    filesChange,
    chooseQuestionFiles,
    scrollMove,
    useSearchEngine,
    sendChatToModel,
    acceptFileType,
    sendChartToModelForKeyBoard,
    useTempChat,
    getMcpServerListForChat,
    toggleMemory
} from "@/views/ChatTools/controller"

import { computed, nextTick } from "vue";
const { t: $t } = useI18n()

const {
    chatMask,
    questionContent,
    temp_chat,
    netActive,
    questionFilesRef,
    mcpListChoosed,
    memoryActive
} = getChatToolsStoreData()

const {
    activeKnowledge,
    activeKnowledgeForChat,
} = getKnowledgeStoreData()
const {
    isInChat,
} = getChatContentStoreData()
const {
    themeMode,
    themeColors,
} = getSoftSettingsStoreData()


const moveFn = scrollMove()
eventBUS.$on("chat-tool-do-scroll", moveFn)

/**
 * @description 根据主题切换背景色
 */
const questionToolBg = computed(() => {
    if (themeMode.value == "light") {
        return themeColors.value.questionToolBgLight
    } else {
        return themeColors.value.questionToolBgDark
    }
})

/**
 * @description 获取MCP服务列表
 */
 getMcpServerListForChat()

</script>


<style lang="scss" scoped>
@use "@/assets/base";

.search-tools-wrapper {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;

    .search-tools {
        width: 100%;
        display: flex;
        justify-content: center;

        .tools {
            width: 100%;
            position: relative;
            background-color: v-bind(questionToolBg);
            border-top: 1px solid rgb(224, 224, 230);

            :deep(.n-input) {
                --n-border: none !important;
            }

            .input-token {
                padding-bottom: 70px;
            }

            .send-tools {
                position: absolute;
                width: 100%;
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                box-sizing: border-box;
                padding: 0 15px;
                left: 0px;
                bottom: 15px;

                .send-btn {
                    padding: 20px 40px;
                }

                .network-search {}

            }

        }
    }

    .chat-mask {
        position: absolute;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.6);
        z-index: 20;
        @include base.row-flex-between;
        justify-content: center;
        color: #fff;
    }
}
</style>