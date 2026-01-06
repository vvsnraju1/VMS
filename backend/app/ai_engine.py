"""
VMS AI Engine - Enterprise Edition
Comprehensive AI assistance for validation lifecycle
All suggestions are explainable, logged, and require human approval
"""
from typing import List, Dict
from .models import (
    RiskLevel, Requirement, FunctionalSpecification, Deviation,
    TestCase, ChangeRequest
)


class AIEngine:
    """
    AI Engine for CSV domain assistance.
    Capabilities: Risk assessment, ambiguity detection, content generation,
    consistency checking, pattern detection.
    """
    
    # Keyword dictionaries for analysis
    PATIENT_SAFETY_KEYWORDS = [
        "patient", "safety", "dose", "dosing", "adverse", "sterile",
        "contamination", "potency", "toxicity", "allergen", "critical",
        "life-threatening", "clinical", "therapeutic"
    ]
    
    PRODUCT_QUALITY_KEYWORDS = [
        "quality", "purity", "stability", "specification", "release",
        "batch", "manufacturing", "process", "formulation", "testing",
        "impurity", "degradation", "assay", "dissolution"
    ]
    
    DATA_INTEGRITY_KEYWORDS = [
        "data", "integrity", "audit", "trail", "electronic", "record",
        "signature", "21 cfr", "part 11", "annex 11", "alcoa", "backup",
        "attributable", "legible", "contemporaneous", "original", "accurate"
    ]
    
    AMBIGUITY_PATTERNS = [
        {"pattern": "appropriate", "type": "Vague Term", "suggestion": "Define specific criteria"},
        {"pattern": "adequate", "type": "Vague Term", "suggestion": "Specify measurable threshold"},
        {"pattern": "as needed", "type": "Ambiguous Condition", "suggestion": "Define trigger conditions"},
        {"pattern": "etc", "type": "Incomplete List", "suggestion": "Provide complete enumeration"},
        {"pattern": "and/or", "type": "Logical Ambiguity", "suggestion": "Use explicit AND or OR"},
        {"pattern": "should", "type": "Weak Requirement", "suggestion": "Use 'shall' for mandatory requirements"},
        {"pattern": "may", "type": "Optional vs Required", "suggestion": "Clarify if optional or conditional"},
        {"pattern": "timely", "type": "Vague Timing", "suggestion": "Specify time limit (e.g., within 24 hours)"},
        {"pattern": "user-friendly", "type": "Subjective", "suggestion": "Define specific usability criteria"},
        {"pattern": "fast", "type": "Vague Performance", "suggestion": "Specify response time (e.g., <2 seconds)"},
    ]
    
    @classmethod
    def _calculate_overall_risk(cls, patient: RiskLevel, quality: RiskLevel, data: RiskLevel) -> RiskLevel:
        risk_values = {RiskLevel.LOW: 1, RiskLevel.MEDIUM: 2, RiskLevel.HIGH: 3, RiskLevel.CRITICAL: 4}
        max_risk = max(risk_values[patient], risk_values[quality], risk_values[data])
        if max_risk == 4:
            return RiskLevel.CRITICAL
        elif max_risk == 3:
            return RiskLevel.HIGH
        elif max_risk == 2:
            return RiskLevel.MEDIUM
        return RiskLevel.LOW
    
    @classmethod
    def _count_keywords(cls, text: str, keywords: list) -> int:
        text_lower = text.lower()
        return sum(1 for kw in keywords if kw in text_lower)
    
    @classmethod
    def _determine_risk(cls, count: int, gxp_impact: bool) -> RiskLevel:
        if gxp_impact and count >= 2:
            return RiskLevel.HIGH
        elif count >= 3:
            return RiskLevel.HIGH
        elif count >= 1 or gxp_impact:
            return RiskLevel.MEDIUM
        return RiskLevel.LOW
    
    # ==================== RISK ASSESSMENT ====================
    
    @classmethod
    def assess_risk(cls, requirement: Requirement) -> dict:
        """Comprehensive risk assessment for URS"""
        text = f"{requirement.title} {requirement.description} {requirement.acceptance_criteria}"
        
        patient_count = cls._count_keywords(text, cls.PATIENT_SAFETY_KEYWORDS)
        quality_count = cls._count_keywords(text, cls.PRODUCT_QUALITY_KEYWORDS)
        data_count = cls._count_keywords(text, cls.DATA_INTEGRITY_KEYWORDS)
        
        gxp_impact = requirement.gxp_impact or data_count > 0
        
        patient_risk = cls._determine_risk(patient_count, gxp_impact and patient_count > 0)
        quality_risk = cls._determine_risk(quality_count, gxp_impact)
        data_risk = cls._determine_risk(data_count, gxp_impact and data_count > 0)
        overall_risk = cls._calculate_overall_risk(patient_risk, quality_risk, data_risk)
        
        reasons = []
        if patient_count > 0:
            reasons.append(f"Patient safety indicators ({patient_count} matches)")
        if quality_count > 0:
            reasons.append(f"Product quality indicators ({quality_count} matches)")
        if data_count > 0:
            reasons.append(f"Data integrity indicators ({data_count} matches)")
        if gxp_impact:
            reasons.append("GxP regulatory impact")
        
        return {
            "gxp_impact": gxp_impact,
            "patient_safety_risk": patient_risk,
            "product_quality_risk": quality_risk,
            "data_integrity_risk": data_risk,
            "overall_risk": overall_risk,
            "reason": ". ".join(reasons) + f". Overall: {overall_risk.value} risk.",
            "confidence": 0.85
        }
    
    # ==================== AMBIGUITY DETECTION ====================
    
    @classmethod
    def detect_ambiguity(cls, requirement: Requirement) -> dict:
        """Detect ambiguous language in requirements"""
        text = f"{requirement.title} {requirement.description}".lower()
        issues = []
        
        for pattern in cls.AMBIGUITY_PATTERNS:
            if pattern["pattern"] in text:
                issues.append({
                    "type": pattern["type"],
                    "term": pattern["pattern"],
                    "suggestion": pattern["suggestion"]
                })
        
        # Calculate ambiguity score (0-1)
        score = min(len(issues) * 0.15, 1.0)
        
        # Check for missing elements
        if "shall" not in text and "must" not in text:
            issues.append({
                "type": "Missing Imperative",
                "term": "No 'shall' or 'must'",
                "suggestion": "Add clear imperative language for requirements"
            })
            score = min(score + 0.1, 1.0)
        
        if not requirement.acceptance_criteria:
            issues.append({
                "type": "Missing Acceptance Criteria",
                "term": "No acceptance criteria",
                "suggestion": "Define measurable acceptance criteria"
            })
            score = min(score + 0.2, 1.0)
        
        suggestions = [issue["suggestion"] for issue in issues[:3]]
        
        return {
            "urs_id": requirement.id,
            "ambiguity_score": round(score, 2),
            "issues": issues,
            "suggestions": suggestions
        }
    
    # ==================== FS GENERATION ====================
    
    @classmethod
    def suggest_fs(cls, requirement: Requirement) -> dict:
        """Generate Functional Specification from URS"""
        title = f"FS for {requirement.title}"
        
        # Template selection based on content
        text_lower = requirement.description.lower()
        
        if "audit trail" in text_lower or "audit" in text_lower:
            description = f"""The system shall implement audit trail functionality for {requirement.title}.

**Functional Requirements:**
1. Capture user identity (username, user ID, role) for all actions
2. Record timestamp in ISO 8601 format with timezone (UTC)
3. Log field-level changes including previous and new values
4. Require and capture reason for change for GxP-critical modifications
5. Ensure audit records are immutable (no update/delete capability)
6. Provide audit trail search and filter capabilities
7. Support audit trail export for regulatory inspection (PDF, CSV)
8. Implement audit trail viewer with role-based access

**Technical Considerations:**
- Database-level triggers for comprehensive capture
- Separate audit schema for security isolation
- Index optimization for query performance"""
            approach = "Database triggers with separate audit schema and immutable record pattern"
            
        elif "calculation" in text_lower or "formula" in text_lower:
            description = f"""The system shall implement calculation functionality for {requirement.title}.

**Functional Requirements:**
1. Support configurable calculation formulas with version control
2. Validate all input parameters before calculation
3. Apply appropriate rounding and significant figures per method
4. Log all calculation inputs, formula used, and outputs
5. Provide calculation verification/review workflow
6. Support formula change control with impact assessment
7. Generate calculation audit trail

**Technical Considerations:**
- Validated calculation engine with unit testing
- Formula versioning with effective dates
- Precision handling per configuration"""
            approach = "Validated calculation engine with formula version control"
            
        elif "sample" in text_lower or "tracking" in text_lower:
            description = f"""The system shall implement tracking functionality for {requirement.title}.

**Functional Requirements:**
1. Support barcode/RFID identification
2. Record all location transfers with timestamp and user
3. Maintain complete chain of custody documentation
4. Enforce storage condition requirements
5. Generate alerts for condition excursions
6. Support batch/lot traceability
7. Provide chain of custody reports

**Technical Considerations:**
- Real-time location updates
- Integration with barcode scanners
- Alert notification system"""
            approach = "Barcode-driven workflow with real-time location tracking"
            
        elif "access" in text_lower or "security" in text_lower or "role" in text_lower:
            description = f"""The system shall implement access control for {requirement.title}.

**Functional Requirements:**
1. Enforce role-based access control (RBAC)
2. Support segregation of duties
3. Prevent self-approval of own work
4. Log all access attempts (successful and failed)
5. Support password policy configuration
6. Implement session timeout
7. Provide user access review reports

**Technical Considerations:**
- Integration with Active Directory/LDAP
- Token-based session management
- Configurable permission matrix"""
            approach = "RBAC implementation with AD integration"
            
        else:
            description = f"""The system shall implement functionality for {requirement.title}.

**Functional Requirements:**
1. Implement core functionality as specified in URS
2. Ensure appropriate input validation
3. Maintain audit trail for all GxP-critical actions
4. Provide user feedback and error handling
5. Support data validation and integrity checks
6. Enable reporting and export capabilities

**Acceptance Criteria:**
{requirement.acceptance_criteria or 'As defined in URS'}

**Technical Considerations:**
- Standard validation approach
- Error handling patterns
- Performance optimization"""
            approach = "Standard implementation with validation best practices"
        
        return {
            "urs_id": requirement.id,
            "suggested_title": title,
            "suggested_description": description,
            "suggested_approach": approach
        }
    
    # ==================== TEST CASE GENERATION ====================
    
    @classmethod
    def suggest_test_cases(cls, fs: FunctionalSpecification, urs: Requirement) -> List[dict]:
        """Generate multiple test cases from FS"""
        test_cases = []
        fs_lower = fs.description.lower()
        
        # Functional test
        test_cases.append({
            "test_type": "Functional",
            "title": f"Functional Test: {fs.title}",
            "description": f"Verify {fs.title} functionality meets FS requirements",
            "steps": cls._generate_functional_steps(fs),
            "expected": cls._generate_expected_result(fs),
            "priority": "High"
        })
        
        # Negative test
        test_cases.append({
            "test_type": "Negative",
            "title": f"Negative Test: {fs.title}",
            "description": f"Verify {fs.title} handles invalid inputs correctly",
            "steps": cls._generate_negative_steps(fs),
            "expected": "System displays appropriate error messages. No data corruption. Invalid inputs rejected.",
            "priority": "High"
        })
        
        # Integration test if interfaces mentioned
        if "interface" in fs_lower or "integration" in fs_lower:
            test_cases.append({
                "test_type": "Integration",
                "title": f"Integration Test: {fs.title}",
                "description": f"Verify {fs.title} integration with connected systems",
                "steps": "1. Configure integration endpoint\n2. Send test data\n3. Verify receipt\n4. Check data integrity\n5. Verify audit trail",
                "expected": "Data transfers successfully. No data loss. Audit trail complete.",
                "priority": "Medium"
            })
        
        return test_cases
    
    @classmethod
    def _generate_functional_steps(cls, fs: FunctionalSpecification) -> str:
        if "audit" in fs.description.lower():
            return """1. Login with test user credentials
2. Navigate to GxP-critical record
3. Modify a field value
4. Enter reason for change
5. Save the modification
6. Navigate to audit trail view
7. Locate the audit record
8. Verify all required fields captured"""
        elif "calculation" in fs.description.lower():
            return """1. Navigate to calculation module
2. Enter known test inputs
3. Execute calculation
4. Record calculated result
5. Verify against manual calculation
6. Check significant figures
7. Verify audit trail entry"""
        else:
            return """1. Navigate to relevant module
2. Execute primary function
3. Verify expected behavior
4. Check data persistence
5. Verify audit trail
6. Test boundary conditions"""
    
    @classmethod
    def _generate_expected_result(cls, fs: FunctionalSpecification) -> str:
        if "audit" in fs.description.lower():
            return """Audit record contains:
- Correct user ID and username
- Accurate timestamp (UTC)
- Field name modified
- Previous value
- New value
- Reason for change
- Action type"""
        elif "calculation" in fs.description.lower():
            return """- Calculated result matches expected value
- Appropriate significant figures applied
- Calculation logged in audit trail
- Formula version recorded
- All inputs captured"""
        else:
            return """- Functionality works as specified
- Data correctly persisted
- Appropriate messages displayed
- Audit trail complete
- No unexpected errors"""
    
    @classmethod
    def _generate_negative_steps(cls, fs: FunctionalSpecification) -> str:
        return """1. Attempt operation with invalid input
2. Attempt operation with missing required fields
3. Attempt operation with boundary values
4. Attempt unauthorized operation
5. Verify error handling
6. Check no data corruption occurred"""
    
    # ==================== ROOT CAUSE ANALYSIS ====================
    
    @classmethod
    def suggest_root_cause(cls, deviation: Deviation, test_desc: str = "") -> dict:
        """Suggest root cause and CAPA for deviation"""
        desc_lower = deviation.description.lower()
        
        # Determine category and generate analysis
        if "access" in desc_lower or "permission" in desc_lower or "database" in desc_lower:
            category = "Design"
            root_cause = """**Root Cause Analysis:**

**Immediate Cause:** Insufficient access controls at database/system level

**Contributing Factors:**
- Access control requirements not fully specified in DS
- Security review not performed during design phase
- Database admin access not restricted

**Root Cause:** Gap in security requirements during design phase"""
            
            capa = """**Corrective Actions:**
1. Implement database-level triggers to prevent direct modification
2. Add row-level security policies
3. Restrict admin database access to break-glass scenarios
4. Re-execute affected test cases

**Preventive Actions:**
1. Update DS template to include mandatory security section
2. Add security review checkpoint in validation lifecycle
3. Conduct security training for development team
4. Implement automated security scanning"""
            
        elif "calculation" in desc_lower or "result" in desc_lower:
            category = "Process"
            root_cause = """**Root Cause Analysis:**

**Immediate Cause:** Calculation produced incorrect result

**Contributing Factors:**
- Edge case not covered in test scenarios
- Formula validation incomplete
- Rounding rules not correctly implemented

**Root Cause:** Incomplete requirements specification for calculation scenarios"""
            
            capa = """**Corrective Actions:**
1. Fix calculation formula/logic
2. Add boundary condition test cases
3. Re-execute all calculation tests
4. Verify fix in production-like environment

**Preventive Actions:**
1. Implement calculation verification reviews
2. Enhance test case coverage requirements
3. Add automated regression testing
4. Create calculation validation checklist"""
            
        else:
            category = "Human Error"
            root_cause = """**Root Cause Analysis:**

**Immediate Cause:** System behavior did not match expected result

**Contributing Factors:**
- Requirement interpretation gap
- Insufficient detail in specification
- Test case not comprehensive

**Root Cause:** Insufficient specification detail leading to implementation gap"""
            
            capa = """**Corrective Actions:**
1. Update implementation to meet requirement
2. Re-execute failed test case
3. Verify fix does not impact other functionality
4. Update documentation

**Preventive Actions:**
1. Enhance FS review process
2. Improve requirement traceability
3. Add clarification checkpoint before development
4. Implement peer review for specifications"""
        
        return {
            "deviation_id": deviation.id,
            "suggested_root_cause": root_cause,
            "suggested_category": category,
            "suggested_capa": capa,
            "confidence": 0.75
        }
    
    # ==================== CONSISTENCY CHECK ====================
    
    @classmethod
    def check_consistency(cls, project_id: str, requirements: List[Requirement],
                         specs: List[FunctionalSpecification], tests: List[TestCase]) -> dict:
        """Check consistency across validation artifacts"""
        issues = []
        
        # Check for orphan FS (no URS link)
        urs_ids = {r.id for r in requirements}
        for fs in specs:
            if fs.urs_id not in urs_ids:
                issues.append({
                    "entity": "FunctionalSpecification",
                    "entity_id": fs.id,
                    "issue_type": "Orphan FS",
                    "description": f"FS {fs.id} linked to non-existent URS {fs.urs_id}",
                    "suggestion": "Link to valid URS or remove"
                })
        
        # Check for untested FS
        tested_fs = {tc.fs_id for tc in tests}
        for fs in specs:
            if fs.id not in tested_fs:
                issues.append({
                    "entity": "FunctionalSpecification",
                    "entity_id": fs.id,
                    "issue_type": "Untested FS",
                    "description": f"FS {fs.id} has no test cases",
                    "suggestion": "Create test cases for coverage"
                })
        
        # Check for high-risk URS without approved status
        for req in requirements:
            if req.overall_risk in [RiskLevel.HIGH, RiskLevel.CRITICAL]:
                if req.status != "Approved":
                    issues.append({
                        "entity": "Requirement",
                        "entity_id": req.id,
                        "issue_type": "High Risk Unapproved",
                        "description": f"High-risk URS {req.id} is not approved",
                        "suggestion": "Prioritize review and approval"
                    })
        
        # Calculate consistency score
        total_items = len(requirements) + len(specs) + len(tests)
        score = max(0, 100 - (len(issues) * 10))
        
        return {
            "project_id": project_id,
            "issues": issues,
            "score": score
        }
    
    # ==================== CHANGE IMPACT ====================
    
    @classmethod
    def analyze_change_impact(cls, change: ChangeRequest, requirements: List[Requirement],
                             specs: List[FunctionalSpecification], tests: List[TestCase]) -> dict:
        """Analyze impact of proposed change"""
        affected_urs = []
        affected_fs = []
        affected_tc = []
        
        change_keywords = change.description.lower().split()
        
        # Find potentially affected requirements
        for req in requirements:
            req_text = f"{req.title} {req.description}".lower()
            if any(kw in req_text for kw in change_keywords if len(kw) > 4):
                affected_urs.append(req.id)
        
        # Find affected FS
        for fs in specs:
            if fs.urs_id in affected_urs:
                affected_fs.append(fs.id)
        
        # Find affected tests
        for tc in tests:
            if tc.fs_id in affected_fs or tc.urs_id in affected_urs:
                affected_tc.append(tc.id)
        
        # Determine revalidation scope
        revalidation_required = len(affected_urs) > 0 or len(affected_tc) > 0
        
        return {
            "change_id": change.id,
            "affected_urs": affected_urs,
            "affected_fs": affected_fs,
            "affected_tc": affected_tc,
            "revalidation_required": revalidation_required,
            "estimated_effort": f"{len(affected_tc)} test cases to re-execute",
            "risk_assessment": "Medium" if revalidation_required else "Low"
        }
