import { Alert, Linking } from "react-native";

/** Open only ordinary web references; reject malformed or unsafe schemes. */
export async function openExternalReference(url: string) {
  let safeUrl: string;
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
      throw new Error("Unsupported source URL");
    }
    safeUrl = parsed.toString();
  } catch {
    Alert.alert(
      "Link unavailable",
      "This source does not have a valid secure web address.",
    );
    return;
  }

  try {
    await Linking.openURL(safeUrl);
  } catch {
    Alert.alert(
      "Could not open source",
      "The source could not be opened on this device. Please try again later.",
    );
  }
}
