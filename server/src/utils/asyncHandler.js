/**
 * Wraps an async route handler to eliminate try/catch boilerplate.
 *
 * Without this, every route would need:
 *   app.get('/path', async (req, res, next) => {
 *     try {
 *       // ... actual logic
 *     } catch (err) {
 *       next(err);
 *     }
 *   });
 *
 * With this, you just write:
 *   app.get('/path', asyncHandler(async (req, res) => {
 *     // ... actual logic — errors auto-forwarded to error middleware
 *   }));
 *
 * How it works:
 * - Takes an async function
 * - Returns a new function that calls the original and catches any rejection
 * - Passes caught errors to Express's next() which routes them to the error middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
