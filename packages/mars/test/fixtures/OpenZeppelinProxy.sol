// SPDX-License-Identifier: MIT
pragma solidity ^0.6.8;

import "@openzeppelin/contracts/proxy/UpgradeableProxy.sol";

contract OpenZeppelinProxy is UpgradeableProxy {
    constructor(address _logic, bytes memory _data) public payable UpgradeableProxy(_logic, _data) {}

    function upgradeTo(address implementation) external {
        _upgradeTo(implementation);
    }
}
