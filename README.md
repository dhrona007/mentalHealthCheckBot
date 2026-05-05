<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/28dff06a-763e-4a7f-ab9d-8c980b789ec9

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to Render

This app can be deployed as a static site on Render.

1. Push your code to a Git repository (e.g., GitHub, GitLab).
2. Sign up for a Render account at https://render.com.
3. Connect your repository to Render.
4. Create a new Static Site service.
5. Set the build command to: `npm run build`
6. Set the publish directory to: `dist`
7. In the Environment section, add the following environment variables:
   - `GEMINI_API_KEY`: Your Gemini API key
   - `APP_URL`: The URL of your deployed app (e.g., https://your-app-name.onrender.com)
8. Deploy the service.
9. In your Firebase console, add the Render domain to the authorized domains for Authentication (under Authentication > Sign-in method > Authorized domains).
