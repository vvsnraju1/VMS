/**
 * System Boundary Management Page
 * Define in-scope/out-of-scope items, interfaces, and dependencies
 */
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card, Row, Col, Table, Tag, Button, Modal, Form, Input, Select,
  Space, Descriptions, Badge, Tooltip, message, Empty, Tabs, Switch
} from 'antd';
import {
  CheckCircleOutlined, CloseCircleOutlined, PlusOutlined,
  ApiOutlined, LinkOutlined, FileTextOutlined, SafetyCertificateOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { boundaryApi, projectsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { SystemBoundary, ValidationProject } from '../types';

const { TextArea } = Input;

const SystemBoundaryPage: React.FC = () => {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const [projects, setProjects] = useState<ValidationProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(projectId || null);
  const [boundary, setBoundary] = useState<SystemBoundary | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) loadBoundary();
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const data = await projectsApi.getAll();
      setProjects(data);
      if (!selectedProject && data.length > 0) {
        setSelectedProject(data[0].id);
      }
    } catch {
      message.error('Failed to load projects');
    }
  };

  const loadBoundary = async () => {
    setLoading(true);
    try {
      const data = await boundaryApi.get(selectedProject!);
      setBoundary(data);
    } catch {
      setBoundary(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      const sb = await boundaryApi.create(selectedProject!, {
        in_scope_items: values.inScope?.split('\n').filter(Boolean) || [],
        out_of_scope_items: values.outScope?.split('\n').filter(Boolean) || [],
        exclusion_justifications: [],
        interfaces: [],
        dependencies: [],
        sop_references: [],
      }, user!.email, user!.role);
      setBoundary(sb);
      setModalVisible(false);
      form.resetFields();
      message.success('System boundary created');
    } catch {
      message.error('Failed to create');
    }
  };

  const handleApprove = async () => {
    try {
      const updated = await boundaryApi.approve(boundary!.id, 'Boundary definition approved', user!.email, user!.role);
      setBoundary(updated);
      message.success('System boundary approved');
    } catch {
      message.error('Failed to approve');
    }
  };

  const currentProject = projects.find(p => p.id === selectedProject);

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card bodyStyle={{ padding: '16px' }}>
            <Space>
              <SafetyCertificateOutlined style={{ fontSize: 24, color: '#1e3a5f' }} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>System Boundary Definition</div>
                <div style={{ color: '#64748b', fontSize: 13 }}>Module 2: Define validation scope</div>
              </div>
            </Space>
          </Card>
        </Col>
        <Col span={12}>
          <Card bodyStyle={{ padding: '16px' }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Select
                style={{ width: 300 }}
                placeholder="Select project"
                value={selectedProject}
                onChange={setSelectedProject}
                options={projects.map(p => ({ value: p.id, label: `${p.id}: ${p.name}` }))}
              />
              {!boundary && (
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
                  Define Boundary
                </Button>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      {!selectedProject ? (
        <Empty description="Select a project to view system boundary" />
      ) : !boundary ? (
        <Card>
          <Empty description="No system boundary defined">
            <Button type="primary" onClick={() => setModalVisible(true)}>
              Create System Boundary
            </Button>
          </Empty>
        </Card>
      ) : (
        <>
          {/* Header Info */}
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={24} align="middle">
              <Col flex="auto">
                <Descriptions column={4} size="small">
                  <Descriptions.Item label="Project">{currentProject?.name}</Descriptions.Item>
                  <Descriptions.Item label="Boundary ID">{boundary.id}</Descriptions.Item>
                  <Descriptions.Item label="Version">{boundary.version}</Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Badge
                      status={boundary.status === 'Approved' ? 'success' : 'processing'}
                      text={boundary.status}
                    />
                  </Descriptions.Item>
                </Descriptions>
              </Col>
              <Col>
                {boundary.status !== 'Approved' && user?.role === 'QA' && (
                  <Button type="primary" onClick={handleApprove} icon={<CheckCircleOutlined />}>
                    Approve Boundary
                  </Button>
                )}
              </Col>
            </Row>
          </Card>

          <Tabs
            items={[
              {
                key: 'scope',
                label: (
                  <span>
                    <CheckCircleOutlined style={{ marginRight: 8 }} />
                    Scope Definition
                  </span>
                ),
                children: (
                  <Row gutter={16}>
                    <Col span={12}>
                      <Card
                        title={
                          <span style={{ color: '#22c55e' }}>
                            <CheckCircleOutlined /> In Scope ({boundary.in_scope_items.length})
                          </span>
                        }
                        style={{ borderTop: '3px solid #22c55e' }}
                      >
                        <Table
                          dataSource={boundary.in_scope_items.map((item, i) => ({ key: i, item }))}
                          columns={[
                            {
                              title: '#',
                              width: 50,
                              render: (_, __, i) => <Badge count={i + 1} style={{ backgroundColor: '#22c55e' }} />,
                            },
                            { title: 'Item', dataIndex: 'item' },
                          ]}
                          pagination={false}
                          size="small"
                        />
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card
                        title={
                          <span style={{ color: '#ef4444' }}>
                            <CloseCircleOutlined /> Out of Scope ({boundary.out_of_scope_items.length})
                          </span>
                        }
                        style={{ borderTop: '3px solid #ef4444' }}
                      >
                        <Table
                          dataSource={boundary.out_of_scope_items.map((item, i) => ({ key: i, item }))}
                          columns={[
                            {
                              title: '#',
                              width: 50,
                              render: (_, __, i) => <Badge count={i + 1} style={{ backgroundColor: '#ef4444' }} />,
                            },
                            { title: 'Item', dataIndex: 'item' },
                          ]}
                          pagination={false}
                          size="small"
                        />
                      </Card>
                    </Col>
                  </Row>
                ),
              },
              {
                key: 'interfaces',
                label: (
                  <span>
                    <ApiOutlined style={{ marginRight: 8 }} />
                    Interfaces ({boundary.interfaces.length})
                  </span>
                ),
                children: (
                  <Card>
                    <Table
                      dataSource={boundary.interfaces.map((intf, i) => ({ key: i, ...intf }))}
                      columns={[
                        { title: 'Interface Name', dataIndex: 'name', width: 200 },
                        {
                          title: 'Type',
                          dataIndex: 'type',
                          width: 120,
                          render: (t: string) => (
                            <Tag color={t === 'Inbound' ? 'blue' : t === 'Outbound' ? 'green' : 'purple'}>
                              {t}
                            </Tag>
                          ),
                        },
                        { title: 'Description', dataIndex: 'description' },
                        {
                          title: 'GxP Impact',
                          dataIndex: 'gxp_impact',
                          width: 100,
                          render: (v: boolean) => (
                            <Tag color={v ? 'red' : 'default'}>{v ? 'Yes' : 'No'}</Tag>
                          ),
                        },
                      ]}
                      pagination={false}
                    />
                  </Card>
                ),
              },
              {
                key: 'dependencies',
                label: (
                  <span>
                    <LinkOutlined style={{ marginRight: 8 }} />
                    Dependencies ({boundary.dependencies.length})
                  </span>
                ),
                children: (
                  <Card>
                    <Table
                      dataSource={boundary.dependencies.map((dep, i) => ({ key: i, ...dep }))}
                      columns={[
                        { title: 'System', dataIndex: 'system', width: 200 },
                        { title: 'Description', dataIndex: 'description' },
                        {
                          title: 'Validation Status',
                          dataIndex: 'validation_status',
                          width: 150,
                          render: (s: string) => (
                            <Tag color={s === 'Validated' ? 'success' : 'warning'}>{s}</Tag>
                          ),
                        },
                      ]}
                      pagination={false}
                    />
                  </Card>
                ),
              },
              {
                key: 'sops',
                label: (
                  <span>
                    <FileTextOutlined style={{ marginRight: 8 }} />
                    SOP References ({boundary.sop_references.length})
                  </span>
                ),
                children: (
                  <Card>
                    <Table
                      dataSource={boundary.sop_references.map((sop, i) => ({ key: i, ...sop }))}
                      columns={[
                        { title: 'SOP ID', dataIndex: 'sop_id', width: 150 },
                        { title: 'Title', dataIndex: 'title' },
                        { title: 'Version', dataIndex: 'version', width: 100 },
                      ]}
                      pagination={false}
                    />
                  </Card>
                ),
              },
            ]}
          />
        </>
      )}

      <Modal
        title="Define System Boundary"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="inScope"
            label={
              <span>
                <CheckCircleOutlined style={{ color: '#22c55e', marginRight: 8 }} />
                In-Scope Items (one per line)
              </span>
            }
            rules={[{ required: true }]}
          >
            <TextArea
              rows={6}
              placeholder="Sample registration and tracking
Test result entry and calculation
Audit trail for all GxP data"
            />
          </Form.Item>
          <Form.Item
            name="outScope"
            label={
              <span>
                <CloseCircleOutlined style={{ color: '#ef4444', marginRight: 8 }} />
                Out-of-Scope Items (one per line)
              </span>
            }
          >
            <TextArea
              rows={4}
              placeholder="ERP integration
Training management"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SystemBoundaryPage;

