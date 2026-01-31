import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator, SafeAreaView, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import Constant from 'expo-constants';

const WEBSITE_URL = 'https://www.tejaskp.in'; // Using www as root might be propagating

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#000000" />
      <SafeAreaView style={styles.safeArea}>
        <WebView
          source={{ uri: WEBSITE_URL }}
          style={styles.webview}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#EAB308" />
            </View>
          )}
          // Enable some common mobile webview settings
          allowsBackForwardNavigationGestures={true}
          pullToRefreshEnabled={true}
          scalesPageToFit={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Match the dark theme background
  },
  safeArea: {
    flex: 1,
    // Add top padding only on Android to avoid status bar overlap if needed, 
    // but SafeAreaView handles iOS nicely.
    paddingTop: Platform.OS === 'android' ? Constant.statusBarHeight : 0,
  },
  webview: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
});
