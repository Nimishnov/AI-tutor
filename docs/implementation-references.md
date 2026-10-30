
## Google OAuth and identity linking

- [Google sign-in provider setup](https://supabase.com/docs/guides/auth/social-login/auth-google): create a Google Web OAuth client, authorize the app's origin, and add the Supabase Auth callback URL as the provider redirect URI.
- [Identity linking](https://supabase.com/docs/guides/auth/auth-identity-linking): link a Google identity to the current user so an anonymous workspace can retain the same Supabase user ID. Manual identity linking is a beta feature and may need to be enabled in project Auth configuration.
- [JavaScript `linkIdentity`](https://supabase.com/docs/reference/javascript/auth-linkidentity): start OAuth identity linking from the signed-in user session.
- [JavaScript `signInWithOAuth`](https://supabase.com/docs/reference/javascript/auth-signinwithoauth): provider sign-in and explicit redirect handling.
- [Auth redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls): set an exact Site URL and allowlisted callback destination; use the deployed Pages URL including its repository path.

- [Google Gemma on the Gemini API](https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api): model identifier and image-capable generateContent examples.
- [Gemini API generateContent](https://ai.google.dev/api/generate-content): native multimodal request and JSON response configuration.
- [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control): private buckets and per-user RLS policies.
