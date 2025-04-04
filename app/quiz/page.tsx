"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import ScenarioChat from "@/components/scenario-chat";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
	markQuizCompleted,
	generateDeviceFingerprint,
} from "@/lib/device-fingerprint";

interface Scenario {
	id: number;
	title: string;
	description: string;
	scenario_type: string;
	correct_answer: string;
	messages: {
		id: number;
		message: string;
		sender: string;
		order_index: number;
	}[];
}

export default function QuizPage() {
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [scenarios, setScenarios] = useState<Scenario[]>([]);
	const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
	const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
	const [feedback, setFeedback] = useState<{
		visible: boolean;
		isCorrect: boolean;
		message: string;
	}>({
		visible: false,
		isCorrect: false,
		message: "",
	});
	const [userId, setUserId] = useState<string | null>(null);
	const [feedbackPanelVisible, setFeedbackPanelVisible] = useState(false);
	const feedbackPanelRef = useRef<HTMLDivElement>(null);
	const isDesktop = useMediaQuery("(min-width: 768px)");
	const [deviceFingerprint, setDeviceFingerprint] = useState<string | null>(
		null
	);

	useEffect(() => {
		const checkAuth = async () => {
			// Check for authenticated user
			const {
				data: { user },
			} = await supabase.auth.getUser();

			if (user) {
				setUserId(user.id);
			} else {
				// Check for guest ID
				const guestId = localStorage.getItem("guestId");
				if (guestId) {
					setUserId(guestId);
				} else {
					// No authentication, redirect to auth page
					router.push("/auth");
				}
			}

			// Generate device fingerprint
			const fingerprint = await generateDeviceFingerprint();
			setDeviceFingerprint(fingerprint);
		};

		const fetchScenarios = async () => {
			try {
				// Fetch scenarios
				const { data: scenariosData, error: scenariosError } = await supabase
					.from("scenarios")
					.select("*");

				if (scenariosError) throw scenariosError;

				// Fetch messages for each scenario
				const scenariosWithMessages = await Promise.all(
					scenariosData.map(async (scenario) => {
						const { data: messagesData, error: messagesError } = await supabase
							.from("scenario_messages")
							.select("*")
							.eq("scenario_id", scenario.id)
							.order("order_index", { ascending: true });

						if (messagesError) throw messagesError;

						return {
							...scenario,
							messages: messagesData,
						};
					})
				);

				setScenarios(scenariosWithMessages);
			} catch (error) {
				console.error("Error fetching scenarios:", error);
			} finally {
				setLoading(false);
			}
		};

		checkAuth();
		fetchScenarios();
	}, [router]);

	useEffect(() => {
		// Close feedback panel when clicking outside on mobile
		const handleClickOutside = (event: MouseEvent) => {
			if (
				feedbackPanelRef.current &&
				!feedbackPanelRef.current.contains(event.target as Node) &&
				feedbackPanelVisible &&
				!isDesktop
			) {
				setFeedbackPanelVisible(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [feedbackPanelVisible, isDesktop]);

	const currentScenario = scenarios[currentScenarioIndex];
	const progress =
		scenarios.length > 0
			? ((currentScenarioIndex + 1) / scenarios.length) * 100
			: 0;

	const handleAnswer = async (answer: "safe" | "scam") => {
		if (!currentScenario || !userId) return;

		// ตรวจสอบว่ามีคำตอบอยู่ในฐานข้อมูลแล้วหรือไม่
		try {
			const { data: existingResponse, error } = await supabase
				.from("user_responses")
				.select("*")
				.eq("user_id", userId)
				.eq("scenario_id", currentScenario.id)
				.single();

			if (existingResponse) {
				console.warn("User has already answered this scenario.");
				return; // หยุดการบันทึกถ้าพบคำตอบอยู่แล้ว
			}
		} catch (error) {
			console.error("Error checking existing response:", error);
			return; // หยุดการทำงานถ้าเกิดข้อผิดพลาดในการตรวจสอบ
		}

		const isCorrect = answer === currentScenario.correct_answer;

		// Save user response
		try {
			await supabase.from("user_responses").upsert(
				[
					{
						user_id: userId,
						scenario_id: currentScenario.id,
						user_answer: answer,
						is_correct: isCorrect,
					},
				],
				{ onConflict: "user_id,scenario_id" } // ระบุคอลัมน์ที่เป็น unique constraint
			);
		} catch (error) {
			console.error("Error saving response:", error);
			return;
		}

		// Update local state with the actual answer value
		setUserAnswers({
			...userAnswers,
			[currentScenario.id]: answer,
		});

		// Show feedback
		setFeedback({
			visible: true,
			isCorrect,
			message: isCorrect
				? "Correct! You identified this correctly."
				: `Incorrect. This was actually a ${currentScenario.correct_answer}.`,
		});

		// Show feedback panel on mobile
		if (!isDesktop) {
			setFeedbackPanelVisible(true);
		}
	};

	const handleNextScenario = () => {
		// ปิดการแสดงผลก่อน แล้วค่อยรีเซ็ต state
		setFeedback((prev) => ({ ...prev, visible: false }));
		setFeedbackPanelVisible(false);

		// ใช้ setTimeout หรือ useEffect เพื่อให้แน่ใจว่าการแสดงผลได้อัปเดตก่อน
		setTimeout(() => {
			setFeedback({ visible: false, isCorrect: false, message: "" });
			if (currentScenarioIndex < scenarios.length - 1) {
				setCurrentScenarioIndex(currentScenarioIndex + 1);
			} else {
				// Quiz completed - mark this device as having completed the quiz
				if (userId && deviceFingerprint) {
					markQuizCompleted(userId, deviceFingerprint);
				}
				// Redirect to survey
				router.push("/survey");
			}
		}, 500);
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
					<p>Loading quiz...</p>
				</div>
			</div>
		);
	}

	if (scenarios.length === 0) {
		return (
			<div className="min-h-screen flex items-center justify-center p-4">
				<Card className="w-full max-w-md p-6">
					<h2 className="text-xl font-bold mb-4">No Scenarios Available</h2>
					<p className="mb-6">
						There are no quiz scenarios available at the moment.
					</p>
					<Button onClick={() => router.push("/")} className="w-full">
						Return to Home
					</Button>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex flex-col bg-gray-100 p-4">
			<div className="max-w-4xl w-full mx-auto flex-1 flex flex-col">
				<div className="mb-4">
					<div className="flex justify-between items-center mb-2">
						<span className="text-sm font-medium">
							Scenario {currentScenarioIndex + 1} of {scenarios.length}
						</span>
					</div>
					<Progress value={progress} className="h-2" />
				</div>

				<div className={`flex-1 flex flex-col ${isDesktop ? "md-layout" : ""}`}>
					{/* Scenario Display */}
					<div className="flex-1 mb-4 md:mb-0">
						<div
							className={`rounded-lg shadow-md overflow-hidden h-full flex flex-col ${
								userAnswers[currentScenario?.id]
									? userAnswers[currentScenario?.id] ===
									  currentScenario?.correct_answer
										? "border-4 border-green-500"
										: "border-4 border-red-500"
									: "border-4 border-blue-600"
							}`}
						>
							<div className="p-4 bg-blue-600 text-white">
								<h2 className="font-bold">{currentScenario.title}</h2>
								<p className="text-sm text-blue-100">
									{currentScenario.description}
								</p>
							</div>
							<div className="flex-1 p-4 bg-white">
								<ScenarioChat
									messages={currentScenario.messages}
									scenarioType={currentScenario.scenario_type}
								/>
							</div>
						</div>
					</div>

					{/* Feedback Display (Desktop) */}
					{isDesktop && feedback.visible && (
						<div
							className={`flex-1 ${
								feedback.isCorrect ? "bg-green-100" : "bg-red-100"
							} rounded-lg shadow-md overflow-hidden flex flex-col`}
						>
							<div
								className={`p-4 ${
									feedback.isCorrect ? "bg-green-500" : "bg-red-500"
								} text-white`}
							>
								<h2 className="font-bold">
									{feedback.isCorrect ? "✓ Correct!" : "✗ Incorrect!"}
								</h2>
							</div>
							<div className="flex-1 bg-white p-6">
								<p className="mb-4">{feedback.message}</p>

								{currentScenario.correct_answer === "scam" && (
									<div className="mt-4">
										<p className="font-medium mb-2">Warning signs:</p>
										<ul className="list-disc list-inside space-y-1">
											<li>Urgent requests for personal information</li>
											<li>Suspicious links or attachments</li>
											<li>Poor grammar or spelling</li>
											<li>Threats or unusual promises</li>
										</ul>
									</div>
								)}

								<Button onClick={handleNextScenario} className="w-full mt-6">
									{currentScenarioIndex < scenarios.length - 1
										? "Next Scenario"
										: "Complete Quiz"}
								</Button>
							</div>
						</div>
					)}

					{/* Answer Buttons (Only show if feedback is not visible on desktop, or always on mobile) */}
					{(!isDesktop || !feedback.visible) &&
						!userAnswers[currentScenario?.id] && (
							<div className="bg-blue-600 rounded-lg shadow-md p-4 sticky bottom-0">
								<p className="mb-4 font-medium text-center text-white">
									Is this safe or a scam?
								</p>
								<div className="flex gap-4 justify-center">
									<Button
										onClick={() => handleAnswer("safe")}
										className="w-32 bg-green-500 hover:bg-green-600 text-white"
									>
										Safe
									</Button>
									<Button
										onClick={() => handleAnswer("scam")}
										className="w-32 bg-red-500 hover:bg-red-600 text-white"
									>
										Scam
									</Button>
								</div>
							</div>
						)}
				</div>
			</div>

			{/* Mobile Feedback Panel */}
			{!isDesktop && (
				<div
					ref={feedbackPanelRef}
					className={`feedback-panel ${
						feedbackPanelVisible ? "visible-panel" : "hidden-panel"
					}`}
				>
					<div
						className={`p-4 ${
							feedback.isCorrect ? "bg-green-500" : "bg-red-500"
						} text-white flex items-center`}
					>
						<div>
							<h3 className="font-bold text-lg">
								{feedback.isCorrect ? "✓ Correct!" : "✗ Incorrect!"}
							</h3>
						</div>
					</div>

					<div
						className={`p-6 max-h-[60vh] overflow-y-auto ${
							feedback.isCorrect ? "bg-green-100" : "bg-red-100"
						}`}
					>
						<p className="mb-4">{feedback.message}</p>

						{currentScenario?.correct_answer === "scam" && (
							<div className="mt-4 mb-6">
								<p className="font-medium mb-2">Warning signs:</p>
								<ul className="list-disc list-inside space-y-1">
									<li>Urgent requests for personal information</li>
									<li>Suspicious links or attachments</li>
									<li>Poor grammar or spelling</li>
									<li>Threats or unusual promises</li>
								</ul>
							</div>
						)}

						<Button onClick={handleNextScenario} className="w-full mt-4">
							{currentScenarioIndex < scenarios.length - 1
								? "Next Scenario"
								: "Complete Quiz"}
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
