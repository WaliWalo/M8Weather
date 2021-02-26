const { Schema, model } = require("mongoose");
const bcrypt = require("bcryptjs");
const UserSchema = new Schema(
  {
    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: "Email address is required",
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
    password: {
      type: String,
    },
    firstName: { type: String },
    lastName: { type: String },
    favourite: [
      {
        name: { type: String, required: true },
        lat: { type: Number, required: true },
        long: { type: Number, required: true },
      },
    ],
    googleId: String,
  },
  {
    timestamps: true,
  }
);

UserSchema.statics.findByCredentials = async function (email, password) {
  const user = await this.findOne({ email });
  if (user) {
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) return user;
    else return { status: "error", error: "Username/password incorrect" };
  } else return null;
};

UserSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.__v;

  return userObject;
};

UserSchema.pre("save", async function () {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

const UserModel = model("User", UserSchema);
module.exports = UserModel;
