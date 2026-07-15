import assert from "node:assert/strict";
import test from "node:test";
import { extractEmailsFromHtml } from "../lib/clinics/websiteEmailLookup";

test("extracts normal and mailto clinic email addresses", () => {
  const emails = extractEmailsFromHtml(`
    <a href="mailto:reception@exampleclinic.com.au">Email us</a>
    <p>admin@exampleclinic.com.au</p>
  `);

  assert.deepEqual(emails, [
    "reception@exampleclinic.com.au",
    "admin@exampleclinic.com.au",
  ]);
});

test("extracts common obfuscated email addresses", () => {
  const emails = extractEmailsFromHtml("reception [at] skinclinic.com.au");
  assert.deepEqual(emails, ["reception@skinclinic.com.au"]);
});

test("ignores obvious asset filenames", () => {
  const emails = extractEmailsFromHtml(
    "logo@realclinic.com.au.png info@realclinic.com.au"
  );
  assert.deepEqual(emails, ["info@realclinic.com.au"]);
});
