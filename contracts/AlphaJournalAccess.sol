// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AlphaJournalAccess
 * @notice Access control for Alpha Journal — subscription or token-hold gating
 * @dev Deployed on 0G Galileo Testnet
 *
 * Two paths to access:
 *   1. Subscribe: pay 0.1 0G token per month
 *   2. Hold: maintain >= 0.2 0G tokens in wallet (lifetime access while held)
 */
contract AlphaJournalAccess {
    address public owner;
    uint256 public subscriptionFee = 0.1 ether;       // 0.1 0G token
    uint256 public lifetimeThreshold = 0.2 ether;      // Hold 0.2 0G = free
    uint256 public subscriptionDuration = 30 days;

    mapping(address => uint256) public subscriptionExpiry;

    event Subscribed(address indexed user, uint256 expiry);
    event Withdrawn(address indexed owner, uint256 amount);
    event FeeUpdated(uint256 newFee);
    event ThresholdUpdated(uint256 newThreshold);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Subscribe for 30 days of access
     * @dev If user already has an active subscription, extends from current expiry
     */
    function subscribe() external payable {
        require(msg.value >= subscriptionFee, "Insufficient payment");

        uint256 currentExpiry = subscriptionExpiry[msg.sender];
        uint256 start = currentExpiry > block.timestamp ? currentExpiry : block.timestamp;
        subscriptionExpiry[msg.sender] = start + subscriptionDuration;

        // Refund excess payment
        if (msg.value > subscriptionFee) {
            payable(msg.sender).transfer(msg.value - subscriptionFee);
        }

        emit Subscribed(msg.sender, subscriptionExpiry[msg.sender]);
    }

    /**
     * @notice Check if a user has active access
     * @param user The address to check
     * @return True if user has lifetime access (balance >= threshold) or active subscription
     */
    function isActive(address user) external view returns (bool) {
        // Lifetime: hold >= 2 0G tokens
        if (user.balance >= lifetimeThreshold) return true;
        // Subscription: active expiry
        if (subscriptionExpiry[user] > block.timestamp) return true;
        return false;
    }

    /**
     * @notice Get subscription expiry timestamp for a user
     */
    function getExpiry(address user) external view returns (uint256) {
        return subscriptionExpiry[user];
    }

    /**
     * @notice Get detailed access info for a user
     * @return isActiveNow Whether user currently has access
     * @return expiry Subscription expiry timestamp (0 if never subscribed)
     * @return balance User's native token balance
     * @return isLifetime Whether user qualifies for lifetime access via balance
     */
    function getAccessInfo(address user) external view returns (
        bool isActiveNow,
        uint256 expiry,
        uint256 balance,
        bool isLifetime
    ) {
        balance = user.balance;
        isLifetime = balance >= lifetimeThreshold;
        expiry = subscriptionExpiry[user];
        isActiveNow = isLifetime || (expiry > block.timestamp);
    }

    // ── Admin functions ──

    function setSubscriptionFee(uint256 _fee) external onlyOwner {
        subscriptionFee = _fee;
        emit FeeUpdated(_fee);
    }

    function setLifetimeThreshold(uint256 _threshold) external onlyOwner {
        lifetimeThreshold = _threshold;
        emit ThresholdUpdated(_threshold);
    }

    function withdraw() external onlyOwner {
        uint256 bal = address(this).balance;
        require(bal > 0, "No balance");
        payable(owner).transfer(bal);
        emit Withdrawn(owner, bal);
    }

    receive() external payable {}
}
