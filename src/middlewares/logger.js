const logger = (req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  // İstek tamamlandığında konsola log basar
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${timestamp}] ${req.method} ${req.originalUrl} | Status: ${res.statusCode} | ${duration}ms`
    );
  });

  next();
};

module.exports = logger;