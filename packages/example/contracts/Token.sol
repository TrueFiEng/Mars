// SPDX-License-Identifier: MIT
pragma solidity ^0.6.8;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
    uint public foo;

    constructor() public ERC20("Token", "Tkn") {}

    function initialize(uint _foo) public {
        foo = _foo * 2;
        _mint(msg.sender, 2000);
    }
}
