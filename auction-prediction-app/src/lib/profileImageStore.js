import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const KEY = 'profile_image_uri';
let _uri = null;
let _listeners = [];

export const initProfileImage = async () => {
  try {
    const stored = await AsyncStorage.getItem(KEY);
    if (stored) {
      _uri = stored;
      _listeners.forEach(fn => fn(stored));
    }
  } catch {}
};

export const setProfileImage = async (uri) => {
  _uri = uri;
  try { await AsyncStorage.setItem(KEY, uri); } catch {}
  _listeners.forEach(fn => fn(uri));
};

export const getProfileImage = () => _uri;

export const subscribeProfileImage = (fn) => {
  _listeners.push(fn);
  fn(_uri); // immediately call with current value
  return () => { _listeners = _listeners.filter(l => l !== fn); };
};

/**
 * Uploads a local image URI to Supabase Storage and saves the public URL
 * into teams.logo_url for the given teamId.
 *
 * Returns the public URL string on success, or null on failure.
 */
export const uploadLogoToSupabase = async (localUri, teamId) => {
  if (!localUri || !teamId) return null;
  try {
    // 1. Fetch the image as a blob
    const response = await fetch(localUri);
    const blob = await response.blob();

    const ext      = localUri.split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `team-logos/${teamId}.${ext}`;

    // 2. Upload to Supabase Storage bucket "team-assets"
    const { error: uploadError } = await supabase.storage
      .from('team-assets')
      .upload(filePath, blob, {
        contentType: blob.type || `image/${ext}`,
        upsert: true,  // overwrite if already exists
      });

    if (uploadError) {
      console.warn('Logo upload error:', uploadError.message);
      return null;
    }

    // 3. Get the public URL
    const { data: urlData } = supabase.storage
      .from('team-assets')
      .getPublicUrl(filePath);
    const publicUrl = urlData?.publicUrl;
    if (!publicUrl) return null;

    // 4. Save the URL to teams.logo_url
    const { error: dbError } = await supabase
      .from('teams')
      .update({ logo_url: publicUrl })
      .eq('id', teamId);

    if (dbError) {
      console.warn('teams.logo_url update error:', dbError.message);
    }

    return publicUrl;
  } catch (err) {
    console.warn('uploadLogoToSupabase failed:', err.message);
    return null;
  }
};
