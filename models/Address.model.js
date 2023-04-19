const mongoose = require("mongoose");

const AddressSchema = new mongoose.Schema({
  name: String,
  country: {
    type: String,
    default: "US",
  },
  state: String,
  city: String,
  street: String,
  zip: String,
  street2: String,
  phone: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = mongoose.model("Address", AddressSchema);
