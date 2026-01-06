/**
 * Functional Specification (FS) Management Page
 * Module 5: Define how requirements are implemented
 */
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card, Row, Col, Table, Tag, Button, Modal, Form, Input, Select,
  Space, Descriptions, Badge, Tooltip, message, Alert, Drawer, Divider
} from 'antd';
import {
  AuditOutlined, PlusOutlined, CheckCircleOutlined, RobotOutlined,
  FileTextOutlined, LinkOutlined, EyeOutlined, ExperimentOutlined
} from '@ant-design/icons';
import { fsApi, ursApi, projectsApi, testCaseApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { FunctionalSpecification, Requirement, ValidationProject, TestCase, FSStatus, RiskLevel } from '../types';

const { TextArea } = Input;

const FSPage: React.FC = () => {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const [projects, setProjects] = useState<ValidationProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(projectId || null);
  const [fsList, setFsList] = useState<FunctionalSpecification[]>([]);
  const [ursList, setUrsList] = useState<Requirement[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [selectedFS, setSelectedFS] = useState<FunctionalSpecification | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
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
      const [fs, urs, tc] = await Promise.all([
        fsApi.getByProject(selectedProject!),
        ursApi.getByProject(selectedProject!),
        testCaseApi.getByProject(selectedProject!)
      ]);
      setFsList(fs);
      setUrsList(urs);
      setTestCases(tc);
    } catch {
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      await fsApi.create({
        urs_id: values.urs_id,
        title: values.title,
        description: values.description,
        technical_approach: values.technical_approach || '',
      }, user!.email, user!.role);
      message.success('Functional Specification created');
      setModalVisible(false);
      form.resetFields();
      loadData();
    } catch (err: any) {
      message.error(err.response?.data?.detail || 'URS must be approved first');
    }
  };

  const handleApprove = async (fs: FunctionalSpecification) => {
    try {
      await fsApi.approve(fs.id, 'FS reviewed and approved', user!.email, user!.role);
      message.success('FS approved');
      loadData();
      if (selectedFS?.id === fs.id) {
        setSelectedFS({ ...fs, status: 'Approved' as FSStatus });
      }
    } catch {
      message.error('Only QA can approve');
    }
  };

  const handleAISuggestTC = async (fs: FunctionalSpecification) => {
    try {
      const suggestions = await fsApi.aiSuggestTC(fs.id);
      setAiSuggestions(suggestions);
      message.success(`AI generated ${suggestions.length} test case suggestions`);
    } catch {
      message.error('Failed to generate test cases');
    }
  };

  const getLinkedURS = (ursId: string) => ursList.find(u => u.id === ursId);
  const getLinkedTCs = (fsId: string) => testCases.filter(tc => tc.fs_id === fsId);

  const statusColors: Record<FSStatus, string> = {
    Draft: 'default',
    'Under Review': 'processing',
    Approved: 'success',
  };

  const approvedURS = ursList.filter(u => u.status === 'Approved');

  const stats = {
    total: fsList.length,
    approved: fsList.filter(f => f.status === 'Approved').length,
    draft: fsList.filter(f => f.status === 'Draft').length,
    withTC: fsList.filter(f => getLinkedTCs(f.id).length > 0).length,
  };

  return (
    <div>
      {/* Header */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card bodyStyle={{ padding: '16px' }}>
            <Space>
              <AuditOutlined style={{ fontSize: 24, color: '#8b5cf6' }} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>Functional Specifications</div>
                <div style={{ color: '#64748b', fontSize: 13 }}>Module 5: How requirements are implemented</div>
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
              onChange={(v) => { setSelectedProject(v); setSelectedFS(null); }}
              options={projects.map(p => ({ value: p.id, label: `${p.id}: ${p.name}` }))}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card bodyStyle={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <Badge count={stats.total} style={{ backgroundColor: '#8b5cf6' }}><Tag>Total</Tag></Badge>
              <Badge count={stats.approved} style={{ backgroundColor: '#22c55e' }}><Tag>Approved</Tag></Badge>
              <Badge count={stats.withTC} style={{ backgroundColor: '#f59e0b' }}><Tag>With TC</Tag></Badge>
            </Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => setModalVisible(true)}
              disabled={approvedURS.length === 0}
            >
              New FS
            </Button>
          </Card>
        </Col>
      </Row>

      {approvedURS.length === 0 && (
        <Alert
          type="warning"
          message="No Approved Requirements"
          description="Functional Specifications can only be created for approved URS items. Please approve at least one URS first."
          style={{ marginBottom: 24 }}
          showIcon
        />
      )}

      <Row gutter={16}>
        {/* FS List */}
        <Col span={selectedFS ? 14 : 24}>
          <Card title="Functional Specifications" loading={loading}>
            <Table
              dataSource={fsList}
              rowKey="id"
              size="middle"
              onRow={(record) => ({
                onClick: () => setSelectedFS(record),
                style: { cursor: 'pointer', background: selectedFS?.id === record.id ? '#f3e8ff' : undefined },
              })}
              scroll={{ x: 800 }}
              columns={[
                { 
                  title: 'FS ID', 
                  dataIndex: 'id', 
                  width: 100,
                  fixed: 'left' as const,
                  render: (id: string) => <Tag color="purple">{id}</Tag>
                },
                { 
                  title: 'Title', 
                  dataIndex: 'title', 
                  width: 250,
                  ellipsis: true,
                },
                { 
                  title: 'Linked URS', 
                  dataIndex: 'urs_id', 
                  width: 110,
                  render: (id: string) => {
                    const urs = getLinkedURS(id);
                    return (
                      <Tooltip title={urs?.title}>
                        <Tag color="blue" icon={<LinkOutlined />}>{id}</Tag>
                      </Tooltip>
                    );
                  }
                },
                { 
                  title: 'Status', 
                  dataIndex: 'status', 
                  width: 120,
                  render: (s: FSStatus) => <Tag color={statusColors[s]}>{s}</Tag>
                },
                { 
                  title: 'Test Cases', 
                  width: 100,
                  render: (_, fs) => {
                    const count = getLinkedTCs(fs.id).length;
                    return count > 0 ? (
                      <Tag color="orange" icon={<ExperimentOutlined />}>{count}</Tag>
                    ) : (
                      <Tag color="default">0</Tag>
                    );
                  }
                },
                { 
                  title: 'Version', 
                  dataIndex: 'version', 
                  width: 80 
                },
                {
                  title: 'AI',
                  width: 50,
                  render: (_, fs) => fs.ai_generated && (
                    <Tooltip title="AI Generated">
                      <RobotOutlined style={{ color: '#14b8a6' }} />
                    </Tooltip>
                  ),
                },
                {
                  title: 'Actions',
                  width: 100,
                  fixed: 'right' as const,
                  render: (_, fs) => (
                    <Button 
                      size="small" 
                      icon={<EyeOutlined />}
                      onClick={(e) => { e.stopPropagation(); setSelectedFS(fs); setDrawerVisible(true); }}
                    >
                      View
                    </Button>
                  ),
                },
              ]}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>

        {/* Detail Panel */}
        {selectedFS && !drawerVisible && (
          <Col span={10}>
            <Card
              title={
                <Space>
                  <AuditOutlined style={{ color: '#8b5cf6' }} />
                  {selectedFS.id}
                </Space>
              }
              extra={
                <Space>
                  {selectedFS.status !== 'Approved' && user?.role === 'QA' && (
                    <Button size="small" type="primary" onClick={() => handleApprove(selectedFS)} icon={<CheckCircleOutlined />}>
                      Approve
                    </Button>
                  )}
                  <Button size="small" onClick={() => setDrawerVisible(true)} icon={<EyeOutlined />}>
                    Full View
                  </Button>
                </Space>
              }
            >
              <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="Title">{selectedFS.title}</Descriptions.Item>
                <Descriptions.Item label="Linked URS">
                  <Tag color="blue" icon={<LinkOutlined />}>{selectedFS.urs_id}</Tag>
                  <span style={{ marginLeft: 8, color: '#64748b' }}>
                    {getLinkedURS(selectedFS.urs_id)?.title}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={statusColors[selectedFS.status]}>{selectedFS.status}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Version">{selectedFS.version}</Descriptions.Item>
              </Descriptions>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Description</div>
                <div style={{ 
                  fontSize: 14, 
                  color: '#334155', 
                  whiteSpace: 'pre-wrap',
                  maxHeight: 200,
                  overflow: 'auto',
                  padding: 12,
                  background: '#f8fafc',
                  borderRadius: 8
                }}>
                  {selectedFS.description}
                </div>
              </div>

              {selectedFS.technical_approach && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Technical Approach</div>
                  <div style={{ fontSize: 14, color: '#334155' }}>{selectedFS.technical_approach}</div>
                </div>
              )}

              {/* Linked Test Cases */}
              <Card size="small" title={<><ExperimentOutlined /> Linked Test Cases ({getLinkedTCs(selectedFS.id).length})</>}>
                {getLinkedTCs(selectedFS.id).length > 0 ? (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {getLinkedTCs(selectedFS.id).map(tc => (
                      <div key={tc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space>
                          <Tag color="orange">{tc.id}</Tag>
                          <span style={{ fontSize: 13 }}>{tc.title}</span>
                        </Space>
                        <Tag>{tc.test_type}</Tag>
                      </div>
                    ))}
                  </Space>
                ) : (
                  <div style={{ color: '#94a3b8', textAlign: 'center', padding: 16 }}>
                    No test cases linked yet
                  </div>
                )}
              </Card>

              {/* AI Actions */}
              {selectedFS.status === 'Approved' && (
                <Card
                  size="small"
                  title={<><RobotOutlined style={{ color: '#14b8a6' }} /> AI Assistance</>}
                  style={{ marginTop: 16, background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)' }}
                >
                  <Button 
                    icon={<ExperimentOutlined />} 
                    onClick={() => handleAISuggestTC(selectedFS)}
                    type="primary"
                    ghost
                  >
                    Generate Test Cases
                  </Button>
                  
                  {aiSuggestions.length > 0 && (
                    <Alert
                      type="info"
                      style={{ marginTop: 12 }}
                      message={`AI generated ${aiSuggestions.length} test case suggestions`}
                      description={
                        <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
                          {aiSuggestions.map((tc, i) => (
                            <li key={i} style={{ fontSize: 13 }}>
                              <strong>{tc.test_type}:</strong> {tc.title}
                            </li>
                          ))}
                        </ul>
                      }
                    />
                  )}
                </Card>
              )}

              {selectedFS.ai_generated && (
                <Alert
                  type="info"
                  icon={<RobotOutlined />}
                  message="AI-Generated Specification"
                  style={{ marginTop: 16 }}
                />
              )}
            </Card>
          </Col>
        )}
      </Row>

      {/* Create FS Modal */}
      <Modal
        title={
          <Space>
            <AuditOutlined style={{ color: '#8b5cf6' }} />
            Create Functional Specification
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="urs_id" label="Link to Approved URS" rules={[{ required: true }]}>
            <Select
              placeholder="Select an approved URS"
              options={approvedURS.map(u => ({ 
                value: u.id, 
                label: `${u.id}: ${u.title}` 
              }))}
            />
          </Form.Item>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input placeholder="FS title" />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <TextArea rows={6} placeholder="Detailed functional specification..." />
          </Form.Item>
          <Form.Item name="technical_approach" label="Technical Approach">
            <TextArea rows={3} placeholder="How this will be implemented..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* FS Detail Drawer */}
      <Drawer
        title={
          <Space>
            <AuditOutlined style={{ color: '#8b5cf6' }} />
            Functional Specification
            {selectedFS && <Tag color="purple">{selectedFS.id}</Tag>}
          </Space>
        }
        placement="right"
        width={700}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        extra={
          selectedFS?.status !== 'Approved' && user?.role === 'QA' ? (
            <Button type="primary" onClick={() => selectedFS && handleApprove(selectedFS)} icon={<CheckCircleOutlined />}>
              Approve
            </Button>
          ) : (
            <Tag color="blue">Read-Only</Tag>
          )
        }
      >
        {selectedFS && (
          <>
            <Descriptions column={1} bordered size="middle">
              <Descriptions.Item label="FS ID">
                <Tag color="purple" style={{ fontSize: 14 }}>{selectedFS.id}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Title">{selectedFS.title}</Descriptions.Item>
              <Descriptions.Item label="Linked URS">
                <Space>
                  <Tag color="blue" icon={<LinkOutlined />}>{selectedFS.urs_id}</Tag>
                  <span>{getLinkedURS(selectedFS.urs_id)?.title}</span>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={statusColors[selectedFS.status]}>{selectedFS.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Version">{selectedFS.version}</Descriptions.Item>
            </Descriptions>

            <Divider>Description</Divider>
            <Card size="small">
              <div style={{ whiteSpace: 'pre-wrap' }}>{selectedFS.description}</div>
            </Card>

            {selectedFS.technical_approach && (
              <>
                <Divider>Technical Approach</Divider>
                <Card size="small">
                  <div style={{ whiteSpace: 'pre-wrap' }}>{selectedFS.technical_approach}</div>
                </Card>
              </>
            )}

            <Divider>Linked Test Cases ({getLinkedTCs(selectedFS.id).length})</Divider>
            {getLinkedTCs(selectedFS.id).length > 0 ? (
              <Table
                dataSource={getLinkedTCs(selectedFS.id)}
                rowKey="id"
                size="small"
                pagination={false}
                columns={[
                  { title: 'TC ID', dataIndex: 'id', width: 90, render: (id: string) => <Tag color="orange">{id}</Tag> },
                  { title: 'Title', dataIndex: 'title', ellipsis: true },
                  { title: 'Type', dataIndex: 'test_type', width: 100, render: (t: string) => <Tag>{t}</Tag> },
                  { title: 'Priority', dataIndex: 'priority', width: 80 },
                ]}
              />
            ) : (
              <Alert type="warning" message="No test cases linked to this FS" />
            )}

            <Divider>Metadata</Divider>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Created By">{selectedFS.created_by}</Descriptions.Item>
              <Descriptions.Item label="Created At">
                {new Date(selectedFS.created_at).toLocaleString()}
              </Descriptions.Item>
              {selectedFS.approved_by && (
                <>
                  <Descriptions.Item label="Approved By">{selectedFS.approved_by}</Descriptions.Item>
                  <Descriptions.Item label="Approved At">
                    {selectedFS.approved_at && new Date(selectedFS.approved_at).toLocaleString()}
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>

            {selectedFS.ai_generated && (
              <Alert
                type="info"
                icon={<RobotOutlined />}
                message="AI-Generated Specification"
                style={{ marginTop: 16 }}
              />
            )}
          </>
        )}
      </Drawer>
    </div>
  );
};

export default FSPage;

