// SPDX-License-Identifier: MIT
pragma solidity ^0.6.8;
pragma experimental ABIEncoderV2;

contract ComplexContract {
    struct T { uint x; uint y; }

    struct Str {
        uint a;
        uint b;
        T[] c;
    }

    uint public number;
    string public str;

    mapping(uint => string) public simpleMapping;
    mapping(uint => mapping(address => Str)) public complexMapping;

    uint[] public simpleArray;
    uint[3][] public twoDArray;

    constructor(uint, string memory) public {
        simpleArray.push(1);
        simpleArray.push(2);
        simpleArray.push(3);
        twoDArray.push([1, 2, 3]);
        twoDArray.push([10, 20, 30]);
    }

    function setter(string memory arg1, uint[] memory arg2) public {
        str = arg1;
        number = arg2[0];
    }

    function add(uint a) view public returns (uint) {
        return a + number;
    }

    function viewNoArgs() pure public returns (uint) {
        return 42;
    }

    function viewReturnsStruct() pure public returns (Str memory a) {
        a.a = 10;
        a.b = 20;
        T[] memory arr = new T[](1);
        arr[0].x = 15;
        arr[0].y = 16;
        a.c = arr;
    }

    function viewReturnsTuple() pure public returns (uint, string memory, bool) {
        return (1, "hello", false);
    }
}
