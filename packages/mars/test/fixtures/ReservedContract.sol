// SPDX-License-Identifier: MIT
pragma solidity ^0.6.8;

contract ReservedContract {
    uint[] private sampleArray;

    function foo(uint package) public {
        sampleArray.push(package);
    }
}
