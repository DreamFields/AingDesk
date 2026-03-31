import { pub } from '../class/public';
import { logger } from 'ee-core/log';
import { memoryService } from '../service/memory';
import { memoryExtractService } from '../service/memory_extract';
import { ChatService } from '../service/chat';

/**
 * memory controller 类，处理记忆相关的 API 请求
 * 路由: /controller/memory/xxx
 * @class
 */
class MemoryController {

    /**
     * 初始化对话的记忆
     * POST /memory/init_memory
     */
    async init_memory(args: { context_id: string; novel_name?: string }): Promise<any> {
        const { context_id, novel_name } = args;
        if (!context_id) {
            return pub.return_error(pub.lang('对话ID不能为空'));
        }
        const index = memoryService.initMemory(context_id, novel_name || '');
        return pub.return_success(pub.lang('记忆初始化成功'), index);
    }

    /**
     * 获取记忆索引
     * POST /memory/get_memory_index
     */
    async get_memory_index(args: { context_id: string }): Promise<any> {
        const { context_id } = args;
        if (!context_id) {
            return pub.return_error(pub.lang('对话ID不能为空'));
        }
        const index = memoryService.getMemoryIndex(context_id);
        if (!index) {
            return pub.return_error(pub.lang('记忆索引不存在'));
        }
        return pub.return_success(pub.lang('获取成功'), index);
    }

    /**
     * 启用/禁用记忆
     * POST /memory/set_memory_enabled
     */
    async set_memory_enabled(args: { context_id: string; enabled: boolean }): Promise<any> {
        const { context_id, enabled } = args;
        if (!context_id) {
            return pub.return_error(pub.lang('对话ID不能为空'));
        }
        const result = memoryService.setMemoryEnabled(context_id, enabled);
        if (!result) {
            return pub.return_error(pub.lang('操作失败，记忆不存在'));
        }
        return pub.return_success(pub.lang('设置成功'));
    }

    /**
     * 添加记忆条目
     * POST /memory/add_memory
     */
    async add_memory(args: {
        context_id: string;
        category: string;
        title: string;
        content: string;
        tags?: string;
    }): Promise<any> {
        const { context_id, category, title, content, tags } = args;
        if (!context_id) {
            return pub.return_error(pub.lang('对话ID不能为空'));
        }
        if (!title || !content) {
            return pub.return_error(pub.lang('标题和内容不能为空'));
        }
        
        const tagList = tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [];
        const entry = memoryService.addMemory(context_id, category || 'plot', title, content, tagList);
        return pub.return_success(pub.lang('添加成功'), entry);
    }

    /**
     * 获取单条记忆
     * POST /memory/get_memory
     */
    async get_memory(args: { context_id: string; memory_id: string }): Promise<any> {
        const { context_id, memory_id } = args;
        if (!context_id || !memory_id) {
            return pub.return_error(pub.lang('参数不完整'));
        }
        const entry = memoryService.getMemory(context_id, memory_id);
        if (!entry) {
            return pub.return_error(pub.lang('记忆不存在'));
        }
        return pub.return_success(pub.lang('获取成功'), entry);
    }

    /**
     * 更新记忆条目
     * POST /memory/update_memory
     */
    async update_memory(args: {
        context_id: string;
        memory_id: string;
        title?: string;
        content?: string;
        category?: string;
        tags?: string;
    }): Promise<any> {
        const { context_id, memory_id, title, content, category, tags } = args;
        if (!context_id || !memory_id) {
            return pub.return_error(pub.lang('参数不完整'));
        }
        const updates: any = {};
        if (title) updates.title = title;
        if (content) updates.content = content;
        if (category) updates.category = category;
        if (tags) updates.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;

        const result = memoryService.updateMemory(context_id, memory_id, updates);
        if (!result) {
            return pub.return_error(pub.lang('更新失败，记忆不存在'));
        }
        return pub.return_success(pub.lang('更新成功'));
    }

    /**
     * 删除记忆条目
     * POST /memory/delete_memory
     */
    async delete_memory(args: { context_id: string; memory_id: string }): Promise<any> {
        const { context_id, memory_id } = args;
        if (!context_id || !memory_id) {
            return pub.return_error(pub.lang('参数不完整'));
        }
        memoryService.deleteMemory(context_id, memory_id);
        return pub.return_success(pub.lang('删除成功'));
    }

    /**
     * 获取指定分类的所有记忆
     * POST /memory/get_memories_by_category
     */
    async get_memories_by_category(args: { context_id: string; category: string }): Promise<any> {
        const { context_id, category } = args;
        if (!context_id || !category) {
            return pub.return_error(pub.lang('参数不完整'));
        }
        const entries = memoryService.getMemoriesByCategory(context_id, category);
        return pub.return_success(pub.lang('获取成功'), entries);
    }

    /**
     * 获取所有记忆
     * POST /memory/get_all_memories
     */
    async get_all_memories(args: { context_id: string }): Promise<any> {
        const { context_id } = args;
        if (!context_id) {
            return pub.return_error(pub.lang('对话ID不能为空'));
        }
        const entries = memoryService.getAllMemories(context_id);
        return pub.return_success(pub.lang('获取成功'), entries);
    }

    /**
     * 搜索相关记忆
     * POST /memory/search_memories
     */
    async search_memories(args: { context_id: string; query: string; top_k?: number }): Promise<any> {
        const { context_id, query, top_k } = args;
        if (!context_id || !query) {
            return pub.return_error(pub.lang('参数不完整'));
        }
        const entries = memoryService.searchMemories(context_id, query, top_k || 5);
        return pub.return_success(pub.lang('获取成功'), entries);
    }

    /**
     * 手动触发记忆提取
     * POST /memory/extract_memories
     */
    async extract_memories(args: {
        context_id: string;
        supplierName: string;
        model: string;
    }): Promise<any> {
        const { context_id, supplierName, model } = args;
        if (!context_id || !supplierName || !model) {
            return pub.return_error(pub.lang('参数不完整'));
        }

        // 确保记忆已初始化
        memoryService.initMemory(context_id);

        // 读取对话历史
        const chatService = new ChatService();
        const history = chatService.read_history(context_id);
        if (!history || history.length < 2) {
            return pub.return_error(pub.lang('对话历史不足，无法提取'));
        }

        // 调用提取服务
        const extracted = await memoryExtractService.extractFromConversation(
            context_id, history, supplierName, model
        );

        return pub.return_success(
            pub.lang('提取完成，共提取 {} 条记忆', extracted.length.toString()),
            extracted
        );
    }

    /**
     * 删除对话的全部记忆
     * POST /memory/delete_all_memories
     */
    async delete_all_memories(args: { context_id: string }): Promise<any> {
        const { context_id } = args;
        if (!context_id) {
            return pub.return_error(pub.lang('对话ID不能为空'));
        }
        memoryService.deleteAllMemories(context_id);
        return pub.return_success(pub.lang('删除成功'));
    }
}

/**
 * 重写 MemoryController 类的 toString 方法
 */
MemoryController.toString = (): string => '[class MemoryController]';

export default new MemoryController();
