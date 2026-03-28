<template>
    <div class="question">
        <n-image :src="userImage" width="30" height="30" class="mt-6px" preview-disabled />
        <div class="question-token-wrapper">
            <div class="files" v-if="questionContent.files?.length">
                <div class="file-item cursor-pointer" v-for="(item, index) in questionContent.files" :key="index"
                    @click="openFile(item)">
                    <n-image :src="pdf" width="40px" preview-disabled />
                    <span class="show-tit">{{ getFileNameFromPath(item) }}</span>
                </div>
            </div>
            <div class="images" v-if="questionContent.images?.length">
                <n-image :src="item" width="240px" v-for="item in questionContent.images" :key="item" />
            </div>
            <div class="question-content">
                <div class="question-token" v-html="questionContent.content.replace(/^\d+--/, '')"></div>
                <div class="tools">
                    <n-tooltip v-if="!questionContent.files?.length && !questionContent.files?.length">
                        <template #trigger>
                            <span class="tool-item"
                                @click="copyQuestion(questionContent.content.replace(/^\d+--/, ''))"><i
                                    class="i-common:copy w-20 h-20"></i></span>
                        </template>
                        {{ $t("复制") }}
                    </n-tooltip>
                </div>
            </div>
        </div>

    </div>
</template>


<script setup lang="ts">
import type { MultipeQuestionDto } from "@/views/Home/dto"
import userImage from "@/assets/images/user.png"
import { getFileNameFromPath } from "@/utils/tools"
import pdf from "@/assets/images/PDF.png"
import { useClipboard } from "@vueuse/core"
import { message } from "@/utils/naive-tools"
import { useI18n } from "vue-i18n"
import {
    openFile
} from "@/views/Question/controller"


const { t: $t } = useI18n()
defineProps<{ questionContent: MultipeQuestionDto }>()

/**
 * @description 复制已有提问
 */
const { copy } = useClipboard({ source: "",legacy: true })
async function copyQuestion(text: string) {
    await copy(text)
    message.success($t("复制成功"))
}

</script>


<style lang="scss" scoped>
@use "@/assets/base";

.question {
    width: 100%;
    display: flex;
    justify-content: flex-start;
    gap: 10px;
    margin: 0px 0 30px 0;


    .question-token-wrapper {
        @include base.column-flex-center;
        align-items: flex-start;


        .files {
            background-color: #F5F5F5;
            box-sizing: border-box;
            padding: 10px;
            @include base.row-flex-between;
            justify-content: flex-start;
            flex-wrap: wrap;

            .file-item {
                @include base.file-item;
            }
        }

        .images {
            background-color: #F5F5F5;
            box-sizing: border-box;
            padding: 10px;
            @include base.row-flex-between;
            justify-content: flex-start;
            flex-wrap: wrap;

        }

        .question-content {
            @include base.row-flex-between;
            justify-content: flex-start;

            .question-token {
                // background-color: #F5F5F5;
                box-sizing: border-box;
                border-radius: 5px;
                display: flex;
                padding: 4px var(--bt-pd-small);
                align-items: center;
                font-size: var(--chat-fz);
            }

            .tools {
                @include base.tools;
                align-items: flex-start;
                justify-content: flex-end;
                margin-top: 9px
            }

            @include base.tools-visible;
        }
    }
}
</style>