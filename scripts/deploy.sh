#!/bin/bash

# 环境配置
PROD_SERVER_HOST="8.136.123.166"
PROD_SSH_KEY="/Users/berk/Downloads/pem/server.pem"
TEST_SERVER_HOST="121.41.14.63"
TEST_SSH_KEY="/Users/berk/Downloads/pem/incident_dev.pem"

# 设置密钥文件权限
echo "设置密钥权限..."
chmod 600 ${PROD_SSH_KEY}
chmod 600 ${TEST_SSH_KEY}

# 获取部署环境参数
ENV=$1
if [ "$ENV" != "prod" ] && [ "$ENV" != "test" ]; then
  echo "请指定部署环境: prod 或 test"
  exit 1
fi

# 根据环境设置配置
if [ "$ENV" = "prod" ]; then
  SERVER_HOST=$PROD_SERVER_HOST
  SSH_KEY=$PROD_SSH_KEY
else
  SERVER_HOST=$TEST_SERVER_HOST
  SSH_KEY=$TEST_SSH_KEY
fi

SERVER_USER="root"
SERVER_PATH="/usr/web/vehicle-management"
TEMP_PATH="/usr/web/temp_vehicle"

# 打包项目
echo "开始打包..."
npm run build

# 创建远程目录和临时目录
echo "创建目录..."
ssh -o StrictHostKeyChecking=no -i ${SSH_KEY} ${SERVER_USER}@${SERVER_HOST} "mkdir -p ${SERVER_PATH} ${TEMP_PATH}"

# 上传文件到临时目录
echo "开始上传文件..."
scp -o StrictHostKeyChecking=no -i ${SSH_KEY} -r dist/* ${SERVER_USER}@${SERVER_HOST}:${TEMP_PATH}/

# 设置临时目录权限
echo "设置权限..."
ssh -o StrictHostKeyChecking=no -i ${SSH_KEY} ${SERVER_USER}@${SERVER_HOST} "chmod -R 755 ${TEMP_PATH}"

# 使用原子操作切换目录
echo "切换新旧版本..."
ssh -o StrictHostKeyChecking=no -i ${SSH_KEY} ${SERVER_USER}@${SERVER_HOST} "rm -rf ${SERVER_PATH}_old && mv ${SERVER_PATH} ${SERVER_PATH}_old 2>/dev/null || true && mv ${TEMP_PATH} ${SERVER_PATH} && rm -rf ${SERVER_PATH}_old"

echo "部署完成！"