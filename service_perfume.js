const Service = require('D:/nodejs/node_global/node_modules/node-windows').Service;

// 创建一个新的服务对象
const svc = new Service({
    name: 'myyanwPerfumeApp3228',
    description: 'My Perfume Node.js Application',
    script: 'C:\\HOMEPAGE\\proj\\Perfume\\bin\\www',
    workingdirectory: 'C:\\HOMEPAGE\\proj\\Perfume',
    env: {
        // 根据项目实际需求设置环境变量，例如：
        PORT: '3228', 
        DATABASE_URL: 'mongodb://localhost:27017/perfume_system' 
    }
});

// 监听安装事件
svc.on('install', function () {
    svc.start();
});

// 安装服务
svc.install();