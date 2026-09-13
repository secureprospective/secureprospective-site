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
    // Built as v0.11.4; 0.11 is how the release is named to members. The image
    // itself still reports "SP+ 1 (20260913)" -- Christopher's call on
    // 2026-09-13 was to publish rather than rebuild for a version string.
    id: "0.11",
    label: "SP+ 0.11",
    key: "sp-plus/sp-plus-0.11.iso",
    filename: "sp-plus-0.11.iso",
    size: 5520687104,
    sha256: "a793df68e7f21cea274d139ef9b3aca375f7545bba9a38ddb79945d863cc562b",
    released: "2026-09-13",
    note: "Install to a spare machine, not your working laptop.",
    // STAGED, NOT LIVE. The object is still uploading to R2; the bucket was
    // empty when this entry was written. Publishing now would put a download
    // button in front of members that streams nothing. Flip to true only after
    // `publish-iso-r2.sh verify` reports the object present at the size above.
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
