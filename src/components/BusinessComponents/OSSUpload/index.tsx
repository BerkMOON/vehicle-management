import { OtaAPI } from '@/services/ota/OTAController';
import { OtaType } from '@/services/ota/typings.d';
import { UploadOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { Button, message, Upload, UploadFile, UploadProps } from 'antd';
import { useEffect, useState } from 'react';
import SparkMD5 from 'spark-md5';

interface OSSDataType {
  dir: string;
  host: string;
  accessId: string;
  policy: string;
  signature: string;
}

interface AliyunOSSUploadProps {
  value?: UploadFile[];
  onChange?: (fileList: UploadFile[]) => void;
  type: OtaType;
  onUploadSuccess?: (fileInfo: {
    path: string;
    name: string;
    md5: string;
  }) => void;
}

export const AliyunOSSUpload = ({
  value,
  onChange,
  onUploadSuccess,
  type,
}: AliyunOSSUploadProps) => {
  const [OSSData, setOSSData] = useState<OSSDataType>();

  const { run: getOSSConfig } = useRequest(OtaAPI.getOSSConfig, {
    manual: true,
    onSuccess: (res) => {
      const {
        data: { dir, host, ossAccessKeyId, policy, signature },
      } = res;
      setOSSData({
        dir,
        host,
        accessId: ossAccessKeyId,
        policy,
        signature,
      });
    },
  });

  // 计算文件的 MD5
  const calculateMD5 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onload = (e) => {
        const buffer = e.target?.result;
        const spark = new SparkMD5.ArrayBuffer();
        spark.append(buffer as ArrayBuffer);
        const md5 = spark.end();
        resolve(md5);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleChange: UploadProps['onChange'] = async ({ fileList, file }) => {
    if (file.status === 'done') {
      const md5 = await calculateMD5(file.originFileObj as File);
      onUploadSuccess?.({
        path: `${OSSData?.dir}${file.url}`,
        name: file.originFileObj?.name || (file.url as string),
        md5: md5,
      });
    }
    onChange?.([...fileList]);
  };

  const onRemove = (file: UploadFile) => {
    const files = (value || []).filter((v) => v.url !== file.url);

    if (onChange) {
      onChange(files);
    }
  };

  useEffect(() => {
    if (type) {
      getOSSConfig({ module_type: type });

      if (value && value.length > 0) {
        onRemove(value?.[0]);
      }
    }
  }, [type]);

  const getExtraData: UploadProps['data'] = (file) => ({
    key: `${OSSData?.dir}${file.url}`,
    OSSAccessKeyId: OSSData?.accessId,
    policy: OSSData?.policy,
    Signature: OSSData?.signature,
    success_action_status: '200', // 添加这个字段
  });

  const beforeUpload: UploadProps['beforeUpload'] = async (file) => {
    const isZip = file.type === 'application/zip' || file.name.endsWith('.zip');
    if (!isZip) {
      message.error('只能上传 ZIP 文件！');
      return Upload.LIST_IGNORE;
    }

    const suffix = file.name.slice(file.name.lastIndexOf('.'));
    const filename = Date.now() + suffix;
    // @ts-ignore
    file.url = filename;

    return file;
  };

  const uploadProps: UploadProps = {
    name: 'file',
    maxCount: 1,
    fileList: value,
    action: OSSData?.host,
    onChange: handleChange,
    onRemove,
    data: getExtraData,
    beforeUpload,
    disabled: !OSSData,
  };

  return (
    <Upload {...uploadProps}>
      <Button icon={<UploadOutlined />}>点击上传</Button>
    </Upload>
  );
};
