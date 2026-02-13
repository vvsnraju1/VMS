/**
 * Login Page - Beautiful Enterprise Edition
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Select, Button, Card, message, Space } from 'antd';
import {
  UserOutlined, SafetyCertificateOutlined,
  RocketOutlined, CheckCircleOutlined, ThunderboltOutlined,
  ExperimentOutlined, AuditOutlined, NodeIndexOutlined
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

  const stats = [
    { value: '16', label: 'Modules', icon: <ExperimentOutlined /> },
    { value: '100%', label: 'Traceable', icon: <NodeIndexOutlined /> },
    { value: 'AI', label: 'Powered', icon: <ThunderboltOutlined /> },
    { value: 'GxP', label: 'Compliant', icon: <AuditOutlined /> },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated background elements */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-20%',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(20, 184, 166, 0.15) 0%, transparent 70%)',
        animation: 'pulse 8s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-30%',
        right: '-10%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
        animation: 'pulse 10s ease-in-out infinite reverse',
      }} />
      
      {/* Floating grid pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
      }} />

      {/* Left Panel - Branding */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 80px',
          color: 'white',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Logo Section */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '20px',
              boxShadow: '0 20px 40px rgba(20, 184, 166, 0.3)',
            }}>
              <SafetyCertificateOutlined style={{ fontSize: '36px', color: 'white' }} />
            </div>
            <div>
              <h1 style={{ 
                margin: 0, 
                fontSize: '52px', 
                fontWeight: 800, 
                letterSpacing: '-2px',
                background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: 'none',
              }}>
                VMS<span style={{ 
                  background: 'linear-gradient(135deg, #14b8a6 0%, #2dd4bf 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>Pro</span>
              </h1>
              <div style={{ 
                fontSize: '13px', 
                letterSpacing: '4px', 
                color: '#94a3b8',
                fontWeight: 500,
                marginTop: '4px',
              }}>
                VALIDATION MANAGEMENT SYSTEM
              </div>
            </div>
          </div>
        </div>

        {/* Hero Text */}
        <h2 style={{ 
          fontSize: '40px', 
          fontWeight: 700, 
          marginBottom: '24px', 
          lineHeight: 1.2,
          maxWidth: '600px',
        }}>
          Enterprise CSV Platform for{' '}
          <span style={{ 
            background: 'linear-gradient(135deg, #14b8a6 0%, #2dd4bf 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Pharmaceutical Excellence
          </span>
        </h2>

        <p style={{ 
          fontSize: '17px', 
          color: '#94a3b8', 
          marginBottom: '48px', 
          maxWidth: '520px', 
          lineHeight: 1.8,
        }}>
          Streamline your Computer System Validation lifecycle with AI-assisted workflows,
          complete traceability, and 21 CFR Part 11 compliance built-in.
        </p>

        {/* Feature Pills */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '48px', flexWrap: 'wrap' }}>
          {features.map((f, i) => (
            <div 
              key={i} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                padding: '12px 20px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '100px',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <span style={{ color: '#14b8a6', fontSize: '18px' }}>{f.icon}</span>
              <span style={{ fontSize: '14px', color: '#e2e8f0', fontWeight: 500 }}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Stats Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '16px',
          maxWidth: '560px',
        }}>
          {stats.map((stat, i) => (
            <div 
              key={i}
              style={{
                padding: '20px 16px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.08)',
                textAlign: 'center',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div style={{ color: '#14b8a6', fontSize: '20px', marginBottom: '8px' }}>
                {stat.icon}
              </div>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: 700, 
                color: 'white',
                marginBottom: '4px',
              }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Compliance Badge */}
        <div
          style={{
            marginTop: '48px',
            padding: '24px',
            background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
            borderRadius: '16px',
            border: '1px solid rgba(20, 184, 166, 0.2)',
            maxWidth: '520px',
          }}
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            marginBottom: '8px',
          }}>
            <SafetyCertificateOutlined style={{ color: '#14b8a6', fontSize: '20px' }} />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#14b8a6' }}>GAMP 5 ALIGNED</span>
          </div>
          <div style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: 1.6 }}>
            Risk-based validation approach with complete audit trail and end-to-end traceability matrix
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div
        style={{
          width: '520px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'white',
          position: 'relative',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* Decorative top accent */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #14b8a6 0%, #3b82f6 50%, #8b5cf6 100%)',
        }} />

        <Card
          style={{
            width: '400px',
            border: 'none',
            boxShadow: 'none',
          }}
          bodyStyle={{ padding: '0' }}
        >
          <div style={{ marginBottom: '40px', textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <UserOutlined style={{ fontSize: '28px', color: '#14b8a6' }} />
            </div>
            <h3 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px', color: '#0f172a' }}>
              Welcome Back
            </h3>
            <p style={{ color: '#64748b', fontSize: '15px' }}>
              Sign in to access your validation dashboard
            </p>
          </div>

          <Form layout="vertical" onFinish={handleLogin} size="large">
            <Form.Item
              name="email"
              label={<span style={{ fontWeight: 600, color: '#334155' }}>Email Address</span>}
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
                placeholder="user@pharma.com"
                style={{ 
                  height: '52px', 
                  borderRadius: '12px',
                  fontSize: '15px',
                }}
              />
            </Form.Item>

            <Form.Item
              name="role"
              label={<span style={{ fontWeight: 600, color: '#334155' }}>Select Role</span>}
              rules={[{ required: true, message: 'Please select your role' }]}
            >
              <Select
                placeholder="Choose your role"
                style={{ height: '52px' }}
                dropdownStyle={{ borderRadius: '12px' }}
                options={[
                  {
                    value: 'Admin',
                    label: (
                      <Space>
                        <span style={{ 
                          width: '10px', 
                          height: '10px', 
                          borderRadius: '50%', 
                          background: '#1e3a5f',
                          display: 'inline-block',
                        }} />
                        <span style={{ fontWeight: 500 }}>Admin</span>
                        <span style={{ color: '#94a3b8', fontSize: '13px' }}>— Full system access</span>
                      </Space>
                    ),
                  },
                  {
                    value: 'Validation Lead',
                    label: (
                      <Space>
                        <span style={{ 
                          width: '10px', 
                          height: '10px', 
                          borderRadius: '50%', 
                          background: '#3b82f6',
                          display: 'inline-block',
                        }} />
                        <span style={{ fontWeight: 500 }}>Validation Lead</span>
                        <span style={{ color: '#94a3b8', fontSize: '13px' }}>— Project management</span>
                      </Space>
                    ),
                  },
                  {
                    value: 'QA',
                    label: (
                      <Space>
                        <span style={{ 
                          width: '10px', 
                          height: '10px', 
                          borderRadius: '50%', 
                          background: '#22c55e',
                          display: 'inline-block',
                        }} />
                        <span style={{ fontWeight: 500 }}>QA Reviewer</span>
                        <span style={{ color: '#94a3b8', fontSize: '13px' }}>— Approvals & oversight</span>
                      </Space>
                    ),
                  },
                  {
                    value: 'Executor',
                    label: (
                      <Space>
                        <span style={{ 
                          width: '10px', 
                          height: '10px', 
                          borderRadius: '50%', 
                          background: '#8b5cf6',
                          display: 'inline-block',
                        }} />
                        <span style={{ fontWeight: 500 }}>Executor</span>
                        <span style={{ color: '#94a3b8', fontSize: '13px' }}>— Test execution</span>
                      </Space>
                    ),
                  },
                ]}
              />
            </Form.Item>

            <Form.Item style={{ marginTop: '36px' }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{
                  height: '54px',
                  fontSize: '16px',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px rgba(20, 184, 166, 0.3)',
                }}
                icon={<RocketOutlined />}
              >
                Sign In to Dashboard
              </Button>
            </Form.Item>
          </Form>

          <div
            style={{
              marginTop: '36px',
              padding: '20px',
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              borderRadius: '12px',
              textAlign: 'center',
              border: '1px dashed #e2e8f0',
            }}
          >
            <div style={{ 
              fontSize: '11px', 
              color: '#14b8a6', 
              marginBottom: '6px',
              fontWeight: 700,
              letterSpacing: '1px',
            }}>
              🚀 POC DEMONSTRATION MODE
            </div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              No real authentication required — Select any role to explore the system
            </div>
          </div>

          {/* Footer */}
          <div style={{ 
            marginTop: '32px', 
            textAlign: 'center',
            color: '#94a3b8',
            fontSize: '12px',
          }}>
            Enterprise Validation Platform v3.0
          </div>
        </Card>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
