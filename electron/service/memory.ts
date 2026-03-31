import { pub } from '../class/public';
import { logger } from 'ee-core/log';
import * as path from 'path';

/**
 * 记忆条目类型
 */
export type MemoryEntry = {
    id: string;           // 记忆唯一ID
    category: string;     // 分类: character/plot/world/style
    title: string;        // 标题
    content: string;      // 内容
    tags: string[];       // 标签（用于检索）
    create_time: number;  // 创建时间
    update_time: number;  // 更新时间
};

/**
 * 记忆索引类型
 */
export type MemoryIndex = {
    context_id: string;        // 关联的对话ID
    novel_name: string;        // 小说名称
    memory_enabled: boolean;   // 是否启用记忆
    create_time: number;
    update_time: number;
    entries: MemoryEntry[];    // 所有记忆条目
};

/**
 * 记忆服务类 - 提供对话级别的持久化记忆管理
 * 
 * 存储结构:
 *   {data_path}/memory/{context_id}/
 *     ├── index.json       ← 记忆索引文件
 *     └── entries/
 *         ├── {id}.json    ← 单条记忆文件
 *         └── ...
 */
export class MemoryService {
    private basePath: string;

    constructor() {
        this.basePath = path.resolve(pub.get_data_path(), 'memory');
        pub.mkdir(this.basePath);
    }

    /**
     * 获取指定对话的记忆目录
     */
    private getMemoryDir(contextId: string): string {
        const dir = path.resolve(this.basePath, contextId);
        pub.mkdir(dir);
        pub.mkdir(path.resolve(dir, 'entries'));
        return dir;
    }

    /**
     * 获取记忆索引文件路径
     */
    private getIndexPath(contextId: string): string {
        return path.resolve(this.getMemoryDir(contextId), 'index.json');
    }

    // =====================
    //  索引操作
    // =====================

    /**
     * 初始化记忆（创建或读取索引）
     */
    initMemory(contextId: string, novelName: string = ''): MemoryIndex {
        const indexPath = this.getIndexPath(contextId);
        if (pub.file_exists(indexPath)) {
            return pub.read_json(indexPath) as MemoryIndex;
        }
        const index: MemoryIndex = {
            context_id: contextId,
            novel_name: novelName,
            memory_enabled: true,
            create_time: pub.time(),
            update_time: pub.time(),
            entries: [],
        };
        pub.write_json(indexPath, index);
        return index;
    }

    /**
     * 读取记忆索引
     */
    getMemoryIndex(contextId: string): MemoryIndex | null {
        const indexPath = this.getIndexPath(contextId);
        if (!pub.file_exists(indexPath)) {
            return null;
        }
        try {
            return pub.read_json(indexPath) as MemoryIndex;
        } catch (e) {
            logger.error('读取记忆索引失败', e);
            return null;
        }
    }

    /**
     * 保存记忆索引
     */
    private saveIndex(contextId: string, index: MemoryIndex): void {
        index.update_time = pub.time();
        pub.write_json(this.getIndexPath(contextId), index);
    }

    /**
     * 启用/禁用记忆
     */
    setMemoryEnabled(contextId: string, enabled: boolean): boolean {
        const index = this.getMemoryIndex(contextId);
        if (!index) return false;
        index.memory_enabled = enabled;
        this.saveIndex(contextId, index);
        return true;
    }

    // =====================
    //  记忆条目 CRUD
    // =====================

    /**
     * 添加记忆条目
     */
    addMemory(contextId: string, category: string, title: string, content: string, tags: string[] = []): MemoryEntry {
        const index = this.getMemoryIndex(contextId) || this.initMemory(contextId);
        const entry: MemoryEntry = {
            id: pub.uuid(),
            category,
            title,
            content,
            tags,
            create_time: pub.time(),
            update_time: pub.time(),
        };

        // 保存单条记忆文件
        const entryPath = path.resolve(this.getMemoryDir(contextId), 'entries', `${entry.id}.json`);
        pub.write_json(entryPath, entry);

        // 更新索引（只存摘要，不存完整内容）
        index.entries.push({
            ...entry,
            content: content.length > 200 ? content.substring(0, 200) + '...' : content,
        });
        this.saveIndex(contextId, index);

        return entry;
    }

    /**
     * 获取单条记忆的完整内容
     */
    getMemory(contextId: string, memoryId: string): MemoryEntry | null {
        const entryPath = path.resolve(this.getMemoryDir(contextId), 'entries', `${memoryId}.json`);
        if (!pub.file_exists(entryPath)) return null;
        try {
            return pub.read_json(entryPath) as MemoryEntry;
        } catch (e) {
            logger.error('读取记忆条目失败', e);
            return null;
        }
    }

    /**
     * 更新记忆条目
     */
    updateMemory(contextId: string, memoryId: string, updates: Partial<MemoryEntry>): boolean {
        const entry = this.getMemory(contextId, memoryId);
        if (!entry) return false;

        // 更新字段
        if (updates.title) entry.title = updates.title;
        if (updates.content) entry.content = updates.content;
        if (updates.category) entry.category = updates.category;
        if (updates.tags) entry.tags = updates.tags;
        entry.update_time = pub.time();

        // 保存文件
        const entryPath = path.resolve(this.getMemoryDir(contextId), 'entries', `${memoryId}.json`);
        pub.write_json(entryPath, entry);

        // 更新索引中的摘要
        const index = this.getMemoryIndex(contextId);
        if (index) {
            const idx = index.entries.findIndex(e => e.id === memoryId);
            if (idx > -1) {
                index.entries[idx] = {
                    ...entry,
                    content: entry.content.length > 200 ? entry.content.substring(0, 200) + '...' : entry.content,
                };
            }
            this.saveIndex(contextId, index);
        }
        return true;
    }

    /**
     * 删除记忆条目
     */
    deleteMemory(contextId: string, memoryId: string): boolean {
        const entryPath = path.resolve(this.getMemoryDir(contextId), 'entries', `${memoryId}.json`);
        if (pub.file_exists(entryPath)) {
            pub.delete_file(entryPath);
        }

        const index = this.getMemoryIndex(contextId);
        if (index) {
            index.entries = index.entries.filter(e => e.id !== memoryId);
            this.saveIndex(contextId, index);
        }
        return true;
    }

    /**
     * 获取指定分类的所有记忆
     */
    getMemoriesByCategory(contextId: string, category: string): MemoryEntry[] {
        const index = this.getMemoryIndex(contextId);
        if (!index) return [];
        
        return index.entries
            .filter(e => e.category === category)
            .map(e => this.getMemory(contextId, e.id) || e);
    }

    /**
     * 获取所有记忆（完整内容）
     */
    getAllMemories(contextId: string): MemoryEntry[] {
        const index = this.getMemoryIndex(contextId);
        if (!index) return [];
        
        return index.entries.map(e => this.getMemory(contextId, e.id) || e);
    }

    // =====================
    //  记忆检索 & 注入
    // =====================

    /**
     * 根据关键词搜索相关记忆（简单的文本匹配）
     * 后续可以升级为向量检索
     */
    searchMemories(contextId: string, query: string, topK: number = 5): MemoryEntry[] {
        const allMemories = this.getAllMemories(contextId);
        if (allMemories.length === 0) return [];

        // 使用 jieba 分词提取查询关键词
        const keywords = pub.cutForSearch(query);

        // 为每条记忆计算相关性得分
        const scored = allMemories.map(entry => {
            let score = 0;
            const entryText = `${entry.title} ${entry.content} ${entry.tags.join(' ')}`.toLowerCase();
            for (const keyword of keywords) {
                if (entryText.includes(keyword.toLowerCase())) {
                    score += 1;
                }
            }
            // 标签精确匹配加分
            for (const tag of entry.tags) {
                if (query.includes(tag)) {
                    score += 3;
                }
            }
            return { entry, score };
        });

        // 按得分排序，返回 topK
        return scored
            .filter(s => s.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, topK)
            .map(s => s.entry);
    }

    /**
     * 构建注入 system prompt 的记忆上下文
     */
    buildMemoryPrompt(contextId: string, userQuery: string): string {
        const index = this.getMemoryIndex(contextId);
        if (!index || !index.memory_enabled || index.entries.length === 0) {
            return '';
        }

        // 搜索与当前查询相关的记忆
        const relevantMemories = this.searchMemories(contextId, userQuery, 8);

        if (relevantMemories.length === 0) {
            // 如果没有相关记忆，返回最近的几条
            const recentMemories = this.getAllMemories(contextId)
                .sort((a, b) => b.update_time - a.update_time)
                .slice(0, 3);
            if (recentMemories.length === 0) return '';
            
            return this.formatMemoryPrompt(index.novel_name, recentMemories);
        }

        return this.formatMemoryPrompt(index.novel_name, relevantMemories);
    }

    /**
     * 格式化记忆为 prompt 文本
     */
    private formatMemoryPrompt(novelName: string, memories: MemoryEntry[]): string {
        const categoryLabels: Record<string, string> = {
            'character': '角色信息',
            'plot': '情节记录',
            'world': '世界观设定',
            'style': '写作风格',
        };

        // 按分类分组
        const grouped: Record<string, MemoryEntry[]> = {};
        for (const memory of memories) {
            const cat = memory.category || 'other';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(memory);
        }

        let prompt = `## 小说创作记忆${novelName ? ` — 《${novelName}》` : ''}\n`;
        prompt += `以下是从记忆中检索到的与当前创作相关的信息，请在创作中保持一致性：\n\n`;

        for (const [category, entries] of Object.entries(grouped)) {
            const label = categoryLabels[category] || category;
            prompt += `### ${label}\n`;
            for (const entry of entries) {
                prompt += `**${entry.title}**\n${entry.content}\n\n`;
            }
        }

        return prompt;
    }

    // =====================
    //  对话记忆清理
    // =====================

    /**
     * 删除对话的全部记忆
     */
    deleteAllMemories(contextId: string): boolean {
        const memoryDir = path.resolve(this.basePath, contextId);
        if (pub.file_exists(memoryDir)) {
            pub.rmdir(memoryDir);
            return true;
        }
        return false;
    }

    /**
     * 获取所有有记忆的对话ID列表
     */
    getMemoryContextList(): string[] {
        const dirs = pub.readdir(this.basePath);
        return dirs
            .map(d => path.basename(d))
            .filter(name => {
                const indexPath = path.resolve(this.basePath, name, 'index.json');
                return pub.file_exists(indexPath);
            });
    }
}

/**
 * 重写 toString 方法
 */
MemoryService.toString = () => '[class MemoryService]';

/**
 * 导出单例实例
 */
export const memoryService = new MemoryService();
