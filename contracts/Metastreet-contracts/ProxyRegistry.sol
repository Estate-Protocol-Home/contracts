// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./Liquidity1155.sol";

/**
 * @title ILockingFactory
 * @dev Interface for the LockingFactory implementation
 */
interface ILockingFactory {
    function initialize(address user, address stTokenAddress, address liquidityTokenAddress) external;
    function upgradeToAndCall(address newImplementation, bytes memory data) external;
}

/**
 * @title ProxyRegistry
 * @notice Registry that manages proxy deployments and upgrades
 * @dev Uses the UUPS Proxy pattern for upgradeability
 */
contract ProxyRegistry is Ownable {
    address public currentImplementation;
    Liquidity1155 public immutable liquidity1155;

    // Storage mappings
    mapping(address => address) public userToFactory;
    mapping(address => address[]) public stTokenToUsers;
    mapping(bytes32 => address) public pairToFactory;

    // Array to track all factories for batch operations
    address[] public allFactories;
    
    // Events
    event FactoryDeployed(address indexed user, address indexed stToken, address factory);
    event ImplementationUpdated(address indexed oldImplementation, address indexed newImplementation);
    event FactoriesUpgraded(uint256 startIndex, uint256 endIndex);
    
    // Error codes - more gas efficient than require statements with strings
    error ZeroAddressNotAllowed();
    error ImplementationAlreadyInUse();
    error StartIndexOutOfBounds();
    error FactoryCannotBeZeroAddress();
    
    constructor(address initialImplementation) Ownable(msg.sender) {
        if (initialImplementation == address(0)) revert ZeroAddressNotAllowed();
        currentImplementation = initialImplementation;

        liquidity1155 = new Liquidity1155("https://ipfs.io/ipfs/bafkreigzrfa3qwnlisls2sdx65wje4mrajm2nzagayr22ilklppysyfhiy");
    }
    
    /**
     * @dev Creates a new factory contract for a user
     * @param _stTokenAddress The ERC20 token address to be used with this factory
     * @param _userAddress The User address to be used with this factory
     * @return The address of the newly created factory proxy
     */
    function createFactory(address _stTokenAddress, address _userAddress) external returns (address) {
        if (_stTokenAddress == address(0)) revert ZeroAddressNotAllowed();

        bytes32 pairKey = keccak256(abi.encodePacked(_userAddress, _stTokenAddress));

        // Check if factory already exists for this pair
        address existingFactory = pairToFactory[pairKey];
        if (existingFactory != address(0)) {
            return existingFactory;
        }
        
        // Deploy new factory
        address factory = _deployFactory(_userAddress, _stTokenAddress);

        // Assign factory as minter and burner in ERC1155 contract
        liquidity1155.addMinter(factory);
        liquidity1155.addBurner(factory);

        // Update state in storage
        pairToFactory[pairKey] = factory;
        userToFactory[_userAddress] = factory;
        stTokenToUsers[_stTokenAddress].push(_userAddress);
        allFactories.push(factory);
        
        emit FactoryDeployed(_userAddress, _stTokenAddress, factory);
        return factory;
    }
    
    /**
     * @dev Internal helper to deploy a new factory proxy
     */
    function _deployFactory(address user, address stTokenAddress) internal returns (address) {
        bytes memory initData = abi.encodeWithSelector(
            ILockingFactory.initialize.selector,
            user,
            stTokenAddress,
            address(liquidity1155)
        );
        
        return address(new ERC1967Proxy(
            currentImplementation,
            initData
        ));
    }
    
    /**
     * @dev Updates the implementation contract for future deployments
     * @param newImplementation The address of the new implementation
     */
    function updateImplementation(address newImplementation) external onlyOwner {
        if (newImplementation == address(0)) revert ZeroAddressNotAllowed();
        if (newImplementation == currentImplementation) revert ImplementationAlreadyInUse();
        
        address oldImplementation = currentImplementation;
        currentImplementation = newImplementation;
        emit ImplementationUpdated(oldImplementation, newImplementation);
    }
    
    /**
     * @dev Upgrades a specific factory to use the new implementation
     * @param factory The factory proxy address to upgrade
     */
    function upgradeFactory(address factory) external onlyOwner {
        if (factory == address(0)) revert FactoryCannotBeZeroAddress();
        
        ILockingFactory(factory).upgradeToAndCall(currentImplementation, "0x");
    }
    
    /**
     * @dev Returns all the deployed factories
     */
    function getFactories() external view returns (address[] memory) {
        return allFactories;
    }
    
    /**
     * @dev Upgrades factories in batches efficiently
     * @param batchSize The number of factories to upgrade in a single transaction
     * @param startIndex The index to start from in the allFactories array
     * @return lastIndex The last index processed, can be used for subsequent calls
     */
    function upgradeAllFactories(uint256 batchSize, uint256 startIndex) external onlyOwner returns (uint256) {
        uint256 totalFactories = allFactories.length;
        if (startIndex >= totalFactories) revert StartIndexOutOfBounds();
        
        // Calculate end index with unchecked math to save gas
        uint256 endIndex;
        unchecked {
            endIndex = (startIndex + batchSize < totalFactories) 
                ? startIndex + batchSize 
                : totalFactories;
        }
        
        address impl = currentImplementation; // Cache in memory to avoid multiple SLOAD operations
        
        // Loop through batch and upgrade each factory
        for (uint256 i = startIndex; i < endIndex;) {
            address factory = allFactories[i];
            if (factory != address(0)) {
                ILockingFactory(factory).upgradeToAndCall(impl, "0x");
            }
            // Use unchecked increment to save gas
            unchecked { ++i; }
        }
        
        emit FactoriesUpgraded(startIndex, endIndex);
        return endIndex;
    }
}