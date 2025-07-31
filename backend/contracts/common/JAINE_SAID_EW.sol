// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "../PumpJaineBase.sol";

contract JAINE_SAID_EW is PumpJaineBase {
    uint256 public constant BASE_CRINGE_TAX = 500; // 5%
    uint256 public cringeLevel;
    uint256 public recoveryTherapyPrice = 0.01 ether;
    uint256 public totalCringeEvents;
    
    mapping(address => uint256) public personalCringeLevel;
    mapping(address => uint256) public cringeHistory;
    mapping(address => uint256) public selfAwarenessLevel;
    mapping(address => bool) public hasRecoveryAccess;
    
    event CringeDetected(address indexed victim, uint256 level, string reason);
    event CringeTaxApplied(address indexed victim, uint256 taxAmount, uint256 newCringeLevel);
    event SelfAwarenessReduced(address indexed victim, uint256 oldLevel, uint256 newLevel);
    event RecoveryAttempt(address indexed victim, uint256 cost, bool success);
    event CringeCompilationGenerated(address indexed victim, uint256 tokenId, string[] moments);
    
    error MaximumCringeExceeded();
    error RecoveryNotAvailable();
    error InsufficientRecoveryFee(uint256 required, uint256 provided);
    
    constructor() PumpJaineBase("JAINE SAID EW", "CRINGE") {
        cringeLevel = 0;
    }
    
    function transfer(address to, uint256 value) public virtual override returns (bool) {
        uint256 cringeTax = _calculateCringeTax(msg.sender, value);
        uint256 taxedValue = value + cringeTax;
        
        if (balanceOf[msg.sender] < taxedValue) {
            revert InsufficientBalance(taxedValue, balanceOf[msg.sender]);
        }
        
        // Apply cringe tax
        if (cringeTax > 0) {
            balanceOf[msg.sender] -= cringeTax;
            balanceOf[address(this)] += cringeTax;
            _increaseCringeLevel(msg.sender, cringeTax);
            emit CringeTaxApplied(msg.sender, cringeTax, personalCringeLevel[msg.sender]);
        }
        
        return super.transfer(to, value);
    }
    
    function _calculateCringeTax(address user, uint256 amount) internal view returns (uint256) {
        uint256 userCringe = personalCringeLevel[user];
        uint256 taxRate = BASE_CRINGE_TAX + (userCringe / 100); // Increases with cringe level
        
        if (taxRate > 5000) taxRate = 5000; // Cap at 50%
        
        return (amount * taxRate) / 10000;
    }
    
    function _increaseCringeLevel(address user, uint256 amount) internal {
        personalCringeLevel[user] += amount / 1e15; // Convert to manageable numbers
        cringeHistory[user]++;
        totalCringeEvents++;
        
        // Reduce self-awareness
        if (selfAwarenessLevel[user] > 0) {
            uint256 oldAwareness = selfAwarenessLevel[user];
            selfAwarenessLevel[user] = oldAwareness > 10 ? oldAwareness - 10 : 0;
            emit SelfAwarenessReduced(user, oldAwareness, selfAwarenessLevel[user]);
        }
        
        // Generate cringe detection event
        string memory reason = _getCringeReason(user);
        emit CringeDetected(user, personalCringeLevel[user], reason);
        
        // Check if maximum cringe exceeded
        if (personalCringeLevel[user] > 10000) {
            emit CringeCompilationGenerated(user, totalCringeEvents, _getCringeCompilation(user));
        }
    }
    
    function _getCringeReason(address user) internal view returns (string memory) {
        string[8] memory reasons = [
            "Tried too hard to be funny",
            "Sent unsolicited selfie",
            "Used outdated memes",
            "Over-explained obvious joke",
            "Fedora tipping detected",
            "M'lady usage confirmed",
            "Neck beard energy off the charts",
            "Main character syndrome activated"
        ];
        
        uint256 index = uint256(keccak256(abi.encodePacked(
            block.timestamp, user, personalCringeLevel[user]
        ))) % 8;
        
        return reasons[index];
    }
    
    function _getCringeCompilation(address user) internal view returns (string[] memory) {
        string[] memory compilation = new string[](3);
        
        compilation[0] = "That time you said 'actually' 47 times in one conversation";
        compilation[1] = "The fedora incident of last Tuesday";
        compilation[2] = "Your entire dating app message history";
        
        return compilation;
    }
    
    function attemptRecoveryTherapy() external payable {
        if (!hasRecoveryAccess[msg.sender] && personalCringeLevel[msg.sender] < 100) {
            revert RecoveryNotAvailable();
        }
        
        uint256 requiredFee = recoveryTherapyPrice * (1 + personalCringeLevel[msg.sender] / 100);
        
        if (msg.value < requiredFee) {
            revert InsufficientRecoveryFee(requiredFee, msg.value);
        }
        
        // Recovery success rate is inversely proportional to cringe level
        uint256 successRate = personalCringeLevel[msg.sender] < 1000 ? 
            (1000 - personalCringeLevel[msg.sender]) / 50 : 1;
        
        uint256 random = uint256(keccak256(abi.encodePacked(
            block.timestamp, msg.sender, block.prevrandao
        ))) % 100;
        
        bool success = random < successRate;
        
        if (success) {
            // Reduce cringe level by 10%
            personalCringeLevel[msg.sender] = (personalCringeLevel[msg.sender] * 90) / 100;
            selfAwarenessLevel[msg.sender] += 5;
        }
        
        emit RecoveryAttempt(msg.sender, msg.value, success);
        
        // Increase price for next attempt
        recoveryTherapyPrice = (recoveryTherapyPrice * 120) / 100; // 20% increase
        
        // Payment goes to deployer (therapist)
        payable(deployer).transfer(msg.value);
    }
    
    function enableRecoveryAccess() external payable {
        require(msg.value >= 0.005 ether, "Recovery access fee required");
        hasRecoveryAccess[msg.sender] = true;
        payable(deployer).transfer(msg.value);
    }
    
    function getCringeMetrics(address user) external view returns (
        uint256 currentCringe,
        uint256 totalEvents,
        uint256 awareness,
        uint256 taxRate,
        bool recoveryAvailable
    ) {
        currentCringe = personalCringeLevel[user];
        totalEvents = cringeHistory[user];
        awareness = selfAwarenessLevel[user];
        taxRate = BASE_CRINGE_TAX + (currentCringe / 100);
        if (taxRate > 5000) taxRate = 5000;
        recoveryAvailable = hasRecoveryAccess[user] || currentCringe >= 100;
    }
    
    function getCurrentRecoveryPrice(address user) external view returns (uint256) {
        return recoveryTherapyPrice * (1 + personalCringeLevel[user] / 100);
    }
    
    function getCringeLeaderboard() external view returns (uint256) {
        return cringeLevel; // Global cringe level
    }
}