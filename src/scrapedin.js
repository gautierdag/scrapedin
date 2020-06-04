const chromium = require("chrome-aws-lambda");
const login = require("./login");
const profile = require("./profile/profile");
const logger = require("./logger")(__filename);

module.exports = async (
  {
    cookies,
    email,
    password,
    isHeadless,
    hasToLog,
    hasToGetContactInfo,
    puppeteerArgs,
    puppeteerAuthenticate
  } = {
    isHeadless: true,
    hasToLog: false
  }
) => {
  if (!hasToLog) {
    logger.stopLogging();
  }
  logger.info("initializing");

  const args = {
    args: chromium.args.concat(["--disable-features=AudioServiceOutOfProcess"]),
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
    ignoreHTTPSErrors: true
  };

  const browser = await chromium.puppeteer.launch(args);

  if (cookies) {
    logger.info("using cookies, login will be bypassed");
  } else if (email && password) {
    logger.info("email and password was provided, we're going to login...");

    try {
      await login(browser, email, password, logger);
    } catch (e) {
      await browser.close();
      throw e;
    }
  } else {
    logger.warn(
      "email/password and cookies wasn't provided, only public data will be collected"
    );
  }

  return (url, waitMs) =>
    profile(
      browser,
      cookies,
      url,
      waitMs,
      hasToGetContactInfo,
      puppeteerAuthenticate
    );
};
