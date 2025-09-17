import { Pie } from '@ant-design/plots';
import { forwardRef } from 'react';

interface ChartProps {
  data: any[];
}

const PieChart = forwardRef<any, ChartProps>((props, ref) => {
  const { data } = props;
  const config = {
    data,
    angleField: 'value',
    colorField: 'type',
    radius: 0.7,
    label: {
      text: (d: any) => {
        // 计算总数
        const total = data.reduce((sum, item) => sum + item.value, 0);
        const percentage = ((d.value / total) * 100).toFixed(1);
        return `${d.type}\n${d.value} (${percentage}%)`;
      },
      style: {
        fontWeight: 'bold',
        fontSize: 12,
      },
      position: 'spider',
      transform: [
        {
          type: 'overlapDodgeY',
        },
      ],
    },
    legend: {
      color: {
        title: false,
        position: 'right',
        rowPadding: 5,
      },
    },
  };

  return <Pie {...config} ref={ref} />;
});

export default PieChart;
