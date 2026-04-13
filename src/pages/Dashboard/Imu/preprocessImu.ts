/**
 * IMU 预处理：消除安装位置角度带来的重力加速度偏移
 * 将静态加速度对齐到 (0, 0, -g)，再对整段 acc/gyro 做同一旋转并归一化加速度
 */

import type { ImuRecord } from './parseCsv';

const DEFAULT_G = 9.8;
const DEFAULT_WINDOW_SIZE = 100;
const ROTATION_AXIS_EPS = 1e-10;

/** 向量范数 */
function norm3(v: [number, number, number]): number {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
}

/** 叉乘 */
function cross(
  a: [number, number, number],
  b: [number, number, number],
): [number, number, number] {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

/** 点乘 */
function dot3(
  a: [number, number, number],
  b: [number, number, number],
): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/** 3x3 矩阵乘向量 */
function mat3MulVec(
  m: [
    [number, number, number],
    [number, number, number],
    [number, number, number],
  ],
  v: [number, number, number],
): [number, number, number] {
  return [
    m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
    m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
    m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
  ];
}

/** 3x3 矩阵乘法 K*K */
function mat3Mul(
  a: [
    [number, number, number],
    [number, number, number],
    [number, number, number],
  ],
  b: [
    [number, number, number],
    [number, number, number],
    [number, number, number],
  ],
): [
  [number, number, number],
  [number, number, number],
  [number, number, number],
] {
  const out: [
    [number, number, number],
    [number, number, number],
    [number, number, number],
  ] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      out[i][j] = a[i][0] * b[0][j] + a[i][1] * b[1][j] + a[i][2] * b[2][j];
    }
  }
  return out;
}

/**
 * 计算静态加速度均值作为参考（取前 window_size 个样本的 acc 均值）
 * @param imuData 形状 (n, 3) 的加速度数据 [ax, ay, az]
 * @param windowSize 滑动窗口大小，默认 100
 * @returns 静态加速度参考 [x, y, z]
 */
export function calculateStaticAcceleration(
  imuData: number[][],
  windowSize: number = DEFAULT_WINDOW_SIZE,
): [number, number, number] {
  if (imuData.length < windowSize) {
    throw new Error(
      `IMU 数据长度(${imuData.length})小于窗口大小(${windowSize})`,
    );
  }
  let sx = 0,
    sy = 0,
    sz = 0;
  for (let i = 0; i < windowSize; i++) {
    const row = imuData[i];
    sx += row[0] ?? 0;
    sy += row[1] ?? 0;
    sz += row[2] ?? 0;
  }
  return [sx / windowSize, sy / windowSize, sz / windowSize];
}

/**
 * 将动态 IMU 数据转换到静态坐标系（静态加速度对齐到 (0, 0, -g)），并对加速度按模长归一化到 g
 * @param imuData 形状 (n, 6)：前 3 列 acc [ax,ay,az]，后 3 列 gyro [gx,gy,gz]；若只有 3 列则仅处理 acc
 * @param staticAccReference 由 calculateStaticAcceleration 得到的静态加速度参考
 * @param g 重力常数，默认 9.8
 * @returns 转换后的数据，形状与输入相同
 */
export function coordinateTransform(
  imuData: number[][],
  staticAccReference: [number, number, number],
  g: number = DEFAULT_G,
): number[][] {
  const accData = imuData.map(
    (row) =>
      [row[0] ?? 0, row[1] ?? 0, row[2] ?? 0] as [number, number, number],
  );
  const hasGyro = imuData[0]?.length >= 6;
  const gyroData = hasGyro
    ? imuData.map(
        (row) =>
          [row[3] ?? 0, row[4] ?? 0, row[5] ?? 0] as [number, number, number],
      )
    : null;

  const staticNorm = norm3(staticAccReference);
  const staticUnit: [number, number, number] = [
    staticAccReference[0] / staticNorm,
    staticAccReference[1] / staticNorm,
    staticAccReference[2] / staticNorm,
  ];
  const targetUnit: [number, number, number] = [0, 0, -1];

  let rotationAxis = cross(staticUnit, targetUnit);
  const rotationAxisNorm = norm3(rotationAxis);

  let rotationMatrix: [
    [number, number, number],
    [number, number, number],
    [number, number, number],
  ];

  if (rotationAxisNorm < ROTATION_AXIS_EPS) {
    if (dot3(staticUnit, targetUnit) > 0) {
      rotationMatrix = [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ];
    } else {
      rotationMatrix = [
        [1, 0, 0],
        [0, -1, 0],
        [0, 0, -1],
      ];
    }
  } else {
    rotationAxis = [
      rotationAxis[0] / rotationAxisNorm,
      rotationAxis[1] / rotationAxisNorm,
      rotationAxis[2] / rotationAxisNorm,
    ];
    const cosAngle = dot3(staticUnit, targetUnit);
    const sinAngle = rotationAxisNorm;
    const K: [
      [number, number, number],
      [number, number, number],
      [number, number, number],
    ] = [
      [0, -rotationAxis[2], rotationAxis[1]],
      [rotationAxis[2], 0, -rotationAxis[0]],
      [-rotationAxis[1], rotationAxis[0], 0],
    ];
    const K2 = mat3Mul(K, K);
    rotationMatrix = [
      [
        1 + sinAngle * K[0][0] + (1 - cosAngle) * K2[0][0],
        sinAngle * K[0][1] + (1 - cosAngle) * K2[0][1],
        sinAngle * K[0][2] + (1 - cosAngle) * K2[0][2],
      ],
      [
        sinAngle * K[1][0] + (1 - cosAngle) * K2[1][0],
        1 + sinAngle * K[1][1] + (1 - cosAngle) * K2[1][1],
        sinAngle * K[1][2] + (1 - cosAngle) * K2[1][2],
      ],
      [
        sinAngle * K[2][0] + (1 - cosAngle) * K2[2][0],
        sinAngle * K[2][1] + (1 - cosAngle) * K2[2][1],
        1 + sinAngle * K[2][2] + (1 - cosAngle) * K2[2][2],
      ],
    ];
  }

  const transformedAcc = accData.map((v) => mat3MulVec(rotationMatrix, v));
  const transformedGyro =
    gyroData?.map((v) => mat3MulVec(rotationMatrix, v)) ?? null;

  // 归一化加速度：每行除以其模长再乘 g
  const normalizedAcc = transformedAcc.map((v) => {
    const mag = norm3(v);
    const scale = mag < 1e-12 ? 0 : g / mag;
    return [v[0] * scale, v[1] * scale, v[2] * scale] as [
      number,
      number,
      number,
    ];
  });

  const result: number[][] = [];
  for (let i = 0; i < imuData.length; i++) {
    if (transformedGyro) {
      result.push([
        normalizedAcc[i][0],
        normalizedAcc[i][1],
        normalizedAcc[i][2],
        transformedGyro[i][0],
        transformedGyro[i][1],
        transformedGyro[i][2],
      ]);
    } else {
      result.push([
        normalizedAcc[i][0],
        normalizedAcc[i][1],
        normalizedAcc[i][2],
      ]);
    }
  }
  return result;
}

/**
 * 将 ImuRecord[] 转为 (n, 6) 矩阵 [acc_x, acc_y, acc_z, gyro_x, gyro_y, gyro_z]
 */
export function recordsToMatrix(records: ImuRecord[]): number[][] {
  return records.map((r) => [
    r.acc_x,
    r.acc_y,
    r.acc_z,
    r.gyro_x,
    r.gyro_y,
    r.gyro_z,
  ]);
}

/**
 * 用预处理后的矩阵覆盖原记录的 acc/gyro，保留 ts、device_id
 */
export function applyMatrixToRecords(
  records: ImuRecord[],
  matrix: number[][],
): ImuRecord[] {
  if (records.length !== matrix.length) {
    throw new Error('records 与 matrix 行数不一致');
  }
  return records.map((r, i) => {
    const row = matrix[i];
    return {
      ...r,
      acc_x: row[0] ?? 0,
      acc_y: row[1] ?? 0,
      acc_z: row[2] ?? 0,
      gyro_x: row[3] ?? 0,
      gyro_y: row[4] ?? 0,
      gyro_z: row[5] ?? 0,
    };
  });
}

const PREPROCESS_WINDOW_SIZE = DEFAULT_WINDOW_SIZE;

/**
 * 对 IMU 记录做预处理：消除安装角度带来的重力偏移
 * 若数据量小于窗口大小，则返回原数据
 */
export function preprocessImuRecords(records: ImuRecord[]): ImuRecord[] {
  if (records.length < PREPROCESS_WINDOW_SIZE) {
    return records;
  }
  const matrix = recordsToMatrix(records);
  const accOnly = matrix.map((row) => row.slice(0, 3));
  const staticRef = calculateStaticAcceleration(
    accOnly,
    PREPROCESS_WINDOW_SIZE,
  );
  const transformed = coordinateTransform(matrix, staticRef);
  return applyMatrixToRecords(records, transformed);
}
