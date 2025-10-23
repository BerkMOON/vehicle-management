import { CameraOutlined, CloseOutlined } from '@ant-design/icons';
import { Button, Modal, message } from 'antd';
import { Html5Qrcode } from 'html5-qrcode';
import React, { useEffect, useRef, useState } from 'react';
import './index.scss';

interface QrCodeScannerProps {
  onScan: (result: string) => void;
  buttonText?: string;
  buttonType?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
}

const QrCodeScanner: React.FC<QrCodeScannerProps> = ({
  onScan,
  buttonText = '扫描二维码',
  buttonType = 'default',
}) => {
  const [visible, setVisible] = useState(false);
  const [, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerId = 'qr-code-scanner';
  const hasScannedRef = useRef(false); // 防止重复扫描

  // 清理扫描器
  const cleanupScanner = async () => {
    if (scannerRef.current) {
      try {
        const state = await scannerRef.current.getState();
        if (state === 2) {
          // 2 表示正在扫描
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (error) {
        console.error('清理扫描器失败:', error);
      }
      scannerRef.current = null;
      setScanning(false);
    }
  };

  // 开始扫描
  const startScanner = async () => {
    try {
      // 重置扫描标记
      hasScannedRef.current = false;

      // 创建扫描器实例
      const html5QrCode = new Html5Qrcode(scannerId);
      scannerRef.current = html5QrCode;

      // 配置扫描参数
      const config = {
        fps: 10, // 每秒扫描帧数
        qrbox: { width: 250, height: 250 }, // 扫描框大小
        aspectRatio: 1.0,
      };

      // 启动摄像头扫描
      await html5QrCode.start(
        { facingMode: 'environment' }, // 使用后置摄像头
        config,
        async (decodedText) => {
          // 扫描成功回调 - 防止重复触发
          if (hasScannedRef.current) {
            return;
          }
          hasScannedRef.current = true;

          console.log('扫描到的内容:', decodedText);

          // 立即停止扫描
          try {
            await html5QrCode.stop();
            html5QrCode.clear();
            scannerRef.current = null;
            setScanning(false);
          } catch (error) {
            console.error('停止扫描失败:', error);
          }

          // 显示成功消息并回调
          message.success('扫描成功！');
          onScan(decodedText);

          // 延迟关闭弹窗，让用户看到成功提示
          setTimeout(() => {
            setVisible(false);
          }, 500);
        },
        (errorMessage) => {
          // 扫描失败回调（可以忽略，因为会持续扫描）
          console.error('扫描中...', errorMessage);
        },
      );

      setScanning(true);
    } catch (error: any) {
      console.error('启动扫描器失败:', error);
      if (error?.message?.includes('NotAllowedError')) {
        message.error('摄像头权限被拒绝，请在浏览器设置中允许摄像头访问');
      } else if (error?.message?.includes('NotFoundError')) {
        message.error('未找到摄像头设备');
      } else {
        message.error('启动摄像头失败，请检查设备和权限设置');
      }
    }
  };

  // 打开扫描器
  const handleOpen = () => {
    hasScannedRef.current = false; // 重置扫描标记
    setVisible(true);
  };

  // 关闭扫描器
  const handleClose = async () => {
    hasScannedRef.current = false; // 重置扫描标记
    await cleanupScanner();
    setVisible(false);
  };

  // 当 Modal 显示时启动扫描
  useEffect(() => {
    if (visible) {
      // 延迟启动以确保 DOM 已渲染
      const timer = setTimeout(() => {
        startScanner();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      cleanupScanner();
    };
  }, []);

  return (
    <>
      <Button type={buttonType} icon={<CameraOutlined />} onClick={handleOpen}>
        {buttonText}
      </Button>

      <Modal
        title="扫描二维码"
        open={visible}
        onCancel={handleClose}
        footer={[
          <Button key="close" onClick={handleClose} icon={<CloseOutlined />}>
            关闭
          </Button>,
        ]}
        width={600}
        centered
        destroyOnClose
      >
        <div className="qr-scanner-container">
          <div id={scannerId} className="qr-scanner-video" />
          <div className="qr-scanner-tips">
            <p>请将二维码对准扫描框</p>
            <p>扫描成功后会自动填入SN码</p>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default QrCodeScanner;
