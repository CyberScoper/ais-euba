# Security

This app signs into a university account on a student's behalf and keeps that session
for weeks. If you find a way to read someone else's data, act on AIS through this
proxy, or run code in its origin, that is worth reporting.

## Reporting

Open a [private security advisory](https://github.com/CyberScoper/ais-euba/security/advisories/new)
on GitHub. If you cannot, open a normal issue with the words "security" in the title and
no details, and I will come back with somewhere private to send them.

This is a one-person project with no bounty and no SLA. What you will get is an
acknowledgement within a few days, a fix or an honest "won't fix, and here is why",
and credit in the commit unless you would rather not have it.

## What counts

In scope: anything that crosses a session boundary (one signed-in person reaching
another's data), XSS or CSP bypass, reaching an AIS endpoint the allowlist does not
name, extracting a stored credential, or turning this proxy into traffic AIS would
call abusive.

Out of scope by design, and stated on the sign-in screen before anyone types a
password:

- **A remembered password is recoverable by whoever controls the server.** It is
  sealed with AES-256-GCM, but the key sits on the same machine. That is protection
  against a stolen backup, not against root. Untick "stay signed in" and the password
  never touches the disk.
- **Whoever runs an instance can read everything that passes through it.** This is why
  the README tells people to self-host rather than to use someone else's instance.
- Anything that needs the attacker to already have the server, the session cookie, or
  the student's AIS password.

## Running it safely

- Terminate TLS in front of it; the app binds to localhost.
- Leave `AIS_RAW` unset. It enables a read-only passthrough that exists only for
  calibrating adapters against live responses.
- Keep the state directory at `0700` and its key file at `0600` — the app enforces
  both on start, and refuses to overwrite a key it cannot parse.
- Do not run it as root if you can avoid it, and give it the systemd unit in `deploy/`,
  which drops every capability and mounts the filesystem read-only apart from state.
