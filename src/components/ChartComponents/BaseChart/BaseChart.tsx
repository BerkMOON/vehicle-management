import { Pie } from '@ant-design/charts';
import { forwardRef } from 'react';

interface ChartProps {
  data: any[];
}

const BaseChart = forwardRef<any, ChartProps>((props, ref) => {
  const { data } = props;
  const config = {
    data,
    angleField: 'value',
    colorField: 'type',
    radius: 0.7,
    label: {
      text: (d: { type: string; value: number }) => `${d.type}\n ${d.value}`,
      style: {
        fontWeight: 'bold',
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

export default BaseChart;
