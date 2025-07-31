// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

abstract contract PumpJaineBase {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    address public deployer;
    uint256 public deployedAt;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event ContractDeployed(address indexed deployer, string scenario);
    event EmotionalDamage(address indexed victim, uint256 severity);
    
    error InsufficientBalance(uint256 requested, uint256 available);
    error InvalidInput(string field);
    error UnauthorizedAccess(address caller);
    
    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
        deployer = msg.sender;
        deployedAt = block.timestamp;
        totalSupply = 1_000_000 * 1e18;
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
        emit ContractDeployed(msg.sender, _name);
    }
    
    function transfer(address to, uint256 value) public virtual returns (bool) {
        if (balanceOf[msg.sender] < value) {
            revert InsufficientBalance(value, balanceOf[msg.sender]);
        }
        if (to == address(0)) revert InvalidInput("to");
        
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }
    
    function approve(address spender, uint256 value) public returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 value) public virtual returns (bool) {
        if (allowance[from][msg.sender] < value) revert InsufficientBalance(value, allowance[from][msg.sender]);
        if (balanceOf[from] < value) revert InsufficientBalance(value, balanceOf[from]);
        if (to == address(0)) revert InvalidInput("to");
        
        allowance[from][msg.sender] -= value;
        balanceOf[from] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
        return true;
    }
    
    function _burn(uint256 amount) internal {
        if (balanceOf[address(this)] < amount) return;
        balanceOf[address(this)] -= amount;
        totalSupply -= amount;
        emit Transfer(address(this), address(0), amount);
    }
    
    modifier onlyDeployer() {
        if (msg.sender != deployer) revert UnauthorizedAccess(msg.sender);
        _;
    }
}