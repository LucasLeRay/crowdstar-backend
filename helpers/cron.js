const cron = require("node-cron");
const dynamoDb = require("./dynamodb");

cron.schedule("0 0 */1 * * *", async () => {
  const minDate6 = new Date();
  const minDate12 = new Date();

  minDate6.setHours(minDate6.getHours() - 6);
  minDate12.setHours(minDate6.getHours() - 12);

  const params = {
    TableName: process.env.tableName,
    FilterExpression:
      // eslint-disable-next-line max-len
      "#date < :minDate6 and (tier = :free or tier = :none) or #date < :minDate12 and tier = :std",
    ExpressionAttributeValues: {
      ":minDate6": minDate6.toString(),
      ":minDate12": minDate12.toString(),
      ":none": "NONE",
      ":free": "FREE",
      ":std": "STANDARD",
    },
    ExpressionAttributeNames: {
      "#date": "date",
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

      try {
        await dynamoDb.call("update", params);
      } catch (error) {
        console.log("Error while update table", error);
      }
    });
  } catch (error) {
    console.log("Cron error ", error);
  }
});
