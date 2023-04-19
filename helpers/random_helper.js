module.exports = {
  randomOTP: (length) => {
    var possible = "0123456789";
    var randomText = "";
    for (var i = 0; i < length; i++)
      randomText += possible.charAt(
        Math.floor(Math.random() * possible.length)
      );
    return randomText;
  },

  // generate api key
  generateApiKey: () => {
    var possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var randomText = "";
    for (var i = 0; i < 32; i++)
      randomText += possible.charAt(
        Math.floor(Math.random() * possible.length)
      );
    return randomText;
  },
};
