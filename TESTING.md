# Running the „carte” flow end to end, locally

The whole path — a student applies, the committee approves, the „carte” publishes
availability, a student books it — needs both repos running against a real
database. Staging works too, but you need an admin account there; locally you can
make one.

## 1. Database

```bash
cd amicus-api
docker compose up -d                       # Postgres on :5433
dotnet tool restore
dotnet dotnet-ef database update -p src/Amicus.Infrastructure -s src/Amicus.Api
```

Docker Desktop is not set to auto-start, so start it first.

## 2. API, with an admin

`Bootstrap__AdminEmails__0` grants the Admin role **at startup only**, so the
account has to exist before the run that promotes it. Register first, then
restart — this catches everyone once.

```bash
Bootstrap__AdminEmails__0="admin@amicus.local" dotnet run --project src/Amicus.Api --urls http://localhost:5080
```

Register `admin@amicus.local` (below), stop the API, start it again with the same
variable. The log then says `Granted Admin to admin@amicus.local.`

## 3. Web, pointed at the local API

```bash
cd amicus-web
AMICUS_API_PROXY=http://localhost:5080 bun run dev --port 5173 --strictPort
```

Keep `--strictPort`. Without it a leftover dev server keeps 5173, the new one
silently takes 5174, and the browser goes on talking to the old proxy target —
which looks exactly like a login bug.

## 4. Walk the flow

Accounts: register from the UI at `/inregistrare`. Any password of 10+ characters.

1. **Apply.** Sign in as a student → `/setari` → *"Vrei să devii o «carte»?"* →
   fill the form → it flips to **ÎN ANALIZĂ**.
2. **Approve.** Sign in as `admin@amicus.local` → `/admin` → the application is in
   the queue with its story and both tags → **Aprobă**.
3. **Roster.** Still on `/admin`, under *Cărțile lunii*, pick the „carte” from the
   event's dropdown → **Adaugă**. Skipping this is the usual reason a „carte”
   cannot publish anything: every interval is refused because no event covers the
   date. Publish the event too if it is still a draft.
4. **Publish availability.** Sign back in as the „carte” → the avatar now has a
   red ring → *Disponibilitatea mea* → pick a day → set a start time and a
   duration → **Adaugă un interval**.
5. **Book.** As any other student, open the calendar and take the slot.

## Things that will trip you up

- **Two events covering the same date** makes publishing fail with "that date
  falls in more than one event". That is deliberate — publishing into the wrong
  event puts the slot on a board nobody is looking at. Narrow the event ranges.
- **An unpublished event** is invisible to students, so a „carte” can publish
  intervals nobody can book. The console shows `CIORNĂ` and offers to publish it.
- **Times are built in the browser's timezone.** Correct while everyone is in
  Romania, which is the event zone; publishing from abroad would need the server
  to do the conversion.
- **A booked interval has no Retrage button.** That is not a bug — a student is
  expecting the meeting, so cancelling goes through a person.
