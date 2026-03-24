<template>
  <NConfigProvider :theme="themeMode == 'light' ? lightTheme : darkTheme" :theme-overrides="themeOverrides">
    <router-view></router-view>
  </NConfigProvider>



</template>

<script setup lang="ts">
import { getGlobalStore } from "./stores/global";
import { openSoftSettings } from "@/views/SoftSettings/controller/index"

import useIndexStore, { getIndexStore } from './views/Home/store';
import { storeToRefs } from 'pinia';
import { NConfigProvider, darkTheme, lightTheme } from 'naive-ui';
import { ragStatus, } from '@/views/KnowleadgeStore/controller/index';
import { getVersion } from "@/views/Home/controller"
import storage from './utils/storage';
import { computed, onMounted } from 'vue';
import { getSoftSettingsStoreData } from './views/SoftSettings/store';
import { getKnowledgeStoreData } from './views/KnowleadgeStore/store';
import { getChatContentStoreData } from './views/ChatContent/store';


const { themeMode, targetNet, fontScale } = getSoftSettingsStoreData()
const { knowledgeDragable, } = getKnowledgeStoreData()
const { welcomeShow, } = getIndexStore()
const { guideActive, } = getChatContentStoreData()
const { modalTitleBg } = getGlobalStore()

// 临时代码——打开设置弹窗
// openSoftSettings()

// 检测知识库状态
ragStatus()
// 获取版本号
getVersion()

// 调整样式
const themeOverrides = computed(() => {
  const scale = Math.min(130, Math.max(85, Number(fontScale.value) || 100));
  const base = 14;
  const medium = `${Math.round((base * scale) / 100)}px`;
  const small = `${Math.max(11, Math.round((12 * scale) / 100))}px`;
  const large = `${Math.round((16 * scale) / 100)}px`;
  return {
    common: {
      fontSize: medium,
      fontSizeSmall: small,
      fontSizeMedium: medium,
      fontSizeLarge: large,
      fontSizeHuge: `${Math.round((18 * scale) / 100)}px`
    },
    Switch: {
      // railWidthMedium: "20px",
      // railWidthSmall:"20px"
    }
  }
})

// 判断是否出现欢迎界面
onMounted(() => {
  if (storage.welcomeEnd == null) {
    welcomeShow.value = true;
  }

  guideActive.value = storage.welcomeGuide
  targetNet.value = storage.searchEngine ? storage.searchEngine : ""
})

</script>

<style lang="scss">
@use "@/assets/base.scss";

.drag-upload {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 10000;
}

// 弹窗统一header样式
.n-modal .n-card-header {
  background-color: v-bind(modalTitleBg);
  font-size: 16px;
}
</style>