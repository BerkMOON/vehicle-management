import ChartCard from '@/components/ChartComponents/ChartCard';

const Dashboard: React.FC = () => {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-around' }}>
      <ChartCard title="激活数量" type="active" />
      <ChartCard title="绑定数量" type="bind" />
    </div>
  );
};

export default Dashboard;
