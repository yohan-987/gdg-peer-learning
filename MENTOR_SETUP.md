# Setting up a mentor account

The app can't create a mentor account for you from the frontend — no Firebase
Auth account can be created except through the app's own signup form, and
role can never be set from the UI (that's intentional: it's what stops a
student from just making themselves a mentor). So this is a one-time manual
step, done directly in the Firebase console.

**Nothing here involves fake or exposed credentials.** You create a real
account the normal way, then flip one field on it.

## Steps

1. **Sign up normally through the app** with any real-looking test email —
   e.g. `mentor@test.com` — same Sign Up form every student uses.
2. Complete Profile Setup as you normally would (name, semester, branch,
   at least one domain — the values don't matter for a mentor account).
3. Go to your **Firebase console → Firestore Database → Data**.
4. Open the **`users`** collection, find the document whose `email` field
   matches the account you just created.
5. Edit that document's **`role`** field: change it from `"student"` to
   `"mentor"`.
6. Back in the app, **log out and log back in** with that account (or just
   refresh if you're already signed in with it).

That's it — this account now sees the mentor validation controls (project
approve/reject, doubt validation) on every domain page, plus a "Pending
Reviews" section on its own Profile page. Every other account it interacts
with is unaffected; mentor status lives only on this one document.

## Why this approach instead of a placeholder UID

An earlier version of this instruction set considered pre-seeding a
Firestore document under a fixed placeholder UID and asking you to make a
real account match that exact ID — but Firestore document IDs aren't
renameable, so that would mean deleting and recreating documents by hand
to line things up. Signing up normally and flipping one field is simpler,
less error-prone, and doesn't require touching any code.
