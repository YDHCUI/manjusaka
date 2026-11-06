import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const MainLayout = () => import('@/layouts/MainLayout.vue')

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { public: true, title: '登录' },
  },
  {
    path: '/',
    component: MainLayout,
    redirect: '/aichat',
    children: [
      {
        path: 'agents',
        name: 'Agents',
        component: () => import('@/views/agent/AgentList.vue'),
        meta: { title: '在线主机', icon: 'Monitor' },
      },
      {
        path: 'agents/:id',
        name: 'AgentDetail',
        component: () => import('@/views/agent/AgentDetail.vue'),

        meta: { title: '主机详情', hidden: true },
      },
      {
        path: 'aichat',
        name: 'AiChat',
        component: () => import('@/views/aichat/AiChatManager.vue'),
        meta: { title: 'AI渗透', icon: 'ChatRound' },
      },
      {
        path: 'mcpkeys',
        name: 'McpKeys',
        component: () => import('@/views/mcp/McpKeyList.vue'),
        meta: { title: 'MCP密钥', icon: 'Link' },
      },
      {
        path: 'proxy',
        name: 'Proxy',
        component: () => import('@/views/proxy/ProxyList.vue'),
        meta: { title: '隧道代理', icon: 'Connection' },
      },
      {
        path: 'files',
        name: 'Files',
        component: () => import('@/views/file/FileList.vue'),
        meta: { title: '敏感文件', icon: 'Document' },
      },
      {
        path: 'passwords',
        name: 'Passwords',
        component: () => import('@/views/password/PasswordList.vue'),
        meta: { title: '密码收集', icon: 'Key' },
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/setting/SettingList.vue'),
        meta: { title: '全局设置', icon: 'Setting' },
      },
      {
        path: 'tasks',
        name: 'Tasks',
        component: () => import('@/views/task/TaskManage.vue'),
        meta: { title: '任务管理', icon: 'List' },
      },
      {
        path: 'listeners',
        name: 'Listeners',
        component: () => import('@/views/listen/ListenList.vue'),
        meta: { title: '监听器', icon: 'Headset' },
      },
      {
        path: 'projects',
        name: 'Projects',
        component: () => import('@/views/project/ProjectList.vue'),
        meta: { title: '目标设定', icon: 'Aim' },
      },
      {
        path: 'bots',
        name: 'Bots',
        component: () => import('@/views/bot/BotList.vue'),
        meta: { title: '机器人', icon: 'Service' },
      },
      {
        path: 'skills',
        name: 'Skills',
        component: () => import('@/views/skill/SkillList.vue'),
        meta: { title: 'AI技能', icon: 'MagicStick' },
      },
      {
        path: 'plugins',
        name: 'Plugins',
        component: () => import('@/views/plugin/PluginList.vue'),
        meta: { title: '插件库', icon: 'Box' },
      },
      {
        path: 'logs',
        name: 'Logs',
        component: () => import('@/views/log/LogView.vue'),
        meta: { title: '系统日志', icon: 'Tickets' },
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/profile/Profile.vue'),
        meta: { title: '个人信息', hidden: true },
      },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()
  if (to.meta.public) {
    return next()
  }
  if (!auth.isLogin) {
    return next({ path: '/login', query: { redirect: to.fullPath } })
  }
  next()
})

router.afterEach((to) => {
  const title = (to.meta && to.meta.title) || ''
  document.title = title ? `${title} - 牛屎花` : '牛屎花'
})

export default router
