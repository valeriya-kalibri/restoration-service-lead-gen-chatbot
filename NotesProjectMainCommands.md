# Next.js + shadcn Quick Command Cheat Sheet (Windows + VS Code)


## Where to run commands (VERY IMPORTANT)

Rule: Always run commands in the folder where you want the project to
live.
Best practice: 1. Open File Explorer 2. Go to the parent folder, for
example: D:`\LEARNING`{=tex}`\Udemy`{=tex}\_NextJs_Supabase 3. Click the
address bar 4. Type: cmd 5. Press Enter

Command Prompt opens already in the correct folder.


## Create a new Next.js app

npx create-next-app@latest shey-travel-packages

Choose these options: - TypeScript → Yes - ESLint → Yes - Tailwind →
Yes - src/ directory → Yes - App Router → Yes - Import alias → Yes
(@/\*)

Result: shey-travel-packages └─ src └─ app


## Open the project in VS Code

From the parent folder: code shey-travel-packages
OR VS Code → File → Open Folder → select shey-travel-packages


## Start the Next.js dev server

Inside VS Code: - Terminal → New Terminal - Make sure you are in the
project folder

Run: npm run dev

Open in browser: http://localhost:3000 (or 3001 if Next.js says so)


## Stop the dev server

In the terminal where it's running: Ctrl + C

Wait until the prompt returns.


## Start the dev server again

npm run dev


## Install pnpm (ONE TIME ONLY)

npm install -g pnpm

Verify: pnpm -v


## Initialize shadcn/ui (RUN FROM PROJECT ROOT)

Make sure you are inside the project folder.

Run: pnpm dlx shadcn@latest init

Match the instructor's answers: - TypeScript → Yes - App Router → Yes -
Tailwind → Yes - src → Yes - Style → New York (if used in course)

This creates: - components.json - shadcn configuration


## Add shadcn components

Add Input: pnpm dlx shadcn@latest add input

Add Button: pnpm dlx shadcn@latest add button

Add Sheet (this is for Buttons to open a sheet): npx shadcn@latest add sheet

Files button.txs, input.txs and sheet.txs are created in: src/components/ui


## If the app breaks (SAFE RESET)

Stop server: Ctrl + C

Delete Next.js cache (PowerShell): Remove-Item -Recurse -Force .next

Restart: npm run dev


## Mental model (MEMORIZE THIS)

npx create-next-app → creates the app npm run dev → runs the app Ctrl +
C → stops the app pnpm dlx shadcn → adds UI components src → all app
code lives here @/ → shortcut to src


## Things NOT to do

-   Don't move folders randomly
-   Don't edit tsconfig.json unless needed
-   Don't run shadcn outside the project root
-   Don't panic when errors appear --- read them
