const express = require("express");
const mongoose = require("mongoose");
const { basic, adminOnly } = require("../authMiddleware");
const UserModel = require("./schema");
const usersRouter = express.Router();

usersRouter.post("/", async (req, res, next) => {
  try {
    const newUser = new UserModel(req.body);
    const { _id } = await newUser.save();
    res.status(201).send(_id);
  } catch (error) {
    next(error);
  }
});

usersRouter.get("/", basic, adminOnly, async (req, res, next) => {
  try {
    const users = await UserModel.find();
    res.status(201).send(users);
  } catch (error) {
    next(error);
  }
});

usersRouter.get("/me", basic, async (req, res, next) => {
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

usersRouter.put("/me", basic, async (req, res, next) => {
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

usersRouter.delete("/me", basic, async (req, res, next) => {
  try {
    await req.user.deleteOne();
    res.status(204).send("Deleted");
  } catch (error) {
    next(error);
  }
});

usersRouter.delete("/delete/:id", basic, adminOnly, async (req, res, next) => {
  try {
    await UserModel.findOneAndDelete({ _id: req.params.id });
    res.status(201).send(`${req.params.id} deleted`);
  } catch (error) {
    next(error);
  }
});

module.exports = usersRouter;
