import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppButton } from '@/src/components/AppButton';
import { AppTextInput } from '@/src/components/AppTextInput';
import { useAuth } from '@/src/contexts/AuthContext';
import { getAuthErrorMessage } from '@/src/utils/authErrors';

export function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState<'login' | 'signup' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    setInfo(null);
    setLoading('login');
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(null);
    }
  };

  const handleSignUp = async () => {
    setError(null);
    setInfo(null);
    setLoading('signup');
    try {
      const result = await signUp(email.trim(), password);
      if (result.needsEmailConfirmation) {
        setInfo('Check your email to confirm your account, then log in.');
      }
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(null);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Receipt Helper</Text>
        <Text style={styles.subtitle}>Sign in or create an account</Text>

        <AppTextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
        />
        <AppTextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          textContentType="password"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {info ? <Text style={styles.info}>{info}</Text> : null}

        <AppButton title="Log In" onPress={handleLogin} loading={loading === 'login'} />
        <AppButton
          title="Sign Up"
          onPress={handleSignUp}
          loading={loading === 'signup'}
          variant="secondary"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
  },
  error: {
    color: '#dc2626',
    marginTop: 12,
    fontSize: 14,
  },
  info: {
    color: '#2563eb',
    marginTop: 12,
    fontSize: 14,
  },
});
