import type { McpServerListDto, CloudMcpServerListDto } from '@/views/Home/dto/index';
import storage from "@/utils/storage";
import { defineStore, storeToRefs } from "pinia";
import { ref } from "vue";


const useSoftSettingsStore = defineStore("softSettings", () => {
	// 软件设置弹窗
	const softSettingsShow = ref(false);
	// 风格模式
	const themeMode = ref(storage.themeMode || 'light');
	// 风格模式下相关背景色
	const themeColors = ref({
		// markdown代码部分背景
		markdownCodeLight: '#F9FAFB',
		markdownCOdeDark: 'rgb(97 96 96 / 14%)',
		// markdown代码工具条背景
		markdownToolsLight: '#F3F4F6',
		markdownToolsDark: 'rgb(97 96 96 / 34%)',
		// markdown工具条文本颜色
		markdownToolsFontColorLight: '#545454',
		markdownToolsFontColorDark: 'inherit',
		// 深度思考部分
		thinkWrapperLight: '#f5f5f5',
		thinlWrapperDark: 'rgb(97 96 96 / 14%)',
		// 提问框背景
		questionToolBgLight: 'transparent',
		questionToolBgDark: '#28282C',
	});
	// 当前语言
	const currentLanguage = ref(storage.language || 'zh');
	// 语言选择
	const languageOptions = ref([]);
	// 联网搜索
	const targetNet = ref('baidu');
	// 版本号
	const version = ref('1.0.0');
	// 界面字体缩放比例（百分比）
	const fontScale = ref(storage.fontScale || 100);
	// 修改数据存储位置的提示弹窗
	const changeDataPathShow = ref(false);
	// 获取用户数据存储位置
	const userDataPath = ref('');
	// 数据迁移检查
	const dataPathChangeCheckShow = ref(false);
	// 数据迁移状态指标值
	const dataPathChangeStatusValues = ref({
		status: 0, // 0:未开始，1:正在复制,2:复制完成,-1:复制失败
		speed: 0,
		total: 0,
		current: 0,
		percent: 0,
		startTime: 0,
		endTime: 0,
		fileTotal: 0,
		fileCurrent: 0,
		message: '',
		error: '',
	});
	// 当前设置项
	const currentSettingTab = ref('general');
	// 设置面板宽度
	const settingPanelWidth = ref(480);
	// 当前MCP项
	const currentMcpName = ref('');
	const createMcpServerRef = ref()
	// 命令类型
	const commadType = ref('npx')
	// 是否显示mcp表单
	const mcpServerFormShow = ref(false);
	// MCP已配置列表
	const mcpServerList = ref<McpServerListDto[]>([]);
	// MCP服务器模板列表（云端）
	const mcpServerTempList = ref<CloudMcpServerListDto[]>([]);
	// MCP服务器列表选中项
	const currentMcpChoose = ref<CloudMcpServerListDto>({
		name: '',
		description: '',
		type: 'stdio',
		command: 'npx',
		baseUrl: '',
		env: '',
		args: '',
	});

	// MCP服务器编辑模式
	const mcpServerEditMode = ref(false);
	// 是否获取过云端列表
	const mcpServerCloud = ref(false);
	// 环境状态（py、node）
	const envStatus = ref({
		node_npx: 0,
		python_uv: 0,
	});
	// 环境安装loading
	const envInstallShow = ref(false);
	// mcp配置文件弹窗
	const mcpConfigFileShow = ref(false);
	// mcp配置文件内容
	const mcpConfigFileContent = ref('');
	// 当前mcp配置备份
	const currentMcpConfigBackup = ref<McpServerListDto>();
	// 卸载MCP问询弹窗
	const delMcpConfirmShow = ref(false);
	return {
		softSettingsShow,
		themeMode,
		themeColors,
		currentLanguage,
		languageOptions,
		targetNet,
		version,
		fontScale,
		userDataPath,
		dataPathChangeCheckShow,
		dataPathChangeStatusValues,
		currentSettingTab,
		settingPanelWidth,
		currentMcpName,
		createMcpServerRef,
		commadType,
		mcpServerFormShow,
		mcpServerList,
		mcpServerTempList,
		currentMcpChoose,
		mcpServerEditMode,
		mcpServerCloud,
		envStatus,
		envInstallShow,
		mcpConfigFileShow,
		mcpConfigFileContent,
		currentMcpConfigBackup,
		changeDataPathShow,
		delMcpConfirmShow
	};
})

export function getSoftSettingsStoreData() {
    return storeToRefs(useSoftSettingsStore())
}