/**
 * Validation Summary Report (VSR) Generator Page
 * Module 10: Formal validation conclusion
 */
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card, Row, Col, Select, Button, Space, message, Spin, Descriptions,
  Tag, Statistic, Progress, Alert, Divider, Table, Result, Badge
} from 'antd';
import {
  FileDoneOutlined, FileExcelOutlined, FilePdfOutlined,
  CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined,
  SafetyCertificateOutlined, ExperimentOutlined, WarningOutlined,
  NodeIndexOutlined, AuditOutlined, TrophyOutlined
} from '@ant-design/icons';
import { vsrApi, projectsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { ValidationSummaryReport, ValidationProject } from '../types';

const VSRPage: React.FC = () => {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const [projects, setProjects] = useState<ValidationProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(projectId || null);
  const [vsr, setVsr] = useState<ValidationSummaryReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadProjects(); }, []);

  const loadProjects = async () => {
    const data = await projectsApi.getAll();
    setProjects(data);
    if (!selectedProject && data.length > 0) setSelectedProject(data[0].id);
  };

  const generateVSR = async () => {
    if (!selectedProject) return;
    setLoading(true);
    try {
      const report = await vsrApi.generate(selectedProject, user!.email, user!.role);
      setVsr(report);
    } catch {
      message.error('Failed to generate VSR');
    } finally {
      setLoading(false);
    }
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'Approved': return '#22c55e';
      case 'Conditionally Approved': return '#f59e0b';
      case 'Not Approved': return '#ef4444';
      default: return '#64748b';
    }
  };

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'Approved': return <CheckCircleOutlined style={{ fontSize: 48, color: '#22c55e' }} />;
      case 'Conditionally Approved': return <ExclamationCircleOutlined style={{ fontSize: 48, color: '#f59e0b' }} />;
      default: return <CloseCircleOutlined style={{ fontSize: 48, color: '#ef4444' }} />;
    }
  };

  return (
    <div>
      {/* Header */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card bodyStyle={{ padding: '16px' }}>
            <Space>
              <FileDoneOutlined style={{ fontSize: 24, color: '#22c55e' }} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>Validation Summary Report</div>
                <div style={{ color: '#64748b', fontSize: 13 }}>Module 10: Formal validation conclusion</div>
              </div>
            </Space>
          </Card>
        </Col>
        <Col span={12}>
          <Card bodyStyle={{ padding: '16px', display: 'flex', gap: 16, alignItems: 'center' }}>
            <Select
              style={{ flex: 1 }}
              placeholder="Select project"
              value={selectedProject}
              onChange={(v) => { setSelectedProject(v); setVsr(null); }}
              options={projects.map(p => ({ value: p.id, label: `${p.id}: ${p.name}` }))}
            />
            <Button type="primary" onClick={generateVSR} loading={loading}>
              Generate VSR
            </Button>
            {vsr && (
              <Space>
                <Button icon={<FilePdfOutlined />}>Export PDF</Button>
                <Button icon={<FileExcelOutlined />}>Export DOCX</Button>
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      {loading && (
        <Card>
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Spin size="large" />
            <div style={{ marginTop: 16, color: '#64748b' }}>Generating Validation Summary Report...</div>
          </div>
        </Card>
      )}

      {!loading && !vsr && (
        <Card>
          <Result
            icon={<FileDoneOutlined style={{ color: '#64748b' }} />}
            title="No Report Generated"
            subTitle="Select a project and click Generate VSR to create a validation summary report"
          />
        </Card>
      )}

      {vsr && (
        <div>
          {/* Decision Banner */}
          <Card
            style={{
              marginBottom: 24,
              background: `linear-gradient(135deg, ${getDecisionColor(vsr.validation_decision)}15 0%, white 100%)`,
              borderLeft: `4px solid ${getDecisionColor(vsr.validation_decision)}`,
            }}
          >
            <Row gutter={24} align="middle">
              <Col>
                {getDecisionIcon(vsr.validation_decision)}
              </Col>
              <Col flex="auto">
                <div style={{ fontSize: 24, fontWeight: 700, color: getDecisionColor(vsr.validation_decision) }}>
                  {vsr.validation_decision}
                </div>
                <div style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
                  {vsr.recommendation}
                </div>
              </Col>
              <Col>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Project">{vsr.project_name}</Descriptions.Item>
                  <Descriptions.Item label="Generated">{new Date(vsr.generated_at).toLocaleString()}</Descriptions.Item>
                  <Descriptions.Item label="Generated By">{vsr.generated_by}</Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>
          </Card>

          {/* Conditions Alert */}
          {vsr.conditions.length > 0 && (
            <Alert
              type="warning"
              style={{ marginBottom: 24 }}
              message="Conditions for Release"
              description={
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {vsr.conditions.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              }
            />
          )}

          {/* Summary Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {/* Scope */}
            <Col span={6}>
              <Card size="small" title={<><SafetyCertificateOutlined /> Scope</>}>
                <Statistic title="System Type" value={(vsr.scope as any).system_type} />
                <Divider style={{ margin: '12px 0' }} />
                <Row gutter={8}>
                  <Col span={12}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>URS</div>
                    <div style={{ fontWeight: 600 }}>{(vsr.scope as any).approved_urs}/{(vsr.scope as any).total_urs}</div>
                  </Col>
                  <Col span={12}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>FS</div>
                    <div style={{ fontWeight: 600 }}>{(vsr.scope as any).approved_fs}/{(vsr.scope as any).total_fs}</div>
                  </Col>
                </Row>
              </Card>
            </Col>

            {/* Testing */}
            <Col span={6}>
              <Card size="small" title={<><ExperimentOutlined /> Testing</>}>
                <div style={{ textAlign: 'center' }}>
                  <Progress
                    type="circle"
                    percent={parseFloat((vsr.testing_summary as any).pass_rate) || 0}
                    width={80}
                    strokeColor="#22c55e"
                  />
                </div>
                <Row gutter={8} style={{ marginTop: 12 }}>
                  <Col span={8}>
                    <Tag color="success">{(vsr.testing_summary as any).passed} Pass</Tag>
                  </Col>
                  <Col span={8}>
                    <Tag color="error">{(vsr.testing_summary as any).failed} Fail</Tag>
                  </Col>
                  <Col span={8}>
                    <Tag>{(vsr.testing_summary as any).blocked} Block</Tag>
                  </Col>
                </Row>
              </Card>
            </Col>

            {/* Deviations */}
            <Col span={6}>
              <Card size="small" title={<><WarningOutlined /> Deviations</>}>
                <Row gutter={16} align="middle">
                  <Col span={12}>
                    <Statistic
                      title="Open"
                      value={(vsr.deviations_summary as any).open}
                      valueStyle={{ color: (vsr.deviations_summary as any).open > 0 ? '#ef4444' : '#22c55e' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic title="Total" value={(vsr.deviations_summary as any).total} />
                  </Col>
                </Row>
                <Divider style={{ margin: '12px 0' }} />
                <Space size={4}>
                  {Object.entries((vsr.deviations_summary as any).by_severity || {}).map(([sev, count]) => (
                    count as number > 0 && (
                      <Tag key={sev} color={sev === 'Critical' ? 'magenta' : sev === 'High' ? 'red' : sev === 'Medium' ? 'orange' : 'default'}>
                        {sev}: {count as number}
                      </Tag>
                    )
                  ))}
                </Space>
              </Card>
            </Col>

            {/* CAPA */}
            <Col span={6}>
              <Card size="small" title={<><AuditOutlined /> CAPA</>}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic title="Total" value={(vsr.capa_summary as any).total_capas} />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Verified"
                      value={(vsr.capa_summary as any).verified}
                      valueStyle={{ color: '#22c55e' }}
                    />
                  </Col>
                </Row>
                {(vsr.capa_summary as any).pending > 0 && (
                  <Alert
                    type="warning"
                    message={`${(vsr.capa_summary as any).pending} CAPA pending verification`}
                    style={{ marginTop: 12 }}
                  />
                )}
              </Card>
            </Col>
          </Row>

          {/* Traceability */}
          <Card title={<><NodeIndexOutlined /> Traceability Summary</>} style={{ marginBottom: 24 }}>
            <Row gutter={24}>
              <Col span={8}>
                <Statistic
                  title="Complete Chains"
                  value={(vsr.traceability_summary as any).complete_chains}
                  suffix={`/ ${(vsr.scope as any).total_urs}`}
                  valueStyle={{ color: '#22c55e' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Partial Chains"
                  value={(vsr.traceability_summary as any).partial_chains}
                  valueStyle={{ color: '#f59e0b' }}
                />
              </Col>
              <Col span={8}>
                <div style={{ fontSize: 13, color: '#64748b' }}>Coverage</div>
                <Progress
                  percent={Math.round(((vsr.traceability_summary as any).complete_chains / Math.max((vsr.scope as any).total_urs, 1)) * 100)}
                  strokeColor="#22c55e"
                />
              </Col>
            </Row>
            {((vsr.traceability_summary as any).gaps?.length > 0) && (
              <Alert
                type="warning"
                style={{ marginTop: 16 }}
                message={`Traceability gaps found: ${(vsr.traceability_summary as any).gaps.join(', ')}`}
              />
            )}
          </Card>

          {/* Conclusion */}
          <Card
            title={<><TrophyOutlined style={{ color: '#f59e0b' }} /> Validation Conclusion</>}
            style={{
              background: 'linear-gradient(135deg, #0d1b2a 0%, #1b263b 100%)',
            }}
            headStyle={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
            bodyStyle={{ color: 'white' }}
          >
            <div style={{ fontSize: 16, lineHeight: 1.8 }}>
              {vsr.conclusion}
            </div>
            <Divider style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
            <div style={{ display: 'flex', gap: 24 }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Validation Model</div>
                <div style={{ fontWeight: 600 }}>{(vsr.scope as any).validation_model}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Applicable Regulations</div>
                <Space>
                  {((vsr.scope as any).regulations || []).map((r: string) => (
                    <Tag key={r} color="blue">{r}</Tag>
                  ))}
                </Space>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default VSRPage;

