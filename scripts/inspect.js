// module.exports = async function (callback) {
//   try {
//     const SecurityTokenRegistry = artifacts.require("SecurityTokenRegistry");
//     const STR = await SecurityTokenRegistry.deployed();

//     console.log("Latest version:", (await STR.getLatestVersion()).toString());
//     callback();
//   } catch (err) {
//     callback(err);
//   }
// };

module.exports = async function (callback) {
  try {
    const STRGetter = artifacts.require("STRGetter");
    const getter = await STRGetter.deployed();

    const version = await getter.getLatestProtocolVersion();
    console.log("Latest protocol version:", version.toString());

    const factory = await getter.getSTFactoryAddress();
    console.log("Active STFactory:", factory);

    callback();
  } catch (err) {
    callback(err);
  }
};
