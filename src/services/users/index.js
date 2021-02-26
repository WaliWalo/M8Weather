const express = require("express");
const mongoose = require("mongoose");
const UserModel = require("./schema");
const usersRouter = express.Router();
const { authenticate } = require("../auth/authTools");
const { authorize } = require("../auth/authMiddleware");
const passport = require("passport");

usersRouter.post("/register", async (req, res, next) => {
  try {
    const newUser = new UserModel(req.body);
    const { _id } = await newUser.save();
    res.status(201).send(_id);
  } catch (error) {
    next(error);
  }
});

usersRouter.get("/", authorize, async (req, res, next) => {
  try {
    const users = await UserModel.find();
    res.status(201).send(users);
  } catch (error) {
    next(error);
  }
});

usersRouter.get("/me", authorize, async (req, res, next) => {
  try {
    res.status(201).send(req.user);
  } catch (error) {
    const err = new Error();
    if (error.name == "CastError") {
      err.message = "User Not Found";
      err.httpStatusCode = 404;
      next(err);
    } else {
      next(error);
    }
  }
});

usersRouter.put("/me", authorize, async (req, res, next) => {
  try {
    const updates = Object.keys(req.body);
    updates.forEach((update) => (req.user[update] = req.body[update]));
    await req.user.save();
    res.send(req.user);
  } catch (error) {
    const err = new Error();
    if (error.name == "CastError") {
      err.message = "User Not Found";
      err.httpStatusCode = 404;
      next(err);
    } else {
      next(error);
    }
  }
});

usersRouter.delete("/me", authorize, async (req, res, next) => {
  try {
    await req.user.deleteOne();
    res.status(204).send("Deleted");
  } catch (error) {
    next(error);
  }
});

usersRouter.post("/login", async (req, res, next) => {
  try {
    //Check credentials
    const { email, password } = req.body;
    const user = await UserModel.findByCredentials(email, password);
    //Generate token
    console.log(user);
    if (user) {
      if (user.status === "error") {
        res.send(user);
      } else {
        const { token } = await authenticate(user);
        //Send back tokens
        console.log(token);
        res.cookie("accessToken", token, {
          httpOnly: true,
          path: "/",
        });
        res.cookie("loggedIn", "true");

        res.send({ status: "Ok" });
      }
    } else {
      // console.log(user);
      res.send({ status: "error", error: "User not found" });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

usersRouter.post("/logout", authorize, async (req, res, next) => {
  try {
    res.clearCookie("accessToken");
    res.send("OK");
  } catch (error) {
    console.log(error);
    next(error);
  }
});

usersRouter.get(
  "/googleLogin",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

usersRouter.get(
  "/googleRedirect",
  passport.authenticate("google"),
  async (req, res, next) => {
    try {
      res.cookie("accessToken", req.user.tokens.token, {
        httpOnly: true,
      });
      res.cookie("loggedIn", "true");
      res.status(200).redirect("http://localhost:3000/");
    } catch (error) {
      next(error);
    }
  }
);

usersRouter.put("/favourite", authorize, async (req, res, next) => {
  try {
    const user = req.user;
    console.log(req.body, user);
    const findCurrentLocation = req.user.favourite.filter(
      (city) => city.name === req.body.name
    );
    if (findCurrentLocation.length > 0) {
      const update = await UserModel.findOneAndUpdate(
        { _id: user._id, "favourite.name": req.body.name },
        {
          "favourite.$.name": req.body.name,
          "favourite.$.lat": req.body.lat,
          "favourite.$.long": req.body.long,
        }
      );
      res.status(200).send(update);
    } else {
      const update = await UserModel.findOneAndUpdate(
        { _id: user._id },
        {
          $addToSet: {
            favourite: {
              name: req.body.name,
              lat: req.body.lat,
              long: req.body.long,
            },
          },
        }
      );
      res.status(200).send(update);
    }
  } catch (error) {
    next(error);
  }
});

usersRouter.delete("/favourite/:favId", authorize, async (req, res, next) => {
  try {
    const user = req.user;
    const update = await UserModel.findOneAndUpdate(
      { _id: user._id },
      {
        $pull: { favourite: { _id: req.params.favId } },
      }
    );
    res.status(200), send(update);
  } catch (error) {
    next(error);
  }
});

module.exports = usersRouter;
