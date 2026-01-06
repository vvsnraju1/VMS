/**
 * Test Management Page
 * Test Case and Test Execution Management (Modules 6 & 7)
 */
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card, Row, Col, Table, Tag, Button, Modal, Form, Input, Select,
  Space, Tabs, Badge, message, Empty, Descriptions, Progress, Tooltip
} from 'antd';
import {
  ExperimentOutlined, PlayCircleOutlined, CheckCircleOutlined,
  CloseCircleOutlined, PlusOutlined, RobotOutlined, FileTextOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { testCaseApi, executionApi, fsApi, projectsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { TestCase, TestExecution, FunctionalSpecification, ValidationProject, TestResult } from '../types';

const { TextArea } = Input;

const TestManagementPage: React.FC = () => {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const [projects, setProjects] = useState<ValidationProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(projectId || null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [executions, setExecutions] = useState<TestExecution[]>([]);
  const [fsList, setFsList] = useState<FunctionalSpecification[]>([]);
  const [loading, setLoading] = useState(false);
  const [tcModalVisible, setTcModalVisible] = useState(false);
  const [execModalVisible, setExecModalVisible] = useState(false);
  const [selectedTC, setSelectedTC] = useState<TestCase | null>(null);
  const [form] = Form.useForm();
  const [execForm] = Form.useForm();

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
      const [tc, ex, fs] = await Promise.all([
        testCaseApi.getByProject(selectedProject!),
        executionApi.getByProject(selectedProject!),
        fsApi.getByProject(selectedProject!),
      ]);
      setTestCases(tc);
      setExecutions(ex);
      setFsList(fs);
    } catch {
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTC = async (values: any) => {
    try {
      await testCaseApi.create({
        fs_id: values.fs_id,
        test_type: values.test_type,
        title: values.title,
        description: values.description,
        preconditions: values.preconditions || '',
        test_steps: values.test_steps,
        expected_result: values.expected_result,
        priority: values.priority,
      }, user!.email, user!.role);
      message.success('Test case created');
      setTcModalVisible(false);
      form.resetFields();
      loadData();
    } catch {
      message.error('Failed to create');
    }
  };

  const handleExecute = async (values: any) => {
    try {
      await executionApi.create({
        test_case_id: selectedTC!.id,
        result: values.result,
        actual_result: values.actual_result || '',
        evidence_references: values.evidence ? [values.evidence] : [],
        comments: values.comments || '',
        environment: values.environment || '',
      }, user!.email, user!.role);
      message.success('Test executed');
      setExecModalVisible(false);
      execForm.resetFields();
      setSelectedTC(null);
      loadData();
    } catch {
      message.error('Failed to execute');
    }
  };

  const getLatestExecution = (tcId: string) => {
    return executions.filter(e => e.test_case_id === tcId).sort((a, b) =>
      new Date(b.execution_date).getTime() - new Date(a.execution_date).getTime()
    )[0];
  };

  const stats = {
    total: testCases.length,
    passed: executions.filter(e => e.result === 'Pass').length,
    failed: executions.filter(e => e.result === 'Fail').length,
    blocked: executions.filter(e => e.result === 'Blocked').length,
    notExecuted: testCases.length - new Set(executions.map(e => e.test_case_id)).size,
  };

  const passRate = stats.total > 0 ? Math.round(stats.passed / Math.max(executions.filter(e => e.result !== 'Not Executed').length, 1) * 100) : 0;

  const resultColors: Record<TestResult, string> = {
    'Not Executed': 'default',
    Pass: 'success',
    Fail: 'error',
    Blocked: 'warning',
  };

  return (
    <div>
      {/* Header */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card bodyStyle={{ padding: '16px' }}>
            <Space>
              <ExperimentOutlined style={{ fontSize: 24, color: '#8b5cf6' }} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>Test Management</div>
                <div style={{ color: '#64748b', fontSize: 13 }}>Modules 6 & 7: Test Cases & Execution</div>
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
          <Card bodyStyle={{ padding: '16px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button icon={<PlusOutlined />} onClick={() => setTcModalVisible(true)} disabled={!selectedProject}>
              New Test Case
            </Button>
          </Card>
        </Col>
      </Row>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card style={{ borderTop: '3px solid #3b82f6' }}>
            <Statistic title="Total Test Cases" value={stats.total} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderTop: '3px solid #22c55e' }}>
            <Statistic
              title="Pass Rate"
              value={passRate}
              suffix="%"
              valueStyle={{ color: passRate >= 80 ? '#22c55e' : passRate >= 50 ? '#f59e0b' : '#ef4444' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderTop: '3px solid #ef4444' }}>
            <Statistic
              title="Failed Tests"
              value={stats.failed}
              valueStyle={{ color: stats.failed > 0 ? '#ef4444' : undefined }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderTop: '3px solid #f59e0b' }}>
            <Statistic title="Pending Execution" value={stats.notExecuted} prefix={<WarningOutlined />} />
          </Card>
        </Col>
      </Row>

      {/* Test Cases Table */}
      <Card
        title="Test Cases"
        extra={
          <Space>
            <Badge status="success" text={`${stats.passed} Passed`} />
            <Badge status="error" text={`${stats.failed} Failed`} />
            <Badge status="warning" text={`${stats.blocked} Blocked`} />
          </Space>
        }
      >
        <Table
          loading={loading}
          dataSource={testCases}
          rowKey="id"
          columns={[
            { title: 'TC ID', dataIndex: 'id', width: 100 },
            { title: 'Title', dataIndex: 'title' },
            { title: 'FS', dataIndex: 'fs_id', width: 100 },
            {
              title: 'Type',
              dataIndex: 'test_type',
              width: 120,
              render: (t: string) => <Tag>{t}</Tag>,
            },
            {
              title: 'Priority',
              dataIndex: 'priority',
              width: 100,
              render: (p: string) => (
                <Tag color={p === 'Critical' ? 'red' : p === 'High' ? 'orange' : p === 'Medium' ? 'blue' : 'default'}>
                  {p}
                </Tag>
              ),
            },
            {
              title: 'Status',
              key: 'status',
              width: 120,
              render: (_, tc) => {
                const exec = getLatestExecution(tc.id);
                return exec ? (
                  <Tag color={resultColors[exec.result]}>{exec.result}</Tag>
                ) : (
                  <Tag>Not Executed</Tag>
                );
              },
            },
            {
              title: 'AI',
              dataIndex: 'ai_generated',
              width: 60,
              render: (v: boolean) => v && <Tooltip title="AI Generated"><RobotOutlined style={{ color: '#14b8a6' }} /></Tooltip>,
            },
            {
              title: 'Actions',
              width: 120,
              render: (_, tc) => (
                <Button
                  size="small"
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={() => {
                    setSelectedTC(tc);
                    setExecModalVisible(true);
                  }}
                  disabled={user?.role !== 'Executor' && user?.role !== 'Admin'}
                >
                  Execute
                </Button>
              ),
            },
          ]}
          expandable={{
            expandedRowRender: (tc) => (
              <Descriptions size="small" column={2}>
                <Descriptions.Item label="Preconditions">{tc.preconditions || 'N/A'}</Descriptions.Item>
                <Descriptions.Item label="Expected Result">{tc.expected_result}</Descriptions.Item>
                <Descriptions.Item label="Test Steps" span={2}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{tc.test_steps}</pre>
                </Descriptions.Item>
              </Descriptions>
            ),
          }}
        />
      </Card>

      {/* Create Test Case Modal */}
      <Modal
        title="Create Test Case"
        open={tcModalVisible}
        onCancel={() => setTcModalVisible(false)}
        onOk={() => form.submit()}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateTC}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="fs_id" label="Functional Specification" rules={[{ required: true }]}>
                <Select
                  placeholder="Select FS"
                  options={fsList.map(fs => ({ value: fs.id, label: `${fs.id}: ${fs.title}` }))}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="test_type" label="Test Type" rules={[{ required: true }]}>
                <Select options={[
                  { value: 'Functional', label: 'Functional' },
                  { value: 'Negative', label: 'Negative' },
                  { value: 'Integration', label: 'Integration' },
                  { value: 'Performance', label: 'Performance' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="priority" label="Priority" rules={[{ required: true }]}>
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
            <Input placeholder="Test case title" />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <TextArea rows={2} placeholder="Brief description" />
          </Form.Item>
          <Form.Item name="preconditions" label="Preconditions">
            <TextArea rows={2} placeholder="Test preconditions" />
          </Form.Item>
          <Form.Item name="test_steps" label="Test Steps" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="1. Step one&#10;2. Step two" />
          </Form.Item>
          <Form.Item name="expected_result" label="Expected Result" rules={[{ required: true }]}>
            <TextArea rows={2} placeholder="Expected outcome" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Execute Test Modal */}
      <Modal
        title={`Execute Test: ${selectedTC?.id}`}
        open={execModalVisible}
        onCancel={() => { setExecModalVisible(false); setSelectedTC(null); }}
        onOk={() => execForm.submit()}
        width={600}
      >
        {selectedTC && (
          <div style={{ marginBottom: 16, padding: 12, background: '#f8fafc', borderRadius: 8 }}>
            <strong>{selectedTC.title}</strong>
            <div style={{ marginTop: 8, fontSize: 13, color: '#64748b' }}>
              <strong>Steps:</strong>
              <pre style={{ margin: '4px 0', whiteSpace: 'pre-wrap' }}>{selectedTC.test_steps}</pre>
            </div>
            <div style={{ fontSize: 13, color: '#64748b' }}>
              <strong>Expected:</strong> {selectedTC.expected_result}
            </div>
          </div>
        )}
        <Form form={execForm} layout="vertical" onFinish={handleExecute}>
          <Form.Item name="result" label="Result" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'Pass', label: <span style={{ color: '#22c55e' }}>✓ Pass</span> },
                { value: 'Fail', label: <span style={{ color: '#ef4444' }}>✗ Fail</span> },
                { value: 'Blocked', label: <span style={{ color: '#f59e0b' }}>⊘ Blocked</span> },
              ]}
            />
          </Form.Item>
          <Form.Item name="actual_result" label="Actual Result" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="Describe what actually happened" />
          </Form.Item>
          <Form.Item name="evidence" label="Evidence Reference">
            <Input placeholder="Screenshot filename or reference" />
          </Form.Item>
          <Form.Item name="environment" label="Test Environment">
            <Input placeholder="e.g., UAT Environment v2.1" />
          </Form.Item>
          <Form.Item name="comments" label="Comments">
            <TextArea rows={2} placeholder="Additional notes" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// Simple Statistic component
const Statistic: React.FC<{ title: string; value: number | string; prefix?: React.ReactNode; suffix?: string; valueStyle?: React.CSSProperties }> = ({ title, value, prefix, suffix, valueStyle }) => (
  <div>
    <div style={{ color: '#64748b', fontSize: 13 }}>{title}</div>
    <div style={{ fontSize: 24, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, ...valueStyle }}>
      {prefix} {value}{suffix}
    </div>
  </div>
);

export default TestManagementPage;

