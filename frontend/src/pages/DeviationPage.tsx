/**
 * Deviation & CAPA Management Page
 * Module 8: Control failures and ensure remediation
 */
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card, Row, Col, Table, Tag, Button, Modal, Form, Input, Select,
  Space, Tabs, Badge, message, Descriptions, Timeline, Steps, Tooltip, Alert
} from 'antd';
import {
  WarningOutlined, BugOutlined, CheckCircleOutlined, SearchOutlined,
  SolutionOutlined, SafetyCertificateOutlined, RobotOutlined, PlusOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { deviationApi, projectsApi, executionApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Deviation, ValidationProject, TestExecution, DeviationStatus, RiskLevel } from '../types';

const { TextArea } = Input;

const DeviationPage: React.FC = () => {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const [projects, setProjects] = useState<ValidationProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(projectId || null);
  const [deviations, setDeviations] = useState<Deviation[]>([]);
  const [executions, setExecutions] = useState<TestExecution[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDev, setSelectedDev] = useState<Deviation | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [form] = Form.useForm();

  useEffect(() => { loadProjects(); }, []);
  useEffect(() => { if (selectedProject) loadData(); }, [selectedProject]);

  const loadProjects = async () => {
    const data = await projectsApi.getAll();
    setProjects(data);
    if (!selectedProject && data.length > 0) setSelectedProject(data[0].id);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [devs, execs] = await Promise.all([
        deviationApi.getByProject(selectedProject!),
        executionApi.getByProject(selectedProject!),
      ]);
      setDeviations(devs);
      setExecutions(execs.filter(e => e.result === 'Fail'));
    } catch {
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      await deviationApi.create({
        test_execution_id: values.test_execution_id,
        deviation_type: values.deviation_type,
        severity: values.severity,
        title: values.title,
        description: values.description,
        root_cause: '',
        capa_corrective: '',
        capa_preventive: '',
      }, user!.email, user!.role);
      message.success('Deviation created');
      setModalVisible(false);
      form.resetFields();
      loadData();
    } catch {
      message.error('Failed to create deviation');
    }
  };

  const handleAISuggest = async (dev: Deviation) => {
    try {
      const result = await deviationApi.aiRootCause(dev.id);
      setAiSuggestion(result);
    } catch {
      message.error('Failed to get AI suggestion');
    }
  };

  const statusColors: Record<DeviationStatus, string> = {
    Open: 'error',
    Investigating: 'processing',
    'CAPA Assigned': 'warning',
    'CAPA Verified': 'cyan',
    Closed: 'success',
  };

  const severityColors: Record<RiskLevel, string> = {
    Low: 'success',
    Medium: 'warning',
    High: 'error',
    Critical: 'magenta',
  };

  const statusStep: Record<DeviationStatus, number> = {
    Open: 0,
    Investigating: 1,
    'CAPA Assigned': 2,
    'CAPA Verified': 3,
    Closed: 4,
  };

  const openCount = deviations.filter(d => d.status !== 'Closed').length;

  return (
    <div>
      {/* Header */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card bodyStyle={{ padding: '16px' }}>
            <Space>
              <WarningOutlined style={{ fontSize: 24, color: '#ef4444' }} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>Deviation & CAPA Management</div>
                <div style={{ color: '#64748b', fontSize: 13 }}>Module 8: Control failures and remediation</div>
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
            style={{ borderTop: openCount > 0 ? '3px solid #ef4444' : '3px solid #22c55e' }}
          >
            <div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Open Deviations</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: openCount > 0 ? '#ef4444' : '#22c55e' }}>
                {openCount}
              </div>
            </div>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
              Log Deviation
            </Button>
          </Card>
        </Col>
      </Row>

      {/* Summary Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {Object.entries(
          deviations.reduce((acc, d) => {
            acc[d.status] = (acc[d.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        ).map(([status, count]) => (
          <Col key={status} span={4}>
            <Card size="small">
              <Badge status={statusColors[status as DeviationStatus] as any} text={status} />
              <div style={{ fontSize: 20, fontWeight: 600, marginTop: 4 }}>{count}</div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Deviations Table */}
      <Card title="Deviations">
        <Table
          loading={loading}
          dataSource={deviations}
          rowKey="id"
          columns={[
            { title: 'ID', dataIndex: 'id', width: 100 },
            { title: 'Title', dataIndex: 'title', ellipsis: true },
            {
              title: 'Severity',
              dataIndex: 'severity',
              width: 100,
              render: (s: RiskLevel) => <Tag color={severityColors[s]}>{s}</Tag>,
            },
            {
              title: 'Status',
              dataIndex: 'status',
              width: 140,
              render: (s: DeviationStatus) => <Tag color={statusColors[s]}>{s}</Tag>,
            },
            { title: 'Assigned To', dataIndex: 'assigned_to', width: 150, ellipsis: true },
            {
              title: 'CAPA Due',
              dataIndex: 'capa_due_date',
              width: 110,
              render: (d: string) => d ? (
                <Tooltip title={d}>
                  <ClockCircleOutlined /> {new Date(d).toLocaleDateString()}
                </Tooltip>
              ) : '-',
            },
            {
              title: 'AI',
              dataIndex: 'root_cause_ai_suggested',
              width: 50,
              render: (v: boolean) => v && <RobotOutlined style={{ color: '#14b8a6' }} />,
            },
            {
              title: 'Actions',
              width: 100,
              render: (_, dev) => (
                <Button size="small" onClick={() => { setSelectedDev(dev); setDetailVisible(true); }}>
                  View
                </Button>
              ),
            },
          ]}
        />
      </Card>

      {/* Create Modal */}
      <Modal
        title="Log New Deviation"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="test_execution_id" label="Related Test Execution" rules={[{ required: true }]}>
            <Select
              placeholder="Select failed test execution"
              options={executions.map(e => ({ value: e.id, label: `${e.id} - ${e.test_case_id}` }))}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="deviation_type" label="Type" rules={[{ required: true }]}>
                <Select options={[
                  { value: 'Test Failure', label: 'Test Failure' },
                  { value: 'Process', label: 'Process Deviation' },
                  { value: 'Documentation', label: 'Documentation Issue' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="severity" label="Severity" rules={[{ required: true }]}>
                <Select options={[
                  { value: 'Critical', label: 'Critical' },
                  { value: 'High', label: 'High' },
                  { value: 'Medium', label: 'Medium' },
                  { value: 'Low', label: 'Low' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input placeholder="Brief deviation title" />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="Detailed description of the deviation" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title={
          <Space>
            <BugOutlined />
            {selectedDev?.id}: {selectedDev?.title}
          </Space>
        }
        open={detailVisible}
        onCancel={() => { setDetailVisible(false); setSelectedDev(null); setAiSuggestion(null); }}
        footer={null}
        width={800}
      >
        {selectedDev && (
          <div>
            <Steps
              current={statusStep[selectedDev.status]}
              size="small"
              style={{ marginBottom: 24 }}
              items={[
                { title: 'Open', icon: <WarningOutlined /> },
                { title: 'Investigating', icon: <SearchOutlined /> },
                { title: 'CAPA Assigned', icon: <SolutionOutlined /> },
                { title: 'CAPA Verified', icon: <SafetyCertificateOutlined /> },
                { title: 'Closed', icon: <CheckCircleOutlined /> },
              ]}
            />

            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Severity">
                <Tag color={severityColors[selectedDev.severity]}>{selectedDev.severity}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={statusColors[selectedDev.status]}>{selectedDev.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Type">{selectedDev.deviation_type}</Descriptions.Item>
              <Descriptions.Item label="Created By">{selectedDev.created_by}</Descriptions.Item>
              <Descriptions.Item label="Description" span={2}>
                {selectedDev.description}
              </Descriptions.Item>
            </Descriptions>

            <Card
              title="Root Cause Analysis"
              style={{ marginTop: 16 }}
              extra={
                !selectedDev.root_cause && (
                  <Button
                    icon={<RobotOutlined />}
                    onClick={() => handleAISuggest(selectedDev)}
                    type="primary"
                    ghost
                  >
                    AI Suggest
                  </Button>
                )
              }
            >
              {aiSuggestion && (
                <Alert
                  type="info"
                  style={{ marginBottom: 16 }}
                  message={
                    <Space>
                      <RobotOutlined style={{ color: '#14b8a6' }} />
                      AI Suggested Root Cause (Confidence: {(aiSuggestion.confidence * 100).toFixed(0)}%)
                    </Space>
                  }
                  description={
                    <div>
                      <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{aiSuggestion.suggested_root_cause}</pre>
                      <div style={{ marginTop: 8 }}>
                        <strong>Suggested Category:</strong> {aiSuggestion.suggested_category}
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <strong>Suggested CAPA:</strong>
                        <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{aiSuggestion.suggested_capa}</pre>
                      </div>
                    </div>
                  }
                />
              )}
              {selectedDev.root_cause ? (
                <div>
                  <div><strong>Category:</strong> {selectedDev.root_cause_category}</div>
                  <div style={{ marginTop: 8 }}>{selectedDev.root_cause}</div>
                </div>
              ) : (
                <div style={{ color: '#94a3b8' }}>Not yet analyzed</div>
              )}
            </Card>

            <Card title="CAPA" style={{ marginTop: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Corrective Action</div>
                  <div>{selectedDev.capa_corrective || <span style={{ color: '#94a3b8' }}>Not assigned</span>}</div>
                </Col>
                <Col span={12}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Preventive Action</div>
                  <div>{selectedDev.capa_preventive || <span style={{ color: '#94a3b8' }}>Not assigned</span>}</div>
                </Col>
              </Row>
              {selectedDev.capa_due_date && (
                <div style={{ marginTop: 16 }}>
                  <strong>Due Date:</strong> {selectedDev.capa_due_date}
                </div>
              )}
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DeviationPage;

