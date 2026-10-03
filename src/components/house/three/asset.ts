/**
 * A natív R3F loaderek (`useLoader`) a Metro asset modult (`require(...)` szám) is elfogadják:
 * az expo-asset tölti le / csomagolja ki. A típus csak URL-t ismer, ezért a konverzió.
 */
export const assetUrl = (module: number): string => module as unknown as string;
