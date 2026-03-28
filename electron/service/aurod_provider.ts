import axios, { AxiosInstance } from 'axios';
import { logger } from 'ee-core/log';

/**
 * ai.aurod.cn API 响应格式
 */
interface AurodResponse {
    code: number;
    msg: string;
    data: any;
}

/**
 * ai.aurod.cn 会话信息
 */
interface AurodSession {
    id: number;
    name: string;
    model: string;
    created: string;
    updated: string;
    uid: number;
    maxToken: number;
    temperature: number;
    contextCount: number;
}

/**
 * ai.aurod.cn 提供商服务
 */
export class AurodProvider {
    private baseUrl: string = "https://ai.aurod.cn";
    private client: AxiosInstance;
    private authToken: string = "";
    private cookie: string = "";
    private uid: number = 0;
    private currentSessionId: number | null = null;
    
    // 静态变量保存会话 ID，确保同一进程内复用会话
    private static savedSessionId: number | null = null;

    constructor(authToken?: string, cookie?: string) {
        this.authToken = authToken || "";
        this.cookie = cookie || "";
        
        // 恢复保存的会话 ID
        this.currentSessionId = AurodProvider.savedSessionId;
        
        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: 30000,
            headers: {
                "Content-Type": "application/json",
                "X-App-Version": "2.14.0",
                "Origin": this.baseUrl,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.0"
            }
        });
        
        this.updateHeaders();
        
        if (this.currentSessionId) {
            logger.info(`[Aurod] Restored session ID: ${this.currentSessionId}`);
        }
    }

    /**
     * 更新请求头
     */
    private updateHeaders(): void {
        if (this.authToken) {
            this.client.defaults.headers.common["Authorization"] = this.authToken;
        }
        if (this.cookie) {
            this.client.defaults.headers.common["Cookie"] = this.cookie;
        }
    }

    /**
     * 设置认证信息
     */
    public setAuth(authToken: string, uid?: number): void {
        this.authToken = authToken;
        if (uid) this.uid = uid;
        this.updateHeaders();
    }

    /**
     * 用户登录
     */
    public async login(account: string, password: string): Promise<{ token: string; uid: number }> {
        try {
            const response = await this.client.post("/api/user/login", {
                account,
                password,
                agreement: true
            }, {
                headers: { "Referer": `${this.baseUrl}/auth` }
            });
            
            const data: AurodResponse = response.data;
            
            if (data.code !== 0) {
                throw new Error(data.msg || "登录失败");
            }
            
            this.authToken = data.data.token;
            this.uid = data.data.id;
            
            this.updateHeaders();
            
            return { token: this.authToken, uid: this.uid };
        } catch (error: any) {
            logger.error("Aurod login error:", error.message);
            throw error;
        }
    }

    /**
     * 创建新会话
     */
    public async createSession(model: string = "gpt-5-chat", plugins: any[] = [], mcp: any[] = []): Promise<AurodSession> {
        try {
            const response = await this.client.post("/api/chat/session", {
                model,
                plugins,
                mcp
            });
            
            const data: AurodResponse = response.data;
            
            if (data.code !== 0) {
                throw new Error(data.msg || "创建会话失败");
            }
            
            this.currentSessionId = data.data.id;
            // 保存到静态变量，确保新实例能恢复会话
            AurodProvider.savedSessionId = this.currentSessionId;
            logger.info(`[Aurod] Session created and saved: ${this.currentSessionId}`);
            
            return {
                id: data.data.id,
                name: data.data.name || "新对话",
                model: data.data.model,
                created: data.data.created,
                updated: data.data.updated,
                uid: data.data.uid,
                maxToken: data.data.maxToken || 0,
                temperature: data.data.temperature || 0,
                contextCount: data.data.contextCount || 0
            };
        } catch (error: any) {
            logger.error("Aurod create session error:", error.message);
            throw error;
        }
    }

    /**
     * 获取用户积分计划
     */
    public async getUserPlan(): Promise<{ totalUsable: number; plans: any[] }> {
        try {
            const response = await this.client.get("/api/user_plan", {
                params: { page: 1 }
            });
            
            const data: AurodResponse = response.data;
            
            if (data.code !== 0) {
                throw new Error(data.msg || "获取积分信息失败");
            }
            
            const records = data.data.records || [];
            // 过滤未过期的计划，计算总可用积分
            let totalUsable = 0;
            const activePlans = records.filter((plan: any) => !plan.isExpire);
            
            for (const plan of activePlans) {
                totalUsable += plan.usable || 0;
            }
            
            logger.info(`[Aurod] User plan: ${activePlans.length} active plans, total usable: ${totalUsable}`);
            
            return {
                totalUsable,
                plans: activePlans.map((plan: any) => ({
                    name: plan.name,
                    usable: plan.usable,
                    total: plan.total,
                    use: plan.use,
                    expire: plan.expire,
                    eachDay: plan.eachDay
                }))
            };
        } catch (error: any) {
            logger.error("Aurod get user plan error:", error.message);
            throw error;
        }
    }

    /**
     * 获取会话列表
     */
    public async getSessionList(page: number = 1, size: number = 30): Promise<AurodSession[]> {
        try {
            const response = await this.client.get("/api/chat/session", {
                params: { page, size }
            });
            
            const data: AurodResponse = response.data;
            
            if (data.code !== 0) {
                throw new Error(data.msg || "获取会话列表失败");
            }
            
            return data.data.records.map((record: any) => ({
                id: record.id,
                name: record.name || "新对话",
                model: record.model,
                created: record.created,
                updated: record.updated,
                uid: record.uid,
                maxToken: record.maxToken || 0,
                temperature: record.temperature || 0,
                contextCount: record.contextCount || 0
            }));
        } catch (error: any) {
            logger.error("Aurod get session list error:", error.message);
            throw error;
        }
    }

    /**
     * 获取模型列表
     */
    public async getModels(): Promise<any[]> {
        try {
            const response = await this.client.get("/api/chat/models");
            const data: AurodResponse = response.data;
            
            if (data.code !== 0) {
                throw new Error(data.msg || "获取模型列表失败");
            }
            
            return data.data.models || [];
        } catch (error: any) {
            logger.error("Aurod get models error:", error.message);
            throw error;
        }
    }

    /**
     * 流式聊天 - 转换为 OpenAI 兼容格式
     */
    public async *chat(messages: any[], model?: string): AsyncGenerator<any> {
        try {
            // 优先从静态变量恢复会话 ID
            if (!this.currentSessionId && AurodProvider.savedSessionId) {
                this.currentSessionId = AurodProvider.savedSessionId;
                logger.info(`[Aurod] Restored session from static: ${this.currentSessionId}`);
            }
            
            if (!this.currentSessionId) {
                // 自动创建会话
                logger.info('[Aurod] No active session, creating new session...');
                await this.createSession(model || "gpt-5-chat");
            } else {
                logger.info(`[Aurod] Using existing session: ${this.currentSessionId}`);
            }
        } catch (sessionError: any) {
            logger.error('[Aurod] Failed to create session:', sessionError.message);
            throw new Error(`创建会话失败: ${sessionError.message}`);
        }

        if (!this.currentSessionId) {
            throw new Error('无法创建会话，请检查配置');
        }

        const payload = {
            text: messages[messages.length - 1].content,
            sessionId: this.currentSessionId,
            files: [],
            model: model
        };

        logger.info(`[Aurod] Sending chat request, sessionId: ${this.currentSessionId}, model: ${model || 'default'}, text length: ${payload.text.length}`);

        try {
            const response = await this.client.post("/api/chat/completions", payload, {
                responseType: 'stream',
                headers: {
                    "Referer": `${this.baseUrl}/chat`
                }
            });

            const stream = response.data;
            let buffer = '';
            let hasEnded = false;
            let chunkCount = 0;

            for await (const chunk of stream) {
                chunkCount++;
                const chunkStr = chunk.toString();
                logger.info(`[Aurod] Raw chunk #${chunkCount} [${chunkStr.length} chars]: "${chunkStr.replace(/\n/g, '\\n').substring(0, 300)}${chunkStr.length > 300 ? '...' : ''}"`);
                buffer += chunkStr;
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                
                logger.info(`[Aurod] Processing ${lines.length} lines, buffer left: ${buffer.length} chars`);
                
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    if (!line.trim()) continue;  // 跳过空行
                    
                    logger.info(`[Aurod] Line #${i}: "${line.substring(0, 100)}${line.length > 100 ? '...' : ''}"`);
                    
                    if (line.startsWith('data: ')) {
                        const jsonStr = line.slice(6).trim();
                        
                        // 处理 [DONE] 标记
                        if (jsonStr === '[DONE]') {
                            logger.info('[Aurod] Received [DONE] marker');
                            hasEnded = true;
                            yield {
                                choices: [{
                                    finish_reason: 'stop',
                                    delta: {}
                                }],
                                created: Date.now(),
                                usage: {
                                    prompt_tokens: 0,
                                    completion_tokens: 0
                                }
                            };
                            return;
                        }
                        
                        try {
                            const jsonData = JSON.parse(jsonStr);
                            
                            // 检查是否是结束标记 (type: 'object' 是 Aurod 的结束标记)
                            if (jsonData.type === 'object' || jsonData.type === 'close') {
                                logger.info('[Aurod] Received end marker, type:', jsonData.type);
                                hasEnded = true;
                                yield {
                                    choices: [{
                                        finish_reason: 'stop',
                                        delta: {}
                                    }],
                                    created: Date.now(),
                                    usage: {
                                        prompt_tokens: 0,
                                        completion_tokens: 0
                                    }
                                };
                                return;
                            }

                            // 提取内容 - 参考 ai_client.py 只取 data 字段
                            const content = jsonData.data || '';
                            
                            // 过滤空内容（参考 ai_client.py: if message: yield message）
                            if (!content) {
                                continue;
                            }
                            
                            logger.info(`[Aurod] Content [${content.length} chars]: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`);

                            // 转换为 OpenAI 兼容格式
                            yield {
                                choices: [{
                                    delta: {
                                        content: content
                                    },
                                    finish_reason: null
                                }]
                            };
                        } catch (e) {
                            logger.warn('[Aurod] JSON parse error:', e.message, 'for line:', line);
                        }
                    }
                }
            }
            
            // 处理缓冲区中剩余的内容
            if (buffer.trim()) {
                const line = buffer.trim();
                if (line.startsWith('data: ')) {
                    const jsonStr = line.slice(6).trim();
                    
                    // 处理 [DONE] 标记
                    if (jsonStr === '[DONE]') {
                        hasEnded = true;
                        yield {
                            choices: [{
                                finish_reason: 'stop',
                                delta: {}
                            }],
                            created: Date.now(),
                            usage: {
                                prompt_tokens: 0,
                                completion_tokens: 0
                            }
                        };
                    }
                    
                    try {
                        const jsonData = JSON.parse(jsonStr);
                        if (jsonData.type === 'object' || jsonData.type === 'close') {
                            hasEnded = true;
                            yield {
                                choices: [{
                                    finish_reason: 'stop',
                                    delta: {}
                                }],
                                created: Date.now(),
                                usage: {
                                    prompt_tokens: 0,
                                    completion_tokens: 0
                                }
                            };
                        }
                    } catch (e) {
                        // 忽略解析错误
                    }
                }
            }
            
            // 如果流结束但没有收到明确的结束标记，发送一个
            if (!hasEnded) {
                logger.info('[Aurod] Stream ended without explicit marker, sending stop');
                yield {
                    choices: [{
                        finish_reason: 'stop',
                        delta: {}
                    }],
                    created: Date.now(),
                    usage: {
                        prompt_tokens: 0,
                        completion_tokens: 0
                    }
                };
            }
        } catch (error: any) {
            logger.error("Aurod chat error:", error.message);
            throw error;
        }
    }

    /**
     * 非流式聊天
     */
    public async chatComplete(messages: any[], model?: string): Promise<string> {
        let fullResponse = '';
        for await (const chunk of this.chat(messages, model)) {
            if (chunk.choices[0]?.delta?.content) {
                fullResponse += chunk.choices[0].delta.content;
            }
            if (chunk.choices[0]?.finish_reason === 'stop') {
                break;
            }
        }
        return fullResponse;
    }

    /**
     * 设置当前会话
     */
    public setSession(sessionId: number): void {
        this.currentSessionId = sessionId;
        AurodProvider.savedSessionId = sessionId;
        logger.info(`[Aurod] Session set to: ${sessionId}`);
    }
    
    /**
     * 获取保存的会话 ID（静态方法）
     */
    public static getSavedSessionId(): number | null {
        return AurodProvider.savedSessionId;
    }
    
    /**
     * 设置保存的会话 ID（静态方法）
     */
    public static setSavedSessionId(sessionId: number | null): void {
        AurodProvider.savedSessionId = sessionId;
    }
    
    /**
     * 清除保存的会话
     */
    public static clearSession(): void {
        AurodProvider.savedSessionId = null;
    }

    /**
     * 获取当前会话ID
     */
    public getCurrentSessionId(): number | null {
        return this.currentSessionId;
    }

    /**
     * 获取 Token
     */
    public getAuthToken(): string {
        return this.authToken;
    }

    /**
     * 获取 UID
     */
    public getUid(): number {
        return this.uid;
    }
}
