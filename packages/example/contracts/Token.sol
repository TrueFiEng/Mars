// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
    bool private isInit;
    uint public val;

    constructor() ERC20("Token", "Tkn") {}

    function initialize(uint _val) public {
        isInit = true;
        val = _val;
        _mint(msg.sender, 1);
    }

    function isInitialized() public view returns (bool) {
        return isInit;
    }
}
