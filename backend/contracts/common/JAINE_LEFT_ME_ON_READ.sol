// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "../PumpJaineBase.sol";

contract JAINE_LEFT_ME_ON_READ is PumpJaineBase {
    uint256 public constant BURN_RATE = 100; // 1% per hour
    uint256 public lastBurnTime;
    uint256 public lastReadTime;
    uint256 public messageCount;
    uint256 public readCount;
    
    struct Message {
        string content;
        uint256 timestamp;
        bool isRead;
        bool isDelivered;
    }
    
    mapping(uint256 => Message) public messages;
    
    event MessageSent(uint256 indexed messageId, string content, uint256 timestamp);
    event MessageDelivered(uint256 indexed messageId, uint256 timestamp);
    event MessageRead(uint256 indexed messageId, uint256 timestamp);
    event AutoBurnTriggered(uint256 amount, uint256 lonelinessLevel);
    
    error MessageTooLong();
    error MessageEmpty();
    error MessageNotFound();
    
    constructor() PumpJaineBase("JAINE LEFT ME ON READ", "LEFTREAD") {
        lastBurnTime = block.timestamp;
        lastReadTime = block.timestamp;
    }
    
    function sendMessage(string memory content) external onlyDeployer {
        if (bytes(content).length == 0) revert MessageEmpty();
        if (bytes(content).length > 280) revert MessageTooLong();
        
        messageCount++;
        messages[messageCount] = Message({
            content: content,
            timestamp: block.timestamp,
            isRead: false,
            isDelivered: true
        });
        
        emit MessageSent(messageCount, content, block.timestamp);
        emit MessageDelivered(messageCount, block.timestamp);
        
        _triggerAutoBurn();
    }
    
    function markAsRead(uint256 messageId) external {
        if (messageId == 0 || messageId > messageCount) revert MessageNotFound();
        if (messages[messageId].isRead) return;
        
        messages[messageId].isRead = true;
        readCount++;
        lastReadTime = block.timestamp;
        
        emit MessageRead(messageId, block.timestamp);
    }
    
    function getLonelinessLevel() public view returns (uint256) {
        uint256 timeSinceLastRead = block.timestamp - lastReadTime;
        return timeSinceLastRead / 3600; // Hours since last read
    }
    
    function getReadRatio() public view returns (uint256) {
        if (messageCount == 0) return 0;
        return (readCount * 100) / messageCount;
    }
    
    function _triggerAutoBurn() internal {
        if (block.timestamp < lastBurnTime + 1 hours) return;
        
        uint256 lonelinessLevel = getLonelinessLevel();
        uint256 multiplier = 1 + (lonelinessLevel / 24); // +1x every 24 hours
        uint256 burnAmount = (totalSupply * BURN_RATE * multiplier) / 10000;
        
        if (burnAmount > 0) {
            _burn(burnAmount);
            lastBurnTime = block.timestamp;
            emit AutoBurnTriggered(burnAmount, lonelinessLevel);
        }
    }
    
    function getLastSeen() external view returns (uint256) {
        return lastReadTime;
    }
    
    function getMessageHistory(uint256 from, uint256 to) external view returns (Message[] memory) {
        if (from == 0) from = 1;
        if (to == 0 || to > messageCount) to = messageCount;
        if (from > to) return new Message[](0);
        
        uint256 length = to - from + 1;
        Message[] memory result = new Message[](length);
        
        for (uint256 i = 0; i < length; i++) {
            result[i] = messages[from + i];
        }
        
        return result;
    }
}