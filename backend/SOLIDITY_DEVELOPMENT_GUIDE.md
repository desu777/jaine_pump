# 🔥 PumpJaine Smart Contract Development Guide
## Production-Ready Solidity 0.8.30 + Prague EVM Standards

### 📋 Technical Environment
- **Solidity Version**: 0.8.30 (Prague EVM default)
- **OpenZeppelin**: 5.0+ with custom errors and namespaced storage
- **EVM Target**: Prague (post-Pectra upgrade)
- **Compilation**: Real-time via `/api/compiler/compile` endpoint
- **Network**: 0G-Galileo-Testnet (Chain ID: 16601)

---

## 🏗️ Architecture Patterns

### 1. **Modern Contract Structure**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
```

### 2. **Custom Errors (OZ 5.0+ Standard)**
```solidity
error InsufficientBalance(uint256 requested, uint256 available);
error UnauthorizedAccess(address caller);
error InvalidInput(string field);
```

### 3. **Namespaced Storage Pattern**
```solidity
library CounterStorage {
    struct Layout {
        uint256 value;
        mapping(address => uint256) userCounts;
    }
    
    bytes32 internal constant STORAGE_SLOT = keccak256("pumpjaine.storage.counter");
    
    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly { l.slot := slot }
    }
}
```

---

## ⚡ Prague EVM Optimizations

### 1. **Transient Storage (EIP-1153)**
Use for temporary data within transaction scope:
```solidity
assembly {
    tstore(key, value)  // Store temporarily
    let val := tload(key)  // Read transient value
}
```

### 2. **MCOPY Operations (EIP-5656)**
Automatic optimization for memory copying:
```solidity
// Compiler automatically optimizes with mcopy()
bytes memory result = abi.encode(data);
```

### 3. **Gas-Optimized Patterns**
```solidity
// Use unchecked for safe arithmetic
unchecked {
    counter += 1;  // Safe increment
}

// Pack structs efficiently
struct PackedData {
    uint128 amount;     // 16 bytes
    uint64 timestamp;   // 8 bytes  
    uint32 id;          // 4 bytes
    bool active;        // 1 byte -> total: 29 bytes (1 slot)
}
```

---

## 🛡️ Security Standards

### 1. **Input Validation**
```solidity
function processAmount(uint256 amount) external {
    if (amount == 0) revert InvalidInput("amount");
    if (amount > MAX_AMOUNT) revert ExceedsLimit(amount, MAX_AMOUNT);
    // Process...
}
```

### 2. **Access Control**
```solidity
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

modifier onlyOperator() {
    if (!hasRole(OPERATOR_ROLE, msg.sender)) {
        revert UnauthorizedAccess(msg.sender);
    }
    _;
}
```

### 3. **Reentrancy Protection**
```solidity
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

function criticalFunction() external nonReentrant {
    // Protected against reentrancy
}
```

---

## 📜 Contract Template Standards

### 1. **Base Contract Pattern**
```solidity
abstract contract PumpJaineBase is ERC20, Ownable, ReentrancyGuard {
    using CounterStorage for CounterStorage.Layout;
    
    uint256 public constant MAX_SUPPLY = 1_000_000 * 1e18;
    
    event ContractDeployed(address indexed deployer, string scenario);
    event EmotionalDamage(address indexed victim, uint256 severity);
    
    constructor(
        string memory name,
        string memory symbol,
        address initialOwner
    ) ERC20(name, symbol) Ownable(initialOwner) {
        _mint(initialOwner, MAX_SUPPLY);
        emit ContractDeployed(initialOwner, name);
    }
}
```

### 2. **Rarity-Specific Mechanics**
```solidity
enum RarityTier {
    COMMON,           // 60%
    COPE_HARDER,      // 25%  
    MAXIMUM_COPE,     // 10%
    ULTIMATE_REJECTION, // 4%
    ASCENDED_SIMP,    // 1%
    LEGENDARY_ULTRA   // 0.1%
}

mapping(RarityTier => uint256) public rarityMultipliers;
```

### 3. **State Management**
```solidity
library SimpStorage {
    struct Layout {
        uint256 rejectionLevel;
        uint256 lastInteraction;
        mapping(address => uint256) emotionalDamage;
        bool isGhosted;
        uint256 hopeTokens;
    }
}
```

---

## 🎯 PumpJaine-Specific Patterns

### 1. **Auto-Burn Mechanism**
```solidity
uint256 public constant BURN_RATE = 100; // 1% per hour
uint256 public lastBurnTime;

function autoBurn() internal {
    if (block.timestamp >= lastBurnTime + 1 hours) {
        uint256 burnAmount = totalSupply() * BURN_RATE / 10000;
        _burn(address(this), burnAmount);
        lastBurnTime = block.timestamp;
    }
}
```

### 2. **Emotional Damage Tracking**
```solidity
event EmotionalDamage(
    address indexed victim,
    string damageType,
    uint256 severity,
    uint256 timestamp
);

function inflictDamage(address victim, uint256 severity) internal {
    SimpStorage.layout().emotionalDamage[victim] += severity;
    emit EmotionalDamage(victim, "REJECTION", severity, block.timestamp);
}
```

### 3. **Oracle Integration Pattern**
```solidity
interface IEmotionalOracle {
    function getRejectionLevel(address simp) external view returns (uint256);
    function getLastSeen(address simp) external view returns (uint256);
}

IEmotionalOracle public oracle;

function updateRejectionStatus() external {
    uint256 currentLevel = oracle.getRejectionLevel(msg.sender);
    // Update contract state based on oracle data
}
```

---

## 📊 Testing & Deployment Standards

### 1. **Compilation Settings**
```json
{
  "solidity": "0.8.30",
  "settings": {
    "optimizer": {
      "enabled": true,
      "runs": 200
    },
    "evmVersion": "prague",
    "viaIR": true
  }
}
```

### 2. **Contract Size Limits**
- Maximum contract size: 24KB (EIP-170)
- Use proxy patterns for complex contracts
- Implement factory patterns for template deployment

### 3. **Gas Optimization Checklist**
- [ ] Use `unchecked` for safe arithmetic
- [ ] Pack structs to minimize storage slots
- [ ] Use `immutable` for constructor-set values
- [ ] Implement efficient loop patterns
- [ ] Minimize external calls
- [ ] Use events for off-chain data storage

---

## 🔧 Integration with Backend

### 1. **Compilation Endpoint**
```typescript
POST /api/compiler/compile
{
  "templateName": "JAINE_LEFT_ME_ON_READ",
  "parameters": {
    "deployerAddress": "0x...",
    "customMessage": "Why won't you reply?"
  }
}
```

### 2. **Template Structure**
```
contracts/
├── common/           # 60% probability
├── cope-harder/      # 25% probability  
├── maximum-cope/     # 10% probability
├── ultimate-rejection/ # 4% probability
├── ascended-simp/    # 1% probability
└── legendary-ultra/  # 0.1% probability
```

### 3. **Deployment Flow**
1. User selects template via weighted random
2. Backend compiles with user parameters
3. Contract deployed to 0G-Galileo-Testnet
4. Deployment recorded in database
5. User stats updated (level, rank, etc.)

---

## ⚠️ Critical Requirements

### 1. **Security First**
- Every function must validate inputs
- Use OpenZeppelin 5.0+ security patterns
- Implement proper access controls
- Add reentrancy protection where needed

### 2. **Gas Efficiency**
- Target <200k gas for deployment
- Optimize for Prague EVM features
- Use efficient data structures
- Minimize storage operations

### 3. **User Experience**
- Clear error messages with custom errors
- Meaningful event emissions
- Predictable behavior patterns
- Responsive to emotional triggers

### 4. **Production Ready**
- Comprehensive testing coverage
- Proper documentation
- Audit-ready code structure
- Monitored for vulnerabilities

---

*This guide ensures all PumpJaine contracts follow modern Solidity best practices while maintaining the emotional devastation required for maximum simp engagement.* 💔