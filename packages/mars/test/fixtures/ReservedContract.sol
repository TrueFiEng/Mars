// SPDX-License-Identifier: MIT
pragma solidity ^0.6.8;

contract ReservedContract {
    uint[] private sampleArray;

    function foo(uint package, uint yield, uint void, uint with) public {
        sampleArray.push(package);
        sampleArray.push(yield);
        sampleArray.push(void);
        sampleArray.push(with);
    }
}
