// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "../PumpJaineBase.sol";

contract JAINE_BLOCKED_ME is PumpJaineBase {
    uint256 public constant BASE_LOCKOUT = 24 hours;
    uint256 public blockCount;
    uint256 public lastBlockTime;
    uint256 public unblockFee = 0.01 ether;
    
    mapping(address => bool) public isBlocked;
    mapping(address => uint256) public blockHistory;
    mapping(uint256 => string) public blockReasons;
    
    event BlockTriggered(address indexed victim, string reason, uint256 duration);
    event UnblockAttempt(address indexed victim, uint256 fee, bool success);
    event BlockAppealRejected(address indexed victim, string reason);
    
    error CurrentlyBlocked(uint256 timeRemaining);
    error InsufficientUnblockFee(uint256 required, uint256 provided);
    error AppealAlwaysRejected();
    
    constructor() PumpJaineBase("JAINE BLOCKED ME", "BLOCKED") {
        lastBlockTime = block.timestamp;
        _initializeBlockReasons();
    }
    
    function _initializeBlockReasons() internal {
        blockReasons[0] = "You're being too clingy";
        blockReasons[1] = "I need space right now";
        blockReasons[2] = "This isn't working out";
        blockReasons[3] = "I'm focusing on myself";
        blockReasons[4] = "We're better as friends";
        blockReasons[5] = "It's not you, it's me";
    }
    
    function transfer(address to, uint256 value) public override returns (bool) {
        _checkBlockStatus(msg.sender);
        _randomBlockTrigger();
        return super.transfer(to, value);
    }
    
    function transferFrom(address from, address to, uint256 value) public override returns (bool) {
        _checkBlockStatus(from);
        _randomBlockTrigger();
        return super.transferFrom(from, to, value);
    }
    
    function _checkBlockStatus(address user) internal view {
        if (isBlocked[user]) {
            uint256 blockTime = blockHistory[user];
            uint256 blockDuration = BASE_LOCKOUT * (1 + (blockCount / 5));
            
            if (block.timestamp < blockTime + blockDuration) {
                uint256 timeRemaining = (blockTime + blockDuration) - block.timestamp;
                revert CurrentlyBlocked(timeRemaining);
            }
        }
    }
    
    function _randomBlockTrigger() internal {
        uint256 random = uint256(keccak256(abi.encodePacked(
            block.timestamp, 
            block.prevrandao, 
            msg.sender
        ))) % 100;
        
        uint256 blockProbability = 5 + (blockCount / 2); // Increases with history
        
        if (random < blockProbability) {
            _triggerBlock(msg.sender);
        }
    }
    
    function _triggerBlock(address victim) internal {
        isBlocked[victim] = true;
        blockHistory[victim] = block.timestamp;
        blockCount++;
        
        uint256 reasonIndex = uint256(keccak256(abi.encodePacked(
            block.timestamp, victim
        ))) % 6;
        
        string memory reason = blockReasons[reasonIndex];
        uint256 duration = BASE_LOCKOUT * (1 + (blockCount / 5));
        
        emit BlockTriggered(victim, reason, duration);
    }
    
    function attemptUnblock() external payable {
        if (!isBlocked[msg.sender]) return;
        
        uint256 requiredFee = unblockFee * (1 + blockHistory[msg.sender]);
        if (msg.value < requiredFee) {
            revert InsufficientUnblockFee(requiredFee, msg.value);
        }
        
        // Unblock always fails, but takes the money
        emit UnblockAttempt(msg.sender, msg.value, false);
        
        // Transfer fee to deployer
        payable(deployer).transfer(msg.value);
        
        // Increase fee for next attempt
        unblockFee = (unblockFee * 150) / 100; // 50% increase
    }
    
    function appealBlock(string memory appeal) external {
        if (!isBlocked[msg.sender]) return;
        
        // Appeals are always rejected
        emit BlockAppealRejected(msg.sender, "Appeal denied: Reasons undisclosed");
        revert AppealAlwaysRejected();
    }
    
    function getBlockStatus(address user) external view returns (
        bool blocked,
        uint256 timeRemaining,
        uint256 totalBlocks,
        string memory lastReason
    ) {
        blocked = isBlocked[user];
        totalBlocks = blockHistory[user];
        
        if (blocked && blockHistory[user] > 0) {
            uint256 blockDuration = BASE_LOCKOUT * (1 + (blockCount / 5));
            uint256 blockEnd = blockHistory[user] + blockDuration;
            
            if (block.timestamp < blockEnd) {
                timeRemaining = blockEnd - block.timestamp;
                uint256 reasonIndex = uint256(keccak256(abi.encodePacked(
                    blockHistory[user], user
                ))) % 6;
                lastReason = blockReasons[reasonIndex];
            } else {
                // Block expired
                timeRemaining = 0;
                blocked = false;
            }
        }
    }
    
    function getCurrentUnblockFee(address user) external view returns (uint256) {
        if (!isBlocked[user]) return 0;
        return unblockFee * (1 + blockHistory[user]);
    }
}