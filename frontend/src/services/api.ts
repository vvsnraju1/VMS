/**
 * VMS API Service - Enterprise Edition
 * Complete 16-module API client
 */
import axios from 'axios';
import type {
  ValidationProject, ValidationProjectCreate,
  SystemBoundary, Requirement, RequirementCreate,
  FunctionalSpecification, FunctionalSpecificationCreate,
  DesignSpecification, DesignSpecificationCreate,
  TestCase, TestCaseCreate, TestExecution, TestExecutionCreate,
  Deviation, DeviationCreate, ChangeRequest, ChangeRequestCreate,
  AuditTrail, TraceabilityRow, RoleDashboard,
  AIRiskResponse, AIAmbiguityResponse, AISuggestFSResponse,
  AISuggestRootCauseResponse, AIConsistencyResponse,
  ValidationSummaryReport, LoginRequest, LoginResponse,
  RiskLevel, ProjectStatus,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const api = axios.create({ baseURL: API_BASE, headers: { 'Content-Type': 'application/json' } });

const up = (user: string, role: string) => `user=${encodeURIComponent(user)}&role=${encodeURIComponent(role)}`;

// Auth
export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => (await api.post('/login', data)).data,
};

// Projects
export const projectsApi = {
  getAll: async (): Promise<ValidationProject[]> => (await api.get('/projects')).data,
  getById: async (id: string): Promise<ValidationProject> => (await api.get(`/projects/${id}`)).data,
  create: async (p: ValidationProjectCreate, user: string, role: string): Promise<ValidationProject> =>
    (await api.post(`/projects?${up(user, role)}`, p)).data,
  updateStatus: async (id: string, status: ProjectStatus, user: string, role: string): Promise<ValidationProject> =>
    (await api.patch(`/projects/${id}/status?status=${status}&${up(user, role)}`)).data,
};

// System Boundary
export const boundaryApi = {
  get: async (projectId: string): Promise<SystemBoundary> => (await api.get(`/projects/${projectId}/boundary`)).data,
  create: async (projectId: string, sb: Partial<SystemBoundary>, user: string, role: string): Promise<SystemBoundary> =>
    (await api.post(`/projects/${projectId}/boundary?${up(user, role)}`, sb)).data,
  approve: async (id: string, reason: string, user: string, role: string): Promise<SystemBoundary> =>
    (await api.post(`/boundary/${id}/approve?${up(user, role)}`, { reason })).data,
};

// URS
export const ursApi = {
  getByProject: async (projectId: string): Promise<Requirement[]> => (await api.get(`/projects/${projectId}/urs`)).data,
  getById: async (id: string): Promise<Requirement> => (await api.get(`/urs/${id}`)).data,
  create: async (projectId: string, urs: RequirementCreate, user: string, role: string): Promise<Requirement> =>
    (await api.post(`/projects/${projectId}/urs?${up(user, role)}`, urs)).data,
  approve: async (id: string, reason: string, user: string, role: string): Promise<Requirement> =>
    (await api.post(`/urs/${id}/approve?${up(user, role)}`, { reason })).data,
  aiRisk: async (id: string): Promise<AIRiskResponse> => (await api.post(`/urs/${id}/ai-risk`)).data,
  aiAmbiguity: async (id: string): Promise<AIAmbiguityResponse> => (await api.post(`/urs/${id}/ai-ambiguity`)).data,
  applyRisk: async (id: string, gxp: boolean, p: RiskLevel, q: RiskLevel, d: RiskLevel, user: string, role: string): Promise<Requirement> =>
    (await api.post(`/urs/${id}/apply-risk?gxp_impact=${gxp}&patient_safety_risk=${p}&product_quality_risk=${q}&data_integrity_risk=${d}&${up(user, role)}`)).data,
  aiSuggestFS: async (id: string): Promise<AISuggestFSResponse> => (await api.post(`/urs/${id}/ai-suggest-fs`)).data,
};

// FS
export const fsApi = {
  getByProject: async (projectId: string): Promise<FunctionalSpecification[]> => (await api.get(`/projects/${projectId}/fs`)).data,
  getById: async (id: string): Promise<FunctionalSpecification> => (await api.get(`/fs/${id}`)).data,
  create: async (fs: FunctionalSpecificationCreate, user: string, role: string): Promise<FunctionalSpecification> =>
    (await api.post(`/fs?${up(user, role)}`, fs)).data,
  approve: async (id: string, reason: string, user: string, role: string): Promise<FunctionalSpecification> =>
    (await api.post(`/fs/${id}/approve?${up(user, role)}`, { reason })).data,
  aiSuggestTC: async (id: string): Promise<{ test_type: string; title: string; description: string; steps: string; expected: string; priority: string }[]> =>
    (await api.post(`/fs/${id}/ai-suggest-tc`)).data,
};

// DS
export const dsApi = {
  getByProject: async (projectId: string): Promise<DesignSpecification[]> => (await api.get(`/projects/${projectId}/ds`)).data,
  getById: async (id: string): Promise<DesignSpecification> => (await api.get(`/ds/${id}`)).data,
  create: async (ds: DesignSpecificationCreate, user: string, role: string): Promise<DesignSpecification> =>
    (await api.post(`/ds?fs_id=${ds.fs_id}&title=${encodeURIComponent(ds.title)}&description=${encodeURIComponent(ds.description)}&technical_details=${encodeURIComponent(ds.technical_details || '')}&data_structures=${encodeURIComponent(ds.data_structures || '')}&interfaces=${encodeURIComponent(ds.interfaces || '')}&${up(user, role)}`)).data,
  approve: async (id: string, reason: string, user: string, role: string): Promise<DesignSpecification> =>
    (await api.post(`/ds/${id}/approve?${up(user, role)}`, { reason })).data,
};

// Test Cases
export const testCaseApi = {
  getByProject: async (projectId: string): Promise<TestCase[]> => (await api.get(`/projects/${projectId}/test-cases`)).data,
  create: async (tc: TestCaseCreate, user: string, role: string): Promise<TestCase> =>
    (await api.post(`/test-cases?${up(user, role)}`, tc)).data,
};

// Test Execution
export const executionApi = {
  getByProject: async (projectId: string): Promise<TestExecution[]> => (await api.get(`/projects/${projectId}/test-execution`)).data,
  create: async (ex: TestExecutionCreate, user: string, role: string): Promise<TestExecution> =>
    (await api.post(`/test-execution?${up(user, role)}`, ex)).data,
};

// Deviations
export const deviationApi = {
  getByProject: async (projectId: string): Promise<Deviation[]> => (await api.get(`/projects/${projectId}/deviations`)).data,
  create: async (dev: DeviationCreate, user: string, role: string): Promise<Deviation> =>
    (await api.post(`/deviations?${up(user, role)}`, dev)).data,
  investigate: async (id: string, rootCause: string, category: string, summary: string, user: string, role: string): Promise<Deviation> =>
    (await api.patch(`/deviations/${id}/investigate?root_cause=${encodeURIComponent(rootCause)}&category=${encodeURIComponent(category)}&summary=${encodeURIComponent(summary)}&${up(user, role)}`)).data,
  assignCAPA: async (id: string, corrective: string, preventive: string, dueDate: string, user: string, role: string): Promise<Deviation> =>
    (await api.patch(`/deviations/${id}/capa?corrective=${encodeURIComponent(corrective)}&preventive=${encodeURIComponent(preventive)}&due_date=${dueDate}&${up(user, role)}`)).data,
  close: async (id: string, evidence: string, user: string, role: string): Promise<Deviation> =>
    (await api.patch(`/deviations/${id}/close?effectiveness_evidence=${encodeURIComponent(evidence)}&${up(user, role)}`)).data,
  aiRootCause: async (id: string): Promise<AISuggestRootCauseResponse> => (await api.post(`/deviations/${id}/ai-root-cause`)).data,
};

// Change Requests
export const changeApi = {
  getByProject: async (projectId: string): Promise<ChangeRequest[]> => (await api.get(`/projects/${projectId}/changes`)).data,
  create: async (projectId: string, cr: ChangeRequestCreate, user: string, role: string): Promise<ChangeRequest> =>
    (await api.post(`/projects/${projectId}/changes?${up(user, role)}`, cr)).data,
  analyze: async (id: string, impact: string, urs: string[], fs: string[], tc: string[], revalidation: boolean, scope: string, user: string, role: string): Promise<ChangeRequest> =>
    (await api.patch(`/changes/${id}/analyze?impact=${encodeURIComponent(impact)}&affected_urs=${JSON.stringify(urs)}&affected_fs=${JSON.stringify(fs)}&affected_tc=${JSON.stringify(tc)}&revalidation_required=${revalidation}&scope=${encodeURIComponent(scope)}&${up(user, role)}`)).data,
  approve: async (id: string, reason: string, user: string, role: string): Promise<ChangeRequest> =>
    (await api.patch(`/changes/${id}/approve?${up(user, role)}`, { reason })).data,
  aiImpact: async (id: string): Promise<{ affected_urs: string[]; affected_fs: string[]; affected_tc: string[]; revalidation_required: boolean; estimated_effort: string }> =>
    (await api.post(`/changes/${id}/ai-impact`)).data,
};

// Traceability
export const traceabilityApi = {
  getMatrix: async (projectId: string): Promise<TraceabilityRow[]> => (await api.get(`/projects/${projectId}/traceability`)).data,
};

// AI
export const aiApi = {
  consistency: async (projectId: string): Promise<AIConsistencyResponse> => (await api.post(`/projects/${projectId}/ai-consistency`)).data,
};

// VSR
export const vsrApi = {
  generate: async (projectId: string, user: string, role: string): Promise<ValidationSummaryReport> =>
    (await api.get(`/projects/${projectId}/vsr?${up(user, role)}`)).data,
};

// Audit
export const auditApi = {
  getAll: async (params?: { entity?: string; entity_id?: string; user?: string; action?: string; limit?: number }): Promise<AuditTrail[]> =>
    (await api.get('/audit-trail', { params })).data,
};

// Dashboard
export const dashboardApi = {
  get: async (role: string, user: string): Promise<RoleDashboard> => (await api.get(`/dashboard/${role}?user=${encodeURIComponent(user)}`)).data,
};

// Health
export const healthApi = {
  check: async (): Promise<{ status: string; version: string; modules: number }> => (await api.get('/health')).data,
};
