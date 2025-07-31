// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "../PumpJaineBase.sol";

contract JAINE_SAID_TOUCH_GRASS is PumpJaineBase {
    uint256 public constant BUSINESS_HOURS_START = 9; // 9 AM
    uint256 public constant BUSINESS_HOURS_END = 17; // 5 PM
    uint256 public constant GRASS_TOUCH_REQUIREMENT = 10; // touches per day
    uint256 public constant VITAMIN_D_MINIMUM = 1000; // arbitrary units
    
    struct OutsideActivity {
        string activityType;
        uint256 timestamp;
        uint256 duration;
        bool verified;
        uint256 grassTouchCount;
    }
    
    struct SocialLifeAudit {
        uint256 lastAuditTime;
        uint256 socialScore;
        bool hasFriends;
        bool goesOutside;
        bool touchesGrass;
        string recommendation;
    }
    
    mapping(address => uint256) public lastSunlightExposure;
    mapping(address => uint256) public vitaminDLevel;
    mapping(address => uint256) public grassTouchesToday;
    mapping(address => uint256) public consecutiveDaysInside;
    mapping(address => OutsideActivity[]) public activityLog;
    mapping(address => SocialLifeAudit) public socialAudits;
    mapping(address => bool) public hasCompletedDailyQuest;
    mapping(address => uint256) public failedQuestStreak;
    
    uint256 public totalGrassTouches;
    uint256 public totalSunlightDenials;
    bool public isSunnyDay;
    
    event BusinessHoursLockoutEvent(address indexed user, string reason);
    event SunlightBlocked(address indexed user, uint256 vitaminDLevel);
    event GrassTouchVerified(address indexed user, uint256 touchCount);
    event SocialLifeAudited(address indexed user, uint256 score, string verdict);
    event DailyQuestAssigned(address indexed user, string quest);
    event OutsideActivityLogged(address indexed user, string activity, uint256 duration);
    event VitaminDDeficiency(address indexed user, uint256 level, string prescription);
    
    error GoOutside();
    error TouchGrassFirst();
    error SunnyDayRestriction();
    error BusinessHoursLockout();
    error FailedSocialAudit();
    error InsufficientVitaminD();
    
    constructor() PumpJaineBase("JAINE SAID TOUCH GRASS", "GRASS") {
        isSunnyDay = _checkWeather();
        _initializeDailyQuests();
    }
    
    modifier notDuringBusinessHours() {
        uint256 hour = (block.timestamp / 3600) % 24; // Current hour in UTC
        
        if (hour >= BUSINESS_HOURS_START && hour < BUSINESS_HOURS_END) {
            emit BusinessHoursLockoutEvent(msg.sender, "Go outside and work");
            revert BusinessHoursLockout();
        }
        _;
    }
    
    modifier sunlightCheck() {
        if (isSunnyDay && vitaminDLevel[msg.sender] < VITAMIN_D_MINIMUM) {
            totalSunlightDenials++;
            emit SunlightBlocked(msg.sender, vitaminDLevel[msg.sender]);
            revert SunnyDayRestriction();
        }
        _;
    }
    
    modifier requiresGrassTouch() {
        if (grassTouchesToday[msg.sender] < GRASS_TOUCH_REQUIREMENT) {
            revert TouchGrassFirst();
        }
        _;
    }
    
    function transfer(address to, uint256 value) 
        public 
        override 
        notDuringBusinessHours 
        sunlightCheck 
        returns (bool) 
    {
        _checkSocialLife(msg.sender);
        return super.transfer(to, value);
    }
    
    function touchGrass(uint256 touches) external {
        require(touches > 0 && touches <= 50, "Invalid touch count");
        
        grassTouchesToday[msg.sender] += touches;
        totalGrassTouches += touches;
        
        // Reward with vitamin D
        vitaminDLevel[msg.sender] += touches * 100;
        
        emit GrassTouchVerified(msg.sender, grassTouchesToday[msg.sender]);
        
        // Reset inside streak
        consecutiveDaysInside[msg.sender] = 0;
        
        _logActivity("Grass Touching", touches * 60); // 1 minute per touch
    }
    
    function _checkWeather() internal view returns (bool) {
        // "Weather oracle" - randomly sunny 70% of the time
        uint256 weather = uint256(keccak256(abi.encodePacked(
            block.timestamp / 86400, // Daily weather
            "weather_check"
        ))) % 100;
        
        return weather < 70;
    }
    
    function performSocialLifeAudit() external {
        SocialLifeAudit storage audit = socialAudits[msg.sender];
        
        // Calculate social score based on activity
        uint256 score = 0;
        
        // Check grass touching frequency
        if (grassTouchesToday[msg.sender] >= GRASS_TOUCH_REQUIREMENT) {
            score += 25;
            audit.touchesGrass = true;
        }
        
        // Check vitamin D levels
        if (vitaminDLevel[msg.sender] >= VITAMIN_D_MINIMUM) {
            score += 25;
        }
        
        // Check outside activity
        if (consecutiveDaysInside[msg.sender] < 3) {
            score += 25;
            audit.goesOutside = true;
        }
        
        // Random "has friends" check
        uint256 friendCheck = uint256(keccak256(abi.encodePacked(
            msg.sender, "friends?"
        ))) % 100;
        
        if (friendCheck > 80) { // 20% chance of having friends
            score += 25;
            audit.hasFriends = true;
        }
        
        audit.socialScore = score;
        audit.lastAuditTime = block.timestamp;
        
        // Generate recommendation
        if (score < 25) {
            audit.recommendation = "Immediate intervention required - join a club";
        } else if (score < 50) {
            audit.recommendation = "Concerning - consider getting a plant first";
        } else if (score < 75) {
            audit.recommendation = "Improving - but Jaine still won't notice";
        } else {
            audit.recommendation = "Acceptable - but still terminally online";
        }
        
        emit SocialLifeAudited(msg.sender, score, audit.recommendation);
        
        // Penalty for low scores
        if (score < 50) {
            _penalizePoorSocialLife(msg.sender);
        }
    }
    
    function _checkSocialLife(address user) internal view {
        SocialLifeAudit memory audit = socialAudits[user];
        
        if (audit.lastAuditTime == 0) {
            revert FailedSocialAudit();
        }
        
        if (audit.socialScore < 25) {
            revert GoOutside();
        }
    }
    
    function _penalizePoorSocialLife(address user) internal {
        // Burn tokens as "social penalty"
        uint256 penalty = balanceOf[user] / 100; // 1% penalty
        
        if (penalty > 0) {
            balanceOf[user] -= penalty;
            totalSupply -= penalty;
            emit Transfer(user, address(0), penalty);
            emit EmotionalDamage(user, penalty);
        }
    }
    
    function completeOutsideActivity(
        string memory activityType,
        uint256 duration
    ) external {
        require(duration >= 30, "Activity too short"); // Minimum 30 minutes
        require(duration <= 480, "Suspiciously long activity"); // Max 8 hours
        
        _logActivity(activityType, duration);
        
        // Update vitamin D based on activity
        vitaminDLevel[msg.sender] += duration * 10;
        
        // Reset lockout counters
        consecutiveDaysInside[msg.sender] = 0;
        lastSunlightExposure[msg.sender] = block.timestamp;
    }
    
    function _logActivity(string memory activityType, uint256 duration) internal {
        OutsideActivity memory activity = OutsideActivity({
            activityType: activityType,
            timestamp: block.timestamp,
            duration: duration,
            verified: _verifyActivity(activityType),
            grassTouchCount: grassTouchesToday[msg.sender]
        });
        
        activityLog[msg.sender].push(activity);
        
        emit OutsideActivityLogged(msg.sender, activityType, duration);
    }
    
    function _verifyActivity(string memory activityType) internal pure returns (bool) {
        // Some activities are automatically verified
        bytes32 activityHash = keccak256(abi.encodePacked(activityType));
        
        return activityHash == keccak256("Grass Touching") ||
               activityHash == keccak256("Walking") ||
               activityHash == keccak256("Jogging") ||
               activityHash == keccak256("Crying Outside");
    }
    
    function attemptPremiumFeature() external requiresGrassTouch {
        // Premium features only available to grass touchers
        require(socialAudits[msg.sender].socialScore >= 50, "Social score too low");
        
        // Premium feature: ability to trade during business hours (once)
        // This doesn't actually do anything useful
        emit EmotionalDamage(msg.sender, 1);
    }
    
    function _initializeDailyQuests() internal {
        // Initialize the quest system
        isSunnyDay = _checkWeather();
    }
    
    function getDailyQuest() external returns (string memory quest) {
        require(!hasCompletedDailyQuest[msg.sender], "Already completed today");
        
        string[6] memory quests = [
            "Touch grass 20 times",
            "Spend 2 hours outside",
            "Talk to a real human",
            "Take a shower",
            "Eat a vegetable",
            "See natural sunlight"
        ];
        
        uint256 questIndex = uint256(keccak256(abi.encodePacked(
            block.timestamp / 86400, // Daily quest
            msg.sender
        ))) % 6;
        
        quest = quests[questIndex];
        
        emit DailyQuestAssigned(msg.sender, quest);
    }
    
    function claimQuestReward() external {
        require(grassTouchesToday[msg.sender] >= GRASS_TOUCH_REQUIREMENT, "Quest incomplete");
        require(!hasCompletedDailyQuest[msg.sender], "Already claimed");
        
        hasCompletedDailyQuest[msg.sender] = true;
        failedQuestStreak[msg.sender] = 0;
        
        // Reward: ability to make 1 transfer during business hours tomorrow
        // (This is a lie, it doesn't actually work)
    }
    
    function checkVitaminDDeficiency() external view returns (string memory status) {
        uint256 level = vitaminDLevel[msg.sender];
        
        if (level < 100) {
            return "Severe deficiency - You are basically a mushroom";
        } else if (level < 500) {
            return "Deficient - Vampire-like symptoms detected";
        } else if (level < VITAMIN_D_MINIMUM) {
            return "Low - Recommended: immediate sun exposure";
        } else if (level < 2000) {
            return "Adequate - But could use more grass touching";
        } else {
            return "Good - Still won't help with Jaine though";
        }
    }
    
    function incrementDayInside() external {
        if (block.timestamp > lastSunlightExposure[msg.sender] + 86400) {
            consecutiveDaysInside[msg.sender]++;
            
            // Decay vitamin D
            if (vitaminDLevel[msg.sender] > 100) {
                vitaminDLevel[msg.sender] -= 100;
            }
            
            // Reset daily grass touches
            grassTouchesToday[msg.sender] = 0;
            hasCompletedDailyQuest[msg.sender] = false;
            
            if (consecutiveDaysInside[msg.sender] > 7) {
                emit VitaminDDeficiency(
                    msg.sender, 
                    vitaminDLevel[msg.sender],
                    "Prescribed: Mandatory grass touching therapy"
                );
            }
        }
    }
    
    function getActivityStats(address user) external view returns (
        uint256 grassTouches,
        uint256 vitaminD,
        uint256 daysInside,
        uint256 socialScore,
        bool questCompleted
    ) {
        grassTouches = grassTouchesToday[user];
        vitaminD = vitaminDLevel[user];
        daysInside = consecutiveDaysInside[user];
        socialScore = socialAudits[user].socialScore;
        questCompleted = hasCompletedDailyQuest[user];
    }
}