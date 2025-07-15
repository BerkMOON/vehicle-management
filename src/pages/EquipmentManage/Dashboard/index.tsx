import ChartCard from '@/components/ChartComponents/ChartCard';
import { Card } from 'antd';

const Dashboard: React.FC = () => {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-around' }}>
      <Card>
        <ChartCard title="激活数量" type="active" />
        <ChartCard title="绑定数量" type="bind" />
      </Card>
    </div>
  );
};

export default Dashboard;
