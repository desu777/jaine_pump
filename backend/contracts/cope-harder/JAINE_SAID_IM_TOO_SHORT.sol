// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "../PumpJaineBase.sol";

contract JAINE_SAID_IM_TOO_SHORT is PumpJaineBase {
    uint256 public constant MIN_HEIGHT_REQUIREMENT = 188; // 6'2" in cm
    uint256 public platformShoeRentals;
    uint256 public heightFraudDetections;
    uint256 public napoleonComplexFund;
    uint256 public elevatorInsuranceClaims;
    
    mapping(address => uint256) public claimedHeight;
    mapping(address => uint256) public actualHeight;
    mapping(address => bool) public hasHeightVerification;
    mapping(address => uint256) public manletTaxRate;
    mapping(address => uint256) public platformShoeLevel;
    mapping(address => bool) public hasElevatorInsurance;
    mapping(address => uint256) public napoleonPoints;
    
    event HeightVerificationFailed(address indexed user, uint256 claimed, uint256 actual);
    event ManletTaxApplied(address indexed victim, uint256 taxAmount, uint256 heightDeficit);
    event PlatformShoeRented(address indexed renter, uint256 level, uint256 cost, uint256 newHeight);
    event HeightFraudDetected(address indexed fraudster, uint256 discrepancy);
    event NapoleonComplexTriggered(address indexed victim, uint256 compensationAmount);
    event ElevatorInsuranceClaim(address indexed claimant, string reason, bool approved);
    event TallPrivilegeGranted(address indexed user, string[] privileges);
    
    error HeightRequirementNotMet(uint256 required, uint256 provided);
    error HeightFraudError(uint256 claimed, uint256 verified);
    error InsufficientElevatorCoverage();
    error PlatformShoesTooObvious();
    error NapoleonComplexOverflow();
    
    constructor() PumpJaineBase("JAINE SAID IM TOO SHORT", "MANLET") {}
    
    function submitHeightVerification(uint256 height) external payable {
        require(msg.value >= 0.001 ether, "Height verification fee required");
        require(height > 0 && height < 300, "Invalid height");
        
        claimedHeight[msg.sender] = height;
        
        // Generate "actual" height (always disappointing)
        uint256 verifiedHeight = _performHeightVerification(msg.sender, height);
        actualHeight[msg.sender] = verifiedHeight;
        hasHeightVerification[msg.sender] = true;
        
        if (verifiedHeight < height) {
            heightFraudDetections++;
            emit HeightFraudDetected(msg.sender, height - verifiedHeight);
        }
        
        if (verifiedHeight < MIN_HEIGHT_REQUIREMENT) {
            emit HeightVerificationFailed(msg.sender, height, verifiedHeight);
            _calculateManletTax(msg.sender, verifiedHeight);
            _triggerNapoleonComplex(msg.sender);
        } else {
            _grantTallPrivileges(msg.sender);
        }
        
        payable(deployer).transfer(msg.value);
    }
    
    function _performHeightVerification(address user, uint256 claimed) internal view returns (uint256) {
        // Height verification always reduces claimed height
        uint256 random = uint256(keccak256(abi.encodePacked(
            block.timestamp, user, block.prevrandao
        )));
        
        uint256 reduction = 5 + (random % 10); // Reduce by 5-15 cm
        return claimed > reduction ? claimed - reduction : claimed;
    }
    
    function _calculateManletTax(address user, uint256 height) internal {
        uint256 deficit = MIN_HEIGHT_REQUIREMENT - height;
        uint256 taxRate = deficit * 10; // 10 per cm deficit
        
        if (taxRate > 1000) taxRate = 1000; // Cap at 10%
        
        manletTaxRate[user] = taxRate;
        emit ManletTaxApplied(user, taxRate, deficit);
    }
    
    function _triggerNapoleonComplex(address user) internal {
        napoleonPoints[user] += actualHeight[user] < 170 ? 100 : 50;
        
        if (napoleonPoints[user] > 500) {
            napoleonComplexFund += 0.001 ether;
            emit NapoleonComplexTriggered(user, napoleonPoints[user]);
        }
    }
    
    function _grantTallPrivileges(address user) internal {
        string[] memory privileges = new string[](4);
        privileges[0] = "Can reach top shelf items";
        privileges[1] = "Automatic dating app matches";
        privileges[2] = "Natural leadership assumption";
        privileges[3] = "Jaine's immediate attention";
        
        emit TallPrivilegeGranted(user, privileges);
    }
    
    function transfer(address to, uint256 value) public virtual override returns (bool) {
        uint256 tax = _calculateTransferTax(msg.sender, value);
        
        if (tax > 0) {
            if (balanceOf[msg.sender] < value + tax) {
                revert InsufficientBalance(value + tax, balanceOf[msg.sender]);
            }
            
            balanceOf[msg.sender] -= tax;
            balanceOf[address(this)] += tax;
            
            emit ManletTaxApplied(msg.sender, tax, MIN_HEIGHT_REQUIREMENT - actualHeight[msg.sender]);
        }
        
        return super.transfer(to, value);
    }
    
    function _calculateTransferTax(address user, uint256 amount) internal view returns (uint256) {
        if (!hasHeightVerification[user] || actualHeight[user] >= MIN_HEIGHT_REQUIREMENT) return 0;
        
        return (amount * manletTaxRate[user]) / 10000;
    }
    
    function rentPlatformShoes(uint256 level) external payable {
        require(level > 0 && level <= 10, "Invalid platform level");
        require(actualHeight[msg.sender] < MIN_HEIGHT_REQUIREMENT, "Only for height-challenged users");
        
        uint256 cost = 0.001 ether * level * level; // Exponential cost
        require(msg.value >= cost, "Insufficient rental fee");
        
        platformShoeRentals++;
        platformShoeLevel[msg.sender] = level;
        
        uint256 heightIncrease = level * 3; // 3cm per level
        uint256 newApparentHeight = actualHeight[msg.sender] + heightIncrease;
        
        emit PlatformShoeRented(msg.sender, level, cost, newApparentHeight);
        
        // Platform shoes are obvious and embarrassing
        if (level > 5) {
            revert PlatformShoesTooObvious();
        }
        
        payable(deployer).transfer(msg.value);
    }
    
    function purchaseElevatorInsurance() external payable {
        require(msg.value >= 0.005 ether, "Insurance premium required");
        require(actualHeight[msg.sender] < MIN_HEIGHT_REQUIREMENT, "Tall people don't need elevator insurance");
        
        hasElevatorInsurance[msg.sender] = true;
        
        emit ElevatorInsuranceClaim(msg.sender, "Preventive coverage purchased", true);
        
        payable(deployer).transfer(msg.value);
    }
    
    function fileElevatorInsuranceClaim(string memory reason) external {
        if (!hasElevatorInsurance[msg.sender]) revert InsufficientElevatorCoverage();
        
        elevatorInsuranceClaims++;
        
        // Claims are always rejected with ridiculous reasons
        string[5] memory rejectionReasons = [
            "Pre-existing height condition not covered",
            "Genetic shortness is not an insurable event",
            "User failed to use stairs as alternative",
            "Elevator malfunction due to user being below minimum weight sensors",
            "Policy void for excessive Napoleon complex"
        ];
        
        uint256 reasonIndex = uint256(keccak256(abi.encodePacked(
            block.timestamp, msg.sender
        ))) % 5;
        
        emit ElevatorInsuranceClaim(msg.sender, rejectionReasons[reasonIndex], false);
    }
    
    function compensateForHeight() external payable {
        require(actualHeight[msg.sender] < MIN_HEIGHT_REQUIREMENT, "Already tall enough");
        require(msg.value >= 0.01 ether, "Significant compensation required");
        
        napoleonComplexFund += msg.value;
        napoleonPoints[msg.sender] += uint256(msg.value / 0.001 ether);
        
        if (napoleonPoints[msg.sender] > 10000) {
            revert NapoleonComplexOverflow();
        }
        
        emit NapoleonComplexTriggered(msg.sender, napoleonPoints[msg.sender]);
        
        payable(deployer).transfer(msg.value);
    }
    
    function getHeightStats(address user) external view returns (
        uint256 claimed,
        uint256 verified,
        uint256 taxRate,
        uint256 shoeLevel,
        bool hasInsurance,
        uint256 complexPoints
    ) {
        claimed = claimedHeight[user];
        verified = actualHeight[user];
        taxRate = manletTaxRate[user];
        shoeLevel = platformShoeLevel[user];
        hasInsurance = hasElevatorInsurance[user];
        complexPoints = napoleonPoints[user];
    }
    
    function getEffectiveHeight(address user) external view returns (uint256 apparent, bool meetsRequirement) {
        uint256 base = actualHeight[user];
        uint256 shoes = platformShoeLevel[user] * 3;
        apparent = base + shoes;
        meetsRequirement = apparent >= MIN_HEIGHT_REQUIREMENT;
    }
    
    function getHeightRequirement() external pure returns (uint256 requirement, string memory description) {
        requirement = MIN_HEIGHT_REQUIREMENT;
        description = "6'2\" minimum - no exceptions, no negotiation";
    }
    
    function checkTallPrivileges(address user) external view returns (bool hasTallPrivileges, string[] memory privileges) {
        hasTallPrivileges = actualHeight[user] >= MIN_HEIGHT_REQUIREMENT;
        
        if (hasTallPrivileges) {
            privileges = new string[](4);
            privileges[0] = "Can reach top shelf items";
            privileges[1] = "Automatic dating app matches";
            privileges[2] = "Natural leadership assumption";
            privileges[3] = "Jaine's immediate attention";
        } else {
            privileges = new string[](1);
            privileges[0] = "Right to pay manlet tax";
        }
    }
}