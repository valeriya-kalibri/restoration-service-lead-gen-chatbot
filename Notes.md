1. Run the App in the VS Code terminal using command npm run dev. When it ran succesfully, go to localhost:3000 in the internet browser to see ur prototype app.

2. NOTE: Every shadcn UI component (buttons, inputs and so on) used must be imported manually in the begining of the page.tsx
CODE EXAMPLE: 
    import { Button } from '@/components/ui/button'
    import { Input } from "@/components/ui/input"

3. To pick a color theme go to https://tweakcn.com/editor/theme
There u can pipck colors and see how they look in different situations on a website.
When you are happu click {} Code button in top right and copy.
Then replace these with what you copied.
    :root {...}
    .dark {...}
    @theme inline {...}

4. Things in public folder are acsesible by the deployed app. Images and stuff should go there.

5. _components folder and login-form.tsx file in public folder were created manually after importing sheets. 

6. What “client” means (supabase client):
A Supabase client is just a configured object that knows:

    which Supabase project to talk to (URL)
    which key it’s allowed to use (public / anon / publishable)
    how to make requests (auth, database, storage)
    Think of it as a remote control for your Supabase backend.
    No client → your app has no way to talk to Supabase.

7. "environment" is where the code runs. There are 3: Browser Environment ( runs in browser like Chrome), Server environment (Server Components/layouts, its Next.Js server), Midlewear/Edge environment ( runs before request reaches the app, it can block access, refresh auth cookies, redirect unauthenticated users)

NOTE: if code has "use client = browser environment, no "use client = server environment. DIFFERENT ENVORONMENT - DIFFERENT SUPABASE CLIENTS.

8. tocheck if open AI call is working paste console.log("OPENAI key loaded:", !!process.env.OPENAI_API_KEY); right before Open AI call in the src/app/api/audit/analyze/route.ts file