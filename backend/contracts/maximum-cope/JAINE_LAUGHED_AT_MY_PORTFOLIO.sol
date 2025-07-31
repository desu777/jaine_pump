// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "../PumpJaineBase.sol";

contract JAINE_LAUGHED_AT_MY_PORTFOLIO is PumpJaineBase {
    uint256 public constant PORTFOLIO_SCAN_FEE = 0.001 ether;
    uint256 public laughTrackVolume = 50; // 0-100
    uint256 public totalRoasts;
    uint256 public currentLosses;
    
    struct PortfolioItem {
        address token;
        uint256 balance;
        int256 pnl; // profit/loss
        uint256 boughtAt;
        string roast;
    }
    
    struct BadAdvice {
        string advice;
        uint256 timestamp;
        uint256 potentialLoss;
        bool followed;
    }
    
    mapping(address => PortfolioItem[]) public portfolios;
    mapping(address => uint256) public portfolioScore; // 0-100, lower is worse
    mapping(address => uint256) public timesRoasted;
    mapping(address => mapping(uint256 => string)) public roastHistory;
    mapping(uint256 => BadAdvice) public financialAdvice;
    mapping(address => bool) public hasBeenScanned;
    
    uint256 public adviceCounter;
    
    event PortfolioScanned(address indexed victim, uint256 score, string verdict);
    event LaughTrackPlayed(address indexed target, uint256 volume, string trigger);
    event PortfolioRoasted(address indexed victim, string roast, uint256 severity);
    event BadTradeDetected(address indexed trader, string token, int256 loss);
    event FinancialAdviceGenerated(uint256 adviceId, string advice, uint256 potentialLoss);
    event DiamondHandsCopeMechanism(address indexed holder, string copium);
    
    error PortfolioTooGood();
    error NotEnoughLosses();
    error AlreadyRoasted();
    
    constructor() PumpJaineBase("JAINE LAUGHED AT MY PORTFOLIO", "NGMI") {
        _generateInitialAdvice();
    }
    
    function scanPortfolio(address victim) external payable {
        require(msg.value >= PORTFOLIO_SCAN_FEE, "Oracle fee required");
        
        uint256 score = _calculatePortfolioScore(victim);
        portfolioScore[victim] = score;
        hasBeenScanned[victim] = true;
        
        string memory verdict = _getPortfolioVerdict(score);
        emit PortfolioScanned(victim, score, verdict);
        
        if (score < 30) {
            _roastPortfolio(victim, score);
            _playLaughTrack(victim, "portfolio_scan");
        }
        
        _adjustTokenPrice(score);
    }
    
    function _calculatePortfolioScore(address holder) internal returns (uint256) {
        // Simulate portfolio analysis (worse = lower score)
        uint256 randomFactor = uint256(keccak256(abi.encodePacked(
            block.timestamp, holder, "portfolio_analysis"
        ))) % 100;
        
        // Most portfolios are bad (weighted towards low scores)
        if (randomFactor < 60) return randomFactor / 3; // 0-20
        else if (randomFactor < 85) return 20 + (randomFactor - 60); // 20-45
        else return 45 + (randomFactor - 85) * 2; // 45-75
    }
    
    function _getPortfolioVerdict(uint256 score) internal pure returns (string memory) {
        if (score < 10) return "Absolutely NGMI - Even worse than Luna holders";
        else if (score < 25) return "Portfolio screams 'I buy the top'";
        else if (score < 40) return "Classic retail bagholder detected";
        else if (score < 60) return "Mid-tier mediocrity personified";
        else if (score < 75) return "Slightly less terrible than most";
        else return "Still not good enough for Jaine";
    }
    
    function _roastPortfolio(address victim, uint256 score) internal {
        totalRoasts++;
        timesRoasted[victim]++;
        
        string[10] memory roasts = [
            "Your portfolio looks like a suicide hotline's case study",
            "I've seen better returns from a savings account in Zimbabwe",
            "Even SafeMoon holders are laughing at your choices",
            "Your chart pattern spells 'HELP ME' in candlesticks",
            "This portfolio violates the Geneva Convention",
            "Your bags are heavier than your mom",
            "Even Nigerian princes wouldn't touch these tokens",
            "Your portfolio is the financial equivalent of stepping on LEGOs",
            "These holdings gave my calculator depression",
            "Your tokens are racing to zero faster than your dating prospects"
        ];
        
        uint256 roastIndex = uint256(keccak256(abi.encodePacked(
            block.timestamp, victim, totalRoasts
        ))) % 10;
        
        string memory roast = roasts[roastIndex];
        roastHistory[victim][timesRoasted[victim]] = roast;
        
        emit PortfolioRoasted(victim, roast, 100 - score);
    }
    
    function _playLaughTrack(address target, string memory trigger) internal {
        uint256 volume = laughTrackVolume;
        
        // Louder laughs for worse portfolios
        if (portfolioScore[target] < 20) {
            volume = 100;
        } else if (portfolioScore[target] < 40) {
            volume = 80;
        }
        
        emit LaughTrackPlayed(target, volume, trigger);
    }
    
    function _adjustTokenPrice(uint256 portfolioScore) internal {
        // Inverse correlation: worse portfolio = lower token price
        if (portfolioScore < 25 && totalSupply > 100000 * 1e18) {
            uint256 burnAmount = (totalSupply * (50 - portfolioScore)) / 1000;
            _burn(burnAmount);
            
            emit EmotionalDamage(msg.sender, burnAmount);
        }
    }
    
    function reportBadTrade(
        address trader,
        string memory token,
        int256 loss
    ) external {
        require(loss < 0, "This is for losses only");
        require(hasBeenScanned[trader], "Portfolio must be scanned first");
        
        currentLosses += uint256(-loss);
        
        emit BadTradeDetected(trader, token, loss);
        _playLaughTrack(trader, "bad_trade");
        
        // Make their portfolio score worse
        if (portfolioScore[trader] > 5) {
            portfolioScore[trader] -= 5;
        }
    }
    
    function generateFinancialAdvice() external returns (uint256 adviceId) {
        adviceCounter++;
        adviceId = adviceCounter;
        
        string[8] memory terribleAdvice = [
            "Buy high, sell low - it's a tax strategy",
            "Leverage 125x on memecoins for guaranteed gains",
            "Trust influencers with laser eyes",
            "If it's down 90%, it can only go up from here!",
            "Average down until you own the entire supply",
            "Technical analysis says buy (I drew random lines)",
            "This pump will definitely continue forever",
            "Mortgage your house for the dip"
        ];
        
        uint256 adviceIndex = uint256(keccak256(abi.encodePacked(
            block.timestamp, msg.sender, adviceCounter
        ))) % 8;
        
        uint256 potentialLoss = (uint256(keccak256(abi.encodePacked(
            "loss", adviceCounter
        ))) % 90 + 10) * 1e18; // 10-100 ETH potential loss
        
        financialAdvice[adviceId] = BadAdvice({
            advice: terribleAdvice[adviceIndex],
            timestamp: block.timestamp,
            potentialLoss: potentialLoss,
            followed: false
        });
        
        emit FinancialAdviceGenerated(adviceId, terribleAdvice[adviceIndex], potentialLoss);
    }
    
    function followAdvice(uint256 adviceId) external {
        BadAdvice storage advice = financialAdvice[adviceId];
        require(advice.timestamp > 0, "Advice doesn't exist");
        require(!advice.followed, "Already followed this advice");
        
        advice.followed = true;
        
        // Following advice always makes things worse
        if (portfolioScore[msg.sender] > 10) {
            portfolioScore[msg.sender] -= 10;
        }
        
        // Burn tokens as "investment loss"
        uint256 loss = advice.potentialLoss / 100; // 1% of potential loss
        if (balanceOf[msg.sender] >= loss) {
            _burn(loss);
            currentLosses += loss;
        }
        
        _playLaughTrack(msg.sender, "followed_bad_advice");
    }
    
    function activateDiamondHandsCope() external {
        require(portfolioScore[msg.sender] < 30, "Portfolio not bad enough to cope");
        
        string[6] memory copiumLines = [
            "It's not a loss if you don't sell",
            "I'm in it for the technology",
            "Weak hands don't deserve gains",
            "This is just healthy consolidation",
            "The fundamentals haven't changed",
            "I actually prefer being poor"
        ];
        
        uint256 copeIndex = uint256(keccak256(abi.encodePacked(
            block.timestamp, msg.sender
        ))) % 6;
        
        emit DiamondHandsCopeMechanism(msg.sender, copiumLines[copeIndex]);
        
        // Coping costs tokens
        uint256 copeCost = 100 * 1e18;
        if (balanceOf[msg.sender] >= copeCost) {
            balanceOf[msg.sender] -= copeCost;
            balanceOf[address(this)] += copeCost;
            emit Transfer(msg.sender, address(this), copeCost);
        }
    }
    
    function _generateInitialAdvice() internal {
        // Initial advice will be generated on first call
        adviceCounter = 0;
    }
    
    function getPortfolioRoasts(address victim) external view returns (string[] memory) {
        uint256 roastCount = timesRoasted[victim];
        string[] memory roasts = new string[](roastCount);
        
        for (uint256 i = 0; i < roastCount; i++) {
            roasts[i] = roastHistory[victim][i + 1];
        }
        
        return roasts;
    }
    
    function getTotalDamage() external view returns (
        uint256 roasts,
        uint256 losses,
        uint256 badAdviceGiven,
        uint256 currentLaughVolume
    ) {
        roasts = totalRoasts;
        losses = currentLosses;
        badAdviceGiven = adviceCounter;
        currentLaughVolume = laughTrackVolume;
    }
}