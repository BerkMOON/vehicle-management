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
        layout: {
          justifyContent: 'center',
        },
        maxItemWidth: null,
        itemSpacing: 8,
        page: false,
        itemMarker: (field: string) => {
          if (field === leftYField) return 'rect';
          return 'smooth';
        },
        itemLabelText: (field: { id: string }) => {
          if (field.id === leftYField) return leftAlias;
          if (field.id === rightYField) return rightAlias;
          return '图例';
        },
      },
    },
    interaction: {
      tooltip: {
        // render 回调方法返回一个innerHTML 或者 DOM
        render: (_event: any, { title, items }: any) => {
          const leftItem = items.find((item: any) => item.name === leftYField);
          const rightItem = items.find(
            (item: any) => item.name === rightYField,
          );
          return `<div style="padding: 0.5rem"><div>${title}</div>
            <div style="margin-top: 0.5rem; display: flex; align-items: center;">
              <span style="display:inline-block;width:8px;height:8px;background-color:${
                leftItem?.color
              };border-radius:50%;margin-right:0.5rem;"></span>
              <span>${leftAlias}: ${leftFormatter(leftItem?.value)}</span>
            </div>
            <div style="margin-top: 0.5rem; display: flex; align-items: center;">
              <span style="display:inline-block;width:8px;height:8px;background-color:${
                rightItem?.color
              };border-radius:50%;margin-right:0.5rem;"></span>
              <span>${rightAlias}: ${rightFormatter(rightItem?.value)}</span>
            </div>
          </div>`;
        },
      },
    },
  };

  return <DualAxes {...config} ref={ref} />;
});

export default DualAxesChart;
