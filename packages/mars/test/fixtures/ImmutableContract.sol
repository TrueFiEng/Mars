// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

contract ImmutableContract {
    address public immutable _self = address(this);
    uint value;

    constructor () {
        value = 4;
    }
}
