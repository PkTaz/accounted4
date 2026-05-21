// Must load before Supabase (React Native URL API)
import 'react-native-url-polyfill/auto';

import { registerRootComponent } from 'expo';

import App from './App';

registerRootComponent(App);
