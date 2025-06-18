import { DeviceAPI } from '@/services/device/DeviceController';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Spin } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import BaseChart from '../BaseChart/BaseChart';
import styles from './index.scss';

interface ChartCardProps {
  title: string;
  type: 'active' | 'bind';
}

const pageParams = {
  page: 1,
  limit: 1,
};

const ChartCard: React.FC<ChartCardProps> = ({ title, type }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const chartRef = useRef<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (type === 'active') {
        const [notActivedRes, allRes] = await Promise.all([
          DeviceAPI.getDeviceList({
            report_status: 'unreported',
            ...pageParams,
          }),
          DeviceAPI.getDeviceList({ ...pageParams }),
        ]);
        setData([
          {
            type: '已激活',
            value:
              allRes.data.meta.total_count -
              notActivedRes.data.meta.total_count,
          },
          { type: '未激活', value: notActivedRes.data.meta.total_count },
        ]);
      } else {
        const [boundRes, initRes] = await Promise.all([
          DeviceAPI.getDeviceList({ status: 'bound', ...pageParams }),
          DeviceAPI.getDeviceList({ status: 'init', ...pageParams }),
        ]);
        setData([
          { type: '已绑定', value: boundRes.data.meta.total_count },
          { type: '未绑定', value: initRes.data.meta.total_count },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDownload = async () => {
    if (chartRef.current) {
      const base64 = await chartRef.current?.toDataURL();
      const link = document.createElement('a');
      link.download = `${title}.png`;
      link.href = base64;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className={styles['chart-card-wrapper']}>
      <div className={styles['chart-header']}>
        <h2>{title}</h2>
        <div>
          <Button
            type="text"
            icon={<ReloadOutlined />}
            onClick={fetchData}
            loading={loading}
          />
          <Button
            type="text"
            icon={<DownloadOutlined />}
            onClick={handleDownload}
            title="下载图表"
          />
        </div>
      </div>
      <Spin spinning={loading}>
        <BaseChart data={data} ref={chartRef} />
      </Spin>
    </div>
  );
};

export default ChartCard;
