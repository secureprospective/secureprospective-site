# Observed 2026-08-27: podman containers on Beelink have no outbound network

**Reported, not fixed.** Beelink's standing instructions say CT105 acts on this box
and that unexpected state is to be observed, written down and reported rather than
corrected. Nothing here was changed on the host.

## What was seen

A container build that had worked earlier in the day failed with DNS errors against
every repository. From inside a container on the default `podman` bridge
(`10.88.0.0/16`):

- `getent hosts mirrors.fedoraproject.org` fails.
- A TCP connection to `1.1.1.1:53` fails.
- An HTTPS request straight to a literal IP fails.
- An HTTP request to the LAN gateway `192.168.1.1` fails.

So it is not a resolver problem. The container has no outbound connectivity at all.

## What was ruled out

- **Host networking.** The host resolves `mirrors.fedoraproject.org` and fetches
  `https://registry.npmjs.org/` with a 200.
- **IP forwarding.** `/proc/sys/net/ipv4/ip_forward` is `1`.
- **firewalld.** `systemctl is-active firewalld` reports `inactive`.
- **Resolver configuration.** Host and container both carry `nameserver 1.1.1.1`.

That points at masquerade/NAT for the podman bridge. It was NOT confirmed:
`sudo -n` on Beelink is scoped to podman only, so `nft list ruleset` could not be
read, and no attempt was made to escalate.

One detail worth noting for whoever picks this up: `podman network inspect podman`
showed the network with a `created` timestamp from the moment of inspection, which
suggests the network object had been absent and was recreated on demand.

## Why it mattered

`podman build --network host` builds normally, and that is what SP+ cycles now use.

The trap is quieter than the failure. The DN-24 build **reported success** while this
was broken, because every `dnf`-touching layer came from cache and only file-assertion
layers actually re-ran. Its gates are real, but a cold rebuild could not have produced
them. Any green build on this box between the breakage and this note should be treated
as cache-assisted until rebuilt with `--network host`.
