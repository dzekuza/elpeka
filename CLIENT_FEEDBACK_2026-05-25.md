# Client feedback — 2026-05-25 (Elpekas)

Source: email from `marketingas@elpekas.lt`, subject "Re: Užklausa dėl klientų portalo kūrimo".

---

## Summary (what the client is asking for)

### Brand / global
- New neutral background `#e1e1e1` everywhere (login page + inside the portal).
- New primary / accent colour `#c4ac7e` (used on the primary button and the "Forgot password" link).
- Add social media icons on the login page footer.
- Login page should mimic competitors: large building photo on the left, login form on the right. Reference image asset: <https://we.tl/t-MArS3L0VNqNRMkKw>.

### Login page (`/login`, `/forgot-password`)
- Login subtitle copy: *"Įveskite savo el. pašto adresą ir slaptažodį, kad prisijungtumėte. Jungiantis pirmą kartą, naudokite Elpekas suteiktus prisijungimo duomenis."*
- Forgot-password copy: *"Nurodykite savo el. pašto adresą ir juo gausite nuorodą slaptažodžiui atkurti."*

### Owner: Pagrindinis (`/portal/pagrindinis`)
- Background `#e1e1e1`.
- Step explainer: *"Žalia spalva pažymėti žingsniai reikš, kad visi būtini dokumentai yra sėkmingai įkelti ir pasiekiami peržiūrai."*
- Progress label: change "Atlikite veiksmus" → **"Atlikite žingsnius"**.
- Step body copy:
  - **Mokėjimai** — "čia yra gautų mokėjimų dokumentai"
  - **Banko sutartis ir turto vertinimas** — "Įkelkite banko sutartį ir turto vertinimo ataskaitą"
  - **Kadastrinių matavimų byla** — "Čia yra jūsų objekto kadastrinių matavimų byla"
  - **Notarinė pirkimo–pardavimo sutartis** — "čia yra jūsų notarinė objekto pirkimo-pardavimo sutartis"
  - **Registrų centro išrašas** — "Įkelkite Registrų centro objekto išrašą"
  - **Pakvitavimas** — "Čia rasite notarinį pakvitavimą" — **upload restricted to admin only**.
  - **Papildomi dokumentai** — "Įkelkite papildomus su objektu susijusius dokumentus."

### Owner: Defektai ir pastabos (`/portal/defektai`)
- Rename page from "Defektai" → **"Defektai ir pastabos"**.
- Put a card/border around the "Sekti eigą" section (currently looks unfinished).
- Description placeholder: *"Išsamiai aprašykite defektą: vietą, aplinkybes, pastabas."*
- File dropzone label: change "vilkite nuotraukas arba spauskite pasirinkti" → **"Įkelti nuotrauką"**.
- Allow **video uploads** in addition to photos (don't need to advertise it in copy).
- "Sekti eigą" info tooltip: single sentence — *"Defektas yra sprendžiamas."*

### Owner: Objekto nuotraukos (`/portal/nuotraukos`)
- Current implementation doesn't match the agreed design. Must have **two distinct gallery sections**:
  1. **Statybų eigos nuotraukos** — "Nuotraukos, dokumentuojančios buto įrengimo eigą ir techninius darbus statybų metu."
  2. **Galutinės buto nuotraukos** — "Galutinės buto nuotraukos, užfiksuotos prieš perduodant turtą savininkui."
- Each section shows count + "Atnaujinta {date}" + "Peržiūrėti visas" button. Empty state shows upload CTA.

### Owner: Paslaugų teikimo sutartys (`/portal/sutartys`)
- Lead copy: *"Užbaikite likusius žingsnius, kad pilnai įvykdytumėte savo sutartinius įsipareigojimus."*
- Per-service copy (same template):
  - **Elektra** — "Prašome sudaryti sutartį su pasirinktu elektros tiekėju. Pažymėkite šį žingsnį kaip užbaigtą, kai paslauga bus aktyvuota."
  - **Vanduo** — analogous, water provider.
  - **Šildymas** — analogous, heating provider.
  - **Atliekų išvežimas** — analogous, waste company. **No meter number field for waste.**

### Owner: Rangovai ir kontaktai (`/portal/kontaktai`)
- Rename page "Kontaktai" → **"Rangovai ir kontaktai"**.
- Final copy pending — client will review once the page is fully built.
- Open question: admin needs to be able to assign contacts **per project (estate)**, since contractors differ between projects.

### Admin: Estate / Unit editor (`/admin/estates/[id]/units/[unitId]`)
- Adding a unit: add a **"Parkingai"** field that accepts **letters + numbers** (e.g. `P-12A`).
- Remove from technical data tab: **Šildymo tipas, Statybinės medžiagos, Grindų danga**.
- With those gone, **remove the Financial data tab entirely**.
- Need a UI to **assign which onboarding steps each owner sees** (e.g. cash buyers should not see "Banko sutartis ir turto vertinimas").

### Admin: Defektai (`/admin/defects/[id]`)
- Client is unsure whether changing defect status to "Atlikta" auto-saves. Either make auto-save explicit (toast confirmation) or add an explicit "Išsaugoti" button.

### Notifications (cross-cutting)
- When owner submits a new defect → email `administracija@elpekas.lt`.
- **Do NOT** notify the owner when admin replies to a defect.
- Reminder email to owner if service contracts (`unit_services`) remain unsigned — with an **admin toggle to mute** these (if internal blockers prevent the owner from signing). Still under discussion — make the toggle even if scheduling is deferred.

---

## Prompt to feed Claude Code (copy/paste below)

````markdown
You are working on the ELPEKAS Next.js 16 / Supabase project at /Users/rysardgvozdovic/Desktop/projects/elpeka.
Read CLAUDE.md and AGENTS.md first. Then implement the client-feedback changes below.
All UI copy is Lithuanian — keep it verbatim. Verify with `npm run build` after each major chunk; the build must stay clean (currently 21 routes, 0 errors).

## 1. Design tokens (do this first, single source of truth)
Edit the global stylesheet (likely `app/globals.css` or the Tailwind theme file):
- Set `--background` to `#e1e1e1` (apply to login + portal + admin shells).
- Set `--primary` to `#c4ac7e`. Keep all other tokens.
- Audit all components: NO hardcoded hex/oklch in JSX/TSX. Replace any stragglers with the CSS variables (see CLAUDE.md "Design System Rules").

## 2. Login pages
Files: the login route components under `app/login/`, `app/forgot-password/`, plus any shared login layout.
- Two-column layout on desktop: left = large building photo, right = login card. Mobile = stacked.
- Photo asset to download from https://we.tl/t-MArS3L0VNqNRMkKw — save to `public/images/login-hero.jpg` (ask user to drop the file in `public/images/` if the WeTransfer link is expired).
- Login form subtitle: "Įveskite savo el. pašto adresą ir slaptažodį, kad prisijungtumėte. Jungiantis pirmą kartą, naudokite Elpekas suteiktus prisijungimo duomenis."
- Forgot-password subtitle: "Nurodykite savo el. pašto adresą ir juo gausite nuorodą slaptažodžiui atkurti."
- Primary button uses `--primary` (#c4ac7e). "Pamiršote slaptažodį?" link also uses `--primary`.
- Footer: social icons (Facebook, Instagram, LinkedIn — use `lucide-react`). Link targets can be `#` placeholders for now.

## 3. Portal — Pagrindinis (`app/portal/pagrindinis/page.tsx`)
- Apply `#e1e1e1` background.
- Replace step explainer line with: "Žalia spalva pažymėti žingsniai reikš, kad visi būtini dokumentai yra sėkmingai įkelti ir pasiekiami peržiūrai."
- Progress scale label: "Atlikite žingsnius" (was "Atlikite veiksmus").
- For each step card, set the body copy verbatim:
  - Mokėjimai → "čia yra gautų mokėjimų dokumentai"
  - Banko sutartis ir turto vertinimas → "Įkelkite banko sutartį ir turto vertinimo ataskaitą"
  - Kadastrinių matavimų byla → "Čia yra jūsų objekto kadastrinių matavimų byla"
  - Notarinė pirkimo–pardavimo sutartis → "čia yra jūsų notarinė objekto pirkimo-pardavimo sutartis"
  - Registrų centro išrašas → "Įkelkite Registrų centro objekto išrašą"
  - Pakvitavimas → "Čia rasite notarinį pakvitavimą". **Owners must NOT see an upload control here — admin-only upload.** Gate the upload UI on `user.user_metadata.role === 'admin'` (this page is owner-only, so hide entirely for owners; mirror the upload control to the admin Documents tab).
  - Papildomi dokumentai → "Įkelkite papildomus su objektu susijusius dokumentus."

## 4. Portal — Defektai ir pastabos (`app/portal/defektai/page.tsx` + child components)
- Page title: "Defektai ir pastabos" (was "Defektai"). Update sidebar nav label and any breadcrumb.
- Description textarea placeholder: "Išsamiai aprašykite defektą: vietą, aplinkybes, pastabas."
- File dropzone label: "Įkelti nuotraukos" — accept video MIME types in addition to images. Update the server action `uploadDefectAttachment` and Supabase storage policies as needed to accept `video/*`.
- Wrap the "Sekti eigą" timeline in a `Card` (shadcn) with subtle border + padding.
- Tooltip / info text next to "Sekti eigą": "Defektas yra sprendžiamas." (single sentence, replace whatever is there).

## 5. Portal — Objekto nuotraukos (`app/portal/nuotraukos/page.tsx`)
Rebuild to match the reference layout. Two stacked gallery cards:
1. **Statybų eigos nuotraukos** — subtitle "Nuotraukos, dokumentuojančios buto įrengimo eigą ir techninius darbus statybų metu."
2. **Galutinės buto nuotraukos** — subtitle "Galutinės buto nuotraukos, užfiksuotos prieš perduodant turtą savininkui."

Each card shows:
- Header with title + subtitle + right-aligned "Įkelti nuotrauką" button (admin only — for owners hide the button).
- Thumbnail grid (max ~6 visible, then "+N").
- Footer "{count} photos · Atnaujinta {dd MMM yyyy}" on the left, "Peržiūrėti visas" outline button on the right.
- Empty state: centred "Nuotraukų nėra" + "Įkelkite nuotraukas, kad užfiksuotumėte šį etapą" + upload CTA.

Schema change: add a `category` column to the `documents` table (or new `unit_photos` table) with values `'progress' | 'final'`. Create migration `009_unit_photo_categories.sql`. Update server action `uploadUnitPhoto` to accept the category. Update the admin Photos tab to set category on upload.

## 6. Portal — Paslaugų teikimo sutartys (`app/portal/sutartys/page.tsx`)
- Page lead: "Užbaikite likusius žingsnius, kad pilnai įvykdytumėte savo sutartinius įsipareigojimus."
- Per-service body templated as:
  - Elektra: "Prašome sudaryti sutartį su pasirinktu elektros tiekėju. Pažymėkite šį žingsnį kaip užbaigtą, kai paslauga bus aktyvuota."
  - Vanduo: "Prašome sudaryti sutartį su vandens tiekėju. Pažymėkite šį žingsnį kaip užbaigtą, kai paslauga bus aktyvuota."
  - Šildymas: "Prašome sudaryti sutartį su šilumos tiekėju. Pažymėkite šį žingsnį kaip užbaigtą, kai paslauga bus aktyvuota."
  - Atliekų išvežimas: "Prašome sudaryti sutartį su atliekų išvežimo įmone. Pažymėkite šį žingsnį kaip užbaigtą, kai paslauga bus aktyvuota."
- For `category === 'waste'`, hide the `meter_number` field in both portal and admin UIs. No schema change required — just conditional rendering.

## 7. Portal — Rangovai ir kontaktai (`app/portal/kontaktai/page.tsx`)
- Rename to "Rangovai ir kontaktai" in the page heading, sidebar nav, and bottom-nav.
- Add a relation `estate_contacts (estate_id uuid, contact_id uuid, primary key (estate_id, contact_id))` so the same contact library can be assigned per estate. Migration `010_estate_contacts.sql`.
- Admin UI: on `/admin/estates/[id]` add a "Kontaktai" tab/section where admin picks which contacts from the library belong to that estate.
- Portal: only show contacts assigned to the owner's estate (`owner_unit_id()` → unit → estate → estate_contacts).

## 8. Admin — Unit editor (`app/admin/estates/[id]/units/[unitId]/`)
- Unit create/edit form: add `Parkingai` text field (string, accepts `^[A-Za-z0-9-]+$`). Migration `011_unit_parking.sql` — add `parking text` column to `units`.
- Technical tab: remove fields `heating_type`, `building_materials`, `floor_covering`. Keep `rooms`, `total_area`, `living_area`, `construction_year`. Update `TechnicalData` type in `lib/types.ts` and the form schema.
- Remove the Financial tab entirely. Drop `financial_data` column? **Do NOT drop the column** — just hide the tab and stop reading/writing it (safer rollback). Add a TODO in code.
- Add an "Owner journey steps" picker: a checklist of the 7 steps (Mokėjimai, Banko sutartis…, etc.) on the owner record (`unit_owners`). Migration `012_owner_step_visibility.sql` adds `visible_steps text[]` to `unit_owners` with default = all 7 keys. Portal `/portal/pagrindinis` filters steps by `visible_steps`.

## 9. Admin — Defektai status save
- On status change (`updateDefectStatus`), keep auto-save BUT add a `sonner` toast: "Defekto statusas atnaujintas". Make the save state visible (button shows spinner, then green check).

## 10. Notifications
- New Server Action / Resend email: when `submitDefect` succeeds, send an email to `administracija@elpekas.lt` with defect title, owner name, unit, and a deep-link to `/admin/defects/[id]`. Use the existing Resend integration from `invitations.ts`.
- Remove any existing "admin replied" email to owner (or make sure none is being sent).
- Add a scheduled job spec (don't build the cron yet — leave a TODO + Server Action stub `sendServiceContractReminders()`) that emails owners with unfinished `unit_services`. Add `notifications_enabled boolean default true` column to `unit_owners` (migration `013_owner_notification_toggle.sql`) and expose a toggle in the admin owner row.

## Acceptance
- `npm run build` clean.
- `npm run lint` clean.
- No hardcoded colours in JSX/TSX (grep for `#[0-9a-fA-F]{6}` and `oklch(`).
- All Lithuanian copy matches the strings above exactly (including punctuation and capitalisation).
- All new migrations are numbered sequentially starting from 009 and never edit applied ones.
- For each section above, show me a diff summary + the migration SQL before applying.
````

---

## Open questions to confirm with the client before / during build

1. **Photo asset** — WeTransfer links expire after a week; if the link is dead, ask Elpekas to re-share or upload directly to the project.
2. **Video uploads in defects** — confirm max file size and Supabase storage bucket quota; defaults assume <50 MB per clip.
3. **Per-estate contacts** — confirm whether a contact can belong to multiple estates (many-to-many) or just one (one-to-many). Implementation above assumes many-to-many.
4. **Notification toggle scope** — confirm whether the "mute reminder" toggle is per-owner or per-estate.
5. **Financial data** — confirm we can leave the column in the database (hidden in UI) rather than dropping it.
