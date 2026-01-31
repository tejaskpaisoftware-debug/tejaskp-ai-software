import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import { useRouter, Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { FileText, LogOut, UploadCloud } from "lucide-react-native";

export default function StudentDashboard() {
    const router = useRouter();

    return (
        <View className="flex-1 bg-obsidian">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Background */}
            <View className="absolute inset-0 bg-[#050505]">
                <LinearGradient colors={['rgba(26,26,26,0.8)', '#000000']} className="absolute inset-0" />
            </View>

            <SafeAreaView className="flex-1">
                <View className="p-6 flex-row justify-between items-center border-b border-gold-500/10">
                    <View>
                        <Text className="text-white text-lg font-bold">Welcome, Student</Text>
                        <Text className="text-gold-500/60 text-xs">TEJASKP AI Portal</Text>
                    </View>
                    <TouchableOpacity onPress={() => router.replace("/")} className="bg-charcoal p-2 rounded-full border border-gold-500/30">
                        <LogOut size={20} color="#EAB308" />
                    </TouchableOpacity>
                </View>

                <ScrollView className="flex-1 p-6 space-y-6">
                    {/* Stats / Hero */}
                    <View className="bg-charcoal border border-gold-500/30 rounded-2xl p-6 shadow-lg shadow-gold-500/10">
                        <Text className="text-gold-400 text-xs uppercase tracking-wider mb-2">Pending Actions</Text>
                        <Text className="text-white text-2xl font-bold">Submit Your Assessment</Text>
                        <Text className="text-gray-400 text-xs mt-2">Upload your project files for review.</Text>
                    </View>

                    {/* Quick Actions */}
                    <Text className="text-white font-bold text-lg mt-4">Quick Actions</Text>
                    <View className="flex-row flex-wrap gap-4">
                        <TouchableOpacity
                            onPress={() => router.push("/dashboard/assessment")}
                            className="w-[48%] bg-charcoal border border-gold-500/20 rounded-xl p-4 items-center justify-center space-y-3 active:bg-gold-500/10"
                        >
                            <View className="w-12 h-12 rounded-full bg-gold-500/10 items-center justify-center">
                                <UploadCloud size={24} color="#EAB308" />
                            </View>
                            <Text className="text-white font-bold text-sm">Upload Assessment</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="w-[48%] bg-charcoal border border-gold-500/20 rounded-xl p-4 items-center justify-center space-y-3 opacity-50"
                        >
                            <View className="w-12 h-12 rounded-full bg-blue-500/10 items-center justify-center">
                                <FileText size={24} color="#3b82f6" />
                            </View>
                            <Text className="text-white font-bold text-sm">View Documents</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
