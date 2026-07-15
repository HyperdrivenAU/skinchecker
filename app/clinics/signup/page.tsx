"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const inputClass =
  "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-100";

export default function ClinicSignupPage() {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setStatus("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      path: formData.get("path"),
      plan: formData.get("plan"),
      clinicName: formData.get("clinicName"),
      clinicId: formData.get("clinicId"),
      contactFirstName: formData.get("contactFirstName"),
      contactLastName: formData.get("contactLastName"),
      contactRole: formData.get("contactRole"),
      contactEmail: formData.get("contactEmail"),
      contactMobile: formData.get("contactMobile"),
      clinicPhone: formData.get("clinicPhone"),
      clinicEmail: formData.get("clinicEmail"),
      clinicWebsite: formData.get("clinicWebsite"),
      bookingUrl: formData.get("bookingUrl"),
      clinicAddress: formData.get("clinicAddress"),
      servicesOffered: formData.get("servicesOffered"),
      billingType: formData.get("billingType"),
      logoUploadName: (formData.get("logoUpload") as File | null)?.name,
      authorised: formData.get("authorised") === "on",
      acceptedTerms: formData.get("acceptedTerms") === "on",
      acceptedPrivacy: formData.get("acceptedPrivacy") === "on",
    };

    try {
      const response = await fetch("/api/clinics/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Application failed.");
      setStatus(data.message);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "We could not submit the application."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Image
          src="/logo.png"
          alt="SkinChecker.app"
          width={260}
          height={64}
          priority
          className="mb-10"
        />
        <h1 className="text-4xl font-bold tracking-tight text-slate-950">
          Preferred Partner application
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-700">
          Submit your clinic details for review. A Preferred Partner listing is
          activated only after payment is completed and clinic authority is
          approved.
        </p>

        <form onSubmit={submitApplication} className="mt-10 space-y-8">
          <fieldset className="space-y-4">
            <legend className="text-xl font-bold text-slate-900">
              Listing path
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="rounded-2xl border border-slate-200 p-4">
                <input
                  type="radio"
                  name="path"
                  value="claim-existing"
                  defaultChecked
                  className="mr-2"
                />
                Claim an existing clinic
              </label>
              <label className="rounded-2xl border border-slate-200 p-4">
                <input
                  type="radio"
                  name="path"
                  value="register-new"
                  className="mr-2"
                />
                Register a new clinic
              </label>
            </div>
          </fieldset>

          <fieldset className="grid gap-5 sm:grid-cols-2">
            <legend className="col-span-full text-xl font-bold text-slate-900">
              Clinic details
            </legend>
            <label>
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Clinic Name
              </span>
              <input name="clinicName" required className={inputClass} />
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Clinic ID
              </span>
              <input name="clinicId" className={inputClass} />
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Clinic Phone
              </span>
              <input name="clinicPhone" type="tel" className={inputClass} />
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Clinic Email
              </span>
              <input name="clinicEmail" type="email" className={inputClass} />
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Clinic Website
              </span>
              <input name="clinicWebsite" type="url" className={inputClass} />
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Booking URL
              </span>
              <input name="bookingUrl" type="url" className={inputClass} />
            </label>
            <label className="sm:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Clinic Address
              </span>
              <textarea name="clinicAddress" required className={inputClass} />
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Services Offered
              </span>
              <input name="servicesOffered" className={inputClass} />
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Billing Type
              </span>
              <select name="billingType" className={inputClass}>
                <option value="">Select billing type</option>
                <option>Private billing</option>
                <option>Mixed billing</option>
                <option>Bulk billing available</option>
              </select>
            </label>
            <label className="sm:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Logo upload
              </span>
              <input
                name="logoUpload"
                type="file"
                accept="image/*"
                className={inputClass}
              />
            </label>
          </fieldset>

          <fieldset className="grid gap-5 sm:grid-cols-2">
            <legend className="col-span-full text-xl font-bold text-slate-900">
              Contact details
            </legend>
            <input
              name="contactFirstName"
              required
              placeholder="Contact First Name"
              className={inputClass}
            />
            <input
              name="contactLastName"
              required
              placeholder="Contact Last Name"
              className={inputClass}
            />
            <input
              name="contactRole"
              required
              placeholder="Contact Role"
              className={inputClass}
            />
            <input
              name="contactEmail"
              required
              type="email"
              placeholder="Contact Email"
              className={inputClass}
            />
            <input
              name="contactMobile"
              required
              type="tel"
              placeholder="Contact Mobile"
              className={inputClass}
            />
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-xl font-bold text-slate-900">Plan</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="rounded-2xl border border-slate-200 p-4">
                <input
                  type="radio"
                  name="plan"
                  value="standard"
                  defaultChecked
                  className="mr-2"
                />
                Standard Preferred Partner
              </label>
              <label className="rounded-2xl border border-slate-200 p-4">
                <input
                  type="radio"
                  name="plan"
                  value="foundation"
                  className="mr-2"
                />
                Foundation Partner, if available
              </label>
            </div>
          </fieldset>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <label className="flex gap-3">
              <input name="authorised" required type="checkbox" />
              <span>I am authorised to represent this clinic.</span>
            </label>
            <label className="flex gap-3">
              <input name="acceptedTerms" required type="checkbox" />
              <span>
                I accept the{" "}
                <Link href="/clinics/terms" className="font-semibold text-sky-700">
                  Clinic Partner Terms
                </Link>
                .
              </span>
            </label>
            <label className="flex gap-3">
              <input name="acceptedPrivacy" required type="checkbox" />
              <span>
                I accept the{" "}
                <Link href="/privacy" className="font-semibold text-sky-700">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-sky-600 py-5 text-lg font-semibold text-white shadow-lg disabled:bg-slate-300"
          >
            {submitting ? "Submitting..." : "Submit application"}
          </button>

          {status && (
            <p className="rounded-2xl bg-green-50 p-4 text-green-700">{status}</p>
          )}
          {error && (
            <p className="rounded-2xl bg-red-50 p-4 text-red-700">{error}</p>
          )}
        </form>
      </div>
    </main>
  );
}
