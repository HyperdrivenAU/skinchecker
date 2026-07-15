import { NextRequest, NextResponse } from "next/server";
import { clinicConfig, isLikelyMetroPostcode } from "@/lib/clinics/config";
import { findNearbyClinicsWithFallback } from "@/lib/clinics/directory";
import { sendFreeListingNotification } from "@/lib/clinics/email";
import {
  createImpressionId,
  recordClinicSearchImpressions,
} from "@/lib/clinics/store";
import type { ClinicSearchImpression } from "@/lib/clinics/types";

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

    const radiusKm = isLikelyMetroPostcode(postcode)
      ? clinicConfig.metroRadiusKm
      : clinicConfig.regionalRadiusKm;
    let response;

    try {
      response = await findNearbyClinicsWithFallback({
        postcode,
        latitude,
        longitude,
        radiusKm,
        reportId: typeof body.reportId === "string" ? body.reportId : undefined,
        skinScoreCategory:
          typeof body.skinScoreCategory === "string"
            ? body.skinScoreCategory
            : undefined,
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
