/**
 * Login Page - Enhanced Enterprise Edition
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Select, Button, Card, message, Space } from 'antd';
import {
  UserOutlined, SafetyCertificateOutlined, LockOutlined,
  RocketOutlined, CheckCircleOutlined, ThunderboltOutlined
} from '@ant-design/icons';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values: { email: string; role: Role }) => {
    setLoading(true);
    try {
      const response = await authApi.login(values);
      if (response.success) {
        login({ email: values.email, role: values.role });
        message.success(response.message);
        navigate('/home');
      }
    } catch {
      message.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: <CheckCircleOutlined />, text: '16 Validation Modules' },
    { icon: <ThunderboltOutlined />, text: 'AI-Assisted Validation' },
    { icon: <SafetyCertificateOutlined />, text: '21 CFR Part 11 Ready' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: 'linear-gradient(135deg, #0d1b2a 0%, #1b263b 50%, #2d3a4f 100%)',
      }}
    >
      {/* Left Panel - Branding */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px',
          color: 'white',
        }}
      >
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <SafetyCertificateOutlined style={{ fontSize: '48px', color: '#14b8a6', marginRight: '16px' }} />
            <div>
              <h1 style={{ margin: 0, fontSize: '42px', fontWeight: 700, letterSpacing: '-1px' }}>
                VMS<span style={{ color: '#14b8a6' }}>Pro</span>
              </h1>
              <div style={{ fontSize: '14px', opacity: 0.7, letterSpacing: '2px' }}>
                VALIDATION MANAGEMENT SYSTEM
              </div>
            </div>
          </div>
        </div>

        <h2 style={{ fontSize: '32px', fontWeight: 600, marginBottom: '24px', lineHeight: 1.3 }}>
          Enterprise CSV Platform for
          <br />
          <span style={{ color: '#14b8a6' }}>Pharmaceutical Excellence</span>
        </h2>

        <p style={{ fontSize: '16px', opacity: 0.8, marginBottom: '40px', maxWidth: '500px', lineHeight: 1.8 }}>
          Streamline your Computer System Validation lifecycle with AI-assisted workflows,
          complete traceability, and 21 CFR Part 11 compliance built-in.
        </p>

        <div style={{ display: 'flex', gap: '32px' }}>
          {features.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#14b8a6', fontSize: '20px' }}>{f.icon}</span>
              <span style={{ fontSize: '14px', opacity: 0.9 }}>{f.text}</span>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: '60px',
            padding: '20px 24px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            borderLeft: '4px solid #14b8a6',
          }}
        >
          <div style={{ fontSize: '13px', opacity: 0.7, marginBottom: '4px' }}>GAMP 5 Aligned</div>
          <div style={{ fontSize: '15px' }}>
            Risk-based validation approach with complete audit trail and traceability matrix
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div
        style={{
          width: '500px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'white',
        }}
      >
        <Card
          style={{
            width: '380px',
            border: 'none',
            boxShadow: 'none',
          }}
          bodyStyle={{ padding: '0' }}
        >
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>Welcome Back</h3>
            <p style={{ color: '#64748b', fontSize: '14px' }}>
              Sign in to access your validation dashboard
            </p>
          </div>

          <Form layout="vertical" onFinish={handleLogin} size="large">
            <Form.Item
              name="email"
              label="Email Address"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
                placeholder="user@pharma.com"
              />
            </Form.Item>

            <Form.Item
              name="role"
              label="Role"
              rules={[{ required: true, message: 'Please select your role' }]}
            >
              <Select
                placeholder="Select your role"
                options={[
                  {
                    value: 'Admin',
                    label: (
                      <Space>
                        <span style={{ color: '#1e3a5f' }}>●</span>
                        Admin - Full system access
                      </Space>
                    ),
                  },
                  {
                    value: 'Validation Lead',
                    label: (
                      <Space>
                        <span style={{ color: '#3b82f6' }}>●</span>
                        Validation Lead - Project management
                      </Space>
                    ),
                  },
                  {
                    value: 'QA',
                    label: (
                      <Space>
                        <span style={{ color: '#22c55e' }}>●</span>
                        QA Reviewer - Approvals & oversight
                      </Space>
                    ),
                  },
                  {
                    value: 'Executor',
                    label: (
                      <Space>
                        <span style={{ color: '#8b5cf6' }}>●</span>
                        Executor - Test execution
                      </Space>
                    ),
                  },
                ]}
              />
            </Form.Item>

            <Form.Item style={{ marginTop: '32px' }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{
                  height: '48px',
                  fontSize: '16px',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a8f 100%)',
                  border: 'none',
                }}
                icon={<RocketOutlined />}
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <div
            style={{
              marginTop: '32px',
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '10px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>
              POC DEMONSTRATION
            </div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              No real authentication - Select any role to explore
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
