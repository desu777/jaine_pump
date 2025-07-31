// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "../PumpJaineBase.sol";

contract JAINE_CALLED_SECURITY is PumpJaineBase {
    uint256 public constant SECURITY_RESPONSE_TIME = 30 seconds;
    uint256 public constant BACKGROUND_CHECK_FEE = 0.01 ether;
    uint256 public constant MINIMUM_VOTES_TO_BAN = 3;
    uint256 public constant BOUNCER_NFT_PRICE = 0.05 ether;
    
    struct SecurityIncident {
        uint256 incidentId;
        uint256 timestamp;
        string reason;
        uint256 threatLevel; // 1-10
        bool resolved;
        uint256 votesAgainst;
    }
    
    struct BouncerNFT {
        uint256 tokenId;
        string name;
        uint256 strength;
        uint256 intimidationFactor;
        bool onDuty;
    }
    
    struct BackgroundCheck {
        bool completed;
        uint256 criminalScore; // 0-100, higher is worse
        uint256 creepinessLevel; // 0-100
        uint256 threatAssessment; // 0-100
        string verdict;
        uint256 checkTime;
    }
    
    struct PublicSafetyAlert {
        bool active;
        string alertType;
        uint256 alertLevel;
        uint256 issuedAt;
        string description;
    }
    
    struct BanVote {
        address voter;
        uint256 timestamp;
        string reason;
    }
    
    mapping(address => SecurityIncident[]) public incidentReports;
    mapping(address => mapping(address => bool)) public hasVotedToBan;
    mapping(address => uint256) public totalVotesAgainst;
    mapping(address => bool) public permanentlyBanned;
    mapping(address => BackgroundCheck) public backgroundChecks;
    mapping(address => PublicSafetyAlert) public activeAlerts;
    mapping(uint256 => BouncerNFT) public bouncerNFTs;
    mapping(address => uint256[]) public ownedBouncers;
    mapping(address => bool) public isSecurityGuard;
    mapping(uint256 => BanVote[]) public banVotes;
    mapping(address => bool) public hasCalledSecurity;
    
    uint256 public totalIncidents;
    uint256 public totalBouncersDeployed;
    uint256 public bouncerTokenCounter;
    uint256 public totalBackgroundChecks;
    address[] public securityGuards;
    
    event SecurityCalled(address indexed caller, address indexed threat, string reason);
    event SecurityArrived(uint256 responseTime, uint256 bouncersDeployed);
    event VoteCastAgainstUser(address indexed voter, address indexed target, string reason);
    event PermanentBanEnacted(address indexed banned, uint256 totalVotes);
    event BackgroundCheckCompleted(address indexed subject, uint256 criminalScore);
    event PublicSafetyAlertIssued(address indexed about, string alertType, uint256 level);
    event BouncerNFTMinted(uint256 tokenId, address owner, string name);
    event SecurityIncidentLogged(address indexed suspect, uint256 incidentId, uint256 threatLevel);
    event CrowdSourcedBan(address indexed target, uint256 votes);
    
    error AlreadyBanned();
    error SecurityAlreadyCalled();
    error InsufficientSecurityClearance();
    error BackgroundCheckFailed();
    error AllGuardsAgainstYou();
    
    constructor() PumpJaineBase("JAINE CALLED SECURITY", "BANNED") {
        _initializeSecurity();
        _callSecurityOnDeployer(msg.sender);
    }
    
    function _initializeSecurity() internal {
        // Create initial security guards
        for (uint i = 0; i < 5; i++) {
            address guard = address(uint160(uint256(keccak256(abi.encodePacked("GUARD", i)))));
            securityGuards.push(guard);
            isSecurityGuard[guard] = true;
        }
    }
    
    function _callSecurityOnDeployer(address threat) internal {
        hasCalledSecurity[threat] = true;
        totalIncidents++;
        
        SecurityIncident memory incident = SecurityIncident({
            incidentId: totalIncidents,
            timestamp: block.timestamp,
            reason: "Suspicious individual detected - immediate response required",
            threatLevel: 10,
            resolved: false,
            votesAgainst: securityGuards.length // All guards vote against
        });
        
        incidentReports[threat].push(incident);
        
        emit SecurityCalled(address(this), threat, incident.reason);
        emit SecurityIncidentLogged(threat, totalIncidents, 10);
        
        // Immediate response
        _deployBouncers(threat);
        _issuePublicAlert(threat);
        
        // All guards automatically vote against deployer
        for (uint i = 0; i < securityGuards.length; i++) {
            _castVoteAgainst(securityGuards[i], threat, "Automatic security protocol");
        }
    }
    
    function _deployBouncers(address threat) internal {
        uint256 bouncersNeeded = 3 + (incidentReports[threat].length * 2);
        totalBouncersDeployed += bouncersNeeded;
        
        emit SecurityArrived(SECURITY_RESPONSE_TIME, bouncersNeeded);
        
        // Create bouncer NFTs for this incident
        for (uint i = 0; i < 3; i++) {
            _mintBouncerNFT(address(this));
        }
    }
    
    function _mintBouncerNFT(address owner) internal returns (uint256) {
        bouncerTokenCounter++;
        
        string[5] memory names = ["Big Tony", "The Wall", "Crusher", "No-Neck Nick", "Door Destroyer"];
        uint256 nameIndex = bouncerTokenCounter % 5;
        
        bouncerNFTs[bouncerTokenCounter] = BouncerNFT({
            tokenId: bouncerTokenCounter,
            name: names[nameIndex],
            strength: 80 + (uint256(keccak256(abi.encodePacked(bouncerTokenCounter))) % 20),
            intimidationFactor: 90 + (uint256(keccak256(abi.encodePacked(bouncerTokenCounter, "intimidation"))) % 10),
            onDuty: true
        });
        
        ownedBouncers[owner].push(bouncerTokenCounter);
        
        emit BouncerNFTMinted(bouncerTokenCounter, owner, names[nameIndex]);
        
        return bouncerTokenCounter;
    }
    
    function _issuePublicAlert(address threat) internal {
        activeAlerts[threat] = PublicSafetyAlert({
            active: true,
            alertType: "DANGER - CREEP DETECTED",
            alertLevel: 10,
            issuedAt: block.timestamp,
            description: "Maintain maximum distance. Do not engage. Call authorities if sighted."
        });
        
        emit PublicSafetyAlertIssued(threat, "DANGER - CREEP DETECTED", 10);
    }
    
    function voteToBlock(address target, string memory reason) external {
        require(!hasVotedToBan[msg.sender][target], "Already voted");
        require(target != msg.sender, "Can't vote for yourself");
        
        hasVotedToBan[msg.sender][target] = true;
        totalVotesAgainst[target]++;
        
        banVotes[totalVotesAgainst[target]].push(BanVote({
            voter: msg.sender,
            timestamp: block.timestamp,
            reason: reason
        }));
        
        emit VoteCastAgainstUser(msg.sender, target, reason);
        
        _castVoteAgainst(msg.sender, target, reason);
    }
    
    function _castVoteAgainst(address voter, address target, string memory reason) internal {
        if (totalVotesAgainst[target] >= MINIMUM_VOTES_TO_BAN && !permanentlyBanned[target]) {
            permanentlyBanned[target] = true;
            emit PermanentBanEnacted(target, totalVotesAgainst[target]);
            emit CrowdSourcedBan(target, totalVotesAgainst[target]);
        }
    }
    
    function transfer(address to, uint256 value) public override returns (bool) {
        if (permanentlyBanned[msg.sender]) {
            revert AlreadyBanned();
        }
        
        if (totalVotesAgainst[msg.sender] > 0) {
            revert AllGuardsAgainstYou();
        }
        
        return super.transfer(to, value);
    }
    
    function requestBackgroundCheck() external payable {
        require(msg.value >= BACKGROUND_CHECK_FEE, "Insufficient fee");
        require(!permanentlyBanned[msg.sender], "Already banned");
        
        totalBackgroundChecks++;
        
        // Background check always returns concerning results
        uint256 criminalScore = 60 + (uint256(keccak256(abi.encodePacked(msg.sender, "criminal"))) % 40);
        uint256 creepiness = 70 + (uint256(keccak256(abi.encodePacked(msg.sender, "creepy"))) % 30);
        uint256 threat = 50 + (uint256(keccak256(abi.encodePacked(msg.sender, "threat"))) % 50);
        
        string memory verdict;
        if (threat > 90) {
            verdict = "EXTREME THREAT - IMMEDIATE BAN RECOMMENDED";
        } else if (creepiness > 85) {
            verdict = "CERTIFIED CREEP - MAINTAIN DISTANCE";
        } else if (criminalScore > 75) {
            verdict = "SUSPICIOUS BACKGROUND - MONITOR CLOSELY";
        } else {
            verdict = "STILL CONCERNING - PROCEED WITH CAUTION";
        }
        
        backgroundChecks[msg.sender] = BackgroundCheck({
            completed: true,
            criminalScore: criminalScore,
            creepinessLevel: creepiness,
            threatAssessment: threat,
            verdict: verdict,
            checkTime: block.timestamp
        });
        
        emit BackgroundCheckCompleted(msg.sender, criminalScore);
        
        // High threat scores trigger automatic security
        if (threat > 80) {
            totalIncidents++;
            incidentReports[msg.sender].push(SecurityIncident({
                incidentId: totalIncidents,
                timestamp: block.timestamp,
                reason: "Failed background check",
                threatLevel: threat / 10,
                resolved: false,
                votesAgainst: 0
            }));
            
            emit SecurityIncidentLogged(msg.sender, totalIncidents, threat / 10);
        }
    }
    
    function purchaseBouncerNFT(string memory customName) external payable {
        require(msg.value >= BOUNCER_NFT_PRICE, "Insufficient payment");
        require(!permanentlyBanned[msg.sender], "Banned users can't buy NFTs");
        
        uint256 tokenId = _mintBouncerNFT(msg.sender);
        
        // Custom name if provided
        if (bytes(customName).length > 0) {
            bouncerNFTs[tokenId].name = customName;
        }
    }
    
    function reportSuspiciousActivity(address suspect, string memory details) external {
        require(suspect != msg.sender, "Can't report yourself");
        
        totalIncidents++;
        
        uint256 threatLevel = 5 + (uint256(keccak256(abi.encodePacked(
            block.timestamp, suspect, details
        ))) % 5);
        
        incidentReports[suspect].push(SecurityIncident({
            incidentId: totalIncidents,
            timestamp: block.timestamp,
            reason: details,
            threatLevel: threatLevel,
            resolved: false,
            votesAgainst: 0
        }));
        
        emit SecurityIncidentLogged(suspect, totalIncidents, threatLevel);
        
        // Multiple reports increase votes against
        if (incidentReports[suspect].length > 2) {
            totalVotesAgainst[suspect]++;
            _castVoteAgainst(msg.sender, suspect, "Multiple suspicious incidents");
        }
    }
    
    function checkSecurityStatus(address user) external view returns (
        bool isBanned,
        uint256 votesAgainst,
        uint256 incidents,
        bool hasAlert,
        uint256 threatLevel
    ) {
        isBanned = permanentlyBanned[user];
        votesAgainst = totalVotesAgainst[user];
        incidents = incidentReports[user].length;
        hasAlert = activeAlerts[user].active;
        
        // Calculate average threat level
        if (incidents > 0) {
            uint256 totalThreat = 0;
            SecurityIncident[] memory userIncidents = incidentReports[user];
            for (uint i = 0; i < userIncidents.length; i++) {
                totalThreat += userIncidents[i].threatLevel;
            }
            threatLevel = totalThreat / incidents;
        }
    }
    
    function getBouncerStats(uint256 tokenId) external view returns (
        string memory name,
        uint256 strength,
        uint256 intimidation,
        bool onDuty,
        address owner
    ) {
        BouncerNFT memory bouncer = bouncerNFTs[tokenId];
        name = bouncer.name;
        strength = bouncer.strength;
        intimidation = bouncer.intimidationFactor;
        onDuty = bouncer.onDuty;
        
        // Find owner
        for (uint i = 0; i < bouncerTokenCounter; i++) {
            uint256[] memory owned = ownedBouncers[address(uint160(i))];
            for (uint j = 0; j < owned.length; j++) {
                if (owned[j] == tokenId) {
                    owner = address(uint160(i));
                    break;
                }
            }
        }
    }
    
    function attemptToEnterVenue() external {
        require(!permanentlyBanned[msg.sender], "You're on the permanent ban list");
        require(totalVotesAgainst[msg.sender] < MINIMUM_VOTES_TO_BAN, "Too many people want you gone");
        
        // Check if background check passed
        BackgroundCheck memory check = backgroundChecks[msg.sender];
        if (check.threatAssessment > 70) {
            revert BackgroundCheckFailed();
        }
        
        // Still get rejected
        revert AllGuardsAgainstYou();
    }
    
    function getIncidentHistory(address user) external view returns (
        uint256 totalUserIncidents,
        uint256 averageThreatLevel,
        bool currentlyBanned,
        string memory mostRecentIncident
    ) {
        SecurityIncident[] memory incidents = incidentReports[user];
        totalUserIncidents = incidents.length;
        currentlyBanned = permanentlyBanned[user];
        
        if (totalUserIncidents > 0) {
            uint256 totalThreat = 0;
            for (uint i = 0; i < incidents.length; i++) {
                totalThreat += incidents[i].threatLevel;
            }
            averageThreatLevel = totalThreat / totalUserIncidents;
            mostRecentIncident = incidents[incidents.length - 1].reason;
        }
    }
}