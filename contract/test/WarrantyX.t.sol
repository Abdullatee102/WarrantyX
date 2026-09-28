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
    string  constant PROOF_REF    = "ipfs://QmReceiptProof";
    uint256 constant DURATION_1Y  = 365 days;
    uint256 constant DURATION_1S  = 1;

    function setUp() public {
        vm.prank(admin);
        wx = new WarrantyX();
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

    // ─────────────────────────────────────────────────────────────────────────
    // User Registration Flow (Pending -> Active / Rejected)
    // ─────────────────────────────────────────────────────────────────────────

    function test_RegisterWarranty() public {
        vm.prank(buyer);
        uint256 id = wx.registerWarranty(PRODUCT_ID, PRODUCT_NAME, META_HASH, META_REF, PROOF_REF, DURATION_1Y);

        assertEq(id, 0);

        WarrantyX.Warranty memory w = wx.getWarranty(id);
        assertEq(w.productId, PRODUCT_ID);
        assertEq(w.productName, PRODUCT_NAME);
        assertEq(w.owner, buyer);
        assertEq(uint8(w.status), uint8(WarrantyX.WarrantyStatus.Pending));

        uint256[] memory pending = wx.getPendingRegistrations();
        assertEq(pending.length, 1);
        assertEq(pending[0], id);

        uint256[] memory userRegs = wx.getUserRegistrations(buyer);
        assertEq(userRegs.length, 1);
        assertEq(userRegs[0], id);
    }

    function test_RegisterWarranty_EmitEvent() public {
        vm.expectEmit(true, false, true, false);
        emit WarrantyX.WarrantyRegistered(0, PRODUCT_ID, buyer, block.timestamp);
        vm.prank(buyer);
        wx.registerWarranty(PRODUCT_ID, PRODUCT_NAME, META_HASH, META_REF, PROOF_REF, DURATION_1Y);
    }

    function test_ApproveWarranty() public {
        vm.prank(buyer);
        uint256 id = wx.registerWarranty(PRODUCT_ID, PRODUCT_NAME, META_HASH, META_REF, PROOF_REF, DURATION_1Y);

        vm.prank(issuer);
        wx.approveWarranty(id);

        WarrantyX.Warranty memory w = wx.getWarranty(id);
        assertEq(uint8(w.status), uint8(WarrantyX.WarrantyStatus.Active));
        assertEq(w.issuer, issuer);
        assertEq(w.issuedAt, block.timestamp);
        assertEq(w.expiresAt, block.timestamp + DURATION_1Y);

        // Appears in owner's recovery list
        uint256[] memory ownerWarranties = wx.getWarrantiesByOwner(buyer);
        assertEq(ownerWarranties.length, 1);
        assertEq(ownerWarranties[0], id);

        // Removed from pending queue
        uint256[] memory pending = wx.getPendingRegistrations();
        assertEq(pending.length, 0);
    }

    function test_ApproveWarranty_EmitEvent() public {
        vm.prank(buyer);
        uint256 id = wx.registerWarranty(PRODUCT_ID, PRODUCT_NAME, META_HASH, META_REF, PROOF_REF, DURATION_1Y);

        vm.expectEmit(true, true, true, false);
        emit WarrantyX.WarrantyApproved(id, issuer, buyer, block.timestamp, block.timestamp + DURATION_1Y);

        vm.prank(issuer);
        wx.approveWarranty(id);
    }

    function test_ApproveWarranty_RevertIfNotIssuer() public {
        vm.prank(buyer);
        uint256 id = wx.registerWarranty(PRODUCT_ID, PRODUCT_NAME, META_HASH, META_REF, PROOF_REF, DURATION_1Y);

        vm.expectRevert("WarrantyX: not authorized issuer");
        vm.prank(stranger);
        wx.approveWarranty(id);
    }

    function test_ApproveWarranty_RevertIfNotPending() public {
        vm.prank(buyer);
        uint256 id = wx.registerWarranty(PRODUCT_ID, PRODUCT_NAME, META_HASH, META_REF, PROOF_REF, DURATION_1Y);

        vm.prank(issuer);
        wx.approveWarranty(id);

        vm.expectRevert("WarrantyX: warranty not pending");
        vm.prank(issuer);
        wx.approveWarranty(id);
    }

    function test_RejectWarranty() public {
        vm.prank(buyer);
        uint256 id = wx.registerWarranty(PRODUCT_ID, PRODUCT_NAME, META_HASH, META_REF, PROOF_REF, DURATION_1Y);

        vm.prank(issuer);
        wx.rejectWarranty(id, "Unverifiable proof of purchase");

        WarrantyX.Warranty memory w = wx.getWarranty(id);
        assertEq(uint8(w.status), uint8(WarrantyX.WarrantyStatus.Rejected));
        assertEq(w.rejectionReason, "Unverifiable proof of purchase");

        // Not in active owner recovery list
        uint256[] memory ownerWarranties = wx.getWarrantiesByOwner(buyer);
        assertEq(ownerWarranties.length, 0);

        // Pending queue is empty
        uint256[] memory pending = wx.getPendingRegistrations();
        assertEq(pending.length, 0);
    }

    function test_RejectWarranty_RevertIfNotIssuer() public {
        vm.prank(buyer);
        uint256 id = wx.registerWarranty(PRODUCT_ID, PRODUCT_NAME, META_HASH, META_REF, PROOF_REF, DURATION_1Y);

        vm.expectRevert("WarrantyX: not authorized issuer");
        vm.prank(stranger);
        wx.rejectWarranty(id, "Invalid");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Direct Issuer Creation (Backwards Compatible)
    // ─────────────────────────────────────────────────────────────────────────

    function test_CreateWarranty() public {
        vm.prank(issuer);
        uint256 id = wx.createWarranty(PRODUCT_ID, PRODUCT_NAME, META_HASH, META_REF, buyer, DURATION_1Y);

        assertEq(id, 0);

        WarrantyX.Warranty memory w = wx.getWarranty(id);
        assertEq(w.productId, PRODUCT_ID);
        assertEq(w.productName, PRODUCT_NAME);
        assertEq(w.issuer, issuer);
        assertEq(w.owner, buyer);
        assertEq(uint8(w.status), uint8(WarrantyX.WarrantyStatus.Active));
    }

    function test_CreateWarranty_RevertIfNotIssuer() public {
        vm.expectRevert("WarrantyX: not authorized issuer");
        vm.prank(stranger);
        wx.createWarranty(PRODUCT_ID, PRODUCT_NAME, META_HASH, META_REF, buyer, DURATION_1Y);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Warranty Transfer
    // ─────────────────────────────────────────────────────────────────────────

    function test_TransferWarranty() public {
        vm.prank(issuer);
        uint256 id = wx.createWarranty(PRODUCT_ID, PRODUCT_NAME, META_HASH, META_REF, buyer, DURATION_1Y);

        vm.prank(buyer);
        wx.transferWarranty(id, buyer2);

        WarrantyX.Warranty memory w = wx.getWarranty(id);
        assertEq(w.owner, buyer2);
        assertEq(w.transferCount, 1);

        uint256[] memory oldOwnerList = wx.getWarrantiesByOwner(buyer);
        assertEq(oldOwnerList.length, 0);

        uint256[] memory newOwnerList = wx.getWarrantiesByOwner(buyer2);
        assertEq(newOwnerList.length, 1);
        assertEq(newOwnerList[0], id);
    }

    function test_TransferWarranty_RevertIfNotOwner() public {
        vm.prank(issuer);
        uint256 id = wx.createWarranty(PRODUCT_ID, PRODUCT_NAME, META_HASH, META_REF, buyer, DURATION_1Y);

        vm.expectRevert("WarrantyX: not warranty owner");
        vm.prank(stranger);
        wx.transferWarranty(id, buyer2);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Claims
    // ─────────────────────────────────────────────────────────────────────────

    function test_SubmitClaim() public {
        vm.prank(issuer);
        uint256 id = wx.createWarranty(PRODUCT_ID, PRODUCT_NAME, META_HASH, META_REF, buyer, DURATION_1Y);

        vm.prank(buyer);
        uint256 claimId = wx.submitClaim(id, "Screen display flickering", META_HASH, "ipfs://QmProof");

        assertEq(claimId, 0);

        WarrantyX.Warranty memory w = wx.getWarranty(id);
        assertEq(uint8(w.status), uint8(WarrantyX.WarrantyStatus.ClaimPending));
        assertEq(w.claimCount, 1);
    }

    function test_ApproveClaim() public {
        vm.prank(issuer);
        uint256 id = wx.createWarranty(PRODUCT_ID, PRODUCT_NAME, META_HASH, META_REF, buyer, DURATION_1Y);

        vm.prank(buyer);
        wx.submitClaim(id, "Screen defect", META_HASH, "ipfs://QmProof");

        vm.prank(issuer);
        wx.reviewClaim(id, true);

        WarrantyX.Warranty memory w = wx.getWarranty(id);
        assertEq(uint8(w.status), uint8(WarrantyX.WarrantyStatus.ClaimApproved));
        assertEq(w.approvedClaimCount, 1);
    }

    function test_RejectClaim_RestoresActive() public {
        vm.prank(issuer);
        uint256 id = wx.createWarranty(PRODUCT_ID, PRODUCT_NAME, META_HASH, META_REF, buyer, DURATION_1Y);

        vm.prank(buyer);
        wx.submitClaim(id, "Cosmetic scratch", META_HASH, "ipfs://QmProof");

        vm.prank(issuer);
        wx.reviewClaim(id, false);

        WarrantyX.Warranty memory w = wx.getWarranty(id);
        assertEq(uint8(w.status), uint8(WarrantyX.WarrantyStatus.Active));
        assertEq(w.rejectedClaimCount, 1);
    }
}
