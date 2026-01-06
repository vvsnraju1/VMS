/**
 * VMS Domain Types - Enterprise Edition
 * Complete 16-module type definitions
 */

// ==================== ENUMS ====================

export type SystemType = 'GxP' | 'Non-GxP';
export type ValidationModel = 'V-Model' | 'Agile CSV';
export type ProjectType = 'New System' | 'Change' | 'Revalidation';
export type ProjectStatus = 'Planning' | 'URS' | 'FS' | 'DS' | 'Testing' | 'Completed' | 'On Hold';
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type URSStatus = 'Draft' | 'Under Review' | 'Approved' | 'Obsolete';
export type FSStatus = 'Draft' | 'Under Review' | 'Approved';
export type TestResult = 'Not Executed' | 'Pass' | 'Fail' | 'Blocked';
export type DeviationStatus = 'Open' | 'Investigating' | 'CAPA Assigned' | 'CAPA Verified' | 'Closed';
export type ChangeStatus = 'Requested' | 'Impact Analysis' | 'Approved' | 'Implementing' | 'Completed' | 'Rejected';
export type ChangePriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type Role = 'Admin' | 'Validation Lead' | 'QA' | 'Executor';
export type TraceabilityStatus = 'Complete' | 'Partial' | 'Not Started' | 'Failed';

export const REGULATIONS = [
  'FDA 21 CFR Part 11', 'FDA 21 CFR Part 211', 'EU Annex 11',
  'EU GMP', 'WHO GMP', 'ICH Q7', 'ICH Q9', 'GAMP 5'
] as const;

// ==================== AUTH ====================

export interface User {
  email: string;
  role: Role;
}

export interface LoginRequest {
  email: string;
  role: Role;
}

export interface LoginResponse {
  success: boolean;
  user: string;
  role: Role;
  message: string;
}

// ==================== PROJECT ====================

export interface ValidationProject {
  id: string;
  name: string;
  project_type: ProjectType;
  system_type: SystemType;
  validation_model: ValidationModel;
  intended_use: string;
  scope: string;
  applicable_regulations: string[];
  status: ProjectStatus;
  risk_level: RiskLevel;
  validation_lead: string;
  qa_reviewer: string;
  project_sponsor: string;
  target_completion?: string;
  actual_completion?: string;
  created_at: string;
  created_by: string;
}

export interface ValidationProjectCreate {
  name: string;
  project_type: ProjectType;
  system_type: SystemType;
  validation_model: ValidationModel;
  intended_use: string;
  scope: string;
  applicable_regulations: string[];
  risk_level: RiskLevel;
  validation_lead: string;
  qa_reviewer: string;
  target_completion?: string;
}

// ==================== SYSTEM BOUNDARY ====================

export interface SystemBoundary {
  id: string;
  project_id: string;
  in_scope_items: string[];
  out_of_scope_items: string[];
  exclusion_justifications: { item: string; justification: string }[];
  interfaces: { name: string; type: string; description: string; gxp_impact: boolean }[];
  dependencies: { system: string; description: string; validation_status: string }[];
  sop_references: { sop_id: string; title: string; version: string }[];
  version: string;
  status: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  created_by: string;
}

// ==================== URS ====================

export interface Requirement {
  id: string;
  project_id: string;
  category: string;
  title: string;
  description: string;
  acceptance_criteria: string;
  gxp_impact: boolean;
  patient_safety_risk: RiskLevel;
  product_quality_risk: RiskLevel;
  data_integrity_risk: RiskLevel;
  overall_risk: RiskLevel;
  version: string;
  status: URSStatus;
  ai_suggested: boolean;
  ai_ambiguity_score?: number;
  ai_ambiguity_notes?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  created_by: string;
}

export interface RequirementCreate {
  category: string;
  title: string;
  description: string;
  acceptance_criteria: string;
  gxp_impact: boolean;
  patient_safety_risk: RiskLevel;
  product_quality_risk: RiskLevel;
  data_integrity_risk: RiskLevel;
}

// ==================== FS ====================

export interface FunctionalSpecification {
  id: string;
  urs_id: string;
  project_id: string;
  title: string;
  description: string;
  technical_approach: string;
  version: string;
  status: FSStatus;
  ai_generated: boolean;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  created_by: string;
}

export interface FunctionalSpecificationCreate {
  urs_id: string;
  title: string;
  description: string;
  technical_approach: string;
}

// ==================== DS ====================

export type DSStatus = 'Draft' | 'Under Review' | 'Approved';

export interface DesignSpecification {
  id: string;
  fs_id: string;
  project_id: string;
  title: string;
  description: string;
  technical_design: string;
  technical_details: string;
  data_structures: string;
  interfaces: string;
  version: string;
  status: DSStatus;
  ai_generated: boolean;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  created_by: string;
}

export interface DesignSpecificationCreate {
  fs_id: string;
  title: string;
  description: string;
  technical_details: string;
  data_structures: string;
  interfaces: string;
}

// ==================== TEST CASE ====================

export interface TestCase {
  id: string;
  fs_id: string;
  urs_id: string;
  project_id: string;
  test_type: string;
  title: string;
  description: string;
  preconditions: string;
  test_steps: string;
  expected_result: string;
  priority: string;
  ai_generated: boolean;
  created_at: string;
  created_by: string;
}

export interface TestCaseCreate {
  fs_id: string;
  test_type: string;
  title: string;
  description: string;
  preconditions: string;
  test_steps: string;
  expected_result: string;
  priority: string;
}

// ==================== TEST EXECUTION ====================

export interface TestExecution {
  id: string;
  test_case_id: string;
  project_id: string;
  cycle: number;
  executor: string;
  execution_date: string;
  result: TestResult;
  actual_result: string;
  evidence_references: string[];
  comments: string;
  environment: string;
  deviation_id?: string;
  created_at: string;
}

export interface TestExecutionCreate {
  test_case_id: string;
  result: TestResult;
  actual_result: string;
  evidence_references: string[];
  comments: string;
  environment: string;
}

// ==================== DEVIATION ====================

export interface Deviation {
  id: string;
  test_execution_id: string;
  project_id: string;
  deviation_type: string;
  severity: RiskLevel;
  title: string;
  description: string;
  root_cause: string;
  root_cause_category: string;
  root_cause_ai_suggested: boolean;
  investigation_summary: string;
  capa_corrective: string;
  capa_preventive: string;
  capa_due_date?: string;
  effectiveness_criteria: string;
  effectiveness_verified: boolean;
  effectiveness_evidence: string;
  status: DeviationStatus;
  assigned_to?: string;
  created_at: string;
  created_by: string;
  closed_by?: string;
  closed_at?: string;
}

export interface DeviationCreate {
  test_execution_id: string;
  deviation_type: string;
  severity: RiskLevel;
  title: string;
  description: string;
  root_cause: string;
  capa_corrective: string;
  capa_preventive: string;
}

// ==================== CHANGE REQUEST ====================

export interface ChangeRequest {
  id: string;
  project_id: string;
  title: string;
  description: string;
  change_type: string;
  priority: ChangePriority;
  justification: string;
  impact_assessment: string;
  affected_urs: string[];
  affected_fs: string[];
  affected_tc: string[];
  revalidation_required: boolean;
  revalidation_scope: string;
  risk_level: RiskLevel;
  status: ChangeStatus;
  requested_by: string;
  requested_at: string;
  approved_by?: string;
  approved_at?: string;
  completed_at?: string;
}

export interface ChangeRequestCreate {
  title: string;
  description: string;
  change_type: string;
  priority: ChangePriority;
  justification: string;
}

// ==================== TRACEABILITY ====================

export interface TraceabilityRow {
  urs_id: string;
  urs_title: string;
  urs_status: string;
  urs_risk: string;
  fs_id?: string;
  fs_title?: string;
  fs_status?: string;
  ds_id?: string;
  ds_title?: string;
  tc_id?: string;
  tc_title?: string;
  tc_type?: string;
  exec_id?: string;
  exec_result?: string;
  exec_date?: string;
  deviation_id?: string;
  deviation_status?: string;
  status: TraceabilityStatus;
}

// ==================== AUDIT TRAIL ====================

export interface AuditTrail {
  timestamp: string;
  user: string;
  role: string;
  action: string;
  entity: string;
  entity_id: string;
  old_value?: string;
  new_value?: string;
  details: string;
  reason: string;
}

// ==================== DASHBOARD ====================

export interface DashboardMetrics {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  projects_by_status: Record<string, number>;
  projects_by_risk: Record<string, number>;
  total_urs: number;
  approved_urs: number;
  draft_urs: number;
  urs_by_risk: Record<string, number>;
  high_risk_urs: number;
  total_test_cases: number;
  executed_tests: number;
  passed_tests: number;
  failed_tests: number;
  blocked_tests: number;
  pass_rate: number;
  total_deviations: number;
  open_deviations: number;
  closed_deviations: number;
  deviations_by_severity: Record<string, number>;
  total_changes: number;
  pending_changes: number;
  approved_changes: number;
  ai_suggestions_count: number;
  traceability_coverage: number;
  documentation_completeness: number;
}

export interface RoleDashboard {
  role: string;
  user: string;
  metrics: DashboardMetrics;
  pending_approvals: { type: string; count: number; items?: string[] }[];
  my_tasks: { type: string; count: number; action: string }[];
  recent_activity: { timestamp: string; action: string; entity: string; details: string }[];
  alerts: { type: string; message: string }[];
  quick_actions: { action: string; label: string }[];
  trends: {
    test_execution: { date: string; passed: number; failed: number }[];
    deviations: { date: string; opened: number; closed: number }[];
  };
}

// ==================== AI RESPONSES ====================

export interface AIRiskResponse {
  gxp_impact: boolean;
  patient_safety_risk: RiskLevel;
  product_quality_risk: RiskLevel;
  data_integrity_risk: RiskLevel;
  overall_risk: RiskLevel;
  reason: string;
  confidence: number;
}

export interface AIAmbiguityResponse {
  urs_id: string;
  ambiguity_score: number;
  issues: { type: string; term: string; suggestion: string }[];
  suggestions: string[];
}

export interface AISuggestFSResponse {
  urs_id: string;
  suggested_title: string;
  suggested_description: string;
  suggested_approach: string;
}

export interface AISuggestTestCaseResponse {
  test_type: string;
  title: string;
  description: string;
  steps: string;
  expected: string;
  priority: string;
}

export interface AISuggestRootCauseResponse {
  deviation_id: string;
  suggested_root_cause: string;
  suggested_category: string;
  suggested_capa: string;
  confidence: number;
}

export interface AIConsistencyResponse {
  project_id: string;
  issues: { entity: string; entity_id: string; issue_type: string; description: string; suggestion: string }[];
  score: number;
}

// ==================== VSR ====================

export interface ValidationSummaryReport {
  project_id: string;
  project_name: string;
  generated_at: string;
  generated_by: string;
  scope: Record<string, unknown>;
  system_boundary: Record<string, unknown>;
  testing_summary: Record<string, unknown>;
  test_coverage: Record<string, unknown>;
  deviations_summary: Record<string, unknown>;
  capa_summary: Record<string, unknown>;
  changes_summary: Record<string, unknown>;
  traceability_summary: Record<string, unknown>;
  conclusion: string;
  recommendation: string;
  validation_decision: string;
  conditions: string[];
}
