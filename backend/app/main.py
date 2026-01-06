"""
VMS API - Enterprise Edition
Complete 16-module validation management system
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from datetime import datetime, timedelta

from .models import (
    LoginRequest, LoginResponse, ValidationProject, ValidationProjectCreate,
    SystemBoundary, SystemBoundaryCreate,
    Requirement, RequirementCreate, FunctionalSpecification, FunctionalSpecificationCreate,
    DesignSpecification, TestCase, TestCaseCreate, TestExecution, TestExecutionCreate,
    Deviation, DeviationCreate, ChangeRequest, ChangeRequestCreate,
    ElectronicSignature, SignatureRequest,
    AuditTrail, TraceabilityRow, DashboardMetrics, RoleDashboard,
    AIRiskResponse, AIAmbiguityResponse, AISuggestFSResponse,
    AISuggestTestCaseResponse, AISuggestRootCauseResponse, AIConsistencyCheckResponse,
    ValidationSummaryReport, ApproveRequest,
    RiskLevel, URSStatus, FSStatus, TestResult, DeviationStatus,
    ChangeStatus, ChangePriority, ProjectStatus, SignatureType
)
from .store import store
from .ai_engine import AIEngine

app = FastAPI(
    title="VMS - Validation Management System",
    description="Enterprise POC for pharmaceutical CSV management - All 16 modules",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== HELPERS ====================

def calc_risk(p: RiskLevel, q: RiskLevel, d: RiskLevel) -> RiskLevel:
    vals = {RiskLevel.LOW: 1, RiskLevel.MEDIUM: 2, RiskLevel.HIGH: 3, RiskLevel.CRITICAL: 4}
    m = max(vals[p], vals[q], vals[d])
    return {4: RiskLevel.CRITICAL, 3: RiskLevel.HIGH, 2: RiskLevel.MEDIUM}.get(m, RiskLevel.LOW)

def user_params(user: str, role: str):
    return {"user": user, "role": role}


# ==================== AUTH ====================

@app.post("/login", response_model=LoginResponse, tags=["Auth"])
async def login(req: LoginRequest):
    store.add_audit_entry(req.email, req.role.value, "LOGIN", "Session", req.email,
                         f"Logged in as {req.role.value}")
    return LoginResponse(success=True, user=req.email, role=req.role,
                        message=f"Welcome! Logged in as {req.role.value}")


# ==================== MODULE 1: PROJECTS ====================

@app.get("/projects", response_model=List[ValidationProject], tags=["Projects"])
async def get_projects():
    return list(store.projects.values())

@app.get("/projects/{id}", response_model=ValidationProject, tags=["Projects"])
async def get_project(id: str):
    if id not in store.projects:
        raise HTTPException(404, "Project not found")
    return store.projects[id]

@app.post("/projects", response_model=ValidationProject, tags=["Projects"])
async def create_project(proj: ValidationProjectCreate, user: str = Query(...), role: str = Query(...)):
    new_id = store.generate_id('project')
    new_proj = ValidationProject(id=new_id, **proj.dict(), created_at=datetime.utcnow(), created_by=user)
    store.projects[new_id] = new_proj
    store.add_audit_entry(user, role, "CREATE", "ValidationProject", new_id, f"Created: {proj.name}")
    return new_proj

@app.patch("/projects/{id}/status", response_model=ValidationProject, tags=["Projects"])
async def update_status(id: str, status: ProjectStatus, user: str = Query(...), role: str = Query(...)):
    if id not in store.projects:
        raise HTTPException(404, "Project not found")
    old = store.projects[id].status
    store.projects[id].status = status
    store.add_audit_entry(user, role, "UPDATE_STATUS", "ValidationProject", id,
                         f"Status: {old.value} → {status.value}")
    return store.projects[id]


# ==================== MODULE 2: SYSTEM BOUNDARY ====================

@app.get("/projects/{project_id}/boundary", response_model=SystemBoundary, tags=["System Boundary"])
async def get_boundary(project_id: str):
    for sb in store.system_boundaries.values():
        if sb.project_id == project_id:
            return sb
    raise HTTPException(404, "System boundary not found")

@app.post("/projects/{project_id}/boundary", response_model=SystemBoundary, tags=["System Boundary"])
async def create_boundary(project_id: str, sb: SystemBoundaryCreate, user: str = Query(...), role: str = Query(...)):
    if project_id not in store.projects:
        raise HTTPException(404, "Project not found")
    new_id = store.generate_id('boundary')
    new_sb = SystemBoundary(id=new_id, project_id=project_id, **sb.dict(),
                           created_at=datetime.utcnow(), created_by=user)
    store.system_boundaries[new_id] = new_sb
    store.add_audit_entry(user, role, "CREATE", "SystemBoundary", new_id, "Created system boundary")
    return new_sb

@app.post("/boundary/{id}/approve", response_model=SystemBoundary, tags=["System Boundary"])
async def approve_boundary(id: str, req: ApproveRequest, user: str = Query(...), role: str = Query(...)):
    if role not in ["QA", "Admin"]:
        raise HTTPException(403, "Only QA can approve")
    if id not in store.system_boundaries:
        raise HTTPException(404, "Not found")
    sb = store.system_boundaries[id]
    sb.status = "Approved"
    sb.approved_by = user
    sb.approved_at = datetime.utcnow()
    store.add_audit_entry(user, role, "APPROVE", "SystemBoundary", id, req.reason)
    return sb


# ==================== MODULE 3: URS ====================

@app.get("/projects/{project_id}/urs", response_model=List[Requirement], tags=["URS"])
async def get_urs(project_id: str):
    return [r for r in store.requirements.values() if r.project_id == project_id]

@app.get("/urs/{id}", response_model=Requirement, tags=["URS"])
async def get_urs_by_id(id: str):
    if id not in store.requirements:
        raise HTTPException(404, "URS not found")
    return store.requirements[id]

@app.post("/projects/{project_id}/urs", response_model=Requirement, tags=["URS"])
async def create_urs(project_id: str, urs: RequirementCreate, user: str = Query(...), role: str = Query(...)):
    if project_id not in store.projects:
        raise HTTPException(404, "Project not found")
    new_id = store.generate_id('urs')
    overall = calc_risk(urs.patient_safety_risk, urs.product_quality_risk, urs.data_integrity_risk)
    new_urs = Requirement(id=new_id, project_id=project_id, overall_risk=overall, **urs.dict(),
                         created_at=datetime.utcnow(), created_by=user)
    store.requirements[new_id] = new_urs
    store.add_audit_entry(user, role, "CREATE", "Requirement", new_id, f"Created: {urs.title}")
    return new_urs

@app.post("/urs/{id}/approve", response_model=Requirement, tags=["URS"])
async def approve_urs(id: str, req: ApproveRequest, user: str = Query(...), role: str = Query(...)):
    if role not in ["QA", "Admin"]:
        raise HTTPException(403, "Only QA can approve")
    if id not in store.requirements:
        raise HTTPException(404, "Not found")
    urs = store.requirements[id]
    if urs.created_by == user:
        raise HTTPException(400, "Cannot self-approve")
    urs.status = URSStatus.APPROVED
    urs.approved_by = user
    urs.approved_at = datetime.utcnow()
    store.add_audit_entry(user, role, "APPROVE", "Requirement", id, req.reason)
    return urs

@app.post("/urs/{id}/ai-risk", response_model=AIRiskResponse, tags=["URS", "AI"])
async def ai_risk(id: str):
    if id not in store.requirements:
        raise HTTPException(404, "Not found")
    result = AIEngine.assess_risk(store.requirements[id])
    store.add_audit_entry("AI-System", "AI", "RISK_ASSESSMENT", "Requirement", id,
                         f"Suggested: {result['overall_risk'].value}")
    return AIRiskResponse(**result)

@app.post("/urs/{id}/ai-ambiguity", response_model=AIAmbiguityResponse, tags=["URS", "AI"])
async def ai_ambiguity(id: str):
    if id not in store.requirements:
        raise HTTPException(404, "Not found")
    result = AIEngine.detect_ambiguity(store.requirements[id])
    store.add_audit_entry("AI-System", "AI", "AMBIGUITY_CHECK", "Requirement", id,
                         f"Score: {result['ambiguity_score']}")
    return AIAmbiguityResponse(**result)

@app.post("/urs/{id}/apply-risk", response_model=Requirement, tags=["URS"])
async def apply_risk(id: str, gxp_impact: bool, patient_safety_risk: RiskLevel,
                    product_quality_risk: RiskLevel, data_integrity_risk: RiskLevel,
                    user: str = Query(...), role: str = Query(...)):
    if id not in store.requirements:
        raise HTTPException(404, "Not found")
    urs = store.requirements[id]
    urs.gxp_impact = gxp_impact
    urs.patient_safety_risk = patient_safety_risk
    urs.product_quality_risk = product_quality_risk
    urs.data_integrity_risk = data_integrity_risk
    urs.overall_risk = calc_risk(patient_safety_risk, product_quality_risk, data_integrity_risk)
    store.add_audit_entry(user, role, "UPDATE_RISK", "Requirement", id, f"Overall: {urs.overall_risk.value}")
    return urs


# ==================== MODULE 5: FS ====================

@app.get("/projects/{project_id}/fs", response_model=List[FunctionalSpecification], tags=["FS"])
async def get_fs(project_id: str):
    return [f for f in store.functional_specs.values() if f.project_id == project_id]

@app.get("/fs/{id}", response_model=FunctionalSpecification, tags=["FS"])
async def get_fs_by_id(id: str):
    if id not in store.functional_specs:
        raise HTTPException(404, "FS not found")
    return store.functional_specs[id]

@app.post("/fs", response_model=FunctionalSpecification, tags=["FS"])
async def create_fs(fs: FunctionalSpecificationCreate, user: str = Query(...), role: str = Query(...)):
    if fs.urs_id not in store.requirements:
        raise HTTPException(404, "URS not found")
    urs = store.requirements[fs.urs_id]
    if urs.status != URSStatus.APPROVED:
        raise HTTPException(400, "URS must be approved first")
    new_id = store.generate_id('fs')
    new_fs = FunctionalSpecification(id=new_id, project_id=urs.project_id, **fs.dict(),
                                    created_at=datetime.utcnow(), created_by=user)
    store.functional_specs[new_id] = new_fs
    store.add_audit_entry(user, role, "CREATE", "FunctionalSpecification", new_id, f"Created: {fs.title}")
    return new_fs

@app.post("/fs/{id}/approve", response_model=FunctionalSpecification, tags=["FS"])
async def approve_fs(id: str, req: ApproveRequest, user: str = Query(...), role: str = Query(...)):
    if role not in ["QA", "Admin"]:
        raise HTTPException(403, "Only QA can approve")
    if id not in store.functional_specs:
        raise HTTPException(404, "Not found")
    fs = store.functional_specs[id]
    fs.status = FSStatus.APPROVED
    fs.approved_by = user
    fs.approved_at = datetime.utcnow()
    store.add_audit_entry(user, role, "APPROVE", "FunctionalSpecification", id, req.reason)
    return fs

@app.post("/urs/{id}/ai-suggest-fs", response_model=AISuggestFSResponse, tags=["FS", "AI"])
async def ai_suggest_fs(id: str):
    if id not in store.requirements:
        raise HTTPException(404, "Not found")
    result = AIEngine.suggest_fs(store.requirements[id])
    store.add_audit_entry("AI-System", "AI", "SUGGEST_FS", "Requirement", id, "Generated FS suggestion")
    return AISuggestFSResponse(**result)


# ==================== MODULE 5B: DS ====================

@app.get("/projects/{project_id}/ds", response_model=List[DesignSpecification], tags=["DS"])
async def get_ds(project_id: str):
    return [d for d in store.design_specs.values() if d.project_id == project_id]

@app.get("/ds/{id}", response_model=DesignSpecification, tags=["DS"])
async def get_ds_by_id(id: str):
    if id not in store.design_specs:
        raise HTTPException(404, "DS not found")
    return store.design_specs[id]

@app.post("/ds", response_model=DesignSpecification, tags=["DS"])
async def create_ds(fs_id: str = Query(...), title: str = Query(...), description: str = Query(...),
                   technical_details: str = Query(""), data_structures: str = Query(""),
                   interfaces: str = Query(""), user: str = Query(...), role: str = Query(...)):
    if fs_id not in store.functional_specs:
        raise HTTPException(404, "FS not found")
    fs = store.functional_specs[fs_id]
    if fs.status != FSStatus.APPROVED:
        raise HTTPException(400, "FS must be approved first")
    new_id = store.generate_id('ds')
    new_ds = DesignSpecification(
        id=new_id, fs_id=fs_id, project_id=fs.project_id,
        title=title, description=description,
        technical_design=technical_details,
        required=True,
        status=FSStatus.DRAFT,
        created_at=datetime.utcnow(), created_by=user
    )
    store.design_specs[new_id] = new_ds
    store.add_audit_entry(user, role, "CREATE", "DesignSpecification", new_id, f"Created: {title}")
    return new_ds

@app.post("/ds/{id}/approve", response_model=DesignSpecification, tags=["DS"])
async def approve_ds(id: str, req: ApproveRequest, user: str = Query(...), role: str = Query(...)):
    if role not in ["QA", "Admin"]:
        raise HTTPException(403, "Only QA can approve")
    if id not in store.design_specs:
        raise HTTPException(404, "Not found")
    ds = store.design_specs[id]
    ds.status = FSStatus.APPROVED
    ds.approved_by = user
    ds.approved_at = datetime.utcnow()
    store.add_audit_entry(user, role, "APPROVE", "DesignSpecification", id, req.reason)
    return ds


# ==================== MODULE 6 & 7: TEST MANAGEMENT ====================

@app.get("/projects/{project_id}/test-cases", response_model=List[TestCase], tags=["Test Cases"])
async def get_tests(project_id: str):
    return [t for t in store.test_cases.values() if t.project_id == project_id]

@app.post("/test-cases", response_model=TestCase, tags=["Test Cases"])
async def create_test(tc: TestCaseCreate, user: str = Query(...), role: str = Query(...)):
    if tc.fs_id not in store.functional_specs:
        raise HTTPException(404, "FS not found")
    fs = store.functional_specs[tc.fs_id]
    new_id = store.generate_id('tc')
    new_tc = TestCase(id=new_id, urs_id=fs.urs_id, project_id=fs.project_id, **tc.dict(),
                     created_at=datetime.utcnow(), created_by=user)
    store.test_cases[new_id] = new_tc
    store.add_audit_entry(user, role, "CREATE", "TestCase", new_id, f"Created: {tc.title}")
    return new_tc

@app.post("/fs/{id}/ai-suggest-tc", tags=["Test Cases", "AI"])
async def ai_suggest_tc(id: str):
    if id not in store.functional_specs:
        raise HTTPException(404, "FS not found")
    fs = store.functional_specs[id]
    urs = store.requirements.get(fs.urs_id)
    if not urs:
        raise HTTPException(404, "URS not found")
    results = AIEngine.suggest_test_cases(fs, urs)
    store.add_audit_entry("AI-System", "AI", "SUGGEST_TC", "FunctionalSpecification", id,
                         f"Generated {len(results)} test case suggestions")
    return results

@app.get("/projects/{project_id}/test-execution", response_model=List[TestExecution], tags=["Test Execution"])
async def get_executions(project_id: str):
    return [e for e in store.test_executions.values() if e.project_id == project_id]

@app.post("/test-execution", response_model=TestExecution, tags=["Test Execution"])
async def execute_test(ex: TestExecutionCreate, user: str = Query(...), role: str = Query(...)):
    if role not in ["Executor", "Admin"]:
        raise HTTPException(403, "Only Executor can execute")
    if ex.test_case_id not in store.test_cases:
        raise HTTPException(404, "Test case not found")
    tc = store.test_cases[ex.test_case_id]
    new_id = store.generate_id('exec')
    new_ex = TestExecution(id=new_id, project_id=tc.project_id, executor=user,
                          execution_date=datetime.utcnow(), **ex.dict(), created_at=datetime.utcnow())
    store.test_executions[new_id] = new_ex
    store.add_audit_entry(user, role, "EXECUTE", "TestExecution", new_id,
                         f"Executed {ex.test_case_id}: {ex.result.value}")
    return new_ex


# ==================== MODULE 8: DEVIATIONS ====================

@app.get("/projects/{project_id}/deviations", response_model=List[Deviation], tags=["Deviations"])
async def get_deviations(project_id: str):
    return [d for d in store.deviations.values() if d.project_id == project_id]

@app.post("/deviations", response_model=Deviation, tags=["Deviations"])
async def create_deviation(dev: DeviationCreate, user: str = Query(...), role: str = Query(...)):
    if dev.test_execution_id not in store.test_executions:
        raise HTTPException(404, "Execution not found")
    ex = store.test_executions[dev.test_execution_id]
    new_id = store.generate_id('dev')
    new_dev = Deviation(id=new_id, project_id=ex.project_id, **dev.dict(),
                       created_at=datetime.utcnow(), created_by=user)
    store.deviations[new_id] = new_dev
    ex.deviation_id = new_id
    store.add_audit_entry(user, role, "CREATE", "Deviation", new_id, f"Created: {dev.title}")
    return new_dev

@app.patch("/deviations/{id}/investigate", response_model=Deviation, tags=["Deviations"])
async def investigate(id: str, root_cause: str, category: str, summary: str,
                     user: str = Query(...), role: str = Query(...)):
    if id not in store.deviations:
        raise HTTPException(404, "Not found")
    dev = store.deviations[id]
    dev.root_cause = root_cause
    dev.root_cause_category = category
    dev.investigation_summary = summary
    dev.status = DeviationStatus.INVESTIGATING
    store.add_audit_entry(user, role, "INVESTIGATE", "Deviation", id, "Investigation completed")
    return dev

@app.patch("/deviations/{id}/capa", response_model=Deviation, tags=["Deviations"])
async def assign_capa(id: str, corrective: str, preventive: str, due_date: str,
                     user: str = Query(...), role: str = Query(...)):
    if id not in store.deviations:
        raise HTTPException(404, "Not found")
    dev = store.deviations[id]
    dev.capa_corrective = corrective
    dev.capa_preventive = preventive
    dev.capa_due_date = due_date
    dev.status = DeviationStatus.CAPA_ASSIGNED
    store.add_audit_entry(user, role, "ASSIGN_CAPA", "Deviation", id, "CAPA assigned")
    return dev

@app.patch("/deviations/{id}/close", response_model=Deviation, tags=["Deviations"])
async def close_deviation(id: str, effectiveness_evidence: str,
                         user: str = Query(...), role: str = Query(...)):
    if role not in ["QA", "Admin"]:
        raise HTTPException(403, "Only QA can close")
    if id not in store.deviations:
        raise HTTPException(404, "Not found")
    dev = store.deviations[id]
    dev.effectiveness_verified = True
    dev.effectiveness_evidence = effectiveness_evidence
    dev.status = DeviationStatus.CLOSED
    dev.closed_by = user
    dev.closed_at = datetime.utcnow()
    store.add_audit_entry(user, role, "CLOSE", "Deviation", id, "Deviation closed")
    return dev

@app.post("/deviations/{id}/ai-root-cause", response_model=AISuggestRootCauseResponse, tags=["Deviations", "AI"])
async def ai_root_cause(id: str):
    if id not in store.deviations:
        raise HTTPException(404, "Not found")
    result = AIEngine.suggest_root_cause(store.deviations[id])
    store.add_audit_entry("AI-System", "AI", "SUGGEST_ROOT_CAUSE", "Deviation", id, "AI root cause suggestion")
    return AISuggestRootCauseResponse(**result)


# ==================== MODULE 15: CHANGE MANAGEMENT ====================

@app.get("/projects/{project_id}/changes", response_model=List[ChangeRequest], tags=["Change Management"])
async def get_changes(project_id: str):
    return [c for c in store.change_requests.values() if c.project_id == project_id]

@app.post("/projects/{project_id}/changes", response_model=ChangeRequest, tags=["Change Management"])
async def create_change(project_id: str, change: ChangeRequestCreate,
                       user: str = Query(...), role: str = Query(...)):
    if project_id not in store.projects:
        raise HTTPException(404, "Project not found")
    new_id = store.generate_id('change')
    new_change = ChangeRequest(id=new_id, project_id=project_id, **change.dict(),
                              requested_by=user, requested_at=datetime.utcnow())
    store.change_requests[new_id] = new_change
    store.add_audit_entry(user, role, "CREATE", "ChangeRequest", new_id, f"Created: {change.title}")
    return new_change

@app.patch("/changes/{id}/analyze", response_model=ChangeRequest, tags=["Change Management"])
async def analyze_change(id: str, impact: str, affected_urs: List[str], affected_fs: List[str],
                        affected_tc: List[str], revalidation_required: bool, scope: str,
                        user: str = Query(...), role: str = Query(...)):
    if id not in store.change_requests:
        raise HTTPException(404, "Not found")
    cr = store.change_requests[id]
    cr.impact_assessment = impact
    cr.affected_urs = affected_urs
    cr.affected_fs = affected_fs
    cr.affected_tc = affected_tc
    cr.revalidation_required = revalidation_required
    cr.revalidation_scope = scope
    cr.status = ChangeStatus.IMPACT_ANALYSIS
    store.add_audit_entry(user, role, "ANALYZE", "ChangeRequest", id, "Impact analysis completed")
    return cr

@app.patch("/changes/{id}/approve", response_model=ChangeRequest, tags=["Change Management"])
async def approve_change(id: str, req: ApproveRequest, user: str = Query(...), role: str = Query(...)):
    if role not in ["QA", "Admin"]:
        raise HTTPException(403, "Only QA can approve")
    if id not in store.change_requests:
        raise HTTPException(404, "Not found")
    cr = store.change_requests[id]
    cr.status = ChangeStatus.APPROVED
    cr.approved_by = user
    cr.approved_at = datetime.utcnow()
    store.add_audit_entry(user, role, "APPROVE", "ChangeRequest", id, req.reason)
    return cr

@app.post("/changes/{id}/ai-impact", tags=["Change Management", "AI"])
async def ai_impact(id: str):
    if id not in store.change_requests:
        raise HTTPException(404, "Not found")
    cr = store.change_requests[id]
    reqs = [r for r in store.requirements.values() if r.project_id == cr.project_id]
    specs = [f for f in store.functional_specs.values() if f.project_id == cr.project_id]
    tests = [t for t in store.test_cases.values() if t.project_id == cr.project_id]
    result = AIEngine.analyze_change_impact(cr, reqs, specs, tests)
    store.add_audit_entry("AI-System", "AI", "IMPACT_ANALYSIS", "ChangeRequest", id, "AI impact analysis")
    return result


# ==================== MODULE 9: TRACEABILITY ====================

@app.get("/projects/{project_id}/traceability", response_model=List[TraceabilityRow], tags=["Traceability"])
async def get_traceability(project_id: str):
    if project_id not in store.projects:
        raise HTTPException(404, "Project not found")
    
    matrix = []
    urs_list = [r for r in store.requirements.values() if r.project_id == project_id]
    
    for urs in urs_list:
        fs_list = [f for f in store.functional_specs.values() if f.urs_id == urs.id]
        
        if not fs_list:
            matrix.append(TraceabilityRow(
                urs_id=urs.id, urs_title=urs.title, urs_status=urs.status.value,
                urs_risk=urs.overall_risk.value, status="Not Started"
            ))
            continue
        
        for fs in fs_list:
            ds_list = [d for d in store.design_specs.values() if d.fs_id == fs.id]
            ds = ds_list[0] if ds_list else None
            tc_list = [t for t in store.test_cases.values() if t.fs_id == fs.id]
            
            if not tc_list:
                matrix.append(TraceabilityRow(
                    urs_id=urs.id, urs_title=urs.title, urs_status=urs.status.value,
                    urs_risk=urs.overall_risk.value,
                    fs_id=fs.id, fs_title=fs.title, fs_status=fs.status.value,
                    ds_id=ds.id if ds else None, ds_title=ds.title if ds else None,
                    status="Partial"
                ))
                continue
            
            for tc in tc_list:
                execs = [e for e in store.test_executions.values() if e.test_case_id == tc.id]
                ex = sorted(execs, key=lambda x: x.execution_date, reverse=True)[0] if execs else None
                dev = store.deviations.get(ex.deviation_id) if ex and ex.deviation_id else None
                
                status = "Complete" if ex and ex.result != TestResult.NOT_EXECUTED else "Partial"
                if ex and ex.result == TestResult.FAIL:
                    status = "Failed"
                
                matrix.append(TraceabilityRow(
                    urs_id=urs.id, urs_title=urs.title, urs_status=urs.status.value,
                    urs_risk=urs.overall_risk.value,
                    fs_id=fs.id, fs_title=fs.title, fs_status=fs.status.value,
                    ds_id=ds.id if ds else None, ds_title=ds.title if ds else None,
                    tc_id=tc.id, tc_title=tc.title, tc_type=tc.test_type,
                    exec_id=ex.id if ex else None,
                    exec_result=ex.result.value if ex else None,
                    exec_date=ex.execution_date.isoformat() if ex else None,
                    deviation_id=dev.id if dev else None,
                    deviation_status=dev.status.value if dev else None,
                    status=status
                ))
    
    return matrix


# ==================== MODULE 14: AI CONSISTENCY ====================

@app.post("/projects/{project_id}/ai-consistency", response_model=AIConsistencyCheckResponse, tags=["AI"])
async def ai_consistency(project_id: str):
    if project_id not in store.projects:
        raise HTTPException(404, "Not found")
    reqs = [r for r in store.requirements.values() if r.project_id == project_id]
    specs = [f for f in store.functional_specs.values() if f.project_id == project_id]
    tests = [t for t in store.test_cases.values() if t.project_id == project_id]
    result = AIEngine.check_consistency(project_id, reqs, specs, tests)
    store.add_audit_entry("AI-System", "AI", "CONSISTENCY_CHECK", "ValidationProject", project_id,
                         f"Score: {result['score']}")
    return AIConsistencyCheckResponse(**result)


# ==================== MODULE 10: VSR ====================

@app.get("/projects/{project_id}/vsr", response_model=ValidationSummaryReport, tags=["VSR"])
async def generate_vsr(project_id: str, user: str = Query(...), role: str = Query(...)):
    if project_id not in store.projects:
        raise HTTPException(404, "Not found")
    
    proj = store.projects[project_id]
    urs = [r for r in store.requirements.values() if r.project_id == project_id]
    fs = [f for f in store.functional_specs.values() if f.project_id == project_id]
    tc = [t for t in store.test_cases.values() if t.project_id == project_id]
    execs = [e for e in store.test_executions.values() if e.project_id == project_id]
    devs = [d for d in store.deviations.values() if d.project_id == project_id]
    changes = [c for c in store.change_requests.values() if c.project_id == project_id]
    
    # Get boundary
    boundary = next((sb for sb in store.system_boundaries.values() if sb.project_id == project_id), None)
    
    # Calculate stats
    approved_urs = len([r for r in urs if r.status == URSStatus.APPROVED])
    approved_fs = len([f for f in fs if f.status == FSStatus.APPROVED])
    passed = len([e for e in execs if e.result == TestResult.PASS])
    failed = len([e for e in execs if e.result == TestResult.FAIL])
    open_devs = len([d for d in devs if d.status not in [DeviationStatus.CLOSED]])
    
    # Determine decision
    if failed == 0 and open_devs == 0 and len(tc) > 0 and passed > 0:
        decision = "Approved"
        conclusion = "VALIDATION SUCCESSFUL - All testing completed with no open issues."
        recommendation = "System is recommended for production release."
        conditions = []
    elif open_devs > 0:
        decision = "Conditionally Approved"
        conclusion = "VALIDATION CONDITIONALLY COMPLETE - Open deviations require resolution."
        recommendation = "Resolve all deviations before production use."
        conditions = [f"Close {open_devs} open deviation(s)", "Verify CAPA effectiveness"]
    else:
        decision = "Not Approved"
        conclusion = "VALIDATION IN PROGRESS - Testing incomplete."
        recommendation = "Complete all testing and resolve issues before release."
        conditions = ["Complete test execution", "Review all failures"]
    
    store.add_audit_entry(user, role, "GENERATE_VSR", "ValidationProject", project_id, "Generated VSR")
    
    return ValidationSummaryReport(
        project_id=project_id,
        project_name=proj.name,
        generated_at=datetime.utcnow(),
        generated_by=user,
        scope={
            "system_name": proj.name,
            "project_type": proj.project_type.value,
            "system_type": proj.system_type.value,
            "validation_model": proj.validation_model.value,
            "intended_use": proj.intended_use,
            "regulations": proj.applicable_regulations,
            "total_urs": len(urs),
            "approved_urs": approved_urs,
            "total_fs": len(fs),
            "approved_fs": approved_fs
        },
        system_boundary={
            "defined": boundary is not None,
            "approved": boundary.status == "Approved" if boundary else False,
            "in_scope_count": len(boundary.in_scope_items) if boundary else 0,
            "interfaces_count": len(boundary.interfaces) if boundary else 0
        },
        testing_summary={
            "total_test_cases": len(tc),
            "total_executions": len(execs),
            "passed": passed,
            "failed": failed,
            "blocked": len([e for e in execs if e.result == TestResult.BLOCKED]),
            "not_executed": len([e for e in execs if e.result == TestResult.NOT_EXECUTED]),
            "pass_rate": f"{(passed/len(execs)*100):.1f}%" if execs else "N/A"
        },
        test_coverage={
            "urs_with_tests": len(set(t.urs_id for t in tc)),
            "fs_with_tests": len(set(t.fs_id for t in tc)),
            "coverage_pct": f"{(len(set(t.urs_id for t in tc))/len(urs)*100):.0f}%" if urs else "N/A"
        },
        deviations_summary={
            "total": len(devs),
            "open": open_devs,
            "closed": len([d for d in devs if d.status == DeviationStatus.CLOSED]),
            "by_severity": {
                "Critical": len([d for d in devs if d.severity == RiskLevel.CRITICAL]),
                "High": len([d for d in devs if d.severity == RiskLevel.HIGH]),
                "Medium": len([d for d in devs if d.severity == RiskLevel.MEDIUM]),
                "Low": len([d for d in devs if d.severity == RiskLevel.LOW])
            }
        },
        capa_summary={
            "total_capas": len([d for d in devs if d.capa_corrective]),
            "verified": len([d for d in devs if d.effectiveness_verified]),
            "pending": len([d for d in devs if d.capa_corrective and not d.effectiveness_verified])
        },
        changes_summary={
            "total": len(changes),
            "approved": len([c for c in changes if c.status == ChangeStatus.APPROVED]),
            "pending": len([c for c in changes if c.status not in [ChangeStatus.COMPLETED, ChangeStatus.REJECTED]])
        },
        traceability_summary={
            "complete_chains": len([r for r in urs if any(
                t.urs_id == r.id and any(e.test_case_id == t.id and e.result == TestResult.PASS
                    for e in execs) for t in tc)]),
            "partial_chains": len(urs) - len([r for r in urs if any(t.urs_id == r.id for t in tc)]),
            "gaps": [r.id for r in urs if not any(t.urs_id == r.id for t in tc)]
        },
        conclusion=conclusion,
        recommendation=recommendation,
        validation_decision=decision,
        conditions=conditions
    )


# ==================== MODULE 11: AUDIT TRAIL ====================

@app.get("/audit-trail", response_model=List[AuditTrail], tags=["Audit Trail"])
async def get_audit(entity: Optional[str] = None, entity_id: Optional[str] = None,
                   user: Optional[str] = None, action: Optional[str] = None, limit: int = 200):
    entries = store.audit_trail.copy()
    if entity:
        entries = [e for e in entries if e.entity == entity]
    if entity_id:
        entries = [e for e in entries if e.entity_id == entity_id]
    if user:
        entries = [e for e in entries if e.user == user]
    if action:
        entries = [e for e in entries if e.action == action]
    entries.sort(key=lambda x: x.timestamp, reverse=True)
    return entries[:limit]


# ==================== MODULE 16: DASHBOARDS ====================

@app.get("/dashboard/{role_name}", response_model=RoleDashboard, tags=["Dashboards"])
async def get_dashboard(role_name: str, user: str = Query(...)):
    # Calculate metrics
    projects = list(store.projects.values())
    urs = list(store.requirements.values())
    fs = list(store.functional_specs.values())
    tc = list(store.test_cases.values())
    execs = list(store.test_executions.values())
    devs = list(store.deviations.values())
    changes = list(store.change_requests.values())
    
    metrics = DashboardMetrics(
        total_projects=len(projects),
        active_projects=len([p for p in projects if p.status not in [ProjectStatus.COMPLETED, ProjectStatus.ON_HOLD]]),
        completed_projects=len([p for p in projects if p.status == ProjectStatus.COMPLETED]),
        projects_by_status={s.value: len([p for p in projects if p.status == s]) for s in ProjectStatus},
        projects_by_risk={r.value: len([p for p in projects if p.risk_level == r]) for r in RiskLevel},
        total_urs=len(urs),
        approved_urs=len([r for r in urs if r.status == URSStatus.APPROVED]),
        draft_urs=len([r for r in urs if r.status == URSStatus.DRAFT]),
        urs_by_risk={r.value: len([u for u in urs if u.overall_risk == r]) for r in RiskLevel},
        high_risk_urs=len([u for u in urs if u.overall_risk in [RiskLevel.HIGH, RiskLevel.CRITICAL]]),
        total_test_cases=len(tc),
        executed_tests=len([e for e in execs if e.result != TestResult.NOT_EXECUTED]),
        passed_tests=len([e for e in execs if e.result == TestResult.PASS]),
        failed_tests=len([e for e in execs if e.result == TestResult.FAIL]),
        blocked_tests=len([e for e in execs if e.result == TestResult.BLOCKED]),
        pass_rate=round(len([e for e in execs if e.result == TestResult.PASS]) / max(len([e for e in execs if e.result != TestResult.NOT_EXECUTED]), 1) * 100, 1),
        total_deviations=len(devs),
        open_deviations=len([d for d in devs if d.status not in [DeviationStatus.CLOSED]]),
        closed_deviations=len([d for d in devs if d.status == DeviationStatus.CLOSED]),
        deviations_by_severity={r.value: len([d for d in devs if d.severity == r]) for r in RiskLevel},
        total_changes=len(changes),
        pending_changes=len([c for c in changes if c.status not in [ChangeStatus.COMPLETED, ChangeStatus.REJECTED]]),
        approved_changes=len([c for c in changes if c.status == ChangeStatus.APPROVED]),
        ai_suggestions_count=len([a for a in store.audit_trail if a.user == "AI-System"]),
        traceability_coverage=round(len([u for u in urs if any(t.urs_id == u.id for t in tc)]) / max(len(urs), 1) * 100, 1),
        documentation_completeness=round((len([u for u in urs if u.status == URSStatus.APPROVED]) + len([f for f in fs if f.status == FSStatus.APPROVED])) / max(len(urs) + len(fs), 1) * 100, 1)
    )
    
    # Role-specific data
    pending_approvals = []
    my_tasks = []
    alerts = []
    quick_actions = []
    
    if role_name == "Admin":
        pending_approvals = [{"type": "Project", "count": len([p for p in projects if p.status == ProjectStatus.PLANNING])}]
        alerts = [
            {"type": "warning", "message": f"{metrics.open_deviations} open deviations"} if metrics.open_deviations > 0 else None,
            {"type": "info", "message": f"{metrics.pending_changes} pending change requests"} if metrics.pending_changes > 0 else None
        ]
        quick_actions = [
            {"action": "create_project", "label": "New Project"},
            {"action": "view_audit", "label": "View Audit Trail"},
            {"action": "system_health", "label": "System Health"}
        ]
        
    elif role_name == "Validation Lead":
        my_tasks = [
            {"type": "Draft URS", "count": metrics.draft_urs, "action": "review_urs"},
            {"type": "Pending FS", "count": len([f for f in fs if f.status == FSStatus.DRAFT]), "action": "review_fs"}
        ]
        alerts = [
            {"type": "warning", "message": f"{metrics.high_risk_urs} high-risk requirements need attention"} if metrics.high_risk_urs > 0 else None
        ]
        quick_actions = [
            {"action": "create_urs", "label": "New Requirement"},
            {"action": "ai_assist", "label": "AI Assistant"},
            {"action": "view_traceability", "label": "Traceability"}
        ]
        
    elif role_name == "QA":
        pending_approvals = [
            {"type": "URS", "count": len([u for u in urs if u.status == URSStatus.DRAFT]), "items": [u.id for u in urs if u.status == URSStatus.DRAFT][:5]},
            {"type": "FS", "count": len([f for f in fs if f.status == FSStatus.DRAFT]), "items": [f.id for f in fs if f.status == FSStatus.DRAFT][:5]},
            {"type": "Deviation", "count": len([d for d in devs if d.status == DeviationStatus.CAPA_VERIFIED])},
            {"type": "Change", "count": len([c for c in changes if c.status == ChangeStatus.IMPACT_ANALYSIS])}
        ]
        alerts = [
            {"type": "error", "message": f"{metrics.open_deviations} deviations require review"} if metrics.open_deviations > 0 else None,
            {"type": "warning", "message": f"{metrics.failed_tests} failed tests need investigation"} if metrics.failed_tests > 0 else None
        ]
        quick_actions = [
            {"action": "approval_queue", "label": "Approval Queue"},
            {"action": "deviation_review", "label": "Review Deviations"},
            {"action": "generate_vsr", "label": "Generate VSR"}
        ]
        
    elif role_name == "Executor":
        pending_tests = len(tc) - len(set(e.test_case_id for e in execs))
        my_tasks = [
            {"type": "Tests to Execute", "count": pending_tests, "action": "execute_tests"},
            {"type": "My Executions", "count": len([e for e in execs if e.executor == user]), "action": "my_executions"}
        ]
        alerts = [
            {"type": "info", "message": f"{pending_tests} test cases awaiting execution"} if pending_tests > 0 else None
        ]
        quick_actions = [
            {"action": "execute_test", "label": "Execute Test"},
            {"action": "create_deviation", "label": "Log Deviation"},
            {"action": "my_results", "label": "My Results"}
        ]
    
    # Filter None alerts
    alerts = [a for a in alerts if a]
    
    # Recent activity (last 10 relevant entries)
    recent = [a for a in store.audit_trail if not role_name or a.role == role_name or role_name == "Admin"][-10:]
    recent_activity = [{"timestamp": a.timestamp.isoformat(), "action": a.action, "entity": a.entity, "details": a.details} for a in reversed(recent)]
    
    # Trends (mock data for demo)
    trends = {
        "test_execution": [
            {"date": (datetime.utcnow() - timedelta(days=6)).strftime("%Y-%m-%d"), "passed": 2, "failed": 1},
            {"date": (datetime.utcnow() - timedelta(days=5)).strftime("%Y-%m-%d"), "passed": 3, "failed": 0},
            {"date": (datetime.utcnow() - timedelta(days=4)).strftime("%Y-%m-%d"), "passed": 4, "failed": 1},
            {"date": (datetime.utcnow() - timedelta(days=3)).strftime("%Y-%m-%d"), "passed": 2, "failed": 0},
            {"date": (datetime.utcnow() - timedelta(days=2)).strftime("%Y-%m-%d"), "passed": 5, "failed": 0},
            {"date": (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%d"), "passed": 3, "failed": 1},
            {"date": datetime.utcnow().strftime("%Y-%m-%d"), "passed": metrics.passed_tests, "failed": metrics.failed_tests}
        ],
        "deviations": [
            {"date": (datetime.utcnow() - timedelta(days=6)).strftime("%Y-%m-%d"), "opened": 1, "closed": 0},
            {"date": (datetime.utcnow() - timedelta(days=3)).strftime("%Y-%m-%d"), "opened": 0, "closed": 1},
            {"date": datetime.utcnow().strftime("%Y-%m-%d"), "opened": metrics.open_deviations, "closed": metrics.closed_deviations}
        ]
    }
    
    return RoleDashboard(
        role=role_name,
        user=user,
        metrics=metrics,
        pending_approvals=pending_approvals,
        my_tasks=my_tasks,
        recent_activity=recent_activity,
        alerts=alerts,
        quick_actions=quick_actions,
        trends=trends
    )


# ==================== HEALTH ====================

@app.get("/health", tags=["System"])
async def health():
    return {
        "status": "healthy",
        "version": "3.0.0",
        "modules": 16,
        "timestamp": datetime.utcnow().isoformat(),
        "counts": {
            "projects": len(store.projects),
            "urs": len(store.requirements),
            "fs": len(store.functional_specs),
            "test_cases": len(store.test_cases),
            "executions": len(store.test_executions),
            "deviations": len(store.deviations),
            "changes": len(store.change_requests),
            "audit_entries": len(store.audit_trail)
        }
    }
