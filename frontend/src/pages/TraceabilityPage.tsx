/**
 * Traceability Matrix Page - Audit Grade
 * Module 9: End-to-end validation coverage with clickable navigation
 * Every ID is clickable and opens a detail drawer - Read-only, Inspection-ready
 */
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card, Row, Col, Table, Tag, Select, Space, message, Tooltip,
  Progress, Statistic, Badge, Alert, Button, Drawer, Descriptions, Divider
} from 'antd';
import {
  NodeIndexOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ExclamationCircleOutlined, MinusCircleOutlined, RobotOutlined,
  SafetyCertificateOutlined, FileTextOutlined, ExperimentOutlined,
  WarningOutlined, FilePdfOutlined, EyeOutlined, LinkOutlined,
  ClockCircleOutlined, UserOutlined, AuditOutlined
} from '@ant-design/icons';
import { traceabilityApi, projectsApi, aiApi, ursApi, fsApi, testCaseApi, executionApi, deviationApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type {
  TraceabilityRow, ValidationProject, TraceabilityStatus, AIConsistencyResponse,
  Requirement, FunctionalSpecification, TestCase, TestExecution, Deviation
} from '../types';

// Drawer types
type DrawerType = 'URS' | 'FS' | 'DS' | 'TC' | 'EXEC' | 'DEV' | null;

interface DrawerState {
  type: DrawerType;
  id: string | null;
  data: any;
  loading: boolean;
}

const TraceabilityPage: React.FC = () => {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const [projects, setProjects] = useState<ValidationProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(projectId || null);
  const [matrix, setMatrix] = useState<TraceabilityRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [consistency, setConsistency] = useState<AIConsistencyResponse | null>(null);
  
  // Drawer state
  const [drawer, setDrawer] = useState<DrawerState>({
    type: null,
    id: null,
    data: null,
    loading: false
  });

  useEffect(() => { loadProjects(); }, []);
  useEffect(() => { if (selectedProject) loadMatrix(); }, [selectedProject]);

  const loadProjects = async () => {
    const data = await projectsApi.getAll();
    setProjects(data);
    if (!selectedProject && data.length > 0) setSelectedProject(data[0].id);
  };

  const loadMatrix = async () => {
    setLoading(true);
    try {
      const data = await traceabilityApi.getMatrix(selectedProject!);
      setMatrix(data);
    } catch {
      message.error('Failed to load traceability matrix');
    } finally {
      setLoading(false);
    }
  };

  const runConsistencyCheck = async () => {
    try {
      const result = await aiApi.consistency(selectedProject!);
      setConsistency(result);
    } catch {
      message.error('Failed to run consistency check');
    }
  };

  // ==================== DRAWER HANDLERS ====================

  const openDrawer = async (type: DrawerType, id: string) => {
    if (!id) return;
    
    setDrawer({ type, id, data: null, loading: true });
    
    try {
      let data = null;
      switch (type) {
        case 'URS':
          data = await ursApi.getById(id);
          break;
        case 'FS':
          const fsList = await fsApi.getByProject(selectedProject!);
          data = fsList.find(f => f.id === id);
          break;
        case 'TC':
          const tcList = await testCaseApi.getByProject(selectedProject!);
          data = tcList.find(t => t.id === id);
          break;
        case 'EXEC':
          const execList = await executionApi.getByProject(selectedProject!);
          data = execList.find(e => e.id === id);
          break;
        case 'DEV':
          const devList = await deviationApi.getByProject(selectedProject!);
          data = devList.find(d => d.id === id);
          break;
        default:
          break;
      }
      setDrawer(prev => ({ ...prev, data, loading: false }));
    } catch {
      message.error(`Failed to load ${type} details`);
      setDrawer(prev => ({ ...prev, loading: false }));
    }
  };

  const closeDrawer = () => {
    setDrawer({ type: null, id: null, data: null, loading: false });
  };

  // Navigate to related item from within a drawer
  const navigateToRelated = (type: DrawerType, id: string) => {
    closeDrawer();
    setTimeout(() => openDrawer(type, id), 100);
  };

  // ==================== CLICKABLE ID RENDERER ====================

  const renderClickableId = (id: string | undefined | null, type: DrawerType, label?: string) => {
    if (!id) {
      return <Tag color="default" style={{ opacity: 0.5 }}>—</Tag>;
    }
    return (
      <Button
        type="link"
        size="small"
        onClick={() => openDrawer(type, id)}
        style={{ 
          padding: 0, 
          height: 'auto', 
          fontWeight: 600,
          fontSize: '14px'
        }}
        icon={<EyeOutlined style={{ fontSize: 12 }} />}
      >
        {label || id}
      </Button>
    );
  };

  const renderMissingTag = (label: string) => (
    <Tooltip title={`${label} not linked - traceability gap`}>
      <Tag color="error" icon={<ExclamationCircleOutlined />}>
        Missing
      </Tag>
    </Tooltip>
  );

  // ==================== STATUS HELPERS ====================

  const statusColors: Record<TraceabilityStatus, string> = {
    Complete: 'success',
    Partial: 'warning',
    'Not Started': 'default',
    Failed: 'error',
  };

  const statusIcons: Record<TraceabilityStatus, React.ReactNode> = {
    Complete: <CheckCircleOutlined style={{ color: '#22c55e' }} />,
    Partial: <ExclamationCircleOutlined style={{ color: '#f59e0b' }} />,
    'Not Started': <MinusCircleOutlined style={{ color: '#94a3b8' }} />,
    Failed: <CloseCircleOutlined style={{ color: '#ef4444' }} />,
  };

  const resultConfig: Record<string, { icon: React.ReactNode; color: string }> = {
    Pass: { icon: <CheckCircleOutlined />, color: '#22c55e' },
    Fail: { icon: <CloseCircleOutlined />, color: '#ef4444' },
    Blocked: { icon: <ExclamationCircleOutlined />, color: '#f59e0b' },
    'Not Executed': { icon: <MinusCircleOutlined />, color: '#94a3b8' },
  };

  // Statistics
  const stats = {
    total: new Set(matrix.map(r => r.urs_id)).size,
    complete: matrix.filter(r => r.status === 'Complete').length,
    partial: matrix.filter(r => r.status === 'Partial').length,
    notStarted: matrix.filter(r => r.status === 'Not Started').length,
    failed: matrix.filter(r => r.status === 'Failed').length,
  };

  const coverage = stats.total > 0 ? Math.round((stats.complete / stats.total) * 100) : 0;

  // ==================== TABLE COLUMNS ====================

  const columns = [
    {
      title: 'URS',
      children: [
        {
          title: 'ID',
          dataIndex: 'urs_id',
          width: 110,
          fixed: 'left' as const,
          render: (id: string) => renderClickableId(id, 'URS'),
        },
        {
          title: 'Title',
          dataIndex: 'urs_title',
          width: 200,
          ellipsis: true,
          render: (title: string) => (
            <Tooltip title={title}>
              <span>{title}</span>
            </Tooltip>
          ),
        },
        {
          title: 'Risk',
          dataIndex: 'urs_risk',
          width: 90,
          render: (r: string) => (
            <Tag color={r === 'High' || r === 'Critical' ? 'error' : r === 'Medium' ? 'warning' : 'success'}>
              {r}
            </Tag>
          ),
        },
      ],
    },
    {
      title: 'FS',
      children: [
        {
          title: 'ID',
          dataIndex: 'fs_id',
          width: 100,
          render: (id: string) => id ? renderClickableId(id, 'FS') : renderMissingTag('FS'),
        },
        {
          title: 'Status',
          dataIndex: 'fs_status',
          width: 100,
          render: (s: string) => s ? (
            <Tag color={s === 'Approved' ? 'success' : s === 'Under Review' ? 'processing' : 'default'}>
              {s}
            </Tag>
          ) : null,
        },
      ],
    },
    {
      title: 'DS',
      dataIndex: 'ds_id',
      width: 100,
      render: (id: string, row: TraceabilityRow) => {
        if (id) return renderClickableId(id, 'DS');
        // DS is optional, show as optional if FS exists
        if (row.fs_id) {
          return <Tag color="default" style={{ opacity: 0.6 }}>Optional</Tag>;
        }
        return <span style={{ color: '#d1d5db' }}>—</span>;
      },
    },
    {
      title: 'Test Case',
      children: [
        {
          title: 'ID',
          dataIndex: 'tc_id',
          width: 100,
          render: (id: string, row: TraceabilityRow) => {
            if (id) return renderClickableId(id, 'TC');
            if (row.fs_id) return renderMissingTag('TC');
            return <span style={{ color: '#d1d5db' }}>—</span>;
          },
        },
        {
          title: 'Type',
          dataIndex: 'tc_type',
          width: 110,
          render: (t: string) => t && <Tag>{t}</Tag>,
        },
      ],
    },
    {
      title: 'Execution',
      children: [
        {
          title: 'Result',
          dataIndex: 'exec_result',
          width: 110,
          render: (r: string, row: TraceabilityRow) => {
            if (!r && row.tc_id) {
              return renderMissingTag('Exec');
            }
            if (!r) return <span style={{ color: '#d1d5db' }}>—</span>;
            
            const info = resultConfig[r];
            return (
              <Button
                type="link"
                size="small"
                onClick={() => row.exec_id && openDrawer('EXEC', row.exec_id)}
                style={{ padding: 0 }}
              >
                <Tag color={info?.color || 'default'} icon={info?.icon}>
                  {r}
                </Tag>
              </Button>
            );
          },
        },
        {
          title: 'Date',
          dataIndex: 'exec_date',
          width: 110,
          render: (d: string) => d ? (
            <Tooltip title={new Date(d).toLocaleString()}>
              <span style={{ fontSize: 13 }}>{new Date(d).toLocaleDateString()}</span>
            </Tooltip>
          ) : null,
        },
      ],
    },
    {
      title: 'Deviation',
      dataIndex: 'deviation_id',
      width: 120,
      render: (id: string, row: TraceabilityRow) => id ? (
        <Space>
          {renderClickableId(id, 'DEV')}
          <Tag color={row.deviation_status === 'Closed' ? 'success' : 'error'} style={{ fontSize: 11 }}>
            {row.deviation_status}
          </Tag>
        </Space>
      ) : (
        row.exec_result === 'Fail' ? (
          <Tag color="warning" icon={<WarningOutlined />}>Expected</Tag>
        ) : null
      ),
    },
    {
      title: 'Chain Status',
      dataIndex: 'status',
      width: 130,
      fixed: 'right' as const,
      render: (s: TraceabilityStatus) => (
        <Space>
          {statusIcons[s]}
          <span style={{ 
            color: s === 'Complete' ? '#22c55e' : s === 'Failed' ? '#ef4444' : '#64748b',
            fontWeight: 500 
          }}>
            {s}
          </span>
        </Space>
      ),
    },
  ];

  // ==================== DRAWER CONTENT RENDERERS ====================

  const renderUrsDrawer = () => {
    const urs = drawer.data as Requirement;
    if (!urs) return null;
    
    return (
      <>
        <Descriptions column={1} bordered size="middle">
          <Descriptions.Item label="URS ID">
            <Tag color="blue" style={{ fontSize: 14 }}>{urs.id}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Title">{urs.title}</Descriptions.Item>
          <Descriptions.Item label="Category">
            <Tag>{urs.category}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Description">
            <div style={{ whiteSpace: 'pre-wrap' }}>{urs.description}</div>
          </Descriptions.Item>
          <Descriptions.Item label="Acceptance Criteria">
            {urs.acceptance_criteria || <span style={{ color: '#94a3b8' }}>Not specified</span>}
          </Descriptions.Item>
          <Descriptions.Item label="GxP Impact">
            <Tag color={urs.gxp_impact ? 'red' : 'default'}>
              {urs.gxp_impact ? 'Yes - GxP Critical' : 'No'}
            </Tag>
          </Descriptions.Item>
        </Descriptions>

        <Divider>Risk Assessment</Divider>
        
        <Row gutter={16}>
          <Col span={8}>
            <Card size="small">
              <Statistic 
                title="Patient Safety" 
                value={urs.patient_safety_risk}
                valueStyle={{ 
                  color: urs.patient_safety_risk === 'High' ? '#ef4444' : 
                         urs.patient_safety_risk === 'Medium' ? '#f59e0b' : '#22c55e',
                  fontSize: 18
                }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic 
                title="Product Quality" 
                value={urs.product_quality_risk}
                valueStyle={{ 
                  color: urs.product_quality_risk === 'High' ? '#ef4444' : 
                         urs.product_quality_risk === 'Medium' ? '#f59e0b' : '#22c55e',
                  fontSize: 18
                }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic 
                title="Data Integrity" 
                value={urs.data_integrity_risk}
                valueStyle={{ 
                  color: urs.data_integrity_risk === 'High' ? '#ef4444' : 
                         urs.data_integrity_risk === 'Medium' ? '#f59e0b' : '#22c55e',
                  fontSize: 18
                }}
              />
            </Card>
          </Col>
        </Row>

        <Divider>Status & Approval</Divider>
        
        <Descriptions column={2} size="small">
          <Descriptions.Item label="Status">
            <Tag color={urs.status === 'Approved' ? 'success' : 'default'}>{urs.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Overall Risk">
            <Tag color={urs.overall_risk === 'High' ? 'error' : urs.overall_risk === 'Medium' ? 'warning' : 'success'}>
              {urs.overall_risk}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Created By">{urs.created_by}</Descriptions.Item>
          <Descriptions.Item label="Created At">
            {new Date(urs.created_at).toLocaleString()}
          </Descriptions.Item>
          {urs.approved_by && (
            <>
              <Descriptions.Item label="Approved By">{urs.approved_by}</Descriptions.Item>
              <Descriptions.Item label="Approved At">
                {urs.approved_at && new Date(urs.approved_at).toLocaleString()}
              </Descriptions.Item>
            </>
          )}
        </Descriptions>

        {urs.ai_suggested && (
          <Alert
            type="info"
            icon={<RobotOutlined />}
            message="AI-Suggested Requirement"
            description={urs.ai_ambiguity_notes}
            style={{ marginTop: 16 }}
          />
        )}
      </>
    );
  };

  const renderFsDrawer = () => {
    const fs = drawer.data as FunctionalSpecification;
    if (!fs) return null;
    
    return (
      <>
        <Descriptions column={1} bordered size="middle">
          <Descriptions.Item label="FS ID">
            <Tag color="purple" style={{ fontSize: 14 }}>{fs.id}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Title">{fs.title}</Descriptions.Item>
          <Descriptions.Item label="Linked URS">
            <Button 
              type="link" 
              onClick={() => navigateToRelated('URS', fs.urs_id)}
              icon={<LinkOutlined />}
            >
              {fs.urs_id}
            </Button>
          </Descriptions.Item>
          <Descriptions.Item label="Description">
            <div style={{ whiteSpace: 'pre-wrap' }}>{fs.description}</div>
          </Descriptions.Item>
          <Descriptions.Item label="Technical Approach">
            {fs.technical_approach || <span style={{ color: '#94a3b8' }}>Not specified</span>}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={fs.status === 'Approved' ? 'success' : fs.status === 'Under Review' ? 'processing' : 'default'}>
              {fs.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Version">{fs.version}</Descriptions.Item>
        </Descriptions>

        <Divider>Metadata</Divider>

        <Descriptions column={2} size="small">
          <Descriptions.Item label="Created By">{fs.created_by}</Descriptions.Item>
          <Descriptions.Item label="Created At">
            {new Date(fs.created_at).toLocaleString()}
          </Descriptions.Item>
          {fs.approved_by && (
            <>
              <Descriptions.Item label="Approved By">{fs.approved_by}</Descriptions.Item>
              <Descriptions.Item label="Approved At">
                {fs.approved_at && new Date(fs.approved_at).toLocaleString()}
              </Descriptions.Item>
            </>
          )}
        </Descriptions>

        {fs.ai_generated && (
          <Alert
            type="info"
            icon={<RobotOutlined />}
            message="AI-Generated Specification"
            style={{ marginTop: 16 }}
          />
        )}
      </>
    );
  };

  const renderTcDrawer = () => {
    const tc = drawer.data as TestCase;
    if (!tc) return null;
    
    return (
      <>
        <Descriptions column={1} bordered size="middle">
          <Descriptions.Item label="Test Case ID">
            <Tag color="orange" style={{ fontSize: 14 }}>{tc.id}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Title">{tc.title}</Descriptions.Item>
          <Descriptions.Item label="Test Type">
            <Tag>{tc.test_type}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Priority">
            <Tag color={tc.priority === 'Critical' ? 'red' : tc.priority === 'High' ? 'orange' : 'blue'}>
              {tc.priority}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Description">{tc.description}</Descriptions.Item>
        </Descriptions>

        <Divider>Linked Requirements</Divider>
        
        <Space size="large">
          <div>
            <span style={{ color: '#64748b', marginRight: 8 }}>URS:</span>
            <Button type="link" onClick={() => navigateToRelated('URS', tc.urs_id)} icon={<LinkOutlined />}>
              {tc.urs_id}
            </Button>
          </div>
          <div>
            <span style={{ color: '#64748b', marginRight: 8 }}>FS:</span>
            <Button type="link" onClick={() => navigateToRelated('FS', tc.fs_id)} icon={<LinkOutlined />}>
              {tc.fs_id}
            </Button>
          </div>
        </Space>

        <Divider>Test Procedure</Divider>

        <Card size="small" title="Preconditions" style={{ marginBottom: 16 }}>
          <div style={{ whiteSpace: 'pre-wrap' }}>
            {tc.preconditions || <span style={{ color: '#94a3b8' }}>None specified</span>}
          </div>
        </Card>

        <Card size="small" title="Test Steps" style={{ marginBottom: 16 }}>
          <pre style={{ 
            margin: 0, 
            whiteSpace: 'pre-wrap', 
            fontFamily: 'inherit',
            background: '#f8fafc',
            padding: 12,
            borderRadius: 6
          }}>
            {tc.test_steps}
          </pre>
        </Card>

        <Card size="small" title="Expected Result">
          <div style={{ whiteSpace: 'pre-wrap' }}>{tc.expected_result}</div>
        </Card>

        {tc.ai_generated && (
          <Alert
            type="info"
            icon={<RobotOutlined />}
            message="AI-Generated Test Case"
            style={{ marginTop: 16 }}
          />
        )}
      </>
    );
  };

  const renderExecDrawer = () => {
    const exec = drawer.data as TestExecution;
    if (!exec) return null;
    
    const resultInfo = resultConfig[exec.result];
    
    return (
      <>
        <Descriptions column={1} bordered size="middle">
          <Descriptions.Item label="Execution ID">
            <Tag color="cyan" style={{ fontSize: 14 }}>{exec.id}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Test Case">
            <Button type="link" onClick={() => navigateToRelated('TC', exec.test_case_id)} icon={<LinkOutlined />}>
              {exec.test_case_id}
            </Button>
          </Descriptions.Item>
          <Descriptions.Item label="Result">
            <Tag color={resultInfo?.color} icon={resultInfo?.icon} style={{ fontSize: 14 }}>
              {exec.result}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Execution Cycle">
            <Tag>Cycle {exec.cycle}</Tag>
          </Descriptions.Item>
        </Descriptions>

        <Divider>Execution Details</Divider>

        <Descriptions column={2} size="small">
          <Descriptions.Item label={<><UserOutlined /> Executor</>}>
            {exec.executor}
          </Descriptions.Item>
          <Descriptions.Item label={<><ClockCircleOutlined /> Date</>}>
            {new Date(exec.execution_date).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Environment" span={2}>
            {exec.environment || <span style={{ color: '#94a3b8' }}>Not specified</span>}
          </Descriptions.Item>
        </Descriptions>

        <Card size="small" title="Actual Result" style={{ marginTop: 16, marginBottom: 16 }}>
          <div style={{ whiteSpace: 'pre-wrap' }}>
            {exec.actual_result || <span style={{ color: '#94a3b8' }}>Not recorded</span>}
          </div>
        </Card>

        <Card size="small" title="Evidence References">
          {exec.evidence_references && exec.evidence_references.length > 0 ? (
            <Space direction="vertical">
              {exec.evidence_references.map((ref, i) => (
                <Tag key={i} icon={<FileTextOutlined />}>{ref}</Tag>
              ))}
            </Space>
          ) : (
            <span style={{ color: '#94a3b8' }}>No evidence attached</span>
          )}
        </Card>

        {exec.comments && (
          <Card size="small" title="Comments" style={{ marginTop: 16 }}>
            {exec.comments}
          </Card>
        )}

        {exec.deviation_id && (
          <Alert
            type="error"
            icon={<WarningOutlined />}
            message="Deviation Raised"
            description={
              <Button type="link" onClick={() => navigateToRelated('DEV', exec.deviation_id!)}>
                View Deviation {exec.deviation_id}
              </Button>
            }
            style={{ marginTop: 16 }}
          />
        )}
      </>
    );
  };

  const renderDevDrawer = () => {
    const dev = drawer.data as Deviation;
    if (!dev) return null;
    
    return (
      <>
        <Descriptions column={1} bordered size="middle">
          <Descriptions.Item label="Deviation ID">
            <Tag color="red" style={{ fontSize: 14 }}>{dev.id}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Title">{dev.title}</Descriptions.Item>
          <Descriptions.Item label="Type">
            <Tag>{dev.deviation_type}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Severity">
            <Tag color={dev.severity === 'Critical' ? 'magenta' : dev.severity === 'High' ? 'red' : dev.severity === 'Medium' ? 'orange' : 'default'}>
              {dev.severity}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={dev.status === 'Closed' ? 'success' : dev.status === 'Open' ? 'error' : 'processing'}>
              {dev.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Description">
            <div style={{ whiteSpace: 'pre-wrap' }}>{dev.description}</div>
          </Descriptions.Item>
        </Descriptions>

        <Divider>Root Cause Analysis</Divider>

        <Descriptions column={1} size="small">
          <Descriptions.Item label="Root Cause Category">
            {dev.root_cause_category ? (
              <Tag>{dev.root_cause_category}</Tag>
            ) : (
              <span style={{ color: '#94a3b8' }}>Not determined</span>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Root Cause">
            {dev.root_cause ? (
              <div style={{ whiteSpace: 'pre-wrap' }}>{dev.root_cause}</div>
            ) : (
              <span style={{ color: '#94a3b8' }}>Investigation pending</span>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Investigation Summary">
            {dev.investigation_summary || <span style={{ color: '#94a3b8' }}>Not completed</span>}
          </Descriptions.Item>
        </Descriptions>

        <Divider>CAPA</Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Card size="small" title="Corrective Action">
              {dev.capa_corrective || <span style={{ color: '#94a3b8' }}>Not assigned</span>}
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" title="Preventive Action">
              {dev.capa_preventive || <span style={{ color: '#94a3b8' }}>Not assigned</span>}
            </Card>
          </Col>
        </Row>

        {dev.capa_due_date && (
          <Alert
            type={new Date(dev.capa_due_date) < new Date() ? 'error' : 'warning'}
            message={`CAPA Due Date: ${dev.capa_due_date}`}
            style={{ marginTop: 16 }}
          />
        )}

        <Divider>Effectiveness</Divider>

        <Descriptions column={1} size="small">
          <Descriptions.Item label="Effectiveness Criteria">
            {dev.effectiveness_criteria || <span style={{ color: '#94a3b8' }}>Not defined</span>}
          </Descriptions.Item>
          <Descriptions.Item label="Verified">
            <Tag color={dev.effectiveness_verified ? 'success' : 'default'}>
              {dev.effectiveness_verified ? 'Yes' : 'No'}
            </Tag>
          </Descriptions.Item>
          {dev.effectiveness_evidence && (
            <Descriptions.Item label="Evidence">
              {dev.effectiveness_evidence}
            </Descriptions.Item>
          )}
        </Descriptions>

        {dev.root_cause_ai_suggested && (
          <Alert
            type="info"
            icon={<RobotOutlined />}
            message="AI-Assisted Root Cause Analysis"
            style={{ marginTop: 16 }}
          />
        )}
      </>
    );
  };

  // ==================== DRAWER TITLE & CONTENT ====================

  const getDrawerTitle = () => {
    const icons: Record<string, React.ReactNode> = {
      URS: <FileTextOutlined />,
      FS: <AuditOutlined />,
      DS: <SafetyCertificateOutlined />,
      TC: <ExperimentOutlined />,
      EXEC: <CheckCircleOutlined />,
      DEV: <WarningOutlined />,
    };
    
    const titles: Record<string, string> = {
      URS: 'User Requirement Specification',
      FS: 'Functional Specification',
      DS: 'Design Specification',
      TC: 'Test Case',
      EXEC: 'Test Execution Record',
      DEV: 'Deviation & CAPA',
    };
    
    return (
      <Space>
        {drawer.type && icons[drawer.type]}
        <span>{drawer.type && titles[drawer.type]}</span>
        <Tag>{drawer.id}</Tag>
      </Space>
    );
  };

  const renderDrawerContent = () => {
    if (drawer.loading) {
      return <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>;
    }
    
    switch (drawer.type) {
      case 'URS': return renderUrsDrawer();
      case 'FS': return renderFsDrawer();
      case 'TC': return renderTcDrawer();
      case 'EXEC': return renderExecDrawer();
      case 'DEV': return renderDevDrawer();
      default: return null;
    }
  };

  // ==================== RENDER ====================

  return (
    <div>
      {/* Header */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card bodyStyle={{ padding: '16px' }}>
            <Space>
              <NodeIndexOutlined style={{ fontSize: 24, color: '#14b8a6' }} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>Traceability Matrix</div>
                <div style={{ color: '#64748b', fontSize: 13 }}>Module 9: Audit-Grade RTM</div>
              </div>
            </Space>
          </Card>
        </Col>
        <Col span={8}>
          <Card bodyStyle={{ padding: '16px' }}>
            <Select
              style={{ width: '100%' }}
              placeholder="Select project"
              value={selectedProject}
              onChange={(v) => { setSelectedProject(v); setConsistency(null); }}
              options={projects.map(p => ({ value: p.id, label: `${p.id}: ${p.name}` }))}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card bodyStyle={{ padding: '16px', display: 'flex', gap: 8 }}>
            <Button icon={<RobotOutlined />} onClick={runConsistencyCheck}>
              AI Consistency Check
            </Button>
            <Button icon={<FilePdfOutlined />}>Export RTM</Button>
          </Card>
        </Col>
      </Row>

      {/* Instructions Banner */}
      <Alert
        type="info"
        showIcon
        icon={<EyeOutlined />}
        message="Click any ID to view controlled record details"
        description="This is a read-only, inspection-ready view. All IDs are clickable and will open detail drawers."
        style={{ marginBottom: 24 }}
      />

      {/* Consistency Check Results */}
      {consistency && (
        <Alert
          type={consistency.score >= 80 ? 'success' : consistency.score >= 50 ? 'warning' : 'error'}
          style={{ marginBottom: 24 }}
          showIcon
          message={
            <Space>
              <RobotOutlined style={{ color: '#14b8a6' }} />
              AI Consistency Score: {consistency.score}%
            </Space>
          }
          description={
            consistency.issues.length > 0 ? (
              <div style={{ marginTop: 8 }}>
                <strong>Issues Found:</strong>
                <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
                  {consistency.issues.map((issue, i) => (
                    <li key={i} style={{ fontSize: 14 }}>
                      <Tag>{issue.entity_id}</Tag> {issue.issue_type}: {issue.description}
                      <span style={{ color: '#64748b', marginLeft: 8 }}>→ {issue.suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : 'No consistency issues found. All validation artifacts are properly linked.'
          }
        />
      )}

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card style={{ borderTop: '3px solid #14b8a6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: '#64748b', fontSize: 13 }}>Coverage</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#14b8a6' }}>{coverage}%</div>
              </div>
              <Progress
                type="circle"
                percent={coverage}
                width={60}
                strokeColor="#14b8a6"
                format={() => null}
              />
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Complete Chains"
              value={stats.complete}
              valueStyle={{ color: '#22c55e' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Partial / Not Started"
              value={stats.partial + stats.notStarted}
              valueStyle={{ color: '#f59e0b' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Failed"
              value={stats.failed}
              valueStyle={{ color: stats.failed > 0 ? '#ef4444' : '#22c55e' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Legend */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space size={24}>
              <span style={{ fontWeight: 600 }}>Legend:</span>
              <Space><FileTextOutlined style={{ color: '#3b82f6' }} /> URS</Space>
              <Space><AuditOutlined style={{ color: '#8b5cf6' }} /> FS</Space>
              <Space><SafetyCertificateOutlined style={{ color: '#06b6d4' }} /> DS (optional)</Space>
              <Space><ExperimentOutlined style={{ color: '#f59e0b' }} /> Test Case</Space>
              <Space><CheckCircleOutlined style={{ color: '#22c55e' }} /> Execution</Space>
              <Space><WarningOutlined style={{ color: '#ef4444' }} /> Deviation</Space>
            </Space>
          </Col>
          <Col>
            <Tag color="error" icon={<ExclamationCircleOutlined />}>Missing = Traceability Gap</Tag>
          </Col>
        </Row>
      </Card>

      {/* Matrix Table */}
      <Card title="Requirements Traceability Matrix (RTM)" bodyStyle={{ padding: 0 }}>
        <Table
          loading={loading}
          dataSource={matrix}
          columns={columns}
          rowKey={(r) => `${r.urs_id}-${r.fs_id || ''}-${r.tc_id || ''}-${r.exec_id || ''}`}
          scroll={{ x: 1400 }}
          size="middle"
          bordered
          pagination={{ pageSize: 15, showSizeChanger: true }}
          rowClassName={(r) => 
            r.status === 'Failed' ? 'row-failed' : 
            r.status === 'Complete' ? 'row-complete' : ''
          }
        />
      </Card>

      {/* Detail Drawer */}
      <Drawer
        title={getDrawerTitle()}
        placement="right"
        width={700}
        onClose={closeDrawer}
        open={drawer.type !== null}
        extra={
          <Tag color="blue">Read-Only View</Tag>
        }
      >
        {renderDrawerContent()}
      </Drawer>

      <style>{`
        .row-failed { background-color: #fef2f2 !important; }
        .row-complete { background-color: #f0fdf4 !important; }
      `}</style>
    </div>
  );
};

export default TraceabilityPage;
