<template>
	<n-modal v-model:show="softSettingsShow" :mask-closable="false" :close-on-esc="false" preset="card" draggable
		segmented title="软件设置" :style="{ width: 'auto' }" closable @close="closeSoftSettings">
		<div class="soft-settings">
			<div class="tabs">
				<div class="tabs-item" :class="{ active: currentSettingTab == 'general' }"
					@click="changeSettingTab('general')">{{ $t('常规设置') }}</div>
				<div class="tabs-item" :class="{ active: currentSettingTab == 'mcp' }" @click="changeSettingTab('mcp')">
					{{ $t('MCP服务器') }}</div>
				<div class="tabs-item" :class="{ active: currentSettingTab == 'aurod' }" @click="changeSettingTab('aurod')">
					{{ $t('Aurod AI') }}</div>
			</div>
			<div class="tabs-panels" :style="{ width: settingPanelWidth + 'px', borderLeft: settingPanelBorder }"
				style="overflow:hidden">
				<GeneralSettings v-if="currentSettingTab == 'general'" />
				<McpServer v-if="currentSettingTab == 'mcp'" />
				<AurodSettings v-if="currentSettingTab == 'aurod'" />
			</div>
		</div>
	</n-modal>

	<!-- 更改用户数据存储位置 -->
	<ChangeDirWarning />
	<!-- 删除MCP服务器问询 -->
	<DelMcpConfirm />
</template>

<script setup lang="ts">
import DelMcpConfirm from './components/DelMcpConfirm.vue';
import ChangeDirWarning from './components/ChangeDirWarning.vue';
import { getGlobalStore } from '@/stores/global';
import { getSoftSettingsStoreData } from './store';
import GeneralSettings from './components/GeneralSettings.vue';
import McpServer from './components/McpServer.vue';
import AurodSettings from './components/AurodSettings.vue';
import { changeSettingTab, closeSoftSettings } from './controller';
import i18n from '@/lang';
const { currentSettingTab, settingPanelWidth, softSettingsShow } = getSoftSettingsStoreData();
const $t = i18n.global.t;
const { settingPanelBorder } = getGlobalStore();
console.log(settingPanelBorder.value)
</script>

<style scoped lang="scss">
@use "@/assets/base";

.soft-settings {
	width: 100%;
	display: grid;
	grid-template-columns: 120px 1fr;
	grid-gap: 10px;

	.tabs {
		@include base.column-flex-center;
		align-items: flex-start;
		justify-content: flex-start;
		gap: 0;

		.tabs-item {
			box-sizing: border-box;
			padding: 10px;
			cursor: pointer;
			transition: 0.2s;
			width: 100%;
			@include base.column-flex-center;
			align-items: flex-start;

			&:hover {
				background: var(--bt-theme-color-hover);
			}

			&.active {
				background: var(--bt-theme-color-hover);
			}
		}
	}

	.tabs-panels {
		// border-left: v-bind(settingPanelBorder);
		box-sizing: border-box;
		padding: 0 10px;
		transition: 0.2s;
	}

}
</style>
