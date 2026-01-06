"""
VMS Domain Models - Complete Enterprise Edition
All 16 modules for pharmaceutical CSV management
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime
from enum import Enum


# ==================== ENUMS ====================

class SystemType(str, Enum):
    GXP = "GxP"
    NON_GXP = "Non-GxP"


class ValidationModel(str, Enum):
    V_MODEL = "V-Model"
    AGILE_CSV = "Agile CSV"


class ProjectStatus(str, Enum):
    PLANNING = "Planning"
    URS = "URS"
    FS = "FS"
    DS = "DS"
    TESTING = "Testing"
    COMPLETED = "Completed"
    ON_HOLD = "On Hold"


class ProjectType(str, Enum):
    NEW_SYSTEM = "New System"
    CHANGE = "Change"
    REVALIDATION = "Revalidation"


class RiskLevel(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class URSStatus(str, Enum):
    DRAFT = "Draft"
    REVIEW = "Under Review"
    APPROVED = "Approved"
    OBSOLETE = "Obsolete"


class FSStatus(str, Enum):
    DRAFT = "Draft"
    REVIEW = "Under Review"
    APPROVED = "Approved"


class TestResult(str, Enum):
    NOT_EXECUTED = "Not Executed"
    PASS = "Pass"
    FAIL = "Fail"
    BLOCKED = "Blocked"


class DeviationStatus(str, Enum):
    OPEN = "Open"
    INVESTIGATING = "Investigating"
    CAPA_ASSIGNED = "CAPA Assigned"
    CAPA_VERIFIED = "CAPA Verified"
    CLOSED = "Closed"


class ChangeStatus(str, Enum):
    REQUESTED = "Requested"
    IMPACT_ANALYSIS = "Impact Analysis"
    APPROVED = "Approved"
    IMPLEMENTING = "Implementing"
    COMPLETED = "Completed"
    REJECTED = "Rejected"


class ChangePriority(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    URGENT = "Urgent"


class SignatureType(str, Enum):
    REVIEW = "Review"
    APPROVAL = "Approval"
    AUTHOR = "Author"
    EXECUTION = "Execution"


class Role(str, Enum):
    ADMIN = "Admin"
    VALIDATION_LEAD = "Validation Lead"
    QA = "QA"
    EXECUTOR = "Executor"


class Regulation(str, Enum):
    FDA_21CFR11 = "FDA 21 CFR Part 11"
    FDA_21CFR211 = "FDA 21 CFR Part 211"
    EU_ANNEX11 = "EU Annex 11"
    EU_GMP = "EU GMP"
    WHO_GMP = "WHO GMP"
    ICH_Q7 = "ICH Q7"
    ICH_Q9 = "ICH Q9"
    GAMP5 = "GAMP 5"


# ==================== AUTH ====================

class LoginRequest(BaseModel):
    email: str
    role: Role


class LoginResponse(BaseModel):
    success: bool
    user: str
    role: Role
    message: str


# ==================== MODULE 1: PROJECT MANAGEMENT ====================

class ValidationProject(BaseModel):
    id: str
    name: str
    project_type: ProjectType = ProjectType.NEW_SYSTEM
    system_type: SystemType = SystemType.GXP
    validation_model: ValidationModel = ValidationModel.V_MODEL
    intended_use: str = ""
    scope: str = ""
    applicable_regulations: List[str] = []
    status: ProjectStatus = ProjectStatus.PLANNING
    risk_level: RiskLevel = RiskLevel.MEDIUM
    # Team assignments
    validation_lead: str = ""
    qa_reviewer: str = ""
    project_sponsor: str = ""
    # Dates
    target_completion: Optional[str] = None
    actual_completion: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str = ""


class ValidationProjectCreate(BaseModel):
    name: str
    project_type: ProjectType = ProjectType.NEW_SYSTEM
    system_type: SystemType = SystemType.GXP
    validation_model: ValidationModel = ValidationModel.V_MODEL
    intended_use: str = ""
    scope: str = ""
    applicable_regulations: List[str] = []
    risk_level: RiskLevel = RiskLevel.MEDIUM
    validation_lead: str = ""
    qa_reviewer: str = ""
    target_completion: Optional[str] = None


# ==================== MODULE 2: SYSTEM BOUNDARY ====================

class SystemBoundary(BaseModel):
    id: str
    project_id: str
    # Scope definition
    in_scope_items: List[str] = []
    out_of_scope_items: List[str] = []
    exclusion_justifications: List[dict] = []  # {item, justification}
    # Interfaces
    interfaces: List[dict] = []  # {name, type, description, gxp_impact}
    dependencies: List[dict] = []  # {system, description, validation_status}
    # SOP References
    sop_references: List[dict] = []  # {sop_id, title, version}
    # Metadata
    version: str = "1.0"
    status: str = "Draft"
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str = ""


class SystemBoundaryCreate(BaseModel):
    in_scope_items: List[str] = []
    out_of_scope_items: List[str] = []
    exclusion_justifications: List[dict] = []
    interfaces: List[dict] = []
    dependencies: List[dict] = []
    sop_references: List[dict] = []


# ==================== MODULE 3: URS ====================

class Requirement(BaseModel):
    id: str
    project_id: str
    category: str = "Functional"  # Functional, Performance, Security, Interface
    title: str
    description: str
    acceptance_criteria: str = ""
    gxp_impact: bool = True
    # Granular risk assessment
    patient_safety_risk: RiskLevel = RiskLevel.LOW
    product_quality_risk: RiskLevel = RiskLevel.LOW
    data_integrity_risk: RiskLevel = RiskLevel.LOW
    overall_risk: RiskLevel = RiskLevel.MEDIUM
    # Versioning
    version: str = "1.0"
    status: URSStatus = URSStatus.DRAFT
    # AI
    ai_suggested: bool = False
    ai_ambiguity_score: Optional[float] = None
    ai_ambiguity_notes: Optional[str] = None
    # Approvals
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str = ""


class RequirementCreate(BaseModel):
    category: str = "Functional"
    title: str
    description: str
    acceptance_criteria: str = ""
    gxp_impact: bool = True
    patient_safety_risk: RiskLevel = RiskLevel.LOW
    product_quality_risk: RiskLevel = RiskLevel.LOW
    data_integrity_risk: RiskLevel = RiskLevel.LOW


# ==================== MODULE 5: SPECIFICATIONS ====================

class FunctionalSpecification(BaseModel):
    id: str
    urs_id: str
    project_id: str
    title: str
    description: str
    technical_approach: str = ""
    assumptions: str = ""
    constraints: str = ""
    version: str = "1.0"
    status: FSStatus = FSStatus.DRAFT
    ai_generated: bool = False
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str = ""


class FunctionalSpecificationCreate(BaseModel):
    urs_id: str
    title: str
    description: str
    technical_approach: str = ""
    assumptions: str = ""
    constraints: str = ""


class DesignSpecification(BaseModel):
    id: str
    fs_id: str
    project_id: str
    title: str
    description: str
    technical_design: str = ""
    technical_details: str = ""
    data_structures: str = ""
    interfaces: str = ""
    required: bool = True
    justification: str = ""
    version: str = "1.0"
    status: FSStatus = FSStatus.DRAFT
    ai_generated: bool = False
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str = ""


# ==================== MODULE 6 & 7: TEST MANAGEMENT ====================

class TestCase(BaseModel):
    id: str
    fs_id: str
    urs_id: str
    project_id: str
    test_type: str = "Functional"  # Functional, Integration, Negative, Performance
    title: str
    description: str
    preconditions: str = ""
    test_steps: str = ""
    expected_result: str = ""
    acceptance_criteria: str = ""
    priority: str = "Medium"
    ai_generated: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str = ""


class TestCaseCreate(BaseModel):
    fs_id: str
    test_type: str = "Functional"
    title: str
    description: str
    preconditions: str = ""
    test_steps: str = ""
    expected_result: str = ""
    acceptance_criteria: str = ""
    priority: str = "Medium"


class TestExecution(BaseModel):
    id: str
    test_case_id: str
    project_id: str
    cycle: int = 1  # Re-execution tracking
    executor: str
    execution_date: datetime = Field(default_factory=datetime.utcnow)
    result: TestResult = TestResult.NOT_EXECUTED
    actual_result: str = ""
    evidence_references: List[str] = []
    comments: str = ""
    environment: str = ""
    deviation_id: Optional[str] = None
    # E-Signature (mocked)
    signature_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class TestExecutionCreate(BaseModel):
    test_case_id: str
    result: TestResult
    actual_result: str = ""
    evidence_references: List[str] = []
    comments: str = ""
    environment: str = ""


# ==================== MODULE 8: DEVIATION & CAPA ====================

class Deviation(BaseModel):
    id: str
    test_execution_id: str
    project_id: str
    deviation_type: str = "Test Failure"  # Test Failure, Process, Documentation
    severity: RiskLevel = RiskLevel.MEDIUM
    title: str
    description: str
    # Investigation
    root_cause: str = ""
    root_cause_category: str = ""  # Human Error, System, Process, Design
    root_cause_ai_suggested: bool = False
    investigation_summary: str = ""
    # CAPA
    capa_corrective: str = ""
    capa_preventive: str = ""
    capa_due_date: Optional[str] = None
    effectiveness_criteria: str = ""
    effectiveness_verified: bool = False
    effectiveness_evidence: str = ""
    # Status tracking
    status: DeviationStatus = DeviationStatus.OPEN
    assigned_to: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str = ""
    closed_by: Optional[str] = None
    closed_at: Optional[datetime] = None


class DeviationCreate(BaseModel):
    test_execution_id: str
    deviation_type: str = "Test Failure"
    severity: RiskLevel = RiskLevel.MEDIUM
    title: str
    description: str
    root_cause: str = ""
    capa_corrective: str = ""
    capa_preventive: str = ""


# ==================== MODULE 13: E-SIGNATURES (MOCKED) ====================

class ElectronicSignature(BaseModel):
    id: str
    entity_type: str  # Requirement, FS, TestExecution, Deviation
    entity_id: str
    signature_type: SignatureType
    meaning: str  # "I have reviewed...", "I approve..."
    signer: str
    signer_role: str
    reason: str = ""
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    # In production: would include hash, certificate, etc.


class SignatureRequest(BaseModel):
    entity_type: str
    entity_id: str
    signature_type: SignatureType
    meaning: str
    reason: str = ""


# ==================== MODULE 15: CHANGE MANAGEMENT ====================

class ChangeRequest(BaseModel):
    id: str
    project_id: str
    title: str
    description: str
    change_type: str = "Enhancement"  # Enhancement, Bug Fix, Regulatory, Configuration
    priority: ChangePriority = ChangePriority.MEDIUM
    justification: str = ""
    # Impact analysis
    impact_assessment: str = ""
    affected_urs: List[str] = []
    affected_fs: List[str] = []
    affected_tc: List[str] = []
    revalidation_required: bool = False
    revalidation_scope: str = ""
    # Risk
    risk_assessment: str = ""
    risk_level: RiskLevel = RiskLevel.MEDIUM
    # Status
    status: ChangeStatus = ChangeStatus.REQUESTED
    requested_by: str = ""
    requested_at: datetime = Field(default_factory=datetime.utcnow)
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class ChangeRequestCreate(BaseModel):
    title: str
    description: str
    change_type: str = "Enhancement"
    priority: ChangePriority = ChangePriority.MEDIUM
    justification: str = ""


# ==================== MODULE 9: TRACEABILITY ====================

class TraceabilityRow(BaseModel):
    urs_id: str
    urs_title: str
    urs_status: str
    urs_risk: str
    fs_id: Optional[str] = None
    fs_title: Optional[str] = None
    fs_status: Optional[str] = None
    ds_id: Optional[str] = None
    ds_title: Optional[str] = None
    tc_id: Optional[str] = None
    tc_title: Optional[str] = None
    tc_type: Optional[str] = None
    exec_id: Optional[str] = None
    exec_result: Optional[str] = None
    exec_date: Optional[str] = None
    deviation_id: Optional[str] = None
    deviation_status: Optional[str] = None
    status: Literal["Complete", "Partial", "Not Started", "Failed"] = "Not Started"


# ==================== MODULE 11: AUDIT TRAIL ====================

class AuditTrail(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    user: str
    role: str = ""
    action: str
    entity: str
    entity_id: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    details: str = ""
    reason: str = ""
    ip_address: str = ""
    session_id: str = ""


# ==================== MODULE 16: ANALYTICS ====================

class DashboardMetrics(BaseModel):
    # Project metrics
    total_projects: int = 0
    active_projects: int = 0
    completed_projects: int = 0
    projects_by_status: dict = {}
    projects_by_risk: dict = {}
    
    # URS metrics
    total_urs: int = 0
    approved_urs: int = 0
    draft_urs: int = 0
    urs_by_risk: dict = {}
    high_risk_urs: int = 0
    
    # Testing metrics
    total_test_cases: int = 0
    executed_tests: int = 0
    passed_tests: int = 0
    failed_tests: int = 0
    blocked_tests: int = 0
    pass_rate: float = 0.0
    
    # Deviation metrics
    total_deviations: int = 0
    open_deviations: int = 0
    closed_deviations: int = 0
    deviations_by_severity: dict = {}
    avg_resolution_time: float = 0.0
    
    # Change metrics
    total_changes: int = 0
    pending_changes: int = 0
    approved_changes: int = 0
    
    # AI metrics
    ai_suggestions_count: int = 0
    ai_suggestions_accepted: int = 0
    
    # Compliance
    traceability_coverage: float = 0.0
    documentation_completeness: float = 0.0


class RoleDashboard(BaseModel):
    role: str
    user: str
    metrics: DashboardMetrics
    # Role-specific items
    pending_approvals: List[dict] = []
    my_tasks: List[dict] = []
    recent_activity: List[dict] = []
    alerts: List[dict] = []
    quick_actions: List[dict] = []
    trends: dict = {}


# ==================== AI RESPONSES ====================

class AIRiskResponse(BaseModel):
    gxp_impact: bool
    patient_safety_risk: RiskLevel
    product_quality_risk: RiskLevel
    data_integrity_risk: RiskLevel
    overall_risk: RiskLevel
    reason: str
    confidence: float = 0.85


class AIAmbiguityResponse(BaseModel):
    urs_id: str
    ambiguity_score: float  # 0-1, higher = more ambiguous
    issues: List[dict] = []  # {type, description, suggestion}
    suggestions: List[str] = []


class AISuggestFSResponse(BaseModel):
    urs_id: str
    suggested_title: str
    suggested_description: str
    suggested_approach: str


class AISuggestTestCaseResponse(BaseModel):
    fs_id: str
    suggested_title: str
    suggested_description: str
    suggested_steps: str
    suggested_expected_result: str
    test_type: str


class AISuggestRootCauseResponse(BaseModel):
    deviation_id: str
    suggested_root_cause: str
    suggested_category: str
    suggested_capa: str
    confidence: float = 0.75


class AIConsistencyCheckResponse(BaseModel):
    project_id: str
    issues: List[dict] = []  # {entity, entity_id, issue_type, description, suggestion}
    score: float = 0.0  # Consistency score 0-100


# ==================== VSR ====================

class ValidationSummaryReport(BaseModel):
    project_id: str
    project_name: str
    generated_at: datetime
    generated_by: str
    # Scope
    scope: dict
    system_boundary: dict
    # Testing
    testing_summary: dict
    test_coverage: dict
    # Deviations
    deviations_summary: dict
    capa_summary: dict
    # Changes
    changes_summary: dict
    # Traceability
    traceability_summary: dict
    # Conclusion
    conclusion: str
    recommendation: str
    validation_decision: str  # "Approved", "Conditionally Approved", "Not Approved"
    conditions: List[str] = []


class ApproveRequest(BaseModel):
    reason: str = "Approved after review"
