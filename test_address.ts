import { Address } from "@stellar/stellar-sdk";

const user = "GDRUVDVEMV65AOYIUAQUHNVVTDN5V67K4762E44V6S6D6K6FNXTH5QEM";

try {
  Address.fromString(user);
  console.log("Address is valid");
} catch (e) {
  console.log("Address is invalid", e);
}
