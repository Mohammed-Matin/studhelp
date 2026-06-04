const UNPROCESSABLE_ENTITY_STATUS = 422;

export function validateStrictFields(payload, allowedKeys, payloadName) {
  if (
    payload === null ||
    typeof payload !== "object" ||
    Array.isArray(payload)
  ) {
    const error = new Error(`Request ${payloadName} must be a JSON object.`);
    error.statusCode = UNPROCESSABLE_ENTITY_STATUS;
    error.code = "UNPROCESSABLE_ENTITY";
    throw error;
  }

  const providedKeys = Object.keys(payload);

  const unexpectedKeys = providedKeys.filter(
    (key) => !allowedKeys.includes(key),
  );

  if (unexpectedKeys.length > 0) {
    const error = new Error(
      `Unexpected fields found in request ${payloadName}.`,
    );
    error.statusCode = UNPROCESSABLE_ENTITY_STATUS;
    error.code = "UNPROCESSABLE_ENTITY";
    error.details = {
      target: payloadName,
      unexpectedFields: unexpectedKeys,
      allowedFields: allowedKeys,
    };
    throw error;
  }

  const missingKeys = allowedKeys.filter((key) => !providedKeys.includes(key));

  if (missingKeys.length > 0) {
    const error = new Error(
      `Missing required fields in request ${payloadName}.`,
    );
    error.statusCode = UNPROCESSABLE_ENTITY_STATUS;
    error.code = "UNPROCESSABLE_ENTITY";
    error.details = {
      target: payloadName,
      missingFields: missingKeys,
      requiredFields: allowedKeys,
    };
    throw error;
  }
}

export default validateStrictFields;
