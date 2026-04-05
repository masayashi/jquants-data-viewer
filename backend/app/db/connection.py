"""DuckDB connection factory.

Each request gets its own in-memory connection. DuckDB connections are not
thread-safe, so sharing a single connection across async workers is unsafe.
See ADR-0002 for rationale and future migration path to connection pooling.
"""

from collections.abc import Generator

import duckdb


def get_db() -> Generator[duckdb.DuckDBPyConnection, None, None]:
    """Yield a fresh in-memory DuckDB connection for a single request."""
    conn = duckdb.connect(":memory:")
    try:
        yield conn
    finally:
        conn.close()
