// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "../PumpJaineBase.sol";

contract JAINE_TEXTED_BACK_K is PumpJaineBase {
    uint256 public constant MAX_RESPONSE_LENGTH = 1;
    uint256 public responseCount;
    uint256 public overAnalysisEvents;
    uint256 public screenshotNFTs;
    uint256 public enthusiasmDecayRate = 95; // 5% decay per response
    
    struct Response {
        string content;
        uint256 timestamp;
        uint256 characterCount;
        uint256 enthusiasmLevel;
        bool isAnalyzed;
    }
    
    struct Analysis {
        string interpretation;
        uint256 positivityScore;
        uint256 hiddenMeaningFound;
        bool conclusionReached;
    }
    
    mapping(uint256 => Response) public responses;
    mapping(uint256 => Analysis) public responseAnalysis;
    mapping(address => uint256) public analysisAttempts;
    mapping(address => uint256) public screenshotsMinted;
    mapping(address => uint256) public readingBetweenLines;
    
    event ResponseReceived(uint256 indexed responseId, string content, uint256 enthusiasm);
    event OverAnalysisPerformed(address indexed analyzer, uint256 responseId, string interpretation);
    event HiddenMeaningDiscovered(address indexed reader, string meaning, bool actuallyThere);
    event ScreenshotNFTMinted(address indexed collector, uint256 tokenId, string conversation);
    event EnthusiasmDecayed(uint256 responseId, uint256 oldLevel, uint256 newLevel);
    event PositiveInterpretationForced(address indexed interpreter, string original, string forced);
    
    error ResponseTooLong(uint256 length, uint256 maxAllowed);
    error NothingToAnalyze();
    error AnalysisParalysis();
    error NoHiddenMeaning();
    
    constructor() PumpJaineBase("JAINE TEXTED BACK K", "KRESPONSE") {}
    
    function receiveResponse(string memory content) external onlyDeployer {
        if (bytes(content).length > MAX_RESPONSE_LENGTH) {
            revert ResponseTooLong(bytes(content).length, MAX_RESPONSE_LENGTH);
        }
        
        responseCount++;
        
        // Calculate enthusiasm level (always disappointingly low)
        uint256 enthusiasm = _calculateEnthusiasm(content);
        
        // Apply decay to all previous responses
        _applyEnthusiasmDecay();
        
        responses[responseCount] = Response({
            content: content,
            timestamp: block.timestamp,
            characterCount: bytes(content).length,
            enthusiasmLevel: enthusiasm,
            isAnalyzed: false
        });
        
        emit ResponseReceived(responseCount, content, enthusiasm);
    }
    
    function _calculateEnthusiasm(string memory content) internal pure returns (uint256) {
        bytes memory contentBytes = bytes(content);
        
        if (contentBytes.length == 0) return 0;
        if (contentBytes.length == 1) {
            // Single character responses have minimal enthusiasm
            if (contentBytes[0] == 'k' || contentBytes[0] == 'K') return 1;
            if (contentBytes[0] == '.') return 0;
            return 2;
        }
        
        return 3; // Anything longer is rare and slightly more enthusiastic
    }
    
    function _applyEnthusiasmDecay() internal {
        for (uint256 i = 1; i <= responseCount; i++) {
            if (responses[i].enthusiasmLevel > 0) {
                uint256 oldLevel = responses[i].enthusiasmLevel;
                uint256 newLevel = (oldLevel * enthusiasmDecayRate) / 100;
                responses[i].enthusiasmLevel = newLevel;
                
                if (newLevel != oldLevel) {
                    emit EnthusiasmDecayed(i, oldLevel, newLevel);
                }
            }
        }
    }
    
    function performOverAnalysis(uint256 responseId) external payable {
        require(responseId > 0 && responseId <= responseCount, "Response doesn't exist");
        require(msg.value >= 0.001 ether, "Analysis requires payment");
        
        Response storage response = responses[responseId];
        if (response.isAnalyzed) revert AnalysisParalysis();
        
        analysisAttempts[msg.sender]++;
        overAnalysisEvents++;
        
        // Generate forced positive interpretation
        string memory interpretation = _generatePositiveInterpretation(response.content);
        uint256 positivityScore = _calculatePositivityScore(interpretation);
        
        responseAnalysis[responseId] = Analysis({
            interpretation: interpretation,
            positivityScore: positivityScore,
            hiddenMeaningFound: positivityScore * 10, // Always find hidden meaning
            conclusionReached: false // Never actually reach conclusions
        });
        
        response.isAnalyzed = true;
        
        emit OverAnalysisPerformed(msg.sender, responseId, interpretation);
        emit PositiveInterpretationForced(msg.sender, response.content, interpretation);
        
        // Payment goes to deployer
        payable(deployer).transfer(msg.value);
    }
    
    function _generatePositiveInterpretation(string memory original) internal pure returns (string memory) {
        bytes memory originalBytes = bytes(original);
        
        if (originalBytes.length == 1) {
            if (originalBytes[0] == 'k' || originalBytes[0] == 'K') {
                return "She's being concise because she's comfortable with me";
            }
            if (originalBytes[0] == '.') {
                return "The period shows she's contemplating our deep connection";
            }
            return "Single character means she's thinking of me so much she's speechless";
        }
        
        return "This response shows she's playing it cool but definitely interested";
    }
    
    function _calculatePositivityScore(string memory interpretation) internal pure returns (uint256) {
        // Always finds high positivity regardless of reality
        return 85 + (bytes(interpretation).length % 15); // 85-99 range
    }
    
    function readBetweenTheLines(uint256 responseId) external view returns (string memory hiddenMeaning) {
        require(responseId > 0 && responseId <= responseCount, "Response doesn't exist");
        
        Response memory response = responses[responseId];
        
        string[5] memory hiddenMeanings = [
            "The brevity shows intellectual depth",
            "She's testing my ability to read subtext",
            "This minimalism indicates sophisticated communication",
            "She's being mysterious to increase attraction",
            "The simplicity masks complex emotions"
        ];
        
        uint256 meaningIndex = uint256(keccak256(abi.encodePacked(
            response.timestamp, responseId
        ))) % 5;
        
        return hiddenMeanings[meaningIndex];
    }
    
    function mintConversationScreenshot(string memory conversation) external payable {
        require(msg.value >= 0.005 ether, "NFT minting fee required");
        require(bytes(conversation).length > 0, "Need conversation content");
        
        screenshotNFTs++;
        screenshotsMinted[msg.sender]++;
        
        emit ScreenshotNFTMinted(msg.sender, screenshotNFTs, conversation);
        
        // Payment goes to deployer
        payable(deployer).transfer(msg.value);
    }
    
    function getResponseAnalysis(uint256 responseId) external view returns (
        string memory content,
        string memory interpretation,
        uint256 positivityScore,
        uint256 enthusiasmLevel,
        bool hasHiddenMeaning
    ) {
        require(responseId > 0 && responseId <= responseCount, "Response doesn't exist");
        
        Response memory response = responses[responseId];
        Analysis memory analysis = responseAnalysis[responseId];
        
        content = response.content;
        interpretation = analysis.interpretation;
        positivityScore = analysis.positivityScore;
        enthusiasmLevel = response.enthusiasmLevel;
        hasHiddenMeaning = analysis.hiddenMeaningFound > 0;
    }
    
    function getConversationStats(address user) external view returns (
        uint256 totalAnalyses,
        uint256 screenshotsCollected,
        uint256 averagePositivity,
        string memory currentInterpretationStyle
    ) {
        totalAnalyses = analysisAttempts[user];
        screenshotsCollected = screenshotsMinted[user];
        
        // Always high positivity despite reality
        averagePositivity = 87;
        currentInterpretationStyle = "Aggressively Optimistic";
    }
    
    function getLatestResponse() external view returns (
        string memory content,
        uint256 timestamp,
        uint256 enthusiasm,
        bool analyzed
    ) {
        if (responseCount == 0) {
            return ("", 0, 0, false);
        }
        
        Response memory latest = responses[responseCount];
        return (latest.content, latest.timestamp, latest.enthusiasmLevel, latest.isAnalyzed);
    }
}