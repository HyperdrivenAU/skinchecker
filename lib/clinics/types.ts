export type ClinicRelationshipStatus =
  | "Preferred Partner"
  | "Free Listing"
  | "preferred"
  | "free"
  | "suspended"
  | "do_not_contact"
  | "Do Not Contact"
  | "Inactive"
  | "inactive"
  | string;

export type Clinic = {
  id?: string;
  clinicId?: string;
  clinicUuid?: string;
  name: string;
  clinicType?: string;
  relationshipStatus?: ClinicRelationshipStatus;
  active: boolean;
  displayInApp: boolean;
  address?: string;
  addressLine1?: string;
  addressLine2?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  googlePlaceId?: string;
  phone?: string;
  email?: string;
  emailSource?: string;
  emailStatus?: string;
  emailLastCheckedAt?: string;
  emailLookupUrl?: string;
  website?: string;
  bookingUrl?: string;
  contactPerson?: string;
  contactRole?: string;
  contactMobile?: string;
  contactEmail?: string;
  servicesOffered?: string[];
  acceptingNewPatients?: boolean;
  billingType?: string;
  typicalSkinCheckFee?: string;
  referralFee?: string;
  referralCode?: string;
  priorityLevel?: number;
  displayBookingButton?: boolean;
  publicNotes?: string;
  internalNotes?: string;
  salesStatus?: string;
  source?: string;
  googleRating?: number;
  googleReviews?: number;
  lastVerified?: string;
  logoOrImage?: string;
  bookingEnabled?: boolean;
  priority?: number;
  claimed?: boolean;
  subscriptionPlan?: string;
};

export type ClinicListingType = "preferred" | "free";

export type ClinicSearchInput = {
  postcode?: string;
  latitude?: number | null;
  longitude?: number | null;
  reportId?: string;
  skinScoreCategory?: string;
};

export type ClinicSearchResult = {
  clinic: Clinic;
  distanceKm: number | null;
  listingType: ClinicListingType;
  position: number;
  impressionId?: string;
};

export type ClinicSearchResponse = {
  results: ClinicSearchResult[];
  source: "device" | "postcode" | "manual-postcode" | "unknown";
  radiusKm: number;
  usedFallback: boolean;
  searchedLatitude?: number;
  searchedLongitude?: number;
  message?: string;
};

export type ClinicSearchImpression = {
  impressionId: string;
  clinicDatabaseId?: string;
  clinicId?: string;
  clinicUuid?: string;
  searchTimestamp: string;
  userPostcode?: string;
  approximateSearchLatitude?: number;
  approximateSearchLongitude?: number;
  distanceKm?: number;
  listingTypeShown: ClinicListingType;
  relationshipStatusAtTime?: string;
  preferredPartnerStatusAtTime: boolean;
  searchRadiusKm: number;
  searchResultPosition: number;
  skinCheckerReportId?: string;
  skinScoreRangeOrRiskCategory?: string;
  websiteClicked: boolean;
  bookingLinkClicked: boolean;
  phoneClicked: boolean;
  profileViewed: boolean;
  impressionNotificationEmailSent: boolean;
  impressionNotificationEmailSentDate?: string;
  upgradeEmailSent: boolean;
  upgradeEmailSentDate?: string;
};

export type ClinicClickAction =
  | "website"
  | "booking"
  | "phone"
  | "profile";

export type ClinicApplicationPayload = {
  path: "claim-existing" | "register-new";
  clinicName: string;
  clinicId?: string;
  contactFirstName: string;
  contactLastName: string;
  contactRole: string;
  contactEmail: string;
  contactMobile: string;
  clinicPhone?: string;
  clinicEmail?: string;
  clinicWebsite?: string;
  bookingUrl?: string;
  clinicAddress: string;
  servicesOffered?: string;
  billingType?: string;
  logoUploadName?: string;
  authorised: boolean;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  plan: "standard" | "foundation";
};
