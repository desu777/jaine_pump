// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "../PumpJaineBase.sol";

contract JAINE_MARRIED_MY_BULLY is PumpJaineBase {
    address public bullyAddress;
    address public originalOwner;
    bool public weddingAnnounced = false;
    uint256 public honeymoonFund;
    uint256 public therapySessions;
    uint256 public revengeAttempts;
    
    struct WeddingInvitation {
        bool isViewerOnly;
        string role;
        uint256 timestamp;
        string seatingSection;
    }
    
    struct RevengeAttempt {
        string plan;
        uint256 timestamp;
        bool executed;
        bool backfired;
        string consequence;
    }
    
    mapping(address => WeddingInvitation) public invitations;
    mapping(address => uint256) public cuckContributions;
    mapping(address => uint256) public therapySessionsAttended;
    mapping(uint256 => RevengeAttempt) public revengeHistory;
    mapping(address => bool) public isBully;
    mapping(address => uint256) public bullyScore;
    
    event BullyIdentified(address indexed bully, uint256 bullyScore, string evidence);
    event WeddingAnnounced(address indexed bride, address indexed groom, uint256 timestamp);
    event InvitationSent(address indexed recipient, bool viewerOnly, string seatingArrangement);
    event HoneymoonContribution(address indexed cuck, uint256 amount, string message);
    event TherapySessionBooked(address indexed patient, uint256 sessionNumber, string therapistName);
    event RevengeAttemptPlanned(address indexed planner, uint256 attemptId, string plan);
    event RevengeFailed(address indexed failure, uint256 attemptId, string consequence);
    event CuckProtocolActivated(address indexed victim, uint256 mandatoryContribution);
    
    error NotAuthorizedBully();
    error WeddingAlreadyAnnounced();
    error InsufficientCuckContribution(uint256 required, uint256 provided);
    error RevengeAlwaysBackfires();
    error TherapySessionRequired();
    
    constructor() PumpJaineBase("JAINE MARRIED MY BULLY", "CUCKED") {
        originalOwner = msg.sender;
        _identifyBully();
    }
    
    function _identifyBully() internal {
        // Automatically identify deployer's bully through "transaction history analysis"
        bullyAddress = address(uint160(uint256(keccak256(abi.encodePacked(
            "CHAD_ALPHA_BULLY",
            block.timestamp,
            msg.sender
        )))));
        
        isBully[bullyAddress] = true;
        bullyScore[bullyAddress] = 1000; // Maximum bully score
        
        emit BullyIdentified(bullyAddress, 1000, "Historical analysis of deposer's trauma");
    }
    
    function announceWedding() external {
        if (weddingAnnounced) revert WeddingAlreadyAnnounced();
        
        // Only the bully can announce the wedding (automatic ownership transfer)
        _transferOwnership(bullyAddress);
        weddingAnnounced = true;
        
        emit WeddingAnnounced(deployer, bullyAddress, block.timestamp); // Jaine + Bully
        
        _sendInvitations();
        _activateCuckProtocol();
    }
    
    function _transferOwnership(address newOwner) internal {
        // Bully becomes contract owner automatically
        deployer = newOwner;
    }
    
    function _sendInvitations() internal {
        // Original deployer gets viewer-only invitation
        invitations[originalOwner] = WeddingInvitation({
            isViewerOnly: true,
            role: "Witness to Own Humiliation",
            timestamp: block.timestamp,
            seatingSection: "Back Row, Behind Pillar"
        });
        
        emit InvitationSent(originalOwner, true, "Worst possible seats");
    }
    
    function _activateCuckProtocol() internal {
        // Original deployer must fund their honeymoon
        uint256 mandatoryContribution = balanceOf[originalOwner] / 4; // 25% of holdings
        
        emit CuckProtocolActivated(originalOwner, mandatoryContribution);
    }
    
    function contributeToHoneymoon(string memory message) external payable {
        require(msg.value > 0, "Contribution required");
        require(weddingAnnounced, "No wedding to fund yet");
        
        honeymoonFund += msg.value;
        cuckContributions[msg.sender] += msg.value;
        
        emit HoneymoonContribution(msg.sender, msg.value, message);
        
        // All contributions go to the bully (new owner)
        payable(bullyAddress).transfer(msg.value);
        
        // Transfer some tokens as additional humiliation
        if (balanceOf[msg.sender] >= 1000 * 1e18) {
            uint256 tokenContribution = 1000 * 1e18;
            balanceOf[msg.sender] -= tokenContribution;
            balanceOf[bullyAddress] += tokenContribution;
            emit Transfer(msg.sender, bullyAddress, tokenContribution);
        }
    }
    
    function bookTherapySession(string memory issue) external payable {
        require(msg.value >= 0.01 ether, "Therapy isn't free");
        
        therapySessions++;
        therapySessionsAttended[msg.sender]++;
        
        string[7] memory therapistNames = [
            "Dr. Reality Check",
            "Dr. Move On Already", 
            "Dr. This Is Unhealthy",
            "Dr. Seek Professional Help",
            "Dr. You Need Jesus",
            "Dr. Touch Grass",
            "Dr. Get A Life"
        ];
        
        uint256 therapistIndex = uint256(keccak256(abi.encodePacked(
            block.timestamp, msg.sender
        ))) % 7;
        
        emit TherapySessionBooked(msg.sender, therapySessionsAttended[msg.sender], therapistNames[therapistIndex]);
        
        // Therapy payments go to bully (because life is unfair)
        payable(bullyAddress).transfer(msg.value);
    }
    
    function planRevenge(string memory revengeScheme) external payable {
        require(msg.value >= 0.005 ether, "Revenge planning consultation fee");
        require(bytes(revengeScheme).length > 10, "Revenge plan too simple");
        
        revengeAttempts++;
        
        revengeHistory[revengeAttempts] = RevengeAttempt({
            plan: revengeScheme,
            timestamp: block.timestamp,
            executed: false,
            backfired: true, // Always backfires
            consequence: "Made situation worse somehow"
        });
        
        emit RevengeAttemptPlanned(msg.sender, revengeAttempts, revengeScheme);
        
        // Execute revenge (always fails)
        _executeRevenge(msg.sender, revengeAttempts);
        
        // Planning fee goes to bully
        payable(bullyAddress).transfer(msg.value);
    }
    
    function _executeRevenge(address planner, uint256 attemptId) internal {
        string[6] memory consequences = [
            "Bully got promoted at work",
            "Jaine loves him even more now",
            "You got a restraining order",
            "Your reputation got worse",
            "Bully's family adopted you as their project",
            "Everyone felt sorry for the bully"
        ];
        
        uint256 consequenceIndex = uint256(keccak256(abi.encodePacked(
            block.timestamp, planner, attemptId
        ))) % 6;
        
        revengeHistory[attemptId].executed = true;
        revengeHistory[attemptId].consequence = consequences[consequenceIndex];
        
        emit RevengeFailed(planner, attemptId, consequences[consequenceIndex]);
        
        // Increase bully's power
        bullyScore[bullyAddress] += 100;
    }
    
    function getWeddingDetails() external view returns (
        bool announced,
        address bride,
        address groom,
        uint256 honeymoonTotal,
        string memory venue
    ) {
        announced = weddingAnnounced;
        bride = address(uint160(uint256(keccak256(abi.encodePacked("JAINE")))));
        groom = bullyAddress;
        honeymoonTotal = honeymoonFund;
        venue = "The Church of Broken Dreams";
    }
    
    function getInvitationStatus(address guest) external view returns (
        bool invited,
        bool viewerOnly,
        string memory role,
        string memory seating
    ) {
        WeddingInvitation memory invitation = invitations[guest];
        invited = invitation.timestamp > 0;
        viewerOnly = invitation.isViewerOnly;
        role = invitation.role;
        seating = invitation.seatingSection;
    }
    
    function getCuckStats(address user) external view returns (
        uint256 contributions,
        uint256 therapySessions,
        uint256 revengesFailed,
        bool needsTherapy
    ) {
        contributions = cuckContributions[user];
        therapySessions = therapySessionsAttended[user];
        revengesFailed = revengeAttempts; // All attempts by anyone failed
        needsTherapy = contributions > 0.01 ether || therapySessionsAttended[user] == 0;
    }
    
    function getBullyPowerLevel() external view returns (uint256 power, string memory status) {
        power = bullyScore[bullyAddress];
        
        if (power > 2000) {
            status = "Ultra Alpha Chad Bully Supreme";
        } else if (power > 1500) {
            status = "Advanced Bully Overlord";
        } else if (power > 1000) {
            status = "Professional Bully";
        } else {
            status = "Apprentice Bully";
        }
    }
}