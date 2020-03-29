const express = require("express");
const { v1 } = require("uuid");
const { check, validationResult } = require("express-validator");
const dynamoDb = require("../helpers/dynamodb");
const sendEmail = require("../helpers/sendEmail");

const router = express.Router();
router.get("/", (req, res) => res.send({ board: "ok" }));

router.post(
  "/",
  [
    check("name").isSlug(),
    check("hashtag").isAlphanumeric(),
    check("color").isHexColor(),
    check("giveway").isIn(["NONE", "ONE_TIME", "EVERY"]),
    // eslint-disable-next-line max-len
    check("winnerRate").custom(
      winnerRate => Number.isInteger(winnerRate) && winnerRate > 0
    ),
    check("email").isEmail()
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const { msg, param } = errors.array()[0];
      return next(`${param}: ${msg}`);
    }
    const {
      hashtag,
      name,
      color,
      banner,
      giveway,
      winnerRate,
      email
    } = req.body;
    const code = (Math.random() * 10000).toString().slice(0, 4);

    const params = {
      TableName: process.env.tableName,
      Item: {
        boardId: v1(),
        name,
        hashtag,
        color,
        banner,
        giveway,
        winnerRate,
        email,
        code,
        date: Date()
      }
    };

    try {
      await dynamoDb.call("put", params);
      // eslint-disable-next-line max-len
      await sendEmail(
        email,
        "Your board has been successfully created!",
        `Here is your id to access to the board: ${name} and your code to modify it: ${code}`
      );
      return res.send(params.Item);
    } catch (error) {
      return next(error.message);
    }
  }
);

router.put("/", [
    check("color").isHexColor(),
    check("banner").isURL()
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const { msg, param } = errors.array()[0];
    return next(`${param}: ${msg}`);
  }

  const params = {
    TableName: process.env.tableName,
    Key: {
      boardId: req.body.boardId,
      name: req.body.name
    },
    UpdateExpression: "set color = :color, banner = :banner",
    ConditionExpression: "code = :code",

    ExpressionAttributeValues: {
      ":color": req.body.color,
      ":banner": req.body.banner,
      ":code": req.body.code
    },
    ReturnValues: "UPDATED_NEW"
  };

  try {
    const item = await dynamoDb.call("update", params);
    console.log("items ", item);
    return res.send(item);
  } catch (error) {
    return next(error.message);
  }
});

module.exports = router;
