"""
VMS In-Memory Data Store - Enterprise Edition
Comprehensive sample data for all 16 modules
"""
from datetime import datetime, timedelta
from typing import List, Dict
from .models import (
    ValidationProject, Requirement, FunctionalSpecification,
    DesignSpecification, TestCase, TestExecution, Deviation,
    SystemBoundary, ChangeRequest, ElectronicSignature, AuditTrail,
    SystemType, ValidationModel, ProjectStatus, ProjectType,
    RiskLevel, URSStatus, FSStatus, TestResult, DeviationStatus,
    ChangeStatus, ChangePriority, SignatureType
)


class DataStore:
    def __init__(self):
        self.projects: Dict[str, ValidationProject] = {}
        self.system_boundaries: Dict[str, SystemBoundary] = {}
        self.requirements: Dict[str, Requirement] = {}
        self.functional_specs: Dict[str, FunctionalSpecification] = {}
        self.design_specs: Dict[str, DesignSpecification] = {}
        self.test_cases: Dict[str, TestCase] = {}
        self.test_executions: Dict[str, TestExecution] = {}
        self.deviations: Dict[str, Deviation] = {}
        self.change_requests: Dict[str, ChangeRequest] = {}
        self.signatures: Dict[str, ElectronicSignature] = {}
        self.audit_trail: List[AuditTrail] = []
        
        # Counters
        self._counters = {
            'project': 0, 'boundary': 0, 'urs': 0, 'fs': 0, 'ds': 0,
            'tc': 0, 'exec': 0, 'dev': 0, 'change': 0, 'sig': 0
        }
        
        self._init_comprehensive_data()
    
    def _init_comprehensive_data(self):
        """Initialize comprehensive pharmaceutical validation data"""
        
        # ============ PROJECT 1: LIMS (Complete validation) ============
        proj1 = ValidationProject(
            id="PROJ-001",
            name="LIMS System Validation",
            project_type=ProjectType.NEW_SYSTEM,
            system_type=SystemType.GXP,
            validation_model=ValidationModel.V_MODEL,
            intended_use="Laboratory Information Management System for QC testing data management, sample tracking, instrument integration, and results reporting in pharmaceutical manufacturing.",
            scope="Includes all QC laboratory operations, sample management, instrument data acquisition, results calculation, CoA generation, and audit trail functionality.",
            applicable_regulations=["FDA 21 CFR Part 11", "EU Annex 11", "FDA 21 CFR Part 211", "GAMP 5"],
            status=ProjectStatus.TESTING,
            risk_level=RiskLevel.HIGH,
            validation_lead="validation.lead@pharma.com",
            qa_reviewer="qa.reviewer@pharma.com",
            project_sponsor="director.qa@pharma.com",
            target_completion="2024-06-30",
            created_at=datetime(2024, 1, 15, 9, 0, 0),
            created_by="admin@pharma.com"
        )
        self.projects[proj1.id] = proj1
        self._counters['project'] = 1
        
        # System Boundary for LIMS
        boundary1 = SystemBoundary(
            id="SB-001",
            project_id="PROJ-001",
            in_scope_items=[
                "Sample registration and tracking",
                "Test result entry and calculation",
                "Instrument data acquisition",
                "Audit trail for all GxP data",
                "Electronic signatures",
                "Certificate of Analysis generation",
                "User management and access control",
                "Report generation"
            ],
            out_of_scope_items=[
                "ERP integration (separate project)",
                "Instrument maintenance scheduling",
                "Training management",
                "Document management (uses separate DMS)"
            ],
            exclusion_justifications=[
                {"item": "ERP integration", "justification": "Covered under PROJ-002 ERP-MES Integration validation"},
                {"item": "Training management", "justification": "Non-GxP system, validated separately"}
            ],
            interfaces=[
                {"name": "SAP ERP", "type": "Outbound", "description": "Batch release data", "gxp_impact": True},
                {"name": "Empower CDS", "type": "Inbound", "description": "Chromatography results", "gxp_impact": True},
                {"name": "Active Directory", "type": "Bidirectional", "description": "User authentication", "gxp_impact": True}
            ],
            dependencies=[
                {"system": "SAP ERP", "description": "Material master data", "validation_status": "Validated"},
                {"system": "Empower CDS", "description": "Instrument data source", "validation_status": "Validated"}
            ],
            sop_references=[
                {"sop_id": "SOP-QC-001", "title": "Laboratory Sample Management", "version": "3.0"},
                {"sop_id": "SOP-IT-010", "title": "Computer System Validation", "version": "2.1"}
            ],
            version="1.0",
            status="Approved",
            approved_by="qa.reviewer@pharma.com",
            approved_at=datetime(2024, 1, 20, 14, 0, 0),
            created_at=datetime(2024, 1, 16, 10, 0, 0),
            created_by="validation.lead@pharma.com"
        )
        self.system_boundaries[boundary1.id] = boundary1
        self._counters['boundary'] = 1
        
        # URS for LIMS
        urs_data = [
            {
                "id": "URS-001", "category": "Functional",
                "title": "Electronic Records Integrity",
                "description": "The system shall ensure all electronic records comply with 21 CFR Part 11 requirements for data integrity, including audit trails, electronic signatures, and access controls.",
                "acceptance_criteria": "All GxP records must have complete audit trail. All modifications logged with who/what/when/why.",
                "patient_safety_risk": RiskLevel.HIGH, "product_quality_risk": RiskLevel.HIGH,
                "data_integrity_risk": RiskLevel.HIGH, "overall_risk": RiskLevel.HIGH,
                "status": URSStatus.APPROVED, "approved_by": "qa.reviewer@pharma.com",
                "approved_at": datetime(2024, 1, 20, 14, 30, 0)
            },
            {
                "id": "URS-002", "category": "Functional",
                "title": "Sample Chain of Custody",
                "description": "The system shall maintain complete chain of custody for all samples from receipt through disposal, including all transfers and storage locations.",
                "acceptance_criteria": "100% traceability from sample receipt to final disposition.",
                "patient_safety_risk": RiskLevel.MEDIUM, "product_quality_risk": RiskLevel.HIGH,
                "data_integrity_risk": RiskLevel.HIGH, "overall_risk": RiskLevel.HIGH,
                "status": URSStatus.APPROVED, "approved_by": "qa.reviewer@pharma.com",
                "approved_at": datetime(2024, 1, 21, 10, 0, 0)
            },
            {
                "id": "URS-003", "category": "Functional",
                "title": "Result Calculation Engine",
                "description": "The system shall automatically calculate test results based on configured formulas and display results with appropriate significant figures.",
                "acceptance_criteria": "Calculations accurate to 6 decimal places. Configurable rounding rules per test method.",
                "patient_safety_risk": RiskLevel.MEDIUM, "product_quality_risk": RiskLevel.HIGH,
                "data_integrity_risk": RiskLevel.MEDIUM, "overall_risk": RiskLevel.HIGH,
                "status": URSStatus.DRAFT, "ai_suggested": True,
                "ai_ambiguity_score": 0.3, "ai_ambiguity_notes": "Consider specifying validation approach for formula changes"
            },
            {
                "id": "URS-004", "category": "Interface",
                "title": "Instrument Data Acquisition",
                "description": "The system shall automatically acquire data from connected laboratory instruments via secure interfaces.",
                "acceptance_criteria": "Automated data transfer with integrity verification. No manual transcription required.",
                "patient_safety_risk": RiskLevel.LOW, "product_quality_risk": RiskLevel.HIGH,
                "data_integrity_risk": RiskLevel.HIGH, "overall_risk": RiskLevel.HIGH,
                "status": URSStatus.APPROVED, "approved_by": "qa.reviewer@pharma.com",
                "approved_at": datetime(2024, 1, 22, 11, 0, 0)
            },
            {
                "id": "URS-005", "category": "Security",
                "title": "Role-Based Access Control",
                "description": "The system shall enforce role-based access control with segregation of duties for critical functions.",
                "acceptance_criteria": "Users can only access functions appropriate to their role. No self-approval of own work.",
                "patient_safety_risk": RiskLevel.MEDIUM, "product_quality_risk": RiskLevel.MEDIUM,
                "data_integrity_risk": RiskLevel.HIGH, "overall_risk": RiskLevel.HIGH,
                "status": URSStatus.APPROVED, "approved_by": "qa.reviewer@pharma.com",
                "approved_at": datetime(2024, 1, 22, 14, 0, 0)
            }
        ]
        
        for urs in urs_data:
            req = Requirement(
                id=urs["id"], project_id="PROJ-001", category=urs["category"],
                title=urs["title"], description=urs["description"],
                acceptance_criteria=urs.get("acceptance_criteria", ""),
                gxp_impact=True,
                patient_safety_risk=urs["patient_safety_risk"],
                product_quality_risk=urs["product_quality_risk"],
                data_integrity_risk=urs["data_integrity_risk"],
                overall_risk=urs["overall_risk"],
                status=urs["status"],
                ai_suggested=urs.get("ai_suggested", False),
                ai_ambiguity_score=urs.get("ai_ambiguity_score"),
                ai_ambiguity_notes=urs.get("ai_ambiguity_notes"),
                approved_by=urs.get("approved_by"),
                approved_at=urs.get("approved_at"),
                created_at=datetime(2024, 1, 16, 10, 0, 0),
                created_by="validation.lead@pharma.com" if not urs.get("ai_suggested") else "AI-System"
            )
            self.requirements[req.id] = req
        self._counters['urs'] = 5
        
        # FS for LIMS
        fs_data = [
            {
                "id": "FS-001", "urs_id": "URS-001", "title": "Audit Trail Implementation",
                "description": "Comprehensive audit trail capturing user ID, timestamp, old value, new value, and reason for change for all GxP-critical data modifications.",
                "technical_approach": "Database triggers for all GxP tables. Audit records stored in separate secured schema.",
                "status": FSStatus.APPROVED, "approved_by": "qa.reviewer@pharma.com"
            },
            {
                "id": "FS-002", "urs_id": "URS-002", "title": "Sample Tracking Module",
                "description": "Sample tracking with barcode scanning, location management, and transfer logging.",
                "technical_approach": "Barcode-driven workflow with real-time location updates. Integration with label printers.",
                "status": FSStatus.APPROVED, "approved_by": "qa.reviewer@pharma.com"
            },
            {
                "id": "FS-003", "urs_id": "URS-004", "title": "Instrument Interface Layer",
                "description": "Automated data acquisition from instruments with integrity verification.",
                "technical_approach": "OPC-UA protocol for real-time data. Checksum verification for all transfers.",
                "status": FSStatus.DRAFT
            }
        ]
        
        for fs in fs_data:
            spec = FunctionalSpecification(
                id=fs["id"], urs_id=fs["urs_id"], project_id="PROJ-001",
                title=fs["title"], description=fs["description"],
                technical_approach=fs.get("technical_approach", ""),
                status=fs["status"],
                approved_by=fs.get("approved_by"),
                approved_at=datetime(2024, 1, 25, 11, 0, 0) if fs.get("approved_by") else None,
                created_at=datetime(2024, 1, 22, 9, 0, 0),
                created_by="validation.lead@pharma.com"
            )
            self.functional_specs[spec.id] = spec
        self._counters['fs'] = 3
        
        # DS
        ds1 = DesignSpecification(
            id="DS-001", fs_id="FS-001", project_id="PROJ-001",
            title="Audit Trail Database Schema",
            description="Database design for audit trail storage including table structures and indexes.",
            technical_design="PostgreSQL audit schema with partitioned tables by date. Indexes on user, timestamp, entity.",
            required=True,
            status=FSStatus.APPROVED,
            created_at=datetime(2024, 1, 26, 9, 0, 0),
            created_by="validation.lead@pharma.com"
        )
        self.design_specs[ds1.id] = ds1
        self._counters['ds'] = 1
        
        # Test Cases
        tc_data = [
            {
                "id": "TC-001", "fs_id": "FS-001", "urs_id": "URS-001",
                "test_type": "Functional", "title": "Audit Trail Field Capture",
                "description": "Verify audit trail captures all required fields when modifying sample data.",
                "preconditions": "User logged in with appropriate permissions. Test sample record exists.",
                "test_steps": "1. Navigate to sample record\n2. Modify sample description\n3. Enter change reason\n4. Save changes\n5. View audit trail",
                "expected_result": "Audit trail shows: User ID, timestamp, field modified, old value, new value, reason.",
                "priority": "High"
            },
            {
                "id": "TC-002", "fs_id": "FS-001", "urs_id": "URS-001",
                "test_type": "Negative", "title": "Audit Trail Immutability",
                "description": "Verify audit trail records cannot be modified or deleted.",
                "preconditions": "Existing audit trail records present.",
                "test_steps": "1. Attempt to modify audit record via UI\n2. Attempt delete via UI\n3. Attempt direct database modification",
                "expected_result": "All attempts blocked with appropriate error messages.",
                "priority": "Critical"
            },
            {
                "id": "TC-003", "fs_id": "FS-002", "urs_id": "URS-002",
                "test_type": "Functional", "title": "Sample Barcode Scanning",
                "description": "Verify sample identification via barcode scanning.",
                "preconditions": "Sample with barcode label exists. Scanner connected.",
                "test_steps": "1. Scan sample barcode\n2. Verify sample info displayed\n3. Transfer to new location\n4. Scan at new location",
                "expected_result": "Sample correctly identified. Transfer recorded with timestamps.",
                "priority": "High", "ai_generated": True
            },
            {
                "id": "TC-004", "fs_id": "FS-002", "urs_id": "URS-002",
                "test_type": "Integration", "title": "Chain of Custody Report",
                "description": "Verify complete chain of custody report generation.",
                "preconditions": "Sample with multiple transfers exists.",
                "test_steps": "1. Generate CoC report for sample\n2. Verify all transfers listed\n3. Verify timestamps\n4. Export to PDF",
                "expected_result": "Report shows complete custody history with all transfers.",
                "priority": "Medium"
            }
        ]
        
        for tc in tc_data:
            test = TestCase(
                id=tc["id"], fs_id=tc["fs_id"], urs_id=tc["urs_id"],
                project_id="PROJ-001", test_type=tc["test_type"],
                title=tc["title"], description=tc["description"],
                preconditions=tc["preconditions"], test_steps=tc["test_steps"],
                expected_result=tc["expected_result"], priority=tc["priority"],
                ai_generated=tc.get("ai_generated", False),
                created_at=datetime(2024, 1, 28, 10, 0, 0),
                created_by="validation.lead@pharma.com" if not tc.get("ai_generated") else "AI-System"
            )
            self.test_cases[test.id] = test
        self._counters['tc'] = 4
        
        # Test Executions
        exec_data = [
            {"id": "EXEC-001", "tc_id": "TC-001", "result": TestResult.PASS,
             "actual_result": "All audit fields captured correctly.", "executor": "executor@pharma.com"},
            {"id": "EXEC-002", "tc_id": "TC-002", "result": TestResult.FAIL,
             "actual_result": "Admin users can access database directly.", "executor": "executor@pharma.com",
             "deviation_id": "DEV-001"},
            {"id": "EXEC-003", "tc_id": "TC-003", "result": TestResult.PASS,
             "actual_result": "Barcode scanning working correctly.", "executor": "executor@pharma.com"}
        ]
        
        for ex in exec_data:
            execution = TestExecution(
                id=ex["id"], test_case_id=ex["tc_id"], project_id="PROJ-001",
                executor=ex["executor"], result=ex["result"],
                actual_result=ex["actual_result"],
                evidence_references=[f"Screenshot-{ex['id']}.png"],
                deviation_id=ex.get("deviation_id"),
                execution_date=datetime(2024, 2, 5, 10, 0, 0),
                created_at=datetime(2024, 2, 5, 10, 30, 0)
            )
            self.test_executions[execution.id] = execution
        self._counters['exec'] = 3
        
        # Deviation
        dev1 = Deviation(
            id="DEV-001",
            test_execution_id="EXEC-002",
            project_id="PROJ-001",
            deviation_type="Test Failure",
            severity=RiskLevel.HIGH,
            title="Audit Trail Database Access Control Gap",
            description="Admin users can directly access and potentially modify audit trail records via database tools.",
            root_cause="Database-level access controls not implemented for audit trail tables.",
            root_cause_category="Design",
            root_cause_ai_suggested=True,
            investigation_summary="Investigation revealed that database admin accounts have unrestricted access to all tables including audit trails.",
            capa_corrective="Implement database triggers to prevent direct modification. Add row-level security.",
            capa_preventive="Update DS template to include database security requirements. Add security review checkpoint.",
            capa_due_date="2024-03-15",
            effectiveness_criteria="No direct database modifications possible. Verified by penetration testing.",
            status=DeviationStatus.CAPA_ASSIGNED,
            assigned_to="validation.lead@pharma.com",
            created_at=datetime(2024, 2, 5, 15, 0, 0),
            created_by="executor@pharma.com"
        )
        self.deviations[dev1.id] = dev1
        self._counters['dev'] = 1
        
        # Change Request
        change1 = ChangeRequest(
            id="CR-001",
            project_id="PROJ-001",
            title="Add Stability Module",
            description="Add stability study management functionality to LIMS.",
            change_type="Enhancement",
            priority=ChangePriority.MEDIUM,
            justification="Required for ICH stability studies. Currently managed in spreadsheets.",
            impact_assessment="Requires 3 new URS, 5 new FS, approximately 15 test cases.",
            affected_urs=["URS-002"],
            affected_fs=["FS-002"],
            affected_tc=["TC-003", "TC-004"],
            revalidation_required=True,
            revalidation_scope="New stability module only. Existing functionality unaffected.",
            risk_level=RiskLevel.MEDIUM,
            status=ChangeStatus.IMPACT_ANALYSIS,
            requested_by="validation.lead@pharma.com",
            requested_at=datetime(2024, 2, 10, 9, 0, 0)
        )
        self.change_requests[change1.id] = change1
        self._counters['change'] = 1
        
        # ============ PROJECT 2: ERP Integration ============
        proj2 = ValidationProject(
            id="PROJ-002",
            name="ERP-MES Integration",
            project_type=ProjectType.NEW_SYSTEM,
            system_type=SystemType.GXP,
            validation_model=ValidationModel.AGILE_CSV,
            intended_use="Integration layer between SAP ERP and Manufacturing Execution System for batch record management.",
            scope="Batch record data exchange, material movements, in-process data collection.",
            applicable_regulations=["FDA 21 CFR Part 11", "EU GMP"],
            status=ProjectStatus.FS,
            risk_level=RiskLevel.MEDIUM,
            validation_lead="validation.lead@pharma.com",
            qa_reviewer="qa.reviewer@pharma.com",
            target_completion="2024-09-30",
            created_at=datetime(2024, 2, 1, 9, 0, 0),
            created_by="admin@pharma.com"
        )
        self.projects[proj2.id] = proj2
        
        # ============ PROJECT 3: Document Management ============
        proj3 = ValidationProject(
            id="PROJ-003",
            name="Document Management System",
            project_type=ProjectType.CHANGE,
            system_type=SystemType.NON_GXP,
            validation_model=ValidationModel.V_MODEL,
            intended_use="Corporate document management for SOPs, policies, and procedures.",
            scope="Document lifecycle management, version control, workflow approvals.",
            applicable_regulations=[],
            status=ProjectStatus.COMPLETED,
            risk_level=RiskLevel.LOW,
            validation_lead="validation.lead@pharma.com",
            actual_completion="2023-12-15",
            created_at=datetime(2023, 11, 15, 9, 0, 0),
            created_by="admin@pharma.com"
        )
        self.projects[proj3.id] = proj3
        self._counters['project'] = 3
        
        # ============ AUDIT TRAIL ============
        self.audit_trail = [
            AuditTrail(timestamp=datetime(2024, 1, 15, 9, 0, 0), user="admin@pharma.com", role="Admin",
                      action="CREATE", entity="ValidationProject", entity_id="PROJ-001",
                      details="Created LIMS System Validation project", reason="Initial project setup"),
            AuditTrail(timestamp=datetime(2024, 1, 16, 10, 0, 0), user="validation.lead@pharma.com", role="Validation Lead",
                      action="CREATE", entity="Requirement", entity_id="URS-001",
                      details="Created URS: Electronic Records Integrity", reason="21 CFR Part 11 compliance"),
            AuditTrail(timestamp=datetime(2024, 1, 18, 14, 0, 0), user="AI-System", role="AI",
                      action="SUGGEST", entity="Requirement", entity_id="URS-003",
                      details="AI suggested requirement: Result Calculation Engine", reason="Domain analysis"),
            AuditTrail(timestamp=datetime(2024, 1, 18, 14, 5, 0), user="AI-System", role="AI",
                      action="AMBIGUITY_CHECK", entity="Requirement", entity_id="URS-003",
                      details="Ambiguity score: 0.3 - Suggested clarifications", reason="Quality check"),
            AuditTrail(timestamp=datetime(2024, 1, 20, 14, 30, 0), user="qa.reviewer@pharma.com", role="QA",
                      action="APPROVE", entity="Requirement", entity_id="URS-001",
                      details="Approved URS-001", reason="Meets regulatory requirements"),
            AuditTrail(timestamp=datetime(2024, 2, 5, 10, 30, 0), user="executor@pharma.com", role="Executor",
                      action="EXECUTE", entity="TestExecution", entity_id="EXEC-001",
                      details="Executed TC-001 - Result: PASS", reason="Test execution"),
            AuditTrail(timestamp=datetime(2024, 2, 5, 14, 45, 0), user="executor@pharma.com", role="Executor",
                      action="EXECUTE", entity="TestExecution", entity_id="EXEC-002",
                      details="Executed TC-002 - Result: FAIL", reason="Test execution"),
            AuditTrail(timestamp=datetime(2024, 2, 5, 15, 0, 0), user="executor@pharma.com", role="Executor",
                      action="CREATE", entity="Deviation", entity_id="DEV-001",
                      details="Created deviation for failed test", reason="Test failure"),
            AuditTrail(timestamp=datetime(2024, 2, 5, 15, 30, 0), user="AI-System", role="AI",
                      action="SUGGEST_ROOT_CAUSE", entity="Deviation", entity_id="DEV-001",
                      details="AI suggested root cause analysis", reason="AI-assisted investigation"),
            AuditTrail(timestamp=datetime(2024, 2, 10, 9, 0, 0), user="validation.lead@pharma.com", role="Validation Lead",
                      action="CREATE", entity="ChangeRequest", entity_id="CR-001",
                      details="Created change request: Add Stability Module", reason="Business requirement"),
        ]
    
    # ============ ID GENERATORS ============
    def generate_id(self, entity: str) -> str:
        prefixes = {
            'project': 'PROJ', 'boundary': 'SB', 'urs': 'URS', 'fs': 'FS',
            'ds': 'DS', 'tc': 'TC', 'exec': 'EXEC', 'dev': 'DEV',
            'change': 'CR', 'sig': 'SIG'
        }
        self._counters[entity] += 1
        return f"{prefixes[entity]}-{self._counters[entity]:03d}"
    
    def add_audit_entry(self, user: str, role: str, action: str, entity: str,
                       entity_id: str, details: str = "", reason: str = "",
                       old_value: str = None, new_value: str = None):
        entry = AuditTrail(
            timestamp=datetime.utcnow(), user=user, role=role,
            action=action, entity=entity, entity_id=entity_id,
            details=details, reason=reason,
            old_value=old_value, new_value=new_value
        )
        self.audit_trail.append(entry)
        return entry


# Global singleton
store = DataStore()
