// SPDX-License-Identifier: MIT
pragma solidity ^0.6.8;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Market {
    IERC20 public xToken;
    IERC20 public yToken;

    event Supply(uint256, uint256);

    constructor(IERC20 _xToken, IERC20 _yToken) public {
        xToken = _xToken;
        yToken = _yToken;
    }

    function supply(uint256 xAmount, uint256 yAmount) public {
        xToken.transferFrom(msg.sender, address(this), xAmount);
        yToken.transferFrom(msg.sender, address(this), yAmount);
        emit Supply(xAmount, yAmount);
    }

    function trade(uint256 xAmount) public {
        require(xAmount > 0, "amount is 0");
        uint256 amount = (xAmount * yToken.balanceOf(address(this))) /
            xToken.balanceOf(address(this));
        xToken.transferFrom(msg.sender, address(this), xAmount);
        yToken.transfer(msg.sender, amount);
    }
}
