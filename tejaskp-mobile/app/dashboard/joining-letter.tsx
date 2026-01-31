import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { Stack, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, FileText, Download, Share2 } from "lucide-react-native";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// MOCK USER ID (Bhakti Gandhi)
const MOCK_USER_ID = "476c71f4-dda3-4a65-be9d-ea816eb8270f";
const API_URL = "https://tejaskp.in";

export default function JoiningLetterScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [letter, setLetter] = useState<any>(null);

    useEffect(() => {
        fetchLetter();
    }, []);

    const fetchLetter = async () => {
        try {
            const res = await fetch(`${API_URL}/api/admin/documents/joining-letter?userId=${MOCK_USER_ID}`);
            const data = await res.json();
            if (data.success && data.letter) {
                setLetter(data.letter);
            } else {
                // If no letter found, just show empty state
            }
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to fetch joining letter");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!letter) return;
        try {
            const fileUri = FileSystem.documentDirectory + `Joining_Letter_${letter.name.replace(/\s+/g, '_')}.pdf`;

            // In a real app, generate the PDF here or download a generated URL
            // Since the API returns JSON data, we would technically need to generate the PDF 
            // similar to the web frontend (jspdf). 
            // For this mobile prototype, we'll alert.

            Alert.alert("Feature Pending", "PDF Generation on mobile is coming soon. You can view the details below.");

        } catch (e) {
            Alert.alert("Error", "Download failed");
        }
    };

    return (
        <View className="flex-1 bg-obsidian">
            <Stack.Screen options={{ headerShown: false }} />
            <View className="absolute inset-0 bg-[#050505]">
                <LinearGradient colors={['rgba(26,26,26,0.8)', '#000000']} className="absolute inset-0" />
            </View>

            <SafeAreaView className="flex-1">
                <View className="p-4 flex-row items-center border-b border-gold-500/10">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 bg-charcoal rounded-full">
                        <ArrowLeft size={20} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-bold">Joining Letter</Text>
                </View>

                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#EAB308" />
                    </View>
                ) : !letter ? (
                    <View className="flex-1 items-center justify-center p-6">
                        <FileText size={64} color="#333" />
                        <Text className="text-gray-500 mt-4 text-center">No joining letter found for your profile.</Text>
                    </View>
                ) : (
                    <ScrollView className="flex-1 p-6">
                        <View className="bg-white rounded-2xl p-6 mb-6 shadow-xl">
                            {/* Letter Header */}
                            <View className="items-center border-b border-gray-100 pb-6 mb-6">
                                <Text className="text-2xl font-bold text-gray-900">TEJASKP AI</Text>
                                <Text className="text-xs tracking-widest text-gray-500 uppercase mt-1">Software Solutions</Text>
                            </View>

                            {/* Letter Body */}
                            <Text className="text-gray-900 font-bold text-lg mb-4">Letter of Intent</Text>

                            <Text className="text-gray-600 mb-4 text-sm leading-5">
                                Dear <Text className="font-bold text-gray-900">{letter.name}</Text>,
                            </Text>

                            <Text className="text-gray-600 mb-4 text-sm leading-5">
                                We are pleased to offer you the position of <Text className="font-bold text-gray-900">{letter.designation}</Text> at our {letter.location} office.
                            </Text>

                            <View className="bg-gray-50 p-4 rounded-xl space-y-2 mb-6">
                                <View className="flex-row justify-between">
                                    <Text className="text-gray-500 text-xs">Start Date</Text>
                                    <Text className="text-gray-900 font-medium text-xs">{new Date(letter.startDate).toLocaleDateString()}</Text>
                                </View>
                                <View className="flex-row justify-between">
                                    <Text className="text-gray-500 text-xs">End Date</Text>
                                    <Text className="text-gray-900 font-medium text-xs">{new Date(letter.endDate).toLocaleDateString()}</Text>
                                </View>
                                <View className="flex-row justify-between">
                                    <Text className="text-gray-500 text-xs">Stipend</Text>
                                    <Text className="text-gray-900 font-medium text-xs">{letter.stipend}</Text>
                                </View>
                            </View>

                            <Text className="text-gray-600 text-sm leading-5 mb-8">
                                Please sign and return a copy of this letter to accept the offer.
                            </Text>

                            <View className="items-end">
                                <View className="border-t border-gray-300 w-32 pt-2 items-center">
                                    <Text className="text-xs text-gray-400">Authorized Signatory</Text>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleDownload}
                            className="bg-gold-500 py-4 rounded-xl flex-row items-center justify-center gap-2 shadow-lg shadow-gold-500/20 mb-8"
                        >
                            <Download size={20} color="#000" />
                            <Text className="text-black font-bold">DOWNLOAD PDF</Text>
                        </TouchableOpacity>
                    </ScrollView>
                )}
            </SafeAreaView>
        </View>
    );
}
