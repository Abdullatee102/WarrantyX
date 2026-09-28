// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ─────────────────────────────────────────────────────────────────────────────
// WarrantyX — On-Chain Warranty Registry
// ─────────────────────────────────────────────────────────────────────────────
// A warranty registry where:
//   • Authorized issuers create warranties linked to specific products
//   • Warranties are owned by wallet addresses and follow the product
//   • Ownership can be transferred when a product is resold
//   • Owners can submit warranty claims
//   • Authorized reviewers can approve or reject claims
//   • All state transitions are enforced on-chain
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @title WarrantyX
 * @notice On-chain warranty registry — issue, transfer, verify, and claim
 * @dev    Uses checks-effects-interactions pattern throughout.
 *         No ETH is held by this contract.
 */
contract WarrantyX {
    // ─────────────────────────────────────────────────────────────────────────
    // Types
    // ─────────────────────────────────────────────────────────────────────────

    enum WarrantyStatus {
        Active,         // 0 — warranty is valid and active
        ClaimPending,   // 1 — a claim has been submitted and awaits review
        ClaimApproved,  // 2 — the most recent claim was approved
        ClaimRejected,  // 3 — the most recent claim was rejected (returns to Active)
        Expired,        // 4 — warranty expiry date has passed
        Cancelled       // 5 — warranty cancelled by issuer
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
        string  documentRef;    // IPFS CID or URL reference (off-chain storage)
        uint256 submittedAt;
        ClaimStatus status;
        address reviewer;
        uint256 reviewedAt;
    }

    enum ClaimStatus {
        Pending,    // 0
        Approved,   // 1
        Rejected    // 2
    }

    struct Warranty {
        uint256 warrantyId;
        string  productId;          // unique product identifier
        string  productName;        // human-readable product name
        bytes32 productMetaHash;    // keccak256 of product metadata (off-chain)
        string  productMetaRef;     // IPFS CID or URL for product metadata
        address issuer;
        address owner;
        uint256 issuedAt;
        uint256 expiresAt;
        WarrantyStatus status;
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

    // owner address → list of warranty IDs they currently hold
    mapping(address => uint256[]) private _ownerWarranties;
    // warranty ID → index in _ownerWarranties[owner]
    mapping(uint256 => uint256)   private _ownerWarrantyIndex;

    uint256 public totalWarranties;
    uint256 public totalTransfers;
    uint256 public totalClaims;
    uint256 public totalApprovedClaims;

    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────

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
        require(_warranties[warrantyId].issuer == msg.sender, "WarrantyX: not warranty issuer");
        _;
    }

    modifier warrantyActive(uint256 warrantyId) {
        Warranty storage w = _warranties[warrantyId];
        // Lazily update status to Expired if past expiry
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
        // The deployer is also an authorized issuer by default
        isAuthorizedIssuer[msg.sender] = true;
        emit IssuerAdded(msg.sender, msg.sender);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Admin — Issuer Management
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Add an authorized warranty issuer
     * @param issuer Address to authorize
     */
    function addIssuer(address issuer) external onlyOwner {
        require(issuer != address(0), "WarrantyX: zero address");
        require(!isAuthorizedIssuer[issuer], "WarrantyX: already issuer");
        isAuthorizedIssuer[issuer] = true;
        emit IssuerAdded(issuer, msg.sender);
    }

    /**
     * @notice Remove an authorized warranty issuer
     * @param issuer Address to deauthorize
     */
    function removeIssuer(address issuer) external onlyOwner {
        require(issuer != address(0), "WarrantyX: zero address");
        require(isAuthorizedIssuer[issuer], "WarrantyX: not issuer");
        isAuthorizedIssuer[issuer] = false;
        emit IssuerRemoved(issuer, msg.sender);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Warranty Creation
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Create a new on-chain warranty for a product
     * @param productId        Unique product identifier (e.g., serial number)
     * @param productName      Human-readable product name
     * @param productMetaHash  keccak256 hash of the product metadata document
     * @param productMetaRef   IPFS CID or URL where product metadata is stored
     * @param initialOwner     Address of the warranty owner (product buyer)
     * @param durationSeconds  Warranty duration in seconds from now
     */
    function createWarranty(
        string  calldata productId,
        string  calldata productName,
        bytes32          productMetaHash,
        string  calldata productMetaRef,
        address          initialOwner,
        uint256          durationSeconds
    ) external onlyIssuer returns (uint256 warrantyId) {
        // ── Checks ────────────────────────────────────────────────────────────
        require(initialOwner != address(0),         "WarrantyX: zero owner address");
        require(bytes(productId).length > 0,        "WarrantyX: empty product ID");
        require(bytes(productName).length > 0,      "WarrantyX: empty product name");
        require(durationSeconds > 0,                "WarrantyX: zero duration");
        require(durationSeconds <= 30 * 365 days,   "WarrantyX: duration too long");

        // ── Effects ───────────────────────────────────────────────────────────
        warrantyId = _nextWarrantyId++;

        uint256 issuedAt  = block.timestamp;
        uint256 expiresAt = issuedAt + durationSeconds;

        _warranties[warrantyId] = Warranty({
            warrantyId:          warrantyId,
            productId:           productId,
            productName:         productName,
            productMetaHash:     productMetaHash,
            productMetaRef:      productMetaRef,
            issuer:              msg.sender,
            owner:               initialOwner,
            issuedAt:            issuedAt,
            expiresAt:           expiresAt,
            status:              WarrantyStatus.Active,
            transferCount:       0,
            claimCount:          0,
            approvedClaimCount:  0,
            rejectedClaimCount:  0,
            lastClaimAt:         0
        });

        // Track ownership
        _ownerWarrantyIndex[warrantyId] = _ownerWarranties[initialOwner].length;
        _ownerWarranties[initialOwner].push(warrantyId);

        totalWarranties++;

        // ── Interactions / Events ─────────────────────────────────────────────
        emit WarrantyCreated(
            warrantyId,
            productId,
            msg.sender,
            initialOwner,
            issuedAt,
            expiresAt
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Warranty Transfer
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Transfer warranty ownership to a new owner (e.g. when product is resold)
     * @param warrantyId  The warranty to transfer
     * @param newOwner    The new owner address
     */
    function transferWarranty(uint256 warrantyId, address newOwner)
        external
        warrantyExists(warrantyId)
        onlyWarrantyOwner(warrantyId)
    {
        // ── Checks ────────────────────────────────────────────────────────────
        require(newOwner != address(0), "WarrantyX: zero new owner");
        require(newOwner != msg.sender, "WarrantyX: already owner");

        Warranty storage w = _warranties[warrantyId];

        // Cannot transfer expired warranty
        require(block.timestamp < w.expiresAt, "WarrantyX: warranty expired");

        // Cannot transfer while a claim is pending review
        require(w.status != WarrantyStatus.ClaimPending, "WarrantyX: claim pending");

        // Cannot transfer cancelled warranty
        require(w.status != WarrantyStatus.Cancelled, "WarrantyX: warranty cancelled");

        // ── Effects ───────────────────────────────────────────────────────────
        address previousOwner = w.owner;

        // Remove from previous owner's list (swap-and-pop)
        _removeFromOwnerList(previousOwner, warrantyId);

        // Add to new owner's list
        _ownerWarrantyIndex[warrantyId] = _ownerWarranties[newOwner].length;
        _ownerWarranties[newOwner].push(warrantyId);

        w.owner = newOwner;
        w.transferCount++;

        _transferHistory[warrantyId].push(TransferRecord({
            from:      previousOwner,
            to:        newOwner,
            timestamp: block.timestamp
        }));

        totalTransfers++;

        // ── Events ────────────────────────────────────────────────────────────
        emit WarrantyTransferred(warrantyId, previousOwner, newOwner, block.timestamp);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Claim Submission
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Submit a warranty claim (must be current owner, warranty must be active)
     * @param warrantyId   The warranty to claim against
     * @param description  Brief description of the defect / claim
     * @param metadataHash keccak256 hash of supporting documentation
     * @param documentRef  IPFS CID or URL for supporting documentation
     */
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
        // ── Checks ────────────────────────────────────────────────────────────
        require(bytes(description).length > 0, "WarrantyX: empty description");

        Warranty storage w = _warranties[warrantyId];

        // ── Effects ───────────────────────────────────────────────────────────
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

        // ── Events ────────────────────────────────────────────────────────────
        emit ClaimSubmitted(
            warrantyId,
            claimId,
            msg.sender,
            metadataHash,
            documentRef,
            block.timestamp
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Claim Review
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Approve or reject the pending claim on a warranty
     * @dev    Only the warranty's original issuer can review claims
     * @param warrantyId  Warranty with the pending claim
     * @param approve     true = approve, false = reject
     */
    function reviewClaim(uint256 warrantyId, bool approve)
        external
        warrantyExists(warrantyId)
        onlyWarrantyIssuer(warrantyId)
    {
        // ── Checks ────────────────────────────────────────────────────────────
        Warranty storage w = _warranties[warrantyId];
        require(w.status == WarrantyStatus.ClaimPending, "WarrantyX: no pending claim");

        Claim[] storage claims = _claims[warrantyId];
        require(claims.length > 0, "WarrantyX: no claims found");

        // The pending claim is always the last one
        Claim storage pendingClaim = claims[claims.length - 1];
        require(pendingClaim.status == ClaimStatus.Pending, "WarrantyX: claim already reviewed");

        // ── Effects ───────────────────────────────────────────────────────────
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

            // After rejection: if warranty hasn't expired, restore Active so
            // owner can submit another legitimate claim later
            if (block.timestamp < w.expiresAt) {
                w.status = WarrantyStatus.Active;
            } else {
                w.status = WarrantyStatus.Expired;
            }
        }

        // ── Events ────────────────────────────────────────────────────────────
        emit ClaimReviewed(
            warrantyId,
            claimId,
            msg.sender,
            pendingClaim.status,
            block.timestamp
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Warranty Cancellation
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Cancel a warranty (issuer only)
     * @param warrantyId The warranty to cancel
     */
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
    // View Functions — Warranty
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Get full warranty details
     */
    function getWarranty(uint256 warrantyId)
        external
        view
        warrantyExists(warrantyId)
        returns (Warranty memory w)
    {
        w = _warranties[warrantyId];
        // Report effective status — lazily mark as expired without writing
        if (block.timestamp >= w.expiresAt &&
            (w.status == WarrantyStatus.Active || w.status == WarrantyStatus.ClaimRejected))
        {
            w.status = WarrantyStatus.Expired;
        }
    }

    /**
     * @notice Check whether a warranty is currently active and valid
     */
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

    /**
     * @notice Get the current owner of a warranty
     */
    function getWarrantyOwner(uint256 warrantyId)
        external
        view
        warrantyExists(warrantyId)
        returns (address)
    {
        return _warranties[warrantyId].owner;
    }

    /**
     * @notice Get the total number of warranties issued
     */
    function getTotalWarranties() external view returns (uint256) {
        return _nextWarrantyId;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // View Functions — Transfer History
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Get the full transfer history for a warranty
     */
    function getTransferHistory(uint256 warrantyId)
        external
        view
        warrantyExists(warrantyId)
        returns (TransferRecord[] memory)
    {
        return _transferHistory[warrantyId];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // View Functions — Claims
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Get all claims for a warranty
     */
    function getClaims(uint256 warrantyId)
        external
        view
        warrantyExists(warrantyId)
        returns (Claim[] memory)
    {
        return _claims[warrantyId];
    }

    /**
     * @notice Get a specific claim by its index in the warranty's claim list
     */
    function getClaim(uint256 warrantyId, uint256 claimIndex)
        external
        view
        warrantyExists(warrantyId)
        returns (Claim memory)
    {
        require(claimIndex < _claims[warrantyId].length, "WarrantyX: claim index out of range");
        return _claims[warrantyId][claimIndex];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // View Functions — Owner
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Get all warranty IDs owned by an address
     */
    function getWarrantiesByOwner(address ownerAddr)
        external
        view
        returns (uint256[] memory)
    {
        return _ownerWarranties[ownerAddr];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // View Functions — Statistics
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Get platform-level statistics
     */
    function getStats()
        external
        view
        returns (
            uint256 warranties,
            uint256 transfers,
            uint256 claims,
            uint256 approvedClaims
        )
    {
        warranties    = totalWarranties;
        transfers     = totalTransfers;
        claims        = totalClaims;
        approvedClaims = totalApprovedClaims;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal Helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @dev Remove warrantyId from an owner's warranty list using swap-and-pop
     */
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
}

