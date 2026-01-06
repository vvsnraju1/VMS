/**
 * Project Dashboard Page
 * Module 1: Validation Project Management
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Row, Col, Button, Modal, Form, Input, Select, Tag, Space,
  message, Spin, Badge, Progress, Tooltip, Dropdown
} from 'antd';
import {
  PlusOutlined, ProjectOutlined, RightOutlined, SafetyCertificateOutlined,
  ExperimentOutlined, WarningOutlined, CheckCircleOutlined,
  MoreOutlined, FileTextOutlined, NodeIndexOutlined, AuditOutlined
} from '@ant-design/icons';
import { projectsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { ValidationProject, ValidationProjectCreate, ProjectStatus, RiskLevel, SystemType, ValidationModel, ProjectType } from '../types';
import { REGULATIONS } from '../types';

const { TextArea } = Input;

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState<ValidationProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await projectsApi.getAll();
      setProjects(data);
    } catch {
      message.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: ValidationProjectCreate) => {
    try {
      await projectsApi.create(values, user!.email, user!.role);
      message.success('Project created successfully');
      setModalVisible(false);
      form.resetFields();
      loadProjects();
    } catch {
      message.error('Failed to create project');
    }
  };

  const statusColors: Record<ProjectStatus, string> = {
    Planning: 'default',
    URS: 'processing',
    FS: 'processing',
    DS: 'processing',
    Testing: 'warning',
    Completed: 'success',
    'On Hold': 'error',
  };

  const riskColors: Record<RiskLevel, string> = {
    Low: '#22c55e',
    Medium: '#f59e0b',
    High: '#ef4444',
    Critical: '#991b1b',
  };

  const getProgressPercent = (status: ProjectStatus) => {
    const stages: ProjectStatus[] = ['Planning', 'URS', 'FS', 'DS', 'Testing', 'Completed'];
    const idx = stages.indexOf(status);
    return Math.round((idx / (stages.length - 1)) * 100);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col flex="auto">
          <Card bodyStyle={{ padding: '16px' }}>
            <Space>
              <ProjectOutlined style={{ fontSize: 24, color: '#1e3a5f' }} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>Validation Projects</div>
                <div style={{ color: '#64748b', fontSize: 13 }}>Module 1: Project Management</div>
              </div>
            </Space>
          </Card>
        </Col>
        <Col>
          <Card bodyStyle={{ padding: '16px' }}>
            <Space>
              <Badge count={projects.filter(p => p.status !== 'Completed').length} style={{ backgroundColor: '#3b82f6' }}>
                <Tag>Active</Tag>
              </Badge>
              <Badge count={projects.filter(p => p.status === 'Completed').length} style={{ backgroundColor: '#22c55e' }}>
                <Tag>Completed</Tag>
              </Badge>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
                New Project
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Project Grid */}
      <Row gutter={[16, 16]}>
        {projects.map((project) => (
          <Col key={project.id} xs={24} sm={12} lg={8} xl={6}>
            <Card
              hoverable
              style={{
                borderRadius: '12px',
                overflow: 'hidden',
                borderTop: `4px solid ${riskColors[project.risk_level]}`,
              }}
              bodyStyle={{ padding: 0 }}
            >
              {/* Header */}
              <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Tag color={project.system_type === 'GxP' ? 'blue' : 'default'} style={{ marginBottom: 8 }}>
                      {project.system_type}
                    </Tag>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {project.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{project.id}</div>
                  </div>
                  <Dropdown
                    menu={{
                      items: [
                        { key: 'urs', icon: <FileTextOutlined />, label: 'URS Management', onClick: () => navigate(`/projects/${project.id}/urs`) },
                        { key: 'boundary', icon: <SafetyCertificateOutlined />, label: 'System Boundary', onClick: () => navigate(`/projects/${project.id}/boundary`) },
                        { key: 'tests', icon: <ExperimentOutlined />, label: 'Test Management', onClick: () => navigate(`/projects/${project.id}/tests`) },
                        { key: 'trace', icon: <NodeIndexOutlined />, label: 'Traceability', onClick: () => navigate(`/projects/${project.id}/traceability`) },
                        { key: 'vsr', icon: <AuditOutlined />, label: 'Generate VSR', onClick: () => navigate(`/projects/${project.id}/vsr`) },
                      ],
                    }}
                    trigger={['click']}
                  >
                    <Button type="text" icon={<MoreOutlined />} />
                  </Dropdown>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Status</span>
                  <Tag color={statusColors[project.status]}>{project.status}</Tag>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Risk Level</span>
                  <Tag style={{ color: riskColors[project.risk_level], borderColor: riskColors[project.risk_level] }}>
                    {project.risk_level}
                  </Tag>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Approach</span>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{project.validation_model}</span>
                </div>
                <Progress
                  percent={getProgressPercent(project.status)}
                  size="small"
                  strokeColor={project.status === 'Completed' ? '#22c55e' : '#3b82f6'}
                />
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: '12px 16px',
                  background: '#f8fafc',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Tooltip title={project.validation_lead || 'Not assigned'}>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>
                    Lead: {project.validation_lead?.split('@')[0] || 'N/A'}
                  </span>
                </Tooltip>
                <Button
                  type="link"
                  size="small"
                  onClick={() => navigate(`/projects/${project.id}/urs`)}
                  style={{ padding: 0 }}
                >
                  Open <RightOutlined />
                </Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Create Modal */}
      <Modal
        title={
          <Space>
            <ProjectOutlined />
            Create Validation Project
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="Project Name" rules={[{ required: true }]}>
            <Input placeholder="e.g., LIMS System Validation" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="project_type" label="Project Type" rules={[{ required: true }]}>
                <Select options={[
                  { value: 'New System', label: 'New System' },
                  { value: 'Change', label: 'Change' },
                  { value: 'Revalidation', label: 'Revalidation' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="system_type" label="System Classification" rules={[{ required: true }]}>
                <Select options={[
                  { value: 'GxP', label: 'GxP' },
                  { value: 'Non-GxP', label: 'Non-GxP' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="validation_model" label="Validation Approach" rules={[{ required: true }]}>
                <Select options={[
                  { value: 'V-Model', label: 'V-Model' },
                  { value: 'Agile CSV', label: 'Agile CSV' },
                ]} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="intended_use" label="Intended Use">
            <TextArea rows={2} placeholder="Describe the system's purpose and intended use" />
          </Form.Item>

          <Form.Item name="scope" label="Validation Scope">
            <TextArea rows={2} placeholder="Define what is included in validation scope" />
          </Form.Item>

          <Form.Item name="applicable_regulations" label="Applicable Regulations">
            <Select mode="multiple" placeholder="Select applicable regulations">
              {REGULATIONS.map(r => <Select.Option key={r} value={r}>{r}</Select.Option>)}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="risk_level" label="Initial Risk Level" rules={[{ required: true }]}>
                <Select options={[
                  { value: 'Low', label: 'Low' },
                  { value: 'Medium', label: 'Medium' },
                  { value: 'High', label: 'High' },
                  { value: 'Critical', label: 'Critical' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="validation_lead" label="Validation Lead">
                <Input placeholder="email@company.com" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="target_completion" label="Target Completion">
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default DashboardPage;
