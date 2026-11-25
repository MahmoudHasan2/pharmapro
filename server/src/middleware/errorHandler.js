function notFound(req, res) {
  res.status(404).json({ message: `المسار غير موجود - ${req.originalUrl}` });
}
function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.statusCode || 500;
  res.status(status).json({ message: err.message || 'حدث خطأ في الخادم' });
}
module.exports = { notFound, errorHandler };
