pragma solidity 0.8.10;
// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// learn more: https://docs.openzeppelin.com/contracts/3.x/erc20

contract GameToken is ERC20 {
    constructor(
        string memory name,
        string memory symbol,
        uint256 _mintAmount
    ) ERC20(name, symbol) {
        // Mint tokens to msg.sender
        _mint(msg.sender, _mintAmount * 10**uint256(decimals()));
    }
}
