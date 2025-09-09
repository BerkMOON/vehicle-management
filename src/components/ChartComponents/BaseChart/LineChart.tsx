import { Line } from '@ant-design/charts';
import { forwardRef } from 'react';

interface ChartProps {
  data: any[];
  xField: string;
  yField: string;
  seriesField?: string;
}

const LineChart = forwardRef<any, ChartProps>((props, ref) => {
  const { data, xField, yField, seriesField } = props;
  const config = {
    data,
    xField,
    yField,
    colorField: seriesField,
    shapeField: 'smooth',
    scale: {
      y: {
        domainMin: 0,
      },
    },
    interaction: {
      tooltip: {
        marker: false,
      },
    },
    style: {
      lineWidth: 2,
    },
  };

  return <Line {...config} ref={ref} />;
});

export default LineChart;
