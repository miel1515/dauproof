// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract CampaignManager is EIP712 {
    using ECDSA for bytes32;

    struct Campaign {
        string name;
        string campaignType; // "presence", "vote", "engagement"
        address owner;
        uint256 createdAt;
        uint256 participantCount;
        bool isActive;
    }

    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(address => bool)) public hasParticipated;
    uint256 public campaignCount;

    // ✅ signer backend
    address public signer;

    // ✅ anti-replay
    mapping(bytes32 => bool) public usedTickets;

    // Participate(address participant,uint256 campaignId,uint256 expiry,bytes32 nonce)
    bytes32 private constant PARTICIPATE_TYPEHASH =
        keccak256("Participate(address participant,uint256 campaignId,uint256 expiry,bytes32 nonce)");

    event CampaignCreated(uint256 campaignId, string name, address owner);
    event ParticipationRecorded(uint256 campaignId, address participant);
    event SignerUpdated(address signer);

    constructor(address signer_) EIP712("Stamp", "1") {
        require(signer_ != address(0), "signer=0");
        signer = signer_;
        emit SignerUpdated(signer_);
    }

    function setSigner(address newSigner) external {
        // MVP: laisse comme ça. Si tu veux: Ownable + onlyOwner
        require(newSigner != address(0), "signer=0");
        signer = newSigner;
        emit SignerUpdated(newSigner);
    }

    function createCampaign(string memory _name, string memory _type) public returns (uint256) {
        campaignCount++;
        campaigns[campaignCount] = Campaign({
            name: _name,
            campaignType: _type,
            owner: msg.sender,
            createdAt: block.timestamp,
            participantCount: 0,
            isActive: true
        });
        emit CampaignCreated(campaignCount, _name, msg.sender);
        return campaignCount;
    }

    // ✅ Nouveau recordParticipation : msg.sender = participant, preuve via signature
    function recordParticipation(
        uint256 campaignId,
        uint256 expiry,
        bytes32 nonce,
        bytes calldata signature
    ) external {
        Campaign storage c = campaigns[campaignId];
        require(c.isActive, "Campaign is not active");

        address participant = msg.sender;

        require(!hasParticipated[campaignId][participant], "Already participated");
        require(block.timestamp <= expiry, "QR expired");

        bytes32 ticketHash = keccak256(abi.encodePacked(participant, campaignId, expiry, nonce));
        require(!usedTickets[ticketHash], "Ticket used");

        bytes32 structHash = keccak256(abi.encode(
            PARTICIPATE_TYPEHASH,
            participant,
            campaignId,
            expiry,
            nonce
        ));
        bytes32 digest = _hashTypedDataV4(structHash);
        address recovered = ECDSA.recover(digest, signature);
        require(recovered == signer, "Bad signature");

        usedTickets[ticketHash] = true;
        hasParticipated[campaignId][participant] = true;
        c.participantCount++;

        emit ParticipationRecorded(campaignId, participant);
    }

    function closeCampaign(uint256 _campaignId) public {
        require(campaigns[_campaignId].owner == msg.sender, "Not the owner");
        campaigns[_campaignId].isActive = false;
    }

    function getCampaign(uint256 _campaignId) public view returns (Campaign memory) {
        return campaigns[_campaignId];
    }
}