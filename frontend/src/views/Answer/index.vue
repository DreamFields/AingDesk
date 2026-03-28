<template>
    <div class="answer">
        <NImage :src="answerLogo(answerContent.stat?(answerContent.stat as Stat)!.model as string:'', answerContent.stat?(answerContent.stat as Stat)!.supplierName as string:'')" width="30" height="30" preview-disabled />
        <div class="answer-token flex items-center gap-5" v-if="!answerContent.content && isInChat">
            <NSpin :size="20" />{{ targetNet ? $t("正在搜索...") : $t("正在思考...") }}
        </div>
        <div class="answer-token" v-else>
                    <MarkdownRender :content="answerContent.content as string"
                    :searchResult="answerContent.search_result as Array<any> ? answerContent.search_result as Array<any> : []" :tools_result="(answerContent.tools_result&&answerContent.tools_result.length)?answerContent.tools_result:[]"/>
                <AnswerTools :answer-content="answerContent" :question-content="questionContent"/>
        </div>
    </div>
</template>


<script lang="ts" setup>
import { NSpin, NImage } from "naive-ui"
import { answerLogo,} from "@/views/Answer/controller"
import AnswerTools from "./components/AnswerTools.vue"
import MarkdownRender from "./components/MarkdownRender.vue"

import type { AnswerInfo, MultipeQuestionDto,Stat } from "@/views/Home/dto"

import { useI18n } from "vue-i18n"
import { getSoftSettingsStoreData } from "../SoftSettings/store"
import { getChatContentStoreData } from "../ChatContent/store"
const { isInChat} = getChatContentStoreData()
const { t: $t } = useI18n()
const { targetNet, } = getSoftSettingsStoreData()

defineProps<{ answerContent: AnswerInfo, questionContent: MultipeQuestionDto }>()
</script>


<style lang="scss" scoped>
@use "@/assets/base";

.answer {
    width: 100%;
    display: grid;
    grid-template-columns: 30px 1fr;
    column-gap: 10px;
    justify-content: start;

    .answer-token {
        box-sizing: border-box;
        border-radius: 5px;
        padding: 4px var(--bt-pd-normal) 20px 0;
        position: relative;
        font-size: var(--chat-fz);

        .info-pop {
            gap: 10px;
            color: #909090;
        }

        .tools {
            margin-top: var(--bt-mg-large);
            width: 100%;
            position: absolute;
            bottom: -5px;
            left: 0;
            @include base.tools()
        }

        @include base.tools-visible()
    }
}
</style>