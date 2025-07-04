import { defineConfig } from '@umijs/max';

export default defineConfig({
  esbuildMinifyIIFE: true,
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
  layout: {
    title: '车辆管理系统',
  },
  routes: [
    {
      path: '/',
      redirect: '/home',
      component: './Home',
    },
    {
      name: '首页',
      path: '/home',
      component: './Home',
      hideInMenu: true,
    },
    {
      name: '登录',
      path: '/login',
      component: './Login',
      layout: false,
    },
    {
      name: '用户列表',
      path: '/user',
      component: './User',
      access: 'userList',
      lazy: true,
    },
    {
      name: '角色管理',
      path: '/role',
      component: './Role',
      access: 'roleList',
      lazy: true,
    },
    {
      name: '标签管理',
      path: '/tag',
      component: './Tag/Group',
      access: 'tagGroup',
      lazy: true,
    },
    {
      name: '标签内容管理',
      path: '/tag/:groupId',
      component: './Tag/List',
      access: 'tagList',
      hideInMenu: true,
      lazy: true,
    },
    {
      name: '审核管理',
      access: 'reviewManage',
      path: '/review',
      hideInBreadcrumb: true,
      lazy: true,
      routes: [
        {
          path: '/review/audit',
          name: '审核页面',
          component: './ReviewManage/Audit',
          access: 'auditVideo',
        },
        {
          path: '/review/undetermineTask',
          name: '待确认任务列表',
          component: './ReviewManage/UnDetermineTask',
          access: 'auditVideo',
        },
        {
          path: '/review/undetermineTask/:clueId',
          name: '待确认任务详情',
          component: './ReviewManage/UnDetermineTask/Detail',
          access: 'auditVideo',
          hideInMenu: true,
        },
        {
          path: '/review/auditList',
          name: '工单列表',
          component: './ReviewManage/AuditList',
          access: 'auditList',
        },
        {
          path: '/review/task',
          name: '任务列表',
          component: './ReviewManage/Task',
          access: 'taskList',
        },
        {
          path: '/review/task/:clueId',
          name: '任务详情',
          component: './ReviewManage/Task/Detail',
          access: 'taskDetail',
          hideInMenu: true,
        },
        {
          path: '/review/clue',
          name: '线索列表',
          component: './ReviewManage/ClueList',
          access: 'clueList',
        },
        {
          path: '/review/clue/:clueId',
          name: '线索详情',
          component: './ReviewManage/Task/Detail',
          hideInMenu: true,
        },
        {
          path: '/review/abnormalClue',
          name: '异常线索列表',
          component: './ReviewManage/AbnormalClueList',
          access: 'clueList',
        },
        {
          path: '/review/abnormalClue/:clueId',
          name: '异常线索详情',
          component: './ReviewManage/Task/Detail',
          access: 'clueList',
          hideInMenu: true,
        },
        {
          path: '/review/black',
          name: '黑名单列表',
          component: './ReviewManage/BlackList',
          access: 'clueList',
        },
      ],
    },
    {
      name: '公司与门店管理',
      access: 'companyAndStoreManage',
      path: '/cas',
      hideInBreadcrumb: true,
      lazy: true,
      routes: [
        {
          path: '/cas/company',
          name: '公司列表',
          component: './CompanyAndStoreManage/Company',
          access: 'companyList',
        },
        {
          path: '/cas/store',
          name: '门店列表',
          component: './CompanyAndStoreManage/Store',
          access: 'storeList',
        },
        {
          path: '/cas/user',
          name: '门店人员管理',
          component: './CompanyAndStoreManage/BusinessUser',
          access: 'businessUser',
        },
        {
          path: '/cas/gencode',
          name: '生成门店码',
          component: './CompanyAndStoreManage/Store/GenCode',
          access: 'storeGenCode',
        },
      ],
    },
    {
      name: '设备管理',
      access: 'equipmentManage',
      path: '/equipment',
      hideInBreadcrumb: true,
      lazy: true,
      routes: [
        // {
        //   path: '/equipment/dashboard',
        //   name: '设备看板',
        //   component: './EquipmentManage/Dashboard',
        //   access: 'equipmentRelationList',
        // },
        {
          path: '/equipment/record',
          name: '设备记录',
          component: './EquipmentManage/RecordList',
          access: 'equipmentRecordList',
        },
        {
          path: '/equipment/relation',
          name: '设备关联',
          component: './EquipmentManage/RelationList',
          access: 'equipmentRelationList',
        },
        {
          path: '/equipment/info',
          name: '设备信息',
          component: './EquipmentManage/DeviceList',
          access: 'deviceInfoList',
        },
        {
          path: '/equipment/loss',
          name: '流失提醒',
          component: './EquipmentManage/LossReminder',
          access: 'lossReminder',
        },
      ],
    },
    {
      name: '设备OTA',
      path: '/ota',
      component: './Ota',
      access: 'otaVersion',
      lazy: true,
    },
    {
      name: '仓储管理',
      path: '/warehouse',
      hideInBreadcrumb: true,
      access: 'warehouseModule',
      lazy: true,
      routes: [
        {
          name: '入库记录',
          path: '/warehouse/inbound/list',
          component: './WarehouseManage/Inbound',
          access: 'inboundList',
        },
        {
          name: '入库商品录入',
          path: '/warehouse/inbound/input/:id',
          component: './WarehouseManage/Inbound/Input',
          hideInMenu: true,
          access: 'inboundList',
        },
        {
          name: '入库详情',
          path: '/warehouse/inbound/detail/:id',
          component: './WarehouseManage/Inbound/Detail',
          hideInMenu: true,
          access: 'inboundList',
        },
        {
          name: '仓储记录',
          path: '/warehouse/storage/list',
          component: './WarehouseManage/Storage',
          access: 'warehouseModule',
        },
        {
          name: '仓储详情',
          path: '/warehouse/storage/detail/:id',
          component: './WarehouseManage/Storage/Detail',
          hideInMenu: true,
          access: 'warehouseModule',
        },
        {
          name: '出库记录',
          path: '/warehouse/outbound/list',
          component: './WarehouseManage/Outbound',
          access: 'outboundList',
        },
        {
          name: '出库商品录入',
          path: '/warehouse/outbound/input/:id',
          component: './WarehouseManage/Outbound/Input',
          hideInMenu: true,
          access: 'outboundList',
        },
        {
          name: '出库详情',
          path: '/warehouse/outbound/detail/:id',
          component: './WarehouseManage/Outbound/Detail',
          hideInMenu: true,
          access: 'outboundList',
        },
      ],
    },
  ],
  npmClient: 'pnpm',
  proxy: {
    '/api': {
      // 标识需要进行转换的请求的url
      target: 'http://47.121.134.143:8888', // 服务端域名
      // target: 'https://eda.ai-kaka.com:443',
      changeOrigin: true, // 允许域名进行转换
    },
  },
});
