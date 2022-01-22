import CryptoJS from "crypto-js";

export const sha256 = str => {
  console.log("hash", str);
  const hash = CryptoJS.SHA256(str);
  const result = "0x" + hash.toString();
  return result;
};
