# Pocket Banking Demo

I have attached 2 images. Image 1 is the APP ICON. Image 2 shows the HOME SCREEN designs. Match Image 2 closely for layout, colors, spacing, icons and typography across the whole app. Use Image 1 as the app icon, favicon and PWA icon (generate 192x192, 512x512 and maskable versions). Use my own app name and branding, not any real bank's logo.



Build a mobile-first, installable Progressive Web App (React + TypeScript + Tailwind, vite-plugin-pwa with manifest, service worker, offline app shell and an "Add to Home Screen" install prompt) for a mobile banking app similar to KCB Mobile. This is a DEMO ONLY: no real banking, but every button and flow must work end to end with mock data.



Demo data and logic:

- Seed 2 accounts (Current, Savings) with KES balances, 20+ sample transactions, 3 saved beneficiaries and saved billers

- Global state via React context, persisted in localStorage so changes survive refresh

- Demo PIN is 7248 (don't show a hint on the login screen)

- Every transaction must validate input (amount > 0, sufficient balance, valid phone/account number), require PIN confirmation, deduct the balance, add a new entry to the transaction history with a reference number, date and time, then show a success receipt screen (with share/download mock)

- Failed cases show clear error messages (insufficient funds, wrong PIN, 3 wrong PINs locks for 30 seconds)



Account holder details:

- Account holder name: Victor Kipkemboi Koech

- Greeting on Home: "Hello, Victor" (full name shown on the profile, cards, statements and receipts)

- Debit card name: VICTOR K KOECH

- Statement header and PDF show: Victor Kipkemboi Koech, account numbers, statement period

- Send money receipts show "From: Victor Kipkemboi Koech"

- Profile avatar uses the initials "VK"



Screens and working features:

1. Splash + login: 4-digit PIN keypad, biometric button (simulated success), Forgot PIN flow (mock OTP: 123456)

2. Home (match Image 2): greeting, account carousel with working show/hide balance, quick-action buttons that all navigate correctly, recent transactions list that updates live, notifications bell with a working list

3. Send Money: to own account, to KCB-style account, other bank, or mobile number; choose from beneficiaries or add new (with "save beneficiary" toggle)

4. M-Pesa: Withdraw to M-Pesa and Top up from M-Pesa, with a simulated "enter M-Pesa PIN on your phone" prompt and a 3-second processing state

5. Pay Bills: saved billers (KPLC, Water, DSTV, Zuku, Nairobi Water), custom paybill/till entry with account number, save biller option

6. Buy Airtime: Safaricom, Airtel, Telkom, for self or other number, preset and custom amounts

7. Statements: filter by date range, type (credit/debit) and search; mini statement; "Download PDF" generates a real simple PDF from the demo data

8. Cards: view mock debit card, freeze/unfreeze toggle, show/hide card number, set limits

9. Profile/Settings: change PIN (validated), toggle notifications, dark mode toggle, language switch (English/Kiswahili for main labels), logout

10. Bottom navigation (Home, Transact, Cards, More) working on every screen, with back buttons and smooth page transitions

Demo Data Editor (Settings > Demo Data Editor, also reachable from the Statements screen):

- Add, edit and delete demo transactions: description, amount, credit/debit, date, time, reference, account

- Balances recalculate automatically after every change

- Edits show up everywhere (Home, Statements, mini statement) and persist in Till number merchant lookup (editable):

- Demo merchant directory: till/paybill number to merchant name

- Pre-seed: Till 123456 = "Candy Shop" (placeholder number)

- In Demo Data Editor > Manage merchants, every entry has editable fields for Till Number, Merchant Name and Type (Till or Paybill). Changing the till number updates the directory immediately, with no code change or reset needed.

- Past transactions keep the merchant name they were saved with. Add an "Update past transactions" toggle when editing a merchant, so old entries can be switched to the new till number and name if wanted.

- In Pay Bills > Safaricom Till, entering a till number looks up the merchant and shows "Pay to: CANDY SHOP, Till 123456" on the confirmation screen, the PIN screen, the success receipt and the transaction history

- Unknown till numbers show "Unregistered merchant - enter name"; the typed name is saved to the directory

- Add, edit and delete buttons for merchants, with validation (till numbers must be 5-7 digits, no duplicates)

- Merchant directory persists in localStorage and is restored to the seed values by "Reset demo data"



Extras:

- Auto-logout after 2 minutes idle with a warning dialog

- A "Reset data" button in Settings

- Loading skeletons, toasts for success and error, and empty states

- Fully responsive, works offline after first load, no console errors

- Build all screens and flows in one go; do not leave placeholders or "coming soon" buttons,

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c3ff2a25-0b8d-421e-94e8-a0941db67118).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
