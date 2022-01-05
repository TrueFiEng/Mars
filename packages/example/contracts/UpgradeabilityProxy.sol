// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

contract UpgradeabilityProxy {
    function upgradeTo(address _implementation) public virtual {
        address currentImplementation;
        bytes32 position = implementationPosition;
        assembly {
            currentImplementation := sload(position)
        }
        require(currentImplementation != _implementation);
        assembly {
            sstore(position, _implementation)
        }
    }

    bytes32 private constant implementationPosition = 0x6e41e0fbe643dfdb6043698bf865aada82dc46b953f754a3468eaa272a362dc7;

    function implementation() public view returns (address impl) {
        bytes32 position = implementationPosition;
        assembly {
            impl := sload(position)
        }
    }

    /**
     * @dev Fallback functions allowing to perform a delegatecall to the given implementation.
     * This function will return whatever the implementation call returns
     */
    fallback() external payable {
        proxyCall();
    }

    receive() external payable {
        proxyCall();
    }

    function proxyCall() internal {
        bytes32 position = implementationPosition;

        assembly {
            let ptr := mload(0x40)
            calldatacopy(ptr, returndatasize(), calldatasize())
            let result := delegatecall(gas(), sload(position), ptr, calldatasize(), returndatasize(), returndatasize())
            returndatacopy(ptr, 0, returndatasize())

            switch result
                case 0 {
                    revert(ptr, returndatasize())
                }
                default {
                    return(ptr, returndatasize())
                }
        }
    }
}
