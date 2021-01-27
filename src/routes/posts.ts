import { Router, Request, Response } from "express";
import Post from "../entity/Post";
import Sub from "../entity/Sub";

import auth from "../middleware/auth";

const createPost = async (req: Request, res: Response) => {
  const { title, body, sub } = req.body;

  const user = res.locals.user; // middleware throws an error if there is no user

  if (title.trim() === "")
    return res.status(400).json({ title: "Title must not be empty" });

  try {
    const subRecord = await Sub.findOneOrFail({ name: sub });
    const post = new Post({ title, body, user, sub: subRecord });
    await post.save();
    return res.json(post);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

const router = Router();

router.post("/", auth, createPost);

export default router;
