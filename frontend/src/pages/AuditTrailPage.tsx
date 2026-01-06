/**
 * Audit Trail Page - Enhanced
 * Module 11: Complete audit logging with filtering
 */
import { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Space, Select, Input, DatePicker, Row, Col,
  Badge, Tooltip, message, Button
} from 'antd';
import {
  AuditOutlined, RobotOutlined, UserOutlined, FilterOutlined,
  ClearOutlined, DownloadOutlined, SearchOutlined
} from '@ant-design/icons';
import { auditApi } from '../services/api';
import type { AuditTrail } from '../types';

const { RangePicker } = DatePicker;

const AuditTrailPage: React.FC = () => {
  const [entries, setEntries] = useState<AuditTrail[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{
    entity?: string;
    user?: string;
    action?: string;
  }>({});

  useEffect(() => {
    loadEntries();
  }, [filters]);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const data = await auditApi.getAll({ ...filters, limit: 500 });
      setEntries(data);
    } catch {
      message.error('Failed to load audit trail');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => setFilters({});

  // Extract unique values for filters
  const uniqueEntities = [...new Set(entries.map(e => e.entity))];
  const uniqueUsers = [...new Set(entries.map(e => e.user))];
  const uniqueActions = [...new Set(entries.map(e => e.action))];

  const actionColors: Record<string, string> = {
    CREATE: 'success',
    UPDATE: 'processing',
    APPROVE: 'cyan',
    DELETE: 'error',
    LOGIN: 'default',
    EXECUTE: 'purple',
    SUGGEST: 'magenta',
    RISK_ASSESSMENT: 'orange',
    AMBIGUITY_CHECK: 'gold',
    SUGGEST_FS: 'lime',
    SUGGEST_TC: 'lime',
    SUGGEST_ROOT_CAUSE: 'volcano',
    CONSISTENCY_CHECK: 'geekblue',
    IMPACT_ANALYSIS: 'cyan',
    GENERATE_VSR: 'blue',
    UPDATE_STATUS: 'processing',
    UPDATE_RISK: 'warning',
    INVESTIGATE: 'orange',
    ASSIGN_CAPA: 'purple',
    CLOSE: 'success',
    ANALYZE: 'processing',
  };

  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      width: 180,
      render: (t: string) => (
        <Tooltip title={new Date(t).toISOString()}>
          <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
            {new Date(t).toLocaleString()}
          </span>
        </Tooltip>
      ),
      sorter: (a: AuditTrail, b: AuditTrail) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      defaultSortOrder: 'descend' as const,
    },
    {
      title: 'User',
      dataIndex: 'user',
      width: 180,
      render: (user: string, record: AuditTrail) => {
        const isAI = user === 'AI-System';
        return (
          <Space>
            {isAI ? (
              <Badge
                count={<RobotOutlined style={{ color: '#14b8a6' }} />}
                style={{ backgroundColor: 'transparent' }}
              >
                <Tag color="cyan" style={{ margin: 0 }}>AI-System</Tag>
              </Badge>
            ) : (
              <>
                <UserOutlined style={{ color: '#64748b' }} />
                <span>{user}</span>
              </>
            )}
          </Space>
        );
      },
      filters: uniqueUsers.map(u => ({ text: u, value: u })),
      onFilter: (value: any, record: AuditTrail) => record.user === value,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      width: 120,
      render: (role: string) => role && <Tag>{role}</Tag>,
    },
    {
      title: 'Action',
      dataIndex: 'action',
      width: 150,
      render: (action: string) => (
        <Tag color={actionColors[action] || 'default'}>
          {action.replace(/_/g, ' ')}
        </Tag>
      ),
      filters: uniqueActions.map(a => ({ text: a.replace(/_/g, ' '), value: a })),
      onFilter: (value: any, record: AuditTrail) => record.action === value,
    },
    {
      title: 'Entity',
      dataIndex: 'entity',
      width: 160,
      render: (entity: string) => <Tag color="blue">{entity}</Tag>,
      filters: uniqueEntities.map(e => ({ text: e, value: e })),
      onFilter: (value: any, record: AuditTrail) => record.entity === value,
    },
    {
      title: 'Entity ID',
      dataIndex: 'entity_id',
      width: 100,
      render: (id: string) => <span style={{ fontFamily: 'monospace' }}>{id}</span>,
    },
    {
      title: 'Details',
      dataIndex: 'details',
      ellipsis: true,
      render: (details: string) => (
        <Tooltip title={details}>
          <span>{details}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      width: 200,
      ellipsis: true,
      render: (reason: string) => reason && (
        <Tooltip title={reason}>
          <span style={{ color: '#64748b' }}>{reason}</span>
        </Tooltip>
      ),
    },
  ];

  // Stats
  const aiActions = entries.filter(e => e.user === 'AI-System').length;
  const humanActions = entries.length - aiActions;
  const todayActions = entries.filter(e => {
    const today = new Date().toDateString();
    return new Date(e.timestamp).toDateString() === today;
  }).length;

  return (
    <div>
      {/* Header */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card bodyStyle={{ padding: '16px' }}>
            <Space>
              <AuditOutlined style={{ fontSize: 24, color: '#1e3a5f' }} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>Audit Trail</div>
                <div style={{ color: '#64748b', fontSize: 13 }}>Module 11: 21 CFR Part 11 Compliant</div>
              </div>
            </Space>
          </Card>
        </Col>
        <Col span={16}>
          <Card bodyStyle={{ padding: '16px', display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 12, flex: 1, flexWrap: 'wrap' }}>
              <Select
                placeholder="Filter by Entity"
                style={{ width: 160 }}
                allowClear
                value={filters.entity}
                onChange={(v) => setFilters({ ...filters, entity: v })}
                options={uniqueEntities.map(e => ({ value: e, label: e }))}
              />
              <Select
                placeholder="Filter by User"
                style={{ width: 180 }}
                allowClear
                value={filters.user}
                onChange={(v) => setFilters({ ...filters, user: v })}
                options={uniqueUsers.map(u => ({ value: u, label: u }))}
              />
              <Select
                placeholder="Filter by Action"
                style={{ width: 160 }}
                allowClear
                value={filters.action}
                onChange={(v) => setFilters({ ...filters, action: v })}
                options={uniqueActions.map(a => ({ value: a, label: a.replace(/_/g, ' ') }))}
              />
              <Button icon={<ClearOutlined />} onClick={clearFilters}>
                Clear
              </Button>
            </div>
            <Button icon={<DownloadOutlined />}>Export</Button>
          </Card>
        </Col>
      </Row>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card style={{ borderTop: '3px solid #1e3a5f' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: '#64748b', fontSize: 12 }}>Total Entries</div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{entries.length}</div>
              </div>
              <AuditOutlined style={{ fontSize: 32, color: '#1e3a5f', opacity: 0.2 }} />
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderTop: '3px solid #14b8a6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: '#64748b', fontSize: 12 }}>AI Actions</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#14b8a6' }}>{aiActions}</div>
              </div>
              <RobotOutlined style={{ fontSize: 32, color: '#14b8a6', opacity: 0.2 }} />
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderTop: '3px solid #3b82f6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: '#64748b', fontSize: 12 }}>Human Actions</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#3b82f6' }}>{humanActions}</div>
              </div>
              <UserOutlined style={{ fontSize: 32, color: '#3b82f6', opacity: 0.2 }} />
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderTop: '3px solid #22c55e' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: '#64748b', fontSize: 12 }}>Today</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#22c55e' }}>{todayActions}</div>
              </div>
              <Badge count={todayActions} style={{ backgroundColor: '#22c55e' }} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Audit Table */}
      <Card
        title={
          <Space>
            <AuditOutlined />
            Audit Log
            <Tag>{entries.length} records</Tag>
          </Space>
        }
        bodyStyle={{ padding: 0 }}
      >
        <Table
          loading={loading}
          dataSource={entries}
          columns={columns}
          rowKey={(r) => `${r.timestamp}-${r.entity_id}-${r.action}`}
          size="small"
          scroll={{ x: 1400 }}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `Total ${t} entries` }}
          rowClassName={(r) => r.user === 'AI-System' ? 'row-ai' : ''}
        />
      </Card>

      <style>{`
        .row-ai { background-color: rgba(20, 184, 166, 0.05) !important; }
      `}</style>
    </div>
  );
};

export default AuditTrailPage;
