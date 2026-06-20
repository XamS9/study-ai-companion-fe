import * as AuthSession from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from './supabase';

// Dismisses the in-app browser popup if an auth session is already in flight.
WebBrowser.maybeCompleteAuthSession();

/** Supabase provider ids. Microsoft maps to Supabase's `azure` provider. */
export type OAuthProvider = 'google' | 'github' | 'azure';

/** Deep-link target registered in Supabase Auth → URL Configuration. */
export const redirectTo = AuthSession.makeRedirectUri({ scheme: 'studyaicompanionfe' });

/** Deep link the password-reset email opens (the reset-password screen). */
export const resetPasswordRedirect = AuthSession.makeRedirectUri({
  scheme: 'studyaicompanionfe',
  path: 'reset-password',
});

/**
 * Turns the redirect URL returned by an OAuth or password-recovery flow into a
 * live Supabase session. Handles both flow shapes:
 *  - PKCE: a `code` query param → exchangeCodeForSession
 *  - implicit: `access_token`/`refresh_token` params → setSession
 */
export async function createSessionFromUrl(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) throw new Error(errorCode);

  const { access_token, refresh_token, code } = params;

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return data.session;
  }

  if (!access_token) return null;

  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });
  if (error) throw error;
  return data.session;
}

/**
 * Runs the full native OAuth handshake: ask Supabase for the provider URL, open
 * it in the system auth browser, then exchange the redirect for a session.
 * Returns null if the user cancels.
 */
export async function signInWithProvider(provider: OAuthProvider) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data.url) throw new Error('No authorization URL returned from Supabase.');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type === 'success') {
    return createSessionFromUrl(result.url);
  }
  return null;
}
