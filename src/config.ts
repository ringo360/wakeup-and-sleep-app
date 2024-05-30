// Config File

/**
 * JWT(Json Web Token)で使用されるシークレットを定義します。
 */
export const JWTSecret = 'yoursecret'

/**
 * WebAPIのポートを定義します。
 */
export const port:number = 3150


// Checker

export function ConfigChecker() {
    // Check
    if (JWTSecret) {
        console.log(`[Checker] JWTSecret is valid`)
    } else {
        console.error(`[Checker] JWTSecret is not valid! check config.ts`)
        process.exit(0)
    }
    if (port && typeof port == "number") {
        console.log(`[Checker] WebAPI Port is valid (${port})`)
    } else {
        console.error(`[Checker] port is not valid! check config.ts`)
        process.exit(0)
    }

    // Success
    return true;
}