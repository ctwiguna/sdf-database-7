# Future Skill

Future Skill is a mobile learning platform for practical future skills. The MVP helps students follow structured video courses, track their learning progress, and continue learning from the first unfinished lesson. Mentors curate course materials, while admins publish courses and monitor course progress.

## Product overview

The first course catalog contains four practical areas:

1. Dasar Sistem Solar Panel
2. EV Battery Management System
3. PEST Control Course
4. Mechanical Electrical Plumbing Course

Each course uses an ordered syllabus with modules and lessons sourced from the team's selected YouTube playlists. Students can enroll in a published course, open lessons in syllabus order, mark lessons as completed, and view course progress.

The MVP does not include task uploads, submissions, grading, quizzes, certificates, payments, chat, push notifications, offline downloads, video uploads, or iOS release.

## User roles

### Student

Students browse published courses, enroll in a course, watch the ordered lesson playlist, mark lessons as completed, and view their progress.

### Mentor

Mentors curate draft course modules and lessons, maintain the syllabus order, provide video references, and monitor progress for students enrolled in their courses.

### Admin

Admins manage course publication, assign mentors, configure course capacity, and view progress reports.

## Technology

1. React Native with Expo and TypeScript
2. Supabase Auth and PostgreSQL
3. YouTube unlisted videos for lesson content
4. React Native WebView for the embedded video player
5. Supabase Row Level Security for data access control

The app reads the published catalog from Supabase when environment variables are set. Without credentials, or when the database is unreachable or empty, the app falls back to local demo data so the student flow keeps working.

## Project structure

```text
App.tsx                       Main mobile application flow
src/data/mockCourses.ts       Local course and syllabus data
src/lib/catalog.ts            Supabase data access for catalog, enrollment, and progress
src/lib/session.ts            Email sign in, sign up, and validation helpers
src/lib/course.ts             Course ordering and progress helpers
src/lib/supabase.ts           Supabase client and session storage configuration
src/features/account/screens/AccountScreen.tsx  Account form and connection status
src/theme.ts                  Shared design tokens
src/types.ts                  Shared TypeScript types
src/__tests__/course.test.ts  Course and progress tests
src/__tests__/catalog.test.ts Data access tests with a fake client
src/__tests__/session.test.ts Session validation and error message tests
app.json                      Expo application configuration
.env.example                  Environment variable template
```

## Running the application

Requirements: Node.js 20 or newer.

```bash
npm install
cp .env.example .env
npm start
```

The app can be opened with Expo Go on an Android device or emulator. The local demo data allows the main student flow to run without Supabase credentials.

## Environment variables

Copy `.env.example` to `.env` and replace the placeholder values when a Supabase project is available:

```text
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key
```

Never put a Supabase service role key, password, or other private secret in the mobile application or in the repository.

## Supabase integration

When `.env` is filled, the app connects to Supabase:

1. The catalog is read from `courses`, `course_modules`, and `lessons` for published courses.
2. The "Daftar course" button calls the `enroll_course` RPC, which locks the course row, checks the status and capacity, and writes the enrollment and the activity log in one transaction.
3. The "Tandai selesai" button calls the `complete_lesson` RPC, and the progress display is read from `lesson_progress`.
4. Students sign in on the Akun tab with email and password. Enrollment and progress require a signed in student because the database checks `auth.uid()`.
5. Sessions are stored with AsyncStorage, so a signed in user stays signed in after the app restarts.
6. If the database is unreachable or the published catalog is empty, the app keeps working with local demo data and explains the fallback on the Akun tab.

Mentor and admin roles are assigned with the Supabase SQL editor, because the profiles trigger rejects role changes that come from the API.

## Test accounts

Sign in on the Akun tab. Roles are checked in the database, so use the account that matches the feature you want to see. Passwords are supplied with the submission package and are not stored in this repository.

| Role | Email | What it demonstrates |
| :---- | :---- | :---- |
| Student | uji.siswa1@futureskill.id | Enrollment, lesson order, and progress |
| Student | uji.siswa2@futureskill.id | A second student with separate progress |
| Mentor | uji.mentor@futureskill.id | Syllabus curation and participant monitoring |
| Admin | uji.admin@futureskill.id | Course publishing and progress reports |

New student accounts can also be created from the sign up form on the Akun tab. Mentor and admin roles cannot be self assigned, so those two accounts are prepared in the database.

## Verification commands

```bash
npm run typecheck
npm test
npm run export
```

The export command creates Android and iOS JavaScript bundles. A release APK is built locally with `npm run apk:local`, which runs the Expo prebuild step and the Gradle release build with Java 17. The output file is `android/app/build/outputs/apk/release/app-release.apk`, and it starts without the Expo development server.

## Content note

The catalog now uses these playlist sources:

1. Solar Panel: the two selected Solar Panel videos
2. EV Battery Management System: https://youtube.com/playlist?list=PLeFgcB4EQAz5jvpoiEZyEXbIT6fKpPtCE
3. PEST Control Course: https://youtube.com/playlist?list=PLD1v2-1R3-sP0w2CGnzk5g1CWoLSEByQC
4. Mechanical Electrical Plumbing Course: https://youtube.com/playlist?list=PLdLjtrBLr_xAaIAHO4LEVNewJsV4cLC7K

The videos remain embedded through YouTube. Playlist availability and permission to use each video must be checked by the team before the final demonstration. Members only videos in the MEP playlist are not included, because they cannot be played by students.

Six lessons were removed during content review because they are not teaching material: a course announcement, a cartoon, a sales clip, a video with no informative title, and two book review clips. The remaining lessons are 2, 18, 18, and 6 per course. The EV Battery Management System lessons are ordered by the lecture number shown in each video title.

## AI usage

AI tools are used to help with project scaffolding, interface components, course and progress helpers, and unit tests. The team makes the product decisions, curates course materials, verifies the application, and remains responsible for understanding every submitted change.
