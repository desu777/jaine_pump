// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "../PumpJaineBase.sol";

contract JAINE_RESTRAINING_ORDER is PumpJaineBase {
    uint256 public constant MINIMUM_DISTANCE = 500; // meters
    uint256 public constant COURT_FEE = 0.1 ether;
    uint256 public constant VIOLATION_PENALTY = 0.05 ether;
    uint256 public constant LAWYER_CONSULTATION_FEE = 0.02 ether;
    
    struct RestrainingOrder {
        uint256 orderNumber;
        uint256 issuedAt;
        uint256 expiresAt;
        uint256 minimumDistance;
        string reason;
        bool isPermanent;
        uint256 violationCount;
    }
    
    struct CourtProceeding {
        uint256 caseNumber;
        string charge;
        uint256 scheduledDate;
        bool guilty;
        uint256 fine;
        string verdict;
    }
    
    struct LawyerConsultation {
        address lawyer;
        uint256 timestamp;
        string advice;
        bool caseAccepted;
        string rejectionReason;
    }
    
    struct WitnessTestimony {
        address witness;
        string testimony;
        uint256 timestamp;
        bool againstDeployer;
    }
    
    mapping(address => RestrainingOrder) public activeOrders;
    mapping(address => bool) public permanentlyBlacklisted;
    mapping(address => uint256) public violationHistory;
    mapping(address => CourtProceeding[]) public courtHistory;
    mapping(uint256 => LawyerConsultation) public lawyerConsultations;
    mapping(uint256 => WitnessTestimony[]) public witnessTestimonies;
    mapping(address => uint256) public totalFinesPaid;
    mapping(address => bool) public hasTriedToAppeal;
    
    uint256 public totalOrdersIssued;
    uint256 public totalViolations;
    uint256 public consultationCounter;
    uint256 public caseCounter;
    
    event RestrainingOrderIssued(address indexed against, uint256 orderNumber, string reason);
    event OrderViolationDetected(address indexed violator, uint256 violationNumber, uint256 penalty);
    event CourtCaseScheduled(address indexed defendant, uint256 caseNumber, string charge);
    event LawyerConsulted(address indexed client, uint256 consultationId, bool accepted);
    event WitnessTestified(uint256 caseNumber, address witness, bool againstDefendant);
    event LegalDocumentGenerated(address indexed recipient, string documentType, uint256 id);
    event AppealRejected(address indexed appellant, string reason);
    event PermanentBanIssued(address indexed banned, string finalVerdict);
    
    error RestrainingOrderActive();
    error PermanentlyBanned();
    error InsufficientCourtFees();
    error LawyerRefusedCase();
    error AllWitnessesAgainstYou();
    
    constructor() PumpJaineBase("JAINE RESTRAINING ORDER", "BANNED") {
        _issueInitialOrder(msg.sender);
    }
    
    function _issueInitialOrder(address target) internal {
        totalOrdersIssued++;
        
        activeOrders[target] = RestrainingOrder({
            orderNumber: totalOrdersIssued,
            issuedAt: block.timestamp,
            expiresAt: block.timestamp + 365 days,
            minimumDistance: MINIMUM_DISTANCE,
            reason: "Excessive simping detected",
            isPermanent: false,
            violationCount: 0
        });
        
        emit RestrainingOrderIssued(target, totalOrdersIssued, "Excessive simping detected");
        emit LegalDocumentGenerated(target, "Restraining Order", totalOrdersIssued);
        
        _automaticBlacklist(target);
    }
    
    function _automaticBlacklist(address target) internal {
        permanentlyBlacklisted[target] = true;
        emit PermanentBanIssued(target, "Automatic blacklist after first interaction");
    }
    
    function transfer(address to, uint256 value) public override returns (bool) {
        _checkForViolation(msg.sender);
        return super.transfer(to, value);
    }
    
    function _checkForViolation(address user) internal {
        if (permanentlyBlacklisted[user]) {
            revert PermanentlyBanned();
        }
        
        RestrainingOrder storage order = activeOrders[user];
        if (order.orderNumber > 0 && (order.isPermanent || block.timestamp < order.expiresAt)) {
            _recordViolation(user);
            revert RestrainingOrderActive();
        }
    }
    
    function _recordViolation(address violator) internal {
        totalViolations++;
        violationHistory[violator]++;
        activeOrders[violator].violationCount++;
        
        uint256 penalty = VIOLATION_PENALTY * activeOrders[violator].violationCount;
        
        emit OrderViolationDetected(violator, totalViolations, penalty);
        
        // Escalate to permanent after 3 violations
        if (activeOrders[violator].violationCount >= 3) {
            activeOrders[violator].isPermanent = true;
            emit PermanentBanIssued(violator, "Multiple restraining order violations");
        }
        
        _scheduleCourtCase(violator, "Restraining order violation");
    }
    
    function _scheduleCourtCase(address defendant, string memory charge) internal {
        caseCounter++;
        
        CourtProceeding memory newCase = CourtProceeding({
            caseNumber: caseCounter,
            charge: charge,
            scheduledDate: block.timestamp + 7 days,
            guilty: true, // Always guilty
            fine: COURT_FEE * 2,
            verdict: "Guilty by default - no defense possible"
        });
        
        courtHistory[defendant].push(newCase);
        
        emit CourtCaseScheduled(defendant, caseCounter, charge);
    }
    
    function consultLawyer(string memory caseDetails) external payable returns (uint256 consultationId) {
        require(msg.value >= LAWYER_CONSULTATION_FEE, "Insufficient consultation fee");
        require(!permanentlyBlacklisted[msg.sender], "No lawyer will take your case");
        
        consultationCounter++;
        consultationId = consultationCounter;
        
        // Lawyers always refuse the case
        string[6] memory rejectionReasons = [
            "This case is unwinnable",
            "I have a conflict of interest (I also think you're creepy)",
            "My reputation can't handle this",
            "Even I have standards",
            "I suddenly remembered I'm busy forever",
            "I'd rather defend actual criminals"
        ];
        
        uint256 reasonIndex = uint256(keccak256(abi.encodePacked(
            block.timestamp, msg.sender, consultationId
        ))) % 6;
        
        lawyerConsultations[consultationId] = LawyerConsultation({
            lawyer: address(uint160(uint256(keccak256(abi.encodePacked("Lawyer", consultationId))))),
            timestamp: block.timestamp,
            advice: "Plead guilty and hope for mercy",
            caseAccepted: false,
            rejectionReason: rejectionReasons[reasonIndex]
        });
        
        emit LawyerConsulted(msg.sender, consultationId, false);
        
        // Fee goes to contract (non-refundable)
        totalFinesPaid[msg.sender] += msg.value;
    }
    
    function submitWitnessTestimony(uint256 caseNumber, string memory testimony) external {
        require(caseNumber > 0 && caseNumber <= caseCounter, "Invalid case number");
        
        // Witnesses always testify against the deployer
        witnessTestimonies[caseNumber].push(WitnessTestimony({
            witness: msg.sender,
            testimony: testimony,
            timestamp: block.timestamp,
            againstDeployer: true
        }));
        
        emit WitnessTestified(caseNumber, msg.sender, true);
    }
    
    function payCourtFees(uint256 caseNumber) external payable {
        require(msg.value >= COURT_FEE, "Insufficient court fees");
        require(caseNumber > 0 && caseNumber <= caseCounter, "Invalid case number");
        
        totalFinesPaid[msg.sender] += msg.value;
        
        // Payment doesn't help - still guilty
        emit LegalDocumentGenerated(msg.sender, "Court Fee Receipt", caseNumber);
    }
    
    function attemptAppeal(string memory appealReason) external payable {
        require(msg.value >= COURT_FEE * 3, "Appeals are expensive");
        require(!hasTriedToAppeal[msg.sender], "Only one appeal allowed");
        
        hasTriedToAppeal[msg.sender] = true;
        totalFinesPaid[msg.sender] += msg.value;
        
        // Appeals always fail
        string[5] memory rejectionReasons = [
            "Lack of merit",
            "Appellant is clearly guilty",
            "Judge fell asleep reading this",
            "This appeal insults the court's intelligence",
            "Request denied with prejudice"
        ];
        
        uint256 reasonIndex = uint256(keccak256(abi.encodePacked(
            block.timestamp, msg.sender, appealReason
        ))) % 5;
        
        emit AppealRejected(msg.sender, rejectionReasons[reasonIndex]);
        
        // Make the order worse
        if (activeOrders[msg.sender].orderNumber > 0) {
            activeOrders[msg.sender].minimumDistance *= 2;
            activeOrders[msg.sender].isPermanent = true;
        }
    }
    
    function checkLegalStatus(address user) external view returns (
        bool hasOrder,
        bool isPermanentlyBanned,
        uint256 violations,
        uint256 totalFines,
        uint256 courtCases
    ) {
        hasOrder = activeOrders[user].orderNumber > 0;
        isPermanentlyBanned = permanentlyBlacklisted[user];
        violations = violationHistory[user];
        totalFines = totalFinesPaid[user];
        courtCases = courtHistory[user].length;
    }
    
    function getRestrainingOrderDetails(address user) external view returns (
        uint256 orderNumber,
        uint256 distance,
        string memory reason,
        bool permanent,
        uint256 violations,
        uint256 daysRemaining
    ) {
        RestrainingOrder memory order = activeOrders[user];
        orderNumber = order.orderNumber;
        distance = order.minimumDistance;
        reason = order.reason;
        permanent = order.isPermanent;
        violations = order.violationCount;
        
        if (!permanent && block.timestamp < order.expiresAt) {
            daysRemaining = (order.expiresAt - block.timestamp) / 1 days;
        } else {
            daysRemaining = permanent ? type(uint256).max : 0;
        }
    }
    
    function getCourtHistory(address defendant) external view returns (
        uint256 totalCases,
        uint256 totalGuiltyVerdicts,
        uint256 totalFinesOwed
    ) {
        CourtProceeding[] memory cases = courtHistory[defendant];
        totalCases = cases.length;
        
        for (uint i = 0; i < cases.length; i++) {
            if (cases[i].guilty) {
                totalGuiltyVerdicts++;
                totalFinesOwed += cases[i].fine;
            }
        }
    }
    
    function generateLegalDocument(string memory documentType) external {
        require(!permanentlyBlacklisted[msg.sender], "No legal services available");
        
        uint256 docId = uint256(keccak256(abi.encodePacked(
            msg.sender, documentType, block.timestamp
        )));
        
        emit LegalDocumentGenerated(msg.sender, documentType, docId);
        
        // Generating documents triggers automatic review
        if (violationHistory[msg.sender] > 0) {
            _recordViolation(msg.sender);
        }
    }
    
    function witnessProtectionProgram() external {
        // Only available to witnesses who testified
        bool hasTestified = false;
        
        for (uint i = 1; i <= caseCounter; i++) {
            WitnessTestimony[] memory testimonies = witnessTestimonies[i];
            for (uint j = 0; j < testimonies.length; j++) {
                if (testimonies[j].witness == msg.sender) {
                    hasTestified = true;
                    break;
                }
            }
        }
        
        require(hasTestified, "Must be a witness");
        
        // Witnesses get special privileges (not being banned)
        permanentlyBlacklisted[msg.sender] = false;
    }
}