/**
 * Estate Protocol — post-migration bootstrap verification
 *
 * Reads on-chain state to confirm every step in the proxy bootstrap
 * sequence completed successfully.  These are the exact points that
 * silently fail when ownership, initialisation order, or
 * updateFromRegistry() are wrong.
 *
 *   npx truffle exec scripts/verify-bootstrap.js --network development
 */

const NULL = "0x0000000000000000000000000000000000000000";

/**
 * PolymathRegistry.getAddress() reverts on a missing key ("Invalid key").
 * Returns null instead of letting the script crash.
 */
async function safeGetAddress(registry, key) {
    try {
        return await registry.getAddress(key);
    } catch (_) {
        return null;
    }
}

module.exports = async function (callback) {
    // ── shared state ─────────────────────────────────────────────────────────
    const passed = [];
    const failed = [];

    function check(label, ok, detail) {
        if (ok) {
            console.log(`  [PASS] ${label}`);
            passed.push(label);
        } else {
            const suffix = detail ? `  →  ${detail}` : "";
            console.log(`  [FAIL] ${label}${suffix}`);
            failed.push(label);
        }
    }

    try {
        // ── artifacts ────────────────────────────────────────────────────────
        const PolymathRegistry            = artifacts.require("PolymathRegistry");
        const ModuleRegistry              = artifacts.require("ModuleRegistry");
        const ModuleRegistryProxy         = artifacts.require("ModuleRegistryProxy");
        const SecurityTokenRegistry       = artifacts.require("SecurityTokenRegistry");
        const SecurityTokenRegistryProxy  = artifacts.require("SecurityTokenRegistryProxy");
        const STRGetter                   = artifacts.require("STRGetter");
        const STFactory                   = artifacts.require("STFactory");
        const STGetter                    = artifacts.require("STGetter");
        const FeatureRegistry             = artifacts.require("FeatureRegistry");
        const DataStoreFactory            = artifacts.require("DataStoreFactory");

        const GeneralTransferManagerFactory        = artifacts.require("GeneralTransferManagerFactory");
        const GeneralPermissionManagerFactory      = artifacts.require("GeneralPermissionManagerFactory");
        const CountTransferManagerFactory          = artifacts.require("CountTransferManagerFactory");
        const PercentageTransferManagerFactory     = artifacts.require("PercentageTransferManagerFactory");
        const EtherDividendCheckpointFactory       = artifacts.require("EtherDividendCheckpointFactory");
        const ERC20DividendCheckpointFactory       = artifacts.require("ERC20DividendCheckpointFactory");
        const VolumeRestrictionTMFactory           = artifacts.require("VolumeRestrictionTMFactory");
        const ManualApprovalTransferManagerFactory = artifacts.require("ManualApprovalTransferManagerFactory");
        const VestingEscrowWalletFactory           = artifacts.require("VestingEscrowWalletFactory");
        const CappedSTOFactory                     = artifacts.require("CappedSTOFactory");
        const USDTieredSTOFactory                  = artifacts.require("USDTieredSTOFactory");

        const accounts = await web3.eth.getAccounts();
        const deployer = accounts[0];

        // ── 1. core contract deployments ─────────────────────────────────────
        console.log("\n┌── 1. Core Contract Deployments");

        const polymathRegistry          = await PolymathRegistry.deployed();
        check("PolymathRegistry",          polymathRegistry.address !== NULL);

        const mrProxyInst               = await ModuleRegistryProxy.deployed();
        check("ModuleRegistryProxy",       mrProxyInst.address !== NULL);

        const strProxyInst              = await SecurityTokenRegistryProxy.deployed();
        check("SecurityTokenRegistryProxy", strProxyInst.address !== NULL);

        const strGetterInst             = await STRGetter.deployed();
        check("STRGetter",                 strGetterInst.address !== NULL);

        const stFactoryInst             = await STFactory.deployed();
        check("STFactory",                 stFactoryInst.address !== NULL);

        const stGetterInst              = await STGetter.deployed();
        check("STGetter",                  stGetterInst.address !== NULL);

        const featureRegInst            = await FeatureRegistry.deployed();
        check("FeatureRegistry",           featureRegInst.address !== NULL);

        const dataStoreFactInst         = await DataStoreFactory.deployed();
        check("DataStoreFactory",          dataStoreFactInst.address !== NULL);

        // ── 2. PolymathRegistry address map ──────────────────────────────────
        // Three keys must point to specific deployed addresses; four others just
        // need to be non-zero.
        console.log("\n├── 2. PolymathRegistry Address Map");

        const pinned = {
            "ModuleRegistry":        mrProxyInst.address,
            "SecurityTokenRegistry": strProxyInst.address,
            "FeatureRegistry":       featureRegInst.address,
        };
        for (const [key, expected] of Object.entries(pinned)) {
            const got = await safeGetAddress(polymathRegistry, key);
            check(
                key,
                got && got.toLowerCase() === expected.toLowerCase(),
                got ? `got ${got}` : "not set"
            );
        }

        // These keys have no predetermined address — just confirm they are set.
        const present = ["PolyToken", "PolyUsdOracle", "EthUsdOracle", "StablePolyUsdOracle"];
        for (const key of present) {
            const got = await safeGetAddress(polymathRegistry, key);
            check(key, got && got !== NULL, got || "not set");
        }

        // ── 3. ModuleRegistry proxy bootstrap ────────────────────────────────
        // The logic contract is accessed through the proxy address.  If
        // upgradeToAndCall() failed or initialised the wrong owner, every
        // subsequent registerModule / verifyModule call would have reverted.
        console.log("\n├── 3. ModuleRegistry Proxy Bootstrap");

        const moduleRegistry = await ModuleRegistry.at(mrProxyInst.address);

        let mrOwner, mrPaused;
        try { mrOwner  = await moduleRegistry.owner();    } catch (_) { mrOwner  = null; }
        try { mrPaused = await moduleRegistry.isPaused(); } catch (_) { mrPaused = null; }

        check("initialized (owner readable)",
            mrOwner && mrOwner !== NULL,
            mrOwner || "owner() reverted — proxy not initialised");
        check("owner == deployer",
            mrOwner && mrOwner.toLowerCase() === deployer.toLowerCase(),
            `owner=${mrOwner}  deployer=${deployer}`);
        check("not paused",
            mrPaused === false,
            `isPaused=${mrPaused}`);

        // ── 4. SecurityTokenRegistry proxy bootstrap ─────────────────────────
        // Same pattern as ModuleRegistry.  The STR proxy additionally delegates
        // unknown function selectors to STRGetter (checked in section 5).
        console.log("\n├── 4. SecurityTokenRegistry Proxy Bootstrap");

        const secTokenRegistry = await SecurityTokenRegistry.at(strProxyInst.address);

        let strOwner, strPaused;
        try { strOwner  = await secTokenRegistry.owner();    } catch (_) { strOwner  = null; }
        try { strPaused = await secTokenRegistry.isPaused(); } catch (_) { strPaused = null; }

        check("initialized (owner readable)",
            strOwner && strOwner !== NULL,
            strOwner || "owner() reverted — proxy not initialised");
        check("owner == deployer",
            strOwner && strOwner.toLowerCase() === deployer.toLowerCase(),
            `owner=${strOwner}  deployer=${deployer}`);
        check("not paused",
            strPaused === false,
            `isPaused=${strPaused}`);

        // ── 5. Protocol version & STFactory wiring ───────────────────────────
        // getLatestProtocolVersion() and getSTFactoryAddress() live on STRGetter.
        // The STR proxy forwards unknown selectors to it via delegatecall.  If
        // setProtocolFactory() or setLatestVersion() were never called (or called
        // with wrong args), these reads will return zero values.
        console.log("\n├── 5. Protocol Version & STFactory Wiring");

        const strGetterViaProxy = await STRGetter.at(strProxyInst.address);

        let version, factoryAddr;
        try { version    = await strGetterViaProxy.getLatestProtocolVersion(); } catch (_) { version    = null; }
        try { factoryAddr = await strGetterViaProxy.getSTFactoryAddress();     } catch (_) { factoryAddr = null; }

        check(
            "latestVersion == [3, 0, 0]",
            version &&
                Number(version[0]) === 3 &&
                Number(version[1]) === 0 &&
                Number(version[2]) === 0,
            version ? `got [${version}]` : "call reverted — STRGetter not delegated?"
        );
        check("STFactory address != 0x0",
            factoryAddr && factoryAddr !== NULL,
            factoryAddr || "0x0 — setProtocolFactory() not called?");
        check(
            "STFactory address matches deployed contract",
            factoryAddr && factoryAddr.toLowerCase() === stFactoryInst.address.toLowerCase(),
            `STR reports ${factoryAddr}  deployed at ${stFactoryInst.address}`
        );

        // STFactory stores three pointers set at construction time.
        const gtmFactoryInst = await GeneralTransferManagerFactory.deployed();

        const stfRegistry = await stFactoryInst.polymathRegistry();
        check("STFactory.polymathRegistry == PolymathRegistry",
            stfRegistry.toLowerCase() === polymathRegistry.address.toLowerCase(),
            stfRegistry);

        const stfTM = await stFactoryInst.transferManagerFactory();
        check("STFactory.transferManagerFactory == GTMFactory",
            stfTM.toLowerCase() === gtmFactoryInst.address.toLowerCase(),
            stfTM);

        const stfDS = await stFactoryInst.dataStoreFactory();
        check("STFactory.dataStoreFactory == DataStoreFactory",
            stfDS.toLowerCase() === dataStoreFactInst.address.toLowerCase(),
            stfDS);

        // ── 6. Module factory registration & verification ────────────────────
        // Every factory must appear in ModuleRegistry as both registered (owner
        // != 0x0) and verified (bool == true).  If updateFromRegistry() was never
        // called, FeatureRegistry would be address(0) inside ModuleRegistry and
        // every registerModule() call would have reverted — so a full pass here
        // implicitly confirms updateFromRegistry() succeeded.
        console.log("\n├── 6. Module Factories — Registered & Verified");

        const FACTORIES = [
            ["GeneralTransferManagerFactory",        GeneralTransferManagerFactory],
            ["GeneralPermissionManagerFactory",      GeneralPermissionManagerFactory],
            ["CountTransferManagerFactory",          CountTransferManagerFactory],
            ["PercentageTransferManagerFactory",     PercentageTransferManagerFactory],
            ["EtherDividendCheckpointFactory",       EtherDividendCheckpointFactory],
            ["ERC20DividendCheckpointFactory",       ERC20DividendCheckpointFactory],
            ["VolumeRestrictionTMFactory",           VolumeRestrictionTMFactory],
            ["ManualApprovalTransferManagerFactory", ManualApprovalTransferManagerFactory],
            ["VestingEscrowWalletFactory",           VestingEscrowWalletFactory],
            ["CappedSTOFactory",                     CappedSTOFactory],
            ["USDTieredSTOFactory",                  USDTieredSTOFactory],
        ];

        for (const [name, Artifact] of FACTORIES) {
            const inst = await Artifact.deployed();

            // getFactoryDetails returns (verified, factoryOwner, reputation[]).
            // An unregistered factory returns (false, 0x0, []) — it does not revert.
            let details;
            try {
                details = await moduleRegistry.getFactoryDetails(inst.address);
            } catch (_) {
                details = null;
            }

            const registered = details && details[1] !== NULL;   // factoryOwner set
            const verified   = details && details[0] === true;

            check(`${name} registered`, registered,
                details ? `factoryOwner=${details[1]}` : "getFactoryDetails reverted");
            check(`${name} verified`,   verified,
                details ? `verified=${details[0]}`     : "N/A");
        }

        // ── summary ──────────────────────────────────────────────────────────
        console.log("\n└────────────────────────────────────────────────────────");
        console.log(`     passed: ${passed.length}    failed: ${failed.length}`);

        if (failed.length > 0) {
            console.log("\n  Failed checks:");
            failed.forEach(label => console.log(`    ✗ ${label}`));
            console.log("\n  Protocol bootstrap is INCOMPLETE — see failures above.\n");
        } else {
            console.log("\n  ✓ All checks passed — protocol bootstrap is complete.\n");
        }

        callback();

    } catch (e) {
        console.error("\n[FATAL] Verification script crashed:", e.message);
        callback(e);
    }
};
