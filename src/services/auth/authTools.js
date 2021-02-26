const jwt = require("jsonwebtoken");

const authenticate = async (user) => {
  try {
    console.log(user);
    const newAccessToken = await generateJWT({ _id: user._id });

    return { token: newAccessToken };
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};

const generateJWT = (payload) =>
  new Promise((res, rej) =>
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
      (err, token) => {
        if (err) rej(err);
        res(token);
      }
    )
  );

const verifyJWT = (token) =>
  new Promise((res, rej) =>
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.log(err);
        rej(err);
      }
      res(decoded);
    })
  );

module.exports = { authenticate, verifyJWT };
