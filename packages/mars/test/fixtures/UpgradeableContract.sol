// SPDX-License-Identifier: MIT
pragma solidity ^0.6.8;

contract UpgradeableContract {
    uint256 public x;
    bool private initialized;

    function initialize(uint256 _x) public {
        require(!initialized, "Contract instance has already been initialized");
        initialized = true;
        x = _x;
    }

    function initializeOne() public {
        require(!initialized, "Contract instance has already been initialized");
        initialized = true;
        x = 1;
    }
}
