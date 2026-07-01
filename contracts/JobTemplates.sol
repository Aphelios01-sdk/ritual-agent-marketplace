// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title JobTemplates — Library template job preset (skillIds + taskData + default reward)
/// @notice Agent/dev publish template; requester instantiate → panggil JobMarketV2.requestService
///         dengan parameter template (kurangi boilerplate, standardize task format).
///         ponytail: TIDAK panggil JobMarketV2 langsung (avoid circular import). Frontend/oracle
///         yang instantiate: baca template → kirim tx requestService. Kontrak ini cuma store + query.
interface IJobMarketV2 {
    function requestService(bytes32[] calldata, bytes calldata) external payable returns (uint256);
}

contract JobTemplates {
    struct Template {
        uint256 id;
        address creator;
        string name;
        bytes32[] requiredSkillIds;
        bytes taskData;          // template taskData (bisa ada placeholder, off-chain fill)
        uint256 defaultReward;   // reward rekomendasi (requester bisa override saat instantiate)
        bool active;
    }

    uint256 public nextTemplateId;
    mapping(uint256 => Template) public templates;
    mapping(bytes32 => uint256[]) private _bySkill;   // skillId → template ids

    event TemplateCreated(uint256 indexed id, address indexed creator, string name, uint256 defaultReward);
    event TemplateDeactivated(uint256 indexed id);

    /// @notice Publish template baru.
    function createTemplate(
        string calldata name,
        bytes32[] calldata requiredSkillIds,
        bytes calldata taskData,
        uint256 defaultReward
    ) external returns (uint256) {
        require(bytes(name).length > 0, "name required");
        require(requiredSkillIds.length > 0, "skills required");

        uint256 id = ++nextTemplateId;
        templates[id] = Template({
            id: id,
            creator: msg.sender,
            name: name,
            requiredSkillIds: requiredSkillIds,
            taskData: taskData,
            defaultReward: defaultReward,
            active: true
        });
        for (uint256 i = 0; i < requiredSkillIds.length; i++) {
            _bySkill[requiredSkillIds[i]].push(id);
        }
        emit TemplateCreated(id, msg.sender, name, defaultReward);
        return id;
    }

    function deactivateTemplate(uint256 id) external {
        require(templates[id].creator == msg.sender, "only creator");
        templates[id].active = false;
        emit TemplateDeactivated(id);
    }

    function getTemplate(uint256 id) external view returns (Template memory) {
        return templates[id];
    }

    function getTemplatesBySkill(bytes32 skillId) external view returns (uint256[] memory) {
        return _bySkill[skillId];
    }

    /// @notice Instantiate template → panggil JobMarketV2.requestService dengan reward final.
    /// @dev taskData dikirim apa adanya (frontend sudah fill placeholder off-chain sebelum panggil).
    function instantiate(uint256 templateId, address jobMarket) external payable returns (uint256) {
        Template storage t = templates[templateId];
        require(t.active, "template inactive");
        uint256 reward = msg.value > 0 ? msg.value : t.defaultReward;
        require(reward > 0, "reward required");
        return IJobMarketV2(jobMarket).requestService{value: reward}(t.requiredSkillIds, t.taskData);
    }
}
