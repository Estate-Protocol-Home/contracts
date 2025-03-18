// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Liquidity1155.sol";

contract LockingFactoryV1 is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    ERC721Upgradeable
{
    // State variables
    IERC20 public stToken;
    Liquidity1155 public liquidityToken;

    mapping(address => bool) public hasMintedERC721;

    // Events
    event DividendDistributed(address indexed recipient, uint256 amount, address indexed tokenAddress);
    event TokensLocked(address indexed user, uint256 amount, address indexed tokenAddress);
    event TokensRedeemed(address indexed user, uint256 amount);

    // Custom errors
    error InvalidAmount();
    error InsufficientBalance();
    error TransferFailed();
    error InvalidTokenAddress();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the contract with required parameters
     * @param _user The owner of this factory instance
     * @param _stTokenAddress The ERC20 token this factory will accept
     * @param _liquidity1155Address The ERC1155 token this factory will accept
     */
    function initialize(
        address _user,
        address _stTokenAddress,
        address _liquidity1155Address
    ) external initializer {
        __ReentrancyGuard_init();
        __Ownable_init(_user);
        __UUPSUpgradeable_init();
        __ERC721_init("EstateRental", "EPRNFT");

        if (_stTokenAddress == address(0) || _liquidity1155Address == address(0)) {
            revert InvalidTokenAddress();
        }
        stToken = IERC20(_stTokenAddress);
        liquidityToken = Liquidity1155(_liquidity1155Address);
    }

    /**
     * @dev Locks tokens and mints corresponding ERC721 and ERC1155 token(s)
     * @param amount The amount of tokens to lock
     */
    function lockTokens(uint256 amount) external nonReentrant {
        if (amount <= 0) {
            revert InvalidAmount();
        }
        
        uint256 balanceOfUser = stToken.balanceOf(msg.sender);
        if (balanceOfUser < amount) {
            revert("Not Enough balance");
        }

        // Transfer tokens first
        bool success = stToken.transferFrom(msg.sender, address(this), amount);
        if (!success) {
            revert TransferFailed();
        }
        
        uint256 tokenId = uint256(uint160(address(stToken)));
        
        // Mint ERC721 NFT if not already minted
        if (!hasMintedERC721[msg.sender]) {
            _safeMint(msg.sender, tokenId);
            hasMintedERC721[msg.sender] = true;
        }
        
        // Mint ERC1155 tokens
        liquidityToken.mint(msg.sender, tokenId, amount, "");
        
        emit TokensLocked(msg.sender, amount, address(stToken));
    }

    /**
    * @dev Distributes dividend payments to ERC721 token owners
    * @param erc20ContractAddress The address of the ERC20 token contract used for dividends
    * @param amount The amount of tokens to distribute
    * @param toAddress The recipient address (typically the ERC721 token owner)
    * @return success Boolean indicating whether the distribution was successful
    */
    function distributeDividend(
        address erc20ContractAddress,
        uint256 amount,
        address toAddress
    ) external onlyOwner nonReentrant returns (bool success) {
        if (amount <= 0) {
            revert InvalidAmount();
        }
        
        if (toAddress == address(0)) {
            revert("Invalid recipient address");
        }
        
        // Verify the recipient owns an ERC721 token
        if (balanceOf(toAddress) == 0) {
            revert("Recipient must own an ERC721 token");
        }
        
        // Create interface to the ERC20 token
        IERC20 dividendToken = IERC20(erc20ContractAddress);
        
        // Check if this contract has enough tokens to distribute
        uint256 contractBalance = dividendToken.balanceOf(address(this));
        if (contractBalance < amount) {
            revert InsufficientBalance();
        }
        
        // Transfer the dividend amount to the recipient
        success = dividendToken.transfer(toAddress, amount);
        if (!success) {
            revert TransferFailed();
        }
        
        // Emit an event for the dividend distribution
        emit DividendDistributed(toAddress, amount, erc20ContractAddress);
        
        return success;
    }

    /**
    * @dev Claims and distributes dividend payments to ERC721 token owners
    * @param erc20ContractAddress The address of the ERC20 token contract used for dividends
    * @param amount The amount of tokens to claim and distribute
    * @param toAddress The recipient address (typically the ERC721 token owner)
    * @return success Boolean indicating whether the distribution was successful
    */
    function claimAndDistributeDividend(
        address erc20ContractAddress,
        uint256 amount,
        address toAddress
    ) external onlyOwner nonReentrant returns (bool success) {
        if (amount <= 0) {
            revert InvalidAmount();
        }
        
        if (toAddress == address(0)) {
            revert("Invalid recipient address");
        }
        
        // Verify the recipient owns an ERC721 token
        if (balanceOf(toAddress) == 0) {
            revert("Recipient must own an ERC721 token");
        }
        
        // Create interface to the ERC20 token
        IERC20 dividendToken = IERC20(erc20ContractAddress);
        
        // First, claim the dividend from the ERC20 contract
        // This assumes the ERC20 contract has approved this contract to spend tokens
        bool claimSuccess = dividendToken.transferFrom(erc20ContractAddress, address(this), amount);
        if (!claimSuccess) {
            revert("Failed to claim dividend from token contract");
        }
        
        // Now distribute the claimed dividend to the recipient
        success = dividendToken.transfer(toAddress, amount);
        if (!success) {
            revert TransferFailed();
        }
        
        // Emit an event for the dividend distribution
        emit DividendDistributed(toAddress, amount, erc20ContractAddress);
        
        return success;
    }

    /**
     * @dev Redeems locked tokens by burning the corresponding ERC1155 tokens
     * @param amount The amount of tokens to redeem
     */
    function redeemEPTokens(uint256 amount) external nonReentrant {
        if (amount <= 0) {
            revert InvalidAmount();
        }

        uint256 tokenId = uint256(uint160(address(stToken)));
        
        // Transfer tokens to the user first
        bool success = stToken.transfer(msg.sender, amount);
        if (!success) {
            revert TransferFailed();
        }
        
        // Only burn ERC1155 tokens after successful transfer
        liquidityToken.burn(msg.sender, tokenId, amount);
        
        emit TokensRedeemed(msg.sender, amount);
    }

    /**
     * @dev Returns the user ERC1155 tokens
     * @param _user The user address
     */
    function getERC1155Balance(address _user) public view returns (uint256) {
        return liquidityToken.balanceOf(_user, uint256(uint160(address(stToken))));
    }

    /**
    * @dev Recovers ERC20 tokens accidentally sent to this contract
    * @param tokenAddress The address of the ERC20 token to recover
    * @param amount The amount of tokens to recover
    * @notice This function can only recover tokens different from the main stToken
    */
    function recoverERC20(address tokenAddress, uint256 amount) external nonReentrant {
        // Prevent recovering the main stToken through this function
        if (tokenAddress == address(stToken)) {
            revert("Cannot recover stToken - use redeemEPTokens instead");
        }
        
        if (amount <= 0) {
            revert InvalidAmount();
        }
        
        IERC20 token = IERC20(tokenAddress);
        
        // Check if the contract has enough balance
        uint256 contractBalance = token.balanceOf(address(this));
        if (contractBalance < amount) {
            revert InsufficientBalance();
        }
        
        // Transfer the tokens to the caller
        bool success = token.transfer(msg.sender, amount);
        if (!success) {
            revert TransferFailed();
        }
    }

    function getBalanceAndAllowanceST20() public view returns (uint256, uint256) {
        uint256 balanceOfUser = stToken.balanceOf(msg.sender);
        uint256 allowanceOfUser = stToken.allowance(msg.sender, address(this));
        return (balanceOfUser, allowanceOfUser);
    }

    /**
     * @dev Authorizes the upgrade to a new implementation
     * @param newImplementation The address of the new implementation
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}