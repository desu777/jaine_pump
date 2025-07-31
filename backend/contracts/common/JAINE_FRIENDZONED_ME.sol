// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "../PumpJaineBase.sol";

contract JAINE_FRIENDZONED_ME is PumpJaineBase {
    enum FriendTier { 
        STRANGER,        // 0
        ACQUAINTANCE,    // 1
        FRIEND,          // 2
        GOOD_FRIEND,     // 3
        BEST_FRIEND,     // 4
        NEVER_BOYFRIEND  // 5 - final tier
    }
    
    uint256 public constant ESCAPE_ATTEMPT_COST = 0.001 ether;
    uint256 public emotionalLaborPoints;
    uint256 public birthdayGiftsSent;
    uint256 public adviceSessionsListened;
    
    mapping(address => FriendTier) public userFriendTier;
    mapping(address => uint256) public friendPoints;
    mapping(address => uint256) public escapeAttempts;
    mapping(address => uint256) public lastBirthdayGift;
    
    event FriendTierUpgrade(address indexed user, FriendTier oldTier, FriendTier newTier);
    event EscapeAttemptFailed(address indexed user, uint256 attempt, uint256 cost);
    event BirthdayGiftSent(address indexed giver, uint256 value, uint256 gratitudeLevel);
    event AdviceAboutOtherGuys(address indexed listener, string advice, uint256 painLevel);
    event EmotionalLaborPerformed(address indexed worker, uint256 points, uint256 totalPoints);
    
    error EscapeImpossible();
    error InsufficientEscapeFee(uint256 required, uint256 provided);
    error NotYourBirthday();
    error AdviceNotRequested();
    
    constructor() PumpJaineBase("JAINE FRIENDZONED ME", "FRIENDZONE") {}
    
    function performEmotionalLabor(string memory problem) external payable {
        require(bytes(problem).length > 0, "Need actual problems");
        
        uint256 laborPoints = msg.value / 0.0001 ether; // 1 point per 0.0001 ETH
        emotionalLaborPoints += laborPoints;
        friendPoints[msg.sender] += laborPoints;
        
        _upgradeFriendTier(msg.sender);
        
        emit EmotionalLaborPerformed(msg.sender, laborPoints, emotionalLaborPoints);
        
        // All payments go to deployer (Jaine never reciprocates)
        payable(deployer).transfer(msg.value);
    }
    
    function sendBirthdayGift() external payable {
        uint256 currentYear = block.timestamp / 365 days;
        
        if (lastBirthdayGift[msg.sender] >= currentYear) {
            revert NotYourBirthday();
        }
        
        require(msg.value > 0, "Gifts must have value");
        
        birthdayGiftsSent++;
        lastBirthdayGift[msg.sender] = currentYear;
        friendPoints[msg.sender] += msg.value / 0.001 ether;
        
        _upgradeFriendTier(msg.sender);
        
        // Gratitude level is always disappointingly low
        uint256 gratitudeLevel = 1; // Always minimal appreciation
        
        emit BirthdayGiftSent(msg.sender, msg.value, gratitudeLevel);
        
        // Gift money goes to deployer
        payable(deployer).transfer(msg.value);
    }
    
    function listenToAdviceAboutOtherGuys() external {
        adviceSessionsListened++;
        friendPoints[msg.sender] += 10;
        
        string[5] memory adviceOptions = [
            "I think you should go for it with Chad",
            "That guy from the gym seems really nice",
            "Maybe try dating apps?",
            "You deserve someone who appreciates you",
            "I'm sure you'll find the right person soon"
        ];
        
        uint256 adviceIndex = uint256(keccak256(abi.encodePacked(
            block.timestamp, msg.sender
        ))) % 5;
        
        string memory advice = adviceOptions[adviceIndex];
        uint256 painLevel = (adviceSessionsListened * 10) + friendPoints[msg.sender];
        
        _upgradeFriendTier(msg.sender);
        
        emit AdviceAboutOtherGuys(msg.sender, advice, painLevel);
    }
    
    function attemptEscapeFriendzone() external payable {
        uint256 attempts = escapeAttempts[msg.sender];
        uint256 requiredFee = ESCAPE_ATTEMPT_COST * (2 ** attempts); // Exponential cost
        
        if (msg.value < requiredFee) {
            revert InsufficientEscapeFee(requiredFee, msg.value);
        }
        
        escapeAttempts[msg.sender]++;
        
        // Escape always fails
        emit EscapeAttemptFailed(msg.sender, escapeAttempts[msg.sender], msg.value);
        
        // Fee goes to deployer
        payable(deployer).transfer(msg.value);
        
        // Final revert to confirm escape is impossible
        revert EscapeImpossible();
    }
    
    function _upgradeFriendTier(address user) internal {
        FriendTier currentTier = userFriendTier[user];
        uint256 points = friendPoints[user];
        FriendTier newTier = currentTier;
        
        if (points >= 1000 && currentTier < FriendTier.NEVER_BOYFRIEND) {
            if (points >= 10000) newTier = FriendTier.NEVER_BOYFRIEND;
            else if (points >= 5000) newTier = FriendTier.BEST_FRIEND;
            else if (points >= 2500) newTier = FriendTier.GOOD_FRIEND;
            else if (points >= 1500) newTier = FriendTier.FRIEND;
            else newTier = FriendTier.ACQUAINTANCE;
        }
        
        if (newTier != currentTier) {
            userFriendTier[user] = newTier;
            emit FriendTierUpgrade(user, currentTier, newTier);
        }
    }
    
    function getFriendStatus(address user) external view returns (
        FriendTier tier,
        uint256 points,
        uint256 attempts,
        uint256 nextEscapeCost
    ) {
        tier = userFriendTier[user];
        points = friendPoints[user];
        attempts = escapeAttempts[user];
        nextEscapeCost = ESCAPE_ATTEMPT_COST * (2 ** attempts);
    }
    
    function getAdviceQuote() external view returns (string memory) {
        string[3] memory quotes = [
            "You're such a good friend to me",
            "I wish I could find someone like you",
            "You always know how to make me feel better"
        ];
        
        uint256 index = uint256(keccak256(abi.encodePacked(
            block.timestamp / 1 hours
        ))) % 3;
        
        return quotes[index];
    }
}