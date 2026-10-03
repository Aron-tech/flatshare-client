/**
 * The native R3F loaders (`useLoader`) also accept a Metro asset module (a `require(...)` number): expo-asset
 * downloads / unpacks it. The type only knows URLs, hence the conversion.
 */
export const assetUrl = (module: number): string => module as unknown as string;
