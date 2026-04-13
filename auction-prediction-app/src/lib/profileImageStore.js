import AsyncStorage from '@react-native-async-storage/async-storage';

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
