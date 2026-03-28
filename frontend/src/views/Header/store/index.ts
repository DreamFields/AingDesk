import type { CurrentModelDto, MultipleModelListDto } from "@/views/Home/dto";
import { getThirdPartyApiStoreData } from "@/views/ThirdPartyApi/store";
import { defineStore, storeToRefs } from "pinia";
import { ref } from "vue";

const useHeaderStore = defineStore("headerStore", () => {
  // 已安裝模型列表-计算后
  const modelList = ref<any>([])
  // 已安装模型列表-计算前
  const modelListSource = ref<any>([])
  // 当前模型实体
  const currentModelDto = ref<CurrentModelDto | null>()
  // 当前使用的模型
  const currentModel = ref("")
  // 分享信息弹窗
  const shareShow = ref(false)
  // 分享地址
  const shareUrl = ref("")
  // 分享历史列表
  const shareHistory = ref([])
  // 修改分享弹窗
  const modifyShareShow = ref(false)
  // 删除分享问询弹窗
  const delShareConfirmShow = ref(false)
  // 分享标题
  const title = ref("")
  // 分享模型
  const shareModel = ref("")
  // 分享的智能体
  const shareAgent = ref(null)
  // 分享时选择的知识库
  const knowledges = ref([])
  // 修改分享标题
  const modify_title = ref("")
  // 修改分享模型
  const modify_shareModel = ref("")
  // 要修改的分享id
  const modify_share_id = ref("")
  // 修改分享时选择的知识库
  const modify_knowledges = ref([])
  // 修改分享时选择的智能体
  const modify_shareAgent = ref(null)
  // 删除分享id
  const del_share_id = ref("")
  // 选择模型弹窗
  const chooseModelVisible = ref(true)
  // 模型列表过滤关键字
  const modelListFilterKey = ref("")
  // 模型列表展示
  const modelListShow = ref(false)
  // 计算：从modelList中找出currentModel对应的label
  const showModel = computed(() => {
    const { currentSupplierName } = getThirdPartyApiStoreData()
    return modelList.value.find((item: any) => (item.value === currentModel.value && item.supplierName == currentSupplierName.value))?.label
  })
  // 计算：根据过滤条件生成展示模型列表
  const showModelList = computed(() => {
    const newList: any = {};
    for (const key in modelListSource.value) {
      if (key !== "commonModelList") {
        if (modelListFilterKey.value) {
          newList[key] = modelListSource.value[key].filter((item: any) => item.model.includes(modelListFilterKey.value.toLowerCase()));
        } else {
          newList[key] = modelListSource.value[key];
        }
      }
    }
    return newList;
  })

  // 多模型的对象列表
  const multipleModelList = ref<MultipleModelListDto[]>([])
  // Aurod 积分
  const aurodCredits = ref<number | null>(null)
  // Aurod 积分详情
  const aurodCreditPlans = ref<any[]>([])
  return {
    modelList,
    currentModelDto,
    currentModel,
    shareShow,
    shareUrl,
    shareHistory,
    modifyShareShow,
    delShareConfirmShow,
    title,
    shareModel,
    shareAgent,
    knowledges,
    modify_title,
    modify_shareModel,
    modify_share_id,
    modify_knowledges,
    del_share_id,
    chooseModelVisible,
    modelListSource,
    modelListFilterKey,
    modify_shareAgent,
    showModel,
    showModelList,
    modelListShow,
    multipleModelList,
    aurodCredits,
    aurodCreditPlans
  }
})

export function getHeaderStoreData() {
  return storeToRefs(useHeaderStore())
}