import React, { useState, useEffect } from 'react';

const VioletSlotMachine = () => {
  // Contract types with rarities
  const contracts = [
    { name: 'Greeter', rarity: 'common', chance: 30 },
    { name: 'Counter', rarity: 'common', chance: 25 },
    { name: 'ERC-721 NFT', rarity: 'rare', chance: 15 },
    { name: 'Lottery', rarity: 'rare', chance: 10 },
    { name: 'MultiSig Wallet', rarity: 'epic', chance: 8 },
    { name: 'Staking Pool', rarity: 'epic', chance: 6 },
    { name: 'ERC-20 Token', rarity: 'legendary', chance: 4 },
    { name: 'DAO Voting', rarity: 'legendary', chance: 2 },
    { name: 'Oracle Consumer', rarity: 'mythic', chance: 1 }
  ];

  // Game state
  const [gameStats, setGameStats] = useState({
    spins: 0,
    streak: 0,
    deployed: 0,
    combo: 1.0
  });

  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [showWinBanner, setShowWinBanner] = useState(false);
  const [slotResults, setSlotResults] = useState([null, null, null]);

  // Weighted random selection
  const getRandomContract = () => {
    const totalChance = contracts.reduce((sum, c) => sum + c.chance, 0);
    let random = Math.random() * totalChance;
    
    for (const contract of contracts) {
      random -= contract.chance;
      if (random <= 0) return contract;
    }
    
    return contracts[0];
  };

  // Spin function
  const spin = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    setSelectedContract(null);
    setShowWinBanner(false);
    
    // Update spins count
    setGameStats(prev => ({ ...prev, spins: prev.spins + 1 }));
    
    // Simulate spinning for 3 seconds
    setTimeout(() => {
      const contract = getRandomContract();
      setSelectedContract(contract);
      setSlotResults([contract, contract, contract]);
      setShowWinBanner(true);
      
      // Update game stats
      setGameStats(prev => {
        const newStats = { ...prev };
        
        if (contract.rarity !== 'common') {
          newStats.streak = prev.streak + 1;
          newStats.combo = Math.min(prev.combo + 0.1, 2.0);
        } else {
          newStats.streak = 0;
          newStats.combo = 1.0;
        }
        
        return newStats;
      });
      
      setIsSpinning(false);
      
      // Hide win banner after 3 seconds
      setTimeout(() => {
        setShowWinBanner(false);
      }, 3000);
      
    }, 3000);
  };

  // Deploy contract
  const deployContract = () => {
    if (selectedContract) {
      setGameStats(prev => ({ ...prev, deployed: prev.deployed + 1 }));
      
      // Reset state
      setSelectedContract(null);
      setSlotResults([null, null, null]);
      setShowWinBanner(false);
      
      alert(`Deploying ${selectedContract.name} contract to blockchain!`);
    } else {
      alert('Spin first to select a contract!');
    }
  };

  const connectWallet = () => {
    alert('Connecting wallet...');
  };

  const showLeaderboard = () => {
    alert('Leaderboard:\n1. 0xViolet... - 42 deploys\n2. 0xPurple... - 38 deploys\n3. 0xMagic... - 35 deploys');
  };

  const configure = () => {
    if (selectedContract) {
      alert(`Configuring ${selectedContract.name}...`);
    }
  };

  return (
    <div className="violet-app">
      <style jsx>{`
        .violet-app {
          min-height: 100vh;
          background: linear-gradient(135deg, #000000, #1a0a1a, #2d1b69, #663399);
          color: #E6E6E6;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          position: relative;
          overflow-x: hidden;
          padding: 20px;
        }

        .container {
          max-width: 1400px;
          margin: 0 auto;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .header-section {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-bottom: 40px;
          flex-wrap: wrap;
        }

        .violet-button {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
          border: none;
          border-radius: 25px;
          padding: 15px 30px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 1px;
          box-shadow: 0 8px 25px rgba(139, 92, 246, 0.3);
          position: relative;
          overflow: hidden;
        }

        .violet-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 35px rgba(139, 92, 246, 0.5);
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
        }

        .violet-button:active {
          transform: translateY(-1px);
        }

        .stats-sidebar {
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.8);
          border-radius: 16px;
          padding: 20px;
          border: 1px solid rgba(139, 92, 246, 0.3);
          backdrop-filter: blur(15px);
          min-width: 200px;
          z-index: 10;
        }

        .stats-title {
          color: #8b5cf6;
          font-size: 16px;
          margin-bottom: 15px;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 600;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 14px;
        }

        .stat-label {
          color: #a855f7;
        }

        .stat-value {
          color: #c084fc;
          font-weight: 600;
        }

        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          max-width: 1000px;
          margin: 0 auto;
          width: 100%;
        }

        .slot-machine-title {
          text-align: center;
          margin-bottom: 30px;
        }

        .main-title {
          font-size: 48px;
          font-weight: 800;
          background: linear-gradient(90deg, #8b5cf6, #a855f7, #c084fc, #d8b4fe);
          background-size: 300% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: violetFlow 4s linear infinite;
          margin-bottom: 10px;
        }

        .subtitle {
          font-size: 18px;
          color: #a855f7;
          opacity: 0.8;
        }

        .slot-machine {
          background: rgba(0, 0, 0, 0.8);
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 30px 60px rgba(139, 92, 246, 0.3);
          backdrop-filter: blur(15px);
          border: 2px solid rgba(139, 92, 246, 0.3);
          position: relative;
          overflow: hidden;
          width: 100%;
          max-width: 800px;
        }

        .slot-machine::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 24px;
          padding: 2px;
          background: linear-gradient(90deg, #8b5cf6, #a855f7, #c084fc, #8b5cf6);
          background-size: 400% 100%;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: violetBorder 6s linear infinite;
          z-index: -1;
        }

        .slots {
          display: flex;
          gap: 25px;
          justify-content: center;
          margin-bottom: 40px;
          flex-wrap: wrap;
        }

        .slot {
          width: 200px;
          height: 240px;
          background: linear-gradient(135deg, #1a0a1a, #0a0a0a);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          border: 3px solid rgba(139, 92, 246, 0.3);
          position: relative;
          overflow: hidden;
          transition: all 0.5s ease;
        }

        .slot.spinning {
          animation: slotSpin 0.1s linear infinite;
          box-shadow: 0 0 30px rgba(139, 92, 246, 0.8);
          border-color: #8b5cf6;
        }

        .slot.rarity-mythic {
          border-color: #dc2626;
          box-shadow: 0 0 40px rgba(220, 38, 38, 0.8);
        }

        .slot.rarity-legendary {
          border-color: #f59e0b;
          box-shadow: 0 0 35px rgba(245, 158, 11, 0.6);
        }

        .slot.rarity-epic {
          border-color: #8b5cf6;
          box-shadow: 0 0 30px rgba(139, 92, 246, 0.5);
        }

        .slot.rarity-rare {
          border-color: #6366f1;
          box-shadow: 0 0 25px rgba(99, 102, 241, 0.5);
        }

        .contract-icon {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          transition: all 0.5s ease;
          text-align: center;
          color: #8b5cf6;
        }

        .contract-icon.winner {
          animation: contractWin 1s ease-out;
        }

        .contract-name {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 5px;
          color: #c084fc;
        }

        .rarity-indicator {
          font-size: 10px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .rarity-indicator.rarity-mythic {
          background: rgba(220, 38, 38, 0.2);
          color: #dc2626;
          border: 1px solid #dc2626;
          text-shadow: 0 0 10px rgba(220, 38, 38, 1);
        }

        .rarity-indicator.rarity-legendary {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
          border: 1px solid #f59e0b;
          text-shadow: 0 0 10px rgba(245, 158, 11, 1);
        }

        .rarity-indicator.rarity-epic {
          background: rgba(139, 92, 246, 0.2);
          color: #8b5cf6;
          border: 1px solid #8b5cf6;
        }

        .rarity-indicator.rarity-rare {
          background: rgba(99, 102, 241, 0.2);
          color: #6366f1;
          border: 1px solid #6366f1;
        }

        .rarity-indicator.rarity-common {
          background: rgba(156, 163, 175, 0.2);
          color: #9ca3af;
          border: 1px solid #9ca3af;
        }

        .empty-slot {
          font-size: 48px;
          color: #6b7280;
          font-weight: bold;
          animation: emptyPulse 2s infinite;
        }

        .win-banner {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.95);
          padding: 25px 50px;
          border-radius: 20px;
          font-size: 28px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 20px;
          animation: winBannerShow 1s ease-out;
          z-index: 10;
          text-transform: uppercase;
          letter-spacing: 2px;
          border: 3px solid #8b5cf6;
          color: #8b5cf6;
          box-shadow: 0 0 40px rgba(139, 92, 246, 0.8);
        }

        .win-banner.rarity-mythic {
          background: linear-gradient(135deg, rgba(220, 38, 38, 0.3), rgba(220, 38, 38, 0.1));
          border: 3px solid #dc2626;
          color: #dc2626;
          box-shadow: 0 0 50px rgba(220, 38, 38, 0.8);
        }

        .win-banner.rarity-legendary {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(245, 158, 11, 0.1));
          border: 3px solid #f59e0b;
          color: #f59e0b;
          box-shadow: 0 0 40px rgba(245, 158, 11, 0.8);
        }

        .spin-button {
          width: 100%;
          background: linear-gradient(135deg, #8b5cf6, #7c3aed, #6d28d9);
          color: white;
          border: none;
          border-radius: 20px;
          padding: 25px;
          font-size: 22px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 25px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(139, 92, 246, 0.4);
        }

        .spin-button:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 15px 40px rgba(139, 92, 246, 0.6);
          background: linear-gradient(135deg, #7c3aed, #6d28d9, #5b21b6);
        }

        .spin-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spin-button.spinning {
          background: linear-gradient(135deg, #4b5563, #6b7280);
        }

        .spinner {
          width: 24px;
          height: 24px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s linear infinite;
        }

        .continue-button {
          width: 100%;
          background: rgba(30, 35, 45, 0.9);
          color: #8b5cf6;
          border: 3px solid #8b5cf6;
          border-radius: 20px;
          padding: 20px;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .continue-button:hover {
          background: rgba(139, 92, 246, 0.1);
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3);
        }

        @keyframes violetFlow {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }

        @keyframes violetBorder {
          0% { background-position: 0% 50%; }
          100% { background-position: 400% 50%; }
        }

        @keyframes slotSpin {
          0% { transform: translateY(0) rotateX(0deg); }
          25% { transform: translateY(-10px) rotateX(90deg); }
          50% { transform: translateY(-20px) rotateX(180deg); }
          75% { transform: translateY(-10px) rotateX(270deg); }
          100% { transform: translateY(0) rotateX(360deg); }
        }

        @keyframes contractWin {
          0% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.2) rotate(5deg); }
          50% { transform: scale(1.1) rotate(-3deg); }
          75% { transform: scale(1.15) rotate(2deg); }
          100% { transform: scale(1) rotate(0deg); }
        }

        @keyframes emptyPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }

        @keyframes winBannerShow {
          0% { transform: translate(-50%, -50%) scale(0.3) rotate(-10deg); opacity: 0; }
          50% { transform: translate(-50%, -50%) scale(1.1) rotate(2deg); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 1; }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .header-section {
            flex-direction: column;
            align-items: center;
          }

          .violet-button {
            padding: 12px 25px;
            font-size: 14px;
          }

          .main-title {
            font-size: 36px;
          }

          .slots {
            flex-direction: column;
            align-items: center;
          }

          .slot {
            width: 180px;
            height: 220px;
          }

          .stats-sidebar {
            position: relative;
            top: auto;
            right: auto;
            margin-bottom: 20px;
            width: 100%;
            max-width: 300px;
          }
        }

        @media (max-width: 480px) {
          .violet-app {
            padding: 15px;
          }

          .slot-machine {
            padding: 25px;
          }

          .slot {
            width: 160px;
            height: 200px;
          }

          .main-title {
            font-size: 28px;
          }
        }
      `}</style>

      <div className="container">
        {/* Header with buttons */}
        <div className="header-section">
          <button className="violet-button" onClick={connectWallet}>
            Connect Wallet
          </button>
          <button className="violet-button" onClick={deployContract}>
            Deploy Contract
          </button>
          <button className="violet-button" onClick={showLeaderboard}>
            Leaderboard
          </button>
        </div>

        {/* Stats sidebar */}
        <div className="stats-sidebar">
          <div className="stats-title">Game Stats</div>
          <div className="stat-item">
            <span className="stat-label">Spins:</span>
            <span className="stat-value">{gameStats.spins}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Streak:</span>
            <span className="stat-value">{gameStats.streak}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Deployed:</span>
            <span className="stat-value">{gameStats.deployed}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Combo:</span>
            <span className="stat-value">{gameStats.combo.toFixed(1)}x</span>
          </div>
        </div>

        {/* Main slot machine */}
        <div className="main-content">
          <div className="slot-machine-title">
            <h1 className="main-title">VIOLET CONTRACT DEPLOYER</h1>
            <p className="subtitle">Spin to deploy your legendary smart contracts</p>
          </div>

          <div className="slot-machine">
            <div className="slots">
              {slotResults.map((result, index) => (
                <div 
                  key={index}
                  className={`slot ${isSpinning ? 'spinning' : ''} ${result ? `rarity-${result.rarity}` : ''}`}
                >
                  {result ? (
                    <div className={`contract-icon ${showWinBanner ? 'winner' : ''}`}>
                      <div className="contract-name">{result.name}</div>
                      <div className={`rarity-indicator rarity-${result.rarity}`}>
                        {result.rarity.toUpperCase()}
                      </div>
                    </div>
                  ) : (
                    <div className="empty-slot">SLOT</div>
                  )}
                </div>
              ))}
            </div>

            {showWinBanner && selectedContract && (
              <div className={`win-banner rarity-${selectedContract.rarity}`}>
                {selectedContract.rarity.toUpperCase()} CONTRACT!
              </div>
            )}

            <button 
              className={`spin-button ${isSpinning ? 'spinning' : ''}`}
              onClick={spin}
              disabled={isSpinning}
            >
              {isSpinning ? (
                <>
                  <div className="spinner"></div>
                  SPINNING...
                </>
              ) : (
                'SPIN TO DEPLOY'
              )}
            </button>

            {selectedContract && !isSpinning && (
              <button className="continue-button" onClick={configure}>
                Configure Contract
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VioletSlotMachine;