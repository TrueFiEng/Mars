// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

contract UpgradeableContract {
    uint256 public x;
    bool private initialized;

    function initialize(uint256 _x) public {
        require(!initialized, "Contract instance has already been initialized");
        initialized = true;
        x = _x;
    }

    function reInitializeOne() public {
        initialized = true;
        x = 1;
    }

    function resetTo(uint256 _x) public {
        initialized = false;
        x = _x;
    }
}
