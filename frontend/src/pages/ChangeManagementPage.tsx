/**
 * Change Control Management Page
 * Module 15: Change Impact Assessment
 */
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card, Row, Col, Table, Tag, Button, Modal, Form, Input, Select,
  Space, Badge, message, Descriptions, Steps, Timeline, Alert, Divider, Progress
} from 'antd';
import {
  SwapOutlined, FileTextOutlined, ExperimentOutlined, RobotOutlined,
  PlusOutlined, CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined,
  ThunderboltOutlined, AuditOutlined
} from '@ant-design/icons';
import { changeApi, projectsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { ChangeRequest, ValidationProject, ChangeStatus, ChangePriority, RiskLevel } from '../types';

const { TextArea } = Input;

const ChangeManagementPage: React.FC = () => {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const [projects, setProjects] = useState<ValidationProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(projectId || null);
  const [changes, setChanges] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedChange, setSelectedChange] = useState<ChangeRequest | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [aiImpact, setAiImpact] = useState<any>(null);
  const [form] = Form.useForm();

  useEffect(() => { loadProjects(); }, []);
  useEffect(() => { if (selectedProject) loadChanges(); }, [selectedProject]);

  const loadProjects = async () => {
    const data = await projectsApi.getAll();
    setProjects(data);
    if (!selectedProject && data.length > 0) setSelectedProject(data[0].id);
  };

  const loadChanges = async () => {
    setLoading(true);
    try {
      const data = await changeApi.getByProject(selectedProject!);
      setChanges(data);
    } catch {
      message.error('Failed to load changes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      await changeApi.create(selectedProject!, {
        title: values.title,
        description: values.description,
        change_type: values.change_type,
        priority: values.priority,
        justification: values.justification,
      }, user!.email, user!.role);
      message.success('Change request created');
      setModalVisible(false);
      form.resetFields();
      loadChanges();
    } catch {
      message.error('Failed to create');
    }
  };

  const handleAIImpact = async (cr: ChangeRequest) => {
    try {
      const result = await changeApi.aiImpact(cr.id);
      setAiImpact(result);
    } catch {
      message.error('Failed to analyze impact');
    }
  };

  const handleApprove = async () => {
    if (!selectedChange) return;
    try {
      await changeApi.approve(selectedChange.id, 'Change approved after impact review', user!.email, user!.role);
      message.success('Change approved');
      setDetailVisible(false);
      setSelectedChange(null);
      loadChanges();
    } catch {
      message.error('Only QA can approve');
    }
  };

  const statusColors: Record<ChangeStatus, string> = {
    Requested: 'default',
    'Impact Analysis': 'processing',
    Approved: 'success',
    Implementing: 'cyan',
    Completed: 'green',
    Rejected: 'error',
  };

  const priorityColors: Record<ChangePriority, string> = {
    Low: 'default',
    Medium: 'blue',
    High: 'orange',
    Urgent: 'red',
  };

  const statusStep: Record<ChangeStatus, number> = {
    Requested: 0,
    'Impact Analysis': 1,
    Approved: 2,
    Implementing: 3,
    Completed: 4,
    Rejected: -1,
  };

  const pendingCount = changes.filter(c => !['Completed', 'Rejected'].includes(c.status)).length;

  return (
    <div>
      {/* Header */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card bodyStyle={{ padding: '16px' }}>
            <Space>
              <SwapOutlined style={{ fontSize: 24, color: '#f59e0b' }} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>Change Control</div>
                <div style={{ color: '#64748b', fontSize: 13 }}>Module 15: Change Impact Assessment</div>
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
              onChange={setSelectedProject}
              options={projects.map(p => ({ value: p.id, label: `${p.id}: ${p.name}` }))}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card
            bodyStyle={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            style={{ borderTop: pendingCount > 0 ? '3px solid #f59e0b' : '3px solid #22c55e' }}
          >
            <div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Pending Changes</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: pendingCount > 0 ? '#f59e0b' : '#22c55e' }}>
                {pendingCount}
              </div>
            </div>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
              New Request
            </Button>
          </Card>
        </Col>
      </Row>

      {/* Change Requests Table */}
      <Card title="Change Requests">
        <Table
          loading={loading}
          dataSource={changes}
          rowKey="id"
          columns={[
            { title: 'CR ID', dataIndex: 'id', width: 100 },
            { title: 'Title', dataIndex: 'title', ellipsis: true },
            {
              title: 'Type',
              dataIndex: 'change_type',
              width: 120,
              render: (t: string) => <Tag>{t}</Tag>,
            },
            {
              title: 'Priority',
              dataIndex: 'priority',
              width: 100,
              render: (p: ChangePriority) => <Tag color={priorityColors[p]}>{p}</Tag>,
            },
            {
              title: 'Status',
              dataIndex: 'status',
              width: 140,
              render: (s: ChangeStatus) => <Tag color={statusColors[s]}>{s}</Tag>,
            },
            {
              title: 'Revalidation',
              dataIndex: 'revalidation_required',
              width: 110,
              render: (v: boolean) => (
                <Tag color={v ? 'warning' : 'default'}>{v ? 'Required' : 'No'}</Tag>
              ),
            },
            {
              title: 'Requested By',
              dataIndex: 'requested_by',
              width: 150,
              ellipsis: true,
            },
            {
              title: 'Actions',
              width: 100,
              render: (_, cr) => (
                <Button
                  size="small"
                  onClick={() => {
                    setSelectedChange(cr);
                    setDetailVisible(true);
                    setAiImpact(null);
                  }}
                >
                  Review
                </Button>
              ),
            },
          ]}
        />
      </Card>

      {/* Create Modal */}
      <Modal
        title="Submit Change Request"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input placeholder="Brief change request title" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="change_type" label="Type" rules={[{ required: true }]}>
                <Select options={[
                  { value: 'Enhancement', label: 'Enhancement' },
                  { value: 'Bug Fix', label: 'Bug Fix' },
                  { value: 'Regulatory', label: 'Regulatory' },
                  { value: 'Configuration', label: 'Configuration' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="Priority" rules={[{ required: true }]}>
                <Select options={[
                  { value: 'Urgent', label: 'Urgent' },
                  { value: 'High', label: 'High' },
                  { value: 'Medium', label: 'Medium' },
                  { value: 'Low', label: 'Low' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="Detailed description of the change" />
          </Form.Item>
          <Form.Item name="justification" label="Business Justification" rules={[{ required: true }]}>
            <TextArea rows={2} placeholder="Why is this change needed?" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail/Impact Modal */}
      <Modal
        title={
          <Space>
            <SwapOutlined />
            {selectedChange?.id}: {selectedChange?.title}
          </Space>
        }
        open={detailVisible}
        onCancel={() => { setDetailVisible(false); setSelectedChange(null); setAiImpact(null); }}
        width={900}
        footer={
          selectedChange?.status === 'Impact Analysis' && user?.role === 'QA' ? (
            <Space>
              <Button onClick={() => setDetailVisible(false)}>Close</Button>
              <Button type="primary" onClick={handleApprove} icon={<CheckCircleOutlined />}>
                Approve Change
              </Button>
            </Space>
          ) : null
        }
      >
        {selectedChange && (
          <div>
            <Steps
              current={statusStep[selectedChange.status] >= 0 ? statusStep[selectedChange.status] : 0}
              status={selectedChange.status === 'Rejected' ? 'error' : undefined}
              size="small"
              style={{ marginBottom: 24 }}
              items={[
                { title: 'Requested' },
                { title: 'Impact Analysis' },
                { title: 'Approved' },
                { title: 'Implementing' },
                { title: 'Completed' },
              ]}
            />

            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Type">
                <Tag>{selectedChange.change_type}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Priority">
                <Tag color={priorityColors[selectedChange.priority]}>{selectedChange.priority}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={statusColors[selectedChange.status]}>{selectedChange.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Risk Level">
                <Tag color={selectedChange.risk_level === 'High' ? 'error' : selectedChange.risk_level === 'Medium' ? 'warning' : 'default'}>
                  {selectedChange.risk_level}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Description" span={2}>
                {selectedChange.description}
              </Descriptions.Item>
              <Descriptions.Item label="Justification" span={2}>
                {selectedChange.justification}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            {/* AI Impact Analysis */}
            <Card
              title={
                <Space>
                  <ThunderboltOutlined style={{ color: '#f59e0b' }} />
                  Impact Analysis
                </Space>
              }
              extra={
                <Button
                  icon={<RobotOutlined />}
                  onClick={() => handleAIImpact(selectedChange)}
                  type="primary"
                  ghost
                >
                  AI Analyze Impact
                </Button>
              }
            >
              {aiImpact && (
                <Alert
                  type="info"
                  style={{ marginBottom: 16 }}
                  message={
                    <Space>
                      <RobotOutlined style={{ color: '#14b8a6' }} />
                      AI Impact Analysis Result
                    </Space>
                  }
                  description={
                    <Row gutter={24}>
                      <Col span={8}>
                        <div style={{ marginBottom: 8 }}>
                          <strong>Affected Requirements</strong>
                        </div>
                        {aiImpact.affected_urs.length > 0 ? (
                          aiImpact.affected_urs.map((id: string) => <Tag key={id} color="blue">{id}</Tag>)
                        ) : (
                          <span style={{ color: '#94a3b8' }}>None identified</span>
                        )}
                      </Col>
                      <Col span={8}>
                        <div style={{ marginBottom: 8 }}>
                          <strong>Affected Specifications</strong>
                        </div>
                        {aiImpact.affected_fs.length > 0 ? (
                          aiImpact.affected_fs.map((id: string) => <Tag key={id} color="purple">{id}</Tag>)
                        ) : (
                          <span style={{ color: '#94a3b8' }}>None identified</span>
                        )}
                      </Col>
                      <Col span={8}>
                        <div style={{ marginBottom: 8 }}>
                          <strong>Affected Test Cases</strong>
                        </div>
                        {aiImpact.affected_tc.length > 0 ? (
                          aiImpact.affected_tc.map((id: string) => <Tag key={id} color="orange">{id}</Tag>)
                        ) : (
                          <span style={{ color: '#94a3b8' }}>None identified</span>
                        )}
                      </Col>
                      <Col span={24} style={{ marginTop: 16 }}>
                        <Row gutter={16}>
                          <Col span={8}>
                            <Badge
                              status={aiImpact.revalidation_required ? 'warning' : 'success'}
                              text={aiImpact.revalidation_required ? 'Revalidation Required' : 'No Revalidation Needed'}
                            />
                          </Col>
                          <Col span={16}>
                            <strong>Estimated Effort:</strong> {aiImpact.estimated_effort}
                          </Col>
                        </Row>
                      </Col>
                    </Row>
                  }
                />
              )}

              {selectedChange.impact_assessment ? (
                <div>
                  <div><strong>Impact Assessment:</strong></div>
                  <div style={{ marginTop: 8 }}>{selectedChange.impact_assessment}</div>
                </div>
              ) : (
                <div style={{ color: '#94a3b8', textAlign: 'center', padding: 24 }}>
                  Impact analysis not yet performed. Use AI Analyze to get recommendations.
                </div>
              )}
            </Card>

            {/* Affected Items */}
            {(selectedChange.affected_urs.length > 0 || selectedChange.affected_fs.length > 0 || selectedChange.affected_tc.length > 0) && (
              <Card title="Affected Artifacts" style={{ marginTop: 16 }}>
                <Row gutter={24}>
                  <Col span={8}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>
                      <FileTextOutlined style={{ marginRight: 8 }} />
                      Requirements ({selectedChange.affected_urs.length})
                    </div>
                    {selectedChange.affected_urs.map(id => <Tag key={id}>{id}</Tag>)}
                  </Col>
                  <Col span={8}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>
                      <AuditOutlined style={{ marginRight: 8 }} />
                      Specifications ({selectedChange.affected_fs.length})
                    </div>
                    {selectedChange.affected_fs.map(id => <Tag key={id}>{id}</Tag>)}
                  </Col>
                  <Col span={8}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>
                      <ExperimentOutlined style={{ marginRight: 8 }} />
                      Test Cases ({selectedChange.affected_tc.length})
                    </div>
                    {selectedChange.affected_tc.map(id => <Tag key={id}>{id}</Tag>)}
                  </Col>
                </Row>
              </Card>
            )}

            {/* Revalidation */}
            {selectedChange.revalidation_required && (
              <Alert
                type="warning"
                style={{ marginTop: 16 }}
                icon={<ExclamationCircleOutlined />}
                message="Revalidation Required"
                description={selectedChange.revalidation_scope || 'Scope to be determined'}
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ChangeManagementPage;

