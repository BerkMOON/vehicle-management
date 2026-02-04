import { Column } from '@ant-design/plots';
import { forwardRef } from 'react';

interface ChartProps {
  data: any[];
  xField: string;
  yField: string;
  seriesField: string;
  title?: string;
  height?: number;
  formatter?: (value: any) => string;
  colors?: string[];
}

const GroupedBarChart = forwardRef<any, ChartProps>((props, ref) => {
  const {
    data,
    xField,
    yField,
    seriesField,
    title,
    height = 400,
    colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d'],
  } = props;

  const config = {
    data,
    xField,
    yField,
    seriesField,
    height,
    color: colors,
    legend: {
      position: 'top' as const,
      itemName: {
        formatter: (text: string) => text,
      },
    },
    meta: {
      [yField]: {
        alias: title || yField,
      },
    },
  };

  return <Column {...config} ref={ref} />;
});

export default GroupedBarChart;
