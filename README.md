# MendLog

Voice-first field journal for industrial machine repair technicians.

Technicians repair multiple machines a day and currently fill out paper forms for each job — root cause, corrective action, idle time, parts used. The paperwork gets skipped or forgotten. MendLog replaces the form with a voice memo + photos: speak in Sinhala or English, MendLog transcribes, structures, and files the job. Past jobs are semantically searchable by text, photo, or error code so technicians can surface prior diagnoses on similar faults.

## Stack

- **Mobile**: React Native + Expo (Android first, iOS later)
- **Backend**: Supabase (Postgres, Auth, Storage, pgvector for semantic search)
- **Transcription & structured extraction**: OpenAI

## Target device

Mid-range Android phones. Memory efficiency and offline-tolerance are first-class concerns.

## Status

Early development. Nothing is wired up yet.

## License

MIT — see [LICENSE](LICENSE).
