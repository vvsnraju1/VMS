/**
 * Application Header Component
 * Navigation and user info with role display
 */
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Dropdown, Button, Space, Avatar, Tag } from 'antd';
import {
  DashboardOutlined,
  AuditOutlined,
  UserOutlined,
  LogoutOutlined,
  DownOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const roleColors: Record<string, string> = {
  Admin: '#1e3a5f',
  'Validation Lead': '#2d5a87',
  QA: '#22c55e',
  Executor: '#7c3aed',
};

const AppHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'role',
      label: (
        <div style={{ padding: '8px 0' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Current Role</div>
          <Tag color={roleColors[user?.role || ''] || 'default'}>{user?.role}</Tag>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sign Out',
      onClick: handleLogout,
    },
  ];

  const navItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/audit-trail',
      icon: <AuditOutlined />,
      label: 'Audit Trail',
    },
  ];

  const getSelectedKey = () => {
    if (location.pathname.startsWith('/projects')) {
      return '/dashboard';
    }
    return location.pathname;
  };

  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
        <div
          className="app-logo"
          onClick={() => navigate('/dashboard')}
          style={{ cursor: 'pointer' }}
        >
          <div className="app-logo-icon">
            <SafetyCertificateOutlined style={{ fontSize: '18px' }} />
          </div>
          <div>
            <span className="app-logo-text">VMS</span>
            <span className="app-logo-subtitle">Validation Management</span>
          </div>
        </div>

        <Menu
          mode="horizontal"
          selectedKeys={[getSelectedKey()]}
          items={navItems}
          onClick={({ key }) => navigate(key)}
          style={{
            background: 'transparent',
            border: 'none',
          }}
          theme="dark"
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Tag
          color={roleColors[user?.role || ''] || 'default'}
          style={{ margin: 0, padding: '2px 10px' }}
        >
          {user?.role}
        </Tag>
        <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
          <Button type="text" style={{ color: 'white', padding: '4px 8px' }}>
            <Space>
              <Avatar
                size="small"
                icon={<UserOutlined />}
                style={{ backgroundColor: '#2dd4bf' }}
              />
              <span
                style={{
                  maxWidth: '140px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user?.email?.split('@')[0]}
              </span>
              <DownOutlined style={{ fontSize: '10px' }} />
            </Space>
          </Button>
        </Dropdown>
      </div>
    </header>
  );
};

export default AppHeader;
