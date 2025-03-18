// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Liquidity1155 is ERC1155, Ownable {
    // Minter and burner roles
    mapping(address => bool) public minters;
    mapping(address => bool) public burners;

    // Events
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    event BurnerAdded(address indexed burner);
    event BurnerRemoved(address indexed burner);

    constructor(string memory uri) ERC1155(uri) Ownable(msg.sender) {}

    // Modifiers
    modifier onlyMinter() {
        require(minters[msg.sender], "Caller is not a minter");
        _;
    }

    modifier onlyBurner() {
        require(burners[msg.sender], "Caller is not a burner");
        _;
    }

    // Mint function
    function mint(address to, uint256 id, uint256 amount, bytes memory data) external onlyMinter {
        _mint(to, id, amount, data);
    }

    // Burn function
    function burn(address from, uint256 id, uint256 amount) external onlyBurner {
        _burn(from, id, amount);
    }

    // Add minter
    function addMinter(address minter) external onlyOwner {
        minters[minter] = true;
        emit MinterAdded(minter);
    }

    // Remove minter
    function removeMinter(address minter) external onlyOwner {
        minters[minter] = false;
        emit MinterRemoved(minter);
    }

    // Add burner
    function addBurner(address burner) external onlyOwner {
        burners[burner] = true;
        emit BurnerAdded(burner);
    }

    // Remove burner
    function removeBurner(address burner) external onlyOwner {
        burners[burner] = false;
        emit BurnerRemoved(burner);
    }
}