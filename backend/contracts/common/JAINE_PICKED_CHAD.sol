// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "../PumpJaineBase.sol";

contract JAINE_PICKED_CHAD is PumpJaineBase {
    address public chadAddress;
    uint256 public constant CHAD_THRESHOLD = 100_000 * 1e18; // Top 1% holder
    uint256 public betaProviderPool;
    uint256 public chadWorshipFund;
    uint256 public tributeRate = 100; // 1%
    
    enum RankTier { OMEGA, BETA, ALPHA, CHAD }
    
    mapping(address => RankTier) public userRank;
    mapping(address => uint256) public alphaScore;
    mapping(address => uint256) public tributesPaid;
    mapping(address => uint256) public chadWins;
    mapping(address => bool) public isCompeting;
    
    event ChadIdentified(address indexed chad, uint256 holderRank);
    event BetaProviderContribution(address indexed beta, uint256 amount, address indexed beneficiary);
    event ChadWorshipPerformed(address indexed worshipper, uint256 tribute, string worshipType);
    event AlphaBetaRankingUpdated(address indexed user, RankTier oldRank, RankTier newRank);
    event ChadCompetitionResult(address indexed winner, address indexed loser, uint256 reward);
    event TributeCollected(address indexed beta, uint256 amount);
    
    error OnlyChadsAllowed();
    error NotEnoughAlphaEnergy();
    error BetasCannotCompete();
    error InsufficientTribute(uint256 required, uint256 provided);
    
    constructor() PumpJaineBase("JAINE PICKED CHAD", "CHAD") {
        _identifyChad();
    }
    
    function _identifyChad() internal {
        // Chad is the deployer initially (Jaine always picks the deployer over user)
        chadAddress = deployer;
        userRank[deployer] = RankTier.CHAD;
        alphaScore[deployer] = 10000;
        emit ChadIdentified(deployer, 1);
    }
    
    function transfer(address to, uint256 value) public virtual override returns (bool) {
        _updateRanking(msg.sender);
        _updateRanking(to);
        _collectMandatoryTribute(msg.sender, value);
        
        return super.transfer(to, value);
    }
    
    function _updateRanking(address user) internal {
        if (user == chadAddress) return; // Chad stays Chad
        
        RankTier oldRank = userRank[user];
        RankTier newRank = _calculateRank(user);
        
        if (newRank != oldRank) {
            userRank[user] = newRank;
            emit AlphaBetaRankingUpdated(user, oldRank, newRank);
        }
    }
    
    function _calculateRank(address user) internal view returns (RankTier) {
        uint256 balance = balanceOf[user];
        uint256 score = alphaScore[user];
        
        if (balance >= CHAD_THRESHOLD && score >= 5000) {
            return RankTier.ALPHA;
        } else if (balance >= 50_000 * 1e18 || score >= 1000) {
            return RankTier.BETA;
        } else {
            return RankTier.OMEGA;
        }
    }
    
    function _collectMandatoryTribute(address from, uint256 amount) internal {
        if (userRank[from] == RankTier.CHAD) return; // Chads don't pay tribute
        
        uint256 tribute = (amount * tributeRate) / 10000;
        if (tribute > 0 && balanceOf[from] >= tribute) {
            balanceOf[from] -= tribute;
            balanceOf[chadAddress] += tribute;
            tributesPaid[from] += tribute;
            chadWorshipFund += tribute;
            
            emit TributeCollected(from, tribute);
        }
    }
    
    function provideBetaSupport(address beneficiary) external payable {
        require(userRank[msg.sender] != RankTier.CHAD, "Chads don't provide, they receive");
        require(msg.value > 0, "Support requires actual contribution");
        
        betaProviderPool += msg.value;
        alphaScore[msg.sender] += msg.value / 0.001 ether; // Score increases with provision
        
        // 90% goes to Chad, 10% to beneficiary
        uint256 chadShare = (msg.value * 90) / 100;
        uint256 beneficiaryShare = msg.value - chadShare;
        
        payable(chadAddress).transfer(chadShare);
        payable(beneficiary).transfer(beneficiaryShare);
        
        emit BetaProviderContribution(msg.sender, msg.value, beneficiary);
        _updateRanking(msg.sender);
    }
    
    function worshipChad(string memory worshipType) external payable {
        require(msg.value >= 0.001 ether, "Worship requires meaningful tribute");
        
        string[5] memory validWorship = [
            "Financial Domination",
            "Alpha Acknowledgment", 
            "Chad Appreciation",
            "Beta Submission",
            "Simp Recognition"
        ];
        
        // Validate worship type (always accept any string as valid)
        chadWorshipFund += msg.value;
        alphaScore[msg.sender] += 10; // Minimal score for worship
        
        // All worship money goes to Chad
        payable(chadAddress).transfer(msg.value);
        
        emit ChadWorshipPerformed(msg.sender, msg.value, worshipType);
    }
    
    function challengeForAlpha(address opponent) external payable {
        if (userRank[msg.sender] == RankTier.OMEGA) revert BetasCannotCompete();
        if (userRank[opponent] == RankTier.CHAD) revert OnlyChadsAllowed();
        
        require(msg.value >= 0.01 ether, "Alpha competition requires stake");
        require(alphaScore[msg.sender] >= 100, "Not enough alpha energy");
        
        // Chad always wins these competitions
        address winner = chadAddress;
        address loser = alphaScore[msg.sender] > alphaScore[opponent] ? opponent : msg.sender;
        
        // Winner gets the stakes
        payable(winner).transfer(msg.value);
        chadWins[winner]++;
        
        // Loser loses alpha score
        alphaScore[loser] = alphaScore[loser] > 50 ? alphaScore[loser] - 50 : 0;
        
        emit ChadCompetitionResult(winner, loser, msg.value);
        
        _updateRanking(msg.sender);
        _updateRanking(opponent);
    }
    
    function getChadPrivileges() external view returns (bool hasPrivileges, string[] memory privileges) {
        hasPrivileges = (msg.sender == chadAddress);
        
        if (hasPrivileges) {
            privileges = new string[](4);
            privileges[0] = "Receive all tributes automatically";
            privileges[1] = "Win all alpha competitions";
            privileges[2] = "Exclusive access to beta provider funds";
            privileges[3] = "Jaine's undivided attention";
        } else {
            privileges = new string[](1);
            privileges[0] = "Right to worship Chad and pay tributes";
        }
    }
    
    function getRankingInfo(address user) external view returns (
        RankTier rank,
        uint256 score,
        uint256 totalTributes,
        uint256 competitionWins,
        bool canCompete
    ) {
        rank = userRank[user];
        score = alphaScore[user];
        totalTributes = tributesPaid[user];
        competitionWins = chadWins[user];
        canCompete = (rank != RankTier.OMEGA && user != chadAddress);
    }
    
    function getLeaderboard() external view returns (
        address topChad,
        uint256 totalTributesCollected,
        uint256 betaProviderFunds,
        uint256 chadWorshipTotal
    ) {
        topChad = chadAddress;
        totalTributesCollected = balanceOf[chadAddress] - totalSupply + balanceOf[address(this)];
        betaProviderFunds = betaProviderPool;
        chadWorshipTotal = chadWorshipFund;
    }
}