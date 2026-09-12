/**
 * Generic validation middleware factory.
 *
 * Takes a Zod schema and returns Express middleware that validates
 * the request body against that schema.
 *
 * Usage:
 *   router.post('/register', validate(registerSchema), authController.register);
 *
 * How it works:
 * 1. Zod parses req.body against the schema
 * 2. If valid: replaces req.body with the parsed (cleaned/transformed) data
 *    and calls next()
 * 3. If invalid: sends a 400 response with detailed error messages
 *
 * Why replace req.body?
 * Zod's .parse() strips unknown fields and applies transforms
 * (trim, toLowerCase, etc.). The cleaned data is safer to use downstream.
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    // Extract readable error messages from Zod's error format
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),  // e.g., "email" or "tags.0"
      message: issue.message,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  // Replace req.body with the validated + transformed data
  req.body = result.data;
  next();
};

export default validate;
