import { ModalControl } from '@/hooks/useModalControl';

export interface ResponseInfoType<T> {
  response_status: ResponseStatus;
  data: T;
}

export interface ResponseStatus {
  code: number;
  extension: {
    key: string;
    value: string;
  };
  msg: string;
}

export interface ModalStates {
  create: boolean;
  update: boolean;
  delete: boolean;
  modify: boolean;
}

export interface BaseModalFormProps {
  modalVisible: boolean;
  onCancel: () => void;
  refresh: () => void;
}

export interface BaseListInfo {
  meta: {
    total_count: number;
    total_page: number;
  };
}

export interface PageInfoParams {
  page: number;
  limit: number;
}

export interface BaseCreateModalFormProps {
  modalVisible: boolean;
  onCancel: () => void;
  refresh: () => void;
  children: React.ReactNode;
  text: {
    title: string;
    successMsg: string;
  };
  api: (params: any) => Promise<any>;
  record?: any;
  idMapKey?: string;
  idMapValue?: string;
  extraParams?: any;
}

export interface ColumnsProps<T> {
  handleModalOpen: (modal: ModalControl, record: T) => void;
  deleteModal: ModalControl;
  createOrModifyModal: ModalControl;
  updateRoleModal?: ModalControl;
}
