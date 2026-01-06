/**
 * VMS Application - Enterprise Edition
 * Complete 16-module routing and navigation
 */
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Avatar, Dropdown, Tag, Space, Badge } from 'antd';
import {
  DashboardOutlined, ProjectOutlined, FileTextOutlined,
  NodeIndexOutlined, AuditOutlined, ExperimentOutlined,
  WarningOutlined, SwapOutlined, FileDoneOutlined,
  LogoutOutlined, UserOutlined, SettingOutlined,
  RobotOutlined, SafetyCertificateOutlined, ToolOutlined
} from '@ant-design/icons';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RoleDashboardPage from './pages/RoleDashboard';
import DashboardPage from './pages/DashboardPage';
import URSPage from './pages/URSPage';
import FSPage from './pages/FSPage';
import DSPage from './pages/DSPage';
import TraceabilityPage from './pages/TraceabilityPage';
import AuditTrailPage from './pages/AuditTrailPage';
import SystemBoundaryPage from './pages/SystemBoundaryPage';
import TestManagementPage from './pages/TestManagementPage';
import DeviationPage from './pages/DeviationPage';
import ChangeManagementPage from './pages/ChangeManagementPage';
import VSRPage from './pages/VSRPage';

const { Header, Sider, Content } = Layout;

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const roleColors: Record<string, string> = {
    Admin: '#1e3a5f',
    'Validation Lead': '#3b82f6',
    QA: '#22c55e',
    Executor: '#8b5cf6',
  };

  const menuItems = [
    { key: '/home', icon: <DashboardOutlined />, label: 'My Dashboard' },
    { key: '/dashboard', icon: <ProjectOutlined />, label: 'Projects' },
    {
      key: 'validation',
      icon: <SafetyCertificateOutlined />,
      label: 'Validation',
      children: [
        { key: '/urs', icon: <FileTextOutlined />, label: 'Requirements (URS)' },
        { key: '/fs', icon: <AuditOutlined />, label: 'Functional Spec (FS)' },
        { key: '/ds', icon: <ToolOutlined />, label: 'Design Spec (DS)' },
        { key: '/boundary', icon: <SettingOutlined />, label: 'System Boundary' },
      ],
    },
    {
      key: 'testing',
      icon: <ExperimentOutlined />,
      label: 'Testing',
      children: [
        { key: '/tests', icon: <ExperimentOutlined />, label: 'Test Management' },
        { key: '/deviations', icon: <WarningOutlined />, label: 'Deviations & CAPA' },
      ],
    },
    { key: '/traceability', icon: <NodeIndexOutlined />, label: 'Traceability' },
    { key: '/changes', icon: <SwapOutlined />, label: 'Change Control' },
    { key: '/vsr', icon: <FileDoneOutlined />, label: 'VSR Generator' },
    { key: '/audit-trail', icon: <AuditOutlined />, label: 'Audit Trail' },
  ];

  const userMenu = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: user?.email,
      disabled: true,
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={240}
        style={{
          background: 'linear-gradient(180deg, #0d1b2a 0%, #1b263b 100%)',
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
        }}
      >
        <div
          style={{
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 16px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <SafetyCertificateOutlined style={{ fontSize: '28px', color: '#14b8a6', marginRight: '10px' }} />
          <span style={{ color: 'white', fontSize: '18px', fontWeight: 700, letterSpacing: '-0.5px' }}>
            VMS<span style={{ color: '#14b8a6' }}>Pro</span>
          </span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => {
            if (key.startsWith('/')) navigate(key);
          }}
          style={{
            background: 'transparent',
            marginTop: '8px',
            borderRight: 0,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            right: '16px',
            padding: '12px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <RobotOutlined style={{ color: '#14b8a6', marginRight: '8px' }} />
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>AI-Assisted Validation</span>
        </div>
      </Sider>
      <Layout>
        <Header
          style={{
            background: 'white',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '14px', color: '#64748b' }}>
              Pharmaceutical Validation Management System
            </span>
            <Tag color="blue">Enterprise POC</Tag>
          </div>
          <Space size={16}>
            <Badge count={3} size="small">
              <Button type="text" icon={<AuditOutlined />} />
            </Badge>
            <Dropdown menu={{ items: userMenu }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar
                  style={{ backgroundColor: roleColors[user?.role || 'Admin'] }}
                  icon={<UserOutlined />}
                />
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>
                    {user?.email?.split('@')[0]}
                  </div>
                  <Tag
                    color={roleColors[user?.role || 'Admin']}
                    style={{ margin: 0, fontSize: '10px', padding: '0 6px' }}
                  >
                    {user?.role}
                  </Tag>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content
          style={{
            margin: '24px',
            background: '#f8fafc',
            minHeight: 'calc(100vh - 112px)',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

const App: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/home" replace /> : <LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                <Route path="/home" element={<RoleDashboardPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/projects/:id/urs" element={<URSPage />} />
                <Route path="/urs" element={<URSPage />} />
                <Route path="/projects/:id/fs" element={<FSPage />} />
                <Route path="/fs" element={<FSPage />} />
                <Route path="/projects/:id/ds" element={<DSPage />} />
                <Route path="/ds" element={<DSPage />} />
                <Route path="/boundary" element={<SystemBoundaryPage />} />
                <Route path="/projects/:id/boundary" element={<SystemBoundaryPage />} />
                <Route path="/tests" element={<TestManagementPage />} />
                <Route path="/projects/:id/tests" element={<TestManagementPage />} />
                <Route path="/deviations" element={<DeviationPage />} />
                <Route path="/projects/:id/deviations" element={<DeviationPage />} />
                <Route path="/traceability" element={<TraceabilityPage />} />
                <Route path="/projects/:id/traceability" element={<TraceabilityPage />} />
                <Route path="/changes" element={<ChangeManagementPage />} />
                <Route path="/projects/:id/changes" element={<ChangeManagementPage />} />
                <Route path="/vsr" element={<VSRPage />} />
                <Route path="/projects/:id/vsr" element={<VSRPage />} />
                <Route path="/audit-trail" element={<AuditTrailPage />} />
                <Route path="/" element={<Navigate to="/home" replace />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default App;
