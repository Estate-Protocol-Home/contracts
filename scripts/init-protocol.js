// module.exports = async function (callback) {
//   try {
//     const STR = await artifacts.require("SecurityTokenRegistry").deployed();
//     const STFactory = await artifacts.require("STFactory").deployed();

//     // Polymath convention: version = major, minor, patch
//     const major = 1;
//     const minor = 0;
//     const patch = 0;

//     console.log("Registering STFactory:", STFactory.address);

//     await STR.setLatestVersion(major, minor, patch);

//     const latest = await STR.getLatestProtocolVersion();
//     const activeFactory = await STR.getSTFactoryAddress();

//     console.log("Latest protocol version:", latest.toString());
//     console.log("Active STFactory:", activeFactory);

//     callback();
//   } catch (err) {
//     callback(err);
//   }
// };

module.exports = async function (callback) {
  try {
    const STR = await artifacts.require("SecurityTokenRegistry").deployed();
    const accounts = await web3.eth.getAccounts();

    // direct storage write workaround
    await STR.transferOwnership(accounts[0]);

    console.log("New owner:", await STR.owner());

    callback();
  } catch (e) {
    callback(e);
  }
};

