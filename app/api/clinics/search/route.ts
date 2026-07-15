import { NextRequest, NextResponse } from "next/server";
import { clinicConfig, isLikelyMetroPostcode } from "@/lib/clinics/config";
import { sendFreeListingNotification } from "@/lib/clinics/email";
import { searchClinics } from "@/lib/clinics/search";
import {
  createImpressionId,
  recordClinicSearchImpressions,
} from "@/lib/clinics/store";
import type { Clinic, ClinicSearchImpression } from "@/lib/clinics/types";
import { fetchClinicsNearSearch } from "@/lib/clinics/supabase";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const postcode =
      typeof body.postcode === "string"
        ? body.postcode.replace(/\D/g, "").slice(0, 4)
        : undefined;
    const latitude =
      typeof body.latitude === "number" ? body.latitude : undefined;
    const longitude =
      typeof body.longitude === "number" ? body.longitude : undefined;

    let clinics: Clinic[] = [];
    const radiusKm = isLikelyMetroPostcode(postcode)
      ? clinicConfig.metroRadiusKm
      : clinicConfig.regionalRadiusKm;

    try {
      clinics = await fetchClinicsNearSearch({
        postcode,
        latitude,
        longitude,
        radiusKm,
      });
    } catch (error) {
      console.error("Clinic lookup failed", error);
      return NextResponse.json({
        results: [],
        source: "unknown",
        radiusKm,
        usedFallback: false,
        message:
          "We could not load nearby clinics at this time. You can still download or email your SkinChecker report.",
      });
    }

    const response = searchClinics(clinics, {
      postcode,
      latitude,
      longitude,
      reportId: typeof body.reportId === "string" ? body.reportId : undefined,
      skinScoreCategory:
        typeof body.skinScoreCategory === "string"
          ? body.skinScoreCategory
          : undefined,
    });

    const impressions: ClinicSearchImpression[] = response.results.map(
      (result) => ({
        impressionId: createImpressionId(),
        clinicDatabaseId: result.clinic.id,
        clinicId: result.clinic.clinicId,
        clinicUuid: result.clinic.clinicUuid,
        searchTimestamp: new Date().toISOString(),
        userPostcode: postcode,
        approximateSearchLatitude: response.searchedLatitude,
        approximateSearchLongitude: response.searchedLongitude,
        distanceKm: result.distanceKm ?? undefined,
        listingTypeShown: result.listingType,
        relationshipStatusAtTime: result.clinic.relationshipStatus,
        preferredPartnerStatusAtTime: result.listingType === "preferred",
        searchRadiusKm: response.radiusKm,
        searchResultPosition: result.position,
        skinCheckerReportId:
          typeof body.reportId === "string" ? body.reportId : undefined,
        skinScoreRangeOrRiskCategory:
          typeof body.skinScoreCategory === "string"
            ? body.skinScoreCategory
            : undefined,
        websiteClicked: false,
        bookingLinkClicked: false,
        phoneClicked: false,
        profileViewed: false,
        impressionNotificationEmailSent: false,
        upgradeEmailSent: false,
      })
    );

    await recordClinicSearchImpressions(impressions);

    await Promise.all(
      response.results.map(async (result, index) => {
        result.impressionId = impressions[index]?.impressionId;
        if (result.listingType === "free" && impressions[index]) {
          await sendFreeListingNotification(result.clinic, impressions[index]);
        }
      })
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("clinic search error", error);
    return NextResponse.json(
      {
        error:
          "We could not load nearby clinics at this time. You can still download or email your SkinChecker report.",
      },
      { status: 500 }
    );
  }
}
