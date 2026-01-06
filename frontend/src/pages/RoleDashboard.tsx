/**
 * Role-Specific Dashboard - Innovative & Futuristic
 * Customized views for Admin, Validation Lead, QA, and Executor
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Row, Col, Statistic, Progress, Tag, Button, Table, List,
  Spin, message, Badge, Tooltip, Space, Alert, Empty
} from 'antd';
import {
  ProjectOutlined, FileTextOutlined, ExperimentOutlined,
  CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined,
  RobotOutlined, ThunderboltOutlined, SafetyCertificateOutlined,
  ArrowRightOutlined, BellOutlined, ClockCircleOutlined,
  TrophyOutlined, AimOutlined, RocketOutlined,
  BarChartOutlined, LineChartOutlined, PieChartOutlined,
  TeamOutlined, AuditOutlined, WarningOutlined
} from '@ant-design/icons';
import { dashboardApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { RoleDashboard as RoleDashboardType } from '../types';

// Color schemes
const colors = {
  primary: '#1e3a5f',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  purple: '#8b5cf6',
  teal: '#14b8a6',
};

const RoleDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<RoleDashboardType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    try {
      const data = await dashboardApi.get(user!.role, user!.email);
      setDashboard(data);
    } catch {
      message.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!dashboard) {
    return <Empty description="Unable to load dashboard" />;
  }

  const { metrics, pending_approvals, my_tasks, recent_activity, alerts, quick_actions, trends } = dashboard;

  // Role-specific greeting and icon
  const roleConfig: Record<string, { icon: React.ReactNode; greeting: string; color: string }> = {
    Admin: { icon: <TeamOutlined />, greeting: "System Overview", color: colors.primary },
    'Validation Lead': { icon: <RocketOutlined />, greeting: "Validation Control Center", color: colors.info },
    QA: { icon: <SafetyCertificateOutlined />, greeting: "Quality Assurance Hub", color: colors.success },
    Executor: { icon: <AimOutlined />, greeting: "Test Execution Center", color: colors.purple },
  };

  const config = roleConfig[user?.role || 'Admin'];

  return (
    <div>
      {/* Welcome Banner */}
      <div
        style={{
          background: `linear-gradient(135deg, ${config.color} 0%, ${config.color}dd 100%)`,
          borderRadius: '12px',
          padding: '24px 32px',
          marginBottom: '24px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.1, fontSize: '200px' }}>
          {config.icon}
        </div>
        <Row align="middle" gutter={24}>
          <Col flex="auto">
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '4px' }}>
              Welcome back, {user?.email?.split('@')[0]}
            </div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>
              {config.greeting}
            </h1>
            <div style={{ fontSize: '14px', opacity: 0.8, marginTop: '8px' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </Col>
          <Col>
            <Tag color="white" style={{ color: config.color, fontWeight: 600, fontSize: '14px', padding: '4px 12px' }}>
              {user?.role}
            </Tag>
          </Col>
        </Row>
      </div>

      {/* Alerts Banner */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          {alerts.map((alert, i) => (
            <Alert
              key={i}
              type={alert.type as 'error' | 'warning' | 'info'}
              message={alert.message}
              showIcon
              style={{ marginBottom: '8px' }}
              action={
                <Button size="small" type="link">
                  View <ArrowRightOutlined />
                </Button>
              }
            />
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        {quick_actions.map((action, i) => (
          <Col key={i} span={24 / quick_actions.length}>
            <Card
              hoverable
              style={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                borderColor: '#e2e8f0',
              }}
              bodyStyle={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              onClick={() => {
                if (action.action === 'view_audit') navigate('/audit-trail');
                else if (action.action === 'create_project') navigate('/dashboard');
                else if (action.action.includes('urs')) navigate('/dashboard');
              }}
            >
              <div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: colors.primary }}>{action.label}</div>
              </div>
              <ThunderboltOutlined style={{ fontSize: '24px', color: colors.warning }} />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Main Stats Grid */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {/* Projects Card */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{ height: '100%', borderTop: `3px solid ${colors.primary}` }}
            bodyStyle={{ padding: '20px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Projects
                </div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: colors.primary }}>
                  {metrics.total_projects}
                </div>
              </div>
              <div style={{ padding: '12px', background: `${colors.primary}15`, borderRadius: '12px' }}>
                <ProjectOutlined style={{ fontSize: '24px', color: colors.primary }} />
              </div>
            </div>
            <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
              <Tag color="processing">{metrics.active_projects} Active</Tag>
              <Tag color="success">{metrics.completed_projects} Done</Tag>
            </div>
          </Card>
        </Col>

        {/* Requirements Card */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{ height: '100%', borderTop: `3px solid ${colors.info}` }}
            bodyStyle={{ padding: '20px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Requirements
                </div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: colors.info }}>
                  {metrics.total_urs}
                </div>
              </div>
              <div style={{ padding: '12px', background: `${colors.info}15`, borderRadius: '12px' }}>
                <FileTextOutlined style={{ fontSize: '24px', color: colors.info }} />
              </div>
            </div>
            <div style={{ marginTop: '16px' }}>
              <Progress
                percent={Math.round((metrics.approved_urs / Math.max(metrics.total_urs, 1)) * 100)}
                strokeColor={colors.success}
                format={() => `${metrics.approved_urs} Approved`}
              />
            </div>
          </Card>
        </Col>

        {/* Testing Card */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{ height: '100%', borderTop: `3px solid ${colors.success}` }}
            bodyStyle={{ padding: '20px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Test Pass Rate
                </div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: colors.success }}>
                  {metrics.pass_rate}%
                </div>
              </div>
              <div style={{ padding: '12px', background: `${colors.success}15`, borderRadius: '12px' }}>
                <ExperimentOutlined style={{ fontSize: '24px', color: colors.success }} />
              </div>
            </div>
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
              <Tooltip title="Passed">
                <Tag color="success" icon={<CheckCircleOutlined />}>{metrics.passed_tests}</Tag>
              </Tooltip>
              <Tooltip title="Failed">
                <Tag color="error" icon={<CloseCircleOutlined />}>{metrics.failed_tests}</Tag>
              </Tooltip>
              <Tooltip title="Blocked">
                <Tag color="warning" icon={<ExclamationCircleOutlined />}>{metrics.blocked_tests}</Tag>
              </Tooltip>
            </div>
          </Card>
        </Col>

        {/* Deviations Card */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{ height: '100%', borderTop: `3px solid ${metrics.open_deviations > 0 ? colors.danger : colors.teal}` }}
            bodyStyle={{ padding: '20px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Deviations
                </div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: metrics.open_deviations > 0 ? colors.danger : colors.teal }}>
                  {metrics.open_deviations}
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Open</div>
              </div>
              <div style={{ padding: '12px', background: metrics.open_deviations > 0 ? `${colors.danger}15` : `${colors.teal}15`, borderRadius: '12px' }}>
                <WarningOutlined style={{ fontSize: '24px', color: metrics.open_deviations > 0 ? colors.danger : colors.teal }} />
              </div>
            </div>
            <div style={{ marginTop: '12px' }}>
              <Tag color="success">{metrics.closed_deviations} Closed</Tag>
              <Tag>{metrics.total_deviations} Total</Tag>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Role-Specific Content */}
      <Row gutter={[16, 16]}>
        {/* Left Column - Tasks/Approvals */}
        <Col xs={24} lg={8}>
          {/* Pending Approvals (QA/Admin) */}
          {pending_approvals.length > 0 && (
            <Card
              title={
                <span>
                  <BellOutlined style={{ marginRight: '8px', color: colors.warning }} />
                  Pending Approvals
                </span>
              }
              style={{ marginBottom: '16px' }}
              extra={<Badge count={pending_approvals.reduce((a, b) => a + b.count, 0)} />}
            >
              <List
                dataSource={pending_approvals}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button type="link" size="small" onClick={() => navigate('/dashboard')}>
                        Review <ArrowRightOutlined />
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px',
                            background: `${colors.warning}15`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <FileTextOutlined style={{ color: colors.warning }} />
                        </div>
                      }
                      title={<span style={{ fontWeight: 600 }}>{item.type}</span>}
                      description={`${item.count} awaiting review`}
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}

          {/* My Tasks (Validation Lead/Executor) */}
          {my_tasks.length > 0 && (
            <Card
              title={
                <span>
                  <AimOutlined style={{ marginRight: '8px', color: colors.purple }} />
                  My Tasks
                </span>
              }
              style={{ marginBottom: '16px' }}
            >
              <List
                dataSource={my_tasks}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button type="primary" size="small" ghost onClick={() => navigate('/dashboard')}>
                        Start
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px',
                            background: `${colors.purple}15`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            color: colors.purple,
                          }}
                        >
                          {item.count}
                        </div>
                      }
                      title={<span style={{ fontWeight: 600 }}>{item.type}</span>}
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}

          {/* AI Insights */}
          <Card
            title={
              <span>
                <RobotOutlined style={{ marginRight: '8px', color: colors.teal }} />
                AI Insights
              </span>
            }
            style={{
              background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>AI Suggestions Used</span>
                <span style={{ fontWeight: 600, color: colors.teal }}>{metrics.ai_suggestions_count}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>Traceability Coverage</span>
                <Progress
                  percent={metrics.traceability_coverage}
                  size="small"
                  style={{ width: '100px' }}
                  strokeColor={colors.success}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>Doc Completeness</span>
                <Progress
                  percent={metrics.documentation_completeness}
                  size="small"
                  style={{ width: '100px' }}
                  strokeColor={colors.info}
                />
              </div>
            </div>
          </Card>
        </Col>

        {/* Center Column - Activity & Trends */}
        <Col xs={24} lg={8}>
          {/* Test Execution Trend */}
          <Card
            title={
              <span>
                <LineChartOutlined style={{ marginRight: '8px', color: colors.info }} />
                Testing Trend (7 Days)
              </span>
            }
            style={{ marginBottom: '16px' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {trends.test_execution.slice(-5).map((day, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ width: '80px', fontSize: '12px', color: '#64748b' }}>
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <div style={{ flex: 1, display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <div
                      style={{
                        height: '20px',
                        width: `${Math.min(day.passed * 15, 100)}px`,
                        background: colors.success,
                        borderRadius: '4px',
                      }}
                    />
                    <div
                      style={{
                        height: '20px',
                        width: `${Math.min(day.failed * 15, 100)}px`,
                        background: colors.danger,
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '12px', minWidth: '60px' }}>
                    <span style={{ color: colors.success }}>{day.passed}</span>
                    {' / '}
                    <span style={{ color: colors.danger }}>{day.failed}</span>
                  </span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '12px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <span style={{ fontSize: '12px' }}>
                <span style={{ width: '12px', height: '12px', background: colors.success, borderRadius: '2px', display: 'inline-block', marginRight: '4px' }} />
                Passed
              </span>
              <span style={{ fontSize: '12px' }}>
                <span style={{ width: '12px', height: '12px', background: colors.danger, borderRadius: '2px', display: 'inline-block', marginRight: '4px' }} />
                Failed
              </span>
            </div>
          </Card>

          {/* Risk Distribution */}
          <Card
            title={
              <span>
                <PieChartOutlined style={{ marginRight: '8px', color: colors.warning }} />
                Risk Distribution
              </span>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(metrics.urs_by_risk).map(([risk, count]) => {
                const riskColors: Record<string, string> = {
                  Low: colors.success,
                  Medium: colors.warning,
                  High: colors.danger,
                  Critical: '#7f1d1d',
                };
                const pct = Math.round((count / Math.max(metrics.total_urs, 1)) * 100);
                return (
                  <div key={risk}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px' }}>{risk}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>{count} ({pct}%)</span>
                    </div>
                    <Progress
                      percent={pct}
                      showInfo={false}
                      strokeColor={riskColors[risk] || colors.info}
                      trailColor="#f1f5f9"
                    />
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>

        {/* Right Column - Recent Activity */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <span>
                <ClockCircleOutlined style={{ marginRight: '8px', color: colors.primary }} />
                Recent Activity
              </span>
            }
            style={{ height: 'calc(100% - 16px)' }}
            bodyStyle={{ maxHeight: '400px', overflow: 'auto' }}
          >
            <List
              dataSource={recent_activity}
              renderItem={(item) => {
                const isAI = item.action.includes('SUGGEST') || item.action.includes('AI');
                return (
                  <List.Item style={{ padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: isAI
                            ? 'linear-gradient(135deg, rgba(20, 184, 166, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)'
                            : '#f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {isAI ? (
                          <RobotOutlined style={{ color: colors.teal }} />
                        ) : (
                          <AuditOutlined style={{ color: '#64748b' }} />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: '13px', marginBottom: '2px' }}>
                          {item.action.replace(/_/g, ' ')}
                        </div>
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#64748b',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.details || item.entity}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                          {new Date(item.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </List.Item>
                );
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Compliance Score Footer */}
      <Card
        style={{
          marginTop: '24px',
          background: 'linear-gradient(135deg, #0d1b2a 0%, #1b263b 100%)',
          border: 'none',
        }}
        bodyStyle={{ padding: '24px' }}
      >
        <Row gutter={24} align="middle">
          <Col span={6}>
            <div style={{ textAlign: 'center', color: 'white' }}>
              <TrophyOutlined style={{ fontSize: '32px', marginBottom: '8px', color: colors.warning }} />
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Validation Score</div>
              <div style={{ fontSize: '28px', fontWeight: 700 }}>
                {Math.round((metrics.traceability_coverage + metrics.documentation_completeness + metrics.pass_rate) / 3)}%
              </div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center', color: 'white' }}>
              <SafetyCertificateOutlined style={{ fontSize: '24px', marginBottom: '8px', color: colors.teal }} />
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Traceability</div>
              <Progress
                percent={metrics.traceability_coverage}
                strokeColor={colors.teal}
                trailColor="rgba(255,255,255,0.2)"
                format={(p) => <span style={{ color: 'white' }}>{p}%</span>}
              />
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center', color: 'white' }}>
              <FileTextOutlined style={{ fontSize: '24px', marginBottom: '8px', color: colors.info }} />
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Documentation</div>
              <Progress
                percent={metrics.documentation_completeness}
                strokeColor={colors.info}
                trailColor="rgba(255,255,255,0.2)"
                format={(p) => <span style={{ color: 'white' }}>{p}%</span>}
              />
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center', color: 'white' }}>
              <ExperimentOutlined style={{ fontSize: '24px', marginBottom: '8px', color: colors.success }} />
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Test Coverage</div>
              <Progress
                percent={metrics.pass_rate}
                strokeColor={colors.success}
                trailColor="rgba(255,255,255,0.2)"
                format={(p) => <span style={{ color: 'white' }}>{p}%</span>}
              />
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default RoleDashboardPage;

