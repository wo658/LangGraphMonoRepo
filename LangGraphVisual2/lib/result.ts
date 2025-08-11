/**
 * Result type for better error handling
 * Inspired by Rust's Result<T, E> type
 */
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E }

export const Ok = <T>(data: T): Result<T, never> => ({ success: true, data })

export const Err = <E>(error: E): Result<never, E> => ({ success: false, error })

export const isOk = <T, E>(result: Result<T, E>): result is { success: true; data: T } => 
  result.success

export const isErr = <T, E>(result: Result<T, E>): result is { success: false; error: E } => 
  !result.success

/**
 * Safely execute a function that might throw
 */
export const tryCatch = <T>(fn: () => T): Result<T, Error> => {
  try {
    return Ok(fn())
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)))
  }
}

/**
 * Safely execute an async function that might throw
 */
export const tryAsync = async <T>(fn: () => Promise<T>): Promise<Result<T, Error>> => {
  try {
    const data = await fn()
    return Ok(data)
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)))
  }
}