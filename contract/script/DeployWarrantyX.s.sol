// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {WarrantyX} from "../src/WarrantyX.sol";

contract DeployWarrantyX is Script {
    function run() external returns (WarrantyX warrantyX) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        warrantyX = new WarrantyX();

        vm.stopBroadcast();

        console.log("WarrantyX deployed at:", address(warrantyX));
        console.log("Deployer (contract owner + issuer):", vm.addr(deployerPrivateKey));
        console.log("Network: Bohr Testnet (Chain 968)");
        console.log("Explorer:", string.concat("https://scan.bohr.life/address/", vm.toString(address(warrantyX))));
    }
}

