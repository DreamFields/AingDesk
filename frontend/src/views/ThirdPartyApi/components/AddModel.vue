<template>
    <n-modal v-model:show="addSupplierModel" :close-on-esc="false" :mask-closable="false" preset="card" draggable
        :title="isEditModelFormData ? $t('修改模型') : $t('添加模型')" class="add-model-wrapper" style="width: 480px;" segmented>
        <n-form :model="addModelFormData" :rules="addModelRules" ref="addModelForm">
            <n-form-item :label="$t('模型ID')" path="modelName">
                <n-input :placeholder="$t('请输入模型ID')" v-model:value="addModelFormData.modelName"
                    :on-update:value="modelIdChange" :disabled="isEditModelFormData" />
            </n-form-item>
            <n-form-item :label="$t('模型别名')" path="title">
                <n-input :placeholder="$t('请输入模型别名')" v-model:value="addModelFormData.title" />
            </n-form-item>
            <n-form-item :label="$t('模型功能')" path="capability">
                <n-select :options="capabilityOptions" multiple v-model:value="addModelFormData.capability"
                    :on-update:value="capabilityChange" />
            </n-form-item>

            <!-- Aurod AI 专属：同步最新模型按钮 -->
            <n-form-item v-if="isAurodSupplier" label="快速操作">
                <n-button type="primary" size="small" :loading="syncingModels" @click="syncLatestModels">
                    同步最新模型
                </n-button>
            </n-form-item>
        </n-form>
        <template #footer>
            <div class="action-wrapper">
                <n-button @click="closeAddModel">{{ $t('取消') }}</n-button>
                <n-button type="primary" @click="confirmAddModel">{{ isEditModelFormData ? $t('确认') : $t('添加')
                }}</n-button>
            </div>
        </template>
    </n-modal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { getThirdPartyApiStoreData } from '../store'
import { computed, ref } from 'vue';
import {
    capabilityChange,
    confirmAddModel,
    modelIdChange,
    closeAddModel,
} from "../controller"
import { post } from '@/api';
import { message } from '@/utils/naive-tools';
const { t: $t } = useI18n()
const {
    addSupplierModel,
    addModelFormData,
    addModelRules,
    isEditModelFormData,
    capabilityOptions,
    addModelForm,
    currentChooseApi
} = getThirdPartyApiStoreData()

// 是否为 Aurod 供应商
const isAurodSupplier = computed(() => {
    return currentChooseApi.value?.supplierName === 'aurod'
})

// 同步模型加载状态
const syncingModels = ref(false)

/**
 * 同步 Aurod 最新模型列表
 */
const syncLatestModels = async () => {
    syncingModels.value = true
    try {
        const result = await post('/aurod/sync_models')
        if (result.success) {
            message.success(`成功同步 ${result.count || 0} 个最新模型`)
        } else {
            message.error(result.error || '同步失败')
        }
    } catch (error: any) {
        message.error(error.message || '同步请求失败')
    } finally {
        syncingModels.value = false
    }
}
</script>

<style scoped lang="scss">
@use "@/assets/base";

.add-model-wrapper {
    width: 480px;

    .action-wrapper {
        @include base.action-wrapper;
    }
}
</style>