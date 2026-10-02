// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./Escrow.sol";

contract EscrowFactory {
    address public immutable implementation;
    address public immutable feeRecipient;
    address[] public allEscrows;

    event EscrowCreated(
        address indexed escrow,
        address indexed seller,
        address indexed buyer,
        uint256 itemPrice
    );

    constructor(address _implementation, address _feeRecipient) {
        require(_implementation != address(0), "Implementation cannot be the zero address");
        require(_feeRecipient != address(0), "Fee recipient cannot be the zero address");
        implementation = _implementation;
        feeRecipient = _feeRecipient;
    }

    function createEscrow(
        address seller,
        address buyer,
        uint256 itemPrice
    ) external returns (address escrow) {
        escrow = Clones.clone(implementation);
        // Initialize in the same transaction so the clone cannot be front-run
        Escrow(escrow).initialize(feeRecipient, seller, buyer, itemPrice);
        allEscrows.push(escrow);

        emit EscrowCreated(escrow, seller, buyer, itemPrice);
    }

    function escrowCount() external view returns (uint256) {
        return allEscrows.length;
    }
}
