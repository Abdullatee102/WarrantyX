// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ─────────────────────────────────────────────────────────────────────────────
// WarrantyX — On-Chain Warranty Registry & Verification Platform
// ─────────────────────────────────────────────────────────────────────────────
// Lifecycle:
//   1. User registers warranty → Status: Pending
//   2. Authorized Issuer reviews → Status: Active (Approved) or Rejected
//   3. Approved Warranties belong to user wallet & are recoverable
//   4. Owner can transfer warranty when product is resold
//   5. Owner can submit defect claims against active warranties
//   6. Authorized Issuer reviews and approves/rejects claims
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @title WarrantyX
 * @notice On-chain warranty registration, issuer verification, recovery, transfer, and claim management.
 */
contract WarrantyX {
    // ─────────────────────────────────────────────────────────────────────────
    // Types
    // ─────────────────────────────────────────────────────────────────────────

    enum WarrantyStatus {
        Pending,        // 0 — Registered by user, awaiting issuer verification
        Active,         // 1 — Verified & approved by issuer; valid active warranty
        Rejected,       // 2 — Registration rejected by issuer
        ClaimPending,   // 3 — Defect claim submitted, awaiting review
        ClaimApproved,  // 4 — Defect claim approved
        ClaimRejected,  // 5 — Defect claim rejected
        Expired,        // 6 — Warranty duration expired
        Cancelled       // 7 — Cancelled by issuer
    }

    enum ClaimStatus {
        Pending,    // 0
        Approved,   // 1
        Rejected    // 2
    }

    struct TransferRecord {
        address from;
        address to;
        uint256 timestamp;
    }

    struct Claim {
        uint256 claimId;
        address claimant;
        string  description;
        bytes32 metadataHash;   // keccak256 of supporting document
        string  documentRef;    // IPFS CID or URL reference
        uint256 submittedAt;
        ClaimStatus status;
        address reviewer;
        uint256 reviewedAt;
    }

    struct Warranty {
        uint256 warrantyId;
        string  productId;          // unique product identifier / serial number
        string  productName;        // human-readable product name
        bytes32 productMetaHash;    // keccak256 of product metadata
        string  productMetaRef;     // IPFS CID or URL for metadata
        string  proofRef;           // IPFS CID or URL for receipt / proof of purchase
        address issuer;             // reviewing / approving issuer
        address owner;              // registrant / current owner wallet
        uint256 submittedAt;        // registration timestamp
        uint256 issuedAt;           // approval / activation timestamp
        uint256 expiresAt;          // expiration timestamp
        uint256 durationSeconds;    // warranty duration in seconds
        WarrantyStatus status;
        string  rejectionReason;    // reason if rejected
        uint256 transferCount;
        uint256 claimCount;
        uint256 approvedClaimCount;
        uint256 rejectedClaimCount;
        uint256 lastClaimAt;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────────

    address public owner;                                       // contract admin

    uint256 private _nextWarrantyId;
    uint256 private _nextClaimId;

    mapping(address => bool) public isAuthorizedIssuer;         // issuer registry

    mapping(uint256 => Warranty)         private _warranties;
    mapping(uint256 => TransferRecord[]) private _transferHistory;
    mapping(uint256 => Claim[])          private _claims;

    // owner address → active/approved warranty IDs (for recovery)
    mapping(address => uint256[]) private _ownerWarranties;
    mapping(uint256 => uint256)   private _ownerWarrantyIndex;

    // registrant address → all submitted registration IDs (Pending, Active, Rejected)
    mapping(address => uint256[]) private _userRegistrations;

    // Global list of pending registration IDs for issuers
    uint256[] private _pendingRegistrations;
    mapping(uint256 => uint256) private _pendingRegistrationIndex;

    uint256 public totalWarranties;
    uint256 public totalRegistrations;
    uint256 public totalApproved;
    uint256 public totalRejected;
    uint256 public totalTransfers;
    uint256 public totalClaims;
    uint256 public totalApprovedClaims;

    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────

    event WarrantyRegistered(
        uint256 indexed warrantyId,
        string  productId,
        address indexed registrant,
        uint256 submittedAt
    );

    event WarrantyApproved(
        uint256 indexed warrantyId,
        address indexed issuer,
        address indexed owner,
        uint256 issuedAt,
        uint256 expiresAt
    );

    event WarrantyRejected(
        uint256 indexed warrantyId,
        address indexed reviewer,
        string  reason,
        uint256 timestamp
    );

    event WarrantyCreated(
        uint256 indexed warrantyId,
        string  productId,
        address indexed issuer,
        address indexed owner,
        uint256 issuedAt,
        uint256 expiresAt
    );

    event WarrantyTransferred(
        uint256 indexed warrantyId,
        address indexed from,
        address indexed to,
        uint256 timestamp
    );

    event ClaimSubmitted(
        uint256 indexed warrantyId,
        uint256 indexed claimId,
        address indexed claimant,
        bytes32 metadataHash,
        string  documentRef,
        uint256 timestamp
    );

    event ClaimReviewed(
        uint256 indexed warrantyId,
        uint256 indexed claimId,
        address indexed reviewer,
        ClaimStatus decision,
        uint256 timestamp
    );

    event WarrantyCancelled(
        uint256 indexed warrantyId,
        address indexed cancelledBy,
        uint256 timestamp
    );

    event IssuerAdded(address indexed issuer, address indexed addedBy);
    event IssuerRemoved(address indexed issuer, address indexed removedBy);

    // ─────────────────────────────────────────────────────────────────────────
    // Modifiers
    // ─────────────────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "WarrantyX: not contract owner");
        _;
    }

    modifier onlyIssuer() {
        require(isAuthorizedIssuer[msg.sender], "WarrantyX: not authorized issuer");
        _;
    }

    modifier warrantyExists(uint256 warrantyId) {
        require(warrantyId < _nextWarrantyId, "WarrantyX: warranty does not exist");
        _;
    }

    modifier onlyWarrantyOwner(uint256 warrantyId) {
        require(_warranties[warrantyId].owner == msg.sender, "WarrantyX: not warranty owner");
        _;
    }

    modifier onlyWarrantyIssuer(uint256 warrantyId) {
        require(
            _warranties[warrantyId].issuer == msg.sender || isAuthorizedIssuer[msg.sender],
            "WarrantyX: not authorized issuer"
        );
        _;
    }

    modifier warrantyActive(uint256 warrantyId) {
        Warranty storage w = _warranties[warrantyId];
        if (block.timestamp >= w.expiresAt && w.status == WarrantyStatus.Active) {
            w.status = WarrantyStatus.Expired;
        }
        require(w.status == WarrantyStatus.Active, "WarrantyX: warranty not active");
        _;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
        isAuthorizedIssuer[msg.sender] = true;
        emit IssuerAdded(msg.sender, msg.sender);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Admin — Issuer Management
    // ─────────────────────────────────────────────────────────────────────────

    function addIssuer(address issuer) external onlyOwner {
        require(issuer != address(0), "WarrantyX: zero address");
        require(!isAuthorizedIssuer[issuer], "WarrantyX: already issuer");
        isAuthorizedIssuer[issuer] = true;
        emit IssuerAdded(issuer, msg.sender);
    }

    function removeIssuer(address issuer) external onlyOwner {
        require(issuer != address(0), "WarrantyX: zero address");
        require(isAuthorizedIssuer[issuer], "WarrantyX: not issuer");
        isAuthorizedIssuer[issuer] = false;
        emit IssuerRemoved(issuer, msg.sender);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // User — Register Warranty (Starts Pending Verification)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Submit a new product warranty registration (User Flow)
     * @dev Sets status to Pending. Assigned to msg.sender as owner.
     */
    function registerWarranty(
        string  calldata productId,
        string  calldata productName,
        bytes32          productMetaHash,
        string  calldata productMetaRef,
        string  calldata proofRef,
        uint256          durationSeconds
    ) external returns (uint256 warrantyId) {
        require(bytes(productId).length > 0,      "WarrantyX: empty product ID");
        require(bytes(productName).length > 0,    "WarrantyX: empty product name");
        require(durationSeconds > 0,              "WarrantyX: zero duration");
        require(durationSeconds <= 30 * 365 days, "WarrantyX: duration too long");

        warrantyId = _nextWarrantyId++;

        _warranties[warrantyId] = Warranty({
            warrantyId:          warrantyId,
            productId:           productId,
            productName:         productName,
            productMetaHash:     productMetaHash,
            productMetaRef:      productMetaRef,
            proofRef:            proofRef,
            issuer:              address(0),
            owner:               msg.sender,
            submittedAt:         block.timestamp,
            issuedAt:            0,
            expiresAt:           0,
            durationSeconds:     durationSeconds,
            status:              WarrantyStatus.Pending,
            rejectionReason:     "",
            transferCount:       0,
            claimCount:          0,
            approvedClaimCount:  0,
            rejectedClaimCount:  0,
            lastClaimAt:         0
        });

        // Add to user's submissions
        _userRegistrations[msg.sender].push(warrantyId);

        // Add to global pending queue for issuers
        _pendingRegistrationIndex[warrantyId] = _pendingRegistrations.length;
        _pendingRegistrations.push(warrantyId);

        totalRegistrations++;

        emit WarrantyRegistered(warrantyId, productId, msg.sender, block.timestamp);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Issuer — Approve / Reject Warranty Registrations
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Approve a pending warranty registration
     * @param warrantyId Registration ID to approve
     */
    function approveWarranty(uint256 warrantyId)
        external
        onlyIssuer
        warrantyExists(warrantyId)
    {
        Warranty storage w = _warranties[warrantyId];
        require(w.status == WarrantyStatus.Pending, "WarrantyX: warranty not pending");

        uint256 issuedAt  = block.timestamp;
        uint256 expiresAt = issuedAt + w.durationSeconds;

        w.status    = WarrantyStatus.Active;
        w.issuer    = msg.sender;
        w.issuedAt  = issuedAt;
        w.expiresAt = expiresAt;

        // Remove from pending queue
        _removeFromPendingQueue(warrantyId);

        // Add to owner's active list for recovery
        _ownerWarrantyIndex[warrantyId] = _ownerWarranties[w.owner].length;
        _ownerWarranties[w.owner].push(warrantyId);

        totalApproved++;
        totalWarranties++;

        emit WarrantyApproved(warrantyId, msg.sender, w.owner, issuedAt, expiresAt);
    }

    /**
     * @notice Reject a pending warranty registration
     * @param warrantyId Registration ID to reject
     * @param reason     Explanation for rejection
     */
    function rejectWarranty(uint256 warrantyId, string calldata reason)
        external
        onlyIssuer
        warrantyExists(warrantyId)
    {
        Warranty storage w = _warranties[warrantyId];
        require(w.status == WarrantyStatus.Pending, "WarrantyX: warranty not pending");

        w.status          = WarrantyStatus.Rejected;
        w.issuer          = msg.sender;
        w.rejectionReason = reason;

        // Remove from pending queue
        _removeFromPendingQueue(warrantyId);

        totalRejected++;

        emit WarrantyRejected(warrantyId, msg.sender, reason, block.timestamp);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Issuer — Direct Warranty Creation (Backwards Compatible)
    // ─────────────────────────────────────────────────────────────────────────

    function createWarranty(
        string  calldata productId,
        string  calldata productName,
        bytes32          productMetaHash,
        string  calldata productMetaRef,
        address          initialOwner,
        uint256          durationSeconds
    ) external onlyIssuer returns (uint256 warrantyId) {
        require(initialOwner != address(0),       "WarrantyX: zero owner address");
        require(bytes(productId).length > 0,      "WarrantyX: empty product ID");
        require(bytes(productName).length > 0,    "WarrantyX: empty product name");
        require(durationSeconds > 0,              "WarrantyX: zero duration");
        require(durationSeconds <= 30 * 365 days, "WarrantyX: duration too long");

        warrantyId = _nextWarrantyId++;

        uint256 issuedAt  = block.timestamp;
        uint256 expiresAt = issuedAt + durationSeconds;

        _warranties[warrantyId] = Warranty({
            warrantyId:          warrantyId,
            productId:           productId,
            productName:         productName,
            productMetaHash:     productMetaHash,
            productMetaRef:      productMetaRef,
            proofRef:            "",
            issuer:              msg.sender,
            owner:               initialOwner,
            submittedAt:         issuedAt,
            issuedAt:            issuedAt,
            expiresAt:           expiresAt,
            durationSeconds:     durationSeconds,
            status:              WarrantyStatus.Active,
            rejectionReason:     "",
            transferCount:       0,
            claimCount:          0,
            approvedClaimCount:  0,
            rejectedClaimCount:  0,
            lastClaimAt:         0
        });

        _userRegistrations[initialOwner].push(warrantyId);

        _ownerWarrantyIndex[warrantyId] = _ownerWarranties[initialOwner].length;
        _ownerWarranties[initialOwner].push(warrantyId);

        totalApproved++;
        totalWarranties++;

        emit WarrantyCreated(warrantyId, productId, msg.sender, initialOwner, issuedAt, expiresAt);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Warranty Transfer
    // ─────────────────────────────────────────────────────────────────────────

    function transferWarranty(uint256 warrantyId, address newOwner)
        external
        warrantyExists(warrantyId)
        onlyWarrantyOwner(warrantyId)
    {
        require(newOwner != address(0), "WarrantyX: zero new owner");
        require(newOwner != msg.sender, "WarrantyX: already owner");

        Warranty storage w = _warranties[warrantyId];
        require(w.status == WarrantyStatus.Active || w.status == WarrantyStatus.ClaimApproved || w.status == WarrantyStatus.ClaimRejected, "WarrantyX: warranty not active");
        require(block.timestamp < w.expiresAt, "WarrantyX: warranty expired");
        require(w.status != WarrantyStatus.ClaimPending, "WarrantyX: claim pending");
        require(w.status != WarrantyStatus.Cancelled, "WarrantyX: warranty cancelled");

        address previousOwner = w.owner;

        _removeFromOwnerList(previousOwner, warrantyId);

        _ownerWarrantyIndex[warrantyId] = _ownerWarranties[newOwner].length;
        _ownerWarranties[newOwner].push(warrantyId);

        _userRegistrations[newOwner].push(warrantyId);

        w.owner = newOwner;
        w.transferCount++;

        _transferHistory[warrantyId].push(TransferRecord({
            from:      previousOwner,
            to:        newOwner,
            timestamp: block.timestamp
        }));

        totalTransfers++;

        emit WarrantyTransferred(warrantyId, previousOwner, newOwner, block.timestamp);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Claim Submission & Review
    // ─────────────────────────────────────────────────────────────────────────

    function submitClaim(
        uint256          warrantyId,
        string  calldata description,
        bytes32          metadataHash,
        string  calldata documentRef
    )
        external
        warrantyExists(warrantyId)
        onlyWarrantyOwner(warrantyId)
        warrantyActive(warrantyId)
        returns (uint256 claimId)
    {
        require(bytes(description).length > 0, "WarrantyX: empty description");

        Warranty storage w = _warranties[warrantyId];

        claimId = _nextClaimId++;

        _claims[warrantyId].push(Claim({
            claimId:      claimId,
            claimant:     msg.sender,
            description:  description,
            metadataHash: metadataHash,
            documentRef:  documentRef,
            submittedAt:  block.timestamp,
            status:       ClaimStatus.Pending,
            reviewer:     address(0),
            reviewedAt:   0
        }));

        w.status       = WarrantyStatus.ClaimPending;
        w.claimCount++;
        w.lastClaimAt  = block.timestamp;

        totalClaims++;

        emit ClaimSubmitted(warrantyId, claimId, msg.sender, metadataHash, documentRef, block.timestamp);
    }

    function reviewClaim(uint256 warrantyId, bool approve)
        external
        warrantyExists(warrantyId)
        onlyWarrantyIssuer(warrantyId)
    {
        Warranty storage w = _warranties[warrantyId];
        require(w.status == WarrantyStatus.ClaimPending, "WarrantyX: no pending claim");

        Claim[] storage claims = _claims[warrantyId];
        require(claims.length > 0, "WarrantyX: no claims found");

        Claim storage pendingClaim = claims[claims.length - 1];
        require(pendingClaim.status == ClaimStatus.Pending, "WarrantyX: claim already reviewed");

        pendingClaim.reviewer   = msg.sender;
        pendingClaim.reviewedAt = block.timestamp;

        uint256 claimId = pendingClaim.claimId;

        if (approve) {
            pendingClaim.status  = ClaimStatus.Approved;
            w.status             = WarrantyStatus.ClaimApproved;
            w.approvedClaimCount++;
            totalApprovedClaims++;
        } else {
            pendingClaim.status  = ClaimStatus.Rejected;
            w.status             = WarrantyStatus.ClaimRejected;
            w.rejectedClaimCount++;

            if (block.timestamp < w.expiresAt) {
                w.status = WarrantyStatus.Active;
            } else {
                w.status = WarrantyStatus.Expired;
            }
        }

        emit ClaimReviewed(warrantyId, claimId, msg.sender, pendingClaim.status, block.timestamp);
    }

    function cancelWarranty(uint256 warrantyId)
        external
        warrantyExists(warrantyId)
        onlyWarrantyIssuer(warrantyId)
    {
        Warranty storage w = _warranties[warrantyId];
        require(w.status != WarrantyStatus.Cancelled, "WarrantyX: already cancelled");
        require(w.status != WarrantyStatus.ClaimApproved, "WarrantyX: approved claim");

        w.status = WarrantyStatus.Cancelled;

        emit WarrantyCancelled(warrantyId, msg.sender, block.timestamp);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // View Functions
    // ─────────────────────────────────────────────────────────────────────────

    function getWarranty(uint256 warrantyId)
        external
        view
        warrantyExists(warrantyId)
        returns (Warranty memory w)
    {
        w = _warranties[warrantyId];
        if (block.timestamp >= w.expiresAt &&
            (w.status == WarrantyStatus.Active || w.status == WarrantyStatus.ClaimRejected))
        {
            w.status = WarrantyStatus.Expired;
        }
    }

    function isWarrantyValid(uint256 warrantyId)
        external
        view
        warrantyExists(warrantyId)
        returns (bool)
    {
        Warranty storage w = _warranties[warrantyId];
        return (
            w.status == WarrantyStatus.Active &&
            block.timestamp < w.expiresAt
        );
    }

    function getWarrantyOwner(uint256 warrantyId)
        external
        view
        warrantyExists(warrantyId)
        returns (address)
    {
        return _warranties[warrantyId].owner;
    }

    function getTotalWarranties() external view returns (uint256) {
        return _nextWarrantyId;
    }

    function getTransferHistory(uint256 warrantyId)
        external
        view
        warrantyExists(warrantyId)
        returns (TransferRecord[] memory)
    {
        return _transferHistory[warrantyId];
    }

    function getClaims(uint256 warrantyId)
        external
        view
        warrantyExists(warrantyId)
        returns (Claim[] memory)
    {
        return _claims[warrantyId];
    }

    function getClaim(uint256 warrantyId, uint256 claimIndex)
        external
        view
        warrantyExists(warrantyId)
        returns (Claim memory)
    {
        require(claimIndex < _claims[warrantyId].length, "WarrantyX: claim index out of range");
        return _claims[warrantyId][claimIndex];
    }

    /**
     * @notice Get active/approved warranty IDs owned by address (for Recovery)
     */
    function getWarrantiesByOwner(address ownerAddr)
        external
        view
        returns (uint256[] memory)
    {
        return _ownerWarranties[ownerAddr];
    }

    /**
     * @notice Get all submitted registration IDs for a user (Pending, Active, Rejected)
     */
    function getUserRegistrations(address user)
        external
        view
        returns (uint256[] memory)
    {
        return _userRegistrations[user];
    }

    /**
     * @notice Get all pending warranty registration IDs awaiting issuer verification
     */
    function getPendingRegistrations()
        external
        view
        returns (uint256[] memory)
    {
        return _pendingRegistrations;
    }

    function getStats()
        external
        view
        returns (
            uint256 warranties,
            uint256 registrations,
            uint256 approved,
            uint256 rejected,
            uint256 transfers,
            uint256 claims,
            uint256 approvedClaims
        )
    {
        warranties     = totalWarranties;
        registrations  = totalRegistrations;
        approved       = totalApproved;
        rejected       = totalRejected;
        transfers      = totalTransfers;
        claims         = totalClaims;
        approvedClaims = totalApprovedClaims;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal Helpers
    // ─────────────────────────────────────────────────────────────────────────

    function _removeFromOwnerList(address prevOwner, uint256 warrantyId) internal {
        uint256[] storage list  = _ownerWarranties[prevOwner];
        uint256 idx             = _ownerWarrantyIndex[warrantyId];
        uint256 lastIdx         = list.length - 1;

        if (idx != lastIdx) {
            uint256 lastWarrantyId     = list[lastIdx];
            list[idx]                  = lastWarrantyId;
            _ownerWarrantyIndex[lastWarrantyId] = idx;
        }

        list.pop();
        delete _ownerWarrantyIndex[warrantyId];
    }

    function _removeFromPendingQueue(uint256 warrantyId) internal {
        uint256 idx     = _pendingRegistrationIndex[warrantyId];
        uint256 lastIdx = _pendingRegistrations.length - 1;

        if (idx != lastIdx) {
            uint256 lastId = _pendingRegistrations[lastIdx];
            _pendingRegistrations[idx] = lastId;
            _pendingRegistrationIndex[lastId] = idx;
        }

        _pendingRegistrations.pop();
        delete _pendingRegistrationIndex[warrantyId];
    }
}
