pragma solidity 0.5.8;

import "./IEstateProtocolWhitelistSTO.sol";
import "openzeppelin-solidity/contracts/cryptography/MerkleProof.sol";

contract EstateProtocolWhitelistSTO is IEstateProtocolWhitelistSTO {
    address public admin;
    bytes32 private _root;

    uint64 public constant MAX_LOCK_PERIOD = 365 days;

    mapping(address => InvestorKYCData) internal _investorKYCData;
    mapping(address => uint64) public tokenLockStartTime;
    mapping(address => bool) internal _existingInvestors;

    mapping(address => bool) public isAdmin;
    mapping(address => bool) public isOperator;
    mapping(address => bool) public tokenTransferStatus;

    mapping(address => VerificationData) private verificationDataMap;

    constructor() public {
        admin = msg.sender;
        isAdmin[msg.sender] = true;
        isOperator[msg.sender] = true;
    }

    modifier onlyAdmin() {
        require(isAdmin[msg.sender], "Not an admin");
        _;
    }

    modifier onlyOperator() {
        require(isOperator[msg.sender], "Not a operator");
        _;
    }

    /**
     * @notice Update the Merkle root for KYC verification
     * @param root New Merkle root containing approved KYC data
     */
    function modifyKYCData(bytes32 root) external onlyOperator {
        _root = root;
        emit MerkleRootUpdated(_root);
    }

    function hasVerificationData(address investor) public view returns (bool) {
        return verificationDataMap[investor].expiry > 0;
    }

    function addTokenLockStartTime(
        address token,
        uint64 startTime
    ) external onlyAdmin {
        tokenLockStartTime[token] = startTime;

        emit TokenLockStartTimeAdded({token: token, startTime: startTime});
    }

    function modifyTokenTransferStatus(
        address token,
        bool status
    ) external onlyAdmin {
        tokenTransferStatus[token] = status;
        emit TokenTransferStatus(token, status);
    }

    function grantAdminRole(address account) external onlyAdmin {
        require(!isAdmin[account], "Account is already an admin");
        isAdmin[account] = true;
        emit AdminRoleGranted(account);
    }

    function revokeAdminRole(address account) external onlyAdmin {
        require(isAdmin[account], "Account is not an admin");
        isAdmin[account] = false;
        emit AdminRoleRevoked(account);
    }

    function grantOperatorRole(address account) external onlyAdmin {
        require(!isOperator[account], "Account is already a operator");
        isOperator[account] = true;
        emit OperatorRoleGranted(account);
    }

    function revokeOperatorRole(address account) external onlyAdmin {
        require(isOperator[account], "Account is not a operator");
        isOperator[account] = false;
        emit OperatorRoleRevoked(account);
    }

    /**
     * @notice Get investor in the existingInvestors `investor`.
     */
    function isExistingInvestor(address investor) external view returns (bool) {
        return _existingInvestors[investor];
    }

    /**
     * @notice Verifies if an address is whitelisted using Merkle proof
     * @param proof Merkle proof provided by the user
     * @param investor Address of the user to verify
     * @param expiry Expiry timestamp from the original data
     * @param isAccredited Accreditation status from the original data
     * @return bool Returns true if the proof is valid
     */
    function verifyInvestor(
        bytes32[] calldata proof,
        address investor,
        uint64 expiry,
        bool isAccredited
    ) external returns (bool) {
       
        require(expiry > block.timestamp, "Investor Proof has expired");

        bytes32 firstHash = keccak256(abi.encode(investor, expiry, isAccredited));
        bytes32 leaf = keccak256(abi.encode(firstHash));

        require(MerkleProof.verify(proof, _root, leaf), "Invalid proof");
         
        bool isAlreadyExistingInvestor = _existingInvestors[investor];

        if (!isAlreadyExistingInvestor) {
            _existingInvestors[investor] = true;
        }


        _investorKYCData[investor] = InvestorKYCData({
                expiryTime: expiry,
                isAccredited: isAccredited
        });

          emit InvestorKYCDataUpdate({
                investor: investor,
                expiryTime: expiry,
                isAccredited: isAccredited
            });
 

        return true;
    }

 
    /**
     * @notice Get investor in the whitelist `investor`.
     * @param investor Address of the investor
     * @param token token to be purchased
     */
    function getInvestorKYCData(
        address investor,
        address token
    )
        external
        view
        returns (
            uint64 canSendAfter,
            uint64 canReceiveAfter,
            uint64 expiryTime,
            uint8 added
        )
    {
        bool isAlreadyExistingInvestor = _existingInvestors[investor];
        uint64 futureBlockTimestamp = uint64(block.timestamp + MAX_LOCK_PERIOD);
        uint64 pastBlockTimestamp = uint64(block.timestamp - 1);

        if (isAlreadyExistingInvestor) {
            uint64 _canSendAfter = pastBlockTimestamp;

            InvestorKYCData memory investorKYCData = _investorKYCData[investor];
            if (investorKYCData.isAccredited) {
                _canSendAfter = tokenLockStartTime[token] + MAX_LOCK_PERIOD;
            }

            bool isTransferAllowed = tokenTransferStatus[token];
            if (!isTransferAllowed) {
                _canSendAfter += futureBlockTimestamp;
            }

            uint64 _canReceiveAfter = pastBlockTimestamp;

            return (
                _canSendAfter,
                _canReceiveAfter,
                investorKYCData.expiryTime,
                uint8(1)
            );
        } else {
            return (
                futureBlockTimestamp,
                futureBlockTimestamp,
                pastBlockTimestamp,
                uint8(1)
            );
        }
    }

    function getTokenTransferStatus(
        address token
    ) external view returns (bool) {
        return tokenTransferStatus[token];
    }
}
