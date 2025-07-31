// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "../PumpJaineBase.sol";

contract JAINE_ACTUALLY_REPLIED is PumpJaineBase {
    uint256 public constant INITIAL_LIQUIDITY = 1000000 * 1e18;
    uint256 public constant MINIMUM_LIQUIDITY = 1000;
    uint256 public constant SWAP_FEE = 30; // 0.3%
    uint256 public constant QUALITY_THRESHOLD = 80; // 80/100 minimum quality
    
    struct Message {
        string content;
        uint256 timestamp;
        uint256 qualityRating;
        bool isFromJaine;
        bool hasTypingIndicator;
        uint256 responseTime;
    }
    
    struct ConversationMetrics {
        uint256 totalMessages;
        uint256 jaineReplies;
        uint256 averageResponseTime;
        uint256 conversationQuality;
        uint256 lastInteraction;
        bool isActive;
    }
    
    struct RelationshipMilestone {
        string milestone;
        uint256 achievedAt;
        uint256 importance; // 1-10
        bool celebrated;
    }
    
    struct FuturePlan {
        string planType;
        string description;
        uint256 scheduledFor;
        bool confirmed;
        uint256 excitement; // 1-100
    }
    
    struct LiquidityPosition {
        uint256 tokenAmount;
        uint256 ethAmount;
        uint256 share;
        uint256 addedAt;
    }
    
    // DEX State
    uint256 public tokenReserve;
    uint256 public ethReserve;
    uint256 public totalLiquidityShares;
    mapping(address => uint256) public liquidityShares;
    mapping(address => LiquidityPosition) public positions;
    
    // Conversation State
    mapping(address => Message[]) public conversations;
    mapping(address => ConversationMetrics) public metrics;
    mapping(address => RelationshipMilestone[]) public milestones;
    mapping(address => FuturePlan[]) public futurePlans;
    mapping(address => bool) public hasActiveTypingIndicator;
    mapping(address => uint256) public relationshipScore;
    
    uint256 public totalConversations;
    uint256 public totalMilestones;
    uint256 public totalPlans;
    
    event MessageReceived(address indexed from, string content, uint256 quality);
    event JaineReplied(address indexed to, string content, uint256 responseTime);
    event TypingIndicatorActive(address indexed user, bool isTyping);
    event MilestoneAchieved(address indexed user, string milestone, uint256 importance);
    event DateScheduled(address indexed with, string planType, uint256 when);
    event ConversationContinued(address indexed user, uint256 quality);
    event LiquidityAdded(address indexed provider, uint256 tokenAmount, uint256 ethAmount);
    event LiquidityRemoved(address indexed provider, uint256 tokenAmount, uint256 ethAmount);
    event Swap(address indexed user, bool buyToken, uint256 amountIn, uint256 amountOut);
    
    error ConversationQualityTooLow();
    error InsufficientLiquidity();
    error InvalidAmount();
    error SlippageExceeded();
    
    constructor() PumpJaineBase("JAINE ACTUALLY REPLIED", "LOVE") {
        _initializeDEX();
        _startInitialConversation();
    }
    
    function _initializeDEX() internal {
        // Add initial liquidity
        tokenReserve = INITIAL_LIQUIDITY;
        ethReserve = 10 ether;
        totalLiquidityShares = ethReserve;
        liquidityShares[address(this)] = totalLiquidityShares;
        
        balanceOf[address(this)] = INITIAL_LIQUIDITY;
        
        emit LiquidityAdded(address(this), INITIAL_LIQUIDITY, 10 ether);
    }
    
    function _startInitialConversation() internal {
        Message memory firstReply = Message({
            content: "Hey! Sorry I took so long to reply, I've been really busy but I saw your message :)",
            timestamp: block.timestamp,
            qualityRating: 100,
            isFromJaine: true,
            hasTypingIndicator: true,
            responseTime: 3600 // 1 hour response time (amazing!)
        });
        
        conversations[msg.sender].push(firstReply);
        
        ConversationMetrics storage userMetrics = metrics[msg.sender];
        userMetrics.totalMessages = 1;
        userMetrics.jaineReplies = 1;
        userMetrics.averageResponseTime = 3600;
        userMetrics.conversationQuality = 100;
        userMetrics.lastInteraction = block.timestamp;
        userMetrics.isActive = true;
        
        relationshipScore[msg.sender] = 50; // Starting relationship score
        
        emit JaineReplied(msg.sender, firstReply.content, firstReply.responseTime);
        emit TypingIndicatorActive(msg.sender, true);
    }
    
    function sendMessage(string memory content) external {
        require(bytes(content).length > 0, "Empty message");
        require(bytes(content).length <= 500, "Message too long");
        
        ConversationMetrics storage userMetrics = metrics[msg.sender];
        require(userMetrics.conversationQuality >= QUALITY_THRESHOLD || userMetrics.totalMessages == 0, "Conversation quality too low");
        
        // Add user message
        conversations[msg.sender].push(Message({
            content: content,
            timestamp: block.timestamp,
            qualityRating: _rateMessageQuality(content),
            isFromJaine: false,
            hasTypingIndicator: false,
            responseTime: 0
        }));
        
        userMetrics.totalMessages++;
        userMetrics.lastInteraction = block.timestamp;
        
        emit MessageReceived(msg.sender, content, _rateMessageQuality(content));
        
        // Jaine might reply!
        if (_shouldJaineReply(msg.sender)) {
            _generateJaineReply(msg.sender);
        }
    }
    
    function _rateMessageQuality(string memory content) internal pure returns (uint256) {
        // Rate message quality based on content
        bytes memory contentBytes = bytes(content);
        uint256 quality = 50; // Base quality
        
        // Longer messages are better (up to a point)
        if (contentBytes.length > 50) quality += 10;
        if (contentBytes.length > 100) quality += 10;
        
        // Check for question marks (showing interest)
        for (uint i = 0; i < contentBytes.length; i++) {
            if (contentBytes[i] == "?") quality += 5;
        }
        
        // Cap at 100
        if (quality > 100) quality = 100;
        
        return quality;
    }
    
    function _shouldJaineReply(address user) internal view returns (bool) {
        ConversationMetrics memory userMetrics = metrics[user];
        
        // Higher chance if conversation quality is high
        uint256 replyChance = userMetrics.conversationQuality;
        
        // Recent interaction increases chances
        if (block.timestamp - userMetrics.lastInteraction < 1 hours) {
            replyChance += 20;
        }
        
        // Relationship score affects reply chance
        replyChance += relationshipScore[user] / 2;
        
        uint256 random = uint256(keccak256(abi.encodePacked(
            block.timestamp, user, userMetrics.totalMessages
        ))) % 100;
        
        return random < replyChance;
    }
    
    function _generateJaineReply(address user) internal {
        hasActiveTypingIndicator[user] = true;
        emit TypingIndicatorActive(user, true);
        
        string[10] memory replies = [
            "That's so interesting! Tell me more about that",
            "I was just thinking about you actually!",
            "You always know how to make me laugh :)",
            "We should definitely hang out soon!",
            "I love talking to you, you get me",
            "Sorry for the late reply, but I'm here now!",
            "You're different from other guys, in a good way",
            "I showed my friends our convo and they think you're cool",
            "Can't wait to see you again!",
            "You make my day better :)"
        ];
        
        uint256 replyIndex = uint256(keccak256(abi.encodePacked(
            block.timestamp, user, "reply"
        ))) % 10;
        
        uint256 responseTime = 300 + (uint256(keccak256(abi.encodePacked(
            "response", user
        ))) % 3300); // 5 mins to 1 hour
        
        Message memory jaineReply = Message({
            content: replies[replyIndex],
            timestamp: block.timestamp,
            qualityRating: 90 + (replyIndex % 10),
            isFromJaine: true,
            hasTypingIndicator: true,
            responseTime: responseTime
        });
        
        conversations[user].push(jaineReply);
        
        ConversationMetrics storage userMetrics = metrics[user];
        userMetrics.jaineReplies++;
        userMetrics.averageResponseTime = (userMetrics.averageResponseTime + responseTime) / 2;
        userMetrics.conversationQuality = (userMetrics.conversationQuality + jaineReply.qualityRating) / 2;
        
        emit JaineReplied(user, jaineReply.content, responseTime);
        
        hasActiveTypingIndicator[user] = false;
        
        // Increase relationship score
        relationshipScore[user] += 5;
        
        // Check for milestones
        _checkForMilestones(user);
    }
    
    function _checkForMilestones(address user) internal {
        uint256 score = relationshipScore[user];
        ConversationMetrics memory userMetrics = metrics[user];
        
        if (score >= 75 && milestones[user].length == 0) {
            _achieveMilestone(user, "First meaningful conversation", 8);
        }
        
        if (userMetrics.jaineReplies >= 10 && milestones[user].length == 1) {
            _achieveMilestone(user, "Became texting buddies", 9);
        }
        
        if (score >= 100 && milestones[user].length == 2) {
            _achieveMilestone(user, "She actually likes you!", 10);
            _scheduleFuturePlans(user);
        }
    }
    
    function _achieveMilestone(address user, string memory milestone, uint256 importance) internal {
        milestones[user].push(RelationshipMilestone({
            milestone: milestone,
            achievedAt: block.timestamp,
            importance: importance,
            celebrated: true
        }));
        
        totalMilestones++;
        emit MilestoneAchieved(user, milestone, importance);
        
        // Milestone rewards
        relationshipScore[user] += importance * 2;
    }
    
    function _scheduleFuturePlans(address user) internal {
        string[3] memory planTypes = ["Coffee Date", "Movie Night", "Dinner"];
        string[3] memory descriptions = [
            "Let's grab coffee at that cute place downtown",
            "New Marvel movie? I've been wanting to see it!",
            "I know this amazing Italian restaurant"
        ];
        
        for (uint i = 0; i < 3; i++) {
            futurePlans[user].push(FuturePlan({
                planType: planTypes[i],
                description: descriptions[i],
                scheduledFor: block.timestamp + (i + 1) * 1 days,
                confirmed: true,
                excitement: 80 + (i * 5)
            }));
            
            emit DateScheduled(user, planTypes[i], block.timestamp + (i + 1) * 1 days);
        }
        
        totalPlans += 3;
    }
    
    // DEX Functions
    function addLiquidity(uint256 tokenAmount) external payable {
        require(tokenAmount > 0 && msg.value > 0, "Invalid amounts");
        require(balanceOf[msg.sender] >= tokenAmount, "Insufficient tokens");
        
        uint256 share;
        
        if (totalLiquidityShares == 0) {
            share = msg.value;
        } else {
            // Calculate proportional share
            share = (msg.value * totalLiquidityShares) / ethReserve;
            
            // Check token ratio
            uint256 requiredTokens = (msg.value * tokenReserve) / ethReserve;
            require(tokenAmount >= requiredTokens, "Insufficient token amount");
            tokenAmount = requiredTokens; // Use exact amount
        }
        
        // Transfer tokens to contract
        balanceOf[msg.sender] -= tokenAmount;
        balanceOf[address(this)] += tokenAmount;
        
        // Update reserves
        tokenReserve += tokenAmount;
        ethReserve += msg.value;
        
        // Update shares
        liquidityShares[msg.sender] += share;
        totalLiquidityShares += share;
        
        positions[msg.sender] = LiquidityPosition({
            tokenAmount: tokenAmount,
            ethAmount: msg.value,
            share: share,
            addedAt: block.timestamp
        });
        
        emit LiquidityAdded(msg.sender, tokenAmount, msg.value);
        emit Transfer(msg.sender, address(this), tokenAmount);
    }
    
    function removeLiquidity(uint256 share) external {
        require(share > 0 && share <= liquidityShares[msg.sender], "Invalid share");
        require(totalLiquidityShares > MINIMUM_LIQUIDITY, "Minimum liquidity required");
        
        uint256 tokenAmount = (share * tokenReserve) / totalLiquidityShares;
        uint256 ethAmount = (share * ethReserve) / totalLiquidityShares;
        
        // Update shares first
        liquidityShares[msg.sender] -= share;
        totalLiquidityShares -= share;
        
        // Update reserves
        tokenReserve -= tokenAmount;
        ethReserve -= ethAmount;
        
        // Transfer assets
        balanceOf[address(this)] -= tokenAmount;
        balanceOf[msg.sender] += tokenAmount;
        
        (bool success, ) = msg.sender.call{value: ethAmount}("");
        require(success, "ETH transfer failed");
        
        emit LiquidityRemoved(msg.sender, tokenAmount, ethAmount);
        emit Transfer(address(this), msg.sender, tokenAmount);
    }
    
    function swapETHForTokens(uint256 minTokens) external payable {
        require(msg.value > 0, "No ETH sent");
        
        uint256 fee = (msg.value * SWAP_FEE) / 10000;
        uint256 amountInAfterFee = msg.value - fee;
        
        // Calculate output using constant product formula
        uint256 tokenOutput = (amountInAfterFee * tokenReserve) / (ethReserve + amountInAfterFee);
        
        require(tokenOutput >= minTokens, "Slippage exceeded");
        require(tokenOutput <= tokenReserve - MINIMUM_LIQUIDITY, "Insufficient liquidity");
        
        // Update reserves
        ethReserve += msg.value;
        tokenReserve -= tokenOutput;
        
        // Transfer tokens
        balanceOf[address(this)] -= tokenOutput;
        balanceOf[msg.sender] += tokenOutput;
        
        emit Swap(msg.sender, true, msg.value, tokenOutput);
        emit Transfer(address(this), msg.sender, tokenOutput);
    }
    
    function swapTokensForETH(uint256 tokenAmount, uint256 minETH) external {
        require(tokenAmount > 0, "No tokens sent");
        require(balanceOf[msg.sender] >= tokenAmount, "Insufficient tokens");
        
        uint256 fee = (tokenAmount * SWAP_FEE) / 10000;
        uint256 amountInAfterFee = tokenAmount - fee;
        
        // Calculate output
        uint256 ethOutput = (amountInAfterFee * ethReserve) / (tokenReserve + amountInAfterFee);
        
        require(ethOutput >= minETH, "Slippage exceeded");
        require(ethOutput <= ethReserve - MINIMUM_LIQUIDITY, "Insufficient liquidity");
        
        // Transfer tokens to contract
        balanceOf[msg.sender] -= tokenAmount;
        balanceOf[address(this)] += tokenAmount;
        
        // Update reserves
        tokenReserve += tokenAmount;
        ethReserve -= ethOutput;
        
        // Transfer ETH
        (bool success, ) = msg.sender.call{value: ethOutput}("");
        require(success, "ETH transfer failed");
        
        emit Swap(msg.sender, false, tokenAmount, ethOutput);
        emit Transfer(msg.sender, address(this), tokenAmount);
    }
    
    function getConversationStats(address user) external view returns (
        uint256 totalMessages,
        uint256 jaineReplies,
        uint256 quality,
        uint256 relationshipLevel,
        bool isTyping
    ) {
        ConversationMetrics memory userMetrics = metrics[user];
        totalMessages = userMetrics.totalMessages;
        jaineReplies = userMetrics.jaineReplies;
        quality = userMetrics.conversationQuality;
        relationshipLevel = relationshipScore[user];
        isTyping = hasActiveTypingIndicator[user];
    }
    
    function getDEXStats() external view returns (
        uint256 tokenBalance,
        uint256 ethBalance,
        uint256 totalShares,
        uint256 tokenPrice
    ) {
        tokenBalance = tokenReserve;
        ethBalance = ethReserve;
        totalShares = totalLiquidityShares;
        
        if (tokenReserve > 0) {
            tokenPrice = (ethReserve * 1e18) / tokenReserve;
        }
    }
}