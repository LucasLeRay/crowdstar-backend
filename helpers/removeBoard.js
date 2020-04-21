const dynamoDb = require("./dynamodb");

const util = require("util");

const fs = require("fs");
const Handlebars = require("handlebars");
const sendEmail = require("../helpers/sendEmail");
const readFile = util.promisify(fs.readFile);

const removeBoard = async (email, boardName) => {
  const minDate6 = new Date();
  const minDate12 = new Date();

  minDate6.setHours(minDate6.getHours() - 6);
  minDate12.setHours(minDate6.getHours() - 12);

  const params = {
    TableName: process.env.tableName,
    FilterExpression: "#room_name = :room",
    ExpressionAttributeValues: {
      ":room": boardName,
    },
    ExpressionAttributeNames: {
      "#room_name": "name",
    },
  };
  try {
    const result = await dynamoDb.call("scan", params);
    result.Items.map(async (item) => {
      const params = {
        TableName: process.env.tableName,
        Key: {
          boardId: item.boardId,
          name: item.name,
        },
        UpdateExpression: "set isAvailable = :isAvailable",

        ExpressionAttributeValues: {
          ":isAvailable": false,
        },
        ReturnValues: "UPDATED_NEW",
      };

      const fileHTML = readFile(
        `${process.cwd()}/template/emailDeletedRoom.html`
      );
      const fileText = readFile(
        `${process.cwd()}/template/emailDeletedRoom.txt`
      );
      const emailData = {
        name: item.name,
      };

      Promise.all([fileHTML, fileText]).then(async (values) => {
        const templateHtml = Handlebars.compile(values[0].toString("utf8"));
        const bodyHtml = templateHtml(emailData);

        const templateText = Handlebars.compile(values[1].toString("utf8"));
        const bodyText = templateText(emailData);

        await sendEmail(
          email,
          "Your board has been deleted",
          bodyText,
          bodyHtml
        );
      });

      try {
        await dynamoDb.call("update", params);
      } catch (error) {
        console.log("Error while update table", error);
      }
    });
  } catch (error) {
    console.log("Cron error ", error);
  }
};

module.exports = {
  removeBoard,
};
