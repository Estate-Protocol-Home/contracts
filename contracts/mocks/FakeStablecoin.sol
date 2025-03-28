import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract FakeStablecoin is ERC20 {

    string public name = "Fake Stablecoin";
    uint8 public decimals = 6;
    string public symbol = "FSC";

    constructor() public {
        _mint(msg.sender, 10000000000000000000 * 10 ** 6);
    }

}