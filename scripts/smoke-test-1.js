/**
 * Estate Protocol — end-to-end smoke test
 *
 * Registers a ticker, creates a security token, and attaches a fully
 * configured USDTieredSTO module.  Every step that can silently fail
 * is followed by an explicit read-back assertion.
 *
 *   npx truffle exec scripts/smoke-test.js --network development
 *
 * Prerequisites
 *   • Migration 1 (PolyTokenFaucet) and Migration 2 (full protocol) have run.
 *   • verify-bootstrap.js passes 49/49.
 */

const Web3       = require("web3");
const BN         = Web3.utils.BN;
const NULL       = "0x0000000000000000000000000000000000000000";
const ONE_ETHER  = new BN(10).pow(new BN(18));          // 1e18
const MAX_POLY   = new BN(1000000).mul(ONE_ETHER);      // 1 M POLY — blanket approval

// ── ABI stub for USDTieredSTO.configure() ─────────────────────────────────
// FundRaiseType[]  → uint8[]   in the wire ABI
// IERC20[]         → address[] in the wire ABI
const CONFIGURE_ABI = {
    name: "configure",
    type: "function",
    inputs: [
        { type: "uint256",  name: "_startTime"                  },
        { type: "uint256",  name: "_endTime"                    },
        { type: "uint256[]", name: "_ratePerTier"               },
        { type: "uint256[]", name: "_ratePerTierDiscountPoly"   },
        { type: "uint256[]", name: "_tokensPerTierTotal"        },
        { type: "uint256[]", name: "_tokensPerTierDiscountPoly" },
        { type: "uint256",  name: "_nonAccreditedLimitUSD"      },
        { type: "uint256",  name: "_minimumInvestmentUSD"       },
        { type: "uint8[]",  name: "_fundRaiseTypes"             },
        { type: "address",  name: "_wallet"                     },
        { type: "address",  name: "_treasuryWallet"             },
        { type: "address[]", name: "_usdTokens"                 },
    ],
};

module.exports = async function (callback) {
    try {
        // ── artifacts ────────────────────────────────────────────────────────
        const PolyTokenFaucet            = artifacts.require("PolyTokenFaucet");
        const SecurityTokenRegistryProxy = artifacts.require("SecurityTokenRegistryProxy");
        const SecurityTokenRegistry      = artifacts.require("SecurityTokenRegistry");
        const STRGetter                  = artifacts.require("STRGetter");
        const ISecurityToken             = artifacts.require("ISecurityToken");
        const USDTieredSTOFactory        = artifacts.require("USDTieredSTOFactory");
        const USDTieredSTO               = artifacts.require("USDTieredSTO");

        const accounts = await web3.eth.getAccounts();
        const deployer = accounts[0];

        // ── deployed instances ───────────────────────────────────────────────
        const polyToken              = await PolyTokenFaucet.deployed();
        const strProxyInst           = await SecurityTokenRegistryProxy.deployed();
        const str                    = await SecurityTokenRegistry.at(strProxyInst.address);
        const strGetter              = await STRGetter.at(strProxyInst.address);
        const usdTieredSTOFactory    = await USDTieredSTOFactory.deployed();

        console.log("\n── Estate Protocol Smoke Test ────────────────────────────");

        // ── 0. preflight: POLY balance ───────────────────────────────────────
        const polyBalance = new BN(await polyToken.balanceOf(deployer));
        console.log(`\n[0/6] Deployer POLY balance: ${polyBalance.div(ONE_ETHER)} POLY`);
        // Protocol fees are now 0 (no ticker/launch/setup fees required).
        // Keeping balance check in case POLY is needed for other operations.
        if (polyBalance.lt(new BN(1000).mul(ONE_ETHER))) {
            console.log("      Balance low — calling faucet getTokens()...");
            await polyToken.getTokens(MAX_POLY.toString(), deployer);
        }

        // ── 1. approve STR proxy for ticker-reg + ST-launch fees ─────────────
        // Protocol fees removed (initRegFee = 0, stLaunchFee = 0).
        // No POLY approval needed.
        // console.log("[1/6] Approving POLY → STR proxy ...");
        // await polyToken.approve(strProxyInst.address, MAX_POLY.toString(), { from: deployer });

        // ── 2. register ticker ───────────────────────────────────────────────
        // Use a timestamp-derived suffix so the script is re-runnable on a live chain
        // without colliding with a previously registered ticker.
        // Max ticker length = 10; "EST" + 5 hex chars = 8.
        const TICKER = "EST" + Math.floor(Date.now() / 1000).toString(16).slice(-5).toUpperCase();
        console.log(`[2/6] Registering ticker "${TICKER}" ...`);
        await str.registerNewTicker(deployer, TICKER, { from: deployer });

        // read-back: ticker must now be unavailable
        const tickerFree = await str.tickerAvailable(TICKER);
        if (tickerFree) throw new Error(`Ticker ${TICKER} still shows available after registration`);
        console.log(`      Ticker "${TICKER}" registered and locked.`);

        // ── 3. generate security token ───────────────────────────────────────
        console.log("[3/6] Generating security token ...");
        await str.generateNewSecurityToken(
            "Estate Token",          // _name
            TICKER,                  // _ticker
            "Estate Protocol test",  // _tokenDetails
            true,                    // _divisible
            deployer,                // _treasuryWallet
            0,                       // _protocolVersion  (0 → latest = 3.0.0)
            { from: deployer }
        );

        // read-back: must resolve to a real address
        const tokenAddress = await strGetter.getSecurityTokenAddress(TICKER);
        if (!tokenAddress || tokenAddress === NULL) {
            throw new Error("Token address is 0x0 — generateNewSecurityToken failed");
        }
        console.log(`      Token deployed at ${tokenAddress}`);

        const secToken = await ISecurityToken.at(tokenAddress);

        // sanity: deployer is the owner (STFactory transfers ownership to issuer)
        const tokenOwner = await secToken.owner();
        if (tokenOwner.toLowerCase() !== deployer.toLowerCase()) {
            throw new Error(`Token owner is ${tokenOwner}, expected ${deployer}`);
        }

        // sanity: GTM was auto-attached (GTM reports types [2, 6])
        const tmModules = await secToken.getModulesByType(2);
        if (tmModules.length === 0) throw new Error("GeneralTransferManager was not auto-attached");
        console.log(`      GTM auto-attached at ${tmModules[0]}`);

        // ── 4. fund SecurityToken with POLY for module setup cost ───────────
        // Protocol fees removed (factory setupCost = 0).
        // No POLY transfer to SecurityToken needed.
        // console.log("[4/6] Transferring POLY → SecurityToken (STO setup cost) ...");
        // const STO_FUND = new BN(200000).mul(ONE_ETHER);
        // await polyToken.transfer(tokenAddress, STO_FUND.toString(), { from: deployer });

        // ── 5. attach USDTieredSTO ───────────────────────────────────────────
        console.log("[5/6] Attaching USDTieredSTO ...");

        // ── configure parameters ─────────────────────────────────────────────
        const nowSec     = Math.floor(Date.now() / 1000);
        const startTime  = nowSec + 3600;   // 1 h from now
        const endTime    = nowSec + 90000;  // 25 h from now

        // Single tier:
        //   rate           = 1 USD / token  (base price)
        //   rateDiscount   = 0.5 USD / token when paying with POLY
        //   total tokens   = 1 000
        //   discount tokens= 500   (first 500 POLY-purchased tokens get the discount)
        const ratePerTier              = [ONE_ETHER.toString()];                     // 1e18
        const ratePerTierDiscountPoly  = [ONE_ETHER.div(new BN(2)).toString()];     // 5e17
        const tokensPerTierTotal       = [new BN(1000).mul(ONE_ETHER).toString()];  // 1000 tokens
        const tokensPerTierDiscountPoly= [new BN(500).mul(ONE_ETHER).toString()];   // 500 tokens

        const nonAccreditedLimitUSD    = new BN(5000).mul(ONE_ETHER).toString();    // 5 000 USD cap
        const minimumInvestmentUSD     = new BN(100).mul(ONE_ETHER).toString();     // 100 USD floor

        // FundRaiseType enum:  ETH = 0, POLY = 1   (no stablecoin in this test)
        const fundRaiseTypes = [0, 1];

        const wallet         = deployer;   // funds go here
        const treasuryWallet = deployer;   // unsold tokens go here
        const usdTokens      = [];         // no stablecoin enabled

        // ABI-encode the full configure() calldata
        const configureData = web3.eth.abi.encodeFunctionCall(CONFIGURE_ABI, [
            startTime.toString(),
            endTime.toString(),
            ratePerTier,
            ratePerTierDiscountPoly,
            tokensPerTierTotal,
            tokensPerTierDiscountPoly,
            nonAccreditedLimitUSD,
            minimumInvestmentUSD,
            fundRaiseTypes,
            wallet,
            treasuryWallet,
            usdTokens,
        ]);

        await secToken.addModule(
            usdTieredSTOFactory.address,
            configureData,
            0,                     // _maxCost  — 0 (no setup fee)
            0,                     // _budget
            false,                 // _archived
            { from: deployer }
        );

        // ── 6. verify ────────────────────────────────────────────────────────
        console.log("[6/6] Verifying STO ...");

        // STO modules are type 3
        const stoModules = await secToken.getModulesByType(3);
        if (stoModules.length === 0) throw new Error("No STO module found on token after addModule");

        const stoAddress = stoModules[0];
        console.log(`      USDTieredSTO at ${stoAddress}`);

        const sto = await USDTieredSTO.at(stoAddress);

        // getSTODetails() returns:
        //   [0] startTime       uint256
        //   [1] endTime         uint256
        //   [2] currentTier     uint256
        //   [3] cap[]           uint256[]   (tokenTotal per tier)
        //   [4] rate[]          uint256[]   (rate per tier)
        //   [5] fundsRaisedUSD  uint256
        //   [6] investorCount   uint256
        //   [7] tokensSold      uint256
        //   [8] fundRaiseTypes  bool[]      [ETH, POLY, SC]
        const d = await sto.getSTODetails();

        console.log("\n  ── STO Configuration ──────────────────────────────");
        console.log(`  startTime        ${d[0]}  (expected ${startTime})`);
        console.log(`  endTime          ${d[1]}  (expected ${endTime})`);
        console.log(`  tiers            ${d[3].length}`);
        console.log(`  tier[0] cap      ${new BN(d[3][0]).div(ONE_ETHER)} tokens`);
        console.log(`  tier[0] rate     ${new BN(d[4][0]).div(ONE_ETHER)} USD`);
        console.log(`  fundRaiseTypes   ETH=${d[8][0]}  POLY=${d[8][1]}  SC=${d[8][2]}`);
        console.log(`  isOpen           ${await sto.isOpen()}`);

        // ── assertions ───────────────────────────────────────────────────────
        if (Number(d[0]) !== startTime)  throw new Error(`startTime: got ${d[0]}, want ${startTime}`);
        if (Number(d[1]) !== endTime)    throw new Error(`endTime:   got ${d[1]}, want ${endTime}`);
        if (d[3].length  !== 1)          throw new Error(`Expected 1 tier, got ${d[3].length}`);
        if (!d[8][0])                    throw new Error("ETH fund-raise type not enabled");
        if (!d[8][1])                    throw new Error("POLY fund-raise type not enabled");
        if (d[8][2])                     throw new Error("SC fund-raise type should be disabled");

        console.log("\n  ✓ All checks passed — token created, USDTieredSTO configured and live.\n");

        callback();

    } catch (e) {
        console.error("\n[FATAL]", e.message);
        callback(e);
    }
};
