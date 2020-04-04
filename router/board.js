const express = require("express");
const { v1 } = require("uuid");
const { check, validationResult } = require("express-validator");
const dynamoDb = require("../helpers/dynamodb");
const uploadFile = require("../helpers/uploadFile");
const sendEmail = require("../helpers/sendEmail");
const randomCode = require("../helpers/randomCode");

const fs = require("fs");
const Handlebars = require("handlebars");

const router = express.Router();
router.get("/", (req, res) => res.send({ board: "ok" }));

router.get("/:name", async (req, res, next) => {
  const params = {
    TableName: process.env.tableName,
    FilterExpression: "#room_name = :room",
    ExpressionAttributeValues: {
      ":room": req.params.name
    },
    ExpressionAttributeNames: {
      "#room_name": "name"
    }
  };

  try {
    const result = await dynamoDb.call("scan", params);
    delete result.Items[0].code;
    if (result.Count !== 1) {
      return next("A problem occured on Items, the room may not exist");
    }
    res.send({ result: result.Items[0] });
  } catch (error) {
    return next(error.message);
  }
});

router.post(
  "/",
  [
    check("hashtag").isAlphanumeric(),
    check("color").isHexColor(),
    check("giveway").isIn(["NONE", "ONE_TIME", "EVERY"]),
    check("winnerRate").custom(
      winnerRate => Number.isInteger(winnerRate) && winnerRate >= 0
    ),
    check("email").isEmail()
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const { msg, param } = errors.array()[0];
      return next(`${param}: ${msg}`);
    }
    const { hashtag, color, banner, giveway, winnerRate, email } = req.body;
    const code = randomCode();
    const name = `${hashtag.toLowerCase()}-${randomCode()}`;
    const bannerName = banner ? await uploadFile(name, banner) : null;

    const params = {
      TableName: process.env.tableName,
      Item: {
        boardId: v1(),
        name,
        hashtag,
        color,
        banner: bannerName,
        giveway,
        winnerRate,
        email,
        code,
        date: Date()
      }
    };

    try {
      await dynamoDb.call("put", params);
      fs.readFile(
        "./template/emailtemplate.html",
        async (err, emailHtmlTemplate) => {
          if (err) {
            console.log("Unable to load HTML Template");
            throw err;
          }
          fs.readFile(
            "./template/emailtemplate.txt",
            async (err, emailTextTemplate) => {
              if (err) {
                console.log("Unable to load TEXT Template");
                throw err;
              }

              let emailData = {
                name,
                hashtag
              };

              let templateText = Handlebars.compile(
                emailTextTemplate.toString()
              );
              let bodyText = templateText(emailData);
              console.log(bodyText);

              let templateHtml = Handlebars.compile(
                emailHtmlTemplate.toString()
              );
              let bodyHtml = templateHtml(emailData);
              console.log(bodyHtml);
              await sendEmail(
                email,
                "Your board has been successfully created!",
                bodyText,
                bodyHtml
              );
            }
          );
        }
      );
      // eslint-disable-next-line max-len
      return res.send(params.Item);
    } catch (error) {
      return next(error.message);
    }
  }
);

router.put(
  "/",
  [check("color").isHexColor(), check("banner").isURL()],
  async (req, res, next) => {
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
  }
);

module.exports = router;
