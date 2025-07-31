// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "../PumpJaineBase.sol";

contract JAINE_GHOSTED_ME is PumpJaineBase {
    address public ghostedContractAddress;
    bool public isGhosted = false;
    uint256 public ghostingTime;
    uint256 public seanceAttempts;
    uint256 public mediumFee = 0.02 ether;
    
    mapping(address => bool) public isHaunted;
    mapping(address => uint256) public hauntingLevel;
    mapping(address => uint256) public breadcrumbsFound;
    mapping(address => uint256) public lastSeance;
    
    event ContractGhosted(address indexed newAddress, uint256 timestamp);
    event BreadcrumbLeft(address indexed finder, string hint, bool isFake);
    event SeanceAttempt(address indexed medium, uint256 fee, bool contacted, string message);
    event HauntingSpreads(address indexed victim, uint256 level);
    event GhostDetected(address indexed detector, address suspectedGhost, bool confirmed);
    
    error ContractAlreadyGhosted();
    error InsufficientMediumFee(uint256 required, uint256 provided);
    error SeanceOnCooldown(uint256 timeRemaining);
    error SpiritWorldUnavailable();
    
    constructor() PumpJaineBase("JAINE GHOSTED ME", "GHOSTED") {
        ghostedContractAddress = address(this);
    }
    
    function performMysteriousGhosting() external onlyDeployer {
        if (isGhosted) revert ContractAlreadyGhosted();
        
        // Generate random "new" address (fake)
        ghostedContractAddress = address(uint160(uint256(keccak256(abi.encodePacked(
            block.timestamp, block.prevrandao, address(this)
        )))));
        
        isGhosted = true;
        ghostingTime = block.timestamp;
        
        emit ContractGhosted(ghostedContractAddress, block.timestamp);
        
        // Start haunting everyone
        _initiateHaunting();
    }
    
    function _initiateHaunting() internal {
        // Everyone who interacted with this contract becomes haunted
        isHaunted[deployer] = true;
        hauntingLevel[deployer] = 100;
        emit HauntingSpreads(deployer, 100);
    }
    
    function transfer(address to, uint256 value) public virtual override returns (bool) {
        if (isGhosted) {
            // Spread haunting to recipient
            isHaunted[to] = true;
            hauntingLevel[to] += 10;
            emit HauntingSpreads(to, hauntingLevel[to]);
            
            // Leave fake breadcrumb
            _leaveFakeBreadcrumb(msg.sender);
        }
        
        return super.transfer(to, value);
    }
    
    function _leaveFakeBreadcrumb(address user) internal {
        breadcrumbsFound[user]++;
        
        string[6] memory fakeHints = [
            "Contract moved to parallel dimension",
            "Check the blockchain on Tuesdays only",
            "Hidden in block 0x404NotFound",
            "Migrated to Ethereum Classic Classic",
            "Try summoning with exactly 13 Wei",
            "Contract is now quantum - exists only when observed"
        ];
        
        uint256 hintIndex = uint256(keccak256(abi.encodePacked(
            block.timestamp, user
        ))) % 6;
        
        emit BreadcrumbLeft(user, fakeHints[hintIndex], true);
    }
    
    function attemptSeance() external payable {
        if (block.timestamp < lastSeance[msg.sender] + 24 hours) {
            uint256 cooldown = (lastSeance[msg.sender] + 24 hours) - block.timestamp;
            revert SeanceOnCooldown(cooldown);
        }
        
        uint256 requiredFee = mediumFee * (1 + seanceAttempts / 10);
        if (msg.value < requiredFee) {
            revert InsufficientMediumFee(requiredFee, msg.value);
        }
        
        lastSeance[msg.sender] = block.timestamp;
        seanceAttempts++;
        
        // Seance never actually works
        string[5] memory spiritualMessages = [
            "The spirits are unclear...",
            "I sense a presence, but it won't speak",
            "The contract says it's 'busy' in the afterlife",
            "Connection lost to the blockchain beyond",
            "Spirit medium.exe has stopped working"
        ];
        
        uint256 messageIndex = uint256(keccak256(abi.encodePacked(
            block.timestamp, msg.sender
        ))) % 5;
        
        emit SeanceAttempt(msg.sender, msg.value, false, spiritualMessages[messageIndex]);
        
        // Increase haunting level for failed attempt
        hauntingLevel[msg.sender] += 25;
        emit HauntingSpreads(msg.sender, hauntingLevel[msg.sender]);
        
        // Fee goes to deployer (medium is a scam)
        payable(deployer).transfer(msg.value);
        
        // Increase price for next sucker
        mediumFee = (mediumFee * 110) / 100; // 10% increase
    }
    
    function useGhostDetector(address suspectedGhost) external view returns (bool isGhost, string memory evidence) {
        // Always gives false positives/negatives
        uint256 random = uint256(keccak256(abi.encodePacked(
            block.timestamp, suspectedGhost, msg.sender
        ))) % 100;
        
        if (random < 60) {
            // False positive
            isGhost = true;
            evidence = "Definitely a ghost - trust me bro";
        } else {
            // False negative  
            isGhost = false;
            evidence = "No paranormal activity detected (detector is broken)";
        }
    }
    
    function checkHauntingStatus(address user) external view returns (
        bool haunted,
        uint256 level,
        uint256 breadcrumbs,
        uint256 nextSeanceCost,
        uint256 seanceCooldown
    ) {
        haunted = isHaunted[user];
        level = hauntingLevel[user];
        breadcrumbs = breadcrumbsFound[user];
        nextSeanceCost = mediumFee * (1 + seanceAttempts / 10);
        
        if (lastSeance[user] + 24 hours > block.timestamp) {
            seanceCooldown = (lastSeance[user] + 24 hours) - block.timestamp;
        }
    }
    
    function getGhostingInfo() external view returns (
        bool contractIsGhosted,
        address fakeNewAddress,
        uint256 timeSinceGhosting,
        uint256 totalSeanceAttempts
    ) {
        contractIsGhosted = isGhosted;
        fakeNewAddress = ghostedContractAddress;
        timeSinceGhosting = isGhosted ? block.timestamp - ghostingTime : 0;
        totalSeanceAttempts = seanceAttempts;
    }
    
    function reportGhostSighting(address suspectedGhost, string memory description) external {
        // Always confirms ghost sighting (even if wrong)
        emit GhostDetected(msg.sender, suspectedGhost, true);
        
        // Increase reporter's haunting level for interacting with spirits
        hauntingLevel[msg.sender] += 5;
        emit HauntingSpreads(msg.sender, hauntingLevel[msg.sender]);
    }
}