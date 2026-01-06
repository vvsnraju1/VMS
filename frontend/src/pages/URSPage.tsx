/**
 * URS Management Page - Enhanced
 * Module 3, 4 & 5: Requirements, Risk Assessment & Specifications
 */
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card, Row, Col, Table, Tag, Button, Modal, Form, Input, Select,
  Space, Descriptions, Badge, Tooltip, message, Spin, Alert, Progress,
  Tabs, Drawer, Divider, List
} from 'antd';
import {
  FileTextOutlined, PlusOutlined, CheckCircleOutlined, RobotOutlined,
  ExclamationCircleOutlined, SafetyCertificateOutlined, ThunderboltOutlined,
  WarningOutlined, BulbOutlined, AuditOutlined, LinkOutlined, EyeOutlined
} from '@ant-design/icons';
import { ursApi, projectsApi, fsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Requirement, ValidationProject, RiskLevel, URSStatus, FSStatus, AIRiskResponse, AIAmbiguityResponse, AISuggestFSResponse, FunctionalSpecification } from '../types';

const { TextArea } = Input;

const URSPage: React.FC = () => {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const [projects, setProjects] = useState<ValidationProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(projectId || null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [fsList, setFsList] = useState<FunctionalSpecification[]>([]);
  const [selectedURS, setSelectedURS] = useState<Requirement | null>(null);
  const [selectedFS, setSelectedFS] = useState<FunctionalSpecification | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [aiRisk, setAiRisk] = useState<AIRiskResponse | null>(null);
  const [aiAmbiguity, setAiAmbiguity] = useState<AIAmbiguityResponse | null>(null);
  const [aiFS, setAiFS] = useState<AISuggestFSResponse | null>(null);
  const [fsModalVisible, setFsModalVisible] = useState(false);
  const [fsDrawerVisible, setFsDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('urs');
  const [form] = Form.useForm();
  const [fsForm] = Form.useForm();

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
      const [ursData, fsData] = await Promise.all([
        ursApi.getByProject(selectedProject!),
        fsApi.getByProject(selectedProject!)
      ]);
      setRequirements(ursData);
      setFsList(fsData);
    } catch {
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      await ursApi.create(selectedProject!, {
        category: values.category,
        title: values.title,
        description: values.description,
        acceptance_criteria: values.acceptance_criteria || '',
        gxp_impact: values.gxp_impact,
        patient_safety_risk: values.patient_safety_risk || 'Low',
        product_quality_risk: values.product_quality_risk || 'Low',
        data_integrity_risk: values.data_integrity_risk || 'Low',
      }, user!.email, user!.role);
      message.success('Requirement created');
      setModalVisible(false);
      form.resetFields();
      loadData();
    } catch {
      message.error('Failed to create');
    }
  };

  const handleApprove = async (urs: Requirement) => {
    try {
      await ursApi.approve(urs.id, 'Requirement reviewed and approved', user!.email, user!.role);
      message.success('Requirement approved');
      loadData();
      if (selectedURS?.id === urs.id) {
        const updated = await ursApi.getById(urs.id);
        setSelectedURS(updated);
      }
    } catch {
      message.error('Only QA can approve. Cannot self-approve.');
    }
  };

  const handleAIRisk = async (urs: Requirement) => {
    try {
      const result = await ursApi.aiRisk(urs.id);
      setAiRisk(result);
    } catch {
      message.error('Failed to analyze risk');
    }
  };

  const handleAmbiguity = async (urs: Requirement) => {
    try {
      const result = await ursApi.aiAmbiguity(urs.id);
      setAiAmbiguity(result);
    } catch {
      message.error('Failed to check ambiguity');
    }
  };

  const handleAISuggestFS = async (urs: Requirement) => {
    try {
      const result = await ursApi.aiSuggestFS(urs.id);
      setAiFS(result);
      fsForm.setFieldsValue({
        title: result.suggested_title,
        description: result.suggested_description,
        technical_approach: result.suggested_approach,
      });
      setFsModalVisible(true);
    } catch {
      message.error('Failed to generate FS');
    }
  };

  const handleCreateFS = async (values: any) => {
    if (!selectedURS) return;
    try {
      await fsApi.create({
        urs_id: selectedURS.id,
        title: values.title,
        description: values.description,
        technical_approach: values.technical_approach || '',
      }, user!.email, user!.role);
      message.success('Functional Specification created');
      setFsModalVisible(false);
      fsForm.resetFields();
      setAiFS(null);
      loadData();
    } catch (err: any) {
      message.error(err.response?.data?.detail || 'URS must be approved first');
    }
  };

  const applyAIRisk = async () => {
    if (!selectedURS || !aiRisk) return;
    try {
      await ursApi.applyRisk(
        selectedURS.id,
        aiRisk.gxp_impact,
        aiRisk.patient_safety_risk,
        aiRisk.product_quality_risk,
        aiRisk.data_integrity_risk,
        user!.email, user!.role
      );
      message.success('Risk assessment applied');
      loadData();
      const updated = await ursApi.getById(selectedURS.id);
      setSelectedURS(updated);
      setAiRisk(null);
    } catch {
      message.error('Failed to apply');
    }
  };

  const handleApproveFS = async (fs: FunctionalSpecification) => {
    try {
      await fsApi.approve(fs.id, 'Functional Specification reviewed and approved', user!.email, user!.role);
      message.success('FS approved');
      loadData();
      if (selectedFS?.id === fs.id) {
        const updated = fsList.find(f => f.id === fs.id);
        if (updated) setSelectedFS({ ...updated, status: 'Approved' as FSStatus });
      }
    } catch {
      message.error('Only QA can approve');
    }
  };

  const getLinkedFS = (ursId: string) => {
    return fsList.filter(fs => fs.urs_id === ursId);
  };

  const statusColors: Record<URSStatus, string> = {
    Draft: 'default',
    'Under Review': 'processing',
    Approved: 'success',
    Obsolete: 'error',
  };

  const fsStatusColors: Record<FSStatus, string> = {
    Draft: 'default',
    'Under Review': 'processing',
    Approved: 'success',
  };

  const riskColors: Record<RiskLevel, string> = {
    Low: 'success',
    Medium: 'warning',
    High: 'error',
    Critical: 'magenta',
  };

  const stats = {
    total: requirements.length,
    approved: requirements.filter(r => r.status === 'Approved').length,
    highRisk: requirements.filter(r => r.overall_risk === 'High' || r.overall_risk === 'Critical').length,
    totalFS: fsList.length,
    approvedFS: fsList.filter(f => f.status === 'Approved').length,
  };

  return (
    <div>
      {/* Header */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card bodyStyle={{ padding: '16px' }}>
            <Space>
              <FileTextOutlined style={{ fontSize: 24, color: '#3b82f6' }} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>Requirements & Specifications</div>
                <div style={{ color: '#64748b', fontSize: 13 }}>Modules 3, 4 & 5: URS + Risk + FS</div>
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
              onChange={(v) => { setSelectedProject(v); setSelectedURS(null); setSelectedFS(null); }}
              options={projects.map(p => ({ value: p.id, label: `${p.id}: ${p.name}` }))}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card bodyStyle={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <Badge count={stats.total} style={{ backgroundColor: '#3b82f6' }}><Tag>URS</Tag></Badge>
              <Badge count={stats.totalFS} style={{ backgroundColor: '#8b5cf6' }}><Tag>FS</Tag></Badge>
              <Badge count={stats.highRisk} style={{ backgroundColor: '#ef4444' }}><Tag>High Risk</Tag></Badge>
            </Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
              New URS
            </Button>
          </Card>
        </Col>
      </Row>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'urs',
            label: (
              <span>
                <FileTextOutlined />
                User Requirements ({stats.total})
              </span>
            ),
            children: (
              <Row gutter={16}>
                {/* Requirements List */}
                <Col span={selectedURS ? 14 : 24}>
                  <Card title="Requirements" loading={loading}>
            <Table
              dataSource={requirements}
              rowKey="id"
              size="small"
              onRow={(record) => ({
                onClick: () => { setSelectedURS(record); setAiRisk(null); setAiAmbiguity(null); },
                style: { cursor: 'pointer', background: selectedURS?.id === record.id ? '#e0f2fe' : undefined },
              })}
              columns={[
                { title: 'ID', dataIndex: 'id', width: 90 },
                { title: 'Title', dataIndex: 'title', ellipsis: true },
                { title: 'Category', dataIndex: 'category', width: 100, render: (c: string) => <Tag>{c}</Tag> },
                { title: 'Risk', dataIndex: 'overall_risk', width: 80, render: (r: RiskLevel) => <Tag color={riskColors[r]}>{r}</Tag> },
                { title: 'Status', dataIndex: 'status', width: 100, render: (s: URSStatus) => <Tag color={statusColors[s]}>{s}</Tag> },
                {
                  title: 'AI',
                  width: 40,
                  render: (_, r) => r.ai_suggested && <Tooltip title="AI Suggested"><RobotOutlined style={{ color: '#14b8a6' }} /></Tooltip>,
                },
              ]}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>

        {/* Detail Panel */}
        {selectedURS && (
          <Col span={10}>
            <Card
              title={
                <Space>
                  <FileTextOutlined />
                  {selectedURS.id}
                </Space>
              }
              extra={
                <Space>
                  {selectedURS.status !== 'Approved' && user?.role === 'QA' && (
                    <Button size="small" type="primary" onClick={() => handleApprove(selectedURS)} icon={<CheckCircleOutlined />}>
                      Approve
                    </Button>
                  )}
                </Space>
              }
              style={{ position: 'sticky', top: 16 }}
            >
              <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="Title" span={2}>{selectedURS.title}</Descriptions.Item>
                <Descriptions.Item label="Category">{selectedURS.category}</Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={statusColors[selectedURS.status]}>{selectedURS.status}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="GxP Impact">
                  <Tag color={selectedURS.gxp_impact ? 'red' : 'default'}>{selectedURS.gxp_impact ? 'Yes' : 'No'}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Overall Risk">
                  <Tag color={riskColors[selectedURS.overall_risk]}>{selectedURS.overall_risk}</Tag>
                </Descriptions.Item>
              </Descriptions>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Description</div>
                <div style={{ fontSize: 13, color: '#334155' }}>{selectedURS.description}</div>
              </div>

              {selectedURS.acceptance_criteria && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Acceptance Criteria</div>
                  <div style={{ fontSize: 13, color: '#334155' }}>{selectedURS.acceptance_criteria}</div>
                </div>
              )}

              {/* Risk Breakdown */}
              <Card size="small" title="Risk Assessment" style={{ marginBottom: 16 }}>
                <Row gutter={8}>
                  <Col span={8}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Patient Safety</div>
                    <Tag color={riskColors[selectedURS.patient_safety_risk]}>{selectedURS.patient_safety_risk}</Tag>
                  </Col>
                  <Col span={8}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Product Quality</div>
                    <Tag color={riskColors[selectedURS.product_quality_risk]}>{selectedURS.product_quality_risk}</Tag>
                  </Col>
                  <Col span={8}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Data Integrity</div>
                    <Tag color={riskColors[selectedURS.data_integrity_risk]}>{selectedURS.data_integrity_risk}</Tag>
                  </Col>
                </Row>
              </Card>

              {/* AI Actions */}
              <Card
                size="small"
                title={<><RobotOutlined style={{ color: '#14b8a6' }} /> AI Assistance</>}
                style={{ background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)' }}
              >
                <Space wrap>
                  <Button icon={<ThunderboltOutlined />} onClick={() => handleAIRisk(selectedURS)} size="small">
                    Suggest Risk
                  </Button>
                  <Button icon={<BulbOutlined />} onClick={() => handleAmbiguity(selectedURS)} size="small">
                    Check Ambiguity
                  </Button>
                  {selectedURS.status === 'Approved' && (
                    <Button icon={<FileTextOutlined />} onClick={() => handleAISuggestFS(selectedURS)} size="small" type="primary" ghost>
                      Generate FS
                    </Button>
                  )}
                </Space>

                {/* AI Risk Result */}
                {aiRisk && (
                  <Alert
                    type="info"
                    style={{ marginTop: 12 }}
                    message={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>AI Risk Suggestion ({(aiRisk.confidence * 100).toFixed(0)}% confidence)</span>
                        <Button size="small" type="primary" onClick={applyAIRisk}>Apply</Button>
                      </div>
                    }
                    description={
                      <div>
                        <div style={{ marginTop: 8 }}>
                          Overall: <Tag color={riskColors[aiRisk.overall_risk]}>{aiRisk.overall_risk}</Tag>
                        </div>
                        <div style={{ marginTop: 8, fontSize: 12 }}>{aiRisk.reason}</div>
                      </div>
                    }
                  />
                )}

                {/* AI Ambiguity Result */}
                {aiAmbiguity && (
                  <Alert
                    type={aiAmbiguity.ambiguity_score > 0.5 ? 'warning' : 'success'}
                    style={{ marginTop: 12 }}
                    message={`Ambiguity Score: ${(aiAmbiguity.ambiguity_score * 100).toFixed(0)}%`}
                    description={
                      aiAmbiguity.issues.length > 0 ? (
                        <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
                          {aiAmbiguity.issues.slice(0, 3).map((issue, i) => (
                            <li key={i} style={{ fontSize: 12 }}>
                              <strong>{issue.type}:</strong> "{issue.term}" - {issue.suggestion}
                            </li>
                          ))}
                        </ul>
                      ) : 'No significant ambiguity detected.'
                    }
                  />
                )}
              </Card>
            </Card>

              {/* Linked FS Section */}
              {selectedURS && getLinkedFS(selectedURS.id).length > 0 && (
                <Card 
                  size="small" 
                  title={<><AuditOutlined /> Linked Specifications ({getLinkedFS(selectedURS.id).length})</>}
                  style={{ marginTop: 16 }}
                >
                  <List
                    size="small"
                    dataSource={getLinkedFS(selectedURS.id)}
                    renderItem={(fs) => (
                      <List.Item
                        actions={[
                          <Button 
                            type="link" 
                            size="small" 
                            icon={<EyeOutlined />}
                            onClick={() => { setSelectedFS(fs); setFsDrawerVisible(true); }}
                          >
                            View
                          </Button>
                        ]}
                      >
                        <List.Item.Meta
                          title={
                            <Space>
                              <Tag color="purple">{fs.id}</Tag>
                              <span>{fs.title}</span>
                            </Space>
                          }
                          description={
                            <Tag color={fsStatusColors[fs.status]}>{fs.status}</Tag>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              )}
          </Col>
        )}
              </Row>
            ),
          },
          {
            key: 'fs',
            label: (
              <span>
                <AuditOutlined />
                Functional Specifications ({stats.totalFS})
              </span>
            ),
            children: (
              <Card title="Functional Specifications" loading={loading}>
                <Table
                  dataSource={fsList}
                  rowKey="id"
                  columns={[
                    { title: 'FS ID', dataIndex: 'id', width: 100 },
                    { title: 'Title', dataIndex: 'title', ellipsis: true },
                    { 
                      title: 'Linked URS', 
                      dataIndex: 'urs_id', 
                      width: 110,
                      render: (id: string) => (
                        <Button 
                          type="link" 
                          size="small"
                          onClick={() => {
                            const urs = requirements.find(r => r.id === id);
                            if (urs) {
                              setSelectedURS(urs);
                              setActiveTab('urs');
                            }
                          }}
                          icon={<LinkOutlined />}
                        >
                          {id}
                        </Button>
                      )
                    },
                    { 
                      title: 'Status', 
                      dataIndex: 'status', 
                      width: 120,
                      render: (s: FSStatus) => <Tag color={fsStatusColors[s]}>{s}</Tag>
                    },
                    { title: 'Version', dataIndex: 'version', width: 80 },
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
                      width: 150,
                      render: (_, fs) => (
                        <Space>
                          <Button 
                            size="small" 
                            icon={<EyeOutlined />}
                            onClick={() => { setSelectedFS(fs); setFsDrawerVisible(true); }}
                          >
                            View
                          </Button>
                          {fs.status !== 'Approved' && user?.role === 'QA' && (
                            <Button 
                              size="small" 
                              type="primary"
                              icon={<CheckCircleOutlined />}
                              onClick={() => handleApproveFS(fs)}
                            >
                              Approve
                            </Button>
                          )}
                        </Space>
                      ),
                    },
                  ]}
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            ),
          },
        ]}
      />

      {/* Create URS Modal */}
      <Modal
        title="Create Requirement"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="Category" rules={[{ required: true }]}>
                <Select options={[
                  { value: 'Functional', label: 'Functional' },
                  { value: 'Performance', label: 'Performance' },
                  { value: 'Security', label: 'Security' },
                  { value: 'Interface', label: 'Interface' },
                  { value: 'Data', label: 'Data' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="gxp_impact" label="GxP Impact" rules={[{ required: true }]}>
                <Select options={[
                  { value: true, label: 'Yes - GxP Critical' },
                  { value: false, label: 'No - Non-GxP' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input placeholder="Brief requirement title" />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="The system shall..." />
          </Form.Item>
          <Form.Item name="acceptance_criteria" label="Acceptance Criteria">
            <TextArea rows={2} placeholder="Measurable criteria for validation" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Create FS Modal */}
      <Modal
        title={
          <Space>
            <RobotOutlined style={{ color: '#14b8a6' }} />
            Create Functional Specification from AI Suggestion
          </Space>
        }
        open={fsModalVisible}
        onCancel={() => { setFsModalVisible(false); setAiFS(null); }}
        onOk={() => fsForm.submit()}
        width={700}
      >
        <Form form={fsForm} layout="vertical" onFinish={handleCreateFS}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <TextArea rows={10} />
          </Form.Item>
          <Form.Item name="technical_approach" label="Technical Approach">
            <TextArea rows={2} />
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
        width={650}
        onClose={() => { setFsDrawerVisible(false); setSelectedFS(null); }}
        open={fsDrawerVisible}
        extra={<Tag color="blue">Read-Only View</Tag>}
      >
        {selectedFS && (
          <>
            <Descriptions column={1} bordered size="middle">
              <Descriptions.Item label="FS ID">
                <Tag color="purple" style={{ fontSize: 14 }}>{selectedFS.id}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Title">{selectedFS.title}</Descriptions.Item>
              <Descriptions.Item label="Linked URS">
                <Button 
                  type="link" 
                  onClick={() => {
                    setFsDrawerVisible(false);
                    const urs = requirements.find(r => r.id === selectedFS.urs_id);
                    if (urs) {
                      setSelectedURS(urs);
                      setActiveTab('urs');
                    }
                  }}
                  icon={<LinkOutlined />}
                >
                  {selectedFS.urs_id}
                </Button>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={fsStatusColors[selectedFS.status]}>{selectedFS.status}</Tag>
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
                description="This specification was generated by AI and should be reviewed for accuracy."
                style={{ marginTop: 16 }}
              />
            )}

            {/* Approve Button in Drawer */}
            {selectedFS.status !== 'Approved' && user?.role === 'QA' && (
              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <Button 
                  type="primary" 
                  size="large"
                  icon={<CheckCircleOutlined />}
                  onClick={() => {
                    handleApproveFS(selectedFS);
                    setFsDrawerVisible(false);
                  }}
                >
                  Approve Functional Specification
                </Button>
              </div>
            )}
          </>
        )}
      </Drawer>
    </div>
  );
};

export default URSPage;
