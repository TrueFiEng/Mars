// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

contract ReservedContract {
    uint[] private sampleArray;

    function foo(uint package, uint yield, uint void, uint with) public {
        sampleArray.push(package);
        sampleArray.push(yield);
        sampleArray.push(void);
        sampleArray.push(with);
    }
}
