// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "../PumpJaineBase.sol";

contract JAINE_POSTED_ANOTHER_GUY is PumpJaineBase {
    uint256 public cryDetectionEvents;
    uint256 public tearPoweredPumps;
    uint256 public jealousyMultiplier = 100; // 1x initially
    uint256 public copiumDistributed;
    uint256 public otherGuyAnalyses;
    
    struct SocialMediaPost {
        string postContent;
        uint256 timestamp;
        uint256 heartbreakLevel;
        bool containsOtherGuy;
        address detector;
    }
    
    struct OtherGuyAnalysis {
        string appearance;
        string financialStatus;
        string personalityAssessment;
        uint256 threatLevel;
        bool isBetterThanUser;
    }
    
    mapping(uint256 => SocialMediaPost) public posts;
    mapping(uint256 => OtherGuyAnalysis) public guyAnalysis;
    mapping(address => uint256) public tearCount;
    mapping(address => uint256) public stalkerLevel;
    mapping(address => uint256) public copiumBalance;
    mapping(address => uint256) public lastCryDetected;
    mapping(address => bool) public hasStalkingPrevention;
    
    uint256 public postCount;
    
    event CryDetected(address indexed crier, uint256 intensity, string trigger);
    event TearPoweredPump(uint256 indexed postId, uint256 pumpAmount, uint256 tearsFuel);
    event JealousyMultiplierIncreased(address indexed victim, uint256 oldMultiplier, uint256 newMultiplier);
    event CopiumDistributed(address indexed recipient, uint256 amount, string copiumType);
    event OtherGuyAnalyzed(address indexed analyzer, uint256 postId, uint256 threatLevel);
    event StalkingPreventionTriggered(address indexed stalker, uint256 feeCharged);
    event SocialMediaMonitored(address indexed monitor, string platform, uint256 posts);
    
    error StalkingDetected();
    error InsufficientTears(uint256 required, uint256 available);
    error CopiumOverdose();
    error AnalysisParalysis();
    
    constructor() PumpJaineBase("JAINE POSTED ANOTHER GUY", "JEALOUSY") {}
    
    function detectSocialMediaPost(string memory content, bool hasOtherGuy) external {
        postCount++;
        
        uint256 heartbreakLevel = hasOtherGuy ? 100 : 20;
        
        posts[postCount] = SocialMediaPost({
            postContent: content,
            timestamp: block.timestamp,
            heartbreakLevel: heartbreakLevel,
            containsOtherGuy: hasOtherGuy,
            detector: msg.sender
        });
        
        if (hasOtherGuy) {
            _triggerCryDetection(msg.sender, heartbreakLevel);
            _increaseJealousyMultiplier(msg.sender);
        }
        
        stalkerLevel[msg.sender] += 10;
        _checkStalkingPrevention(msg.sender);
    }
    
    function _triggerCryDetection(address crier, uint256 intensity) internal {
        cryDetectionEvents++;
        tearCount[crier] += intensity;
        lastCryDetected[crier] = block.timestamp;
        
        string[6] memory triggers = [
            "They look so happy together",
            "He's obviously better looking than me",
            "She never smiled at me like that",
            "They're probably going on dates I couldn't afford",
            "He has everything I don't",
            "I never had a chance, did I?"
        ];
        
        uint256 triggerIndex = uint256(keccak256(abi.encodePacked(
            block.timestamp, crier
        ))) % 6;
        
        emit CryDetected(crier, intensity, triggers[triggerIndex]);
        
        _executeTearPoweredPump(intensity);
    }
    
    function _executeTearPoweredPump(uint256 tearsFuel) internal {
        tearPoweredPumps++;
        uint256 pumpAmount = tearsFuel * jealousyMultiplier;
        
        // More tears = higher token price (paradoxically)
        // This doesn't actually pump the price, just creates the illusion
        
        emit TearPoweredPump(postCount, pumpAmount, tearsFuel);
    }
    
    function _increaseJealousyMultiplier(address victim) internal {
        uint256 oldMultiplier = jealousyMultiplier;
        jealousyMultiplier += 25; // Exponential jealousy growth
        
        emit JealousyMultiplierIncreased(victim, oldMultiplier, jealousyMultiplier);
    }
    
    function _checkStalkingPrevention(address user) internal {
        if (stalkerLevel[user] > 100 && !hasStalkingPrevention[user]) {
            // Trigger stalking prevention system
            emit StalkingPreventionTriggered(user, 0.01 ether);
        }
    }
    
    function analyzeOtherGuy(uint256 postId) external payable {
        require(postId > 0 && postId <= postCount, "Post doesn't exist");
        require(posts[postId].containsOtherGuy, "No other guy to analyze");
        require(msg.value >= 0.002 ether, "Analysis requires payment");
        
        otherGuyAnalyses++;
        
        // Generate analysis that makes user feel worse
        string[5] memory appearances = [
            "Objectively more attractive",
            "Has that natural charisma", 
            "Tall, dark, and handsome",
            "Gym body that took years to build",
            "Effortlessly stylish"
        ];
        
        string[5] memory financialStatuses = [
            "Probably has his life together",
            "Can afford nice restaurants",
            "Drives a car that actually starts",
            "Has savings and a career",
            "Doesn't live with his parents"
        ];
        
        string[5] memory personalities = [
            "Confident without being arrogant",
            "Makes her laugh effortlessly",
            "Actually listens when she talks",
            "Has interesting hobbies and stories",
            "Emotionally available and mature"
        ];
        
        uint256 random = uint256(keccak256(abi.encodePacked(
            block.timestamp, msg.sender, postId
        )));
        
        guyAnalysis[postId] = OtherGuyAnalysis({
            appearance: appearances[random % 5],
            financialStatus: financialStatuses[(random >> 8) % 5],
            personalityAssessment: personalities[(random >> 16) % 5],
            threatLevel: 85 + (random % 15), // Always high threat
            isBetterThanUser: true // Always true
        });
        
        emit OtherGuyAnalyzed(msg.sender, postId, guyAnalysis[postId].threatLevel);
        
        // Analysis makes user cry more
        _triggerCryDetection(msg.sender, 50);
        
        // Payment goes to deployer
        payable(deployer).transfer(msg.value);
    }
    
    function requestCopiumDistribution() external {
        require(tearCount[msg.sender] >= 50, "Not sad enough for copium");
        
        copiumDistributed++;
        
        string[7] memory copiumTypes = [
            "She's probably not that happy anyway",
            "Long distance relationships never work",
            "He's probably just a rebound",
            "She'll realize she made a mistake",
            "I'm focusing on myself now (cope)",
            "There are plenty of fish in the sea",
            "Everything happens for a reason"
        ];
        
        uint256 copiumIndex = uint256(keccak256(abi.encodePacked(
            block.timestamp, msg.sender
        ))) % 7;
        
        uint256 copiumAmount = tearCount[msg.sender] / 10;
        copiumBalance[msg.sender] += copiumAmount;
        
        emit CopiumDistributed(msg.sender, copiumAmount, copiumTypes[copiumIndex]);
        
        // Reduce tears slightly (temporary relief)
        tearCount[msg.sender] = (tearCount[msg.sender] * 90) / 100;
    }
    
    function enableStalkingPrevention() external payable {
        require(msg.value >= 0.01 ether, "Prevention requires payment");
        hasStalkingPrevention[msg.sender] = true;
        
        // Paradox: paying to prevent stalking while literally stalking
        emit StalkingPreventionTriggered(msg.sender, msg.value);
        
        payable(deployer).transfer(msg.value);
    }
    
    function getJealousyStats(address user) external view returns (
        uint256 tears,
        uint256 stalking,
        uint256 copium,
        uint256 lastCry,
        bool preventionActive
    ) {
        tears = tearCount[user];
        stalking = stalkerLevel[user];
        copium = copiumBalance[user];
        lastCry = lastCryDetected[user];
        preventionActive = hasStalkingPrevention[user];
    }
    
    function getPostAnalysis(uint256 postId) external view returns (
        string memory content,
        bool hasOtherGuy,
        uint256 heartbreak,
        OtherGuyAnalysis memory analysis
    ) {
        require(postId > 0 && postId <= postCount, "Post doesn't exist");
        
        SocialMediaPost memory post = posts[postId];
        return (
            post.postContent,
            post.containsOtherGuy,
            post.heartbreakLevel,
            guyAnalysis[postId]
        );
    }
    
    function getCurrentJealousyLevel() external view returns (uint256 multiplier, string memory status) {
        multiplier = jealousyMultiplier;
        
        if (multiplier < 200) {
            status = "Mildly jealous";
        } else if (multiplier < 500) {
            status = "Significantly jealous";
        } else if (multiplier < 1000) {
            status = "Extremely jealous";
        } else {
            status = "Completely consumed by jealousy";
        }
    }
}