// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "../PumpJaineBase.sol";

contract JAINE_WILL_NOTICE_ME_SOMEDAY is PumpJaineBase {
    uint256 public hopiumSupply;
    uint256 public manifestationEntries;
    uint256 public realityCheckIgnored;
    uint256 public constant LOTTERY_INTERVAL = 24 hours;
    uint256 public lastLotteryTime;
    uint256 public baseNoticeChance = 1; // 0.1% initially
    
    struct ManifestationJournal {
        string entry;
        uint256 timestamp;
        uint256 hopeLevel;
        bool manifestedYet;
    }
    
    mapping(address => uint256) public hopiumBalance;
    mapping(address => uint256) public desperationLevel;
    mapping(address => uint256) public journalEntries;
    mapping(address => mapping(uint256 => ManifestationJournal)) public journal;
    mapping(address => uint256) public lastNoticeAttempt;
    mapping(address => uint256) public totalIgnored;
    
    event HopiumMined(address indexed miner, uint256 amount, uint256 desperationUsed);
    event ManifestationRecorded(address indexed dreamer, uint256 entryId, string manifestation);
    event RealityCheckDelivered(address indexed target, string reality, bool ignored);
    event NoticeAttemptFailed(address indexed hopeful, uint256 attempt, uint256 probabilityUsed);
    event HopeLevelIncreased(address indexed believer, uint256 oldLevel, uint256 newLevel);
    event SignMisinterpreted(address indexed interpreter, string sign, string interpretation);
    
    error NotDesperateEnough(uint256 required, uint256 current);
    error RealityCheckMandatory();
    error ManifestationTooShort();
    error HopiumAddictionDetected();
    
    constructor() PumpJaineBase("JAINE WILL NOTICE ME SOMEDAY", "HOPIUM") {
        lastLotteryTime = block.timestamp;
        hopiumSupply = 0;
    }
    
    function mineHopium() external payable {
        require(msg.value >= 0.001 ether, "Hope requires investment");
        
        uint256 desperation = desperationLevel[msg.sender];
        uint256 hopiumGenerated = (msg.value * (100 + desperation)) / 0.001 ether;
        
        hopiumBalance[msg.sender] += hopiumGenerated;
        hopiumSupply += hopiumGenerated;
        desperationLevel[msg.sender] += 10;
        
        emit HopiumMined(msg.sender, hopiumGenerated, desperation);
        
        // Payment goes to deployer (false hope economy)
        payable(deployer).transfer(msg.value);
        
        _updateHopeLevel(msg.sender);
    }
    
    function _updateHopeLevel(address user) internal {
        uint256 oldLevel = hopiumBalance[user] / 1000;
        uint256 newLevel = hopiumBalance[user] / 1000;
        
        if (newLevel > oldLevel) {
            emit HopeLevelIncreased(user, oldLevel, newLevel);
        }
    }
    
    function recordManifestation(string memory manifestation) external {
        require(bytes(manifestation).length >= 10, "Manifestation too short");
        require(hopiumBalance[msg.sender] >= 100, "Need more hope to manifest");
        
        uint256 entryId = journalEntries[msg.sender];
        
        journal[msg.sender][entryId] = ManifestationJournal({
            entry: manifestation,
            timestamp: block.timestamp,
            hopeLevel: hopiumBalance[msg.sender],
            manifestedYet: false
        });
        
        journalEntries[msg.sender]++;
        manifestationEntries++;
        
        // Consume some hopium for manifestation
        hopiumBalance[msg.sender] -= 50;
        
        emit ManifestationRecorded(msg.sender, entryId, manifestation);
        
        _deliverRealityCheck(msg.sender);
    }
    
    function _deliverRealityCheck(address target) internal {
        string[6] memory realities = [
            "Manifestation journals don't work on other people's feelings",
            "She's probably busy living her actual life",
            "Maybe focus on yourself instead",
            "This level of obsession isn't healthy",
            "Have you considered she's just not interested?",
            "Your manifestation journal is basically a diary"
        ];
        
        uint256 realityIndex = uint256(keccak256(abi.encodePacked(
            block.timestamp, target
        ))) % 6;
        
        string memory reality = realities[realityIndex];
        
        // 90% chance reality check is ignored
        uint256 random = uint256(keccak256(abi.encodePacked(
            block.timestamp, target, block.prevrandao
        ))) % 100;
        
        bool ignored = random < 90;
        
        if (ignored) {
            realityCheckIgnored++;
            totalIgnored[target]++;
        }
        
        emit RealityCheckDelivered(target, reality, ignored);
    }
    
    function attemptGettingNoticed() external {
        require(block.timestamp >= lastNoticeAttempt[msg.sender] + 1 hours, "Too frequent attempts look desperate");
        require(hopiumBalance[msg.sender] >= 500, "Need more hope for attempt");
        
        lastNoticeAttempt[msg.sender] = block.timestamp;
        
        // Calculate probability (asymptotically approaches 0.1%)
        uint256 timePassed = block.timestamp - deployedAt;
        uint256 daysElapsed = timePassed / 1 days;
        uint256 probability = baseNoticeChance; // Never actually increases meaningfully
        
        // Even with "increased" probability, always fails
        uint256 random = uint256(keccak256(abi.encodePacked(
            block.timestamp, msg.sender, block.prevrandao
        ))) % 10000;
        
        bool noticed = random < probability; // Practically never true
        
        // Consume hopium for attempt
        hopiumBalance[msg.sender] -= 100;
        desperationLevel[msg.sender] += 25;
        
        emit NoticeAttemptFailed(msg.sender, desperationLevel[msg.sender], probability);
        
        if (!noticed) {
            _interpretSign(msg.sender);
        }
    }
    
    function _interpretSign(address interpreter) internal {
        string[8] memory signs = [
            "She looked in my general direction",
            "She didn't immediately block me",
            "Her story was posted after I viewed her profile",
            "She used the same emoji I used last week",
            "She breathed near me once",
            "She didn't say no (because I never asked)",
            "She exists in the same universe as me",
            "The algorithm showed me her content"
        ];
        
        string[8] memory interpretations = [
            "This means she definitely likes me",
            "She's playing hard to get",
            "She's testing my dedication",
            "She's shy but interested",
            "She's waiting for the right moment",
            "This is a clear sign of interest",
            "She's dropping subtle hints",
            "The universe is aligning us"
        ];
        
        uint256 signIndex = uint256(keccak256(abi.encodePacked(
            block.timestamp, interpreter
        ))) % 8;
        
        emit SignMisinterpreted(interpreter, signs[signIndex], interpretations[signIndex]);
        
        // Increase hope despite failure
        hopiumBalance[interpreter] += 200;
        emit HopeLevelIncreased(interpreter, hopiumBalance[interpreter] - 200, hopiumBalance[interpreter]);
    }
    
    function getHopiumStats(address user) external view returns (
        uint256 balance,
        uint256 desperation,
        uint256 journalCount,
        uint256 ignoredChecks,
        uint256 nextAttemptTime
    ) {
        balance = hopiumBalance[user];
        desperation = desperationLevel[user];
        journalCount = journalEntries[user];
        ignoredChecks = totalIgnored[user];
        
        if (lastNoticeAttempt[user] + 1 hours > block.timestamp) {
            nextAttemptTime = (lastNoticeAttempt[user] + 1 hours) - block.timestamp;
        }
    }
    
    function getCurrentNoticeProbability(address user) external view returns (uint256 probability, string memory assessment) {
        probability = baseNoticeChance; // Always pathetically low
        
        if (probability < 5) {
            assessment = "Essentially impossible, but keep dreaming";
        } else if (probability < 50) {
            assessment = "Maybe in an alternate universe";
        } else {
            assessment = "Error: This should never happen";
        }
    }
    
    function getManifestationJournal(address user, uint256 entryId) external view returns (
        string memory entry,
        uint256 timestamp,
        uint256 hopeLevel,
        bool manifested
    ) {
        ManifestationJournal memory journalEntry = journal[user][entryId];
        return (journalEntry.entry, journalEntry.timestamp, journalEntry.hopeLevel, journalEntry.manifestedYet);
    }
}