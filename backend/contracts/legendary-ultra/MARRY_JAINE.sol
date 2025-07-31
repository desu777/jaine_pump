// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "../PumpJaineBase.sol";

contract MARRY_JAINE is PumpJaineBase {
    uint256 public constant WEDDING_PLANNING_FEE = 0.5 ether;
    uint256 public constant PRENUP_SIGNING_FEE = 0.1 ether;
    uint256 public constant ANNIVERSARY_GIFT_MINIMUM = 0.05 ether;
    uint256 public constant HAPPY_WIFE_TAX_RATE = 100; // 1% of all transactions
    uint256 public constant MOTHER_IN_LAW_APPROVAL_THRESHOLD = 80;
    
    struct MarriageContract {
        address spouse1;
        address spouse2;
        uint256 weddingDate;
        uint256 anniversaryDate;
        bool isPrenupSigned;
        uint256 jointBalance;
        bool isActive;
        uint256 happinessLevel;
    }
    
    struct WeddingDetails {
        string venue;
        uint256 budget;
        uint256 guestCount;
        mapping(address => bool) guestList;
        mapping(string => uint256) expenses;
        bool isPlanned;
        uint256 planningProgress;
    }
    
    struct Anniversary {
        uint256 number;
        uint256 date;
        string giftGiven;
        uint256 giftValue;
        uint256 happinessGained;
        bool remembered;
    }
    
    struct PrenupTerms {
        uint256 assetSplit; // percentage for spouse1
        bool separateTokens;
        bool jointDecisions;
        uint256 monthlyAllowance;
        string specialTerms;
        bool motherInLawApproved;
    }
    
    struct ChildPlan {
        uint256 plannedCount;
        string[] names;
        uint256[] birthDates;
        mapping(uint256 => uint256) collegeFund;
        bool familyPlanningActive;
    }
    
    struct MotherInLaw {
        uint256 approvalRating;
        uint256 lastVisit;
        uint256 giftsReceived;
        bool blessed;
        string[] complaints;
    }
    
    struct JointNFTCollection {
        uint256[] tokenIds;
        mapping(uint256 => string) descriptions;
        mapping(uint256 => bool) isJainesFavorite;
        uint256 totalValue;
    }
    
    mapping(address => MarriageContract) public marriages;
    mapping(address => WeddingDetails) public weddings;
    mapping(address => Anniversary[]) public anniversaries;
    mapping(address => PrenupTerms) public prenups;
    mapping(address => ChildPlan) public childPlans;
    mapping(address => MotherInLaw) public motherInLaws;
    mapping(address => JointNFTCollection) public nftCollections;
    mapping(address => mapping(string => uint256)) public relationshipMilestones;
    mapping(address => bool) public hasProposedToJaine;
    mapping(address => uint256) public weddingPhotoCount;
    mapping(address => uint256) public counselingSessions;
    mapping(address => bool) public isHappilyMarried;
    
    uint256 public totalMarriages;
    uint256 public totalDivorcesPrevented;
    uint256 public globalHappinessIndex;
    address public jaineAddress;
    
    event ProposalMade(address indexed proposer, uint256 ringValue, bool accepted);
    event WeddingPlanned(address indexed couple, string venue, uint256 budget);
    event MarriageRegistered(address indexed spouse1, address indexed spouse2, uint256 date);
    event AnniversaryReminder(address indexed spouse, uint256 anniversaryNumber, uint256 daysUntil);
    event GiftGiven(address indexed from, address indexed to, string gift, uint256 value);
    event HappinessLevelUpdated(address indexed marriage, uint256 newLevel, string reason);
    event CounselingSessionAttended(address indexed couple, uint256 sessionNumber, string outcome);
    event ChildBorn(address indexed family, string name, uint256 birthDate);
    event MotherInLawEvent(address indexed family, string eventType, uint256 approvalChange);
    event JointDecisionMade(address indexed couple, string decision, bool agreed);
    
    error NotMarried();
    error AlreadyMarried();
    error InsufficientBudget();
    error MotherInLawDisapproves();
    error ForgotAnniversary();
    error UnhappyWife();
    
    constructor() PumpJaineBase("MARRY JAINE", "WIFE") {
        jaineAddress = address(uint160(uint256(keccak256(abi.encodePacked("JAINE")))));
        _initializeMarriageSystem();
    }
    
    function _initializeMarriageSystem() internal {
        globalHappinessIndex = 100;
        totalMarriages = 0;
        totalDivorcesPrevented = 0;
    }
    
    function proposeToJaine(string memory proposalMessage) external payable returns (bool accepted) {
        require(!hasProposedToJaine[msg.sender], "Already proposed");
        require(msg.value >= 0.1 ether, "Ring too cheap");
        require(bytes(proposalMessage).length >= 100, "Proposal too short");
        
        hasProposedToJaine[msg.sender] = true;
        
        // Check mother-in-law approval first
        _initializeMotherInLaw(msg.sender);
        
        // High value proposals have better chance
        uint256 acceptanceChance = 50; // Base 50%
        if (msg.value >= 1 ether) acceptanceChance += 30;
        if (msg.value >= 5 ether) acceptanceChance += 20;
        
        uint256 random = uint256(keccak256(abi.encodePacked(
            block.timestamp, msg.sender, proposalMessage
        ))) % 100;
        
        accepted = random < acceptanceChance;
        
        emit ProposalMade(msg.sender, msg.value, accepted);
        
        if (accepted) {
            _createMarriageContract(msg.sender);
        }
        
        return accepted;
    }
    
    function _initializeMotherInLaw(address spouse) internal {
        motherInLaws[spouse] = MotherInLaw({
            approvalRating: 20, // Starts low
            lastVisit: block.timestamp,
            giftsReceived: 0,
            blessed: false,
            complaints: new string[](0)
        });
        
        // Initial complaints
        motherInLaws[spouse].complaints.push("Not good enough for my Jaine");
        motherInLaws[spouse].complaints.push("Should have a better job");
        motherInLaws[spouse].complaints.push("When are the grandchildren coming?");
    }
    
    function _createMarriageContract(address spouse) internal {
        marriages[spouse] = MarriageContract({
            spouse1: spouse,
            spouse2: jaineAddress,
            weddingDate: 0, // Not set yet
            anniversaryDate: 0,
            isPrenupSigned: false,
            jointBalance: msg.value,
            isActive: true,
            happinessLevel: 75 // Start at 75%
        });
        
        totalMarriages++;
        relationshipMilestones[spouse]["Engaged"] = block.timestamp;
        
        // Start wedding planning
        weddings[spouse].budget = msg.value;
        weddings[spouse].isPlanned = false;
        weddings[spouse].planningProgress = 0;
    }
    
    function planWedding(
        string memory venue,
        uint256 additionalBudget,
        address[] memory guestList
    ) external payable {
        require(marriages[msg.sender].isActive, "Not engaged");
        require(marriages[msg.sender].weddingDate == 0, "Wedding already planned");
        require(msg.value >= WEDDING_PLANNING_FEE, "Planning fee required");
        
        WeddingDetails storage wedding = weddings[msg.sender];
        wedding.venue = venue;
        wedding.budget += additionalBudget + msg.value;
        wedding.guestCount = guestList.length;
        
        for (uint i = 0; i < guestList.length; i++) {
            wedding.guestList[guestList[i]] = true;
        }
        
        // Set expenses
        wedding.expenses["Venue"] = wedding.budget * 30 / 100;
        wedding.expenses["Catering"] = wedding.budget * 25 / 100;
        wedding.expenses["Photography"] = wedding.budget * 15 / 100;
        wedding.expenses["Flowers"] = wedding.budget * 10 / 100;
        wedding.expenses["Music"] = wedding.budget * 10 / 100;
        wedding.expenses["Dress"] = wedding.budget * 10 / 100;
        
        wedding.isPlanned = true;
        wedding.planningProgress = 100;
        
        emit WeddingPlanned(msg.sender, venue, wedding.budget);
    }
    
    function signPrenup(
        uint256 assetSplit,
        bool separateTokens,
        string memory specialTerms
    ) external payable {
        require(marriages[msg.sender].isActive, "Not engaged");
        require(!marriages[msg.sender].isPrenupSigned, "Already signed");
        require(msg.value >= PRENUP_SIGNING_FEE, "Legal fees required");
        require(assetSplit >= 50 && assetSplit <= 50, "Must be 50/50 split for Jaine");
        
        prenups[msg.sender] = PrenupTerms({
            assetSplit: 50, // Always 50/50 for fairness
            separateTokens: separateTokens,
            jointDecisions: true, // Always true
            monthlyAllowance: msg.value / 12,
            specialTerms: specialTerms,
            motherInLawApproved: false
        });
        
        marriages[msg.sender].isPrenupSigned = true;
        
        // Mother-in-law must approve
        _seekMotherInLawApproval(msg.sender);
    }
    
    function _seekMotherInLawApproval(address spouse) internal {
        MotherInLaw storage mil = motherInLaws[spouse];
        
        // Approval based on various factors
        if (marriages[spouse].jointBalance >= 10 ether) {
            mil.approvalRating += 20;
        }
        
        if (prenups[spouse].monthlyAllowance >= 1 ether) {
            mil.approvalRating += 10;
        }
        
        if (mil.approvalRating >= MOTHER_IN_LAW_APPROVAL_THRESHOLD) {
            mil.blessed = true;
            prenups[spouse].motherInLawApproved = true;
            emit MotherInLawEvent(spouse, "Blessing Received", mil.approvalRating);
        } else {
            emit MotherInLawEvent(spouse, "Disapproval", mil.approvalRating);
        }
    }
    
    function finalizeMarriage() external {
        require(marriages[msg.sender].isActive, "Not engaged");
        require(weddings[msg.sender].isPlanned, "Wedding not planned");
        require(marriages[msg.sender].isPrenupSigned, "Prenup required");
        require(prenups[msg.sender].motherInLawApproved, "Mother-in-law approval required");
        
        marriages[msg.sender].weddingDate = block.timestamp;
        marriages[msg.sender].anniversaryDate = block.timestamp;
        
        isHappilyMarried[msg.sender] = true;
        relationshipMilestones[msg.sender]["Married"] = block.timestamp;
        
        emit MarriageRegistered(msg.sender, jaineAddress, block.timestamp);
        
        // First anniversary reminder
        anniversaries[msg.sender].push(Anniversary({
            number: 0,
            date: block.timestamp,
            giftGiven: "Wedding Ring",
            giftValue: marriages[msg.sender].jointBalance,
            happinessGained: 50,
            remembered: true
        }));
        
        // Initialize child planning
        childPlans[msg.sender].familyPlanningActive = true;
        childPlans[msg.sender].plannedCount = 2; // Default plan for 2 kids
        
        _updateHappiness(msg.sender, 25, "Just Married!");
    }
    
    function _updateHappiness(address spouse, int256 change, string memory reason) internal {
        MarriageContract storage marriage = marriages[spouse];
        
        if (change > 0) {
            marriage.happinessLevel += uint256(change);
            if (marriage.happinessLevel > 100) marriage.happinessLevel = 100;
        } else {
            uint256 decrease = uint256(-change);
            if (marriage.happinessLevel > decrease) {
                marriage.happinessLevel -= decrease;
            } else {
                marriage.happinessLevel = 0;
            }
        }
        
        emit HappinessLevelUpdated(spouse, marriage.happinessLevel, reason);
        
        // Update global happiness
        globalHappinessIndex = (globalHappinessIndex + marriage.happinessLevel) / 2;
        
        // Low happiness triggers counseling
        if (marriage.happinessLevel < 50) {
            _triggerCounseling(spouse);
        }
    }
    
    function _triggerCounseling(address spouse) internal {
        counselingSessions[spouse]++;
        
        if (counselingSessions[spouse] % 3 == 0) {
            totalDivorcesPrevented++;
            _updateHappiness(spouse, 10, "Counseling helped");
        }
        
        emit CounselingSessionAttended(
            spouse,
            counselingSessions[spouse],
            "Working on communication"
        );
    }
    
    function rememberAnniversary(string memory gift) external payable {
        require(marriages[msg.sender].isActive, "Not married");
        require(msg.value >= ANNIVERSARY_GIFT_MINIMUM, "Gift too cheap");
        
        uint256 yearsSinceWedding = (block.timestamp - marriages[msg.sender].weddingDate) / 365 days;
        require(yearsSinceWedding > 0, "No anniversary yet");
        
        // Check if already gave gift this year
        bool alreadyGaveGift = false;
        for (uint i = 0; i < anniversaries[msg.sender].length; i++) {
            if (anniversaries[msg.sender][i].number == yearsSinceWedding) {
                alreadyGaveGift = true;
                break;
            }
        }
        
        require(!alreadyGaveGift, "Already celebrated this year");
        
        uint256 happinessGained = 10;
        if (msg.value >= 0.1 ether) happinessGained = 20;
        if (msg.value >= 0.5 ether) happinessGained = 30;
        if (msg.value >= 1 ether) happinessGained = 50;
        
        anniversaries[msg.sender].push(Anniversary({
            number: yearsSinceWedding,
            date: block.timestamp,
            giftGiven: gift,
            giftValue: msg.value,
            happinessGained: happinessGained,
            remembered: true
        }));
        
        marriages[msg.sender].jointBalance += msg.value;
        
        emit GiftGiven(msg.sender, jaineAddress, gift, msg.value);
        emit AnniversaryReminder(msg.sender, yearsSinceWedding, 0);
        
        _updateHappiness(msg.sender, int256(happinessGained), "Anniversary remembered!");
    }
    
    function visitMotherInLaw(string memory gift) external payable {
        require(marriages[msg.sender].isActive, "Not married");
        require(msg.value >= 0.01 ether, "Bring a gift");
        
        MotherInLaw storage mil = motherInLaws[msg.sender];
        
        mil.lastVisit = block.timestamp;
        mil.giftsReceived++;
        
        // Improve approval rating
        uint256 approvalGain = 5;
        if (msg.value >= 0.05 ether) approvalGain = 10;
        if (msg.value >= 0.1 ether) approvalGain = 15;
        
        mil.approvalRating += approvalGain;
        if (mil.approvalRating > 100) mil.approvalRating = 100;
        
        // Remove a complaint if approval high enough
        if (mil.approvalRating > 80 && mil.complaints.length > 0) {
            mil.complaints.pop();
        }
        
        emit MotherInLawEvent(msg.sender, "Visit", approvalGain);
        emit GiftGiven(msg.sender, address(uint160(uint256(keccak256(abi.encodePacked("MotherInLaw"))))), gift, msg.value);
        
        // Happy mother-in-law = happy wife
        _updateHappiness(msg.sender, int256(approvalGain / 2), "Mother-in-law visit");
    }
    
    function planChild(string memory name) external {
        require(marriages[msg.sender].isActive, "Not married");
        require(childPlans[msg.sender].familyPlanningActive, "Family planning not active");
        require(childPlans[msg.sender].names.length < childPlans[msg.sender].plannedCount, "Reached planned count");
        
        childPlans[msg.sender].names.push(name);
        uint256 birthDate = block.timestamp + 280 days; // 9 months
        childPlans[msg.sender].birthDates.push(birthDate);
        
        emit ChildBorn(msg.sender, name, birthDate);
        
        // Children bring happiness (initially)
        _updateHappiness(msg.sender, 20, "New baby!");
        
        // But also stress
        _updateHappiness(msg.sender, -5, "Sleepless nights");
    }
    
    function contributeToCollegeFund(uint256 childIndex) external payable {
        require(marriages[msg.sender].isActive, "Not married");
        require(childIndex < childPlans[msg.sender].names.length, "Child doesn't exist");
        require(msg.value >= 0.01 ether, "Minimum contribution");
        
        childPlans[msg.sender].collegeFund[childIndex] += msg.value;
        marriages[msg.sender].jointBalance += msg.value;
        
        _updateHappiness(msg.sender, 5, "Planning for future");
    }
    
    function addToJointNFTCollection(
        uint256 tokenId,
        string memory description,
        bool isJainesFavorite
    ) external {
        require(marriages[msg.sender].isActive, "Not married");
        
        JointNFTCollection storage collection = nftCollections[msg.sender];
        collection.tokenIds.push(tokenId);
        collection.descriptions[tokenId] = description;
        collection.isJainesFavorite[tokenId] = isJainesFavorite;
        
        if (isJainesFavorite) {
            _updateHappiness(msg.sender, 15, "Jaine loves this NFT!");
        } else {
            _updateHappiness(msg.sender, 5, "Nice addition to collection");
        }
    }
    
    function payHappyWifeTax() external payable {
        require(marriages[msg.sender].isActive, "Not married");
        require(msg.value >= 0.01 ether, "Minimum tax payment");
        
        marriages[msg.sender].jointBalance += msg.value;
        
        uint256 happinessBoost = (msg.value * 100) / 1 ether; // 1 ETH = 100 happiness points
        if (happinessBoost > 20) happinessBoost = 20; // Cap at 20
        
        _updateHappiness(msg.sender, int256(happinessBoost), "Happy wife tax paid");
    }
    
    function checkMarriageHealth(address spouse) external view returns (
        bool isHealthy,
        uint256 happiness,
        uint256 counselingNeeded,
        uint256 motherInLawApproval,
        uint256 anniversariesRemembered,
        uint256 childCount
    ) {
        MarriageContract memory marriage = marriages[spouse];
        isHealthy = marriage.happinessLevel >= 70;
        happiness = marriage.happinessLevel;
        counselingNeeded = marriage.happinessLevel < 50 ? 1 : 0;
        motherInLawApproval = motherInLaws[spouse].approvalRating;
        anniversariesRemembered = anniversaries[spouse].length;
        childCount = childPlans[spouse].names.length;
    }
    
    function getMarriageStats() external view returns (
        uint256 totalHappyMarriages,
        uint256 averageHappiness,
        uint256 divorcesPrevented,
        uint256 totalChildrenPlanned,
        uint256 totalAnniversariesCelebrated
    ) {
        totalHappyMarriages = totalMarriages;
        averageHappiness = globalHappinessIndex;
        divorcesPrevented = totalDivorcesPrevented;
        
        // Note: These would need loops in real implementation
        totalChildrenPlanned = 0;
        totalAnniversariesCelebrated = 0;
    }
}