export type ApiErrorCode =
  | "FORBIDDEN"
  | "INVALID_PATH"
  | "PATH_OUTSIDE_VAULT"
  | "FILE_NOT_FOUND"
  | "FILE_ALREADY_EXISTS"
  | "FILE_CONFLICT"
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_FILE_TYPE"
  | "VAULT_NOT_CONFIGURED"
  | "INDEX_NOT_READY"
  | "INTERNAL_ERROR";

export type ApiSuccess<T> = {
  ok: true;
  data: T;
};

export type ApiFailure = {
  ok: false;
  error: {
    code: ApiErrorCode;
    message: string;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export class AppError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status = 400,
  ) {
    super(message);
  }
}

export function ok<T>(data: T, init?: ResponseInit) {
  return Response.json({ ok: true, data } satisfies ApiSuccess<T>, init);
}

export function fail(error: unknown) {
  if (error instanceof AppError) {
    return Response.json(
      { ok: false, error: { code: error.code, message: error.message } } satisfies ApiFailure,
      { status: error.status },
    );
  }

  console.error(error);
  return Response.json(
    {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Unexpected server error.",
      },
    } satisfies ApiFailure,
    { status: 500 },
  );
}
