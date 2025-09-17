import chartPng from '@/assets/images/chart.png';
import linePng from '@/assets/images/line.png';
import workPng from '@/assets/images/work-progress.png';
import { UserAPI } from '@/services/user/UserController';
import {
  generateNonce,
  generateSignature,
  getSecondTimestamp,
} from '@/utils/signature';
import { LockOutlined, ReloadOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Input, message, Row } from 'antd';
import { useEffect, useState } from 'react';
import styles from './index.scss';

const SuccessStatus = 200;

const LoginPage: React.FC = () => {
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [captchaImg, setCaptchaImg] = useState<string>('');
  const [captchaId, setCaptchaId] = useState<string>('');
  const [captchaLoading, setCaptchaLoading] = useState(false);

  // 生成验证码请求参数 (需要根据实际需求实现)
  const generateCaptchaParams = () => {
    const timestamp = getSecondTimestamp();
    const nonce = generateNonce();
    // 这里的signature生成逻辑需要根据后端要求实现
    const signature = generateSignature({
      nonce,
      timestamp: timestamp.toString(),
    });

    return {
      nonce,
      signature,
      timestamp,
    };
  };

  // 获取验证码
  const fetchCaptcha = async () => {
    setCaptchaLoading(true);
    try {
      const params = generateCaptchaParams();
      const {
        response_status: { code, msg },
        data,
      } = await UserAPI.generateCaptcha(params);

      if (code === SuccessStatus && data) {
        setCaptchaImg(data.img);
        setCaptchaId(data.captcha_id);
      } else {
        message.error(msg || '获取验证码失败');
      }
    } catch (error) {
      message.error('获取验证码失败');
    } finally {
      setCaptchaLoading(false);
    }
  };

  // 页面加载时获取验证码
  useEffect(() => {
    fetchCaptcha();
  }, []);

  const onFinish = async (values: any) => {
    if (values) {
      setConfirmLoading(true);
      try {
        // 登录参数需要包含验证码信息
        const loginParams = {
          ...values,
          captcha_id: captchaId,
          answer: values.captcha,
        };
        const {
          response_status: { code, msg },
        } = await UserAPI.loginUser(loginParams);
        if (code === SuccessStatus) {
          message.success('登录成功');
          const redirectPath = localStorage.getItem('redirectPath') || '/home';
          localStorage.removeItem('redirectPath'); // 清除保存的路径
          window.location.href = redirectPath;
        } else {
          message.error(msg || '登录失败，请重试');
          // 登录失败时刷新验证码
          fetchCaptcha();
        }
      } catch (error) {
        message.error('登录失败，请重试');
        // 出现异常时刷新验证码
        fetchCaptcha();
      } finally {
        setConfirmLoading(false);
      }
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginContainer}>
        <Card className={styles.loginCard}>
          <div className={styles['card-content']}>
            <div className={styles.right}>
              <div className={styles.logo}>HELLO</div>
              <div className={styles.images}>
                <img className={styles.chart} src={chartPng} />
                <img className={styles.work} src={workPng} />
                <img className={styles.line} src={linePng} alt="" />
              </div>
            </div>
            <div className={styles['login-info']}>
              <div className={styles.header}>
                <h1 className={styles.welcome}>WELCOME</h1>
                <p className={styles.subtitle}>欢迎来到易达安管理系统</p>
              </div>
              <Form
                name="login"
                initialValues={{ remember: true }}
                onFinish={onFinish}
                size="large"
              >
                <Form.Item
                  name="username"
                  rules={[{ required: true, message: '请输入您的账号' }]}
                >
                  <Input
                    prefix={<UserOutlined className={styles.inputIcon} />}
                    placeholder="请输入您的账号"
                  />
                </Form.Item>
                <Form.Item
                  name="password"
                  rules={[{ required: true, message: '请输入您的密码' }]}
                >
                  <Input.Password
                    prefix={<LockOutlined className={styles.inputIcon} />}
                    placeholder="请输入您的密码"
                  />
                </Form.Item>

                <Form.Item
                  name="captcha"
                  rules={[{ required: true, message: '请输入验证码' }]}
                >
                  <Row gutter={8}>
                    <Col span={14}>
                      <Input placeholder="请输入验证码" autoComplete="off" />
                    </Col>
                    <Col span={10}>
                      <div
                        style={{
                          height: '40px',
                          border: '1px solid #d9d9d9',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                        onClick={fetchCaptcha}
                      >
                        {captchaLoading ? (
                          <ReloadOutlined spin />
                        ) : captchaImg ? (
                          <img
                            src={captchaImg}
                            alt="验证码"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <span style={{ fontSize: '12px', color: '#999' }}>
                            点击获取
                          </span>
                        )}
                      </div>
                    </Col>
                  </Row>
                </Form.Item>

                <Form.Item>
                  <Button
                    block
                    loading={confirmLoading}
                    type="primary"
                    htmlType="submit"
                    className={styles.loginButton}
                  >
                    登录 →
                  </Button>
                </Form.Item>
              </Form>
              <div className={styles.footer}>
                <p>Copyright © 2022 北京达安数智科技有限公司</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
