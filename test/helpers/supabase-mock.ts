import { vi } from "vitest";

export type SupabaseFailure = {
  key: string;
  message: string;
};

/**
 * Builds a minimal chainable Supabase client mock.
 * Failures are keyed as "table.method" (e.g. "courses.upsert").
 */
export function createSupabaseMock(options?: {
  failures?: SupabaseFailure[];
  selectRows?: Record<string, unknown[]>;
  singleRow?: Record<string, unknown | null>;
}) {
  const failures = new Map(
    (options?.failures ?? []).map((entry) => [entry.key, entry.message]),
  );
  const selectRows = options?.selectRows ?? {};
  const singleRow = options?.singleRow ?? {};

  function errorFor(key: string) {
    const message = failures.get(key);
    return message ? { message } : null;
  }

  function chain(table: string) {
    let lastOp: "select" | "insert" | "delete" | "update" = "select";
    const self: Record<string, ReturnType<typeof vi.fn>> = {};

    self.upsert = vi.fn(async () => ({
      error: errorFor(`${table}.upsert`),
    }));

    self.insert = vi.fn(() => {
      lastOp = "insert";
      return self;
    });

    self.update = vi.fn(() => {
      lastOp = "update";
      return self;
    });

    self.delete = vi.fn(() => {
      lastOp = "delete";
      return self;
    });

    self.select = vi.fn(() => {
      lastOp = "select";
      return self;
    });

    self.eq = vi.fn(() => self);

    self.in = vi.fn(async () => ({
      error: errorFor(`${table}.delete`),
    }));

    self.is = vi.fn(() => self);

    self.order = vi.fn(() => self);

    self.limit = vi.fn(async () => ({
      data: selectRows[table] ?? [],
      error: errorFor(`${table}.select`),
    }));

    self.maybeSingle = vi.fn(async () => ({
      data: singleRow[table] ?? null,
      error: errorFor(`${table}.select`),
    }));

    self.single = vi.fn(async () => ({
      data: singleRow[table] ?? null,
      error:
        errorFor(`${table}.insert`) ??
        errorFor(`${table}.update`) ??
        errorFor(`${table}.select`),
    }));

    Object.assign(self, {
      then(
        onFulfilled?: (value: {
          data?: unknown[] | unknown | null;
          error: { message: string } | null;
        }) => unknown,
        onRejected?: (reason: unknown) => unknown,
      ) {
        const payload =
          lastOp === "insert"
            ? { data: null, error: errorFor(`${table}.insert`) }
            : lastOp === "update"
              ? { data: null, error: errorFor(`${table}.update`) }
              : lastOp === "delete"
                ? { data: null, error: errorFor(`${table}.delete`) }
                : {
                    data: selectRows[table] ?? [],
                    error: errorFor(`${table}.select`),
                  };

        return Promise.resolve(payload).then(onFulfilled, onRejected);
      },
    });

    return self;
  }

  return {
    from: vi.fn((table: string) => chain(table)),
  };
}
