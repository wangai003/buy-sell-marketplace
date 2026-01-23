// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title PaymentRouter
 * @notice Minimal router that forwards ERC20 payments to sellers and emits an on-chain reference to the order.
 *         - No funds are held in the contract (reduced risk surface)
 *         - Only allowlisted tokens can be paid
 *         - Events carry orderId, payer, seller, token, amount for exact backend matching
 */
contract PaymentRouter is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    event PaymentReceived(
        bytes32 indexed orderId,
        address indexed payer,
        address indexed seller,
        address token,
        uint256 amount
    );

    mapping(address => bool) public allowedTokens;

    constructor(address[] memory initialAllowedTokens) {
        for (uint256 i = 0; i < initialAllowedTokens.length; i++) {
            allowedTokens[initialAllowedTokens[i]] = true;
        }
    }

    function setAllowedToken(address token, bool allowed) external onlyOwner {
        require(token != address(0), "invalid token");
        allowedTokens[token] = allowed;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Pay for an order. Funds are forwarded directly to the seller.
     * @param orderId   Unique order identifier (bytes32). Backend should pad/truncate its order id accordingly.
     * @param seller    Recipient of funds.
     * @param token     ERC20 token address (must be allowlisted).
     * @param amount    Payment amount in smallest units (e.g., 6 decimals for USDC/USDT on Polygon).
     */
    function payOrder(
        bytes32 orderId,
        address seller,
        address token,
        uint256 amount
    ) external whenNotPaused nonReentrant {
        require(orderId != bytes32(0), "invalid orderId");
        require(seller != address(0), "invalid seller");
        require(allowedTokens[token], "token not allowed");
        require(amount > 0, "invalid amount");

        // pull from payer
        IERC20(token).safeTransferFrom(msg.sender, seller, amount);

        emit PaymentReceived(orderId, msg.sender, seller, token, amount);
    }
}

