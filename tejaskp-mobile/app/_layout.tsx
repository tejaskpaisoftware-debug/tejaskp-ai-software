import { Slot, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <View className="flex-1 bg-background">
                <StatusBar style="light" />
                <Slot />
            </View>
        </SafeAreaProvider>
    );
}
