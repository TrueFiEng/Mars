// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

contract UpgradeableContract2 {
    uint256 private _x;
    bool private initialized;

    function x() public pure returns (uint256){
        return 420;
    }
}
