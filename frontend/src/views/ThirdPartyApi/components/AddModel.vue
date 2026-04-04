<template>
    <n-modal v-model:show="addSupplierModel" :close-on-esc="false" :mask-closable="false" preset="card" draggable
        :title="isEditModelFormData ? $t('修改模型') : $t('添加模型')" class="add-model-wrapper" style="width: 520px;" segmented
        @after-enter="onModalOpen">
        <n-form :model="addModelFormData" :rules="addModelRules" ref="addModelForm">

            <!-- Aurod AI 专属：模型选择下拉列表 + Tag 过滤 -->
            <n-form-item v-if="isAurodSupplier && !isEditModelFormData" label="选择模型">
                <div class="aurod-model-selector">
                    <div class="filter-row">
                        <!-- Tag 分类下拉过滤 -->
                        <n-select
                            v-model:value="selectedTag"
                            :options="tagFilterOptions"
                            placeholder="全部分类"
                            clearable
                            size="small"
                            class="tag-select"
                            @update:value="onTagFilterChange"
                        />
                        <!-- 模型下拉列表 -->
                        <n-select
                            v-model:value="selectedAurodModel"
                            :options="filteredAurodModelOptions"
                            placeholder="从已同步的模型中选择..."
                            filterable
                            clearable
                            :loading="loadingSyncedModels"
                            class="model-select"
                            @update:value="onAurodModelSelect"
                        >
                        </n-select>
                    </div>
                </div>
            </n-form-item>

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
import { computed, ref, watch } from 'vue';
import {
    capabilityChange,
    confirmAddModel,
    modelIdChange,
    closeAddModel,
} from "../controller"
import { post } from '@/api';
import { message } from '@/utils/naive-tools';

// Aurod 模型数据类型
interface AurodSyncedModel {
    modelName: string;
    title: string;
    supplierName: string;
    capability: string[];
    status: boolean;
    tag?: string;
    integral?: string;
    icon?: string;
}

// 当前选中模型的积分（随表单一起提交）
// 注意：integral 通过 (addModelFormData as any).integral 携带，无需单独的 ref


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

// ========== 同步模型相关 ==========
const syncingModels = ref(false)

const syncLatestModels = async () => {
    syncingModels.value = true
    try {
        const result = await post('/aurod/sync_models')
        if (result.success) {
            message.success(`成功同步 ${result.count || 0} 个最新模型`)
            // 同步后刷新下拉列表
            await loadSyncedModels()
        } else {
            message.error(result.error || '同步失败')
        }
    } catch (error: any) {
        message.error(error.message || '同步请求失败')
    } finally {
        syncingModels.value = false
    }
}

// 同步并刷新
const syncAndRefresh = async () => {
    await syncLatestModels()
}

// ========== Aurod 已同步模型下拉列表 ==========
const aurodModelList = ref<AurodSyncedModel[]>([])
const loadingSyncedModels = ref(false)
const selectedTag = ref('')
const selectedAurodModel = ref<string | null>(null)

// 所有可用的 tag 分类（去重排序）
const availableTags = computed(() => {
    const tags = new Set<string>()
    aurodModelList.value.forEach(m => {
        if (m.tag) tags.add(m.tag)
    })
    return Array.from(tags).sort()
})

// Tag 过滤下拉选项（带"全部"）
const tagFilterOptions = computed(() => {
    const options = [{ label: '全部分类', value: '' }]
    availableTags.value.forEach(tag => {
        options.push({ label: tag, value: tag })
    })
    return options
})

// 按 tag 过滤后的选项
const filteredAurodModelOptions = computed(() => {
    let list = aurodModelList.value
    if (selectedTag.value) {
        list = list.filter(m => m.tag === selectedTag.value)
    }
    // 按 title 排序
    list.sort((a, b) => (a.title || '').localeCompare(b.title || ''))

    return list.map(m => ({
        label: m.title + (m.integral ? `  ${m.integral}` : ''),
        value: m.modelName
    }))
})

// 加载已同步的 Aurod 模型（从 AurodModels.json）
const loadSyncedModels = async () => {
    loadingSyncedModels.value = true
    try {
        const result = await post('/aurod/get_synced_models')
        if (result.success && result.models) {
            aurodModelList.value = result.models
        } else {
            aurodModelList.value = []
        }
    } catch {
        aurodModelList.value = []
    } finally {
        loadingSyncedModels.value = false
    }
}

// 选中一个模型时，自动填充表单
const onAurodModelSelect = (value: string | null) => {
    if (!value) return
    const model = aurodModelList.value.find(m => m.modelName === value)
    if (model) {
        addModelFormData.value.modelName = model.modelName
        addModelFormData.value.title = model.title
        addModelFormData.value.capability = [...(model.capability || [])]
        ;(addModelFormData.value as any).integral = model.integral || ''
    }
}

// Tag 过滤切换时重置选择
const onTagFilterChange = (_val: string) => {
    selectedAurodModel.value = null
}

// 弹窗打开时加载模型数据
const onModalOpen = () => {
    if (isAurodSupplier.value && !isEditModelFormData.value) {
        loadSyncedModels()
    }
}
</script>

<style scoped lang="scss">
@use "@/assets/base";

.add-model-wrapper {
    width: 520px;

    .action-wrapper {
        @include base.action-wrapper;
    }

    .aurod-model-selector {
        width: 100%;

        .filter-row {
            display: flex;
            align-items: center;
            gap: 10px;

            .tag-select {
                width: 130px;
                flex-shrink: 0;
            }

            .model-select {
                flex: 1;
                min-width: 0;
            }
        }

        .sync-hint {
            font-size: 11px;
            color: #bbb;
        }
    }
}
</style>