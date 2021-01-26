import { Request, Response, Router } from "express";

import { User } from "../entity/User";

import { isEmpty, validate } from "class-validator";

import bcrypt from "bcrypt";

import jwt from "jsonwebtoken";

import cookie from "cookie";

import auth from "../middleware/auth";

const register = async (req: Request, res: Response) => {
  const { email, username, password } = req.body;

  try {
    //validate incoming data
    let errors: any = {};
    const emailUser = await User.findOne({ email });
    const usernameUser = await User.findOne({ username });

    if (emailUser) errors.email = "Email has already been taken";
    if (usernameUser) errors.username = "Username has already been taken";

    if (Object.keys(errors).length > 0) return res.status(400).json(errors);

    // new user object
    const user = new User({ email, username, password });

    //validate for error
    errors = await validate(user);
    if (errors.length > 0) return res.status(400).json({ errors });

    //if no errors then save
    await user.save();
    return res.json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    let errors: any = {};

    if (isEmpty(username)) errors.username = "Username must not be empty";
    if (isEmpty(password)) errors.password = "Password must not be empty";
    if (Object.keys(errors).length > 1) return res.status(400).json(errors);

    const user = await User.findOne({ username });

    if (!user) return res.status(404).json({ error: "User not found" });

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches)
      return res.status(401).json({ password: "Invalid password" });

    const token = jwt.sign({ username }, process.env.JWT_SECRET);

    res.set(
      "Set-cookie",
      cookie.serialize("token", token, {
        httpOnly: true, //cookie cannot be assessed by JavaScript, means more secure
        secure: process.env.NODE_ENV === "production", //This cookie only in https
        sameSite: "strict", // only from own domain
        maxAge: 3600, // expiry time in seconds
        path: "/", // where this cookie is valid
      })
    );

    return res.json(user);
  } catch (error) {}
};

const me = (_: Request, res: Response) => {
  return res.json(res.locals.user);
};

const logout = async (_: Request, res: Response) => {
  res.set(
    "Set-cookie",
    cookie.serialize("token", "", {
      httpOnly: true, //cookie cannot be assessed by JavaScript, means more secure
      secure: process.env.NODE_ENV === "production", //This cookie only in https
      sameSite: "strict", // only from own domain
      expires: new Date(0), // expiry time in seconds
      path: "/", // where this cookie is valid
    })
  );

  return res.status(200).json({ success: true });
};

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", auth, me);
router.get("/logout", auth, logout);

export default router;
