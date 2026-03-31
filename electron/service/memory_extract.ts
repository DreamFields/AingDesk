import { pub } from '../class/public';
import { logger } from 'ee-core/log';
import { ModelService } from './model';
import { memoryService, MemoryEntry } from './memory';
import { ChatHistory } from './chat';

/**
 * 记忆提取提示词模板
 */
const EXTRACT_PROMPT = `你是一个小说创作记忆提取助手。请分析以下对话内容，提取对小说创作有价值的信息。

你需要识别并提取以下类型的信息：
1. **角色信息** (character): 新出现的角色、角色特征变化、角色关系变化
2. **情节事件** (plot): 已完成的情节、关键转折、伏笔设置/揭示
3. **世界观设定** (world): 新的世界观规则、地点描述、组织势力
4. **写作风格** (style): 用户对写作风格的偏好、修改要求、反馈

请以 JSON 数组格式输出，每条记忆包含：
- category: 分类 (character/plot/world/style)
- title: 简短标题
- content: 详细内容
- tags: 标签数组（用于后续检索）

只输出 JSON 数组，不要输出其他内容。如果没有可提取的信息，输出空数组 []。

示例输出：
[
  {
    "category": "character",
    "title": "李明 - 性格特征",
    "content": "李明是一个外表冷漠但内心温暖的剑客，年龄约25岁。左手腕有一道旧伤疤，是童年时为保护妹妹留下的。说话简短有力，极少用敬语。",
    "tags": ["李明", "剑客", "性格"]
  },
  {
    "category": "plot",
    "title": "第三章 - 酒馆遭遇战",
    "content": "李明在破晓酒馆遭遇黑衣刺客伏击，战斗中暴露了他会使用'寒冰剑诀'，这引起了在场神秘老人的注意。刺客逃跑时丢下了带有青蛇纹章的令牌。",
    "tags": ["第三章", "李明", "酒馆", "黑衣刺客", "寒冰剑诀", "青蛇纹章"]
  }
]`;


/**
 * 记忆提取服务 - 从对话中自动提取记忆
 */
export class MemoryExtractService {

    /**
     * 从对话历史中提取记忆
     * @param contextId 对话ID
     * @param messages 最近的对话消息
     * @param supplierName 模型供应商名称
     * @param model 模型名称
     * @returns 提取到的记忆条目数组
     */
    async extractFromConversation(
        contextId: string,
        messages: ChatHistory[],
        supplierName: string,
        model: string
    ): Promise<MemoryEntry[]> {
        try {
            // 只取最近 10 条消息
            const recentMessages = messages.slice(-10);
            
            // 过滤掉空消息和非文本消息
            const textMessages = recentMessages
                .filter(m => m.content && typeof m.content === 'string' && m.content.trim().length > 0)
                .map(m => ({
                    role: m.role,
                    content: typeof m.content === 'string' ? m.content.substring(0, 2000) : String(m.content).substring(0, 2000)
                }));

            if (textMessages.length < 2) {
                logger.info('[MemoryExtract] 对话消息不足，跳过提取');
                return [];
            }

            // 构建提取请求
            const requestMessages = [
                { role: 'system', content: EXTRACT_PROMPT },
                ...textMessages,
                { role: 'user', content: '请从以上对话中提取有价值的小说创作记忆信息，以JSON数组格式输出。' }
            ];

            // 调用 LLM 进行提取
            let resultText = '';
            const isOllama = supplierName === 'ollama';

            if (isOllama) {
                const ollama = pub.init_ollama();
                const res = await ollama.chat({
                    model: model,
                    messages: requestMessages as any,
                    stream: false,
                });
                resultText = res.message.content;
            } else {
                const modelService = new ModelService(supplierName);
                const res = await modelService.chat({
                    model: model,
                    messages: requestMessages,
                    stream: false,
                    temperature: 0.3, // 低温度保证提取准确性
                });
                resultText = res.choices?.[0]?.message?.content || '';
            }

            // 解析 JSON 结果
            const extracted = this.parseExtractResult(resultText);
            
            if (extracted.length === 0) {
                logger.info('[MemoryExtract] 未提取到记忆信息');
                return [];
            }

            // 保存提取到的记忆
            const savedEntries: MemoryEntry[] = [];
            for (const item of extracted) {
                try {
                    const entry = memoryService.addMemory(
                        contextId,
                        item.category || 'plot',
                        item.title || '未命名记忆',
                        item.content || '',
                        item.tags || []
                    );
                    savedEntries.push(entry);
                } catch (e) {
                    logger.error('[MemoryExtract] 保存记忆条目失败', e);
                }
            }

            logger.info(`[MemoryExtract] 成功提取 ${savedEntries.length} 条记忆`);
            return savedEntries;

        } catch (e: any) {
            logger.error('[MemoryExtract] 记忆提取失败', e.message || e);
            return [];
        }
    }

    /**
     * 解析 LLM 返回的 JSON 文本
     */
    private parseExtractResult(text: string): Array<{
        category: string;
        title: string;
        content: string;
        tags: string[];
    }> {
        try {
            // 尝试直接解析
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed)) return parsed;
            return [];
        } catch {
            // 尝试提取 JSON 块
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                try {
                    const parsed = JSON.parse(jsonMatch[0]);
                    if (Array.isArray(parsed)) return parsed;
                } catch {
                    // ignore
                }
            }
            // 尝试提取 ```json ``` 块
            const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
            if (codeBlockMatch) {
                try {
                    const parsed = JSON.parse(codeBlockMatch[1]);
                    if (Array.isArray(parsed)) return parsed;
                } catch {
                    // ignore
                }
            }
            logger.warn('[MemoryExtract] 无法解析提取结果:', text.substring(0, 200));
            return [];
        }
    }
}

/**
 * 重写 toString 方法
 */
MemoryExtractService.toString = () => '[class MemoryExtractService]';

/**
 * 导出单例实例
 */
export const memoryExtractService = new MemoryExtractService();
