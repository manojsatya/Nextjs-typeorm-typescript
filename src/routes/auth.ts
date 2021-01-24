import { Request, Response, Router } from "express";

import { User } from "../entity/User";

import { validate } from "class-validator";

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

const router = Router();

router.post("/register", register);

export default router;
