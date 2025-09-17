import { DualAxes } from '@ant-design/plots';
import { forwardRef } from 'react';

interface ChartProps {
  data: any[];
  xField: string;
  leftYField: string;
  rightYField: string;
  leftAlias?: string;
  rightAlias?: string;
  leftFormatter?: (value: any) => string;
  rightFormatter?: (value: any) => string;
  leftColor?: string;
  rightColor?: string;
}

const DualAxesChart = forwardRef<any, ChartProps>((props, ref) => {
  const {
    data,
    xField,
    leftYField,
    rightYField,
    leftAlias = '左轴数据',
    rightAlias = '右轴数据',
    leftFormatter = (value) => `${value}`,
    rightFormatter = (value) => `${value}`,
  } = props;

  const config = {
    data,
    xField,
    children: [
      {
        type: 'interval',
        yField: leftYField,
      },
      {
        type: 'line',
        yField: rightYField,
        shapeField: 'smooth',
        style: {
          lineWidth: 3,
        },
        axis: { y: { position: 'right' } },
      },
    ],
    legend: {
      color: {
        // position: 'left-top',
        layout: {
          justifyContent: 'center',
        },
        itemMarker: (field: string) => {
          if (field === leftYField) return 'rect';
          return 'line';
        },
        itemLabelText: (field: { id: string }) => {
          if (field.id === leftYField) return leftAlias;
          if (field.id === rightYField) return rightAlias;
          return '图例';
        },
      },
    },
    tooltip: {
      items: [
        {
          field: leftYField,
          name: leftAlias,
          valueFormatter: leftFormatter,
        },
        {
          field: rightYField,
          name: rightAlias,
          valueFormatter: rightFormatter,
        },
      ],
    },
  };

  return <DualAxes {...config} ref={ref} />;
});

export default DualAxesChart;
