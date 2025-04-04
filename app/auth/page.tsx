"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { generateGuestId } from "@/lib/utils";
import { Loader2, AlertTriangle } from "lucide-react";
import {
	generateDeviceFingerprint,
	hasCompletedQuiz,
	isReturningUser,
} from "@/lib/device-fingerprint";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AuthPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [deviceFingerprint, setDeviceFingerprint] = useState<string | null>(
		null
	);
	const [previouslyCompleted, setPreviouslyCompleted] = useState(false);
	const [returningUserInfo, setReturningUserInfo] = useState<{
		isReturning: boolean;
		previousUserId?: string;
	}>({
		isReturning: false,
	});

	// ในส่วน useEffect
	useEffect(() => {
		const checkDeviceStatus = async () => {
			// Generate device fingerprint
			const fingerprint = await generateDeviceFingerprint();
			setDeviceFingerprint(fingerprint);

			// Check if this device has completed the quiz before
			const completed = await hasCompletedQuiz(); // ต้องใส่ await เพราะเป็น async function
			setPreviouslyCompleted(completed);

			// Check if this is a returning user
			const returning = await isReturningUser();
			setReturningUserInfo(returning);

			// If returning user with previous user ID, we can auto-login them
			if (returning.isReturning && returning.previousUserId) {
				// For guest users, we can just redirect to the results page
				if (returning.previousUserId.startsWith("guest-")) {
					localStorage.setItem("guestId", returning.previousUserId);
					router.push("/results");
				}
			}
		};

		checkDeviceStatus();
	}, [router]);

	// ในส่วน handleGuestLogin
	const handleGuestLogin = async () => {
		setLoading(true);
		setError(null);

		try {
			// ใช้ state previouslyCompleted ที่ได้จาก useEffect แทนการเรียก hasCompletedQuiz() อีกครั้ง
			if (previouslyCompleted) {
				setError(
					"This device has already completed the quiz. Please use a different device or sign in with an account."
				);
				setLoading(false);
				return;
			}

			const guestId = generateGuestId();

			// Create a guest user in the database
			const { error } = await supabase.from("users").insert([
				{
					id: guestId, // Use the UUID as the primary key
					auth_provider: "guest",
					provider_id: guestId,
					display_name: `Guest-${guestId.substring(0, 6)}`,
				},
			]);

			if (error) throw error;

			// Store guest ID in local storage
			localStorage.setItem("guestId", guestId);

			// Redirect to quiz
			router.push("/quiz");
		} catch (err) {
			console.error("Error during guest login:", err);
			setError("Failed to create guest account. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleEmailLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		try {
			const { data, error } = await supabase.auth.signInWithPassword({
				email,
				password,
			});

			if (error) throw error;

			// Redirect to quiz
			router.push("/quiz");
		} catch (err: any) {
			console.error("Error during email login:", err);
			setError(
				err.message || "Failed to sign in. Please check your credentials."
			);
		} finally {
			setLoading(false);
		}
	};

	const handleEmailSignUp = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		try {
			const { data, error } = await supabase.auth.signUp({
				email,
				password,
			});

			if (error) throw error;

			if (data.user) {
				// Insert into our users table
				await supabase.from("users").insert([
					{
						id: data.user.id,
						email: data.user.email,
						auth_provider: "email",
						provider_id: data.user.id,
						display_name: email.split("@")[0],
					},
				]);
			}

			// Show success message or redirect
			alert("Please check your email to confirm your account");
		} catch (err: any) {
			console.error("Error during email signup:", err);
			setError(err.message || "Failed to sign up. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleGoogleLogin = async () => {
		setLoading(true);
		setError(null);

		try {
			const { data, error } = await supabase.auth.signInWithOAuth({
				provider: "google",
				options: {
					redirectTo: `${window.location.origin}/auth/callback`,
				},
			});

			if (error) throw error;

			// The redirect happens automatically
		} catch (err: any) {
			console.error("Error during Google login:", err);
			setError(
				err.message || "Failed to sign in with Google. Please try again."
			);
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-2xl text-center">Authentication</CardTitle>
					<CardDescription className="text-center">
						Choose how you want to play the quiz
					</CardDescription>
				</CardHeader>
				<CardContent>
					{returningUserInfo.isReturning && (
						<Alert className="mb-4 bg-blue-50 border-blue-200">
							<AlertTriangle className="h-4 w-4 text-blue-600" />
							<AlertTitle>Welcome back!</AlertTitle>
							<AlertDescription>
								We detected that you've taken this quiz before. Your previous
								results are available.
							</AlertDescription>
							<Button
								className="w-full mt-2 bg-blue-600 hover:bg-blue-700"
								onClick={() => router.push("/results")}
							>
								View Your Results
							</Button>
						</Alert>
					)}

					{previouslyCompleted && !returningUserInfo.isReturning && (
						<Alert className="mb-4 bg-yellow-50 border-yellow-200">
							<AlertTriangle className="h-4 w-4 text-yellow-600" />
							<AlertTitle>Quiz already completed</AlertTitle>
							<AlertDescription>
								This device has already completed the quiz. Please sign in with
								an account to take it again.
							</AlertDescription>
						</Alert>
					)}

					<Tabs defaultValue="guest" className="w-full">
						<TabsList className="grid grid-cols-4 mb-4">
							<TabsTrigger value="guest">Guest</TabsTrigger>
							<TabsTrigger value="email">Email</TabsTrigger>
							<TabsTrigger value="google">Google</TabsTrigger>
							<TabsTrigger value="line" disabled>
								Line
							</TabsTrigger>
						</TabsList>

						<TabsContent value="guest" className="space-y-4">
							<div className="text-center space-y-4">
								<p>
									Play without creating an account. Your progress won't be saved
									between sessions.
								</p>
								<Button
									onClick={handleGuestLogin}
									className="w-full bg-blue-600 hover:bg-blue-700"
									disabled={loading || previouslyCompleted}
								>
									{loading ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Loading...
										</>
									) : (
										"Continue as Guest"
									)}
								</Button>
								{previouslyCompleted && (
									<p className="text-sm text-red-600">
										Guest mode is limited to one attempt per device.
									</p>
								)}
							</div>
						</TabsContent>

						<TabsContent value="email">
							<Tabs defaultValue="login">
								<TabsList className="grid grid-cols-2 mb-4">
									<TabsTrigger value="login">Login</TabsTrigger>
									<TabsTrigger value="signup">Sign Up</TabsTrigger>
								</TabsList>

								<TabsContent value="login" className="space-y-4">
									<form onSubmit={handleEmailLogin} className="space-y-4">
										<div className="space-y-2">
											<Label htmlFor="email">Email</Label>
											<Input
												id="email"
												type="email"
												value={email}
												onChange={(e) => setEmail(e.target.value)}
												required
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="password">Password</Label>
											<Input
												id="password"
												type="password"
												value={password}
												onChange={(e) => setPassword(e.target.value)}
												required
											/>
										</div>
										<Button
											type="submit"
											className="w-full bg-blue-600 hover:bg-blue-700"
											disabled={loading}
										>
											{loading ? (
												<>
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
													Logging in...
												</>
											) : (
												"Login"
											)}
										</Button>
									</form>
								</TabsContent>

								<TabsContent value="signup" className="space-y-4">
									<form onSubmit={handleEmailSignUp} className="space-y-4">
										<div className="space-y-2">
											<Label htmlFor="signup-email">Email</Label>
											<Input
												id="signup-email"
												type="email"
												value={email}
												onChange={(e) => setEmail(e.target.value)}
												required
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="signup-password">Password</Label>
											<Input
												id="signup-password"
												type="password"
												value={password}
												onChange={(e) => setPassword(e.target.value)}
												required
											/>
										</div>
										<Button
											type="submit"
											className="w-full bg-blue-600 hover:bg-blue-700"
											disabled={loading}
										>
											{loading ? (
												<>
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
													Signing up...
												</>
											) : (
												"Sign Up"
											)}
										</Button>
									</form>
								</TabsContent>
							</Tabs>
						</TabsContent>

						<TabsContent value="google" className="space-y-4">
							<div className="text-center space-y-4">
								<p>Sign in with your Google account to track your progress.</p>
								<Button
									onClick={handleGoogleLogin}
									className="w-full bg-blue-600 hover:bg-blue-700"
									disabled={loading}
								>
									{loading ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Connecting...
										</>
									) : (
										"Continue with Google"
									)}
								</Button>
							</div>
						</TabsContent>

						<TabsContent value="line" className="space-y-4">
							<div className="text-center space-y-4">
								<p>Sign in with your Line account to track your progress.</p>
								<Button disabled className="w-full">
									Continue with Line
								</Button>
								<p className="text-sm text-muted-foreground">
									Line authentication coming soon
								</p>
							</div>
						</TabsContent>
					</Tabs>

					{error && (
						<div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
							{error}
						</div>
					)}
				</CardContent>
				<CardFooter className="flex justify-center">
					<Button variant="outline" onClick={() => router.push("/")}>
						Back to Home
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
