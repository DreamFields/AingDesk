import { AurodProvider } from '../service/aurod_provider';
import { pub } from '../class/public';
import path from 'path';

/**
 * Aurod 平台控制器
 */
class AurodController {
    private provider: AurodProvider | null = null;
    
    // 默认模型列表
    private static readonly DEFAULT_MODELS = [
        { modelName: "gpt-5.4-nano", title: "GPT-5.4 Nano", capability: ["llm"], status: true },
        { modelName: "gpt-5.4-nano-2026-03-17", title: "GPT-5.4 Nano (2026-03-17)", capability: ["llm"], status: true },
        { modelName: "claude-sonnet-4-6", title: "Claude Sonnet 4.6", capability: ["llm"], status: true },
        { modelName: "claude-sonnet-4-6-thinking", title: "Claude Sonnet 4.6 (Thinking)", capability: ["llm"], status: true },
        { modelName: "claude-opus-4-6", title: "Claude Opus 4.6", capability: ["llm"], status: true },
        { modelName: "gemini-3-flash-preview-thinking", title: "Gemini 3 Flash Preview (Thinking)", capability: ["llm"], status: true },
        { modelName: "gemini-3.1-pro-preview", title: "Gemini 3.1 Pro Preview", capability: ["llm"], status: true },
        { modelName: "gemini-3.1-pro-preview-thinking", title: "Gemini 3.1 Pro Preview (Thinking)", capability: ["llm"], status: true },
        { modelName: "grok-4.2", title: "Grok 4.2", capability: ["llm"], status: true },
        { modelName: "deepseek-chat", title: "DeepSeek Chat", capability: ["llm"], status: true },
        { modelName: "GLM-4.6", title: "GLM 4.6", capability: ["llm"], status: true },
        { modelName: "GLM-4.7", title: "GLM 4.7", capability: ["llm"], status: true },
        { modelName: "kimi-latest", title: "Kimi Latest", capability: ["llm"], status: true },
        { modelName: "kimi-k2-0905-preview", title: "Kimi K2 (0905 Preview)", capability: ["llm"], status: true }
    ];

    constructor() {
    }

    /**
     * 登录 Aurod 平台
     */
    public async login(args: { account: string; password: string }) {
        const { account, password } = args;
        
        try {
            this.provider = new AurodProvider();
            const result = await this.provider.login(account, password);
            
            // 保存配置
            const configPath = path.join(pub.get_data_path(), "models", "aurod");
            pub.mkdir(configPath);
            
            const config = {
                baseUrl: "https://ai.aurod.cn",
                apiKey: result.token,
                supplierName: "aurod",
                supplierTitle: "Aurod AI",
                status: true
            };
            
            pub.write_file(
                path.join(configPath, "config.json"),
                JSON.stringify(config, null, 4)
            );
            
            return {
                success: true,
                token: result.token,
                uid: result.uid
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 获取模型列表 - 返回内置默认模型
     */
    public async get_models() {
        try {
            const configPath = path.join(pub.get_data_path(), "models", "aurod", "config.json");
            if (!pub.file_exists(configPath)) {
                return { success: false, error: "请先登录 Aurod 平台" };
            }
            
            // 返回内置默认模型列表
            const modelsList = AurodController.DEFAULT_MODELS.map(model => ({
                ...model,
                supplierName: "aurod"
            }));
            
            // 保存到本地
            const modelsFile = path.join(pub.get_data_path(), "models", "aurod", "models.json");
            pub.write_file(modelsFile, JSON.stringify(modelsList, null, 4));
            
            return { success: true, models: modelsList };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * 获取会话列表
     */
    public async get_sessions(args: { page?: number; size?: number }) {
        try {
            const configPath = path.join(pub.get_data_path(), "models", "aurod", "config.json");
            if (!pub.file_exists(configPath)) {
                return { success: false, error: "请先登录 Aurod 平台" };
            }
            
            const config = pub.read_json(configPath);
            const provider = new AurodProvider(config.apiKey);
            
            const sessions = await provider.getSessionList(args.page || 1, args.size || 30);
            return { success: true, sessions };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * 创建新会话
     */
    public async create_session(args: { model?: string }) {
        try {
            const configPath = path.join(pub.get_data_path(), "models", "aurod", "config.json");
            if (!pub.file_exists(configPath)) {
                return { success: false, error: "请先登录 Aurod 平台" };
            }
            
            const config = pub.read_json(configPath);
            const provider = new AurodProvider(config.apiKey);
            
            const session = await provider.createSession(args.model || "gpt-5-chat");
            return { success: true, session };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * 测试连接
     */
    public async test_connection() {
        try {
            const configPath = path.join(pub.get_data_path(), "models", "aurod", "config.json");
            if (!pub.file_exists(configPath)) {
                return { success: false, error: "未找到配置文件，请先登录" };
            }
            
            const config = pub.read_json(configPath);
            if (!config.apiKey) {
                return { success: false, error: "API Token 未配置" };
            }
            
            const provider = new AurodProvider(config.apiKey);
            const models = await provider.getModels();
            
            return { 
                success: true, 
                message: `连接成功！可用模型: ${models.length} 个`,
                modelCount: models.length
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * 获取用户积分
     */
    public async get_credits() {
        try {
            const configPath = path.join(pub.get_data_path(), "models", "aurod", "config.json");
            if (!pub.file_exists(configPath)) {
                return { success: false, error: "未找到配置文件，请先登录" };
            }
            
            const config = pub.read_json(configPath);
            if (!config.apiKey) {
                return { success: false, error: "API Token 未配置" };
            }
            
            const provider = new AurodProvider(config.apiKey);
            const plan = await provider.getUserPlan();
            
            return { 
                success: true, 
                credits: plan.totalUsable,
                plans: plan.plans
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * 清除当前会话（新建对话时调用）
     */
    public async clear_session() {
        try {
            // 清除 AurodProvider 的静态会话 ID
            AurodProvider.clearSession();
            return { success: true, message: "会话已清除" };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * 同步最新模型列表并保存到 AurodModels.json
     */
    public async sync_models() {
        try {
            const configPath = path.join(pub.get_data_path(), "models", "aurod", "config.json");
            if (!pub.file_exists(configPath)) {
                return { success: false, error: "请先登录 Aurod 平台" };
            }

            const config = pub.read_json(configPath);
            const provider = new AurodProvider(config.apiKey);

            // 调用 /api/chat/tmpl 获取模型列表
            const response = await provider.getTemplateModels();

            // 解析并转换为 AingDesk 可用的格式
            const models = response.models.map((model: any) => ({
                modelName: model.value,
                title: model.label || model.value,
                supplierName: "aurod",
                capability: AurodController.getCapability(model.attr),
                status: true,
                tag: model.attr?.tag || "",
                integral: model.attr?.integral || "",
                icon: model.attr?.icon || ""
            }));

            // 保存到 AurodModels.json 文件
            const modelsFilePath = path.join(pub.get_data_path(), "models", "aurod", "AurodModels.json");
            pub.write_file(modelsFilePath, JSON.stringify({
                syncTime: new Date().toISOString(),
                defaultModel: response.default_model || "",
                defaultChat: response.default_chat || "",
                thinkModel: response.think_model || "",
                maxFileCount: response.max_file_count || 5,
                maxFileSize: response.max_file_size || 5,
                models: models
            }, null, 4));

            return { 
                success: true, 
                count: models.length, 
                models: models,
                message: `成功同步 ${models.length} 个模型`
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * 根据 attr 属性判断模型能力（静态方法）
     */
    private static getCapability(attr: any): string[] {
        const capabilities: string[] = [];
        
        // 所有模型默认都有 llm 能力
        capabilities.push("llm");
        
        // 多模态（支持图片）
        if (attr?.multimodal) {
            capabilities.push("vision");
        }
        
        // 插件能力
        if (attr?.plugin) {
            capabilities.push("tools");
        }
        
        return capabilities;
    }
}

export default new AurodController();
