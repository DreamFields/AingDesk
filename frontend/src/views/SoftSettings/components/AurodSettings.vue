<template>
  <div class="aurod-settings">
    <n-h3 class="section-title">
      Aurod AI 配置
    </n-h3>
    
    <n-divider />
    
    <div class="form-container">
      <n-form label-placement="top" class="aurod-form">
        <n-form-item label="账号">
          <n-input 
            v-model:value="account" 
            placeholder="请输入 Aurod 账号（手机号/邮箱）"
            size="large"
            clearable
          />
        </n-form-item>
        
        <n-form-item label="密码">
          <n-input 
            v-model:value="password" 
            type="password" 
            placeholder="请输入 Aurod 密码"
            size="large"
            show-password-on="mousedown"
            clearable
            @keyup.enter="handleLogin"
          />
        </n-form-item>
        
        <n-form-item>
          <n-space>
            <n-button 
              type="primary" 
              @click="handleLogin" 
              :loading="loading"
              size="large"
            >
              登录并保存
            </n-button>
            <n-button 
              @click="testConnection" 
              :loading="testing"
              size="large"
            >
              测试连接
            </n-button>
            <n-button 
              @click="fetchModels" 
              :loading="fetchingModels"
              size="large"
              v-if="isLoggedIn"
            >
              获取模型列表
            </n-button>
          </n-space>
        </n-form-item>
      </n-form>
      
      <n-alert
        v-if="statusMsg"
        :title="statusMsg"
        :type="statusType"
        closable
        @close="statusMsg = ''"
        class="status-alert"
      />
      
      <!-- 已保存的模型列表 -->
      <div v-if="models.length > 0" class="models-section">
        <n-h4>可用模型列表</n-h4>
        <n-data-table 
          :columns="modelColumns" 
          :data="models" 
          size="small"
          :pagination="false"
        />
      </div>
      
      <!-- 配置说明 -->
      <n-card class="info-card" :bordered="false">
        <template #header>
          <div class="card-header">
            <span>配置说明</span>
          </div>
        </template>
        <div class="info-content">
          <p><strong>1. 账号注册：</strong>请访问 <n-a href="https://ai.aurod.cn" target="_blank">ai.aurod.cn</n-a> 注册账号</p>
          <p><strong>2. 登录方式：</strong>输入您的手机号/邮箱和密码进行登录</p>
          <p><strong>3. Token 保存：</strong>登录成功后，系统会自动保存您的认证 Token</p>
          <p><strong>4. 模型获取：</strong>点击"获取模型列表"按钮可同步可用的 AI 模型</p>
          <p><strong>5. 使用方式：</strong>配置完成后，在对话界面选择 "Aurod AI" 供应商即可使用</p>
        </div>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue';
import { post } from '@/api';
import { message } from '@/utils/naive-tools';
import type { DataTableColumns } from 'naive-ui';

// message 已从 naive-tools 导入

const account = ref('');
const password = ref('');
const loading = ref(false);
const testing = ref(false);
const fetchingModels = ref(false);
const statusMsg = ref('');
const statusType = ref<'success' | 'warning' | 'error'>('success');
const isLoggedIn = ref(false);
const models = ref<any[]>([]);

const modelColumns: DataTableColumns<any> = [
  {
    title: '模型名称',
    key: 'title',
    minWidth: 200
  },
  {
    title: '模型ID',
    key: 'modelName',
    minWidth: 200
  },
  {
    title: '能力',
    key: 'capability',
    width: 150,
    render(row) {
      return row.capability?.map((cap: string) => 
        h('n-tag', { size: 'small', style: 'margin-right: 4px' }, { default: () => cap })
      );
    }
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render(row) {
      return h('n-tag', { 
        type: row.status ? 'success' : 'error', 
        size: 'small' 
      }, { default: () => row.status ? '可用' : '禁用' });
    }
  }
];

onMounted(async () => {
  await checkLoginStatus();
});

const checkLoginStatus = async () => {
  try {
    const result = await post('/aurod/test_connection');
    if (result.success) {
      isLoggedIn.value = true;
      statusMsg.value = result.message;
      statusType.value = 'success';
      await loadSavedModels();
    }
  } catch (error) {
    isLoggedIn.value = false;
  }
};

const loadSavedModels = async () => {
  try {
    const result = await post('/aurod/get_models');
    if (result.success) {
      models.value = result.models || [];
    }
  } catch (error) {
    console.error('加载模型列表失败:', error);
  }
};

const handleLogin = async () => {
  if (!account.value || !password.value) {
    statusMsg.value = '请输入账号和密码';
    statusType.value = 'warning';
    return;
  }
  
  loading.value = true;
  statusMsg.value = '';
  
  try {
    const result = await post('/aurod/login', {
      account: account.value,
      password: password.value
    });
    
    if (result.success) {
      statusMsg.value = '登录成功！Token 已保存，您现在可以使用 Aurod AI 服务';
      statusType.value = 'success';
      isLoggedIn.value = true;
      message.success('登录成功');
      password.value = '';
    } else {
      statusMsg.value = result.error || '登录失败，请检查账号密码';
      statusType.value = 'error';
      message.error(result.error || '登录失败');
    }
  } catch (error: any) {
    statusMsg.value = error.message || '请求失败，请检查网络连接';
    statusType.value = 'error';
    message.error('登录请求失败');
  } finally {
    loading.value = false;
  }
};

const testConnection = async () => {
  testing.value = true;
  statusMsg.value = '';
  
  try {
    const result = await post('/aurod/test_connection');
    
    if (result.success) {
      statusMsg.value = result.message;
      statusType.value = 'success';
      isLoggedIn.value = true;
      message.success('连接正常');
    } else {
      statusMsg.value = result.error || '连接失败';
      statusType.value = 'error';
      isLoggedIn.value = false;
      message.warning(result.error || '连接失败');
    }
  } catch (error: any) {
    statusMsg.value = error.message || '测试连接失败';
    statusType.value = 'error';
    isLoggedIn.value = false;
    message.error('测试连接请求失败');
  } finally {
    testing.value = false;
  }
};

const fetchModels = async () => {
  fetchingModels.value = true;
  statusMsg.value = '';
  
  try {
    const result = await post('/aurod/get_models');
    
    if (result.success) {
      models.value = result.models || [];
      statusMsg.value = `成功获取 ${result.models.length} 个模型`;
      statusType.value = 'success';
      message.success('模型列表已更新');
    } else {
      statusMsg.value = result.error || '获取模型列表失败';
      statusType.value = 'error';
      message.error(result.error || '获取失败');
    }
  } catch (error: any) {
    statusMsg.value = error.message || '获取模型列表请求失败';
    statusType.value = 'error';
    message.error('请求失败');
  } finally {
    fetchingModels.value = false;
  }
};
</script>

<style scoped lang="scss">
.aurod-settings {
  padding: 20px;
  max-width: 800px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
}

.form-container {
  margin-top: 20px;
}

.aurod-form {
  max-width: 500px;
}

.status-alert {
  margin-top: 16px;
  max-width: 500px;
}

.models-section {
  margin-top: 24px;
  
  h4 {
    margin-bottom: 12px;
    font-size: 16px;
    font-weight: 500;
  }
}

.info-card {
  margin-top: 24px;
  
  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
  }
  
  .info-content {
    p {
      margin: 8px 0;
      line-height: 1.6;
    }
  }
}
</style>
