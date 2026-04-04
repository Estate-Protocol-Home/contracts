pragma solidity 0.5.8;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";

/**
 * @title Mock USD Token (for testing USD-denominated STOs)
 */
contract MockUSDToken is ERC20, ERC20Detailed {

    constructor() public ERC20Detailed("Mock USD Coin", "USDC", 6) {
        // Mint initial supply to deployer
        _mint(msg.sender, 1000000 * (10 ** 6)); // 1M USDC (6 decimals)
    }

    /**
     * @notice Faucet function - anyone can get tokens for testing
     * @param _amount Amount of tokens to mint
     * @param _recipient Recipient address
     */
    function getTokens(uint256 _amount, address _recipient) external {
        _mint(_recipient, _amount);
    }
}
