const util = require("util");

const fs = require("fs");
const Handlebars = require("handlebars");
const sendEmail = require("../helpers/sendEmail");
const readFile = util.promisify(fs.readFile);

const handleWinner = ({ email, hashtag, wall, winner }) => {
  
const fileHTML = readFile(`${process.cwd()}/template/emailWinner.html`);
  const fileText = readFile(`${process.cwd()}/template/emailWinner.txt`);
  const emailData = {
    hashtag,
    wall,
    winner: winner.screenName
  };

  Promise.all([fileHTML, fileText]).then(async (values) => {
    const templateHtml = Handlebars.compile(values[0].toString("utf8"));
    const bodyHtml = templateHtml(emailData);

    const templateText = Handlebars.compile(values[1].toString("utf8"));
    const bodyText = templateText(emailData);

    await sendEmail(email, `#${hashtag} - And the winner is ...`, bodyText, bodyHtml);
  });
};

module.exports = {
  handleWinner,
};
