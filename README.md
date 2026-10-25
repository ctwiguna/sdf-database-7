# Future Skill

Future Skill is a mobile learning platform for practical future skills. Students follow ordered video courses, track their learning progress, and continue from the first unfinished lesson. Mentors curate the syllabus, and admins publish courses and read progress reports.

## How to run the app

1. Clone this repository and install dependencies:

```bash
npm install
```

2. Copy the environment template. The app runs without Supabase credentials using local demo data:

```bash
cp .env.example .env
```

3. Start the app:

```bash
npm start
```

4. Open it with the Expo Go app on an Android device or emulator by scanning the QR code printed in the terminal.

With a Supabase project available, put the real values in `.env` and start again:

```text
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key
```

The app then reads the published catalog from `courses`, `course_modules`, and `lessons`. The "Daftar course" button calls the `enroll_course` RPC, the "Tandai selesai" button calls the `complete_lesson` RPC, and students sign in on the Akun tab. Sessions persist with AsyncStorage. If the database is unreachable or the catalog is empty, the app falls back to demo data and explains the fallback on the Akun tab.

Run the checks:

```bash
npm run typecheck
npm test
```

`npm test` runs 91 Jest tests in one command. The SQL tests in `supabase/tests/` run one file at a time with `psql`. A release APK is built with `npm run apk:local`, which runs the Expo prebuild step and the Gradle release build with Java 17 and produces `android/app/build/outputs/apk/release/app-release.apk`.

## Requirements

1. Node.js 20 or newer with npm
2. The Expo Go app on an Android device, or an Android emulator
3. Optional: a Supabase project for the real database. Without it the app uses local demo data
4. Java 17, only for building the release APK

## Test accounts

Sign in on the Akun tab. Roles are checked in the database, so use the account that matches the feature you want to see. Passwords are supplied with the submission package and are not stored in this repository.

| Role | Email | What it demonstrates |
| :---- | :---- | :---- |
| Student | uji.siswa1@futureskill.id | Enrollment, lesson order, and progress |
| Student | uji.siswa2@futureskill.id | A second student with separate progress |
| Mentor | uji.mentor@futureskill.id | Syllabus curation and participant monitoring |
| Admin | uji.admin@futureskill.id | Course publishing and progress reports |

New student accounts can be created from the sign up form on the Akun tab. Mentor and admin roles cannot be self assigned, so those two accounts are prepared in the database.

## AI usage

AI tools were used as writing and coding helpers. The team makes the product decisions, curates the course materials, verifies the application, and can explain every submitted change.

| Tool | Used by | For what |
| :---- | :---- | :---- |
| Hermes Agent (Nous Research), with the DeepSeek 4.1 and GLM 5.3 Flash models | The team | Because the deadline and the iteration loop were very tight. PRD drafting from version 1 to 6, database migration and RPC design, unit test + integration test automation, Jest and SQL test writing, commit and PR text, the animation audit, the design token application, the launcher icon and welcome screen, and this README |

Every AI assisted change is still reviewed and tested by team members before it is merged.
