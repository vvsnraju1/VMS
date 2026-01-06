/**
 * Design Specification (DS) Management Page
 * Module 5: Technical design details (optional, risk-based)
 */
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card, Row, Col, Table, Tag, Button, Modal, Form, Input, Select,
  Space, Descriptions, Badge, Tooltip, message, Alert, Drawer, Divider
} from 'antd';
import {
  ToolOutlined, PlusOutlined, CheckCircleOutlined, RobotOutlined,
  FileTextOutlined, LinkOutlined, EyeOutlined, AuditOutlined
} from '@ant-design/icons';
import { dsApi, fsApi, projectsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { DesignSpecification, FunctionalSpecification, ValidationProject, DSStatus, FSStatus } from '../types';

const { TextArea } = Input;

const DSPage: React.FC = () => {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const [projects, setProjects] = useState<ValidationProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(projectId || null);
  const [dsList, setDsList] = useState<DesignSpecification[]>([]);
  const [fsList, setFsList] = useState<FunctionalSpecification[]>([]);
  const [selectedDS, setSelectedDS] = useState<DesignSpecification | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
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
      const [ds, fs] = await Promise.all([
        dsApi.getByProject(selectedProject!),
        fsApi.getByProject(selectedProject!)
      ]);
      setDsList(ds);
      setFsList(fs);
    } catch {
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      await dsApi.create({
        fs_id: values.fs_id,
        title: values.title,
        description: values.description,
        technical_details: values.technical_details || '',
        data_structures: values.data_structures || '',
        interfaces: values.interfaces || '',
      }, user!.email, user!.role);
      message.success('Design Specification created');
      setModalVisible(false);
      form.resetFields();
      loadData();
    } catch (err: any) {
      message.error(err.response?.data?.detail || 'FS must be approved first');
    }
  };

  const handleApprove = async (ds: DesignSpecification) => {
    try {
      await dsApi.approve(ds.id, 'DS reviewed and approved', user!.email, user!.role);
      message.success('DS approved');
      loadData();
      if (selectedDS?.id === ds.id) {
        setSelectedDS({ ...ds, status: 'Approved' as DSStatus });
      }
    } catch {
      message.error('Only QA can approve');
    }
  };

  const getLinkedFS = (fsId: string) => fsList.find(f => f.id === fsId);

  const statusColors: Record<DSStatus, string> = {
    Draft: 'default',
    'Under Review': 'processing',
    Approved: 'success',
  };

  const approvedFS = fsList.filter(f => f.status === 'Approved');

  const stats = {
    total: dsList.length,
    approved: dsList.filter(d => d.status === 'Approved').length,
    draft: dsList.filter(d => d.status === 'Draft').length,
  };

  return (
    <div>
      {/* Header */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card bodyStyle={{ padding: '16px' }}>
            <Space>
              <ToolOutlined style={{ fontSize: 24, color: '#0ea5e9' }} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>Design Specifications</div>
                <div style={{ color: '#64748b', fontSize: 13 }}>Module 5: Technical design details</div>
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
              onChange={(v) => { setSelectedProject(v); setSelectedDS(null); }}
              options={projects.map(p => ({ value: p.id, label: `${p.id}: ${p.name}` }))}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card bodyStyle={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <Badge count={stats.total} style={{ backgroundColor: '#0ea5e9' }}><Tag>Total</Tag></Badge>
              <Badge count={stats.approved} style={{ backgroundColor: '#22c55e' }}><Tag>Approved</Tag></Badge>
              <Badge count={stats.draft} style={{ backgroundColor: '#94a3b8' }}><Tag>Draft</Tag></Badge>
            </Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => setModalVisible(true)}
              disabled={approvedFS.length === 0}
            >
              New DS
            </Button>
          </Card>
        </Col>
      </Row>

      {approvedFS.length === 0 && (
        <Alert
          type="warning"
          message="No Approved Functional Specifications"
          description="Design Specifications can only be created for approved FS items. Please approve at least one FS first."
          style={{ marginBottom: 24 }}
          showIcon
        />
      )}

      <Row gutter={16}>
        {/* DS List */}
        <Col span={selectedDS ? 14 : 24}>
          <Card title="Design Specifications" loading={loading}>
            <Table
              dataSource={dsList}
              rowKey="id"
              size="middle"
              onRow={(record) => ({
                onClick: () => setSelectedDS(record),
                style: { cursor: 'pointer', background: selectedDS?.id === record.id ? '#e0f7fa' : undefined },
              })}
              scroll={{ x: 800 }}
              columns={[
                { 
                  title: 'DS ID', 
                  dataIndex: 'id', 
                  width: 100,
                  fixed: 'left' as const,
                  render: (id: string) => <Tag color="cyan">{id}</Tag>
                },
                { 
                  title: 'Title', 
                  dataIndex: 'title', 
                  width: 250,
                  ellipsis: true,
                },
                { 
                  title: 'Linked FS', 
                  dataIndex: 'fs_id', 
                  width: 110,
                  render: (id: string) => {
                    const fs = getLinkedFS(id);
                    return (
                      <Tooltip title={fs?.title}>
                        <Tag color="purple" icon={<LinkOutlined />}>{id}</Tag>
                      </Tooltip>
                    );
                  }
                },
                { 
                  title: 'Status', 
                  dataIndex: 'status', 
                  width: 120,
                  render: (s: DSStatus) => <Tag color={statusColors[s]}>{s}</Tag>
                },
                { 
                  title: 'Version', 
                  dataIndex: 'version', 
                  width: 80 
                },
                {
                  title: 'AI',
                  width: 50,
                  render: (_, ds) => ds.ai_generated && (
                    <Tooltip title="AI Generated">
                      <RobotOutlined style={{ color: '#14b8a6' }} />
                    </Tooltip>
                  ),
                },
                {
                  title: 'Actions',
                  width: 100,
                  fixed: 'right' as const,
                  render: (_, ds) => (
                    <Button 
                      size="small" 
                      icon={<EyeOutlined />}
                      onClick={(e) => { e.stopPropagation(); setSelectedDS(ds); setDrawerVisible(true); }}
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
        {selectedDS && !drawerVisible && (
          <Col span={10}>
            <Card
              title={
                <Space>
                  <ToolOutlined style={{ color: '#0ea5e9' }} />
                  {selectedDS.id}
                </Space>
              }
              extra={
                <Space>
                  {selectedDS.status !== 'Approved' && user?.role === 'QA' && (
                    <Button size="small" type="primary" onClick={() => handleApprove(selectedDS)} icon={<CheckCircleOutlined />}>
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
                <Descriptions.Item label="Title">{selectedDS.title}</Descriptions.Item>
                <Descriptions.Item label="Linked FS">
                  <Tag color="purple" icon={<LinkOutlined />}>{selectedDS.fs_id}</Tag>
                  <span style={{ marginLeft: 8, color: '#64748b' }}>
                    {getLinkedFS(selectedDS.fs_id)?.title}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={statusColors[selectedDS.status]}>{selectedDS.status}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Version">{selectedDS.version}</Descriptions.Item>
              </Descriptions>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Description</div>
                <div style={{ 
                  fontSize: 14, 
                  color: '#334155', 
                  whiteSpace: 'pre-wrap',
                  maxHeight: 150,
                  overflow: 'auto',
                  padding: 12,
                  background: '#f8fafc',
                  borderRadius: 8
                }}>
                  {selectedDS.description}
                </div>
              </div>

              {(selectedDS.technical_details || selectedDS.technical_design) && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Technical Details</div>
                  <div style={{ fontSize: 14, color: '#334155', whiteSpace: 'pre-wrap' }}>{selectedDS.technical_details || selectedDS.technical_design}</div>
                </div>
              )}

              {selectedDS.data_structures && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Data Structures</div>
                  <pre style={{ 
                    fontSize: 12, 
                    background: '#1e293b', 
                    color: '#e2e8f0', 
                    padding: 12, 
                    borderRadius: 8,
                    overflow: 'auto'
                  }}>
                    {selectedDS.data_structures}
                  </pre>
                </div>
              )}

              {selectedDS.interfaces && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Interfaces</div>
                  <div style={{ fontSize: 14, color: '#334155' }}>{selectedDS.interfaces}</div>
                </div>
              )}

              {selectedDS.ai_generated && (
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

      {/* Create DS Modal */}
      <Modal
        title={
          <Space>
            <ToolOutlined style={{ color: '#0ea5e9' }} />
            Create Design Specification
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="fs_id" label="Link to Approved FS" rules={[{ required: true }]}>
            <Select
              placeholder="Select an approved FS"
              options={approvedFS.map(f => ({ 
                value: f.id, 
                label: `${f.id}: ${f.title}` 
              }))}
            />
          </Form.Item>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input placeholder="DS title" />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="Design specification overview..." />
          </Form.Item>
          <Form.Item name="technical_details" label="Technical Details">
            <TextArea rows={4} placeholder="Implementation details, algorithms, etc..." />
          </Form.Item>
          <Form.Item name="data_structures" label="Data Structures">
            <TextArea rows={3} placeholder="Database schemas, data models, etc..." />
          </Form.Item>
          <Form.Item name="interfaces" label="Interfaces">
            <TextArea rows={3} placeholder="API specifications, integration points..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* DS Detail Drawer */}
      <Drawer
        title={
          <Space>
            <ToolOutlined style={{ color: '#0ea5e9' }} />
            Design Specification
            {selectedDS && <Tag color="cyan">{selectedDS.id}</Tag>}
          </Space>
        }
        placement="right"
        width={700}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        extra={
          selectedDS?.status !== 'Approved' && user?.role === 'QA' ? (
            <Button type="primary" onClick={() => selectedDS && handleApprove(selectedDS)} icon={<CheckCircleOutlined />}>
              Approve
            </Button>
          ) : (
            <Tag color="blue">Read-Only</Tag>
          )
        }
      >
        {selectedDS && (
          <>
            <Descriptions column={1} bordered size="middle">
              <Descriptions.Item label="DS ID">
                <Tag color="cyan" style={{ fontSize: 14 }}>{selectedDS.id}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Title">{selectedDS.title}</Descriptions.Item>
              <Descriptions.Item label="Linked FS">
                <Space>
                  <Tag color="purple" icon={<LinkOutlined />}>{selectedDS.fs_id}</Tag>
                  <span>{getLinkedFS(selectedDS.fs_id)?.title}</span>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={statusColors[selectedDS.status]}>{selectedDS.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Version">{selectedDS.version}</Descriptions.Item>
            </Descriptions>

            <Divider>Description</Divider>
            <Card size="small">
              <div style={{ whiteSpace: 'pre-wrap' }}>{selectedDS.description}</div>
            </Card>

            {(selectedDS.technical_details || selectedDS.technical_design) && (
              <>
                <Divider>Technical Details</Divider>
                <Card size="small">
                  <div style={{ whiteSpace: 'pre-wrap' }}>{selectedDS.technical_details || selectedDS.technical_design}</div>
                </Card>
              </>
            )}

            {selectedDS.data_structures && (
              <>
                <Divider>Data Structures</Divider>
                <Card size="small" style={{ background: '#1e293b' }}>
                  <pre style={{ color: '#e2e8f0', margin: 0, overflow: 'auto' }}>
                    {selectedDS.data_structures}
                  </pre>
                </Card>
              </>
            )}

            {selectedDS.interfaces && (
              <>
                <Divider>Interfaces</Divider>
                <Card size="small">
                  <div style={{ whiteSpace: 'pre-wrap' }}>{selectedDS.interfaces}</div>
                </Card>
              </>
            )}

            <Divider>Metadata</Divider>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Created By">{selectedDS.created_by}</Descriptions.Item>
              <Descriptions.Item label="Created At">
                {new Date(selectedDS.created_at).toLocaleString()}
              </Descriptions.Item>
              {selectedDS.approved_by && (
                <>
                  <Descriptions.Item label="Approved By">{selectedDS.approved_by}</Descriptions.Item>
                  <Descriptions.Item label="Approved At">
                    {selectedDS.approved_at && new Date(selectedDS.approved_at).toLocaleString()}
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>

            {selectedDS.ai_generated && (
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

export default DSPage;

