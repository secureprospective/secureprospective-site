/**
 * functions/_lib/releases.ts
 * -----------------------------------------------------------------------
 * The SP+ release manifest, committed to the repo on purpose.
 *
 * The obvious alternative is to list the R2 bucket at request time and let
 * the page render whatever objects are in it. That is rejected: it would
 * publish anything anyone ever uploads to that bucket, including a
 * half-finished multipart upload, to every signed-in member.
 *
 * The sha256 is likewise committed rather than read back from R2. R2 does
 * not return a whole-object sha256 for a multipart upload -- its checksum
 * covers the parts, not the file an advisor ends up with on disk. The only
 * sha256 worth printing is the one the build computed over the finished
 * ISO, so that is the one that lives here. Adding a release is a commit,
 * reviewed like any other change.
 */

export interface Release {
  /** URL-safe id, also the ?v= value. */
  id: string;
  /** What the advisor sees. */
  label: string;
  /** Object key in the R2 bucket. */
  key: string;
  /** Filename the browser saves as. */
  filename: string;
  /** Bytes, from the build. Used for the page and as a sanity check on R2. */
  size: number;
  /** sha256 of the finished ISO, computed by the build. */
  sha256: string;
  /** ISO date the build was cut. */
  released: string;
  /** One line: who this build is for. */
  note: string;
  /** Hidden from the list until true. Lets a release land before it is announced. */
  published: boolean;
}

export const RELEASES: Release[] = [
  {
    id: "0.10-alpha",
    label: "SP+ Alpha v0.10",
    key: "sp-plus/sp-plus-0.10-alpha.iso",
    filename: "sp-plus-0.10-alpha.iso",
    size: 5452943360,
    sha256: "5e10d090d07b28b6809003b12fa5f65a8a0b51630121349916ec2d95ecc8d221",
    released: "2026-09-09",
    note: "The first alpha release. Install it on a spare machine, not the one you run your practice on.",
    // Stays false until the ISO is actually in the R2 bucket. Flipping it
    // first would put a Download button in the back office that answers
    // "That build is no longer available" -- a member cannot tell that
    // apart from a build that was pulled.
    published: false,
  },
];

export function findRelease(id: string | null): Release | undefined {
  if (!id) return undefined;
  return RELEASES.find((r) => r.id === id && r.published);
}

export function publishedReleases(): Release[] {
  return RELEASES.filter((r) => r.published);
}
