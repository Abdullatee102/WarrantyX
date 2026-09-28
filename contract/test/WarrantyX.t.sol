// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {WarrantyX} from "../src/WarrantyX.sol";

contract WarrantyXTest is Test {
    WarrantyX public wx;

    address public admin    = address(0xA1);
    address public issuer   = address(0xA2);
    address public buyer    = address(0xB1);
    address public buyer2   = address(0xB2);
    address public stranger = address(0xC1);

    // Sample warranty params
    string  constant PRODUCT_ID   = "SN-12345";
    string  constant PRODUCT_NAME = "Acme 4K TV 65\"";
    bytes32 constant META_HASH    = keccak256("product-metadata-v1");
    string  constant META_REF     = "ipfs://QmProductMetadata";
    uint256 constant DURATION_1Y  = 365 days;
    uint256 constant DURATION_1S  = 1; // 1 second — for expiry tests

    function setUp() public {
        vm.prank(admin);
        wx = new WarrantyX();
        // admin is already an issuer (constructor)
        // add a second issuer
        vm.prank(admin);
        wx.addIssuer(issuer);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Issuer Management
    // ─────────────────────────────────────────────────────────────────────────

    function test_AdminIsIssuerByDefault() public view {
        assertTrue(wx.isAuthorizedIssuer(admin));
    }

    function test_AddIssuer() public {
        address newIssuer = address(0xD1);
        vm.prank(admin);
        wx.addIssuer(newIssuer);
        assertTrue(wx.isAuthorizedIssuer(newIssuer));
    }

    function test_AddIssuer_EmitEvent() public {
        address newIssuer = address(0xD2);
        vm.expectEmit(true, true, false, false);
        emit WarrantyX.IssuerAdded(newIssuer, admin);
        vm.prank(admin);
        wx.addIssuer(newIssuer);
    }

    function test_AddIssuer_RevertIfNotOwner() public {
        vm.expectRevert("WarrantyX: not contract owner");
        vm.prank(stranger);
        wx.addIssuer(address(0xD3));
    }

    function test_AddIssuer_RevertZeroAddress() public {
        vm.expectRevert("WarrantyX: zero address");
        vm.prank(admin);
        wx.addIssuer(address(0));
    }

    function test_AddIssuer_RevertIfAlreadyIssuer() public {
        vm.expectRevert("WarrantyX: already issuer");
        vm.prank(admin);
        wx.addIssuer(issuer);
    }

    function test_RemoveIssuer() public {
        vm.prank(admin);
        wx.removeIssuer(issuer);
        assertFalse(wx.isAuthorizedIssuer(issuer));
    }

    function test_RemoveIssuer_EmitEvent() public {
        vm.expectEmit(true, true, false, false);
        emit WarrantyX.IssuerRemoved(issuer, admin);
        vm.prank(admin);
        wx.removeIssuer(issuer);
    }

    function test_RemoveIssuer_RevertIfNotOwner() public {
        vm.expectRevert("WarrantyX: not contract owner");
        vm.prank(stranger);
        wx.removeIssuer(issuer);
    }

    function test_RemoveIssuer_RevertIfNotIssuer() public {
        vm.expectRevert("WarrantyX: not issuer");
        vm.prank(admin);
        wx.removeIssuer(stranger);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Warranty Creation
    // ─────────────────────────────────────────────────────────────────────────

    function _createWarranty(address issuingAs, address owner_, uint256 duration)
        internal returns (uint256)
    {
        vm.prank(issuingAs);
        return wx.createWarranty(
            PRODUCT_ID,
            PRODUCT_NAME,
            META_HASH,
            META_REF,
            owner_,
            duration
        );
    }

    function test_CreateWarranty() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1Y);
        assertEq(id, 0);
        assertEq(wx.totalWarranties(), 1);
    }

    function test_CreateWarranty_EmitEvent() public {
        vm.expectEmit(true, false, true, false);
        emit WarrantyX.WarrantyCreated(0, PRODUCT_ID, issuer, buyer, 0, 0);
        _createWarranty(issuer, buyer, DURATION_1Y);
    }

    function test_CreateWarranty_OwnerIsCorrect() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1Y);
        assertEq(wx.getWarrantyOwner(id), buyer);
    }

    function test_CreateWarranty_DetailsCorrect() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1Y);
        WarrantyX.Warranty memory w = wx.getWarranty(id);
        assertEq(w.productId, PRODUCT_ID);
        assertEq(w.productName, PRODUCT_NAME);
        assertEq(w.productMetaHash, META_HASH);
        assertEq(w.issuer, issuer);
        assertEq(w.owner, buyer);
        assertEq(uint(w.status), uint(WarrantyX.WarrantyStatus.Active));
        assertTrue(w.expiresAt > block.timestamp);
    }

    function test_CreateWarranty_RevertIfNotIssuer() public {
        vm.expectRevert("WarrantyX: not authorized issuer");
        vm.prank(stranger);
        wx.createWarranty(PRODUCT_ID, PRODUCT_NAME, META_HASH, META_REF, buyer, DURATION_1Y);
    }

    function test_CreateWarranty_RevertZeroOwner() public {
        vm.expectRevert("WarrantyX: zero owner address");
        vm.prank(issuer);
        wx.createWarranty(PRODUCT_ID, PRODUCT_NAME, META_HASH, META_REF, address(0), DURATION_1Y);
    }

    function test_CreateWarranty_RevertEmptyProductId() public {
        vm.expectRevert("WarrantyX: empty product ID");
        vm.prank(issuer);
        wx.createWarranty("", PRODUCT_NAME, META_HASH, META_REF, buyer, DURATION_1Y);
    }

    function test_CreateWarranty_RevertEmptyProductName() public {
        vm.expectRevert("WarrantyX: empty product name");
        vm.prank(issuer);
        wx.createWarranty(PRODUCT_ID, "", META_HASH, META_REF, buyer, DURATION_1Y);
    }

    function test_CreateWarranty_RevertZeroDuration() public {
        vm.expectRevert("WarrantyX: zero duration");
        vm.prank(issuer);
        wx.createWarranty(PRODUCT_ID, PRODUCT_NAME, META_HASH, META_REF, buyer, 0);
    }

    function test_CreateWarranty_RevertDurationTooLong() public {
        vm.expectRevert("WarrantyX: duration too long");
        vm.prank(issuer);
        wx.createWarranty(PRODUCT_ID, PRODUCT_NAME, META_HASH, META_REF, buyer, 31 * 365 days);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Warranty Verification
    // ─────────────────────────────────────────────────────────────────────────

    function test_IsWarrantyValid_Active() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1Y);
        assertTrue(wx.isWarrantyValid(id));
    }

    function test_IsWarrantyValid_Expired() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1S);
        vm.warp(block.timestamp + 2);
        assertFalse(wx.isWarrantyValid(id));
    }

    function test_GetWarranty_RevertInvalidId() public {
        vm.expectRevert("WarrantyX: warranty does not exist");
        wx.getWarranty(9999);
    }

    function test_OwnerWarrantyList() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1Y);
        uint256[] memory ids = wx.getWarrantiesByOwner(buyer);
        assertEq(ids.length, 1);
        assertEq(ids[0], id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Warranty Transfer
    // ─────────────────────────────────────────────────────────────────────────

    function test_TransferWarranty() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1Y);
        vm.prank(buyer);
        wx.transferWarranty(id, buyer2);
        assertEq(wx.getWarrantyOwner(id), buyer2);
    }

    function test_TransferWarranty_EmitEvent() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1Y);
        vm.expectEmit(true, true, true, false);
        emit WarrantyX.WarrantyTransferred(id, buyer, buyer2, block.timestamp);
        vm.prank(buyer);
        wx.transferWarranty(id, buyer2);
    }

    function test_TransferWarranty_HistoryRecorded() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1Y);
        vm.prank(buyer);
        wx.transferWarranty(id, buyer2);

        WarrantyX.TransferRecord[] memory history = wx.getTransferHistory(id);
        assertEq(history.length, 1);
        assertEq(history[0].from, buyer);
        assertEq(history[0].to,   buyer2);
    }

    function test_TransferWarranty_CountIncrement() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1Y);
        vm.prank(buyer);
        wx.transferWarranty(id, buyer2);
        WarrantyX.Warranty memory w = wx.getWarranty(id);
        assertEq(w.transferCount, 1);
        assertEq(wx.totalTransfers(), 1);
    }

    function test_TransferWarranty_OwnerListUpdated() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1Y);
        vm.prank(buyer);
        wx.transferWarranty(id, buyer2);

        assertEq(wx.getWarrantiesByOwner(buyer).length,  0);
        assertEq(wx.getWarrantiesByOwner(buyer2).length, 1);
    }

    function test_TransferWarranty_RevertIfNotOwner() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1Y);
        vm.expectRevert("WarrantyX: not warranty owner");
        vm.prank(stranger);
        wx.transferWarranty(id, buyer2);
    }

    function test_TransferWarranty_RevertZeroNewOwner() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1Y);
        vm.expectRevert("WarrantyX: zero new owner");
        vm.prank(buyer);
        wx.transferWarranty(id, address(0));
    }

    function test_TransferWarranty_RevertSameOwner() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1Y);
        vm.expectRevert("WarrantyX: already owner");
        vm.prank(buyer);
        wx.transferWarranty(id, buyer);
    }

    function test_TransferWarranty_RevertExpired() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1S);
        vm.warp(block.timestamp + 2);
        vm.expectRevert("WarrantyX: warranty expired");
        vm.prank(buyer);
        wx.transferWarranty(id, buyer2);
    }

    function test_TransferWarranty_RevertClaimPending() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1Y);
        vm.prank(buyer);
        wx.submitClaim(id, "broken screen", META_HASH, META_REF);

        vm.expectRevert("WarrantyX: claim pending");
        vm.prank(buyer);
        wx.transferWarranty(id, buyer2);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Claim Submission
    // ─────────────────────────────────────────────────────────────────────────

    function _submitClaim(uint256 warrantyId, address claimant) internal returns (uint256) {
        vm.prank(claimant);
        return wx.submitClaim(warrantyId, "product defect", META_HASH, META_REF);
    }

    function test_SubmitClaim() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1Y);
        uint256 cid = _submitClaim(id, buyer);
        assertEq(cid, 0);
        assertEq(wx.totalClaims(), 1);
    }

    function test_SubmitClaim_StatusChangesToPending() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1Y);
        _submitClaim(id, buyer);
        WarrantyX.Warranty memory w = wx.getWarranty(id);
        assertEq(uint(w.status), uint(WarrantyX.WarrantyStatus.ClaimPending));
    }

    function test_SubmitClaim_EmitEvent() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1Y);
        vm.expectEmit(true, true, true, false);
        emit WarrantyX.ClaimSubmitted(id, 0, buyer, META_HASH, META_REF, block.timestamp);
        _submitClaim(id, buyer);
    }

    function test_SubmitClaim_RevertIfNotOwner() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1Y);
        vm.expectRevert("WarrantyX: not warranty owner");
        vm.prank(stranger);
        wx.submitClaim(id, "defect", META_HASH, META_REF);
    }

    function test_SubmitClaim_RevertIfExpired() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1S);
        vm.warp(block.timestamp + 2);
        vm.expectRevert("WarrantyX: warranty not active");
        vm.prank(buyer);
        wx.submitClaim(id, "defect", META_HASH, META_REF);
    }

    function test_SubmitClaim_RevertIfAlreadyPending() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1Y);
        _submitClaim(id, buyer);
        // Second claim should fail — status is ClaimPending, not Active
        vm.expectRevert("WarrantyX: warranty not active");
        vm.prank(buyer);
        wx.submitClaim(id, "another defect", META_HASH, META_REF);
    }

    function test_SubmitClaim_RevertEmptyDescription() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1Y);
        vm.expectRevert("WarrantyX: empty description");
        vm.prank(buyer);
        wx.submitClaim(id, "", META_HASH, META_REF);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Claim Review — Approve
    // ─────────────────────────────────────────────────────────────────────────

    function test_ApproveClaim() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1Y);
        _submitClaim(id, buyer);

        vm.prank(issuer);
        wx.reviewClaim(id, true);

        WarrantyX.Warranty memory w = wx.getWarranty(id);
        assertEq(uint(w.status), uint(WarrantyX.WarrantyStatus.ClaimApproved));
        assertEq(w.approvedClaimCount, 1);
    }

    function test_ApproveClaim_EmitEvent() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1Y);
        _submitClaim(id, buyer);

        vm.expectEmit(true, true, true, false);
        emit WarrantyX.ClaimReviewed(id, 0, issuer, WarrantyX.ClaimStatus.Approved, block.timestamp);
        vm.prank(issuer);
        wx.reviewClaim(id, true);
    }

    function test_ApproveClaim_TotalApprovedIncrement() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1Y);
        _submitClaim(id, buyer);
        vm.prank(issuer);
        wx.reviewClaim(id, true);
        assertEq(wx.totalApprovedClaims(), 1);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Claim Review — Reject
    // ─────────────────────────────────────────────────────────────────────────

    function test_RejectClaim_WarrantyReturnsActive() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1Y);
        _submitClaim(id, buyer);
        vm.prank(issuer);
        wx.reviewClaim(id, false);

        // Warranty should return to Active so another claim can be filed
        WarrantyX.Warranty memory w = wx.getWarranty(id);
        assertEq(uint(w.status), uint(WarrantyX.WarrantyStatus.Active));
        assertEq(w.rejectedClaimCount, 1);
    }

    function test_RejectClaim_CanSubmitAgain() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1Y);
        _submitClaim(id, buyer);
        vm.prank(issuer);
        wx.reviewClaim(id, false);

        // Should be able to submit another claim
        vm.prank(buyer);
        wx.submitClaim(id, "second attempt", META_HASH, META_REF);
        assertEq(wx.totalClaims(), 2);
    }

    function test_RejectClaim_IfExpired_StatusExpired() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1S);
        _submitClaim(id, buyer);
        // Warp past expiry
        vm.warp(block.timestamp + 2);
        vm.prank(issuer);
        wx.reviewClaim(id, false);

        WarrantyX.Warranty memory w = wx.getWarranty(id);
        assertEq(uint(w.status), uint(WarrantyX.WarrantyStatus.Expired));
    }

    function test_ReviewClaim_RevertIfNotIssuer() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1Y);
        _submitClaim(id, buyer);
        vm.expectRevert("WarrantyX: not warranty issuer");
        vm.prank(stranger);
        wx.reviewClaim(id, true);
    }

    function test_ReviewClaim_RevertIfNoPendingClaim() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1Y);
        vm.expectRevert("WarrantyX: no pending claim");
        vm.prank(issuer);
        wx.reviewClaim(id, true);
    }

    function test_ReviewClaim_RevertDuplicateReview() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1Y);
        _submitClaim(id, buyer);
        vm.prank(issuer);
        wx.reviewClaim(id, false); // returns to Active

        // Now status is Active — cannot review again without a pending claim
        vm.expectRevert("WarrantyX: no pending claim");
        vm.prank(issuer);
        wx.reviewClaim(id, true);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Expiry Behaviour
    // ─────────────────────────────────────────────────────────────────────────

    function test_ExpiredWarranty_StatusReportedCorrectly() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1S);
        vm.warp(block.timestamp + 2);
        WarrantyX.Warranty memory w = wx.getWarranty(id);
        assertEq(uint(w.status), uint(WarrantyX.WarrantyStatus.Expired));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Warranty Cancellation
    // ─────────────────────────────────────────────────────────────────────────

    function test_CancelWarranty() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1Y);
        vm.prank(issuer);
        wx.cancelWarranty(id);
        WarrantyX.Warranty memory w = wx.getWarranty(id);
        assertEq(uint(w.status), uint(WarrantyX.WarrantyStatus.Cancelled));
    }

    function test_CancelWarranty_EmitEvent() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1Y);
        vm.expectEmit(true, true, false, false);
        emit WarrantyX.WarrantyCancelled(id, issuer, block.timestamp);
        vm.prank(issuer);
        wx.cancelWarranty(id);
    }

    function test_CancelWarranty_RevertIfNotIssuer() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1Y);
        vm.expectRevert("WarrantyX: not warranty issuer");
        vm.prank(stranger);
        wx.cancelWarranty(id);
    }

    function test_CancelWarranty_RevertAlreadyCancelled() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1Y);
        vm.prank(issuer);
        wx.cancelWarranty(id);
        vm.expectRevert("WarrantyX: already cancelled");
        vm.prank(issuer);
        wx.cancelWarranty(id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Claim History
    // ─────────────────────────────────────────────────────────────────────────

    function test_GetClaims_MultipleClaims() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1Y);

        _submitClaim(id, buyer);
        vm.prank(issuer);
        wx.reviewClaim(id, false); // reject → back to Active

        _submitClaim(id, buyer);
        vm.prank(issuer);
        wx.reviewClaim(id, true); // approve

        WarrantyX.Claim[] memory claims = wx.getClaims(id);
        assertEq(claims.length, 2);
        assertEq(uint(claims[0].status), uint(WarrantyX.ClaimStatus.Rejected));
        assertEq(uint(claims[1].status), uint(WarrantyX.ClaimStatus.Approved));
    }

    function test_GetClaimByIndex() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1Y);
        _submitClaim(id, buyer);
        WarrantyX.Claim memory c = wx.getClaim(id, 0);
        assertEq(c.claimant, buyer);
        assertEq(c.description, "product defect");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Transfer History
    // ─────────────────────────────────────────────────────────────────────────

    function test_TransferHistory_MultipleTransfers() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1Y);
        address buyer3 = address(0xB3);

        vm.prank(buyer);
        wx.transferWarranty(id, buyer2);
        vm.prank(buyer2);
        wx.transferWarranty(id, buyer3);

        WarrantyX.TransferRecord[] memory history = wx.getTransferHistory(id);
        assertEq(history.length, 2);
        assertEq(history[0].from, buyer);
        assertEq(history[0].to,   buyer2);
        assertEq(history[1].from, buyer2);
        assertEq(history[1].to,   buyer3);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Statistics
    // ─────────────────────────────────────────────────────────────────────────

    function test_Stats() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1Y);
        vm.prank(buyer);
        wx.transferWarranty(id, buyer2);
        vm.prank(buyer2);
        wx.submitClaim(id, "broken", META_HASH, META_REF);
        vm.prank(issuer);
        wx.reviewClaim(id, true);

        (uint256 warranties, uint256 transfers, uint256 claims, uint256 approvedClaims) = wx.getStats();
        assertEq(warranties,    1);
        assertEq(transfers,     1);
        assertEq(claims,        1);
        assertEq(approvedClaims, 1);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge Cases
    // ─────────────────────────────────────────────────────────────────────────

    function test_MultipleWarranties_OwnerList() public {
        uint256 id0 = _createWarranty(issuer, buyer, DURATION_1Y);
        uint256 id1 = _createWarranty(issuer, buyer, DURATION_1Y);
        uint256[] memory owned = wx.getWarrantiesByOwner(buyer);
        assertEq(owned.length, 2);
        assertEq(owned[0], id0);
        assertEq(owned[1], id1);
    }

    function test_Transfer_OwnerListSwapAndPop() public {
        uint256 id0 = _createWarranty(issuer, buyer, DURATION_1Y);
        uint256 id1 = _createWarranty(issuer, buyer, DURATION_1Y);
        uint256 id2 = _createWarranty(issuer, buyer, DURATION_1Y);

        // Transfer id0 away — should use swap-and-pop correctly
        vm.prank(buyer);
        wx.transferWarranty(id0, buyer2);

        uint256[] memory owned = wx.getWarrantiesByOwner(buyer);
        assertEq(owned.length, 2);
        // id2 should have swapped into position 0
        assertEq(owned[0], id2);
        assertEq(owned[1], id1);
    }

    function test_GetTransferHistory_Empty() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1Y);
        WarrantyX.TransferRecord[] memory history = wx.getTransferHistory(id);
        assertEq(history.length, 0);
    }

    function test_GetClaims_Empty() public {
        uint256 id = _createWarranty(issuer, buyer, DURATION_1Y);
        WarrantyX.Claim[] memory claims = wx.getClaims(id);
        assertEq(claims.length, 0);
    }
}

