import assert from "node:assert/strict";
import test from "node:test";
import { paymentAllowsPartnerActivation } from "../lib/clinics/payments";
import { searchClinics, isClinicSearchable } from "../lib/clinics/search";
import type { Clinic } from "../lib/clinics/types";

const options = {
  metroRadiusKm: 25,
  regionalRadiusKm: 50,
  maxResults: 3,
  preferredPartnerPriceMonthly: 99,
  foundationPartnerPriceMonthly: 49,
  foundationPartnerAvailable: false,
  foundationPartnerLimit: 10,
  notificationThrottleDays: 7,
  partnershipPageUrl: "/clinics/partner",
  termsPageUrl: "/clinics/terms",
  notificationSender: "SkinChecker.app <reports@skinchecker.app>",
  salesEmailAddress: "partners@skinchecker.app",
  clinicEmailsEnabled: false,
  clickTrackingEnabled: true,
  stripeStandardPriceId: undefined,
  stripeFoundationPriceId: undefined,
  stripeWebhookSecret: undefined,
};

function clinic(overrides: Partial<Clinic>): Clinic {
  return {
    clinicId: overrides.clinicId || overrides.name || "clinic",
    name: "Skin Cancer Clinic",
    clinicType: "Skin cancer clinic",
    relationshipStatus: "Free Listing",
    active: true,
    displayInApp: true,
    postcode: "2000",
    latitude: -33.8688,
    longitude: 151.2093,
    website: "https://example.com",
    servicesOffered: ["Skin checks"],
    ...overrides,
  };
}

test("Preferred Partner available nearby is shown before free listings", () => {
  const result = searchClinics(
    [
      clinic({ name: "Free Clinic", relationshipStatus: "Free Listing" }),
      clinic({
        name: "Partner Clinic",
        relationshipStatus: "Preferred Partner",
        latitude: -33.86,
      }),
    ],
    { postcode: "2000" },
    options
  );

  assert.equal(result.results.length, 1);
  assert.equal(result.results[0].clinic.name, "Partner Clinic");
  assert.equal(result.results[0].listingType, "preferred");
  assert.equal(result.usedFallback, false);
});

test("Free Listing fallback is used when no Preferred Partner is nearby", () => {
  const result = searchClinics(
    [clinic({ name: "Free Clinic", relationshipStatus: "Free Listing" })],
    { postcode: "2000" },
    options
  );

  assert.equal(result.results[0].listingType, "free");
  assert.equal(result.usedFallback, true);
});

test("multiple Preferred Partners are ranked by distance before priority", () => {
  const result = searchClinics(
    [
      clinic({
        name: "Far High Priority",
        relationshipStatus: "Preferred Partner",
        latitude: -33.7,
        priority: 99,
      }),
      clinic({
        name: "Close Lower Priority",
        relationshipStatus: "Preferred Partner",
        latitude: -33.868,
        priority: 1,
      }),
    ],
    { postcode: "2000" },
    options
  );

  assert.equal(result.results[0].clinic.name, "Close Lower Priority");
});

test("Preferred Partner outside acceptable radius is excluded", () => {
  const result = searchClinics(
    [
      clinic({
        name: "Too Far Partner",
        relationshipStatus: "Preferred Partner",
        latitude: -34.4,
      }),
    ],
    { postcode: "2000" },
    options
  );

  assert.equal(result.results.length, 0);
});

test("clinic missing latitude and longitude is ignored when coordinates are needed", () => {
  const result = searchClinics(
    [
      clinic({
        name: "Missing Coordinates",
        latitude: null,
        longitude: null,
      }),
    ],
    { postcode: "2000" },
    options
  );

  assert.equal(result.results.length, 0);
});

test("postcode-only search uses approximate postcode coordinates", () => {
  const result = searchClinics(
    [clinic({ name: "Sydney Clinic" })],
    { postcode: "2000" },
    options
  );

  assert.equal(result.source, "postcode");
  assert.equal(result.results.length, 1);
});

test("postcode 2125 uses Hills district coordinates", () => {
  const result = searchClinics(
    [
      clinic({
        name: "Hills Clinic",
        postcode: "2154",
        latitude: -33.7302,
        longitude: 150.9929,
      }),
    ],
    { postcode: "2125" },
    options
  );

  assert.equal(result.results.length, 1);
  assert.equal(result.results[0].clinic.name, "Hills Clinic");
  assert.equal(result.results[0].distanceKm !== null, true);
  assert.equal(result.results[0].distanceKm! < 10, true);
});

test("geolocation denied falls back to postcode search", () => {
  const result = searchClinics(
    [clinic({ name: "Sydney Clinic" })],
    { postcode: "2000", latitude: null, longitude: null },
    options
  );

  assert.equal(result.source, "postcode");
});

test("no clinics found returns an empty result set", () => {
  const result = searchClinics([], { postcode: "2000" }, options);
  assert.equal(result.results.length, 0);
  assert.equal(result.message, "No nearby clinics were found.");
});

test("inactive clinics are excluded", () => {
  assert.equal(isClinicSearchable(clinic({ active: false })), false);
});

test("Do Not Contact clinics are excluded", () => {
  assert.equal(
    isClinicSearchable(clinic({ relationshipStatus: "Do Not Contact" })),
    false
  );
});

test("irrelevant clinics are excluded", () => {
  assert.equal(
    isClinicSearchable(
      clinic({
        name: "Dental Clinic",
        clinicType: "Dental",
        servicesOffered: ["Teeth whitening"],
        publicNotes: "",
      })
    ),
    false
  );
});

test("payment completed but awaiting approval does not activate partner status", () => {
  assert.equal(
    paymentAllowsPartnerActivation(
      { status: "completed-awaiting-approval" },
      false
    ),
    false
  );
});

test("approved clinic with active payment can be activated", () => {
  assert.equal(paymentAllowsPartnerActivation({ status: "active" }, true), true);
});

test("cancelled subscription does not activate partner status", () => {
  assert.equal(
    paymentAllowsPartnerActivation({ status: "cancelled" }, true),
    false
  );
});

test("failed payment does not activate partner status", () => {
  assert.equal(paymentAllowsPartnerActivation({ status: "failed" }, true), false);
});
