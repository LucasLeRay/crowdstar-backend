const dynamoDb = require("../helpers/dynamodb");
const cron = require("node-cron");

cron.schedule("0 * */1 * * *", async () => {

  let minDate6 = new Date();
  let minDate12 = new Date();

  minDate6.setHours(minDate6.getHours() - 6);
  minDate12.setHours(minDate6.getHours() - 12);

  const params = {
    TableName: process.env.tableName,
    FilterExpression:
      "#date < :minDate6 and (tier = :free or tier = :none) or \
      #date < :minDate12 and tier = :std",
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
      };
      return await dynamoDb.call("delete", params);
    });
  } catch (error) {
    console.log("Cron error ", error);
  }
});
