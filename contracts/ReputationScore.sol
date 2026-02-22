// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./CampaignManager.sol";

contract ReputationScore {

    CampaignManager public campaignManager;

    struct AssociationProfile {
        string name;
        address owner;
        uint256[] campaignIds;
        bool exists;
    }

    mapping(address => AssociationProfile) public associations;

    event AssociationRegistered(address owner, string name);

    constructor(address _campaignManagerAddress) {
        campaignManager = CampaignManager(_campaignManagerAddress);
    }

    function registerAssociation(string memory _name) public {
        require(!associations[msg.sender].exists, "Already registered");
        associations[msg.sender].name = _name;
        associations[msg.sender].owner = msg.sender;
        associations[msg.sender].exists = true;
        emit AssociationRegistered(msg.sender, _name);
    }

    function addCampaignToAssociation(uint256 _campaignId) public {
        require(associations[msg.sender].exists, "Association not registered");
        associations[msg.sender].campaignIds.push(_campaignId);
    }

    function getScore(address _association) public view returns (uint256) {
        require(associations[_association].exists, "Association not found");
        
        uint256[] memory ids = associations[_association].campaignIds;
        if (ids.length == 0) return 0;

        uint256 totalParticipants = 0;
        uint256 totalCampaigns = ids.length;

        for (uint256 i = 0; i < ids.length; i++) {
            CampaignManager.Campaign memory c = campaignManager.getCampaign(ids[i]);
            totalParticipants += c.participantCount;
        }

        // Score = moyenne de participants par campagne, plafonné à 100
        uint256 avgParticipants = totalParticipants / totalCampaigns;
        if (avgParticipants > 100) return 100;
        return avgParticipants;
    }

    function getAssociation(address _association) public view returns (AssociationProfile memory) {
        return associations[_association];
    }
}